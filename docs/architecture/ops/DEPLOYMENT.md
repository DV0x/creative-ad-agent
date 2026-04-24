# Deployment

> Part of [Architecture Documentation](../INDEX.md) | Deploy runbook for staging + production | **Source:** `cloudflare/wrangler.jsonc`, `client/package.json`

For the full per-env resource matrix (Workers, D1, R2, Dodo, Clerk, DNS), see [STAGING_PRODUCTION.md](./STAGING_PRODUCTION.md). This doc is the focused deploy runbook.

---

## Prerequisites

- Cloudflare account with Workers, D1, R2, Containers enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- Docker installed and running
- Dodo Payments account with test + live keys
- Clerk account with test + production instances
- fal.ai account with API key

---

## Deploy commands (per env)

### Staging

```bash
cd client && npm run build:staging && \
docker logout registry.cloudflare.com; \
docker builder prune -af; \
cd ../cloudflare && npx wrangler deploy --env staging
```

URL: `https://creative-agent-staging.alphasapien17.workers.dev`

### Production

```bash
cd client && npm run build:production && \
docker logout registry.cloudflare.com; \
docker builder prune -af; \
cd ../cloudflare && npx wrangler deploy --env production
```

URL: `https://creativemachines.xyz`

### Why each step

| Step | Why |
|---|---|
| `npm run build:{staging,production}` | Vite build with `--mode {env}` — loads `client/.env.{env}` to bake the correct Clerk publishable key into the bundle. `build` (no suffix) uses `.env` + defaults — don't use it for production deploys. |
| `docker logout registry.cloudflare.com` | Prevents "already exists in keychain" errors |
| `docker builder prune -af` | **Required.** Cached layers make wrangler skip the image push; container code won't actually deploy. |
| `npx wrangler deploy --env {env}` | `--env` picks up the right block from `wrangler.jsonc`. Without it, wrangler uses the base config only (no staging/production overrides). |

### Forgetting `--env` is silent

Running `wrangler deploy` with no `--env` deploys to the base config — which has no Worker `name` override, no custom domain, and shared D1/R2 bindings. You'll probably see something land on the base Worker URL, but it's rarely what you wanted. **Always pass `--env`.**

---

## Two propagation phases

Each deploy has two phases, each ~1–2 minutes:

1. **Worker code + static assets** — fast, updates within seconds
2. **Container image push** — takes ~2 minutes longer

Each phase triggers a DO reset. Don't deploy during active generations — all in-memory state is lost. Mid-generation users get zombie-recovery friendly error on next interaction.

Check container status:

```bash
npx wrangler containers info creative-agent-staging     # or -production
```

---

## Secrets

All secrets are set via `wrangler secret put --env {env}`. **Always `tr -d '\n'` or `echo -n`** to avoid trailing newlines — this has burned multiple sessions.

### Required per env

```bash
# --- Staging ---
echo -n "sk-ant-xxx"           | npx wrangler secret put ANTHROPIC_API_KEY --env staging
echo -n "fal-xxx"              | npx wrangler secret put FAL_KEY --env staging
echo -n "sk_test_clerk_xxx"    | npx wrangler secret put CLERK_SECRET_KEY --env staging
echo -n "r2-access-key-id"     | npx wrangler secret put R2_ACCESS_KEY_ID --env staging
echo -n "r2-secret-access-key" | npx wrangler secret put R2_SECRET_ACCESS_KEY --env staging
echo -n "cf-account-id"        | npx wrangler secret put CF_ACCOUNT_ID --env staging
echo -n "test_dodo_api_key"    | npx wrangler secret put DODO_PAYMENTS_API_KEY --env staging
echo -n "whsec_test_xxx"       | npx wrangler secret put DODO_PAYMENTS_WEBHOOK_SECRET --env staging

# --- Production (same secret names, different values) ---
echo -n "sk_live_clerk_xxx"    | npx wrangler secret put CLERK_SECRET_KEY --env production
echo -n "live_dodo_api_key"    | npx wrangler secret put DODO_PAYMENTS_API_KEY --env production
echo -n "whsec_live_xxx"       | npx wrangler secret put DODO_PAYMENTS_WEBHOOK_SECRET --env production
# ANTHROPIC_API_KEY / FAL_KEY / R2 creds / CF_ACCOUNT_ID may be the same value,
# but must still be set with --env production because wrangler scopes secrets per env.
```

### Secret effects take a redeploy

`wrangler secret put` does NOT update running DOs. Re-deploy the env (or wait for the next natural DO reset) for changes to take effect.

### `CF_ACCOUNT_ID` comment in env.d.ts is wrong

`cloudflare/src/env.d.ts:27` comments `CF_ACCOUNT_ID` as "set in wrangler.jsonc" — it's actually a wrangler secret. Don't trust the comment. If you see FUSE mount failures after a fresh env setup, this is the first thing to check.

### Per-env vs shared values

See [STAGING_PRODUCTION.md → Secrets](./STAGING_PRODUCTION.md#secrets) for which secrets typically carry the same value across envs and which must always differ.

---

## Client `.env` files

The client is a Vite SPA. Publishable Clerk keys are baked into the static bundle at build time. Keys are mode-specific:

| File | When used | Value |
|---|---|---|
| `client/.env` | `vite dev` default | Clerk test key (dev-mode convenience) |
| `client/.env.staging` | `npm run build:staging` | Clerk test key (same as dev — `well-bug-49.clerk.accounts.dev`) |
| `client/.env.production` | `npm run build:production` | Clerk **live** key (`clerk.creativemachines.xyz`) |

Running `npm run build` with no env suffix uses the default `.env` — not appropriate for production. Enforced by the deploy recipes above.

---

## Server `.env` (local dev only)

Used by `server/sdk-server.ts` — has no effect on Cloudflare deploy:

```
ANTHROPIC_API_KEY=sk-ant-xxx
FAL_KEY=fal-xxx
CLERK_SECRET_KEY=sk_test_xxx
```

---

## What gets deployed

| Component | Source | Destination |
|---|---|---|
| Worker code | `cloudflare/src/**` | Cloudflare Worker (per-env name) |
| Static assets | `client/dist/` | Workers Static Assets |
| Container image | `cloudflare/sandbox/Dockerfile` | Container registry |
| D1 schema | `cloudflare/schema.sql` | **Manual — not auto-deployed** |

### D1 schema changes

Schema is NOT auto-applied. Run manually per env:

```bash
# Staging
npx wrangler d1 execute creative-agent-db --remote --file=cloudflare/schema.sql

# Production
npx wrangler d1 execute creative-agent-db-prod --remote --file=cloudflare/schema.sql
```

Schema is `CREATE TABLE IF NOT EXISTS` throughout — safe to re-run. For destructive changes, write reverse migrations first.

---

## Config files quick reference

### `cloudflare/wrangler.jsonc`

Top-level keys: `name`, `main`, `compatibility_date`, `placement`, `d1_databases`, `r2_buckets`, `containers`, `durable_objects`, `migrations`, `assets`, `observability`, `env`.

Env blocks (`env.staging`, `env.production`) override the top-level for everything declared under them. See [STAGING_PRODUCTION.md → Full resource matrix](./STAGING_PRODUCTION.md#full-resource-matrix) for value-by-value comparison.

### `client/package.json` scripts

```json
"build:staging":    "tsc -b && vite build --mode staging"
"build:production": "tsc -b && vite build --mode production"
```

Vite `--mode` picks the `.env.{mode}` file.

---

## Gotchas

### Docker

- **Always prune before deploy:** `docker builder prune -af` — cached layers prevent image updates. Without this, Worker code deploys but the container you actually run is stale.
- **Keychain conflict:** if `wrangler deploy` fails with "already exists in keychain", run `docker logout registry.cloudflare.com` first.
- **Instance type / spec changes need full rollout.** Takes 2–3 min. Check `wrangler containers info`.

### Durable Objects

- **Each deploy resets active DOs** — all in-memory state lost. Don't deploy during generation.
- **Secrets require redeploy** — `wrangler secret put` alone doesn't affect running DOs.
- **Frequent deploys cascade resets** — each one kills active generations. Users see "Reconnected! Looks like things got interrupted" zombie error.

### Wrangler

- **`wrangler tail` buffers long handlers** — DO `console.log` only appears when the handler returns. Use structured trace logs + alarm flushing instead for live generation debugging.
- **`wrangler tail` "Ok" ≠ HTTP 200** — "Ok" means no uncaught exception. A 401 response still logs as "Ok".
- **`wrangler tail --env {env}` is required** to scope to the right env. Easy to forget.
- **`wrangler deploy` without `--env` uses the base config** — not staging or production. Always pass `--env`.

### Container

- **`placement.region` doesn't control containers.** `aws:us-east-1` only controls Worker placement. `getSandbox()` has no `locationHint`. Container placement is Cloudflare-internal. Reported to Cloudflare Discord.
- **Dashboard shows wrong region.** May show HK but outbound IPs are US Cloudflare (`104.28.x.x`).
- **Some container IPs are Anthropic-blocked.** `104.28.157.x` consistently blocked. Pre-flight retry handles this (max 3 attempts, each with fresh sandbox ID). See [SANDBOX_CONTAINER.md](../cloudflare/SANDBOX_CONTAINER.md#pre-flight-ip-check).

### Clerk

- **`pk_*` is baked into the client bundle at build time.** A Clerk key rotation for the publishable key needs a client rebuild — secret rotation alone won't update existing clients.
- **Incognito-window test after rotation.** Clerk caches the JWT issuer; stale tokens fail silently.

### Dodo

- **Webhook URLs live in Dodo dashboard, not wrangler.** If you rename a Worker, update the Dodo webhook URL.
- **Test vs live keys are non-interchangeable.** Test key returns 401 against `live.dodopayments.com` and vice versa. Checkout creation fails with a generic error.

---

## Rollback

### Worker code

```bash
npx wrangler rollback --env {env}
```

Reverts to the previous version.

### Container image

No built-in rollback. Re-deploy from a previous commit:

```bash
git checkout <prev-sha>
# run the deploy recipe for the target env
```

### D1 schema

Manual — write reverse migration SQL and apply with `wrangler d1 execute`.

### Clerk keys

Rotate in Clerk dashboard → update secret via `wrangler secret put --env {env}` → redeploy.

### Dodo keys

Rotate in Dodo dashboard → update secret via `wrangler secret put --env {env}` → redeploy. Webhook secret change requires simultaneous Dodo dashboard update (same value both places).

---

## Post-deploy checks

```bash
# Health endpoint
curl -s https://creative-agent-staging.alphasapien17.workers.dev/health | python3 -m json.tool
curl -s https://creativemachines.xyz/health | python3 -m json.tool

# Container status
npx wrangler containers info creative-agent-staging
npx wrangler containers info creative-agent-production

# Live tail
npx wrangler tail --env staging
npx wrangler tail --env production

# D1 row counts
npx wrangler d1 execute creative-agent-db --remote --command="SELECT COUNT(*) FROM campaigns"
npx wrangler d1 execute creative-agent-db-prod --remote --command="SELECT COUNT(*) FROM campaigns"
```

---

## See Also

- [Staging vs Production](./STAGING_PRODUCTION.md) — full env matrix, which-env-am-I-in checks
- [Debugging](./DEBUGGING.md) — inspect production state
- [Known Issues](./KNOWN_ISSUES.md) — current gaps
- [Cloudflare Overview](../cloudflare/CLOUDFLARE_OVERVIEW.md) — production architecture
- [Billing](../shared/BILLING.md) — Dodo secrets + webhook verification
