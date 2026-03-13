# Session 20: SDK Pin Fix Testing + Follow-Up Bug Discovery

**Date:** 2026-03-04
**Branch:** `new-ui`
**Deployed version:** `9f3f035f` (SDK pin fix from Session 19)

## Testing Results

### Test 1: Normal generation end-to-end — PASS
1. Opened app, signed in with Clerk
2. Submitted prompt: "create a single ad with photorealistic style" for theratefinder.ca
3. Agent started, thinking blocks appeared, 1 image generated
4. Status became `complete`, `sdk_session_id` populated (`f1a2e957-...`)
5. Image verified in R2 (1.08 MB JPEG), JSONL verified (337 KB)
6. Completion marker written to R2 (Session 18 recovery layer working)

**Confirms:** SDK 0.2.64 pin fix works. Agent runs successfully in sandbox.

### Test 2: Follow-up (without page refresh) — FAIL
1. After Test 1 completed, sent a follow-up message in the same tab
2. Got error: **"Campaign not found"**
3. Root cause identified (see below)

### Test 3: Follow-up (with page refresh) — PASS
1. Refreshed the page (new WebSocket connection)
2. Sent follow-up message
3. Agent resumed SDK session correctly (`--resume f1a2e957-...`)
4. Thinking blocks appeared, new image generated
5. Final state: `complete`, 2 images, 4 messages

## Bug Found: userId Deleted After Generation

### Root Cause

`clearPersistedSession()` (line 102-105 of `campaign-session.ts`) deletes both `activeSession` AND `userId` from `this.state.storage`:

```typescript
private async clearPersistedSession(): Promise<void> {
  await this.state.storage.delete('activeSession');
  await this.state.storage.delete('userId');  // ← THE BUG
}
```

This is called in the `finally` block after every generation completes (line 857). So after a successful generation:

1. `clearPersistedSession()` wipes `userId` from storage
2. DO hibernates (can happen within seconds of generation completing)
3. User sends follow-up via existing WebSocket (no page refresh)
4. `webSocketMessage()` fires — no access to HTTP headers
5. `restoreSession()` tries to read `userId` from storage — it's been deleted
6. `this.userId` stays `'anonymous'`
7. `getCampaignById(db, campaignId, 'anonymous')` returns null (campaign belongs to real user)
8. "Campaign not found"

### Why refresh works

Refreshing creates a new WebSocket connection → `fetch()` is called → `this.userId` is set from the `X-User-Id` header (line 111) → `userId` is re-persisted to storage (line 115).

### Fix (NOT YET DEPLOYED)

One-line change — stop deleting `userId` in `clearPersistedSession()`:

```typescript
private async clearPersistedSession(): Promise<void> {
  await this.state.storage.delete('activeSession');
  // Do NOT delete 'userId' — it must survive across generations
  // so follow-up messages after DO hibernation can identify the user.
}
```

The change has been made locally in `campaign-session.ts` but not deployed yet.

## Known Issue: Wrangler Tail Log Visibility

### Problem

Since Session 14 (fire-and-forget pattern), `wrangler tail` no longer shows real-time generation logs. Previously, the `webSocketMessage()` handler blocked until generation finished, so all `console.log()` calls were captured. Now the handler returns immediately and generation runs as a background promise kept alive by alarm heartbeat.

Logs are still being written but buffered — they only appear when the next handler invocation completes (alarm tick, new WS message, etc).

### Impact

- Cannot monitor generation progress in real-time via `wrangler tail`
- Debugging production issues requires checking D1/R2 state directly
- Not a functional issue — just a developer experience problem

### Potential Fix (NEXT SESSION)

Options to explore:
1. **Log forwarding via WS**: Send key log events as WS messages that `wrangler tail` can capture during alarm ticks
2. **Explicit log flush**: Send a periodic ping from client that triggers a handler return, flushing buffered logs
3. **Cloudflare Logpush**: Use Cloudflare's log streaming (may not apply to DO internal logs)
4. **Accept the tradeoff**: Real-time logs aren't critical for production — D1/R2 checks are sufficient

## Bug Found: Assistant Messages Missing After Refresh

### Symptom

After a generation completes, the assistant message is visible in the chat. But if you refresh the page, the assistant message disappears — only the user message is shown.

### Root Cause

In `client/src/App.tsx` (lines 86-91), when loading messages on page refresh, the code **skips loading messages for the "active" campaign**:

```typescript
const activeSessionRaw = localStorage.getItem('creative-agent:activeSession')
const activeSession = activeSessionRaw ? JSON.parse(activeSessionRaw) : null
const activeCampaignId = activeSession?.campaignId
if (activeCampaignId) {
  delete messagesByCampaign[activeCampaignId]  // ← skips this campaign's messages
}
```

The intent was to avoid overwriting messages being loaded via WS recovery (for in-progress generations). But the `activeSession` in localStorage may not be cleared properly after generation completes — so on refresh, the completed campaign's messages are still being excluded.

The messages ARE in D1 (verified: 2 user + 2 assistant messages). The client just doesn't display them.

### Investigation Notes

- `clearActiveSession()` is called in many places (completion, error, cancel) in `useWebSocket.ts`
- Possible race: if the user refreshes before `clearActiveSession()` runs, or if the WS disconnects before the `complete` event fires
- The `activeSession` localStorage key contains `{ sessionId, campaignId, prompt, messageId, startedAt }`
- Need to investigate: should the exclusion only apply when campaign status is `generating`, not `complete`?

### Fix (NEXT SESSION)

Options:
1. **Check campaign status**: Only exclude messages if the campaign is currently `generating` (not `complete`)
2. **Clear localStorage more aggressively**: Ensure `clearActiveSession()` always runs on generation completion
3. **Both**: Check status AND clear more reliably

## R2 Bucket Cleanup Note

The R2 bucket has a large amount of old data under `users/anonymous/` from pre-auth testing (Sessions 1-7). This includes:
- `.cache/` — Claude CLI MCP manifest cache
- `.claude/backups/` — Config backups
- `.claude/debug/` — Debug log files
- `.npm/` — npm logs

This is harmless but adds clutter. Can be cleaned up by deleting everything under `users/anonymous/` prefix.

## Files Changed (Local, Not Deployed)

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | Removed `userId` deletion from `clearPersistedSession()` |

## Next Session TODO

1. **Deploy userId fix** — build client, prune Docker, `wrangler deploy`
2. **Test follow-up without refresh** — verify the fix resolves "Campaign not found"
3. **Test follow-up after hibernation** — wait a few minutes after generation, then send follow-up
4. **Fix assistant messages missing on refresh** — investigate `activeSession` localStorage timing, ensure messages load for completed campaigns
5. **Explore log visibility** — decide on approach for real-time generation logs
6. **Optional: Clean up R2** — delete `users/anonymous/` prefix
7. **Test recovery layer** (Session 18) — still untested: start gen → redeploy mid-gen → reload → auto-recover

## D1 State

```sql
-- campaign_mmc4lmcnxahaeq: complete, 2 images, 4 messages
--   sdk_session_id: f1a2e957-0440-4143-b4b5-42fd8e5bf57e
--   Initial gen + follow-up both succeeded (follow-up required page refresh)
```

## Status

- [x] Test 1: Normal generation — PASS
- [x] Test 3: Follow-up (with refresh) — PASS
- [x] R2 verified: image (1.08 MB), JSONL (337 KB), completion marker
- [x] Bug identified: userId deleted in clearPersistedSession()
- [x] Fix written locally (not deployed)
- [x] Bug identified: assistant messages missing on refresh (localStorage activeSession not cleared)
- [ ] Deploy userId fix
- [ ] Test follow-up without refresh (after fix)
- [ ] Fix assistant messages missing on refresh
- [ ] Test recovery layer (Session 18)
- [ ] Explore log visibility improvement
