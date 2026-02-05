# Codebase Reference

**Last updated:** February 5, 2026
**Branch:** `new-ui`
**Status:** Phases A-D complete. Chat Chunks A, B & C (C.1-C.9) complete. C.10 (@mention file context) deferred. Message persistence complete. Testing in progress.

Load this file at session start to get full codebase context without reading individual source files.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [File Map](#file-map)
4. [Database Schema](#database-schema)
5. [REST API](#rest-api)
6. [WebSocket Protocol](#websocket-protocol)
7. [State Management (Zustand)](#state-management-zustand)
8. [Authentication](#authentication)
9. [Generation Pipeline](#generation-pipeline)
10. [Session Recovery (3-Layer Model)](#session-recovery-3-layer-model)
11. [Key Implementation Patterns](#key-implementation-patterns)
12. [Known Bugs & Fixes](#known-bugs--fixes)
13. [Remaining Work](#remaining-work)

---

## Quick Start

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev

# Open http://localhost:5173
```

**Environment:**
- Backend: `server/.env` needs `ANTHROPIC_API_KEY` (required), `CLERK_SECRET_KEY` (optional - dev mode without it)
- Frontend: `client/.env` needs `VITE_CLERK_PUBLISHABLE_KEY` (optional - dev mode without it)
- Database: auto-created at `server/data/creative_agent.db`
- Uploads: stored in `server/uploads/`
- Generated images: stored in `generated-images/{sessionId}/`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND  (React 19 + Vite 7 + Tailwind v4)                │
│                                                             │
│ main.tsx → ClerkProvider (or dev bypass) → App.tsx           │
│                                                             │
│ App.tsx                                                     │
│   ├─ Auth flow (Clerk soft-gate)                            │
│   ├─ Data loading (campaigns, folders, messages from API)   │
│   └─ Recovery orchestration (generating campaigns)          │
│                                                             │
│ AppLayout.tsx (workspace shell)                             │
│   ├─ Left:   AssetDrawer (campaigns list + asset folders)   │
│   ├─ Center: ResultsView (image grid) or EmptyState         │
│   ├─ Right:  ChatSidebar / MobileChatDrawer                 │
│   └─ Panel:  FileEditor (TipTap rich text, auto-save)       │
│                                                             │
│ State: Zustand store (941 lines)                            │
│ WS:    websocket-manager singleton + useWebSocket hook      │
│ API:   lib/api.ts (320 lines)                               │
├─────────────────────────────────────────────────────────────┤
│ Vite dev proxy: /ws, /api, /images → localhost:3001         │
├─────────────────────────────────────────────────────────────┤
│ BACKEND  (Express 4 + ws + better-sqlite3)                  │
│                                                             │
│ sdk-server.ts (947 lines)                                   │
│   ├─ Express routes: /health, /test, /generate, /sessions   │
│   ├─ Mounts: /api/campaigns/*, /api/assets/*                │
│   ├─ WebSocket: /ws (via websocket-handler.ts)              │
│   ├─ Image serving: /images/:sessionId/:filename            │
│   └─ Clerk auth middleware (global)                         │
│                                                             │
│ websocket-handler.ts (~1100 lines)                          │
│   ├─ Client msgs: generate, cancel, pause, resume,          │
│   │               subscribe, follow_up                       │
│   ├─ Server msgs: phase, tool_start, message, file, image,  │
│   │               complete, error, ack, subscribed           │
│   ├─ DB writes: campaigns, files, images, messages           │
│   └─ Event buffer: in-memory replay for reconnection         │
│                                                             │
│ ai-client.ts (496 lines)                                    │
│   ├─ Claude SDK wrapper (claude-opus-4-5-20251101)           │
│   ├─ MCP: nano-banana image generation                       │
│   ├─ Session management + forking                            │
│   └─ External abort controller for cancellation              │
│                                                             │
│ Database: SQLite (WAL mode, foreign keys, cascade deletes)   │
│ Auth: Clerk (@clerk/express) with anonymous dev fallback     │
└─────────────────────────────────────────────────────────────┘
```

---

## File Map

### Backend (server/)

| File | Lines | Key Exports | Purpose |
|------|-------|-------------|---------|
| `sdk-server.ts` | 947 | Express app, HTTP server | Main server: routes, WS init, image serving, instrumentation |
| `lib/websocket-handler.ts` | ~1300 | `initWebSocket()`, `isAgentRunning()`, `abortSession()`, `BlockBuilder`, `TextAccumulator` | WS message handling, generation + follow-up streaming, DB persistence, concurrency guard, server-side block building for message persistence |
| `lib/ai-client.ts` | ~480 | `AIClient` class | Claude SDK: `queryWithSession(prompt, sessionId?, metadata?, attachments?, abortController?, resumeSdkSessionId?)`, `queryWithSessionFork()`, MCP setup, dual AbortController pattern (doneController for lifecycle, abortController for cancellation). The 6th param `resumeSdkSessionId` allows direct SDK session resume bypassing SessionManager. |
| `lib/orchestrator-prompt.ts` | 77 | `ORCHESTRATOR_PROMPT` | System prompt for 4-step pipeline |
| `lib/session-manager.ts` | ~340 | `sessionManager` | SDK session lifecycle: create, persist to JSON, fork, cleanup (used by sdk-server, ai-client, websocket-handler) |
| `lib/instrumentor.ts` | ~150 | `SDKInstrumentor` | Cost/token tracking per generation (used by sdk-server, websocket-handler) |
| `lib/database.ts` | ~160 | `db`, `initDatabase()`, `generateId()` | SQLite connection, schema creation, migrations, ID generation |
| `lib/image-events.ts` | 35 | `imageEvents`, `registerMcpSession()`, `resolveWsSessionId()` | EventEmitter side-channel for real-time image notifications from MCP tool, with MCP↔WS session ID mapping |
| `lib/event-buffer.ts` | ~126 | `appendEvent()`, `getEventsSince()`, `hasBuffer()` | In-memory event storage (1000 max, 40-min TTL, resets on activity) |
| `lib/auth.ts` | 74 | `clerkAuth()`, `authRequired`, `getUserId()` | Clerk middleware, dev mode anonymous fallback |
| `lib/db/index.ts` | 68 | barrel re-exports | Exports all DB operations + types |
| `lib/db/campaigns.ts` | ~115 | `getCampaignsByUser()`, `createCampaign()`, `getCampaignBySessionId()`, `updateSdkSessionId()`, `getSdkSessionId()` | Campaign CRUD, session linking, SDK session persistence |
| `lib/db/files.ts` | 63 | `getCampaignFiles()`, `updateCampaignFile()`, `areAllFilesReady()` | Campaign file CRUD (research/hooks/prompts) |
| `lib/db/images.ts` | 89 | `addCampaignImage()`, `getLatestCampaignImages()`, `getImageCount()` | Image CRUD with versioning |
| `lib/db/messages.ts` | ~120 | `addMessage()`, `getMessages()`, `getLastAssistantMessage()`, `MessageBlock`, `ThinkingBlockData`, `TextBlockData`, `StatusBlockData` | Chat message CRUD with block types for thinking/text/status persistence |
| `lib/db/assets.ts` | 113 | folder + file CRUD functions | Asset folders and files management |
| `routes/campaigns.ts` | 458 | Express Router | 11 endpoints: campaigns, files, images, messages, status |
| `routes/assets.ts` | 397 | Express Router | 8 endpoints: folders, files, upload (multer, 10MB) |
| `package.json` | 35 | — | Deps: claude-agent-sdk, clerk/express, better-sqlite3, ws, multer |

### Frontend (client/)

| File | Lines | Key Exports | Purpose |
|------|-------|-------------|---------|
| `src/App.tsx` | 271 | `App`, `AppContent` | Root: auth flow, data loading, recovery orchestration |
| `src/main.tsx` | 26 | — | Entry: ClerkProvider wrapper or dev bypass |
| `src/store/index.ts` | ~970 | `useStore` | Zustand: campaigns, chat, generation, follow-up, block actions, assets, async API actions |
| `src/lib/websocket-manager.ts` | 210 | `subscribe()`, `unsubscribe()`, `connect()`, `sendMessage()` | Module-level WS singleton: one connection per tab, connectionGeneration staleness guard, subscriberCount ref counting |
| `src/hooks/useWebSocket.ts` | ~385 | `useWebSocket()` | Thin wrapper over WS manager: message handling via block actions, session recovery, localStorage persistence, generate(prompt)/cancel/resume/followUp(campaignId,prompt) actions. Subscribes to only `connectionState` + `isRecovering`; all store actions read via `getState()` inside callbacks. |
| `src/lib/api.ts` | ~350 | `campaignsApi`, `assetsApi`, `setTokenGetter()` | REST client with Clerk token injection, type transformers, block parsing in `transformMessage()` |
| `src/lib/auth.ts` | 10 | `IS_AUTH_ENABLED`, `isDevMode()` | Clerk key detection |
| `src/contexts/AuthContext.tsx` | 87 | `AuthProvider`, `useRequireAuth()` | Auth context with `requireAuth()` callback + sign-in modal |
| `src/types/chat.ts` | 135 | `ChatMessage`, `MessageBlock`, `ThinkingBlockData`, `ThinkingChild`, `CampaignStatus` | Type definitions + helper functions |
| `src/types/websocket.ts` | 169 | `WSClientMessage`, `WSServerMessage`, type guards | WS protocol types |
| `src/components/layout/AppLayout.tsx` | 426 | `AppLayout`, sidebar context | Resizable sidebars (200-480px), mobile drawers, keyboard shortcuts |
| `src/components/chat/ChatSidebar.tsx` | ~89 | `ChatSidebar` | Chat sidebar with message history. Routes new campaigns to `generate()`, existing campaigns to `followUp()`. No fake typing — real AI responses. |
| `src/components/chat/ChatMessage.tsx` | 90 | `ChatMessage` | Individual message renderer: blocks → BlockRenderer, plain text fallback for DB-loaded messages |
| `src/components/chat/ChatInput.tsx` | 137 | `ChatInput` | Chat input with @mention support and image chip attachments |
| `src/components/chat/blocks/BlockRenderer.tsx` | 32 | `BlockRenderer` | Routes `MessageBlock[]` to correct component (TextBlock, ThinkingBlock, StatusBlock) |
| `src/components/chat/blocks/ThinkingBlock.tsx` | 184 | `ThinkingBlock` | Collapsible thinking block with extended children kinds (phase, tool, text, status, progress, error) and image counter |
| `src/components/chat/blocks/TextBlock.tsx` | 17 | `TextBlock` | Message bubble for final summary text |
| `src/components/chat/blocks/StatusBlock.tsx` | 34 | `StatusBlock` | Small pill/chip with info/success/error variants |
| `src/components/chat/ImageChip.tsx` | 100 | `ImageChip` | Compact image thumbnail chip with hook type badge |
| `src/components/chat/MobileChatDrawer.tsx` | 220 | `MobileChatDrawer` | Mobile chat via Radix Drawer (85vh), uses BlockRenderer |
| `src/components/ResultsView.tsx` | 200 | `ResultsView` | Image grid (1-3 cols), selection, resume button |
| `src/components/EmptyState.tsx` | 220 | `EmptyState` | Landing: prompt input, examples, recent campaigns |
| `src/components/editor/FileEditor.tsx` | 287 | `FileEditorPanel` | TipTap editor, 1s debounce auto-save, undo/redo |
| `src/components/assets/AssetDrawer.tsx` | 640 | `AssetDrawer`, `CampaignsSection`, `AssetsSection` | Campaign list, asset folders, file upload/preview |
| `src/components/assets/AssetPreview.tsx` | 149 | `AssetPreview`, `useAssetPreview` | Image/file preview dialog with delete and download |
| `src/components/assets/FileUpload.tsx` | 343 | `FileUpload` | Drag-and-drop file upload dialog with folder selection |
| `src/components/assets/MobileAssetsDrawer.tsx` | 42 | `MobileAssetsDrawer` | Mobile drawer wrapper for AssetDrawer |
| `src/components/mentions/AssetMention.tsx` | 463 | `AssetMention` | @mention autocomplete picker with folder/file/image search and keyboard nav |
| `src/components/ImageCard.tsx` | 187 | `ImageCard` | Generated image card with hook type label and download |
| `src/components/auth/SignIn.tsx` | 44 | `SignIn` | Clerk sign-in with dark theme |
| `src/components/auth/UserMenu.tsx` | 41 | `UserMenu` | Clerk UserButton wrapper |
| `src/components/layout/LandingHeader.tsx` | 52 | `LandingHeader` | Fixed header with logo + auth controls |
| `vite.config.ts` | 35 | — | Path alias `@`, proxy config, Tailwind + React plugins |
| `package.json` | 52 | — | react 19, zustand 5, tiptap, radix-ui, clerk-react, lucide, vaul |

---

## Database Schema

**Location:** `server/lib/database.ts` (auto-created at `server/data/creative_agent.db`)

```sql
campaigns
  id            TEXT PK          -- generateId('campaign')
  user_id       TEXT NOT NULL    -- Clerk user ID or 'anonymous'
  name          TEXT NOT NULL    -- Campaign display name
  status        TEXT DEFAULT 'generating'  -- generating|complete|incomplete|error|cancelled
  session_id    TEXT             -- WebSocket session ID for reconnection
  sdk_session_id TEXT            -- Claude SDK session ID for follow-up resume
  created_at    DATETIME
  updated_at    DATETIME         -- trigger-updated

campaign_files
  id            INTEGER PK AUTOINCREMENT
  campaign_id   TEXT FK → campaigns(id) CASCADE
  file_type     TEXT NOT NULL    -- research|hooks|prompts
  content       TEXT DEFAULT ''
  is_ready      BOOLEAN DEFAULT FALSE
  updated_at    DATETIME
  UNIQUE(campaign_id, file_type)

campaign_images
  id            INTEGER PK AUTOINCREMENT
  campaign_id   TEXT FK → campaigns(id) CASCADE
  image_index   INTEGER NOT NULL -- 1-6
  hook_type     TEXT NOT NULL    -- stat|story|fomo|curiosity|callout|contrast
  prompt        TEXT
  file_path     TEXT NOT NULL    -- disk path or URL
  version       INTEGER DEFAULT 1  -- increments on regeneration
  created_at    DATETIME
  UNIQUE(campaign_id, image_index, version)

messages
  id            TEXT PK          -- generateId('msg')
  campaign_id   TEXT FK → campaigns(id) CASCADE
  role          TEXT NOT NULL    -- user|assistant
  content       TEXT NOT NULL
  image_refs    TEXT             -- JSON array (unused)
  file_refs     TEXT             -- JSON array (unused)
  blocks        TEXT             -- JSON array of MessageBlock (thinking blocks, text blocks, status blocks)
  created_at    DATETIME

asset_folders
  id            TEXT PK          -- generateId('folder')
  user_id       TEXT NOT NULL
  name          TEXT NOT NULL
  created_at    DATETIME

asset_files
  id            TEXT PK          -- generateId('file')
  folder_id     TEXT FK → asset_folders(id) CASCADE
  name          TEXT NOT NULL
  file_path     TEXT NOT NULL    -- disk path in server/uploads/
  file_type     TEXT NOT NULL    -- image|document|other
  size          INTEGER
  created_at    DATETIME
```

**ID format:** `{prefix}_{timestamp_base36}{random_base36}` (e.g., `campaign_mkyzrxsjsp7b97`)

---

## REST API

**Base:** `/api` (proxied from Vite dev server port 5173 → Express port 3001)
**Auth:** All endpoints require Clerk JWT (or anonymous in dev mode)

### Campaigns

| Method | Endpoint | Body/Params | Response | Notes |
|--------|----------|-------------|----------|-------|
| `GET` | `/api/campaigns` | — | `{ campaigns: Campaign[] }` | User's campaigns, DESC by created_at |
| `GET` | `/api/campaigns/:id` | — | `{ campaign, files, images, messages }` | Full campaign with all relations |
| `POST` | `/api/campaigns` | `{ name }` | `{ campaign }` | Creates campaign + 3 empty files |
| `PATCH` | `/api/campaigns/:id` | `{ name?, status? }` | `{ campaign }` | Update name or status |
| `DELETE` | `/api/campaigns/:id` | — | `{ success: true }` | Aborts active generation, cascades |
| `GET` | `/api/campaigns/:id/files/:type` | type: research\|hooks\|prompts | `{ file }` | Single file content |
| `PUT` | `/api/campaigns/:id/files/:type` | `{ content }` | `{ file }` | Update file content |
| `GET` | `/api/campaigns/:id/images` | — | `{ images: Image[] }` | Latest version of each image |
| `GET` | `/api/campaigns/:id/messages` | — | `{ messages: Message[] }` | Chat history ASC |
| `POST` | `/api/campaigns/:id/messages` | `{ role, content }` | `{ message }` | Add chat message |
| `GET` | `/api/campaigns/:id/status` | — | `{ status, isAgentRunning }` | Reconciles DB status with live agent |

### Assets

| Method | Endpoint | Body/Params | Response | Notes |
|--------|----------|-------------|----------|-------|
| `GET` | `/api/assets/folders` | — | `{ folders: Folder[] }` | With file counts |
| `POST` | `/api/assets/folders` | `{ name }` | `{ folder }` | Create folder |
| `PATCH` | `/api/assets/folders/:id` | `{ name }` | `{ folder }` | Rename folder |
| `DELETE` | `/api/assets/folders/:id` | — | `{ success: true }` | Deletes files from disk too |
| `GET` | `/api/assets/folders/:id/files` | — | `{ files: File[] }` | Files in folder |
| `POST` | `/api/assets/upload` | multipart: file + folderId | `{ file }` | 10MB limit, JPEG/PNG/GIF/WebP/PDF/TXT/MD |
| `GET` | `/api/assets/files/:id` | — | Binary file | Serve/download |
| `DELETE` | `/api/assets/files/:id` | — | `{ success: true }` | Removes from disk |

### Other Endpoints (on sdk-server.ts directly)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/health` | Health check with config status |
| `POST` | `/generate` | REST-based generation (not used by frontend) |
| `GET` | `/images/:sessionId/:filename` | Serve generated images |
| `GET` | `/images` | List all generated images |
| `GET` | `/sessions` | List active SDK sessions |
| `POST` | `/sessions/:id/continue` | Resume SDK session |
| `POST` | `/sessions/:id/fork` | Fork SDK session |

---

## WebSocket Protocol

**Endpoint:** `ws://localhost:3001/ws` (proxied via Vite at `ws://localhost:5173/ws`)

### Client → Server Messages

```typescript
// Start generation
{ type: 'generate', prompt: string, sessionId: string }

// Cancel active generation
{ type: 'cancel', sessionId: string }

// Pause/resume streaming
{ type: 'pause' }
{ type: 'resume' }

// Keepalive (25s interval from client)
{ type: 'ping' }

// Reconnect to existing session (recovery)
{ type: 'subscribe', sessionId: string, lastEventId: number }

// Follow-up message on existing campaign
{ type: 'follow_up', prompt: string, campaignId: string }
```

### Server → Client Messages

```typescript
// Acknowledge generation start (carries real DB campaign ID)
{ type: 'ack', sessionId: string, campaignId: string, eventId: number }

// Workflow phase change
{ type: 'phase', phase: string, label: string, eventId: number }
// Phases: parse, research, hooks, art, images, complete

// SDK tool execution
{ type: 'tool_start', tool: string, input: string, eventId: number }
{ type: 'tool_end', tool: string, eventId: number }

// Assistant text output
{ type: 'message', text: string, eventId: number }

// Campaign file written
{ type: 'file', fileType: 'research'|'hooks'|'prompts', content: string, eventId: number }

// Image generated
{ type: 'image', urlPath: string, prompt: string, hookType: HookType,
  imageIndex: number, eventId: number }

// Generation complete
{ type: 'complete', summary: string, duration: number, imageCount: number, eventId: number }

// Error
{ type: 'error', error: string, eventId?: number }

// Reconnection confirmed
{ type: 'subscribed' }

// Campaign status change
{ type: 'status', status: 'cancelled' }

// Keepalive response
{ type: 'pong' }
```

### Event ID System

- Each event gets a sequential `eventId` per session (starting at 1)
- Stored in event buffer (in-memory, 1000 max per session)
- On reconnect, client sends `lastEventId: 0` to replay ALL events
- Buffer has 40-minute TTL, cleanup every 5 minutes

---

## State Management (Zustand)

**File:** `client/src/store/index.ts` (~970 lines)

### Core State

```typescript
// App
appState: 'landing' | 'workspace'

// Campaigns
campaigns: Campaign[]              // all user campaigns
activeCampaignId: string | null     // currently viewed
isCreating: boolean                 // creating new campaign
generatingCampaignId: string | null // actively generating

// Chat
chatMessages: Record<string, ChatMessage[]>  // keyed by campaignId
currentGeneratingMessageId: string | null

// Generation
sessionId: string | null
isRecovering: boolean

// Images
selectedImages: string[]            // selected image IDs
campaignImages: Record<string, GeneratedImage[]>  // keyed by campaignId

// Files
activeFileType: 'research' | 'hooks' | 'prompts' | null

// Assets
assetFolders: AssetFolder[]
assetFiles: Record<string, AssetFile[]>  // keyed by folderId

// UI
mobileDrawerOpen: 'chat' | 'assets' | null
dataLoaded: boolean
```

### Key Actions

**Generation lifecycle:**
- `startGeneration(sessionId, campaignName, prompt)` → creates campaign + user/assistant messages (prompt passed directly, not read from state)
- `resumeGeneration(sessionId, campaignId)` → sets up for resumed generation
- `reconstructForRecovery(sessionId, prompt, campaignId)` → rebuilds chat state from localStorage (REPLACES messages, not append)
- `completeGeneration(campaignId, messageId, summary)` → updates status, sets summary on assistant message
- `cancelGeneration(campaignId, messageId)` → marks cancelled
- `failGeneration(campaignId, messageId, error)` → marks error
- `cleanupFailedRecovery()` → clears generation state without changing campaigns/appState
- `startFollowUp(campaignId, prompt)` → atomic: creates user + assistant messages, sets generatingCampaignId + currentGeneratingMessageId in single `set()` call

**Block actions (all take explicit `campaignId` — never read from `state.generatingCampaignId`):**
- `appendTextBlock(campaignId, messageId, text)` → appends to last text block or creates new one
- `openThinkingBlock(campaignId, messageId, label)` → opens a new collapsible thinking block
- `addThinkingChild(campaignId, messageId, { kind, text, variant? })` → adds child to active thinking block (kinds: phase, tool, result, progress, error, text, status)
- `closeThinkingBlock(campaignId, messageId, status)` → closes thinking block as 'complete' or 'error', auto-collapses
- `updateThinkingImages(campaignId, messageId, imageIndex)` → increments completedImages counter in thinking block
- `addStatusBlock(campaignId, messageId, text, variant)` → adds info/success/error status chip
- `toggleBlockExpanded(campaignId, messageId, blockId)` → toggle thinking block expand/collapse
- `appendMessageContent(campaignId, messageId, text)` → appends text to message.content (for DB persistence)

**Campaign management:**
- `replaceCampaignId(tempId, realId)` → swaps client-generated ID for server DB ID
- `updateCampaignFile(campaignId, fileType, content)` → updates file in store
- `addImageToCampaign(campaignId, image)` → adds image to campaign

**Async API actions (optimistic update + API call):**
- `deleteCampaignAsync(id)` → DELETE /api/campaigns/:id
- `renameCampaignAsync(id, name)` → PATCH /api/campaigns/:id
- `saveFileAsync(campaignId, fileType, content)` → PUT /api/campaigns/:id/files/:type
- `createFolderAsync(name)` → POST /api/assets/folders
- `deleteFolderAsync(id)` → DELETE /api/assets/folders/:id
- `renameFolderAsync(id, name)` → PATCH /api/assets/folders/:id
- `deleteFileAsync(fileId)` → DELETE /api/assets/files/:id

**Bulk setters (used during data loading):**
- `setCampaigns(campaigns[])` → replaces all campaigns
- `setAssetFolders(folders[])` → replaces all folders
- `setChatMessages(messages)` → sets messages for specific campaign

---

## Authentication

### Flow (Soft-Gate)

```
User visits → Landing page (always visible, no auth gate)
  ├─ Header shows "Log in" button (or avatar if signed in)
  ├─ User can type prompt freely
  └─ Clicks "Create" → requireAuth() check
       ├─ Signed in → generate()
       └─ Not signed in → Clerk sign-in modal
            └─ On sign-in → pending callback fires → generate()
```

### Backend Auth

- **File:** `server/lib/auth.ts`
- `clerkAuth()` — global middleware, noop if `CLERK_SECRET_KEY` missing
- `authRequired` — per-route, extracts `userId` from Clerk JWT or falls back to `'anonymous'`
- `getUserId(req)` — returns `req.userId` (set by middleware)
- Dev mode: all requests get `userId = 'anonymous'`, warning logged once

### Frontend Auth

- **File:** `client/src/contexts/AuthContext.tsx`
- `requireAuth(callback)` — if signed in, runs callback immediately; if not, opens Clerk modal and stores callback in a ref, executes on `isSignedIn` transition (`false → true`)
- **File:** `client/src/lib/api.ts`
- `setTokenGetter(fn)` — called in `App.tsx` to inject `clerk.getToken`
- All API calls include `Authorization: Bearer <token>` header when available

### Token Race Fix

- `App.tsx` uses a ref-based token getter (`tokenGetterRef`) so the auth token is always current when child effects fire
- Without this, effects in child components ran before the Clerk token was available

---

## Generation Pipeline

### Orchestrator System Prompt

**File:** `server/lib/orchestrator-prompt.ts`

The orchestrator (Claude Opus 4.5) manages a sequential pipeline:

```
1. PARSE → Extract URL (required), brand name, style, count (default 6, max 6)
2. RESEARCH → Spawn "research" agent → writes research.md
3. HOOKS → Trigger "hook-methodology" skill → writes hooks.md (hook-bank)
4. ART → Trigger "art-style" skill → writes prompts.json
5. IMAGES → Read prompts.json → call MCP nano-banana tool (batches of 3)
6. COMPLETE → Report with image URLs
```

### AI Client Configuration

**File:** `server/lib/ai-client.ts`

```typescript
model: 'claude-opus-4-5-20251101'
maxTurns: 30
allowedTools: ['Task', 'Skill', 'TodoWrite', 'WebFetch', 'WebSearch',
               'Read', 'Write', 'Bash', 'Edit', 'Glob', 'Grep',
               'mcp__nano-banana__generate_ad_images']
cwd: path.resolve(__dirname, '../../agent')  // for .claude/agents/ and .claude/skills/
```

### Hook Types (mapped to image indices 1-6)

| Index | Hook Type | Description |
|-------|-----------|-------------|
| 1 | `stat` | Statistical hook |
| 2 | `story` | Story/narrative hook |
| 3 | `fomo` | Fear of missing out |
| 4 | `curiosity` | Curiosity-driven |
| 5 | `callout` | Direct callout |
| 6 | `contrast` | Before/after contrast |

### Phase Detection

The WebSocket handler detects phases from SDK message content via regex:

```
/parsing|extract|understand.*request/i → 'parse'
/research|brand.*analysis|homepage/i   → 'research'
/hook|conversion.*hook/i               → 'hooks'
/art.*style|visual.*prompt|creative/i  → 'art'
/generat.*image|image.*generat/i       → 'images'
```

---

## Session Recovery (3-Layer Model)

### Layer 1: localStorage (Client)

**Key:** `creative-agent:activeSession`

```typescript
{
  sessionId: string,    // WebSocket session UUID
  prompt: string,       // Original user prompt
  campaignId: string,   // DB campaign ID
  messageId: string,    // Zustand assistant message ID
  startedAt: number     // Timestamp
}
```

- Written by `useWebSocket.generate()` and `.resume()`
- Read on every WS `onopen` (checks for session to recover)
- Cleared on generation complete, cancel, or error

### Layer 2: Event Buffer (Server In-Memory)

**File:** `server/lib/event-buffer.ts`

- Max 1000 events per session (trims oldest 50% when exceeded)
- 40-minute TTL
- Cleanup every 5 minutes
- Enables full event replay on reconnect

### Layer 3: SQLite (Server)

- Permanent storage for user + assistant messages
- User message written at generation start
- Assistant message written at generation complete/cancel/error

### Recovery Flows

| Scenario | What Happens |
|----------|-------------|
| **Refresh mid-generation** | localStorage has session → `reconstructForRecovery()` → subscribe → replay all events → thinking block rebuilds |
| **Tab close + reopen (agent running)** | Same as refresh (localStorage survives tab close) |
| **Tab close + reopen (agent finished)** | Subscribe fails → stale cleanup → load complete campaign from DB |
| **Refresh after generation done** | localStorage empty → load campaign + messages from DB |
| **Server restart** | Subscribe fails (no buffer) → stale cleanup → mark campaign incomplete |

### Guards

1. **Duplicate messages:** `reconstructForRecovery` REPLACES chatMessages (not append)
2. **Prompt preservation:** App.tsx checks `if (!existing)` before writing to localStorage
3. **Data loading race:** App.tsx checks `if (!hasActiveRecovery)` before `setChatMessages`
4. **Stale sessions:** Error handler detects "Session not found" and calls `cleanupFailedRecovery()` silently

---

## Key Implementation Patterns

### Campaign ID Lifecycle

1. Client generates temp ID: `generateId('campaign')` in `startGeneration()`
2. Server creates real DB ID in `handleGenerate()`, returns in `ack` message
3. Client calls `replaceCampaignId(tempId, realId)` to swap everywhere
4. All subsequent API calls use the real DB ID

### Optimistic Updates

Store actions update Zustand immediately, then fire API call:

```typescript
deleteCampaignAsync(id) {
  // 1. Remove from store immediately
  set(state => ({ campaigns: state.campaigns.filter(c => c.id !== id) }))
  // 2. Fire API call (no await, fire-and-forget with error logging)
  campaignsApi.delete(id).catch(console.error)
}
```

### File Auto-Save

`FileEditor.tsx` uses 1-second debounce:

```
User types → local state updates → 1s debounce → saveFileAsync() → PUT /api/campaigns/:id/files/:type
```

Save status indicator: Saved / Saving... / Unsaved

### WebSocket Singleton Architecture

The WebSocket is a **module-level singleton** (`client/src/lib/websocket-manager.ts`), not a React-lifecycle resource. This guarantees exactly one connection per browser tab regardless of how many components call `useWebSocket()`.

**Auth-gated connection (Bug #6 fix):**

The connection is NOT opened on component mount. Instead, the auth layer explicitly triggers it:

```
Components mount → subscribe() (ref counting only, no connection)
                         ↓
Clerk loads (isLoaded && isSignedIn) → App.tsx calls connectWithAuth(tokenGetter)
                         ↓
Manager stores tokenGetter, sets authReady=true, calls connect()
                         ↓
connect() awaits storedTokenGetter() → opens WebSocket with JWT
```

- **Dev mode:** `DevModeApp` calls `connectWithAuth()` (no token getter) immediately on mount.
- **Production:** `AuthenticatedApp` calls `connectWithAuth(stableTokenGetter)` in a `useEffect` gated on `isLoaded && isSignedIn`.
- **Reconnects:** Reuse the stored `tokenGetter`, so they are always authenticated.

**Key mechanisms:**
- `authReady` — gate flag set by `connectWithAuth()`. `connect()` returns early if false.
- `storedTokenGetter` — token getter stored at module level, reused on every connect/reconnect.
- `connectionGeneration` — monotonic counter incremented on connect/disconnect. Every handler closure captures its generation and is rejected if stale.
- `subscriberCount` — ref counting across hook instances. Last unmount triggers disconnect. Handles React StrictMode (1→0→1) and multiple components (1→2→3→4).
- `killSocket()` — nulls all event handlers before closing to prevent stale callbacks.
- Server-side: `handleSubscribe` closes previous WebSocket (code 4001) before overwriting. `ws.on('close')` only nullifies if `sessionConnections.get(sessionId) === ws`.

**Reconnection:**
- Auto-reconnect with exponential backoff (max 5 attempts, 2s base delay)
- Code 4001 ("replaced") skips reconnect (intentional replacement, not failure)
- 25-second heartbeat ping from client, 30-second from server
- On reconnect: checks localStorage for active session, subscribes if found

### SDK Stream Lifecycle (Dual AbortController Pattern)

The Claude SDK spawns a CLI subprocess. Communication flows through stdin (input) and stdout (output). The prompt generator (async generator) feeds user messages to stdin via the SDK's `streamInput()`. The SDK only closes stdin (`endInput()`) after the generator returns — if the generator stays alive, stdin stays open.

**Why stdin must stay open:** The MCP bridge (nano-banana image generation) sends tool responses back to the CLI via stdin. If stdin closes mid-generation, the CLI can't receive MCP results → "MCP connection issues."

**Why the generator must eventually close:** The SDK yields a `result` message when the CLI finishes. But the CLI won't exit until stdin closes. If the generator never returns → stdin never closes → CLI never exits → the `for await` loop hangs forever → **deadlock.**

**Solution: two separate AbortControllers with different jobs.**

```
doneController (lifecycle)           abortController (cancellation)
  created in ai-client.ts             passed from websocket-handler.ts
  signal → prompt generator            passed to SDK options
  "generation finished, close up"      "user cancelled, kill process"
```

**Flow:**

```
1. Generator yields user message → awaits doneSignal
2. stdin stays open → MCP bridge works for entire generation
3. CLI finishes all turns (research → hooks → images)
4. CLI sends 'result' via stdout
5. readMessages() yields 'result' to our for-await loop
6. ai-client detects message.type === 'result' → doneController.abort()
7. Generator resolves → returns → streamInput() calls endInput()
8. stdin closes → CLI exits → loop exits naturally
9. websocket-handler sends 'complete' to frontend
```

**Cancellation flow (separate path):**

```
handleCancel() → state.abortController.abort()
                      ↓
              SDK kills CLI subprocess (via spawn signal)
                      ↓
              readMessages() ends → for-await throws AbortError
                      ↓
              finally block: doneController.abort() (cleanup)
```

**Files:** `server/lib/ai-client.ts` (createPromptGenerator, queryWithSession), `server/lib/websocket-handler.ts` (handleGenerate, handleCancel)

### Real-Time Image Streaming (Bug 4 Fix)

The MCP nano-banana tool batches all images into a single `tool_result`, which is fragile on cancellation. A shared `EventEmitter` side-channel provides immediate per-image notification:

```
MCP saves image to disk → imageEvents.emit('image-saved', metadata)
                                  ↓
              websocket-handler onImageSaved listener
                  ↓                          ↓
          db.addCampaignImage()    broadcastToConnection({ type: 'image' })
```

**Session ID mapping:** The AI model passes a human-readable name (e.g. `"mostunderated"`) as the MCP tool's `sessionId`, but the WS handler uses a UUID. When `processSDKMessage` sees the `tool_use` block for `mcp__nano-banana__generate_ad_images`, it calls `registerMcpSession(mcpId, wsId)`. The listener resolves via `resolveWsSessionId()`.

**Deduplication:** Both the EventEmitter (primary, immediate) and SDK stream `tool_result` (fallback, batched) can deliver images. A per-generation `processedImageIndices` Set ensures each image is only persisted and broadcast once.

**Files:** `server/lib/image-events.ts`, `server/lib/nano-banana-mcp.ts`, `server/lib/websocket-handler.ts`

### Follow-Up Chat (Chunk C)

After initial generation, users can send follow-up messages to the AI about an existing campaign. The flow:

```
Client: ChatSidebar → followUp(campaignId, prompt)
  → store.startFollowUp() (atomic: user + assistant messages, set generating state)
  → store.openThinkingBlock()
  → wsManager.sendMessage({ type: 'follow_up', prompt, campaignId })

Server: handleFollowUp(state, prompt, campaignId)
  → getCampaignById(campaignId, userId)     // auth check
  → getSdkSessionId(campaignId)              // from SQLite
  → aiClient.queryWithSession(prompt, wsSessionId)  // SDK auto-resumes via JSONL history
  → processSDKMessage() loop                 // same as handleGenerate
  → broadcastToConnection({ type: 'complete' })

Client: handleMessage receives events normally
  → addThinkingChild / appendTextBlock / completeGeneration
```

**Concurrency guard:** `ConnectionState.isGenerating` prevents overlapping `generate` + `follow_up` calls. Both handlers check and set it; both reset in `finally`.

**SDK session resume:** `sdk_session_id` is captured from the SDK's `system/init` message during initial generation (C.2) and persisted to SQLite. On follow-up, `handleFollowUp` retrieves the `sdk_session_id` from the database and passes it directly to `queryWithSession` as the 6th parameter (`resumeSdkSessionId`). This bypasses the in-memory SessionManager lookup (which uses different internal session IDs) and ensures the SDK receives `{ resume: sdkSessionId }` → SDK reads JSONL history from `~/.claude/projects/{slug}/{sdkSessionId}.jsonl` and appends new messages to the same file. Each campaign has exactly one SDK session ID that persists across all follow-ups.

**Phase detection:** Text-based phase detection was removed (C.4) to prevent false positives when the AI *discusses* research/hooks/images during follow-ups. Phase events now only come from explicit tool invocations.

**Known limitation (testing):** The AI doesn't have automatic access to campaign file content (research.md, hooks.md, prompts.json) during follow-ups — it tries to Glob for them on disk. C.10 (deferred) will inject file context from the DB into the prompt server-side.

### Type Transformers (API ↔ Store)

`client/src/lib/api.ts` converts between API snake_case and store camelCase:

```typescript
// API response: { user_id, created_at, session_id, ... }
// Store object: { userId, createdAt, sessionId, ... }
transformCampaign(apiCampaign) → StoreCampaign
transformFolder(apiFolder) → StoreFolder
transformMessage(apiMessage) → StoreChatMessage
```

### Message & Block Persistence

AI responses and thinking blocks now persist to the database for display after page refresh.

**Server-side (websocket-handler.ts):**

- `TextAccumulator`: Captures AI text during streaming. The accumulated text is saved to the `content` field when the assistant message is written to DB.
- `BlockBuilder`: Constructs thinking blocks (phases, tools, progress) during generation. Mirrors client-side block structure so it renders correctly after refresh.

```typescript
// BlockBuilder methods
openThinkingBlock(label, expectedImages)  // Start a new thinking block
addThinkingChild(kind, text, variant?)    // Add tool/phase/status children
incrementCompletedImages()                 // Track image progress
closeThinkingBlock(status)                 // Close with 'complete' or 'error'
addTextBlock(content)                      // Add final summary text
getBlocks()                                // Returns blocks array (filters empty)
```

**Client-side (api.ts):**

`transformMessage()` parses the `blocks` JSON field and:
- Converts timestamps from ISO strings to Date objects
- Sets thinking blocks to collapsed by default after refresh

**Database:**

The `messages.blocks` column stores a JSON array of `MessageBlock` objects (thinking, text, status types).

### Image Placeholder Detection

`parseExpectedImageCount(prompt)` determines how many image placeholders to show:

```typescript
// Explicit count: "3 ads", "two images" → use that count
// URL or generation keywords → 6 (default for generation)
// Simple chat ("hi") → 0 (no placeholders)

const hasUrl = /https?:\/\/|www\.|\.com|\.org|\.net|\.io/i.test(prompt)
const hasGenerationKeywords = /\b(generate|create|make|build|design|campaign|brand|website|business)\b/i.test(prompt)
```

The server also sends `imageCount` in the `phase: 'images'` event, which updates `generationExpectedImages` when the MCP tool is invoked.

---

## Known Bugs & Fixes

### Phase A-D Bugs (all fixed)

| # | Bug | Severity | Root Cause | Fix Location |
|---|-----|----------|-----------|-------------|
| 1 | Chat history lost on refresh | High | WS handler never wrote messages to DB; App.tsx discarded messages from API | `websocket-handler.ts` (write messages), `App.tsx` (load messages) |
| 2 | Prompt lost after login | Medium | Clerk modal wiped Zustand; `requireAuth` callback never fired | `AuthContext.tsx` (ref-based callback), `App.tsx` (ref-based token getter) |
| 3 | Cancel didn't stop generation | High | Two separate AbortControllers (handler vs SDK) | `ai-client.ts` (external abort controller param), `websocket-handler.ts` (pass shared controller) |
| 4 | API 400 on file save | Medium | tsx hot-reload crash (iconv-lite) temporarily broke server | `sdk-server.ts` (middleware order) |
| 5 | iconv-lite module error | Low | tsx watch hot-reload issue (dev only) | Development environment only |

### Phase E Bugs (see docs/BUGS.md for full details)

| # | Bug | Severity | Status | Fix |
|---|-----|----------|--------|-----|
| 1 | Multiple WS connections on refresh | High | Fixed | WebSocket singleton (`websocket-manager.ts`), server close-before-overwrite |
| 2 | Chat disappears after recovery | High | Resolved | Fixed by Bug 1 — singleton eliminates multi-connection race |
| 3 | Cancel marks campaign as `error` | Medium | Fixed | `catch` block detects `AbortError` and routes to cancel path instead of error path |
| 4 | Images not saved to DB or shown in UI | Critical | Fixed | EventEmitter side-channel (`image-events.ts`), per-image notification from MCP tool, MCP↔WS session ID mapping |
| 5 | Cancel doesn't stop fal.ai requests | Low | Won't fix | Inherent limitation of external API calls; mitigated by Bug 4 fix |
| 6 | Anonymous WS connection on page load | Low | Fixed | Auth-gated connection: `connectWithAuth()` called only after `isLoaded && isSignedIn`; `subscribe()` does ref counting only |
| 7 | Images vanish on page refresh | High | Fixed | `ApiImage` interface had wrong field names (`url` vs `file_path`); fixed in `client/src/lib/api.ts` |
| 8 | SDK stream deadlock (generation never completes) | Critical | Fixed | Prompt generator blocked forever with `await new Promise(() => {})`, preventing SDK from closing stdin. Fixed with dual AbortController: `doneController` signals generator to close when `result` received; separate from SDK `abortController` for user cancellation. See "SDK Stream Lifecycle" in Key Implementation Patterns. |
| 9 | MCP "connection issues" (images not generating) | Critical | Fixed | Prompt generator returning immediately caused SDK's 60s `streamCloseTimeout` to fire, closing stdin before MCP tools completed. Fixed by same dual AbortController — generator stays alive until `result`, keeping stdin open for MCP bridge. |
| 10 | Follow-up has no context (hasResume: false) | Critical | Fixed | `handleFollowUp` retrieved `sdkSessionId` from DB but never passed it to SDK. `queryWithSession` created new sessions each time because SessionManager uses different internal IDs. Fixed by adding 6th param `resumeSdkSessionId` to `queryWithSession` — DB value now passed directly, bypassing SessionManager lookup. |
| 11 | AI responses show generic text after refresh | High | Fixed | AI text responses were broadcast via WebSocket but never accumulated for DB storage. Only hardcoded summaries were saved. Fixed by adding `TextAccumulator` to capture streamed text and save to `messages.content`. |
| 12 | Thinking blocks lost on refresh | High | Fixed | Collapsible workflow blocks (phases, tools, progress) weren't persisted. Added `BlockBuilder` class to construct blocks server-side, `blocks` column to messages table, and parsing in `transformMessage()`. |
| 13 | ThinkingBlock shows "Thinking" instead of phase label | Low | Fixed | Hardcoded label in `ThinkingBlock.tsx`. Fixed to use `block.label` for actual phase names ("Researching", "Generating Hooks", etc.). |
| 14 | 6 image placeholders shown for simple chat messages | Medium | Fixed | `parseExpectedImageCount` defaulted to 6 for all prompts. Updated to detect generation requests (URLs, keywords) vs simple chat. Simple messages like "hi" now show 0 placeholders. |

---

## Remaining Work

### Chat Implementation

See `docs/CHAT_IMPLEMENTATION_PLAN.md` for full details.

- [x] **Chunk A** — Bug fixes (prompt race, store event drops, re-render storm, duplicate component)
- [x] **Chunk B** — Block-based message display (TextBlock, ThinkingBlock, StatusBlock)
- [x] **Chunk C** (C.1–C.9) — Real follow-up chat with AI (SDK session resume, `follow_up` WS message, concurrency guard)
- [ ] **Chunk C.10** — @mention file context injection (deferred to polish)

### Phase E: Polish & Testing (Pending)

**Testing checklist:**
- [x] Prompt reaches server correctly every time
- [x] Generation runs to completion with all events visible
- [x] "Single ad" shows 1 image placeholder (dynamic expected count)
- [x] Refresh preserves data (create → refresh → still visible) — AI text and thinking blocks now persist
- [x] Simple chat ("hi") shows no image placeholders
- [ ] Reconnect during generation (refresh mid-gen → auto-reconnects)
- [ ] Incomplete detection (restart server → campaign shows incomplete)
- [ ] Resume functionality (click Resume → generation restarts)
- [ ] Auth flow with Clerk (sign out → sign in → data preserved)

**Polish tasks:**
- [ ] Error handling toasts
- [ ] Loading state skeletons
- [ ] Retry logic for API failures
- [ ] Offline state handling

### Cloudflare Migration (Future)

| Local | Production | Change |
|-------|-----------|--------|
| SQLite (better-sqlite3) | Cloudflare D1 | Same SQL, different API (`db.prepare().bind().all()`) |
| Filesystem (uploads/) | Cloudflare R2 | `env.BUCKET.put()` |
| In-memory event buffer | Durable Objects | Survives server restart |
| Express + ws | Workers + DO WebSocket | DO handles WS natively |
| Clerk `@clerk/express` | Clerk `@clerk/backend` | `verifyToken()` instead of middleware |
| SDK JSONL files (`~/.claude/projects/`) | Cloudflare R2 | Sync on container shutdown (SIGTERM), hydrate before follow-up |

**SDK Session Persistence (R2):** Cloudflare Containers have ephemeral disk — JSONL files are wiped when container sleeps. Solution: persist to R2 on shutdown (15-min grace period after SIGTERM), hydrate from R2 before follow-up calls. See `docs/R2_SESSION_PERSISTENCE.md` for implementation plan.

---

*This is the single source of truth for codebase context. ARCHITECTURE.md has been removed.*
