# WebSocket Client

> Part of [Architecture Documentation](../INDEX.md) | **Files:** `client/src/hooks/useWebSocket.ts` (597 lines), `client/src/lib/websocket-manager.ts` (286 lines)

---

## Architecture

Two layers:

```
useWebSocket (React hook)          websocket-manager (module singleton)
├── Message handling                ├── Connection lifecycle
├── Store updates                   ├── Reconnect logic
├── Action methods                  ├── Ping keepalive
│   (generate, followUp, cancel)    ├── Subscriber ref counting
└── Recovery coordination           └── Token management
```

The **manager** owns the raw WebSocket connection. The **hook** registers callbacks via `setCallbacks()` and exposes action methods to components.

---

## Connection Lifecycle

```
App mount
  │
  ├── [auth enabled]  Clerk loads → getToken() → setTokenGetter(fn) → connectWithAuth(tokenGetter)
  │
  └── [dev mode]  connectWithAuth() immediately (no token getter)
        │
        ▼
  connect()
    │
    ├── Guard: if !authReady → return
    ├── Guard: if OPEN or CONNECTING → return
    ├── ++connectionGeneration (invalidates stale handlers)
    ├── Get token from storedTokenGetter (async)
    ├── Build URL:  ws://host/ws?token={JWT}     (or wss:// in prod)
    ├── new WebSocket(url)
    ├── onopen  → state='connected', reset reconnectAttempts, start ping, call onConnected()
    ├── onclose → cleanup, schedule reconnect (if abnormal close)
    └── onerror → log
```

### Module-Level State

```typescript
let activeSocket: WebSocket | null      // Current connection
let connectionGeneration = 0            // Increments each connect, prevents stale handlers
let reconnectAttempts = 0               // 0-5
let subscriberCount = 0                 // Ref counting for component lifecycle
let unsubscribeTimeout: ReturnType<typeof setTimeout>  // 200ms grace period
let storedTokenGetter: (() => Promise<string | null>) | null  // Survives reconnects
let authReady = false                   // Set by connectWithAuth

// Callbacks registered by hook (always latest via refs)
let onStateChange: ((state: string) => void) | null
let onMessage: ((event: MessageEvent) => void) | null
let onConnected: (() => void) | null    // Triggers recovery logic
```

### Reconnect

On unexpected close (not code 1000 or 4001): retry up to 5 times at `RECONNECT_DELAY * attempt` intervals (`2s, 4s, 6s, 8s, 10s`). Each `connect()` increments `connectionGeneration` to invalidate stale message handlers.

### Ping Keepalive

Every 25s, sends `{ type: "ping" }`. Server responds with `{ type: "pong" }`. Detects dead connections.

### Subscriber Ref Counting

Components call `subscribe()` on mount and `unsubscribe()` on unmount. Socket closes when `subscriberCount === 0`.

**Grace period:** `unsubscribe()` waits 200ms before checking count — prevents socket close during React component transitions (e.g., landing → workspace).

---

## Message Handling

The `useWebSocket` hook registers callbacks via `wsManager.setCallbacks({ onStateChange, onMessage, onConnected })`. Callbacks are stored in refs so the manager always calls the latest closures.

### Event → Store Update Map

| Server Event | Store Action | UI Effect |
|---|---|---|
| `ack` | `replaceCampaignId(oldId, serverId)` + `addThinkingChild(kind:'progress')` | Campaign ID remapped, "Generation started" shown |
| `subscribed` | `setIsRecovering(false)` | Recovery complete |
| `phase` | `addThinkingChild(kind:'phase', text: label \|\| phase)` | Phase step appears in thinking block |
| `tool_start` | `addThinkingChild(kind:'tool')` | Tool name shown (Task [subagent_type] / Skill [skill] if applicable) |
| `tool_end` | *(no-op — `case 'tool_end': break;`)* | Event is received but intentionally not handled |
| `text_start` | `commitStreamingText` (flush leftovers) + `removeEmptyThinkingBlock` + `setTextStreaming(true)` | Text-streaming mode begins; empty thinking blocks from follow-ups are pruned |
| `text_delta` | `appendTextDelta(delta)` — RAF-batched push into `streamingText` | Live text appears character-by-character |
| `text_end` | `commitStreamingText` + `setTextStreaming(false)` | Final buffer flush, promotes `streamingText` into a real TextBlock |
| `message` | Fallback: `appendTextBlock` **only when `!streamingText`** (i.e. local runner / non-streaming transports). Production ignores this because deltas already landed text. | Text appears in chat (non-streaming path only) |
| `status` | "cancelled" → `cancelGeneration` + `clearActiveSession`; else `addThinkingChild(kind:'status', variant:'info')` | Cancel confirmation OR status pill in thinking block |
| `file` | `updateCampaignFile` + `addThinkingChild(kind:'status')` + parse prompts JSON for image count | File tab updates, expected image count recalculated |
| `image` | `addImageToCampaign` + `updateThinkingImages` | Image appears in grid + counter updates |
| `complete` | `closeThinkingBlock('complete')` + `commitStreamingText` (safety) + `mergeAndStripTextBlocks` + conditional `appendTextBlock(summary)` + `completeGeneration` | Thinking block closes, text blocks merged, summary shown only if no text blocks exist |
| `credits_update` | `setCreditBalance(balance, plan_balance, topup_balance)` | Credit counter in header + UserMenu refreshes immediately |
| `error` | `code='INSUFFICIENT_CREDITS'` → `closeThinkingBlock('error')` + `failGeneration(upsellMsg)` + `openPricingModal` · "Session not found/expired" → `cleanupFailedRecovery` · else `failGeneration` | Paywall modal OR session cleanup OR error message in chat |
| `incomplete` | `closeThinkingBlock('error')` + `appendTextBlock` + `updateCampaignStatus('incomplete')` | Campaign marked incomplete with resume-on-next-message copy |
| `pong` | (ignored) | Keepalive response |

> The three `text_*` events + `credits_update` are **production-only**. Local dev (`server/`) emits the older `message` event instead — see [LOCAL_WEBSOCKET.md](../local/LOCAL_WEBSOCKET.md) for the parity matrix.

### Event ID Tracking

Server includes `id: number` on each message. Client saves to localStorage:
```
creative-agent:lastEventId:{sessionId} = 42
```

On reconnect/subscribe, sends `lastEventId` — server replays only newer events.

---

## Actions

### `generate(prompt, assetFileIds?)`

```typescript
1. sessionId = crypto.randomUUID()
2. Read sourceCampaignId from store (if "new from existing" flow)
3. store.startGeneration(sessionId, campaignName, prompt)  // creates campaign + messages
   - If sourceCampaignId set, campaign name is prefixed: "{sourceName} — {brief}"
4. saveActiveSession(sessionId, prompt, campaignId, messageId)
5. store.openThinkingBlock(campaignId, messageId, ...)
6. wsManager.sendMessage({
     type: 'generate',
     prompt,
     sessionId,
     ...(sourceCampaignId ? { sourceCampaignId } : {}),
     ...(assetFileIds?.length ? { assetFileIds } : {})
   })
7. Clear sourceCampaignId from store after sending
8. On send failure → failGeneration + clearActiveSession
```

### `followUp(campaignId, prompt, assetFileIds?)`

```typescript
1. store.startFollowUp(campaignId, prompt)  // creates user + assistant messages, sets isFollowUp=true
2. sessionIdRef = campaign.sessionId        // reuse existing session
3. saveActiveSession(campaign.sessionId, prompt, campaignId, messageId)
4. store.openThinkingBlock(campaignId, messageId, 'Processing follow-up...')
5. wsManager.sendMessage({
     type: 'follow_up',
     prompt,
     campaignId,
     ...(assetFileIds?.length ? { assetFileIds } : {})
   })
```

### `cancel()`

```typescript
1. wsManager.sendMessage({ type: 'cancel' })  // NO campaignId or sessionId
2. store.closeThinkingBlock(campaignId, messageId, 'error')
3. store.appendTextBlock(campaignId, messageId, 'Generation was cancelled.')
4. store.cancelGeneration(campaignId, messageId)
5. clearActiveSession()
// Client-side cancel is immediate — does NOT wait for server 'cancelled' status
```

### `resume(campaignId, resumePrompt)`

```typescript
// Called by ResultsView for incomplete campaigns — sends a GENERATE (not subscribe)
1. sessionId = crypto.randomUUID()
2. store.resumeGeneration(sessionId, campaignId)
3. saveActiveSession(sessionId, resumePrompt, campaignId, messageId)
4. store.openThinkingBlock(campaignId, messageId, 'Resuming generation...')
5. wsManager.sendMessage({
     type: 'generate',          // NOTE: sends generate, not subscribe
     prompt: resumePrompt,
     sessionId
   })
```

---

## Recovery Flow

### Page Reload During Generation

```
1. App.tsx: checkForRecovery()
     │
     ├── Find campaigns with status='generating'
     │
2. For each: campaignsApi.getStatus(id)
     │
     ├── Agent RUNNING:
     │     1. Save session to localStorage
     │     2. store.reconstructForRecovery(sessionId, prompt, campaignId)
     │     3. store.setAppState('workspace')
     │     4. useWebSocket auto-subscribes with lastEventId
     │     5. Server replays missed events
     │
     ├── Agent STOPPED:
     │     1. campaignsApi.recover(id) — POSTs /api/campaigns/:id/recover
     │     2. Server reads D1 (images, files, last assistant message) — NO R2 read
     │     3. If D1 has data → synth completion, mark complete, return full payload
     │     4. If no data → { recovered: false, reason: 'no_data' } → mark incomplete
     │
     └── Session EXPIRED:
           1. store.updateCampaignStatus('incomplete')
```

### `handleConnected()` (called by manager on WS open)

```
onConnected() fires
  │
  ├── Read saved session from localStorage
  │   └── If none → return (no recovery needed)
  │
  ├── If already recovering same campaign (reconnect during recovery):
  │   └── Just re-subscribe with lastEventId (no duplicate messages)
  │
  └── First-time recovery:
      1. setIsRecovering(true)
      2. reconstructForRecovery(sessionId, prompt, campaignId)
      3. openThinkingBlock('Recovering session...')
      4. sendMessage({ type: 'subscribe', sessionId, lastEventId })
      5. Load campaign messages in background (non-blocking)
         └── Merge: [...historical, ...live] — preserves recovery state
      6. 45s timeout: if still recovering → clear + cleanup
```

---

## WebSocket Message Types

### Client → Server

```typescript
{ type: 'generate',   prompt, sessionId, name, assetFileIds?, sourceCampaignId? }
{ type: 'follow_up',  prompt, campaignId, sessionId }
{ type: 'cancel',     campaignId, sessionId }
{ type: 'subscribe',  sessionId, lastEventId? }
{ type: 'ping' }
```

### Server → Client

```typescript
{ type: 'ack',            campaignId, id }
{ type: 'subscribed',     id }
{ type: 'phase',          phase, label?, id }
{ type: 'tool_start',     toolName, subagent_type?, skill?, id }
{ type: 'tool_end',       toolName, id }
{ type: 'text_start',     id }                                   // production-only
{ type: 'text_delta',     delta, id }                            // production-only
{ type: 'text_end',       id }                                   // production-only
{ type: 'message',        text, id }                             // local runner fallback
{ type: 'status',         message, id }
{ type: 'file',           fileType, content, id }
{ type: 'image',          imageIndex, urlPath, prompt, hookType?, id }
{ type: 'complete',       summary?, imageCount?, id }
{ type: 'credits_update', balance, plan_balance, topup_balance, cost, id }
{ type: 'error',          error, code?, id }                     // code: 'INSUFFICIENT_CREDITS'
{ type: 'incomplete',     message?, id }
{ type: 'pong' }
```

Full protocol spec: [WebSocket Protocol](../shared/WEBSOCKET_PROTOCOL.md)

---

## Key Safeguards

1. **Stale handler prevention** — `connectionGeneration` increments on each connect. Message callbacks check their captured generation matches current.

2. **Grace period on unmount** — 200ms delay in `unsubscribe()` prevents socket teardown during React component transitions.

3. **Max reconnect** — 5 attempts. After that, stops trying (avoids infinite reconnect loops).

4. **Event ID replay** — localStorage tracks last seen event ID per session. Reconnect replays only missed events.

5. **Token getter ref** — Stored once, survives re-renders and reconnects. Prevents auth race conditions.

---

## See Also

- [State Management](./STATE_MANAGEMENT.md) — Store actions triggered by WS events
- [WebSocket Protocol](../shared/WEBSOCKET_PROTOCOL.md) — Full message spec (both directions)
- [Client Architecture](./CLIENT_ARCHITECTURE.md) — App-level recovery flow
