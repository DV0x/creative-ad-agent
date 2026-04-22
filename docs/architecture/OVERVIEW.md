# System Overview

> Part of [Architecture Documentation](./INDEX.md)

---

## What Creative Agent Does

Creative Agent is a chat-based AI tool that generates ad campaigns. You give it a brand URL or brief, and it:

1. **Researches** the brand — scrapes the website, analyzes positioning, finds cultural angles
2. **Creates hooks** — 6 ad angles: stat, story, FOMO, curiosity, callout, contrast
3. **Writes image prompts** — detailed prompts for each ad concept
4. **Generates images** — via fal.ai's Nano Banana Pro (Google Gemini image model)
5. **Supports follow-ups** — refine hooks, regenerate specific images, iterate on the campaign

The user sees all of this happening in real-time through a chat interface with thinking blocks, progress indicators, and images appearing as they're generated. In production, each generation deducts from a paid credit pool (subscription or top-up, managed via Dodo Payments) — see the pending BILLING.md for details.

---

## Tech Stack

| Layer | Local Dev | Production |
|---|---|---|
| **Frontend** | React 19 + Vite + Tailwind v4 + Zustand | Same (served as static assets from Worker) |
| **UI Components** | Radix UI primitives | Same |
| **Auth** | Clerk (optional in dev) | Clerk (required) — prod instance on creativemachines.xyz with Google OAuth |
| **Backend** | Node.js + Express | Cloudflare Worker |
| **Database** | SQLite (better-sqlite3) | Cloudflare D1 (same schema) — separate staging (`creative-agent-db`) and production (`creative-agent-db-prod`) |
| **File Storage** | Local filesystem | Cloudflare R2 — separate staging (`creative-agent-assets`) and production (`creative-agent-assets-prod`) |
| **AI Execution** | Claude SDK in-process | Sandbox container (standard-2) |
| **AI Model** | Claude Haiku 4.5 | Claude Haiku 4.5 |
| **Image Model** | fal.ai Nano Banana Pro | fal.ai Nano Banana Pro |
| **Streaming** | Assembled messages only (per-turn chunks) | Token-level deltas + assembled fallback (scratch-pad model, Session 65+) |
| **Billing** | None — no credit deduction, no Dodo | Credit pools (plan + topup), Dodo Payments webhooks, per-generation cost deduction |
| **Real-time** | WebSocket (ws library) | WebSocket (DO Hibernation API) |
| **Transport** | Direct function calls | stdout SSE → parse → WS |

> **Local vs production divergence:** Local dev is a simplified environment for rapid iteration. It does **not** stream tokens (production-only since Session 65), does **not** enforce credits, and does **not** integrate with Dodo Payments. Features should be developed against local and validated against staging before production.

---

## Two Modes, One Codebase

The project runs in two distinct modes that share the same frontend and database schema:

### Local Mode

```
Browser ──WebSocket──→ Express Server ──SDK call──→ Claude API
         ──REST API──→                ──saves to──→ SQLite + disk
```

Simple. The Express server calls Claude SDK directly as an async iterator. Images save to local disk. No containers, no R2, no FUSE mounts. Best for development and debugging.

**Key files:** `server/sdk-server.ts`, `server/lib/ai-client.ts`, `server/lib/websocket-handler.ts`

### Wrangler Dev Mode (Hybrid)

A third mode exists for testing Worker logic without containers: set `AI_BACKEND=local` in wrangler.jsonc. The Worker runs the Claude SDK in-process via `local-ai-runner.ts` (287 lines). Uses D1 + R2 like production but skips sandbox containers entirely. Useful for testing routing, auth, and DO logic.

**Key file:** `cloudflare/src/lib/local-ai-runner.ts`

### Production Mode

```
Browser ──WebSocket──→ Worker ──→ Durable Object ──→ Sandbox Container
         ──REST API──→        ──→ D1 Database          ├── agent-runner.ts
                              ──→ R2 Storage            ├── Claude SDK
                                                        └── MCP (fal.ai)
                                                            └── writes to /mnt/r2 (FUSE → R2)
```

Complex. The Worker routes WebSocket connections to a per-user Durable Object. The DO orchestrates a sandbox container that runs a long-lived Node process (`agent-runner.ts`). The agent talks to Claude SDK, generates images via MCP, and writes everything to FUSE-mounted R2 storage.

**Key files:** `cloudflare/src/index.ts`, `cloudflare/src/durable-objects/campaign-session.ts`, `cloudflare/sandbox/agent-runner.ts`

---

## End-to-End Data Flow

### Initial Generation

```
1. User types "Create ads for nike.com" in chat
                    │
2. Client sends     │   { type: "generate", prompt: "...", sessionId: "uuid" }
   via WebSocket    │
                    ▼
3. Server/DO creates campaign in DB (status: "generating")
                    │
4. Server/DO sends  │   { type: "ack", campaignId: "abc123" }
   back to client   │
                    ▼
5. AI agent starts (SDK in-process locally, sandbox container in prod)
   │
   ├── Phase 1: Research ──→ WebFetch brand site, WebSearch cultural angles
   │   └── Saves research.md
   │
   ├── Phase 2: Hooks ──→ Creates 6 ad angles from research
   │   └── Saves hooks.md
   │
   ├── Phase 3: Prompts ──→ Writes image generation prompts
   │   └── Saves prompts.json
   │
   └── Phase 4: Images ──→ Calls nano-banana MCP tool (fal.ai API)
       └── Downloads and saves 6 images
                    │
6. Each step emits  │   { type: "phase" }, { type: "file" }, { type: "image" }
   real-time events │   streamed over WebSocket to client
                    ▼
7. Client renders   │   Thinking blocks, progress, files, images in real-time
                    │
8. Generation done  │   { type: "complete", summary: "...", imageCount: 6 }
                    │   Campaign status → "complete" in DB
```

### Follow-Up

```
1. User types "Make the stat hook more dramatic"
                    │
2. Client sends     │   { type: "follow_up", prompt: "...", campaignId: "abc123" }
                    ▼
3. LOCAL: New SDK query() with same session (fast, ~30s)
   PROD:  Writes /app/next-prompt.json to sandbox (file IPC)
          Agent-runner picks it up, starts new SDK turn
                    │
4. Agent has full context from previous turn
   Modifies specific hooks/images as requested
                    │
5. Events stream back same as initial generation
```

---

## Repository Layout

```
creative_agent/
├── client/                    # React frontend
│   └── src/
│       ├── components/        # 37 components (chat, layout, editor, assets, ui)
│       ├── store/index.ts     # Zustand store (~1055 lines)
│       ├── hooks/             # useWebSocket (generation flow)
│       ├── lib/               # API client, WS manager, auth helpers
│       └── types/             # TypeScript types
│
├── server/                    # Local dev backend (Express + SQLite)
│   ├── sdk-server.ts          # Entry point (~947 lines)
│   └── lib/                   # AI client, WS handler, DB, MCP
│
├── cloudflare/                # Production backend (Cloudflare Workers)
│   ├── src/                   # Worker code
│   │   ├── durable-objects/   # CampaignSession DO (the heart of production)
│   │   ├── db/                # D1 access layer
│   │   ├── lib/               # Types, parsers, buffers
│   │   └── routes/            # API route handlers
│   └── sandbox/               # Container image for AI execution
│       ├── Dockerfile         # node:22-slim + Claude CLI + s3fs
│       ├── agent-runner.ts    # Long-running agent process
│       └── nano-banana-mcp.ts # fal.ai MCP server
│
├── agent/                     # AI agent workspace (skills, examples)
├── docs/                      # Session logs + architecture docs
├── CLAUDE.md                  # Project instructions
└── .env                       # Local environment variables
```

---

## Subsystem Map

Each box is documented in its own file (linked from [INDEX.md](./INDEX.md)):

```
┌─ CLIENT ──────────────────────────────────────────────────────────┐
│                                                                    │
│  React App ◄──── Zustand Store ◄──── WebSocket Hook               │
│  (components)    (state mgmt)        (useWebSocket)                │
│       │               │                    │                       │
│       │          REST API Client      WS Manager                   │
│       │          (lib/api.ts)         (lib/websocket-manager.ts)   │
│       │               │                    │                       │
│  Clerk Auth ──────────┼────────────────────┤                       │
│  (Bearer JWT)         │                    │                       │
└───────────────────────┼────────────────────┼───────────────────────┘
                        │                    │
                   HTTP REST            WebSocket
                        │                    │
┌─ PRODUCTION ──────────┼────────────────────┼───────────────────────┐
│                        │                    │                       │
│  Worker (index.ts) ◄──┴────────────────────┘                       │
│       │                                                            │
│       ├── /api/*  → Router → D1 Database                           │
│       ├── /ws     → Durable Object (per-user)                      │
│       ├── /images → R2 Storage                                     │
│       └── /*      → Static Assets (React SPA)                      │
│                                                                    │
│  Durable Object ──→ Sandbox Container                              │
│  (campaign-session)  (agent-runner + Claude SDK + MCP)             │
│       │                    │                                       │
│       │              /mnt/r2 (FUSE) ──→ R2 Bucket                  │
│       │                                                            │
│  Completion Detection:                                            │
│    Layer 1: waitForLog('turn_complete') ── primary, instant       │
│    Layer 2: R2 alarm polling (30s) ── catches RPC disconnects     │
│    Layer 3: Client /recover endpoint ── last resort               │
│                                                                    │
│  Alarm Heartbeat (30s) ── keeps DO alive + polls R2 + re-attach   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

┌─ LOCAL DEV ───────────────────────────────────────────────────────┐
│                                                                    │
│  Express Server ──→ Claude SDK (in-process)                        │
│       │                  │                                         │
│       ├── SQLite         ├── MCP: nano-banana (fal.ai)             │
│       └── File System    └── Orchestrator Prompt                   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Where to Go Next

- **Building a feature?** Start with the relevant subsystem doc
- **Debugging production?** [Debugging Guide](./ops/DEBUGGING.md) + [Durable Object](./cloudflare/DURABLE_OBJECT.md)
- **First time?** Read [Client Architecture](./client/CLIENT_ARCHITECTURE.md) → [Cloudflare Overview](./cloudflare/CLOUDFLARE_OVERVIEW.md) → [Durable Object](./cloudflare/DURABLE_OBJECT.md)
- **Known issues?** [Known Issues](./ops/KNOWN_ISSUES.md)
