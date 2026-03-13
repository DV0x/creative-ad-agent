# Session 11 — Deploy Fixes & userId Bug — 2026-03-03

> Status: **3 fixes deployed, D1 wiped clean, ready to test fresh generation**
> Branch: `new-ui`
> Deployed version: `689c899e`

---

## Summary

Deployed the DO session persistence fix from Session 10, discovered and fixed two additional bugs during testing: a stale session recovery loop and a userId mismatch that caused silent follow-up failures.

---

## Bugs Found & Fixed

### Fix 1: DO Session Persistence (from Session 10)

**Code written in Session 10, deployed this session.**

When a Durable Object resets mid-generation (code update, hibernation), all in-memory state is lost. The fix persists critical session fields (`sessionId`, `campaignId`, `userId`, `isGenerating`) to `this.state.storage` so the DO can restore them after a reset.

**Methods added to `CampaignSession`:**
- `persistSession()` — saves to `this.state.storage` after campaign creation
- `restoreSession()` — loads from storage on DO wake (`fetch()`, `webSocketMessage()`, `handleSubscribe()`)
- `clearPersistedSession()` — cleans up in all `finally` blocks on complete/error/cancel

**Verified working:** Server log confirmed `"Session restored from storage, events lost (DO was reset)"` after a deploy-triggered reset. Client reconnected and re-subscribed successfully.

**Limitation:** Persistence saves session identity only. The generation process (sandbox exec) cannot survive a DO reset — the sandbox is destroyed. The event buffer is also lost. Only the session/campaign mapping survives for reconnection.

### Fix 2: Stale Session Recovery Loop

**Symptom:** After cleaning a stuck campaign in D1 (setting status to `error`), refreshing the page showed "Recovering session..." forever instead of returning to the empty state.

**Root cause:** The DO's persisted session in `this.state.storage` still had `isGenerating=true` (the `finally` block never ran because the DO reset killed the generation). When the client connected and subscribed, the DO restored the session from storage and said "subscribed OK" — but no generation was actually running. The client waited for events that would never come.

**Fix:** Added a staleness check in `handleSubscribe()`. After restoring from storage, verify the campaign status in D1. If the campaign is no longer `generating`, clear the persisted session and return "Session not found" so the client falls back to the empty state.

```typescript
// In handleSubscribe(), after restoreSession():
if (this.campaignId) {
  const campaign = await db.getCampaignById(this.env.DB, this.campaignId, this.userId);
  if (!campaign || campaign.status !== 'generating') {
    await this.clearPersistedSession();
    this.sendWS({ type: 'error', ..., error: 'Session not found or expired' });
    return;
  }
}
```

**Verified working:** After deploy, page refresh correctly showed the empty "What would you like to create?" state instead of stuck recovery.

### Fix 3: userId Mismatch — Silent Follow-Up Failure

**Symptom:** Follow-up message sent successfully (ack received, "Processing follow-up" shown), but generation never started. No container active, no error shown in UI. D1 campaign stuck as `generating` forever.

**Root cause (3 parts):**

#### Part A: `restoreSession()` overwrote fresh userId
In `fetch()`, the real Clerk userId is set from the `X-User-Id` header (line 70). But `restoreSession()` (line 72) unconditionally overwrote `this.userId` with the stored value — which could be `'anonymous'` if the session was persisted during a DO reset.

```
Line 70: this.userId = 'user_3AQQ...'  // ✓ correct from JWT
Line 72: await this.restoreSession()   // ✗ overwrites with stored 'anonymous'
```

**Fix:** `restoreSession()` now only restores userId if the current value is `'anonymous'` and the stored value is not:
```typescript
if (this.userId === 'anonymous' && stored.userId !== 'anonymous') {
  this.userId = stored.userId;
}
```

#### Part B: Campaign created with wrong userId, then reused
1. A DO reset set `this.userId = 'anonymous'`
2. `handleGenerate()` created a campaign in D1 with `user_id = 'anonymous'`
3. Generation was interrupted (by deploy), campaign left in D1
4. On retry, `handleGenerate()` found the existing campaign via `getCampaignBySessionId()` (client sends same sessionId) and **reused it without updating the user_id**
5. Campaign stayed as `user_id = 'anonymous'` even though the real user was authenticated

**Fix:** `handleGenerate()` now updates `user_id` when reusing an existing campaign with a mismatched userId:
```typescript
} else if (campaign.user_id !== this.userId) {
  await this.env.DB.prepare('UPDATE campaigns SET user_id = ? WHERE id = ?')
    .bind(this.userId, campaign.id).run();
}
```

#### Part C: Follow-up query failed silently
`handleFollowUp()` calls `getCampaignById(campaignId, this.userId)` which uses `WHERE id = ? AND user_id = ?`. With `user_id = 'anonymous'` in D1 but real Clerk userId in the DO, the query returned null. The error was sent via `sendWS()` (unbuffered) — which the client doesn't display in the chat panel. The follow-up appeared to start (ack was sent before the campaign lookup) but never actually ran.

**Note:** The `sendWS()` errors being invisible to the user is a UX issue that should be addressed separately.

---

## Files Modified This Session

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | (1) Deployed Session 10 persistence code. (2) Staleness check in `handleSubscribe()`. (3) userId fix in `restoreSession()`. (4) userId fix in `handleGenerate()` for campaign reuse. |

---

## D1 State

**All data wiped clean** at end of session for fresh testing:
- 49 campaigns deleted
- 95 messages deleted
- 147 campaign files deleted
- 8 campaign images deleted

---

## Deploy History This Session

| Version | Changes |
|---------|---------|
| `97bf8139` | Session 10 persistence code deployed |
| `09943799` | Staleness check in `handleSubscribe()` |
| `689c899e` | userId fixes in `restoreSession()` and `handleGenerate()` |

---

## What Was Verified Working

| Check | Result |
|-------|--------|
| DO session persistence (restore after reset) | **PASS** — server log confirmed restoration |
| WS reconnect after DO reset | **PASS** — client re-subscribed successfully |
| Stale session cleanup | **PASS** — page refresh returns to empty state, no stuck recovery |
| Initial generate (no follow-up) | **PASS** — agent responded with clarifying question |
| Follow-up generation | **NOT TESTED** — userId bug prevented it, now fixed |
| Full generation with images | **NOT TESTED** — needs fresh test |

---

## What Needs Testing Next Session

1. **Fresh full generation end-to-end** — D1 is clean, deploy is stable. Start a new generation with a URL (e.g., `bluebottlecoffee.com`) and verify:
   - Campaign created with real Clerk userId (not `anonymous`)
   - All phases stream in real time (research → hooks → prompts → images)
   - Images appear in the left panel
   - Generation completes successfully

2. **Follow-up generation** — After a successful generation, send a follow-up message and verify:
   - `getCampaignById()` finds the campaign (userId matches)
   - File hydration works (research/hooks/prompts restored from D1)
   - Follow-up generation completes with new images

3. **DO reset survival** — If a DO reset happens during generation (unlikely without a deploy), verify the persistence + staleness check work correctly together

4. **Cancel flow** — Test cancellation during an active generation

5. **Debug logging cleanup** — Once everything is stable, remove:
   - `[WS]`, `[AUTH]`, `[WS-MGR]` debug logs
   - `[debug]` status messages in `runGeneration()` (API key test, net test, etc.)
   - Debug diagnostics that add ~8s overhead to sandbox boot

6. **UX: Make `sendWS()` errors visible** — Errors sent via `sendWS()` (unbuffered) are not displayed in the chat UI. The client only renders events from `emitEvent()` (buffered). This caused the follow-up failure to be completely silent. Consider either:
   - Routing errors through `emitEvent()` so they appear in chat
   - Adding a client-side handler for `type: 'error'` messages from unbuffered sends

---

## Key Learnings

1. **DO resets lose ALL in-memory state including userId.** The `X-User-Id` header is only available during the initial `fetch()` (HTTP upgrade). After a reset, `webSocketMessage()` has no way to recover the userId unless it's persisted. Always persist userId independently.

2. **`restoreSession()` must not blindly overwrite fresh state.** When a new WS connection sets `this.userId` from the header, `restoreSession()` should respect that fresh value rather than replacing it with a potentially stale stored one.

3. **Campaign reuse via `getCampaignBySessionId()` must update ownership.** The client sends the same sessionId across retries. If a campaign was created with the wrong userId, reusing it without updating the userId propagates the error to all subsequent operations.

4. **Silent failures are the worst bugs.** The follow-up failure was completely invisible — the ack was sent (so the UI showed "Processing follow-up"), but the actual generation never started. No error appeared anywhere visible. Unbuffered `sendWS()` errors need to be surfaced to the UI.

5. **Don't deploy while testing.** Each deploy triggers a DO reset that kills active generations. Deploy all fixes at once, then test without deploying again.

---

## Architecture Notes (Updated)

- **DO persistence scope:** `sessionId`, `campaignId`, `userId`, `isGenerating` survive resets. EventBuffer and sandbox process do NOT survive.
- **userId flow:** Worker verifies JWT → extracts `sub` claim → passes via `X-User-Id` header → DO reads in `fetch()` → persisted in storage → restored on reset (but never overwrites a fresh header value)
- **Campaign ownership:** `getCampaignById()` filters by `user_id`. All campaign operations that use userId must ensure the campaign was created with the correct one.
- **DO addressing:** `idFromName(userId)` — one DO per Clerk user. All campaigns for a user go through the same DO instance.
