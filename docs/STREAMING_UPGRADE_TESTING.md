# Streaming Upgrade — Testing Plan

## Testing Strategy

The project has no unit test framework — only hand-rolled E2E scripts against production. Rather than introducing a full test framework for this upgrade alone, we follow the same pattern: **targeted Node.js test scripts** for each layer, plus an extended E2E test.

Three testing layers, matching the three phases:

| Layer | What it tests | How it runs | Duration |
|-------|--------------|-------------|----------|
| **Unit: Parser** | `sdk-message-parser.ts` handles new event types correctly, doesn't break existing ones | Node.js script with mock context | <1s |
| **Unit: Store** | `appendTextDelta` batching, `setTextStreaming`, existing actions unchanged | Node.js script importing store directly | <1s |
| **E2E: Streaming** | Full pipeline — deltas arrive over WS, phases/images/complete still work | WS script against deployed Worker | ~5-8 min |

---

## Phase 1 Tests (Backend)

### Test 1.1 — Parser unit test

**File:** `test-parser-streaming.mjs`

Tests `processSDKMessage()` with mock context. No network, no D1, no containers.

```javascript
/**
 * Unit test: sdk-message-parser handles streaming events correctly.
 *
 * Tests:
 *   1. text_delta → calls sendEphemeral (not emitEvent)
 *   2. text_start → calls sendEphemeral
 *   3. text_end → calls sendEphemeral, sets hasStreamedDeltas
 *   4. After deltas, assistant text block → skips emitEvent (suppressed)
 *   5. After deltas, assistant tool_use block → still calls emitEvent (not suppressed)
 *   6. Existing: assistant text without prior deltas → calls emitEvent as before
 *   7. Existing: phase detection (Task/Skill/nano-banana) → unchanged
 *   8. Existing: image processing (tool_result with images) → unchanged
 *   9. Existing: file detection (Write with research/hooks/prompts path) → unchanged
 *  10. textAccumulator still accumulates text even when emitEvent is suppressed
 *
 * Usage: node test-parser-streaming.mjs
 */
```

**Mock setup:**
```javascript
// Minimal mock — no D1, no real BlockBuilder
const mockCtx = {
  emittedEvents: [],      // captures emitEvent calls
  ephemeralEvents: [],     // captures sendEphemeral calls
  emitEvent: (e) => mockCtx.emittedEvents.push(e),
  sendEphemeral: (e) => mockCtx.ephemeralEvents.push(e),
  campaignId: 'test-campaign',
  d1: { prepare: () => ({ bind: () => ({ run: async () => {} }) }) },  // stub
  processedFilenames: new Set(),
  textAccumulator: { text: '' },
  blockBuilder: mockBlockBuilder(),   // stub with no-op methods
  imageCounter: { next: 1 },
  hasStreamedDeltas: false,
};
```

**Test cases:**

| # | Input message | Assert |
|---|---------------|--------|
| 1 | `{ type: 'text_delta', delta: 'Hello' }` | `ephemeralEvents` has `{ type: 'text_delta', delta: 'Hello' }`. `emittedEvents` is empty. |
| 2 | `{ type: 'text_start' }` | `ephemeralEvents` has `{ type: 'text_start' }` |
| 3 | `{ type: 'text_end' }` | `ephemeralEvents` has `{ type: 'text_end' }`. `ctx.hasStreamedDeltas === true` |
| 4 | Sequence: `text_start` → `text_delta('Hi')` → `text_end` → `{ type: 'assistant', message: { content: [{ type: 'text', text: 'Hi' }] } }` | After assistant msg: `emittedEvents` has NO `message` event (suppressed). `textAccumulator.text === 'Hi'` (still accumulated) |
| 5 | Same sequence but assistant has `[{ type: 'text', text: 'Hi' }, { type: 'tool_use', name: 'Task', ... }]` | `emittedEvents` has `tool_start` but NO `message`. Text suppressed, tools not suppressed |
| 6 | No prior deltas → `{ type: 'assistant', message: { content: [{ type: 'text', text: 'Hi' }] } }` | `emittedEvents` has `{ type: 'message', text: 'Hi' }` (existing behavior preserved) |
| 7 | `{ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Task', input: { subagent_type: 'Explore' } }] } }` | `emittedEvents` has `phase` event with `phase: 'research'` |
| 8 | `{ type: 'user', message: { content: [{ type: 'tool_result', content: '{"images":[{"urlPath":"/images/test.png","filename":"test.png"}]}' }] } }` | `emittedEvents` has `image` event |
| 9 | `{ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Write', input: { file_path: '/app/agent/files/research/brand.md', content: '...' } }] } }` | `emittedEvents` has `file` event with `fileType: 'research'` |

**How to run:** `node test-parser-streaming.mjs` — exits 0 on success, 1 on failure.

### Test 1.2 — Verify Phase 1 backend doesn't break existing client

After deploying Phase 1 backend (before any client changes):

1. **Run existing E2E suite (fast):** `node test-e2e-all.mjs --skip-long`
   - REST API and image serving should be unchanged
   - Expected: all pass

2. **Run full generation:** `node test-e2e-generate.mjs`
   - Client ignores `text_delta`/`text_start`/`text_end` (hits `default` case, logs "Unknown...")
   - Phases, images, complete events must still arrive
   - Expected: all pass. Console shows "Unknown WebSocket message type: text_delta" warnings (harmless)

3. **Manual: open browser, run a generation**
   - Verify existing UI still works — thinking blocks, images, completion
   - Check browser console for unknown message type warnings (expected, harmless)

### Test 1.3 — E2E: verify deltas are flowing

**File:** `test-e2e-streaming.mjs`

A lightweight WS test that connects, starts generation, and verifies the new event types arrive alongside existing ones. Does NOT test client UI — just the backend pipeline.

```javascript
/**
 * E2E Test: Streaming Deltas
 *
 * Connects via WebSocket, starts generation, verifies:
 *   1. text_start events received (at least 1)
 *   2. text_delta events received (at least 10 — proves token-level streaming)
 *   3. text_end events received (at least 1)
 *   4. text_start count === text_end count (balanced pairs)
 *   5. Existing events still work: ack, phase, image, complete
 *   6. No text_delta events have an 'id' field (proves sendWS, not emitEvent)
 *   7. Phase/image events DO have 'id' field (proves emitEvent still used)
 *
 * Usage: node test-e2e-streaming.mjs
 * Expected duration: ~5-8 min
 */
```

**Key assertions:**

```javascript
// After generation completes:
check(textStartCount >= 1,     `text_start events received (got ${textStartCount})`);
check(textDeltaCount >= 10,    `text_delta events received (got ${textDeltaCount})`);
check(textEndCount >= 1,       `text_end events received (got ${textEndCount})`);
check(textStartCount === textEndCount, `Balanced text_start/text_end pairs (${textStartCount}/${textEndCount})`);
check(gotAck,                  'Ack received');
check(phases.length >= 1,      `Phase events received (got ${phases.length})`);
check(imageCount >= 1,         `Image events received (got ${imageCount})`);
check(gotComplete,             'Complete event received');

// Verify sendWS vs emitEvent routing
check(!anyDeltaHasId,          'text_delta events have no id (sent via sendWS)');
check(somePhaseHasId,          'Phase events have id (sent via emitEvent)');

// Verify delta content is reasonable
const assembledText = allDeltas.join('');
check(assembledText.length > 50, `Assembled delta text is substantial (${assembledText.length} chars)`);
```

**Add to test runner:** Add to `test-e2e-all.mjs` as a long-running test after "Reconnect".

---

## Phase 2 Tests (Client)

### Test 2.1 — Store unit test

**File:** `test-store-streaming.mjs`

Tests the Zustand store actions in isolation — no React, no DOM.

```javascript
/**
 * Unit test: Zustand store streaming actions.
 *
 * Tests:
 *   1. appendTextDelta creates a new text block if none exists
 *   2. appendTextDelta appends to existing text block
 *   3. appendTextDelta creates NEW text block if last block is thinking (not text)
 *   4. setTextStreaming sets/clears textStreamingMessageId
 *   5. appendTextBlock still works (existing behavior)
 *   6. openThinkingBlock/closeThinkingBlock still work (existing behavior)
 *   7. rAF batching: multiple rapid appendTextDelta calls result in one state update
 *
 * Usage: node test-store-streaming.mjs
 * Note: Requires building the client first (or using tsx for direct TS execution)
 */
```

**Approach:** Import the store creation function directly (Zustand stores are plain JS — no React needed). Use `createStore()` or `useStore.getState()` / `useStore.setState()`.

**Key test sequence for batching:**
```javascript
// Simulate rapid deltas
store.appendTextDelta('c1', 'm1', 'Hello');
store.appendTextDelta('c1', 'm1', ' world');
store.appendTextDelta('c1', 'm1', '!');

// Before rAF fires: buffer should have all 3 deltas
// After rAF fires: state should have single text block with "Hello world!"
// Verify: only 1 Zustand state update happened (not 3)
```

### Test 2.2 — Manual UI verification checklist

After deploying Phase 2 client:

#### Initial generation flow
- [ ] Start new generation
- [ ] BreadcrumbsIndicator appears (not old ThinkingBlock) with OrbitalSpinner
- [ ] Phase text rotates with verbs
- [ ] Text streams token-by-token (not paragraph chunks)
- [ ] Blinking cursor `|` visible at end of streaming text
- [ ] Cursor disappears when text block completes
- [ ] Text switches from raw text to markdown rendering on `text_end`
- [ ] Phase transitions show (research → hooks → art → images)
- [ ] Completed phases show `✓` and fade
- [ ] Image progress bar appears during image generation
- [ ] Images appear in gallery as they generate
- [ ] Complete event received — thinking block collapses, summary appears
- [ ] No duplicate text blocks visible

#### Follow-up flow
- [ ] Send follow-up message on completed campaign
- [ ] Text streams for follow-up response (same delta behavior)
- [ ] No stale text from previous generation appears
- [ ] Follow-up completes normally

#### Recovery flows
- [ ] Refresh page mid-generation → page loads, chat shows messages from D1 (not partial deltas)
- [ ] Disconnect WiFi for 5s, reconnect → phases/images recover, text may be partial (acceptable)
- [ ] Open second tab → both tabs show streaming text (multi-tab broadcast)

#### Local dev (regression)
- [ ] Run local server (`cd server && npm run dev`)
- [ ] Verify generation still works with complete `message` events (no deltas — local runner unchanged)
- [ ] No errors in console about missing event types

### Test 2.3 — Extended E2E: client behavior with deltas

Not a new script — **re-run existing E2E tests** after deploying Phase 2 client:

```bash
# Fast tests — should all pass unchanged
node test-e2e-all.mjs --skip-long

# Full generation — now the client would consume deltas if it were a browser,
# but E2E tests use raw WS (no React), so they just verify event presence
node test-e2e-streaming.mjs

# Reconnect test — verifies event recovery still works
# Critical: phases/images should replay, text deltas should NOT replay (unbuffered)
node test-e2e-reconnect.mjs
```

---

## Phase 3 Tests (Polish)

### Test 3.1 — Dedup removal verification

After removing `seenTextsRef`:

1. Run `test-e2e-generate.mjs` — complete event, no duplicates
2. Manual: run generation in browser, inspect text blocks in React DevTools or `useStore.getState().chatMessages` — no duplicate text blocks

### Test 3.2 — Complete handler cleanup

After skipping summary text when streamed text exists:

1. Run generation in browser:
   - For initial generation: streamed text should be the final content, no appended summary
   - For follow-up: same behavior (already skipped via `isFollowUp`)
2. Refresh page: D1 text should render correctly (same content)

---

## Test Execution Order

### After Phase 1 deploy:
```bash
# 1. Unit test the parser (fast, local, no deploy needed)
node test-parser-streaming.mjs

# 2. Deploy backend
cd client && npm run build && docker logout registry.cloudflare.com && \
  docker builder prune -af && cd ../cloudflare && npx wrangler deploy

# 3. Verify existing E2E still passes (no regression)
node test-e2e-all.mjs --skip-long

# 4. Verify deltas are flowing
node test-e2e-streaming.mjs

# 5. Manual: open browser, run generation, verify UI still works
#    (client ignores unknown types — should behave exactly as before)
```

### After Phase 2 deploy:
```bash
# 1. Unit test the store (fast, local)
node test-store-streaming.mjs

# 2. Deploy client
cd client && npm run build && docker logout registry.cloudflare.com && \
  docker builder prune -af && cd ../cloudflare && npx wrangler deploy

# 3. Existing E2E — no regression
node test-e2e-all.mjs --skip-long

# 4. Streaming E2E
node test-e2e-streaming.mjs

# 5. Reconnect E2E — verify event recovery still works
node test-e2e-reconnect.mjs

# 6. Manual UI checklist (see §2.2 above)
```

### After Phase 3 deploy:
```bash
# 1. Full E2E suite
node test-e2e-all.mjs

# 2. Streaming E2E
node test-e2e-streaming.mjs

# 3. Manual: verify no duplicate text, clean completion
```

---

## What Each Test Catches

| Risk | Test that catches it |
|------|---------------------|
| Breaking existing phase/tool/image events | Parser unit test (cases 7-9) + E2E generate |
| Deltas not arriving | E2E streaming (assertions 1-3) |
| Unbalanced text_start/text_end | E2E streaming (assertion 4) |
| EventBuffer overflow from deltas | E2E streaming (assertion 6 — no `id` on deltas) |
| Duplicate text from hasStreamedDeltas suppression failure | Parser unit test (case 4) + manual UI check |
| textAccumulator not accumulating (D1 persistence broken) | Parser unit test (case 10) |
| Client jank from unbatched deltas | Store unit test (batching case 7) + manual UI |
| Event recovery regression | E2E reconnect |
| Local dev regression | Manual local dev checklist |
