# Session 48: Phase A+B Deploy + Test

**Date**: 2026-03-12
**Branch**: `new-ui`
**Previous session**: Session 47 (Phase A bug fix + Phase B cleanup)
**Status**: Generation completes but multiple issues found — needs investigation

---

## What Was Deployed

Session 47 changes (Phase A+B):
- **Stream error fix**: `type: 'error'` → `type: 'status'` in `runGeneration` and `runFollowUpFast` catch blocks
- **R2 completion marker removed**: agent-runner only writes `turn-result.json` (local disk), no R2 marker
- **recovery.ts rewritten**: D1 as source of truth, no R2 dependency
- **`setupSandbox()` extracted**: ~120 lines → reusable method
- **`streamForLiveUI()` extracted**: shared SSE streaming loop
- **`createStreamingContext()` extracted**: BlockBuilder/ParserContext factory
- **`runGenerationLocal` error handler fixed**: emits real `type: 'error'` for local dev (no alarm to recover)

## Deploy Notes

- **Two deploys happened**: First timed out (2-min default), second succeeded
- **Docker image was CACHED**: `COPY agent-runner.ts ...` layer showed `CACHED`, "Image already exists remotely, skipping push"
- **Container code concern**: `git diff cloudflare/sandbox/agent-runner.ts` shows large uncommitted changes (BlockBuilder, promptStream generator, writeCompletionMarker, file-based IPC). BUT `turn-result.json` (13,881 chars) was successfully written by the agent, so the container code IS functional for basic generation
- **Deploy command used**: `cd client && npm run build && docker logout registry.cloudflare.com; docker builder prune -af; cd cloudflare && npx wrangler deploy`

## Test: Initial Generation

**Prompt**: "create 2 ads for https://longwayindia.com/"
**User**: `user_38uxIJdRftKkSkstogHasnk6c2J` (new email, new container sandbox `3fa62...`)
**Campaign**: `campaign_mmnmfyfk09zwgg`

### Timeline (from wrangler tail)

IMPORTANT: wrangler tail output is **NOT chronological**. Events appear out of order. Timestamps in the `@ time` suffix are when the event COMPLETED, not when it started. The `startProcess` call (timestamp 8:57:35) appeared at line 314 of the log — after events from 9:05+.

| Time | Event | Log line(s) |
|------|-------|-------------|
| 8:54:26 | Deploy caused DO reset for old user `user_3ANz...` | 14, 24 |
| 8:56:46 | New sandbox `3fa62...` initialized | 27-28 |
| 8:56:49 | Page load: GET /api/campaigns, assets/folders | 30-33 |
| 8:56:50 | WS generate message received | 37 |
| 8:57:20 | `setupSandbox()` begins: getSandbox, cleanupProcesses, pkill | 39-42 |
| 8:57:22 | unmountBucket → mountBucket (R2 mounted OK) | 44-54 |
| 8:57:23 | Auth cache cleaned | 58, 60 |
| 8:57:33 | Pre-flight API test: `WITH_KEY=200`, IP=`104.28.162.23` | 62-63 |
| 8:57:35 | Workspace cleaned (turn-result.json, agent files) | 64-67 |
| **8:57:35** | **`startProcess`** — agent-runner pid=375, id=`proc_1773329255298_m49tyh` | **314-315** |
| **8:57:35** | **`streamProcessLogs`** — SSE stream opened | **324-325** |
| 8:57:35→9:05:37 | ~8 min streaming — client receives live SDK messages | |
| **9:05:37** | **Stream died**: "ReadableStream received over RPC disconnected prematurely" | **293** |
| 9:05:37 | Phase A fix: emitted `type: 'status'` → "Live updates paused..." | 293 |
| 9:05:37→9:10:58 | ~5.5 min blind spot — alarm polling, agent still running, no client updates | 332-372 |
| 9:09:57 | Alarm exception (transient sandbox RPC hiccup) | 373 |
| **9:10:58** | **Alarm read `turn-result.json`** (13,881 chars) → finalized | **387-388** |
| 9:10:59 | Images served: 2 PNGs (`1773329801230_1_...`, `1773329801230_2_...`) | 381-384 |
| 9:11:00 | Client received complete event — images appeared in UI | 385-386 |

**Total generation time: ~13.5 min** (8:57:20 → 9:10:58)

### What the Client Showed (from screenshot)

- Thinking block: "Starting generation for Longwayindia..." → "Parsing Request" → red dot → "Live updates paused — generation still in progress..."
- Chat content: Full AI response text (research, hooks, prompts, image generation progress)
- 2 images visible at top of campaign view
- Sidebar: Research, Hooks, Prompts all populated

### Result: Generation PASSED (but slow + stream died)

---

## Test: Follow-Up

**Prompt**: "can you add content to the second image?"
**Time**: 9:11:47 PM

### Timeline

| Time | Event | Log line(s) |
|------|-------|-------------|
| 9:11:46 | `readFile` agent-status.json (53 chars) — checking if agent alive for fast path | 391-392 |
| 9:11:47 | `writeFile` next-prompt.json (124 chars) — prompt written for agent-runner | 395-396 |
| 9:11:56 | Alarm starts polling `readFile` for follow-up turn-result.json | 397+ |
| 9:12:07→9:12:47 | readFile polling continues, agent processing follow-up | 399-405 |
| **9:12:57** | **WS closed** (code 1001) — user refreshed/navigated | **410-411** |
| 9:13:00 | Page reload: campaigns + assets fetched | 406-409 |
| 9:13:01 | WS reconnected, then closed again (code 1005) | 419-420 |
| **9:13:04** | **Cancel triggered** — "Cancelling generation for session..." | **422-423** |

### Result: Follow-Up BROKEN

The follow-up prompt was written to the sandbox (`next-prompt.json`), so the agent-runner picked it up. But the user's page refresh caused WS close → reconnect → cancel, which killed the follow-up before it could complete.

**Root cause unclear** — need to investigate:
1. Did the user intentionally refresh? Or did the client auto-refresh?
2. Why did the WS close with code 1001 (going away)?
3. The cancel at 9:13:04 killed the in-flight follow-up — is the cancel handler correctly scoped to only cancel the current operation?

---

## Issues Found

### Issue 1: Slow Generation (~13.5 min for 2 images)

**Expected**: ~5 min (based on Session 6 benchmarks with standard-2)
**Actual**: 13.5 min

Possible causes:
- Cold container start (new user = new sandbox, no warm container)
- SDK CLI init overhead (~2.5 min) — this is a fresh sandbox with no cached CLI state
- Agent doing more work than expected (research + hooks + prompts + 2 images)
- Haiku model may be slower than expected for this workflow

**TODO**: Compare with previous generation timings. Check if container was truly cold vs warm.

### Issue 2: Stream Dies After ~8 Min

**Error**: "ReadableStream received over RPC disconnected prematurely" at 9:05:37

This is the same RPC disconnect documented in Session 47 (caused by DO IoContext destruction, 6-connection limit, or sleepAfter timer). The Phase A fix correctly handled it — client showed "Live updates paused" instead of fatal error.

**Impact**: 5.5-min blind spot between stream death and completion. User has no progress feedback during this time.

**TODO**: Consider re-attaching the stream after it dies (call `streamProcessLogs` again). The stream replays historical stdout, so we'd need the `skipUntilRequestId` logic from `runFollowUpFast`.

### Issue 3: Follow-Up Lost on Page Refresh

The follow-up was written to the sandbox but the page refresh triggered a cancel. The client recovery logic (localStorage session + subscribe) didn't preserve the follow-up state.

**TODO**: Investigate:
- Why did the WS close with code 1001?
- Does the recovery logic handle in-flight follow-ups?
- Should `handleCancel` check if it's cancelling the correct operation?

### Issue 4: Thinking Block Shows Only "Parsing Request"

The thinking block in the screenshot shows:
```
Starting generation for Longwayindia...
  Parsing Request (red dot)
    Live updates paused — generation still in progress...
```

But the AI text below shows full progress (research, hooks, images). This means the thinking block phases (Researching, Generating Hooks, Creating Art Direction, Generating Images) were received via stream but rendered as text content, not as thinking block children.

**Possible cause**: The `processSDKMessage` → `emitEvent` pipeline sends events to the client, but the thinking block rendering depends on specific event types (`phase`, `tool_start`, `file`, `image`). The stream content was rendered as `message` type events (text), not structured phase events.

**TODO**: Check if the stream was sending structured events (phase, tool_start) or just raw text. If the BlockBuilder wasn't extracting phases from SDK messages, the thinking block would never update.

### Issue 5: Docker Image Cache Uncertainty

The Docker build showed `CACHED` for the `COPY agent-runner.ts` layer despite `git diff` showing large changes. Two possibilities:
1. The changes match what was previously pushed (unlikely given the diff size)
2. The wrangler deploy Docker context uses a snapshot that doesn't include working tree changes

The generation succeeded (turn-result.json written), so the deployed code IS functional. But we need to verify that the latest agent-runner.ts changes (promptStream generator, BlockBuilder, writeCompletionMarker) are actually in the container.

**TODO**: After next deploy, exec into sandbox to verify: `sandbox.exec('cat /app/dist/agent-runner.js | head -20')` or check for specific functions.

---

## Code Changes Made This Session (NOT YET DEPLOYED)

### Fix: Distinguish setup errors from stream errors

In `campaign-session.ts`, both `runGeneration` and `runFollowUpFast` catch blocks now check `this.agentProcessId`:

```typescript
// runGeneration catch block (line ~1109):
} else if (this.agentProcessId) {
  // Stream error is non-fatal — agent is still running
  this.log(`[gen] Stream error (non-fatal): ${error.message}`);
  this.emitEvent({ type: 'status', ... 'Live updates paused...' });
} else {
  // Setup failed before agent started — THIS IS FATAL
  this.log(`[gen] Setup error (fatal): ${error.message}`);
  this.emitEvent({ type: 'error', ... });
  await db.updateCampaignStatus(this.env.DB, this.campaignId, 'error');
  this.isGenerating = false;
  await this.clearPersistedSession();
}
```

Same pattern in `runFollowUpFast`.

**Rationale**: Without this, if `setupSandbox()` throws (agent never started), the catch block sends "Live updates paused..." — but there's no agent to complete, and the alarm polls forever. This didn't happen in THIS test (agent started fine) but is a latent bug.

### Diagnostic log added

In `setupSandbox()`, changed log line before `startProcess`:
```
"[gen] Starting agent-runner..." → "[gen] About to call startProcess..."
```

---

## Investigation Plan for Next Session

### Priority 1: Why is generation so slow? (13.5 min)

1. Check SDK CLI init time by looking at agent-runner stdout (first SDK message timestamp vs process start)
2. Compare with Session 6/7 generation times
3. Check if cold container start adds significant overhead
4. Consider: is the container image size bloated? Does it need pre-warming?

### Priority 2: Verify Docker image contents

1. Exec into sandbox: `sandbox.exec('cat /app/dist/agent-runner.js | grep promptStream')`
2. If `promptStream` is NOT found, the container has old code and we need to force rebuild
3. Try: `docker system prune -a --volumes` + add a dummy `ARG CACHE_BUST=<timestamp>` to Dockerfile before COPY

### Priority 3: Follow-up broken

1. Test follow-up WITHOUT refreshing the page
2. Check WS close code 1001 — is the client triggering this?
3. Review recovery logic for follow-up state preservation
4. Check if cancel handler is killing the correct agent process

### Priority 4: Thinking block not updating

1. Check what event types the stream sends during generation
2. Verify BlockBuilder phases are being emitted as structured events (not just text)
3. Compare with what `useWebSocket.ts` expects for phase/tool_start/file/image events

### Priority 5: Stream re-attach after RPC disconnect

1. In the `runGeneration` catch block, after logging non-fatal, try re-attaching `streamProcessLogs`
2. Use `skipUntilRequestId` pattern to skip replayed history
3. Risk: reconnect may also fail immediately (same RPC issue)

---

## Files Changed This Session

| File | Change | Status |
|------|--------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | Setup error detection in catch blocks | NOT DEPLOYED |
| `cloudflare/src/durable-objects/campaign-session.ts` | Diagnostic log before startProcess | NOT DEPLOYED |

---

## Key Learnings

1. **wrangler tail is NOT chronological**: Events appear in arbitrary order. `Sandbox.startProcess` (8:57:35) appeared at log line 314 after events from 9:05+. Always use the timestamp suffix, not line position.

2. **Phase A fix works**: "Live updates paused" correctly replaced the fatal error. Generation completed via alarm. But the 5.5-min blind spot is a bad UX.

3. **Docker cache is aggressive**: Even after `docker builder prune -af`, COPY layers can be cached if the content hash matches the registry. Need to verify container contents directly.

4. **Two-sandbox interleave in tail**: Old user's sandbox `63806...` and new user's sandbox `3fa62...` events interleave in the same tail output. Must filter by sandboxId to trace a single generation.
