# Session 51: Trace Log Analysis

**Date**: 2026-03-13
**Branch**: `new-ui`
**Previous session**: Session 50 (Trace Instrumentation Deploy)
**Status**: Analysis complete — no code changes, findings documented for next session

---

## Goal

Test the Session 50 trace instrumentation with a real generation + follow-ups on a fresh container. Analyze the full `wrangler tail` output to validate the pipeline and find issues.

---

## Test Summary

| Metric | Value |
|--------|-------|
| Campaign | `campaign_mmoh48kqgxuip7` |
| Container | Fresh (sandbox ID `63806494...`) |
| Initial generation | 9m 4s |
| Follow-ups completed | 11 (all fast-path) |
| Total session duration | ~33 min (11:15 - 11:48 IST) |
| Agent process | `proc_1773380776992_lcef4g` (alive entire session) |
| Images generated | 9 (all saved to D1, all served 200) |
| Crashes | 0 |
| WS drops during active use | 0 |
| Alarm iterations | 133 |
| Trace points captured | 801 (up to T2678) |

---

## Critical Discovery: `wrangler tail --format pretty` Hides DO Traces

The 78 DO trace points from Session 50 were **completely invisible** in `--format pretty`. All `[T{seq}][component][action]` traces appeared as empty `Unknown Event - Ok` entries with no content.

Switching to `--format json` revealed all 801 traces working correctly.

**Root cause**: `wrangler tail --format pretty` does not render `console.log()` output from Durable Object alarm handlers. It only renders SDK-internal structured logs (the `{"level":"info","msg":"...","component":"sandbox-do",...}` entries).

**Workaround**: Always use `--format json` for DO debugging:
```bash
cd cloudflare && npx wrangler tail creative-agent --format json 2>&1 | grep -i "alarm\|trace\|rpc\|handler\|gen\|setup\|finalize"
```

No code change needed.

---

## Alarm Architecture — Confirmed Working Correctly

Initial analysis of `--format pretty` suggested the alarm was running a 3-minute internal polling loop. **This was wrong.** The JSON traces reveal each alarm iteration is a fast single-check cycle:

```
[alarm][enter] iter=N
[rpc][listProcesses.done] ms=75
[rpc][getProcessLogs.done] ms=86
[alarm][containerLogs] newBytes=XXXX
[rpc][readTurnResult.error] ms=74 (FileNotFoundError — agent still working)
[alarm][reschedule] nextIn=10000
[alarm][exit.ok] iter=N ms=235
```

- **Per-iteration duration**: 220-550ms
- **Reschedule interval**: 10s
- **No internal loops** — fire, check, exit, reschedule

The "3-minute alarm" grouping in pretty format was wrangler tail batching handler logs, not actual alarm duration.

---

## RPC Timing Profile

| RPC Call | Typical | Range | Notes |
|----------|---------|-------|-------|
| `listProcesses` | 75ms | 74-79ms | Rock solid |
| `readTurnResult` | 74ms | 73-84ms | Consistent (except first call) |
| `readTurnResult` (cold) | 3363ms | one-time | First sandbox file access on iter=1 |
| `getProcessLogs` | **72-399ms** | varies | **Grows with stdout size** |

No RPC hangs detected. Every `.start` has a matching `.done` or `.error`.

---

## Follow-Up Fast Path — Verified Working

Trace sequence for each follow-up:
```
[handler][followUp.enter] promptLen=60 assets=0
[handler][followUp.pathCheck] agentAlive=true
[handler][followUp.fastPath]
[gen-fast][enter]
[gen-fast][requestId] requestId=req_XXXX
[gen-fast][promptWritten]
[stream][enter] label=gen-fast skipRequestId=req_XXXX
"Found turn_start after 60-195ms"
```

- Agent alive check always passes
- Fast path always taken (no slow path fallbacks)
- Sentinel marker found in 60-195ms (no replay issues)
- Follow-ups with images: ~60-94s
- Follow-ups text-only: ~20s

---

## Image Pipeline — D1 Analysis

### D1 State: 9 images saved correctly

| Index | Created (UTC) | Source |
|-------|---------------|--------|
| 1 | 05:54:42 | Initial generation |
| 2 | 06:00:58 | Follow-up 1 |
| 3 | 06:02:26 | Follow-up 2 |
| 4 | 06:04:56 | Follow-up 4 |
| 5 | 06:09:34 | Follow-up 6 |
| 6 | 06:11:18 | Follow-up 7 |
| 7 | 06:13:02 | Follow-up 8 |
| 8 | 06:18:11 | Follow-up 11 |
| 9 | 06:27:17 | After tail expired |

All version=1, no duplicates, sequential indices.

### UNIQUE Constraint Error (Cosmetic)

```
(error) Failed to save image: Error: D1_ERROR: UNIQUE constraint failed:
campaign_images.campaign_id, campaign_images.image_index, campaign_images.version
```

Occurred during follow-up 1 at 06:00:58 UTC. Two code paths race to save the same image:

1. **Streaming path** (`sdk-message-parser.ts:235`): Saves images in real-time as they appear in stdout
2. **Finalization path** (`campaign-session.ts:288-305`): Saves images from `turn-result.json` when alarm detects completion

The finalization traces confirm dedup is generally working: all 3 captured finalizations show `imagesAdded=0` — meaning the streaming path saved the image first, and finalization correctly skipped it via `knownPaths`. The UNIQUE error is an edge case race condition.

**Impact**: None — the `catch` block swallows the error, and the image is saved correctly by whichever path wins. No data loss.

**Possible fix** (low priority): Change INSERT to `ON CONFLICT(campaign_id, image_index, version) DO NOTHING`.

---

## Issues Found — For Next Session

### ISSUE 1: `getProcessLogs` O(n²) Stdout Transfer

**Severity**: Medium (will worsen with session length)

Every `getProcessLogs()` call returns the **entire** accumulated stdout. The alarm tracks `lastContainerLogLen` to only process new content, but the full buffer is transferred every time.

| Session stage | stdout size | getProcessLogs ms |
|--------------|-------------|-------------------|
| Early (iter 1-10) | 461 - 2,377 chars | 72-74ms |
| Mid (iter 20-40) | 15K - 95K chars | 86-206ms |
| Late (iter 50-80) | 143K - 286K chars | 254-399ms |
| End (iter 100+) | 400K - 496K chars | 300-400ms |

Total data transferred = sum of all stdout sizes across 133 iterations ≈ **25MB** of redundant data for a 496KB final stdout.

For a session with 50+ follow-ups (stdout > 1MB), this becomes multi-MB per poll — unsustainable.

**Possible fix**: The SDK doesn't support byte-range fetching. Options:
1. Accept the overhead (simplest, works for current session lengths)
2. Truncate/rotate agent stdout periodically from the container side
3. Switch to a file-based log approach (agent writes to a log file, alarm reads only the tail)

### ISSUE 2: Streams Die Silently — No `[stream][exit]` Trace

**Severity**: Medium (blocks root-cause analysis of stream failures)

4 `[stream][enter]` traces in the log, zero `[stream][exit]` traces. The `streamForLiveUI()` function enters but never logs its exit.

This means when the Session 49 blind spot recurs (stream dies, alarm takes over), we'll know the stream died but NOT:
- When exactly it died
- How many lines it processed
- Whether it was cancelled or errored
- What the error was

**Possible fix**: Ensure `streamForLiveUI()` always logs `[stream][exit]` in its finally block with `lines`, `ms`, and `cancelled`/`error` fields. Check if the `stream.exit` trace call exists in the code but is unreachable due to the stream hanging.

### ISSUE 3: Container Version Warning

```
Container version could not be determined. Please update your container to match SDK version 0.7.8
```

Cosmetic warning on every sandbox creation. Container image needs rebuild to match current SDK.

### ISSUE 4: N+1 Campaign Loading

On both page loads, the client makes 27 individual `GET /api/campaigns/{id}` requests after the list request. The list endpoint should return full campaign data to avoid this.

---

## What Worked Perfectly

1. **Agent stayed alive across 11 follow-ups** — same process, no restarts
2. **Alarm fired reliably** — 133 iterations, 220-550ms each, zero missed
3. **All RPCs completed** — no hangs, no timeouts
4. **Fast path always taken** — no slow path fallbacks needed
5. **Image dedup worked** — finalization correctly skipped already-saved images
6. **WS stable during active use** — only closed on navigation (code=1001)
7. **Auth working** — all requests authenticated via Clerk JWT
8. **Preflight IP check passed first try** — IP `104.28.164.107` not blocked

---

## Files Referenced

| File | Purpose |
|------|---------|
| `log-testing with fresh container.md` | Full `wrangler tail --format pretty` output (834 lines) |
| `log-json-mode.md` | Full `wrangler tail --format json` output (9037 lines) |
| `cloudflare/src/durable-objects/campaign-session.ts` | DO with trace instrumentation |
| `cloudflare/src/lib/sdk-message-parser.ts` | Streaming image save path |
| `cloudflare/schema.sql` | D1 schema (UNIQUE constraint on campaign_images) |
| `cloudflare/src/db/images.ts` | `addCampaignImage` function |

---

## Investigation Plan for Next Session

1. **Decide on `getProcessLogs` mitigation** — accept, truncate, or switch to file-based logs
2. **Fix `[stream][exit]` trace gap** — ensure `streamForLiveUI` always logs exit
3. **Optionally**: Rebuild container image to clear SDK version warning
4. **Optionally**: Add `ON CONFLICT DO NOTHING` to image INSERT
5. **Optionally**: Fix N+1 campaign loading in client
