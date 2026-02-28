# Phase 3: CampaignSession Durable Object — Implementation Summary

> Completed: 2026-02-28
> Depends on: Phase 1 (D1 data layer), Phase 2 (Worker API routes)
> Next: Phase 4 (Sandbox container — replaces `runGeneration()` stub)

---

## Overview

Phase 3 replaced the stub `CampaignSession` Durable Object (which returned 501) with a fully functional WebSocket handler. It ports the logic from `server/lib/websocket-handler.ts` (1607 lines) into the Cloudflare Durable Object model using the WebSocket Hibernation API.

The `runGeneration()` method is **stubbed** — it creates the campaign, sends events, then returns an `incomplete` error ("Sandbox not configured"). Phase 4 will replace the stub with actual sandbox execution. All surrounding logic (campaign creation, event buffering, SDK message parsing, reconnection, cancel, DB writes) is fully functional.

---

## Files Created

### 1. `cloudflare/src/lib/types.ts` (70 lines)

Shared type definitions extracted from `server/lib/websocket-handler.ts:17-157`.

| Export | Description |
|---|---|
| `ClientMessage` | Interface for 5 client→server message types (generate, follow_up, cancel, subscribe, ping) |
| `ServerMessage` | Interface for 13 server→client event types (ack, phase, tool_start, tool_end, message, status, image, file, complete, error, incomplete, pong, subscribed) |
| `HookType` | Union type: `'stat' \| 'story' \| 'fomo' \| 'curiosity' \| 'callout' \| 'contrast'` |
| `HOOK_TYPE_ORDER` | Array mapping image index position to hook type |
| `getHookTypeForIndex(index)` | Maps 1-based image index to `HookType` (index 1→stat, 2→story, etc.) |
| `extractCampaignName(prompt)` | Extracts display name from prompt (e.g., `"nike.com"` → `"Nike"`, `"sell shoes"` → `"Sell"`) |
| `BufferedEvent` | Interface for events stored in the replay buffer (`{ id, event, timestamp }`) |

### 2. `cloudflare/src/lib/event-buffer.ts` (50 lines)

Per-DO event buffer for WebSocket resilience. Simplified from `server/lib/event-buffer.ts`.

| Aspect | Server version | DO version |
|---|---|---|
| Storage | `Map<string, EventBuffer>` (global) | Single class instance (per-DO) |
| Cleanup | `setInterval` every 5 min, 40-min TTL | None — DO eviction handles it |
| Constants | `MAX_EVENTS_PER_SESSION=1000` | `MAX_EVENTS=1000`, `TRIM_TO=500` |

**API:**
- `append(event)` → returns assigned event ID (monotonically increasing)
- `getEventsSince(afterId)` → returns events with `id > afterId` (for replay)
- `getLatestEventId()` → current high-water mark
- `hasEvents()` → true if buffer has any events
- `clear()` → reset buffer (called before follow-up to remove stale events)

### 3. `cloudflare/src/lib/block-builder.ts` (100 lines)

Verbatim port of the `BlockBuilder` class from `server/lib/websocket-handler.ts:254-356`. Builds the `blocks` JSON array that gets persisted with assistant messages for rendering in the chat UI after page refresh.

Uses types from `cloudflare/src/db/messages.ts`: `MessageBlock`, `ThinkingBlockData`, `ThinkingChild`.

**API:**
- `openThinkingBlock(label, expectedImages?)` — opens a collapsible thinking section (auto-closes previous)
- `closeThinkingBlock(status)` — marks thinking block as `'complete'` or `'error'`
- `addThinkingChild(kind, text, variant?)` — adds a child entry (tool, status, progress, etc.)
- `setExpectedImages(count)` / `incrementCompletedImages()` — tracks image generation progress
- `addTextBlock(content)` — adds a text block (for the final summary)
- `addStatusBlock(text, variant)` — adds a status block (info/success/error)
- `getBlocks()` — returns final array, auto-closing open thinking blocks, filtering empty ones

### 4. `cloudflare/src/lib/sdk-message-parser.ts` (230 lines)

Port of `processSDKMessage()` from `server/lib/websocket-handler.ts:359-606`.

**Key difference from server code:** All D1 calls are `await`ed (server uses sync better-sqlite3).

**Eliminated from server version:**
- `SDKInstrumentor` — not needed in DO (no session-level metrics)
- `imageEvents` / `registerMcpSession` — DO will parse images from sandbox stdout in Phase 4
- `broadcastToConnection(state, ...)` — replaced by `ctx.emitEvent(event)`

**`ParserContext` interface:**
```typescript
interface ParserContext {
  emitEvent: (event: ServerMessage) => void;
  campaignId: string | null;
  d1: D1Database;
  processedFilenames: Set<string>;
  textAccumulator: TextAccumulator;
  blockBuilder: BlockBuilder;
  imageCounter: { next: number };
}
```

**Message handling logic:**

| SDK message type | Actions |
|---|---|
| `system` init with `session_id` | `await db.updateSdkSessionId()` — saves for follow-up resume |
| `assistant` → `text` block | Accumulate in `textAccumulator`, emit `{ type: 'message', text }` |
| `assistant` → `tool_use` | Emit `tool_start`, add to blockBuilder, detect phase + file writes |
| `user` → `tool_result` | Emit `tool_end`, extract images from JSON result, dedup, assign global index |

**Phase detection (from tool_use):**
- `Task` with `subagent_type='Explore'` or description includes 'research' → `phase: 'research'`
- `Skill` with `skill='hook-methodology'` → `phase: 'hooks'`
- `Skill` with `skill='art-style'` → `phase: 'art'`
- `mcp__nano-banana__generate_ad_images` → `phase: 'images'`

**File detection (from Write tool_use):**
- Path contains `research` → `fileType: 'research'`
- Path contains `hook` → `fileType: 'hooks'`
- Path contains `prompt` → `fileType: 'prompts'`
- Emits `{ type: 'file', fileType, content, path }` + persists via `db.updateCampaignFile()`

**Image extraction (from tool_result):**
- Parses result content as JSON, looks for `.images[]`
- Dedup by `filename` via `processedFilenames` Set
- Server assigns global index via `imageCounter.next++`
- Maps index to hookType via `getHookTypeForIndex()`
- Emits `{ type: 'image', urlPath, hookType, imageIndex, ... }` + persists via `db.addCampaignImage()`

### 5. `cloudflare/src/durable-objects/campaign-session.ts` (310 lines)

The core Durable Object. One instance per user (`idFromName(userId)`).

**WebSocket Hibernation API:**

| Method | Purpose |
|---|---|
| `fetch(request)` | Accepts WebSocket upgrade via `state.acceptWebSocket(server)`, extracts userId from `X-User-Id` header, sends initial ack |
| `webSocketMessage(ws, data)` | Parses `ClientMessage`, dispatches to handler. Updates `this.ws` ref (may change after hibernation wake) |
| `webSocketClose(ws, code, reason)` | Clears ws ref if still current. Does NOT abort generation — it continues in background, buffering events for reconnect |
| `webSocketError(ws, error)` | Logs error, clears ws ref |

**Instance state (transient, in-memory):**
```
ws: WebSocket | null           — current connected client
userId: string                 — from X-User-Id header
sessionId: string | null       — WS session ID (e.g., "ws-1709123456789")
campaignId: string | null      — D1 campaign ID (e.g., "campaign_mm6fn5...")
isGenerating: boolean          — concurrency guard
abortController: AbortController | null  — for cancel
eventBuffer: EventBuffer       — replay buffer (one per DO)
```

**Message handlers:**

| Handler | Flow |
|---|---|
| `handleGenerate(prompt, sessionId?)` | Concurrency guard → create session → create campaign in D1 → save user message → emit ack (with campaignId) → emit phase:parse → call `runGeneration()` → cleanup |
| `handleFollowUp(prompt, campaignId)` | Concurrency guard → lookup campaign → get sdkSessionId → set state → clear stale events → save user message → update status to 'generating' → emit ack → call `runGeneration()` → cleanup |
| `handleCancel()` | Abort via `abortController.abort()` → send ack "Cancel requested" |
| `handleSubscribe(ws, sessionId?, lastEventId?)` | Validate sessionId → check buffer exists → replay missed events → send `subscribed` confirmation |
| `handlePing()` | Send `{ type: 'pong' }` |

**`runGeneration()` — STUB (Phase 4 replaces):**
1. Sets up `BlockBuilder`, `TextAccumulator`, `processedFilenames`, `imageCounter`
2. Creates `ParserContext`
3. Sends `{ type: 'incomplete', error: 'sandbox_not_configured' }`
4. Updates campaign status to `'incomplete'`
5. Saves assistant message with status block

**Helper methods:**
- `emitEvent(event)` — appends to event buffer AND sends to WebSocket (for live delivery + replay)
- `sendWS(event)` — sends directly without buffering (for ack, pong, errors that don't need replay)
- `generateSummary(textAccumulator, imageCounter)` — returns accumulated text, or hook-based fallback like "I created 6 ad concepts: Stat Hook, Story Hook, ..."

## File Modified

### 6. `cloudflare/src/index.ts`

**Before (stub):**
```typescript
export class CampaignSession implements DurableObject {
  async fetch(request: Request): Promise<Response> {
    return new Response('CampaignSession not yet implemented', { status: 501 });
  }
}
// ...
return stub.fetch(request);
```

**After:**
```typescript
export { CampaignSession } from './durable-objects/campaign-session.js';
// ...
const doRequest = new Request(request.url, request);
doRequest.headers.set('X-User-Id', userId);
return stub.fetch(doRequest);
```

Changes:
- Removed inline 10-line stub class
- Added re-export from `./durable-objects/campaign-session.js` (required by wrangler)
- Added `X-User-Id` header forwarding: Worker verifies JWT, passes userId to DO via internal header. DO trusts this header since only the Worker can route to it.

---

## Architecture

```
Browser ─── WebSocket ──→ Worker (/ws) ──→ Durable Object (CampaignSession)
                                              │
                                              ├── fetch() → acceptWebSocket()
                                              ├── webSocketMessage() → dispatch
                                              ├── webSocketClose() → clear ws ref
                                              │
                                              ├── EventBuffer (in-memory, per-DO)
                                              ├── processSDKMessage() (sdk-message-parser.ts)
                                              ├── BlockBuilder (block-builder.ts)
                                              ├── D1 writes (campaigns, files, images, messages)
                                              │
                                              └── runGeneration() ← STUB (Phase 4: Sandbox)
```

**Flow for `generate`:**
1. Worker receives WS upgrade at `/ws`, verifies Clerk JWT (or returns `'anonymous'` in dev)
2. Worker creates `new Request()` with `X-User-Id` header, forwards to DO via `stub.fetch()`
3. DO accepts WebSocket via `state.acceptWebSocket()`, sends initial `ack`
4. Client sends `{ type: 'generate', prompt: 'nike.com', sessionId: 'test-1' }`
5. DO creates campaign in D1 (name: "Nike", status: "generating")
6. DO saves user message, emits `ack` (with campaignId) + `phase:parse`
7. DO calls `runGeneration()` — **stub sends `incomplete` and marks campaign as `incomplete`**
8. If client disconnects and reconnects, `subscribe` replays all buffered events

---

## Design Decisions

| Decision | Rationale |
|---|---|
| One DO per user (not per campaign) | Architecture doc spec. `idFromName(userId)` — all campaigns for a user share one DO |
| WebSocket Hibernation API | `state.acceptWebSocket()` + `webSocketMessage()`. DO sleeps between messages, zero cost while idle |
| Event buffer in DO memory | Transient, generation-lifetime. Lost on DO eviction — acceptable since buffers only live ~1-3 min during generation |
| userId via X-User-Id header | Worker verifies JWT and passes to DO. DO trusts internal header since only the Worker routes to it |
| Stub `runGeneration()` | All surrounding logic (create campaign, buffer events, replay on reconnect, cancel, DB writes) is fully testable. Phase 4 fills in the sandbox execution |
| Session manager eliminated | DO instance IS the session. `sdk_session_id` stored in D1's `campaigns.sdk_session_id` column |
| No EventEmitter bridge | Eliminated `imageEvents` from server. Phase 4: DO will parse images directly from sandbox stdout |
| `emitEvent` vs `sendWS` | `emitEvent` buffers + sends (for replayable events). `sendWS` sends only (for ack, pong, transient errors) |

---

## Porting Reference

### Source → destination mapping

| Server File | Cloudflare File | Lines | Notes |
|---|---|---|---|
| `server/lib/websocket-handler.ts:17-157` | `src/lib/types.ts` | 70 | Types extracted to own file |
| `server/lib/event-buffer.ts` | `src/lib/event-buffer.ts` | 50 | Simplified: class not Map, no cleanup timer |
| `server/lib/websocket-handler.ts:254-356` | `src/lib/block-builder.ts` | 100 | Verbatim port |
| `server/lib/websocket-handler.ts:358-606` | `src/lib/sdk-message-parser.ts` | 230 | Async D1, eliminated instrumentor/imageEvents |
| `server/lib/websocket-handler.ts` (all) | `src/durable-objects/campaign-session.ts` | 310 | Full DO with hibernation API |
| `server/lib/session-manager.ts` (343 lines) | **Eliminated** | — | DO state + D1 replace file-based sessions |
| `server/lib/image-events.ts` (36 lines) | **Eliminated** | — | Phase 4: DO parses images from stdout |
| `server/lib/instrumentor.ts` | **Eliminated** | — | Not needed in DO |

### Protocol compatibility

All 13 server→client event types preserved with identical shapes:
`ack`, `phase`, `tool_start`, `tool_end`, `message`, `status`, `file`, `image`, `complete`, `error`, `incomplete`, `pong`, `subscribed`

All 5 client→server message types preserved:
`generate`, `follow_up`, `cancel`, `subscribe`, `ping`

**Zero client-side changes required** — the React frontend connects to the same WebSocket protocol.

---

## Verification Results

### TypeScript
```
$ cd cloudflare && npx tsc --noEmit
# No errors — clean compilation
```

### Local testing with `wrangler dev` (port 8787)

All 5 manual tests passed:

| # | Test | Command | Result |
|---|---|---|---|
| 1 | Connect → ack | Open WS to `ws://localhost:8787/ws` | `{"type":"ack","message":"Connected to Creative Machine"}` |
| 2 | Ping → pong | Send `{"type":"ping"}` | `{"type":"pong","timestamp":"..."}` |
| 3 | Generate → ack + phase + incomplete | Send `{"type":"generate","prompt":"nike.com","sessionId":"test-1"}` | 3 events: `ack` (with campaignId `campaign_mm6fn5427b6m9o`), `phase:parse`, `incomplete` (sandbox_not_configured) |
| 4 | Reconnect + subscribe → replay | Disconnect, reconnect, send `{"type":"subscribe","sessionId":"test-1","lastEventId":0}` | All 3 buffered events replayed + `subscribed` confirmation ("Replayed 3 events") |
| 5 | REST API still works | `curl /health` + `curl /api/campaigns` | Health: D1 connected, 1 campaign. Campaigns: Nike campaign with status `incomplete` |

### D1 verification

After the generate test, the local D1 database contained:
- **campaigns table:** 1 row — `id=campaign_mm6fn5427b6m9o`, `user_id=anonymous`, `name=Nike`, `status=incomplete`, `session_id=test-1`
- **campaign_files table:** 3 rows — research, hooks, prompts (empty, created by `createCampaign()`)
- **messages table:** 2 rows — user message ("nike.com") + assistant message ("Sandbox not configured...")

---

## Phase 4 Integration Point

The `runGeneration()` method in `campaign-session.ts` is the single integration point for Phase 4. It currently sends an `incomplete` event. Phase 4 will replace the stub body with:

```
1. getSandbox(env.SANDBOX, `user-${userId}`)
2. sandbox.mountBucket('creative-agent-assets', '/mnt/r2', ...)
3. stream = sandbox.execStream('npx tsx /app/agent-runner.ts', { env: { PROMPT, SESSION_ID, ... } })
4. for await (const event of stream) {
     parse JSON line → processSDKMessage(sdkMessage, ctx)
   }
5. Handle completion/cancellation/errors (patterns already in the catch/finally blocks)
```

The `ParserContext`, `BlockBuilder`, `EventBuffer`, and all D1 persistence code is ready — Phase 4 only needs to produce the SDK message stream.
