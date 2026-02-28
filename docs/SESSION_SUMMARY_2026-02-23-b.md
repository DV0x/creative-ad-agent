# Session Summary — 2026-02-23 (Session B)

Continues from `docs/SESSION_SUMMARY_2026-02-23.md`.

## What We Did

### 1. Diagnosed Why Recovery on Refresh Was Completely Broken

The previous session's fixes (deferred subscribe with `waitForCampaign` polling + `startSubscription` API call) made `handleConnected` slow. This opened a timing window where `checkForRecovery` in App.tsx could race with the recovery flow and mark the campaign as `incomplete`, which nulled `generatingCampaignId`. After that, all replayed events were silently dropped because every event handler checks `generatingCampaignId`.

The user was NOT seeing recovery at all — just a snapshot of whatever the DB had at refresh time. "Works on second refresh" was just the server having finished and saved to DB in between.

### 2. Three-Part Fix: Fast Subscribe + Event Buffering + Recovery Guard

**a) Reverted to immediate subscribe** (`client/src/hooks/useWebSocket.ts`)

Removed `waitForCampaign` polling and the blocking `campaignsApi.get()` call from `handleConnected`. Subscribe is now sent immediately after `reconstructForRecovery` + `openThinkingBlock`. Historical messages are loaded in the background (non-blocking, after subscribe).

**b) Added event buffer for campaigns not yet loaded** (`client/src/store/index.ts`)

When replay events arrive before `setCampaigns` loads campaigns from the API, `addImageToCampaign` and `updateCampaignFile` now buffer events instead of silently dropping them. `setCampaigns` flushes the buffer when campaigns load.

New store fields: `_pendingImages`, `_pendingFiles`. Buffers are cleared on `cleanupFailedRecovery` and `completeGeneration`.

**c) Guarded `checkForRecovery`** (`client/src/App.tsx`)

Added check at top of `checkForRecovery()`: if `generatingCampaignId` is already set (meaning `handleConnected` owns recovery), skip and don't interfere.

### 3. Fixed Duplicate Recovery Messages (Idempotent handleConnected)

**Problem:** Screenshot showed duplicate "Recovering session..." blocks and duplicate user messages. `handleConnected` was firing twice per refresh (StrictMode: mount → unmount → remount, both connections open before cleanup kills the first). Each call to `reconstructForRecovery` appended a new user + assistant message pair.

**Fix:** Added idempotency guard at top of `handleConnected`:
```ts
if (store.generatingCampaignId === savedSession.campaignId && store.currentGeneratingMessageId) {
  // Already recovering — just re-subscribe without creating duplicate messages
  wsManager.sendMessage({ type: 'subscribe', ... });
  return;
}
```

### 4. Fixed Cancel Event Poisoning Follow-Up Recovery

**Problem:** After cancel → follow-up → refresh, recovery was killed by a stale cancel event. The follow-up reuses the original generation's session ID (`c6073aae`), so the event buffer contains events from BOTH the cancelled generation and the follow-up. On refresh, `lastEventId: 0` replays ALL events — including the "Generation cancelled" status event from the original generation. When `handleMessage` processes this, it calls `cancelGeneration()` which nulls `generatingCampaignId` and `clearActiveSession()` which removes localStorage. All subsequent follow-up events are silently dropped.

**Fix:** Clear the stale event buffer when starting a follow-up (`server/lib/websocket-handler.ts`, in `handleFollowUp`):
```ts
// Clear stale events from previous generation (e.g. cancel events
// that would poison recovery replay for this follow-up).
clearBuffer(wsSessionId);
```

This ensures the buffer only contains follow-up events. Recovery replay won't include the cancelled generation's events.

---

## Files Modified (All Changes Since Last Commit)

| File | Changes |
|------|---------|
| `client/src/hooks/useWebSocket.ts` | Immediate subscribe (removed waitForCampaign/startSubscription). Background historical message load. Idempotent `handleConnected` guard. Follow-up session saving (from previous session). |
| `client/src/store/index.ts` | `_pendingImages`/`_pendingFiles` buffers. `addImageToCampaign`/`updateCampaignFile` buffer when campaign missing. `setCampaigns` flushes buffers. `sessionId` on Campaign interface. `setChatMessagesForCampaign` action. `setChatMessages` preservation guard. `reconstructForRecovery` appends instead of replaces. Buffer cleanup in `cleanupFailedRecovery`/`completeGeneration`. |
| `client/src/App.tsx` | `checkForRecovery` guard: skip if `generatingCampaignId` already set. |
| `client/src/lib/api.ts` | `transformCampaign` populates `sessionId` from `api.session_id`. |
| `server/lib/websocket-handler.ts` | `clearBuffer` in `handleFollowUp` before emitting events. `clearBuffer` guards in `handleGenerate`/`handleFollowUp` finally blocks (from previous session). |

---

## Status: NOT YET TESTED

The cancel-event-poisoning fix (Fix 4) requires a server restart. The user needs to:

1. Restart the server
2. Test: start generation → refresh mid-generation → verify recovery works (thinking block resumes, images/files arrive live)
3. Test: start generation → cancel → send follow-up → refresh mid-follow-up → verify recovery works
4. Check browser console for `WebSocket: Recovering session` and `subscribed` confirmation

---

## Known Issues (Still Open)

### StrictMode double-subscribe (mitigated, not eliminated)

React StrictMode still causes two connect/subscribe cycles per refresh. The idempotency guard prevents duplicate recovery state, but the server processes two subscribe requests and replays events twice. The first connection's events arrive on a socket that StrictMode kills (handlers nulled by `killSocket`), so they're harmless. The second connection receives events correctly.

This is wasteful but not harmful. Could be fully eliminated by moving connection management entirely outside React lifecycle (module-level dedup in websocket-manager.ts).

### `lastEventId: 0` on every refresh

After page refresh, `lastEventIdRef` resets to 0. The client always replays the entire buffer from the beginning. For initial generation this is fine (events are idempotent for images/files). For follow-ups after `clearBuffer`, the buffer only contains follow-up events so this is also fine now.

However, thinking block children (phases, tool_start) are NOT idempotent — they get added as duplicates on each replay. This causes visual noise (duplicate "Parsing Request", "WebFetch" entries) but not data loss.

### Duplicate recovery messages on repeated refresh

If user refreshes multiple times during the SAME generation (without the page fully loading between refreshes), `reconstructForRecovery` may still create duplicate pairs in edge cases where the idempotency guard doesn't fire (e.g., `generatingCampaignId` was cleared by a stale event before the second refresh).

### Items from previous session still open

- R1: Campaign ID window race condition
- R2: Dual image event path race condition
- Phase 2: Stateless image operations
- Batch download (no onClick handler)
- Batch operations (no bulk API)

---

## Architecture Notes for Next Session

### Recovery flow after all fixes

```
Page refresh
  │
  ├── Store initializes empty
  │
  ├── WebSocket connects → handleConnected()
  │     ├── Check idempotency (generatingCampaignId already set?) → re-subscribe only
  │     ├── reconstructForRecovery() → sets generatingCampaignId, recovery messages
  │     ├── openThinkingBlock("Recovering session...")
  │     ├── subscribe (IMMEDIATELY, lastEventId: 0)
  │     │     → Server replays buffered events
  │     │     → Images/files buffered in _pendingImages/_pendingFiles if campaign not in store yet
  │     │     → Phases/tools added to thinking block
  │     │     → 'subscribed' event → setIsRecovering(false)
  │     └── Background: campaignsApi.get() → prepend historical messages (non-blocking)
  │
  ├── API data loads (async)
  │     ├── setCampaigns(fullCampaigns) → FLUSHES _pendingImages/_pendingFiles
  │     └── setChatMessages(excluding recovering campaign) → preserved by generatingCampaignId guard
  │
  ├── checkForRecovery effect
  │     └── generatingCampaignId already set → SKIP (guard prevents interference)
  │
  └── Result: recovery messages + live events + historical messages + images/files
```

### Key invariants

1. `handleConnected` is the SOLE owner of recovery. `checkForRecovery` is a fallback for when localStorage has no active session.
2. Subscribe must be fast (immediate after reconstructForRecovery) to minimize timing windows.
3. `handleConnected` must be idempotent — safe to call multiple times (StrictMode, reconnects).
4. Event buffer must be clean when starting a follow-up (`clearBuffer` in `handleFollowUp`).
5. `addImageToCampaign`/`updateCampaignFile` must buffer when campaign doesn't exist yet (not silently drop).
