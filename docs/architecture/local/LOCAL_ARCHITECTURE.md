# Local Architecture

> Part of [Architecture Documentation](../INDEX.md) | **Directory:** `server/`

---

## Overview

The local dev server is a simpler version of the production backend. Express + SQLite + Claude SDK running in-process. No containers, no R2, no FUSE mounts.

```
Browser (localhost:5173)
    │
    ├── WebSocket ──Vite proxy──→ Express WS handler (localhost:3001)
    └── REST API  ──Vite proxy──→ Express routes (localhost:3001)
                                      │
                                      ├── Claude SDK (in-process)
                                      ├── MCP: nano-banana (fal.ai)
                                      ├── SQLite (data/creative_agent.db)
                                      └── Local filesystem (generated-images/, uploads/)
```

### Starting

```bash
# Terminal 1 — server
cd server && npm run dev

# Terminal 2 — client
cd client && npm run dev
```

---

## Server Entry (`server/sdk-server.ts` — 948 lines)

Express server with:
- REST API routes (`/api/campaigns/*`, `/api/assets/*`)
- WebSocket upgrade handler
- Image serving from `generated-images/`
- Health check endpoint
- Optional Clerk auth middleware

### Key Middleware

```
CORS → Body parser → Static files (generated-images) → Auth middleware → Routes
```

Auth is optional: if `CLERK_SECRET_KEY` is not set, all requests pass as `userId = 'anonymous'`.

---

## Key Files

```
server/
├── sdk-server.ts ............... 948 lines  — Express entry, routes, WS upgrade
├── lib/
│   ├── ai-client.ts ............ 489 lines  — Claude SDK wrapper — query(), session management
│   ├── websocket-handler.ts .... 1672 lines — WS server, generation flow
│   ├── session-manager.ts ...... In-memory SDK session tracking
│   ├── database.ts ............. SQLite init (better-sqlite3)
│   ├── orchestrator-prompt.ts .. System prompt for AI agent
│   ├── nano-banana-mcp.ts ...... MCP server for fal.ai images
│   ├── event-buffer.ts ......... Per-session event buffering
│   ├── image-events.ts ......... Image save event bus
│   ├── instrumentor.ts ......... Cost/token tracking
│   ├── auth.ts ................. Clerk Express middleware
│   └── db/
│       ├── index.ts ............ Barrel export
│       ├── campaigns.ts ........ Campaign CRUD
│       ├── files.ts ............ Campaign files CRUD
│       ├── images.ts ........... Campaign images CRUD
│       ├── messages.ts .......... Chat messages CRUD
│       └── assets.ts ........... Asset folders/files CRUD
└── package.json
```

---

## AI Client (`server/lib/ai-client.ts`)

Wraps the Claude Agent SDK:

```typescript
async function* query(prompt, options): AsyncGenerator<SDKMessage>
```

- Uses `@anthropic-ai/claude-agent-sdk` `query()` function
- Model: `claude-haiku-4-5-20251001`
- Max turns: 30
- System prompt: `ORCHESTRATOR_SYSTEM_PROMPT` (same as production)
- MCP servers: `{ 'nano-banana': nanoBananaMcpServer }`
- Session management: tracks SDK session IDs for follow-up resume

---

## WebSocket Handler (`server/lib/websocket-handler.ts` — 1672 lines)

The largest file. Handles all WebSocket messages and generation orchestration.

### Message Handling

Same message types as production:
- `generate` → Create campaign, start SDK `query()`, stream events
- `follow_up` → Resume SDK session, stream events
- `cancel` → Abort generation
- `subscribe` → Replay buffered events
- `ping` → Respond with `pong`

### Generation Flow (Local)

```
1. Receive 'generate' message
2. Create campaign in SQLite
3. Send ACK with campaign ID
4. Call ai-client.query(prompt, options)
5. Iterate async generator:
   for await (const message of query(...)):
     processSDKMessage(message)  → extract phase/file/image/complete events
     sendWS(event)               → forward to client
6. On 'result' message → mark campaign complete
```

**Key difference from production:** No fire-and-forget. The generation runs synchronously in the WS message handler. This means the server can't handle other WS messages (like ping) during generation.

### Image Handling (Local)

Images saved to `generated-images/{sessionId}/{filename}` on local disk. Served via Express static handler at `GET /images/*`.

---

## Database (`server/lib/database.ts`)

SQLite via `better-sqlite3`. Same schema as D1. Database file: `server/data/creative_agent.db`.

Initializes tables on first run with `CREATE TABLE IF NOT EXISTS`.

---

## Local vs Production Differences

| Aspect | Local | Production |
|---|---|---|
| AI execution | In-process SDK `query()` | Sandbox container + file IPC |
| Startup time | ~5s | ~2.5 min cold, ~30s warm |
| Follow-ups | New `query()` with same session | File IPC to long-running process |
| Image storage | `generated-images/` on disk | R2 via FUSE mount |
| Database | SQLite file | Cloudflare D1 |
| WS implementation | Node `ws` library | DO Hibernation API |
| Generation blocking | Synchronous in handler | Fire-and-forget with alarm |
| Recovery | Event buffer only | Event buffer + inline tryFinalize + alarm fallback (10s) + client POST /recover (D1-first) |
| Credits / billing | None (free) | Pre-flight balance check + `credits_update` broadcast on finalize |
| Streaming text (`text_delta`) | Not emitted — legacy `message` event only | Emitted via `includePartialMessages: true` |

---

## Wrangler Dev Mode (`AI_BACKEND=local`)

A hybrid mode exists for testing the Cloudflare Worker without sandbox containers. Set `AI_BACKEND=local` in `wrangler.jsonc` under `env.dev.vars` and run `wrangler dev --env dev`.

Short version: the DO's `runGenerationLocal` path imports `cloudflare/src/lib/local-ai-runner.ts` (287 lines) and runs the Claude SDK in-process — no container, no FUSE, no IPC files. Images are written to `./generated-images/` on the dev machine.

**Full details:** [LOCAL_AI_RUNNER.md](./LOCAL_AI_RUNNER.md) covers the integration point, what it can and cannot test, and the divergence risk vs the sandbox bundle.

**Use case:** iterate on DO routing, auth, state-machine, or D1 queries without paying the ~2.5 min container cold-start tax on every change.

---

## Known Issues

- **Stale debug endpoints** — `/test`, `/generate`, `/debug/*` from early development. WebSocket is the primary interface
- **Generation blocks WS handler** — Can't handle ping/subscribe during generation
- **No container reuse semantics** — Each generation is a fresh SDK call (no long-lived process)
- **`local-ai-runner.ts` may diverge from sandbox version** — Has its own orchestrator prompt and MCP tool. Changes to `sandbox/orchestrator-prompt.ts` or `sandbox/nano-banana-mcp.ts` must be manually mirrored

---

## See Also

- [Local WebSocket](./LOCAL_WEBSOCKET.md) — WS handler details
- [Local AI Client](./LOCAL_AI_CLIENT.md) — `server/lib/ai-client.ts` SDK wrapper
- [Local AI Runner](./LOCAL_AI_RUNNER.md) — `wrangler dev --env dev` in-process path (different file)
- [Key Differences](../OVERVIEW.md#two-modes-one-codebase) — Full comparison table
