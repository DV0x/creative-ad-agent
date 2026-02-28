# Session Summary — 2026-02-27

## Objective

Deploy the Creative Ad Agent to Cloudflare production infrastructure using the **Cloudflare Sandbox SDK** pattern recommended by Claude's official hosting docs. Migrate from local Bun/Express + SQLite to Cloudflare Workers + D1 + R2 + Sandbox SDK.

---

## Key Decisions Made

### 1. Sandbox SDK Over Plain Containers

**Decision:** Use `@cloudflare/sandbox` instead of raw Cloudflare Containers.

**Why:** The user plans to add skill-based code execution in future upgrades. Sandbox SDK provides isolated per-user execution environments with built-in security boundaries, which plain containers do not. Claude's official hosting docs recommend this pattern for AI agents.

**Trade-off:** Sandbox cold starts take 2-3 minutes on first deploy (mitigated with `keepAlive: true`).

### 2. D1 for Database (Not SQLite in Sandbox)

**Decision:** Migrate all SQLite queries to Cloudflare D1, accessed exclusively from the Worker (not from inside the sandbox).

**Why:** The sandbox is ephemeral — its filesystem is destroyed on restart. Running the DB inside the sandbox would lose all data. D1 is managed SQLite at the edge, accessible via Worker bindings only. The Worker owns all DB reads/writes.

**Impact:** 36 database functions across 5 files need sync-to-async conversion (`db.prepare().all()` → `await db.prepare().bind().all()`).

### 3. R2 for All File Storage

**Decision:** Use a single R2 bucket (`creative-agent-assets`) for:
- Generated campaign images (mounted in sandbox via `mountBucket()`)
- User-uploaded asset files
- SDK session JSONL files (for `--resume` across sandbox restarts)

**R2 key structure:**
```
creative-agent-assets/
├── users/{userId}/
│   ├── home/.claude/projects/{encoded-cwd}/{session-id}.jsonl
│   ├── images/{sessionId}/{timestamp}_N_prompt.png
│   └── uploads/{uniqueSuffix}.ext
```

### 4. Worker Owns HTTP/WS + DB; Sandbox Owns AI Only

**Decision:** Split responsibilities cleanly:
- **Worker:** Auth (Clerk), REST API, D1 queries, WebSocket client relay, R2 file serving, sandbox lifecycle
- **Sandbox:** Claude Agent SDK `query()`, MCP tools (fal.ai image gen), skill execution

**Data flow:** Sandbox outputs events as JSON lines to stdout → Worker reads stdout → Worker writes to D1 + relays to client WebSocket.

### 5. Hybrid Session Persistence (D1 + R2)

**Decision:** Use the "Hybrid Sessions" pattern:
- **D1** stores app state (campaigns, messages, images, files) — hydrated on every request
- **R2** stores SDK session JSONL files (mounted at `HOME=/data/home` so `~/.claude/` persists) — enables `--resume` across sandbox restarts

### 6. SessionManager Is Dead Code — Remove It

**Decision:** `server/lib/session-manager.ts` (Layer 2 in the 3-layer session architecture) is dead code. Remove all references in the Cloudflare deployment. The original server code stays for local dev.

### 7. Pages + Worker on Same Domain

**Decision:** Deploy React SPA to Cloudflare Pages, Worker handles `/api/*`, `/ws`, `/images/*` routes via Worker Routes on the same custom domain (`app.creative-agent.com`). No CORS needed.

---

## What Was Built

### Deployment Plan Document

**File:** `docs/cloudflare/DEPLOYMENT_PLAN.md` (2,829 lines)

Written by a subagent after extensive research and codebase analysis. Covers 7 implementation phases with verified pseudocode (cross-referenced against actual source files).

### Plan Structure

| Phase | Description | Key Deliverables |
|-------|-------------|-----------------|
| **Phase 1: Infrastructure Setup** | Wrangler config, Dockerfile, D1 database, R2 bucket, secrets | `worker/wrangler.jsonc`, `worker/Dockerfile`, `worker/src/d1/schema.sql` |
| **Phase 2: Worker Implementation** | HTTP routes, D1 async layer, WebSocket handler, auth, sandbox lifecycle | `worker/src/index.ts`, `router.ts`, `ws-handler.ts`, `sandbox.ts`, `auth.ts`, `d1/*.ts` |
| **Phase 3: Sandbox Adaptation** | Pipeline runner script, MCP adaptation, dead code removal | `server/sandbox-pipeline.ts`, modified `nano-banana-mcp.ts` |
| **Phase 4: Image & File Storage** | R2 serving, upload migration, asset resolution for SDK | Modified `handleImageServing`, `handleFileUpload`, asset path resolution |
| **Phase 5: Frontend Deployment** | Pages setup, `_routes.json`, env vars | `client/public/_routes.json`, Pages project config |
| **Phase 6: Session Persistence** | R2 mount for JSONL, resume flow, sandbox sleep/wake, TTL cleanup | Cron trigger for old session cleanup, `sdk_session` event handling |
| **Phase 7: Testing & Migration** | Local dev workflow, staging deploy, SQLite → D1 data migration, smoke tests | 6 smoke tests, production deployment checklist |

### Appendices

- **Appendix A:** All 36 DB functions with line numbers, signatures, and D1 conversion notes
- **Appendix B:** 10-item risk register (5 high-impact, 5 medium-impact) with mitigations

---

## Architecture Diagrams

### Current (Local)
```
Browser → Vite (:5173) → Express + WS (:3001) → Claude Agent SDK
                                                       │
                                          ┌────────────┼────────────┐
                                          ▼            ▼            ▼
                                     SQLite        Local FS       MCP (fal.ai)
```

### Target (Cloudflare)
```
┌─────────────────┐         ┌──────────────────────────────┐
│ Cloudflare Pages│  HTTP   │ Cloudflare Worker             │
│ (React SPA)     │────────►│ - Auth (Clerk JWT)            │
└─────────────────┘   WS    │ - REST API → D1               │
                      │     │ - getSandbox(env.Sandbox, uid)│
                      │     └──────────┬───────────────────┘
                      │                │
                      │     ┌──────────▼───────────────────┐
                      └────►│ Cloudflare Sandbox (per-user) │
                            │ - Claude Agent SDK            │
                            │ - Skills execution (isolated) │
                            │ - MCP tools (fal.ai)          │
                            │ - R2 mounted as /data         │
                            └──────────────────────────────┘
                                        │
                     ┌──────────────┬───┘
                     ▼              ▼
                ┌────────┐   ┌──────────┐
                │   D1   │   │    R2    │
                │(SQLite)│   │ (images, │
                │        │   │  uploads,│
                │        │   │  JSONL)  │
                └────────┘   └──────────┘
```

---

## Research Conducted

### Documentation Read

| Source | Content | Key Takeaways |
|--------|---------|---------------|
| Claude Agent SDK hosting docs | Official hosting patterns for Claude agents | Recommends Ephemeral, Long-Running, Hybrid, or Single Container patterns |
| Cloudflare Sandbox SDK docs (`sandbox-sdk.md`, 418KB) | Full API reference — Storage, Commands, Ports, Files, Backups, Config | `mountBucket()` only works in production (not `wrangler dev`); `wsConnect()` for WS proxy; `exposePort()` needs custom domain with wildcard DNS |
| Project `ARCHITECTURE.md` (1,155 lines) | Three-layer session architecture, known issues, phase roadmap | Layer 2 (SessionManager) is dead code; §9.5 identifies ephemeral container JSONL problem; Phase 2 planned stateless operations |

### Source Files Analyzed

| File | Lines | Purpose |
|------|-------|---------|
| `server/lib/database.ts` | 167 | SQLite schema (6 tables), WAL mode, migrations |
| `server/lib/db/campaigns.ts` | ~110 | 10 campaign CRUD functions |
| `server/lib/db/messages.ts` | ~120 | 6 message CRUD functions |
| `server/lib/db/images.ts` | ~90 | 5 image CRUD functions |
| `server/lib/db/files.ts` | ~60 | 5 campaign file functions |
| `server/lib/db/assets.ts` | ~110 | 10 asset folder/file functions |
| `server/lib/ai-client.ts` | ~400 | Claude SDK wrapper, `query()`, model config, tool list |
| `server/lib/session-manager.ts` | 343 | DEAD CODE — in-memory session store (to remove) |
| `server/sdk-server.ts` | ~80 | Express app entry point, WS server setup |
| `client/vite.config.ts` | ~35 | Proxy config for `/api`, `/ws`, `/images` |

---

## Files Changed

| File | Change |
|------|--------|
| `.claude/settings.local.json` | Added `Read`, `Glob`, `Grep` to permissions allow list |
| `docs/cloudflare/DEPLOYMENT_PLAN.md` | **Created** — 2,829-line deployment plan covering 7 phases + 2 appendices |

---

## Key Constraints Discovered

1. **`mountBucket()` doesn't work in `wrangler dev`** — Must test sandbox integration on staging/production, not locally
2. **`exposePort()` requires custom domain with wildcard DNS** — Cannot use `.workers.dev` for WebSocket proxy; use `wsConnect()` instead
3. **D1 is async, better-sqlite3 is sync** — Every DB function signature changes (36 functions)
4. **D1 `first()` returns `null`, not `undefined`** — All existing falsy checks (`!campaign`) still work, no logic changes needed
5. **Sandbox has no D1 binding** — Only the Worker can access D1; sandbox communicates via stdout JSON lines
6. **SDK JSONL files live at `~/.claude/projects/{encoded-cwd}/`** — Must set `HOME=/data/home` and mount R2 there for persistence
7. **Sandbox cold start: 2-3 minutes** — Mitigate with `keepAlive: true` and `sleepAfter: '15m'`

---

## Risk Summary

### High-Impact Risks

| Risk | Mitigation |
|------|------------|
| Sandbox cold start (2-3 min) | `keepAlive: true`, warm on deploy |
| R2 mount unavailable locally | Test sandbox standalone; use staging for integration |
| SDK JSONL corruption on crash | Catch resume errors, fall back to fresh session |
| WebSocket drops during long gen | Event buffering in Worker, client reconnect with lastEventId |

### Medium-Impact Risks

| Risk | Mitigation |
|------|------------|
| Clerk auth differences (@clerk/express vs @clerk/backend) | Both use same JWKS endpoint |
| fal.ai rate limits in sandbox | 500ms delay between images, retry with backoff |
| Multiple concurrent generations per user | Limit 1 active per sandbox, queue extras |

---

## What's Next

1. **Review the deployment plan** at `docs/cloudflare/DEPLOYMENT_PLAN.md`
2. **Begin Phase 1 implementation** — Create `worker/` directory, Wrangler config, Dockerfile, D1 schema, R2 bucket
3. **Phase 2** — Worker entry point, D1 async layer (36 function conversions), WebSocket handler, auth module
4. **Phase 3** — `sandbox-pipeline.ts` script, MCP adaptation, dead code removal
5. **Phases 4-7** — Storage migration, frontend deployment, session persistence, testing

---

## Session Context

- **Branch:** `new-ui`
- **Date:** 2026-02-27
- **Duration:** Full session (hit context limit, used subagent for plan writing)
- **Skill used:** `/cloudflare-deploy`
- **Subagent used:** general-purpose agent to write the deployment plan (read all source files, verified pseudocode against codebase)
