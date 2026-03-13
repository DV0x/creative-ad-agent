# Session 21: Bug Fixes + Tail Logging

**Date:** 2026-03-05
**Branch:** `new-ui`
**Prior version:** `9f3f035f` (Session 19/20)

## Fixes Deployed

### Fix 1: userId deleted after generation (server)

**File:** `cloudflare/src/durable-objects/campaign-session.ts`
**Bug:** `clearPersistedSession()` deleted both `activeSession` AND `userId` from DO storage after generation. When the DO hibernates and user sends a follow-up via existing WebSocket, `webSocketMessage()` has no HTTP headers to read userId from. It falls back to `'anonymous'`, D1 query `WHERE user_id = 'anonymous'` finds nothing, and user gets "Campaign not found".
**Fix:** Only delete `activeSession` in `clearPersistedSession()`. Keep `userId` persistent so it survives across generations and hibernation cycles.
**Written in:** Session 20 (locally). Deployed this session.

### Fix 2: Assistant messages missing on refresh (client)

**File:** `client/src/App.tsx` (lines 85-97)
**Bug:** On page refresh, `loadData()` excludes messages for any campaign stored in `activeSession` localStorage. Intent was to protect live WS recovery data from being overwritten. But `activeSession` may linger after generation completes (e.g., WS dropped before `complete` event fires), causing completed campaigns to have their messages excluded too. Messages exist in D1 — just not displayed.
**Fix:** Added campaign status check before excluding. Only skip messages when the campaign is `generating` (active recovery may be in progress). For `complete`/`error`/`cancelled`/`incomplete` campaigns, load messages normally.

```typescript
// Before: blindly excluded
if (activeCampaignId) {
  delete messagesByCampaign[activeCampaignId]
}

// After: only exclude if recovery might be active
if (activeCampaignId) {
  const activeCampaign = fullCampaigns.find(c => c.id === activeCampaignId)
  if (activeCampaign?.status === 'generating') {
    delete messagesByCampaign[activeCampaignId]
  }
}
```

### Fix 3: Generation logs invisible in wrangler tail (server)

**File:** `cloudflare/src/durable-objects/campaign-session.ts`
**Bug:** Since Session 14's fire-and-forget pattern, `webSocketMessage()` returns immediately and `runGeneration()` runs as a background promise. `wrangler tail` only captures logs from handler invocations. Background promise `console.log` calls aren't associated with any handler context, so they're invisible.
**Fix:**
1. Added `tailLogs: string[]` buffer and `log()` method that queues messages
2. Replaced `console.log` calls inside `runGeneration()` with `this.log()`
3. `alarm()` handler now calls `flushTailLogs()` at the top — dumps the buffer via `console.log` where wrangler tail can capture them
4. Added `[alarm] Generation active: campaign=..., session=...` heartbeat log
5. Removed `stopKeepAlive()` from finally block — lets the last alarm fire to flush remaining logs. Alarm handler sees `isGenerating=false` and doesn't reschedule, so DO hibernates naturally
6. Removed unused `stopKeepAlive()` method

**Log flow:**
```
runGeneration() background promise → this.log("...") → tailLogs buffer
  ↓ (every 30s)
alarm() handler invocation → flushTailLogs() → console.log() → wrangler tail
```

## Discussion: Container Lifecycle (NOT implemented)

Identified a major UX issue: every generation (including follow-ups) pays the full container cold start cost:
- Cold start: ~5 min on production (image pull + Linux init)
- Pre-flight IP check: additional overhead, potentially 3x cold starts if IP blocked
- `npx tsx` compile: ~30s each time (no cache since container is destroyed)
- `sandbox.destroy()` in finally block kills the container after every run

**Root cause:** Container is treated like a serverless function (spin up → run → destroy). The `keepAlive: true` flag is set but `destroy()` defeats it.

**Proposed fix (Option A — simplest):**
- Remove `sandbox.destroy()` from finally block
- Keep `sync` + `unmountBucket` for FUSE flush, then remount on next run
- `getSandbox()` returns the existing warm container instantly
- Skip IP check on warm containers (already verified)
- Follow-up goes from ~7 min to ~30s

**Deferred to next session.**

## Files Changed

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | userId fix, tail log buffer + flush in alarm, removed `stopKeepAlive()` |
| `client/src/App.tsx` | Status-aware message exclusion on refresh |

## Testing Plan

1. **Follow-up without refresh** — send follow-up in same tab after generation completes (should no longer get "Campaign not found")
2. **Messages on refresh** — complete a generation, refresh page, verify assistant messages appear
3. **Wrangler tail visibility** — run `wrangler tail` during generation, verify `[gen]` and `[alarm]` logs appear every ~30s
4. **Follow-up after hibernation** — wait a few minutes after generation, then send follow-up (tests userId persistence)

## Status

- [x] Fix 1: userId persistence (written Session 20, deployed this session)
- [x] Fix 2: Messages missing on refresh
- [x] Fix 3: Tail log visibility
- [x] Client built
- [x] Deployed — version `7555533b`
- [ ] Test: follow-up without refresh
- [ ] Test: messages on refresh
- [ ] Test: wrangler tail logs
- [ ] Test: follow-up after hibernation
