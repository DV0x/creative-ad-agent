# Session 30: Follow-Up Hang Debug — 2026-03-09

**Date:** 2026-03-09
**Branch:** `new-ui`
**Prior version:** `060bd742` (Session 29 — cancel fix + file reconciliation)
**Deployed version:** `38693f93` (debug logging added)

## Issue

Second campaign's follow-up hangs forever. First campaign (generation + follow-ups) works fine.

### Reproduction Steps

1. Generate a new campaign → works
2. Send follow-ups → works (fast path)
3. Generate a SECOND new campaign → works
4. Send a follow-up immediately after it completes → **HANGS**

### What the Logs Show

- `[gen-fast] Prompt file written, streaming output...` — prompt was written successfully
- Then **zero** `[gen-fast]` logs for 2+ minutes
- Alarm keeps firing showing `isGenerating=true`
- No timeout log, no error, no exit — just silence
- D1 stuck at `status='generating'` forever

### Root Cause Analysis

The hang is in `runFollowUpFast`'s `for await (const event of parseSSEStream(logStream))` loop.

`streamProcessLogs()` replays ALL historical stdout from the agent process, then switches to real-time tailing. The DO skips through the replay looking for a `turn_start` marker. After the replay ends, it waits for new real-time events.

**The stream appears to stall** — either during replay or after replay ends. The agent-runner picks up `next-prompt.json` and writes `turn_start` to stdout, but the stream never delivers it.

**The timeout is useless** — it's inside the `for await` loop body, so it only checks when a new event arrives. If the stream stops yielding events, the timeout never fires.

**Best theory for WHY the stream stalls:** The previous `runGeneration` broke out of its own `streamProcessLogs()` stream (on `result/success`). If that stream wasn't fully closed before `runFollowUpFast` opened a new one to the same process, the new stream may not receive real-time data. Campaign 1's follow-ups worked because the user waited ~30+ seconds (old stream had time to close). Campaign 2's follow-up started immediately (same alarm batch as `result/success`).

### What We Don't Know

Because the replay-skip phase had NO logging, we couldn't tell:
1. Whether the stream produced any events at all (stalled from start?)
2. Whether events flowed during replay but stopped after (replay→realtime transition broken?)
3. Whether the stream exited cleanly (loop ended but no `turn_start` found?)

### Debug Logging Added (This Deploy)

Added instrumentation to `runFollowUpFast` replay-skip phase:

- **Event counter** — logs every 50 events: `[gen-fast] Replay skip: 150 events, 80 lines, 5 empty, 1200ms elapsed`
- **Stream start log** — `[gen-fast] Starting stream for process=proc_xxx, requestId=req_xxx`
- **Found marker log** — `[gen-fast] Found turn_start after 200 events, 95 lines, 3500ms`
- **Timeout log** — now includes counts: `[gen-fast] Timeout after 200 events, 95 lines, 10 empty — aborting`
- **Exit log** — `[gen-fast] Stream loop exited: completed=false, cancelled=false, skipping=true, events=200, lines=95, 125000ms`

### Next Steps (Session 31)

1. **Reproduce the bug** with debug logging deployed:
   - Start `wrangler tail`
   - Generate a campaign, wait for completion
   - Send follow-up immediately
   - Capture full tail output

2. **Analyze the debug logs** to determine:
   - Did the stream produce events? (events=0 means stalled from start)
   - Did it produce events but no lines? (empty SSE frames)
   - Did the timeout finally fire? (was it just slow, or truly hung?)
   - How did the loop exit?

3. **Fix based on findings:**
   - If stream stalls: consider polling `turn-result.json` instead of depending on stream
   - If timeout works but too slow: reduce timeout, add `AbortSignal.timeout()`
   - If old stream interferes: explicitly close/cancel `runGeneration`'s stream before returning

### D1 State After This Session

Both test campaigns reset:
- `campaign_mmish1za1dvtgn` — `complete` (campaign 1, worked fine)
- `campaign_mmisy8bkjitacq` — `complete` (campaign 2, manually reset from `generating`)

### Files Changed

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | Debug logging in `runFollowUpFast` replay-skip phase: event/line/empty counters, stream start/exit logs |

### Proposed Fix Direction (Staff Engineer)

Stop depending on `streamProcessLogs()` for knowing when the follow-up is done. Use file-based polling (`turn-result.json`) as the primary completion mechanism. Stream logs as optional real-time progress only.

This follows the existing design principle: **"SSE is best-effort for real-time progress. The filesystem is the source of truth."**
