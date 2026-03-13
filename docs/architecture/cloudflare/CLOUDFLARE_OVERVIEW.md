# Cloudflare Overview

> Part of [Architecture Documentation](../INDEX.md) | **Directory:** `cloudflare/src/`

---

## How Requests Flow

```
Browser Request
    │
    ▼
Worker (index.ts — 50 lines)
    │
    ├── /ws          → Verify JWT → Durable Object (per-user)
    ├── /api/*       → Router → Auth → Route handlers → D1
    ├── /images/*    → Router → Auth → R2 image serving
    ├── /health      → Router → Health check (no auth)
    └── /* (fallback) → Static Assets (React SPA)
```

### Worker Entry (`cloudflare/src/index.ts` — 50 lines)

The Worker is thin. It routes by URL path:

1. **`/ws`** — Verifies JWT via `verifyWebSocketToken()`, extracts userId, creates/gets a DO by `idFromName(userId)`, forwards the WebSocket upgrade with `X-User-Id` header
2. **`/api/*`, `/images/*`, `/health`** — Delegates to `handleApiRequest()` in the router
3. **Everything else** — `env.ASSETS.fetch(request)` serves the React SPA (static assets with SPA fallback)

### Router (`cloudflare/src/router.ts` — 204 lines)

Pattern-matching sub-router. Handles CORS preflight, authenticates via Clerk JWT, dispatches to route handlers.

**Campaign routes:** `/api/campaigns`, `/api/campaigns/:id`, `/api/campaigns/:id/files/:type`, `/api/campaigns/:id/images`, `/api/campaigns/:id/messages`, `/api/campaigns/:id/status`, `/api/campaigns/:id/recover`

**Asset routes:** `/api/assets/folders`, `/api/assets/folders/:id`, `/api/assets/folders/:id/files`, `/api/assets/upload`, `/api/assets/files/:id`

---

## Cloudflare Bindings

Defined in `cloudflare/src/env.d.ts` (32 lines):

```typescript
import type { Sandbox } from '@cloudflare/sandbox';

interface Env {
  // Bindings
  ASSETS: Fetcher                          // Workers Static Assets (React SPA)
  DB: D1Database                           // D1 database
  R2_BUCKET: R2Bucket                      // R2 storage bucket
  CAMPAIGN_SESSION: DurableObjectNamespace  // Application logic DO
  SANDBOX: DurableObjectNamespace<Sandbox>  // Container DO (used by getSandbox())

  // Secrets (set via `wrangler secret put`)
  ANTHROPIC_API_KEY: string
  FAL_KEY: string
  CLERK_SECRET_KEY: string
  R2_ACCESS_KEY_ID: string      // For s3fs FUSE mount in sandbox
  R2_SECRET_ACCESS_KEY: string  // For s3fs FUSE mount in sandbox

  // Vars (set in wrangler.jsonc)
  CF_ACCOUNT_ID: string         // Used by FUSE mount for R2 access
  AI_BACKEND?: string           // "local" for wrangler dev (bypasses sandbox)
}
```

---

## Key Files

```
cloudflare/src/
├── index.ts ........................ 50 lines  — Worker entry, request routing
├── router.ts ....................... 204 lines — API router, CORS, auth dispatch
├── auth.ts ......................... 159 lines  — Clerk JWT verification (REST + WS)
├── env.d.ts ........................ 31 lines  — TypeScript bindings
├── durable-objects/
│   └── campaign-session.ts ......... ~1605 lines — THE BIG ONE (see DURABLE_OBJECT.md)
├── db/
│   ├── index.ts .................... barrel export
│   ├── utils.ts .................... query helpers
│   ├── campaigns.ts ................ CRUD + status updates
│   ├── files.ts .................... campaign file CRUD
│   ├── images.ts ................... campaign image CRUD
│   ├── messages.ts ................. chat message CRUD
│   └── assets.ts ................... folder/file CRUD
├── lib/
│   ├── types.ts .................... ClientMessage, ServerMessage, HookType
│   ├── event-buffer.ts ............. 50 lines — Sequential ID ring buffer (max 1000, trim to 500)
│   ├── block-builder.ts ............ 105 lines — Build MessageBlock[] for chat persistence
│   ├── sdk-message-parser.ts ....... 255 lines — Parse SDK stdout → events
│   └── local-ai-runner.ts .......... 376 lines — In-process SDK for wrangler dev (AI_BACKEND=local)
├── routes/
│   ├── health.ts ................... Health check endpoint
│   ├── images.ts ................... R2 image serving
│   ├── campaigns.ts ................ Campaign CRUD + files + messages
│   ├── assets.ts ................... Asset folder/file CRUD + R2 upload
│   └── recovery.ts ................. R2 completion marker recovery
└── wrangler.jsonc .................. Worker config (D1, R2, DO, containers)
```

---

## Wrangler Config Highlights

```jsonc
{
  "name": "creative-agent",
  "main": "src/index.ts",
  "compatibility_date": "2026-01-01",
  "compatibility_flags": ["nodejs_compat"],     // Required for local-ai-runner.ts

  "placement": { "region": "aws:us-east-1" },  // Near Anthropic API

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
      { "name": "SANDBOX", "class_name": "Sandbox" }
    ]
  },

  "containers": [{
    "class_name": "Sandbox",             // Separate from CampaignSession DO
    "image": "./sandbox/Dockerfile",
    "instance_type": "standard-2",       // 1 vCPU, 6 GiB RAM
    "max_instances": 50
  }],

  "observability": { "enabled": true },  // Container logs in dashboard

  "env": {
    "dev": { "vars": { "AI_BACKEND": "local" } }
  }
}
```

**Note:** `CampaignSession` and `Sandbox` are separate DOs. `CampaignSession` is the application logic DO (one per user). `Sandbox` is the container DO that the `@cloudflare/sandbox` SDK manages internally. The `SANDBOX` binding is passed to `getSandbox()` to create/get containers.

---

## See Also

- [Durable Object](./DURABLE_OBJECT.md) — The core orchestrator
- [D1 Database](./D1_DATABASE.md) — Schema and access layer
- [R2 Storage](./R2_STORAGE.md) — Key structure, FUSE mount
- [Sandbox Container](./SANDBOX_CONTAINER.md) — AI agent execution
- [Streaming Pipeline](./STREAMING_PIPELINE.md) — stdout → WS events
- [Auth Flow](../shared/AUTH_FLOW.md) — JWT verification details
