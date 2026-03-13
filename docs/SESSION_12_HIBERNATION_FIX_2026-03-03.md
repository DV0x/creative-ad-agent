# Session 12 — Hibernation userId Fix — 2026-03-03

> Status: **userId fix deployed, generation failure needs debugging**
> Branch: `new-ui`
> Deployed version: `35cb7211`

---

## Summary

Diagnosed and fixed the root cause of campaigns disappearing on page refresh: the WebSocket Hibernation API was losing `this.userId` between `fetch()` and `webSocketMessage()`, causing campaigns to be created with `user_id='anonymous'`. Fix deployed and confirmed working (D1 now shows real Clerk userId). However, the first test generation died early (stuck at "Parsing Request") — likely due to container image rollout timing from the deploy.

---

## Bug Found & Fixed

### userId Lost to WebSocket Hibernation

**Symptom:** After page refresh during generation, sidebar shows "No campaigns yet", all chat messages and campaign files gone. Works perfectly in local dev.

**Root cause:** The DO uses the Hibernation API (`this.state.acceptWebSocket()`). With hibernation:
1. `fetch()` runs → sets `this.userId = 'user_3AQQ...'` from JWT header
2. DO hibernates (even briefly, before client sends first message)
3. DO wakes → class re-instantiated → `this.userId` resets to `'anonymous'` (default)
4. `webSocketMessage()` → `restoreSession()` → nothing stored yet → userId stays `'anonymous'`
5. `handleGenerate()` creates campaign with `user_id = 'anonymous'` in D1
6. On refresh → REST API queries `WHERE user_id = 'user_3AQQ...'` → no match → empty sidebar

**Why it works locally:** Dev mode disables auth → everything uses `'anonymous'` → no mismatch.

**Why Session 11's fix didn't catch it:** Session 11 fixed `restoreSession()` overwriting and campaign reuse, but not the **initial creation** where userId was already lost to hibernation before any session was persisted.

**Fix (3 changes in `campaign-session.ts`):**

1. **Persist userId in `fetch()`** — immediately after reading from header:
```typescript
this.userId = request.headers.get('X-User-Id') || 'anonymous';
if (this.userId !== 'anonymous') {
  await this.state.storage.put('userId', this.userId);
}
```

2. **Restore userId in `restoreSession()`** — at the top, before activeSession check:
```typescript
if (this.userId === 'anonymous') {
  const storedUserId = await this.state.storage.get<string>('userId');
  if (storedUserId && storedUserId !== 'anonymous') {
    this.userId = storedUserId;
  }
}
```

3. **Clean up in `clearPersistedSession()`**:
```typescript
await this.state.storage.delete('activeSession');
await this.state.storage.delete('userId');
```

**Verified working:** D1 campaign now shows `user_id = 'user_3ANzBpk1WdE1QZOshOLhHK8EAfI'` (real Clerk ID, not `anonymous`).

---

## Files Modified This Session

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | Persist userId to `this.state.storage` in `fetch()`, restore in `restoreSession()`, clean up in `clearPersistedSession()` |

---

## D1 State

- Wiped clean at start of session for fresh testing
- 1 campaign exists: `campaign_mmapxe4fklbjn4` (status manually set to `incomplete`)
- Campaign has correct `user_id = 'user_3ANzBpk1WdE1QZOshOLhHK8EAfI'`

---

## What Was Verified

| Check | Result |
|-------|--------|
| userId persisted through hibernation | **PASS** — D1 shows real Clerk userId |
| Campaign appears in sidebar after refresh | **PASS** — campaign name visible in header |
| Full generation end-to-end | **FAIL** — generation died at "Parsing Request" (sandbox didn't start) |

---

## What Needs Testing/Fixing Next Session

### 1. Debug generation failure
The first generation after deploy died at "Parsing Request" — the sandbox never started. Likely caused by container image rollout timing (deploy changes the image tag, rollout takes 2-3 min). The rollout is now complete, so retrying should work. If it fails again, check:
- `wrangler tail --format=pretty` for live DO logs during generation
- Whether `getSandbox()` is throwing (pre-flight IP retry should handle Anthropic 403s)
- Error handling in the gap between `handleGenerate()` and `runGeneration()` — line 243 `await this.runGeneration(aiPrompt, sessionId)` is NOT wrapped in try/catch, so if `runGeneration` throws before its own try/catch, the campaign stays stuck at `generating`

### 2. Stuck campaign status bug
**User-reported issue:** When a generation dies (sandbox crash, DO eviction, container rollout), the campaign stays stuck at `status: 'generating'` forever. The status should be updated to `error` or `incomplete`.

**Root cause (needs investigation):** The error handling in `runGeneration()` has try/catch/finally that updates status on error/cancel. But there are gaps:
- `handleGenerate()` line 243 calls `await this.runGeneration()` without a wrapping try/catch — if `runGeneration` throws before its internal try/catch (e.g., during sandbox setup), the error is unhandled
- If the DO is evicted during generation, the finally block never runs
- The staleness check in `handleSubscribe()` only catches this on reconnect, and the recovery check in `App.tsx` only catches it on page load — but neither updates D1

**Potential fixes to investigate:**
- Wrap `this.runGeneration()` call in `handleGenerate()` with try/catch/finally
- Add a timeout mechanism on the server (e.g., if no events for 5 min, mark as incomplete)
- The App.tsx recovery check already calls `campaignsApi.update(id, { status: 'incomplete' })` — verify this works

### 3. Full end-to-end test
Once generation works:
- Start generation → verify all phases stream (research → hooks → prompts → images)
- Refresh mid-generation → verify sidebar shows campaign, chat recovers
- Follow-up generation → verify file hydration and userId match
- Cancel flow → verify campaign status updates

### 4. Page refresh recovery completeness
Even with the userId fix, on refresh during generation:
- **User prompt**: Saved to D1 immediately ✓
- **Assistant thinking blocks**: Only saved to D1 on completion — lost on mid-generation refresh
- **Campaign files**: Saved to D1 as they're created ✓ (but showed empty because campaign wasn't visible before the fix)
- Consider saving assistant message incrementally (not just on complete) for better recovery

### 5. Debug logging cleanup (from Session 11)
Once stable, remove `[WS]`, `[AUTH]`, `[WS-MGR]` debug logs and sandbox diagnostics (~8s overhead).

---

## Key Learnings

1. **WebSocket Hibernation API destroys instance variables.** With `this.state.acceptWebSocket()`, the DO can be evicted between `fetch()` and `webSocketMessage()`. Any data set in `fetch()` that's needed in `webSocketMessage()` MUST be persisted to `this.state.storage`. This is a well-known Cloudflare gotcha but easy to miss.

2. **Don't test immediately after deploy.** Container image rollouts take 2-3 minutes. Starting a generation during rollout can cause sandbox failures. Wait for rollout to complete or check with `wrangler containers info`.

3. **Generation failures should always update campaign status.** Any code path that can fail between setting `status='generating'` and the `runGeneration()` try/catch needs its own error handling to prevent stuck campaigns.

---

## Deploy Command
```bash
cd client && npm run build && docker logout registry.cloudflare.com; docker builder prune -af; cd cloudflare && npx wrangler deploy
```
