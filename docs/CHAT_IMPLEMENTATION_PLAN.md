# Chat & Session Management Implementation Plan

## Overview

Turn the chat sidebar from a "one-shot generation viewer" into a **real conversation** — like ChatGPT or Claude. Users generate a campaign, then talk to the AI about it: "change the hooks", "make image 3 more vibrant", etc.

**Three chunks:**
- **Chunk A** — Fix bugs in the current chat (make what we have work reliably)
- **Chunk B** — Better message display with structured blocks (make it look polished)
- **Chunk C** — Real follow-up chat with the AI (make the conversation actually work)

---

## Current State (as of 2026-02-03)

**What works:**
- Initial generation via WebSocket (user types prompt, AI generates images/files)
- Block-based ThinkingBlock shows progress (tools, phases, text, status children, image counter)
- Final summary renders as a separate TextBlock message bubble
- Session recovery on refresh (localStorage + event buffer replay)
- WebSocket singleton with auth-gated connection
- SDK stream lifecycle — generation completes cleanly, `result` message flows through (A.5 fixed)
- MCP image generation — nano-banana tool executes, images saved to disk (A.5 fixed)
- **Chunk A complete** — prompt race fixed, store actions reliable, re-renders minimized, duplicate component removed
- **Chunk B complete** — block-based message display with single-thinking-block-with-children pattern
- **Chunk C (C.1–C.9) complete** — real follow-up chat via SDK session resume, concurrency guard, phase detection fix

**What's not built yet:**
- C.10: @mention file context injection (deferred — AI currently has to Glob for files on disk during follow-ups)

**Known issue from testing (2026-02-03):**
- Follow-up AI doesn't have automatic access to campaign files (research/hooks/prompts) from DB. It tries to Glob on disk, often fails to find them. C.10 will fix this by injecting file content into the prompt server-side.

---

## Chunk A: Fix Bugs ✅ Complete

All items implemented and manually verified on 2026-02-02.

### A.1 — Fix prompt race condition ✅

**Problem:** `generate()` read prompt from a `promptRef` synced via `useEffect` — stale/blank prompt reached the server.

**Fix applied:**
- `generate()` → `generate(prompt: string)` — prompt passed as direct parameter
- `startGeneration()` → `startGeneration(sessionId, campaignName, prompt)` — also takes prompt directly (regression fix: user message content and image count parsing both depended on `state.prompt`)
- Removed `promptRef` and its `useEffect` sync from `useWebSocket.ts`
- `ChatSidebar.tsx`: removed `setPrompt()` + `setTimeout` hack, calls `generate(message.content.trim())` directly
- `EmptyState.tsx`: passes `prompt.trim()` to `generate()`, pending generation effect falls back to sessionStorage

### A.2 — Fix store actions dropping events ✅

**Problem:** Store actions read `state.generatingCampaignId` internally — returned `null` after completion (events dropped) or fell back to `activeCampaignId` (wrong campaign modified).

**Fix applied:**
- 7 message-mutation actions now take `campaignId` as explicit first parameter: `addThinkingLine`, `appendMessageContent`, `incrementCompletedImages`, `toggleThinking`, `collapseThinking`, `setMessageContent`, `updateMessageGeneration`
- Removed all internal reads of `state.generatingCampaignId` and `|| state.activeCampaignId` fallbacks
- Updated 12 call sites in `useWebSocket.ts` to pass `campaignId` explicitly
- `ChatMessage.tsx`: `toggleThinking` passes `message.campaignId`

### A.3 — Fix re-render storm ✅

**Problem:** `useWebSocket()` destructured ~20 values from `useStore()` — every state change triggered re-renders of all consuming components.

**Fix applied:**
- Replaced broad destructuring with two targeted selectors: `useStore(state => state.connectionState)` and `useStore(state => state.isRecovering)`
- All actions read via `useStore.getState()` inside callbacks (e.g., `const store = useStore.getState()` at top of `handleMessage`)
- `addThinking` wrapper uses `useCallback([], [])` with `getState()` internally
- All `useCallback` dependency arrays simplified (most are `[addThinking]` or `[]`)
- Re-renders reduced from "every state change" to "only when connectionState or isRecovering changes"

### A.4 — Remove duplicate ChatMessageComponent ✅

**Problem:** `ChatSidebar.tsx` had an inline `ChatMessageComponent` (60 lines) — the standalone `ChatMessage.tsx` was never imported.

**Fix applied:**
- Deleted inline component + `formatTime` helper from `ChatSidebar.tsx`
- Imports `ChatMessage` from `./ChatMessage` (the better version with file/image ref badges)
- Removed unused `cn` and `ChatMessage` type imports

### A.5 — Previously fixed bugs (verified) ✅

No changes needed — these were already working:
- Text truncation fix, SDK stream deadlock fix (dual AbortController), WS reconnection, past messages loading

### Chunk A Verification (Passed)

1. ✅ Prompt reaches server correctly every time (tested from both EmptyState and ChatSidebar)
2. ✅ Generation runs to completion
3. ✅ ThinkingBlock shows all events (no dropped events)
4. ✅ "Single ad" correctly shows 1 image placeholder (not 6)
5. ✅ User message content visible in chat bubble

---

## Chunk B: Block-Based Message Display ✅ Complete

All items implemented and manually verified on 2026-02-02.

Make assistant messages look like Claude/ChatGPT — structured blocks instead of a flat text blob.

**Important design decision:** Blocks are **ephemeral** (live in Zustand only during generation). When messages are loaded from the database on refresh, they render as plain text. This is the same behavior as Claude and ChatGPT — you see the final text, not the thinking process.

**Key architectural decision (during implementation):** All WS events funnel into a **single collapsible thinking block** as children, rather than creating separate top-level blocks per event. Only the final summary appears as a separate text block (message bubble). `ThinkingChild.kind` was extended to `'phase' | 'tool' | 'result' | 'progress' | 'error' | 'text' | 'status'` with an optional `variant` field for status children.

### B.1 — Define block types ✅

**File:** `client/src/types/chat.ts`

Added `MessageBlock` union type, `TextBlockData`, `ThinkingBlockData`, `StatusBlockData`, and extended `ThinkingChild` with 7 kinds + optional `variant`. Added `blocks?: MessageBlock[]` to `ChatMessage`. Removed old types (`ThinkingLine`, `ThinkingLineType`, `GenerationState`, `GenerationStatus`) in B.6.

### B.2 — Add block actions to store ✅

**File:** `client/src/store/index.ts`

Added 7 block actions: `appendTextBlock`, `openThinkingBlock`, `addThinkingChild`, `closeThinkingBlock`, `updateThinkingImages`, `addStatusBlock`, `toggleBlockExpanded`. Also added `generateBlockId()` helper and extracted `parseExpectedImageCount()` as a shared helper (used by both `startGeneration` and `reconstructForRecovery`).

### B.3 — Rewire useWebSocket to build blocks ✅

**File:** `client/src/hooks/useWebSocket.ts`

Replaced all old thinking line calls with block actions. Single thinking block opened at generation start; all events funnel as children:

| WS Event | Block Action |
|-----------|-------------|
| `generate()` start | `openThinkingBlock(cid, mid, 'Starting generation...')` |
| `phase` | `addThinkingChild(cid, mid, { kind: 'phase', text: label })` |
| `tool_start` | `addThinkingChild(cid, mid, { kind: 'tool', text })` |
| `message` | `appendMessageContent(...)` + `addThinkingChild({ kind: 'text', text })` |
| `file` | `updateCampaignFile(...)` + `addThinkingChild({ kind: 'status', text, variant: 'info' })` |
| `image` | `addImageToCampaign(...)` + `updateThinkingImages(cid, mid, imageIndex)` |
| `complete` | `closeThinkingBlock('complete')` + `appendTextBlock(summary)` + `completeGeneration(...)` |
| `error` | `closeThinkingBlock('error')` + `appendTextBlock(errorMsg)` + `failGeneration(...)` |
| `ack` | `addThinkingChild({ kind: 'progress', text: 'Generation started' })` |

### B.4 — Create block renderer components ✅

Created 4 new files under `client/src/components/chat/blocks/`:
- **`BlockRenderer.tsx`** (32 lines) — Routes `MessageBlock[]` to correct component
- **`ThinkingBlock.tsx`** (184 lines) — Collapsible block rendering all child kinds with appropriate icons, image counter in header, auto-scroll, max-h-64
- **`TextBlock.tsx`** (17 lines) — Message bubble for final summary
- **`StatusBlock.tsx`** (34 lines) — Pill/chip with info/success/error variants (currently unused as standalone — status events go inside thinking block as children)

### B.5 — Update ChatMessage to render blocks ✅

**File:** `client/src/components/chat/ChatMessage.tsx` (90 lines)

If `hasBlocks` → `BlockRenderer` with `toggleBlockExpanded` callback. Else → plain text bubble for DB-loaded messages. Also updated `MobileChatDrawer.tsx` to use `BlockRenderer`.

### B.6 — Clean up old types ✅

Removed all old types and actions:
- Deleted: `ThinkingLine`, `ThinkingLineType`, `GenerationState`, `GenerationStatus`, `createEmptyGenerationState`, `createThinkingLine` from `types/chat.ts`
- Deleted: `generation?: GenerationState` from `ChatMessage` interface
- Deleted: `addThinkingLine`, `updateMessageGeneration`, `collapseThinking`, `toggleThinking`, `incrementCompletedImages` from store
- Deleted: old `client/src/components/chat/ThinkingBlock.tsx` (replaced by `blocks/ThinkingBlock.tsx`)
- Updated `types/index.ts` re-exports to remove old types and add new block types

### Chunk B Verification (Passed)

1. ✅ Run a generation — ThinkingBlock animates with tools/phases as children, collapses on completion
2. ✅ Final summary appears as a separate TextBlock (message bubble) below the collapsed thinking block
3. ✅ File events show as status children inside thinking block ("research.md created")
4. ✅ Image counter updates in thinking block header as images arrive
5. ✅ Refresh the page — past messages render as plain text (blocks are ephemeral, expected)
6. ✅ "Single ad" correctly shows 1 image placeholder (parseExpectedImageCount fix)

**Bugs found and fixed during B:**
- Image grid showing 6 placeholders after refresh → `reconstructForRecovery` now uses `parseExpectedImageCount(prompt)` and includes `generationExpectedImages` in its `set()` call
- Blocks rendered flat in chat → redesigned to single-thinking-block-with-children pattern (extended `ThinkingChild.kind`)

---

## Chunk C: Real Follow-Up Chat ✅ C.1–C.9 Complete (2026-02-03)

Wire the chat input to actually talk to the AI after generation is done.

**Staff review findings (2026-02-03):** The original plan was ~85% correct. Key revisions:
- Added concurrency guard for concurrent follow-ups (race condition)
- Replaced 4 separate store calls with atomic `startFollowUp` action
- Fixed `getCampaignById` signature (requires `userId` param)
- Added phase detection cleanup (false positives during follow-ups)
- Added event buffer TTL reset for long-lived sessions

### C.1 — Add `sdk_session_id` to database

**File:** `server/lib/database.ts`

Add column migration (safe to run multiple times). Also add to `SCHEMA_SQL` for fresh databases:

```typescript
// In SCHEMA_SQL string, add to campaigns table:
//   sdk_session_id TEXT

// After schema creation, run migration for existing databases:
try {
  db.exec(`ALTER TABLE campaigns ADD COLUMN sdk_session_id TEXT`);
} catch { /* column already exists */ }

db.exec(`CREATE INDEX IF NOT EXISTS idx_campaigns_sdk_session_id ON campaigns(sdk_session_id)`);
```

**File:** `server/lib/db/campaigns.ts`

Add `sdk_session_id` to the `Campaign` interface:
```typescript
export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  status: 'generating' | 'complete' | 'incomplete' | 'error' | 'cancelled';
  session_id: string | null;
  sdk_session_id: string | null;  // New
  created_at: string;
  updated_at: string;
}
```

Add two helpers:
```typescript
export function updateSdkSessionId(campaignId: string, sdkSessionId: string): void {
  db.prepare('UPDATE campaigns SET sdk_session_id = ? WHERE id = ?').run(sdkSessionId, campaignId);
}

export function getSdkSessionId(campaignId: string): string | null {
  const row = db.prepare('SELECT sdk_session_id FROM campaigns WHERE id = ?').get(campaignId) as any;
  return row?.sdk_session_id || null;
}
```

**File:** `server/lib/db/index.ts`

Add to campaigns barrel export:
```typescript
export {
  // ... existing exports ...
  updateSdkSessionId,
  getSdkSessionId,
} from './campaigns.js';
```

### C.2 — Capture SDK session ID during generation

**File:** `server/lib/websocket-handler.ts`

In `processSDKMessage`, when we see the system init message, save the SDK session ID:

```typescript
if (message.type === 'system' && message.subtype === 'init' && message.session_id) {
  if (state.campaignId) {
    db.updateSdkSessionId(state.campaignId, message.session_id);
  }
}
```

Note: `ai-client.ts` already captures this via `sessionManager.updateSdkSessionId()` (line 364), but that's in-memory only. This writes it to SQLite so it survives server restarts.

### C.3 — Add `follow_up` WebSocket message type + concurrency guard

**File:** `server/lib/websocket-handler.ts`

Add to `ClientMessage` type:
```typescript
interface ClientMessage {
  type: 'generate' | 'cancel' | 'pause' | 'resume' | 'ping' | 'subscribe' | 'follow_up';
  prompt?: string;
  sessionId?: string;
  campaignId?: string;  // New: needed for follow_up
  lastEventId?: number;
}
```

Add `isGenerating` field to `ConnectionState` (line 68) and its initialization (line 879):
```typescript
interface ConnectionState {
  // ... existing fields ...
  isGenerating: boolean;  // New: prevents concurrent follow-ups / generates
}

// In connection initialization (line 879):
const state: ConnectionState = {
  // ... existing fields ...
  isGenerating: false,
};
```

Add `handleFollowUp` function with concurrency guard:
```typescript
async function handleFollowUp(state: ConnectionState, prompt: string, campaignId: string) {
  // 0. Concurrency guard — reject if already processing
  if (state.isGenerating) {
    send(state.ws, {
      type: 'error',
      timestamp: new Date().toISOString(),
      error: 'A generation is already in progress. Please wait or cancel first.'
    });
    return;
  }
  state.isGenerating = true;

  // Track the session ID set by THIS invocation (not a previous one on state)
  // so the finally block only cleans up what we created.
  let localSessionId: string | null = null;

  // Image event listener reference for cleanup
  let onImageSaved: ((event: ImageSavedEvent) => void) | null = null;

  try {
    // 1. Look up the WS session ID and SDK session ID from the campaigns table
    //    NOTE: getCampaignById requires userId — available as state.userId
    const campaign = db.getCampaignById(campaignId, state.userId);
    if (!campaign) {
      send(state.ws, { type: 'error', timestamp: new Date().toISOString(), error: 'Campaign not found' });
      return;
    }

    const sdkSessionId = db.getSdkSessionId(campaignId);
    if (!sdkSessionId) {
      send(state.ws, { type: 'error', timestamp: new Date().toISOString(), error: 'No SDK session found for this campaign' });
      return;
    }

    const wsSessionId = campaign.session_id!;
    localSessionId = wsSessionId;

    // 2. Set up connection state (similar to handleGenerate but lighter)
    state.sessionId = wsSessionId;
    state.campaignId = campaignId;
    state.abortController = new AbortController();
    sessionAbortControllers.set(wsSessionId, state.abortController);

    // 3. Persist user message to DB
    db.addMessage({ campaignId, role: 'user', content: prompt });

    // 4. Update campaign status
    db.updateCampaignStatus(campaignId, 'generating');

    // 5. Send ack to client (so it can track the follow-up)
    emitEvent(wsSessionId, { type: 'ack', sessionId: wsSessionId, campaignId });

    // 6. Register image event listener (same pattern as handleGenerate lines 448-483)
    const processedImageIndices = new Set<number>();
    let imageCount = 0;

    onImageSaved = (event: ImageSavedEvent) => {
      const wsId = resolveWsSessionId(event.sessionId) || event.sessionId;
      if (wsId !== wsSessionId) return;
      if (processedImageIndices.has(event.imageIndex)) return;
      processedImageIndices.add(event.imageIndex);

      broadcastToConnection(state, {
        type: 'image',
        timestamp: new Date().toISOString(),
        id: event.id,
        urlPath: event.urlPath,
        prompt: event.prompt,
        filename: event.filename,
        hookType: event.hookType as HookType,
        imageIndex: event.imageIndex,
      });

      if (state.campaignId) {
        try {
          db.addCampaignImage({
            campaignId: state.campaignId,
            imageIndex: event.imageIndex,
            hookType: event.hookType as db.HookType,
            prompt: event.prompt || undefined,
            filePath: event.urlPath,
          });
        } catch (dbError) {
          console.error('DB: Failed to save image via EventEmitter:', dbError);
        }
      }
      imageCount++;
    };

    imageEvents.on('image-saved', onImageSaved);

    // 7. Initialize instrumentation (required by processSDKMessage)
    const instrumentor = new SDKInstrumentor(wsSessionId, prompt, 'websocket');

    // 8. Call AI with resume (reuses existing session history)
    let generationCompleted = false;
    let wasCancelled = false;
    const startTime = Date.now();

    for await (const result of aiClient.queryWithSession(
      prompt,
      wsSessionId,
      undefined,    // metadata
      undefined,    // attachments
      state.abortController
    )) {
      if (state.abortController?.signal.aborted && !generationCompleted) {
        wasCancelled = true;
        break;
      }

      const { message } = result;
      // NOTE: 4th arg processedImageIndices is required for image deduplication
      processSDKMessage(message, state, instrumentor, processedImageIndices);

      // Detect completion (same as handleGenerate line 543)
      if (message.type === 'result' && !generationCompleted && !wasCancelled) {
        generationCompleted = true;
        const duration = Date.now() - startTime;

        // For follow-ups, summary is the accumulated text from processSDKMessage.
        // Unlike initial generation (which builds a hook list), follow-ups just
        // use a generic completion message. The actual text was already streamed
        // to the client via 'message' events.
        const summary = 'Follow-up completed.';

        broadcastToConnection(state, {
          type: 'complete',
          timestamp: new Date().toISOString(),
          sessionId: wsSessionId,
          duration,
          imageCount,
          message: `Follow-up complete in ${(duration / 1000).toFixed(1)}s`,
          summary,
        });

        if (state.campaignId) {
          db.updateCampaignStatus(state.campaignId, 'complete');
          db.addMessage({ campaignId: state.campaignId, role: 'assistant', content: summary });
        }
      }
    }

    // Handle cancellation (if cancelled but no error thrown)
    if (wasCancelled && !generationCompleted && state.campaignId) {
      db.updateCampaignStatus(state.campaignId, 'cancelled');
      db.addMessage({ campaignId: state.campaignId, role: 'assistant', content: 'Follow-up was cancelled.' });
    }

  } catch (err) {
    // Handle AbortError (cancellation) vs real errors — same pattern as handleGenerate
    const isAbort = (err instanceof Error && err.name === 'AbortError') || state.abortController?.signal.aborted;

    if (isAbort) {
      if (state.campaignId) {
        db.updateCampaignStatus(state.campaignId, 'cancelled');
        db.addMessage({ campaignId: state.campaignId, role: 'assistant', content: 'Follow-up was cancelled.' });
      }
    } else {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      broadcastToConnection(state, { type: 'error', timestamp: new Date().toISOString(), error: errorMsg });
      if (state.campaignId) {
        db.updateCampaignStatus(state.campaignId, 'error');
        db.addMessage({ campaignId: state.campaignId, role: 'assistant', content: `Error: ${errorMsg}` });
      }
    }
  } finally {
    state.isGenerating = false;
    // Only clean up the session WE created, not a previous one on state
    if (localSessionId) {
      sessionAbortControllers.delete(localSessionId);
      unregisterByWsSession(localSessionId);
    }
    state.abortController = null;
    if (onImageSaved) {
      imageEvents.removeListener('image-saved', onImageSaved);
    }
  }
}
```

Wire in dispatch:
```typescript
case 'follow_up':
  if (message.prompt && message.campaignId) {
    handleFollowUp(state, message.prompt, message.campaignId);
  }
  break;
```

**Also update `handleGenerate`** to use the same `isGenerating` guard:
- Add `state.isGenerating = true` after the existing `state.abortController = new AbortController()` (line ~374)
- Add rejection guard at top: `if (state.isGenerating) { send error; return; }`
- Add `state.isGenerating = false` in the existing `finally` block (line ~714)
- This prevents a user from starting `generate` during a `follow_up` or vice versa

### C.4 — Fix phase detection for follow-ups

**File:** `server/lib/websocket-handler.ts`

**Problem:** `detectPhaseFromMessage()` matches keywords like "research", "hook", "image" in AI text. During follow-ups, the AI will *discuss* these topics without running tools, causing spurious progress indicators (e.g. "Researching..." when AI just mentions research).

**Fix:** Remove text-based phase detection from `processSDKMessage`. Keep phase detection only from `tool_use` blocks (explicit tool invocations), which are already handled separately:

```typescript
// In processSDKMessage, for text blocks:
if (block.type === 'text' && block.text) {
  broadcastToConnection(state, {
    type: 'message',
    timestamp: new Date().toISOString(),
    text: block.text
  });
  // REMOVE: detectPhaseFromMessage() call here
  // Phase detection ONLY comes from tool_use blocks below (lines 246-282)
}
```

Tool-based phase detection (Task→research, Skill:hook-methodology→hooks, Skill:art-style→art, nano-banana→images) remains unchanged — these are explicit and accurate.

### C.5 — Reset event buffer TTL on follow-ups

**File:** `server/lib/event-buffer.ts`

**Problem:** Buffer TTL is set at creation time (40 min). If a user generates a campaign, waits 35 min, then sends a follow-up, the buffer expires 5 minutes into the follow-up — events lost, recovery fails.

**Fix:** Reset `createdAt` timestamp whenever events are appended:

```typescript
export function appendEvent(sessionId: string, event: Omit<BufferedEvent, 'id'>): number {
  let buffer = sessionEventBuffers.get(sessionId);
  if (!buffer) {
    buffer = { events: [], nextId: 1, createdAt: Date.now() };
    sessionEventBuffers.set(sessionId, buffer);
  }

  // Reset TTL on each append (keeps buffer alive during active follow-ups)
  buffer.createdAt = Date.now();

  // ... rest of function unchanged
}
```

### C.6 — Add atomic `startFollowUp` store action

**File:** `client/src/store/index.ts`

**Problem (from review):** The original plan called `store.setCurrentGeneratingMessageId()` and `store.setGeneratingCampaignId()` — neither exists. These fields are only set internally within `startGeneration()`.

**Fix:** Create a single atomic `startFollowUp` action that mirrors `startGeneration()`. One `set()` call instead of 4 separate ones — no intermediate render states:

```typescript
startFollowUp: (campaignId: string, prompt: string) => {
  const userMessageId = generateId('msg');
  const assistantMessageId = generateId('msg');

  set((state) => ({
    generatingCampaignId: campaignId,
    currentGeneratingMessageId: assistantMessageId,
    chatMessages: {
      ...state.chatMessages,
      [campaignId]: [
        ...(state.chatMessages[campaignId] || []),
        {
          id: userMessageId,
          campaignId,
          role: 'user' as const,
          content: prompt,
          timestamp: new Date(),
        },
        {
          id: assistantMessageId,
          campaignId,
          role: 'assistant' as const,
          content: '',
          timestamp: new Date(),
        },
      ],
    },
  }));

  return { campaignId, messageId: assistantMessageId };
},
```

### C.7 — Add `followUp` action to useWebSocket

**File:** `client/src/hooks/useWebSocket.ts`

Add to `UseWebSocketReturn`:
```typescript
followUp: (campaignId: string, prompt: string) => void;
```

Implementation (uses atomic `startFollowUp` from C.6):
```typescript
const followUp = useCallback((campaignId: string, prompt: string) => {
  const store = useStore.getState();

  // 1. Atomic: create user + assistant messages, set generating state
  const { messageId } = store.startFollowUp(campaignId, prompt);

  // 2. Open thinking block on the new assistant message
  store.openThinkingBlock(campaignId, messageId, 'Processing follow-up...');

  // 3. Send to server
  const sent = wsManager.sendMessage({
    type: 'follow_up',
    prompt,
    campaignId,
  });

  if (!sent) {
    store.failGeneration(campaignId, messageId, 'WebSocket not connected');
  }
}, []);
```

**Note:** `handleMessage` callback already works for follow-ups — it reads `generatingCampaignId` and `currentGeneratingMessageId` fresh from store via `getState()` on each message, so it handles both generation and follow-up events without modification.

### C.8 — Wire ChatSidebar to real follow-ups

**File:** `client/src/components/chat/ChatSidebar.tsx`

Replace the fake setTimeout (lines 53-91) with:

```typescript
const { generate, followUp, cancel } = useWebSocket();

const handleSubmit = (message) => {
  // New campaign: trigger generation
  if (isCreatingCampaign && message.content.trim() && isConnected) {
    generate(message.content.trim());
    return;
  }

  // Existing campaign: send follow-up to AI
  if (activeCampaignId && message.content.trim()) {
    followUp(activeCampaignId, message.content.trim());
  }
};
```

Remove `isTyping` state and the `setTimeout` block entirely.

### C.9 — Update WebSocket client types

**File:** `client/src/types/websocket.ts`

```typescript
export interface WSClientMessage {
  type: 'generate' | 'cancel' | 'pause' | 'resume' | 'ping' | 'subscribe' | 'follow_up';
  prompt?: string;
  sessionId?: string;
  campaignId?: string;  // New: needed for follow_up
  lastEventId?: number;
}
```

### C.10 — Include file context in follow-up prompts (server-side)

**File:** `server/lib/websocket-handler.ts` (in `handleFollowUp`)

**Status:** Defer to polish phase. Can be added after core follow-up works.

If the user's prompt contains @mentions (like `@research`), fetch the current file content from the DB and prepend it:

```typescript
// Detect @mentions in prompt
const fileRefs = prompt.match(/@(research|hooks|prompts)/g);
if (fileRefs && campaignId) {
  let context = '';
  for (const ref of fileRefs) {
    const fileType = ref.replace('@', '');
    const file = db.getCampaignFile(campaignId, fileType);
    if (file?.content) {
      context += `\nCurrent content of ${fileType}.md:\n\`\`\`\n${file.content}\n\`\`\`\n`;
    }
  }
  prompt = context + '\nUser request: ' + prompt;
}
```

---

### Chunk C Implementation Order

| Step | Task | Files | Status |
|------|------|-------|--------|
| C.1 | DB migration + helpers | `database.ts`, `db/campaigns.ts`, `db/index.ts` | ✅ Done |
| C.2 | Capture SDK session ID during generation | `websocket-handler.ts` | ✅ Done |
| C.3 | `handleFollowUp` with concurrency guard | `websocket-handler.ts` | ✅ Done |
| C.4 | Fix phase detection (tool-only) | `websocket-handler.ts` | ✅ Done |
| C.5 | Reset event buffer TTL | `event-buffer.ts` | ✅ Done |
| C.6 | Atomic `startFollowUp` store action | `store/index.ts` | ✅ Done |
| C.7 | `followUp` in useWebSocket hook | `useWebSocket.ts` | ✅ Done |
| C.8 | Wire ChatSidebar | `ChatSidebar.tsx` | ✅ Done |
| C.9 | Update WS client types | `types/websocket.ts` | ✅ Done |
| C.10 | @mention file context (deferred) | `websocket-handler.ts` | Pending |

**Parallelizable:** C.4 + C.5 + C.6 + C.9 have no dependencies and can be done simultaneously.

### Chunk C Verification

1. ✅ Generate a campaign → `sdk_session_id` written to SQLite (DB migration + C.2 capture working)
2. ✅ After completion, type follow-up → AI responds with real answer (not canned response)
3. ✅ ThinkingBlock animates during follow-up, collapses on completion
4. ⚠️ AI tries to Glob for campaign files on disk — doesn't have DB file content (C.10 needed)
5. [ ] No spurious phase indicators when AI discusses topics without running tools
6. [ ] Check SQLite: `messages` table should have both user and assistant follow-up messages
7. [ ] Refresh the page — follow-up messages should still appear (loaded from DB)
8. [ ] Cancel during follow-up — verify it stops and marks campaign appropriately
9. [ ] Send follow-up while another is processing — should get error, not corruption
10. [ ] Generate → wait 35+ min → follow-up → verify event buffer stays alive

**Bug found during implementation:** `CREATE INDEX IF NOT EXISTS idx_campaigns_sdk_session_id` in `SCHEMA_SQL` failed on existing databases because the column didn't exist yet (table already created, `IF NOT EXISTS` skipped). Fixed by moving the index creation after the `ALTER TABLE` migration in `initDatabase()`.

---

### Staff Review Notes (2026-02-03, updated after cross-reference)

**Issues identified and addressed in this revision:**

| # | Issue | Severity | Resolution |
|---|-------|----------|------------|
| 1 | Concurrent follow-up race condition | Critical | Added `isGenerating` guard in `ConnectionState` (C.3) |
| 2 | Missing `setCurrentGeneratingMessageId` store setter | Critical | Replaced with atomic `startFollowUp` action (C.6) |
| 3 | Missing `setGeneratingCampaignId` store setter | Critical | Replaced with atomic `startFollowUp` action (C.6) |
| 4 | `getCampaignById` requires `userId` param | Medium | Fixed signature in `handleFollowUp` to pass `state.userId` (C.3) |
| 5 | Phase detection emits false positives from text | Medium | Remove text-based phase detection, keep tool-based only (C.4) |
| 6 | Event buffer TTL doesn't reset on follow-ups | Medium | Reset `createdAt` on each `appendEvent` call (C.5) |
| 7 | `sdk_session_id` not in `SCHEMA_SQL` for fresh DBs | Low | Add to schema + keep migration for existing DBs (C.1) |
| 8 | `Campaign` TS interface missing `sdk_session_id` field | Medium | Added to C.1 |
| 9 | `db/index.ts` barrel export missing new helpers | Medium | Added to C.1 |
| 10 | `extractSummary()` referenced but doesn't exist | Medium | Replaced with inline summary in C.3 pseudocode |
| 11 | `instrumentor` variable never created in `handleFollowUp` | Critical | Added `new SDKInstrumentor()` call in C.3 |
| 12 | `processedImageIndices` not passed as 4th arg to `processSDKMessage` | Medium | Fixed in C.3 pseudocode |
| 13 | `onImageSaved` was placeholder comment, not real code | Medium | Replaced with full implementation in C.3 |
| 14 | `finally` block could delete wrong session on early return | Medium | Fixed with `localSessionId` pattern in C.3 |
| 15 | `handleGenerate` `isGenerating` changes underspecified | Low | Added specific line references and guard details in C.3 |

**Confirmed working (no changes needed):**
- `processSDKMessage` — generic enough for follow-ups as-is
- Dual AbortController pattern — each follow-up gets fresh controllers
- Event buffer — events append to existing buffer correctly
- `handleMessage` in useWebSocket — reads store fresh each call
- `addMessage` DB function — signature matches exactly
- `sendMessage` in ws-manager — accepts any message type

**Intentionally deferred:**
- Follow-up queuing (chose rejection over queuing — simpler, can revisit)
- `queryWithSession` metadata for follow-up type (not needed for correctness)
- Message deduplication on reconnect during follow-up (edge case, general resilience concern)
- `completeGeneration` clears store `sessionId` — may affect recovery for follow-ups (investigate during testing)

---

## Deferred: Token-by-Token Streaming

**Status:** Not planned for this iteration. Requires:
- Empirical testing of SDK's `includePartialMessages` option
- Delta batching (50ms buffer) to avoid flooding the event buffer
- Performance testing with React re-renders per token

Can be added later as a polish step after Chunks A-C are solid.

---

## Files Modified (Summary)

| File | Chunk | Changes |
|------|-------|---------|
| `client/src/hooks/useWebSocket.ts` | A, B, C | Fix prompt param, fix store reads, build blocks, add followUp |
| `client/src/store/index.ts` | A, B, C | Fix action signatures, add block actions, add `startFollowUp` |
| `client/src/types/chat.ts` | B | Add MessageBlock types, add blocks field to ChatMessage |
| `client/src/types/websocket.ts` | C | Add follow_up client message type, add campaignId field |
| `client/src/components/chat/ChatSidebar.tsx` | A, C | Fix generate call, remove inline component, wire follow-ups |
| `client/src/components/chat/ChatMessage.tsx` | B | Render blocks with fallback to plain text |
| `client/src/components/chat/ThinkingBlock.tsx` | B | Delete (replaced by blocks/ThinkingBlock.tsx) |
| `client/src/components/chat/blocks/BlockRenderer.tsx` | B | New: routes blocks to correct component |
| `client/src/components/chat/blocks/TextBlock.tsx` | B | New: renders streamed text |
| `client/src/components/chat/blocks/ThinkingBlock.tsx` | B | New: renders ThinkingBlockData |
| `client/src/components/chat/blocks/StatusBlock.tsx` | B | New: renders info/success/error chips |
| `client/src/components/EmptyState.tsx` | A | Update generate() call to pass prompt |
| `server/lib/database.ts` | C | Add sdk_session_id to schema + migration |
| `server/lib/db/campaigns.ts` | C | Add updateSdkSessionId, getSdkSessionId |
| `server/lib/websocket-handler.ts` | C | Capture SDK session ID, handleFollowUp with concurrency guard, fix phase detection |
| `server/lib/event-buffer.ts` | C | Reset TTL on appendEvent |

---

## Architecture Context

### How SDK Session Resume Works (for follow-up chat)
- Claude API is stateless — full conversation history is sent every request
- The SDK stores complete history in JSONL files on disk
- "Resume" = read the JSONL, rebuild the messages array, append the new prompt, send to API
- Prompt caching makes re-sending the full history efficient (default 5-min TTL, 1-hour available for Opus 4.5 but not exposed by SDK)
- `session-manager.ts` maps our WS session IDs to SDK session IDs
- `sdk_session_id` in SQLite ensures this mapping survives server restarts

### What Shows Where
- **Chat sidebar (right):** Text blocks, thinking blocks, status chips, follow-up conversation
- **Results view (center):** Generated images (from campaign.images)
- **File editor (left panel):** Research, hooks, prompts files (from campaign.files)
- Images and files are NOT rendered inline in chat — only referenced via status chips

### Storage Layers
| Storage | What it stores | Survives refresh? |
|---------|---------------|-------------------|
| Zustand (in-memory) | Message blocks, thinking state, generation progress | No |
| localStorage | Active session info (for recovery) | Yes |
| SQLite messages table | User prompts + assistant summaries (flat text) | Yes |
| SDK JSONL files | Full conversation history (for resume) | Yes |
| Event buffer (server memory) | Recent WS events (for reconnection replay) | No (40 min TTL, resets on activity) |
