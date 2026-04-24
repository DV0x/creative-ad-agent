# Creative Agent — Architecture Documentation

> **Last updated:** 2026-04-22 | **Branch:** `new-ui` | **Production:** https://creativemachines.xyz | **Staging:** https://creative-agent-staging.alphasapien17.workers.dev
>
> ⚠️ **Drift notice (2026-04-22):** Pass 0 (tactical fixes), Pass 1 (billing), and Pass 2 (streaming / DO / state machine / WS protocol / error propagation / known issues) have landed. Pass 3 (operational docs: STAGING_PRODUCTION.md, DEPLOYMENT.md, AUTH_FLOW.md, SANDBOX_CONTAINER.md HOME correction) is pending. When a subsystem doc conflicts with code, trust the code.

This is the master index for all architecture documentation. Each doc is self-contained — you can read any single doc and understand that subsystem fully.

---

## Quick Start

| I want to... | Read this |
|---|---|
| Understand the whole system | [OVERVIEW.md](./OVERVIEW.md) |
| Trace a generation end-to-end | [Generation Flow](./GENERATION_FLOW.md) |
| Work on the React frontend | [Client Architecture](./client/CLIENT_ARCHITECTURE.md) |
| Debug the Zustand store | [State Management](./client/STATE_MANAGEMENT.md) |
| Fix a WebSocket client bug | [WebSocket Client](./client/WEBSOCKET_CLIENT.md) |
| Understand production infra | [Cloudflare Overview](./cloudflare/CLOUDFLARE_OVERVIEW.md) |
| Debug the Durable Object | [Durable Object](./cloudflare/DURABLE_OBJECT.md) |
| Visualize DO state transitions | [DO State Machine](./cloudflare/DO_STATE_MACHINE.md) |
| Fix sandbox/container issues | [Sandbox Container](./cloudflare/SANDBOX_CONTAINER.md) |
| Debug the streaming pipeline | [Streaming Pipeline](./cloudflare/STREAMING_PIPELINE.md) |
| Query D1 or fix schema | [D1 Database](./cloudflare/D1_DATABASE.md) |
| Debug R2 storage/images | [R2 Storage](./cloudflare/R2_STORAGE.md) |
| Work on local dev server | [Local Architecture](./local/LOCAL_ARCHITECTURE.md) |
| Fix local WebSocket issues | [Local WebSocket](./local/LOCAL_WEBSOCKET.md) |
| Debug AI/SDK issues locally | [Local AI Client](./local/LOCAL_AI_CLIENT.md) |
| Understand auth flow | [Auth Flow](./shared/AUTH_FLOW.md) |
| Check WebSocket message types | [WebSocket Protocol](./shared/WEBSOCKET_PROTOCOL.md) |
| Find an API endpoint | [REST API Reference](./shared/REST_API.md) |
| Understand the AI agent | [AI Agent Pipeline](./shared/AI_AGENT_PIPELINE.md) |
| Debug image generation | [Image Pipeline](./shared/IMAGE_PIPELINE.md) |
| Trace error flows | [Error Propagation](./shared/ERROR_PROPAGATION.md) |
| Understand credits, Dodo Payments, subscriptions | [Billing](./shared/BILLING.md) |
| Understand staging vs production split | _STAGING_PRODUCTION.md — pending rewrite_ |
| Deploy to production | [Deployment](./ops/DEPLOYMENT.md) |
| Debug production issues | [Debugging](./ops/DEBUGGING.md) |
| Check known issues | [Known Issues](./ops/KNOWN_ISSUES.md) |
| Use wrangler dev (local D1/R2) | [OVERVIEW.md → Wrangler Dev Mode](./OVERVIEW.md#wrangler-dev-mode-hybrid) |

---

## Documentation Map

```
docs/architecture/
│
├── INDEX.md .......................... This file
├── OVERVIEW.md ....................... System overview, tech stack, data flow
├── GENERATION_FLOW.md ............... End-to-end generation with ASCII diagrams
│
├── client/ ........................... React Frontend
│   ├── CLIENT_ARCHITECTURE.md ....... App structure, routing, components, auth
│   ├── STATE_MANAGEMENT.md .......... Zustand store shape, actions, selectors
│   └── WEBSOCKET_CLIENT.md .......... WS manager, hook, recovery, events
│
├── cloudflare/ ....................... Production Backend
│   ├── CLOUDFLARE_OVERVIEW.md ....... Worker entry, routing, static assets
│   ├── DURABLE_OBJECT.md ............ CampaignSession lifecycle, state, handlers
│   ├── DO_STATE_MACHINE.md .......... Visual state transitions, race conditions
│   ├── D1_DATABASE.md ............... Schema, access layer, migrations
│   ├── R2_STORAGE.md ................ Key structure, FUSE mount, serving
│   ├── SANDBOX_CONTAINER.md ......... Dockerfile, agent-runner, IPC, lifecycle
│   └── STREAMING_PIPELINE.md ........ stdout → SSE → parse → WS → client
│
├── local/ ............................ Local Development Backend
│   ├── LOCAL_ARCHITECTURE.md ........ Express + SQLite + SDK in-process
│   ├── LOCAL_WEBSOCKET.md ........... WS handler, message types, buffering
│   └── LOCAL_AI_CLIENT.md ........... Claude SDK wrapper, sessions, MCP
│
├── shared/ ........................... Cross-cutting Concerns
│   ├── AUTH_FLOW.md ................. Clerk integration everywhere
│   ├── WEBSOCKET_PROTOCOL.md ........ Full protocol spec (both directions)
│   ├── REST_API.md .................. Complete API reference with examples
│   ├── BILLING.md ................... Credits, subscriptions, Dodo Payments
│   ├── AI_AGENT_PIPELINE.md ......... Orchestrator, subagents, tools, MCP
│   ├── IMAGE_PIPELINE.md ............ Generation → storage → serving → display
│   └── ERROR_PROPAGATION.md ........ Error flows from origin → user, recovery
│
└── ops/ .............................. Operations
    ├── DEPLOYMENT.md ................ Deploy commands, secrets, gotchas
    ├── DEBUGGING.md ................. D1 queries, R2 inspection, logs
    └── KNOWN_ISSUES.md .............. All known gaps with priority
```

---

## Architecture at a Glance

```
                    ┌─────────────────────────────────┐
                    │         React SPA (Vite)         │
                    │  Zustand · WebSocket · Clerk UI  │
                    └──────────┬──────────┬────────────┘
                               │          │
                          WebSocket    REST API
                               │          │
              ┌────────────────┴──────────┴────────────────┐
              │                                            │
   ┌──────────▼──────────┐                   ┌────────────▼────────────┐
   │   LOCAL DEV MODE    │                   │    PRODUCTION MODE      │
   │   Express + SQLite  │                   │    Cloudflare Workers   │
   │   SDK in-process    │                   │    D1 + R2 + DO        │
   │   localhost:3001    │                   │    Sandbox Containers   │
   └─────────────────────┘                   └─────────────────────────┘
```

**Local mode:** Express server runs Claude SDK in-process. Fast iteration, no containers.

**Production mode:** Cloudflare Worker routes to Durable Object (per-user). DO spawns sandbox container running long-lived agent process. Images stored in R2 via FUSE mount.

---

## Key Numbers

| Metric | Value |
|---|---|
| Initial generation time | ~5 min (cold) / ~3 min (warm) |
| Follow-up time | ~30-60s (warm container) |
| Container cold start | ~2.5 min (dominated by Claude CLI init) |
| Container warm window | 2 hours (`sleepAfter`) |
| Max containers | 50 |
| Container spec | standard-2 (1 vCPU, 6 GiB RAM) |
| Images per generation | 6 (one per hook type) |
| WS keep-alive interval | 25s client ping/pong (`websocket-manager.ts:19`) |
| Agent stdout heartbeat | 30s (`agent-runner.ts:50`) |
| Event buffer | Max 1000 events (`event-buffer.ts:7`), sequential IDs |
| Alarm heartbeat | 10s (keeps DO alive during generation) |
| Zombie threshold | 5 min (no agent process + no active setup → mark incomplete) |
| Completion detection | Inline stream-parse loop → post-streaming `tryFinalize` → alarm `listProcesses` fallback → client `/api/recover` last resort |
| Container sleepAfter | 2h |
| DO routing | One DO per user (`idFromName(userId)`) |
| "New from existing" research copy | ~0s (skips ~2 min research phase) |
