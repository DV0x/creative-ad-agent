# Deployment

> Part of [Architecture Documentation](../INDEX.md) | Deploy commands, secrets, and gotchas

---

## Prerequisites

- Cloudflare account with Workers, D1, R2, Containers enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- Docker installed and running
- Clerk account with secret key
- fal.ai account with API key

---

## Secrets

Set via `wrangler secret put`. **Always pipe through `tr -d '\n'`** to avoid trailing newlines.

```bash
echo -n "sk-ant-xxx" | npx wrangler secret put ANTHROPIC_API_KEY
echo -n "fal-xxx"    | npx wrangler secret put FAL_KEY
echo -n "sk_test_xx" | npx wrangler secret put CLERK_SECRET_KEY
echo -n "xxx"        | npx wrangler secret put R2_ACCESS_KEY_ID
echo -n "xxx"        | npx wrangler secret put R2_SECRET_ACCESS_KEY
```

**Also required** (used by `mountBucket()` for R2 FUSE endpoint URL):
```bash
echo -n "your-account-id" | npx wrangler secret put CF_ACCOUNT_ID
```
Note: `CF_ACCOUNT_ID` is NOT in `wrangler.jsonc` vars — it must be set as a wrangler secret like the other credentials above. The env type declaration in `env.d.ts` comments it as "set in wrangler.jsonc" but that's outdated.

**Important:** Secrets need a redeploy to take effect on running DOs. `wrangler secret put` alone doesn't update active instances.

---

## Deploy Command

```bash
# Full deploy: build client + prune Docker cache + deploy Worker + container
cd client && npm run build && \
docker logout registry.cloudflare.com; \
docker builder prune -af; \
cd ../cloudflare && npx wrangler deploy
```

### Why Each Step

1. **`npm run build`** — Builds React SPA to `client/dist/`. Clerk key loaded from `client/.env`
2. **`docker logout`** — Prevents "already exists in keychain" errors
3. **`docker builder prune -af`** — Forces fresh Docker build. Without this, cached layers cause wrangler to skip pushing the container image
4. **`npx wrangler deploy`** — Deploys Worker code + static assets + container image

### Two Propagation Phases

Deploy has two phases, each takes ~1-2 minutes:

1. **Worker code + static assets** — fast, updates within seconds
2. **Container image push** — takes ~2 min longer

Each phase resets active DOs. **Wait for full rollout before testing.**

Check container status:
```bash
npx wrangler containers info creative-agent
```

---

## What Gets Deployed

| Component | Source | Destination |
|---|---|---|
| Worker code | `cloudflare/src/**` | Cloudflare Worker |
| Static assets | `client/dist/` | Workers Static Assets |
| Container image | `cloudflare/sandbox/Dockerfile` | Container registry |
| D1 schema | `cloudflare/schema.sql` | Applied manually |

### D1 Schema Changes

Schema is **not** auto-deployed. Apply manually:

```bash
npx wrangler d1 execute creative-agent-db --remote --file=cloudflare/schema.sql
```

---

## Config Files

### `cloudflare/wrangler.jsonc`

Key settings:
```jsonc
{
  "name": "creative-agent",
  "main": "src/index.ts",
  "compatibility_date": "2026-01-01",
  "compatibility_flags": ["nodejs_compat"],    // Required for local-ai-runner.ts
  "placement": { "region": "aws:us-east-1" }, // Near Anthropic API (avoids geo-blocked IPs)
  "assets": {
    "directory": "../client/dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application"
  },
  "d1_databases": [{ "binding": "DB", "database_name": "creative-agent-db" }],
  "r2_buckets": [{ "binding": "R2_BUCKET", "bucket_name": "creative-agent-assets" }],
  "durable_objects": {
    "bindings": [
      { "name": "CAMPAIGN_SESSION", "class_name": "CampaignSession" },
      { "name": "SANDBOX", "class_name": "Sandbox" }  // Container binding
    ]
  },
  "containers": [{
    "class_name": "Sandbox",       // Matches DO binding, NOT CampaignSession
    "image": "./sandbox/Dockerfile",
    "instance_type": "standard-2",
    "max_instances": 50
  }],
  "observability": { "enabled": true },  // Enables container logs in dashboard
  "env": {
    "dev": { "vars": { "AI_BACKEND": "local" } }  // wrangler dev --env dev
  }
}
```

### Client `.env`

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

### Server `.env` (local dev only)

```
ANTHROPIC_API_KEY=sk-ant-xxx
FAL_KEY=fal-xxx
CLERK_SECRET_KEY=sk_test_xxx
```

---

## Gotchas

### Docker

- **Always prune before deploy:** `docker builder prune -af` — cached layers prevent image updates
- **Keychain conflict:** If `wrangler deploy` fails with "error saving credentials...already exists in keychain", run `docker logout registry.cloudflare.com` first
- **Instance type changes need rollout:** Takes 2-3 min. Check with `wrangler containers info`

### Durable Objects

- **Each deploy resets active DOs** — all in-memory state lost. Don't deploy during generation
- **Secrets need redeploy** — `wrangler secret put` doesn't affect running DOs
- **Frequent deploys cascade resets** — each deploy kills active generations

### Wrangler

- **`wrangler tail` buffers long handlers** — DO console.log only visible when handler returns. Use WS messages for real-time debug
- **`wrangler tail` "Ok" ≠ HTTP 200** — "Ok" means no uncaught exception. A 401 still shows "Ok"

### Container

- **`placement.region` doesn't control containers** — `placement.region: "aws:us-east-1"` in wrangler.jsonc only controls Worker placement. `getSandbox()` has no `locationHint`. Container placement is determined by Cloudflare internally. Reported to Cloudflare Discord
- **Dashboard shows wrong region** — Dashboard may show HK but outbound IPs are US (Cloudflare 104.28.x.x)
- **Anthropic blocks some container IPs** — `104.28.157.x` consistently blocked. Pre-flight retry handles this (max 3 attempts)

---

## Rollback

If a deploy breaks things:

1. **Worker code:** `wrangler rollback` (reverts to previous version)
2. **Container image:** No built-in rollback. Redeploy from a previous commit
3. **D1 schema:** Manual — write reverse migration SQL

---

## See Also

- [Debugging](./DEBUGGING.md) — Inspect production state
- [Known Issues](./KNOWN_ISSUES.md) — Current gaps
- [Cloudflare Overview](../cloudflare/CLOUDFLARE_OVERVIEW.md) — Production architecture
