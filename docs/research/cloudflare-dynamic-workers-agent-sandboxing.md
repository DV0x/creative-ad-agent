# Cloudflare Dynamic Workers & Agent Sandboxing: Research Report

**Date**: 2026-03-25
**Status**: Dynamic Workers entered open beta on 2026-03-24 (yesterday)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [What Are Dynamic Workers?](#what-are-dynamic-workers)
3. [The Agent Sandboxing Architecture Pattern](#the-agent-sandboxing-architecture-pattern)
4. [Cloudflare Agents SDK](#cloudflare-agents-sdk)
5. [@cloudflare/codemode — Code Mode](#cloudflare-codemode)
6. [@cloudflare/shell — Virtual Filesystem](#cloudflare-shell)
7. [Dynamic Workers vs Sandbox Containers](#dynamic-workers-vs-sandbox-containers)
8. [Competitive Landscape](#competitive-landscape)
9. [Real-World Production Usage](#real-world-production-usage)
10. [Relevance to Our Architecture](#relevance-to-our-architecture)
11. [Gaps & Uncertainties](#gaps--uncertainties)
12. [Sources](#sources)

---

## Executive Summary

Cloudflare Dynamic Workers are a **new primitive** (open beta as of 2026-03-24) that lets a Worker spin up other Workers at runtime with arbitrary code. They use **V8 isolates** (not containers), start in **milliseconds**, use **a few MB of memory**, and are designed primarily as sandboxes for **AI-agent-generated code**.

The key architecture pattern is:

```
Agent orchestrator (DO/Worker) --> calls LLM API --> LLM generates JavaScript code
--> that code runs in a Dynamic Worker (isolate sandbox)
--> results return to the orchestrator
```

**The agent itself does NOT run in the Dynamic Worker.** The Dynamic Worker is where the agent's *generated code* executes safely. The agent orchestrator lives in a Durable Object or regular Worker.

**Confidence: HIGH** — This is confirmed by multiple primary sources (Cloudflare blog, official docs, codemode source code, and the Moltworker reference architecture).

---

## What Are Dynamic Workers?

### Core Technology

Dynamic Workers use **isolates** — instances of the V8 JavaScript engine (the same engine in Chrome). This is the same isolation technology that powers ALL Cloudflare Workers, but exposed as a runtime API so Workers can create *other Workers dynamically*.

**Key properties:**
- **Startup**: Milliseconds (vs hundreds of ms for containers)
- **Memory**: A few MB (vs hundreds of MB for containers)
- **Location**: Usually runs on the **same machine, same thread** as the parent Worker
- **Scaling**: No global concurrency limits — can scale to millions per second
- **Language**: JavaScript (ES modules, CommonJS), Python (slower), WebAssembly
- **TypeScript**: Must be pre-compiled to JS before loading

### API Surface

Two binding methods via `env.LOADER`:

```javascript
// Method 1: One-off execution (no caching)
let worker = env.LOADER.load({
  compatibilityDate: "2026-03-01",
  mainModule: "agent.js",
  modules: { "agent.js": generatedCode },
  env: { TOOL_API: rpcStub },       // Controlled bindings
  globalOutbound: null,              // Block all network access
});
await worker.getEntrypoint().myFunction(params);

// Method 2: Cached by ID (reuse warm isolates)
let worker = env.LOADER.get("worker-v1", async () => ({
  compatibilityDate: "2026-03-01",
  mainModule: "index.js",
  modules: { "index.js": code },
  globalOutbound: null,
}));
```

### Configuration (wrangler.jsonc)

```jsonc
{
  "worker_loaders": [{ "binding": "LOADER" }]
}
```

### Security Model — Capability-Based

This is the most architecturally interesting part. Dynamic Workers use **capability-based security** via Workers RPC (Cap'n Proto):

1. **Network blocked by default**: `globalOutbound: null` blocks all `fetch()` and `connect()` calls
2. **No filesystem, no env vars**: The isolate is a clean V8 sandbox
3. **Bindings are capabilities**: You pass specific RPC stubs that the sandbox can call, nothing more
4. **Objects passed by reference**: RPC stubs have no URL or global identifier — you can only use them if they were explicitly given to you

```typescript
// Parent Worker defines what the sandbox can do
class ChatRoom extends WorkerEntrypoint {
  async getHistory(limit: number) { /* ... */ }
  async post(text: string) { /* ... */ }
}

// Pass it as a binding — sandbox can ONLY call ChatRoom methods
let worker = env.LOADER.load({
  env: { CHAT_ROOM: ctx.exports.ChatRoom({ props }) },
  globalOutbound: null,  // No internet
});
```

**This means the agent-generated code cannot:**
- Access the internet
- Read environment variables / API keys
- Access the filesystem
- Call any API not explicitly provided as a binding

**Confidence: HIGH** — Verified against official API docs, blog post, and codemode source code.

### Pricing

- **Beta period**: Dynamic Worker loading is free
- **Post-beta**: $0.002 per unique Worker loaded per day + standard CPU and invocation charges
- For one-off AI code execution, overhead is negligible vs inference costs

### Limits

Dynamic Workers inherit standard Workers limits:
- **Memory**: 128 MB per isolate
- **CPU**: 5 min max (paid plan), 10ms (free)
- **Subrequests**: 10,000/request (paid)
- **Simultaneous connections**: 6 per invocation

---

## The Agent Sandboxing Architecture Pattern

### Confirming the Pattern

**Yes, your hypothesis is correct.** The architecture is:

```
┌─────────────────────────────────┐
│  Agent Orchestrator             │
│  (Durable Object / Worker)     │
│                                 │
│  1. Receives user request       │
│  2. Calls LLM API (Anthropic,  │
│     OpenAI, etc.)               │
│  3. LLM generates JavaScript   │
│     code to execute             │
│  4. Sends code to Dynamic       │
│     Worker via env.LOADER       │
│  5. Receives results            │
│  6. Returns to user or loops    │
└────────┬────────────────────────┘
         │ Workers RPC
         ▼
┌─────────────────────────────────┐
│  Dynamic Worker (V8 Isolate)    │
│                                 │
│  - Runs LLM-generated JS       │
│  - No internet access           │
│  - No filesystem                │
│  - Can only call tool bindings  │
│    provided by parent           │
│  - Created fresh, discarded     │
│    after use                    │
└─────────────────────────────────┘
```

The agent orchestrator holds:
- Conversation state (in DO storage)
- API keys (in environment)
- Tool definitions
- User session

The Dynamic Worker holds:
- Generated code only
- RPC stubs to call tools
- Nothing else

### Why This Pattern Matters

**Token efficiency**: Instead of the LLM making sequential tool calls (each requiring a round-trip through the neural network), it writes a single JavaScript function that chains multiple operations. Cloudflare claims:
- **81% reduction** in token usage (Code Mode blog post)
- **99.9% reduction** in input tokens vs traditional MCP (Code Mode MCP blog post)
- Fixed ~1,000 token cost regardless of API size

**Speed**: Isolate startup in milliseconds means the sandbox overhead is negligible.

**Security**: The agent cannot access anything not explicitly provided as a binding.

### Code Mode: The Pattern in Practice

The `@cloudflare/codemode` library implements this pattern. Here is the actual execution flow:

1. **Tool definitions** → converted to TypeScript type definitions
2. **LLM writes an async arrow function** calling namespaced methods (e.g., `codemode.getWeather(...)`)
3. **Code is normalized** via AST parsing (using `acorn`)
4. **`DynamicWorkerExecutor`** spins up an isolated Worker via `env.LOADER.load()`
5. Inside the sandbox, a **Proxy object** intercepts `codemode.*` calls
6. Each call is routed back to the parent via **Workers RPC** (through `ToolDispatcher extends RpcTarget`)
7. **console.log output** is captured and returned alongside the result
8. Isolate is discarded

```
┌─────────────────┐         ┌────────────────────────────────────┐
│ Host Worker      │  RPC    │ Dynamic Worker (isolated sandbox)  │
│ ToolDispatchers  │◄───────►│ codemode.tool() → dispatcher.call()│
│ (per namespace)  │         │ fetch() blocked by default         │
└─────────────────┘         └────────────────────────────────────┘
```

**Confidence: HIGH** — Verified via GitHub source, official docs, and blog posts.

---

## Cloudflare Agents SDK

The Cloudflare Agents SDK (`agents` npm package, currently v0.3.0) is **separate from Dynamic Workers** but **complementary**. It provides the agent orchestrator layer.

### What It Is

A TypeScript framework built on **Durable Objects** that provides:
- **Agent base class**: `Agent<Env, State>` — a stateful micro-server per agent
- **AIChatAgent**: Specialized for conversational AI with message persistence
- **Built-in SQL database**: Per-agent SQLite (via DO storage)
- **Real-time state sync**: State changes broadcast to connected WebSocket clients
- **Scheduling**: Cron, delayed, and one-time task execution
- **MCP support**: Both client and server (`MCPAgent` class)
- **Task queues**: Durable task processing
- **Email handling**: Via Cloudflare Email Routing

### How It Relates to Dynamic Workers

The Agents SDK provides the **orchestrator** that uses Dynamic Workers for code execution:

```typescript
import { Agent } from "agents";
import { createCodeTool, DynamicWorkerExecutor } from "@cloudflare/codemode/ai";

export class MyAgent extends Agent<Env, State> {
  async onChatMessage() {
    // 1. Create executor (uses Dynamic Workers)
    const executor = new DynamicWorkerExecutor({ loader: this.env.LOADER });

    // 2. Create code tool from existing tools
    const codemode = createCodeTool({ tools: myTools, executor });

    // 3. Stream LLM response — LLM writes code that runs in Dynamic Workers
    const result = streamText({
      model,
      system: "You are helpful.",
      messages: await convertToModelMessages(this.state.messages),
      tools: { codemode },
    });
  }
}
```

### Key Architecture Insight

The Agents SDK Agent class **does not directly know about Dynamic Workers**. It is a Durable Object. The codemode library is the bridge — you integrate it as a tool in your agent. The Agent SDK handles:
- User-facing WebSocket connections
- Message persistence
- State management
- Scheduling

While Dynamic Workers handle:
- Safe execution of LLM-generated code
- Tool call dispatch via RPC

**Confidence: HIGH** — Agent class internals docs explicitly state no sandbox/Dynamic Worker integration.

---

## @cloudflare/codemode

### What It Does

Converts tool definitions into a TypeScript API, gives the LLM a single "write code" tool, and executes the generated JavaScript in a Dynamic Worker sandbox.

### Key Components

| Component | Role |
|-----------|------|
| `createCodeTool()` | Generates TypeScript types from tools, creates a single "codemode" tool for the LLM |
| `DynamicWorkerExecutor` | Spins up an isolated Worker via `env.LOADER.load()` |
| `ToolDispatcher` | Extends `RpcTarget`, routes sandbox tool calls back to host via Workers RPC |
| `ToolProvider` | Interface for composing multiple tool sources with namespaces |

### Configuration Options

```typescript
// DynamicWorkerExecutor options
{
  loader: env.LOADER,        // Required: WorkerLoader binding
  timeout: 30000,            // Execution timeout (ms), default 30s
  globalOutbound: null,      // Network: null = blocked, Fetcher = routed
  modules: {},               // Extra importable modules in sandbox
}

// createCodeTool options
{
  tools: myTools,            // AI SDK tools or ToolDescriptors
  executor: executor,        // DynamicWorkerExecutor instance
  description: "...",        // Custom description, {{types}} placeholder
}
```

### Multiple Tool Providers / Namespaces

You can compose multiple tool providers, each with its own namespace:

```typescript
const codemode = createCodeTool({
  tools: [
    { tools: myTools },           // codemode.myTool()
    stateTools(workspace),        // state.readFile()
    gitTools(workspace),          // git.commit()
    dbProvider,                   // db.query()
  ],
  executor
});
```

The sandbox code can then call across all namespaces:

```javascript
async () => {
  const files = await state.glob("/src/**/*.ts");
  const results = await Promise.all(
    files.map(f => codemode.analyzeFile({ path: f }))
  );
  await state.writeJson("/report.json", results);
  await git.add("/report.json");
  await git.commit("Add analysis report");
}
```

### Custom Executors

The `Executor` interface is runtime-agnostic — you can implement it for Node.js VM, QuickJS, containers, etc.:

```typescript
interface Executor {
  execute(
    code: string,
    providers: ResolvedProvider[] | Record<string, (...args: unknown[]) => Promise<unknown>>
  ): Promise<ExecuteResult>;
}
```

**Status**: Experimental. May have breaking changes.

**Confidence: HIGH** — Verified against GitHub source code and official API reference.

---

## @cloudflare/shell

### What It Does

Provides a **virtual filesystem** for agents running in Dynamic Workers. Instead of parsing shell syntax, it runs JavaScript inside an isolated Worker and exposes typed state operations.

### Key Components

| Component | Role |
|-----------|------|
| `StateBackend` | Runtime-neutral interface for filesystem/state operations |
| `FileSystem` | Interface with two implementations: `InMemoryFs` (ephemeral) and `WorkspaceFileSystem` (durable) |
| `FileSystemStateBackend` | Adapter wrapping any FileSystem into a StateBackend |
| `Workspace` | Durable file storage backed by SQLite + optional R2 |
| `stateTools(workspace)` | ToolProvider for codemode — exposes filesystem in sandbox |
| `createGit(filesystem)` | Pure-JS git operations via `isomorphic-git` |
| `gitTools(workspace)` | Git commands as codemode tools |

### Filesystem Operations

When used with `stateTools()`, the sandbox gets:
- `state.readFile()`, `state.writeFile()`
- `state.glob()`, `state.search()`
- `state.replace()`, `state.diff()`
- `state.readJson()`, `state.writeJson()`

### Git Operations

Via `gitTools()`:
- `git.init()`, `git.clone()`, `git.status()`
- `git.add()`, `git.rm()`, `git.commit()`, `git.log()`
- `git.branch()`, `git.checkout()`, `git.fetch()`, `git.pull()`, `git.push()`
- `git.diff()`, `git.remote()`

### Architecture

```
Agent (DO) → codemode tool → Dynamic Worker sandbox
                                  ↓
                           state.readFile() → RPC → host → Workspace (SQLite/R2)
                           git.commit()     → RPC → host → isomorphic-git → Workspace
```

**Confidence: MEDIUM** — npm page returned 403; details sourced from search results and GitHub README. Could not verify full API surface.

---

## Dynamic Workers vs Sandbox Containers

This is a critical comparison because our project currently uses **Sandbox Containers** (`@cloudflare/sandbox`).

| Dimension | Dynamic Workers (Isolates) | Sandbox Containers |
|-----------|---------------------------|-------------------|
| **Technology** | V8 isolates | Linux containers (Docker) |
| **Startup** | Milliseconds | Hundreds of milliseconds |
| **Memory** | A few MB | Hundreds of MB |
| **Languages** | JavaScript (fast), Python (slow), WASM | Any language, any runtime |
| **Filesystem** | None (virtual only via @cloudflare/shell) | Full Linux filesystem |
| **Network** | Blocked by default, capability-based | Full network access (configurable) |
| **Persistent state** | None (stateless, create-execute-discard) | Persistent within container lifecycle |
| **Long-running processes** | Not designed for this | Yes (`startProcess`, `sleepAfter`) |
| **R2 mounting** | Not supported | Yes (`mountBucket()`) |
| **Shell commands** | Not available | Full shell access |
| **Use case** | Short code snippets, tool calls | Full agent runtimes, complex processes |
| **Scaling** | No concurrency limits | Concurrency limits apply |
| **Pricing** | $0.002/unique Worker/day + CPU | Per-vCPU-second + memory |

### When to Use Each

**Dynamic Workers**: When the LLM generates small JavaScript functions that need to run safely — tool calls, data transformations, API chaining, code evaluation. Create-execute-discard pattern. Millisecond latency matters.

**Sandbox Containers**: When you need a full runtime environment — running a Claude SDK agent process, file I/O on a real filesystem, R2 mounting, long-running processes, non-JavaScript runtimes. Our creative agent use case falls here.

### Key Insight for Our Architecture

Our creative agent runs the **Claude SDK agent process** inside a Sandbox Container for 2-5+ minutes. This is the **opposite** of the Dynamic Worker use case. Dynamic Workers are for:
- LLM writes 10-50 lines of JS
- Executes in <1 second
- Returns structured result
- Isolate is discarded

Our agent:
- Runs a full Node.js process with Claude SDK
- Executes for minutes with multiple turns
- Reads/writes files to R2-mounted filesystem
- Needs to persist state between turns

**Confidence: HIGH** — This is a direct architectural analysis based on verified documentation.

---

## Competitive Landscape

### Direct Competitors for Agent Code Sandboxing

| Platform | Technology | Startup | Languages | GPU | Pricing Model |
|----------|-----------|---------|-----------|-----|---------------|
| **CF Dynamic Workers** | V8 isolates | ms | JS (fast), Python, WASM | No | $0.002/unique/day + CPU |
| **CF Sandbox SDK** | Linux containers | <50ms cold | Any | No | Per-vCPU-second |
| **E2B** | Firecracker microVMs | <200ms | Any | No | Per-second |
| **Modal Sandbox** | gVisor containers | Seconds | Any | Yes | Per-second |
| **Daytona** | Open-source containers | Variable | Any | Varies | Self-hosted / SaaS |
| **Vercel Sandbox** | V8 isolates | ms | JS/TS | No | Bundled |

### Developer Sentiment (from HN discussion)

**Criticism of Cloudflare sandbox pricing**: Developers calculated monthly vCPU costs at ~$51.84 vs ~$9.27 for GCP spot instances. "These prices are more expensive than the already expensive prices of the big cloud providers."

**Counter-argument**: Pricing targets **ephemeral workloads** (typically <30 minutes). Per-second billing is advantageous for sporadic, short-lived executions vs always-on alternatives.

**Network control criticism**: Binary on/off network control. Developers want "finely grained control over what outbound internet connections code running on the box can make." Dynamic Workers partially address this with the `globalOutbound` interceptor pattern.

**Language lock-in concern**: "Everything is JavaScript. Every example, all the things." This was noted as a barrier for Python-first teams.

**E2B preference**: Some developers prefer E2B because of Python SDK and Firecracker isolation: "e2b have a python SDK thats why I would use them when I start a new project."

**Confidence: MEDIUM** — HN thread was about Sandbox SDK specifically, not Dynamic Workers, but the pricing and language concerns apply broadly.

---

## Real-World Production Usage

### Zite (Confirmed Production User)

**What they do**: App platform where users interact via chat — LLM writes TypeScript to build CRUD apps, connect to Stripe/Airtable/Google Calendar, and run backend logic.

**Scale**: "Millions of execution requests daily" (quote from Antony Toron, CTO).

**Why Dynamic Workers**: "We needed an execution layer that was instant, isolated, and secure... Cloudflare's Dynamic Workers hit the mark on all three, out-performing other platforms we benchmarked for speed and library support."

**Confidence: HIGH** — Direct quote from CTO in Cloudflare blog post. However, note this is a customer testimonial on a vendor blog, so take "out-performing" claim with appropriate skepticism.

### Moltworker / OpenClaw (Cloudflare Internal)

**What it is**: Self-hosted personal AI agent (adapted from Moltbot/OpenClaw) running on Cloudflare infrastructure.

**Architecture**: Entrypoint Worker as API router → Sandbox Container for agent runtime → AI Gateway for LLM calls → R2 for storage → Browser Rendering for web automation.

**Note**: Moltworker uses Sandbox **Containers** not Dynamic Workers — it needs a full Linux environment for the agent runtime. This supports the pattern that agents need containers, but agent-generated code snippets can use Dynamic Workers.

**Confidence: HIGH** — Primary source (Cloudflare blog post).

### Cloudflare's Own MCP Server

Uses Code Mode + Dynamic Workers to expose their entire API (2,500+ endpoints) through just 2 tools in ~1,000 tokens. This is the canonical example of the Code Mode pattern.

**Confidence: HIGH** — Primary source.

### Matt Collins Developer Review (November 2025)

**Positive**: Bindings mechanism is "a great fit for executing code that relies on secrets that you don't want to expose to the LLM."

**Concerns**:
- Two-step code generation feels over-engineered
- Hardcoded gpt-4.1 for code generation regardless of specified model
- Prompts are "quite vague about what, exactly, they want the LLM to do"

**Confidence: MEDIUM** — Review is from November 2025; codemode has been significantly rewritten since (v0.1.0 in Feb 2026).

---

## Relevance to Our Architecture

### Current Architecture (Sandbox Containers)

Our creative agent uses `@cloudflare/sandbox` (Sandbox Containers) to run the Claude SDK agent process. The agent:
1. Starts in a container with `startProcess()`
2. Mounts R2 via `mountBucket()`
3. Runs the Claude SDK for multiple turns (2-5+ minutes)
4. Writes images and files to the mounted R2 filesystem
5. Communicates via stdout streaming (JSONL → SSE)

### Could We Use Dynamic Workers Instead?

**For the main agent process: No.**

Dynamic Workers cannot replace our Sandbox Container because:
- No filesystem (we need R2 mounting for images)
- No long-running processes (we need multi-minute agent sessions)
- JavaScript only (we run a Node.js process with the Claude SDK, which is more than a snippet)
- 128 MB memory limit (may not be enough for large agent contexts)
- No shell commands (we run `node agent-runner.ts` as a process)

**For specific sub-tasks: Maybe, in the future.**

If we adopted Code Mode, we could potentially use Dynamic Workers for:
- Hook generation (LLM writes JS that calls our tool definitions)
- Image prompt generation (structured code output)
- Research summarization (JS that processes and formats data)

But this would require a fundamental architecture change from "run Claude SDK agent in a container" to "orchestrate tool calls from a DO, execute code in isolates."

### What Changes in 12 Months?

- Dynamic Workers may gain filesystem support (via @cloudflare/shell improvements)
- Container cold starts may decrease (Cloudflare claims <50ms already)
- Code Mode may mature enough to handle complex multi-step agent workflows
- V8 isolate memory limits may increase

### The Real Takeaway

Dynamic Workers and Sandbox Containers are **complementary, not competing**:
- **Sandbox Containers**: Full agent runtime (our use case)
- **Dynamic Workers**: Safe execution of agent-generated code snippets

The most sophisticated architecture would use **both**: Agent orchestrator in a DO, agent runtime in a Container, and LLM-generated code snippets in Dynamic Workers for specific sub-tasks.

---

## Gaps & Uncertainties

1. **Dynamic Workers CPU time limits for code execution**: Docs say 5 min max for paid Workers. Unclear if this applies to Dynamic Workers spawned within a request that itself has no wall-clock limit. **Confidence: LOW**

2. **@cloudflare/shell full API surface**: npm page returned 403. Relied on search results and GitHub README. Could not verify all filesystem methods. **Confidence: MEDIUM**

3. **Dynamic Workers memory limit enforcement**: 128 MB per isolate is stated for Workers generally. Unclear if Dynamic Workers have different limits or if this is shared with the parent. **Confidence: LOW**

4. **Production reliability at scale**: Only one confirmed production user (Zite). Dynamic Workers just entered open beta yesterday. No independent reliability data available. **Confidence: LOW**

5. **Python performance in Dynamic Workers**: Blog says Python is "much slower to start" but provides no numbers. **Confidence: LOW**

6. **globalOutbound interceptor pattern**: Can route outbound through a specific service, but docs don't clarify if this allows granular URL-level filtering or just proxying. **Confidence: MEDIUM**

7. **Hacker News/Twitter developer sentiment on Dynamic Workers specifically**: Most community discussion found was about Sandbox SDK (containers), not Dynamic Workers. Dynamic Workers are too new (1 day in open beta) for significant community feedback. **Confidence: LOW**

8. **@cloudflare/worker-bundler**: Mentioned as needed for TypeScript/npm dependencies but no detailed docs found. **Confidence: LOW**

9. **Pricing post-beta**: Only "$0.002 per unique Worker loaded per day" is stated. Unclear how "unique" is defined for one-off `load()` calls vs cached `get()` calls. **Confidence: MEDIUM**

10. **Zite's claims**: "Millions of execution requests daily" is a customer testimonial on a vendor blog. No independent verification available. **Confidence: MEDIUM**

---

## Sources

### Primary Sources (Cloudflare Official)

- [Sandboxing AI agents, 100x faster (Dynamic Workers blog post)](https://blog.cloudflare.com/dynamic-workers/) — Published 2026-03-24
- [Dynamic Workers Documentation](https://developers.cloudflare.com/dynamic-workers/) — Current
- [Dynamic Workers API Reference](https://developers.cloudflare.com/dynamic-workers/api-reference/) — Current
- [Dynamic Workers Getting Started](https://developers.cloudflare.com/dynamic-workers/getting-started/) — Current
- [Dynamic Workers Bindings](https://developers.cloudflare.com/dynamic-workers/usage/bindings/) — Current
- [Dynamic Workers Open Beta Changelog](https://developers.cloudflare.com/changelog/post/2026-03-24-dynamic-workers-open-beta/) — 2026-03-24
- [Code Mode: the better way to use MCP](https://blog.cloudflare.com/code-mode/) — 2025
- [Code Mode: give agents an entire API in 1,000 tokens](https://blog.cloudflare.com/code-mode-mcp/) — 2026
- [Introducing Moltworker](https://blog.cloudflare.com/moltworker-self-hosted-ai-agent/) — 2026
- [Cloudflare Agents SDK Documentation](https://developers.cloudflare.com/agents/) — Current
- [Agent class internals](https://developers.cloudflare.com/agents/concepts/agent-class/) — Current
- [Agents SDK Codemode API Reference](https://developers.cloudflare.com/agents/api-reference/codemode/) — Current
- [Cloudflare Sandbox SDK Overview](https://developers.cloudflare.com/sandbox/) — Current
- [Workers Platform Limits](https://developers.cloudflare.com/workers/platform/limits/) — Current
- [@cloudflare/codemode v0.1.0 Changelog](https://developers.cloudflare.com/changelog/post/2026-02-20-codemode-sdk-rewrite/) — 2026-02-20

### Primary Sources (GitHub)

- [@cloudflare/codemode source (GitHub)](https://github.com/cloudflare/agents/tree/main/packages/codemode) — Current
- [Codemode docs (GitHub)](https://github.com/cloudflare/agents/blob/main/docs/codemode.md) — Current

### Secondary Sources

- [VentureBeat: Cloudflare Dynamic Workers](https://venturebeat.com/infrastructure/cloudflares-new-dynamic-workers-ditch-containers-to-run-ai-agent-code-100x) — 2026-03
- [StartupHub.ai: Cloudflare's New Sandbox for AI](https://www.startuphub.ai/ai-news/technology/2026/cloudflare-s-new-sandbox-for-ai) — 2026
- [World Today News: Cloudflare AI Sandboxing](https://www.world-today-news.com/cloudflare-ai-sandboxing-100x-faster-than-containers/) — 2026
- [Matt Collins: First Impressions of Code Mode](https://www.mattcollins.net/2025/11/first-impressions-of-cloudflares-code-mode) — November 2025
- [DeepWiki: Codemode LLM Code Generation](https://deepwiki.com/cloudflare/agents/7.1-codemode-(llm-code-generation)) — 2026
- [Hacker News: Cloudflare Sandbox SDK Discussion](https://news.ycombinator.com/item?id=45610523) — 2026

### Competitive Comparison Sources

- [Better Stack: Best Sandbox Runners 2026](https://betterstack.com/community/comparisons/best-sandbox-runners/) — 2026
- [Northflank: Top Cloudflare Sandboxes Alternatives](https://northflank.com/blog/top-cloudflare-sandboxes-alternatives) — 2026
- [Superagent: AI Code Sandbox Benchmark 2026](https://www.superagent.sh/blog/ai-code-sandbox-benchmark-2026) — 2026
