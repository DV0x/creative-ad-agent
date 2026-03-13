# AGENTS.md

Project-specific instructions for Codex.

## Project Overview

Creative agent — a chat-based AI tool for generating ad campaigns (images, hooks, copy). Stack: React + Vite (client), Node + Express (server), SQLite (persistence), Codex SDK (AI), WebSocket (real-time).

## Key Directories

- `client/` — React frontend (Zustand store, WebSocket hook, chat UI)
- `server/` — Node/Express backend (WebSocket handler, AI client, DB layer, MCP integration)
- `docs/` — Implementation plans and architecture docs

## Architecture Docs Reference

All architecture docs live in `docs/architecture/` (23 files, verified accurate as of 2026-03-10). Read the relevant doc before modifying any subsystem.

| Area | Doc | When to read |
|------|-----|-------------|
| **System overview** | `OVERVIEW.md` | Understanding the whole system |
| | `GENERATION_FLOW.md` | Tracing a generation end-to-end |
| **Client** | `client/CLIENT_ARCHITECTURE.md` | React components, routing, auth UI |
| | `client/STATE_MANAGEMENT.md` | Zustand store, actions, selectors |
| | `client/WEBSOCKET_CLIENT.md` | WS manager, hook, reconnect, events |
| **Cloudflare** | `cloudflare/CLOUDFLARE_OVERVIEW.md` | Worker entry, routing, static assets |
| | `cloudflare/DURABLE_OBJECT.md` | CampaignSession lifecycle, state, handlers |
| | `cloudflare/D1_DATABASE.md` | Schema, access layer, migrations |
| | `cloudflare/R2_STORAGE.md` | Key structure, FUSE mount, image serving |
| | `cloudflare/SANDBOX_CONTAINER.md` | Dockerfile, agent-runner, IPC, container lifecycle |
| | `cloudflare/STREAMING_PIPELINE.md` | stdout → SSE → parse → WS → client |
| **Local dev** | `local/LOCAL_ARCHITECTURE.md` | Express + SQLite + SDK in-process |
| | `local/LOCAL_WEBSOCKET.md` | Local WS handler, message types |
| | `local/LOCAL_AI_CLIENT.md` | Codex SDK wrapper, sessions, MCP |
| **Shared** | `shared/AUTH_FLOW.md` | Clerk auth integration |
| | `shared/WEBSOCKET_PROTOCOL.md` | Full WS protocol spec (both directions) |
| | `shared/REST_API.md` | All API endpoints with examples |
| | `shared/AI_AGENT_PIPELINE.md` | Orchestrator, subagents, tools, MCP |
| | `shared/IMAGE_PIPELINE.md` | Image generation → storage → serving → display |
| **Ops** | `ops/DEPLOYMENT.md` | Deploy commands, secrets, gotchas |
| | `ops/DEBUGGING.md` | D1 queries, R2 inspection, logs |
| | `ops/KNOWN_ISSUES.md` | All known issues with priority |

All paths relative to `docs/architecture/`. Full index with architecture diagrams: `docs/architecture/INDEX.md`.

## Plan Document Rules

When writing or updating implementation plan documents (anything in `docs/`):

1. **Never write pseudocode without verifying it.** Before referencing any function, variable, type, or signature in a plan, read the actual source file and confirm it exists with the correct name and signature. Do not guess or write from memory.

2. **Cross-reference in the same pass.** After writing plan pseudocode, immediately verify every reference against the codebase — function names, argument counts, return types, interface fields, barrel exports. Do not treat "architecture review" and "pseudocode accuracy" as separate steps that require user prompting.

3. **No placeholder comments in pseudocode.** Never write `/* same as handleGenerate */` or similar. Either write the actual code, or extract the shared logic into a named function and reference that. Placeholders create gaps that get missed.

4. **Check transitive dependencies.** When a plan adds a new function to a module, also check whether the barrel export (`index.ts`) needs updating, whether TypeScript interfaces need new fields, and whether initialization sites need the new field.

5. **Verify cleanup paths.** For any function with try/catch/finally, trace every early return path through the finally block. Check that cleanup only affects resources created by this invocation, not stale state from a previous one.
