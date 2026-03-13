# Session 44: Follow-Up Bug Root Cause Analysis & Fix Plan

**Date**: 2026-03-12
**Branch**: `new-ui`
**Status**: Root cause identified, agent-runner.ts rewritten, DO fixes pending

## Problem Summary

Three interconnected bugs prevent follow-ups from working and cause message corruption:

1. **Follow-up not processed** — agent-runner appears alive but produces zero stdout after prompt file is written (frozen at 161366 chars for 18 minutes)
2. **Assistant message changes after generation** — streaming shows correct Eggoz content, then it gets replaced with a truncated 500-char summary
3. **Follow-up response about wrong campaign** — user asks about Eggoz, agent responds about Foxtale

## Test Run Details

**Campaigns tested:**
- Campaign 1: Foxtale (`campaign_mmn8ey42ko4ril`) — website not accessible due to rate limits
- Campaign 2: Eggoz (`campaign_mmn8mcmh9wyrwu`) — generation completed successfully with 2 images
- Follow-up on Eggoz: "can you change the second image to Indian aesthetic?" → **FAILED** (response about Foxtale)

**Log file**: `log-4.md`
**Screenshots**: Saved on Desktop (`Screenshot 2026-03-12 at 3.13.30 PM.png`, `Screenshot 2026-03-12 at 3.12.14 PM.png`)

---

## Root Cause #1 (CRITICAL): SDK's query() Ends After Result

### The Bug

The committed version of `agent-runner.ts` (in git at `bbbe71b`) was **single-turn**:
```javascript
// OLD — committed, working
for await (const message of query({ prompt: createPrompt(), options })) {
  process.stdout.write(JSON.stringify(message) + '\n');
  if (message.type === 'result') {
    abortController.abort();  // signal generator to stop
    break;                    // exit the loop
  }
}
process.exit(0);
```

The current (uncommitted) version tried to make it **multi-turn** by removing the `break` and expecting the SDK to call `.next()` on the generator:
```javascript
// NEW — current, broken
for await (const message of query({ prompt: promptStream(), options })) {
  process.stdout.write(JSON.stringify(message) + '\n');
  processMessageForBlocks(message, blockBuilder, textAccumulator);
  if (message.type === 'result') {
    writeCompletionMarker(blocks, text);
    process.stdout.write(JSON.stringify({ type: 'turn_complete' }) + '\n');
    // DON'T break — generator waits for next prompt file  <-- THIS IS THE BUG
  }
}
```

**The SDK's `query()` function ends its async iterable after yielding `result`.** It does NOT call `.next()` on the prompt generator for the next turn. The `for await` loop exits silently. The agent-runner process stays alive (orphaned setTimeout timers in `waitForPromptFile` keep the event loop open) but nobody consumes the generator, so the prompt file is never processed.

### Evidence

From `log-4.md`:
- **2:39:20 PM**: `agent-status.json` shows `{status: "idle"}` (53 chars) — agent finished initial turn
- **2:39:20 PM**: `next-prompt.json` written (136 chars) — follow-up prompt delivered
- **2:39:50 PM → 2:57:37 PM**: `getProcessLogs` consistently returns `stdout: 161366 chars` — **ZERO growth for 18 minutes**
- If the generator was alive and polling, it would find the file within 500ms and write `turn_start` to stdout

### The Fix (ALREADY APPLIED)

Rewrote `agent-runner.ts` with a **per-turn `query()` loop**:

```javascript
// FIXED — one query() call per turn
while (true) {
  writeStatus('processing');
  const turnOptions = sdkSessionId
    ? { ...baseOptions, resume: sdkSessionId }
    : { ...baseOptions };

  await runTurn(currentPrompt, turnOptions, isFirstTurn);
  isFirstTurn = false;

  // Turn complete — wait for next prompt from DO
  writeStatus('idle');
  const data = await waitForPromptFile();
  if (!data || 'shutdown' in data) break;

  currentRequestId = data.requestId || null;
  currentPrompt = data.prompt;
  process.stdout.write(JSON.stringify({ type: 'turn_start', requestId: data.requestId }) + '\n');
}
```

Each `runTurn()` calls `query()` once, processes all messages until `result`, writes completion markers, then returns. The outer loop waits for the next prompt file and starts a new `query()` call with `resume: sdkSessionId`.

The SDK session ID is captured from the `system.init` message (`message.session_id`) during the first turn and passed as `resume` for subsequent turns.

**File changed**: `cloudflare/sandbox/agent-runner.ts` — full rewrite (same structure, but per-turn loop instead of single query with multi-yield generator)

### Key changes in the rewrite:
- `promptStream()` generator REMOVED (was the broken multi-yield pattern)
- New `runTurn()` function — runs a single `query()` call with a single-yield generator
- `sdkSessionId` captured from `system.init` message for resume
- `turn_start` sentinel written BEFORE the yield (same as before, just moved to the outer loop)
- `writeCompletionMarker()` now includes `requestId` field (version 3 marker) for per-turn identification
- Resume-failed retry preserved (first turn only)

---

## Root Cause #2: R2 Marker Race Condition (Stale Marker Poisons Follow-Up)

### The Bug

The R2 completion marker is written by the agent-runner via FUSE (`fs.writeFileSync('/mnt/r2/completion_{campaignId}.json', ...)`). The FUSE upload to R2 is **asynchronous** — `writeFileSync` closes the file, but s3fs may not upload to R2 immediately.

The race condition:
1. Initial generation completes → agent-runner writes R2 marker via FUSE
2. DO's completion handler (waitForLog) fires → reads `turn-result.json` (local disk) → deletes R2 marker via R2 API
3. But FUSE upload may complete AFTER the R2 API delete → marker **reappears** in R2
4. `handleFollowUp` deletes stale marker → but FUSE may re-upload again
5. Follow-up starts → alarm fires → `pollR2CompletionMarker` finds the stale marker
6. `pollR2CompletionMarker` sets `isGenerating = false` → completion handler's `waitForLog` skips (`isGenerating already false`)
7. Follow-up is **orphaned** — nobody marks it complete, alarm stops rescheduling

### Evidence

From `log-4.md`:
- **2:39:49 PM**: `[alarm-r2] Completion marker found for campaign=campaign_mmn8mcmh9wyrwu — reconciling` — this is the INITIAL generation's stale marker found during the follow-up
- **2:39:49 PM**: `[alarm-r2] Campaign campaign_mmn8mcmh9wyrwu completed via R2 marker (0 images recovered)` — alarm thinks the follow-up completed (but it hasn't even started)
- After this, the alarm returns without rescheduling (line 90: `if (recovered) return;`)

### The timestamp guard should catch this but may not

The guard at `pollR2CompletionMarker` line 508-514:
```javascript
if (marker.timestamp && this.generationStartedAt) {
  const markerTime = new Date(marker.timestamp).getTime();
  if (markerTime < this.generationStartedAt) {
    this.log('[alarm-r2] Ignoring stale marker');
    return false;
  }
}
```

This SHOULD work (initial gen marker has timestamp < follow-up's `generationStartedAt`). But it can fail if:
- `generationStartedAt` wasn't persisted yet when the alarm reads it after a DO reset
- The alarm fires between `handleFollowUp` setting `generationStartedAt` (line 783) and `persistSession()` (line 833) — though in-memory this is fine, a DO reset between these would lose the value

### Fix Needed (NOT YET APPLIED)

**In `cloudflare/src/durable-objects/campaign-session.ts`:**

1. **Add `requestId` check to `pollR2CompletionMarker`** — the marker now has `requestId: 'initial' | 'req_xxx'`. The alarm should verify it matches the current `this.completionMarker`:

```javascript
// In pollR2CompletionMarker, after parsing the marker:
if (marker.requestId && marker.version >= 3) {
  // For follow-ups, completionMarker = 'COMPLETION:req_xxx'
  // For initial gen, completionMarker = 'turn_complete'
  const expectedRequestId = this.completionMarker === 'turn_complete'
    ? 'initial'
    : this.completionMarker.replace('COMPLETION:', '');
  if (marker.requestId !== expectedRequestId) {
    this.log(`[alarm-r2] Ignoring marker from different turn (marker=${marker.requestId}, expected=${expectedRequestId})`);
    return false;
  }
}
```

2. **Persist `generationStartedAt` BEFORE `startKeepAlive()`** — move `persistSession()` before `startKeepAlive()` in `handleFollowUp` to ensure the alarm always sees the latest value.

---

## Root Cause #3: Completion Handler Overwrites Streaming Content

### The Bug

When the completion handler fires (either waitForLog or R2 poll), it writes an assistant message to D1:
```javascript
const summary = text ? stripImageUrls(text).substring(0, 500) : 'Generation complete.';
await db.addMessage(this.env.DB, { campaignId, role: 'assistant', content: summary, blocks });
```

This truncates the full agent response to 500 characters and adds a NEW assistant message. Meanwhile, the streaming pipeline already showed the full response to the user. When the client refreshes or receives the `complete` event, it loads the D1 message and shows the truncated version — the user sees the "message changed."

### Fix Needed (NOT YET APPLIED)

**In `campaign-session.ts` — both `attachCompletionHandler` and `pollR2CompletionMarker`:**

Don't truncate the text. Store the full text in D1:
```javascript
// BEFORE (broken):
const summary = text ? stripImageUrls(text).substring(0, 500) : 'Generation complete.';

// AFTER (fixed):
const content = text ? stripImageUrls(text) : 'Generation complete.';
```

The `complete` event's `summary` field can stay truncated (it's just for the event payload), but the D1 message should have the full content.

---

## Root Cause #4 (Secondary): Wrong Campaign Context in Follow-Up Response

### The Bug

The user sees a response about Foxtale when asking about Eggoz. Since Bug #1 means the agent-runner never processes the follow-up, the response visible in the UI is NOT from the follow-up at all — it's likely from:

1. The R2 alarm reconciliation emitting a `complete` event with stale data
2. The client receiving this event and displaying it as the follow-up response
3. Or the client loading D1 messages which include data from the wrong campaign

### Fix

This should be resolved automatically once Bugs #1 and #2 are fixed. The agent-runner will actually process the follow-up, and the alarm won't interfere with stale markers.

If the issue persists, investigate the client's WebSocket event handling — check if the Zustand store properly filters events by `campaignId`.

---

## Files Changed So Far

| File | Status | Change |
|------|--------|--------|
| `cloudflare/sandbox/agent-runner.ts` | **REWRITTEN** | Per-turn `query()` loop, SDK session capture, requestId in marker |
| `cloudflare/src/durable-objects/campaign-session.ts` | **PENDING** | R2 marker requestId check, text truncation fix |

## Files NOT Changed (no changes needed)

- `cloudflare/sandbox/block-builder.ts` — Session 43 addition, works correctly
- `cloudflare/sandbox/tsconfig.json` — Already includes block-builder.ts
- `cloudflare/sandbox/Dockerfile` — Already COPYs block-builder.ts
- `client/` — No changes needed (assuming events are filtered by campaignId)

---

## Remaining DO Changes (campaign-session.ts)

### Change 1: `pollR2CompletionMarker` — add requestId check

**Location**: Line ~507, after parsing the marker JSON

Add a requestId verification to prevent stale markers from poisoning follow-ups:
```javascript
// After the timestamp guard (line 514), add:
if (marker.requestId && marker.version >= 3) {
  const expectedRequestId = this.completionMarker === 'turn_complete'
    ? 'initial'
    : this.completionMarker.replace('COMPLETION:', '');
  if (marker.requestId !== expectedRequestId) {
    this.log(`[alarm-r2] Ignoring marker from different turn (marker=${marker.requestId}, expected=${expectedRequestId})`);
    return false;
  }
}
```

### Change 2: Don't truncate assistant message content

**Locations**:
- `attachCompletionHandler` (line ~305): `const summary = text ? stripImageUrls(text).substring(0, 500) : 'Generation complete.';`
- `pollR2CompletionMarker` (line ~565-576): Same pattern
- Alarm log snapshot path (line ~116): Same pattern

Change all three to store full text in D1:
```javascript
// For db.addMessage — use full text
const content = text ? stripImageUrls(text) : 'Generation complete.';
await db.addMessage(this.env.DB, { campaignId, role: 'assistant', content, blocks });

// For emitEvent summary — can stay truncated (it's just the event payload)
const summary = text ? stripImageUrls(text).substring(0, 500) : 'Generation complete.';
this.emitEvent({ type: 'complete', ..., summary });
```

### Change 3: Persist session before startKeepAlive in handleFollowUp

**Location**: `handleFollowUp` around line ~833 and ~866

Move `persistSession()` before `startKeepAlive()` to ensure alarm always sees latest `generationStartedAt`:
```javascript
// Current order:
await this.persistSession();  // line 833 (in try block)
// ... more setup ...
this.startKeepAlive();         // line 866

// This is fine as-is (persist is before startKeepAlive). Just verify no DO reset can
// happen between setting generationStartedAt (line 783) and persistSession (line 833).
// The async awaits in between (D1 queries) could allow a DO reset, but handleFollowUp
// is called from webSocketMessage which is a handler — alarms can't interrupt it.
```

Actually, the current order is fine. The alarm can only fire AFTER `handleFollowUp` returns (DO handlers are serial). And `handleFollowUp` calls `persistSession()` before `startKeepAlive()`. So the alarm will always see the persisted `generationStartedAt`.

---

## Deploy Plan

```bash
# 1. Build client (if changed)
cd client && npm run build

# 2. Clear Docker cache + deploy
docker logout registry.cloudflare.com
docker builder prune -af
cd cloudflare && npx wrangler deploy
```

## Verification Plan

1. **Generate a campaign** → verify streaming works, images appear, assistant message shows full content (not truncated)
2. **Refresh the page** → verify assistant message still shows full content with blocks
3. **Send a follow-up** → verify:
   - `turn_start` appears in stdout (agent-runner picked up prompt)
   - Agent responds about the CORRECT campaign
   - Response streams to UI
   - Completion fires correctly
4. **Check D1**: `npx wrangler d1 execute creative-agent-db --remote --command="SELECT content, blocks FROM messages WHERE role='assistant' ORDER BY created_at DESC LIMIT 3"` — verify content is NOT truncated to 500 chars
5. **Check R2 marker**: After completion, verify marker is deleted (no stale markers)

## Key Architecture Context

- **Streaming pipeline**: agent-runner stdout → `streamProcessLogs()` → `parseSSEStream()` → line buffer → JSON parse → `processSDKMessage` → `emitEvent` → WebSocket → client
- **Completion detection**: `attachCompletionHandler` → `waitForLog(marker)` → reads `turn-result.json` → saves to D1 → emits `complete` event
- **Safety net**: alarm → `pollR2CompletionMarker` → reads R2 marker → saves to D1 → emits `complete` event
- **Follow-up fast path**: `handleFollowUp` → `isAgentProcessAlive` → write `next-prompt.json` → agent-runner picks up → `query()` with resume → stream results
- **Follow-up slow path**: `handleFollowUp` → full `runGeneration` (new process, cold start, ~3 min)

## Session History Reference

- **Session 26**: Introduced long-running agent pattern (promptStream, file-based IPC)
- **Session 27**: Tested 7 follow-ups successfully (but this was before Session 43 changes)
- **Session 43**: Added block-building + writeCompletionMarker — inadvertently broke the multi-turn pattern because the `promptStream()` generator approach doesn't work with the SDK's `query()` function
- **Session 44 (this session)**: Identified root cause, rewrote agent-runner with per-turn query loop
