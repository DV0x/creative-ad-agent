# DO State Machine — CampaignSession

> Part of [Architecture Documentation](../INDEX.md) | Visual state transitions for the Durable Object | **Source:** `cloudflare/src/durable-objects/campaign-session.ts`

---

## Overview

The CampaignSession DO is a state machine over ~15 instance variables plus 5 persisted storage keys. This doc maps every transition: trigger, changes, side effects.

Companion to [DURABLE_OBJECT.md](./DURABLE_OBJECT.md) — that doc has the *what*, this doc has the *when*.

---

## Instance state variables

```
┌────────────────────────────────────────────────────────────────────┐
│                   TRANSIENT (lost on DO reset)                     │
├────────────────────────────────────────────────────────────────────┤
│  isGenerating: boolean             Per-user lock — 1 gen max       │
│  campaignId: string | null         Current campaign in flight      │
│  sessionId: string | null          Current WS session              │
│  sandbox: any | null               Sandbox container reference     │
│  agentProcessId: string | null     Long-lived agent process ID    │
│  abortController: AC | null        Cancel signal for current gen  │
│  sandboxSetupInProgress: bool      Guards alarm mid-setup         │
│  eventBuffer: EventBuffer          Ring buffer (1000 events)      │
│  generationStartedAt: number       For 2h safety + 5min zombie    │
│  currentRequestId: string | null   Per-turn staleness guard       │
│  hasSourceResearch: boolean        True if research was copied    │
│  preGenImageCount: number          Baseline for billing delta     │
│  currentLogStream: ReadableStream  Active stream (for cancel)     │
│  userId: string ('anonymous')      From X-User-Id header          │
│  tailLogs: string[]                Deferred console output         │
├────────────────────────────────────────────────────────────────────┤
│                   PERSISTED (survives DO reset)                    │
├────────────────────────────────────────────────────────────────────┤
│  'userId'           → string       Set on fetch(), never cleared   │
│  'activeSession'    → {                                             │
│      sessionId, campaignId, userId, isGenerating,                  │
│      generationStartedAt, currentRequestId, hasSourceResearch      │
│    }                                                                │
│  'agentProcessId'   → string       Set when agent starts           │
│  'agentCampaignId'  → string       Which campaign owns agent       │
│  'maxImageIndex:{campaignId}' → number                             │
└────────────────────────────────────────────────────────────────────┘
```

---

## Master state machine

```
                              ┌──────────┐
                    ┌────────→│   IDLE   │←────────────────────────────┐
                    │         └────┬─────┘                              │
                    │              │                                    │
                    │    generate  │  follow_up                        │
                    │              ▼                                    │
                    │         ┌──────────┐                              │
                    │         │ SETTING  │   setupSandbox runs          │
                    │         │   UP     │   sandboxSetupInProgress=T  │
                    │         └────┬─────┘                              │
                    │              │                                    │
                    │              ▼                                    │
                    │    ┌──────────────────────┐                       │
                    │    │     GENERATING       │   sandbox running    │
                    │    │   streamForLiveUI    │   agent running      │
                    │    │   alarm every 10s    │   stream → WS        │
                    │    └─┬────┬────┬──────┬───┘                       │
                    │      │    │    │      │                           │
           ┌────────┘      │    │    │      └──────┐                   │
           │               │    │    │             │                   │
      ┌────▼────┐ ┌────────▼──┐ │ ┌──▼────────┐ ┌──▼────────┐        │
      │COMPLETE │ │CANCELLED  │ │ │INCOMPLETE │ │  ERROR    │        │
      │         │ │           │ │ │           │ │           │        │
      │ normal  │ │ user      │ │ │ 2h cap    │ │ setup     │        │
      │ finish  │ │ cancel    │ │ │ zombie    │ │ failed    │        │
      │ (L1/L2) │ │ abort     │ │ │ crash     │ │ fatal RPC │        │
      └─────────┘ └───────────┘ │ └────┬──────┘ └───────────┘        │
                                │      │                              │
                         ZOMBIE │  /recover (D1 has data)              │
                         STATE  │      │                              │
                    (isGen=T,   │      ▼                              │
                     sandbox=Ø, │ ┌──────────┐                        │
                     age>5min)  │ │'complete'│                        │
                                │ └──────────┘                        │
                                │                                     │
                                └─────────────────────────────────────┘
```

**Zombie** is a substate of GENERATING — same D1 status (`'generating'`), detected by the absence of runtime backing (no sandbox, no agent). Three detection sites (see [DURABLE_OBJECT.md → Zombie detection](./DURABLE_OBJECT.md#zombie-detection--three-places)).

---

## `isGenerating` transitions

Core lock. Prevents concurrent generations per user.

```
false ────────────────────────────────────────────────────→ true
  Triggers:
    • handleGenerate()      — new campaign
    • handleFollowUp()      — fast or slow path

true ─────────────────────────────────────────────────────→ false
  Triggers:
    • finalizeGeneration    — normal completion (Layer 1 or 2)
    • alarm safetyNet       — 2h timeout
    • alarm zombie.detected — 5 min without agent
    • alarm agent.dead_no_result — crash detection
    • alarm sandbox.fatal   — RPC connection lost
    • runGeneration finally (cancelled branch)
    • runFollowUpFast finally (cancelled branch)
    • handleGenerate / handleFollowUp zombieReset (no sandbox)
    • restoreSession() zombie detection (storage says generating, but sandbox null)
    • handleSubscribe zombieRecovery
```

---

## `sandbox` lifecycle

```
null ──→ getSandbox(id, { sleepAfter: '2h', normalizeId: true })
           │
           ├── Container warm + awake? → Reuse
           │     1. cleanupCompletedProcesses
           │     2. pkill -f agent-runner (releases FUSE file handles)
           │     3. unmountBucket + full FUSE reset (pkill s3fs; umount -l; ...)
           │     4. remount
           │     5. pre-flight IP check
           │
           └── Container cold/new? → Create (~2.5 min)
                 Same steps, plus Docker image init
           │
           ▼
     this.sandbox = <ref>, sandboxSetupInProgress = false
           │
           ├── On DO reset → this.sandbox = null
           │                 alarm reconnects (if !sandboxSetupInProgress)
           │
           ├── On cancel → killProcess(agent) + unmountBucket('/mnt/r2')
           │               sandbox ref kept alive (container lives on)
           │
           ├── On fatal RPC error ("object to be reset" / "Network connection lost")
           │   → sandbox = null, isGenerating = false, friendly error
           │
           └── On completion → sandbox kept alive
                               agent stays running, blocks on /app/next-prompt.json
                               container sleepAfter=2h
```

**Never destroyed on normal completion.** Keep-warm enables 30-60s follow-ups instead of 3 min cold starts.

---

## `agentProcessId` lifecycle

```
null ──→ startProcess('node /app/dist/agent-runner.js', { env, cwd })
           │
           ▼
     agentProcessId = proc.id
     storage.put('agentProcessId', ...)
     storage.put('agentCampaignId', campaignId)
           │
           ├── Fast follow-up (same campaign, alive)
           │   → REUSED. Write /app/next-prompt.json, agent picks it up.
           │
           ├── Slow follow-up (dead OR different campaign)
           │   → KILLED via pkill in setupSandbox. storage cleared.
           │   → New agent, new process ID.
           │
           ├── Cancel
           │   → killProcess(agentProcessId) in finally block.
           │   → agentProcessId = null, storage cleared.
           │
           ├── Crash (OOM, throw, etc.)
           │   → Detected by alarm listProcesses (dead).
           │   → If turn-result.json present → finalize, else mark incomplete.
           │
           └── Fatal RPC
               → sandbox = null path, storage for agentProcessId + agentCampaignId cleared.
```

---

## `currentRequestId` transitions

Per-turn identifier for staleness check in `tryFinalize`.

```
null                      (default on new campaign)
   │
   ▼
'req_${Date.now()}'       (set by runFollowUpFast for each follow-up turn)
   │
   ▼
Written to /app/next-prompt.json → agent echoes back in {type:'turn_start', requestId}
   │
   ▼
Written to /app/turn-result.json.requestId at end of turn
   │
   ▼
tryFinalize validates result.requestId === this.currentRequestId (skip if stale)
   │
   ▼
After finalize: currentRequestId reset to null at start of next handleGenerate / handleFollowUp
```

Initial generations (`handleGenerate`) do NOT set `currentRequestId` — the first turn-result.json has `requestId: turn_${Date.now()}` from the agent side, and `currentRequestId: null` on DO side means the check passes (see `tryFinalize` at `campaign-session.ts:317`).

---

## `hasSourceResearch` transitions

Signals that research was copied from a source campaign ("New from Existing" feature).

```
false                                      (default)
   │
   ▼
true   (handleGenerate with sourceCampaignId — after successful copy)
   │
   ▼
Used in:
  - setupSandbox: hydrate research file from D1 even without sdkSessionId
  - handleGenerate prompt building: append system note "research already done, skip research agent"
  - Slow-path follow-up: include hydration context in prompt
   │
   ▼
false  (reset at start of next handleGenerate, OR on DO reset if not in storage)
```

Persisted in `activeSession` so it survives DO eviction mid-generation.

---

## `sandboxSetupInProgress` guard

```
false ──→ true    at start of setupSandbox()
true  ──→ false   at end of setupSandbox() (success OR error)
                  also in runGeneration finally (safety net)

Guards:
  alarm sandbox reconnect:  if (!sandbox && !setupInProgress)
  alarm zombie detection:   if (!agentProcessId && !setupInProgress)
```

Without this, the alarm would race `setupSandbox` — both call `getSandbox()`, the second cancels the first's in-flight RPCs, setup hangs forever.

---

## `currentLogStream` lifecycle

Reference to the active `streamProcessLogs` stream. Enables cancellation without waiting for the next SSE frame.

```
null ──→ sandbox.streamProcessLogs(agentProcessId)  (runGeneration / runFollowUpFast)
           │
           ▼
     this.currentLogStream = stream
           │
           ├── handleCancel called
           │   → abort() sets signal (streamForLiveUI checks per iteration)
           │   → currentLogStream.cancel() ← unblocks for-await immediately
           │
           └── streamForLiveUI returns (normal or cancelled)
               → runGeneration / runFollowUpFast finally: currentLogStream = null
```

Without `.cancel()`, a cancelled user would wait up to the next SSE frame arrival (could be seconds) before `streamForLiveUI` noticed the abort signal.

---

## D1 campaign status transitions

```
               createCampaign()
                      │
                      ▼
              ┌──────────────┐
              │ 'generating' │
              └──┬──┬──┬──┬──┘
                 │  │  │  │
                 │  │  │  └──────────────────────────────────┐
                 │  │  │                                      │
                 │  │  └────────────────────┐                 │
                 │  │                       │                 │
                 │  └───────────┐           │                 │
                 ▼              ▼           ▼                 ▼
          ┌──────────┐  ┌───────────┐  ┌─────────────┐  ┌──────────┐
          │ complete │  │ cancelled │  │ incomplete  │  │  error   │
          └──────────┘  └───────────┘  └──────┬──────┘  └──────────┘
                                              │
                                         /recover
                                              │
                                              ▼
                                       ┌──────────┐
                                       │ complete │
                                       └──────────┘
```

### Triggers per transition

| From → To | Trigger | Where |
|---|---|---|
| → generating | `createCampaign()` | `handleGenerate` (line 768) |
| → generating | slow follow-up restart | `handleFollowUp` → `updateCampaignStatus('generating')` (line 951) |
| generating → complete | `finalizeGeneration` (any layer) | `campaign-session.ts:421` |
| generating → cancelled | Cancel signal → gen finally | `runGeneration:1682`, `runFollowUpFast:1585,1600` |
| generating → incomplete | 2h safety net | alarm `:149` |
| generating → incomplete | Zombie (alarm, 5 min) | alarm `:178` |
| generating → incomplete | Agent dead, no result | alarm `:214` |
| generating → incomplete | Fatal sandbox RPC | alarm `:231` |
| generating → incomplete | Zombie on subscribe | `handleSubscribe:1143` |
| generating → incomplete | Zombie pre-generate | `handleGenerate:725`, `handleFollowUp:879` |
| generating → incomplete | Zombie in restoreSession | `restoreSession:592` |
| generating → error | Fatal setup error (no agent) | `runGeneration:1693` |
| generating → error | Follow-up setup error | `handleFollowUp:987` |
| generating → error | `runFollowUpFast` fatal | `runFollowUpFast:1611` |
| incomplete/error → complete | `/recover` with D1 data | `routes/recovery.ts:62` |

**Terminal states:** `complete`, `cancelled`, `error`. No backwards transitions except `incomplete → complete` via `/recover`.

---

## Event flow: generate → complete (happy path, warm)

```
Time  │  Event                            │  State Changes
──────┼───────────────────────────────────┼──────────────────────────────────
  0s  │  Client 'generate'                │  isGenerating=true, generationStartedAt=now
      │                                   │  currentRequestId=null
      │                                   │  creditCheck → ok
      │                                   │  campaignId='camp_123', sessionId='sess_456'
      │                                   │  abortController=new AC()
      │                                   │  D1: createCampaign → status='generating'
      │                                   │  persistSession, startKeepAlive (+10s)
      │                                   │
      │  ← 'ack' + 'phase:parse'          │  emitEvent × 2
      │                                   │
   1s │  setupSandbox begins              │  sandboxSetupInProgress=true
      │  getSandbox (warm)                │  sandbox=<ref>
      │  pkill agent + FUSE reset         │
      │  mountBucket                      │
      │  pre-flight IP check              │
      │  startProcess('agent-runner.js')  │  agentProcessId=proc.id
      │                                   │  storage.put: agentProcessId, agentCampaignId
      │                                   │  sandboxSetupInProgress=false
      │                                   │
  3s  │  streamProcessLogs → stream       │  currentLogStream=stream
      │  streamForLiveUI begins           │
      │  Agent prints turn_start          │  (not fired here — initial gen)
      │                                   │
  5s  │  Agent runs SDK query             │
      │  text_start / delta / end         │  sendWS (ephemeral, broadcast)
      │  tool_use_event (Task → research) │  emitEvent (buffered)
      │  tool_end                         │  emitEvent
      │  file: research                   │  emitEvent + db.updateCampaignFile
      │  tool_use_event (Skill → hooks)   │  emitEvent
      │  file: hooks                      │  emitEvent
      │  tool_use_event (Skill → art)     │  emitEvent
      │  file: prompts                    │  emitEvent
      │  tool_use_event (nano-banana)     │  emitEvent phase: images
      │  image × 6                        │  emitEvent × 6 + db.addCampaignImage × 6
      │                                   │
 4min │  Agent writes turn-result.json    │
      │  Agent prints turn_complete       │  stream loop: turnDone=true, break
      │  tryFinalize (inline, Layer 2)    │
      │    - reconcileImages (dedup)      │  D1: no new (already inserted live)
      │    - reconcileFiles               │  D1: campaign_files rows updated
      │    - addMessage (assistant)       │  D1: messages row
      │    - emit 'complete' (imageCount) │  WS → client
      │    - updateCampaignStatus         │  D1: status='complete'
      │    - storage.put maxImageIndex    │
      │    - recordUsage (credits)        │  D1: usage_log + user_credits
      │    - emit 'credits_update'        │  WS → client (sendWS)
      │    - rm /app/turn-result.json     │
      │    - isGenerating=false           │
      │    - persistSession               │
      │                                   │
      │  Next alarm: isGenerating=false   │  no reschedule, alarm self-terminates
      │                                   │
      │  Sandbox keeps running            │  (sleepAfter: 2h)
      │  Agent blocks on next-prompt.json │
```

---

## Event flow: follow-up fast path

```
Time  │  Event                            │  State Changes
──────┼───────────────────────────────────┼──────────────────────────────────
  0s  │  Client 'follow_up'               │  isGenerating=true, currentRequestId=null
      │  creditCheck → ok                 │
      │  eventBuffer.clear                │
      │  addMessage user, status=generating│
      │                                   │
   1s │  isAgentProcessAlive?             │  listProcesses + agent-status.json
      │  agentCampaignId === campaignId?  │  storage.get
      │  → YES, YES → FAST PATH           │
      │                                   │
      │  runFollowUpFast                  │
      │  requestId='req_1710…'            │  currentRequestId=requestId
      │  persistSession                   │
      │  streamProcessLogs → stream       │  currentLogStream=stream
      │  writeFile next-prompt.json       │
      │                                   │
   2s │  Agent picks up prompt            │
      │  Agent prints turn_start:req_…    │  stream loop flips skipping=false
      │  Agent streams events             │  (same as initial gen)
      │                                   │
 30s  │  turn_complete                    │  turnDone=true, break
      │  tryFinalize → validate campaign  │
      │    + requestId match              │
      │    → finalizeGeneration           │  (same as initial gen)
      │                                   │
```

---

## Event flow: cancel

```
Time  │  Event                            │  State Changes
──────┼───────────────────────────────────┼──────────────────────────────────
      │  (generation in progress)         │  isGenerating=true
      │                                   │
  0s  │  Client 'cancel'                  │
      │  handleCancel:                    │
      │    abortController.abort()        │  signal set
      │    currentLogStream.cancel()      │  SSE stream aborts
      │    sendWS 'ack: Cancel requested' │
      │                                   │
      │  streamForLiveUI:                 │
      │    next frame: signal.aborted=T   │  returns true (cancelled)
      │                                   │
      │  runGeneration/Fast finally:      │
      │    wasCancelled → true branch     │
      │    recordCancelledUsage           │  D1: usage_log + deduct
      │    emit credits_update            │  WS → client
      │    updateCampaignStatus           │  D1: status='cancelled'
      │    addMessage("scrapped that")    │  D1: messages row
      │    killProcess(agentProcessId)    │  agent gone
      │    storage.delete agentProcessId  │
      │    storage.delete agentCampaignId │
      │    unmountBucket '/mnt/r2'        │
      │    clearPersistedSession          │  activeSession removed
      │    isGenerating=false             │
      │                                   │
      │  Alarm: isGenerating=false        │  self-terminates
```

---

## Event flow: DO reset during generation

```
Time  │  Event                            │  State Changes
──────┼───────────────────────────────────┼──────────────────────────────────
      │  (generation in progress)         │  isGenerating=true in-memory
      │                                   │  activeSession persisted
      │                                   │
  0s  │  Code deploy / eviction           │
      │                                   │  ALL transient state → null/defaults
      │                                   │  Container still running with agent
      │                                   │
 10s  │  Client 'subscribe'               │
      │  eventBuffer.hasEvents() = false  │  → restoreSession
      │    storage.get userId             │
      │    storage.get activeSession      │  isGenerating=true restored
      │    storage.get agentProcessId     │
      │                                   │
      │  D1 staleness check:              │
      │    campaign.status='generating'?  │  YES
      │    sandbox = null?                │  YES → ZOMBIE
      │                                   │
      │  Zombie path:                     │
      │    updateCampaignStatus→incomplete│  D1 updated
      │    isGenerating=false             │
      │    clearPersistedSession          │
      │    sendToWS: friendly error       │  "Reconnected! Looks like things got interrupted"
      │                                   │
      │  Client sees error, re-submits    │
```

**Alternative path** (sandbox *was* restored by a prior alarm tick): if `this.sandbox` exists when subscribe fires, we `startKeepAlive` to resume monitoring, replay events, and the alarm's `listProcesses` + `tryFinalize` cycle handles completion.

---

## Event flow: zombie detection (alarm path)

```
Time  │  Event                            │  State Changes
──────┼───────────────────────────────────┼──────────────────────────────────
  0s  │  handleGenerate fires             │  isGenerating=true
      │  setupSandbox begins              │  sandboxSetupInProgress=true
      │                                   │
  30s │  startProcess silently times out  │  timedRPC throws after 60s
      │  runGeneration catch              │
      │    setup error → 'error' event    │  emit + updateCampaignStatus('error')
      │    isGenerating=false             │
      │  finally: sandboxSetupInProgress=false
      │                                   │
      │  (Case above is happy — reset)    │
      │                                   │
      │  PATHOLOGICAL CASE:               │
      │  If finally block also silently   │
      │  hangs or throws without clearing │
      │  isGenerating, zombie develops:   │
      │                                   │
      │  isGenerating=true                │
      │  agentProcessId=null              │
      │  sandboxSetupInProgress=false     │
      │                                   │
 5m0s │  Alarm tick (iter 30)             │
      │    age = 300s > ZOMBIE_THRESHOLD  │
      │    zombie.detected                │
      │    emit friendly error            │  "Hmm something didn't start right — …"
      │    updateCampaignStatus→incomplete│
      │    isGenerating=false             │
      │    return (no reschedule)         │
```

---

## Race conditions & guards

| Race | Guard | How it works |
|---|---|---|
| Two `getSandbox()` cancel each other's RPCs | `sandboxSetupInProgress` | Alarm skips reconnect + zombie check while setup running |
| Stale `turn-result.json` across campaigns | `result.campaignId` check | `tryFinalize` returns false on mismatch |
| Stale `turn-result.json` across turns | `result.requestId` check | `tryFinalize` compares to `currentRequestId` |
| Fast-path to wrong campaign's agent | `agentCampaignId` in storage | Pre-path check in handleFollowUp |
| `isGenerating=true` stuck after deploy | `restoreSession` zombie detect | D1 staleness + sandbox null check, resets on restore |
| `isGenerating=true` stuck for new request | pre-generate zombie reset | handleGenerate / handleFollowUp auto-reset if no sandbox |
| Cancel kills wrong agent | abort-signal-only cancel | `handleCancel` just sets signal; gen function owns cleanup |
| Multiple completion layers race | `isGenerating` check in finalize | First layer sets false; others return early |
| `streamProcessLogs` replays history on follow-up | `skipUntilRequestId` + 120s timeout | Stream discards everything until matching `turn_start` |
| Image index collision across turns | `max(storedMaxIndex, dbMax) + 1` | `createStreamingContext` seeds counter from both sources |
| SDK double-yields assembled messages | `seenUuids: Set<string>` | Per-stream dedup by `msg.uuid` |
| FUSE mount pinned by agent file handles | `pkill -f agent-runner` before unmount | Releases handles under `/mnt/r2` |
| Stale FUSE mount tracking after hibernation | `umount -l` (lazy) in cleanFuse | Session 53 fix — detach mountpoint even if busy |
| Double-charge on crash recovery | `rm /app/turn-result.json` after finalize | + `INSERT OR IGNORE` on `usage_log(campaign_id, request_id)` |

---

## See Also

- [Durable Object](./DURABLE_OBJECT.md) — full handler implementation + helpers
- [Streaming Pipeline](./STREAMING_PIPELINE.md) — the `streamForLiveUI` substate
- [Sandbox Container](./SANDBOX_CONTAINER.md) — `agent-runner.js` lifecycle
- [Error Propagation](../shared/ERROR_PROPAGATION.md) — friendly error copy, which state produces what message
- [Billing](../shared/BILLING.md) — `recordUsage`, `recordCancelledUsage`, `credits_update` event
