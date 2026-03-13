# WebSocket Protocol

> Part of [Architecture Documentation](../INDEX.md) | Full message spec for both directions

---

## Connection

| Mode | URL |
|---|---|
| Local dev | `ws://localhost:5173/ws` (Vite proxies to Express on `:3001`) |
| Production | `wss://creative-agent.alphasapien17.workers.dev/ws?token={JWT}` |

**Auth:** In production, JWT is passed as `?token=` query parameter on the upgrade request. The Worker verifies it via Clerk JWKS before forwarding to the Durable Object.

**Keepalive:** Client sends `ping` every 25s. Server responds with `pong`. Server-side alarm heartbeat runs every 30s to prevent DO hibernation during generation.

**Multi-tab:** The DO supports multiple concurrent WebSocket connections (e.g., user opens two browser tabs). All generation events are broadcast to ALL connected sockets via `this.state.getWebSockets()`. Subscribe replay is targeted to only the subscribing socket — other tabs already have those events.

---

## Client → Server Messages

### `generate` — Start a new campaign

```json
{
  "type": "generate",
  "prompt": "Create ads for nike.com",
  "sessionId": "sess-1710000000-abc123",
  "name": "Nike Campaign",
  "assetFileIds": ["file-1", "file-2"]   // optional — user-uploaded reference files
}
```

### `follow_up` — Iterate on an existing campaign

```json
{
  "type": "follow_up",
  "prompt": "Make the stat hook more dramatic",
  "campaignId": "abc123",
  "sessionId": "sess-1710000000-abc123",
  "assetFileIds": ["file-3"]   // optional
}
```

### `cancel` — Abort current generation

```json
{
  "type": "cancel",
  "campaignId": "abc123",
  "sessionId": "sess-1710000000-abc123"
}
```

### `subscribe` — Resume/recover a session

```json
{
  "type": "subscribe",
  "sessionId": "sess-1710000000-abc123",
  "lastEventId": 42   // optional — server replays events after this ID
}
```

### `ping` — Keepalive

```json
{ "type": "ping" }
```

---

## Server → Client Messages

All server messages include an `id` field (sequential integer) for event recovery, except `pong`.

### `ack` — Generation started

Sent immediately after `generate`. Contains the server-assigned campaign ID (client uses this to remap its local ID).

```json
{
  "type": "ack",
  "campaignId": "server-assigned-uuid",
  "id": 1
}
```

### `subscribed` — Recovery subscription confirmed

```json
{
  "type": "subscribed",
  "id": 2
}
```

### `phase` — Workflow phase change

```json
{
  "type": "phase",
  "phase": "research",     // research | hooks | prompts | images
  "label": "Researching brand...",
  "id": 3
}
```

### `tool_start` / `tool_end` — Agent tool usage

```json
{
  "type": "tool_start",
  "tool": "WebFetch",
  "toolName": "WebFetch",
  "input": { "url": "https://nike.com" },   // optional
  "id": 4
}
```

```json
{
  "type": "tool_end",
  "tool": "WebFetch",
  "toolName": "WebFetch",
  "id": 5
}
```

Special case: `Task` and `Skill` tools extract the subagent/skill name for display.

### `message` — Agent text output

```json
{
  "type": "message",
  "content": "I've analyzed the brand and found...",
  "text": "I've analyzed the brand and found...",
  "id": 6
}
```

Primarily used during follow-ups where the agent explains changes.

### `file` — Campaign file created/updated

```json
{
  "type": "file",
  "fileType": "research",    // research | hooks | prompts
  "content": "# Brand Research\n\n...",
  "id": 7
}
```

When `fileType` is `prompts`, the client parses it to extract the expected image count.

### `image` — Image generated

```json
{
  "type": "image",
  "timestamp": "2026-03-10T...",
  "id": "image_0",                  // "image_{globalIndex}" (0-based)
  "urlPath": "/images/sess-xxx/0_stat_bold-stat.png",
  "prompt": "A bold typographic ad...",
  "filename": "0_stat_bold-stat.png",
  "hookType": "stat",
  "imageIndex": 0,
  "id": 8                           // sequential event ID (separate from image id)
}
```

Note: The `id` field at the top level is the sequential event ID (integer) for recovery. The `id: "image_0"` field identifies the image itself. The sequential event `id` overwrites the image `id` when assigned by the EventBuffer.

### `complete` — Generation finished

```json
{
  "type": "complete",
  "summary": "Generated 6 images for Nike campaign",
  "imageCount": 6,
  "id": 9
}
```

### `error` — Generation failed

```json
{
  "type": "error",
  "error": "API rate limit exceeded",
  "code": "rate_limit",        // optional
  "id": 10
}
```

Special case: `code: "session_expired"` triggers client-side session cleanup.

### `incomplete` — Generation interrupted (can resume)

```json
{
  "type": "incomplete",
  "message": "Generation interrupted. Resume from campaign page.",
  "id": 11
}
```

### `status` — Status update

```json
{
  "type": "status",
  "status": "cancelled",
  "message": "Generation cancelled by user",
  "id": 12
}
```

### `pong` — Keepalive response

```json
{ "type": "pong" }
```

No `id` field.

---

## Event Recovery

### How it works

1. Server assigns sequential `id` to each outgoing message
2. Messages are stored in an `EventBuffer` (in-memory on DO, ring buffer with max size)
3. Client saves `lastEventId` to localStorage per session:
   ```
   creative-agent:lastEventId:{sessionId} = 42
   ```
4. On reconnect, client sends `subscribe` with `lastEventId`
5. Server replays all buffered events with `id > lastEventId`
6. Client receives `subscribed` when replay is complete

### Limitations

- Buffer is in-memory — lost on DO reset (code deploy)
- Buffer has a max size (older events evicted)
- For full recovery after DO reset, use the R2 completion marker via `/api/campaigns/:id/recover`

### Reconnect Helpers

On `subscribe` (client reconnect or DO reset recovery), the server calls two helpers to restore live progress:

- **`attachStreamHandler(campaignId)`** — Re-attaches `streamProcessLogs()` on the sandbox process so the reconnected client sees live SDK events. Best-effort only; not used for completion detection.
- **`attachCompletionHandler(campaignId, sessionId)`** — Re-attaches `waitForLog('turn_complete')` on the agent process. This is the primary completion detection path (saves results to D1, notifies client).

### R2 Completion Polling + Log Snapshot

The DO alarm handler (every 30s) runs two backup checks:
1. **R2 marker polling** — `pollR2CompletionMarker()` reads `completion_{campaignId}.json` directly from R2 (independent of sandbox)
2. **Log snapshot** — `getProcessLogs()` (simple HTTP GET) checks if `turn_complete` exists in accumulated stdout

Both are independent of the SSE streaming connection. If either finds completion, it reconciles images/files to D1 and completes the campaign.

---

## Message Flow: Initial Generation

```
Client                          Server
  │                               │
  ├── generate ──────────────────→│  Create campaign in DB
  │                               │  Start sandbox container
  │←────────────────────── ack ───┤  (server campaign ID)
  │                               │
  │←───────────────────── phase ──┤  "Researching brand..."
  │←─────────────── tool_start ───┤  WebFetch nike.com
  │←─────────────────── tool_end ─┤
  │←───────────────────── phase ──┤  "Creating hooks..."
  │←────────────────────── file ──┤  (research content)
  │←────────────────────── file ──┤  (hooks content)
  │←────────────────────── file ──┤  (prompts content)
  │←───────────────────── phase ──┤  "Generating images..."
  │←─────────────── tool_start ───┤  nano-banana generate
  │←───────────────────── image ──┤  (image 1/6)
  │←───────────────────── image ──┤  (image 2/6)
  │    ...4 more images...        │
  │←─────────────────── tool_end ─┤
  │←──────────────────── complete ┤  "Generated 6 images"
  │                               │
```

## Message Flow: Follow-Up

```
Client                          Server
  │                               │
  ├── follow_up ─────────────────→│  Write /app/next-prompt.json
  │                               │  Agent prints turn_start sentinel
  │                               │  Agent picks up new turn
  │←───────────────────── phase ──┤  "Updating hooks..."
  │←──────────────────── message ─┤  "I'll make the stat hook..."
  │←────────────────────── file ──┤  (updated hooks)
  │←───────────────────── image ──┤  (regenerated image)
  │←──────────────────── complete ┤  "Updated 1 hook"
  │                               │
```

**`turn_start` sentinel:** Before each follow-up turn, agent-runner prints `{"type":"turn_start","requestId":"..."}` to stdout. The DO uses this to skip replayed historical logs from `streamProcessLogs()`, which replays the entire accumulated stdout buffer on each call.

## Message Flow: Cancel

```
Client                          Server
  │                               │
  ├── cancel ────────────────────→│  Set abort signal (only)
  │                               │  Generation function handles cleanup
  │←───────────────────── status ─┤  "cancelled"
  │                               │
```

## Message Flow: Reconnect (Browser Refresh)

```
Client                          Server (DO)
  │                               │
  │  (WS connection drops)        │  webSocketClose() — no cleanup needed
  │                               │  (getWebSockets() auto-excludes closed)
  │                               │  Generation continues (fire-and-forget)
  │                               │  Events buffered in EventBuffer
  │                               │
  │  (Page reloads)               │
  │                               │
  ├── WS connect ────────────────→│  fetch() — new WS pair, restore session
  │                               │  ack sent to THIS socket only (sendToWS)
  │                               │
  ├── subscribe(lastEventId=42) ─→│  handleSubscribe():
  │                               │    1. Restore session from storage if needed
  │                               │    2. Staleness check against D1
  │                               │    3. Replay events to THIS socket only
  │←── event 43 ─────────────────┤       (sendToWS, not broadcast)
  │←── event 44 ─────────────────┤
  │←── ... ──────────────────────┤
  │←── subscribed ───────────────┤    4. Re-attach streaming (if generating)
  │                               │
  │←── live events (broadcast) ──┤    (all tabs get new events)
  │                               │
```

**localStorage tracking:**
```
creative-agent:activeSession = { sessionId, campaignId }
creative-agent:lastEventId:{sessionId} = 42
```

---

## See Also

- [WebSocket Client](../client/WEBSOCKET_CLIENT.md) — Client-side handler logic
- [Durable Object](../cloudflare/DURABLE_OBJECT.md) — Server-side WS handler
- [Local WebSocket](../local/LOCAL_WEBSOCKET.md) — Local server WS handler
- [Streaming Pipeline](../cloudflare/STREAMING_PIPELINE.md) — How sandbox stdout becomes WS events
