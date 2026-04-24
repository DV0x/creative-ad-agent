# Auth Flow

> Part of [Architecture Documentation](../INDEX.md) | Clerk integration across all layers | **Source:** `client/.env.{staging,production}`, `cloudflare/src/auth.ts`, `server/lib/auth.ts`

---

## Overview

Authentication uses [Clerk](https://clerk.com) for sign-up, sign-in, and JWT management. Auth is **optional in local dev**, **required in staging + production**, and **uses different Clerk instances per env** (test vs live).

```
┌──────────────┐     JWT in header      ┌──────────────┐
│  React App   │ ──────────────────────→ │  Worker API  │
│  Clerk UI    │     JWT in query param  │  Verify JWT  │
│  getToken()  │ ──────────────────────→ │  Extract uid │
└──────────────┘                         └──────────────┘
```

Per-env Clerk config (full matrix in [STAGING_PRODUCTION.md → Clerk](../ops/STAGING_PRODUCTION.md#clerk)):

| Env | Instance | Publishable key | Secret key |
|---|---|---|---|
| Local dev | Optional test | `pk_test_…` (same as staging) | `sk_test_…` |
| Staging | `well-bug-49.clerk.accounts.dev` (test) | `pk_test_d2Vs…` | `sk_test_…` |
| Production | `clerk.creativemachines.xyz` (live) | `pk_live_Y2xl…` | `sk_live_…` |

---

## Client side

### Key files

| File | Purpose |
|---|---|
| `client/src/lib/auth.ts` | Config + dev mode detection |
| `client/src/contexts/AuthContext.tsx` | Auth providers |
| `client/src/main.tsx` | ClerkProvider wrapper |
| `client/src/App.tsx` | Token getter setup, auth gating |
| `client/.env.staging` | `VITE_CLERK_PUBLISHABLE_KEY=pk_test_…` |
| `client/.env.production` | `VITE_CLERK_PUBLISHABLE_KEY=pk_live_…` |

### How it works

```ts
// auth.ts
CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
IS_AUTH_ENABLED = !!CLERK_PUBLISHABLE_KEY
```

The `VITE_CLERK_PUBLISHABLE_KEY` is resolved at **build time** by vite from the `.env.{mode}` file (mode chosen by `npm run build:staging` vs `build:production`). Baked into the static bundle — no runtime env lookup.

**Production (auth enabled):**

1. `main.tsx` wraps app in `<ClerkProvider>` with the live key
2. `AuthenticatedApp` (`App.tsx`) waits for Clerk to load
3. Uses `useAuth()` hook to get the token getter
4. Stores in a ref: `stableTokenGetter = () => getToken()` — survives React re-renders
5. Passes to WS manager: `setTokenGetter(stableTokenGetter)`
6. Passes to API client: `setTokenGetter(stableTokenGetter)`

**Dev mode (auth disabled — no publishable key in `.env`):**

1. No `ClerkProvider` wrapper
2. `DevModeApp` component — no token getter
3. `requireAuth(callback)` immediately executes callback
4. API calls have no `Authorization` header

### REST calls

```ts
// api.ts — apiFetch()
if (IS_AUTH_ENABLED && tokenGetter) {
  const token = await tokenGetter();
  headers['Authorization'] = `Bearer ${token}`;
}
```

### WebSocket

```ts
// websocket-manager.ts — connect()
if (storedTokenGetter) {
  const token = await storedTokenGetter();
  url += `?token=${token}`;
}
new WebSocket(url);
```

JWT goes in the query parameter because browser WebSocket API can't set custom headers.

### Auth UI

- `requireAuth(callback)` — wraps actions needing auth. Opens Clerk sign-in modal, then runs callback on success
- `UserMenu` — profile icon + sign-out (desktop)
- `SignIn` — Clerk modal component (fallback; usually redirect-based)

---

## Local Express server

### Key files

- `server/lib/auth.ts` — Clerk Express middleware wrapper

### How it works

Uses `@clerk/express` middleware:

```ts
// If CLERK_SECRET_KEY is set → verify JWT, extract userId
// If not set → dev mode, userId = 'anonymous'
```

All route handlers receive `userId` from the middleware. WebSocket handler gets userId from the upgrade request.

---

## Production (Cloudflare Worker)

### Key files

- `cloudflare/src/auth.ts` (159 lines) — JWT verification + request authentication
- `cloudflare/src/index.ts` — auth check on every request

### Four exported functions

**`extractBearerToken(request)`** — pulls raw JWT from `Authorization: Bearer {token}`. Returns `null` if missing/malformed.

**`verifyToken(token, env)`** — core JWT verification. The Worker does NOT use Clerk's Node SDK; it does JWKS fetch + signature verification itself (Cloudflare Workers runtime has WebCrypto).

1. If `CLERK_SECRET_KEY` not set → return `'anonymous'` (dev-mode bypass)
2. If no token → return `null` (401)
3. Decode JWT header → extract `kid`
4. Decode JWT payload → extract `iss` (issuer URL, env-specific)
5. Fetch JWKS from `{iss}/.well-known/jwks.json`
6. Find matching key by `kid`, import as `CryptoKey`
7. Verify JWT signature (RS256)
8. Check `exp` (expiry)
9. Return `userId` from `sub` claim

**`authenticateRequest(request, env)`** — wrapper for REST routes. Extracts bearer, calls `verifyToken`, returns `userId` string or `Response(401)`. Also has dev-mode bypass: if `CLERK_SECRET_KEY` not set, returns `'anonymous'` immediately.

**`verifyWebSocketToken(token, env)`** — for WS upgrade. Same pattern; same dev-mode bypass.

### JWKS per env

The issuer URL comes from the JWT payload itself, so the Worker auto-fetches the right JWKS per env:

- Staging JWTs → `iss: https://well-bug-49.clerk.accounts.dev` → JWKS at that domain
- Production JWTs → `iss: https://clerk.creativemachines.xyz` → JWKS at that domain

**No JWKS caching** in the Worker. Fetched on every verify. Hit on every API call. Cloudflare CDN likely caches the response — observed latencies are low — but the Worker doesn't maintain its own cache. Fix candidate if the issuer endpoint ever degrades.

### Request flow

```
Request arrives at Worker
  │
  ├── /health → skip auth
  ├── /ws → verifyWebSocketToken(query.token, env)
  │          │
  │          ├── null → reject upgrade (401)
  │          └── userId → forward to DO with X-User-Id header
  │
  └── /api/* → authenticateRequest(request, env)
               │  (extracts Bearer token, calls verifyToken)
               │
               ├── Response(401) → return 401
               └── userId → pass to route handler
```

### DO routing by userId

The Worker uses `idFromName(userId)` to route to the Durable Object — **one DO per user** (not per campaign). All campaigns for a user route to the same DO.

The DO receives `userId` via `X-User-Id` header on the fetch / WebSocket upgrade. It stores `this.userId` and immediately persists to `this.state.storage.put('userId', ...)`.

**Gotcha:** After a DO reset (code deploy), `webSocketMessage()` has no access to headers. `userId` restores from `this.state.storage`. If persistence was from an earlier session, mismatches can occur. Session 11 fixed this by: (1) always persisting userId from headers on `fetch`, (2) never overwriting fresh header userId with a stale stored one.

### Image auth

Generated images at `/images/*` require authentication. Plain `<img>` tags can't send `Authorization` headers — the client uses an `AuthImage` component that fetches via XHR with the bearer token, then turns the blob into a `blob:` URL for the `<img src>`.

```
Client                             Worker
  │                                  │
  │ AuthImage component              │
  │   fetch('/images/...', {         │
  │     headers: {                   │
  │       Authorization: Bearer JWT  │
  │     }                            │
  │   })                             │
  │──────────────────────────────────│
  │                                  │ Verify JWT
  │                                  │ Extract userId
  │                                  │ R2.get(users/{userId}/images/...)
  │←── Blob response ───────────────│
  │                                  │
  │ Create blob URL                  │
  │ Set as <img src>                 │
```

See [IMAGE_PIPELINE.md](./IMAGE_PIPELINE.md) for the `AuthImage` details.

---

## Production Clerk setup

The production Clerk instance was configured during Sessions 70–73 alongside Dodo Payments rollout. What's in place:

- **Custom domain**: `clerk.creativemachines.xyz` via CNAME (DNS in Cloudflare dashboard for `creativemachines.xyz` zone)
- **Google OAuth**: production credentials (separate from the dev Google app) — live client ID/secret in Clerk dashboard
- **Allowed origins**: `https://creativemachines.xyz`
- **Redirect URLs**: `https://creativemachines.xyz/*`
- **Live publishable key**: `pk_live_Y2xlcmsuY3JlYXRpdmVtYWNoaW5lcy54eXok` (decodes to `clerk.creativemachines.xyz$`)
- **Live secret key**: stored as Worker secret `CLERK_SECRET_KEY` on `--env production`

The test Clerk instance (`well-bug-49.clerk.accounts.dev`) is used by staging AND local dev — same publishable key across those. No Google OAuth configured there (email/password only).

---

## Environment variables

| Variable | Where | Purpose | Per-env? |
|---|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `client/.env.{staging,production}` | Publishable key, baked into bundle at build | Yes — pk_test vs pk_live |
| `CLERK_SECRET_KEY` | Worker secret (per env) | JWKS verification (indirectly — via issuer-derived URL) | Yes — sk_test vs sk_live |

In the Worker, `CLERK_SECRET_KEY`'s presence is what gates auth on/off (`verifyToken` dev-mode bypass). The value itself isn't used for JWT verification — that uses the JWKS endpoint derived from the token's `iss`. But Clerk's secret key is used elsewhere (e.g., if you ever call Clerk's backend API from the Worker for user management — not currently done).

---

## Gotchas specific to auth

1. **Publishable key changes require a client rebuild + redeploy.** It's baked into the static bundle at build time. Secret rotation alone doesn't update existing clients.
2. **JWKS is fetched per-call.** No caching in Worker code. If Clerk's JWKS endpoint degrades, all requests start failing.
3. **Dev-mode bypass is global.** If `CLERK_SECRET_KEY` is missing on the Worker, ALL users are treated as `'anonymous'`. Double-check the secret is set before assuming auth is working on a fresh deploy.
4. **Token expiry is short (~1 min).** Clerk's default. Client auto-refreshes via `useAuth().getToken()` every call — which is why we re-fetch the token in WS manager + API client, not cache it.
5. **Incognito-window test after Clerk config changes.** Clerk caches issuer + session in browser storage. Stale tokens fail silently — user sees "Not connected" with no actionable error.
6. **Test and live Clerk instances have different user databases.** Signing up on staging doesn't sign you up on production. If you're debugging a production user's issue, make sure you're looking at production Clerk, not test.
7. **`iss` mismatch at env boundary.** A JWT minted by the test Clerk instance has `iss: https://well-bug-49.clerk.accounts.dev` — sending that JWT to the production Worker (which fetches JWKS from whatever `iss` says) may return 401 or may succeed with the wrong instance. Don't mix.

---

## See Also

- [Staging vs Production](../ops/STAGING_PRODUCTION.md) — full Clerk matrix
- [Client Architecture](../client/CLIENT_ARCHITECTURE.md) — auth gating in App.tsx
- [Cloudflare Overview](../cloudflare/CLOUDFLARE_OVERVIEW.md) — request routing + auth
- [Durable Object](../cloudflare/DURABLE_OBJECT.md) — userId handling after DO reset
- [Deployment](../ops/DEPLOYMENT.md) — secret rotation, per-env deploy
