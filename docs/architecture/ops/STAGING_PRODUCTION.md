# Staging vs Production

> Part of [Architecture Documentation](../INDEX.md) | **Sources:** `cloudflare/wrangler.jsonc`, `client/.env.staging`, `client/.env.production`, `cloudflare/src/env.d.ts`

---

## What this covers

Every resource that differs between local dev, staging, and production — Workers, D1, R2, Dodo Payments, Clerk, DNS, secrets. This is the single-source-of-truth reference for "what's on staging vs production right now."

Scope:

- **Local dev** (`wrangler dev --env dev` OR Express at `localhost:3001`) — no billing, no Clerk required, local SQLite
- **Staging** (`creative-agent-staging.alphasapien17.workers.dev`) — Clerk test keys, Dodo test mode, live D1/R2 but staging-only buckets
- **Production** (`creativemachines.xyz`) — Clerk live keys, Dodo live mode, separate D1/R2 buckets

---

## Three environments at a glance

| | Local dev | Staging | Production |
|---|---|---|---|
| Worker name | — | `creative-agent-staging` | `creative-agent-production` |
| URL | `localhost:5173` / `localhost:3001` | `creative-agent-staging.alphasapien17.workers.dev` | `creativemachines.xyz` |
| Deploy command | n/a | `wrangler deploy --env staging` | `wrangler deploy --env production` |
| Client build | `vite dev` | `npm run build:staging` | `npm run build:production` |
| AI backend | Express + in-process SDK **OR** `AI_BACKEND=local` worker | Sandbox containers | Sandbox containers |
| Clerk | Optional (test key) or disabled | **pk_test** (`well-bug-49.clerk.accounts.dev`) | **pk_live** (`clerk.creativemachines.xyz`) |
| D1 database | Local SQLite (`server/`) | `creative-agent-db` | `creative-agent-db-prod` |
| R2 bucket | — | `creative-agent-assets` | `creative-agent-assets-prod` |
| Dodo API base | — | `https://test.dodopayments.com` | `https://live.dodopayments.com` |
| Billing enforced | No | Yes (test mode — no real money) | Yes (live money) |
| Webhook URL | — | `https://creative-agent-staging.alphasapien17.workers.dev/webhooks/dodo` | `https://creativemachines.xyz/webhooks/dodo` |

---

## Full resource matrix

### Workers

`wrangler.jsonc` defines a base config and two named environments. Each environment overrides the base. `env.dev` is for `wrangler dev --env dev` and sets `AI_BACKEND=local` to bypass sandbox containers.

| Config | Value | Source |
|---|---|---|
| Base Worker name | `creative-agent` | `wrangler.jsonc:2` |
| Staging Worker name | `creative-agent-staging` | `wrangler.jsonc:93` |
| Production Worker name | `creative-agent-production` | `wrangler.jsonc:134` |
| Placement region | `aws:us-east-1` | `wrangler.jsonc:8-10` (shared — all envs) |
| Instance type | `standard-2` (1 vCPU, 6 GiB RAM) | `wrangler.jsonc:33` |
| Max containers | 50 | `wrangler.jsonc:34` |
| Compatibility date | `2026-01-01` | `wrangler.jsonc:4` |
| nodejs_compat flag | Yes | `wrangler.jsonc:5` |

**Placement note:** `aws:us-east-1` controls Worker placement only, not container placement. Container placement is determined by Cloudflare internally. Some container IPs (observed: `104.28.157.x`) are blocked by Anthropic — the pre-flight check retries with fresh sandbox IDs, up to 3 attempts. See [SANDBOX_CONTAINER.md](../cloudflare/SANDBOX_CONTAINER.md#pre-flight-ip-check).

### D1 databases

| Env | Binding | database_name | database_id |
|---|---|---|---|
| Base (default) | `DB` | `creative-agent-db` | `ddcd29d7-632c-4017-8f3b-9de6cdd8c5fe` |
| Staging | `DB` | `creative-agent-db` (same as base) | `ddcd29d7-632c-4017-8f3b-9de6cdd8c5fe` |
| Production | `DB` | `creative-agent-db-prod` | `8128f3b2-e5ba-4375-a601-825d400b259d` |

**Key fact:** staging and production use **different databases**. Audits that claim they share are wrong — verified 2026-04-22 against wrangler.jsonc lines 17, 107, 154.

**Querying:**

```bash
# Staging
npx wrangler d1 execute creative-agent-db --remote --command="SELECT COUNT(*) FROM campaigns"

# Production
npx wrangler d1 execute creative-agent-db-prod --remote --command="SELECT COUNT(*) FROM campaigns"
```

**Spot-check which env you're talking to:** the first 8 chars of the `database_id` above are unique per env. `ddcd…` = staging, `8128…` = production.

### R2 buckets

| Env | Binding | bucket_name | FUSE prefix |
|---|---|---|---|
| Base (default) | `R2_BUCKET` | `creative-agent-assets` | `users/{userId}/` |
| Staging | `R2_BUCKET` | `creative-agent-assets` | `users/{userId}/` |
| Production | `R2_BUCKET` | `creative-agent-assets-prod` | `users/{userId}/` |

The `R2_BUCKET_NAME` var is also set per-env (`wrangler.jsonc:95, 136`) and consumed by `setupSandbox` to pass the bucket name to `sandbox.mountBucket` — this is needed because the Workers R2 binding object doesn't expose the underlying bucket name.

### Dodo Payments

All Dodo config is per-env. Product IDs do NOT overlap — each env has its own set of 5 products in Dodo's dashboard.

| Var | Staging | Production |
|---|---|---|
| `DODO_API_BASE` | `https://test.dodopayments.com` | `https://live.dodopayments.com` |
| `DODO_PRODUCT_STARTER_MONTHLY` | `pdt_0NcsitvWGHrNBkCZWZI3m` | `pdt_0NcxwISVKTx572eztKlLT` |
| `DODO_PRODUCT_STARTER_YEARLY` | `pdt_0NcsjiTK1Y8BE0vVf2CIK` | `pdt_0NcxwZjWBP5aeJezb1WpP` |
| `DODO_PRODUCT_PRO_MONTHLY` | `pdt_0Ncsk05kzD4TfbTVmH21i` | `pdt_0NcxwnBLoDLwoVPoUemuO` |
| `DODO_PRODUCT_PRO_YEARLY` | `pdt_0NcskEvBnUSeKaFX9MbQd` | `pdt_0NcxwyBtWyrTPbuOZlyWD` |
| `DODO_PRODUCT_TOPUP` | `pdt_0NcskiE2H7xCcT7vIIkJQ` | `pdt_0NcxxG1S8Zdnr9WSJkR3c` |

Source: `wrangler.jsonc:96-101` (staging), `wrangler.jsonc:137-142` (production).

**Staging product IDs start with `pdt_0Ncs…`, production with `pdt_0Ncx…`.** If you see a mismatch in logs (e.g. a `pdt_0Ncx…` product being checked out on staging Worker), something is wrong.

**Webhook URLs** (configured in Dodo dashboard, not wrangler):

| Env | Webhook URL |
|---|---|
| Staging | `https://creative-agent-staging.alphasapien17.workers.dev/webhooks/dodo` |
| Production | `https://creativemachines.xyz/webhooks/dodo` |

**Secrets** (same var name, different values per env):

| Secret | Format | Notes |
|---|---|---|
| `DODO_PAYMENTS_API_KEY` | Bearer token | Test key ≠ live key. Test key gives 401 against live API and vice versa. |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | `whsec_<base64>` | Different per env. Used for HMAC-SHA256 signature verification on incoming webhooks. |

See [BILLING.md](../shared/BILLING.md#environment-configuration) for the full billing config.

### Clerk

| Env | Publishable key | Instance domain | JWKS endpoint |
|---|---|---|---|
| Staging | `pk_test_d2VsbC1idWctNDkuY2xlcmsuYWNjb3VudHMuZGV2JA` | `well-bug-49.clerk.accounts.dev` | `https://well-bug-49.clerk.accounts.dev/.well-known/jwks.json` |
| Production | `pk_live_Y2xlcmsuY3JlYXRpdmVtYWNoaW5lcy54eXok` | `clerk.creativemachines.xyz` | `https://clerk.creativemachines.xyz/.well-known/jwks.json` |

The publishable key is base64-encoded. Decoding reveals the instance domain:

```bash
# pk_live_{base64} → clerk.creativemachines.xyz$
echo "Y2xlcmsuY3JlYXRpdmVtYWNoaW5lcy54eXok" | base64 -d
# clerk.creativemachines.xyz$
```

**Client consumes** `VITE_CLERK_PUBLISHABLE_KEY` at build time from `client/.env.staging` or `client/.env.production` (vite `--mode` flag selects which). Baked into the static bundle.

**Worker consumes** `CLERK_SECRET_KEY` at runtime from wrangler secrets. Different value per env. The Worker doesn't care about the publishable key; it only verifies JWTs via JWKS fetch from the issuer embedded in each token.

**Production-only setup:**

- Custom domain `clerk.creativemachines.xyz` via CNAME in Cloudflare DNS
- Production Clerk app (separate from development) configured with:
  - Google OAuth production credentials
  - Custom email sender (SMTP or Clerk default)
  - Allowed origins: `creativemachines.xyz`
  - Redirect URLs: `https://creativemachines.xyz/*`

See [AUTH_FLOW.md](../shared/AUTH_FLOW.md) for the auth request lifecycle.

### Routes / custom domain

Only production has a custom domain. Staging uses Cloudflare's `workers.dev` subdomain.

```jsonc
// wrangler.jsonc:144-149 (production)
"routes": [
  {
    "pattern": "creativemachines.xyz/*",
    "zone_name": "creativemachines.xyz"
  }
]
```

DNS for `creativemachines.xyz`:

| Record | Type | Target | Purpose |
|---|---|---|---|
| `creativemachines.xyz` | Worker Route | — | Handled by `routes` above |
| `clerk.creativemachines.xyz` | CNAME | Clerk-provided | Clerk Frontend API |
| `accounts.creativemachines.xyz` | CNAME | Clerk-provided (optional) | Account portal |
| `clerk-accounts.creativemachines.xyz` | CNAME | Clerk-provided (optional) | Account portal |

DNS is managed in Cloudflare dashboard. Not in wrangler.jsonc.

---

## Secrets

All secrets set via `wrangler secret put`. Always `tr -d '\n'` or `echo -n` to avoid trailing newlines.

### Per-env secrets (different value in staging vs production)

```bash
# Staging (--env staging)
echo -n "sk-ant-xxx-staging"  | npx wrangler secret put ANTHROPIC_API_KEY --env staging
echo -n "fal-xxx"             | npx wrangler secret put FAL_KEY --env staging
echo -n "sk_test_clerk_xxx"   | npx wrangler secret put CLERK_SECRET_KEY --env staging
echo -n "r2-access-key-id"    | npx wrangler secret put R2_ACCESS_KEY_ID --env staging
echo -n "r2-secret-access"    | npx wrangler secret put R2_SECRET_ACCESS_KEY --env staging
echo -n "cf-account-id"       | npx wrangler secret put CF_ACCOUNT_ID --env staging
echo -n "test_dodo_api_key"   | npx wrangler secret put DODO_PAYMENTS_API_KEY --env staging
echo -n "whsec_test_xxx"      | npx wrangler secret put DODO_PAYMENTS_WEBHOOK_SECRET --env staging

# Production (--env production) — same secret names, different values
echo -n "sk_live_clerk_xxx"   | npx wrangler secret put CLERK_SECRET_KEY --env production
echo -n "live_dodo_api_key"   | npx wrangler secret put DODO_PAYMENTS_API_KEY --env production
echo -n "whsec_live_xxx"      | npx wrangler secret put DODO_PAYMENTS_WEBHOOK_SECRET --env production
# (other secrets can be shared — below)
```

### Conceptually-shared secrets

Technically each env has its own copy (wrangler requires `--env`), but they usually carry the same value:

- `ANTHROPIC_API_KEY` — same key across envs (just usage-tracked by Anthropic)
- `FAL_KEY` — same key (fal.ai usage)
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` — same access keys, but they grant access to both buckets (staging + prod); scoped at the account level
- `CF_ACCOUNT_ID` — same Cloudflare account

### What breaks if a secret is wrong

| Secret | Wrong value symptom |
|---|---|
| `ANTHROPIC_API_KEY` | Pre-flight check fails (401) → setup fails after 3 retries → "Setup failed" |
| `FAL_KEY` | nano-banana tool fails mid-generation → agent keeps trying, eventually fatal error |
| `CLERK_SECRET_KEY` | All auth fails (401 on every API/WS call) |
| `R2_*` creds | FUSE mount fails → setup fails |
| `CF_ACCOUNT_ID` | FUSE mount fails (can't resolve R2 endpoint URL) |
| `DODO_PAYMENTS_API_KEY` | Checkout creation fails → user gets 500 on "Get Started" button |
| `DODO_PAYMENTS_WEBHOOK_SECRET` | Webhook signature verification fails → credits never grant |

### `CF_ACCOUNT_ID` gotcha

`env.d.ts:27` comments `CF_ACCOUNT_ID` as "set in wrangler.jsonc" — but it's actually set via `wrangler secret put` (there's no `CF_ACCOUNT_ID` var in wrangler.jsonc). Don't trust the comment.

### Secrets propagate on deploy

`wrangler secret put` alone does NOT update running DOs. Must re-deploy (or wait for the next natural DO reset) for a secret change to take effect.

---

## Deploy commands

### Staging

```bash
cd client && npm run build:staging && \
docker logout registry.cloudflare.com; \
docker builder prune -af; \
cd ../cloudflare && npx wrangler deploy --env staging
```

What each step does:

1. `npm run build:staging` — vite build with `--mode staging`. Loads `client/.env.staging` → embeds `pk_test_…` Clerk key + API base URL into the static bundle
2. `docker logout registry.cloudflare.com` — prevents keychain conflict
3. `docker builder prune -af` — **required** — cached layers cause wrangler to skip pushing the container image
4. `wrangler deploy --env staging` — picks up `env.staging` block from wrangler.jsonc; deploys Worker code + static assets + container image to `creative-agent-staging.alphasapien17.workers.dev`

### Production

Same pattern:

```bash
cd client && npm run build:production && \
docker logout registry.cloudflare.com; \
docker builder prune -af; \
cd ../cloudflare && npx wrangler deploy --env production
```

`npm run build:production` loads `client/.env.production` → embeds `pk_live_…` Clerk key. `wrangler deploy --env production` deploys to `creativemachines.xyz`.

### Dev (hybrid — local Worker against real D1/R2)

```bash
cd cloudflare && npx wrangler dev --env dev
```

`env.dev` sets `AI_BACKEND=local` which routes generation through `local-ai-runner.ts` (in-process SDK) instead of spawning sandboxes. Uses the default D1 + R2 bindings (staging DB/bucket — be careful).

### Local dev (Express + SQLite)

Full local stack, no Cloudflare at all:

```bash
cd server && npm run dev   # Express on :3001
cd client && npm run dev   # Vite on :5173 (proxies /api + /ws → :3001)
```

Uses `server/.env` (separate from wrangler secrets). No billing. Own local SQLite in `server/data.db`.

### What gets deployed

| Component | Source | Destination |
|---|---|---|
| Worker code | `cloudflare/src/**` | Cloudflare Worker |
| Static assets | `client/dist/` | Workers Static Assets |
| Container image | `cloudflare/sandbox/Dockerfile` | Cloudflare container registry |
| D1 schema | `cloudflare/schema.sql` | **Manual — not auto-deployed** |

### D1 schema migration

Schema changes are NOT part of `wrangler deploy`. Apply manually per env:

```bash
# Staging
npx wrangler d1 execute creative-agent-db --remote --file=cloudflare/schema.sql

# Production
npx wrangler d1 execute creative-agent-db-prod --remote --file=cloudflare/schema.sql
```

For destructive changes (DROP, ALTER), write reverse migrations first. No rollback tool.

### Two-phase rollout

Each deploy has two phases, each ~1–2 minutes:

1. **Worker code + static assets** — fast, updates within seconds
2. **Container image push** — takes ~2 minutes longer

Each phase triggers a DO reset. Do NOT deploy during active generations — all in-memory state is lost. Users mid-generation will see zombie-recovery friendly error on next interaction.

Check container rollout status:

```bash
npx wrangler containers info creative-agent-staging     # or -production
```

---

## Which env am I talking to?

Running a query and unsure which DB got hit? Five ways to check:

### 1. wrangler output header

Every `wrangler deploy --env X` prints the env at the top. Every `wrangler d1 execute NAME` hits the DB named `NAME`.

### 2. D1 ID spot-check

Staging `database_id` starts with `ddcd…`. Production starts with `8128…`. `wrangler d1 info creative-agent-db` / `creative-agent-db-prod` confirms.

### 3. Worker env indicator

Query any endpoint — the URL tells you:

```bash
curl -s https://creative-agent-staging.alphasapien17.workers.dev/health   # staging
curl -s https://creativemachines.xyz/health                               # production
```

### 4. R2 bucket name

`creative-agent-assets` = staging. `creative-agent-assets-prod` = production. `wrangler r2 object list BUCKET` confirms.

### 5. Dodo product ID spot-check

A product ID starting `pdt_0Ncs…` = test-mode (staging). Starting `pdt_0Ncx…` = live-mode (production). See the full table above.

---

## Disciplines

1. **Never hit a production endpoint with test-mode Dodo keys or vice versa.** Dodo will return 401; UX looks like "checkout failed for unknown reason."
2. **Deploy staging first, verify, then production.** Staging has the same codebase and container — bugs surface there first.
3. **Don't run destructive D1 queries against production without a backup or reverse migration ready.** No rollback tool.
4. **Update both env.staging and env.production secrets when rotating shared-value secrets.** Wrangler requires `--env` per set.
5. **Client `.env.production` is committed.** Only the publishable key lives there. Never commit a secret key.
6. **Test Clerk flows in an incognito window after Clerk rotation** — Clerk caches JWT issuer in localStorage; stale tokens fail silently.
7. **Webhook URL changes require Dodo dashboard edit.** Not in wrangler. If you rename a Worker, update Dodo dashboard webhook URL too.
8. **Treat staging as a real environment.** Users can sign up on staging (via Clerk dev instance), buy test credits (via Dodo test mode). Don't reset the D1 casually.

---

## Rollout gotchas

- **Frequent deploys cascade DO resets.** Each deploy kills any active generation. Schedule deploys during low-traffic windows.
- **`wrangler tail --env X`** is env-scoped. Remember the flag.
- **Container image propagation is eventually-consistent.** You may see "deploy complete" but old containers still serve for ~1 minute. Check `wrangler containers info` for image version.
- **Clerk key rotation requires a client rebuild** — `pk_*` is baked in at build time. Don't expect a secret-only rotation to work for the publishable key.
- **Dashboard shows wrong container region sometimes** — displays HK but outbound IPs are US (Cloudflare `104.28.x.x`). Reported to Cloudflare.
- **`CF_ACCOUNT_ID` is NOT in wrangler.jsonc vars.** It's set via `wrangler secret put`. The env.d.ts comment is outdated.
- **A `wrangler secret put` without `--env` sets the BASE config secret.** This usually shadows nothing (neither env inherits base secrets reliably — test-verify before assuming).

---

## Onboarding a new environment

If you ever need a third environment (e.g., `preview` for PR demos):

1. Add `env.preview` block to wrangler.jsonc — copy `env.staging`, change `name`, `database_name`, `database_id`, `bucket_name`, Dodo product IDs (create new preview products in Dodo dashboard)
2. Create new D1: `wrangler d1 create creative-agent-db-preview` → copy the new ID into wrangler.jsonc
3. Create new R2: `wrangler r2 bucket create creative-agent-assets-preview`
4. Add `client/.env.preview` with a Clerk preview instance pk_test
5. Add `npm run build:preview` script in `client/package.json`
6. Set all secrets with `--env preview`
7. Deploy: `wrangler deploy --env preview`
8. Update THIS doc with the new env's entry in every matrix

Not currently done — single-branch deploy is fine for the team size.

---

## See Also

- [Deployment](./DEPLOYMENT.md) — focused deploy runbook, per-env commands
- [Auth Flow](../shared/AUTH_FLOW.md) — Clerk lifecycle, JWKS fetching
- [Billing](../shared/BILLING.md) — Dodo checkout/webhooks, full two-pool model
- [Sandbox Container](../cloudflare/SANDBOX_CONTAINER.md) — container spec (identical across envs)
- [Known Issues](./KNOWN_ISSUES.md) — per-env gotchas (IP blocks, cold start, etc.)
