# Session 66 — Streaming Duplication & Truncation Fix (2026-04-06)

## Problem Reported

1. **Duplicate messages on follow-ups** — text content appearing 2x, 3x on successive follow-ups
2. **Text truncation on follow-ups** — last few characters/words cut off mid-word (e.g., "luxury vs. accessib"). Full text visible after page refresh (D1 has complete data).

## Root Cause 1: Duplicate Events (FIXED)

**File:** `cloudflare/src/durable-objects/campaign-session.ts` — `streamForLiveUI()`

The `break` on `turn_complete`/`result` at line 1201 only exited the **inner** `for (const line of lines)` loop, not the **outer** `for await (const event of parseSSEStream(logStream))` loop. So `streamForLiveUI` from `runGeneration` never actually exited — it kept reading the SSE stream.

When a follow-up started, `runFollowUpFast` created a **second** stream reader. Both processed Turn 2's events simultaneously → client got everything twice. Each additional follow-up added another listener (N follow-ups = N+1x duplication).

**Fix applied:** `turnDone` flag exits both loops. Stream reuse (`activeLogStream`) eliminates concurrent readers by design — follow-ups reuse the existing stream instead of creating a new one. Fallback to new stream + skip only after DO reset.

**Status:** FIXED and verified — no more duplication.

## Root Cause 2: Text Truncation (NOT YET FIXED)

Two sources identified, both related to race conditions:

### Source A: RAF buffer race (client-side)

**File:** `client/src/store/index.ts` — `appendTextDelta()` / `commitStreamingText()`

`appendTextDelta` batches deltas via `requestAnimationFrame` for smooth rendering. When `text_end` arrives, `commitStreamingText()` reads `state.streamingText` — but pending deltas in the RAF buffer haven't been flushed to state yet. Those trailing deltas are lost.

**Fix applied:** Module-scoped `_textDeltaBuf` / `_textDeltaRaf` variables. `commitStreamingText()` flushes the buffer synchronously (cancels pending RAF, reads buffer directly) before committing to blocks.

**Status:** Fix deployed but truncation PERSISTS — Source B is the dominant issue.

### Source B: Alarm vs streaming race (server-side) — THE MAIN ISSUE

**The problem:** Two independent systems race to signal completion:

| System | Reads | Sends | Timing |
|--------|-------|-------|--------|
| **Streaming** (`streamForLiveUI`) | stdout via SSE | `text_delta`, `text_end` | Real-time |
| **Alarm** (`finalizeGeneration`) | `turn-result.json` via readFile | `complete` event | Every 10s poll |

The alarm can send `complete` to the client **while streaming still has text events in its SSE pipeline**. The client receives `complete`, commits partial `streamingText`, resets `generatingCampaignId` to null — and remaining `text_delta` events arrive too late (dropped by the null guard).

**Evidence:** Full text appears after page refresh (D1 has the complete text from `turn-result.json`), but live streaming shows truncated text.

**Root cause:** Completion signaling and content delivery are on separate channels with zero coordination.

### Fix Attempts for Source B

#### Attempt 1: Deferred completion pattern
- `finalizeGeneration` checks `this.activeLogStream` — if streaming active, stores `complete` in `pendingCompleteEvent` instead of emitting
- After `streamForLiveUI` exits, `flushPendingComplete()` emits it
- **Failed because:** `activeLogStream` stays alive for stream reuse (follow-ups), so the alarm always sees "streaming active" and defers forever. Nobody flushes.

#### Attempt 2: `streamingActive` flag + post-streaming `tryFinalize`
- `streamForLiveUI` sets `this.streamingActive = true/false`
- Alarm skips `tryFinalize` while `streamingActive` is true
- After `streamForLiveUI` exits, `runGeneration`/`runFollowUpFast` call `tryFinalize` directly
- `finalizeGeneration` always emits `complete` immediately (no deferred pattern)
- **Current state:** Deployed to staging (`a0b2e102`) but NOT YET VERIFIED. User stopped testing due to fatigue.

## What's Deployed on Staging (version `a0b2e102`)

All changes are in `campaign-session.ts` and `client/src/store/index.ts`:

### Server (`campaign-session.ts`)
1. **`turnDone` flag** — exits both loops in `streamForLiveUI` on `turn_complete`/`result`
2. **`activeLogStream`** — stored on DO instance, reused across turns (no concurrent readers)
3. **`streamingActive` flag** — set true/false in `streamForLiveUI`, alarm checks before `tryFinalize`
4. **Post-streaming `tryFinalize`** — called after `streamForLiveUI` exits in both `runGeneration` and `runFollowUpFast`
5. **Alarm skips `tryFinalize`** while `streamingActive` is true (alarm is fallback only)
6. **`cancelActiveLogStream()`** — called on new generation, cancel, fatal error, slow-path follow-up
7. **Stream reuse in `runFollowUpFast`** — reuses `activeLogStream` if alive, falls back to new stream + skip after DO reset

### Client (`client/src/store/index.ts`)
1. **RAF buffer flush in `commitStreamingText`** — module-scoped `_textDeltaBuf`/`_textDeltaRaf`, synchronous flush before commit

## Architecture After Changes

```
Streaming path (PRIMARY completion):
  streamForLiveUI() → text_delta/text_end/tool events → exits on turn_complete
  → tryFinalize() → D1 persistence → 'complete' event
  (All events sequential on same execution path — ordering guaranteed)

Alarm path (FALLBACK only):
  alarm() → health checks, log relay, zombie detection
  → tryFinalize() ONLY when streamingActive=false
  (Covers: DO reset, stream disconnect, agent crash)
```

## Files Changed

| File | Changes |
|------|---------|
| `cloudflare/src/durable-objects/campaign-session.ts` | `turnDone` flag, `activeLogStream` reuse, `streamingActive` coordination, post-streaming `tryFinalize`, alarm guard, `cancelActiveLogStream` lifecycle |
| `client/src/store/index.ts` | RAF buffer flush in `commitStreamingText`, module-scoped `_textDeltaBuf`/`_textDeltaRaf` |

## Next Session: Verification Needed

1. **Test follow-up text truncation** — does the `streamingActive` + post-streaming `tryFinalize` fix the truncation?
2. **If still truncated**, add logging to narrow down:
   - Server: log when `tryFinalize` is called (from streaming path vs alarm) and what `streamingActive` is
   - Client: log when `complete` event arrives relative to last `text_end`
3. **If truncation is fixed**, test:
   - Initial generation (no regression)
   - Multiple follow-ups (no duplication)
   - Page refresh mid-generation (D1 recovery works)
   - Cancel during follow-up
   - DO reset recovery (alarm fallback path)
4. **Deploy to production** if all tests pass

## Key Insight for Next Session

The truncation might STILL happen if `tryFinalize` is called from the streaming path but `turn-result.json` doesn't exist yet. The agent writes `writeCompletionMarker()` (turn-result.json) BEFORE `turn_complete` in stdout — but there could be a filesystem delay (s3fs FUSE). If `tryFinalize` gets FileNotFoundError, it fails silently, and the alarm would need to retry — but the alarm is blocked by `streamingActive=false` (streaming already exited). This edge case needs investigation.

Also consider: is `tryFinalize` actually succeeding in the post-streaming path? Add a trace to confirm.
