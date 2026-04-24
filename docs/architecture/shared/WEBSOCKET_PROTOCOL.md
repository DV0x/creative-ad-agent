# WebSocket Protocol

> Part of [Architecture Documentation](../INDEX.md) | Full message spec for both directions | **Source:** `cloudflare/src/lib/types.ts`, `cloudflare/src/durable-objects/campaign-session.ts`, `cloudflare/src/lib/sdk-message-parser.ts`

---

## Connection

| Mode | URL |
|---|---|
| Local dev | `ws://localhost:5173/ws` (Vite proxy → Express `:3001`) |
| Staging | `wss://creative-agent-staging.alphasapien17.workers.dev/ws?token={JWT}` |
| Production | `wss://creativemachines.xyz/ws?token={JWT}` |

**Auth:** JWT is passed as `?token=` query parameter on the upgrade request. The Worker verifies it via Clerk JWKS, injects `X-User-Id` header, and forwards to the DO. Dev mode (no `CLERK_SECRET_KEY`) passes everything as `user_id='anonymous'`.

**Keepalive:** Client sends `ping` every 25s. Server responds with `pong`. Server-side alarm heartbeat runs every 10s to keep DO alive during generation.

**Multi-tab:** DO supports multiple concurrent WebSocket connections per user (open two browser tabs, both receive events). Durable events broadcast to every socket via `getWebSockets()`. Subscribe replay goes only to the reconnecting socket.

---

## Client → Server Messages

### `generate` — new campaign

```json
{
  "type": "generate",
  "prompt": "Create ads for nike.com",
  "sessionId": "sess-1710000000-abc123",
  "name": "Nike Campaign",
  "brand": "nike.com",                    // optional — URL or brand name
  "assetFileIds": ["file-1", "file-2"],   // optional — user reference uploads
  "sourceCampaignId": "abc456",           // optional — copy research from this campaign
  "aspectRatio": "4:5"                    // optional — "4:5" | "1:1" | "9:16"
}
```

### `follow_up` — iterate on existing campaign

```json
{
  "type": "follow_up",
  "prompt": "Make the stat hook more dramatic",
  "campaignId": "abc123",
  "sessionId": "sess-1710000000-abc123",
  "assetFileIds": ["file-3"],
  "aspectRatio": "4:5"
}
```

### `cancel` — abort current generation

```json
{
  "type": "cancel",
  "campaignId": "abc123",
  "sessionId": "sess-1710000000-abc123"
}
```

### `subscribe` — resume / recover

```json
{
  "type": "subscribe",
  "sessionId": "sess-1710000000-abc123",
  "lastEventId": 42
}
```

### `ping`

```json
{ "type": "ping" }
```

---

## Server → Client Messages

All server messages include a sequential `id` field EXCEPT:

- `pong`
- Ephemeral events: `text_start`, `text_delta`, `text_end`, `credits_update`, some `status` variants

### `ack` — connection / generation started

Sent on WS connect (initial "Connected to Creative Machine") and again on `generate` / `follow_up` acceptance.

```json
{
  "type": "ack",
  "timestamp": "2026-04-22T10:00:00Z",
  "message": "Connected to Creative Machine",
  "campaignId": "server-assigned-uuid",
  "sessionId": "sess-...",
  "id": 1
}
```

### `subscribed` — resume confirmation

Sent after `subscribe` completes replay, only to the reconnecting socket (sendToWS).

```json
{
  "type": "subscribed",
  "timestamp": "2026-04-22T10:00:00Z",
  "sessionId": "sess-...",
  "message": "Replayed 17 events",
  "success": true,
  "id": 2
}
```

### `phase` — workflow phase change

```json
{
  "type": "phase",
  "timestamp": "...",
  "phase": "parse | research | hooks | art | images",
  "label": "Researching nike",
  "imageCount": 6,
  "id": 3
}
```

### `tool_start` / `tool_end`

```json
{
  "type": "tool_start",
  "timestamp": "...",
  "tool": "WebFetch",
  "toolId": "toolu_abc",
  "input": { "url": "https://nike.com" },
  "id": 4
}
```

```json
{
  "type": "tool_end",
  "timestamp": "...",
  "toolId": "toolu_abc",
  "success": true,
  "id": 5
}
```

Special tools: `Task` and `Skill` don't fire as generic `tool_start` only — they also trigger `phase` events (see parser branches B and D in [STREAMING_PIPELINE.md](../cloudflare/STREAMING_PIPELINE.md)).

### Streaming text: `text_start` / `text_delta` / `text_end` — **EPHEMERAL**

Production only. Emitted via `sendWS` (broadcast without buffering). NOT replayed on reconnect.

```json
{ "type": "text_start", "timestamp": "..." }
```

```json
{ "type": "text_delta", "timestamp": "...", "delta": "…token chunk…" }
```

```json
{ "type": "text_end", "timestamp": "..." }
```

Enabled by `includePartialMessages: true` on the SDK query. Local dev does NOT emit these — features relying on token streaming must be validated on staging.

Client behaviour: append each delta to an in-flight text block in the store. The block becomes "sealed" on `text_end`. If the connection drops mid-stream, the client loses deltas but gets the full assembled text via the `messages` row on page reload (via `/api/campaigns/:id`).

### `message` — assembled agent text

```json
{
  "type": "message",
  "timestamp": "...",
  "text": "I've analyzed the brand and found…",
  "id": 6
}
```

**Production:** emitted ONLY if no deltas streamed for this block (`hasStreamedDeltas=false`). In practice, this means the message event is mostly suppressed in prod (deltas always fire first).

**Local dev:** primary text transport. Always emitted per assistant text block.

### `file` — campaign file created/updated

```json
{
  "type": "file",
  "timestamp": "...",
  "fileType": "research | hooks | prompts",
  "content": "# Brand Research\n\n…",
  "path": "/app/agent/files/research/...",
  "id": 7
}
```

Client uses `prompts` file to extract expected image count (parses prompt array length).

### `image` — image generated

```json
{
  "type": "image",
  "timestamp": "...",
  "id": "image_0",
  "urlPath": "/images/0_stat_bold-stat.png",
  "prompt": "A bold typographic ad…",
  "filename": "0_stat_bold-stat.png",
  "hookType": "stat",
  "imageIndex": 0
}
```

Note the `id` collision: the top-level `id` field gets overwritten by the sequential event ID assigned by `EventBuffer.append`. The original `image_0` string is the image identity and is preserved separately in `imageIndex` + `filename` — clients should key off those.

### `complete` — generation finished

```json
{
  "type": "complete",
  "timestamp": "...",
  "sessionId": "sess-...",
  "campaignId": "camp-...",
  "duration": 0,
  "imageCount": 6,
  "summary": "Generated 6 images for Nike campaign",
  "id": 9
}
```

`summary` is the first 500 chars of the accumulated assistant text. `duration` is currently always 0 (placeholder).

### `incomplete` — interrupted, can resume

```json
{
  "type": "incomplete",
  "timestamp": "...",
  "message": "Generation interrupted. Resume from campaign page.",
  "id": 10
}
```

Emitted rarely — most interrupted generations emit friendly `error` events now (see below). `incomplete` status in D1 is set by the alarm; this WS event is optional.

### `error` — generation failed

```json
{
  "type": "error",
  "timestamp": "...",
  "error": "Short user-facing message",
  "code": "INSUFFICIENT_CREDITS",
  "id": 11
}
```

Friendly error copy (production):

| Trigger | Copy |
|---|---|
| Pre-flight credit check | "Insufficient credits. Please top up to continue." (code: `INSUFFICIENT_CREDITS`) |
| 2h safety net | "That took way too long, even for us — your work's saved, let's try a fresh start" |
| Zombie detected (alarm, 5 min) | "Hmm something didn't start right — your work's saved, try again and we'll nail it" |
| Agent dead, no result | "The creative engine wandered off — your work's safe tho, give it another go" |
| Fatal sandbox RPC | "Connection went poof but your work didn't — hit send again and we're vibing" |
| Fatal runtime (no agent) | "Setup failed: {err.message}" / "Follow-up failed: {err.message}" |
| Concurrent-gen block | "A generation is already in progress. Please wait or cancel first." |
| Session not found | "Session not found or expired" |

### `status` — informational / warning

```json
{
  "type": "status",
  "timestamp": "...",
  "message": "Live updates paused — generation still in progress..."
}
```

**Emitted when:** stream RPC throws but agent is still alive. User keeps seeing the campaign workflow progress via the alarm's finalize path; the `status` event warns that real-time updates are temporarily out.

**Zombie-on-subscribe** (`handleSubscribe`, `campaign-session.ts:1146-1150`) uses `error` (not `status`) so the client surfaces a retry prompt.

### `credits_update` — post-finalize credit balance

```json
{
  "type": "credits_update",
  "timestamp": "...",
  "balance": 823.5,         // plan + topup, in credits (USD × 10)
  "plan_balance": 780.0,
  "topup_balance": 43.5,
  "cost": 6.2               // credits deducted this turn
}
```

Emitted via `sendWS` (NOT buffered). Fires after `finalizeGeneration` succeeds (`campaign-session.ts:453-461`) and after `recordCancelledUsage` on cancel (`:509-517`). All four values rounded to 1 decimal.

Client updates Zustand: `setCreditBalance`, `setPlanBalance`, `setTopupBalance`. Toast optional — non-obtrusive.

### `pong`

```json
{ "type": "pong", "timestamp": "..." }
```

No `id`.

### Transport-only: `tool_use_event`

Not a client-facing event. This is the custom JSON line the agent-runner emits on stdout (`agent-runner.ts:365-370`) that the DO parser translates into a `tool_start` event before broadcasting. Documented here to avoid confusion when reading source.

---

## Event Recovery

### How it works

1. Server assigns sequential `id` to every outgoing DURABLE event (via `EventBuffer.append`)
2. Ephemeral events (deltas, `credits_update`, `pong`) are sent WITHOUT buffering → no `id`, no replay
3. Client saves `lastEventId` to localStorage per session:
   ```
   creative-agent:lastEventId:{sessionId} = 42
   ```
4. On reconnect, client sends `subscribe` with `lastEventId`
5. Server replays all buffered events with `id > lastEventId` — only to the reconnecting socket
6. Server sends `subscribed` when replay completes

### Limitations

- Buffer is in-memory per DO. Lost on DO eviction (code deploy, 10 min hibernation)
- Buffer max 1000 events, trims to 500 on overflow — long generations may lose early events
- Deltas never replayed. On reconnect, the client loses mid-turn text animation. Full assembled text is still in D1.

### Deep recovery — `/api/campaigns/:id/recover`

REST endpoint (`routes/recovery.ts`), not a WS message. Client fires it automatically for stuck campaigns (`generating` / `incomplete` / `error`). D1-first reconciliation:

- Checks for existing images/files/messages in D1
- If found + no assistant message → inserts synthetic "Generation recovered. N images found."
- Updates status → `complete`
- Returns full campaign payload for re-render

No R2 marker involvement (the `pollR2CompletionMarker` path was removed). D1 is the single source of truth.

---

## Message flow: initial generation

```
Client                          Server (DO)
  │                               │
  ├── generate ──────────────────→│  Credit check, create campaign
  │                               │  Persist user message
  │←───────────────────────── ack ┤  id:1
  │←─ phase:parse ───────────────┤  id:2
  │                               │  setupSandbox (cold ~2.5 min; warm ~3s)
  │                               │  startProcess → streamProcessLogs
  │                               │
  │←─ text_start ────────────────┤  (ephemeral)
  │←─ text_delta × N ────────────┤  (ephemeral, tokens arrive)
  │←─ text_end ──────────────────┤  (ephemeral)
  │←─ tool_start (Task/research) ┤  id:…
  │←─ phase:research ────────────┤  id:…
  │←─ tool_end ──────────────────┤  id:…
  │←─ file (research) ───────────┤  id:…
  │←─ tool_start (Skill/hooks) ──┤
  │←─ phase:hooks ───────────────┤
  │←─ file (hooks) ──────────────┤
  │←─ tool_start (Skill/art) ────┤
  │←─ phase:art ─────────────────┤
  │←─ file (prompts) ────────────┤
  │←─ tool_start (nano-banana) ──┤
  │←─ phase:images ──────────────┤
  │←─ image × 6 ────────────────┤  id:…
  │←─ tool_end (nano-banana) ────┤
  │                               │  Agent prints turn_complete
  │                               │  Stream loop breaks → tryFinalize (Layer 2)
  │                               │  reconcileImages + reconcileFiles + addMessage
  │←─ complete ──────────────────┤  id:…
  │←─ credits_update ────────────┤  (ephemeral — sendWS)
```

---

## Message flow: follow-up (fast path)

```
Client                          Server (DO)
  │                               │
  ├── follow_up ────────────────→│  Credit check, eventBuffer.clear, addMessage
  │←─ ack ───────────────────────┤  id:1 (new sequence — buffer cleared)
  │                               │  isAgentProcessAlive? agentCampaignId match?
  │                               │  → FAST PATH
  │                               │  streamProcessLogs (replays history)
  │                               │  writeFile /app/next-prompt.json
  │                               │  Agent prints turn_start:req_xxx
  │                               │  Stream skip loop exits (matched requestId)
  │                               │
  │←─ text_start/delta/end ──────┤  (agent explains changes)
  │←─ phase:hooks ───────────────┤
  │←─ tool_start (Write) ────────┤
  │←─ file (hooks) ──────────────┤
  │←─ tool_start (nano-banana) ──┤
  │←─ phase:images ──────────────┤
  │←─ image × 1 ─────────────────┤
  │                               │  turn_complete + COMPLETION:req_xxx
  │                               │  tryFinalize (validates requestId match)
  │←─ complete ──────────────────┤
  │←─ credits_update ────────────┤
```

---

## Message flow: cancel

```
Client                          Server (DO)
  │                               │
  ├── cancel ────────────────────→│  abortController.abort()
  │                               │  currentLogStream.cancel()  ← unblocks stream loop
  │←─ ack "Cancel requested" ────┤  (sendWS, no id)
  │                               │  Stream loop: return cancelled=true
  │                               │  finally: recordCancelledUsage, killProcess,
  │                               │    unmountBucket, clearPersistedSession
  │←─ credits_update ────────────┤  (if any images charged)
  │                               │  (client sees campaign status change to 'cancelled' via separate reload or WS state query)
```

No dedicated `cancelled` event — the client infers from the credit update + subsequent state, or reloads the campaign and sees `status: 'cancelled'`. The assistant message "No worries, scrapped that one — send a new idea whenever you're ready" is persisted to D1 and visible on next load.

---

## Message flow: reconnect (browser refresh mid-generation)

```
Client                          Server (DO)
  │                               │
  │  (WS drops)                   │  webSocketClose — no cleanup, gen continues
  │                               │  Events buffer in EventBuffer
  │                               │  Alarm keeps firing every 10s
  │                               │
  │  Page reloads                 │
  │                               │
  ├── WS connect ────────────────→│  fetch, new WS pair
  │                               │  restoreSession from storage
  │←─ ack (on-connect) ──────────┤  sendToWS (targeted)
  │                               │
  ├── subscribe(lastEventId=42) →│  handleSubscribe
  │                               │  eventBuffer.hasEvents()? Maybe — depends on DO reset
  │                               │  D1 staleness check
  │                               │  IF zombie → friendly error, clear session
  │                               │  ELSE → replay getEventsSince(42)
  │←─ events 43..N ──────────────┤  sendToWS per event (targeted replay)
  │←─ subscribed ────────────────┤  sendToWS "Replayed N events"
  │                               │
  │←─ live events (broadcast) ──┤  (new emitEvent calls go to all tabs)
```

**localStorage keys used:**

```
creative-agent:activeSession = { sessionId, campaignId }
creative-agent:lastEventId:{sessionId} = 42
```

---

## See Also

- [WebSocket Client](../client/WEBSOCKET_CLIENT.md) — client-side handler logic
- [Durable Object](../cloudflare/DURABLE_OBJECT.md) — server-side WS handler
- [Streaming Pipeline](../cloudflare/STREAMING_PIPELINE.md) — how events are produced
- [Local WebSocket](../local/LOCAL_WEBSOCKET.md) — dev server WS handler (simpler, no streaming)
- [Error Propagation](./ERROR_PROPAGATION.md) — where each error copy comes from
- [Billing](./BILLING.md) — `credits_update` semantics
