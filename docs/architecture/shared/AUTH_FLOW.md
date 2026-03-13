# Auth Flow

> Part of [Architecture Documentation](../INDEX.md) | Clerk integration across all layers

---

## Overview

Authentication uses [Clerk](https://clerk.com) for sign-up, sign-in, and JWT token management. Auth is **optional in local dev** and **required in production**.

```
┌──────────────┐     JWT in header      ┌──────────────┐
│  React App   │ ──────────────────────→ │  Worker API  │
│  Clerk UI    │     JWT in query param  │  Verify JWT  │
│  getToken()  │ ──────────────────────→ │  Extract uid │
└──────────────┘                         └──────────────┘
```

---

## Client Side

### Key Files

- `client/src/lib/auth.ts` (10 lines) — Config + dev mode detection
- `client/src/contexts/AuthContext.tsx` (88 lines) — Auth providers
- `client/src/main.tsx` — ClerkProvider wrapper
- `client/src/App.tsx` — Token getter setup

### How It Works

```typescript
// auth.ts
CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
IS_AUTH_ENABLED = !!CLERK_PUBLISHABLE_KEY
```

**Production (auth enabled):**
1. `main.tsx` wraps app in `<ClerkProvider>`
2. `App.tsx` (`AuthenticatedApp`) waits for Clerk to load
3. Gets token getter: `const { getToken } = useAuth()`
4. Stores in ref: `stableTokenGetter = () => getToken()` (survives re-renders)
5. Passes to WS manager: `setTokenGetter(stableTokenGetter)`
6. Passes to API client: `setTokenGetter(stableTokenGetter)`

**Dev mode (auth disabled):**
1. No `ClerkProvider` wrapper
2. `DevModeApp` component — no token getter needed
3. `requireAuth(callback)` immediately executes callback
4. API calls have no `Authorization` header

### REST API Calls

```typescript
// api.ts — apiFetch()
if (IS_AUTH_ENABLED && tokenGetter) {
  const token = await tokenGetter()
  headers['Authorization'] = `Bearer ${token}`
}
```

### WebSocket Connection

```typescript
// websocket-manager.ts — connect()
if (storedTokenGetter) {
  const token = await storedTokenGetter()
  url += `?token=${token}`
}
new WebSocket(url)
```

### Auth UI

- `requireAuth(callback)` — wraps actions that need auth. Opens Clerk sign-in modal, then executes callback after success
- `UserMenu` — profile icon + sign-out button (desktop)
- `SignIn` — Clerk modal component (fallback, usually redirect-based)

---

## Local Server

### Key Files

- `server/lib/auth.ts` — Clerk Express middleware

### How It Works

Uses `@clerk/express` middleware:

```typescript
// If CLERK_SECRET_KEY is set → verify JWT, extract userId
// If not set → dev mode, userId = 'anonymous'
```

All route handlers receive `userId` from the middleware. WebSocket handler gets userId from the upgrade request.

---

## Production (Cloudflare Worker)

### Key Files

- `cloudflare/src/auth.ts` (159 lines) — JWT verification + request authentication
- `cloudflare/src/index.ts` — Auth check on every request

### How It Works

Four exported functions:

**`extractBearerToken(request)`** — Extracts the raw JWT from the `Authorization: Bearer {token}` header. Returns `null` if the header is missing or malformed.

**`verifyToken(token, env)`** — Core JWT verification
1. If `CLERK_SECRET_KEY` not set → return `'anonymous'` (dev-mode bypass)
2. If no token → return `null` (401)
3. Decode JWT header to get `kid` (key ID)
4. Decode JWT payload to get `iss` (issuer URL)
5. Fetch Clerk JWKS (`{issuer}/.well-known/jwks.json`)
6. Find matching key, import as CryptoKey
7. Verify JWT signature (RS256)
8. Check expiry
9. Return `userId` from `sub` claim

**`authenticateRequest(request, env)`** — Convenience wrapper for REST API routes. Extracts the bearer token from the request, calls `verifyToken`, and returns either a `userId` string or a `401 Response`. Also has a dev-mode bypass: if `CLERK_SECRET_KEY` is not set, returns `'anonymous'` immediately without checking any headers.

**`verifyWebSocketToken(token, env)`** — For WS upgrade. If `CLERK_SECRET_KEY` not set → return `'anonymous'` (dev-mode bypass). If no token → return `null`. Otherwise delegates to `verifyToken(token, env)`.

**Dev-mode bypass:** When `CLERK_SECRET_KEY` is not set, all three verification functions (`verifyToken`, `authenticateRequest`, `verifyWebSocketToken`) return `'anonymous'` without checking any token. This means all auth is completely bypassed in local development.

### JWKS Fetching

Clerk's JWKS endpoint is fetched on every `verifyToken()` call (no caching). The issuer URL is extracted from the JWT payload, and JWKS is fetched from `{issuer}/.well-known/jwks.json`.

### Request Flow

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

### DO Gets userId

The Worker uses `idFromName(userId)` to route to a Durable Object — this means **one DO per user** (not per campaign). All campaigns for a user route to the same DO instance.

The DO receives userId via the `X-User-Id` header on the fetch/WebSocket upgrade request. It stores this as `this.userId` and immediately persists to `this.state.storage.put('userId', ...)`.

**Gotcha:** After a DO reset (code deploy), `webSocketMessage()` has no access to headers. The userId reverts to what was persisted in `this.state.storage`. If persistence was from an earlier session, this can cause a mismatch. Session 11 fixed this by: (1) always persisting userId from headers, (2) not overwriting fresh header userId with stale stored one.

### Image Auth

Generated images at `/images/*` require authentication. Plain `<img>` tags can't send Authorization headers.

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

See [Image Pipeline](./IMAGE_PIPELINE.md) for the `AuthImage` component details.

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Client `.env` | Clerk publishable key (enables auth UI) |
| `CLERK_SECRET_KEY` | Server `.env` / Worker secret | Clerk secret key (enables JWT verification) |

### Production Secrets

```bash
# Set on Worker (always tr -d '\n' to avoid trailing newlines)
echo -n "sk_test_xxx" | npx wrangler secret put CLERK_SECRET_KEY
```

Secrets need a redeploy to take effect on running DOs.

---

## Current State

- Using **Clerk test keys** (development environment)
- Production Clerk setup requires:
  - Custom OAuth credentials
  - DNS CNAME records
  - Clerk dashboard → Production environment
- Clerk app domain set to `creative-agent.alphasapien17.workers.dev`

---

## See Also

- [Client Architecture](../client/CLIENT_ARCHITECTURE.md) — Auth gating in App.tsx
- [Cloudflare Overview](../cloudflare/CLOUDFLARE_OVERVIEW.md) — Request routing + auth
- [Durable Object](../cloudflare/DURABLE_OBJECT.md) — userId handling after DO reset
