# Session 52: Follow-Up Message Bugs + Stream Trace Fix

**Date**: 2026-03-13
**Branch**: `new-ui`
**Previous session**: Session 51 (Trace Analysis)
**Status**: Bug 2 fixed, Bug 1 debug logging deployed, stream exit trace added

---

## Goal

Address issues found during Session 51 testing and a new user-reported bug: follow-up messages disappearing on refresh and content duplication during follow-ups.

---

## Bugs Investigated

### BUG 1: Duplicated Content During Follow-Ups

**User report**: During follow-ups that generate images, the text "Now let me generate the ad image:" appears ~12 times concatenated in the chat, and "Generating Images" appears 5 times in the thinking block.

**Screenshot**: `~/Desktop/Screenshot 2026-03-13 at 11.47.30 AM.png`

**Investigation**:

1. **Checked `processSDKMessage`** — only handles `type === 'assistant'`, ignores `stream_event` (partial messages). No double-processing from streaming deltas.

2. **Checked `parseSSEStream`** (SDK source, `@cloudflare/sandbox/dist/index.js:2489`) — standard SSE parser, splits by `\n`, yields `JSON.parse(data)` per `data:` line. Each chunk is incremental, not cumulative.

3. **Checked `streamForLiveUI` buffer handling** — `stdoutBuffer` splits by newline, processes complete lines, carries partial lines forward. Each line processed exactly once.

4. **Checked WS event replay** (`handleSubscribe` line 850-855) — replays events since `lastEventId`. Client tracks `lastEventIdRef` per message. Event IDs are sequential. Replay should not duplicate.

5. **Checked JSONL from R2** (`/tmp/session51.jsonl`, 214 lines, 596KB) — Line 171 (21KB) is corrupted (null bytes from s3fs). Could not reconstruct the actual assistant message with tool calls for the "old money outfits" follow-up.

6. **Checked SDK types** (`sdk.d.ts:1867`) — `SDKMessage` union includes both `SDKAssistantMessage` (type: `'assistant'`) and `SDKPartialAssistantMessage` (type: `'stream_event'`). Both are written to stdout by agent-runner, but `processSDKMessage` only handles `'assistant'` type.

**Root cause**: NOT DETERMINED. Could not get proof. All code paths examined appear to process each message exactly once. Added debug logging to catch duplication in action on next test.

**Debug logging added**:
- `sdk-message-parser.ts`: Logs every SDK message type processed, every assistant message's content block count/types, and every emitted `message` event text (first 80 chars)
- `campaign-session.ts` (`streamForLiveUI`): Logs every parsed line's type and uuid

**To diagnose on next test**:
```bash
cd cloudflare && npx wrangler tail creative-agent --format json 2>&1 | grep -i "sdk-parser\|EMIT"
```

---

### BUG 2: Follow-Up Assistant Messages Disappear on Refresh (FIXED)

**User report**: After refreshing the page, only user messages remain. All assistant follow-up responses are gone.

**Proof**: D1 query on `campaign_mmoh48kqgxuip7` (Session 51 test campaign, 11 follow-ups):
- 20 messages total in D1
- 19 `user` role messages
- 1 `assistant` role message (from initial generation only)
- 0 assistant messages from any of the 11 follow-ups

**Root cause**: `finalizeGeneration()` at line 328-329:
```ts
const lastMsg = await db.getLastAssistantMessage(this.env.DB, campaignId);
if (!lastMsg) {
  // save assistant message
}
```
After the initial generation saves the first assistant message, `getLastAssistantMessage()` always returns a result. Every subsequent follow-up finalization skips saving because `lastMsg` is truthy. The dedup check was designed to prevent duplicate saves during the initial generation (streaming vs finalization race), but it incorrectly blocked ALL follow-up saves.

**Fix**: Removed the `getLastAssistantMessage` guard. Every finalization now saves a new assistant message unconditionally:
```ts
const msgContent = text ? stripImageUrls(text) : 'Generation complete.';
await db.addMessage(this.env.DB, {
  campaignId,
  role: 'assistant',
  content: msgContent,
  blocks,
});
```

**File**: `cloudflare/src/durable-objects/campaign-session.ts` line 327-335

---

### Session 51 Issue: Missing `[stream][exit]` Trace (FIXED)

**Problem**: `streamForLiveUI()` logged `[stream][enter]` but never logged exit. 4 stream enters in Session 51, 0 exits. Could not diagnose stream failures.

**Root cause**: The exit trace at line 959 was only reached on normal loop completion. Two paths skipped it:
1. Abort signal (`return true`) — no exit trace
2. Any exception thrown in the loop — no exit trace

**Fix**: Wrapped the streaming loop in `try/catch/finally`. The `[stream][exit]` trace now fires on ALL exit paths with:
- `label`: stream identifier (e.g. `gen-fast`)
- `lines`: number of lines processed
- `ms`: total stream duration
- `cancelled`: boolean (abort signal fired)
- `error`: error message if thrown (re-throws to preserve caller behavior)

**File**: `cloudflare/src/durable-objects/campaign-session.ts` lines 920-970

---

## Changes Deployed

| File | Change | Lines |
|------|--------|-------|
| `cloudflare/src/durable-objects/campaign-session.ts` | Stream exit trace (try/finally wrap) | ~920-970 |
| `cloudflare/src/durable-objects/campaign-session.ts` | Remove `getLastAssistantMessage` guard — always save | ~327-335 |
| `cloudflare/src/durable-objects/campaign-session.ts` | Debug: log every parsed line type in `streamForLiveUI` | ~945 |
| `cloudflare/src/lib/sdk-message-parser.ts` | Debug: log every SDK message type and emitted text | ~55-83 |

**Deploy**: `b09935b0-4d5b-401f-8065-99e487bcf23c`

---

## What Still Needs Testing

1. **Bug 2 fix**: Do a follow-up → refresh page → verify assistant messages persist
2. **Bug 1 diagnosis**: Do a follow-up with image generation → check `wrangler tail` for duplication evidence
3. **Stream exit trace**: Verify `[stream][exit]` appears in tail logs after follow-up completes

---

## Remaining Issues (Not Addressed This Session)

| Issue | Severity | Source |
|-------|----------|--------|
| `getProcessLogs` O(n^2) stdout transfer | Medium | Session 51 |
| Container version warning (SDK 0.7.8 mismatch) | Cosmetic | Session 51 |
| N+1 campaign loading (27 individual GET requests) | Low | Session 51 |
| D1 UNIQUE constraint error on image save race | Cosmetic | Session 51 |
| Debug logging in production (remove after diagnosis) | Cleanup | This session |

---

## Files Referenced

| File | Purpose |
|------|---------|
| `cloudflare/src/durable-objects/campaign-session.ts` | Stream exit trace, bug 2 fix, debug logging |
| `cloudflare/src/lib/sdk-message-parser.ts` | Debug logging for SDK message processing |
| `client/src/hooks/useWebSocket.ts` | Examined for duplication (WS message handling) |
| `client/src/store/index.ts` | Examined for duplication (`appendTextBlock`, `appendMessageContent`) |
| `client/src/components/chat/ChatMessage.tsx` | Examined for duplication (render logic) |
| `cloudflare/sandbox/node_modules/@cloudflare/sandbox/dist/index.js` | SDK source for `parseSSEStream` and `streamProcessLogs` |
| `cloudflare/sandbox/node_modules/@anthropic-ai/claude-agent-sdk/sdk.d.ts` | SDK types (`SDKMessage` union) |
| `/tmp/session51.jsonl` | R2 JSONL conversation log (line 171 corrupted) |
