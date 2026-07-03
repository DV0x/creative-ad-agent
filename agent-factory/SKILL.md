---
name: agent-factory
description: Reference architecture for building production autonomous agent systems on Cloudflare (Workers, Durable Objects, Sandbox Containers, R2, D1) powered by the Claude Agent SDK. Use this skill to understand how a real production agent system works — its patterns, decisions, and hard-won lessons — so you can adapt them to build new agentic systems. Trigger on: building agents, autonomous systems, agentic loops, AI pipelines, agent orchestration, deploying AI agents, or when the user needs to understand production agent architecture for Cloudflare. This is a knowledge base, not a code generator — it provides deep context for informed design decisions.
---

# Agent Factory

A reference architecture for building production agentic systems. This skill gives you deep context on how a real production agent works — an AI ad campaign generator on Cloudflare that survived 55+ debugging sessions — so you can understand the patterns and adapt them to any new autonomous agent.

This is not a template to copy. It's a knowledge base. When you're designing a new agent, read the relevant patterns, understand WHY each decision was made, look at the actual source code for reference, and then make your own informed choices.

## How to Use This Skill

1. **Understand the existing system first.** Read the relevant pattern docs and source code pointers below to build a mental model of how a production agent works end-to-end.
2. **Identify which patterns apply to your new agent.** Not every agent needs every pattern. Use the decision guide below.
3. **Read the actual source code** for the patterns you need. The source pointers below link to real, battle-tested implementations — not abstractions.
4. **Adapt, don't copy.** Understand the WHY behind each pattern so you can make smart trade-offs for your domain.
5. **Check the gotchas** before deploying. These are real failures that cost days to debug.

---

## The Production System at a Glance

The reference system is an AI ad campaign generator. Here's what it does:

```
User gives a brand URL
  → Agent researches the brand (WebFetch, WebSearch)
  → Creates 6 ad hooks (stat, story, fomo, curiosity, callout, contrast)
  → Writes image prompts
  → Generates 6 images via fal.ai
  → User can iterate with follow-ups
```

**Why this matters for you:** This is a complete, working example of a long-running autonomous agent with real-time streaming, multi-step orchestration, failure recovery, and user interaction. Every pattern here was born from a real production problem.

### Architecture Overview

```
React SPA (Zustand + WebSocket + Clerk auth)
    │
    ├── WebSocket ──→ Cloudflare Worker ──→ Durable Object (one per user)
    │                                           │
    └── REST API  ──→ Router ──→ D1 Database    │
                                                │
                                    Sandbox Container (Docker)
                                        ├── agent-runner.ts (long-lived process)
                                        ├── Claude Agent SDK (query())
                                        ├── MCP tools (fal.ai image generation)
                                        └── /mnt/r2 (FUSE mount → R2 storage)
```

**Two pillars:**
- **The Brain** — Claude Agent SDK. Orchestrates the AI workflow via system prompt, tools, and conversation management. See `references/sdk-patterns.md`.
- **The Body** — Cloudflare infrastructure. Runs the agent, stores data, streams results, recovers from failures. See `references/infrastructure-patterns.md`.

The **agent-runner** bridges them: a Node.js process in a sandbox container that calls the SDK and communicates with the DO via stdout (streaming) and file IPC (multi-turn).

---

## Source Code Map

When adapting patterns, go read the real implementations:

### Cloudflare Backend
| File | Lines | What to Study |
|---|---|---|
| `cloudflare/src/durable-objects/campaign-session.ts` | ~1581 | DO orchestration, state persistence, completion detection, cancel flow, alarm heartbeat |
| `cloudflare/sandbox/agent-runner.ts` | ~351 | Long-lived SDK process, file IPC, turn sentinels, completion markers, block builder integration |
| `cloudflare/sandbox/nano-banana-mcp.ts` | ~358 | MCP tool pattern: Zod schema, fal.ai API, image download, JSONL tracking, write verification |
| `cloudflare/sandbox/orchestrator-prompt.ts` | ~107 | THE system prompt — defines the 7-step sequential workflow, style detection, reference image rules |
| `cloudflare/sandbox/block-builder.ts` | ~137 | Progress tracking: thinking blocks, phase children, image counters, structured message persistence |
| `cloudflare/src/lib/sdk-message-parser.ts` | ~255 | Parsing SDK stdout into semantic events (phases, files, images) |
| `cloudflare/src/lib/event-buffer.ts` | ~50 | Ring buffer for WebSocket event replay |
| `cloudflare/src/index.ts` | ~50 | Worker entry: routing, auth, DO dispatch |
| `cloudflare/src/auth.ts` | ~159 | Clerk JWT verification (REST + WS) |
| `cloudflare/schema.sql` | — | D1 schema (campaigns, files, images, messages) |
| `cloudflare/wrangler.jsonc` | — | Worker + DO + Container + R2 + D1 config |
| `cloudflare/sandbox/Dockerfile` | — | Container image (node:22-slim + Claude CLI + s3fs), pre-compiled TS |

### Agent Workspace (Skills & Subagents)
| File | What to Study |
|---|---|
| `agent/.claude/agents/research.md` | Subagent definition: brand data extraction via WebFetch, structured output format |
| `agent/.claude/skills/hook-methodology/SKILL.md` | Skill definition: 10 hook types, 5-step extraction methodology, validation checklist |
| `agent/.claude/skills/hook-methodology/formulas.md` | Hook type psychology, examples, best sources, warnings |
| `agent/.claude/skills/art-style/SKILL.md` | Style routing: 14 styles, category detection, keyword matching, entity ID validation |
| `agent/.claude/skills/art-style/workflows/*.md` | 14 art style workflow files — each defines composition rules, color treatment, prompt structure |
| `agent/files/research/*.md` | Example research outputs (28 brands) — shows the extraction format |
| `agent/files/creatives/*.json` | Example prompt outputs (20 brands) — shows the prompt/concept JSON structure |

### Claude Agent SDK Docs
| File | What to Study |
|---|---|
| `claude_sdk/typescript_sdk.md` | query() API, Options, SDKMessage types |
| `claude_sdk/custom_tools.md` | createSdkMcpServer + tool() pattern |
| `claude_sdk/session_management.md` | Resume, fork, continue sessions |
| `claude_sdk/streaming_input.md` | Async generator prompt for MCP tools |
| `claude_sdk/system_prompts.md` | Custom vs preset system prompts |
| `claude_sdk/subagents.md` | Programmatic and file-based subagents |
| `claude_sdk/sdk_hosting.md` | Deployment patterns (ephemeral, long-running, hybrid) |

### Client
| File | Lines | What to Study |
|---|---|---|
| `client/src/hooks/useWebSocket.ts` | ~469 | WS message handling, recovery flow, action methods |
| `client/src/lib/websocket-manager.ts` | ~286 | Connection lifecycle, reconnect, subscriber ref counting |
| `client/src/store/index.ts` | ~1054 | Zustand store: pending buffers, campaign ID remapping, generation flow |

### Architecture Docs
Full docs at `docs/architecture/INDEX.md` — 24 files covering every subsystem.

---

## Pattern Decision Guide

Not every agent needs every pattern. Here's how to decide:

| Your Agent Needs... | Pattern | Why It Exists |
|---|---|---|
| Execution >30 seconds | **Sandbox Container** | Workers have a 30s CPU limit. Containers run indefinitely |
| Real-time progress to user | **Streaming Pipeline** | Users need to see what's happening during 5-min generations |
| Survive browser refresh / disconnects | **Completion Detection (4 layers)** | Any single detection method can fail — layers provide redundancy |
| Per-user isolation | **DO Orchestrator** | One DO per user handles state, WS connections, and agent lifecycle |
| Store files/images/artifacts | **R2 + FUSE Mount** | Agent writes to local filesystem; FUSE transparently syncs to R2 |
| User can cancel mid-run | **Cancel/Abort** | Naive cancel causes race conditions — signal-only pattern is safe |
| Fast follow-ups after initial run | **Warm Container + File IPC** | Container stays alive 2h; follow-ups skip cold start via file IPC |
| Autonomous scheduling | **DO Alarm Loop** | Alarm handler can trigger agent runs on a schedule (no external cron) |
| Survive code deploys mid-run | **State Persistence** | DO resets lose all memory — critical state must be in storage |
| Auth + multi-tenancy | **Clerk + Per-User DO** | JWT verification, user-scoped storage, authenticated image serving |

**For most agents, start with:** DO Orchestrator + Sandbox Container + Streaming Pipeline + Completion Detection. Add the rest based on your needs.

---

## Key Design Decisions (and Why)

These are the non-obvious choices that make the system work. Understanding the WHY helps you make better decisions for your agent.

### Why fire-and-forget + alarm (not await)?
The DO handler must return quickly — Hibernation API destroys the instance after the handler returns if no alarm is pending. Generation runs as a detached promise. The alarm heartbeat (every 10-30s) keeps the DO alive and provides a periodic check-in point for safety nets.

### Why file IPC (not WebSocket/RPC) for multi-turn?
The agent-runner stays alive between turns. The DO writes `/app/next-prompt.json`, the agent polls it every 500ms. This is simpler and more reliable than maintaining a persistent RPC connection between the DO and the container process. The file is atomic and survives brief network hiccups.

### Why 4 completion detection layers?
Each layer fails in different scenarios. `waitForLog` fails on RPC disconnect. `waitForExit` only catches crashes. Alarm polling catches everything but is slow (30s). The client `/recover` endpoint is the last resort when the DO itself has issues. In production, layer 1 handles 95% of completions; layers 2-4 catch the edge cases.

### Why no SDK session resume on Cloudflare?
s3fs FUSE pre-allocates file size with null bytes then writes content. If the SDK JSONL file is read mid-flush, you get corruption. Instead, conversation context is rebuilt from D1 (messages + files hydrated to the sandbox filesystem on cold start).

### Why abort signal only (not direct process kill)?
During setup, `agentProcessId` might point to the PREVIOUS campaign's agent. Direct kill from cancel would kill the wrong process. The abort signal lets each generation function clean up its own resources in its finally block.

### Why one DO per user (not per task)?
Simplifies container reuse. The same sandbox serves all campaigns for a user. `agentCampaignId` tracks which campaign the running agent belongs to — mismatches trigger a cold restart with the correct context.

---

## How the Agent is Decomposed (Skills + Subagents + MCP)

This is the reusable component model. The orchestrator prompt delegates to specialized components instead of doing everything itself. Understanding this decomposition helps you design your own agent's components.

### The Three Component Types

```
Orchestrator (system prompt)
    │
    ├── Subagent: "research"  (Task tool → .claude/agents/research.md)
    │     └── WebFetch + WebSearch + Write → research.md
    │
    ├── Skill: "hook-methodology"  (Skill tool → .claude/skills/hook-methodology/)
    │     └── Reads research → writes 6 hooks to hook-bank/
    │
    ├── Skill: "art-style"  (Skill tool → .claude/skills/art-style/)
    │     └── Routes to 1 of 14 visual workflows → writes prompts.json
    │
    └── MCP Tool: "generate_ad_images"  (nano-banana MCP server)
          └── Calls fal.ai API → downloads images → writes to R2
```

**Subagents** (via `Task` tool): Separate Claude instances with their own tools and system prompt. Good for research, analysis, or any task that benefits from focused context. Defined in `.claude/agents/` or programmatically via the `agents` option.

**Skills** (via `Skill` tool): Markdown instructions that the SAME Claude instance follows. Good for methodology, decision trees, and domain knowledge. Defined in `.claude/skills/`. Cannot be defined programmatically — file-based only.

**MCP Tools**: Deterministic code the agent calls. Good for external APIs, file operations, and anything that shouldn't be left to the LLM. Defined via `createSdkMcpServer()` + `tool()`.

### The Orchestrator Prompt Pattern

The system prompt is a sequential workflow definition. See `cloudflare/sandbox/orchestrator-prompt.ts` for the real implementation (~107 lines). Key elements:

1. **Input parsing** — extract URL, brand name, optional style keyword, image count
2. **Phase sequencing** — research → hooks → art-style → images, each depends on previous
3. **Style detection** — keyword matching ("clay" → Anderson Clay, "brutalism" → Soft Brutalism, etc.)
4. **Reference image rules** — when user uploads product photos, agent reads them first, then writes NEW prompts focused on the ad scene (not the product), passes `referenceImageUrls` to every MCP call
5. **Follow-up rules** — check if files exist on disk (via Glob) before re-running earlier phases
6. **Constraints** — max 6 images, sequential execution, trust skills, be brief

### The Block Builder Pattern

Real-time progress tracking for the UI. See `cloudflare/sandbox/block-builder.ts` (~137 lines).

The agent-runner processes each SDK message through a block builder that detects phases from tool usage:
- `Task` tool detected → `openThinkingBlock('Researching')`
- `Skill('hook-methodology')` → `openThinkingBlock('Generating Hooks')`
- `Skill('art-style')` → `openThinkingBlock('Creating Art Direction')`
- MCP tool detected → `openThinkingBlock('Generating Images', expectedCount)`
- Each image result → `incrementCompletedImages()`
- Turn complete → `closeThinkingBlock('complete')`

Blocks are serialized to JSON and stored in D1 `messages.blocks` — so the chat UI renders correctly after page refresh. This pattern is reusable: any multi-phase agent can track progress this way by mapping tool usage to phases.

### Artifact Taxonomy Pattern

Each domain has its own artifact types. In this system:
- **Hook types**: stat, story, fomo, curiosity, callout, contrast (index 1-6)
- **File types**: research, hooks, prompts (stored in D1 `campaign_files`)
- **Image artifacts**: stored in D1 `campaign_images` with hook_type, version, file_path

When adapting: define YOUR artifact taxonomy (e.g., for an NFT agent: artwork, listing, transaction, report) and map them to your D1 schema and MCP tool outputs.

---

## Reference Documentation

| File | What's Inside | When to Read |
|---|---|---|
| `references/infrastructure-patterns.md` | 8 Cloudflare patterns with code structures and adaptation notes | Understanding how the infrastructure works and how to adapt each pattern |
| `references/sdk-patterns.md` | Claude Agent SDK patterns: query(), MCP tools, sessions, streaming, subagents, the agent-runner bridge | Understanding how the AI brain works and connects to infrastructure |
| `references/scaffolding.md` | Code structures from the production system showing how each component is built | Seeing how real implementations look when you're ready to write code |
| `references/gotchas.md` | 24 battle-tested lessons organized by severity (Critical / Important / Good to Know) | Before deploying — each gotcha cost real debugging time |

---

## Quick Reference: Key Numbers

| Metric | Value | Why It Matters |
|---|---|---|
| Container cold start | ~2.5 min | Claude CLI init dominates. Budget this into user experience |
| Warm follow-up | ~30-60s | Why we keep containers alive — 5x faster than cold start |
| Container spec | standard-2 (1 vCPU, 6 GiB) | Minimum for running Claude SDK + MCP tools |
| Warm window | 2h (`sleepAfter`) | How long a container stays alive after last use |
| Max containers | 50 | Plan capacity around this limit |
| WS keepalive | 25s ping/pong | Prevents idle disconnect |
| Event buffer | 1000 events max | How many events are replayed on reconnect |
| Alarm heartbeat | 10-30s | Keeps DO alive + periodic safety check |
| Completion layers | 4 independent paths | Redundancy for reliable completion detection |
| Safety net timeout | 2h | Maximum time before a stuck generation is killed |
