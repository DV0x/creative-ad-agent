# Session 9 — Static Assets Deployment + WS Debug — 2026-03-03

> Status: **Static assets deployed, WebSocket dropping in production**
> Branch: `new-ui`
> Deployed: https://creative-agent.alphasapien17.workers.dev
> Version ID: `a76b399a-c5c2-4d8f-bd27-0ec0425acff3`

---

## What Was Implemented

### React Client Served via Workers Static Assets

Instead of deploying the client to Cloudflare Pages (separate domain, needs routing rules), we added static assets to the **existing Worker** — one deployment, one domain, zero CORS.

#### Architecture Decision

```
Request → creative-agent.alphasapien17.workers.dev
  ├── /ws              → Worker → Durable Object (WebSocket)
  ├── /api/*           → Worker → D1 / R2
  ├── /images/*        → Worker → R2
  ├── /health          → Worker
  └── /*               → env.ASSETS.fetch() → static SPA (React)
```

With `binding: "ASSETS"`, the Worker runs first for ALL requests and delegates to static assets only for non-API paths.

#### Files Modified

1. **`cloudflare/wrangler.jsonc`** — Added `assets` block:
   ```jsonc
   "assets": {
     "directory": "../client/dist",
     "binding": "ASSETS",
     "not_found_handling": "single-page-application"
   }
   ```

2. **`cloudflare/src/env.d.ts`** — Added `ASSETS: Fetcher` binding type

3. **`cloudflare/src/index.ts`** — Changed 404 fallback to `env.ASSETS.fetch(request)`

#### Client Build Fixes (pre-existing TS errors)

- Added missing `authFetchBlob` export to `client/src/lib/api.ts`
- Removed unused imports in `client/src/components/layout/AppLayout.tsx` (Tooltip components)
- Removed dead code: `getLastEventId` in `useWebSocket.ts`, `remainingImages`/`existingImages` in `store/index.ts`

### What Was Verified Working

| Check | Result |
|-------|--------|
| `GET /` returns React app HTML | **PASS** |
| `GET /health` returns JSON | **PASS** |
| `GET /random-path` returns index.html (SPA fallback) | **PASS** |
| Clerk key baked into JS bundle | **PASS** |
| REST API still works (`/api/campaigns`, `/api/assets/folders`) | **PASS** |

---

## Current Bug: WebSocket Dropping in Production

### Symptoms

1. User signs in via Clerk, enters prompt
2. UI transitions to workspace, shows "generating" briefly
3. Generation immediately stops — no events flow through
4. Subsequent attempts show "Processing follow-up....." and hang
5. **Local dev works perfectly** (Vite proxy to localhost:3001)
6. **E2E backend tests pass** against deployed endpoint

### Wrangler Tail Logs

```
GET /ws?token=... - Unknown @ 3:20:14 PM          ← WS upgrade (101)
GET /ws?token=... - Canceled @ 3:20:14 PM          ← Suspicious duplicate
(log) WS closed: session=null, code=1006, reason=WebSocket disconnected without sending Close frame.
GET /ws?token=... - Canceled @ 3:20:23 PM
GET /ws?token=... - Unknown @ 3:20:23 PM           ← Reconnect
(log) WS closed: session=null, code=1006           ← Drops again
... (repeats every 1-2 seconds)
```

**Pattern**: WS connects → immediately closes with code 1006 → reconnect → loop. REST calls (`/api/campaigns`, `/api/assets/folders`) work fine throughout.

### Key Observations

1. **`session=null`** in every close log — WS drops before any client message (generate/subscribe) is processed
2. **`code=1006`** — abnormal closure, no Close frame sent by either side
3. **Campaign created with `user_id: "anonymous"`** — despite `CLERK_SECRET_KEY` being set and health showing `clerkKeySet: true`
4. **Rapid reconnect loop** — faster than client's 2s exponential backoff, suggests something else is triggering disconnects
5. **"Canceled" entries** — each WS upgrade shows twice in tail (Unknown + Canceled at same timestamp)

### D1 State After Testing

```sql
campaign_mmaa1j6zddu8r5 | user_id: anonymous | status: generating | name: Ravilagrandhotel
```

This campaign is stuck in "generating" because the WS dropped before generation could complete.

### Investigation Threads (Not Yet Resolved)

#### Thread 1: Static Assets + WebSocket Interference
Even with `binding: "ASSETS"`, the assets layer might interfere with WebSocket upgrades. The "Canceled" entries in tail suggest the request is being processed twice. Need to verify:
- Does `_routes.json` (a Pages-specific file in `client/dist/`) get interpreted by Workers Static Assets? (Docs say no, but untested)
- Is there a `run_worker_first` config needed?
- Test: remove `_routes.json` from dist and redeploy

#### Thread 2: React StrictMode Double-Mount
`<StrictMode>` in `main.tsx` causes mount → unmount → remount in dev AND production. The `useWebSocket` hook calls `subscribe()` on mount and `unsubscribe()` on unmount. Sequence:
1. Mount → subscribe (count=1) → connect
2. StrictMode unmount → unsubscribe (count=0) → **disconnect!**
3. Remount → subscribe (count=1) → connect

This creates a brief disconnect/reconnect cycle. If the DO receives the WS close during this cycle, `session=null` would match (no messages sent yet). But this should be a ONE-TIME cycle, not a continuous loop. Still, worth investigating if this initial disconnect cascades.

#### Thread 3: Anonymous User ID
Campaign has `user_id: "anonymous"` despite Clerk being configured. Possible causes:
- `verifyToken()` JWT verification fails silently and falls through to `payload.sub || 'anonymous'` (line 80 in auth.ts)
- Or `verifyWebSocketToken` returns 'anonymous' because CLERK_SECRET_KEY is somehow not visible to the Worker fetch handler (unlikely given health check)
- Test: add `console.log` to auth.ts to see what verifyToken actually returns

#### Thread 4: App Recovery Logic Conflict
`App.tsx` has recovery logic (lines 132-196) that:
1. Checks for campaigns with `status: 'generating'`
2. Calls `campaignsApi.getStatus(campaign.id)`
3. May set up recovery in localStorage
4. WebSocket hook reads localStorage on connect → sends `subscribe` instead of `generate`

If a stuck "generating" campaign exists from a previous failed attempt, the app enters recovery mode on every page load, potentially interfering with new generations. The second prompt showing "Processing follow-up....." confirms the app thinks it's continuing an existing campaign.

### Recommended Next Steps (Priority Order)

1. **Quick test**: Delete `_routes.json` from `client/dist/`, rebuild, redeploy. See if WS behavior changes.

2. **Add server-side logging**: Add `console.log` in `index.ts` WS handler to log `userId` from auth, and in DO `fetch()` to log `X-User-Id`. Check if auth is actually returning the Clerk user.

3. **Clean stuck campaigns**: Reset the stuck "generating" campaign to "error" in D1:
   ```bash
   npx wrangler d1 execute creative-agent-db --remote --command="UPDATE campaigns SET status='error' WHERE status='generating'"
   ```

4. **Test WS directly**: Use `websocat` or a simple HTML page to test WS against the deployed endpoint, bypassing the React app entirely. If WS stays open → client bug. If WS drops → server/infra bug.

5. **Test without assets**: Temporarily remove the `assets` config from `wrangler.jsonc`, redeploy, and test WS via E2E. If WS works without assets → the assets layer is interfering with WebSocket upgrades.

---

## Files Modified This Session

### Cloudflare (deployed)
- `cloudflare/wrangler.jsonc` — Added `assets` block
- `cloudflare/src/env.d.ts` — Added `ASSETS: Fetcher`
- `cloudflare/src/index.ts` — Changed 404 to `env.ASSETS.fetch(request)`

### Client (build fixes)
- `client/src/lib/api.ts` — Added `authFetchBlob()` function
- `client/src/components/layout/AppLayout.tsx` — Removed unused Tooltip imports
- `client/src/store/index.ts` — Removed unused `existingImages`, `remainingImages` variables
- `client/src/hooks/useWebSocket.ts` — Removed unused `getLastEventId` function
