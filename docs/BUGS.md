# Bug Report — Generation Flow (2026-01-30)

**Branch:** `new-ui`
**Test:** Fresh DB, authenticated user, prompt "create two ads for theratefinder.ca", refresh mid-generation, cancel during image generation.

---

## Bug 1: Multiple WebSocket Connections Accumulate on Refresh

**Severity:** High
**Status:** Fixed (2026-01-30)
**Files:** `client/src/lib/websocket-manager.ts` (new), `client/src/hooks/useWebSocket.ts`, `server/lib/websocket-handler.ts`

**Observed:** Every page refresh spawns new WS connections without cleanly closing old ones. By mid-generation, 4+ simultaneous connections exist, each subscribing to the same session and independently replaying all events.

**Root Cause:** `useWebSocket()` was called independently by 4 components (`EmptyState`, `ChatSidebar`, `MobileChatDrawer`, `ResultsView`), each creating its own WebSocket. Combined with React StrictMode double-mounting, this produced 4-8+ simultaneous connections per page load.

Additionally, the server's `ws.on('close')` unconditionally nullified `sessionConnections`, so a stale connection closing could kill the reference for the active connection.

**Fix — Module-level WebSocket singleton:**

1. **New file `client/src/lib/websocket-manager.ts`:** Module-level singleton that owns the single WebSocket per browser tab. Uses `connectionGeneration` counter to reject stale handlers, `subscriberCount` ref counting (first mount connects, last unmount disconnects), and `killSocket()` to null all handlers before closing.

2. **Refactored `useWebSocket.ts`:** Now a thin wrapper that delegates connection lifecycle to the manager. Uses refs for `handleMessage` and `handleConnected` so the manager always calls the latest closures. All 4 components share one connection.

3. **Server `websocket-handler.ts`:** `handleSubscribe` and `handleGenerate` now close previous WebSocket with code 4001 before overwriting `sessionConnections`. `ws.on('close')` only nullifies if the closing WebSocket IS the current one (`sessionConnections.get(sessionId) === ws`).

---

## Bug 2: Chat Disappears After Recovery Replay

**Severity:** High
**Status:** Resolved (by Bug 1 fix — singleton eliminates the multi-connection race)
**Files:** `client/src/App.tsx`, `client/src/hooks/useWebSocket.ts`, `client/src/store/index.ts`

**Observed:** After refresh during generation, the thinking block replays successfully (events stream in, chat rebuilds), then the chat content vanishes.

**Root Cause — race condition between data loading and recovery:**

On page load, two independent flows race:

```
Flow A: App.tsx loadData()
  → fetch /api/campaigns + /api/assets/folders (async)
  → on response: setCampaigns(), setChatMessages()

Flow B: useWebSocket onopen
  → check localStorage for active session
  → reconstructForRecovery() → REPLACES chatMessages, sets isRecovering=true
  → send subscribe → events replay → thinking block rebuilds
```

The guard `if (!hasActiveRecovery)` in App.tsx should prevent Flow A from overwriting Flow B. But with 4 simultaneous WebSocket connections (Bug 1), the timing is unpredictable:
- One connection's recovery could complete (setting `isRecovering=false`)
- Then another connection's replay arrives
- Meanwhile the API data load response arrives and overwrites everything

Additionally, each of the 4 connections calls `reconstructForRecovery()` which **REPLACES** chat messages — so 4 connections overwrite messages in rapid succession while API data loads are also writing to the same state.

---

## Bug 3: Cancel Marks Campaign as `error` Instead of `cancelled`

**Severity:** Medium
**Status:** Fixed (2026-01-30)
**Files:** `server/lib/websocket-handler.ts`

**Observed:** After clicking cancel, the campaign status in DB is `error` with assistant message "Error: Claude Code process aborted by user". Images generated before cancel disappeared from UI because the client received `{ type: 'error' }` and called `failGeneration()`, resetting the UI state.

**Root Cause:** The `AbortError` thrown by `abortController.abort()` is caught by the generic `catch` block in `handleGenerate`. The `wasCancelled` check inside the `for await` loop never fires because the abort happens *during* the SDK query (inside the MCP tool call), so the generator throws rather than yielding the next message.

**Fix:** The `catch` block now checks for `AbortError` (by `error.name === 'AbortError'` or `abortController.signal.aborted`) and routes to the cancellation path: broadcasts `{ type: 'status' }` instead of `{ type: 'error' }`, sets campaign status to `cancelled`, saves "Generation was cancelled." as assistant message.

---

## Bug 4: Generated Images Not Saved to DB or Shown in UI

**Severity:** Critical
**Status:** Fixed (2026-01-30)
**Files:** `server/lib/image-events.ts` (new), `server/lib/nano-banana-mcp.ts`, `server/lib/websocket-handler.ts`

**Observed:** Two images were generated and saved to disk (5.3MB + 5.9MB), but the API returns `"images": []`. No images appear in the UI.

**Root Cause — architectural dependency on SDK stream:**

The MCP tool batches all images and returns a single `tool_result` only after ALL images complete. If the SDK stream is interrupted (cancel, crash), the entire batch's `tool_result` is lost — even for images already saved to disk.

**Fix — Real-time EventEmitter side-channel:**

1. **New file `server/lib/image-events.ts`:** Shared `EventEmitter` singleton + session ID mapping (`mcpSessionId → wsSessionId`). The AI model passes a human-readable name (e.g. `"mostunderated"`) to the MCP tool, but the WS handler uses a UUID — the mapping bridges this gap.

2. **Modified `nano-banana-mcp.ts`:** After each individual image is downloaded and saved to disk, emits `image-saved` event with full metadata (sessionId, imageIndex, hookType, prompt, filename, urlPath).

3. **Modified `websocket-handler.ts`:**
   - Registers `onImageSaved` listener before SDK query starts
   - On each event: resolves MCP sessionId → WS sessionId via mapping, persists to DB, broadcasts to client
   - Creates mapping when `tool_use` block for `mcp__nano-banana__generate_ad_images` is detected in SDK stream
   - Deduplicates via `processedImageIndices` Set — EventEmitter is primary path, SDK stream `tool_result` is fallback
   - Cleans up listener + mapping in `finally` block

**Result:** Images appear in the UI one-by-one as they're generated, and are persisted to DB immediately. Cancel after image N preserves images 1 through N.

---

## Bug 5: Cancel Doesn't Stop In-Flight fal.ai Requests

**Severity:** Low (inherent limitation)
**Status:** Won't fix (inherent limitation of external API calls; mitigated by Bug 4 fix — images generated before cancel are now preserved)
**Files:** `server/lib/ai-client.ts`, MCP nano-banana

**Observed:** Cancel was sent at 10:08:26. Image 2's fal.ai response arrived at 10:08:56 — 30 seconds after cancel. The MCP server continued processing and saved the file.

**Evidence:**
```
Line 185: 🛑 Cancel received
Line 209: ✅ Image 2 API response (50098ms after start)
Line 221: Generation complete: 2/2 images successful
```

**Root Cause:** `abortController.abort()` kills the Claude SDK child process, but the HTTP request to fal.ai is already in flight on fal.ai's servers. There is no mechanism to cancel an external API call once the request has left the server. The MCP nano-banana server's fal.ai client still receives the response and saves it to disk.

**Impact:** Wasted API credits and disk writes for unwanted images. The MCP server's "Generation complete" log is misleading after cancel.

---

## Bug 6: Anonymous WebSocket Connection on Page Load

**Severity:** Low
**Status:** Fixed (2026-01-30)
**Files:** `client/src/lib/websocket-manager.ts`, `client/src/App.tsx`

**Observed:** Between two authenticated connections, a WebSocket connects as `anonymous` then immediately disconnects.

**Evidence (before fix):**
```
Line 87: 🔗 Client connected (user: user_38uxIJd...)
Line 88: 🔌 Client disconnected
Line 89: 🔗 Client connected (user: anonymous)
Line 90: 🔌 Client disconnected
Line 91: 🔗 Client connected (user: user_38uxIJd...)
```

**Root Cause:** The WebSocket manager connected on a fixed 500ms delay after component mount (`CONNECT_DELAY`), racing against Clerk's async initialization. On page load, `clerk.getToken()` was not ready yet, so the connection fell through to anonymous auth. This was worse in production where Clerk requires a network round-trip to validate the session cookie (200-800ms), making the 500ms delay insufficient.

React StrictMode amplified the issue: the first mount's `connect()` fired before Clerk had a valid JWT, producing an anonymous connection. StrictMode's unmount/remount cycle then disconnected and reconnected — by which time Clerk had loaded, so the second connection was authenticated.

**Fix — Auth-gated connection architecture:**

Replaced the fixed-delay approach with an explicit auth-ready signal:

1. **`websocket-manager.ts`:** Removed `CONNECT_DELAY` and auto-connect from `subscribe()`. Added `connectWithAuth(tokenGetter?)` as the single connection trigger. `subscribe()` now only does ref counting. `connect()` is gated on an `authReady` flag (set by `connectWithAuth`). Stored `tokenGetter` is reused on reconnects so they are always authenticated.

2. **`App.tsx`:** `AuthenticatedApp` calls `wsManager.connectWithAuth(stableTokenGetter)` in a `useEffect` gated on `isLoaded && isSignedIn`. `DevModeApp` calls `wsManager.connectWithAuth()` immediately on mount (no token needed).

**Result:** Single authenticated connection per page load. Zero anonymous connections. Server logs show only the real user ID on connect.

---

## Bug 7: Images Disappear on Page Refresh (API Field Mismatch)

**Severity:** High
**Status:** Fixed (2026-01-30)
**Files:** `client/src/lib/api.ts`

**Observed:** Images render correctly during generation, but disappear on page refresh showing a loading skeleton. Research, hooks, and prompts data loads fine — only images are affected.

**Root Cause:** The client's `ApiImage` interface was out of sync with the DB schema. It defined `url: string` and `hook_number: number`, but the API returns the raw DB columns `file_path` and `image_index`. The `transformCampaign` function mapped `img.url` which was `undefined`, so all images got `url: undefined` on refresh. During generation, images came through WebSocket (which uses `urlPath`) and worked fine.

**Fix:** Updated `ApiImage` interface to match actual DB columns (`file_path` instead of `url`, `image_index` instead of `hook_number`). Updated transform to map `url: img.file_path`.

---

## Dependency Graph

```
Bug 1 (multiple connections) ──amplifies──> Bug 2 (chat disappears)    [Both FIXED]
                                                     │
Bug 4 (images lost) <──────shares root cause─────────┘                 [FIXED]
         │                  (stream dependency)
         │
Bug 5 (fal.ai continues) ──related──> Bug 4                           [Won't fix]

Bug 3 (error vs cancelled) ──independent──                             [FIXED]

Bug 6 (anonymous connect) ──independent──                              [FIXED]

Bug 7 (images vanish on refresh) ──independent──                       [FIXED]
```

**Summary:** All bugs resolved. Bug 5 won't fix (inherent limitation of external API calls).
