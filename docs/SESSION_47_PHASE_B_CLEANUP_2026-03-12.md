# Session 47: Phase A Bug Fix + Phase B Cleanup

**Date**: 2026-03-12
**Branch**: `new-ui`
**Previous session**: Session 46 (Phase A implementation — simplification plan)
**Status**: All changes complete, TypeScript compiles clean, not yet deployed

---

## Context

Session 46 designed and implemented Phase A of the architecture simplification: restoring the `promptStream()` generator for fast follow-ups and replacing 5 competing completion paths with 1 alarm-based path polling `turn-result.json`. After deploying Phase A, a test generation was run for "Atomberg" — it failed visually in the UI despite the backend completing successfully.

---

## Part 1: Phase A Bug Fix — Stream Error Killing Client UI

### Symptom

After deploying Phase A, a test generation showed "(Error)" in the client UI at ~7:23 PM with the message: "Error: ReadableStream received over RPC disconnected prematurely." The generation was still running in the sandbox and eventually completed at ~7:29 PM (verified in D1: status=complete, 2 images, 3 files, 2650-char assistant message). But the client never showed the result.

### Root Cause Analysis

**Timeline from `log-4.md` (wrangler tail):**

| Time | Event |
|------|-------|
| 7:16:53 | Browser connects via WS, Clerk auth succeeds |
| 7:17:46 | `handleGenerate()` fires |
| 7:17:50–7:18:05 | Sandbox setup: unmount → mount R2, IP test (200 OK, IP 104.28.153.95), clean workspace |
| 7:18:06 | Agent process started (pid 378), SSE stream opens, alarm starts 10s polling |
| 7:18:06–7:19:46 | Everything working — agent produces research, hooks, starts art direction. Client shows real-time progress |
| 7:19:46 | Client WS disconnects (code 1006 "without Close frame") — likely DO reset or Cloudflare edge timeout |
| 7:20:52 | Two alarm exceptions (transient sandbox RPC failure during `listProcesses` or `readFile`) |
| 7:22:49 | Alarms resume OK, self-healed |
| 7:23:29 | **SSE stream dies**: "ReadableStream received over RPC disconnected prematurely" — DO's `streamProcessLogs()` RPC connection to sandbox broke after ~5 min |
| 7:23:29 | `runGeneration` catch block emits `{ type: 'error' }` to client |
| 7:23:29 | Client receives error → `failGeneration()` → campaign status='error', `generatingCampaignId=null`, message content overwritten |
| 7:23:29+ | Alarms continue polling. Agent still running in sandbox |
| ~7:29 | Agent finishes → writes `turn-result.json` → alarm calls `finalizeGeneration()` → saves to D1. But client already in terminal error state |

**The bug**: Line 1151 of `campaign-session.ts` in the stream error catch block:
```typescript
// Comment says: "Stream error is non-fatal — alarm handles completion"
// But then immediately does:
this.emitEvent({ type: 'error', ... }); // ← tells client it's fatal!
```

The comment and code contradicted each other. The `emitEvent` sent `type: 'error'` to the client which triggered `failGeneration()` in the Zustand store — setting campaign status to 'error', clearing `generatingCampaignId`, and overwriting chat message content with the error text. Even when the alarm later sent `type: 'complete'`, the client had already torn down its session tracking.

**D1 verification confirmed backend succeeded:**
- Campaign status: `complete`
- Assistant message: 2,650 chars content + 2,568 chars blocks
- Images: 2 (infographic + product photography)
- Files: research (4,774 chars), hooks (5,619 chars), prompts (14,164 chars)
- Timeline: Started 13:47:49, completed 13:59:22 = ~11.5 min total

### Root Cause of the RPC Disconnect

Research across 3 parallel agents (Cloudflare docs, GitHub issues, SDK source code) identified:

**The error originates from workerd's `ExplicitEndInputPipeAdapter`** (`readable.c++`). When a `ReadableStream` is sent over RPC, workerd creates a pipe pair. If the writing side is destroyed without calling `end()`, the reader throws "disconnected prematurely." This happens when:

1. **DO IoContext destruction** — Most likely cause. WS disconnect at 7:19:46 (code 1006) suggests a DO reset. The old IoContext is torn down, severing the RPC stream. The error surfaced at 7:23:29 because the RPC pipe buffers before detecting the break.

2. **6-connection limit** (workerd issue #4471) — Workers/DOs limited to 6 concurrent connections to containers. The alarm polls `sandbox.readFile()` every 10s while `streamProcessLogs()` holds a connection. If concurrent calls approach 6, Cloudflare cancels the least-recently-used (the stream).

3. **`sleepAfter` not resetting during active streams** (containers issue #162) — `sleepAfter` timer does NOT reset during active `containerFetch()`. If sandbox was near its 2h limit, it could fire mid-stream.

4. **SDK 120s hardcoded timeout** — `@cloudflare/sandbox` has `requestTimeoutMs = 12e4` (120s) in HTTP transport. But stream lasted 5.5 min, so this is likely idle-based (resets on each chunk) in the current version.

**Conclusion**: These RPC disconnects are inherent to Cloudflare's architecture. The Phase A design correctly treats streaming as best-effort. The only mistake was emitting the error event to the client.

### Fix Applied

**`campaign-session.ts`** — `runGeneration` catch block (line 1151):
- Removed: `this.emitEvent({ type: 'error', ... })`
- Added: `this.emitEvent({ type: 'status', message: 'Live updates paused — generation still in progress...' })`

**`campaign-session.ts`** — `runFollowUpFast` catch block (line 1279):
- Same fix: replaced fatal `type: 'error'` with informational `type: 'status'`
- Removed D1 status update to 'error' and error message persistence (alarm handles the real outcome)

**`client/src/hooks/useWebSocket.ts`** — `case 'status'` handler:
- Added `else` branch to show non-cancelled status messages as a thinking block child with `variant: 'info'`
- User sees a subtle "Live updates paused..." note in the progress blocks instead of a fatal error

**What happens now when the stream dies:**
1. Stream error caught → logs "non-fatal" + sends `{ type: 'status' }` to client
2. Client shows "Live updates paused — generation still in progress..." in the thinking block
3. UI spinner continues (no error state)
4. Agent finishes → writes `turn-result.json` → alarm finalizes → client receives `{ type: 'complete' }` → UI shows result

---

## Part 2: Phase B Cleanup

### Cleanup 1: Remove R2 Completion Marker

**Why**: With alarm-based `turn-result.json` polling, the R2 marker (`/mnt/r2/completion_{campaignId}.json`) served no purpose. It was the source of the FUSE race condition (marker reappeared after R2 API delete because FUSE upload completed asynchronously).

**Changes:**
- `agent-runner.ts`: Removed `fs.writeFileSync('/mnt/r2/completion_...')`, `execSync('sync')`, and `import { execSync }`. Only writes `turn-result.json` to local disk now.
- `campaign-session.ts` `finalizeGeneration()`: Removed `R2_BUCKET.delete()` call for completion marker
- `campaign-session.ts` `handleFollowUp()`: Removed stale R2 marker deletion at start of follow-up
- `recovery.ts`: Rewritten to use D1 as source of truth. Checks for existing images/files/messages in D1 instead of reading R2 completion marker. If D1 has completion data for a stuck campaign, marks it complete and returns full campaign data.

### Cleanup 2: Fix `runGenerationLocal` Error Handler

The local dev path's catch block was wrongly copy-pasted from the sandbox path:
```typescript
// WRONG: "stream error non-fatal, alarm handles completion" — local dev has no sandbox/alarm
this.emitEvent({ type: 'status', message: 'Live updates paused...' });
```

Fixed to emit a real `type: 'error'` event and update D1 status to 'error', since in local dev there's no alarm to recover.

### Cleanup 3: Extract `setupSandbox()`

Extracted ~120 lines of sandbox orchestration from `runGeneration()` into a reusable `setupSandbox()` method:
1. Get sandbox with IP retry (3 attempts, destroy + recreate on 403)
2. Kill old agent-runner, clean stale R2 mount
3. Mount R2 bucket with s3fs
4. Clean Claude CLI auth cache
5. Pre-flight API test
6. Clean workspace (turn-result.json, generated-images.jsonl, agent files)
7. Hydrate files from D1 (for cold-start follow-ups)
8. Check abort signal
9. Start agent-runner process, persist process ID

Returns the sandbox instance. Throws `AbortError` if cancelled before agent starts.

### Cleanup 4: Extract `streamForLiveUI()`

Both `runGeneration` and `runFollowUpFast` had near-identical SSE streaming loops (parse events → line buffer → JSON parse → `processSDKMessage`). Extracted to a shared method:

```typescript
private async streamForLiveUI(
  logStream: ReadableStream,
  ctx: ParserContext,
  options?: { skipUntilRequestId?: string; label?: string },
): Promise<boolean> // returns true if cancelled
```

- `skipUntilRequestId`: If set, skips replayed stdout history until a `turn_start` message with matching requestId (used by follow-up path). 120s timeout on skip phase.
- `label`: For log messages (`[gen]` vs `[gen-fast]`)
- Returns `true` if the generation was cancelled during streaming

Also extracted `createStreamingContext()` to deduplicate the BlockBuilder/TextAccumulator/ParserContext setup that was repeated in 3 methods.

**Result:**
- `runGeneration()`: ~260 lines → ~50 lines (setup + stream + cancel handling)
- `runFollowUpFast()`: ~140 lines → ~60 lines (request ID + prompt file + stream + cancel handling)

---

## Files Changed

| File | Before | After | Delta | Changes |
|------|--------|-------|-------|---------|
| `cloudflare/src/durable-objects/campaign-session.ts` | 1,373 | 1,334 | -39 | Stream error fix, R2 marker removal, extracted `setupSandbox()` + `streamForLiveUI()` + `createStreamingContext()`, fixed local dev error handler |
| `cloudflare/sandbox/agent-runner.ts` | 318 | 299 | -19 | Removed R2 marker write + `execSync('sync')` + `execSync` import |
| `cloudflare/src/routes/recovery.ts` | 144 | 88 | -56 | Rewritten: D1 source of truth instead of R2 marker |
| `client/src/hooks/useWebSocket.ts` | — | +2 | +2 | Status message handling in `case 'status'` |

**Total: -112 lines net reduction**

---

## Architecture After Phase A+B

### Completion flow (1 path, no races)
```
Agent finishes turn
  → writes /app/turn-result.json (local disk, no FUSE)
  → stdout: turn_complete + COMPLETION:{requestId}

Alarm (every 10s)
  → sandbox.readFile('/app/turn-result.json')
  → tryFinalize() → finalizeGeneration()
    → reconcile images (dedup against D1)
    → reconcile files
    → save assistant message (dedup check)
    → emit { type: 'complete' }
    → update D1 status → complete
    → isGenerating = false
```

### Streaming flow (best-effort, for live UI only)
```
DO → sandbox.streamProcessLogs(processId)
  → parseSSEStream → line buffer → JSON parse
  → processSDKMessage → emitEvent → WebSocket → client

If stream dies:
  → log "non-fatal"
  → emit { type: 'status', message: 'Live updates paused...' }
  → client shows info note, keeps spinner
  → alarm handles completion when agent finishes
```

### Methods in campaign-session.ts
```
alarm()                    — 10s heartbeat: crash detection + turn-result.json polling
tryFinalize()              — Read turn-result.json, verify requestId, call finalizeGeneration
finalizeGeneration()       — Single reconciliation path: images, files, message, complete event

setupSandbox()             — IP retry, R2 mount, workspace prep, start agent
streamForLiveUI()          — Shared SSE streaming loop (best-effort)
createStreamingContext()   — BlockBuilder + ParserContext factory

runGeneration()            — Setup sandbox + stream (50 lines)
runFollowUpFast()          — Write prompt file + stream with replay skip (60 lines)
runGenerationLocal()       — Local dev path (in-process SDK)

handleGenerate()           — Create campaign, fire-and-forget runGeneration
handleFollowUp()           — Fast/slow path decision, fire-and-forget
handleCancel()             — Set abort signal only

isAgentProcessAlive()      — Process list + status file check
persistSession()           — Save to DO storage
restoreSession()           — Load from DO storage + staleness check
```

---

## What's Left (Not In Scope)

- **Deploy + test**: Changes compile clean but need deploy (`docker builder prune -af && cd cloudflare && npx wrangler deploy`) and end-to-end test
- **`promptStream()` generator verification**: Phase A's generator pattern needs testing — if SDK doesn't support multi-yield, follow-ups will fail silently (stdout freezes after `turn_start`)
- **`generationCompleted` var unused**: In `runGeneration()`, the old `generationCompleted` flag was removed since alarm handles completion. The `runGenerationLocal()` path still uses it (correctly, since local has no alarm)
- **Duplicate log line**: `setupSandbox()` logs agent process start once (was logged twice in old code — "id=..., pid=..." and "id=...")
- **Container version warning**: Logs show "Container version could not be determined" with SDK 0.7.8 check — cosmetic, doesn't affect functionality
