# Session 57 — Staging + Production Environments, Clerk Production, Google OAuth

**Date:** 2026-03-23
**Branch:** `new-ui`
**Deployed:** Both environments live

---

## What Was Done

### 1. Domain Setup (creativemachines.xyz)
- Unsuspended domain on Namecheap (ICANN contact verification)
- Added `creativemachines.xyz` to Cloudflare (Free plan)
- Updated nameservers in Namecheap → `arnold.ns.cloudflare.com`, `bella.ns.cloudflare.com`
- Zone ID: `8e8f9530bbfe8e01c375ccaf58f88b4e`

### 2. DNS Records Added (6 CNAME records)
| Name | Target | Proxy |
|------|--------|-------|
| `app` | `creative-agent-production.alphasapien17.workers.dev` | Proxied |
| `clerk` | `frontend-api.clerk.services` | DNS only |
| `accounts` | `accounts.clerk.services` | DNS only |
| `clkmail` | `mail.myxsdb0wwo6l.clerk.services` | DNS only |
| `clk._domainkey` | `dkim1.myxsdb0wwo6l.clerk.services` | DNS only |
| `clk2._domainkey` | `dkim2.myxsdb0wwo6l.clerk.services` | DNS only |

### 3. Staging + Production Environments
- Created `creative-agent-db-prod` D1 database (ID: `8128f3b2-e5ba-4375-a601-825d400b259d`)
- Created `creative-agent-assets-prod` R2 bucket
- Applied schema.sql to production D1
- Updated `wrangler.jsonc` with `env.staging` and `env.production` blocks
- Both `durable_objects` and `containers` added to each env (NOT inherited by wrangler environments)
- Added `R2_BUCKET_NAME` var per environment (staging: `creative-agent-assets`, production: `creative-agent-assets-prod`)
- Created `client/.env.staging` and `client/.env.production` with respective Clerk publishable keys
- Added `build:staging` and `build:production` npm scripts to client package.json

| | Staging | Production |
|---|---|---|
| **URL** | `creative-agent-staging.alphasapien17.workers.dev` | `app.creativemachines.xyz` |
| **D1** | `creative-agent-db` (existing, 38 campaigns) | `creative-agent-db-prod` (fresh) |
| **R2** | `creative-agent-assets` | `creative-agent-assets-prod` |
| **Clerk** | Test keys (`pk_test_*`, `sk_test_*`) | Live keys (`pk_live_*`, `sk_live_*`) |
| **Worker** | `creative-agent-staging` | `creative-agent-production` |
| **Container** | `creative-agent-staging-sandbox-staging` | `creative-agent-production-sandbox-production` |

### 4. Clerk Production Instance
- Updated Clerk domain from `alphasapien17.workers.dev` to `creativemachines.xyz` via API: `PATCH /v1/domains/{id}`
- DNS verified (green badge), SSL certificates issued
- Home URL set to `app.creativemachines.xyz` (Clerk Paths page)
- Redirect URL added: `https://app.creativemachines.xyz`
- Publishable key: `pk_live_<REDACTED>` (see Clerk dashboard → API Keys)
- Secret key: `sk_live_<REDACTED>` (see Clerk dashboard → API Keys; stored in wrangler secrets as `CLERK_SECRET_KEY` for production env)

### 5. Google OAuth (Production)
- Created Google Cloud project "Creative Machines"
- Configured OAuth consent screen (External, published to production)
- Created OAuth client ID: `878825906631-krgh3ho5ci3sp221oklr7k44obf983b9.apps.googleusercontent.com`
- Client secret: `GOCSPX-<REDACTED>` (stored in Clerk SSO connections → Google OAuth; also in Google Cloud Console → OAuth client)
- Authorized redirect URI: `https://clerk.creativemachines.xyz/v1/oauth_callback`
- Google app published (not in testing mode) — any Google user can sign in
- Credentials saved in Clerk SSO connections → Google OAuth

### 6. Secrets Set (per environment)
Both environments have:
- `CLERK_SECRET_KEY` — test key for staging, live key for production
- `ANTHROPIC_API_KEY` — same for both
- `FAL_KEY` — same for both
- `CF_ACCOUNT_ID` — `091650847ca6a1d9bb40bee044dfdc91`
- `R2_ACCESS_KEY_ID` — `151149d93acf201a7a4bd9fa67342b87`
- `R2_SECRET_ACCESS_KEY` — set for both

### 7. Bug Fix: Hardcoded R2 Bucket Name
- **Problem:** `campaign-session.ts` line 1130 hardcoded `mountBucket('creative-agent-assets')` — production bucket `creative-agent-assets-prod` was never mounted
- **Fix:** Changed to `mountBucket(this.env.R2_BUCKET_NAME)`, added `R2_BUCKET_NAME` var per environment, added to `env.d.ts`

---

## Issues Encountered & Resolved

### Clerk redirect to root domain
- **Problem:** After sign-in, Clerk redirected to `creativemachines.xyz` (root) instead of `app.creativemachines.xyz`
- **Fix:** Set Home URL in Clerk Paths to `app.creativemachines.xyz`, added redirect URL via API

### Production container instability after redeployments
- **Problem:** Multiple `wrangler deploy` commands during debugging caused DO resets, which killed in-flight generations
- **Root cause:** Race condition — DO reset happens between `isGenerating=true` (persisted) and `agentProcessId` being saved (happens later after startProcess). On restore, DO has `gen=true` but `agent=null`, enters zombie-waiting mode for 5 minutes
- **Resolution:** Not a code bug — caused by rapid redeployments during active generation. The zombie detection at 5 minutes DOES work, but user cancelled before it fired
- **Prevention:** Don't deploy while generation is running

### Three Workers in dashboard
- `creative-agent` — old default worker (no `--env`), still exists, uses base wrangler config
- `creative-agent-staging` — staging environment
- `creative-agent-production` — production environment
- The old `creative-agent` can be deleted once staging/production are verified stable

---

## Deploy Commands

```bash
# Staging
cd client && npm run build:staging
cd ../cloudflare && docker logout registry.cloudflare.com; docker builder prune -af; npx wrangler deploy --env staging

# Production
cd client && npm run build:production
cd ../cloudflare && docker logout registry.cloudflare.com; docker builder prune -af; npx wrangler deploy --env production
```

---

## Files Changed

| File | Changes |
|------|---------|
| `cloudflare/wrangler.jsonc` | Added `env.staging` and `env.production` with separate D1/R2/DO/containers/vars |
| `cloudflare/src/env.d.ts` | Added `R2_BUCKET_NAME: string` |
| `cloudflare/src/durable-objects/campaign-session.ts` | `mountBucket(this.env.R2_BUCKET_NAME)` instead of hardcoded bucket name |
| `client/.env.staging` | `VITE_CLERK_PUBLISHABLE_KEY=pk_test_...` |
| `client/.env.production` | `VITE_CLERK_PUBLISHABLE_KEY=pk_live_...` |
| `client/package.json` | Added `build:staging` and `build:production` scripts |

---

## Current Status
- **Staging:** Working, verified with full generation
- **Production:** Working (first gen succeeded, images rendered). Slow on cold start (~5 min CLI boot). Needs more testing to confirm stability
- **Pending:** Delete old `creative-agent` worker once production is confirmed stable
- **Pending:** Test production generation timing on warm container (should be faster)
