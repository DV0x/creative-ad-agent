# Durable Object — CampaignSession

> Part of [Architecture Documentation](../INDEX.md) | **File:** `cloudflare/src/durable-objects/campaign-session.ts` (1945 lines)

The heart of production. One DO per user (keyed by `idFromName(userId)`), owns WebSocket connections, orchestrates generation via a sandbox container, detects turn completion, finalizes to D1, deducts credits, and self-heals after DO resets.

---

## Instance state

### Transient (lost on DO eviction / code deploy)

`campaign-session.ts:18-39`:

```ts
userId: string                   // 'anonymous' default; set from X-User-Id header
sessionId: string | null         // Current WS session ID
campaignId: string | null        // Campaign being generated now
isGenerating: boolean            // Per-user lock — prevents concurrent gens
abortController: AbortController // Cancel signal for current gen
sandbox: any                     // Sandbox container ref
agentProcessId: string | null    // Long-running agent-runner.js process ID
eventBuffer: EventBuffer         // Ring buffer for WS event replay
tailLogs: string[]               // Deferred logs, flushed by alarm
generationStartedAt: number      // Timestamp for 2h safety net + 5min zombie
sandboxSetupInProgress: boolean  // Guards alarm from reconnecting mid-setup
currentRequestId: string | null  // Per-turn ID for staleness check on tryFinalize
hasSourceResearch: boolean       // True when "New from Existing" copied research
preGenImageCount: number         // DB image count before this turn — for cancel + billing
currentLogStream: ReadableStream // Active stream ref — cancelled by handleCancel
traceSeq, alarmIteration, lastContainerLogLen  // Diagnostics
```

**No `ws` field.** `this.state.getWebSockets()` enumerates every live connection — multi-tab just works.

### Persisted (survives DO reset via `this.state.storage`)

| Key | Shape | Written when |
|---|---|---|
| `userId` | `string` | Immediately on `fetch()` (before first WS message) |
| `activeSession` | `{ sessionId, campaignId, userId, isGenerating, generationStartedAt, currentRequestId, hasSourceResearch }` | `persistSession()` on gen start + every state change |
| `agentProcessId` | `string` | After `startProcess()` succeeds in `setupSandbox` |
| `agentCampaignId` | `string` | Same point — which campaign the running agent belongs to |
| `maxImageIndex:{campaignId}` | `number` | After finalize — next turn starts image indexing from here |

---

## Lifecycle

### `fetch()` — WebSocket upgrade

`campaign-session.ts:623-657`:

1. Read `X-User-Id` from headers (Worker verified the Clerk JWT and injected it)
2. Persist `userId` to storage (survives hibernation between `fetch` and first `webSocketMessage`)
3. `restoreSession()` — if DO was reset, pick state back up from storage
4. `WebSocketPair` + `state.acceptWebSocket(server)` (Hibernation API)
5. `sendToWS(server, ack)` — only to THIS socket, not a broadcast

### `webSocketMessage()` — dispatch

`campaign-session.ts:659-701`. Restore session first (DO may have hibernated since `fetch`), parse JSON, dispatch:

| `message.type` | Handler | Purpose |
|---|---|---|
| `generate` | `handleGenerate` | New campaign |
| `follow_up` | `handleFollowUp` | Iterate on existing |
| `cancel` | `handleCancel` | Abort current gen |
| `subscribe` | `handleSubscribe` | Recover/resume after reconnect |
| `ping` | `handlePing` | Respond with `pong` |

### `webSocketClose()` / `webSocketError()`

`campaign-session.ts:703-713`. Logs only. No cleanup — `getWebSockets()` auto-excludes closed sockets, generation keeps running, events buffered for reconnect.

---

## Generation flow

### `handleGenerate(prompt, sessionId, assetFileIds?, sourceCampaignId?, aspectRatio?, brand?)`

`campaign-session.ts:717-869`:

1. **Zombie bypass** — if `isGenerating=true` but `sandbox=null`, nothing's actually running (DO-reset zombie); reset `isGenerating` and proceed. Else reject.
2. Set `isGenerating=true`, `generationStartedAt=now`, `currentRequestId=null`
3. **Pre-flight credit check** — `credits.getBalance(userId)`. If ≤ 0, emit `error` with `code: INSUFFICIENT_CREDITS`, release lock, return. Done BEFORE any D1 writes to avoid orphan campaigns.
4. Create `AbortController`. Create/reuse campaign in D1 (auto-fix stale `anonymous` user_id).
5. **If `sourceCampaignId`** — verify ownership, copy research from source's `campaign_files`, emit `file` event so client sees research immediately, set `hasSourceResearch = true`.
6. Persist user message. `persistSession()`. Emit `ack` + initial `phase` event.
7. Resolve asset reference URLs (if any) via `resolveAssetUrls` — uploads to fal storage, prepends reference-image instructions to prompt.
8. Append system notes: source-research instructions (skip research agent), aspect-ratio instructions.
9. `startKeepAlive()` — sets alarm +10s.
10. **Fire-and-forget**: `this.runGeneration(aiPrompt, sessionId).catch(...)`. Return immediately so pings / subscribes can be handled.

### `runGeneration(prompt, sessionId, sdkSessionId?)`

`campaign-session.ts:1641-1720`.

```
1. If env.AI_BACKEND === 'local' → delegate to runGenerationLocal (no sandbox)
2. createStreamingContext(campaignId, 'Parsing Request')
     - Opens BlockBuilder, text accumulator, processedFilenames set
     - preGenImageCount = current D1 image count  (for billing delta)
     - imageCounter.next = max(storedMaxIndex, dbMaxIndex) + 1

3. setupSandbox({ prompt, sessionId, sdkSessionId })
     - Detailed in "setupSandbox" below

4. streamProcessLogs(agentProcessId) → ReadableStream
5. streamForLiveUI(logStream, ctx, { label: 'gen' })  — Stage 2 of streaming pipeline
6. If not cancelled: tryFinalize(campaignId, sessionId)  — inline, eliminates alarm race

Error handling:
  - AbortError → wasCancelled = true, D1 status = 'cancelled'
  - Error after agent started → emit 'status: Live updates paused', let alarm finalize
  - Error before agent started → fatal: emit 'error', D1 = 'error', release lock

finally (cancelled path only):
  - recordCancelledUsage — charges for images already generated
  - killProcess(agentProcessId), unmountBucket('/mnt/r2'), clearPersistedSession
```

### `setupSandbox({ prompt, sessionId, sdkSessionId })`

`campaign-session.ts:1306-1497`. Serial steps, all wrapped in `timedRPC` (60s timeout per call):

1. **`sandboxSetupInProgress = true`** — tells the alarm to NOT call `getSandbox()` (two connections cancel each other's RPCs).
2. **IP retry loop** (up to 3 attempts):
   - Get sandbox (fresh ID on retries: `user-{id}-v2-{timestamp}`)
   - `cleanupCompletedProcesses()` — best-effort cleanup of dead processes from prior gens
   - `pkill -f agent-runner` — kill prior agent (open file handles under `/mnt/r2` pin the FUSE mount)
   - `unmountBucket('/mnt/r2')` + `pkill -9 s3fs; umount -l /mnt/r2; fusermount -u /mnt/r2; rm -rf /mnt/r2; mkdir -p /mnt/r2` — full FUSE reset (lazy unmount, since Session 53)
   - `mountBucket(R2_BUCKET_NAME, '/mnt/r2', { ...R2 creds, prefix: '/users/{userId}' })`
   - **Pre-flight IP test** — run `node -e "fetch('https://api.anthropic.com/...'); fetch('https://httpbin.org/ip')"` in the sandbox. Look for `WITH_KEY=200`. If not: `destroy()`, try new ID. If all 3 fail: proceed but setup is effectively broken.
3. `rm -f /app/generated-images.jsonl /app/turn-result.json` — clear stale tracking.
4. If `!sdkSessionId`: full workspace wipe (`rm -rf /app/agent/files/*`, hook-bank contents) — new campaign, fresh slate.
5. **Hydrate from D1** if cold-resuming (`sdkSessionId` set) or source-research (`hasSourceResearch`). Write research → `/app/agent/files/research/restored_research.md`, hooks → `.../hook-bank/restored_hooks.md`, prompts → `/app/agent/files/creatives/restored_prompts.json`.
6. Abort check — if cancelled during setup, throw `AbortError`.
7. `startProcess('node /app/dist/agent-runner.js', { env: { ANTHROPIC_API_KEY, FAL_KEY, PROMPT, SESSION_ID, CAMPAIGN_ID, RESUME_SDK_SESSION_ID='', HOME='/root', IMAGE_OUTPUT_DIR='/mnt/r2/images', ... } })`.
8. Persist `agentProcessId` + `agentCampaignId` to storage.
9. `sandboxSetupInProgress = false`.

**HOME is `/root`** (not `/mnt/r2` — that pre-Session-58 framing is wrong). `IMAGE_OUTPUT_DIR` points at the R2 mount so the nano-banana MCP tool writes images directly to R2 via FUSE. Agent stdout / workspace / generated-images.jsonl all live under `/app` (container local disk).

**`RESUME_SDK_SESSION_ID` is always empty string.** Never set it on Cloudflare — s3fs FUSE causes null-byte corruption in the SDK's JSONL files. Context is recovered via D1 file hydration + conversation history injection into the prompt (`handleFollowUp` slow-path fallback at `campaign-session.ts:1062-1078`, which then calls `runGeneration` with the enriched prompt at line 1080).

### `handleFollowUp(prompt, campaignId, ...)`

`campaign-session.ts:871-1084`. Picks fast or slow path based on agent liveness.

```
1. Zombie bypass + pre-flight credit check (same as handleGenerate)
2. Look up campaign, verify ownership
3. sdkSessionId = db.getSdkSessionId(campaignId)   (null ok — slow path will hydrate)
4. Persist user message + set status 'generating'
5. eventBuffer.clear()  — drop stale events from prior turn
6. Resolve assets + aspect ratio (same as gen)
7. isAgentProcessAlive(sandbox)?
     - listProcesses + agent-status.json check (status='idle' AND timestamp < 2h old)
     - Returns false if process dead, missing, or 'processing' (prior turn still running)
8. agentCampaignId (from DO storage) === requested campaignId?

  ┌──────────────────────────────────────────────────────────────────┐
  │  Both conditions met → FAST PATH (runFollowUpFast, ~30-60s)      │
  │  Agent alive but wrong campaign → SLOW PATH (kill + cold start)  │
  │  Agent dead → SLOW PATH (full cold start, ~3 min)                │
  └──────────────────────────────────────────────────────────────────┘

Slow path also:
  - Appends file-hydration context to prompt (if sdkSessionId OR hasSourceResearch)
  - Appends conversation history from D1 (up to 2000 chars per message)
  - Falls through to runGeneration(aiPrompt, wsSessionId, sdkSessionId)
```

### `runFollowUpFast(sandbox, prompt, sessionId, campaignId)`

`campaign-session.ts:1542-1637`. Uses the alive agent — no sandbox creation.

```
1. requestId = req_${Date.now()}  — unique per turn for sentinel matching
2. persistSession()
3. streamProcessLogs(agentProcessId) → ReadableStream (BEFORE writing prompt to avoid race)
4. currentLogStream = stream  — so handleCancel can .cancel() it
5. writeFile('/app/next-prompt.json', { prompt, campaignId, requestId })
     — agent-runner blocks on this file in waitForPromptFile()
     — agent writes {type:'turn_start', requestId} and begins processing
6. streamForLiveUI(stream, ctx, { skipUntilRequestId: requestId, label: 'gen-fast' })
     — Skips replayed history until it finds matching turn_start
     — Returns true if cancelled
7. Not cancelled → tryFinalize(campaignId, sessionId)  — inline, no alarm race
8. Cancelled → D1 status = 'cancelled', save "scrapped that one" message

Error paths:
  - AbortError → cancelled
  - Other error AND agentProcessId still set → status 'Live updates paused...', alarm finalizes
  - Other error AND no agent → fatal, D1 = 'error', release lock

Cancel finally:
  - recordCancelledUsage
  - killProcess + unmountBucket
```

---

## Completion detection — the real four layers

Old docs described `waitForLog` / `waitForExit` / `attachCompletionHandler` / `attachCrashHandler`. **None of that exists** — verified by grep, 2026-04-22. Current architecture:

```
    End of a turn
         │
  ┌──────┴───────────────────────────────────────────────────────┐
  │                                                              │
  ▼                                                              │
Layer 1: Inline stream parse           (primary — normal path)   │
  streamForLiveUI detects              campaign-session.ts       │
  turn_complete / result               :1277-1280                │
  Sets turnDone, breaks loop                                     │
  │                                                              │
  ▼                                                              │
Layer 2: Post-streaming tryFinalize    (Session 66 fix)          │
  Called inline immediately after      campaign-session.ts       │
  stream loop exits cleanly            :1581, :1663              │
  Eliminates alarm race window                                   │
  │                                                              │
  ├─── If either fires: finalizeGeneration → D1 writes → WS      │
  │    complete → isGenerating=false → alarm self-terminates     │
  │                                                              │
  ▼                                                              │
Layer 3: Alarm listProcesses           (fallback — stream broken)│
  Every 10s while isGenerating:        campaign-session.ts       │
  - if agent dead → tryFinalize        :186-276                  │
  - if dead + no result → mark         (alarm())                 │
    incomplete + friendly error                                  │
  │                                                              │
  ▼                                                              │
Layer 4: Client POST /recover          (last resort)             │
  D1 has data? → synth message,        routes/recovery.ts        │
  mark complete, return campaign       :9-88                     │
  Auto-triggered on page load for                                │
  incomplete/generating/error status                             │
                                                                 │
```

### Layer 1: inline stream parse

`streamForLiveUI` at `campaign-session.ts:1224-1302` reads `streamProcessLogs` frame-by-frame. When it sees `{type:'turn_complete'}` or `{type:'result'}` on stdout, sets `turnDone = true` and breaks both loops. Returns `false` (not cancelled). Full details in [STREAMING_PIPELINE.md](./STREAMING_PIPELINE.md).

### Layer 2: post-streaming `tryFinalize`

After the stream loop returns cleanly, the caller calls `tryFinalize(campaignId, sessionId)`. Two call sites:

- `runGeneration` at line 1663
- `runFollowUpFast` at line 1581

`tryFinalize` (`campaign-session.ts:303-337`):

```
1. readFile('/app/turn-result.json')  — wrapped in timedRPC
2. Parse JSON
3. Validate campaignId matches this.campaignId  (skip stale results from prior campaigns)
4. Validate requestId matches this.currentRequestId  (skip stale results from prior turns)
5. finalizeGeneration(campaignId, sessionId, result)
6. Return true on success, false if file not found (normal — agent still working)
```

FileNotFoundError is normal. Anything else is a bug and gets logged.

### Layer 3: alarm fallback

`campaign-session.ts:109-298`. Runs every 10s while `isGenerating && campaignId`.

Priority order inside alarm:

1. **Flush tail logs** — make fire-and-forget `console.log` visible in `wrangler tail`
2. **Self-heal** — if `!campaignId`, `restoreSession()` from storage
3. **2h safety net** — `(now - generationStartedAt) > 2h` → mark `incomplete`, emit friendly error "That took way too long…"
4. **Sandbox reconnect** — if no sandbox AND setup not in progress AND we know the user → `getSandbox()` to reconnect (never both getSandbox if setup is running — two connections kill each other's RPCs)
5. **Zombie detection** — if `!agentProcessId && !sandboxSetupInProgress` AND age > 5 min → mark `incomplete`, emit "Hmm something didn't start right…"
6. **Agent liveness** — if sandbox AND `agentProcessId`:
   - `listProcesses()` → is our agent `running`?
   - If dead → `tryFinalize` (race window — agent may have written `turn-result.json` just before dying)
   - If `tryFinalize` returns false → mark `incomplete`, emit "The creative engine wandered off…"
   - **Fatal sandbox error** detection (`err.message.includes('object to be reset')` or `'Network connection lost'`) → wipe sandbox ref + agent ID, mark incomplete, emit "Connection went poof but your work didn't — hit send again and we're vibing"
7. **Container log relay** — `getProcessLogs(agentProcessId)` — diff against `lastContainerLogLen`, trace the last 3 new lines. Makes the agent visible in wrangler tail.
8. **`tryFinalize` once more** — if agent's alive but turn-result.json has landed anyway, pick it up
9. **Reschedule** — `setAlarm(now + 10s)` if still generating. Else no reschedule (alarm self-terminates).

**Error resilience**: if any step throws, catch it, still reschedule (prevents stuck state with no alarm).

**ZOMBIE_THRESHOLD = 5 * 60 * 1000 ms** (`campaign-session.ts:170`). Short enough to give friendly error before users get impatient, long enough to let cold-start sandbox setup finish (~2.5 min typical, 3 min on slow retry paths).

### Layer 4: client `/recover`

`cloudflare/src/routes/recovery.ts:9-88`. POST `/api/campaigns/:id/recover`.

D1-first reconciliation. No R2 completion marker anywhere — the old `pollR2CompletionMarker` path was removed. Logic:

```
1. Verify campaign exists + belongs to user
2. Only proceed if status in ['incomplete', 'generating', 'error']
3. hasData = (images.length > 0 || files.length > 0 || lastAssistantMessage)
4. If !hasData → return recovered=false, reason='no_data' (nothing to salvage)
5. If !lastAssistantMessage → insert synthetic assistant: "Generation recovered. N images found."
6. Update campaign status → 'complete'
7. Return full campaign payload (campaign, files, images, messages)
```

Auto-triggered by the client on page load when it loads a campaign in a stuck status. Safe to call repeatedly — idempotent past the first success.

---

## `finalizeGeneration` — D1 writes + credits

`campaign-session.ts:339-479`. Runs once per turn, from either Layer 1 (inline) or Layer 3 (alarm).

```
1. If !isGenerating → return  (another layer finalized first)
2. Reconcile images: for each image in turn-result.json, dedup against D1 by urlPath,
   assign sequential index, emit 'image' event, db.addCampaignImage
3. Reconcile files: for each of research/hooks/prompts, db.updateCampaignFile
4. Persist assistant message: db.addMessage(role='assistant', content, blocks)
5. Emit 'complete' event with imageCount + summary (first 500 chars of text)
6. db.updateCampaignStatus(campaignId, 'complete')
7. Persist maxImageIndex:{campaignId} for next turn's counter
8. Record usage + deduct credits (see below)
9. Delete /app/turn-result.json  (prevents double-charge on crash-recovery path)
10. isGenerating = false, persistSession()
```

### Cost deduction

`campaign-session.ts:427-466`. Runs inside finalizeGeneration, step 7:

```
imagesThisTurn = currentImageCount - preGenImageCount
claudeCost    = turnResult.cost.totalCostUsd  (per-turn delta, from agent-runner)
imageCost     = imagesThisTurn * 0.15
rawCost       = claudeCost + imageCost
chargedCost   = rawCost * COST_MULTIPLIER   (= 4)  — ~75% gross margin

credits.recordUsage(userId, campaignId, {
  requestId: turnResult.requestId || `finalize_${Date.now()}`,
  eventType: preGenImageCount > 0 ? 'follow_up' : 'generation',
  claudeCostUsd, imageCount, imageCostUsd, totalCostUsd: chargedCost,
  inputTokens, outputTokens, numTurns, durationMs,
})
```

`recordUsage` uses `INSERT OR IGNORE` on `usage_log(campaign_id, request_id)` — idempotent. If already recorded, no deduction, returns `alreadyRecorded: true`.

On fresh deduction: emits `credits_update` WS event via `sendWS` (ephemeral broadcast, not buffered):

```json
{
  "type": "credits_update",
  "balance":      new_total_credits,
  "plan_balance": new_plan_credits,
  "topup_balance": new_topup_credits,
  "cost":         charged_credits_this_turn
}
```

All four values are rounded to 1 decimal in credits (USD × 10). See [BILLING.md](../shared/BILLING.md) for the two-pool model.

### Cancel / partial cost

`recordCancelledUsage` at `campaign-session.ts:483-522`. Runs in the `finally` block of `runGeneration` / `runFollowUpFast` when `wasCancelled=true`.

Deducts for images already generated before cancel: `imagesAdded * 0.15 * COST_MULTIPLIER`. No Claude tokens deducted (we don't know partial Claude cost reliably on cancel). Same idempotency via `requestId` (stable: `currentRequestId` or `cancel_{campaignId}`).

Emits `credits_update` same as normal finalize.

---

## Zombie detection — three places

A "zombie" is the state where `isGenerating=true` but nothing is actually running (no sandbox, no agent process). Happens after DO reset, setup failure, fatal RPC error, etc. Three detection sites:

### 1. Alarm (background)

`campaign-session.ts:167-184`. As described in Layer 3 above. Age > 5 min AND no agent → mark incomplete + emit error.

### 2. Subscribe (interactive)

`campaign-session.ts:1141-1150`. When client reconnects and DO is in a stuck state:

```
restoreSession() → sessionId, campaignId, isGenerating=true from storage
D1 says campaign status='generating'
!this.sandbox ← no connection was restored
→ mark incomplete, clear persisted session, send error to THIS socket:
  "Reconnected! Looks like things got interrupted — your work's saved tho, just send that again"
```

This path fires the moment the user returns to a page after the DO was evicted mid-generation. No waiting for alarm; instant recovery with a friendly prompt to retry.

### 3. Pre-generate safety net

`campaign-session.ts:721-728` (generate) and `875-882` (follow_up). When a new `generate` or `follow_up` arrives while `isGenerating=true`:

```
if !this.sandbox:
  isGenerating = false
  D1 status → 'incomplete'
  clearPersistedSession()
  // fall through and let the new request proceed
else:
  reject with "A generation is already in progress"
```

Without this, a zombie would permanently block the user — they can't start a new gen and there's nothing to cancel.

Also: `restoreSession()` does a zombie check at `campaign-session.ts:586-608` — if storage says `isGenerating=true` but the in-memory sandbox is null, immediately reset and flip D1 to incomplete.

---

## Alarm — full cycle

```
startKeepAlive()  ─→  state.storage.setAlarm(now + 10s)

alarm():
  alarmIteration++
  flushTailLogs()                    ← makes fire-and-forget console.log visible
  restoreSession() if !campaignId
  if !isGenerating || !campaignId → return  (no reschedule, self-terminate)

  if age > 2h → safetyNet (mark incomplete, friendly error)
  if !sandbox && !setupInProgress && userId → reconnect sandbox
  if !agentProcessId && !setupInProgress && age > 5min → zombie detect

  if sandbox:
    if agentProcessId:
      listProcesses() → alive?
        NO → tryFinalize
              success → exit, finalized after crash
              failure → mark incomplete, "creative engine wandered off"
      catch "object to be reset"/"Network connection lost" → fatal sandbox error
    getProcessLogs → trace delta

    tryFinalize one more time  (turn-result.json may have landed)

  if isGenerating: setAlarm(now + 10s)
```

**Alarm never double-finalizes** — `finalizeGeneration` checks `isGenerating` at the top and returns early if another layer already set it to false.

---

## Cancel flow

`handleCancel` at `campaign-session.ts:1086-1103` is minimal by design:

```
1. abortController.abort()   ← only sets signal
2. currentLogStream.cancel()  ← unblocks streamForLiveUI's for-await immediately
3. sendWS('ack: Cancel requested')
```

Does NOT kill processes or touch D1. Why: during setup, `agentProcessId` might still reference the previous campaign's agent — killing it there would kill the wrong thing. Only the generation function knows which agent it started.

The cancellation cleanup happens in `runGeneration` / `runFollowUpFast` `finally` blocks (`campaign-session.ts:1616-1636`, `1698-1719`):

```
if wasCancelled:
  recordCancelledUsage(campaignId)
  isGenerating = false
  killProcess(agentProcessId) + storage.delete('agentProcessId', 'agentCampaignId')
  unmountBucket('/mnt/r2')
  clearPersistedSession()
```

Race condition fixed in Session 29: previously `handleCancel` killed `agentProcessId` directly. During setup, `agentProcessId` still pointed at the PREVIOUS campaign's agent. Cancel killed the wrong agent, new agent started after cancel, held the R2 mount, blocked all future generations. Fix: cancel only sets signal, generation functions own their cleanup.

---

## Subscribe / recovery

`handleSubscribe(ws, sessionId, lastEventId)` at `campaign-session.ts:1105-1182`.

```
1. Requires sessionId  (else send error to THIS ws, return)
2. If !eventBuffer.hasEvents() → assume DO reset, restoreSession()
   - if !restored OR session mismatch → error "Session not found or expired"
   - Staleness check against D1: campaign.status still 'generating'?
     - NO → clear session, send error, return
     - YES + no sandbox → ZOMBIE (see zombie.2 above), send friendly error
     - YES + sandbox → startKeepAlive() to resume monitoring
3. Replay eventBuffer.getEventsSince(lastEventId) to THIS ws only (sendToWS)
4. Send 'subscribed' confirmation (targeted)
```

**Multi-tab**: replay goes only to the reconnecting tab via `sendToWS(ws, ...)`. Other tabs already received those events in real time. New `emitEvent` calls go to everyone.

Deltas (`text_delta`/`text_start`/`text_end`) are NOT in the event buffer — reconnecting loses any mid-turn tokens. Assembled text is persisted to D1 so the full assistant message is still retrievable on page reload via `/api/campaigns/:id`.

---

## RPC safety — `timedRPC`

`campaign-session.ts:83-99`. Every `sandbox.*` call is wrapped:

```ts
timedRPC(label, fn, timeoutMs = 60_000)
  trace('rpc.start')
  Promise.race([ fn(), setTimeout(60s → reject) ])
  trace('rpc.done', { ms })   or   'rpc.error', { ms, err }
```

Why 60s: the Sandbox DO cancels in-flight RPCs when a second `getSandbox()` connection arrives. Without a timeout, that cancellation manifests as a hang — `setupSandbox` never returns, catch block never runs, `isGenerating` stuck at true forever.

Observed RPC times: most <500ms. `mountBucket` ~365ms. `preflight` ~700ms. Anything > 5s indicates real trouble; > 60s hits the timeout.

---

## Helpers quick-reference

| Method | Purpose |
|---|---|
| `emitEvent(event)` | Buffer in EventBuffer + broadcast to all WS. For durable events. |
| `sendWS(event)` | Broadcast, no buffer. For deltas + ephemeral. |
| `sendToWS(ws, event)` | Targeted send. Replay + per-socket errors. |
| `persistSession()` | Write `activeSession` to storage. Called after every state change. |
| `restoreSession()` | Read back from storage; includes D1 staleness + zombie checks. |
| `clearPersistedSession()` | Delete `activeSession` (NOT `userId` — that must survive). |
| `tryFinalize(campaignId, sessionId)` | Read `/app/turn-result.json`, validate, finalize if match. Returns boolean. |
| `finalizeGeneration(campaignId, sessionId, turnResult)` | D1 writes + credits + `complete` event. Guarded by `isGenerating`. |
| `recordCancelledUsage(campaignId)` | Per-image charge on cancel. |
| `isAgentProcessAlive(sandbox)` | `listProcesses` + `/app/agent-status.json` check. Returns false if `processing` (previous turn). |
| `resolveAssetUrls(assetFileIds)` | For each file ID: fal.storage.upload → returns `falUrls` + sandbox `Read` paths. |
| `log(msg)` / `flushTailLogs()` | Buffer logs, flush in alarm (500 max, trim to 250). |
| `trace(component, action, data?)` | Structured diagnostics, goes through `log()`. |
| `createStreamingContext(campaignId, label)` | Builds `ParserContext` with `imageCounter`, `preGenImageCount`, block builder. |

---

## Critical gotchas

1. **DO resets lose all in-memory state.** Code deploys trigger resets. Persist to `state.storage` for anything that must survive.
2. **`this.userId` is set from headers only during `fetch()`.** After reset, `webSocketMessage` has no headers. That's why we persist immediately on `fetch` and `restoreSession` reads it back.
3. **`waitUntil()` is a no-op in DOs.** The alarm is the only way to keep a DO alive during fire-and-forget work.
4. **WebSocket close does NOT stop generation.** Events buffer, client reconnects, everything resumes.
5. **One DO per user, not per campaign.** `idFromName(userId)`. `isGenerating` is a per-user lock — a user cannot run two generations in parallel.
6. **`file.content`, not `file.contents`.** `sandbox.readFile()` returns `{content}`. The `s`-plural typo caused weeks of silent failures (Session 31 fix).
7. **Two `getSandbox()` connections cancel each other's RPCs.** The Sandbox DO treats a second connection as a replacement. `sandboxSetupInProgress` flag is what prevents the alarm from creating a competing connection during setup.
8. **`streamProcessLogs` replays entire history.** Every call yields accumulated stdout from process start. Needed the `turn_start` sentinel for follow-up replay-skipping.
9. **SDK JSONL via s3fs corrupts with null bytes.** `RESUME_SDK_SESSION_ID` is always empty string on Cloudflare. Context recovery = D1 file hydration + conversation history injection.
10. **`agentCampaignId` must match for fast path.** The running agent's conversation has one campaign's context. Feeding it another campaign's follow-up prompt produces wrong answers. Cold-start with the right context instead.
11. **`turn-result.json` can be stale across campaigns OR turns.** `tryFinalize` validates both `campaignId` AND `requestId` — skips stale results.
12. **HOME is `/root`** since Session 58 — not `/mnt/r2`. Setting HOME to the R2 mount pinned the FUSE mount via shell history files.
13. **Cancel does NOT kill processes.** It only sets the abort signal. The generation function's finally block does the cleanup.
14. **Pre-flight credit check runs BEFORE campaign creation.** Avoids orphan campaigns in `generating` state for users with 0 credits.
15. **Alarm interval is 10s.** Not 30s. Short because sandbox RPCs can take seconds — we want rapid liveness checks.
16. **Zombie threshold is 5 min.** Long enough for cold-start sandbox setup to finish, short enough to surface real failures before users give up.

---

## Observed timing

| Operation | Typical |
|---|---|
| DO `fetch()` → WS accepted | < 50 ms |
| `setupSandbox` cold start | 2.5–3 min (dominated by Claude CLI init in container) |
| `setupSandbox` warm container | ~3 s (just pre-flight + mount + startProcess) |
| Single turn (warm path) | 30–60 s |
| Initial generation (cold) | ~5 min |
| `tryFinalize` (happy path) | < 200 ms |
| `mountBucket` / `unmountBucket` | ~365 ms each |
| `listProcesses` | 50–150 ms |
| `getProcessLogs` | 100–500 ms depending on stdout size |
| `streamProcessLogs` first frame | 50–300 ms |

---

## See Also

- [Streaming Pipeline](./STREAMING_PIPELINE.md) — Stage 2+3 of the generation flow (`streamForLiveUI` + parser)
- [DO State Machine](./DO_STATE_MACHINE.md) — Visual state transitions, zombie state, race conditions
- [Sandbox Container](./SANDBOX_CONTAINER.md) — Container lifecycle, FUSE mount, agent-runner entry
- [Billing](../shared/BILLING.md) — Two-pool credits, `recordUsage` idempotency, refund routing
- [D1 Database](./D1_DATABASE.md) — `campaigns`, `campaign_files`, `campaign_images`, `messages`, `usage_log`
- [Error Propagation](../shared/ERROR_PROPAGATION.md) — Friendly error copy, fatal sandbox errors
- [Known Issues](../ops/KNOWN_ISSUES.md) — SSE frame splits, local dev streaming gap
