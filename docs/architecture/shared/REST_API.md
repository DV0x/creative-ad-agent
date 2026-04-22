# REST API Reference

> Part of [Architecture Documentation](../INDEX.md) | Complete endpoint reference

---

## Base URL

| Mode | Base |
|---|---|
| Local | `http://localhost:5173/api` (Vite proxy → Express on `:3001`) |
| Staging | `https://creative-agent-staging.alphasapien17.workers.dev/api` |
| Production | `https://creativemachines.xyz/api` |

## Authentication

All endpoints (except `/health`) require:

```
Authorization: Bearer <clerk-jwt>
```

In local dev without `CLERK_SECRET_KEY`, auth is disabled and all requests pass as `user_id = 'anonymous'`.

---

## Campaigns

### `GET /api/campaigns`

List all campaigns for the authenticated user.

**Response:** `{ success: true, campaigns: Campaign[] }` (minimal — no files/images/messages)

```json
{
  "success": true,
  "campaigns": [
    {
      "id": "abc123",
      "user_id": "user_xxx",
      "name": "Nike Campaign",
      "status": "complete",
      "session_id": "sess-xxx",
      "created_at": "2026-03-10T...",
      "updated_at": "2026-03-10T..."
    }
  ]
}
```

### `POST /api/campaigns`

Create a new campaign.

**Body:** `{ name: string, sessionId?: string }`

**Response:** `Campaign`

### `GET /api/campaigns/:id`

Get full campaign with files, images, and messages.

**Response:**

```json
{
  "success": true,
  "campaign": { /* Campaign */ },
  "files": { "research": "...", "hooks": "...", "prompts": "..." },
  "images": [
    { "id": 1, "campaign_id": "abc", "image_index": 1, "hook_type": "stat",
      "prompt": "...", "file_path": "/images/abc/1_stat_bold.png", "version": 1 }
  ],
  "messages": [
    { "id": "msg1", "campaign_id": "abc", "role": "user",
      "content": "Create ads for nike.com", "blocks": "[]" }
  ]
}
```

### `PATCH /api/campaigns/:id`

Update campaign name, status, or brand grouping.

**Body:** `{ name?: string, status?: string, brand?: string }`

`brand` was added in Session 68 for the brand-grouped sidebar — setting it persists the brand name to D1 so grouping survives refresh.

### `DELETE /api/campaigns/:id`

Delete campaign and associated files/images/messages from DB. Does **not** clean up R2 objects.

### `GET /api/campaigns/:id/files/:type`

Get campaign file content. Type: `research` | `hooks` | `prompts`.

### `PUT /api/campaigns/:id/files/:type`

Update campaign file content.

**Body:** `{ content: string }`

### `GET /api/campaigns/:id/images`

List campaign images.

### `GET /api/campaigns/:id/messages`

Get chat messages for campaign.

### `POST /api/campaigns/:id/messages`

Add a chat message.

**Body:** `{ role: string, content: string, imageRefs?: string[], fileRefs?: string[] }`

### `GET /api/campaigns/:id/status`

Get generation status. Used during recovery to check if agent is still running.

**Response:**

```json
{
  "success": true,
  "status": "generating",
  "sessionId": "sess-xxx",
  "isAgentRunning": true,
  "hasEventBuffer": false
}
```

Note: `isAgentRunning` is derived from `campaign.status === 'generating'`. `hasEventBuffer` is always `false` from the REST API; real-time status comes via WebSocket.

### `POST /api/campaigns/:id/recover`

Reconcile a stuck campaign against D1 and, if it actually completed, flip its status.

**Only works for campaigns with status:** `incomplete`, `generating`, or `error`.

**Current recovery flow** (`routes/recovery.ts`) — D1 is the source of truth, R2 completion marker is no longer consulted:

1. Verify campaign ownership
2. Check if D1 has any completion data: `campaign_files`, `campaign_images`, or a last assistant message
3. If no data → `{ recovered: false, reason: "no_data" }`
4. If data exists but no assistant message → add a synthetic one (`"Generation recovered. N images found."`)
5. Set status → `complete`
6. Return the full campaign bundle

**Response (success):**

```json
{
  "success": true,
  "recovered": true,
  "imagesAdded": 0,
  "filesUpdated": 0,
  "campaign": { /* updated campaign */ },
  "files": [ /* campaign files */ ],
  "images": [ /* campaign images */ ],
  "messages": [ /* chat messages */ ]
}
```

> `imagesAdded` / `filesUpdated` are always 0 now — kept for client compatibility. The old R2-marker-based recovery would populate these; the D1-first recovery doesn't need to.

**Response (no data):**
```json
{ "success": true, "recovered": false, "reason": "no_data" }
```

**Response (not recoverable):**
```json
{ "success": false, "recovered": false, "reason": "not_recoverable", "message": "Campaign status is 'complete', not recoverable" }
```

---

## Assets

### `GET /api/assets/folders`

List user's asset folders.

### `POST /api/assets/folders`

Create folder. **Body:** `{ name: string }`

### `PATCH /api/assets/folders/:id`

Rename folder. **Body:** `{ name: string }`

### `DELETE /api/assets/folders/:id`

Delete folder and all files within.

### `GET /api/assets/folders/:id/files`

List files in a folder.

### `POST /api/assets/upload`

Upload file. **Content-Type:** `multipart/form-data`

**Fields:** `file` (the file), `folderId` (target folder ID)

**Response:** `AssetFile`

### `GET /api/assets/files/:id`

Serve file content (binary). Used for previews and downloads.

### `DELETE /api/assets/files/:id`

Delete file from DB and storage.

---

## Credits

See [Billing](./BILLING.md) for the full credit model. API values are in credits (10 credits = $1 USD).

### `GET /api/credits`

Get user's balance and lifetime totals.

**Response:**

```json
{
  "balance": 275.0,          // plan + topup (total spendable)
  "plan_balance": 250.0,     // plan pool (reset on subscription events)
  "topup_balance": 25.0,     // topup pool (persists across subscription renewals)
  "total_spent": 42.5,
  "total_generations": 17
}
```

All fields are credits, rounded to one decimal. Implementation: `routes/credits.ts:handleCreditsRequest`.

### `GET /api/credits/usage`

Paginated usage history.

**Query params:** `limit` (default 20, max 100), `offset` (default 0)

**Response:**

```json
{
  "usage": [
    {
      "id": "usg_abc…",
      "campaign_id": "cmp_xyz…",
      "request_id": "turn_1713804000000",
      "event_type": "follow_up",
      "total_cost": 3.2,      // credits
      "claude_cost": 0.8,     // credits (raw × 10, not × COST_MULTIPLIER)
      "image_cost": 2.4,      // credits
      "total_cost_usd": 0.32, // raw USD (still present for audit)
      "input_tokens": 12450,
      "output_tokens": 890,
      "num_turns": 3,
      "duration_ms": 45230,
      "created_at": "2026-04-22T…"
    }
  ]
}
```

---

## Payments

All endpoints proxy to Dodo Payments. See [Billing](./BILLING.md) for the payment lifecycle.

### `POST /api/payments/checkout`

Start a subscription checkout.

**Body:** `{ plan: "starter-monthly" | "starter-yearly" | "pro-monthly" | "pro-yearly", email: string, name?: string }`

**Response:** `{ success: true, checkout_url: string }`

Client redirects the browser to `checkout_url`. Dodo returns the user to `/checkout/success` after payment. Product IDs resolve from wrangler env vars (different per staging/production).

**Errors:**
- `400 { error: "Invalid plan" }` — unknown plan string
- `400 { error: "Email required" }`

### `POST /api/payments/topup`

Start a one-time PWYW top-up checkout.

**Body:** `{ amount: number, email: string, name?: string }`

**Constraints:** `amount >= 5` USD (`TOPUP_MIN_USD`)

The amount is written to Dodo's checkout metadata as `topup_usd_cents` so it survives currency conversion at settlement (Dodo may charge in a non-USD currency depending on merchant config; the USD amount is the source of truth on credit).

**Response:** `{ success: true, checkout_url: string }`

### `GET /api/payments/subscription`

Get current subscription state.

**Response:**

```json
{
  "plan": "pro",            // "free" | "starter" | "pro"
  "status": "active",       // "active" | "cancelled" | "expired" | "on_hold"
  "billing_interval": "monthly",  // "monthly" | "yearly" | null
  "current_period_end": "2026-05-22T..."
}
```

Returns `{ plan: "free", status: "active", billing_interval: null, current_period_end: null }` if no subscription row exists.

### `POST /api/payments/portal`

Get a Dodo customer portal URL. User manages payment method, cancels subscription, etc. from there.

**Response:** `{ success: true, portal_url: string }`

**Errors:**
- `400 { error: "No active subscription" }` if the user has no `dodo_customer_id`

---

## Events (Analytics)

### `POST /api/events`

Track a user event. Writes to the `user_events` table. Not paginated — there's no GET endpoint.

**Body:** `{ eventType: string, campaignId?: string, metadata?: Record<string, unknown> }`

**Response:** `{ success: true }`

**Errors:**
- `400 { error: "eventType is required" }`

**Client:** `eventsApi.track(eventType, campaignId?, metadata?)` (`client/src/lib/api.ts:469`). Fire-and-forget — errors are silently swallowed so a failed analytics call never blocks a user action.

**Currently tracked events:**

| `eventType` | Emitted from | Metadata shape |
|---|---|---|
| `image_download` | `ImageCard.tsx:40` — user saves a single generated image | `{ hookType, imageIndex }` |
| `download_all` | `ResultsView.tsx:70` — user downloads all images in a campaign | `{ imageCount }` |

Both pass the current `campaignId` so event-to-campaign joins work.

---

## Webhooks

### `POST /webhooks/dodo`

Receives Dodo Payments webhooks. **Unauthenticated** — protected by Standard Webhooks HMAC-SHA256 signature verification using `DODO_PAYMENTS_WEBHOOK_SECRET`.

**Verification:**
- Header `webhook-id` must be present (used as idempotency key → stored in `payment_events.webhook_id`)
- Header `webhook-timestamp` must be within 5 min of server time (replay protection)
- Header `webhook-signature` must be `v1,<base64-HMAC>` over `{webhook_id}.{timestamp}.{body}`

**Returns:**
- `200 OK` on success or duplicate
- `400` on missing `webhook-id` or invalid JSON
- `401` on signature failure
- `500` on handler error (still records to `payment_events` to avoid Dodo retrying forever)

**Handled event types:**

| Event | Effect |
|---|---|
| `subscription.active` | upsert subscription row (state only, no credit grant) |
| `subscription.renewed` | zero plan pool + grant `baseCreditsUsd × BONUS_MULTIPLIER` |
| `subscription.cancelled` | mark cancelled (plan pool kept until expiry) |
| `subscription.expired` | zero plan pool + mark expired, plan → `free` |
| `subscription.on_hold` | mark on_hold |
| `subscription.plan_changed` | update plan + interval |
| `payment.succeeded` | if non-subscription: grant to topup pool with Pro bonus; if subscription: skipped (credited via `.renewed`) |
| `refund.succeeded` | look up original credit via `payment_id`, deduct from originating pool with spill |

See [Billing](./BILLING.md) for webhook-by-webhook detail.

---

## Images

### `GET /images/:sessionId/:filename`

Serve a generated image. The route path is `/images/{path}` where path = `{sessionId}/{filename}`.

| Mode | Source |
|---|---|
| Local | `generated-images/{sessionId}/{filename}` on disk |
| Production | R2 key `users/{userId}/images/{path}` (path = `{sessionId}/{filename}`) |

**Headers:** `Cache-Control: public, max-age=31536000, immutable`

**Auth:** Requires Bearer token (images are behind auth).

---

## Other

### `GET /health`

Health check (no auth required).

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-03-10T...",
  "auth": { "clerkKeySet": true },
  "bindings": { "d1": true, "r2": true, "do": true }
}
```

---

## Error Responses

All errors return:

```json
{
  "error": "Human-readable error message"
}
```

| Status | Meaning |
|---|---|
| 400 | Bad request (missing fields, invalid input) |
| 401 | Unauthorized (missing/invalid JWT) |
| 404 | Resource not found |
| 500 | Internal server error |

---

## See Also

- [Auth Flow](./AUTH_FLOW.md) — How JWT tokens are obtained and verified
- [Billing](./BILLING.md) — Credits, subscriptions, Dodo Payments
- [Client Architecture](../client/CLIENT_ARCHITECTURE.md) — API client (`lib/api.ts`)
- [D1 Database](../cloudflare/D1_DATABASE.md) — What the API reads/writes
