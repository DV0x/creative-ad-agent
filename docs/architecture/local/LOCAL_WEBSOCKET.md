# Local WebSocket Handler

> Part of [Architecture Documentation](../INDEX.md) | **File:** `server/lib/websocket-handler.ts` (1,672 lines)

---

## Overview

The local WS handler mirrors the production Durable Object's message handling but runs everything in-process. It's the largest file in the server and handles generation orchestration, event streaming, cancel, follow-up, and subscribe.

**Key difference from production:** Generation runs synchronously in the WS message handler — can't handle other WS messages (like ping/subscribe) during generation.

---

## Message Types

Same as production — see [WebSocket Protocol](../shared/WEBSOCKET_PROTOCOL.md).

### Incoming
`generate`, `follow_up`, `cancel`, `subscribe`, `ping`

### Outgoing
`ack`, `phase`, `tool_start`, `tool_end`, `message`, `file`, `image`, `complete`, `error`, `incomplete`, `status`, `subscribed`, `pong`

> **Parity gap with production.** Local does NOT emit `text_start` / `text_delta` / `text_end` (those require `includePartialMessages: true` on the SDK, which only the production sandbox enables) or `credits_update` (local dev has no billing). The legacy `message` event is how text still reaches the client on this path — the client's `useWebSocket` hook has a fallback in the `message` case that fires only when `!streamingText`. See [WEBSOCKET_CLIENT.md § Event → Store Update Map](../client/WEBSOCKET_CLIENT.md#event--store-update-map).

---

## Generation Flow

```
WS message: { type: 'generate', prompt, sessionId }
    │
    ├── Create campaign in SQLite
    ├── Save user message to DB
    ├── Send ACK with campaign ID
    │
    ├── Call aiClient.queryWithSession(prompt, sessionId, undefined, attachments, abortController)
    │   └── Returns AsyncGenerator<{ message, sessionId }>
    │
    ├── for await (const result of queryWithSession(...)):
    │     processSDKMessage(msg)
    │       ├── assistant.text → emit 'message' event
    │       ├── assistant.tool_use → emit 'tool_start' + detect phase
    │       ├── user.tool_result → emit 'tool_end' + detect images/files
    │       └── result → emit 'complete' + update DB
    │
    └── Error handling → emit 'error' + update campaign status
```

### `processSDKMessage()` (local version)

Port of the same logic as `cloudflare/src/lib/sdk-message-parser.ts`:
- Detects phases from tool usage (Task→research, Skill→hooks, nano-banana→images)
- Extracts files from Write tool calls (research.md, hooks.md, prompts.json)
- Extracts images from `tool_result` content (fal.ai URLs + local paths)
- Strips fal.ai URLs from agent text (prevents leaking temp URLs to client)
- Persists everything to SQLite in real-time

---

## Follow-Up

```
WS message: { type: 'follow_up', prompt, campaignId }
    │
    ├── Look up campaign + SDK session ID from DB
    ├── Call aiClient.queryWithSession(prompt, wsSessionId, undefined, attachments, abortController, sdkSessionId)
    │   └── sdkSessionId passed as 6th positional arg — SDK resumes same conversation
    └── Same streaming loop as generate
```

Uses SDK session resume — the SDK handles conversation history internally via its JSONL session file.

---

## Cancel

```
WS message: { type: 'cancel' }
    │
    ├── Set abort flag on active generation
    ├── SDK query iteration checks flag between turns
    ├── Update campaign status → 'cancelled' in SQLite
    └── Send 'status: cancelled' event
```

---

## Event Buffering

Per-session `EventBuffer` (from `server/lib/event-buffer.ts`) stores events with sequential IDs. On `subscribe`, replays events after `lastEventId`. Same pattern as production but in-memory only — no R2 safety net, no alarm polling.

---

## Session Management

`server/lib/session-manager.ts` (342 lines) tracks:
- Active SDK sessions per campaign (for follow-up resume)
- Active generation state per user (for cancel)
- WebSocket connections → session mapping (for event routing)

All in-memory — lost on server restart.

---

## Local vs Production Handler

| Aspect | Local (`websocket-handler.ts`) | Production (`campaign-session.ts`) |
|---|---|---|
| Lines | 1,672 | 1,945 |
| Generation | Synchronous (blocks WS handler) | Fire-and-forget (alarm keeps DO alive) |
| SDK execution | In-process `AIClient.queryWithSession()` | Sandbox container + `startProcess` + `streamProcessLogs` |
| Completion | SDK `result` message type ends the generator loop | 4-layer detection: inline stream sentinel → post-stream `tryFinalize` → alarm `listProcesses` (10s) → client `/recover` (see [DURABLE_OBJECT.md](../cloudflare/DURABLE_OBJECT.md#completion-detection--the-real-four-layers)) |
| Recovery | Event buffer only | Event buffer + D1-first `/recover` (no R2 marker read — that path was removed) |
| Session state | In-memory `SessionManager` | `this.state.storage` (survives DO reset) |
| Streaming deltas | No (`text_*` events not emitted) | Yes — `includePartialMessages: true` yields `stream_event` → `text_delta` |
| Credits | None — free | Pre-flight balance check + `credits_update` broadcast on finalize |

---

## See Also

- [Local Architecture](./LOCAL_ARCHITECTURE.md) — Server overview
- [Local AI Client](./LOCAL_AI_CLIENT.md) — SDK wrapper
- [WebSocket Protocol](../shared/WEBSOCKET_PROTOCOL.md) — Full message spec
- [Durable Object](../cloudflare/DURABLE_OBJECT.md) — Production equivalent
