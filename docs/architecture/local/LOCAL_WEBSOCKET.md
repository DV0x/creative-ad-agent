# Local WebSocket Handler

> Part of [Architecture Documentation](../INDEX.md) | **File:** `server/lib/websocket-handler.ts` (1,606 lines)

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
| Lines | 1,606 | 1,605 |
| Generation | Synchronous (blocks WS handler) | Fire-and-forget (alarm keeps DO alive) |
| SDK execution | In-process `AIClient.queryWithSession()` | Container `startProcess()` + log streaming |
| Completion | SDK `result` message type | `waitForLog('turn_complete')` + R2 alarm |
| Recovery | Event buffer only | Event buffer + R2 marker + alarm + `/recover` |
| Session state | In-memory `SessionManager` | `this.state.storage` (survives DO reset) |

---

## See Also

- [Local Architecture](./LOCAL_ARCHITECTURE.md) — Server overview
- [Local AI Client](./LOCAL_AI_CLIENT.md) — SDK wrapper
- [WebSocket Protocol](../shared/WEBSOCKET_PROTOCOL.md) — Full message spec
- [Durable Object](../cloudflare/DURABLE_OBJECT.md) — Production equivalent
