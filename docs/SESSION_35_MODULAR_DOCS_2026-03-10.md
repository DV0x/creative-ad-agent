# Session 35 — Modular Architecture Documentation

**Date:** 2026-03-10
**Branch:** `new-ui`
**Goal:** Create world-class modular architecture documentation from the monolithic `ARCHITECTURE_CURRENT_STATE.md`

---

## What Was Done

### 1. Deep Codebase Exploration (4 Parallel Agents)

Launched 4 exploration agents to read every file thoroughly:

- **Client agent** — React app, Zustand store (1055 lines), WebSocket manager, auth, all components, types
- **Cloudflare agent** — Worker entry, router, Durable Object (~1600 lines full read), DB layer, lib files, all routes, schema, config
- **Sandbox agent** — Dockerfile, agent-runner.ts (205 lines), orchestrator-prompt.ts (77 lines), nano-banana-mcp.ts (357 lines), package.json, tsconfig.json
- **Local server agent** — sdk-server.ts (947 lines), ai-client.ts (490 lines), websocket-handler.ts (1606 lines), database.ts, session-manager.ts, all DB layer, routes, auth

### 2. Created 22 Modular Architecture Docs (4,261 lines)

```
docs/architecture/
├── INDEX.md .................. 116 lines — Master index with quick-start table
├── OVERVIEW.md ............... 216 lines — System overview, two modes, data flow
│
├── client/ (3 files, 721 lines)
│   ├── CLIENT_ARCHITECTURE.md .. App structure, component tree, auth gating, recovery
│   ├── STATE_MANAGEMENT.md ..... Full Zustand store: shape, all actions, pending buffer pattern
│   └── WEBSOCKET_CLIENT.md ..... WS manager, hook, reconnect, event→store map
│
├── cloudflare/ (6 files, 1146 lines)
│   ├── CLOUDFLARE_OVERVIEW.md .. Worker entry (50 lines), routing, bindings, wrangler config
│   ├── DURABLE_OBJECT.md ....... Full state machine, generation flow, 3-layer completion, cancel, subscribe
│   ├── D1_DATABASE.md .......... Full schema (6 tables), all access layer functions
│   ├── R2_STORAGE.md ........... Key structure, FUSE flush rules, mount lifecycle, gotchas
│   ├── SANDBOX_CONTAINER.md .... Dockerfile, agent-runner turn lifecycle, MCP tool, file IPC contract
│   └── STREAMING_PIPELINE.md ... 5-stage pipeline: stdout → SSE → parse → events → WS
│
├── local/ (3 files, 364 lines)
│   ├── LOCAL_ARCHITECTURE.md ... Express + SQLite + in-process SDK overview
│   ├── LOCAL_WEBSOCKET.md ...... WS handler, generation flow, event buffering
│   └── LOCAL_AI_CLIENT.md ...... SDK wrapper, session tracking, MCP
│
├── shared/ (5 files, 1168 lines)
│   ├── AUTH_FLOW.md ............ Clerk integration: client, local server, Worker, DO gotchas
│   ├── WEBSOCKET_PROTOCOL.md ... Full message spec both directions with examples + flow diagrams
│   ├── REST_API.md ............. Every endpoint with request/response examples
│   ├── AI_AGENT_PIPELINE.md .... Orchestrator workflow, tools, MCP, follow-up context, art styles
│   └── IMAGE_PIPELINE.md ....... Generation → storage → FUSE → serving → AuthImage display
│
└── ops/ (3 files, 530 lines)
    ├── DEPLOYMENT.md ........... Full deploy command, secrets, two-phase propagation, gotchas
    ├── DEBUGGING.md ............ D1 queries, R2 inspection, wrangler tail, container logs
    └── KNOWN_ISSUES.md ......... 14 issues prioritized (high/medium/low) with status
```

### 3. Key Design Decisions

- **Each doc is self-contained** — can be read independently without context from other docs
- **Cross-linked** — every doc has "See Also" section pointing to related docs
- **INDEX.md has quick-start table** — "I want to... → Read this" for fast navigation
- **ASCII diagrams** in OVERVIEW.md, DURABLE_OBJECT.md, STREAMING_PIPELINE.md, WEBSOCKET_PROTOCOL.md
- **No pseudocode** — only real function names, real file paths, real line counts
- **Gotchas inline** — each doc lists gotchas specific to that subsystem, not in a separate file

---

## What to Review Next Session

### Accuracy Checks Needed

1. **Durable Object doc** — I read lines 1-900 of campaign-session.ts but not the full `runGeneration()` method (lines ~900-1100). Should verify:
   - Exact sandbox setup sequence (unmount → mount → pre-flight)
   - File hydration logic for cold follow-up
   - The `finally` block cleanup (cancel vs normal)
   - `runFollowUpFast()` full flow

2. **Local server docs** — Based on agent exploration, not full file reads. Should verify:
   - `sdk-server.ts` route list (may have stale debug endpoints not documented)
   - `websocket-handler.ts` processSDKMessage() differences from cloudflare version
   - `session-manager.ts` disk persistence details
   - `image-events.ts` MCP bridge mapping

3. **Orchestrator prompt** — Only read 77-line sandbox version. Should verify:
   - Local version (`server/lib/orchestrator-prompt.ts`) matches sandbox version
   - Art style skill definitions and names
   - Research agent definition (`agent/.claude/agents/research.md`)

4. **Asset upload flow** — Documented endpoints but the full flow (upload → R2 → reference in generation → fal.ai public URL) needs verification against actual code

### Potential Gaps in Documentation

1. **`agent/` directory** — The agent workspace (skills, agents, examples) is not documented. Should have a doc covering:
   - `.claude/agents/research.md` — research agent definition
   - `.claude/skills/hook-methodology/` — hook skill definition
   - `.claude/skills/art-style/` — art style skill definition
   - `files/` directory structure and example files
   - `CLAUDE.md` agent workspace instructions

2. **Error handling patterns** — No dedicated doc on how errors propagate:
   - SDK errors → agent-runner → DO → client
   - D1 errors in route handlers
   - R2 errors during image serving
   - Sandbox creation failures

3. **Cost/metrics tracking** — `server/lib/instrumentor.ts` (SDKInstrumentor) not documented anywhere. Tracks tokens, costs, agent calls. May or may not be used in production

4. **Event buffer implementation details** — Both local (`server/lib/event-buffer.ts`, 127 lines) and production (`cloudflare/src/lib/event-buffer.ts`, 51 lines) have different implementations:
   - Local: 40-min TTL, max 1000 events, cleanup every 5 min
   - Production: max 1000 events, trim to 500, no TTL (DO lifecycle manages it)

5. **Block builder** — `cloudflare/src/lib/block-builder.ts` (106 lines) builds message blocks during streaming. Mentioned in STREAMING_PIPELINE.md but not deeply documented

6. **Local vs Production SDK message parser differences** — `sdk-message-parser.ts` (256 lines, cloudflare) vs `processSDKMessage()` in `websocket-handler.ts` (1606 lines, local). May have diverged

7. **`lib/local-ai-runner.ts`** — Cloudflare has a `local-ai-runner.ts` (376 lines) for `AI_BACKEND=local` dev mode. Not documented

8. **Wrangler dev mode** — How to run the cloudflare worker locally with `wrangler dev`. The `AI_BACKEND=local` flag and its implications

9. **Migration history** — D1 schema has `sdk_session_id` and `blocks` columns added via migrations. The migration path isn't documented

10. **Container image versioning** — Dockerfile pins `@cloudflare/sandbox:0.7.10` and `@anthropic-ai/claude-code@2.1.64`. How to update these

### Structural Improvements

1. **Add a CHANGELOG.md** — Track what changed in each doc update (prevents drift)
2. **Add file-level line references** — Some docs say "~1100 lines" but exact counts would be better (can drift as code changes)
3. **Add a GLOSSARY.md** — Terms like "DO reset", "fire-and-forget", "turn_complete sentinel", "FUSE mount" are used everywhere but never defined in one place
4. **Consider a TROUBLESHOOTING.md** — Specific "symptom → cause → fix" entries (currently split between DEBUGGING.md and KNOWN_ISSUES.md)

---

## Files Created This Session

| File | Lines | Description |
|------|-------|-------------|
| `docs/architecture/INDEX.md` | 116 | Master index with quick-start table |
| `docs/architecture/OVERVIEW.md` | 216 | System overview, tech stack, data flow |
| `docs/architecture/client/CLIENT_ARCHITECTURE.md` | 221 | App structure, components, auth, recovery |
| `docs/architecture/client/STATE_MANAGEMENT.md` | 256 | Zustand store: shape, actions, patterns |
| `docs/architecture/client/WEBSOCKET_CLIENT.md` | 244 | WS manager, hook, reconnect, events |
| `docs/architecture/cloudflare/CLOUDFLARE_OVERVIEW.md` | 148 | Worker entry, routing, bindings |
| `docs/architecture/cloudflare/DURABLE_OBJECT.md` | 267 | DO lifecycle, generation, completion, cancel |
| `docs/architecture/cloudflare/D1_DATABASE.md` | 174 | Schema, access layer functions |
| `docs/architecture/cloudflare/R2_STORAGE.md` | 160 | Key structure, FUSE, flush rules |
| `docs/architecture/cloudflare/SANDBOX_CONTAINER.md` | 222 | Dockerfile, agent-runner, IPC, MCP |
| `docs/architecture/cloudflare/STREAMING_PIPELINE.md` | 175 | stdout → SSE → parse → WS → client |
| `docs/architecture/local/LOCAL_ARCHITECTURE.md` | 169 | Express + SQLite + SDK overview |
| `docs/architecture/local/LOCAL_WEBSOCKET.md` | 107 | WS handler, generation flow |
| `docs/architecture/local/LOCAL_AI_CLIENT.md` | 88 | SDK wrapper, sessions, MCP |
| `docs/architecture/shared/AUTH_FLOW.md` | 187 | Clerk across all layers |
| `docs/architecture/shared/WEBSOCKET_PROTOCOL.md` | 311 | Full message spec + flow diagrams |
| `docs/architecture/shared/REST_API.md` | 243 | Complete endpoint reference |
| `docs/architecture/shared/AI_AGENT_PIPELINE.md` | 212 | Orchestrator, tools, MCP, art styles |
| `docs/architecture/shared/IMAGE_PIPELINE.md` | 215 | Generation → storage → serving → display |
| `docs/architecture/ops/DEPLOYMENT.md` | 170 | Deploy commands, secrets, gotchas |
| `docs/architecture/ops/DEBUGGING.md` | 196 | D1 queries, R2 inspection, logs |
| `docs/architecture/ops/KNOWN_ISSUES.md` | 164 | 14 issues prioritized with status |
| `docs/SESSION_35_MODULAR_DOCS_2026-03-10.md` | this file | Session summary |

**Total: 4,261 lines of architecture documentation across 22 files**

---

## Supersedes

- `docs/ARCHITECTURE_CURRENT_STATE.md` (708 lines) — monolithic doc from Session 34. Still valid as a quick reference but the modular docs are now the source of truth
