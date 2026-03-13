# Session 34 — Architecture Documentation Sprint

**Date:** 2026-03-10
**Branch:** `new-ui`
**Goal:** Create comprehensive, modular architecture documentation for the entire system

---

## What Was Done

### 1. Full Codebase Exploration

Launched 5 parallel research agents to explore every part of the repo:

- **Client agent** — React frontend, Zustand store (1055 lines), WebSocket manager, auth integration, all 37 components
- **Server agent** — Express backend, AI client, WebSocket handler (1606 lines), SQLite DB, MCP integration, session management
- **Cloudflare agent** — Worker entry, router, Durable Object (campaign-session.ts), sandbox container, D1 schema, R2 storage, auth
- **Root/docs agent** — Architecture docs, test files, claude_sdk/ reference docs, git history, log files
- **DB schema agent** — Complete schema for both SQLite (local) and D1 (production), migrations, access layers

### 2. Created Initial Architecture Doc

**File:** `docs/ARCHITECTURE_CURRENT_STATE.md` (708 lines)

Single comprehensive doc covering all 13 sections:
- Project overview, repo structure, local architecture, production architecture
- Database schema, AI agent pipeline, WebSocket protocol, REST API
- Auth, image generation, local vs production comparison
- Current state with 14 known gaps, deployment guide

### 3. Identified 14 Known Gaps

1. `writeCompletionMarker()` scans ALL `/mnt/r2/images/` (fix written, not deployed)
2. `parseSSEStream()` silently drops long messages
3. WebSocket transport 120s hardcoded timeout (SDK limitation)
4. `waitForLog` hangs on RPC disconnect (R2 polling is safety net)
5. No CI/CD pipeline
6. No production Clerk setup (still test keys)
7. Debug diagnostics retained in campaign-session.ts
8. E2E tests broken with Clerk auth
9. Container cold start ~2.5 min
10. No rate limiting
11. No error monitoring
12. Stale debug endpoints in local server
13. Asset uploads not thoroughly tested e2e
14. No R2 cleanup on campaign deletion

---

## Next Steps — Modular Architecture Docs

The initial `ARCHITECTURE_CURRENT_STATE.md` is a good overview but too monolithic. Need to break it into focused, deep-dive docs organized by subsystem.

### Planned Doc Structure

```
docs/architecture/
├── INDEX.md                        # Master index linking all docs
├── OVERVIEW.md                     # High-level system overview (what, why, how)
│
├── local/
│   ├── LOCAL_ARCHITECTURE.md       # Express + SQLite + SDK in-process flow
│   ├── LOCAL_WEBSOCKET.md          # WS handler, message types, event buffering
│   └── LOCAL_AI_CLIENT.md          # Claude SDK wrapper, session management, MCP
│
├── cloudflare/
│   ├── CLOUDFLARE_OVERVIEW.md      # Worker entry, routing, static assets
│   ├── DURABLE_OBJECT.md           # CampaignSession DO — lifecycle, state, handlers
│   ├── D1_DATABASE.md              # Schema, access layer, migrations, queries
│   ├── R2_STORAGE.md               # Key structure, FUSE mount, image serving, cleanup
│   ├── SANDBOX_CONTAINER.md        # Dockerfile, agent-runner, IPC, lifecycle
│   └── STREAMING_PIPELINE.md      # stdout → SSE → parse → events → WS → client
│
├── client/
│   ├── CLIENT_ARCHITECTURE.md      # React app structure, routing, auth
│   ├── STATE_MANAGEMENT.md         # Zustand store shape, actions, generation flow
│   └── WEBSOCKET_CLIENT.md         # WS manager, hook, recovery, event handling
│
├── shared/
│   ├── AUTH_FLOW.md                # Clerk integration (client + server + cloudflare)
│   ├── WEBSOCKET_PROTOCOL.md       # Full protocol spec (message types both directions)
│   ├── REST_API.md                 # Complete API reference with examples
│   ├── AI_AGENT_PIPELINE.md        # Orchestrator, subagents, tools, MCP, skills
│   └── IMAGE_PIPELINE.md           # Generation → storage → serving → display
│
└── ops/
    ├── DEPLOYMENT.md               # Deploy commands, secrets, gotchas
    ├── DEBUGGING.md                # D1 queries, R2 inspection, wrangler tail, logs
    └── KNOWN_ISSUES.md             # All known gaps with status and priority
```

### What Each Doc Should Cover

**Each doc should be self-contained** — someone can read just `DURABLE_OBJECT.md` and understand:
- What it does (plain English)
- Key files and line references
- Data flow diagram (ASCII)
- State management (what's persisted, what's transient)
- Error handling and edge cases
- Known issues specific to this subsystem
- How it connects to adjacent subsystems (with links to those docs)

### Priority Order for Next Session

1. **INDEX.md** — create the skeleton with links (even to not-yet-written docs)
2. **CLOUDFLARE_OVERVIEW.md** — the most complex part, needs the most documentation
3. **DURABLE_OBJECT.md** — the heart of production; most bugs have been here
4. **SANDBOX_CONTAINER.md** — second most complex; agent lifecycle, IPC, FUSE
5. **STREAMING_PIPELINE.md** — the data flow from sandbox stdout to client UI
6. **D1_DATABASE.md** + **R2_STORAGE.md** — storage layers
7. **CLIENT_ARCHITECTURE.md** + **STATE_MANAGEMENT.md** — frontend
8. **KNOWN_ISSUES.md** — prioritized gap list with actionable next steps

---

## Key Files Read This Session

### Client
- `client/src/App.tsx` — root component, auth gating, data loading, recovery
- `client/src/store/index.ts` — Zustand store (1055 lines)
- `client/src/hooks/useWebSocket.ts` — WS hook, generation flow, recovery
- `client/src/lib/websocket-manager.ts` — singleton WS connection
- `client/src/lib/api.ts` — REST API client with type transforms
- `client/vite.config.ts` — dev proxy to localhost:3001

### Server
- `server/sdk-server.ts` — Express entry (947 lines)
- `server/lib/ai-client.ts` — Claude SDK wrapper
- `server/lib/websocket-handler.ts` — WS server (1606 lines)
- `server/lib/database.ts` — SQLite schema + init
- `server/lib/nano-banana-mcp.ts` — fal.ai MCP server

### Cloudflare
- `cloudflare/wrangler.jsonc` — all bindings
- `cloudflare/src/index.ts` — Worker entry
- `cloudflare/src/router.ts` — API router
- `cloudflare/src/auth.ts` — Clerk JWT verification
- `cloudflare/src/env.d.ts` — TypeScript bindings
- `cloudflare/src/durable-objects/campaign-session.ts` — DO (first 200 lines)
- `cloudflare/sandbox/Dockerfile` — container image
- `cloudflare/sandbox/agent-runner.ts` — long-running agent (first 100 lines)
- `cloudflare/sandbox/nano-banana-mcp.ts` — MCP server (sandbox version)
- `cloudflare/schema.sql` — D1 schema

### Root
- `package.json` — root workspace
- `CLAUDE.md` — project instructions

---

## Artifacts Created

| File | Lines | Description |
|------|-------|-------------|
| `docs/ARCHITECTURE_CURRENT_STATE.md` | 708 | Monolithic architecture doc (to be superseded by modular docs) |
| `docs/SESSION_34_ARCHITECTURE_DOCS_2026-03-10.md` | This file | Session summary |
