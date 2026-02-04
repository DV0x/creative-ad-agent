# Chat-First Creative Studio - Implementation Plan

**Created:** January 28, 2026
**Last Updated:** January 29, 2026
**Status:** Phases 1-9 Complete, Phase 10 In Progress, Phase 11 (Bug Fixes) Complete

---

## Overview

Transform the wizard-style flow into a chat-first experience where generation happens inline within the chat, with images displayed in the main content area.

```
BEFORE                                 AFTER
──────                                 ─────
Landing → GeneratingView → Results     Landing → Workspace (chat + images)
           (terminal UI)                         (thinking block in chat)
```

---

## Progress Summary

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Backend Changes | ✅ Complete |
| Phase 2 | Type Definitions | ✅ Complete |
| Phase 3 | Store Updates | ✅ Complete |
| Phase 4 | New Components | ✅ Complete |
| Phase 5 | Layout Updates | ✅ Complete |
| Phase 6 | Chat Sidebar Updates | ✅ Complete |
| Phase 7 | WebSocket Hook Updates | ✅ Complete |
| Phase 8 | Landing Page Updates | ✅ Complete |
| Phase 9 | Cleanup | ✅ Complete |
| Phase 10 | Testing & Polish | In Progress |
| Phase 11 | Bug Fixes (Bugs 1-5) | ✅ Complete |

---

## Phase 1: Backend Changes ✅

### 1.1 File Events
**File:** `server/lib/websocket-handler.ts`
- [x] Emit `file` event when agent writes campaign files
- [x] Detect Write tool calls and extract file type from path
- [x] Structure: `{ type: 'file', fileType, content, path }`

### 1.2 Image Events with Hook Type
**File:** `server/lib/nano-banana-mcp.ts`
- [x] Include `hookType` in image results
- [x] Include `imageIndex` for ordering (1-6)
- [x] Map: 1=stat, 2=story, 3=fomo, 4=curiosity, 5=callout, 6=contrast

**File:** `server/lib/websocket-handler.ts`
- [x] Extract imageIndex from image id
- [x] Include hookType and imageIndex in image events

### 1.3 Complete Event with Summary
**File:** `server/lib/websocket-handler.ts`
- [x] Generate summary listing hook types created
- [x] Include summary in complete event

---

## Phase 2: Type Definitions ✅

**File:** `client/src/types/chat.ts`
- [x] `HookType` = 'stat' | 'story' | 'fomo' | 'curiosity' | 'callout' | 'contrast'
- [x] `ThinkingLineType` = 'phase' | 'tool' | 'result' | 'progress' | 'error' | 'success'
- [x] `ThinkingLine`, `GenerationState`, `ChatMessage` interfaces
- [x] `CampaignStatus`, `FilesReadyState`, `GeneratedImage` types
- [x] Helper functions: `getHookTypeForIndex`, `createThinkingLine`, etc.

**File:** `client/src/types/websocket.ts`
- [x] `WSFileEvent` with fileType, content, path
- [x] `WSImageEvent` with hookType, imageIndex
- [x] `WSCompleteEvent` with summary
- [x] Type guards for all event types

---

## Phase 3: Store Updates ✅

**File:** `client/src/store/index.ts`

### App State
- [x] Simplified to `'landing' | 'workspace'`
- [x] Removed: `generatingPhase`, `terminalLines`, `pendingImages`

### Campaign State
- [x] `status: CampaignStatus`
- [x] `filesReady: FilesReadyState`
- [x] `generatingCampaignId` tracking
- [x] Actions: `updateCampaignFile`, `addImageToCampaign`, `replaceImage`

### Chat State
- [x] `currentGeneratingMessageId` tracking
- [x] Actions: `addThinkingLine`, `collapseThinking`, `toggleThinking`

### Image Selection
- [x] `selectedImageIds: number[]`
- [x] Actions: `toggleImageSelection`, `clearImageSelection`, `getSelectedImages`

### Generation Flow
- [x] `startGeneration(sessionId, name)` → `{ campaignId, messageId }`
- [x] `completeGeneration(campaignId, messageId, summary)`
- [x] `cancelGeneration`, `failGeneration`

---

## Phase 4: New Components ✅

### ThinkingBlock
**File:** `client/src/components/chat/ThinkingBlock.tsx`
- [x] Collapsible container with "Thinking" header
- [x] Renders thinking lines with indentation
- [x] Phase indicators (● active, ✓ complete)
- [x] Image progress counter

### ImageChip
**File:** `client/src/components/chat/ImageChip.tsx`
- [x] Compact display with thumbnail
- [x] Remove button (×)
- [x] Hook type label

### ImageCard Updates
**File:** `client/src/components/ImageCard.tsx`
- [x] Selection checkbox (visible on hover)
- [x] Selection ring when selected
- [x] Hook type label
- [x] Skeleton loading state

### ResultsView Updates
**File:** `client/src/components/ResultsView.tsx`
- [x] Image grid with selection
- [x] Skeleton cards during generation
- [x] Selection count in header

---

## Phase 5: Layout Updates ✅

**File:** `client/src/components/layout/AppLayout.tsx`
- [x] Workspace detection: `appState === 'workspace'`
- [x] Chat sidebar always visible in workspace

**File:** `client/src/App.tsx`
- [x] Routing: landing → EmptyState, workspace → ResultsView

---

## Phase 6: Chat Sidebar Updates ✅

### ChatInput Component
**File:** `client/src/components/chat/ChatInput.tsx`
- [x] Extracted from ChatSidebar
- [x] Displays selected images as ImageChip components
- [x] Includes imageRefs when sending
- [x] Clears selection after send
- [x] Shows "Regenerate" when images selected

### AssetMention Updates
**File:** `client/src/components/mentions/AssetMention.tsx`
- [x] Campaign images in @ mention picker
- [x] Format: `@image-1` with hook type description
- [x] Syncs with click-to-select via store

---

## Phase 7: WebSocket Hook Updates ✅

**File:** `client/src/hooks/useWebSocket.ts`
- [x] Handles all event types: phase, tool_start, file, image, complete, error
- [x] `file` event → `updateCampaignFile()`
- [x] `image` event → `addImageToCampaign()` with hookType
- [x] `complete` event → `completeGeneration()` with summary
- [x] Session recovery on reconnect

---

## Phase 8: Landing Page Updates ✅

**File:** `client/src/components/EmptyState.tsx`
- [x] Create button calls `generate()` from useWebSocket
- [x] Recent campaigns transition to workspace
- [x] Connection status indicator

---

## Phase 9: Cleanup ✅

- [x] Deleted `GeneratingView.tsx`
- [x] Removed deprecated store fields
- [x] Fixed imports

---

## Phase 10: Testing & Polish

### 10.1 Generation Flow
- [ ] Landing → Create → Workspace transition
- [ ] Thinking block updates in real-time
- [ ] Images appear one-by-one with hookType
- [ ] Files sync from backend
- [ ] Thinking collapses on complete
- [ ] Summary message appears

### 10.2 Image Selection
- [ ] Click to select/deselect
- [ ] Checkbox on hover
- [ ] Selection ring visible
- [ ] Chips appear in ChatInput
- [ ] @ mention adds to selection
- [ ] Selection clears after send

### 10.3 Edge Cases
- [ ] Cancel during generation (see Bug 3 — still open)
- [ ] Disconnect/reconnect recovery
- [ ] Error handling

### 10.4 Polish
- [ ] Animations (thinking expand/collapse)
- [ ] Skeleton → image transition
- [ ] Mobile responsive

---

## Phase 11: Bug Fixes ✅

Bugs found during Phase 10 testing. See `docs/BUGS.md` for original reports.

### 11.1 Bug 1: Chat history lost on refresh ✅
**Severity:** High | **Fixed by:** Three-layer persistence model

See `docs/CHAT_PERSISTENCE_ARCHITECTURE.md` for full architecture.

**Summary:** Messages were never written to the DB during generation, and never loaded from DB on refresh. Fixed with:
- **Server** (`websocket-handler.ts`): Writes user message on generation start, assistant message on complete/cancel/error
- **Client** (`App.tsx`): Loads messages from `campaignsApi.get()` response into Zustand
- **Recovery**: Event buffer replay reconstructs thinking block mid-generation

### 11.2 Bug 2: Prompt lost after login redirect ✅
**Severity:** Medium | **Root cause:** Clerk sign-in reloads the page, wiping Zustand

**Fix:** sessionStorage bridge + auto-generate after auth

**Files changed:**
- `client/src/store/index.ts` — Added `pendingGeneration` flag and `setPendingGeneration` setter
- `client/src/components/EmptyState.tsx` — Saves prompt to `sessionStorage` before `requireAuth()`. Added `useEffect` to auto-call `generate()` when `pendingGeneration` + `isConnected`
- `client/src/App.tsx` — After sign-in + data loaded, detects pending prompt from `sessionStorage`, restores to store, sets `pendingGeneration`
- `client/src/components/layout/AppLayout.tsx` — Auto-opens chat sidebar (desktop: `rightOpen`, mobile: `mobileDrawerOpen`) when entering workspace with active generation

**Flow after fix:**
1. User types prompt → clicks Create → prompt saved to `sessionStorage`
2. Clerk sign-in → page reloads
3. App loads → auth confirmed → data loads from API
4. Pending prompt detected → restored to store → `pendingGeneration = true`
5. EmptyState auto-generates → workspace opens → chat drawer opens

### 11.3 Bug 3: Cancel does not stop generation
**Severity:** High | **Status:** Open

Two disconnected `AbortController`s: the WebSocket handler's and the SDK's. Cancel aborts the handler's controller, but the SDK has its own. Long-running tool calls (e.g., image generation) block the abort check.

**Affected files:**
- `server/lib/websocket-handler.ts` — cancel handler
- `server/lib/ai-client.ts` — `queryWithSession()` creates its own abort controller

### 11.4 Bug 4: API 400 errors on file save / campaign rename ✅
**Severity:** Medium | **Root cause:** Two independent issues

**Issue 1 — Campaign ID mismatch (structural fix):**

Client and server created campaigns independently with different ID formats:
- Client: `campaign-{timestamp}-{random}` (Zustand `generateId()`)
- Server: `campaign_{base36ts}{base36rand}` (DB `generateId()`)

Any REST API call from the client using the client-generated ID would 404 because the server DB had a different ID. They were only linked by `sessionId`, not `campaignId`.

**Fix:** Server sends DB campaign ID in the WebSocket `ack` message. Client adopts it immediately.

**Files changed:**
- `server/lib/websocket-handler.ts` — Moved campaign DB creation before `ack` message. Ack now includes `campaignId`
- `client/src/types/websocket.ts` — Added `campaignId` and `sessionId` to `WSAckEvent`
- `client/src/store/index.ts` — Added `replaceCampaignId(oldId, newId)` that atomically updates the campaign `id`, `activeCampaignId`, and `generatingCampaignId`
- `client/src/hooks/useWebSocket.ts` — `ack` handler extracts server campaign ID, calls `replaceCampaignId`, updates `campaignIdRef` and localStorage session

**Issue 2 — tsx watch crash (see Bug 5):**
Server was temporarily unavailable during hot-reload, returning 400/502 via Vite proxy.

### 11.5 Bug 5: iconv-lite module error during tsx watch ✅
**Severity:** Low (dev only) | **Root cause:** `tsx watch` monitoring SQLite DB files

SQLite database (`server/data/creative_agent.db`) is inside the watch directory. Every DB write (campaign CRUD, file saves, image persistence) triggers hot-reload via WAL journal files (`.db-wal`, `.db-shm`). During reload, `iconv-lite` fails to resolve, crashing the server.

**Fix:** Added `--ignore` flags to the dev script.

**File changed:**
- `server/package.json` — `"dev": "tsx watch --ignore='./data/**' --ignore='./sessions/**' --ignore='./generated-images/**' ..."`

---

## Files Changed Summary

### New Files
| File | Purpose |
|------|---------|
| `client/src/types/chat.ts` | Chat, campaign, image types |
| `client/src/types/index.ts` | Type re-exports |
| `client/src/components/chat/ThinkingBlock.tsx` | Generation progress |
| `client/src/components/chat/ImageChip.tsx` | Selected image chip |
| `client/src/components/chat/ChatInput.tsx` | Input with image chips |

### Modified Files
| File | Changes |
|------|---------|
| `server/lib/websocket-handler.ts` | File events, hookType in images, summary, message persistence (Bug 1), campaign ID in ack (Bug 4) |
| `server/lib/nano-banana-mcp.ts` | hookType and imageIndex in results |
| `server/package.json` | `--ignore` flags for tsx watch (Bug 5) |
| `client/src/store/index.ts` | Major refactor for chat-first, `pendingGeneration` flag (Bug 2), `replaceCampaignId` (Bug 4) |
| `client/src/types/websocket.ts` | New event types, `campaignId` on WSAckEvent (Bug 4) |
| `client/src/hooks/useWebSocket.ts` | Event handling refactor, ack handler adopts server campaign ID (Bug 4) |
| `client/src/App.tsx` | Data loading, message loading (Bug 1), pending prompt restore after auth (Bug 2) |
| `client/src/components/EmptyState.tsx` | sessionStorage prompt save, auto-generate after auth (Bug 2) |
| `client/src/components/layout/AppLayout.tsx` | Auto-open chat drawer on generation start (Bug 2) |
| `client/src/components/chat/ChatSidebar.tsx` | Uses ChatInput, ThinkingBlock |
| `client/src/components/chat/MobileChatDrawer.tsx` | Uses ChatInput, ThinkingBlock |
| `client/src/components/mentions/AssetMention.tsx` | Campaign images |
| `client/src/components/ImageCard.tsx` | Selection, hookType, skeleton |
| `client/src/components/ResultsView.tsx` | Selection wiring |

### Deleted Files
| File | Reason |
|------|--------|
| `client/src/components/GeneratingView.tsx` | Replaced by ThinkingBlock in chat |

---

## Open Issues

- **Bug 3: Cancel does not stop generation** — Two disconnected abort controllers. Needs the handler to pass its signal into `aiClient.queryWithSession()`.

---

## Future Enhancements

- Save All / Share buttons in workspace header
- Backend handling of imageRefs for actual regeneration
- Cloud storage with Cloudflare D1/R2

---

*Last updated: January 29, 2026*
