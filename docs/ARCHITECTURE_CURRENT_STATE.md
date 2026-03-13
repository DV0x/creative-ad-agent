# Creative Agent — Architecture & Current State

> Last updated: 2026-03-10 | Branch: `new-ui` | Production: https://creative-agent.alphasapien17.workers.dev

---

## Table of Contents

1. [What This Project Is](#1-what-this-project-is)
2. [Repository Structure](#2-repository-structure)
3. [Local Architecture](#3-local-architecture)
4. [Production Architecture (Cloudflare)](#4-production-architecture-cloudflare)
5. [Database Schema](#5-database-schema)
6. [AI Agent Pipeline](#6-ai-agent-pipeline)
7. [WebSocket Protocol](#7-websocket-protocol)
8. [REST API Reference](#8-rest-api-reference)
9. [Authentication](#9-authentication)
10. [Image Generation & Storage](#10-image-generation--storage)
11. [Key Differences: Local vs Production](#11-key-differences-local-vs-production)
12. [Current State & Known Issues](#12-current-state--known-issues)
13. [Deployment Guide](#13-deployment-guide)

---

## 1. What This Project Is

Creative Agent is a chat-based AI tool that generates ad campaigns. You give it a brand URL or brief, and it:

1. **Researches** the brand (scrapes website, analyzes positioning)
2. **Creates hooks** (6 ad angles: stat, story, FOMO, curiosity, callout, contrast)
3. **Writes image prompts** (detailed prompts for each ad concept)
4. **Generates images** (via fal.ai's Nano Banana Pro / Gemini image model)
5. **Supports follow-ups** (refine hooks, regenerate specific images, iterate)

The user sees all of this happening in real-time through a chat interface with thinking blocks, progress indicators, and images appearing as they're generated.

---

## 2. Repository Structure

```
creative_agent/
├── client/                    # React frontend (Vite + Tailwind + Zustand)
│   ├── src/
│   │   ├── App.tsx            # Root — auth gating, data loading, recovery
│   │   ├── main.tsx           # Entry — ClerkProvider wrapper
│   │   ├── components/
│   │   │   ├── layout/        # AppLayout, LandingHeader
│   │   │   ├── chat/          # ChatSidebar, ChatInput, ChatMessage, MobileChatDrawer
│   │   │   ├── chat/blocks/   # ThinkingBlock, TextBlock, StatusBlock, BlockRenderer
│   │   │   ├── auth/          # SignIn, UserMenu
│   │   │   ├── editor/        # FileEditor (research/hooks/prompts editing)
│   │   │   ├── assets/        # AssetDrawer, FileUpload, AssetPreview
│   │   │   ├── mentions/      # AssetMention (@ mentions in chat)
│   │   │   ├── ui/            # Radix primitives (button, dialog, sidebar, etc.)
│   │   │   ├── EmptyState.tsx  # Landing page prompt input
│   │   │   ├── ResultsView.tsx # Workspace — image grid + chat + editor
│   │   │   ├── ImageCard.tsx   # Individual image card with selection
│   │   │   ├── ImageLightbox.tsx # Full-screen image viewer
│   │   │   └── AuthImage.tsx   # Fetches images with Bearer token
│   │   ├── store/index.ts     # Zustand store (campaigns, chat, WebSocket state)
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts # WS hook (generate, follow-up, cancel, recovery)
│   │   ├── lib/
│   │   │   ├── api.ts          # REST API client (campaigns, assets, recovery)
│   │   │   ├── websocket-manager.ts  # Singleton WS connection manager
│   │   │   └── auth.ts        # Dev mode detection, Clerk helpers
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # Auth token context
│   │   └── types/
│   │       ├── chat.ts        # ChatMessage, ThinkingBlock, HookType types
│   │       └── websocket.ts   # WSServerMessage, WSConnectionState types
│   ├── vite.config.ts         # Dev proxy to localhost:3001
│   └── package.json
│
├── server/                    # Node/Express backend (LOCAL mode only)
│   ├── sdk-server.ts          # Entry — Express + WebSocket + routes
│   ├── lib/
│   │   ├── ai-client.ts       # Claude SDK wrapper (query, session management)
│   │   ├── websocket-handler.ts  # WS server (generate, cancel, follow-up, subscribe)
│   │   ├── session-manager.ts # In-memory SDK session tracking
│   │   ├── database.ts        # SQLite init (better-sqlite3)
│   │   ├── orchestrator-prompt.ts  # System prompt for AI agent
│   │   ├── nano-banana-mcp.ts # MCP server for fal.ai image generation
│   │   ├── event-buffer.ts    # Per-session event buffering for recovery
│   │   ├── image-events.ts    # Image save event bus
│   │   ├── instrumentor.ts    # Cost/token tracking
│   │   ├── auth.ts            # Clerk middleware
│   │   └── db/                # Database access layer
│   │       ├── index.ts       # Barrel export
│   │       ├── campaigns.ts   # Campaign CRUD
│   │       ├── files.ts       # Campaign files CRUD
│   │       ├── images.ts      # Campaign images CRUD
│   │       ├── messages.ts    # Chat messages CRUD
│   │       └── assets.ts      # Asset folders/files CRUD
│   ├── routes/
│   │   ├── campaigns.ts       # /api/campaigns/* route handlers
│   │   └── assets.ts          # /api/assets/* route handlers
│   └── package.json
│
├── cloudflare/                # Cloudflare Workers production backend
│   ├── src/
│   │   ├── index.ts           # Worker entry — WS upgrade, API routing, static assets
│   │   ├── router.ts          # REST API router (campaigns, assets, images, health)
│   │   ├── auth.ts            # Clerk JWT verification
│   │   ├── env.d.ts           # TypeScript bindings (DB, R2, DO, secrets)
│   │   ├── durable-objects/
│   │   │   └── campaign-session.ts  # THE BIG ONE — WS handler, generation orchestrator
│   │   ├── db/                # D1 database access layer (mirrors server/lib/db/)
│   │   │   ├── index.ts
│   │   │   ├── utils.ts
│   │   │   ├── campaigns.ts
│   │   │   ├── files.ts
│   │   │   ├── images.ts
│   │   │   ├── messages.ts
│   │   │   └── assets.ts
│   │   ├── lib/
│   │   │   ├── types.ts       # Shared types (ClientMessage, ServerMessage, HookType)
│   │   │   ├── event-buffer.ts     # Event buffer for WS recovery
│   │   │   ├── block-builder.ts    # Chat message block construction
│   │   │   ├── sdk-message-parser.ts  # Parse Claude SDK stdout into events
│   │   │   └── local-ai-runner.ts  # Local dev fallback (unused in production)
│   │   └── routes/
│   │       ├── health.ts
│   │       ├── images.ts      # Serve images from R2
│   │       ├── campaigns.ts   # Campaign CRUD against D1
│   │       ├── assets.ts      # Asset management with R2 storage
│   │       └── recovery.ts    # R2 completion marker recovery endpoint
│   ├── sandbox/               # Container image for AI agent execution
│   │   ├── Dockerfile         # node:22-slim + Claude CLI + s3fs + agent files
│   │   ├── agent-runner.ts    # Long-running agent process (file-based IPC)
│   │   ├── orchestrator-prompt.ts  # System prompt (sandbox version)
│   │   ├── nano-banana-mcp.ts # MCP server (sandbox version — writes to /mnt/r2)
│   │   ├── package.json       # SDK 0.2.69, fal, tsx, zod
│   │   └── tsconfig.json
│   ├── schema.sql             # D1 schema (version-controlled reference)
│   └── wrangler.jsonc         # Worker config (D1, R2, DO, containers, static assets)
│
├── agent/                     # AI agent workspace (skills, research examples, prompts)
│   ├── .claude/
│   │   └── agents/research.md # Research agent definition
│   └── files/
│       ├── research/          # Example research files (brand_research.md)
│       └── creatives/         # Example prompt files (brand_prompts.json)
│
├── docs/                      # Session logs and architecture docs
├── CLAUDE.md                  # Project instructions for Claude Code
├── .env                       # Environment variables (local)
└── package.json               # Root (only @cloudflare/sandbox dep)
```

---

## 3. Local Architecture

```
┌─────────────────────┐
│   Browser (React)   │
│   localhost:5173     │
│                     │
│  ┌──────────────┐   │
│  │  Zustand Store│   │
│  │  (campaigns,  │   │
│  │   chat, WS)   │   │
│  └──────┬───────┘   │
│         │           │
│  ┌──────┴───────┐   │
│  │  WebSocket   │   │      Vite proxy
│  │  Manager     │──────────────────────┐
│  └──────────────┘   │                  │
│  ┌──────────────┐   │                  │
│  │  REST API    │──────────────────────┤
│  │  Client      │   │                  │
│  └──────────────┘   │                  │
└─────────────────────┘                  │
                                         │
                              ┌──────────▼──────────┐
                              │  Node/Express Server │
                              │  localhost:3001      │
                              │                      │
                              │  ┌────────────────┐  │
                              │  │  WS Handler    │  │
                              │  │  (generate,    │  │
                              │  │   cancel,      │  │
                              │  │   follow_up)   │  │
                              │  └───────┬────────┘  │
                              │          │           │
                              │  ┌───────▼────────┐  │
                              │  │  AI Client     │  │
                              │  │  (Claude SDK)  │  │
                              │  │  query() loop  │  │
                              │  └───────┬────────┘  │
                              │          │           │
                              │  ┌───────▼────────┐  │
                              │  │  MCP Server    │  │
                              │  │  (nano-banana) │  │
                              │  │  fal.ai images │  │
                              │  └───────┬────────┘  │
                              │          │           │
                              │  ┌───────▼────────┐  │
                              │  │  SQLite DB     │  │
                              │  │  (better-sqlite3)│ │
                              │  │  data/creative_ │  │
                              │  │  agent.db       │  │
                              │  └────────────────┘  │
                              │                      │
                              │  ┌────────────────┐  │
                              │  │  File System   │  │
                              │  │  generated-    │  │
                              │  │  images/       │  │
                              │  │  uploads/      │  │
                              │  └────────────────┘  │
                              └──────────────────────┘
```

### How local mode works:

1. **Vite dev server** (`localhost:5173`) proxies `/ws`, `/api`, `/images`, `/health` to Express (`localhost:3001`)
2. **Express server** runs the Claude SDK **in-process** via `ai-client.ts` — the `query()` function streams SDK messages
3. **WebSocket handler** receives `generate` messages, spawns the SDK `query()` as an async iterator, and streams parsed events (phase, file, image, complete) back to the client
4. **Images** are generated via fal.ai MCP tool, saved to `generated-images/` on local disk, served via Express static
5. **SQLite** stores campaigns, files, images, messages, and assets locally
6. **Auth** is optional — if `CLERK_SECRET_KEY` is not set, runs in anonymous dev mode

### Local startup:
```bash
# Terminal 1 — server
cd server && npm run dev

# Terminal 2 — client
cd client && npm run dev
```

---

## 4. Production Architecture (Cloudflare)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE EDGE                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Worker (index.ts)                      │   │
│  │  Routes:                                                 │   │
│  │  /ws           → WebSocket upgrade → Durable Object      │   │
│  │  /api/*        → REST API router (campaigns, assets)      │   │
│  │  /images/*     → R2 image serving                        │   │
│  │  /health       → Health check                            │   │
│  │  /* (fallback) → Static Assets (React SPA)               │   │
│  └────┬────────────────────────────┬────────────────────────┘   │
│       │                            │                            │
│  ┌────▼──────────────┐    ┌───────▼──────────────┐             │
│  │  Durable Object   │    │  D1 Database         │             │
│  │  (CampaignSession)│    │  (creative-agent-db)  │             │
│  │  One per user     │    │  campaigns, files,    │             │
│  │                   │    │  images, messages,    │             │
│  │  Handles:         │    │  asset_folders,       │             │
│  │  - WS connections │    │  asset_files          │             │
│  │  - generate       │    └──────────────────────┘             │
│  │  - follow_up      │                                         │
│  │  - cancel         │    ┌──────────────────────┐             │
│  │  - subscribe      │    │  R2 Bucket           │             │
│  │  - recovery       │    │  (creative-agent-    │             │
│  │  - alarm heartbeat│    │   assets)            │             │
│  │                   │    │  users/{uid}/images/ │             │
│  │  Persists:        │    │  users/{uid}/uploads/│             │
│  │  - sessionId      │    │  completion markers  │             │
│  │  - campaignId     │    └──────────────────────┘             │
│  │  - userId         │                                         │
│  │  - isGenerating   │                                         │
│  │  - agentProcessId │                                         │
│  └────┬──────────────┘                                         │
│       │                                                        │
│  ┌────▼──────────────────────────────────────────────────┐     │
│  │           Sandbox Container (standard-2)               │     │
│  │           1 vCPU, 6 GiB RAM                           │     │
│  │                                                       │     │
│  │  ┌─────────────────────────────────────────────────┐  │     │
│  │  │  agent-runner.ts (long-running Node process)    │  │     │
│  │  │                                                 │  │     │
│  │  │  Turn 1: env PROMPT → Claude SDK query()        │  │     │
│  │  │  Turn N: /app/next-prompt.json (file IPC)       │  │     │
│  │  │                                                 │  │     │
│  │  │  ┌───────────────┐  ┌────────────────────┐     │  │     │
│  │  │  │ Claude SDK    │  │ MCP: nano-banana   │     │  │     │
│  │  │  │ (Haiku 4.5)   │  │ (fal.ai images)   │     │  │     │
│  │  │  │ Orchestrator  │  │ Writes to /mnt/r2  │     │  │     │
│  │  │  └───────┬───────┘  └────────────────────┘     │  │     │
│  │  │          │                                     │  │     │
│  │  │  stdout: SSE-formatted SDK messages            │  │     │
│  │  │  (parsed by DO via streamProcessLogs)          │  │     │
│  │  └─────────────────────────────────────────────────┘  │     │
│  │                                                       │     │
│  │  /mnt/r2  ←── s3fs FUSE mount ──→  R2 Bucket        │     │
│  │  (images written here appear in R2 automatically)     │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Static Assets                                           │   │
│  │  React SPA (client/dist) served from Worker              │   │
│  │  SPA mode: all non-API paths → index.html                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Auth: Clerk                                             │   │
│  │  - REST: Bearer token in Authorization header            │   │
│  │  - WS: token in query param (?token=...)                 │   │
│  │  - JWT verified against CLERK_SECRET_KEY via JWKS        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### How production mode works:

1. **Worker** receives all requests. Routes `/ws` to Durable Object, `/api/*` and `/images/*` to API router, everything else to static assets (React SPA)
2. **Durable Object** (one per user, keyed by Clerk userId) handles the WebSocket connection and orchestrates generation
3. On `generate`, the DO:
   - Creates a campaign in D1
   - Gets/creates a **Sandbox container** (standard-2: 1 vCPU, 6 GiB)
   - Mounts R2 bucket via s3fs FUSE at `/mnt/r2`
   - Runs pre-flight IP check (some Cloudflare IPs are blocked by Anthropic)
   - Starts `agent-runner.ts` as a long-running process via `startProcess()`
   - Attaches two listeners:
     - **`streamProcessLogs()`** — real-time stdout → SSE parse → WS events to client
     - **`waitForLog('turn_complete')`** — completion detection → save results to D1/R2
   - Starts alarm heartbeat (30s) to prevent DO hibernation
4. On `follow_up`, the DO writes `/app/next-prompt.json` to the sandbox — the agent-runner picks it up and starts a new turn without restarting the SDK
5. **Images** are written by the MCP tool to `/mnt/r2/images/{sessionId}/`, which maps to `users/{userId}/images/` in R2. Served via `/images/{campaignId}/{index}_{name}.png`
6. **Recovery**:
   - Agent writes a completion marker to R2 on finish
   - If the DO loses connection (reset, hibernation), alarm polling checks for the marker
   - Client can call `/api/campaigns/{id}/recover` to pull results from R2

### Container lifecycle:
- `sleepAfter: '2h'` — container stays warm for 2 hours after last activity
- Follow-ups reuse the same container (fast path: ~30-60s vs ~5 min cold start)
- `max_instances: 50` across all users
- Container ID: `user-{userId}-v2` (deterministic for reuse, with retry suffix on IP block)

---

## 5. Database Schema

Both local (SQLite via better-sqlite3) and production (Cloudflare D1) use the **same schema**:

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `campaigns` | Ad campaigns | `id`, `user_id`, `name`, `status`, `session_id`, `sdk_session_id` |
| `campaign_files` | Generated content files | `campaign_id`, `file_type` (research/hooks/prompts), `content` |
| `campaign_images` | Generated ad images | `campaign_id`, `image_index`, `hook_type`, `prompt`, `file_path`, `version` |
| `messages` | Chat history | `campaign_id`, `role` (user/assistant), `content`, `blocks` (JSON) |
| `asset_folders` | User-uploaded asset folders | `user_id`, `name` |
| `asset_files` | Files within folders | `folder_id`, `name`, `file_path`, `file_type`, `size` |

**Campaign statuses**: `generating`, `complete`, `incomplete`, `error`, `cancelled`

**Hook types** (ad angles): `stat`, `story`, `fomo`, `curiosity`, `callout`, `contrast`

**File types**: `research` (brand analysis markdown), `hooks` (6 ad hooks markdown), `prompts` (image prompt JSON array)

---

## 6. AI Agent Pipeline

### The Orchestrator Pattern

The AI agent uses Claude's **Agent SDK** with a system prompt that defines a multi-step workflow:

```
User Prompt (e.g., "Create ads for nike.com")
         │
         ▼
┌──────────────────────┐
│  Orchestrator Agent   │  (Claude Haiku 4.5, maxTurns: 30)
│  (orchestrator-prompt)│
│                      │
│  Step 1: Research    │──→ Spawns research subagent (WebFetch, WebSearch)
│  Step 2: Hooks       │──→ Creates 6 ad hooks from research
│  Step 3: Prompts     │──→ Writes image generation prompts
│  Step 4: Generate    │──→ Calls nano-banana MCP tool (fal.ai)
│  Step 5: Review      │──→ Optional: inspect generated images
└──────────────────────┘
```

### Tools Available to the Agent

| Tool | Used By | Purpose |
|------|---------|---------|
| `Task` | Orchestrator | Spawn subagents (research, creative) |
| `Skill` | Orchestrator/subagents | Invoke skill definitions |
| `WebFetch` | Research subagent | Scrape brand websites |
| `WebSearch` | Research subagent | Cultural intelligence searches |
| `Read`, `Write`, `Edit` | Subagents | File operations |
| `Glob`, `Grep` | Subagents | File search |
| `Bash` | Subagents | Shell commands |
| `mcp__nano-banana__generate_ad_images` | Creative subagent | Image generation via fal.ai |

### MCP Server: nano-banana

Wraps fal.ai's Nano Banana Pro model (Google Gemini image model):
- Text-to-image generation (1K, 2K, 4K resolution)
- Reference image support (edit mode)
- Multiple aspect ratios
- Up to 6 images per call
- **Local**: saves to `generated-images/{sessionId}/`
- **Production**: saves to `/mnt/r2/images/{sessionId}/` (FUSE-mounted R2)

---

## 7. WebSocket Protocol

### Client → Server Messages

| Type | Fields | Description |
|------|--------|-------------|
| `generate` | `prompt`, `sessionId`, `assetFileIds?` | Start new campaign generation |
| `follow_up` | `prompt`, `campaignId`, `assetFileIds?` | Follow-up on existing campaign |
| `cancel` | — | Abort current generation |
| `subscribe` | `sessionId`, `lastEventId?` | Resume/recover an active session |
| `ping` | — | Keep-alive (every 25s) |

### Server → Client Messages

| Type | Fields | Description |
|------|--------|-------------|
| `ack` | `campaignId` | Generation started, real campaign ID assigned |
| `phase` | `phase`, `label` | Workflow phase change (research, hooks, etc.) |
| `tool_start` | `tool`, `input?` | Agent started using a tool |
| `tool_end` | `tool` | Tool finished |
| `file` | `fileType`, `content` | Campaign file created/updated |
| `image` | `imageIndex`, `urlPath`, `prompt`, `hookType` | Image generated |
| `message` | `text` | Agent text output (shown in follow-ups) |
| `complete` | `summary`, `imageCount` | Generation finished |
| `error` | `error` | Generation failed |
| `incomplete` | `message` | Interrupted (can resume) |
| `status` | `message` | Status update (e.g., "cancelled") |
| `subscribed` | — | Recovery subscription confirmed |
| `pong` | — | Keep-alive response |

### Event Buffering & Recovery

Events are buffered in an `EventBuffer` with sequential IDs. When the client reconnects:
1. Client sends `subscribe` with `lastEventId`
2. Server replays all events after that ID
3. Client reconstructs UI state from replayed events

---

## 8. REST API Reference

All endpoints require `Authorization: Bearer <clerk-jwt>` (except `/health`).

### Campaigns

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/campaigns` | List all user's campaigns |
| `POST` | `/api/campaigns` | Create campaign (`{ name, sessionId? }`) |
| `GET` | `/api/campaigns/:id` | Get full campaign (files, images, messages) |
| `PATCH` | `/api/campaigns/:id` | Update campaign (`{ name?, status? }`) |
| `DELETE` | `/api/campaigns/:id` | Delete campaign |
| `GET` | `/api/campaigns/:id/files/:type` | Get campaign file content |
| `PUT` | `/api/campaigns/:id/files/:type` | Update campaign file |
| `GET` | `/api/campaigns/:id/images` | List campaign images |
| `GET` | `/api/campaigns/:id/messages` | Get chat messages |
| `POST` | `/api/campaigns/:id/messages` | Add chat message |
| `GET` | `/api/campaigns/:id/status` | Get generation status (isAgentRunning, etc.) |
| `POST` | `/api/campaigns/:id/recover` | Attempt R2 recovery for stuck campaign |

### Assets

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/assets/folders` | List user's folders |
| `POST` | `/api/assets/folders` | Create folder |
| `PATCH` | `/api/assets/folders/:id` | Rename folder |
| `DELETE` | `/api/assets/folders/:id` | Delete folder |
| `GET` | `/api/assets/folders/:id/files` | List files in folder |
| `POST` | `/api/assets/upload` | Upload file (multipart form) |
| `GET` | `/api/assets/files/:id` | Serve file content |
| `DELETE` | `/api/assets/files/:id` | Delete file |

### Images

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/images/:campaignId/:filename` | Serve generated image (from R2 in prod, disk in local) |

### Other

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (no auth) |

---

## 9. Authentication

### Clerk Integration

- **Provider**: [Clerk](https://clerk.com) — handles sign-up, sign-in, JWT tokens
- **Client**: `@clerk/clerk-react` wraps the app in `ClerkProvider`
- **Local server**: `@clerk/express` middleware (optional — dev mode if no `CLERK_SECRET_KEY`)
- **Production**: Custom JWT verification against Clerk's JWKS endpoint

### Auth Flow

```
1. User signs in via Clerk UI (client/src/components/auth/SignIn.tsx)
2. Clerk provides getToken() — returns short-lived JWT
3. REST calls: Bearer token in Authorization header
4. WebSocket: token passed as ?token= query parameter on upgrade
5. Worker verifies JWT via Clerk JWKS (fetched + cached)
6. userId extracted from JWT → passed to Durable Object via X-User-Id header
```

### Dev Mode

When `CLERK_SECRET_KEY` is not set:
- Client skips Clerk UI, acts as always-signed-in
- Server accepts all requests as `user_id = 'anonymous'`
- No JWT verification

---

## 10. Image Generation & Storage

### Generation Flow

1. Agent creates image prompts (JSON array with prompt text, hook type, aspect ratio)
2. Orchestrator calls `mcp__nano-banana__generate_ad_images` MCP tool
3. Tool sends prompts to fal.ai API (Nano Banana Pro model)
4. fal.ai returns image URLs
5. Tool downloads images and saves them:
   - **Local**: `generated-images/{sessionId}/{index}_{hookType}_{name}.png`
   - **Production**: `/mnt/r2/images/{sessionId}/{index}_{hookType}_{name}.png`
6. Tool prints image event to stdout (parsed by DO → sent via WS → client renders)

### Image Serving

- **Local**: Express serves from `generated-images/` directory
- **Production**: Worker fetches from R2 bucket with key `users/{userId}/images/{path}`
- **Auth**: Images require Bearer token. Client uses `AuthImage` component that fetches via `authFetchBlob()` (creates blob URL)
- **Caching**: `Cache-Control: public, max-age=31536000, immutable` (1 year)

### R2 Key Structure

```
creative-agent-assets/
├── users/{userId}/
│   ├── images/{sessionId}/{index}_{hookType}_{name}.png
│   ├── uploads/{folderDir}/{filename}
│   └── .claude/projects/-app-agent/{sdkSessionId}.jsonl  (SDK conversation log)
```

---

## 11. Key Differences: Local vs Production

| Aspect | Local | Production (Cloudflare) |
|--------|-------|------------------------|
| **Server** | Node/Express (`localhost:3001`) | Cloudflare Worker |
| **Database** | SQLite (better-sqlite3) in `server/data/` | D1 (same schema) |
| **File storage** | Local filesystem (`generated-images/`, `uploads/`) | R2 bucket (FUSE-mounted in sandbox) |
| **AI execution** | In-process SDK `query()` call | Sandbox container (standard-2) running `agent-runner.ts` |
| **SDK startup** | Fast (~5s, reuses process) | Slow (~2.5 min cold start, ~30s warm) |
| **Follow-ups** | New `query()` call with same session | File IPC (`/app/next-prompt.json`) to long-running process |
| **Auth** | Optional (dev mode = anonymous) | Required (Clerk JWT) |
| **Client serving** | Vite dev server with proxy | Workers Static Assets (SPA mode) |
| **Image serving** | Express static file handler | R2 via Worker `GET /images/*` |
| **Session recovery** | Event buffer in memory | Event buffer + R2 completion marker + alarm polling |
| **WebSocket** | Node `ws` library | Durable Object Hibernation API |
| **Container reuse** | N/A (in-process) | `sleepAfter: '2h'`, same sandbox ID for same user |
| **WS URL** | `ws://localhost:5173/ws` (proxied) | `wss://creative-agent.alphasapien17.workers.dev/ws` |
| **API URL** | `http://localhost:5173/api/*` (proxied) | `https://creative-agent.alphasapien17.workers.dev/api/*` |

### Client Config (vite.config.ts)

```ts
// Local dev: proxy all API/WS calls to Express server
proxy: {
  '/ws':      { target: 'http://localhost:3001', ws: true },
  '/api':     { target: 'http://localhost:3001' },
  '/images':  { target: 'http://localhost:3001' },
  '/health':  { target: 'http://localhost:3001' },
}
```

In production, the client is built (`npm run build`) and served as static assets from the same Worker — no proxy needed because everything is on the same origin.

---

## 12. Current State & Known Issues

### What Works (Verified)

- **Initial generation** — full pipeline from prompt to 6 images (~5 min)
- **Follow-ups** — agent remembers context, fast path (~30-60s)
- **Cancel** — aborts generation cleanly
- **Recovery** — reconnect after page refresh, R2 marker recovery for stuck sessions
- **Clerk auth** — sign-in, per-user isolation, JWT on REST + WS
- **Static assets** — React SPA served from same Worker
- **Image serving** — authenticated image loading via AuthImage component
- **REST API** — full CRUD for campaigns, assets, folders, files
- **Chat persistence** — messages saved to D1, restored on page load

### Known Issues / Gaps

1. **`writeCompletionMarker()` scans ALL `/mnt/r2/images/`** — includes all campaigns for the user, not just the current one. Fix written (tracking file approach) but **NOT deployed** to avoid overcomplicating

2. **`parseSSEStream()` silently drops long messages** — if a JSON payload exceeds one SSE `data:` frame, it gets split. Both fragments fail `JSON.parse()` silently. Affects long tool_result messages

3. **WebSocket transport has 120s hardcoded stream timeout** — SDK source has `requestTimeoutMs ?? 12e4` that kills `waitForLog` after 2 min. Stuck with HTTP transport

4. **`waitForLog` hangs silently on RPC disconnect** — if TCP connection drops without clean close, `reader.read()` blocks forever. R2 alarm polling is the safety net

5. **No CI/CD pipeline** — deployment is manual via `wrangler deploy`

6. **No production Clerk setup** — still using test keys. Production requires custom OAuth credentials + DNS CNAME records

7. **Debug diagnostics retained** — `campaign-session.ts` has intentional debug logging that adds ~8s overhead. Should be removed before production

8. **E2E tests broken with auth** — test scripts connect without JWT, get 401. Need test bypass or real tokens

9. **Container cold start is ~2.5 min** — dominated by Claude CLI init + first API call. Pre-compilation saves ~30s but CLI init dominates

10. **No rate limiting** — no limits on API calls or generations per user

11. **No error monitoring** — no Sentry/Datadog integration. Debugging relies on `wrangler tail` + dashboard container logs

12. **Local server has stale debug endpoints** — `/test`, `/generate`, `/debug/*` endpoints in `sdk-server.ts` are from early development. WebSocket is the primary interface now

13. **Asset uploads in production** — asset upload stores files in R2, but the upload path and serving haven't been thoroughly tested end-to-end

14. **No cleanup for stale R2 data** — deleted campaigns don't clean up their R2 images/files

### Session History (33 sessions of Cloudflare deployment work)

The `docs/` directory contains detailed session logs covering:
- Phases 1-4b implementation (D1, Worker API, Durable Objects, Sandbox containers)
- 7 rounds of E2E testing
- IP blocking diagnosis and pre-flight retry
- Hibernation/DO reset bugs and fixes
- Auth integration, static assets deployment
- Long-running agent (Phase 2), cancel race fixes
- FUSE flush issues, recovery layer implementation
- R2 polling, waitForLog reliability fixes

---

## 13. Deployment Guide

### Prerequisites

- Cloudflare account with Workers, D1, R2, Containers enabled
- Wrangler CLI installed
- Clerk account with secret key
- Docker installed (for container builds)

### Secrets (set via `wrangler secret put`)

```bash
ANTHROPIC_API_KEY     # Claude API key
FAL_KEY               # fal.ai API key
CLERK_SECRET_KEY      # Clerk JWT verification key
R2_ACCESS_KEY_ID      # R2 S3-compatible access key (for s3fs FUSE mount)
R2_SECRET_ACCESS_KEY  # R2 S3-compatible secret key
```

> Always pipe through `tr -d '\n'` to avoid trailing newlines

### Deploy Command

```bash
# Full deploy (client build + Docker prune + wrangler deploy)
cd client && npm run build && \
docker logout registry.cloudflare.com; \
docker builder prune -af; \
cd ../cloudflare && npx wrangler deploy
```

### Key Gotchas

- Always `docker builder prune -af` before deploy — cached layers prevent image updates
- If Docker keychain error: `docker logout registry.cloudflare.com` first
- Secrets need redeploy to take effect on running DOs
- Deploy has two propagation phases (~2 min each) — Worker code, then container image
- Each deploy resets active DOs — don't deploy during generation

### D1 Queries (debugging)

```bash
npx wrangler d1 execute creative-agent-db --remote \
  --command="SELECT id, status, sdk_session_id FROM campaigns ORDER BY created_at DESC LIMIT 5"
```

### R2 Inspection (debugging)

```bash
npx wrangler r2 object get "creative-agent-assets/users/{userId}/images/{path}" \
  --remote --file=/tmp/out.png
```

### Health Check

```bash
curl -s https://creative-agent.alphasapien17.workers.dev/health | python3 -m json.tool
```
