# Creative Ad Agent — Architecture Document

> Updated 2026-02-23 (session 4). Covers the full system: client, server, agent ecosystem.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Server Architecture](#4-server-architecture)
5. [Client Architecture](#5-client-architecture)
6. [Agent Ecosystem](#6-agent-ecosystem)
7. [End-to-End Flows](#7-end-to-end-flows)
8. [Data Models & Types](#8-data-models--types)
9. [Known Issues & Gaps](#9-known-issues--gaps)
10. [Remaining Work](#10-remaining-work)

---

## 1. System Overview

A chat-based AI tool for generating ad campaigns. User provides a brand URL or description, and the system produces research, hooks (headlines), art prompts, and 6 AI-generated ad images — all streamed in real-time.

```
User ──► React Client (Vite) ──► WebSocket ──► Bun/Express Server
                                                      │
                                              Claude SDK (Haiku 4.5)
                                                      │
                                    ┌─────────────────┼─────────────────┐
                                    ▼                 ▼                  ▼
                            Research Agent    Hook Skill          Art Style Skill
                            (WebFetch)        (10 formulas)       (14 workflows)
                                    │                 │                  │
                                    ▼                 ▼                  ▼
                            research.md        hook-bank.md        prompts.json
                                                                        │
                                                                        ▼
                                                                MCP: nano-banana
                                                                 (fal.ai images)
                                                                        │
                                                                        ▼
                                                                  6 PNG images
                                                            streamed to client
```

### Pipeline Stages (Sequential)

| # | Stage | Agent/Tool | Input | Output |
|---|-------|-----------|-------|--------|
| 1 | Parse | Orchestrator | User prompt | URL, brand name, style, count |
| 2 | Research | Research Agent (Task) | Brand URL | `research/{brand}_research.md` |
| 3 | Hooks | Hook Methodology (Skill) | Research brief | `hook-bank/{brand}-{date}.md` |
| 4 | Art | Art Style (Skill) | Hook bank + style | `creatives/{brand}_prompts.json` |
| 5 | Images | nano-banana MCP | prompts.json | `generated-images/{sessionId}/*.png` |

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Client** | React 19, Vite 7, TypeScript 5.9 |
| **State** | Zustand 5 (single store, no router) |
| **Styling** | Tailwind CSS 4, Shadcn/ui, Radix UI |
| **Editor** | TipTap (rich text, Notion-like) |
| **Auth** | Clerk (prod) / anonymous (dev) |
| **Server** | Bun, Express 4.18, WebSocket (ws) |
| **Database** | SQLite via better-sqlite3 (WAL mode) |
| **AI** | Claude Agent SDK v0.1.54, model: claude-haiku-4-5-20251001 |
| **Images** | fal.ai Nano Banana Pro (Gemini 2.5 Flash) via MCP |
| **Icons** | lucide-react |

---

## 3. Directory Structure

```
creative-ad-agent/
├── client/                          # React frontend
│   └── src/
│       ├── components/
│       │   ├── layout/AppLayout.tsx  # Three-panel layout
│       │   ├── chat/                 # ChatSidebar, ChatInput, ChatMessage, blocks/
│       │   ├── editor/FileEditor.tsx # TipTap file editor
│       │   ├── assets/              # AssetDrawer, FileUpload, AssetPreview
│       │   ├── mentions/            # @ mention system
│       │   ├── auth/                # SignIn, UserMenu
│       │   ├── ui/                  # Shadcn components
│       │   ├── EmptyState.tsx       # Landing page
│       │   ├── ResultsView.tsx      # Image gallery + workspace
│       │   ├── ImageCard.tsx        # Image grid cards
│       │   └── ImageLightbox.tsx    # Full-screen image viewer
│       ├── store/index.ts           # Zustand store (~1000 lines)
│       ├── hooks/useWebSocket.ts    # WebSocket hook
│       ├── lib/
│       │   ├── websocket-manager.ts # WebSocket singleton
│       │   ├── api.ts               # REST API client
│       │   └── auth.ts              # Clerk helpers
│       ├── types/
│       │   ├── chat.ts              # Message, block, image types
│       │   └── websocket.ts         # WebSocket message types
│       └── contexts/AuthContext.tsx  # Auth provider
│
├── server/                          # Bun backend
│   ├── sdk-server.ts                # Entry point, Express + WS
│   ├── lib/
│   │   ├── ai-client.ts            # Claude SDK wrapper
│   │   ├── websocket-handler.ts    # WS message handling + streaming
│   │   ├── session-manager.ts      # Session lifecycle + persistence
│   │   ├── database.ts             # SQLite init + schema
│   │   ├── orchestrator-prompt.ts  # System prompt for AI
│   │   ├── nano-banana-mcp.ts      # fal.ai MCP server
│   │   ├── image-events.ts         # EventEmitter for image delivery
│   │   ├── event-buffer.ts         # Reconnect event replay
│   │   ├── auth.ts                 # Clerk middleware
│   │   ├── instrumentor.ts         # Cost/metrics tracking
│   │   └── db/                     # Database access layer
│   │       ├── campaigns.ts        # Campaign CRUD
│   │       ├── messages.ts         # Chat message persistence
│   │       ├── images.ts           # Image tracking
│   │       ├── files.ts            # Campaign files (research, hooks, prompts)
│   │       └── assets.ts           # User asset storage
│   └── routes/
│       ├── campaigns.ts            # Campaign REST endpoints
│       └── assets.ts               # Asset REST endpoints
│
├── agent/                           # AI agent ecosystem
│   └── .claude/
│       ├── agents/
│       │   └── research.md         # Data extraction agent
│       └── skills/
│           ├── hook-methodology/
│           │   ├── SKILL.md        # Hook generation (10 types)
│           │   ├── formulas.md     # Hook formula reference
│           │   └── hook-bank/      # Generated hook files (39 files)
│           └── art-style/
│               ├── SKILL.md        # Visual prompt routing
│               ├── workflows/      # 14 style workflows
│               │   ├── anderson-clay-diorama.md
│               │   ├── soft-brutalism-clay.md
│               │   ├── product-on-gradient.md
│               │   ├── editorial-cutout.md
│               │   ├── typography-dominant.md
│               │   ├── infographic-data-visual.md
│               │   ├── lifestyle-render-hybrid.md
│               │   ├── ugc-aesthetic-static.md
│               │   ├── analog-craft.md
│               │   ├── bold-energy.md
│               │   ├── clean-premium.md
│               │   ├── dream-sketch-hybrid.md
│               │   ├── service-realism.md
│               │   └── split-comparison.md
│               └── tools/
│                   ├── generate-images.ts  # Gemini 3 Pro standalone generator
│                   └── run-generate.sh     # Shell wrapper
│
├── generated-images/                # Output images per session
├── uploads/                         # User asset uploads
├── claude_sdk/                      # SDK reference documentation
└── docs/                            # Architecture & session docs
```

---

## 4. Server Architecture

### 4.1 Entry Point: `sdk-server.ts`

Express app + WebSocket server on port 3001.

**REST Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/generate` | One-shot generation (REST, not WebSocket) |
| GET | `/health` | Health check with config status |
| POST | `/test` | Session-aware SDK query with observability |
| GET | `/sessions` | List active sessions |
| GET | `/sessions/:id` | Session statistics |
| POST | `/sessions/:id/continue` | Resume session with new prompt |
| POST | `/sessions/:id/fork` | Fork session for creative variants |
| GET | `/sessions/:id/family` | Session family tree (base + forks) |
| GET | `/campaigns/:id/metrics` | Campaign generation metrics |
| GET | `/images` | List all generated images by session |
| GET | `/images/:sessionId/:filename` | Serve individual image |
| GET/POST | `/api/campaigns` | List / create campaigns |
| GET/PATCH/DELETE | `/api/campaigns/:id` | Get / update / delete campaign |
| GET/PUT | `/api/campaigns/:id/files/:type` | Get / update campaign file |
| GET | `/api/campaigns/:id/images` | List campaign images |
| GET/POST | `/api/campaigns/:id/messages` | Get / add chat messages |
| GET | `/api/campaigns/:id/status` | Campaign status + agent state |
| GET/POST | `/api/assets/folders` | List / create folders |
| PATCH/DELETE | `/api/assets/folders/:id` | Rename / delete folder |
| GET | `/api/assets/folders/:id/files` | List folder files |
| POST | `/api/assets/upload` | Upload file (multer, 10MB limit) |
| GET | `/api/assets/files/:id` | Serve asset file |
| DELETE | `/api/assets/files/:id` | Delete file |

**WebSocket:** `ws://localhost:3001/ws?token={jwt}`

### 4.2 WebSocket Handler (`lib/websocket-handler.ts`)

Handles real-time generation streaming. Message types:

**Client → Server:**

| Type | Purpose |
|------|---------|
| `generate` | Start new campaign generation |
| `follow_up` | Continue conversation on existing campaign |
| `cancel` | Cancel in-progress generation |
| `subscribe` | Reconnect and replay buffered events |
| `ping` | Keepalive |

**Server → Client:**

| Type | Purpose | Key Fields |
|------|---------|------------|
| `ack` | Confirms campaign created | `campaignId` (server-assigned) |
| `phase` | Workflow stage change | `phase`, `label`, `imageCount` |
| `tool_start` | Tool execution began | `tool`, `input` |
| `tool_end` | Tool execution finished | `toolId` |
| `file` | Campaign file generated | `fileType`, `content` |
| `image` | Image generated | `urlPath`, `hookType`, `imageIndex` |
| `message` | Streamed text (follow-ups) | `text` |
| `complete` | Generation finished | `summary`, `duration`, `imageCount` |
| `error` | Generation failed | `error` |
| `status` | Status updates | `status` (cancelled, etc.) |
| `subscribed` | Reconnect acknowledged | `sessionId` |

**Generation Flow (`handleGenerate`):**
1. Creates campaign in DB immediately
2. Persists user prompt as a message
3. Calls `aiClient.query()` with orchestrator prompt
4. Iterates async generator — maps SDK events to WebSocket events
5. BlockBuilder structures events into thinking/text/status blocks
6. On completion: persists assistant message + blocks to DB

**Event Buffering (`lib/event-buffer.ts`):**
- Buffers all events with sequential IDs (max 1000 per session)
- 40-minute TTL for stale buffers
- On `subscribe`: replays events from `lastEventId` onward
- Enables seamless reconnection mid-generation
- Cleared at start of `handleFollowUp` to prevent stale events (e.g., cancel) from poisoning follow-up recovery replay
- Cleared 60s after generation ends (guarded: skipped if a follow-up has started for the same session)

### 4.3 AI Client (`lib/ai-client.ts`)

Wraps `@anthropic-ai/claude-agent-sdk`.

**Configuration:**
- Model: `claude-haiku-4-5-20251001`
- Max turns: 30
- CWD: `agent/` directory (for agent/skill discovery)
- Setting sources: `['user', 'project']`

**Allowed Tools:**
Task, Skill, TodoWrite, WebFetch, Read, Write, Glob, WebSearch, Bash, Edit, Grep, `mcp__nano-banana__generate_ad_images`

**MCP Servers:** `{ "nano-banana": nanoBananaMcpServer }`

**Session Management:**
- Sessions persisted as JSONL in `sessions/` directory
- Resume: loads SDK session ID, falls back to fresh session on failure
- Fork: creates branch from existing session for A/B testing

### 4.4 Database Schema (`lib/database.ts`)

SQLite with WAL mode, foreign keys enabled.

**Tables:**

```sql
campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'generating',  -- generating|complete|incomplete|error|cancelled
  session_id TEXT,
  sdk_session_id TEXT,               -- Claude SDK session ID for resume/fork
  created_at DATETIME,
  updated_at DATETIME
)

campaign_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,           -- research|hooks|prompts
  content TEXT DEFAULT '',
  is_ready INTEGER DEFAULT 0,
  updated_at DATETIME,
  UNIQUE(campaign_id, file_type)
)

campaign_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  image_index INTEGER NOT NULL,      -- 1-6
  hook_type TEXT NOT NULL,           -- stat|story|fomo|curiosity|callout|contrast
  prompt TEXT,
  file_path TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at DATETIME,
  UNIQUE(campaign_id, image_index, version)
)

messages (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                 -- user|assistant
  content TEXT NOT NULL,
  image_refs TEXT,                    -- JSON (selected image references)
  file_refs TEXT,                     -- JSON (selected file references)
  blocks TEXT,                        -- JSON (MessageBlock[]) — added via migration
  created_at DATETIME
)

asset_folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME
)

asset_files (
  id TEXT PRIMARY KEY,
  folder_id TEXT REFERENCES asset_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,            -- image|document|other
  size INTEGER,
  created_at DATETIME
)
```

### 4.5 MCP Image Generation (`lib/nano-banana-mcp.ts`)

Custom MCP server for fal.ai's Nano Banana Pro.

**Tool:** `mcp__nano-banana__generate_ad_images`

**Capabilities:**
- 1-6 images per call
- Text-to-image (default) or edit mode (when reference images provided)
- Aspect ratios: 21:9, 16:9, 4:3, 1:1, 3:4, 9:16
- Resolutions: 1K, 2K, 4K
- Web search grounding for real-time data

**Image Delivery:**
1. fal.ai returns image URLs
2. MCP server downloads and saves to `generated-images/{sessionId}/`
3. Emits `image-saved` event via `imageEvents` EventEmitter
4. WebSocket handler catches event → persists to DB + sends to client

**Hook Type Mapping (by index):**
```
Index 0 → stat
Index 1 → story
Index 2 → fomo
Index 3 → curiosity
Index 4 → callout
Index 5 → contrast
```

### 4.6 Session Manager (`lib/session-manager.ts`)

Separate from SQLite — in-memory session store with JSON file persistence.

- Sessions stored in `sessions/*.json` (auto-saved on creation, every 10 messages, on SDK session link)
- Tracks: SDK session IDs, message history, fork relationships, metadata
- Supports session forking for A/B testing of creative directions
- Cleanup: hourly, deletes sessions >24h old or inactive >1h
- Linked to SQLite via `session_id` and `sdk_session_id` columns on campaigns table

**Note:** This is a DUAL persistence system — SessionManager (JSON) for SDK session state, SQLite for user-facing data. Both are needed.

### 4.7 Event System (`lib/image-events.ts` + `lib/event-buffer.ts`)

**Image Events:** EventEmitter bridging MCP → WebSocket. When the MCP tool generates an image, it emits `image-saved`. The WebSocket handler catches this and streams the image to the client. A session mapping (`registerMcpSession` / `resolveWsSessionId`) bridges MCP session IDs to WebSocket session IDs.

**Event Buffer:** In-memory buffer per session for reconnect resilience.
- Sequential event IDs, max 1000 events (trims to latest 500)
- 40-minute TTL (resets on each append)
- `getEventsSince(sessionId, afterId)` replays missed events
- Cleanup: every 5 minutes, removes stale buffers

### 4.8 Instrumentation (`lib/instrumentor.ts`)

Tracks generation metrics: SDK events, tool calls, token usage, cost (from `message.total_cost_usd`), timing, turn count.

### 4.9 Authentication (`lib/auth.ts`)

- **Production:** Clerk JWT verification via JWKS
- **Dev mode:** Anonymous user when `CLERK_SECRET_KEY` not set
- **WebSocket:** Token passed as query parameter, verified on connection
- **Middleware:** `authRequired` (protected), `authOptional` (graceful fallback)

---

## 5. Client Architecture

### 5.1 Entry Point & Rendering

```
main.tsx
  └── ClerkProvider (if auth enabled) OR direct render
        └── App.tsx
              └── AuthProvider (Clerk or DevMode)
                    └── AppContent
                          ├── Data loading (campaigns, assets from API)
                          ├── Session recovery (localStorage check)
                          └── AppLayout
                                ├── [Landing]  EmptyState + LandingHeader
                                └── [Workspace] ResultsView + sidebars
```

**Navigation:** No React Router. Zustand state machine:
- `appState: 'landing' | 'workspace'`
- `activeCampaignId` determines what's shown
- `isCreatingCampaign` flag for new campaign mode

### 5.2 Layout System (`components/layout/AppLayout.tsx`)

Three-panel layout with collapsible sidebars:

```
┌────────────┬────────────────────────┬──────────────┬─────────────┐
│   Assets   │                        │     Chat     │   Editor    │
│  Sidebar   │    Main Content        │   Sidebar    │   Panel     │
│  (left)    │  (EmptyState or        │   (right)    │  (optional) │
│            │   ResultsView)         │              │             │
│  200-480px │      flex-1            │  200-480px   │  300-600px  │
│  def: 256  │                        │  def: 256    │  def: 400   │
│  collapsed:│                        │  collapsed:  │             │
│    48px    │                        │    48px      │             │
└────────────┴────────────────────────┴──────────────┴─────────────┘
```

- Widths saved to localStorage, restored on mount
- Resize via mouse drag on panel edges
- Keyboard: `Cmd+[` toggles left, `Cmd+]` toggles right
- Mobile: sidebars become drawers (sheet/vaul)

### 5.3 Zustand Store (`store/index.ts`)

Single store (~1060 lines) organized into sections:

| Section | Key State | Key Actions |
|---------|-----------|-------------|
| **App** | `appState`, `isCreatingCampaign` | `setAppState()` |
| **Campaigns** | `campaigns[]`, `activeCampaignId`, `generatingCampaignId` | `addCampaign()`, `removeCampaign()`, `replaceCampaignId()` |
| **Files** | `activeFileType` | `updateCampaignFile()`, `setFileReady()` |
| **Images** | `selectedImageIds[]` | `addImageToCampaign()`, `toggleImageSelection()` |
| **Generation** | `prompt`, `pendingGeneration` | `startGeneration()`, `completeGeneration()`, `failGeneration()` |
| **WebSocket** | `sessionId`, `connectionState`, `isRecovering` | `setConnectionState()` |
| **Chat** | `chatMessages{}`, `currentGeneratingMessageId` | `addChatMessage()`, `appendTextBlock()`, `openThinkingBlock()` |
| **Blocks** | (nested in chat) | `addThinkingChild()`, `closeThinkingBlock()`, `updateThinkingImages()` |
| **Recovery** | `isRecovering`, `_pendingImages`, `_pendingFiles` | `reconstructForRecovery()`, `cleanupFailedRecovery()`, `setChatMessagesForCampaign()` |
| **Assets** | `assetFolders[]` | `addFolder()`, `addFileToFolder()` |
| **Async** | (API sync) | `deleteCampaignAsync()`, `saveFileAsync()` |

**Key patterns:**
- Immutable updates (spread, map, filter — never mutate)
- `get()` for derived reads without subscribing
- Optimistic async (update local first, sync to API)
- Explicit `campaignId` passing to avoid stale closure bugs

**Event Buffering for Recovery:**

When replay events arrive (via `subscribe`) before `setCampaigns` has loaded campaign data from the API, `addImageToCampaign` and `updateCampaignFile` buffer events into `_pendingImages` / `_pendingFiles` instead of silently dropping them. When `setCampaigns` runs, it flushes the buffers by merging pending images/files into the incoming campaign data. Buffers are cleared on `cleanupFailedRecovery` and `completeGeneration`.

**Chat Message Preservation:**

`setChatMessages` has a guard: if `generatingCampaignId` is set, the generating campaign's messages are preserved (not overwritten by stale DB data from the bulk load in App.tsx). The recovering campaign's historical messages are loaded separately by `handleConnected` via `setChatMessagesForCampaign`.

### 5.4 WebSocket Integration

**Singleton Manager (`lib/websocket-manager.ts`):**
- Module-level `activeSocket` — one connection per browser tab
- Connection generation counter prevents race conditions
- Subscriber count pattern (connect on first, disconnect on last)
- Reconnection: 5 attempts, 2s × attempt delay
- Ping/pong keepalive every 25 seconds

**Hook (`hooks/useWebSocket.ts`):**
- Registers callbacks with singleton manager
- Processes server messages → dispatches store actions
- Exposes: `generate()`, `cancel()`, `resume()`, `followUp()`
- `handleConnected`: owns recovery flow — checks localStorage for active session, calls `reconstructForRecovery`, subscribes immediately
- `handleConnected` is idempotent — safe to call multiple times (React StrictMode causes mount→unmount→remount). If recovery is already active for the same campaign, it re-subscribes without creating duplicate messages
- `handleMessage`: routes server events to store actions, tracks `lastEventId` for recovery

**Session Persistence:**
- Stored in `localStorage['creative-agent:activeSession']`
- Contains: `sessionId`, `prompt`, `campaignId`, `messageId`, `startedAt`
- Saved by `generate()`, `resume()`, and `followUp()` on action start
- Cleared on generation complete/error/cancel
- Checked by `handleConnected` on reconnect for recovery

### 5.5 Chat System (`components/chat/`)

**Message Structure:**
```
ChatMessage
  ├── role: 'user' | 'assistant'
  ├── content: string
  └── blocks?: MessageBlock[]
        ├── TextBlock      — streamed text content
        ├── ThinkingBlock  — collapsible progress (phases, tools, images)
        │     ├── label: "Researching..."
        │     ├── status: active | complete | error
        │     ├── children: ThinkingChild[]
        │     │     ├── kind: phase | tool | status | progress | result | error | text
        │     │     └── text, timestamp, variant?
        │     ├── completedImages / expectedImages
        │     └── expanded: boolean
        └── StatusBlock    — info/success/error pills
```

**Rendering chain:**
`ChatSidebar` → `ChatMessage` → `BlockRenderer` → `TextBlock | ThinkingBlock | StatusBlock`

### 5.6 File Editor (`components/editor/FileEditor.tsx`)

- TipTap rich text editor (StarterKit + Placeholder)
- Three tabs: research, hooks, prompts
- Auto-save with 1-second debounce
- Save flow: `onUpdate` → debounce → `updateFileContent()` (local) + `saveFileAsync()` (API)
- Undo/redo buttons, save status indicator (saved/saving/unsaved)

### 5.7 Assets & Mentions

**Assets Panel (`components/assets/AssetDrawer.tsx`):**
- Two sections: Campaigns (collapsible) and Assets
- Campaigns section header is clickable — collapses to single line with count badge, giving more room for assets
- Folder tree with file upload (server-persisted via `POST /api/assets/upload`)
- File preview and delete/rename

**@ Mentions (`components/mentions/AssetMention.tsx`):**
- Detects `@` in chat input → opens dropdown
- Sources: campaign images, campaign files, asset folders/files
- Keyboard navigation (arrows, enter, escape)
- Selected items appear as colored pills above input
- On submit: prefixed to message content (e.g., `@research @folder-name [Image 3]`)

### 5.8 Auth Flow

**Two modes:**
- **Production:** `ClerkProvider` wraps app → `useAuth()` for tokens → `wsManager.connectWithAuth(tokenGetter)`
- **Dev mode:** `DevAuthProvider` → `requireAuth()` always succeeds → no Clerk

**Auth guard pattern (EmptyState):**
1. User types prompt → saved to sessionStorage
2. `requireAuth(callback)` — if not signed in, opens Clerk sign-in
3. After sign-in redirect, callback executes → `generate(prompt)`

### 5.9 API Layer (`lib/api.ts`)

- Base `apiFetch<T>()` adds auth headers + error handling
- Type transformers: snake_case (server) → camelCase (client)
- Campaigns API: list, get, create, update, delete, updateFile, getStatus
- `transformCampaign` populates `sessionId` from `api.session_id` (used by follow-up for recovery session saving)
- Assets API: listFolders, createFolder, renameFolder, deleteFolder, getFiles, deleteFile, uploadFile

### 5.10 Styling

- **Theme:** Dark mode (charcoal #0f0f0f base)
- **Accent:** Electric coral (#ff6b6b) with glow effects
- **Pop:** Deep blue (#4361ee)
- **Fonts:** DM Sans (body), JetBrains Mono (code)
- **Animations:** slideUp, fadeIn, glow-pulse, dot-pulse, mesh-float
- **Components:** Custom button variants (glow, outline, ghost)

---

## 6. Agent Ecosystem

### 6.1 Research Agent (`agent/.claude/agents/research.md`)

**Purpose:** Extract factual data from brand homepages.

**Tools:** WebFetch, Read, Write

**Workflow:**
1. Extract brand name from URL
2. WebFetch homepage with extraction prompt
3. Analyze target audience / ICP (WHO, PAIN POINTS, MOTIVATIONS, LANGUAGE)
4. Write output to `agent/files/research/{brand}_research.md`

**Output sections:** The Offer, Key Value Props, Proof Points, Products/Services, Pain Points, Testimonials, Brand Colors, Brand Voice, Messaging, Target Audience/ICP

**Constraints:** ~60-70 lines max, specific numbers only, exact quotes from site.

### 6.2 Hook Methodology Skill (`agent/.claude/skills/hook-methodology/`)

**Purpose:** Generate conversion-focused ad hooks traceable to research data.

**Core philosophy:** "Research first. Every hook has a SOURCE."

**10 Hook Types:**

| Category | Type | Trigger |
|----------|------|---------|
| Attention | Question | Challenge assumptions |
| Attention | Surprising Stat | Unexpected numbers |
| Attention | Pattern Interrupt | Break expectations |
| Attention | Controversial | Challenge beliefs |
| Attention | Direct Address | Call out specific situation |
| Desire | Social Proof | Collective validation |
| Desire | Problem-Solution | Name pain, hint relief |
| Desire | Contrast | Before/after gap |
| Desire | FOMO/Urgency | Time pressure |
| Desire | Curiosity | Tease hidden info |

**5-Step Workflow:**
1. **EXTRACT** — Read every section of research brief
2. **MATCH** — Map research elements to hook types
3. **CONSTRUCT** — Build hooks: TYPE, SOURCE, TARGET, HOOK, WHY IT WORKS
4. **BODY + CTA** — Add body (1-2 sentences) + CTA (Action Verb + Implied Outcome)
5. **VARIETY CHECK** — Diversity matrix (3+ hook types, multiple ICP segments, 3+ emotional territories)

**Validation (every hook must pass):** TRACEABLE, OWNED, FELT, CLEAR, THEIRS

**Output:** `hook-bank/{brand}-{YYYY-MM-DD}.md` (default 3 hooks, orchestrator requests 6)

### 6.3 Art Style Skill (`agent/.claude/skills/art-style/`)

**Purpose:** Create visual prompts from hooks. Routes to style workflow.

**Style Routing (keyword → workflow):**

| Keywords | Workflow |
|----------|----------|
| clay, diorama, anderson, theatrical, miniature | `anderson-clay-diorama.md` |
| brutalism, soft brutalism, neo-brutalist, bold borders | `soft-brutalism-clay.md` |
| gradient, product shot, minimal product, clean product | `product-on-gradient.md` |
| editorial, cutout, magazine, collage, premium | `editorial-cutout.md` |
| type, typography, text, bold text, poster | `typography-dominant.md` |
| infographic, data, chart, comparison, education | `infographic-data-visual.md` |
| lifestyle, environment, scene, context, atmospheric | `lifestyle-render-hybrid.md` |
| ugc, testimonial, review, social proof, screenshot | `ugc-aesthetic-static.md` |
| (none) | Auto-select 3-4 styles based on brand category |

Additional workflows (routed via category-aware defaults): `analog-craft.md`, `bold-energy.md`, `clean-premium.md`, `dream-sketch-hybrid.md`, `service-realism.md`, `split-comparison.md`.

**Output:** `agent/files/creatives/{brand}_prompts.json`

```json
{
  "brand": "...",
  "style": "...",
  "brandColors": {...},
  "concepts": [
    {
      "concept": "...",
      "story": { "hookType", "hookSource", "hookTarget", "visualMetaphor", "psychology", "hook", "body", "cta" },
      "stage": { "heroObject", "background", "border", "negativeSpace" },
      "prompt": "...",
      "aspectRatio": "...",
      "size": "..."
    }
  ]
}
```

### 6.4 Orchestrator Prompt (`server/lib/orchestrator-prompt.ts`)

Controls the AI agent's behavior. Defines the sequential pipeline:

1. Parse request → extract URL, brand name, style, image count
2. Spawn research agent via `Task` tool → generates research.md
3. Trigger hook-methodology via `Skill` tool → generates hook-bank.md
4. Trigger art-style via `Skill` tool → generates prompts.json
5. Read prompts.json → call `mcp__nano-banana__generate_ad_images`
6. Report completion with image URLs

**Rules:** Sequential only (each step depends on previous), pass brand name to each skill, default 6 images (max 6).

---

## 7. End-to-End Flows

### 7.1 New Campaign Generation

```
User types prompt in EmptyState.tsx
    │
    ├── setPrompt() → store
    ├── requireAuth() → Clerk sign-in if needed
    │
    ▼
useWebSocket.generate(prompt)
    │
    ├── sessionId = crypto.randomUUID()
    ├── campaignName = extractFromPrompt(prompt)
    ├── store.startGeneration(sessionId, name, prompt)
    │     ├── Creates campaign (id, name, status='generating', empty files)
    │     ├── Creates user + assistant messages in chatMessages[campaignId]
    │     ├── Sets appState='workspace', activeCampaignId
    │     └── Returns { campaignId, messageId }
    ├── Save to localStorage: { sessionId, prompt, campaignId, messageId }
    ├── openThinkingBlock(campaignId, messageId, "Starting generation...")
    │
    └── wsManager.sendMessage({ type: 'generate', prompt, sessionId })
          │
          ▼
    Server: websocket-handler.handleGenerate()
          │
          ├── Create campaign in DB
          ├── Persist user message
          ├── Send ACK { type: 'ack', campaignId: serverCampaignId }
          │     └── Client: replaceCampaignId(localId, serverId)
          │
          ├── aiClient.query(prompt, systemPrompt, sessionId)
          │     │
          │     ├── [Research] Agent WebFetches homepage → writes research.md
          │     │     └── Server sends: { type: 'file', fileType: 'research', content }
          │     │
          │     ├── [Hooks] Skill reads research → writes hook-bank.md
          │     │     └── Server sends: { type: 'file', fileType: 'hooks', content }
          │     │
          │     ├── [Art] Skill reads hooks → writes prompts.json
          │     │     └── Server sends: { type: 'file', fileType: 'prompts', content }
          │     │
          │     └── [Images] MCP calls fal.ai → saves PNGs
          │           └── imageEvents.emit('image-saved') per image
          │                 └── Server sends: { type: 'image', urlPath, hookType, imageIndex }
          │                       └── Client: addImageToCampaign() → ResultsView re-renders
          │
          └── Server sends: { type: 'complete', summary }
                └── Client: completeGeneration() → status='complete', clear session
```

### 7.2 Session Recovery (Page Reload)

Recovery is owned by `handleConnected` in `useWebSocket.ts`. `checkForRecovery` in `App.tsx` is a fallback only for when localStorage has no active session (e.g., server-side recovery detection).

```
Page refresh
  │
  ├── Store initializes empty
  │
  ├── WebSocket connects → handleConnected()
  │     ├── Check idempotency (generatingCampaignId already set?) → re-subscribe only
  │     ├── reconstructForRecovery() → sets generatingCampaignId, creates assistant msg
  │     │     (user message NOT created here — comes from DB via historical load)
  │     ├── openThinkingBlock("Recovering session...")
  │     ├── subscribe IMMEDIATELY (lastEventId: 0)
  │     │     → Server replays buffered events
  │     │     → Images/files buffered in _pendingImages/_pendingFiles if campaign not in store yet
  │     │     → Phases/tools added to thinking block
  │     │     → 'subscribed' event → setIsRecovering(false)
  │     └── Background: campaignsApi.get() → prepend historical messages (non-blocking)
  │
  ├── API data loads (async, from App.tsx useEffect)
  │     ├── setCampaigns(fullCampaigns) → FLUSHES _pendingImages/_pendingFiles
  │     └── setChatMessages(excluding recovering campaign) → preserved by generatingCampaignId guard
  │
  ├── checkForRecovery effect (App.tsx)
  │     └── generatingCampaignId already set → SKIP (guard prevents interference)
  │
  └── Result: historical messages + recovery assistant msg + live events + images/files
```

**Key invariants:**
1. `handleConnected` is the SOLE owner of recovery. `checkForRecovery` is a fallback for when localStorage has no active session.
2. Subscribe must be fast (immediate after `reconstructForRecovery`) to minimize timing windows.
3. `handleConnected` must be idempotent — safe to call multiple times (StrictMode, reconnects).
4. Event buffer must be clean when starting a follow-up (`clearBuffer` in `handleFollowUp`).
5. `addImageToCampaign`/`updateCampaignFile` must buffer when campaign doesn't exist yet (not silently drop).

**Edge cases:**
- Buffer expired (40 min TTL) → client gets error, cleans up recovery state
- Server restarted → no buffer exists → error sent, falls back to `checkForRecovery` which detects via REST status endpoint
- React StrictMode double-mount → idempotency guard prevents duplicate recovery messages; second connection replays events harmlessly

### 7.3 Follow-up Conversation

```
User types in ChatInput (existing campaign)
    │
    ▼
ChatSidebar.handleSubmit() → followUp(activeCampaignId, prompt)
    │
    ▼
useWebSocket.followUp(campaignId, prompt)
    │
    ├── store.startFollowUp(campaignId, prompt)
    │     └── Appends user + assistant messages to existing chat
    ├── Save to localStorage (campaign.sessionId, prompt, campaignId, messageId)
    │     └── Enables recovery if user refreshes mid-follow-up
    │
    └── wsManager.sendMessage({ type: 'follow_up', prompt, campaignId })
          │
          ▼
    Server: handleFollowUp()
          │
          ├── Look up campaign's SDK session ID
          ├── clearBuffer(wsSessionId)  ← clears stale events from previous generation
          │     └── Prevents cancel events from poisoning follow-up recovery replay
          ├── aiClient.query(prompt, null, sdkSessionId) ← resumes session
          │     └── AI has full context from previous generation
          ├── Stream events (message text, possibly new images)
          └── Complete
```

**Follow-up recovery:** If the user refreshes mid-follow-up, recovery works the same as initial generation (§7.2). The `clearBuffer` at the start of `handleFollowUp` ensures the replay buffer only contains follow-up events — stale events from the previous generation (including cancel events) are wiped.

### 7.4 Asset Upload & @ Mention

```
User clicks "Upload Files" in AssetDrawer
    │
    ├── FileUpload dialog opens → handleOpenChange() sets targetFolderId
    ├── User drops/selects files → object URLs created for preview
    ├── User clicks Upload → handleUpload()
    │     ├── If no folder selected: createFolderAsync('Uploads') → server creates folder
    │     ├── For each file: assetsApi.uploadFile(file, folderId)
    │     │     ├── POST /api/assets/upload (FormData: file + folderId)
    │     │     ├── Server: multer saves to /uploads/, db.addFile() persists metadata
    │     │     └── Returns { id, name, file_path, file_type, size, created_at }
    │     ├── store.addFileToFolder(folderId, serverFile) — uses server-generated ID
    │     └── Revoke object URLs
    │
    ├── Files persist across refresh (SQLite + disk)
    └── Server-generated file IDs (file_xxx) match what WebSocket expects

User types @ in ChatInput
    │
    ├── AssetMention detects @ → opens dropdown
    ├── Sources: campaign images, campaign files, asset folders/files
    ├── User selects item → added as pill above input
    │
    └── On submit: assetFileIds sent over WebSocket
          → Server resolves: DB lookup → disk read → base64 for Claude + fal.storage URL for MCP
```

---

## 8. Data Models & Types

### 8.1 Client Types (`types/chat.ts`)

```typescript
type HookType = 'stat' | 'story' | 'fomo' | 'curiosity' | 'callout' | 'contrast'
type CampaignStatus = 'generating' | 'complete' | 'incomplete' | 'error' | 'cancelled'
type AppState = 'landing' | 'workspace'

interface GeneratedImage {
  id: number          // 1-6
  url: string
  prompt: string
  hookType: HookType
  version: number
}

interface ChatMessage {
  id: string
  campaignId?: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  blocks?: MessageBlock[]
  imageRefs?: ImageReference[]
  fileRefs?: FileReference[]
  assetRefs?: string[]
}

type MessageBlock = TextBlockData | ThinkingBlockData | StatusBlockData

interface ThinkingChild {
  id: string
  kind: 'phase' | 'tool' | 'result' | 'progress' | 'error' | 'text' | 'status'
  text: string
  timestamp: Date
  variant?: 'info' | 'success' | 'error'
}
```

### 8.2 WebSocket Types (`types/websocket.ts`)

```typescript
// Client → Server
interface WSClientMessage {
  type: 'generate' | 'cancel' | 'ping' | 'subscribe' | 'follow_up'
  prompt?: string
  sessionId?: string
  campaignId?: string
  lastEventId?: number
  assetFileIds?: string[]
}

// Server → Client (union of all event types)
type WSServerMessage =
  | WSPhaseEvent      // { type: 'phase', phase, label?, imageCount? }
  | WSToolStartEvent  // { type: 'tool_start', tool, input? }
  | WSToolEndEvent    // { type: 'tool_end', toolId }
  | WSFileEvent       // { type: 'file', fileType, content }
  | WSImageEvent      // { type: 'image', urlPath, hookType, imageIndex }
  | WSMessageEvent    // { type: 'message', text }
  | WSCompleteEvent   // { type: 'complete', summary, duration?, imageCount? }
  | WSErrorEvent      // { type: 'error', error }
  | WSAckEvent        // { type: 'ack', campaignId? }
  | WSStatusEvent     // { type: 'status', status }
  | WSSubscribedEvent // { type: 'subscribed', sessionId }

type WSConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
```

---

## 9. Known Issues & Gaps

### 9.1 Discrepancies

| Issue | Details |
|-------|---------|
| **Hook type count** | Hook methodology defines **10** types, but MCP maps only **6** by index (`stat`, `story`, `fomo`, `curiosity`, `callout`, `contrast`). |
| **Hook count** | Skill default is 3 hooks, orchestrator requests 6. |
| **File paths in docs** | Some skill docs reference `/storage/` paths that don't match actual `agent/files/` paths. |
| **`ApiFolder.updated_at`** | Client type expects it but DB `asset_folders` table has no `updated_at` column — returns null. |

### 9.2 Dead Code

| Item | Location | Notes |
|------|----------|-------|
| `SavedSession.messageId` | `useWebSocket.ts:17` | Saved to localStorage but never read during recovery. |

### 9.3 Race Conditions

| ID | Risk | Details |
|----|------|---------|
| **R1** | **Campaign ID window** | Between `startGeneration` (local ID) and `replaceCampaignId` (server ID via `ack`), any API call using the local ID will 404. |
| **R2** | **Dual image event path** | Images arrive via EventEmitter (real-time) AND SDK `tool_result`. Deduplication via `processedImageIndices` Set works in-memory, but DB may get version 2 orphan rows. |

### 9.4 Security / Production Hardening

| Issue | Details |
|-------|---------|
| **Auth token in WS URL** | Token passed as query parameter — logged in server/proxy logs and browser history. |
| **No WS auth refresh** | Token set once at connection. If Clerk token expires mid-session, no re-authentication. |
| **No WS rate limiting** | Client can spam `generate` messages. Each spawns a Claude SDK subprocess — potential API credit exhaustion. |
| **No input validation on prompt** | No length limit or sanitization on WS `prompt` field. |
| **No CSRF on REST API** | Bearer token auth only, no CSRF token or Origin header check. |
| **No graceful shutdown** | No SIGTERM/SIGINT handler. `closeDatabase()` exists but is never called in any signal handler. |
| **No image cleanup** | `generated-images/` grows forever — no TTL, no garbage collection, no disk monitoring. |

---

## 10. Remaining Work

### 10.1 Incomplete Features

| Feature | Status | What's Missing |
|---------|--------|---------------|
| **Image regeneration** | Works via text path | @ mentions embed `[Image N]` in prompt text, agent understands via session resume. **Does not scale** — see §10.4 for stateless regen plan. |

### 10.2 Bugs to Fix

1. **Wire up image regeneration** — Deferred to Phase 2 (§10.4). Current text-based path works via session resume.
2. **R1: Campaign ID window** — File saves can 404 between local ID creation and server `ack`. See §9.3.
3. **R2: Dual image event path** — DB can get orphan version rows from EventEmitter + SDK tool_result race. See §9.3.

### 10.3 Suggested Improvements

| Area | Improvement |
|------|------------|
| **Error UX** | Show user-facing toasts/banners for generation errors instead of only chat status blocks |
| **Optimistic update rollback** | Revert local state when async API calls fail |
| **WebSocket send validation** | Check `sendMessage()` return value, queue messages during reconnect |
| **Campaign sharing** | No multi-user support — campaigns are per-user only |
| **Export** | No way to export campaign (images + copy) as a package |
| **Style selection UI** | User must type style keywords — no dropdown/picker |

### 10.4 Phase 2: Stateless Image Operations (Architecture Refactor)

**Problem:** Current system uses session resume (full conversation replay) for image regeneration. The agent "remembers" images through conversation history. This doesn't scale — 100 images means replaying all 100 tool calls/results just to change one. Even with 6 images, cost compounds with each follow-up.

**Solution:** Separate conversation from operations. Three-layer architecture:

```
CONVERSATION LAYER — open-ended creative dialogue, uses session resume
        │
OPERATION LAYER  — structured, stateless (regenerate, vary, edit)
        │                pulls only relevant metadata from DB
        │                no session resume needed
ASSET LAYER      — DB is the source of truth, not the conversation
```

**Implementation:**

1. **Enrich `campaign_images` storage** — at generation time, persist full context per image: prompt, hook type, style params, brand brief summary, aspect ratio, resolution. Currently only `prompt` and `hook_type` are saved — not enough to regenerate without session history.

2. **Route operations vs conversations** — detect structured operations (regenerate, variation, style swap) vs open-ended chat. Operations bypass session resume entirely.

3. **Stateless regen endpoint** — `POST /api/campaigns/:id/images/:index/regenerate { instruction }`. Looks up image metadata from DB, builds a focused prompt (~500 tokens instead of ~50k), calls MCP directly, saves result as new version.

4. **Version lineage** — new versions link back to their parent. `campaign_images` already has `version` column; add `parent_image_id` for lineage tracking.

5. **Client operation routing** — when user selects images + gives instruction, route to operation endpoint instead of `followUp()`. Reserve `followUp()` for actual creative conversation.

**Key principle:** The database is the memory, not the conversation. Session resume stays for dialogue; image operations are stateless DB lookups.

### 10.5 Cleanup

- Commit untracked docs in `docs/`
