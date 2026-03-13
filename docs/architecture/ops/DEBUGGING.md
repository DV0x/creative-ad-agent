# Debugging

> Part of [Architecture Documentation](../INDEX.md) | How to inspect and debug production

---

## Quick Health Check

```bash
curl -s https://creative-agent.alphasapien17.workers.dev/health | python3 -m json.tool
```

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
# All commands require --remote for the deployed database
npx wrangler d1 execute creative-agent-db --remote --command="<SQL>"
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
| `campaigns` | `id`, `user_id`, `name`, `status`, `session_id`, `sdk_session_id` |
| `campaign_files` | `campaign_id`, `file_type`, `content` |
| `campaign_images` | `campaign_id`, `image_index`, `hook_type`, `prompt`, `file_path`, `version` |
| `messages` | `campaign_id`, `role`, `content`, `blocks` (JSON) |
| `asset_folders` | `id`, `user_id`, `name` |
| `asset_files` | `folder_id`, `name`, `file_path`, `file_type`, `size` |

---

## R2 Storage (Objects)

```bash
# Download an object (must use --remote)
npx wrangler r2 object get "creative-agent-assets/{key}" --remote --file=/tmp/out.ext
```

### Key Patterns

```
users/{userId}/images/{sessionId}/{index}_{hookType}_{name}.png
users/{userId}/uploads/{folderDir}/{filename}
users/{userId}/.claude/projects/-app-agent/{sdkSessionId}.jsonl
```

- SDK project dir is NOT a hash — it's the cwd with `/` replaced by `-` (cwd `/app/agent` → `-app-agent`)
- `sdkSessionId` is stored in D1 `campaigns.sdk_session_id`

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
- `"Failed to execute streaming command"` → streaming controller died (browser refresh)
- `"stream chunk for unknown request"` → `waitForLog` timed out, container still sending
- `TypeError: Invalid state: Controller is already closed` → SSE stream re-attach after disconnect

### DO Tail Log Buffer

During generation, the DO buffers logs to `tailLogs[]` and flushes them every 30s via the alarm handler. This is because:
- Long-running fire-and-forget promises don't emit logs until they complete
- The alarm handler is the only periodic execution point
- Logs appear batched every 30s in `wrangler tail`

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
1. D1 status:
   SELECT id, status, sdk_session_id FROM campaigns WHERE id='xxx';
   → 'generating' = still running (or stuck)
   → 'complete' = done
   → 'incomplete' = timed out or errored

2. R2 completion marker:
   npx wrangler r2 object get "creative-agent-assets/users/{userId}/completion_{campaignId}.json" \
     --remote --file=/tmp/marker.json && cat /tmp/marker.json

   → If exists but D1 still 'generating': completion detection failed
     Fix: POST /api/campaigns/{id}/recover

   → If missing: agent hasn't finished yet

   Also check /app/turn-result.json on the container (written by agent-runner
   after each turn). Contains { images, files } — used by the DO for
   reconciliation after SSE frame loss. Read via sandbox.exec():
     sandbox.exec('cat /app/turn-result.json')

3. Container dashboard (Cloudflare Dashboard → Containers → Logs):
   → Check for errors (streaming failures, process exits)

4. wrangler tail (live):
   npx wrangler tail --format pretty
   → Look for [alarm], [completion], [gen-fast], [reconcile] prefixes
   → Logs appear every 30s (batched by alarm)
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

- [Known Issues](./KNOWN_ISSUES.md) — Current gaps
- [Deployment](./DEPLOYMENT.md) — Deploy process
- [Durable Object](../cloudflare/DURABLE_OBJECT.md) — DO state machine and recovery
