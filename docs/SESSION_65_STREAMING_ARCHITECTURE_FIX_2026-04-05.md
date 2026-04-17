# Session 65 — Streaming Architecture Fix (2026-04-05)

## Context

User reported text content tripling during live streaming on staging — same sentences repeated 3 times inline, and thinking block entries duplicated on follow-ups. Root cause investigation traced through the entire streaming pipeline (agent-runner → stdout → DO → WebSocket → client) and compared against Claude Code's source (`clause_code_source`).

## Root Cause

The system had multiple overlapping paths writing the same content to the client:

1. **Text path**: `text_delta` events (from stream events) AND assembled `assistant` messages (full text) both reached the client. Guards (`hasStreamedDeltas`, `hasStreamedText`) were supposed to prevent duplication but had timing holes — particularly a RAF race condition where `appendTextBlock` (synchronous) could fire between `appendTextDelta` RAF frames, creating a second text block that subsequent deltas would append to.

2. **Tool path**: Tool detection came only from assembled `assistant` messages (not from stream events). If the same message was processed multiple times (SSE replay, missing UUIDs), duplicate `tool_start`/`phase` events were emitted.

## Key Insight from Claude Code

Claude Code separates streaming state from committed state:
- **Streaming text** lives in a separate `streamingText` state variable (a "scratch pad"), NOT in the message blocks array
- **Tool detection** happens from `stream_event` `content_block_start`, not from assembled messages
- **Atomic commit**: on `content_block_stop`, streaming text is cleared and the final message is pushed — in one React batch. No gap, no duplication
- **One path per content type**: stream events for live display, assembled messages only for internal bookkeeping

## What We Fixed

### Fix 1: Streaming Text Scratch Pad (Client)

**Files:** `client/src/store/index.ts`, `client/src/hooks/useWebSocket.ts`, `client/src/components/chat/ChatMessage.tsx`

Adopted Claude Code's pattern — streaming text lives in a separate state variable, not in `msg.blocks[]`:

- **New `streamingText: string | null` state** — the scratch pad for live text
- **Simplified `appendTextDelta(delta)`** — only updates `streamingText` (RAF-batched string concatenation), no block array surgery
- **New `commitStreamingText()`** — atomically moves scratch pad content into `msg.blocks` and clears it (one `set()` call)
- **New `mergeAndStripTextBlocks()`** — on completion, merges all text blocks into one + strips image URLs (visual parity with D1 on refresh)
- **`setTextStreaming(true)`** now initializes `streamingText: ''`
- **`completeGeneration`/`cancelGeneration`/`failGeneration`** all clear `streamingText: null`

Event handler changes:
- `text_start` → commit leftover text (safety net), initialize streaming
- `text_delta` → `appendTextDelta(delta)` (scratch pad only)
- `text_end` → `commitStreamingText()` (atomic commit to blocks)
- `message` → guarded by `!store.streamingText` (only fires for local dev, never during streaming)
- `complete` → `commitStreamingText()` + `mergeAndStripTextBlocks()` before `completeGeneration()`
- `cancel` → `commitStreamingText()` before adding cancel message

ChatMessage rendering:
- Reads `streamingText` from store for the active streaming message
- Renders as a **separate element** after committed blocks (with cursor animation)
- `BlockRenderer` gets `isStreaming={false}` — committed blocks are never "streaming"

### Fix 2: Tool Detection from Stream Events (Server)

**Files:** `cloudflare/sandbox/agent-runner.ts`, `cloudflare/src/lib/sdk-message-parser.ts`

Moved tool detection from assembled messages to stream events (like Claude Code):

**Agent-runner:**
- Handles `content_block_start` with `type: 'tool_use'` → captures tool name + ID
- Accumulates tool input JSON from `input_json_delta` events
- On `content_block_stop` for tool_use → writes `tool_use_event` to stdout with parsed input
- **Stops writing assembled `assistant` messages to stdout** — only `system`, `user`, `result` messages pass through
- `processMessageForBlocks` still processes assembled messages internally for `turn-result.json` (unchanged)

**DO sdk-message-parser:**
- New `tool_use_event` handler — emits `tool_start`, `phase`, and `file` events via `emitEvent` (buffered)
- Contains all the same logic as the existing `assistant` → `tool_use` handler (phase detection, file write detection, friendly names)
- Existing `assistant` → `tool_use` handler preserved for local dev path (`runGenerationLocal`)

## Architecture After Fix

Each content type has exactly one path — no guards needed:

| Content | Source | Agent-runner stdout | DO handler | Client |
|---|---|---|---|---|
| Text | `stream_event` text_delta | `{"type":"text_delta","delta":"..."}` | `sendEphemeral` | scratch pad → commit |
| Tools | `stream_event` content_block_stop | `{"type":"tool_use_event","name":"...","input":{}}` | `emitEvent` (buffered) | thinking block child |
| Images | `user` message tool_result | unchanged | unchanged | gallery |
| Files | `tool_use_event` Write detection | same logic, new trigger | `emitEvent` | file panel |
| SDK session | `system` message | unchanged | unchanged | — |
| Completion | `result` message | unchanged | unchanged | — |

## Files Changed

| File | Lines | Changes |
|---|---|---|
| `client/src/store/index.ts` | +109/-50 | `streamingText` state, simplified `appendTextDelta`, `commitStreamingText`, `mergeAndStripTextBlocks`, clear streaming on complete/cancel/fail |
| `client/src/hooks/useWebSocket.ts` | +30/-12 | Wire new events, `!streamingText` guard, commit before complete/cancel |
| `client/src/components/chat/ChatMessage.tsx` | +23/-10 | Render streaming preview as separate element, remove unused `isStreaming` |
| `cloudflare/sandbox/agent-runner.ts` | +56/-10 | Tool_use from stream events, skip `assistant` from stdout, input JSON accumulation |
| `cloudflare/src/lib/sdk-message-parser.ts` | +96/-0 | New `tool_use_event` handler with phase/file/tool detection |

## Deployed

**Staging:** `https://creative-agent-staging.alphasapien17.workers.dev` — Version `30803e15`

## What Stays Unchanged

- `turn-result.json` → alarm → `finalizeGeneration` → D1 persistence (reliability layer)
- `processMessageForBlocks` in agent-runner (still processes assembled messages internally for block builder + text accumulator)
- Page refresh rendering (loads from D1 via REST API)
- WebSocket reconnect recovery (EventBuffer replay for structural events)
- Local dev server (`runGenerationLocal` — processes assembled messages directly, no streaming)
- Image processing pipeline
- Cancel flow (abort signal + cleanup)
- Credit/billing system

## Verification Plan

1. **Initial generation** — text streams without duplication, thinking block shows phases once
2. **Follow-up** — text streams cleanly, thinking block doesn't show duplicated "Generating images"
3. **Page refresh mid-generation** — D1 loads correctly after completion
4. **Page refresh after completion** — text rendered via MarkdownContent, same visual as live
5. **Cancel during streaming** — partial text committed, "Generation was cancelled." shown
6. **Local dev** — unchanged behavior (no streaming, text via `message` events)
