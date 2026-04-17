# Session 69 — Managed Agents Analysis & Architecture Comparison

**Date:** 2026-04-09
**Branch:** `new-ui`
**Focus:** Anthropic's Claude Managed Agents (launched April 8, 2026) — what it is, how it maps to our architecture, migration path, and future agent-building strategy.

---

## 1. What Are Claude Managed Agents?

Managed Agents is a **fully managed agent-as-a-service** platform launched by Anthropic on April 8, 2026 (public beta). Instead of building your own agent loop, tool execution, sandboxing, and infrastructure, Anthropic hosts and runs everything.

**One-sentence summary:** Managed Agents = Agent SDK + Anthropic hosts the runtime for you.

### Core Concepts

| Concept | Description |
|---|---|
| **Agent** | Reusable, versioned config: model + system prompt + tools + MCP servers + skills. Created once, referenced by ID. |
| **Environment** | Container template: packages (pip, npm, apt, etc.), networking rules (unrestricted or limited with allowed_hosts). |
| **Session** | A running agent instance performing a task. Persistent filesystem + conversation history across multiple turns. |
| **Events** | SSE-based communication: you send `user.message`, agent streams back `agent.tool_use`, `agent.message`, `session.status_idle`. |

### API Surface

```
POST   /v1/agents              → Create agent config
POST   /v1/environments        → Create container config
POST   /v1/sessions            → Launch a session (agent + environment)
POST   /v1/sessions/:id/events → Send user message
GET    /v1/sessions/:id/stream → SSE stream of agent events
POST   /v1/sessions/:id/archive → Archive session
DELETE /v1/sessions/:id        → Delete session
```

All requests require beta header: `managed-agents-2026-04-01`

### Built-in Tools

| Tool | Description |
|---|---|
| `bash` | Shell commands in the container |
| `read` / `write` / `edit` | File operations |
| `glob` / `grep` | File search |
| `web_fetch` / `web_search` | Internet access |
| MCP servers | External tool providers (URL-based) |
| Custom tools | You define schema, your app executes, results flow back via events |

All enabled by default via `agent_toolset_20260401`. Can disable specific tools or whitelist only what you need.

### Architecture (from Anthropic engineering blog)

Three decoupled components:

1. **Brain (Harness)** — Claude + orchestration. Calls tools via `execute(name, input) → string`. Stateless and replaceable.
2. **Hands (Sandboxes)** — Containers, MCP servers, any execution environment. All present the same interface.
3. **Session (State Log)** — Append-only event log outside both brain and hands. Enables recovery without data loss.

Key wins:
- Credentials never reach the sandbox (security boundary)
- ~60% faster time-to-first-token at p50 (containers decouple from harness)
- Fault isolation: container crashes become tool-call errors, not session failures

### Pricing

| Component | Cost |
|---|---|
| Token cost | Standard API pricing (same rates as Messages API) |
| Runtime | $0.08/session-hour (active time only, measured in ms, idle is free) |
| Web search | $10/1,000 searches |

---

## 2. How Our Architecture Maps to Managed Agents

### What it replaces (~90% of our infrastructure)

| Our Infrastructure (~3,000+ lines) | Managed Agents Equivalent |
|---|---|
| **CampaignSession DO** (1800 lines) — agent loop, alarm heartbeat, zombie detection, crash recovery, completion detection | **Gone.** Anthropic runs the agent loop. Fault isolation is built in. |
| **Sandbox containers** — Dockerfile, `getSandbox()`, IP retry, FUSE mount, `mountBucket`, `unmountBucket` | **Gone.** Environments are declarative JSON. |
| **agent-runner.ts** (440 lines) — long-lived process, file IPC, heartbeat, status files, completion markers | **Gone.** Sessions are persistent, multi-turn. Send events, get events back. |
| **Streaming pipeline** — stdout JSONL → parseSSEStream → processSDKMessage → EventBuffer → WS | **Replaced by native SSE.** Events stream directly. |
| **Session persistence** — DO storage, `persistSession()`, `restoreSession()`, `clearPersistedSession()` | **Built-in.** Event history persisted server-side. |
| **Cancel flow** — abort controller, kill agent, unmount R2 | **Built-in.** Send `user.interrupt` event. |
| **Context management** — D1 conversation hydration, cold-start file restoration | **Built-in.** Compaction, context editing, persistent session state. |

### What still needs our code

| Feature | How It Maps |
|---|---|
| **nano-banana MCP** (fal.ai image gen) | Custom tool. `agent.custom_tool_use` event → our Worker calls fal.ai → `user.custom_tool_result` back. |
| **Agent skills** (research, hook-methodology, art-style) | Upload via Skills API, reference by `skill_id`. Same SKILL.md format. |
| **D1 database** (campaigns, images, files, credits) | Unchanged. Our business data layer stays. |
| **R2 image storage** | Still needed for persistent user-facing image serving. |
| **Clerk auth + per-user isolation** | Still ours. Worker handles auth, maps users to sessions. |
| **React client** | Needs adaptation — proxy SSE events to client WS or adapt client to SSE. |

### Visual Architecture Comparison

```
BEFORE (current):
  Client → WS → Worker → DO → getSandbox() → Container
                          │         │              │
                          │    alarm loop      agent-runner.ts
                          │    zombie detect    Claude SDK
                          │    crash recovery   nano-banana MCP
                          │    FUSE mount       stdout JSONL
                          │    completion detect file IPC
                          │         │              │
                          └── D1 ←──┴── R2 (FUSE) ←┘

AFTER (Managed Agents):
  Client → WS → Worker → Anthropic Managed Agents API
                  │              │
                  │         Session (container + agent loop + tools)
                  │              │
                  │    custom_tool_use events ←──┘
                  │         │
                  ├── D1    ├── fal.ai (our Worker calls it)
                  └── R2 ←──┘  (our Worker writes images)
```

---

## 3. Multi-Tenancy

**Managed Agents has no built-in multi-tenancy.** Everything (agents, environments, sessions) lives under a single API key / organization.

### How we'd handle it

Our Worker remains the auth + isolation layer:

```
User (Clerk JWT) → Our Worker (auth + user isolation) → Managed Agents API
```

| Concern | Implementation |
|---|---|
| User can only see their sessions | D1 lookup: `WHERE user_id = ?` before returning data |
| User can only stream their sessions | Worker verifies session ownership before proxying SSE |
| One generation per user | D1 flag or in-memory lock in Worker |
| Credit/billing per user | Unchanged — D1 `user_credits` + `usage_log`. Use `span.model_request_end` for token counts |
| Session cleanup | Worker archives/deletes sessions when campaigns complete |

---

## 4. Multi-Agent Orchestration

### Agent SDK (current)

- Subagents via `Task`/`Agent` tool
- Run in-process, same container
- Sequential (subagent blocks orchestrator)
- Unlimited nesting depth
- Defined inline in query options

### Managed Agents

- `callable_agents` on agent config
- Each subagent runs as a separate **thread** with isolated context
- **Parallel execution** possible
- **One level of nesting only** — coordinator → agents, no deeper
- Agents are standalone versioned resources
- **Research preview** — need to request access

### For our Creative Agent

Our pipeline is sequential (research → hooks → art → images), so parallelism doesn't help. Single agent with skills is the simplest approach on either platform.

---

## 5. The Three Ways to Build Agents

### Option 1: Messages API + Tool Use (raw)

- You build everything: loop, tools, context management
- Maximum control, maximum code
- Best for: approval gates, custom logic between steps, zero platform dependency

### Option 2: Agent SDK

- SDK runs the loop, provides built-in tools, skills, MCP
- You host the runtime
- Best for: development, testing, internal tools, self-hosted production

### Option 3: Managed Agents

- Anthropic runs everything
- You configure the agent and send events
- Best for: production apps serving users, long-running tasks, zero infra maintenance

### Key insight

**Agent SDK and Managed Agents are alternatives, not layers.** They solve the same problem (running Claude as an agent with tools) in different ways. You pick one for production. But Agent SDK is the best development environment for any approach.

### The "loop" explained

The agent loop is: Claude thinks → calls a tool → sees result → calls another tool → ... → done. The three approaches differ only in **who runs this loop**: your code (Messages API), the SDK (Agent SDK), or Anthropic's servers (Managed Agents).

### Flexibility comparison

| Capability | Agent SDK | Managed Agents |
|---|---|---|
| Block a tool call before execution | `PreToolUse` hook — full control | `permission_policy: always_ask` — allow/deny only |
| Modify tool inputs | `PreToolUse` hook | Not possible |
| Custom logic between steps | Full hook system | Send `user.message` to steer (can't inject between tool calls) |
| Stop based on custom logic | `break` out of loop | Send `user.interrupt` |
| Observe every step | Full message stream | Event stream (after execution) |

---

## 6. Tradeoffs: Keep Current System vs Migrate

### What we lose with Managed Agents

1. **Runtime control** — container spec, warm window, fast follow-up via file IPC, `HOME=/root` optimizations. All become Anthropic's black box.
2. **Debugging visibility** — lose low-level container debugging (FUSE mount failures, process OOM). Only see event-level symptoms.
3. **Cost at scale** — currently ~$0/month for container compute. Managed Agents adds $0.08/session-hour. At 10,000 generations/day = ~$2,000/month.
4. **Vendor lock-in** — entire execution model becomes Anthropic's platform.
5. **Custom MCP round-trips** — nano-banana currently runs in-container (zero hop). With custom tools: Agent → Anthropic → our Worker → fal.ai → Worker → R2 → Anthropic → Agent. Extra latency.

### What we gain

1. **~2,500 lines of code deleted** — the hardest, most bug-prone code responsible for sessions 17-67 debugging.
2. **No more FUSE/s3fs/R2 mount hell** — null-byte corruption, unmount-before-mount, write verification — all gone.
3. **No more DO lifecycle management** — hibernation, resets, alarms, zombies, session persistence — all gone.
4. **No more Docker deploy pipeline** — `docker builder prune -af`, 2-phase propagation, DO resets during deploy — all gone.
5. **Anthropic improves runtime for you** — compaction, context management, tool calling improvements come automatically.
6. **Focus on product** — skills, UI, onboarding instead of alarm heartbeats and FUSE mounts.

### Recommendation

| Situation | Approach |
|---|---|
| Spending time debugging infrastructure | Migrate to Managed Agents |
| Spending time on product features | Current system works fine |
| About to scale significantly | Managed Agents (Anthropic's SRE > just you) |
| Cost at scale matters | Current system is cheaper |
| Building new agents | Managed Agents (don't repeat 67 sessions) |

**Hybrid approach:** Keep Creative Agent on current system (it works). Build new agents on Managed Agents. Migrate Creative Agent later if the infra maintenance burden justifies it.

---

## 7. Migration Path (if we decide to migrate)

### What we keep

- `client/` — React frontend (adapt WS → SSE proxy)
- `cloudflare/src/routes/` — REST API for campaigns, credits, assets
- `cloudflare/src/db/` — D1 access layer
- `cloudflare/schema.sql` — database schema
- `cloudflare/src/auth.ts` — Clerk auth
- `cloudflare/src/router.ts` — routing
- `agent/.claude/skills/` — upload to Skills API

### What we delete (~2,500 lines)

- `cloudflare/src/durable-objects/campaign-session.ts` (1800 lines)
- `cloudflare/sandbox/` — entire directory (Dockerfile, agent-runner.ts, nano-banana-mcp.ts, orchestrator-prompt.ts, block-builder.ts)
- `cloudflare/src/lib/sdk-message-parser.ts`
- `cloudflare/src/lib/event-buffer.ts`
- `cloudflare/src/lib/block-builder.ts`
- `cloudflare/src/lib/local-ai-runner.ts`
- `server/` — entire local dev server

### What we write new (~300-500 lines)

- Session orchestrator in Worker: create Managed Agent sessions, proxy SSE events to client, handle custom tool calls (fal.ai → R2)
- Event adapter: translate Managed Agents events → existing client event format

---

## 8. Future Agent-Building Strategy

### Default workflow

```
Build with Agent SDK (local) → Ship with Managed Agents (production)
```

### Decision framework

| Situation | Approach |
|---|---|
| New production agent serving users | Managed Agents |
| Personal automation / internal tool | Agent SDK only |
| Agent with dangerous actions (emails, payments) | Messages API + Tool Runner (approval gates) |
| Quick prototype | Agent SDK |
| Heavy custom tools (10+ MCP servers) | Agent SDK self-hosted |
| Must run in your VPC / on-prem | Messages API + Tool Runner |

### What's portable across all approaches

Regardless of hosting choice, the agent definition is the same:
- System prompt
- Skills (SKILL.md files)
- Tool definitions
- Orchestration logic

Start with agent design. Hosting decision can come later.

---

## 9. Key Links

| Resource | URL |
|---|---|
| Overview | https://platform.claude.com/docs/en/managed-agents/overview |
| Quickstart | https://platform.claude.com/docs/en/managed-agents/quickstart |
| Agent Setup | https://platform.claude.com/docs/en/managed-agents/agent-setup |
| Environments | https://platform.claude.com/docs/en/managed-agents/environments |
| Sessions | https://platform.claude.com/docs/en/managed-agents/sessions |
| Events & Streaming | https://platform.claude.com/docs/en/managed-agents/events-and-streaming |
| Tools | https://platform.claude.com/docs/en/managed-agents/tools |
| Skills | https://platform.claude.com/docs/en/managed-agents/skills |
| Multi-Agent | https://platform.claude.com/docs/en/managed-agents/multi-agent |
| Agents API Reference | https://platform.claude.com/docs/en/api/beta/agents |
| Sessions API Reference | https://platform.claude.com/docs/en/api/beta/sessions |
| Architecture Blog | https://www.anthropic.com/engineering/managed-agents |
| CLI (ant) | https://github.com/anthropics/anthropic-cli |

---

## 10. Key Insight

We built our own version of Managed Agents before the product existed. The CampaignSession DO + Sandbox Container + agent-runner was essentially a hand-built agent hosting platform on Cloudflare. Anthropic has now productized that same pattern as a service.

The product value (hook methodology, art style workflows, research agent, 14 visual styles) was never the infrastructure. The infra was the tax paid to ship. For future agents, that tax is now $0.08/session-hour instead of 67 debugging sessions.
