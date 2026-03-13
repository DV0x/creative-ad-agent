# Session 49: Stuck Generation Investigation

**Date**: 2026-03-12
**Branch**: `new-ui`
**Previous session**: Session 48 (Deploy + Test)
**Status**: Generation stuck — root cause NOT fully determined, needs deeper investigation

---

## What Was Deployed

Session 47-48 changes (first clean deploy — Docker cache pruned, fresh image `bb29ba43`):
- `setupSandbox()` extracted (~120 lines → reusable method)
- `streamForLiveUI()` extracted (shared SSE streaming loop)
- `createStreamingContext()` extracted (BlockBuilder/ParserContext factory)
- Setup-vs-stream error detection in `runGeneration` and `runFollowUpFast` catch blocks
- All container code freshly built (no Docker cache — previous deploys had CACHED layers)

Deploy completed successfully. User waited **20+ minutes** before testing.

---

## Test: New Generation

**Prompt**: "create two ads for https://www.snitch.co.in/"
**Campaign**: `campaign_mmnqf0nf68c6tw`
**User**: `user_3ANzBpk1WdE1QZOshOLhHK8EAfI`
**Sandbox**: `63806494ea45...` (reused from previous sessions)

### Timeline (from wrangler tail + D1)

| Time (local) | UTC | Event |
|------|-----|-------|
| 10:47:19 PM | 17:17:19 | Page load — ~25 campaign GETs, auth OK |
| 10:47:19 PM | 17:17:19 | WS connected, JWT verified |
| 10:47:20 PM | 17:17:20 | First WS attempt Canceled (component transition grace period) |
| 10:48:35 PM | 17:18:35 | **Generation started** — `setupSandbox()` begins |
| 10:48:35 PM | 17:18:35 | Setup: cleanupProcesses → unmountBucket → mountBucket (success) |
| 10:48:37 PM | 17:18:37 | R2 mounted, auth cache cleaned |
| 10:48:47 PM | 17:18:47 | Pre-flight API test: WITH_KEY=200 |
| 10:48:48 PM | 17:18:48 | Workspace cleaned, agent files cleaned |
| ~10:48:48 PM | ~17:18:48 | **`startProcess`** (shown as Unknown Event in tail) |
| 10:48:57 PM+ | 17:18:57+ | `Sandbox.readFile` every ~10s (alarm polling `turn-result.json`) |
| ~10:51:59 PM | 17:21:59 | **Research phase completed** — saved to D1 (`campaign_files.research`, 3,621 chars) |
| **10:52:08 PM** | **17:22:08** | **WS closed code=1006** — "disconnected without sending Close frame" |
| 10:52:41 PM | 17:22:41 | Last `Sandbox.readFile` visible in tail (tail session ended here) |
| — | — | **~28 minute gap — no visibility** |
| ~11:11 PM | ~17:41 | Container check: **0 active instances, 11 healthy (sleeping)** |
| 11:19:56 PM | 17:49:56 | Client reconnected (user likely refreshed page) |
| 11:20:10 PM | 17:50:10 | **Alarm exception**: "Network connection lost" (sandbox RPC) |
| 11:20:10 PM | 17:50:10 | "Durable Object reset because its code was updated" |
| 11:21:03 PM | 17:51:03 | New WS closed code=1006 (DO reset killed it) |
| 11:21:13 PM | 17:51:13 | Client reconnected again, subscribe handler detected DO reset |
| 11:21:14 PM | 17:51:14 | `handleSubscribe()` → "DO was reset while campaign was generating — restarting alarm" |
| 11:21:25 PM | 17:51:25 | **Alarm detected dead agent**: "Agent process proc_1773335928932_4oipny not alive" |
| 11:21:25 PM | 17:51:25 | "No completion result — marking campaign incomplete" |

### D1 State at Investigation Time

| Table | Data |
|-------|------|
| campaigns | status=`generating` → eventually `incomplete`, sdk_session_id set, updated_at=17:21:06 |
| messages | 1 user message only. No assistant message (finalizeGeneration never ran) |
| campaign_files | research=POPULATED (3,621 chars, is_ready=1). hooks=EMPTY. prompts=EMPTY |
| campaign_images | None |

---

## What We Know For Sure

### 1. The agent started and completed research successfully
- Research saved to D1 at 17:21:59 via live stream → `processSDKMessage()` → D1 write
- The agent was running and producing SDK messages for ~3 minutes

### 2. The live stream died
- `streamForLiveUI()` ran from ~17:18:48 to ~17:22:08 (~3.5 min)
- The stream ended (either RPC disconnect or normal stream close)
- The catch block in `runGeneration()` correctly handled it as non-fatal (emitted "Live updates paused")
- `runGeneration()` returned, `isGenerating` stayed `true`

### 3. The WebSocket died at 17:22:08 (code 1006)
- Code 1006 = abnormal closure, no close frame
- User did NOT refresh or navigate — this was unprompted
- The WS died ~9 seconds after the last D1 update (research save)
- Could be: DO IoContext timeout, platform-level connection cleanup, or cascading from stream RPC death

### 4. The alarm was running initially but stopped at some point
- `Sandbox.readFile` was firing every ~10s (visible in tail from 17:18:57 to 17:22:41)
- At ~17:41 UTC (checked via API): 0 active container instances → no sandbox RPC calls happening → **alarm was NOT running**
- The alarm stopped sometime between 17:22:41 and 17:41 (~18 minute window)
- **We have NO visibility into what happened during this window**

### 5. The alarm only restarted because the user reconnected
- At 17:49:56 the client reconnected and sent a `subscribe` message
- `handleSubscribe()` detected the DO was reset and called `startKeepAlive()`
- Without this client-initiated reconnect, the campaign would have been stuck at `generating` forever (until the 2h safety net... but the alarm wasn't running, so even that wouldn't fire)

### 6. Once the alarm restarted, crash detection worked correctly
- Alarm reconnected to sandbox, called `listProcesses()`
- Detected `proc_1773335928932_4oipny` was not alive
- Checked for `turn-result.json` — not found
- Correctly marked campaign as `incomplete`

---

## What We DON'T Know (Needs Investigation)

### CRITICAL: Why did the alarm stop running?

This is THE question. The alarm is the backbone of completion detection. If it stops, everything breaks.

**Possible causes (not verified):**

1. **Sandbox RPC call hung indefinitely** — If `sandbox.listProcesses()` or `sandbox.readFile()` hangs (never resolves, never rejects), the alarm handler would be stuck. Cloudflare would eventually kill it (handler timeout), and the alarm would NOT be rescheduled because `setAlarm()` on line 130 never executed. The outer catch (line 132-136) also wouldn't fire because the handler was killed externally, not via JS exception.

2. **DO was silently reset** — The "Durable Object reset because its code was updated" message appeared at 17:50:10. If an earlier reset happened (during the 17:22-17:41 gap) without a client connected to trigger `handleSubscribe()`, the alarm would die and never restart. Alarms are stored in `this.state.storage` and SHOULD survive resets, but the alarm handler needs to be invoked for it to reschedule — if the platform drops a pending alarm during a reset, it's lost.

3. **Alarm handler threw and both setAlarm calls failed** — Lines 130 and 135 both call `setAlarm()`. If both fail (storage quota? transient error?), the alarm stops. This seems unlikely but possible.

4. **`isGenerating` was set to `false` without D1 update** — If some code path set `isGenerating = false` and persisted it, the alarm would check line 72 and return without rescheduling. D1 would still show `generating` because no D1 update was made. This could happen if there's a path in `restoreSession()` that resets `isGenerating` (the staleness check catch block on lines 304-307 does this if the D1 query fails).

### Why did the WS die with code 1006?

The user didn't touch anything. The WS dropped ~9 seconds after the stream ended. This happened in the PREVIOUS test (Session 48) too — the WS closing unprompted is a recurring issue.

Possible causes:
- DO IoContext cleanup after `runGeneration()` returns (the fire-and-forget promise completed)
- Platform-level WebSocket timeout when no handler is active
- Cascading from the stream RPC disconnect

### Was the agent actually working on hooks when it was interrupted?

The research completed at 17:21:59. The hooks skill (`hook-methodology`) involves:
1. Reading the research file from disk
2. Extracting data from every section (complex multi-step prompt)
3. Writing a hooks file to disk

This process typically takes 2-5 minutes. Since the alarm was still running at 17:22:41, the agent was likely in the middle of hooks. We can't confirm because:
- The live stream was already dead (no events flowing)
- The agent's stdout was not being read
- `turn-result.json` is only written after the ENTIRE generation completes (all phases)

### Did the container go to sleep while the agent was running?

Container showed 0 active instances at ~17:41. The sandbox was created with `sleepAfter: '2h'`. An active process (`agent-runner`) should prevent the container from sleeping. But:
- If the alarm stopped calling into the sandbox, the SDK might consider the container idle
- The `sleepAfter` might be based on SDK-level interaction, not process activity inside the container
- If the container slept, the agent process would be killed

---

## Architecture Gaps Found

### Gap 1: Alarm is the single point of failure

The alarm heartbeat is the ONLY mechanism keeping the DO alive and monitoring the generation. If the alarm stops for ANY reason, the generation is stuck forever. There's no secondary watchdog.

**Current alarm chain:**
```
startKeepAlive() → alarm fires → do work → setAlarm(+10s) → alarm fires → ...
```

If any link breaks, the whole chain dies.

### Gap 2: No alarm persistence across DO resets

When a DO resets, pending `setAlarm()` calls may or may not survive (Cloudflare docs are unclear on this). The current code relies on either:
- The alarm surviving the reset (platform behavior, not guaranteed)
- A client connecting and triggering `handleSubscribe()` which calls `startKeepAlive()`

If no client connects, the alarm never restarts.

### Gap 3: Sandbox RPC calls have no timeout

`sandbox.listProcesses()` and `sandbox.readFile()` are awaited without any timeout wrapper. If they hang (network partition, container in weird state), the alarm handler is stuck. No reschedule happens.

### Gap 4: Stream death → WS death cascade

The live stream dying seems to cascade to the WS dying (code 1006) within seconds. This means the user loses ALL feedback — both live streaming and WebSocket status updates. The "Live updates paused" message may never even reach the client if the WS dies right after.

### Gap 5: No way to inspect sandbox state after the fact

There's no CLI command for container logs (`wrangler containers logs` doesn't exist). The Cloudflare dashboard has container logs but requires browser access. We can't programmatically inspect what happened inside the container after the fact.

---

## Architecture Docs Out of Date

A parallel audit found significant mismatches between `docs/architecture/` and the current code:

### Critical
- **DURABLE_OBJECT.md**: Still documents the old 4-layer completion system (waitForLog, waitForExit, R2 polling, /recover). Session 47 replaced this with single-path alarm-based polling. Entire "Completion Detection" section needs rewrite.
- **DURABLE_OBJECT.md**: Alarm interval documented as 30s, actually 10s. Instance state fields `completionRetries`, `agentProcess` don't exist. `currentRequestId` not documented.
- **SANDBOX_CONTAINER.md**: Says completion marker goes to both local disk AND R2. Session 47 removed R2 write — only `/app/turn-result.json` now.

### High
- **WEBSOCKET_PROTOCOL.md**: 5 structural errors — `complete` event missing fields, `incomplete` event schema wrong, `message` event has phantom `content` field, `image` event has confusing dual `id` fields, `status` message type not documented at all.
- **DURABLE_OBJECT.md**: `setupSandbox()`, `streamForLiveUI()`, `createStreamingContext()`, `tryFinalize()` methods not documented.

### Medium
- **STREAMING_PIPELINE.md**: Missing `skipUntilRequestId` replay-skip explanation for follow-ups. BlockBuilder line count wrong (106 → 136).
- **WEBSOCKET_CLIENT.md**: `incomplete` handler marked as "ignored" — it actually does work.
- **STATE_MANAGEMENT.md**: `isFollowUp` lifecycle not documented.

---

## Investigation Plan for Next Session

### Priority 1: Why did the alarm stop? (THE core question)

1. **Add timeout wrappers around sandbox RPC calls in alarm handler**:
   ```typescript
   // Wrap sandbox calls with a timeout to prevent alarm handler from hanging
   const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
     Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

   const processes = await withTimeout(this.sandbox.listProcesses(), 10_000);
   ```

2. **Add detailed logging to EVERY alarm path** — log before and after each sandbox call, log every return/continue path. We were blind during the 28-minute gap.

3. **Test: Run a generation with wrangler tail open the ENTIRE time** — don't let the tail session end. Watch every alarm fire from start to completion (or failure).

4. **Check if alarms survive DO resets** — Write a test: set alarm, trigger DO reset, verify alarm still fires on the new instance.

### Priority 2: Why did the WS die with code 1006?

1. Is this consistent? Does the WS always die shortly after `streamForLiveUI()` returns?
2. Check if the Hibernation API has a timeout on "idle" WS connections (no handler running = idle?)
3. Consider sending periodic pings from the DO side (not just client pings) to keep the WS alive

### Priority 3: Add a secondary watchdog

If the alarm chain can break, we need a backup:
- Option A: Client-side polling — if no WS events for N seconds, call a `/status` endpoint that checks D1 and can restart the alarm
- Option B: Cron trigger — a scheduled Worker that checks for stuck `generating` campaigns older than X minutes
- Option C: Make the alarm self-healing — store `lastAlarmFiredAt` in DO storage, check it on every handler invocation

### Priority 4: Container state inspection

- Can we add a `/debug/sandbox` endpoint that returns sandbox process list + file existence checks?
- This would let us query the sandbox state without needing the dashboard

---

## Files Changed This Session

None — investigation only. No code changes made.

---

## Key Takeaways

1. **The alarm stopping is the critical failure mode.** Everything else (stream death, WS death, agent crash) is recoverable IF the alarm keeps running. The alarm dying silently with no way to restart it (except client reconnect) is the single biggest reliability gap.

2. **We have a 28-minute blind spot.** Between the tail session ending and the container check, we have zero visibility. The alarm either hung on an RPC call, was killed by a DO reset, or stopped for an unknown reason. We need comprehensive logging to diagnose this.

3. **The agent itself may have been fine.** Research completed successfully. Hooks was in progress. The generation might have completed if the alarm had stayed alive to read `turn-result.json`. We can't know because the agent's output was never captured.

4. **Code 1006 WS deaths are recurring.** Happened in Session 48 and again here, both times unprompted. This is likely a platform behavior, not a client issue.
