# Session 8 — Clerk Auth Enablement — 2026-03-02

> Status: **Auth enabled and verified**
> Branch: `new-ui`
> Deployed: https://creative-agent.alphasapien17.workers.dev
> Version ID: `6b1b7f71-1e84-4e91-ad66-92e89eb31280`

---

## Session Goal

1. Enable Clerk JWT auth on the deployed Cloudflare Worker
2. Connect React client and verify auth flow end-to-end

---

## What Was Implemented

### 1. Clerk Secret Key Set on Worker

```bash
printf 'sk_test_R6ys...' | tr -d '\n' | npx wrangler secret put CLERK_SECRET_KEY
```

Redeployed Worker so running DOs pick up the secret.

### 2. Auth Bug Fixed — `cloudflare/src/auth.ts`

**Problem**: `verifyToken()` and `verifyWebSocketToken()` returned `'anonymous'` even when `CLERK_SECRET_KEY` was set but no token was provided:

```typescript
// BEFORE (broken) — always returns 'anonymous' when no token
if (!env.CLERK_SECRET_KEY || !token) return 'anonymous';

// AFTER (fixed) — returns null (unauthorized) when key is set but no token
if (!env.CLERK_SECRET_KEY) return 'anonymous';
if (!token) return null;
```

This meant unauthenticated requests were passing through as `'anonymous'` instead of getting 401.

### 3. Health Endpoint Auth Status

Added `auth.clerkKeySet` to `/health` response for debugging:

```json
{ "status": "ok", "auth": { "clerkKeySet": true }, ... }
```

---

## What Was Verified

| Check | Result |
|-------|--------|
| REST API returns 401 without token | **PASS** |
| Health endpoint shows `clerkKeySet: true` | **PASS** |
| Clerk sign-in works in React client | **PASS** |
| WebSocket connects with JWT auth | **PASS** |
| Campaigns created with real Clerk user ID | **PASS** — `user_3ANzBpk1WdE1QZOshOLhHK8EAfI` |
| Generation starts and AI responds | **PASS** — sandbox started, events streamed |
| Per-user data isolation | **PASS** — new user sees empty campaign list |

---

## Lesson Learned: Don't Proxy to Production from Local

Attempted routing Vite dev server proxy to the deployed Worker:

```typescript
// vite.config.ts — DON'T DO THIS
'/ws': { target: 'https://creative-agent.alphasapien17.workers.dev', ws: true, ... }
```

**Problems encountered:**
- WebSocket connections drop intermittently through Vite proxy to remote WSS
- `wss://` target doesn't work for Vite http-proxy; must use `https://` with `ws: true`
- Dropped WS during generation causes "Session not found" subscribe errors
- DO's `isGenerating` flag gets stuck when WS drops mid-generation

**Decision**: Test in production via Cloudflare Pages deployment, not local proxy. Reverted `vite.config.ts` to `localhost:3001`.

---

## Files Modified

### Deployed
- `cloudflare/src/auth.ts` — Fixed auth bypass bug (2 lines changed)
- `cloudflare/src/routes/health.ts` — Added `auth.clerkKeySet` field

### Reverted
- `client/vite.config.ts` — Reverted to `localhost:3001` proxy targets

---

## Clerk Production Setup Status

- **Test keys**: Active and working (`sk_test_...` / `pk_test_...`)
- **Production keys**: Not yet configured
- **App domain**: Set to `creative-agent.alphasapien17.workers.dev` in Clerk dashboard
- **Production checklist** (for later):
  1. Set up custom OAuth credentials in Clerk production instance
  2. Connect custom domain with CNAME records
  3. Get `sk_live_...` / `pk_live_...` keys
  4. Set production secret: `printf 'sk_live_...' | npx wrangler secret put CLERK_SECRET_KEY`
  5. Set `VITE_CLERK_PUBLISHABLE_KEY=pk_live_...` in Cloudflare Pages env vars

---

## Next Session Priorities

### Priority 1: Deploy React Client to Cloudflare Pages

Deploy `client/dist/` to Cloudflare Pages as a staging environment:
- Build: `cd client && npm run build`
- Deploy to Pages with `wrangler pages deploy` or Cloudflare dashboard
- Configure routing: Pages for static, Worker for `/ws`, `/api/*`, `/images/*`
- Set `VITE_CLERK_PUBLISHABLE_KEY` in Pages env vars

### Priority 2: Remove Debug Diagnostics

Strip `[debug]` status messages and DO-level API key test (~8s overhead):
- Remove DO-level `fetch('https://api.anthropic.com/...')` test
- Remove `[debug]` status messages (or gate behind env flag)
- Keep the pre-flight IP retry (essential for reliability)

### Priority 3: Full UI Flow Tests (in production)

Test all flows through the deployed UI (not local proxy):
1. Create new campaign (generate) with 2 images
2. View generated images
3. Send follow-up message
4. Cancel a running generation
5. Refresh page mid-generation (reconnect)
6. Browse campaign history (REST API)

### Priority 4: Clerk Production Keys (when ready)

Switch from test to production Clerk keys for real user access.
