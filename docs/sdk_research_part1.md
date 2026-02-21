# Claude Agent SDK - Core Capabilities Research Report (Part 1)

**Researcher:** sdk-researcher-1
**Date:** 2026-02-12
**Sources:** overview.md, typescript_sdk.md, custom_tools.md, subagents.md, mcp.md, builtinsdktools.md, streaming_input.md, session_management.md

---

## Executive Summary

The Claude Agent SDK (formerly Claude Code SDK) is a production-ready framework for building AI agents. It is built on the same agent harness that powers Claude Code itself. The SDK provides: automatic context management with compaction, a rich built-in tool ecosystem (file ops, web search, bash, subagents), MCP extensibility for custom tools, fine-grained permissions, session management with resume/fork, and two input modes (streaming and single-message). Available in both TypeScript and Python. Package: `@anthropic-ai/claude-agent-sdk` (TS) / `claude-agent-sdk` (Python).

---

## 1. SDK Overview & Architecture

### KEY CAPABILITIES
- **Single entry point:** `query()` function that returns an `AsyncGenerator<SDKMessage>` - simple to consume
- **Automatic context management:** Built-in compaction when context window fills up - agent never runs out of context
- **Prompt caching:** Automatic optimization for repeated interactions (reduces cost, increases speed)
- **Multi-provider auth:** Supports Anthropic API directly, Amazon Bedrock (`CLAUDE_CODE_USE_BEDROCK=1`), and Google Vertex AI (`CLAUDE_CODE_USE_VERTEX=1`)
- **Full Claude Code feature parity:** Subagents (`.claude/agents/`), Hooks (`.claude/settings.json`), Slash Commands (`.claude/commands/`), CLAUDE.md memory files
- **System prompts:** Fully customizable, or use the Claude Code preset with optional appended instructions
- **Model selection:** Supports `sonnet`, `opus`, `haiku` variants; fallback model configuration available

### TECHNICAL CONSTRAINTS
- Requires `ANTHROPIC_API_KEY` env var (or Bedrock/Vertex config)
- The SDK spawns a subprocess - it runs Claude Code under the hood, not a raw API call
- Context compaction is automatic but introduces `compact_boundary` messages that apps should handle
- `settingSources` defaults to `[]` (no filesystem settings loaded) - must explicitly opt in to load CLAUDE.md, project settings, etc.
- To use CLAUDE.md files, you need BOTH `settingSources: ['project']` AND `systemPrompt: { type: 'preset', preset: 'claude_code' }`

### HACKATHON RELEVANCE
- **Effort: LOW** - `npm install` + a few lines of code gets you a working agent
- **Feasibility: HIGH** - The `query()` function is remarkably simple; you can have a functioning agent in under 30 minutes
- The hard part is designing good system prompts and tool configurations, not the SDK integration itself

### INDIA-SPECIFIC POTENTIAL
- Bedrock/Vertex support means deployment within India-compliant cloud regions
- Could build agents for India-specific domains: legal compliance (GST, labor law), education (NEP curriculum), agriculture advisory

---

## 2. TypeScript SDK Reference - Deep Dive

### KEY CAPABILITIES

#### Core API: `query()`
```typescript
function query({
  prompt: string | AsyncIterable<SDKUserMessage>,
  options?: Options
}): Query  // extends AsyncGenerator<SDKMessage, void>
```

The `Query` object supports:
- `interrupt()` - Cancel ongoing work (streaming mode only)
- `setPermissionMode()` - Dynamically change permissions at runtime

#### Critical Options (hackathon-relevant subset):
| Option | What It Does | Hackathon Use |
|--------|-------------|---------------|
| `systemPrompt` | Define agent persona/role | Core - defines your agent |
| `allowedTools` | Whitelist specific tools | Security - limit blast radius |
| `disallowedTools` | Blacklist specific tools | Quick exclusion |
| `maxTurns` | Cap conversation turns | Prevent runaway costs |
| `maxThinkingTokens` | Limit thinking budget | Cost control |
| `mcpServers` | Attach custom MCP tools | Core extensibility |
| `agents` | Define subagents programmatically | Multi-agent orchestration |
| `permissionMode` | `default` / `acceptEdits` / `bypassPermissions` / `plan` | `bypassPermissions` for hackathon |
| `canUseTool` | Custom permission callback | Fine-grained control |
| `hooks` | Lifecycle event callbacks | Logging, monitoring |
| `model` | Model selection | Cost/quality tradeoff |
| `fallbackModel` | Backup model | Reliability |
| `outputFormat` | `{ type: 'json_schema', schema }` | Structured output |
| `continue` | Resume most recent conversation | Multi-turn |
| `resume` | Resume specific session by ID | Persistence |
| `forkSession` | Branch a session | A/B testing |
| `sandbox` | Sandboxed command execution | Security |
| `plugins` | Load local plugins | Extensibility |
| `includePartialMessages` | Stream tokens as they arrive | Real-time UX |

#### Subagent Definition (Programmatic):
```typescript
type AgentDefinition = {
  description: string;      // When to use this agent
  tools?: string[];          // Allowed tools (inherits all if omitted)
  prompt: string;            // System prompt for the subagent
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
}
```
This is passed via `options.agents` as `Record<string, AgentDefinition>`.

#### Message Types (7 total):
1. `SDKAssistantMessage` - Claude's responses (contains `APIAssistantMessage` from Anthropic SDK)
2. `SDKUserMessage` - User inputs
3. `SDKUserMessageReplay` - Replayed messages (with required UUID)
4. `SDKResultMessage` - Final result with `subtype: 'success' | 'error_max_turns' | 'error_during_execution'`
5. `SDKSystemMessage` - Init message with session_id, tools list, model, mcp_server status
6. `SDKPartialAssistantMessage` - Streaming tokens (when `includePartialMessages: true`)
7. `SDKCompactBoundaryMessage` - Context compaction notification

#### Result Message (critical for app integration):
```typescript
// Success case:
{
  type: 'result',
  subtype: 'success',
  session_id: string,
  duration_ms: number,
  duration_api_ms: number,
  num_turns: number,
  result: string,           // The final text answer
  total_cost_usd: number,   // Cost tracking!
  usage: NonNullableUsage,
  permission_denials: SDKPermissionDenial[]
}
```
**Key insight:** `total_cost_usd` and `usage` are returned in every result - built-in cost tracking!

#### Hook System (9 events):
- `PreToolUse` / `PostToolUse` - Before/after any tool execution
- `Notification` - Agent notifications
- `UserPromptSubmit` - Before processing user input
- `SessionStart` / `SessionEnd` - Session lifecycle
- `Stop` / `SubagentStop` - Agent termination
- `PreCompact` - Before context compaction

Hooks can: approve/block tool use, inject system messages, add context, suppress output, stop execution.

#### Built-in Tool Input/Output Types:
The SDK exports typed interfaces for ALL 15+ built-in tools: `Task`, `Bash`, `BashOutput`, `Edit`, `Read`, `Write`, `Glob`, `Grep`, `KillBash`, `NotebookEdit`, `WebFetch`, `WebSearch`, `TodoWrite`, `ExitPlanMode`, `ListMcpResources`, `ReadMcpResource`.

### TECHNICAL CONSTRAINTS
- The `Query` object is an async generator - must be consumed with `for await...of` or manual iteration
- `interrupt()` and `setPermissionMode()` only work in streaming input mode
- Permission system is complex: `permissionMode` + `canUseTool` callback + `allowedTools`/`disallowedTools` all interact
- Settings precedence: Local > Project > User (programmatic options always win)
- `sandbox` settings control command execution sandboxing but NOT filesystem/network access (those use permission rules)
- `includePartialMessages` generates high volume of events - must handle efficiently

### HACKATHON RELEVANCE
- **Effort: LOW-MEDIUM** - TypeScript types are comprehensive; IDE autocomplete does most of the work
- **Critical path:** Set `permissionMode: 'bypassPermissions'` for hackathon to avoid permission prompts
- Use `maxTurns` to prevent cost explosions during development
- `outputFormat` with JSON schema is a game-changer for structured agent outputs
- The hook system is powerful but probably overkill for a 6-hour hackathon unless you need logging

### INDIA-SPECIFIC POTENTIAL
- `outputFormat` could enforce Hindi/regional language output schemas
- Cost tracking (`total_cost_usd`) is critical for India market where cost sensitivity is high
- `fallbackModel` with haiku as fallback keeps costs low for mass-market Indian apps

---

## 3. Custom Tools (via In-Process MCP Servers)

### KEY CAPABILITIES

#### Tool Creation Pattern:
```typescript
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const server = createSdkMcpServer({
  name: "my-tools",
  version: "1.0.0",
  tools: [
    tool(
      "tool_name",
      "Tool description",
      { param: z.string().describe("Param description") },  // Zod schema
      async (args) => {
        return { content: [{ type: "text", text: "result" }] };
      }
    )
  ]
});
```

- **Type-safe with Zod:** Schema defines both runtime validation AND TypeScript types
- **In-process execution:** Tools run in the same Node.js process - no IPC overhead, no separate server
- **Tool naming convention:** `mcp__{server_name}__{tool_name}` - important for `allowedTools` config
- **Selective tool exposure:** Can allow/disallow individual tools from a multi-tool server
- **Rich return types:** Text, images, or resources via MCP `CallToolResult`

#### Documented Example Tools:
1. **Weather API tool** - External API integration pattern
2. **Database query tool** - SQL execution pattern
3. **API Gateway tool** - Multi-service authenticated API pattern (Stripe, GitHub, OpenAI, Slack)
4. **Calculator tool** - Computation pattern with compound interest example

### TECHNICAL CONSTRAINTS
- **CRITICAL: Custom MCP tools REQUIRE streaming input mode.** You MUST use `AsyncIterable<SDKUserMessage>` for the `prompt` parameter - a plain string will NOT work when MCP servers are configured
- Tool handlers must return `Promise<CallToolResult>` with `content` array
- Errors should be returned as text content, not thrown (to avoid crashing the agent loop)
- Zod is a dependency for TypeScript schema definition
- Python uses either dict-based schemas or JSON Schema format (no Pydantic integration mentioned)

### HACKATHON RELEVANCE
- **Effort: LOW** - Creating a custom tool is ~20 lines of code
- **This is the key extensibility point** - any external API, database, or service can be wrapped as a tool
- The streaming input requirement adds a small complexity bump (need async generator wrapper)
- Pattern for wrapping any REST API is well-documented and copy-pasteable

### INDIA-SPECIFIC POTENTIAL
- Wrap India-specific APIs as tools: UPI payment status, GSTIN validation, Aadhaar verification, IndiaPost tracking
- Database tools for Indian government open data (data.gov.in)
- WhatsApp Business API tool for Indian market communication
- Regional language translation tool wrapping IndicTrans or similar

---

## 4. MCP (Model Context Protocol) Integration

### KEY CAPABILITIES

#### Four Transport Types:
1. **stdio** - External process via stdin/stdout (most common, for CLI-based MCP servers)
2. **SSE** - Server-Sent Events over HTTP (remote servers)
3. **HTTP** - Standard HTTP endpoints (remote servers)
4. **SDK** - In-process servers (via `createSdkMcpServer`, described above)

#### Configuration Methods:
- **File-based:** `.mcp.json` at project root with `mcpServers` config
- **Programmatic:** `options.mcpServers` Record in `query()` call
- **Environment variable interpolation:** `${API_TOKEN}` and `${API_KEY:-default-key}` syntax in config

#### Resource Management:
- MCP servers can expose **resources** (not just tools)
- Built-in `ListMcpResources` and `ReadMcpResource` tools for resource access
- Resources have URI, name, description, mimeType, and server attribution

#### Error Handling:
- Server connection status available in `SDKSystemMessage.mcp_servers[]`
- Each server reports `name` and `status` (connected vs failed)
- `strictMcpConfig` option for enforcing validation

### TECHNICAL CONSTRAINTS
- OAuth2 MCP authentication is NOT supported in-client
- Environment variables must be set before server initialization
- stdio servers spawn child processes (resource overhead)
- SSE/HTTP servers require network access and external hosting
- No hot-reload of MCP server configuration during a session

### HACKATHON RELEVANCE
- **Effort: LOW for SDK servers, MEDIUM for stdio/SSE/HTTP**
- For a hackathon, strongly prefer in-process SDK MCP servers (zero deployment overhead)
- `.mcp.json` config is useful if reusing existing community MCP servers
- Huge ecosystem of pre-built MCP servers available (filesystem, database, GitHub, Slack, etc.)

### INDIA-SPECIFIC POTENTIAL
- Could connect to India-specific MCP servers for government databases
- SSE/HTTP transport enables connecting to India-hosted services behind VPN/firewall
- Community MCP servers for popular Indian SaaS (Zoho, Freshworks, Razorpay) could be leveraged

---

## 5. Built-in SDK Tools (No MCP Required)

### KEY CAPABILITIES

These tools come standard - no configuration needed:

| Tool | Purpose | Hackathon Value |
|------|---------|----------------|
| **WebFetch** | Fetch URL + AI analysis | HIGH - web scraping, competitor analysis |
| **WebSearch** | Web search with domain filters | HIGH - real-time information gathering |
| **Read** | Read files (text, images, PDFs, notebooks) | HIGH - multimodal input |
| **Write** | Create/overwrite files | HIGH - generate artifacts |
| **Edit** | String replacement in files | MEDIUM - code modification |
| **Glob** | File pattern matching | MEDIUM - file discovery |
| **Grep** | Regex search across files | MEDIUM - code/data search |
| **Bash** | Execute shell commands | HIGH - run scripts, install packages |
| **Task** | Delegate to subagents | HIGH - parallel work, specialization |
| **TodoWrite** | Task tracking | LOW - internal bookkeeping |
| **NotebookEdit** | Edit Jupyter notebooks | LOW - data science workflows |
| **KillBash** | Kill background processes | LOW - cleanup |

### Research Workflow Pattern (documented):
1. **Brand Analysis:** WebFetch (client website) -> Read (brand guidelines) -> AI synthesis
2. **Competitor Research:** WebSearch (find competitors) -> WebFetch (analyze sites) -> Grep (extract patterns)
3. **Trend Analysis:** WebSearch (industry trends) -> WebFetch (deep dives) -> AI synthesis
4. **Pattern Recognition:** Grep (find themes) -> Task (delegate analysis to subagents)

### TECHNICAL CONSTRAINTS
- WebFetch processes content through a smaller AI model (not the main Claude) for summarization
- WebSearch availability may be region-dependent
- Bash commands have configurable timeouts (max 600,000ms / 10 minutes)
- Background Bash processes need explicit cleanup via KillBash
- Read has a 2000-line default limit; large PDFs require explicit page ranges

### HACKATHON RELEVANCE
- **Effort: ZERO** - These are already available, just include them in `allowedTools`
- WebFetch + WebSearch alone enable powerful research agents without any custom code
- Task (subagent delegation) enables sophisticated multi-agent architectures out of the box
- The combination of Read (multimodal) + Write (file generation) + Bash (execution) covers most hackathon needs

### INDIA-SPECIFIC POTENTIAL
- WebSearch with domain filters for `.in` domains, government sites
- WebFetch for scraping Indian e-commerce, news, government portals
- Bash for running India-specific data processing scripts
- Read for processing Hindi/regional language documents and PDFs

---

## 6. Streaming Input Mode

### KEY CAPABILITIES

#### Two Input Modes:
1. **Streaming Input (Recommended):** `prompt` is an `AsyncIterable<SDKUserMessage>` - persistent, interactive session
2. **Single Message:** `prompt` is a `string` - one-shot query, simpler but limited

#### Streaming Input Benefits:
- **Image uploads:** Attach images directly to messages (base64 encoded)
- **Queued messages:** Send multiple messages that process sequentially
- **Interruption:** Cancel ongoing work with `query.interrupt()`
- **Tool integration:** Full access to all tools including custom MCP servers
- **Hooks support:** All lifecycle hooks available
- **Real-time streaming:** `includePartialMessages: true` for token-by-token updates
- **Context persistence:** Natural multi-turn conversation within single query call

#### Streaming Input Pattern:
```typescript
async function* generateMessages() {
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: "First message"
    }
  };

  // Wait for conditions, user input, etc.
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Follow-up with image
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: [
        { type: "text", text: "Analyze this" },
        { type: "image", source: { type: "base64", media_type: "image/png", data: "..." } }
      ]
    }
  };
}

for await (const message of query({ prompt: generateMessages(), options: { ... } })) {
  // Process messages
}
```

#### Single Message Limitations:
- NO image attachments
- NO dynamic message queueing
- NO real-time interruption
- NO hook integration
- NO natural multi-turn (must use `continue: true` or `resume` for follow-ups)

### TECHNICAL CONSTRAINTS
- **MCP servers REQUIRE streaming input mode** - this is a hard requirement
- Streaming mode requires implementing an async generator - slightly more complex than a string
- The generator controls the message flow - yielding triggers processing, the generator pauses until the agent is ready
- `interrupt()` and `setPermissionMode()` are only available in streaming mode
- For single message multi-turn, session management (resume/continue) is the workaround

### HACKATHON RELEVANCE
- **Effort: LOW-MEDIUM** - The async generator pattern is ~10 lines of boilerplate
- **ALWAYS use streaming mode for hackathon** - it unlocks all features including MCP tools
- The image upload capability enables visual AI applications
- For a simple wrapper, create a helper function that converts a string into a single-yield generator

### INDIA-SPECIFIC POTENTIAL
- Image upload enables document scanning apps (Aadhaar, PAN card, invoices)
- Multi-turn with interruption enables conversational agents for Indian languages
- Real-time streaming provides good UX even on slower Indian internet connections

---

## 7. Session Management

### KEY CAPABILITIES

#### Session Lifecycle:
1. **Creation:** Automatic when `query()` is called - session_id returned in first `SDKSystemMessage`
2. **Persistence:** Session state is maintained by the SDK automatically
3. **Resumption:** `options.resume = sessionId` to continue a previous session
4. **Continuation:** `options.continue = true` to resume the most recent session
5. **Forking:** `options.forkSession = true` to branch from a session without modifying the original

#### Session Forking vs Continuing:
| Behavior | `forkSession: false` (default) | `forkSession: true` |
|----------|-------------------------------|---------------------|
| Session ID | Same as original | New ID generated |
| History | Appends to original | Creates new branch |
| Original | Modified | Preserved unchanged |
| Use Case | Linear conversation | Explore alternatives |

#### Session ID Capture:
```typescript
let sessionId: string;
for await (const message of response) {
  if (message.type === 'system' && message.subtype === 'init') {
    sessionId = message.session_id;  // Save this!
  }
}
```

### TECHNICAL CONSTRAINTS
- Session IDs are returned in the `SDKSystemMessage` (type: 'system', subtype: 'init')
- Sessions are tied to the SDK's internal state management
- Resuming loads full conversation history and context automatically
- No explicit session deletion API mentioned - sessions may accumulate
- `continue: true` always resumes the MOST RECENT session (not a specific one)
- No cross-machine session portability mentioned

### HACKATHON RELEVANCE
- **Effort: LOW** - Just capture `session_id` from init message and pass it back via `resume`
- Essential for building persistent chat experiences
- `forkSession` is great for A/B testing different agent approaches during development
- `continue: true` is the simplest option for a single-user hackathon demo

### INDIA-SPECIFIC POTENTIAL
- Session persistence enables "pick up where you left off" for users with intermittent connectivity
- Forking enables branching conversations for educational tutoring (try different approaches)
- Session management is key for any customer support or advisory agent

---

## 8. Subagents (Programmatic)

### KEY CAPABILITIES

Subagents can be defined two ways:
1. **File-based:** Markdown files in `.claude/agents/` directory (Claude Code native feature)
2. **Programmatic:** Via `options.agents` as `Record<string, AgentDefinition>`

#### Programmatic Subagent Definition:
```typescript
const response = query({
  prompt: "...",
  options: {
    agents: {
      "researcher": {
        description: "Researches topics using web search",
        tools: ["WebSearch", "WebFetch", "Read"],
        prompt: "You are a research specialist. Find and synthesize information.",
        model: "sonnet"  // Can use cheaper model for subagents
      },
      "writer": {
        description: "Writes content based on research findings",
        tools: ["Write"],
        prompt: "You are a content writer. Create polished content from research.",
        model: "haiku"  // Even cheaper for straightforward writing
      }
    }
  }
});
```

#### Invocation: Via the built-in `Task` tool:
```typescript
// The main agent uses Task tool to delegate:
{
  description: "Research Indian fintech market",
  prompt: "Find the top 5 fintech trends in India for 2026",
  subagent_type: "researcher"
}
```

#### Key Features:
- **Tool sandboxing:** Each subagent can have its own restricted tool set
- **Model selection:** `'sonnet' | 'opus' | 'haiku' | 'inherit'` - use cheaper models for simpler tasks
- **Separate context:** Each subagent gets its own context window (prevents main agent context pollution)
- **Parallel execution:** Main agent can launch multiple subagents for parallel work
- **Cost tracking:** Subagent results include `usage` and `total_cost_usd`

### TECHNICAL CONSTRAINTS
- Subagents are invoked via the `Task` tool - the main agent decides when to delegate
- Each subagent is a separate process/context - there's startup overhead
- Subagents cannot communicate with each other directly (only through the parent)
- The `SubagentStop` hook fires when a subagent completes
- If `tools` is omitted, the subagent inherits ALL tools from the parent (potential security concern)

### HACKATHON RELEVANCE
- **Effort: LOW** - Define agents inline, no files needed
- **HIGH VALUE** - Multi-agent architectures are the most impressive hackathon demos
- Use `model: 'haiku'` for cheap subagents that do simple tasks (translation, formatting)
- Use `model: 'sonnet'` for research subagents that need more intelligence
- Reserve `opus` for the orchestrator/main agent only

### INDIA-SPECIFIC POTENTIAL
- Specialist subagents for Indian domains: legal agent (Indian law), tax agent (GST), agriculture agent
- Multi-lingual agent architecture: Hindi subagent, Tamil subagent, etc., orchestrated by English main agent
- Cost optimization with model tiering is critical for India market viability

---

## Cross-Cutting Analysis: Hackathon Feasibility Matrix

| Capability | Setup Time | Code Complexity | Cost Risk | Demo Impact |
|-----------|-----------|----------------|----------|-------------|
| Basic query() | 5 min | Very Low | Low | Low |
| Custom tools | 15 min | Low | Low | Medium |
| Streaming input | 10 min | Low-Medium | Low | Medium |
| Subagents | 20 min | Medium | Medium | HIGH |
| Session management | 10 min | Low | Low | Medium |
| MCP (external) | 30+ min | Medium | Low | Medium |
| MCP (in-process) | 15 min | Low | Low | Medium |
| Hooks | 20 min | Medium | Low | Low |
| Sandbox | 15 min | Medium | Low | Low |
| Structured output | 10 min | Low | Low | HIGH |

### Recommended Hackathon Stack:
1. **Core:** `query()` with streaming input mode (required for MCP)
2. **Extension:** 2-3 custom in-process MCP tools for domain-specific APIs
3. **Architecture:** 1 orchestrator + 2-3 specialized subagents
4. **UX:** `includePartialMessages: true` for real-time streaming to frontend
5. **Safety:** `maxTurns: 10`, `permissionMode: 'bypassPermissions'`
6. **Output:** `outputFormat` with JSON schema for structured results

### Key Technical Gotchas for Hackathon:
1. **MCP requires streaming input** - don't use plain string prompts if you have custom tools
2. **`settingSources` defaults to empty** - explicitly set if you need CLAUDE.md files
3. **Tool names for MCP follow `mcp__{server}__{tool}` pattern** - must match in `allowedTools`
4. **`permissionMode: 'bypassPermissions'`** is essential for automated agents (no interactive prompts)
5. **Cost can spiral** with subagents - use `maxTurns` and cheaper models for subagents
6. **`total_cost_usd`** in result messages - monitor this during development!

---

## Appendix: Quick-Start Code Template

```typescript
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// 1. Define custom tools
const myTools = createSdkMcpServer({
  name: "hackathon-tools",
  version: "1.0.0",
  tools: [
    tool("my_api", "Call my custom API", {
      input: z.string().describe("The input")
    }, async (args) => ({
      content: [{ type: "text", text: `Result for: ${args.input}` }]
    }))
  ]
});

// 2. Create streaming input generator
async function* chat(userMessage: string) {
  yield {
    type: "user" as const,
    message: { role: "user" as const, content: userMessage }
  };
}

// 3. Run the agent
async function runAgent(message: string) {
  for await (const msg of query({
    prompt: chat(message),
    options: {
      systemPrompt: "You are a helpful assistant specialized in...",
      mcpServers: { "hackathon-tools": myTools },
      allowedTools: [
        "mcp__hackathon-tools__my_api",
        "WebSearch", "WebFetch", "Read", "Write", "Task"
      ],
      agents: {
        researcher: {
          description: "Researches topics online",
          tools: ["WebSearch", "WebFetch"],
          prompt: "You are a research specialist.",
          model: "haiku"
        }
      },
      permissionMode: "bypassPermissions",
      maxTurns: 10,
      includePartialMessages: true
    }
  })) {
    if (msg.type === "assistant") {
      // Stream to UI
    }
    if (msg.type === "result" && msg.subtype === "success") {
      console.log("Cost:", msg.total_cost_usd);
      return msg.result;
    }
  }
}
```
