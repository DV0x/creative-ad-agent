# Session 46: Architecture Simplification Plan

**Date**: 2026-03-12
**Branch**: `new-ui`
**Goal**: Restore 30s fast follow-ups + eliminate 5-way completion race condition
**Estimated sessions**: 2 (Session A: core changes, Session B: cleanup)

---

## Background

At Session 27, the system worked:
- 7 consecutive follow-ups, all ~30s (text-only) or ~90s (with images)
- `promptStream()` async generator kept SDK context alive between turns
- Single completion path (streaming loop handled everything inline)
- Only bug: SSE framing drops long messages (follow-up #6 image lost)

From Session 28-45, fixes for the SSE bug and other issues accumulated **5 competing completion paths** that race each other, causing duplicate messages, stale markers poisoning follow-ups, and content overwrite bugs. The `promptStream()` generator was replaced (Session 44) with per-turn `query()` calls that re-init from JSONL each turn — losing the 30s fast path.

### Current state (Session 45)

| Problem | Root cause |
|---------|-----------|
| 5 completion paths racing | Each SSE reliability fix added another path without removing the previous |
| Duplicate assistant messages in D1 | waitForLog + R2 alarm both fire and write independently |
| Client shows truncated content | `completeGeneration()` overwrites full streaming content with 500-char summary |
| Follow-ups slow (~2-3 min) | Session 44 rewrote generator to per-turn `query()` with `resume` (JSONL re-init each turn) |
| Hooks file empty (0 chars) | Skill internal writes invisible to streaming parser; `turn-result.json` should fix but untested |
| Stale R2 markers poison follow-ups | FUSE async upload can re-create marker after R2 API delete |
| campaign-session.ts: 1,786 lines | 30 methods, 15 instance vars, 5 completion paths, 4 copies of reconcile logic |

---

## Strategy

**Don't work backwards through 18 sessions. Work forward from Session 27's proven design, bringing in only what's needed.**

Two things were genuinely missing at Session 27:
1. Block/text persistence to D1 (refresh lost everything) → Fixed by Session 43's `turn-result.json`
2. SSE drops long messages (images lost) → Fixed by Session 28's file-based reconciliation

Everything else (waitForLog, waitForExit, R2 polling, log snapshots, completion retries, crash handlers, alarm reconnection, stream re-attach) was added to compensate for SSE unreliability. All of it can be replaced by **one alarm polling `turn-result.json`**.

---

## Phase A: Core Changes (1 session)

### Change 1: Restore `promptStream()` generator in agent-runner.ts

**Why**: The per-turn `query()` with `resume` re-initializes the SDK from JSONL each turn (~2-3 min). The `promptStream()` generator keeps SDK context alive in-memory (~30s follow-ups). Session 27 proved this works.

**What**: Rewrite `agent-runner.ts` back to the Session 26/27 pattern, keeping Session 43's block-building.

**Current structure** (Session 44 — per-turn, slow):
```
while (true) {
  runTurn(prompt, { resume: sdkSessionId })  // New query() per turn, re-init from JSONL
  waitForPromptFile()
}

function runTurn(prompt, options) {
  function* singlePrompt() { yield prompt }  // Single yield
  for await (msg of query({ prompt: singlePrompt(), options })) {
    // process messages...
    if (msg.type === 'result') return
  }
}
```

**Target structure** (Session 27 pattern + Session 43 block-building):
```
function* promptStream() {
  yield firstPrompt                      // First turn
  while (true) {
    writeCompletionMarker(blocks, text)  // Save results from completed turn
    stdout.write('turn_complete')
    if (requestId) stdout.write('COMPLETION:' + requestId)
    resetBlockBuilder()                  // Reset for next turn
    const data = await waitForPromptFile()
    if (!data || data.shutdown) return   // Generator ends → query() ends → process exits
    requestId = data.requestId
    stdout.write('turn_start:' + requestId)
    yield nextPrompt(data)               // SDK calls .next(), gets this, continues
  }
}

for await (msg of query({ prompt: promptStream(), options })) {
  stdout.write(JSON.stringify(msg))
  processMessageForBlocks(msg, blockBuilder, textAcc)  // Block-building from Session 43
  captureSessionId(msg)                                 // For fallback cold-start resume
}
```

**Key differences from Session 44:**
- Single `query()` call, not one per turn
- `promptStream()` multi-yield generator, not `singlePrompt()` + `resume`
- SDK keeps conversation context in memory between turns
- No JSONL re-init on follow-ups
- Block-building happens inside the loop but `writeCompletionMarker` happens in the generator (after `result` is yielded, SDK calls `.next()`, generator runs completion logic before yielding next prompt)

**Key differences from Session 27 (what we're adding):**
- `processMessageForBlocks()` and `BlockBuilder` from Session 43
- `writeCompletionMarker(blocks, text)` writes to both `/app/turn-result.json` and R2
- `COMPLETION:{requestId}` per-turn sentinel from Session 41
- Reset blockBuilder/textAccumulator between turns

**Risk**: Session 44 claimed "SDK's `query()` ends its async iterable after yielding `result`". Session 27's test (7 follow-ups) contradicts this. Session 27's research confirmed `streamInput()` writes yielded prompts to CLI stdin. If the SDK behavior changed between versions, we'll know immediately on first follow-up test (stdout will stop growing, same symptom as Session 44). Fallback: revert to per-turn `query()`.

**Verification**: After deploy, generate a campaign, then send a follow-up. If stdout grows after `turn_start` and follow-up completes in ~30s → generator works. If stdout freezes → generator broken, fall back to per-turn approach.

---

### Change 2: Replace 5 completion paths with 1 alarm-based path

**Why**: The 5 racing completion paths cause duplicate messages, stale marker poisoning, and content overwrites. The alarm polling `turn-result.json` is the most reliable path — it reads a local file (no SSE, no FUSE, no RPC streaming).

**What**: Delete in `campaign-session.ts`:

| Delete | Lines | Why it existed | Why we don't need it |
|--------|-------|---------------|---------------------|
| `attachCompletionHandler()` | 263-365 | waitForLog-based completion | Replaced by alarm polling |
| `attachCrashHandler()` | 372-413 | waitForExit crash detection | Alarm detects dead process via `getProcessLogs` failure |
| `attachStreamHandler()` | 419-484 | Re-attach SSE after DO reset | Alarm handles completion; streaming is best-effort in `runGeneration`/`runFollowUpFast` |
| `pollR2CompletionMarker()` | 491-616 | R2 polling safety net | `turn-result.json` is local disk, more reliable |
| Alarm log snapshot polling | 94-148 | Backup for waitForLog | Merged into the single alarm completion path |
| 2h safety net | 77-83 | Timeout for hung generation | Keep this one (simplified) |
| `completionRetries` | 29 | waitForLog retry counter | Not needed |
| `completionMarker` | 30 | Per-turn sentinel for waitForLog | Not needed (alarm reads turn-result.json which has requestId) |
| `agentProcess` | 27 | Reference for waitForLog/waitForExit | Not needed |

**Replace with one method** — `finalizeGeneration()`:

```typescript
private async finalizeGeneration(campaignId: string, sessionId: string): Promise<void> {
  if (!this.isGenerating) return;

  // 1. Read turn-result.json from sandbox (local disk, no FUSE)
  let turnResult = { images: [], files: {}, text: '', blocks: [], requestId: '' };
  try {
    const raw = await this.sandbox.readFile('/app/turn-result.json');
    const content = typeof raw === 'string' ? raw : raw.content;
    turnResult = JSON.parse(content);
  } catch {
    this.log('[finalize] Could not read turn-result.json');
  }

  // 2. Verify this result is for the current generation (not stale)
  // For follow-ups: turn-result.json has requestId matching what DO wrote in next-prompt.json
  // For initial gen: no requestId check needed (fresh process)

  // 3. Reconcile images (dedup against existing D1 records)
  // ... single implementation, not 4 copies ...

  // 4. Reconcile files (research, hooks, prompts)
  // ... single implementation ...

  // 5. Save assistant message to D1 (FULL text, not truncated)
  const content = turnResult.text ? stripImageUrls(turnResult.text) : 'Generation complete.';
  await db.addMessage(this.env.DB, { campaignId, role: 'assistant', content, blocks: turnResult.blocks || [] });

  // 6. Emit complete event (summary for client, can be truncated)
  const summary = turnResult.text ? stripImageUrls(turnResult.text).substring(0, 500) : 'Generation complete.';
  this.emitEvent({ type: 'complete', ... summary });

  // 7. Update D1 status
  await db.updateCampaignStatus(this.env.DB, campaignId, 'complete');

  // 8. Cleanup
  this.isGenerating = false;
  await this.persistSession();
}
```

**New alarm logic** (replaces current 120-line alarm):

```typescript
async alarm(): Promise<void> {
  this.flushTailLogs();

  if (!this.campaignId) await this.restoreSession();
  if (!this.isGenerating || !this.campaignId) return;

  // Safety net: 2h timeout
  if (this.generationStartedAt && (Date.now() - this.generationStartedAt) > 2 * 60 * 60 * 1000) {
    await db.updateCampaignStatus(this.env.DB, this.campaignId, 'incomplete');
    this.isGenerating = false;
    await this.persistSession();
    return;
  }

  // Reconnect sandbox after DO reset
  if (!this.sandbox && this.userId !== 'anonymous') {
    this.sandbox = getSandbox(this.env.SANDBOX, `user-${this.userId.toLowerCase()}-v2`, {
      sleepAfter: '2h', normalizeId: true,
    });
  }

  // Check if turn-result.json exists (agent completed this turn)
  if (this.sandbox) {
    try {
      const raw = await this.sandbox.readFile('/app/turn-result.json');
      const content = typeof raw === 'string' ? raw : raw.content;
      const result = JSON.parse(content);

      // Verify it's for the current turn (not stale from previous turn)
      // Compare result.requestId with this.currentRequestId
      if (this.currentRequestId && result.requestId && result.requestId !== this.currentRequestId) {
        // Stale result — skip
      } else {
        await this.finalizeGeneration(this.campaignId, this.sessionId!);
        return; // Done — don't reschedule
      }
    } catch {
      // File doesn't exist yet or can't be read — agent still working
    }
  }

  // Reschedule
  if (this.isGenerating) {
    await this.state.storage.setAlarm(Date.now() + 10_000); // Poll every 10s (not 30s)
  }
}
```

**Instance variables removed**: `agentProcess`, `completionRetries`, `completionMarker`
**Instance variable added**: `currentRequestId` (string, persisted in activeSession — simpler than `completionMarker`)

---

### Change 3: Simplify `runGeneration` and `runFollowUpFast`

**What changes in `runGeneration` (lines 1313-1575):**
- DELETE: `attachCompletionHandler()` call (line ~1502)
- DELETE: `attachCrashHandler()` call (line ~1506)
- DELETE: `this.completionMarker = 'turn_complete'` (line ~1499)
- ADD: `this.currentRequestId = null` (initial gen has no requestId)
- KEEP: Streaming loop for live UI (best-effort, doesn't handle completion)
- KEEP: Everything else (sandbox setup, IP retry, R2 mount, process start)
- SIMPLIFY: Streaming loop no longer needs to detect `turn_complete` — just stream until SSE ends or cancelled

**What changes in `runFollowUpFast` (lines 1166-1309):**
- DELETE: `attachCompletionHandler()` call (line ~1195)
- DELETE: `attachCrashHandler()` call (line ~1199)
- DELETE: `this.completionMarker = 'COMPLETION:...'` (line ~1193)
- ADD: `this.currentRequestId = requestId` (for alarm staleness check)
- KEEP: Streaming loop with skip-replay logic (live UI only)
- KEEP: Prompt file write, cancel handling

**Both methods become simpler**: They set up the generation/follow-up and stream for live UI. They don't handle completion at all. The alarm handles completion via `finalizeGeneration()`.

---

### Change 4: Fix client `completeGeneration()` overwrite

**File**: `client/src/store/index.ts`, line 603

**Current** (broken):
```typescript
chatMessages: {
  ...state.chatMessages,
  [campaignId]: (state.chatMessages[campaignId] || []).map(msg =>
    msg.id === messageId ? { ...msg, content: summary } : msg  // OVERWRITES full content
  )
}
```

**Fix**: Don't touch `content` — blocks carry the rendered UI. Content was already accumulated by streaming.
```typescript
chatMessages: {
  ...state.chatMessages,
  [campaignId]: (state.chatMessages[campaignId] || []).map(msg =>
    msg.id === messageId ? { ...msg, content: msg.content || summary } : msg  // Keep existing content, use summary only as fallback
  )
}
```

Same fix needed in `cancelGeneration` (line 621) and `failGeneration` (line 641) — but those can keep overwriting since cancel/error are terminal states where the streaming content is irrelevant.

---

### Change 5: Add `requestId` to `turn-result.json`

**File**: `cloudflare/sandbox/agent-runner.ts`, in `writeCompletionMarker()`

Add `requestId: currentRequestId || 'initial'` to the `turn-result.json` payload. The alarm uses this to distinguish stale results from current-turn results.

**Current** (line 226):
```typescript
fs.writeFileSync('/app/turn-result.json', JSON.stringify({ images, files, text, blocks }));
```

**Fix**:
```typescript
fs.writeFileSync('/app/turn-result.json', JSON.stringify({ images, files, text, blocks, requestId: currentRequestId || 'initial' }));
```

---

### Change 6: Clear `turn-result.json` before each turn

**File**: `cloudflare/sandbox/agent-runner.ts`

In the `promptStream()` generator, BEFORE yielding the next prompt, delete the previous turn's result file. This prevents the alarm from reading a stale result while the new turn is in progress.

```typescript
// In promptStream(), before yield:
try { fs.unlinkSync('/app/turn-result.json'); } catch {}
```

Also in `runGeneration()` on the DO side — already exists at line ~1452:
```typescript
await sandbox.exec('rm -f /app/generated-images.jsonl /app/turn-result.json 2>/dev/null || true');
```

---

## Phase B: Cleanup (1 session)

### Cleanup 1: Remove R2 completion marker entirely

**Why**: With alarm-based `turn-result.json` polling, the R2 marker serves no purpose. It's the source of the FUSE race condition (marker reappears after deletion because FUSE upload completes after R2 API delete).

**Files**:
- `agent-runner.ts`: Remove `fs.writeFileSync('/mnt/r2/completion_...')` and `execSync('sync')` from `writeCompletionMarker()`
- `campaign-session.ts`: Remove all `R2_BUCKET.delete(markerKey)` calls
- `campaign-session.ts`: Remove `pollR2CompletionMarker()` method entirely (already deleted in Phase A)
- `cloudflare/src/routes/recovery.ts`: Update `/recover` endpoint to not depend on R2 marker (use D1 status instead, or read turn-result.json via sandbox)

### Cleanup 2: Remove dead instance variables and methods

After Phase A deletions, remove:
- `attachCompletionHandler`, `attachCrashHandler`, `attachStreamHandler`, `pollR2CompletionMarker` — already deleted
- `completionRetries`, `completionMarker`, `agentProcess` — no longer used
- `reconcileImages()`, `reconcileFiles()` — merged into `finalizeGeneration()`

### Cleanup 3: Extract sandbox orchestration

The `runGeneration()` method is ~260 lines. The sandbox setup (get sandbox, IP retry, mount R2, clean workspace, hydrate files) is ~150 lines that could be a `setupSandbox()` method. Not urgent but reduces cognitive load.

### Cleanup 4: Simplify streaming loop

Both `runGeneration` and `runFollowUpFast` have near-identical streaming loops (SSE parse, line buffer, JSON parse, processSDKMessage). Extract to a shared `streamForLiveUI(processId, campaignId, options?)` method.

---

## Expected Line Count After Changes

| File | Before | After (est.) | Reduction |
|------|--------|-------------|-----------|
| `campaign-session.ts` | 1,786 | ~900 | -50% |
| `agent-runner.ts` | 337 | ~280 | -17% |
| `client/src/store/index.ts` | 1,054 | 1,054 | 0 (1-line fix) |

The DO goes from 30 methods to ~20, from 15 instance vars to ~12, from 5 completion paths to 1.

---

## Gap Fixes (added during implementation review)

### Gap 1: Crash Detection
The original plan removed `waitForExit()` without replacement. The simplified alarm now includes a **process-alive check**: calls `sandbox.listProcesses()` to verify the agent process is running. If dead, checks `turn-result.json` first (agent may have completed before crashing), then marks incomplete immediately instead of waiting for the 2h safety net.

### Gap 2: D1 Dedup
`addMessage()` has no `ON CONFLICT` protection. Multiple completion paths could create duplicate assistant messages. Fixed: `finalizeGeneration()` calls `getLastAssistantMessage()` before `addMessage()` — only inserts if no assistant message exists for this campaign yet.

### Design Change: Block-building in `for await` loop, not generator
The plan originally put `writeCompletionMarker()` in the generator. This doesn't work because `streamInput()` calls `.next()` eagerly — the generator runs completion logic before the `for await` loop has processed the `result` message. Fix: completion logic (write marker, emit sentinels, reset blocks) stays in the `for await` loop after seeing `result`. The generator only handles prompt yielding and clearing stale state.

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `promptStream()` generator doesn't work with current SDK version | Low (SDK docs confirm streaming input as recommended pattern) | High (no fast follow-ups) | Test immediately after deploy. Fallback: keep per-turn `query()` with `resume` |
| Alarm 10s polling adds latency vs instant waitForLog | Certain (5s avg delay) | Low (user already saw everything via streaming) | Acceptable tradeoff for eliminating races |
| `turn-result.json` not written if agent crashes | Low | Low (alarm detects dead process via `listProcesses()`) | Process-alive check marks incomplete immediately |
| DO resets during generation lose `currentRequestId` | Medium | Low (alarm reads stale result, but `finalizeGeneration` is idempotent — dedup check prevents duplicate messages) | Persist `currentRequestId` in `activeSession` |
| Duplicate D1 messages from racing completion paths | N/A (eliminated) | N/A | Only 1 completion path now. `getLastAssistantMessage()` check as safety net |

---

## Deploy Plan

```bash
# 1. Build client
cd client && npm run build

# 2. Clean Docker cache (REQUIRED — prevents stale container images)
docker logout registry.cloudflare.com
docker builder prune -af

# 3. Deploy
cd cloudflare && npx wrangler deploy

# 4. Wait 2-3 min for container image propagation (Worker deploys instantly, container takes longer)
```

---

## Verification Plan

### Test 1: Initial Generation
1. Generate a new campaign
2. Verify streaming works (phases, tools, thinking blocks in real-time)
3. Wait for alarm to detect completion (should be within 10s of agent finishing)
4. Verify assistant message shows full content + blocks (not "Generation complete.")
5. Refresh page → verify message persists with blocks from D1

### Test 2: Fast Follow-Up (~30s target)
1. Immediately send a text-only follow-up (e.g., "make the first hook more dramatic")
2. Watch logs: `turn_start` should appear (proves generator is alive)
3. Verify response streams in ~30s
4. Verify alarm detects completion
5. Refresh → verify follow-up message persists

### Test 3: Follow-Up with Images (~90s target)
1. Send follow-up requesting image changes
2. Verify new image appears in gallery
3. Verify no duplicate messages in D1

### Test 4: Multiple Follow-Ups
1. Send 3-5 follow-ups in sequence
2. Verify each is fast path (~30s text, ~90s images)
3. No duplicate content, no stale markers

### Test 5: Cancel
1. Start a follow-up, cancel mid-generation
2. Verify next generation works (cold start)

### Test 6: D1 Verification
```bash
npx wrangler d1 execute creative-agent-db --remote --command="SELECT id, role, LENGTH(content) as content_len, LENGTH(blocks) as blocks_len FROM messages WHERE campaign_id='<id>' ORDER BY created_at"
```
- Verify: assistant messages have content > 500 chars
- Verify: blocks is not `[]`
- Verify: no duplicate assistant messages per turn

---

## Files Changed Summary

### Phase A (core)

| File | Change |
|------|--------|
| `cloudflare/sandbox/agent-runner.ts` | Restore `promptStream()` generator, keep block-building, add `requestId` to turn-result.json, clear turn-result.json between turns |
| `cloudflare/src/durable-objects/campaign-session.ts` | Delete 4 completion paths (keep alarm-only), add `finalizeGeneration()`, simplify alarm, simplify `runGeneration`/`runFollowUpFast`, replace `completionMarker`/`agentProcess`/`completionRetries` with `currentRequestId` |
| `client/src/store/index.ts` | Fix `completeGeneration()` to not overwrite content (line 603) |

### Phase B (cleanup)

| File | Change |
|------|--------|
| `cloudflare/sandbox/agent-runner.ts` | Remove R2 completion marker write + `execSync('sync')` |
| `cloudflare/src/durable-objects/campaign-session.ts` | Remove dead methods/vars, extract `setupSandbox()`, extract `streamForLiveUI()` |
| `cloudflare/src/routes/recovery.ts` | Update `/recover` to not depend on R2 marker |

---

## What We're NOT Changing

- D1 schema — no changes
- WebSocket protocol — no changes
- Client components (except 1-line store fix) — no changes
- MCP server / orchestrator prompt — no changes
- Dockerfile — no changes (compiles whatever agent-runner.ts is present)
- Auth — no changes
- Local dev path (`runGenerationLocal`) — no changes
- Static asset serving — no changes
