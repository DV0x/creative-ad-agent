# Session 42: Assistant Messages + Follow-Up Bugs Investigation

**Date:** 2026-03-12
**Branch:** `new-ui`
**Status:** Investigation complete, fixes NOT yet implemented — awaiting approval
**Test run logs:** `log-4.md`

---

## Problems Reported

1. **No assistant messages showing** — Generation completes but only "Generation complete" appears in chat. No thinking blocks, no phase progress, no tool calls, no agent text.
2. **Follow-ups not working** — First follow-up appears to do nothing. Previously worked but broke at some point (uncommitted changes, exact regression point unknown).

---

## Investigation Method

Full first-principles code analysis of:
- `cloudflare/src/durable-objects/campaign-session.ts` (~1690 lines)
- `cloudflare/sandbox/agent-runner.ts` (217 lines)
- `cloudflare/src/lib/sdk-message-parser.ts` (256 lines)
- `client/src/components/chat/ChatMessage.tsx` (90 lines)
- `client/src/hooks/useWebSocket.ts` (469 lines)
- `client/src/store/index.ts` (1054 lines)
- `log-4.md` (production wrangler tail logs from test run)

---

## Bug #1: Assistant Messages Saved With Empty Blocks

### Symptom

After a generation completes (or on page refresh), the assistant message in chat shows only "Generation complete." with no thinking blocks, phase indicators, tool usage, or agent text.

### Root Cause

All three production completion paths save the assistant message with **hardcoded text** and **empty blocks**:

#### Path 1: `attachCompletionHandler` (waitForLog — primary)

**File:** `campaign-session.ts` lines 289-294

```typescript
await db.addMessage(this.env.DB, {
  campaignId,
  role: 'assistant',
  content: summary,    // = 'Generation complete.' (hardcoded)
  blocks: [],          // ← EMPTY — no phases, tools, text, images
});
```

#### Path 2: `pollR2CompletionMarker` (alarm R2 polling — safety net)

**File:** `campaign-session.ts` line 523

```typescript
await db.addMessage(this.env.DB, {
  campaignId,
  role: 'assistant',
  content: summary,    // = 'Generation complete. N images created.'
  blocks: [],          // ← EMPTY
});
```

#### Path 3: Alarm log snapshot (alarm `getProcessLogs` — backup safety net)

**File:** `campaign-session.ts` lines 116-121

```typescript
await db.addMessage(this.env.DB, {
  campaignId: this.campaignId!,
  role: 'assistant',
  content: 'Generation complete.',
  blocks: [],          // ← EMPTY
});
```

### Why This Happens — Architectural Gap

The `blockBuilder` (tracks phases, tools, image progress) and `textAccumulator` (tracks agent text) are **local variables** created inside `runGeneration()` (line 1228) and `runFollowUpFast()` (line 1078). They live in the streaming scope.

The completion handler (`attachCompletionHandler`) is a **separate fire-and-forget promise** created at line 1405. It has **no access** to the `blockBuilder` or `textAccumulator` because they're in a different scope.

```
runGeneration() scope:
  ├── blockBuilder (local)       ← tracks phases, tools, images
  ├── textAccumulator (local)    ← tracks agent text
  ├── SSE streaming loop         ← feeds blockBuilder/textAccumulator
  └── attachCompletionHandler()  ← separate promise, NO access to above
```

### Contrast: Local Dev Mode Works Correctly

`runGenerationLocal()` (lines 1547-1555) correctly saves both blocks and text:

```typescript
blockBuilder.closeThinkingBlock('complete');
await db.addMessage(this.env.DB, {
  campaignId: this.campaignId,
  role: 'assistant',
  content: summary || 'Generation complete.',
  blocks: blockBuilder.getBlocks(),   // ← HAS BLOCKS!
});
```

This works because local mode runs the SDK in-process (same scope), so the completion code can access `blockBuilder`. Production mode's fire-and-forget architecture separates streaming from completion.

### Client-Side Rendering Confirms the Issue

`ChatMessage.tsx` lines 66-74:

```tsx
{/* Assistant message */}
{!isUser && (
  <div className="space-y-2">
    {hasBlocks && (
      <BlockRenderer blocks={message.blocks!} onToggleThinking={handleToggleBlock} />
    )}
    {message.content && (!hasBlocks || !message.blocks!.some(b => b.type === 'text')) && (
      <div className="...">
        <p>{message.content}</p>     {/* Shows "Generation complete." */}
      </div>
    )}
  </div>
)}
```

Since `blocks` is `[]`, `hasBlocks` is false, `BlockRenderer` is skipped, and only the plain `content` text renders.

### Impact

- **During real-time:** UI works correctly — SSE stream → `processSDKMessage()` → WebSocket events → client renders phases/tools/images live
- **After refresh or reconnect:** Only "Generation complete." is visible — all thinking blocks, phase progress, tool history, and agent text are lost
- **Follow-up messages:** Same issue — saved as "Generation complete." with no blocks

---

## Bug #2: Stale R2 Completion Marker Poisons Follow-Ups

### Symptom

Follow-ups appear to complete instantly with no visible changes. On slower follow-ups (>30s), the follow-up results are silently lost.

### Root Cause

The R2 completion marker (`users/{userId}/completion_{campaignId}.json`) is **written** by the agent-runner after each turn but **NEVER deleted** by any code path.

#### Where the marker is written

`agent-runner.ts` line 160:
```typescript
fs.writeFileSync(`/mnt/r2/completion_${campaignId}.json`, JSON.stringify(marker));
```

#### Where the marker is read (but never deleted)

- `pollR2CompletionMarker()` — `campaign-session.ts` line 460 (alarm polling)
- `routes/recovery.ts` — client `/recover` endpoint

#### Where the marker SHOULD be deleted (but isn't)

- `handleFollowUp()` — before starting the follow-up
- `runFollowUpFast()` — before triggering the agent
- `runGeneration()` — when reusing a campaignId for cold-start follow-up
- Any completion handler — after processing the marker

### The Race Condition

```
Timeline for a follow-up that takes >30 seconds:

T+0s    User sends follow_up
        handleFollowUp() → isGenerating = true
        D1 status → 'generating'
        startKeepAlive() → alarm in 30s

T+0.5s  runFollowUpFast() starts
        completionMarker = 'COMPLETION:req_xxx'
        attachCompletionHandler() → waitForLog('COMPLETION:req_xxx')
        writeFile('/app/next-prompt.json') → agent starts processing

T+30s   ALARM FIRES
        isGenerating = true ✓
        pollR2CompletionMarker():
          R2.get('users/.../completion_{campaignId}.json')
          → FINDS STALE MARKER from initial generation!
          → Marks campaign complete
          → isGenerating = false   ← POISONED

T+45s   waitForLog('COMPLETION:req_xxx') resolves
        if (!this.isGenerating) return;  ← SKIPS!
        → Follow-up results NEVER reconciled to D1
        → Follow-up images NEVER saved
        → Follow-up files NEVER updated
```

### Evidence From Test Run (log-4.md)

The alarm at 12:31:37 PM flushed these buffered logs:

```
[alarm-r2] Completion marker found for campaign=campaign_mmn3vonf7qgqm6 — reconciling
[alarm-r2] Campaign campaign_mmn3vonf7qgqm6 completed via R2 marker (0 images recovered)
[gen] Agent process alive — taking fast path
[gen-fast] Starting fast follow-up for campaign=campaign_mmn3vonf7qgqm6
[completion] Waiting for 'COMPLETION:req_1773298867871' on process proc_1773298075696_oqqr1s
[gen-fast] Prompt file written, streaming output...
[completion] turn_complete detected for campaign=campaign_mmn3vonf7qgqm6
[gen-fast] Found turn_start after 271ms
[reconcile] Recovered 2 files from turn-result.json
[completion] Campaign campaign_mmn3vonf7qgqm6 marked complete via waitForLog
```

**Key observations:**
1. The `[alarm-r2]` logs are from the **initial generation's alarm** (~12:27:50), buffered via `this.log()` and flushed here
2. The follow-up completed in <30s (agent responded very fast — 271ms to find turn_start), so `waitForLog` won the race against the alarm
3. **This is luck, not design** — on a slower follow-up (image regeneration, complex edits), the alarm would fire first and poison the result

### Why the User Sees "Not Working"

Even when `waitForLog` wins the race (as in this test run):

1. `waitForLog` resolves before the streaming loop catches up with live data
2. Completion handler emits `complete` event immediately
3. Client receives `complete` before seeing any streaming events from the follow-up
4. Assistant message is saved as "Generation complete." with `blocks: []`
5. User sees: follow-up → instant "Generation complete" → no visible changes → "it's not working"

### Additional Related Issue: Log Snapshot Can Match Stale `turn_complete`

The alarm's log snapshot check (line 97):
```typescript
if (logs.stdout && logs.stdout.includes(this.completionMarker)) {
```

For the initial generation, `completionMarker = 'turn_complete'`. For follow-ups, it's correctly set to `'COMPLETION:req_xxx'` (line 1104). **This is fine** — the per-request marker prevents stale `turn_complete` matches.

BUT: `persistSession()` is called at line 771 (in `handleFollowUp`) BEFORE `completionMarker` is updated at line 1104 (in `runFollowUpFast`). If a DO reset occurs in this narrow window, the restored `completionMarker` would be the stale `'turn_complete'`, which would match old stdout immediately. This is a **minor race** but worth fixing.

---

## Proposed Fixes

### Fix #1: Store blockBuilder/textAccumulator as instance variables

Move `blockBuilder` and `textAccumulator` from local variables in `runGeneration()`/`runFollowUpFast()` to instance variables on the CampaignSession class.

```typescript
// Add to instance variables:
private blockBuilder: BlockBuilder | null = null;
private textAccumulator: TextAccumulator | null = null;
```

Then in the completion handler:

```typescript
// In attachCompletionHandler's .then():
const blocks = this.blockBuilder?.getBlocks() || [];
const text = this.textAccumulator?.text || '';
const summary = text
  ? stripImageUrls(text).substring(0, 500)
  : `Generation complete.`;

await db.addMessage(this.env.DB, {
  campaignId,
  role: 'assistant',
  content: summary,
  blocks,
});
```

Same change needed in `pollR2CompletionMarker` and alarm log snapshot completion paths.

**Risk:** Low. Instance variables are lost on DO reset anyway (same as current behavior). The worst case is falling back to `blocks: []` if the DO resets mid-generation.

### Fix #2: Delete stale R2 marker + add timestamp guard

**Part A:** Delete the R2 completion marker at the start of each follow-up:

```typescript
// In handleFollowUp, after setting isGenerating = true:
try {
  const markerKey = `users/${this.userId}/completion_${campaignId}.json`;
  await this.env.R2_BUCKET.delete(markerKey);
} catch { /* ignore — may not exist */ }
```

**Part B:** Add a timestamp guard in `pollR2CompletionMarker`:

```typescript
// In pollR2CompletionMarker, after parsing the marker:
if (marker.timestamp && this.generationStartedAt) {
  const markerTime = new Date(marker.timestamp).getTime();
  if (markerTime < this.generationStartedAt) {
    this.log(`[alarm-r2] Ignoring stale marker (written ${markerTime} < generation started ${this.generationStartedAt})`);
    return false;
  }
}
```

**Part C:** Fix the `completionMarker` persistence timing:

```typescript
// In runFollowUpFast, BEFORE attachCompletionHandler:
this.completionMarker = `COMPLETION:${requestId}`;
await this.persistSession();  // Persist the updated marker
```

**Risk:** Low. Part A is the primary fix. Part B is defense-in-depth. Part C is a minor race fix.

### Fix #3 (Optional): Also delete R2 marker in completion handler

After the completion handler successfully reconciles and saves to D1, delete the marker:

```typescript
// In attachCompletionHandler, after db.updateCampaignStatus:
try {
  await this.env.R2_BUCKET.delete(`users/${this.userId}/completion_${campaignId}.json`);
} catch { /* non-fatal */ }
```

This prevents the marker from accumulating in R2 and causing issues if the same campaignId is ever reused.

---

## Test Plan

After implementing fixes:

1. **Initial generation test:**
   - Generate a campaign
   - Verify chat shows thinking blocks, phases, tools, text (real-time)
   - Refresh page → verify assistant message has blocks (from D1)

2. **Fast follow-up test (<30s):**
   - Send a text-only follow-up (e.g., "make the stat hook more dramatic")
   - Verify streaming events appear in real-time
   - Verify assistant message is saved with blocks
   - Refresh → verify message persists with blocks

3. **Slow follow-up test (>30s):**
   - Send a follow-up that triggers image regeneration
   - Let it run past the 30s alarm boundary
   - Verify the alarm does NOT poison the follow-up
   - Verify results are correctly saved to D1

4. **R2 marker cleanup test:**
   - After initial generation, verify R2 marker exists
   - Send follow-up → verify R2 marker was deleted before follow-up started
   - After follow-up completes, verify new marker was written (for recovery)
   - Verify `/recover` endpoint still works with the new marker

5. **DO reset during follow-up:**
   - Start a follow-up
   - Simulate DO reset (deploy)
   - Verify alarm recovers correctly without stale marker interference

---

## Files To Modify

| File | Changes |
|------|---------|
| `cloudflare/src/durable-objects/campaign-session.ts` | (1) Move blockBuilder/textAccumulator to instance vars. (2) Use them in all 3 completion paths. (3) Delete R2 marker in handleFollowUp. (4) Add timestamp guard in pollR2CompletionMarker. (5) Fix completionMarker persistence timing. (6) Optionally delete R2 marker after completion. |
| No other files need changes | Both bugs are entirely in campaign-session.ts |

---

## Key Architectural Insight

The production pipeline has a deliberate **dual-path architecture**:
- **Streaming path** (best-effort): SSE → processSDKMessage → emitEvent → WebSocket → live UI
- **Completion path** (reliable): waitForLog → turn-result.json → reconcileImages/Files → D1

The streaming path correctly builds `blockBuilder` state. The completion path correctly saves images/files to D1. But **nobody bridges the gap** — the completion path never persists the streaming state (blocks, text). This is the fundamental architectural oversight.

The R2 marker issue is a separate cleanup bug — the marker was designed as a recovery mechanism but was never integrated into the follow-up lifecycle.

---

## Log Analysis Reference

### Initial Generation Timeline (from log-4.md)

```
12:17:41  Sandbox setup (unmount, clean, mount R2)
12:17:55  Agent-runner started (proc_1773298075696_oqqr1s)
12:17:56  First getProcessLogs: 83 chars stdout
12:18:11  Alarm: generation active, age=31s
12:20:06  getProcessLogs: 1,135 chars (SDK initializing)
12:20:43  getProcessLogs: 9,199 chars (research phase)
12:22:13  getProcessLogs: 75,218 chars (hooks/prompts phase)
12:24:34  getProcessLogs: 246,921 chars (image generation)
12:26:46  GET /images/...1_warm_morning.png (first image served)
12:26:47  GET /images/...2_instagram_story.png (second image served)
12:27:20  Alarm: generation active, age=580s (9.7 min)
~12:27:50 [inferred] R2 alarm polling detects completion marker
          → marks complete, isGenerating=false, alarm stops
```

### Follow-Up Timeline (from log-4.md)

```
12:31:07  readFile /app/agent-status.json (checking if agent alive)
12:31:07  writeFile /app/next-prompt.json (triggering follow-up)
12:31:08  readFile /app/turn-result.json + streamProcessLogs started
12:31:37  Alarm fires, flushTailLogs dumps:
          - [alarm-r2] Completion marker found (STALE — from initial gen ~12:27:50)
          - [alarm-r2] Campaign completed via R2 marker (0 images recovered)
          - [gen] Agent process alive — taking fast path
          - [gen-fast] Starting fast follow-up
          - [completion] Waiting for 'COMPLETION:req_1773298867871'
          - [gen-fast] Prompt file written
          - [completion] turn_complete detected ← waitForLog won the race
          - [gen-fast] Found turn_start after 271ms
          - [reconcile] Recovered 2 files
          - [completion] Campaign marked complete via waitForLog
```

**Key insight:** The alarm-r2 logs are stale (from ~12:27:50, buffered via `this.log()`, flushed at 12:31:37). The follow-up completed before the alarm's own R2 check could interfere. On a slower follow-up, this would not be the case.
