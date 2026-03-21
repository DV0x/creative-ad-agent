# Durable Object — CampaignSession

> Part of [Architecture Documentation](../INDEX.md) | **File:** `cloudflare/src/durable-objects/campaign-session.ts` (~1581 lines)

This is the heart of the production system. One DO per user, handles everything: WebSocket connections, generation orchestration, sandbox management, completion detection, and recovery.

---

## Instance State

### Transient (lost on DO reset/eviction)

```typescript
userId: string                    // From X-User-Id header
sessionId: string | null          // Current WS session
campaignId: string | null         // Current campaign being generated
isGenerating: boolean             // Guard against concurrent generation
abortController: AbortController  // For cancel
sandbox: any                      // Sandbox container reference
agentProcessId: string | null     // Long-running agent process ID
eventBuffer: EventBuffer          // Ring buffer for event replay
tailLogs: string[]                // Log buffer (flushed by alarm)
generationStartedAt: number       // For max-age safety net
sandboxSetupInProgress: boolean   // Guard against concurrent getSandbox()
currentRequestId: string | null   // Per-turn ID for staleness check
hasSourceResearch: boolean        // True when research was copied from a source campaign
```

**No `ws` field** — uses `this.state.getWebSockets()` to broadcast to ALL connected tabs. No single-socket tracking needed.

### Persisted (survives DO reset via `this.state.storage`)

```typescript
'activeSession' → { sessionId, campaignId, userId, isGenerating, generationStartedAt }
'userId' → string                   // Persisted immediately on fetch()
'agentProcessId' → string           // Persisted when agent starts
'agentCampaignId' → string          // Which campaign the running agent belongs to
```

---

## Lifecycle

### WebSocket Connection

```
fetch(request)
  │
  ├── Extract userId from X-User-Id header
  ├── Persist userId to storage (survives hibernation)
  ├── Restore session from storage (if DO was reset)
  ├── Create WebSocketPair, accept with Hibernation API
  └── Send initial ack to THIS connection only (sendToWS)
```

### Message Dispatch

```
webSocketMessage(ws, data)
  │
  ├── Restore session (if needed)
  ├── Parse JSON message (errors sent to specific ws via sendToWS)
  └── Switch on message.type:
      ├── 'generate'   → handleGenerate()
      ├── 'follow_up'  → handleFollowUp()
      ├── 'cancel'     → handleCancel()
      ├── 'subscribe'  → handleSubscribe()
      └── 'ping'       → handlePing()
```

### WebSocket Close

Does NOT abort generation. No cleanup needed — `getWebSockets()` automatically excludes closed connections. Generation continues in background — events buffered for reconnect.

---

## Generation Flow

### `handleGenerate(prompt, sessionId, assetFileIds?, sourceCampaignId?)`

```
1. Guard: if isGenerating → error
2. Set isGenerating=true, create AbortController
3. Create/get campaign in D1 (fix stale user_id if needed)
4. If sourceCampaignId:
   a. Verify ownership: getCampaignById(sourceCampaignId, userId)
   b. Copy research from source's campaign_files to new campaign's campaign_files
   c. Emit 'file' event (research content visible immediately in client)
   d. Append system note to prompt: "read research → hook skill → art skill → images"
   e. Set hasSourceResearch = true
   f. Prefix campaign name: "{sourceName} — {brief}"
5. Save user message to D1
6. Persist session to storage
7. Emit ACK + initial phase events
8. Resolve asset URLs (if assetFileIds provided)
9. Start alarm heartbeat (30s)
10. Fire-and-forget: runGeneration(prompt, sessionId)
    └── Returns immediately so DO can handle pings/subscribes
```

### `runGeneration(prompt, sessionId, sdkSessionId?)`

```
1. Create sandbox container: user-{userId}-v2
   - sleepAfter: '2h', normalizeId: true

2. Mount R2 bucket at /mnt/r2
   - Unmount first (handles reuse)
   - Mount with R2 credentials + account ID
   - Prefix: users/{userId}/

3. Pre-flight IP check
   - Test Anthropic API from sandbox
   - If 403 → destroy, create new sandbox with unique ID
   - Max 3 attempts

4. Hydrate files (if follow-up with cold start OR hasSourceResearch)
   - Write research/hooks/prompts from D1 to sandbox filesystem
   - For source-research campaigns: only research is hydrated (no hooks/prompts yet)

5. Start agent-runner.ts via startProcess()
   - Pass env: PROMPT, SESSION_ID, CAMPAIGN_ID, API keys
   - Save agentProcessId to storage

6. Attach three listeners:
   a. attachCompletionHandler() — waitForLog('turn_complete')
   b. attachCrashHandler() — waitForExit() for instant crash detection
   c. attachStreamHandler() — streamProcessLogs → live UI events

7. (Returns — listeners run as fire-and-forget promises)
```

### `handleFollowUp(prompt, campaignId)` — Path Selection

```
                                ┌─────────────────────────┐
                                │  isAgentProcessAlive()?  │
                                └──────────┬──────────────┘
                                           │
                              ┌────────────┼────────────┐
                              │ YES                     │ NO
                              ▼                         ▼
                   ┌──────────────────┐         ┌──────────────┐
                   │ agentCampaignId  │         │  SLOW PATH   │
                   │ === campaignId?  │         │  (cold start)│
                   └────────┬─────────┘         └──────────────┘
                            │
                   ┌────────┼────────┐
                   │ YES             │ NO (campaign switch)
                   ▼                 ▼
            ┌──────────────┐  ┌──────────────┐
            │  FAST PATH   │  │  SLOW PATH   │
            │  (~30-60s)   │  │  (kill old   │
            │              │  │   agent,     │
            │              │  │   start new) │
            └──────────────┘  └──────────────┘
```

**Campaign mismatch detection:** `agentCampaignId` is stored in DO storage when the agent starts (`setupSandbox`). Before fast path, we compare it against the requested `campaignId`. If different, the alive agent belongs to a different campaign — its SDK session has the wrong conversation history. We must kill it and cold start with the correct context.

**Cold start hydration condition:** `if (sdkSessionId || this.hasSourceResearch)` — widens the hydration trigger to include campaigns created from a source. On cold resume of a source-research campaign where only research exists (no hooks/prompts yet), a smart follow-up note tells the agent to generate hooks and prompts from the pre-loaded research before generating images.

### `runFollowUpFast(sandbox, prompt, sessionId, campaignId)`

```
1. Write /app/next-prompt.json to sandbox (file IPC)
   - Contains { prompt, campaignId, requestId }

2. Attach completion handler + crash handler + stream handler
   - Same pattern as runGeneration but no sandbox creation

3. ~30-60s response time (vs ~5 min cold start)
```

---

## Completion Detection (Four Layers)

```
Agent prints turn_complete + writes completion marker to R2
                    │
    ┌───────────────┼───────────────┬───────────────────┐
    │               │               │                   │
    ▼               ▼               ▼                   ▼

Layer 1:        Layer 2:        Layer 3:           Layer 4:
waitForLog      waitForExit     Alarm polling      /recover
────────────    ───────────     ─────────────      ────────
Primary.        Crash detect.   Every 30s:         Client POST
Watches for     Fires if agent  a) R2 marker       checks D1 for
turn_complete   process exits.  b) Log snapshot    existing data
in stdout.      Checks logs +      (getProcessLogs) (images/files).
On fail:        R2 marker
re-attach 10x.  before marking
                incomplete.
    │               │               │                   │
    └───────────────┴───────────────┴───────────────────┘
                              │
                    All check isGenerating
                    Only first one wins
```

| Failure Scenario | What detects it | Time to detect |
|-----------------|----------------|----------------|
| Normal completion | Layer 1 (waitForLog) | Instant |
| SSE stream timeout (120s) | Layer 1 re-attach → Layer 3b (log snapshot) | 30s (next alarm) |
| Agent crash (OOM, exception) | Layer 2 (waitForExit) | Instant |
| RPC disconnect (sandbox lost) | Layer 3a (R2 marker) | 30s (next alarm) |
| Everything fails | 2h safety net in alarm | 2 hours |

### Layer 1: `waitForLog('turn_complete')` — Primary

Attached via `attachCompletionHandler()`. Calls `proc.waitForLog('turn_complete', 2h)` on the agent process object.

On trigger:
1. Check `isGenerating` (skip if already false — another layer completed first)
2. Read `turn-result.json` from sandbox local disk
3. `reconcileImages()` — dedup against D1, insert missing images, emit `image` events
4. `reconcileFiles()` — update D1 campaign files (research, hooks, prompts)
5. Emit `complete` event with `imageCount`
6. Update D1 status → `complete`
7. Save assistant message to D1
8. Set `isGenerating = false`, persist session

**Failure modes:**
- **RPC disconnect** (browser refresh, TCP drop): `reader.read()` hangs forever. No error, no reject. Only the 2h timeout fires
- **SSE stream timeout (120s)**: Re-attaches up to 10 times (~20 min). After that, relies on alarm polling
- **Process not found** (`getProcess()` returns null): Marks campaign `incomplete` immediately
- **DO reset**: Promise is garbage collected. Alarm handler re-attaches on next fire

### Layer 2: `waitForExit()` — Crash Detection

Attached via `attachCrashHandler()`. Fires when the agent process exits unexpectedly (OOM, unhandled exception). In normal operation it NEVER fires — the agent-runner stays alive between turns.

On trigger:
1. Check `isGenerating` (skip if already false — another path completed)
2. Check process logs for `turn_complete` (race window — agent may have completed just before crash)
3. Check R2 completion marker (agent may have written it before crashing)
4. If neither found → mark campaign `incomplete` immediately + emit error event

**Cancel interaction:** On cancel, `handleCancel()` sets abort signal → `runGeneration` finally block sets `isGenerating = false` and calls `killProcess()`. The kill causes `waitForExit()` to resolve, but `isGenerating` is already false → returns early. Safe.

### Layer 3: Alarm Polling — Safety Net

Every 30s in the alarm handler, two independent checks:

**3a) R2 Completion Marker** — `pollR2CompletionMarker()`. Agent writes `completion_{campaignId}.json` to R2 via FUSE mount. Polled directly via `env.R2_BUCKET` (independent of sandbox connection).

**3b) Log Snapshot** — `getProcessLogs()`. Simple HTTP GET that returns full accumulated stdout as a string. If `turn_complete` found, reconciles images/files and marks complete. More reliable than waitForLog re-attach (no SSE streaming dependency).

### Layer 4: API Recovery — Last Resort

Client calls `POST /api/campaigns/:id/recover`. Route handler (`routes/recovery.ts`) checks D1 for existing images, files, and messages — if any data exists, it creates a synthetic assistant message (if missing), marks the campaign `complete`, and returns the full campaign. No R2 dependency — D1 is the sole source of truth. Auto-triggered on page load when client detects a stuck (`incomplete`/`generating`/`error`) campaign.

---

## Alarm Heartbeat

```
startKeepAlive() → setAlarm(now + 10s)

alarm():
  │
  ├── 1. flushTailLogs() — emit buffered logs to console (visible in wrangler tail)
  │
  ├── 2. restoreSession() if campaignId lost to DO reset
  │
  └── 3. If isGenerating && campaignId:
      │
      ├── a. Safety net: generation > 2h → mark incomplete, stop alarm
      │
      ├── b. Sandbox reconnect (if !sandbox && !sandboxSetupInProgress)
      │      → getSandbox() to reconnect
      │      ⚠️ NEVER reconnect if setupSandbox is running!
      │         Two connections cancel each other's RPCs.
      │
      ├── c. Zombie detection (if !agentProcessId && !sandboxSetupInProgress)
      │      → If 5+ min with no agent → mark incomplete, stop alarm
      │      → Catches: timedRPC timeout, setup failure, etc.
      │
      ├── d. If sandbox available:
      │      ├── Crash detection: listProcesses() → agent still running?
      │      │   └── Dead? → tryFinalize, else mark incomplete
      │      ├── Log relay: getProcessLogs() → trace recent output
      │      └── tryFinalize() → read turn-result.json
      │          └── Validates result.campaignId matches current campaign
      │
      └── e. Reschedule: setAlarm(now + 10s)
```

The alarm is the **only** way to keep a DO alive during fire-and-forget generation. Without it, the Hibernation API destroys the DO instance after the handler returns.

**Error resilience:** If the alarm handler throws, it catches the error and still reschedules (prevents generation from getting stuck with no alarm).

**Self-termination:** When `isGenerating` becomes false (generation completed/failed), the alarm is not rescheduled. The DO can then hibernate normally.

### Alarm Safety Mechanisms (Session 55)

```
┌────────────────────────────────────────────────────────────────┐
│                   ALARM SAFETY LAYERS                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. sandboxSetupInProgress flag                                │
│     ─────────────────────────                                  │
│     Set TRUE at start of setupSandbox()                        │
│     Set FALSE at end + in runGeneration finally block          │
│     Alarm checks this BEFORE reconnecting sandbox              │
│     Prevents: two getSandbox() connections canceling RPCs      │
│                                                                │
│  2. Zombie detection                                           │
│     ────────────────                                           │
│     If isGenerating=true, agentProcessId=null,                 │
│     sandboxSetupInProgress=false, and 5+ min elapsed           │
│     → mark incomplete, notify user, stop alarm                 │
│     Prevents: infinite alarm loop when setup silently fails    │
│                                                                │
│  3. turn-result.json campaign validation                       │
│     ────────────────────────────────────                       │
│     tryFinalize checks result.campaignId !== campaignId        │
│     → skip if mismatch (stale result from previous campaign)   │
│     Prevents: saving wrong campaign's data during switch       │
│                                                                │
│  4. 2h safety net (unchanged)                                  │
│     → mark incomplete if generation exceeds 2 hours            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Cancel Flow

```
User clicks Cancel
    │
    ▼
handleCancel():
  1. abortController.abort()  ← sets signal only
  2. Send status:'cancelled' ACK to client
  3. (That's ALL — does NOT kill processes or update D1)
    │
    ▼
runGeneration/runFollowUpFast detects abort:
    │
    ├── Before startProcess()? → Skip agent startup entirely
    │
    ├── During streaming? → wasCancelled = true, break loop
    │
    └── In finally block (cancel-aware):
        ├── Kill agent process (this.agentProcessId)
        ├── Unmount R2 bucket
        ├── Update D1 → 'cancelled'
        └── Save cancellation message to D1
```

**Key design:** `handleCancel` only sets the abort signal. It does NOT kill processes or update D1. The generation function (`runGeneration`/`runFollowUpFast`) handles its own cleanup because it knows which agent it started.

**Race condition (Session 29):** Previously, `handleCancel` killed `this.agentProcessId` directly. But during the setup phase (mount R2, pre-flight check), `agentProcessId` still pointed to the PREVIOUS campaign's agent. Cancel killed the wrong agent, the new agent started after cancel, and held the R2 mount — blocking all future generations. Fix: cancel only sets signal, generation functions handle cleanup.

---

## Subscribe / Recovery

```
handleSubscribe(ws, sessionId, lastEventId):
  1. If event buffer empty → restore session from storage
     - Verify campaign still generating in D1 (staleness check)
     - If stale → clear session, return error (to THIS ws only)
     - If still generating → restart alarm, reconnect sandbox
  2. Replay missed events to THIS WebSocket only (sendToWS, not broadcast)
  3. Send 'subscribed' confirmation to THIS WebSocket only
  4. If generating + sandbox alive → re-attach stream handler
```

**Multi-tab:** Replay goes only to the reconnecting tab via `sendToWS(ws, ...)`. Other tabs already received those events. New broadcast events (from `emitEvent`) go to all tabs.

---

## Helper Methods

### `emitEvent(event)`
Buffers event in EventBuffer (via `append()`) AND broadcasts to ALL connected WebSockets via `this.state.getWebSockets()`. If no sockets connected, event is only buffered for replay on reconnect.

```typescript
private emitEvent(event: ServerMessage): void {
  const eventId = this.eventBuffer.append(event);
  const payload = JSON.stringify({ ...event, id: eventId });
  for (const ws of this.state.getWebSockets()) {
    try { ws.send(payload); } catch { /* closed — ignore */ }
  }
}
```

### `sendWS(event)`
Broadcasts to ALL connected WebSockets WITHOUT buffering. Used for ack, pong, errors that don't need replay on reconnect.

### `sendToWS(ws, event)`
Sends to a SPECIFIC WebSocket. Used for subscribe replay (only the reconnecting tab gets replayed events, not all tabs) and for error responses to the specific sender.

### `persistSession()` / `restoreSession()` / `clearPersistedSession()`
Reads/writes `activeSession` and `userId` from `this.state.storage`.

**`restoreSession()` flow:**
1. Restore `userId` from storage if lost to hibernation (only if current is `'anonymous'`)
2. Restore `agentProcessId` from storage
3. Restore `activeSession` → `sessionId`, `campaignId`, `isGenerating`, `generationStartedAt`
4. **Staleness check:** if `isGenerating` is true, verify against D1 that campaign still has `generating` status. If not → reset flag (prevents stuck state after deploy)
5. **Header priority:** never overwrites a fresh `userId` from request header with a stale stored one

**`clearPersistedSession()`:** Deletes `activeSession` but NOT `userId` — userId must survive across generations for follow-up messages after DO hibernation.

### `reconcileImages(sandbox, campaignId, imageCounter, emitEvent)`
Reads `/app/turn-result.json` from sandbox (local disk, NOT R2). Compares image list against D1 `campaign_images`. Inserts any missing images + emits `image` events. Deduplicates by `file_path`.

### `reconcileFiles(sandbox, campaignId)`
Reads `/app/turn-result.json` `files` object from sandbox. Updates D1 `campaign_files` for each file type (research, hooks, prompts).

### `isAgentProcessAlive(sandbox)`
Two-step check: (1) `sandbox.listProcesses()` → find process by ID with status `'running'`. (2) Read `/app/agent-status.json` → if `processing`, return false (still on previous turn). If `idle` within 2h, return true.

### `resolveAssetUrls(assetFileIds)`
Queries D1 `asset_files` for each ID. Generates pre-signed R2 URLs via `R2_BUCKET.createMultipartUpload` workaround (R2 doesn't have native pre-signed URLs). Used for reference images in generation prompts.

### `pollR2CompletionMarker(campaignId, sessionId)`
Called by the alarm handler every 30s. Reads `completion_{campaignId}.json` directly from R2 (bypasses sandbox/FUSE). If found: syncs images+files to D1, marks campaign complete, emits `complete` event, sets `isGenerating = false`. Returns `true` if recovery succeeded.

**Key design:** Completely independent of sandbox RPC connection. Works even after DO reset when `waitForLog` is dead.

### `attachCrashHandler(campaignId, sessionId)`
Attaches `waitForExit()` on the agent process for instant crash detection. On exit: checks logs for `turn_complete` (race window), checks R2 marker, then marks incomplete if neither found. In normal operation this never fires — the agent stays alive between turns.

### `attachStreamHandler(campaignId)`
Fire-and-forget stream re-attach. Calls `sandbox.streamProcessLogs()`, skips replayed history via `turn_start` sentinel, then processes live SDK messages for UI updates only. Does NOT handle completion — that's `waitForLog`'s job.

### `log(msg)` / `flushTailLogs()`
Buffers logs to `tailLogs[]` (max 500, trims to 250 on overflow). Flushed by alarm handler every 30s via `console.log()`. Only way to get logs from fire-and-forget promises into `wrangler tail`.

---

## RPC Safety — `timedRPC` Wrapper

Every sandbox RPC call is wrapped with a 60s timeout via `Promise.race`:

```
timedRPC(label, fn, timeoutMs = 60_000)
  │
  ├── trace(rpc, label.start)
  ├── Promise.race([ fn(), setTimeout(60s → reject) ])
  ├── On success → trace(rpc, label.done, { ms })
  └── On error/timeout → trace(rpc, label.error, { ms, err }) → throw
```

**Why:** Sandbox RPCs can hang indefinitely if the container is unstable or if two `getSandbox()` connections collide (the Sandbox DO cancels in-flight RPCs when a second connection arrives). Without the timeout, `setupSandbox()` hangs forever and the catch block never runs.

**Observed RPC times:** Most calls complete in <500ms. `mountBucket` ~365ms. `preflight` (API test) ~700ms. Any call exceeding 60s is broken.

---

## Critical Gotchas

1. **DO resets lose all in-memory state** — Code deploys trigger resets. Must restore from `this.state.storage`
2. **`this.userId` only set from headers during `fetch()`** — After reset, `webSocketMessage()` has no headers. Must persist userId
3. **`waitUntil()` is a no-op in DOs** — Only works in regular Workers
4. **Alarm is the only periodic execution** — No setInterval, no background threads
5. **Each deploy resets active DOs** — Don't deploy during generation
6. **WS close does NOT stop generation** — Events buffer for reconnect
7. **`file.content` NOT `file.contents`** — `sandbox.readFile()` returns `{ content: string }`. The `contents` (with 's') property is undefined. This typo caused weeks of silent failures in `reconcileImages`/`reconcileFiles` (fixed Session 31)
8. **`streamProcessLogs()` replays ALL history** — Despite the name, it replays the entire accumulated stdout. Must use `turn_start` sentinel to skip replay
9. **`waitForLog` hangs on RPC disconnect** — HTTP SSE transport has no heartbeat. If TCP drops silently, `reader.read()` blocks forever. R2 alarm polling is the safety net
10. **DO `idFromName(userId)`** — One DO per user (not per campaign). All campaigns for a user route to the same DO instance. `isGenerating` is a per-user lock
11. **Multi-tab broadcast** — `emitEvent()` and `sendWS()` broadcast to ALL connected WebSockets via `this.state.getWebSockets()`. Subscribe replay uses `sendToWS(ws)` for targeted delivery to only the reconnecting tab
12. **Two `getSandbox()` connections cancel each other** — The Sandbox DO treats a second connection as a replacement, canceling in-flight RPCs on the first. Never create two connections simultaneously (alarm uses `sandboxSetupInProgress` flag)
13. **SDK JSONL via s3fs gets null-byte corruption** — s3fs pre-allocates file size with `\x00` then writes content. If read mid-flush, you get null bytes. **Never use `RESUME_SDK_SESSION_ID`** on cloudflare. D1 conversation history + file hydration is the reliable context path
14. **`agentCampaignId` must match before fast path** — The running agent belongs to one campaign. Sending a different campaign's prompt to it produces wrong answers. Always check `storage.get('agentCampaignId') === requestedCampaignId`
15. **`turn-result.json` can be stale across campaigns** — `tryFinalize()` validates `result.campaignId` matches the current campaign. Skips stale results from previous campaigns during alarm finalization

---

## See Also

- [Cloudflare Overview](./CLOUDFLARE_OVERVIEW.md) — Request routing to DO
- [Sandbox Container](./SANDBOX_CONTAINER.md) — What runs inside the container
- [Streaming Pipeline](./STREAMING_PIPELINE.md) — How SDK output becomes WS events
- [D1 Database](./D1_DATABASE.md) — What the DO reads/writes
