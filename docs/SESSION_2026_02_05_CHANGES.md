# Session Changes - February 5, 2026

## Summary

This session focused on two main features:
1. **Fixing AI response persistence** - AI responses were showing generic messages like "Follow-up completed." after refresh instead of the actual response
2. **Adding thinking block persistence** - The collapsible workflow blocks (phases, tools, progress) were lost on refresh

---

## Changes Made

### 1. AI Text Accumulation (Server)

**Problem:** After refresh, assistant messages only showed "Generation complete." or "Follow-up completed." instead of the actual AI response.

**Root Cause:** The AI's text responses (sent via WebSocket `type: 'message'` events) were broadcast to the client but never accumulated for database storage. Only hardcoded summaries were saved.

**Fix:** Added `TextAccumulator` to capture AI text during streaming.

**File:** `server/lib/websocket-handler.ts`
- Added `TextAccumulator` interface (line ~148)
- Updated `processSDKMessage` to accept and populate accumulator (line ~153)
- Used accumulated text when saving assistant messages in both `handleGenerate` and `handleFollowUp`

---

### 2. Thinking Block Persistence (Server + Client + Database)

**Problem:** The collapsible thinking blocks showing workflow phases, tool calls, and progress were lost on refresh.

#### Database Changes

**File:** `server/lib/database.ts`
- Added migration to add `blocks` column to `messages` table (line ~144)

**File:** `server/lib/db/messages.ts`
- Added block type definitions: `TextBlockData`, `ThinkingBlockData`, `ThinkingChild`, `StatusBlockData`, `MessageBlock`
- Updated `Message` interface to include `blocks: string | null`
- Updated `AddMessageInput` to accept optional `blocks` array
- Updated `addMessage()` to save blocks as JSON

**File:** `server/lib/db/index.ts`
- Exported new block types

#### Server-Side Block Building

**File:** `server/lib/websocket-handler.ts`
- Added `BlockBuilder` class (lines ~152-230) with methods:
  - `openThinkingBlock(label, expectedImages)` - Opens a new thinking block for a phase
  - `addThinkingChild(kind, text, variant)` - Adds tool/phase/status children
  - `incrementCompletedImages()` - Tracks image progress
  - `closeThinkingBlock(status)` - Closes with 'complete' or 'error'
  - `addTextBlock(content)` - Adds final text summary
  - `addStatusBlock(text, variant)` - Adds status messages
  - `getBlocks()` - Returns final blocks array, filtering empty thinking blocks

- Updated `processSDKMessage` to:
  - Accept `blockBuilder` parameter
  - Add tool children with friendly display names
  - Open thinking blocks when phases are detected

- Updated `handleGenerate`:
  - Creates `BlockBuilder` instance
  - Opens initial "Parsing Request" thinking block
  - Passes builder to `processSDKMessage`
  - Saves blocks to DB on completion/cancel/error

- Updated `handleFollowUp`:
  - Same pattern as `handleGenerate`
  - Opens "Processing Follow-up" thinking block

#### Client-Side Block Loading

**File:** `client/src/lib/api.ts`
- Updated `ApiMessage` interface to include `blocks: string | null`
- Updated `transformMessage()` to:
  - Parse blocks JSON
  - Convert timestamps from ISO strings to Date objects
  - Set thinking blocks to collapsed by default

#### Client-Side Block Display

**File:** `client/src/components/chat/blocks/ThinkingBlock.tsx`
- Fixed hardcoded "Thinking" label to use `block.label`
- Now shows actual phase names: "Researching", "Generating Hooks", "Generating Images", etc.

---

### 3. Bug Fixes

#### Store: Preserve messages from other campaigns

**File:** `client/src/store/index.ts`
- Fixed `startGeneration` to spread `...state.chatMessages` instead of replacing all messages

---

## Known Issues (To Investigate Next Session)

### 1. Missing User Message in Chat

**Symptom:** After running a generation, the user's prompt message doesn't appear in the chat - only the assistant's response with thinking blocks.

**Investigation Done:**
- Database has both user and assistant messages (verified via SQLite query)
- `startGeneration` correctly creates both messages in the store
- `ChatMessage` component renders user messages correctly
- `getActiveChatMessages` returns messages for active campaign

**Possible Causes:**
- State timing issue between `addCampaign` and `startGeneration` set calls
- React rendering issue
- Scroll position issue (message scrolled out of view)

**Next Steps:**
1. Add console logging to trace message flow
2. Check if `activeCampaignId` matches the campaign with messages
3. Verify messages array in React DevTools
4. Check browser console for errors

### 2. Thinking Block Children May Be Empty

**Symptom:** For simple text responses (no tools), thinking blocks are created but have no children.

**Current Behavior:** Empty thinking blocks are now filtered out in `BlockBuilder.getBlocks()`

**For Real Generations:** Need to verify that tool calls are being captured correctly. Test with a full generation (URL → research → hooks → images) to confirm children are populated.

---

## Testing Checklist

After restarting servers, test these scenarios:

### Text Persistence
- [ ] Run a generation → refresh → AI response text should persist
- [ ] Run a follow-up → refresh → follow-up response should persist
- [ ] Cancel a generation → refresh → "cancelled" message should show

### Thinking Block Persistence
- [ ] Run a full generation with URL → refresh → thinking blocks should show with:
  - [ ] Correct phase labels (not "Thinking")
  - [ ] Tool calls as children (when expanded)
  - [ ] Image progress (if applicable)
- [ ] Thinking blocks should be collapsed by default after refresh

### User Message Display
- [ ] Run a generation → user prompt should appear at top of chat
- [ ] Refresh page → both user and assistant messages should load from DB

---

## Files Changed

### Server
- `server/lib/database.ts` - Migration for blocks column
- `server/lib/db/messages.ts` - Block types and storage
- `server/lib/db/index.ts` - Type exports
- `server/lib/websocket-handler.ts` - BlockBuilder class, text accumulation

### Client
- `client/src/lib/api.ts` - Block parsing in transformMessage
- `client/src/store/index.ts` - Fixed startGeneration message spreading
- `client/src/components/chat/blocks/ThinkingBlock.tsx` - Fixed label display

---

## Quick Reference: Key Code Locations

| Feature | File | Function/Class |
|---------|------|----------------|
| Block building | `server/lib/websocket-handler.ts` | `BlockBuilder` class |
| Text accumulation | `server/lib/websocket-handler.ts` | `TextAccumulator`, `processSDKMessage` |
| Message persistence | `server/lib/websocket-handler.ts` | `handleGenerate`, `handleFollowUp` |
| Block types | `server/lib/db/messages.ts` | `MessageBlock`, `ThinkingBlockData`, etc. |
| Block loading | `client/src/lib/api.ts` | `transformMessage()` |
| Block display | `client/src/components/chat/blocks/ThinkingBlock.tsx` | `ThinkingBlock` |
| Chat messages | `client/src/store/index.ts` | `startGeneration`, `getActiveChatMessages` |

---

## Commands to Start Next Session

```bash
# Start backend
cd server && npm run dev

# Start frontend (separate terminal)
cd client && npm run dev

# Check database
sqlite3 server/data/creative_agent.db "SELECT id, role, substr(content,1,50), blocks IS NOT NULL FROM messages ORDER BY created_at DESC LIMIT 5;"
```
