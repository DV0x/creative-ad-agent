# Phase 3: CampaignSession Durable Object (WebSocket)

> Implementation plan for the real-time WebSocket layer.
> Depends on: Phase 1 (D1 data layer), Phase 2 (Worker API routes)
> Created: 2026-02-28

---

## Table of Contents

1. [Context](#1-context)
2. [Architecture Summary](#2-architecture-summary)
3. [Files to Create](#3-files-to-create)
4. [Files to Modify](#4-files-to-modify)
5. [Implementation Order](#5-implementation-order)
6. [Key Design Decisions](#6-key-design-decisions)
7. [Porting Reference](#7-porting-reference)
8. [Verification](#8-verification)

---

## 1. Context

Phases 1-2 built the D1 database layer and REST API routes. Phase 3 builds the **Durable Object** — the WebSocket handler that accepts client connections, dispatches messages, buffers events for reconnection, parses SDK messages into WS events, and persists results to D1.

Phase 3 implements everything **except** the actual AI execution (sandbox). The `generate` and `follow_up` handlers have a clear integration point (`runGeneration()`) that Phase 4 will fill with sandbox container execution. For now, this method is stubbed — but all surrounding logic (campaign creation, event buffering, message parsing, DB writes, cancel, subscribe, reconnect) is fully functional.

This lets us:
- Deploy and test the full WS protocol with `wrangler dev` locally
- Verify reconnection, event replay, cancel, ping/pong end-to-end
- Test the SDK message parser with mock messages
- Ship ~80% of the new code before touching Docker/sandbox infrastructure

### What changes vs what stays the same

| Component | Status |
|---|---|
| Client React code | **Unchanged** — zero changes |
| WebSocket protocol (13 event types) | **Unchanged** — same message shapes |
| REST API contract | **Unchanged** — Phase 2 handles this |
| Image URL format (`/images/{sessionId}/{filename}`) | **Unchanged** |
| Database schema | **Unchanged** — Phase 1 handles this |
| DB access layer | **Reused** — existing `cloudflare/src/db/` (async D1) |
| WebSocket handler | **Rewritten** — `ws` library → DO WebSocket Hibernation API |
| Session manager | **Eliminated** — DO state + D1 replace file-based sessions |
| Event buffer | **Simplified** — per-DO instance, no Map |
| Image events bridge | **Eliminated** — DO will parse images from sandbox stdout (Phase 4) |

---

## 2. Architecture Summary

```
Browser ─── WebSocket ──→ Worker (/ws) ──→ Durable Object (CampaignSession)
                                                │
                                                ├── fetch() — WebSocket upgrade
                                                ├── webSocketMessage() — message dispatch
                                                ├── webSocketClose() — cleanup
                                                │
                                                ├── Event buffer (in-memory)
                                                ├── SDK message parser (processSDKMessage)
                                                ├── Block builder (message persistence)
                                                ├── D1 writes (campaigns, files, images, messages)
                                                │
                                                └── runGeneration() ← STUB (Phase 4: Sandbox)
```

**Phase 3 flow (with stub):**
1. Worker receives WS upgrade at `/ws`, verifies Clerk JWT, routes to DO by userId
2. DO accepts WebSocket via hibernation API, sends initial `ack`
3. Client sends `generate` → DO creates campaign in D1, sends `ack` with campaignId
4. DO calls `runGeneration()` — **stub returns error** "Sandbox not configured (Phase 4)"
5. Client sends `subscribe` → DO replays buffered events since `lastEventId`
6. Client sends `cancel` → DO sets abort flag, updates campaign status
7. Client sends `ping` → DO sends `pong`

**Phase 4 will replace the stub** with: getSandbox → mountBucket → execStream → parse stdout

---

## 3. Files to Create

### 3.1 `cloudflare/src/lib/types.ts` (~80 lines)

Shared type definitions. Ported from `server/lib/websocket-handler.ts:17-157`.

```typescript
// Client → Server
export interface ClientMessage {
  type: 'generate' | 'cancel' | 'ping' | 'subscribe' | 'follow_up';
  prompt?: string;
  sessionId?: string;
  campaignId?: string;
  lastEventId?: number;
  assetFileIds?: string[];
}

// Server → Client (all 13 event types)
export interface ServerMessage {
  type: 'phase' | 'tool_start' | 'tool_end' | 'message' | 'status' |
        'image' | 'file' | 'complete' | 'error' | 'incomplete' |
        'ack' | 'pong' | 'subscribed';
  timestamp: string;
  id?: number | string;
  // Phase events
  phase?: string;
  label?: string;
  // Tool events
  tool?: string;
  toolId?: string;
  input?: any;
  success?: boolean;
  // Message events
  text?: string;
  message?: string;
  // Image events
  urlPath?: string;
  prompt?: string;
  filename?: string;
  hookType?: HookType;
  imageIndex?: number;
  // File events
  fileType?: 'research' | 'hooks' | 'prompts';
  content?: string;
  path?: string;
  // Error events
  error?: string;
  // Complete events
  sessionId?: string;
  duration?: number;
  imageCount?: number;
  summary?: string;
  // Ack events
  campaignId?: string;
}

// Hook types
export type HookType = 'stat' | 'story' | 'fomo' | 'curiosity' | 'callout' | 'contrast';
export const HOOK_TYPE_ORDER: HookType[] = ['stat', 'story', 'fomo', 'curiosity', 'callout', 'contrast'];

export function getHookTypeForIndex(index: number): HookType {
  return HOOK_TYPE_ORDER[index - 1] || 'stat';
}

export function extractCampaignName(prompt: string): string {
  // Extract domain name or first word from prompt
}

// Event buffer types
export interface BufferedEvent {
  id: number;
  event: ServerMessage;
  timestamp: number;
}
```

### 3.2 `cloudflare/src/lib/event-buffer.ts` (~80 lines)

Per-DO event buffer. Simplified from `server/lib/event-buffer.ts` — no Map needed since each DO has its own instance.

```typescript
import type { ServerMessage, BufferedEvent } from './types.js';

export class EventBuffer {
  private events: BufferedEvent[] = [];
  private nextId = 1;
  private static MAX_EVENTS = 1000;
  private static TRIM_TO = 500;

  append(event: ServerMessage): number {
    // Trim oldest events if buffer is full
    if (this.events.length >= EventBuffer.MAX_EVENTS) {
      this.events = this.events.slice(-EventBuffer.TRIM_TO);
    }
    const id = this.nextId++;
    this.events.push({ id, event, timestamp: Date.now() });
    return id;
  }

  getEventsSince(afterId: number): BufferedEvent[] {
    return this.events.filter(e => e.id > afterId);
  }

  getLatestEventId(): number { return this.nextId - 1; }
  hasEvents(): boolean { return this.events.length > 0; }
  clear(): void { this.events = []; this.nextId = 1; }
}
```

### 3.3 `cloudflare/src/lib/block-builder.ts` (~100 lines)

Copied verbatim from `server/lib/websocket-handler.ts:254-356`. Uses types from `cloudflare/src/db/messages.ts` (MessageBlock, ThinkingBlockData, ThinkingChild).

```typescript
import type { MessageBlock, ThinkingBlockData, ThinkingChild } from '../db/index.js';

export class BlockBuilder {
  private blocks: MessageBlock[] = [];
  private currentThinkingBlock: ThinkingBlockData | null = null;
  private idCounter = 0;

  openThinkingBlock(label: string, expectedImages?: number): void;
  closeThinkingBlock(status: 'complete' | 'error'): void;
  addThinkingChild(kind: ThinkingChild['kind'], text: string, variant?: 'info' | 'success' | 'error'): void;
  setExpectedImages(count: number): void;
  incrementCompletedImages(): void;
  addTextBlock(content: string): void;
  addStatusBlock(text: string, variant: 'info' | 'success' | 'error'): void;
  getBlocks(): MessageBlock[];  // Auto-closes open thinking block, filters empty blocks
}
```

### 3.4 `cloudflare/src/lib/sdk-message-parser.ts` (~250 lines)

Ported from `processSDKMessage()` in `server/lib/websocket-handler.ts:358-606`.

**Key difference: all D1 calls are async** (the current server uses sync better-sqlite3).

```typescript
import type { ServerMessage, HookType } from './types.js';
import type { BlockBuilder } from './block-builder.js';
import * as db from '../db/index.js';

export interface ParserContext {
  emitEvent: (event: ServerMessage) => number;  // Send WS event + buffer
  campaignId: string | null;
  d1: D1Database;                    // D1 database binding
  processedFilenames: Set<string>;   // Image dedup
  textAccumulator: { text: string }; // Accumulate AI text for DB
  blockBuilder: BlockBuilder;        // Build blocks for message persistence
  imageCounter: { next: number };    // Global image index counter
}

export async function processSDKMessage(
  message: any,
  ctx: ParserContext
): Promise<void>;
```

**Handles (same logic as current, but async D1 calls):**

| SDK message type | Action |
|---|---|
| `system` + `init` + `session_id` | `await db.updateSdkSessionId(ctx.d1, campaignId, session_id)` |
| `assistant` text block | Accumulate text, emit `{ type: 'message', text }` |
| `assistant` tool_use | Emit `tool_start`, detect phase, detect file writes |
| `user` tool_result | Emit `tool_end`, extract images, dedup by filename, assign global index |

**Phase detection (from tool_use blocks):**
- `Task` with `subagent_type='Explore'` or description includes 'research' → phase `'research'`
- `Skill` with `skill='hook-methodology'` → phase `'hooks'`
- `Skill` with `skill='art-style'` → phase `'art'`
- `mcp__nano-banana__generate_ad_images` → phase `'images'`

**File detection (from Write tool_use):**
- Path contains `research` → fileType `'research'`
- Path contains `hook` → fileType `'hooks'`
- Path contains `prompt` → fileType `'prompts'`
- Emits `{ type: 'file', fileType, content, path }` + `await db.updateCampaignFile()`

**Image extraction (from tool_result):**
- Parse result content as JSON, look for `.images[]`
- Dedup by `filename` via `processedFilenames` Set
- Server assigns global index via `imageCounter.next++`
- Map index to hookType via `getHookTypeForIndex()`
- Emit `{ type: 'image', urlPath, hookType, imageIndex, ... }` + `await db.addCampaignImage()`
- Increment blockBuilder completed images

### 3.5 `cloudflare/src/durable-objects/campaign-session.ts` (~500 lines)

The core Durable Object. Ported from `server/lib/websocket-handler.ts`.

```typescript
import type { Env } from '../env.js';
import type { ClientMessage, ServerMessage } from '../lib/types.js';
import { extractCampaignName, getHookTypeForIndex, HOOK_TYPE_ORDER } from '../lib/types.js';
import { EventBuffer } from '../lib/event-buffer.js';
import { BlockBuilder } from '../lib/block-builder.js';
import { processSDKMessage, type ParserContext } from '../lib/sdk-message-parser.js';
import * as db from '../db/index.js';

export class CampaignSession implements DurableObject {
  // ── Instance state (transient, in-memory) ──
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private campaignId: string | null = null;
  private isGenerating = false;
  private abortController: AbortController | null = null;
  private eventBuffer = new EventBuffer();

  constructor(private state: DurableObjectState, private env: Env) {}

  // ══════════════════════════════════════════════
  // WebSocket Hibernation API
  // ══════════════════════════════════════════════

  async fetch(request: Request): Promise<Response> {
    // 1. Extract userId from X-User-Id header (set by Worker)
    this.userId = request.headers.get('X-User-Id');

    // 2. Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // 3. Accept with hibernation API
    this.state.acceptWebSocket(server);
    this.ws = server;

    // 4. Send initial ack
    this.sendWS({ type: 'ack', timestamp: new Date().toISOString(),
                  message: 'Connected to Creative Machine' });

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const message: ClientMessage = JSON.parse(raw as string);
    this.ws = ws;  // Update reference (may be new after hibernation wake)

    switch (message.type) {
      case 'generate':
        if (message.prompt) await this.handleGenerate(message.prompt, message.sessionId, message.assetFileIds);
        break;
      case 'follow_up':
        if (message.prompt && message.campaignId)
          await this.handleFollowUp(message.prompt, message.campaignId, message.assetFileIds);
        break;
      case 'cancel':
        this.handleCancel();
        break;
      case 'subscribe':
        await this.handleSubscribe(message.sessionId, message.lastEventId);
        break;
      case 'ping':
        this.handlePing();
        break;
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    // Clear ws reference ONLY if this is still the active connection
    if (this.ws === ws) {
      this.ws = null;
    }
    // DO NOT abort generation — it continues in background, buffering events
  }

  // ══════════════════════════════════════════════
  // Message Handlers
  // ══════════════════════════════════════════════

  private async handleGenerate(
    prompt: string,
    requestedSessionId?: string,
    assetFileIds?: string[]
  ): Promise<void> {
    // 1. Concurrency guard
    if (this.isGenerating) {
      this.sendWS({ type: 'error', timestamp: new Date().toISOString(),
                    error: 'A generation is already in progress.' });
      return;
    }
    this.isGenerating = true;

    // 2. Create session
    const sessionId = requestedSessionId || `ws-${Date.now()}`;
    this.sessionId = sessionId;
    this.abortController = new AbortController();

    // 3. Create campaign in D1
    const campaignName = extractCampaignName(prompt);
    let campaign = await db.getCampaignBySessionId(this.env.DB, sessionId);
    if (!campaign) {
      campaign = await db.createCampaign(this.env.DB, this.userId!, campaignName, sessionId);
    }
    this.campaignId = campaign.id;

    // 4. Save user message
    await db.addMessage(this.env.DB, { campaignId: campaign.id, role: 'user', content: prompt });

    // 5. Send ack with campaignId
    this.emitEvent({ type: 'ack', timestamp: new Date().toISOString(),
                     message: 'Generation started', sessionId, campaignId: campaign.id });

    // 6. Send initial phase
    this.emitEvent({ type: 'phase', timestamp: new Date().toISOString(),
                     phase: 'parse', label: 'Parsing Request' });

    // 7. Run generation (STUB for Phase 3 — Phase 4 replaces with sandbox)
    await this.runGeneration(prompt, sessionId, undefined, assetFileIds);
  }

  private async handleFollowUp(
    prompt: string,
    campaignId: string,
    assetFileIds?: string[]
  ): Promise<void> {
    // 1. Concurrency guard
    if (this.isGenerating) {
      this.sendWS({ type: 'error', timestamp: new Date().toISOString(),
                    error: 'A generation is already in progress.' });
      return;
    }
    this.isGenerating = true;

    // 2. Look up campaign
    const campaign = await db.getCampaignById(this.env.DB, campaignId, this.userId!);
    if (!campaign || !campaign.session_id) {
      this.sendWS({ type: 'error', timestamp: new Date().toISOString(), error: 'Campaign not found' });
      this.isGenerating = false;
      return;
    }

    // 3. Get SDK session ID for resume
    const sdkSessionId = await db.getSdkSessionId(this.env.DB, campaignId);

    // 4. Set state
    const wsSessionId = campaign.session_id;
    this.sessionId = wsSessionId;
    this.campaignId = campaignId;
    this.abortController = new AbortController();

    // 5. Clear stale events, save user message, update status
    this.eventBuffer.clear();
    await db.addMessage(this.env.DB, { campaignId, role: 'user', content: prompt });
    await db.updateCampaignStatus(this.env.DB, campaignId, 'generating');

    // 6. Send ack
    this.emitEvent({ type: 'ack', timestamp: new Date().toISOString(),
                     sessionId: wsSessionId, campaignId });

    // 7. Run generation with resume
    await this.runGeneration(prompt, wsSessionId, sdkSessionId ?? undefined, assetFileIds);
  }

  private handleCancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.sendWS({ type: 'ack', timestamp: new Date().toISOString(), message: 'Cancel requested' });
    }
  }

  private async handleSubscribe(sessionId?: string, lastEventId?: number): Promise<void> {
    if (!sessionId) {
      this.sendWS({ type: 'error', timestamp: new Date().toISOString(),
                    error: 'Session ID required for subscribe' });
      return;
    }

    if (!this.eventBuffer.hasEvents()) {
      this.sendWS({ type: 'error', timestamp: new Date().toISOString(),
                    error: 'Session not found or expired' });
      return;
    }

    this.sessionId = sessionId;

    // Link campaign from D1
    const campaign = await db.getCampaignBySessionId(this.env.DB, sessionId);
    if (campaign) this.campaignId = campaign.id;

    // Replay missed events
    const missed = this.eventBuffer.getEventsSince(lastEventId ?? 0);
    for (const entry of missed) {
      this.sendWS({ ...entry.event, id: entry.id });
    }

    // Confirm subscription
    this.sendWS({ type: 'subscribed', timestamp: new Date().toISOString(),
                  sessionId, message: `Replayed ${missed.length} events` } as ServerMessage);
  }

  private handlePing(): void {
    this.sendWS({ type: 'pong', timestamp: new Date().toISOString() });
  }

  // ══════════════════════════════════════════════
  // Generation Engine (Phase 4 replaces this with sandbox)
  // ══════════════════════════════════════════════

  private async runGeneration(
    prompt: string,
    sessionId: string,
    sdkSessionId?: string,
    assetFileIds?: string[]
  ): Promise<void> {
    const startTime = Date.now();
    const blockBuilder = new BlockBuilder();
    blockBuilder.openThinkingBlock('Parsing Request');
    const textAccumulator = { text: '' };
    const processedFilenames = new Set<string>();
    const existingImageCount = this.campaignId
      ? await db.getImageCount(this.env.DB, this.campaignId) : 0;
    const imageCounter = { next: existingImageCount + 1 };
    let generationCompleted = false;
    let wasCancelled = false;
    let apiError: string | null = null;

    const ctx: ParserContext = {
      emitEvent: (event) => this.emitEvent(event),
      campaignId: this.campaignId,
      d1: this.env.DB,
      processedFilenames,
      textAccumulator,
      blockBuilder,
      imageCounter,
    };

    try {
      // ┌─────────────────────────────────────────────┐
      // │  PHASE 4 INTEGRATION POINT                  │
      // │                                             │
      // │  Replace this stub with:                    │
      // │  1. getSandbox(env.SANDBOX, `user-${userId}`)│
      // │  2. sandbox.mountBucket(...)                │
      // │  3. sandbox.execStream('npx tsx ...')        │
      // │  4. for await (const event of stream) {     │
      // │       parse JSON line → processSDKMessage() │
      // │     }                                       │
      // └─────────────────────────────────────────────┘

      // STUB: Send error indicating sandbox not yet configured
      this.emitEvent({
        type: 'incomplete',
        timestamp: new Date().toISOString(),
        error: 'sandbox_not_configured',
        message: 'AI generation requires sandbox container (Phase 4). DO protocol is functional.',
      });

      if (this.campaignId) {
        await db.updateCampaignStatus(this.env.DB, this.campaignId, 'incomplete');
        blockBuilder.addStatusBlock('Sandbox not configured (Phase 4)', 'error');
        await db.addMessage(this.env.DB, {
          campaignId: this.campaignId,
          role: 'assistant',
          content: 'Sandbox not configured (Phase 4)',
          blocks: blockBuilder.getBlocks(),
        });
      }

    } catch (error: any) {
      // ... error handling (abort, API error, generic)
      // Same patterns as server/lib/websocket-handler.ts:926-1021
      const isAbort = error.name === 'AbortError' || this.abortController?.signal.aborted;
      if (isAbort) {
        wasCancelled = true;
        if (this.campaignId) {
          await db.updateCampaignStatus(this.env.DB, this.campaignId, 'cancelled');
          blockBuilder.addStatusBlock('Generation was cancelled.', 'info');
          await db.addMessage(this.env.DB, {
            campaignId: this.campaignId, role: 'assistant',
            content: 'Generation was cancelled.', blocks: blockBuilder.getBlocks(),
          });
        }
      } else {
        const errorMsg = error.message || 'Unknown error';
        this.emitEvent({ type: 'error', timestamp: new Date().toISOString(), error: errorMsg });
        if (this.campaignId) {
          await db.updateCampaignStatus(this.env.DB, this.campaignId, 'error');
          blockBuilder.addStatusBlock(`Error: ${errorMsg}`, 'error');
          await db.addMessage(this.env.DB, {
            campaignId: this.campaignId, role: 'assistant',
            content: `Error: ${errorMsg}`, blocks: blockBuilder.getBlocks(),
          });
        }
      }
    } finally {
      this.isGenerating = false;
      this.abortController = null;
    }
  }

  // ══════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════

  private emitEvent(event: ServerMessage): number {
    const eventId = this.eventBuffer.append(event);
    if (this.ws) {
      try { this.ws.send(JSON.stringify({ ...event, id: eventId })); } catch {}
    }
    return eventId;
  }

  private sendWS(message: ServerMessage): void {
    if (this.ws) {
      try { this.ws.send(JSON.stringify(message)); } catch {}
    }
  }
}
```

---

## 4. Files to Modify

### 4.1 `cloudflare/src/index.ts`

- Remove inline `CampaignSession` stub class (lines 9-18)
- Import and re-export from new file:
  ```typescript
  export { CampaignSession } from './durable-objects/campaign-session.js';
  ```
- Pass userId to DO via `X-User-Id` header on the forwarded request:
  ```typescript
  // In the /ws handler:
  const headers = new Headers(request.headers);
  headers.set('X-User-Id', userId);
  return stub.fetch(new Request(request.url, { ...request, headers }));
  ```

### 4.2 `cloudflare/src/env.d.ts`

No changes needed for Phase 3. The SANDBOX binding will be added in Phase 4.

---

## 5. Implementation Order

### Step 1: Types + EventBuffer + BlockBuilder
**Files:** `src/lib/types.ts`, `src/lib/event-buffer.ts`, `src/lib/block-builder.ts`

Pure logic, no external dependencies. Can be written and type-checked immediately.

### Step 2: SDK Message Parser
**File:** `src/lib/sdk-message-parser.ts`

Port `processSDKMessage()` with async D1 calls. Uses types from Step 1, block-builder from Step 1, db functions from existing `src/db/`.

### Step 3: CampaignSession Durable Object
**File:** `src/durable-objects/campaign-session.ts`

Wire up:
- WebSocket lifecycle (hibernation API: `fetch`, `webSocketMessage`, `webSocketClose`)
- Message dispatch (generate, follow_up, cancel, subscribe, ping)
- D1 integration (campaign CRUD, messages, files, images)
- Event buffer + replay for reconnection
- `runGeneration()` stub with Phase 4 integration point
- Error handling (abort/cancel, API errors, generic errors)

### Step 4: Entry Point Updates
**File:** `src/index.ts`

Update Worker entry to import DO from new file, pass userId via header.

---

## 6. Key Design Decisions

| Decision | Rationale |
|---|---|
| **One DO per user** (not per campaign) | Architecture doc specifies this. userId from JWT used as DO ID via `idFromName(userId)`. |
| **WebSocket Hibernation API** | `state.acceptWebSocket(ws)` + `webSocketMessage()` handler. DO sleeps when no generation running. Zero cost while idle. |
| **Event buffer in DO memory** | Transient, lost on DO eviction. Sufficient because buffers are generation-lifetime only (~1-3 min). |
| **userId via X-User-Id header** | Worker verifies JWT and passes userId to DO via custom header. DO trusts this header since only the Worker can route to it. |
| **Stub for runGeneration()** | Clear integration point for Phase 4. Returns `incomplete` event so client handles it gracefully. All surrounding logic (campaign creation, event buffering, reconnect, cancel) works. |
| **Session manager eliminated** | DO instance IS the session. `sdkSessionId` stored in D1 (already has `sdk_session_id` column). No file-based session persistence needed. |
| **No EventEmitter bridge** | In Phase 4, DO will parse images from sandbox stdout. No cross-process event bridge needed. |

---

## 7. Porting Reference

### Current file → Phase 3 equivalent

| Current Server File | Phase 3 File | Notes |
|---|---|---|
| `server/lib/websocket-handler.ts` (1607 lines) | `src/durable-objects/campaign-session.ts` + `src/lib/sdk-message-parser.ts` | Split: DO handles lifecycle, parser handles SDK messages |
| `server/lib/websocket-handler.ts:254-356` (BlockBuilder) | `src/lib/block-builder.ts` | Extracted to its own file, identical logic |
| `server/lib/websocket-handler.ts:17-157` (types) | `src/lib/types.ts` | Extracted to its own file |
| `server/lib/event-buffer.ts` (127 lines) | `src/lib/event-buffer.ts` | Simplified: class instead of Map, no cleanup interval |
| `server/lib/session-manager.ts` (343 lines) | **Eliminated** | DO state + D1 `sdk_session_id` column |
| `server/lib/image-events.ts` (36 lines) | **Eliminated** | Phase 4: DO parses images from stdout |
| `server/lib/db/*.ts` (sync) | `cloudflare/src/db/*.ts` (async) | **Already built in Phase 1** |

### Message types preserved (client compatibility)

All 13 server → client event types preserved with identical shapes:
`ack`, `phase`, `tool_start`, `tool_end`, `message`, `status`, `file`, `image`, `complete`, `error`, `incomplete`, `pong`, `subscribed`

All 5 client → server message types preserved:
`generate`, `follow_up`, `cancel`, `subscribe`, `ping`

---

## 8. Verification

### Type checking
```bash
cd cloudflare && npx tsc --noEmit
```

### Local development (`wrangler dev`)
1. **WebSocket connect**: Open WS to `ws://localhost:8787/ws`, receive `ack` with "Connected to Creative Machine"
2. **Ping/pong**: Send `{ type: 'ping' }`, receive `{ type: 'pong' }`
3. **Generate (stub)**: Send `{ type: 'generate', prompt: 'nike.com', sessionId: 'test-1' }`
   - Expect: `ack` with campaignId → `phase:parse` → `incomplete` (sandbox not configured)
   - Verify: campaign created in D1 with status `incomplete`
4. **Subscribe/replay**: Disconnect, reconnect, send `{ type: 'subscribe', sessionId: 'test-1', lastEventId: 0 }`
   - Expect: all buffered events replayed → `subscribed` confirmation
5. **Cancel**: Send `{ type: 'generate', ... }` then `{ type: 'cancel' }`
   - Expect: cancel ack
6. **Follow-up (stub)**: Send `{ type: 'follow_up', prompt: 'test', campaignId: '<id>' }`
   - Expect: `ack` → `incomplete` (sandbox not configured)
7. **REST API**: Verify Phase 2 endpoints still work (`/api/campaigns`, `/health`)

### Deploy and verify
```bash
cd cloudflare && wrangler deploy
```
Same tests as above against production URL.

---

---

# Phase 4: Sandbox Container (AI Execution)

> Implementation plan for the Cloudflare Sandbox container that runs the Claude Agent SDK.
> Depends on: Phase 3 (Durable Object)
> Created: 2026-02-28

---

## 1. Context

Phase 3 built the Durable Object with all WebSocket handling, event buffering, message parsing, and D1 persistence. The `runGeneration()` method is stubbed — it creates the campaign and sends an `incomplete` event.

Phase 4 replaces the stub with actual AI execution via a **Cloudflare Sandbox container**. The sandbox runs `agent-runner.ts` which calls the Claude Agent SDK `query()`, and the DO reads its stdout via `execStream()`.

---

## 2. Files to Create

### 2.1 `cloudflare/sandbox/Dockerfile`

```dockerfile
FROM docker.io/cloudflare/sandbox:latest

# Install Claude CLI globally
RUN npm install -g @anthropic-ai/claude-code@latest

# Install sandbox dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy agent ecosystem (skills, agents, workflows)
COPY agent/ /app/agent/
COPY agent/.claude/ /app/agent/.claude/

# Copy sandbox entry point and supporting modules
COPY agent-runner.ts orchestrator-prompt.ts nano-banana-mcp.ts ./

RUN chmod -R a+rX /app

# Container stays alive; DO invokes commands via exec/execStream
CMD ["sleep", "infinity"]
```

### 2.2 `cloudflare/sandbox/package.json`

```json
{
  "name": "creative-agent-sandbox",
  "private": true,
  "type": "module",
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "latest",
    "@fal-ai/client": "^1.0.0",
    "tsx": "^4.0.0",
    "zod": "^3.0.0"
  }
}
```

### 2.3 `cloudflare/sandbox/agent-runner.ts`

Entry point that runs inside the container. From architecture doc lines 276-354.

- Reads `PROMPT`, `SESSION_ID`, `RESUME_SDK_SESSION_ID` from env
- Configures SDK with orchestrator prompt + MCP server + allowed tools
- Calls `query()` and writes each message as `JSON.stringify(message) + '\n'` to stdout
- Resume fallback: catch error → retry without resume
- Prompt generator keeps stdin open until `result` message

### 2.4 `cloudflare/sandbox/orchestrator-prompt.ts`

Direct copy from `server/lib/orchestrator-prompt.ts`.

### 2.5 `cloudflare/sandbox/nano-banana-mcp.ts`

Adapted from `server/lib/nano-banana-mcp.ts`:
- **Changed:** Image output path from `generated-images/{sessionId}/` to `/mnt/r2/images/{sessionId}/`
- **Removed:** `imageEvents` import and `imageEvents.emit()` calls
- **Unchanged:** fal.ai API calls, image processing, URL format (`/images/{sessionId}/{filename}`)

---

## 3. Files to Modify

### 3.1 `cloudflare/src/durable-objects/campaign-session.ts`

Replace `runGeneration()` stub with actual sandbox execution:

```typescript
private async runGeneration(
  prompt: string,
  sessionId: string,
  sdkSessionId?: string,
  assetFileIds?: string[]
): Promise<void> {
  // ... existing setup (blockBuilder, textAccumulator, imageCounter, ctx) ...

  try {
    // 1. Get or create sandbox (lazy — no container until first command)
    const sandbox = getSandbox(this.env.SANDBOX, `user-${this.userId}`);

    // 2. Mount R2 for persistent storage (per-user isolated)
    await sandbox.mountBucket('creative-agent-assets', '/mnt/r2', {
      endpoint: `https://${this.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      provider: 'r2',
      prefix: `/users/${this.userId}/`,
    });

    // 3. Resolve asset attachments from R2 (if any)
    let aiPrompt = prompt;
    if (assetFileIds?.length) {
      const resolved = await this.resolveAssetAttachments(assetFileIds);
      if (resolved.referenceUrls.length > 0) {
        aiPrompt = `${prompt}\n\n## Reference Image URLs\n${
          resolved.referenceUrls.map((url, i) => `- Reference ${i + 1}: ${url}`).join('\n')
        }`;
      }
    }

    // 4. Start agent-runner via execStream
    this.sandbox = sandbox;
    const stream = await sandbox.execStream('npx tsx /app/agent-runner.ts', {
      env: {
        ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY,
        FAL_KEY: this.env.FAL_KEY,
        PROMPT: aiPrompt,
        SESSION_ID: sessionId,
        RESUME_SDK_SESSION_ID: sdkSessionId || '',
        CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
        CLAUDE_CODE_MAX_OUTPUT_TOKENS: '16384',
        HOME: '/mnt/r2',
      },
      cwd: '/app',
    });

    // 5. Parse SSE stream from sandbox
    for await (const event of stream) {
      // Check abort
      if (this.abortController?.signal.aborted && !generationCompleted) {
        wasCancelled = true;
        break;
      }

      if (event.type === 'stdout' && event.data) {
        // Each line is a JSON-serialized SDK message
        const lines = event.data.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const sdkMessage = JSON.parse(line);
            await processSDKMessage(sdkMessage, ctx);

            // Detect API errors
            if (sdkMessage.type === 'assistant' && sdkMessage.error) {
              apiError = sdkMessage.error;
            }

            // Detect completion
            if (sdkMessage.type === 'result' && !generationCompleted && !wasCancelled && !apiError) {
              generationCompleted = true;
              // ... send complete event, update D1, save blocks
              // (same logic as server/lib/websocket-handler.ts:796-847)
            }
          } catch { /* skip unparseable lines */ }
        }
      } else if (event.type === 'error') {
        this.emitEvent({ type: 'error', timestamp: new Date().toISOString(), error: event.data });
      } else if (event.type === 'complete') {
        break;
      }
    }

    // Handle silent stream end (same as current websocket-handler.ts:853-902)
    // Handle cancellation (same as current websocket-handler.ts:903-923)

  } catch (error: any) {
    // Same error handling as Phase 3 stub but with full paths:
    // AbortError → cancelled, API error → incomplete, generic → error
  } finally {
    this.isGenerating = false;
    this.abortController = null;
    this.sandbox = null;
  }
}
```

Also add:
- `handleCancel()` updated to call `this.sandbox?.destroy()` to kill the container
- `resolveAssetAttachments()` method that reads from R2 and uploads to fal.ai

### 3.2 `cloudflare/src/env.d.ts`

Add SANDBOX binding:
```typescript
export interface Env {
  // ... existing bindings
  SANDBOX: any;  // Cloudflare Sandbox namespace binding
}
```

### 3.3 `cloudflare/wrangler.jsonc`

Add sandbox container configuration:
```jsonc
// Sandbox container (runs Claude SDK)
"containers": {
  "bindings": [{
    "name": "SANDBOX",
    "image": "./sandbox",
    "instance_type": "standard-1"
  }]
}
```

### 3.4 `cloudflare/package.json`

Add `@cloudflare/sandbox` dependency for sandbox SDK types/functions.

---

## 4. Implementation Order

1. **Sandbox source files** — agent-runner.ts, orchestrator-prompt.ts, nano-banana-mcp.ts, Dockerfile, package.json
2. **Config updates** — wrangler.jsonc (containers binding), env.d.ts, package.json
3. **Replace runGeneration() stub** — sandbox lifecycle + stream parsing
4. **Add resolveAssetAttachments()** — R2 reads + fal.ai uploads
5. **Update handleCancel()** — sandbox.destroy()

---

## 5. Verification

### Build sandbox image
```bash
cd cloudflare && docker build -t creative-agent-sandbox ./sandbox
```

### Deploy
```bash
cd cloudflare && wrangler deploy
```

### End-to-end tests
1. **Generate**: Send `{ type: 'generate', prompt: 'nike.com', sessionId: 'test-1' }`
   - Expect: `ack` → `phase:parse` → `phase:research` → `phase:hooks` → `phase:art` → `phase:images` → `image` events → `complete`
   - Verify: campaign in D1 with status `complete`, images in R2, message with blocks
2. **Reconnect mid-generation**: Disconnect, reconnect, `subscribe` with `lastEventId`
   - Expect: missed events replayed, remaining events continue on new WS
3. **Cancel mid-generation**: Send `cancel`
   - Expect: sandbox destroyed, campaign status `cancelled`
4. **Follow-up with resume**: Send `follow_up` after completion
   - Expect: SDK resumes from JSONL via R2 FUSE mount, new images appended
5. **Image serving**: `GET /images/{sessionId}/{filename}` returns image from R2
6. **Asset attachments**: Send `generate` with `assetFileIds`, verify images use reference style
