# Session 10 — WebSocket Fix + DO Persistence — 2026-03-03

> Status: **WS connect/generate fix deployed, DO persistence fix written but NOT deployed**
> Branch: `new-ui`
> Deployed version: `9b9c5ed9` (has fixes 1-3, missing fix 4)

---

## Bugs Found & Fixed

### Bug 1: Stuck "generating" campaigns in D1
**Symptom**: App enters recovery mode on every page load, sends `subscribe` instead of connecting cleanly.
**Root cause**: Previous failed generations left campaigns with `status='generating'` in D1. The React app's `App.tsx` recovery logic (lines 132-196) detects these and enters recovery mode.
**Fix**: `UPDATE campaigns SET status='error' WHERE status='generating'` — ran multiple times as new ones accumulated during testing.
**Status**: Applied directly to D1 (not a code fix). Will recur if generations fail without cleanup.

### Bug 2: Generate message lost during component transition
**Symptom**: Click "Create" → UI transitions to workspace → "Session not found or expired" error. Generation never starts.
**Root cause**: When user clicks Create:
1. `EmptyState.generate()` sends `{ type: 'generate' }` via WS
2. Store updates → `EmptyState` unmounts → `useWebSocket` cleanup → `unsubscribe()` → `subscriberCount = 0` → **`disconnect()` kills the WS**
3. `ResultsView` mounts → `subscribe()` → reconnects → recovery sends `subscribe`
4. DO never received the `generate` (WS was killed before delivery) → "Session not found"

**Fix**: Added unsubscribe grace period in `client/src/lib/websocket-manager.ts`:
```typescript
// unsubscribe() — 200ms grace before disconnecting
export function unsubscribe(): void {
  subscriberCount = Math.max(0, subscriberCount - 1);
  if (subscriberCount === 0) {
    unsubscribeTimeout = setTimeout(() => {
      unsubscribeTimeout = null;
      if (subscriberCount === 0) disconnect();
    }, 200);
  }
}

// subscribe() — cancels pending grace period
export function subscribe(): void {
  subscriberCount++;
  if (unsubscribeTimeout) {
    clearTimeout(unsubscribeTimeout);
    unsubscribeTimeout = null;
  }
  if (authReady) connect();
}
```
**Status**: DEPLOYED in version `9b9c5ed9`. Verified working — generation starts successfully.

### Bug 3: DO loses session state on reset
**Symptom**: Generation starts, progress shows for ~4 minutes, then WS drops (code 1006). First reconnect succeeds (re-subscribe works). Second drop → "Session not found or expired" → generation state lost from UI.
**Root cause**: `CampaignSession` DO stores `sessionId`, `campaignId`, `userId`, `isGenerating`, and `eventBuffer` in transient instance variables. When the DO resets (code update rollout, hibernation eviction), all state is lost. `handleSubscribe()` checks `this.eventBuffer.hasEvents()` which is empty after reset → returns error.
**Console log timeline**:
```
4:06:36 — WS connected (token OK)
4:07:00 — Generate clicked, generation starts ("Parsing Request" phase received)
4:10:56 — WS dropped: code=1006, wasClean=false (DO reset)
4:10:59 — Reconnect #1 → re-subscribed OK (DO still had state)
4:11:10 — WS dropped AGAIN: code=1006 (second reset wave)
4:11:13 — Reconnect #2 → "Session not found" (state fully lost)
```

**Fix written** in `cloudflare/src/durable-objects/campaign-session.ts`:
```typescript
// New methods added to CampaignSession class:
private async persistSession(): Promise<void>     // saves to this.state.storage
private async restoreSession(): Promise<boolean>   // loads from this.state.storage
private async clearPersistedSession(): Promise<void> // cleans up on complete/error

// Integration points:
// - handleGenerate(): persistSession() after campaign creation
// - handleFollowUp(): persistSession() after campaign lookup
// - webSocketMessage(): restoreSession() on entry (DO wake)
// - fetch(): restoreSession() on entry (new WS connect)
// - handleSubscribe(): restoreSession() before "Session not found" check
// - All 3 finally blocks: clearPersistedSession() on complete/error
```
**Status**: CODE WRITTEN, NOT DEPLOYED. Needs `npm run build` (client) + `wrangler deploy`.

---

## Files Modified This Session

### Deployed (version 9b9c5ed9)

| File | Change |
|------|--------|
| `cloudflare/src/index.ts` | Added `[WS]` debug logging for upgrade, auth, and forwarding |
| `cloudflare/src/auth.ts` | Added `[AUTH]` debug logging for all JWT verification paths |
| `client/src/lib/websocket-manager.ts` | Unsubscribe grace period (200ms), `[WS-MGR]` debug logging |

### Written but NOT deployed

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | Session persistence via `this.state.storage` (persist/restore/clear) |

---

## What Was Verified Working

| Check | Result |
|-------|--------|
| Clerk JWT auth on WS connect | **PASS** — `user_3AQQ...` verified, forwarded to DO |
| Clerk JWT auth on REST API | **PASS** — `/api/campaigns`, `/api/assets/folders` return 200 |
| WS stays connected (no reconnect loop) | **PASS** — stable for 4+ minutes |
| Component transition doesn't kill WS | **PASS** — grace period prevents disconnect |
| Generate command reaches DO | **PASS** — ack received, "Parsing Request" phase shown |
| Sandbox boots and SDK starts | **PASS** — MCP server, SDK messages visible in tail |
| Generation survives DO reset | **FAIL** — session state lost (fix 4 not deployed) |

---

## Auth Verification Results

Server-side logging confirmed:
- `CLERK_SECRET_KEY` is set (`clerkKeySet=true` in /health)
- JWT tokens from Clerk are 832 chars, verified successfully via JWKS
- User ID `user_3AQQRoZ7M9jq7Rmhyg5aL9xXTxk` correctly extracted
- No-token WS connections properly rejected with 401
- Fake-token WS connections properly rejected with 401

---

## Next Steps (Priority Order)

1. **Deploy fix 4** (DO session persistence):
   ```bash
   cd client && npm run build
   docker logout registry.cloudflare.com; docker builder prune -af
   cd cloudflare && npx wrangler deploy
   ```
   Then clean stuck campaigns:
   ```bash
   npx wrangler d1 execute creative-agent-db --remote --command="UPDATE campaigns SET status='error' WHERE status='generating'"
   ```

2. **Test full generation end-to-end** in browser — verify events flow through DO resets

3. **Clean up debug logging** — remove `[WS]`, `[AUTH]`, `[WS-MGR]` logs once stable

4. **Fix sandbox userId**: Sandbox was created with `sandbox-user-anonymous-v2` even though auth returned real user ID. This might be because the DO's `this.userId` was 'anonymous' from a previous reset. Fix 4's `restoreSession()` should help, but verify.

5. **Consider E2E test updates**: E2E tests no longer work against deployed endpoint because they don't send Clerk JWTs. Either:
   - Add a test bypass token
   - Generate real JWTs for testing
   - Run E2E against local dev (no auth)

---

## Key Learnings

1. **React component transitions kill WebSocket connections**: When components using `useWebSocket()` unmount during page transitions, the subscriber count drops to 0 and triggers disconnect. The generate message sent just before unmount may not be delivered. Fix: grace period on unsubscribe.

2. **Durable Object resets lose all in-memory state**: Code updates cause DO resets which clear all instance variables. For long-running operations (generation takes 5+ minutes), critical state must be persisted to `this.state.storage`. The EventBuffer is harder to persist (large, complex objects), but session identity (sessionId/campaignId) is essential.

3. **Wrangler tail output is pretty-printed JSON**: Each log entry spans multiple lines. Need a custom parser to extract structured data.

4. **Multiple deploys during debugging create cascading DO resets**: Each `wrangler deploy` resets active DOs. During a debugging session with frequent deploys, generations will be interrupted repeatedly. Consider testing against local dev for iterative debugging.
