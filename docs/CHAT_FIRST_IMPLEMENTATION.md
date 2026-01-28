# Chat-First Creative Studio - Implementation Plan

**Created:** January 28, 2026
**Last Updated:** January 28, 2026
**Status:** Phases 1-9 Complete, Phase 10 (Testing) Remaining

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
| Phase 10 | Testing & Polish | Not Started |

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
- [ ] Cancel during generation
- [ ] Disconnect/reconnect recovery
- [ ] Error handling

### 10.4 Polish
- [ ] Animations (thinking expand/collapse)
- [ ] Skeleton → image transition
- [ ] Mobile responsive

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
| `server/lib/websocket-handler.ts` | File events, hookType in images, summary |
| `server/lib/nano-banana-mcp.ts` | hookType and imageIndex in results |
| `client/src/store/index.ts` | Major refactor for chat-first |
| `client/src/types/websocket.ts` | New event types |
| `client/src/hooks/useWebSocket.ts` | Event handling refactor |
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

## Future Enhancements

- Save All / Share buttons in workspace header
- Backend handling of imageRefs for actual regeneration
- Cloud storage with Cloudflare D1/R2
- User authentication

---

*Last updated: January 28, 2026*
