# Session 67 — Streaming Resilience & DO Reset Recovery (2026-04-06)

## Overview
Deep debugging session focused on streaming duplication, truncation, cancel flow, and DO reset recovery. Multiple deploys to staging, extensive log analysis. No production changes.

## Commits (all on `new-ui` branch)

| Commit | Description |
|--------|-------------|
| `f68d8fb` | Duplication fix (`turnDone`), cancel unblock (`currentLogStream`), diagnostic logging |
| `6c60051` | Client streaming improvements from Session 66 (RAF buffer flush, `mergeAndStripTextBlocks`, simplified `appendTextDelta`) |
| `a9613ec` | Post-streaming `tryFinalize` — eliminates alarm race on follow-ups |
| `29d0d66` | Zombie detection — reset `isGenerating` when `sandbox=null` in `restoreSession`, `handleGenerate`, `handleFollowUp` |
| `1e8d059` | Fatal sandbox error recovery — alarm detects "object to be reset", cleans up immediately |
| `6ea7e7e` | Friendly error messages + connection status banner |
| `d94926d` | Zombie recovery on subscribe — notify client when generation was interrupted after DO reset |

## What Was Fixed

### 1. Duplication Bug (FIXED, VERIFIED)
**Problem:** `streamForLiveUI` had a `break` on `turn_complete` that only exited the inner `for (const line of lines)` loop, not the outer `for await (const event of parseSSEStream(logStream))` loop. Each follow-up added another concurrent stream reader → N+1x duplication.

**Fix:** `turnDone` flag that breaks both loops.

### 2. Cancel Not Unblocking `streamForLiveUI` (FIXED, VERIFIED)
**Problem:** `handleCancel` set the abort signal, but `streamForLiveUI` was stuck on `for await` waiting for SSE events. The abort check only runs between events. If no events arrive (dead stream), cancel never takes effect → `isGenerating` stays true.

**Fix:** Store `currentLogStream` reference on the class. `handleCancel` calls `stream.cancel()` which breaks the `for await` immediately. Reference cleared in `finally` blocks.

### 3. Alarm Race on Follow-ups (FIXED, VERIFIED)
**Problem:** After `streamForLiveUI` exits on `turn_complete`, `gen-fast` returned but `isGenerating` stayed true. The alarm (10s interval) was the only path to call `tryFinalize` and clear `isGenerating`. If user sent a follow-up in that gap → "already generating".

**Root cause investigation:** The old code never had this problem because the old `break` bug meant `streamForLiveUI` never returned — it hung in the outer loop forever. The alarm was the sole finalizer by necessity, not design. Follow-ups worked because each created a new stream + new `streamForLiveUI` call (accumulating listeners = the duplication bug).

**Fix:** Call `tryFinalize()` directly after `streamForLiveUI` returns in both `runGeneration` and `runFollowUpFast`. Alarm remains as fallback. `tryFinalize` is idempotent (deletes `turn-result.json` after first call).

**Verified in logs:** `text_end` → `complete` appearing back-to-back. All follow-ups arriving with `gen=false`.

### 4. Stream Reuse Approach (REVERTED)
**Session 66 tried:** `activeLogStream` stored on DO, reused across follow-ups to avoid replay. Combined with `streamingActive` flag to gate alarm `tryFinalize`.

**Why it broke:** After `turn_complete`, the SSE stream is exhausted/EOF. Follow-ups reusing it get instant 0-line exit. `tryFinalize` fails (no `turn-result.json` yet). `gen-fast` exits with `isGenerating=true`. Everything stuck.

**Decision:** Reverted to fresh stream per follow-up (with `skipUntilRequestId` for replay). Only kept the `turnDone` fix from Session 66.

### 5. Zombie `isGenerating` After DO Reset (FIXED)
**Problem:** DO reset clears `sandbox` (live connection, not persistable) but `isGenerating=true` persists in DO storage. On restore, `isGenerating=true` but nothing can run without a sandbox → user blocked with "already generating".

**Three recovery points added:**
- `restoreSession()`: If `isGenerating=true` and `sandbox=null` → zombie, reset immediately + update D1 to `incomplete`
- `handleGenerate()`: Safety net — same check before blocking
- `handleFollowUp()`: Safety net — same check before blocking

### 6. Fatal Sandbox Error Recovery (FIXED)
**Problem:** Sandbox DO resets (from deploy propagation or platform recycling) cause all RPCs to fail with "Internal error in Durable Object storage caused object to be reset." The `sandbox` reference is non-null but dead. Alarm retries endlessly, user is stuck.

**Fix:** In alarm's `listProcesses` catch block, detect fatal error messages ("object to be reset" or "Network connection lost"). When detected:
- Set `sandbox=null`
- Send friendly error to client
- Update D1 to `incomplete`
- Clear `isGenerating`, `agentProcessId`, persisted session

**Recovery time:** ~10 seconds (one alarm tick) instead of minutes or stuck forever.

### 7. Zombie Recovery on Subscribe (FIXED)
**Problem:** After DO reset, client reconnects → `handleSubscribe` → `restoreSession` → D1 says `generating` → restarts alarm. But `sandbox=null` → alarm can't do anything useful → loops forever. Client spinner stuck.

**Fix:** In `handleSubscribe`, when D1 says `generating` but `sandbox=null`, recover immediately: update D1 to `incomplete`, clear state, send error message to client. Client receives error → stops spinner → user can resend.

### 8. Friendly Error Messages (IMPLEMENTED)
Replaced all corporate error messages with on-brand casual copy:

| Scenario | Message |
|----------|---------|
| Cancel | "No worries, scrapped that one — send a new idea whenever you're ready" |
| Sandbox fatal (alarm) | "Connection went poof but your work didn't — hit send again and we're vibing" |
| Agent died, no result | "The creative engine wandered off — your work's safe tho, give it another go" |
| 5-min zombie | "Hmm something didn't start right — your work's saved, try again and we'll nail it" |
| 2-hour timeout | "That took way too long, even for us — your work's saved, let's try a fresh start" |
| Subscribe zombie recovery | "Reconnected! Looks like things got interrupted — your work's saved tho, just send that again" |

### 9. Connection Status Banner (IMPLEMENTED)
Client-side banner in `ResultsView.tsx`:
- Reconnecting: amber banner — "Lost connection for a sec, reconnecting..."
- Disconnected (max retries): red banner — "Connection's being stubborn — try refreshing the page"
- Auto-hides when connection restores (state changes to `connected`)

### 10. Diagnostic Logging (IMPLEMENTED)
`sendWS` and `emitEvent` now log streaming events via `console.log` directly (bypasses `tailLogs` buffer):
- `[ws-send] text_start/text_delta/text_end` with delta length
- `[ws-emit] complete/error` with eventId, wsCount

This was critical for debugging — previous `this.trace()` calls were buffered in `tailLogs` and only flushed by the alarm handler, making streaming events invisible in wrangler tail.

## What Was NOT Fixed / Pending

### Truncation
- Not reproduced in this session. The `tryFinalize` after streaming may have fixed it (ensures `complete` arrives after `text_end` on same execution path). Needs clean testing without deploys interrupting.

### Missing `text_start`/`text_end` Pairs
- Observed in logs: some text blocks have `text_start` but no `text_end`, others have deltas without `text_start`. This is in the SDK message parser or agent-runner — the text block boundaries aren't always paired. Could contribute to truncation if `commitStreamingText` behaves unexpectedly with missing pairs. Not investigated further.

### Client Spinner Not Stopping on Error During Disconnect
- If the WebSocket dies between the error event being sent and the client receiving it, the client spinner stays stuck. The subscribe zombie recovery (commit `d94926d`) addresses this for the reconnect case. But if the client never reconnects (e.g., user navigates away and back), the campaign stays `incomplete` in D1 and loads correctly without spinner.

## Key Discoveries

### `this.sandbox` Can Be Non-Null But Dead
After a Sandbox DO reset, the `sandbox` reference in CampaignSession memory still exists (it's a JS object). But the underlying Durable Object connection is severed. All RPCs through it fail with "Internal error in Durable Object storage caused object to be reset." Our zombie checks must not rely solely on `sandbox === null` — they also need to handle the "dead reference" case via RPC error detection.

### Deploy Propagation Is Unpredictable
Cloudflare deploys have two phases (Worker code + container image). Each can reset DOs at different times. We observed Sandbox DO resets 30+ minutes after deploy. Each deploy during testing creates cascading resets that interfere with the test. **Don't deploy while testing.**

### Wrangler Tail `tailLogs` Buffer Is Invisible During WebSocket Handlers
`this.trace()` → `this.log()` → `tailLogs[]` buffer. Only flushed by `alarm()` handler via `flushTailLogs()`. WebSocket message handlers (where streaming happens) return before the alarm fires, so all streaming traces are invisible. Fixed by using `console.log()` directly for key events.

### Auto-Reconnect Already Existed
`websocket-manager.ts` already had auto-reconnect on code 1006 (abnormal close) — up to 5 attempts with linear backoff (2s, 4s, 6s, 8s, 10s). The issue was never the reconnect itself, but the server-side state being stuck after reconnect.

### Stream Reuse After `turn_complete` Doesn't Work
The SSE stream from `streamProcessLogs()` is consumed after `turn_complete`. `for await` returns immediately with 0 lines on reuse. This is fundamental to how the Streams API works — once consumed, the reader is at EOF. Each follow-up must create a fresh stream.

## Architecture After This Session

```
Follow-up Flow (happy path):
  User sends message → handleFollowUp → isGenerating check (zombie-aware)
  → fast path (agent alive) or slow path (new sandbox)
  → streamForLiveUI (fresh stream, skip replay)
  → turnDone exits both loops
  → tryFinalize immediately (no alarm wait)
  → complete sent to client
  → isGenerating=false
  → user sends next message → repeat

DO Reset Recovery:
  DO resets → sandbox=null, in-memory state lost, storage persists
  → Client WebSocket drops (code 1006)
  → Auto-reconnect (up to 5 attempts)
  → handleSubscribe → restoreSession (zombie check: sandbox=null → reset)
  → handleSubscribe D1 check → generating + sandbox=null → zombie recovery
  → Send "Reconnected! Looks like things got interrupted..." to client
  → Client stops spinner, enables input
  → User resends → slow path → new sandbox → D1 hydration → works

Fatal Sandbox Error:
  Sandbox DO dies → RPCs fail with "object to be reset"
  → Alarm catches it within 10s
  → sandbox=null, isGenerating=false, D1→incomplete
  → Send "Connection went poof..." to client
  → Client stops spinner
  → User resends → works
```

## Files Changed

| File | Changes |
|------|---------|
| `cloudflare/src/durable-objects/campaign-session.ts` | turnDone, currentLogStream cancel, tryFinalize after streaming, zombie detection (3 places), fatal sandbox recovery, subscribe zombie recovery, friendly messages, diagnostic logging |
| `client/src/components/ResultsView.tsx` | Connection status banner (reconnecting/disconnected) |
| `client/src/store/index.ts` | RAF buffer flush, mergeAndStripTextBlocks, streamingText, simplified appendTextDelta |
| `client/src/hooks/useWebSocket.ts` | Adjusted for new appendTextDelta/commitStreamingText signatures |
| `client/src/components/chat/ChatMessage.tsx` | Rendering improvements for streamed content |
| `cloudflare/sandbox/agent-runner.ts` | Enhanced block building and text accumulation |
| `cloudflare/src/lib/sdk-message-parser.ts` | Expanded event parsing for streaming pipeline |

## Testing Notes

### What Worked
- Duplication: VERIFIED fixed — multiple follow-ups, no duplicates
- Cancel: VERIFIED — stream unblocks immediately, `isGenerating` clears
- tryFinalize after streaming: VERIFIED — `complete` arrives right after `text_end`, follow-ups accepted with `gen=false`
- Fatal sandbox recovery: VERIFIED — alarm catches error, cleans up within 10s
- Auto-reconnect: VERIFIED — client reconnects automatically after DO reset

### What Needs Testing Next Session
- Truncation: not reproduced — need clean test (no deploys during test)
- Subscribe zombie recovery message: deployed but not tested with user seeing the message
- Full generation with images → follow-up → cancel → retry flow
- Production deploy (once staging is stable)

## Deploy Commands
```bash
# Staging
cd client && npm run build:staging
cd ../cloudflare && docker logout registry.cloudflare.com; docker builder prune -af; npx wrangler deploy --env staging

# Tail (store to file)
cd cloudflare && npx wrangler tail --env staging --format json > /tmp/staging-tail.json 2>&1
```

## Current State
- **Staging:** All 7 commits deployed, version `105c3b39`
- **Production:** None of these changes deployed yet
- **Branch:** `new-ui`, pushed to origin
- **D1 staging:** Campaign `campaign_mnnbe4urbfgrqi` may still be `generating` — needs manual fix or will self-heal on next reconnect with the new zombie recovery code
