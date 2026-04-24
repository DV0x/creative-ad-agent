# Debugging

> Part of [Architecture Documentation](../INDEX.md) | How to inspect and debug production

---

## Quick Health Check

```bash
# Staging
curl -s https://creative-agent-staging.alphasapien17.workers.dev/health | python3 -m json.tool

# Production
curl -s https://creativemachines.xyz/health | python3 -m json.tool
```

> Per-env bindings, DNS, and secrets diverge between staging and production — see [STAGING_PRODUCTION.md](./STAGING_PRODUCTION.md) before debugging.

Response shape (from `health.ts`):
```json
{
  "status": "ok",
  "d1": { "connected": true, "campaigns": 5 },
  "r2": { "bound": true },
  "auth": { "clerkKeySet": true },
  "timestamp": "2026-03-10T..."
}
```
Top-level keys: `status`, `d1`, `r2`, `auth`, `timestamp` (no `bindings` wrapper).

---

## D1 Database (SQL)

```bash
# Per-env databases. Always use --remote for the deployed database.
npx wrangler d1 execute creative-agent-db      --remote --command="<SQL>"   # staging
npx wrangler d1 execute creative-agent-db-prod --remote --command="<SQL>"   # production
```

### Common Queries

```sql
-- Recent campaigns
SELECT id, user_id, name, status, session_id, sdk_session_id
FROM campaigns ORDER BY created_at DESC LIMIT 10;

-- Campaign with full details
SELECT c.*, GROUP_CONCAT(ci.image_index) as images
FROM campaigns c
LEFT JOIN campaign_images ci ON ci.campaign_id = c.id
WHERE c.id = 'xxx' GROUP BY c.id;

-- Messages for a campaign
SELECT id, role, substr(content, 1, 100), created_at
FROM messages WHERE campaign_id = 'xxx' ORDER BY created_at;

-- Campaign files
SELECT campaign_id, file_type, length(content) as content_length
FROM campaign_files WHERE campaign_id = 'xxx';

-- All images for a campaign
SELECT image_index, hook_type, file_path, version
FROM campaign_images WHERE campaign_id = 'xxx' ORDER BY image_index;

-- Count everything
SELECT
  (SELECT count(*) FROM campaigns) as campaigns,
  (SELECT count(*) FROM messages) as messages,
  (SELECT count(*) FROM campaign_images) as images,
  (SELECT count(*) FROM campaign_files) as files;

-- Wipe all data (careful!)
DELETE FROM campaign_images; DELETE FROM campaign_files;
DELETE FROM messages; DELETE FROM campaigns;
DELETE FROM asset_files; DELETE FROM asset_folders;
```

### Table Reference

| Table | Key Columns |
|---|---|
| `campaigns` | `id`, `user_id`, `name`, `brand`, `status`, `session_id`, `sdk_session_id` |
| `campaign_files` | `campaign_id`, `file_type`, `content` |
| `campaign_images` | `campaign_id`, `image_index`, `hook_type`, `prompt`, `file_path`, `version` |
| `messages` | `campaign_id`, `role`, `content`, `blocks` (JSON) |
| `asset_folders` | `id`, `user_id`, `name` |
| `asset_files` | `folder_id`, `name`, `file_path`, `file_type`, `size` |
| `user_credits` | `user_id`, `plan_balance`, `topup_balance`, `updated_at` |
| `usage_log` | `campaign_id`, `request_id` (unique), `event_type`, `total_cost_usd`, `claude_cost_usd`, `image_count`, `image_cost_usd` |
| `user_subscriptions` | `user_id`, `plan`, `status`, `dodo_subscription_id`, `current_period_end` |
| `payment_events` | `user_id`, `webhook_id` (unique), `event_type`, `raw_payload` |
| `user_events` | `user_id`, `event_type`, `campaign_id`, `metadata` |

### Billing Queries

```sql
-- Current credit balance for a user (sum of plan + topup pools)
SELECT user_id, plan_balance, topup_balance,
       (plan_balance + topup_balance) AS total
FROM user_credits WHERE user_id = 'user_xxx';

-- Recent usage for a user (charged credits per turn)
SELECT campaign_id, request_id, event_type,
       claude_cost_usd, image_count, image_cost_usd, total_cost_usd, created_at
FROM usage_log WHERE user_id = 'user_xxx'
ORDER BY created_at DESC LIMIT 20;

-- Subscription state
SELECT user_id, plan, status, dodo_subscription_id, current_period_end
FROM user_subscriptions WHERE user_id = 'user_xxx';

-- Find a specific webhook event (idempotency debugging)
SELECT * FROM payment_events WHERE webhook_id = 'evt_xxx';

-- Download / engagement tracking
SELECT event_type, count(*) FROM user_events
WHERE user_id = 'user_xxx' GROUP BY event_type;
```

See [BILLING.md](../shared/BILLING.md) for the two-pool credit model, Dodo webhook semantics, and how `usage_log.request_id` enforces idempotency via `INSERT OR IGNORE`.

### Stuck generation diagnosis

```sql
-- Find campaigns stuck in generating/incomplete state
SELECT id, user_id, name, status, session_id, created_at,
       (strftime('%s','now') - strftime('%s', created_at)) AS age_seconds
FROM campaigns WHERE status IN ('generating','incomplete')
ORDER BY created_at DESC LIMIT 20;
```

If a campaign is older than ~5 min and still `'generating'`, it's probably a zombie (DO has no active sandbox). The client's `/recover` call on next page load will reconcile from D1 (see [DURABLE_OBJECT.md § Layer 4](../cloudflare/DURABLE_OBJECT.md#layer-4-client-recover)).

---

## R2 Storage (Objects)

```bash
# Per-env buckets. Must use --remote for the deployed object.
npx wrangler r2 object get "creative-agent-assets/{key}"      --remote --file=/tmp/out.ext   # staging
npx wrangler r2 object get "creative-agent-assets-prod/{key}" --remote --file=/tmp/out.ext   # production
```

### Key Patterns

```
users/{userId}/images/{sessionId}/{timestamp}_{i+1}_{sanitized-prompt}.{ext}
users/{userId}/uploads/{file_path}
users/{userId}/.claude/projects/-app-agent/{sdkSessionId}.jsonl   (orphaned — see R2_STORAGE.md)
```

- Image filename is `{timestamp}_{i+1}_{sanitized}.{ext}` — hookType is NOT in the key. See [IMAGE_PIPELINE.md § Image Naming](../shared/IMAGE_PIPELINE.md#image-naming)
- SDK project dir is NOT a hash — it's the cwd with `/` replaced by `-` (cwd `/app/agent` → `-app-agent`)
- `sdkSessionId` is stored in D1 `campaigns.sdk_session_id`
- **No `completion_{campaignId}.json` on R2** — the only completion marker is `/app/turn-result.json` on the container local disk

### Gotchas

- **No `r2 list` command** — you need exact keys. Get the path from D1 (campaign_images.file_path)
- **`wrangler r2 object get` silently creates 0-byte files** on missing keys — always check file size
- **Browser HTTP cache hides missing data** — `Cache-Control: immutable` means browser serves from cache even after hard refresh. Use `fetch()` with `cache: 'no-store'` to test

---

## Worker Logs

### `wrangler tail`

```bash
npx wrangler tail --format pretty
```

- Shows Worker request/response logs + DO console.log output
- **Buffers long handlers** — DO logs only appear when handler returns
- Use the tail log buffer pattern (alarm flushes) for real-time visibility
- "Ok" status means no uncaught exception, NOT HTTP 200

### Container Logs

**Cloudflare Dashboard → Containers → [creative-agent] → Logs tab**

Shows errors not visible in `wrangler tail`. Useful for streaming/RPC errors. No CLI equivalent (`wrangler containers logs` doesn't exist).

Key errors to look for:
- `"Failed to execute streaming command"` → streaming controller died (browser refresh or DO reset mid-turn)
- `"stream chunk for unknown request"` → `streamProcessLogs` output arriving after the DO stopped caring (cancelled turn)
- `TypeError: Invalid state: Controller is already closed` → stream re-attach after disconnect
- `"Network connection lost"` / `"object to be reset"` → sandbox RPC torn down, DO wipes sandbox ref and marks incomplete (see [DURABLE_OBJECT.md § Layer 3](../cloudflare/DURABLE_OBJECT.md#layer-3-alarm-fallback))

### DO Tail Log Buffer

During generation, the DO buffers logs to `tailLogs[]` and flushes them each alarm tick. This is because:
- Long-running fire-and-forget promises don't emit logs until they complete
- The alarm handler is the only periodic execution point while generation runs
- The alarm interval is **10 seconds** (`campaign-session.ts:104, 283, 292`), so buffered logs appear in `wrangler tail` in ~10 s batches

---

## Container Debugging

### Check Container Status

```bash
npx wrangler containers info creative-agent
```

Shows: instance count, instance type, regions.

### Common Container Issues

| Symptom | Likely Cause | Check |
|---|---|---|
| Generation never starts | Sandbox creation timeout | Container logs in dashboard |
| 403 from Anthropic API | IP blocked | Pre-flight retry should handle this, check logs |
| Images missing in R2 | FUSE mount not flushed | Check if `unmountBucket()` ran before destroy |
| Follow-up hangs | File IPC not picked up | Check if agent-runner is alive in container |
| Container won't start | Docker image not pushed | `docker builder prune -af` + redeploy |

### Pre-flight IP Check

The DO tests the Anthropic API from each new sandbox. If it gets a 403, it destroys the sandbox and creates a new one (up to 3 attempts). `104.28.157.x` is consistently blocked; `104.28.156.x`, `104.28.160.x`, `104.28.161.x` work fine.

---

## WebSocket Debugging

### From Browser Console

```javascript
// Check connection state
// (stored in Zustand — access via React DevTools or window.__store if exposed)

// Check localStorage for session tracking
localStorage.getItem('creative-agent:activeSession')
localStorage.getItem('creative-agent:lastEventId:sess-xxx')
```

### Common WS Issues

| Symptom | Likely Cause | Fix |
|---|---|---|
| "Session not found" | DO was reset during generation | Reconnect triggers recovery |
| Connection drops after 2 min | No messages flowing (idle timeout) | Ping keepalive should prevent this |
| Events missing after reconnect | Event buffer was cleared by DO reset | Use R2 recovery: `POST /api/campaigns/:id/recover` |
| Auth error on connect | Expired JWT | Client should auto-refresh token |

---

## Checking Generation Status

When a generation seems stuck, check these in order:

```
1. D1 status (per-env db name):
   SELECT id, status, sdk_session_id FROM campaigns WHERE id='xxx';
   → 'generating' = still running (or stuck)
   → 'complete' = done
   → 'incomplete' = timed out or errored
   → 'cancelled' = user cancelled

2. Check D1 for partial data (D1 is the source of truth now — no R2 marker):
   SELECT count(*) FROM campaign_images   WHERE campaign_id='xxx';
   SELECT count(*) FROM campaign_files    WHERE campaign_id='xxx';
   SELECT id, role FROM messages          WHERE campaign_id='xxx' ORDER BY created_at;
   → If images/files/assistant message exist but status='generating':
     client POST /api/campaigns/{id}/recover will synthesize completion from D1.

3. Inside the container (if sandbox is still reachable):
   sandbox.exec('cat /app/turn-result.json')
   → Local marker. Present only if the agent's writeCompletionMarker ran.
   → If present but D1 still generating: tryFinalize hasn't picked it up yet;
     alarm will try on its next 10s tick or on /recover.

4. Container dashboard (Cloudflare Dashboard → Containers → Logs):
   → Check for errors (streaming failures, process exits, fatal RPC errors)

5. wrangler tail (live):
   npx wrangler tail --format pretty                   # default env
   npx wrangler tail --env production --format pretty
   → Look for [alarm], [stream], [gen-fast], [reconcile], [setup] prefixes
   → Logs appear in ~10 s batches (flushed by each alarm tick)
```

---

## Local Dev Debugging

```bash
# Start server with verbose logging
cd server && DEBUG=* npm run dev

# Check SQLite directly
sqlite3 server/data/creative_agent.db ".tables"
sqlite3 server/data/creative_agent.db "SELECT * FROM campaigns"
```

---

## See Also

- [Staging ↔ Production](./STAGING_PRODUCTION.md) — Per-env bindings, DNS, Clerk apps, Dodo product IDs
- [Known Issues](./KNOWN_ISSUES.md) — Current gaps
- [Deployment](./DEPLOYMENT.md) — Deploy process
- [Durable Object](../cloudflare/DURABLE_OBJECT.md) — DO state machine and recovery
- [Billing](../shared/BILLING.md) — Credits, Dodo webhooks, idempotency model
- [R2 Storage](../cloudflare/R2_STORAGE.md) — Bucket per env, key patterns, FUSE semantics
