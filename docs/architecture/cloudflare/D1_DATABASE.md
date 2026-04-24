# D1 Database

> Part of [Architecture Documentation](../INDEX.md) | **Schema:** `cloudflare/schema.sql` | **Access layer:** `cloudflare/src/db/`

---

## Schema

Both local (SQLite) and production (D1) use the same schema.

### `campaigns`

```sql
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'generating'
    CHECK (status IN ('generating', 'complete', 'incomplete', 'error', 'cancelled')),
  session_id TEXT,          -- WebSocket session ID
  sdk_session_id TEXT,      -- Claude SDK session ID (unused on Cloudflare — JSONL via s3fs is unreliable)
  brand TEXT,               -- Brand grouping for the sidebar — persisted via PATCH /api/campaigns/:id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- trigger-updated
);
```

Indexes: `user_id`, `status`, `session_id`, `sdk_session_id`

### `campaign_files`

```sql
CREATE TABLE campaign_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('research', 'hooks', 'prompts')),
  content TEXT DEFAULT '',
  is_ready INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, file_type)
);
```

### `campaign_images`

```sql
CREATE TABLE campaign_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  image_index INTEGER NOT NULL,     -- 1-6
  hook_type TEXT NOT NULL
    CHECK (hook_type IN ('stat', 'story', 'fomo', 'curiosity', 'callout', 'contrast')),
  prompt TEXT,
  file_path TEXT NOT NULL,          -- /images/{campaignId}/{filename}
  version INTEGER DEFAULT 1,        -- increments on follow-up regeneration
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, image_index, version)
);
```

### `messages`

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_refs TEXT,       -- JSON array of image IDs (unused currently)
  file_refs TEXT,        -- JSON array of file refs (unused currently)
  blocks TEXT,           -- JSON: MessageBlock[] for thinking blocks
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `asset_folders` / `asset_files`

```sql
CREATE TABLE asset_folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asset_files (
  id TEXT PRIMARY KEY,
  folder_id TEXT NOT NULL REFERENCES asset_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,     -- R2 key or local path
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'document', 'other')),
  size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `user_credits`

User's credit balances, split into two pools. See [Billing](../shared/BILLING.md) for pool semantics.

```sql
CREATE TABLE user_credits (
  user_id TEXT PRIMARY KEY,
  balance_usd REAL NOT NULL DEFAULT 0,         -- plan pool (reset on subscription.renewed & .expired)
  balance_usd_topup REAL NOT NULL DEFAULT 0,   -- topup pool (grown by one-time purchases, never auto-wiped)
  total_spent_usd REAL NOT NULL DEFAULT 0,
  total_generations INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Spend order:** plan pool first, spill to topup. Atomic deduction via two-CASE SQL UPDATE in `credits.ts:recordUsage`.

### `usage_log`

Per-turn cost record. One row per completed generation or follow-up.

```sql
CREATE TABLE usage_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  request_id TEXT NOT NULL DEFAULT 'initial',  -- 'initial' or turn_<timestamp>
  event_type TEXT NOT NULL,                    -- 'generation' | 'follow_up' | 'cancelled'
  claude_cost_usd REAL NOT NULL DEFAULT 0,     -- raw Claude API cost
  image_count INTEGER NOT NULL DEFAULT 0,
  image_cost_usd REAL NOT NULL DEFAULT 0,      -- raw fal.ai cost
  total_cost_usd REAL NOT NULL DEFAULT 0,      -- charged cost (raw × COST_MULTIPLIER)
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  num_turns INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(campaign_id, request_id)              -- idempotency guard for retries
);
```

Indexes: `user_id`, `campaign_id`

The `UNIQUE(campaign_id, request_id)` is the idempotency guard — `recordUsage` uses `INSERT OR IGNORE` so a retried turn with the same `request_id` no-ops and returns the current balances unchanged.

### `user_subscriptions`

One row per user tracking their active Dodo subscription.

```sql
CREATE TABLE user_subscriptions (
  user_id TEXT PRIMARY KEY,
  dodo_customer_id TEXT,
  dodo_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro')),
  billing_interval TEXT
    CHECK (billing_interval IN ('monthly', 'yearly') OR billing_interval IS NULL),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'expired', 'on_hold')),
  current_period_end TEXT,                 -- ISO date, when Dodo next bills (or when access ends if cancelled)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Written exclusively by webhook handlers in `routes/webhooks.ts` via `upsertSubscription()`.

### `payment_events`

Webhook audit log. One row per Dodo webhook received. Also the idempotency guard.

```sql
CREATE TABLE payment_events (
  webhook_id TEXT PRIMARY KEY,              -- Dodo's webhook-id header — enforces at-most-once processing
  event_type TEXT NOT NULL,                 -- 'subscription.renewed' | 'payment.succeeded' | 'refund.succeeded' | ...
  user_id TEXT,
  amount_usd REAL,                          -- Original payment amount in USD (may be null for state-only events)
  amount_credited_usd REAL,                 -- What we credited (base × bonus). Null for state-only events.
  metadata TEXT,                            -- Raw webhook body — keep forever for audit + refund payment_id lookup
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Index: `user_id`

The raw webhook body in `metadata` is load-bearing for refund handling — refund webhooks carry empty metadata, so we look up the original payment via `SELECT ... WHERE metadata LIKE '%"payment_id":"..."%'` (`credits.ts:getPaymentCredit`).

### `user_events`

Generic analytics table. Currently used for download-event tracking (Session `f2e5c46`). Not part of billing but lives in the same access layer.

```sql
CREATE TABLE user_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,                -- currently: 'image_download' | 'download_all'
  campaign_id TEXT,                        -- optional linkage
  metadata TEXT,                           -- JSON blob — shape varies by event_type
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Indexes: `user_id`, `event_type`, `campaign_id`

### Triggers

- `campaigns_updated_at` — auto-updates `updated_at` on campaign changes
- `campaign_files_updated_at` — auto-updates `updated_at` on file changes

### Status Values

```
campaigns.status:
  'generating' → actively running (or stuck — check generation age)
  'complete'   → generation finished successfully
  'incomplete' → timed out, errored, or interrupted (recoverable via /recover)
  'error'      → unrecoverable failure
  'cancelled'  → user cancelled
```

### D1 Gotchas

1. **Schema is NOT auto-deployed** — must apply manually via `wrangler d1 execute --file=schema.sql`. Staging and production use separate databases (`creative-agent-db` vs `creative-agent-db-prod`); apply to both.
2. **`sdk_session_id`** is captured but **not used for resume on Cloudflare** — JSONL via s3fs is unreliable (null-byte corruption). D1 file hydration handles context instead. Still populated for local-dev compatibility.
3. **`blocks` column** stores JSON `MessageBlock[]` — rendered by `ChatMessage` component after refresh
4. **`campaign_images` is the image table** — NOT `files`. Common confusion because both exist
5. **Billing tables are per-user, not per-campaign** — `user_credits`, `user_subscriptions`. The `usage_log` references `campaign_id` but is still queried by `user_id` for totals.
6. **`payment_events.webhook_id` PK is the idempotency guard** — dropping this constraint would enable double-crediting.
7. **`usage_log.UNIQUE(campaign_id, request_id)`** is also an idempotency guard — `recordUsage` relies on it via `INSERT OR IGNORE`.

---

## Access Layer (`cloudflare/src/db/`)

Each module exports typed functions. All queries filter by `user_id`.

### `campaigns.ts`

| Function | What it does |
|---|---|
| `createCampaign(db, userId, name, sessionId)` | INSERT with generated UUID |
| `getCampaignById(db, campaignId, userId)` | SELECT with user_id filter |
| `getCampaignBySessionId(db, sessionId)` | SELECT by session_id |
| `getCampaignsByUser(db, userId)` | SELECT all for user (no files/images) |
| `getRecentCampaigns(db, userId, limit)` | SELECT recent campaigns (default 10) |
| `updateCampaignStatus(db, campaignId, status)` | UPDATE status only |
| `updateCampaignName(db, campaignId, name)` | UPDATE name only |
| `updateCampaignBrand(db, campaignId, brand)` | UPDATE brand (for sidebar grouping) |
| `updateCampaignSessionId(db, campaignId, sessionId)` | UPDATE session_id |
| `updateSdkSessionId(db, campaignId, sdkSessionId)` | SET sdk_session_id |
| `getSdkSessionId(db, campaignId)` | GET sdk_session_id |
| `deleteCampaign(db, campaignId)` | DELETE (cascades) |

### `files.ts`

| Function | What it does |
|---|---|
| `getCampaignFile(db, campaignId, fileType)` | SELECT single file |
| `getCampaignFiles(db, campaignId)` | SELECT all files for campaign |
| `updateCampaignFile(db, campaignId, fileType, content)` | UPSERT (INSERT OR REPLACE) |
| `markFileReady(db, campaignId, fileType)` | SET `is_ready = 1` |
| `areAllFilesReady(db, campaignId)` | Check if all 3 files have `is_ready = 1` |

### `images.ts`

| Function | What it does |
|---|---|
| `addCampaignImage(db, { campaignId, imageIndex, hookType, prompt?, filePath })` | INSERT |
| `getCampaignImages(db, campaignId)` | SELECT all images |
| `getLatestCampaignImages(db, campaignId)` | SELECT latest version per image_index (dedup) |
| `getImageCount(db, campaignId)` | COUNT(*) |
| `deleteImage(db, imageId)` | DELETE single image |

### `messages.ts`

| Function | What it does |
|---|---|
| `addMessage(db, { campaignId, role, content, blocks? })` | INSERT with generated UUID |
| `getMessages(db, campaignId)` | SELECT ordered by created_at |
| `getMessage(db, id)` | SELECT single message by ID |
| `getLastAssistantMessage(db, campaignId)` | SELECT last assistant message |
| `updateMessageContent(db, id, content)` | UPDATE content only |
| `deleteMessage(db, id)` | DELETE single message |

### `assets.ts`

| Function | What it does |
|---|---|
| `createFolder(db, userId, name)` | INSERT folder |
| `getFoldersByUser(db, userId)` | SELECT all folders for user |
| `getFolder(db, id, userId)` | SELECT single folder |
| `renameFolder(db, id, name)` | UPDATE name |
| `deleteFolder(db, id)` | DELETE (cascades files) |
| `addFile(db, folderId, name, filePath, fileType, size?)` | INSERT file |
| `getFilesByFolder(db, folderId)` | SELECT files in folder |
| `getFile(db, id)` | SELECT single file |
| `deleteFile(db, id)` | DELETE file |
| `getFilesCount(db, folderId)` | COUNT files in folder |

### `images.ts` (billing-adjacent extras)

| Function | What it does |
|---|---|
| `getMaxImageIndex(db, campaignId)` | `SELECT MAX(image_index)` — used by DO to avoid index collisions on follow-up regenerations |

### `credits.ts`

| Function | What it does |
|---|---|
| `getOrCreateCredits(db, userId)` | SELECT or INSERT + return `UserCredits` |
| `getBalance(db, userId)` | Return `balance_usd + balance_usd_topup` (total spendable) |
| `addPlanCredits(db, userId, amountUsd)` | Increment `balance_usd` |
| `addTopupCredits(db, userId, amountUsd)` | Increment `balance_usd_topup` |
| `setPlanBalance(db, userId, amountUsd)` | Absolute set (used by `subscription.renewed` to zero before grant, and by `.expired` to zero permanently) |
| `recordUsage(db, userId, campaignId, usage)` | Idempotent (via UNIQUE constraint) — INSERT `usage_log` + atomic two-pool deduction |
| `refundCredits(db, userId, amountUsd, preferPool)` | Deduct from preferred pool first, spill into other, floored at 0 |
| `getUsageLog(db, userId, limit, offset)` | Paginated SELECT |
| `getPaymentCredit(db, paymentId)` | Look up original credit row for a Dodo `payment_id` (used by refund handler) |

Constants: `CREDITS_PER_USD = 10`, `COST_MULTIPLIER = 4`.

### `subscriptions.ts`

| Function | What it does |
|---|---|
| `getSubscription(db, userId)` | SELECT user's subscription (or null) |
| `upsertSubscription(db, userId, { plan, status, billingInterval?, currentPeriodEnd?, dodoCustomerId?, dodoSubscriptionId? })` | INSERT ... ON CONFLICT UPDATE, preserves existing Dodo IDs if not provided |
| `isWebhookProcessed(db, webhookId)` | Check `payment_events` PK — returns `true` if already seen |
| `recordWebhookEvent(db, webhookId, eventType, userId, amountUsd, amountCreditedUsd, metadata)` | INSERT OR IGNORE — idempotent audit record |

### `events.ts`

| Function | What it does |
|---|---|
| `trackEvent(db, userId, eventType, campaignId?, metadata?)` | INSERT into `user_events` with JSON-stringified metadata |
| `getEvents(db, userId, eventType?, limit)` | SELECT user events, optionally filtered by type |

### `utils.ts`

| Function | What it does |
|---|---|
| `generateId(prefix)` | Generate UUID with prefix (e.g., `campaign_abc123`) |

---

## Querying in Production

```bash
# Production
npx wrangler d1 execute creative-agent-db-prod --remote --command="<SQL>"

# Staging
npx wrangler d1 execute creative-agent-db --remote --command="<SQL>"
```

See [Debugging Guide](../ops/DEBUGGING.md) for common queries.

---

## See Also

- [R2 Storage](./R2_STORAGE.md) — File storage complement to D1
- [Durable Object](./DURABLE_OBJECT.md) — Primary consumer of DB layer
- [REST API](../shared/REST_API.md) — API endpoints that expose DB data
- [Billing](../shared/BILLING.md) — Credit pool semantics, spend order, Dodo Payments webhook logic
