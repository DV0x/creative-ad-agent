# Session Summary — 2026-02-23

## What We Did

### 1. Fixed Follow-Up Recovery on Page Refresh (Previous Session)

**Problem:** When a user cancels a generation and then sends a follow-up on the same campaign, refreshing the page mid-generation kills the client's connection permanently. The backend continues running and completes successfully (images saved to DB), but the client shows "No images yet" and never reconnects to the stream.

**Root cause:** `followUp()` in `useWebSocket.ts` never saved the active session to `localStorage`. Both `generate()` and `resume()` call `saveActiveSession()` so the client can recover on refresh — `followUp()` was missing this step. Additionally, the client `Campaign` object didn't store `sessionId`, so `followUp()` had no way to look it up.

**Files modified:**

| File | Change |
|------|--------|
| `client/src/store/index.ts` | Added `sessionId?: string` to `Campaign` interface. Updated `addCampaign()` to accept and store optional `sessionId`. Updated `startGeneration()` to pass `sessionId` through to `addCampaign()`. |
| `client/src/lib/api.ts` | Updated `transformCampaign()` to populate `sessionId` from `api.session_id` — so campaigns loaded from DB on refresh also have their session ID. |
| `client/src/hooks/useWebSocket.ts` | Updated `followUp()` to: look up campaign's `sessionId` from the store, set `sessionIdRef.current`, reset `lastEventIdRef.current`, and call `saveActiveSession()`. Also added `clearActiveSession()` on send failure. |

---

### 2. Fixed Stale Buffer Timeout Destroying Follow-Up Event Buffer

**Problem:** After cancel → follow-up → refresh, recovery required multiple page refreshes before working. First refresh would get "Session not found or expired" error.

**Root cause:** `handleGenerate`'s `finally` block (line 986) schedules `setTimeout(() => clearBuffer(sessionId), 60_000)`. Since `handleFollowUp` reuses the same `session_id` (from the campaign's DB record), the follow-up creates a new event buffer under the same ID. But 60 seconds after the cancel, the stale timeout fires and **unconditionally deletes the follow-up's active buffer** via `clearBuffer()` — a hard `Map.delete()` with no active-session check.

**Fix:** Guard `clearBuffer` with an active-session check. Both `handleGenerate` and `handleFollowUp` register abort controllers in `sessionAbortControllers` while running. The timeout now checks `!sessionAbortControllers.has(sessionId)` before clearing — if a follow-up is actively using that session, the stale timeout is a no-op.

**Files modified:**

| File | Change |
|------|--------|
| `server/lib/websocket-handler.ts` | `handleGenerate` finally block (line 988): wrapped `clearBuffer` in `sessionAbortControllers.has()` guard. |
| `server/lib/websocket-handler.ts` | `handleFollowUp` finally block (line 1267): same guard applied. |

---

### 3. Fixed Recovery/Data-Loading Race Condition (Images & Chat History Lost)

**Problem:** Two issues observed after the buffer fix:
1. **Images lost on refresh** — "No images yet" despite generation producing images.
2. **Chat history lost** — previous conversation (cancelled generation messages) disappeared, only showing the recovery message pair.

**Root cause — architectural race condition:** On page refresh, two async operations race:

- **WebSocket connects** → `handleConnected` → `reconstructForRecovery` → `subscribe` → events replay
- **API data loads** → `setCampaigns()` → `setChatMessages()`

The problem is ordering:
1. `reconstructForRecovery` runs on an **empty** campaigns array (API hasn't loaded yet) — `campaigns.map()` is a no-op, so the campaign doesn't get its status set.
2. `subscribe` fires immediately → events replay → `addImageToCampaign(campaignId, image)` calls `campaigns.map()` on an empty array → **images silently dropped**.
3. `setCampaigns()` runs later and wholesale-replaces campaigns with DB-loaded data (which may not include in-flight images).
4. `setChatMessages()` wholesale-replaces all messages, wiping out recovery messages created by `reconstructForRecovery`.
5. `reconstructForRecovery` also **replaced** all messages for the campaign with just a recovery pair, destroying DB-loaded historical messages (the cancelled generation's conversation).

**Fix — three coordinated changes:**

**a) Defer `subscribe` until campaign exists in store** (`useWebSocket.ts`):

`handleConnected` now:
1. Calls `reconstructForRecovery` immediately (sets `generatingCampaignId` so bulk setters know to preserve recovery state).
2. Polls until the campaign exists in the store (loaded by `setCampaigns` from API).
3. Fetches the campaign's historical messages from the API via `campaignsApi.get()`.
4. Prepends historical messages before the recovery pair using `setChatMessagesForCampaign()`.
5. Only THEN sends `subscribe` — events replay into a campaign that actually exists.

**b) Protect recovery state from bulk overwrite** (`store/index.ts`):

- `setChatMessages` now preserves the generating campaign's messages if `generatingCampaignId` is set. App.tsx excludes the recovering campaign from the incoming payload, and the setter keeps existing recovery messages untouched.
- `reconstructForRecovery` now **appends** a recovery message pair to existing messages instead of replacing them.
- Added `setChatMessagesForCampaign(campaignId, messages)` — a targeted setter that updates one campaign's messages without touching others.

**c) App.tsx excludes recovering campaign from bulk message load** (`App.tsx`):

Restored the original pattern: if there's an active session in localStorage, the recovering campaign's messages are deleted from the bulk `setChatMessages` payload. This prevents the bulk setter from overwriting live recovery state regardless of timing. Historical messages are loaded separately by `handleConnected` before subscribing.

**Files modified:**

| File | Change |
|------|--------|
| `client/src/hooks/useWebSocket.ts` | Rewrote `handleConnected`: added `waitForCampaign` polling, `startSubscription` with `campaignsApi.get()` for historical messages, deferred `subscribe`. Added `campaignsApi` import. |
| `client/src/store/index.ts` | Changed `reconstructForRecovery` to append instead of replace. Changed `setChatMessages` to preserve generating campaign's messages. Added `setChatMessagesForCampaign` action. |
| `client/src/App.tsx` | Restored recovering campaign exclusion from bulk `setChatMessages` call. |

**Recovery flow after fix:**

```
Page refresh
  │
  ├── Store initializes empty
  ├── WebSocket connects → handleConnected()
  │     ├── reconstructForRecovery() → sets generatingCampaignId + recovery messages
  │     └── waitForCampaign() starts polling (campaigns don't exist yet)
  │
  ├── API data loads (async)
  │     ├── setCampaigns(fullCampaigns) → campaigns now populated
  │     └── setChatMessages(excluding recovering campaign) → other campaigns loaded
  │
  ├── waitForCampaign() fires — campaign exists!
  │     ├── campaignsApi.get() → fetch historical messages from DB
  │     ├── Prepend historical messages before recovery pair
  │     ├── openThinkingBlock("Recovering session...")
  │     └── subscribe → events replay → campaign exists → images land correctly
  │
  └── Result: full chat history + recovery progress + images
```

---

### 4. FAILED — Attempted StrictMode Double-Subscribe Fix

**Test scenario:** Cancel generation → send follow-up → refresh page multiple times while follow-up is running.

**Observed symptoms (from server logs and UI):**

1. **Double `subscribe` messages on every reconnect.** Server log shows two subscribe + replay pairs per reconnect (e.g., lines 123+127, 139+143, 178+182 in test log).
2. **`lastEventId: 0` on every reconnect.** Client always replays from the beginning of the buffer instead of resuming where it left off.
3. **File content (hooks, prompts) not rendering until manual refresh.** Events replay successfully (server logs confirm it), but the UI doesn't show updated file content until a full page refresh.
4. **Rapid connect/disconnect churn.** Server sees connections that never subscribe (`disconnect from session none`), then immediate reconnections.

**Root cause identified:** React StrictMode (`client/src/main.tsx:22`) double-mounts components in development. The mount→unmount→remount cycle causes:
- First mount: `useWebSocket` → `wsManager.subscribe()` → socket opens → `handleConnected` fires → recovery starts
- StrictMode unmount: `wsManager.unsubscribe()` → `wsManager.disconnect()` → **kills the socket**
- Remount: `wsManager.subscribe()` → new socket opens → `handleConnected` fires **again** → second recovery starts

Both `handleConnected` calls send a `subscribe` message, causing double event replay. The first mount's recovery runs on a socket that StrictMode kills, while the second mount's recovery runs on the live socket. Both async chains (`waitForCampaign` polling, `campaignsApi.get()`, etc.) execute in parallel and interfere with each other.

**Attempt 1 — `recoveringRef` boolean guard:**

Added `recoveringRef = useRef(false)` to block duplicate `handleConnected` calls. Set to `true` at entry, checked at the top.

**Why it failed:** The ref survives StrictMode's mount→unmount→remount cycle (same fiber). First mount sets `recoveringRef = true` and starts recovery on socket A. StrictMode kills socket A. Remount fires `handleConnected` but `recoveringRef` is still `true` → **bails out entirely**. Recovery never runs on the live socket B. The generation appears stopped from the client's perspective (no thinking block, no events, send button active).

**Attempt 2 — Read `lastEventId` from localStorage:**

Changed recovery to read `getLastEventId(savedSession.sessionId)` from localStorage instead of using `lastEventIdRef.current` (which is always 0 after page refresh). Intent was to avoid replaying already-seen events.

**Why it failed:** File events (hooks, prompts) that were processed before the refresh have event IDs lower than the saved `lastEventId`. Subscribing with a high `lastEventId` skips these file events. The file content *should* come from the DB via `setCampaigns`, but there's a timing gap — if the API call fires before the DB write completes, or if `setCampaigns` runs at the wrong moment relative to `reconstructForRecovery`, the file content is lost. Result: research file shows (was in DB from original generation) but hooks and prompts appear empty.

**Both attempts reverted.** Code is back to the state after fixes 1-3.

**Key insight for next session:** The problem is fundamentally about StrictMode creating two parallel recovery flows that share mutable state (refs, store, WebSocket). A simple boolean guard doesn't work because StrictMode kills the first socket but the guard blocks the second attempt. A generation counter approach would be needed — each `handleConnected` captures a counter value, and async callbacks (waitForCampaign, startSubscription) check if their counter is still current before proceeding. If a newer `handleConnected` has fired, the stale async chain aborts itself. This was not implemented.

**Alternative approaches to consider:**
- Move the deduplication into `websocket-manager.ts` (module-level, outside React lifecycle) — e.g., track whether `onConnected` was already called for the current `connectionGeneration` and skip duplicates.
- Use a `recoveryGenerationRef` counter instead of a boolean — increment on each `handleConnected`, capture the value in closures, check before async operations.
- Accept double replay but make the client handlers idempotent (e.g., `updateCampaignFile` and `addImageToCampaign` are already idempotent, but thinking block children and message pairs are not).

---

## Known Issues

### Duplicate recovery messages on repeated refresh during generation

If the user refreshes multiple times while generation is still running, each refresh calls `reconstructForRecovery` which appends a new recovery message pair. This results in duplicate "Recovering session..." entries in the chat. Not a data-loss issue (only the latest recovery pair receives events), but visually noisy. Could be fixed by making `reconstructForRecovery` idempotent — detect if a recovery pair already exists and skip creation.

### StrictMode double-subscribe (UNRESOLVED — see Fix 4 above)

React StrictMode causes `handleConnected` to fire twice per page refresh in dev mode. This results in double event replay, duplicate thinking block children, and potential race conditions between two parallel recovery flows. See Fix 4 for full analysis and failed attempts.

---

## What's Left

**Priority — StrictMode recovery fix (see Fix 4 for full context):**
- The cancel → follow-up → refresh flow is broken in dev mode due to StrictMode double-mount
- Most promising approach: generation counter ref or module-level deduplication in websocket-manager.ts
- Must handle: StrictMode killing the first socket, async chains (waitForCampaign polling, campaignsApi.get), and shared mutable state (store, refs)

**Remaining from `docs/FUTURE_REVIEW.md`:**
- R1: Campaign ID window race condition
- R2: Dual image event path race condition
- Phase 2: Stateless image operations
- Batch download (no onClick handler)
- Batch operations (no bulk API)
- Duplicate recovery messages on repeated refresh (see Known Issues above)

Next priority from research: Visual style expansion (photorealistic, UGC-style, clean typography).
