# Session 45: Follow-Up Fixes Deploy & Simplification Discussion

**Date**: 2026-03-12
**Branch**: `new-ui`
**Status**: Deployed, tested, 3 fixes applied, simplification discussion in progress

## What We Did

### 1. Applied 3 fixes to `campaign-session.ts` and deployed

**Fix A: requestId guard on R2 marker** (line ~519-528)
- Added `requestId` + `version` check in `pollR2CompletionMarker`
- If marker's `requestId` doesn't match current `completionMarker`, reject it
- Prevents stale initial-gen markers from poisoning follow-ups

**Fix B: Full text in D1 (not truncated to 500 chars)** (3 locations)
- Line ~116/131: alarm log snapshot → `alarmContent` (full) for D1, `alarmSummary` (truncated) for event only
- Line ~306/321: attachCompletionHandler → `content` (full) for D1, `summary` (truncated) for event only
- Line ~571: pollR2 addMessage → `msgContent` (full) for D1

**Fix C: `requestId` field added to marker type** (line ~501)
- TypeScript type now includes `requestId?: string`

### 2. Deployed
- Client built, Docker cache pruned, `wrangler deploy` succeeded
- Version: `25f0dccf`

## Test Results

Campaign: `campaign_mmnc8k102dqipu` (Sweetkaramcoffee, 2 images)

### Issue 1: Assistant message STILL truncated in UI
**Root cause: CLIENT-SIDE bug, not server-side.**

D1 has full content (2132 chars — confirmed via D1 query). But `client/src/store/index.ts:603`:
```js
msg.id === messageId ? { ...msg, content: summary } : msg
```
`completeGeneration()` overwrites `msg.content` with the truncated `summary` from the `complete` event (500 chars). The streaming already populated the full content, but the complete event replaces it.

**Fix needed**: Don't overwrite content with summary in `completeGeneration()`.

### Issue 2: Follow-up S3FS mount error
**Root cause: Container image propagation delay.**

Our deploy has two phases:
- Worker code (campaign-session.ts) → deploys instantly
- Container image (agent-runner.ts) → takes ~2 min to propagate

The initial generation started right after deploy. The Worker had the new requestId check, but the container was still running the OLD agent-runner (without `requestId` in markers). The guard:
```js
if (marker.requestId && marker.version >= 3) { ... }
```
...skipped entirely because the old marker had no `requestId`.

The stale R2 marker (from initial gen) was found by the alarm → marked generation complete → cleanup killed the agent → follow-up fell back to cold start → S3FS mount error on `/mnt/r2` not empty.

**This is a one-time timing issue.** New container is now active. But the guard should also reject markers without `requestId` instead of skipping the check.

### Issue 3: Hooks file empty (0 chars in D1)
**Root cause: `hook-methodology` Skill writes hooks internally.**

D1 query confirmed:
- research: 4488 chars ✓
- prompts: 2015 chars ✓ (visible after page refresh)
- hooks: 0 chars ✗

The streaming parser (`sdk-message-parser.ts:99-130`) catches `Write` tool calls and saves file content to D1. Research and prompts are written by visible `Write` tool calls in the orchestrator's message stream. But hooks are written inside the `hook-methodology` Skill — the Skill's internal `Write` calls are NOT visible to the outer streaming parser.

The `turn-result.json` path (new agent-runner reads files from disk at completion) should fix this — it bypasses the streaming parser entirely. But this generation ran on the old container that didn't write turn-result.json with file data.

**Needs verification on next test with new container.**

### Issue 4: Duplicate assistant messages in D1
Two identical assistant messages (both 2132 chars) for the same generation. Both `waitForLog` and R2 alarm fired and each wrote a message.

They race because:
- Agent writes `turn_complete` to stdout AND R2 marker at the same instant
- Both paths see `isGenerating = true` before either sets it to `false`
- Both write to D1

## Architectural Simplification Discussion

### Problem: Too many competing completion paths

Current architecture has three completion detection paths running simultaneously:
1. **`waitForLog`** (primary) — watches stdout via SSE for completion marker
2. **R2 alarm polling** (safety net) — checks R2 every 30s for completion marker file
3. **Alarm log snapshot** (fallback) — reads full stdout and searches for marker

These race, duplicate, and interact in complex ways.

### Proposed simplification: Drop `waitForLog`, use alarm-only

**Key insight**: By the time completion fires, the user has already seen everything via streaming. The completion handler just does D1 bookkeeping (save files, images, messages, update status). A 30-60s delay is invisible to the user.

**Proposed alarm-based single path:**
```
alarm fires every 30s:
  1. Try sandbox.readFile('/app/turn-result.json') → found? → complete
  2. If sandbox dead → check R2 marker → found? → complete
  3. Neither? → reschedule
```

**Pros:**
- One path, no races, no duplicates
- No `waitForLog` SSE hang risk
- No FUSE race condition (local file check is primary)
- Much simpler code

**Cons:**
- Up to 30-60s delay for completion detection (acceptable — user doesn't notice)
- If FUSE never uploads AND sandbox dies → R2 check fails too (but turn-result.json on local disk handles this)

**Migration plan (for next session):**
1. Remove `attachCompletionHandler` / `waitForLog` calls
2. Enhance alarm to check turn-result.json first, R2 second
3. Remove duplicate message guards (no longer needed)
4. Fix client-side truncation bug (`completeGeneration` in store)
5. Make requestId guard reject missing requestId (not skip)
6. Test end-to-end

## Files Changed This Session

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | requestId guard, full text in D1, marker type |

## Files To Change Next Session

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | Remove waitForLog, alarm-only completion, dedup guard |
| `client/src/store/index.ts` | Don't overwrite content with truncated summary (line 603) |

## D1 State After Test

```
campaign_mmnc8k102dqipu:
  messages: user(47), assistant(2132), user(48), assistant(2132), user(24)
  files: research=4488, hooks=0, prompts=2015
  images: 2
```

Note: Two identical assistant messages (duplicate from race condition).

## Key Log Evidence

- `log-4.md` lines 160-170: R2 alarm and waitForLog both fire
- Line 195: S3FS mount error on follow-up cold start
- D1 query confirms 2132-char messages (not truncated) and 0-char hooks
