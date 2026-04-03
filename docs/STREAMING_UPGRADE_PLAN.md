# Streaming Upgrade — Implementation Plan

## Context

The current streaming pipeline sends **complete messages** from the Claude SDK, causing text to appear as whole paragraphs after long silences. The thinking block UI shows generic labels ("Parsing Request", "Processing follow-up......") with no personality. This upgrade adds token-level delta streaming + replaces the thinking block with Conversational Breadcrumbs + rotating verbs. The goal: a polished, Claude Code-like experience.

**Design decisions (agreed):**
- Spinner: Twin Orbit (2D, already built)
- Thinking UI: Conversational Breadcrumbs (concept D)
- Two modes: full generation (breadcrumbs) vs conversation (typing indicator)

---

## Phase 1: Backend Pipeline

Each step is independently deployable. Client ignores unknown event types.

### 1.1 — Enable delta streaming in agent-runner

**File:** `cloudflare/sandbox/agent-runner.ts`

- Add `includePartialMessages: true` to `baseOptions` (line 98)
- Track text block boundaries with `inTextBlock: boolean` flag (reset per turn)
- Restructure the main loop (line 310) to filter stream events:
  ```
  let inTextBlock = false;

  for await (const message of query(...)) {
    // NEW: Handle stream events — extract text deltas + block boundaries
    if (message.type === 'stream_event') {
      const evt = message.event;

      // Text block boundary: content_block_start with type 'text'
      if (evt?.type === 'content_block_start' && evt?.content_block?.type === 'text') {
        inTextBlock = true;
        stdout.write({ type: 'text_start' })
      }

      // Token-level delta
      if (evt?.type === 'content_block_delta' && evt?.delta?.type === 'text_delta') {
        stdout.write({ type: 'text_delta', delta: evt.delta.text })
      }

      // Text block boundary: content_block_stop after a text block
      if (evt?.type === 'content_block_stop' && inTextBlock) {
        inTextBlock = false;
        stdout.write({ type: 'text_end' })
      }

      continue;  // skip blockBuilder, completion handling
    }

    // EXISTING: complete messages — unchanged
    stdout.write(JSON.stringify(message))
    processMessageForBlocks(message, blockBuilder, textAccumulator)
    if (message.type === 'result') { ... writeCompletionMarker ... }
  }
  ```

**Why `content_block_start`/`content_block_stop` instead of inferring from deltas:**
The Anthropic streaming API interleaves multiple content blocks per response (text → tool_use → text → tool_use). Using the actual block boundary events gives correct `text_start`/`text_end` pairs for each text segment. Inferring from deltas alone would miss intermediate boundaries in multi-block responses.

**Note on UUIDs:** `SDKPartialAssistantMessage` (type `stream_event`) does carry a `uuid` field in the SDK types. However, agent-runner writes custom `{ type: 'text_delta' }` lines to stdout — not the raw `stream_event` messages — so these custom lines have no UUID and pass through the DO's `seenUuids` dedup untouched. The existing dedup continues to filter duplicate complete messages as before.

### 1.2 — Handle text_delta in sdk-message-parser

**File:** `cloudflare/src/lib/sdk-message-parser.ts`

- Add `hasStreamedDeltas: boolean` to `ParserContext` interface (line 18)
- Add handler at top of `processSDKMessage()`:
  ```
  if (message.type === 'text_delta') → sendEphemeral({ type: 'text_delta', delta })
  if (message.type === 'text_start') → sendEphemeral({ type: 'text_start' })
  if (message.type === 'text_end') → sendEphemeral({ type: 'text_end' })
  ```
  Uses `sendEphemeral` (unbuffered broadcast) — NOT `emitEvent` (which buffers into EventBuffer). See §1.4 for rationale.
- When `hasStreamedDeltas === true`, skip `emitEvent({ type: 'message' })` for text blocks in complete `assistant` messages. Still process `tool_use` blocks. Still accumulate `textAccumulator.text`.

### 1.3 — Add types

**File:** `cloudflare/src/lib/types.ts`

- Add `'text_delta' | 'text_start' | 'text_end'` to `ServerMessage.type` union
- Add `delta?: string` field

### 1.4 — Wire into ParserContext creation

**File:** `cloudflare/src/durable-objects/campaign-session.ts`

- Add `hasStreamedDeltas: false` to `createStreamingContext()` (~line 1280)
- No structural changes to `streamForLiveUI`, `tryFinalize`, `finalizeGeneration`

**Critical: Use `sendWS()` for delta events, NOT `emitEvent()`.**

`emitEvent()` buffers events into the `EventBuffer` (max 1000, trims to 500). A single generation can produce 200-500 text deltas. Buffering them would overflow the ring buffer and evict important events (phases, tools, images) that are needed for reconnect recovery.

Instead, `text_delta`/`text_start`/`text_end` should use `sendWS()` (broadcast to all tabs without buffering). These events are ephemeral — on reconnect or page refresh, the client loads full text from D1. Only the `complete` event's summary matters for recovery.

In `sdk-message-parser.ts`, the `emitEvent` callback is passed via `ParserContext`. To support both buffered and unbuffered emission, add a `sendEphemeral` callback to `ParserContext`:
```
interface ParserContext {
  emitEvent: (event: ServerMessage) => void;      // buffered (phases, tools, images, complete)
  sendEphemeral: (event: ServerMessage) => void;   // fire-and-forget (text deltas)
  // ... existing fields
}
```

Wire `sendEphemeral` to `this.sendWS.bind(this)` in `createStreamingContext()`.

### 1.5 — Local runner

**File:** `cloudflare/src/lib/local-ai-runner.ts`

- No changes. Stays on complete messages. `hasStreamedDeltas` remains false → existing behavior preserved.

---

## Phase 2: Client UI

### 2.1 — New store actions

**File:** `client/src/store/index.ts`

- `appendTextDelta(campaignId, messageId, delta)` — appends to last text block's content, or creates new text block if last block isn't text. **Must batch internally** (see 2.1a below).
- `setTextStreaming(campaignId, messageId, streaming)` — sets `textStreamingMessageId` for cursor display
- Keep existing `appendTextBlock` for fallback/summaries

#### 2.1a — Delta batching (required, not optional)

At ~50 tokens/sec, unbatched deltas cause 50 Zustand immutable updates → 50 React re-renders per second. This will cause visible jank, especially on mobile.

**Implementation**: Buffer deltas in the store action, flush on `requestAnimationFrame`:
```
let deltaBuffer = '';
let rafId: number | null = null;

appendTextDelta(campaignId, messageId, delta) {
  deltaBuffer += delta;
  if (!rafId) {
    rafId = requestAnimationFrame(() => {
      // single Zustand update with accumulated deltaBuffer
      flushDeltaBuffer(campaignId, messageId, deltaBuffer);
      deltaBuffer = '';
      rafId = null;
    });
  }
}
```

This batches all deltas that arrive within a single animation frame (~16ms at 60fps) into one state update. Simple, no timers to clean up, naturally tied to render cadence.

### 2.2 — New WS event types

**File:** `client/src/types/websocket.ts`

- Add `WSTextDeltaEvent`, `WSTextStartEvent`, `WSTextEndEvent` interfaces
- Add to `WSServerMessage` union

### 2.3 — Handle events in useWebSocket

**File:** `client/src/hooks/useWebSocket.ts`

- Add `text_delta` case → `store.appendTextDelta()`
- Add `text_start` case → `store.setTextStreaming(true)`
- Add `text_end` case → `store.setTextStreaming(false)`
- Keep existing `message` case as fallback (for local runner, recovery)

### 2.4 — BreadcrumbsIndicator component

**File (new):** `client/src/components/chat/blocks/BreadcrumbsIndicator.tsx`

Replaces ThinkingBlock for active generation. Same `ThinkingBlockData` prop.

Structure:
- **Completed phases**: `✓ {phase text}` one-liners, faded
- **Active phase**: `OrbitalSpinner` + text + rotating verb + elapsed timer
- **Image progress**: thin bar when `expectedImages > 0`
- **Conversation mode**: just spinner + verb (no phases)

Rotating verbs: 90+ verbs from a constant array, `setInterval(800ms)`, random pick.

### 2.5 — Update BlockRenderer

**File:** `client/src/components/chat/blocks/BlockRenderer.tsx`

- `block.status === 'active'` → render `BreadcrumbsIndicator`
- `block.status === 'complete' | 'error'` → render old `ThinkingBlock` (collapsed)

### 2.6 — Streaming cursor in TextBlock

**File:** `client/src/components/chat/blocks/TextBlock.tsx`

- Accept `isStreaming` prop
- Show blinking cursor `|` at end of content when true
- During streaming: render raw text (skip markdown parsing for performance)
- On `text_end`: switch to `MarkdownContent`

### 2.7 — Wire streaming state through ChatMessage

**File:** `client/src/components/chat/ChatMessage.tsx`

- Read `textStreamingMessageId` from store
- Pass `isStreaming` to BlockRenderer → TextBlock

---

## Phase 3: Polish

### 3.1 — Remove `seenTextsRef` dedup
Once confident server-side suppression works, remove from `useWebSocket.ts`.

### 3.2 — Clean up `complete` handler
Skip appending summary text if streamed text already exists in blocks.

### 3.3 — Typing indicator for conversation mode
New `TypingIndicator.tsx` — just OrbitalSpinner + verb. Used when follow-up has no phase events.

### 3.4 — Breadcrumb text enrichment
Enrich phase labels in `sdk-message-parser.ts` with context (brand name, hook count, etc.)

---

## What Stays Unchanged

- `turn-result.json` + `tryFinalize` + `finalizeGeneration` — reliability layer, untouched
- `writeCompletionMarker` in agent-runner — still builds from complete messages
- `processMessageForBlocks` in agent-runner — still builds blocks for turn-result.json
- `BlockBuilder` (both agent-side and DO-side) — still builds for persistence
- Image processing pipeline — `tool_result` with images, `reconcileImages`
- File detection — Write tool with campaign paths
- Phase detection — from `tool_use` blocks in complete messages
- D1 persistence — all writes happen in `finalizeGeneration`
- Event recovery — `EventBuffer` + `subscribe` with `lastEventId` (deltas NOT buffered — only structural events are recoverable, text comes from D1 on refresh)
- Local dev server — no changes, stays on complete messages

## Files Modified

| File | Change |
|---|---|
| `cloudflare/sandbox/agent-runner.ts` | `includePartialMessages`, filter stream events, text_start/end sentinels |
| `cloudflare/src/lib/sdk-message-parser.ts` | Handle text_delta/start/end, hasStreamedDeltas flag, skip text in complete msgs |
| `cloudflare/src/lib/types.ts` | Add text_delta/start/end to ServerMessage |
| `cloudflare/src/durable-objects/campaign-session.ts` | Add hasStreamedDeltas + sendEphemeral to ParserContext |
| `client/src/store/index.ts` | appendTextDelta (with rAF batching), setTextStreaming actions |
| `client/src/types/websocket.ts` | New event interfaces |
| `client/src/hooks/useWebSocket.ts` | Handle text_delta/start/end events |
| `client/src/components/chat/blocks/BreadcrumbsIndicator.tsx` | **New** — breadcrumbs UI |
| `client/src/components/chat/blocks/BlockRenderer.tsx` | Route active blocks to BreadcrumbsIndicator |
| `client/src/components/chat/blocks/TextBlock.tsx` | Add streaming cursor |
| `client/src/components/chat/ChatMessage.tsx` | Pass isStreaming prop |

## Known Limitations & Recovery Behavior

### Partial text on stream failure
If the live SSE stream dies mid-way through deltas, the client has partial streamed text. The alarm finalizes and emits a `complete` event with a 500-char summary (truncated at `campaign-session.ts:370`). **Full text only appears after page refresh** — D1 has the complete text from `finalizeGeneration()`. This is acceptable: the reliability layer guarantees data integrity, not streaming UX continuity.

### `hasStreamedDeltas` doesn't survive DO reset
If the DO resets mid-generation (rare — only happens on code deploy), a new `ParserContext` is created with `hasStreamedDeltas: false`. If the stream resumes from logs, complete `assistant` messages would emit `message` events, potentially duplicating text already received as deltas. Mitigated by client-side `seenTextsRef` dedup. Low risk in practice.

### Text deltas not recoverable on WebSocket reconnect
Since `text_delta` events use `sendWS()` (unbuffered), they are NOT replayed via `EventBuffer` on reconnect. If a tab disconnects and reconnects mid-generation, it will miss deltas sent while disconnected. Structural events (phases, tools, images) ARE recovered. Streamed text is only complete if the tab stays connected for the full generation. On page refresh, D1 provides the full text.

### Multi-block text per turn
The agent may produce multiple text segments interspersed with tool calls in a single turn (text → tool_use → text → tool_use → text). Each segment gets its own `text_start`/`text_end` pair. The client must handle multiple text blocks per assistant message. The existing `appendTextDelta` "create new text block if last block isn't text" logic handles this correctly.

## Verification

See **[STREAMING_UPGRADE_TESTING.md](./STREAMING_UPGRADE_TESTING.md)** for the full testing plan.

**Summary per phase:**

| Phase | Tests | What they verify |
|-------|-------|-----------------|
| Phase 1 | `test-parser-streaming.mjs` (unit) + `test-e2e-streaming.mjs` (E2E) + existing E2E suite | Parser handles new types, doesn't break existing. Deltas flow over WS. Existing client unaffected |
| Phase 2 | `test-store-streaming.mjs` (unit) + manual UI checklist + E2E reconnect | Store batching works, streaming cursor, breadcrumbs, recovery, multi-tab, local dev regression |
| Phase 3 | Full E2E suite + manual dedup/completion check | No duplicate text after seenTextsRef removal, clean completion |
