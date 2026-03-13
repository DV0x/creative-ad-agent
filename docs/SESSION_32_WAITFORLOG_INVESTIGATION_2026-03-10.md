# Session 32: waitForLog Investigation — 2026-03-10

**Date:** 2026-03-10
**Branch:** `new-ui`
**Prior version:** Session 31 (not deployed at start of session)

## Context

Session 31 designed a new completion architecture: `waitForLog('turn_complete')` as the single completion path, with streaming as best-effort UI only. This session deployed it, tested it, and uncovered a critical failure mode.

## Deploys This Session

| Version | Changes |
|---------|---------|
| `d61416ef` | Session 31 changes: `attachCompletionHandler` with `waitForLog`, fixed `file.contents` → `file.content` (3 places), orchestrator prompt URL optional, removed alarm polling |
| `7c7d1784` | `attachStreamHandler()` for stream re-attach, timeout 600s→900s, alarm + handleSubscribe re-attach streaming on reconnect |

## Test 1: Initial generation (`campaign_mmjfnkiob8oqlc`)

- Deploy `d61416ef` caused DO reset mid-generation from previous session
- New generation started on fresh DO instance
- `waitForLog` attached to process `proc_1773076090098_el03io`
- Alarm heartbeats ran normally
- **Result:** `waitForLog` timed out at 600s → campaign marked `incomplete`
- D1: 1 image (from stream), no assistant message
- User tried follow-up before timeout → got "generation already in progress"

**Root cause:** Generation took longer than 600s timeout, OR `waitForLog` never saw `turn_complete` due to RPC disconnect from deploy.

## Test 2: Fresh generation (`campaign_mmjhc532qhpnlb`)

- Version `7c7d1784` deployed
- Generation started at 23:23, process `proc_1773078816488_ys1m4p`
- Agent completed research → hooks → prompts → 1 image (all saved to D1 via stream except image)
- User refreshed browser at ~23:26 (WS closed code 1001)
- `[stream-reattach]` fired twice after refresh
- **Container errors at 23:29:**
  - `"Failed to execute streaming command"` — `TypeError: Invalid state: Controller is already closed`
  - `"Error during background streaming"` — same root cause
- `waitForLog` died silently — no error in any log
- Agent completed successfully — completion marker written to R2 with image
- D1 never updated — status stuck at `generating` forever
- On refresh: chat messages gone (client skips messages for `generating` campaigns)

### Verification

- **R2 completion marker exists:** `completion_campaign_mmjhc532qhpnlb.json` — `status: "complete"`, 1 image listed
- **R2 image exists:** `1773079148175_1_create_a_bold_fintech_style_ad_visual_for_theratef.png` (5.5MB)
- **D1:** research (6KB), hooks (2KB), prompts (3KB) saved. 0 images, no assistant message, status `generating`
- **Container logs (Cloudflare dashboard → Containers → Logs):** 83 success events, 2 errors (both streaming-related)

## Root Cause Analysis

### How `waitForLog` works internally (from SDK source)

1. First checks existing logs via `getProcessLogs()` — if pattern already in stdout, resolves immediately
2. Opens SSE stream via `streamProcessLogs()` (HTTP GET to container `/api/process/{id}/stream`)
3. Iterates with `for await` over `parseSSEStream(stream)`, checking each chunk for pattern
4. Timeout via `Promise.race([streamProcessor(), setTimeout(900_000)])`

### Three failure modes

| Scenario | Behavior |
|----------|----------|
| DO reset/hibernation | Promise is garbage collected — ceases to exist. Alarm can re-attach on next fire |
| Container process exits | Promise rejects properly (`ProcessExitedBeforeReadyError`) |
| **Silent TCP/RPC drop** | `reader.read()` hangs forever — no error, no reject, just blocks until timeout fires |

### What happened in Test 2

1. Browser refresh at 23:26 broke the RPC connection between DO and container
2. Container-side streaming controller became invalid ("Controller is already closed")
3. `streamProcessLogs` stream died → container logged 2 errors
4. `waitForLog`'s internal `reader.read()` hung silently — no reject, no error
5. Agent finished and printed `turn_complete` at ~23:30, wrote completion marker to R2
6. Nobody was listening — `waitForLog` was hung on dead connection
7. 900s timeout would have eventually fired (~23:38), but user tried follow-up before that
8. Campaign stuck at `generating` — staleness check sees D1 agrees → no reset

### Why the alarm didn't help

The alarm re-attach only triggers when `!this.sandbox` (DO reset case). In this test, the DO stayed alive (no reset), so `this.sandbox` was still set. The alarm saw the sandbox reference existed and skipped the reconnect block. It didn't know the underlying RPC connection was dead.

## Code Changes (partially deployed, partially pending)

### Deployed in `7c7d1784`

- `attachStreamHandler()` — fire-and-forget stream re-attach after DO reset or browser refresh
- `waitForLog` timeout: 600s → 900s
- Alarm: re-attaches both `waitForLog` + streaming after DO reset
- `handleSubscribe`: eagerly reconnects sandbox + re-attaches on client reconnect
- `handleSubscribe`: re-attaches streaming for browser refresh (no DO reset)

### Written but NOT deployed

1. **`attachCompletionHandler` cleanup on failure:** When `getProcess()` returns null or throws, now marks campaign `incomplete` and sets `isGenerating = false`. Previously silently swallowed these errors → campaign stuck forever.

2. **20-minute safety net in alarm:** If `generationStartedAt` exceeds 20 min, force-mark `incomplete` and stop alarm. Prevents infinite stuck state.

3. **`generationStartedAt` tracking:** New instance var, persisted in `activeSession` storage, set when `isGenerating = true`.

## Key SDK Findings (from research)

- **HTTP transport (our config):** `connect()`/`disconnect()` are no-ops. `isConnected()` always returns `true`. No heartbeat, no keepalive, no idle detection on SSE streams
- **WebSocket transport (alternative):** Has better failure detection — `handleClose` explicitly errors all pending streams. Trade-off: single persistent connection
- **`waitForLog` re-attach works:** If called again after disconnect, it checks existing logs first via `getProcessLogs()`. If `turn_complete` was already printed, finds it immediately and resolves
- **No SDK reconnection:** SDK has no automatic reconnection for broken streams. Must be handled at application level
- **Each `streamProcessLogs` call = separate HTTP connection.** `waitForLog` and `attachStreamHandler` are independent streams

## Recommendations for Next Session

### Fix 1: Alarm-based file polling (recommended — most resilient)

Add a third completion path in the alarm handler: every 30s, check for the R2 completion marker (`completion_{campaignId}.json`). If found, sync images/files to D1 and complete. This is independent of any streaming connection.

```
Alarm (every 30s):
  1. Safety net: generation > 20 min → mark incomplete
  2. If isGenerating && sandbox:
     a. Try readFile('/app/turn-result.json') or check R2 marker
     b. If found → reconcile + complete (same as waitForLog .then())
  3. Re-attach waitForLog + stream if sandbox was lost
```

### Fix 2: Idle timeout wrapper for `waitForLog`

Don't rely solely on the 900s timeout. Add a secondary "no data received" timeout (e.g., 120s). If the internal stream goes silent for 120s, abort and re-attach.

### Fix 3: Client auto-recovery for stale `generating` campaigns

Currently client only auto-recovers `incomplete` campaigns. Should also check `generating` campaigns that haven't updated in > 10 min → call `/recover` endpoint.

### Fix 4: Don't skip messages on refresh for `generating` campaigns

The client message loading filter (App.tsx lines 93-96) excludes messages for `generating` campaigns assuming WS recovery will provide them. Should still show existing D1 messages as a fallback.

### Fix 5: Deploy pending code changes

The `getProcess` null/error cleanup and 20-minute safety net are written but not deployed.

## Files Changed (pending deploy)

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | `attachCompletionHandler` cleanup on null/error, 20-min safety net in alarm, `generationStartedAt` tracking + persistence, `attachStreamHandler` (already deployed) |

## Architecture After All Fixes

```
User sends generate/follow-up
        │
        ├──→ Stream (best-effort live UI)
        │     May die on refresh/disconnect — cosmetic only
        │
        ├──→ waitForLog('turn_complete', 900s)
        │     Primary completion path
        │     Can die on RPC disconnect — 900s timeout fallback
        │
        └──→ Alarm polling (every 30s) — NEW
              Checks R2 completion marker or turn-result.json
              Completely independent of streaming connections
              Ultimate safety net — always works if agent completed

Alarm (every 30s):
  - Safety net: generation > 20 min → mark incomplete
  - Poll completion marker → reconcile + complete
  - Re-attach waitForLog + stream if sandbox lost
  - Keep DO alive (prevent hibernation)
```

## Key Lessons

1. **`waitForLog` is not reliable across RPC disconnects.** It hangs silently on dead TCP connections. Must have a fallback.
2. **HTTP SSE streams have no idle detection.** `reader.read()` blocks forever. SDK provides no heartbeat or keepalive.
3. **Container dashboard logs are useful.** Navigate to Cloudflare Dashboard → Containers → [app] → Logs tab. Shows errors not visible in `wrangler tail`.
4. **Three completion paths > one.** Stream (fast, fragile) + waitForLog (reliable, can hang) + alarm poll (slow, bulletproof).
5. **Client should never hide existing messages.** Even for `generating` campaigns, show what D1 has.
