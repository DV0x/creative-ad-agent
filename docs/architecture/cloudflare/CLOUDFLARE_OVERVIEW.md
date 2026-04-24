# Cloudflare Overview

> Part of [Architecture Documentation](../INDEX.md) | **Directory:** `cloudflare/src/`

---

## How Requests Flow

```
Browser Request
    │
    ▼
Worker (index.ts — 60 lines)
    │
    ├── /ws              → Verify JWT → Durable Object (per-user)
    ├── /webhooks/dodo   → handleDodoWebhook (NO auth — signature-verified)
    ├── /api/*           → Router → Clerk auth → Route handlers → D1
    ├── /images/*        → Router → Clerk auth → R2 image serving
    ├── /health          → Router → Health check (no auth)
    └── /* (fallback)    → env.ASSETS.fetch (React SPA, SPA fallback)
```

### Worker Entry (`cloudflare/src/index.ts` — 60 lines)

The Worker is thin. It routes by URL path:

1. **`/ws`** — Verifies JWT via `verifyWebSocketToken()`, extracts userId, creates/gets a DO by `idFromName(userId)` with `locationHint: 'enam'`, forwards the WebSocket upgrade with `X-User-Id` header
2. **`/webhooks/dodo`** (POST) — Unauthenticated Dodo payment webhook; signature is verified inside the handler (see [BILLING.md § Dodo webhook security](../shared/BILLING.md))
3. **`/api/*`, `/images/*`, `/health`** — Delegates to `handleApiRequest()` in the router
4. **Everything else** — `env.ASSETS.fetch(request)` serves the React SPA (static assets with SPA fallback)

### Router (`cloudflare/src/router.ts` — 222 lines)

Pattern-matching sub-router. Handles CORS preflight, authenticates via Clerk JWT, dispatches to route handlers.

**Campaign routes:** `/api/campaigns`, `/api/campaigns/:id`, `/api/campaigns/:id/files/:type`, `/api/campaigns/:id/images`, `/api/campaigns/:id/messages`, `/api/campaigns/:id/status`, `/api/campaigns/:id/recover`

**Asset routes:** `/api/assets/folders`, `/api/assets/folders/:id`, `/api/assets/folders/:id/files`, `/api/assets/upload`, `/api/assets/files/:id`

**Billing routes** (see [BILLING.md](../shared/BILLING.md) for semantics): `/api/credits`, `/api/credits/usage`, `/api/payments/checkout`, `/api/payments/topup`, `/api/payments/subscription`, `/api/payments/portal`

**Analytics:** `/api/events` (client-side download / engagement tracking)

**Image serving:** `/images/{sessionId}/{filename}` — Clerk-authenticated, R2-backed (see [R2_STORAGE.md](./R2_STORAGE.md))

**Health:** `/health` — no auth, returns basic status JSON

---

## Cloudflare Bindings

Defined in `cloudflare/src/env.d.ts` (42 lines):

```typescript
import type { Sandbox } from '@cloudflare/sandbox';

export interface Env {
  // Bindings
  ASSETS: Fetcher                           // Workers Static Assets (React SPA)
  DB: D1Database                            // D1 database (per-env: creative-agent-db | creative-agent-db-prod)
  R2_BUCKET: R2Bucket                       // R2 bucket (per-env binding for Worker-side reads/writes)
  CAMPAIGN_SESSION: DurableObjectNamespace  // Application logic DO (one instance per user)
  SANDBOX: DurableObjectNamespace<Sandbox>  // Container DO (managed by @cloudflare/sandbox)

  // Secrets (set via `wrangler secret put --env {staging|production}`)
  ANTHROPIC_API_KEY: string
  FAL_KEY: string
  CLERK_SECRET_KEY: string
  R2_ACCESS_KEY_ID: string                  // For s3fs FUSE mount in sandbox
  R2_SECRET_ACCESS_KEY: string              // For s3fs FUSE mount in sandbox
  DODO_PAYMENTS_API_KEY: string             // Dodo Payments server-side key
  DODO_PAYMENTS_WEBHOOK_SECRET: string      // Dodo webhook signature verification

  // Vars (set in wrangler.jsonc, per-env)
  CF_ACCOUNT_ID: string                     // Used by FUSE mount for R2 endpoint URL
  R2_BUCKET_NAME: string                    // Per-env bucket name for sandbox.mountBucket()
  DODO_API_BASE: string                     // Dodo API base URL (test vs live)
  DODO_PRODUCT_STARTER_MONTHLY: string      // Plan product IDs — per-env
  DODO_PRODUCT_STARTER_YEARLY: string
  DODO_PRODUCT_PRO_MONTHLY: string
  DODO_PRODUCT_PRO_YEARLY: string
  DODO_PRODUCT_TOPUP: string                // One-time top-up product
  AI_BACKEND?: string                       // "local" for wrangler dev (bypasses sandbox)
}
```

> Secrets have trailing newlines when piped in — always `tr -d '\n'` when setting: `echo -n "$VAL" | wrangler secret put X --env production`. See [STAGING_PRODUCTION.md](../ops/STAGING_PRODUCTION.md) for the full secret inventory.

---

## Key Files

```
cloudflare/src/
├── index.ts ........................ 60 lines  — Worker entry: /ws, /webhooks/dodo, /api, /images, /health, static
├── router.ts ....................... 222 lines — API router, CORS, Clerk auth dispatch
├── auth.ts ......................... 159 lines — Clerk JWT verification (REST + WS)
├── env.d.ts ........................ 42 lines  — Env bindings incl. Dodo product IDs
├── durable-objects/
│   └── campaign-session.ts ......... 1945 lines — THE BIG ONE (see DURABLE_OBJECT.md)
├── db/
│   ├── index.ts .................... 99 lines  — barrel export
│   ├── utils.ts ....................  5 lines  — query helpers
│   ├── campaigns.ts ................ 119 lines — CRUD + status updates
│   ├── files.ts ....................  63 lines — campaign file CRUD
│   ├── images.ts ................... 98 lines  — campaign image CRUD
│   ├── messages.ts ................. 111 lines — chat message CRUD
│   ├── assets.ts ................... 109 lines — folder/file CRUD
│   ├── credits.ts .................. 265 lines — user_credits + usage_log (see BILLING.md)
│   ├── events.ts ................... 52 lines  — user_events (download / engagement tracking)
│   └── subscriptions.ts ............ 77 lines  — user_subscriptions + payment_events
├── lib/
│   ├── types.ts ....................  89 lines — ClientMessage, ServerMessage, HookType
│   ├── event-buffer.ts ............. 50 lines  — Sequential-ID ring buffer (max 1000, trim to 500)
│   ├── block-builder.ts ............ 105 lines — Build MessageBlock[] for chat persistence
│   ├── sdk-message-parser.ts ....... 397 lines — Parse SDK stdout → WS events (5 branches)
│   └── local-ai-runner.ts .......... 287 lines — In-process SDK for wrangler dev (AI_BACKEND=local — see LOCAL_AI_RUNNER.md)
├── routes/
│   ├── health.ts ................... 26 lines  — Health check endpoint (no auth)
│   ├── images.ts ................... 56 lines  — R2 image serving (Clerk-auth'd)
│   ├── campaigns.ts ................ 347 lines — Campaign CRUD + files + messages + status + recover-trigger
│   ├── assets.ts ................... 307 lines — Asset folder/file CRUD + R2 upload
│   ├── recovery.ts ................. 88 lines  — D1-first reconciliation (NO R2 read)
│   ├── credits.ts ..................  45 lines — GET /api/credits, /api/credits/usage
│   ├── events.ts ...................  30 lines — POST /api/events (download tracking)
│   ├── payments.ts ................. 135 lines — /api/payments/{checkout,topup,subscription,portal}
│   └── webhooks.ts ................. 346 lines — POST /webhooks/dodo (signature-verified)
└── wrangler.jsonc .................. Worker config (D1, R2, DO, containers — per-env staging/production)
```

---

## Wrangler Config Highlights

```jsonc
{
  "name": "creative-agent",                   // Base name; per-env override under env.*
  "main": "src/index.ts",
  "compatibility_flags": ["nodejs_compat"],   // Required for local-ai-runner.ts

  "placement": { "mode": "smart" },

  "assets": {
    "directory": "../client/dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application"
  },

  // ── Shared defaults ────────────────────────────────────────────
  "d1_databases": [{ "binding": "DB", "database_name": "creative-agent-db" }],
  "r2_buckets":   [{ "binding": "R2_BUCKET", "bucket_name": "creative-agent-assets" }],
  "durable_objects": { "bindings": [
    { "name": "CAMPAIGN_SESSION", "class_name": "CampaignSession" },
    { "name": "SANDBOX", "class_name": "Sandbox" }
  ]},
  "containers": [{
    "class_name": "Sandbox",
    "image": "./sandbox/Dockerfile",
    "instance_type": "standard-2",
    "max_instances": 50
  }],
  "observability": { "enabled": true },

  // ── Per-env overrides ──────────────────────────────────────────
  "env": {
    "dev":        { "vars": { "AI_BACKEND": "local", … } },
    "staging":    {
      "name": "creative-agent-staging",
      "d1_databases": [{ "binding": "DB", "database_name": "creative-agent-db" }],
      "r2_buckets":   [{ "binding": "R2_BUCKET", "bucket_name": "creative-agent-assets" }],
      "vars": { "R2_BUCKET_NAME": "creative-agent-assets", … }
    },
    "production": {
      "name": "creative-agent",
      "d1_databases": [{ "binding": "DB", "database_name": "creative-agent-db-prod" }],
      "r2_buckets":   [{ "binding": "R2_BUCKET", "bucket_name": "creative-agent-assets-prod" }],
      "vars": { "R2_BUCKET_NAME": "creative-agent-assets-prod", … }
    }
  }
}
```

**Per-env matters.** Each of `staging` / `production` has its own D1, its own R2 bucket, and its own `R2_BUCKET_NAME` var. If you deploy without `--env`, you hit the base config — which is fine for staging's values but dangerous in production. See [STAGING_PRODUCTION.md](../ops/STAGING_PRODUCTION.md).

**Two DO classes.** `CampaignSession` is the application-logic DO (one per user, keyed by `idFromName(userId)`). `Sandbox` is the container DO managed internally by `@cloudflare/sandbox`. The `SANDBOX` binding is passed to `getSandbox()` to create/resolve a container.

---

## See Also

- [Durable Object](./DURABLE_OBJECT.md) — The core orchestrator
- [D1 Database](./D1_DATABASE.md) — Schema and access layer
- [R2 Storage](./R2_STORAGE.md) — Key structure, FUSE mount
- [Sandbox Container](./SANDBOX_CONTAINER.md) — AI agent execution
- [Streaming Pipeline](./STREAMING_PIPELINE.md) — stdout → WS events
- [Auth Flow](../shared/AUTH_FLOW.md) — JWT verification details
- [Billing](../shared/BILLING.md) — Credits, Dodo integration, webhook semantics
- [REST API](../shared/REST_API.md) — All HTTP endpoints + request/response shapes
- [Staging ↔ Production](../ops/STAGING_PRODUCTION.md) — Per-env bindings + secrets
