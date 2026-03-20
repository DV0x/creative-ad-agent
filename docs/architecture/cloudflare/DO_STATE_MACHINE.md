# DO State Machine — CampaignSession

> Part of [Architecture Documentation](../INDEX.md) | Visual state transitions for the Durable Object

---

## Overview

The CampaignSession DO manages 7 critical instance variables. This doc maps every state transition — what triggers it, what changes, and what side effects happen.

---

## Instance State Variables

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TRANSIENT (lost on DO reset)                      │
├─────────────────────────────────────────────────────────────────────┤
│  isGenerating: boolean          Per-user lock (one gen at a time)   │
│  campaignId: string | null      Current campaign being generated    │
│  sessionId: string | null       Current WebSocket session           │
│  sandbox: any | null            Sandbox container reference         │
│  agentProcessId: string | null  Long-running agent process ID      │
│  abortController: AC | null     Cancel signal for current gen      │
│  sandboxSetupInProgress: bool   Guard against concurrent setup     │
│  eventBuffer: EventBuffer       Ring buffer for WS event replay    │
│  generationStartedAt: number    Timestamp for 2h safety net        │
│  currentRequestId: string|null  Per-turn ID for staleness check    │
├─────────────────────────────────────────────────────────────────────┤
│                    PERSISTED (survives DO reset)                     │
├─────────────────────────────────────────────────────────────────────┤
│  'userId'           → string    Set on fetch(), never cleared       │
│  'activeSession'    → {         Set on generate/follow-up           │
│    sessionId,                     Cleared on completion/error       │
│    campaignId,                                                      │
│    userId,                                                          │
│    isGenerating,                                                    │
│    generationStartedAt,                                             │
│    currentRequestId                                                 │
│  }                                                                  │
│  'agentProcessId'   → string    Set when agent starts               │
│  'agentCampaignId'  → string    Which campaign owns the agent       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Master State Machine

```
                              ┌──────────┐
                    ┌────────→│   IDLE   │←────────────────────────────┐
                    │         │          │                              │
                    │         └────┬─────┘                              │
                    │              │                                    │
                    │    generate  │  follow_up                        │
                    │              │                                    │
                    │         ┌────▼─────┐                              │
                    │         │ SETTING  │                              │
                    │         │   UP     │                              │
                    │         └────┬─────┘                              │
                    │              │                                    │
                    │         ┌────▼──────────────┐                     │
                    │         │    GENERATING     │                     │
                    │         │                   │                     │
                    │         │  sandbox active   │                     │
                    │         │  agent running    │                     │
                    │         │  alarm every 10s  │                     │
                    │         │  stream → WS      │                     │
                    │         └──┬──┬──┬──┬───────┘                     │
                    │            │  │  │  │                             │
           ┌───────┘   ┌────────┘  │  │  └────────┐                    │
           │           │           │  │           │                    │
      ┌────▼────┐ ┌────▼────┐ ┌───▼──▼──┐  ┌─────▼─────┐             │
      │COMPLETE │ │CANCELLED│ │INCOMPLETE│  │  ERROR    │             │
      │         │ │         │ │         │  │           │             │
      │ normal  │ │ user    │ │ timeout │  │ setup    │             │
      │ finish  │ │ cancel  │ │ zombie  │  │ failed   │             │
      │         │ │         │ │ crash   │  │ fatal    │             │
      └─────────┘ └─────────┘ └────┬────┘  └──────────┘             │
                                   │                                 │
                              /recover                               │
                              or resume                              │
                                   │                                 │
                                   └─────────────────────────────────┘
```

---

## `isGenerating` Transitions

The core lock — prevents concurrent generations for the same user.

```
false ─────────────────────────────────────────────────────→ true
  Triggers:
    • handleGenerate()     — new campaign starts
    • handleFollowUp()     — follow-up starts (fast or slow path)

true ──────────────────────────────────────────────────────→ false
  Triggers:
    • finalizeGeneration()       — normal completion (any detection layer)
    • Alarm: 2h safety net       — generation too old
    • Alarm: zombie detection    — no agent after 5 min
    • Alarm: crash detection     — agent dead, no turn-result
    • Cancel: finally block      — user cancelled, cleanup done
    • Error: setup failed        — fatal error before agent started
    • restoreSession() stale     — D1 says campaign not 'generating'
```

---

## `sandbox` Lifecycle

```
null ──→ getSandbox(id, { sleepAfter: '2h' })
           │
           ├── Container exists + awake? → Reuse (warm)
           │     1. Kill stale agent-runner
           │     2. Clean FUSE mount (unmount → remount)
           │
           └── Container sleeping/new? → Create (cold, ~2.5 min)
                 1. Docker image pull + init
                 2. R2 FUSE mount
                 3. Pre-flight IP check
                      ├── 200 OK → proceed
                      └── 403 → destroy, retry new ID (max 3)
           │
           ▼
     sandbox reference stored in this.sandbox
           │
           ├── On DO reset → this.sandbox = null
           │                  Alarm reconnects via getSandbox()
           │
           ├── On cancel → agent killed, R2 unmounted
           │               sandbox kept alive (sleepAfter: 2h)
           │
           └── On completion → sandbox kept alive for fast follow-ups
                               Agent stays running, polls for next prompt
```

**Never destroyed on normal completion** — warm container enables 30-60s follow-ups vs 3 min cold start.

---

## `agentProcessId` Lifecycle

```
null ──→ startProcess('node', ['agent-runner.js'], { env })
           │
           ▼
     agentProcessId = process.id
     Persisted to storage (survives DO reset)
           │
           ├── On fast follow-up → REUSED (agent alive, same campaign)
           │                        Write /app/next-prompt.json
           │
           ├── On slow follow-up → KILLED (wrong campaign or dead)
           │                        New agent started, new ID
           │
           ├── On cancel → KILLED (pkill in finally block)
           │               agentProcessId = null
           │
           └── On crash → Detected by alarm (listProcesses)
                          agentProcessId cleared
```

---

## `abortController` Lifecycle

```
null ──→ new AbortController()
           Created at start of handleGenerate() / handleFollowUp()
           │
           ▼
     Signal checked at 3 points:
           │
           ├── Before startProcess() → skip agent startup entirely
           ├── During streaming → break loop, set wasCancelled=true
           └── In finally block → kill agent, unmount R2, update D1
           │
           ▼
     handleCancel() calls abortController.abort()
           │
     NOTE: handleCancel ONLY sets the signal.
           It does NOT kill processes or update D1.
           The generation function's finally block handles cleanup.
```

---

## `sandboxSetupInProgress` Guard

Prevents the alarm from calling `getSandbox()` while `setupSandbox()` is running — two connections cancel each other's RPCs.

```
false ──→ true    at start of setupSandbox()
true  ──→ false   at end of setupSandbox() (success or error)
                  also in runGeneration() finally block (safety net)

Alarm checks:
  if (sandboxSetupInProgress) → skip sandbox reconnect
  if (sandboxSetupInProgress) → skip zombie detection
```

---

## D1 Campaign Status Transitions

```
         createCampaign()
              │
              ▼
       ┌──────────────┐
       │  'generating' │
       └──┬──┬──┬──┬──┘
          │  │  │  │
          │  │  │  └──────────────────────────────────────┐
          │  │  │                                          │
          │  │  └────────────────────────┐                 │
          │  │                           │                 │
          │  └──────────┐                │                 │
          │             │                │                 │
          ▼             ▼                ▼                 ▼
   ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────┐
   │'complete' │  │'cancelled'│  │'incomplete'  │  │ 'error'  │
   └──────────┘  └───────────┘  └──────┬───────┘  └──────────┘
                                       │
                                  /recover
                                  (D1 has data)
                                       │
                                       ▼
                                ┌──────────┐
                                │'complete' │
                                └──────────┘
```

### Triggers for Each Transition

| From → To | Trigger | Where |
|---|---|---|
| → generating | `createCampaign()` | handleGenerate |
| → generating | Follow-up restart (cold path) | handleFollowUp → runGeneration |
| generating → complete | `finalizeGeneration()` — any detection layer | waitForLog, alarm, tryFinalize |
| generating → cancelled | Cancel abort signal → finally block | runGeneration, runFollowUpFast |
| generating → incomplete | 2h safety net timeout | alarm handler |
| generating → incomplete | Zombie: no agent for 5+ min | alarm handler |
| generating → incomplete | Agent crash, no turn-result | alarm crash detection |
| generating → error | Fatal setup error (no agent started) | runGeneration catch block |
| generating → error | Alarm detects dead agent, no output | alarm handler |
| incomplete → complete | `/recover` endpoint (D1 has images/files) | routes/recovery.ts |

**No backwards transitions**: `complete`, `cancelled`, `error` are terminal states.

---

## Event Flow: Generate → Complete (Happy Path)

```
Time  │  Event                    │  State Changes
──────┼──────────────────────────┼─────────────────────────────────────
  0s  │  Client sends 'generate'  │
      │                           │  isGenerating = true
      │                           │  campaignId = 'camp_123'
      │                           │  sessionId = 'sess_456'
      │                           │  abortController = new AC()
      │                           │  D1: status='generating'
      │                           │  persistSession()
      │                           │  startKeepAlive() → alarm in 10s
      │                           │
      │  → ACK event to client    │
      │                           │
 10s  │  setupSandbox() begins    │  sandboxSetupInProgress = true
      │  getSandbox()             │  sandbox = <container ref>
      │  mountBucket('/mnt/r2')   │
      │  preflight IP check       │
      │  startProcess()           │  agentProcessId = 'proc_789'
      │                           │  sandboxSetupInProgress = false
      │                           │  persistSession()
      │                           │
      │  Attach: waitForLog       │
      │  Attach: waitForExit      │
      │  Attach: streamLogs       │
      │                           │
 15s  │  Agent starts SDK query   │
      │  ← phase events stream    │  (WS events emitted to client)
      │  ← tool events stream     │
      │  ← file events stream     │
      │  ← image events stream    │
      │                           │
300s  │  Agent prints             │
      │  'turn_complete'          │
      │                           │
      │  waitForLog resolves      │
      │  → read turn-result.json  │
      │  → reconcileImages()      │  D1: campaign_images inserted
      │  → reconcileFiles()       │  D1: campaign_files updated
      │  → addMessage()           │  D1: assistant message saved
      │  → emitEvent('complete')  │  WS: complete event to client
      │                           │  D1: status='complete'
      │                           │  isGenerating = false
      │                           │  clearPersistedSession()
      │                           │
      │  Next alarm: sees         │
      │  isGenerating=false       │
      │  → does NOT reschedule    │  Alarm self-terminates
      │                           │
      │  sandbox stays alive      │  (sleepAfter: 2h for follow-ups)
      │  agent polls for          │
      │  next-prompt.json         │
```

---

## Event Flow: Follow-Up Fast Path

```
Time  │  Event                    │  State Changes
──────┼──────────────────────────┼─────────────────────────────────────
  0s  │  Client sends 'follow_up' │
      │                           │  isGenerating = true
      │                           │  currentRequestId = 'req_xxx'
      │                           │  abortController = new AC()
      │                           │  startKeepAlive()
      │                           │
      │  isAgentProcessAlive()?   │  Check listProcesses + status file
      │  agentCampaignId match?   │  Check storage matches campaignId
      │  → YES: fast path         │
      │                           │
  1s  │  Write next-prompt.json   │  Agent picks up within 500ms
      │  Attach stream handler    │  (skipUntilRequestId = 'req_xxx')
      │                           │
 30s  │  Agent completes turn     │
      │  waitForLog resolves      │
      │  → finalizeGeneration()   │  Same as initial gen
      │                           │  isGenerating = false
```

---

## Event Flow: Cancel

```
Time  │  Event                    │  State Changes
──────┼──────────────────────────┼─────────────────────────────────────
      │  (generation in progress) │  isGenerating = true
      │                           │
  0s  │  Client sends 'cancel'    │
      │                           │
      │  handleCancel():          │
      │    abortController.abort()│  Signal set (ONLY action)
      │    → send status ACK      │
      │                           │
      │  runGeneration finally:   │  Detects abort signal
      │    kill agent process     │  agentProcessId = null
      │    unmountBucket          │
      │    D1: status='cancelled' │
      │    save cancel message    │
      │    isGenerating = false   │
      │    clearPersistedSession()│
      │                           │
      │  waitForExit fires:       │  Sees isGenerating=false → return
      │  (safe, no double-update) │
```

---

## Event Flow: DO Reset During Generation

```
Time  │  Event                    │  State Changes
──────┼──────────────────────────┼─────────────────────────────────────
      │  (generation in progress) │  isGenerating = true (in-memory)
      │                           │  activeSession persisted to storage
      │                           │
  0s  │  Code deploy / DO evict   │
      │                           │  ALL in-memory state cleared:
      │                           │    isGenerating = false
      │                           │    sandbox = null
      │                           │    eventBuffer = empty
      │                           │    etc.
      │                           │
      │  Container keeps running  │  Agent alive, unaware of DO reset
      │                           │
 10s  │  Client sends 'subscribe' │
      │                           │
      │  handleSubscribe():       │
      │    eventBuffer empty      │  → trigger restoreSession()
      │    restore from storage:  │
      │      userId               │
      │      activeSession        │
      │      agentProcessId       │
      │                           │
      │    Staleness check:       │
      │      D1 campaign status   │
      │      still 'generating'?  │
      │      ├── YES → restore    │  isGenerating = true
      │      │   isGenerating     │  Restart alarm
      │      │   Reconnect sandbox│
      │      │   Re-attach stream │
      │      └── NO  → clear      │  Session was stale, reset
      │                           │
      │  Alarm resumes polling    │  Detects turn-result.json
      │  → finalizeGeneration()   │  Normal completion
```

---

## Race Conditions & Guards

| Race | Guard | How It Works |
|---|---|---|
| Two `getSandbox()` cancel RPCs | `sandboxSetupInProgress` | Alarm skips sandbox reconnect while setup running |
| Stale `turn-result.json` from previous campaign | `result.campaignId` check | `tryFinalize()` validates campaignId matches current |
| Fast-path to wrong campaign's agent | `agentCampaignId` in storage | Compared against requested campaignId before fast path |
| `isGenerating=true` stuck after deploy | D1 staleness check | `restoreSession()` verifies D1 status before restoring flag |
| Cancel kills wrong agent | Abort signal only | `handleCancel()` sets signal, generation function handles own cleanup |
| Multiple detection layers complete same gen | `isGenerating` check | First layer to run sets `isGenerating=false`, others return early |

---

## See Also

- [Durable Object](./DURABLE_OBJECT.md) — Full DO implementation details
- [Error Propagation](../shared/ERROR_PROPAGATION.md) — How errors flow to the user
- [Generation Flow](../GENERATION_FLOW.md) — End-to-end generation with ASCII diagrams
- [Sandbox Container](./SANDBOX_CONTAINER.md) — Agent-runner lifecycle
