# Claude Agent SDK Patterns

Reference for building agentic systems with the Claude Agent SDK.

---

## 1. SDK Overview

**Package:** `@anthropic-ai/claude-agent-sdk` (TypeScript), `claude-agent-sdk` (Python)

The SDK wraps the same agent harness that powers Claude Code. You get automatic context management (compaction when context fills up), built-in tool execution, session persistence (JSONL on disk), prompt caching, and MCP extensibility.

```typescript
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import type { Options } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
```

---

## 2. The query() Function

`query()` is the single entry point. Returns an `AsyncGenerator<SDKMessage>` -- iterate with `for-await-of`.

```typescript
function query({
  prompt,   // string (single message) or AsyncIterable<SDKUserMessage> (streaming)
  options   // Options object
}: { prompt: string | AsyncIterable<SDKUserMessage>; options?: Options }): Query
```

### Key Options

| Option | Type | What it does |
|:-------|:-----|:-------------|
| `model` | `string` | Claude model ID (e.g. `'claude-haiku-4-5-20251001'`) |
| `maxTurns` | `number` | Cap on tool round-trips per `query()` call |
| `systemPrompt` | `string \| { type: 'preset', preset: 'claude_code', append?: string }` | Agent instructions |
| `allowedTools` | `string[]` | Whitelist of tool names |
| `mcpServers` | `Record<string, McpServerConfig>` | Custom MCP tool servers |
| `cwd` | `string` | Working directory for file operations |
| `permissionMode` | `'default' \| 'acceptEdits' \| 'bypassPermissions' \| 'plan'` | Permission strategy |
| `settingSources` | `('user' \| 'project' \| 'local')[]` | Which `.claude/` settings to load (default: none) |
| `abortController` | `AbortController` | Cancel the query externally |
| `env` | `Record<string, string>` | Environment variables |
| `resume` | `string` | Session ID to resume |
| `forkSession` | `boolean` | Fork instead of continue when resuming |
| `continue` | `boolean` | Continue the most recent conversation |
| `agents` | `Record<string, AgentDefinition>` | Programmatic subagent definitions |

### SDKMessage Types

| Type | Subtype | When | Key fields |
|:-----|:--------|:-----|:-----------|
| `system` | `init` | First message | `session_id`, `tools[]`, `mcp_servers[]`, `model` |
| `assistant` | -- | Claude responds | `message.content` (text + tool_use blocks) |
| `user` | -- | Tool results | `message.content` (tool_result blocks) |
| `result` | `success` | Turn done | `result`, `total_cost_usd`, `num_turns`, `usage` |
| `result` | `error_max_turns` | Hit limit | Same minus `result` |
| `result` | `error_during_execution` | Fatal error | Same minus `result` |
| `system` | `compact_boundary` | Context compacted | `compact_metadata` |

Capture the session ID from the first message:

```typescript
let sessionId: string;
for await (const msg of query({ prompt: "...", options })) {
  if (msg.type === 'system' && msg.subtype === 'init') sessionId = msg.session_id;
}
```

---

## 3. MCP Tools (The Agent's Hands)

Custom in-process tools. No external server needed.

### Creating a Tool Server

```typescript
const myTools = createSdkMcpServer({
  name: "campaign-tools",
  version: "1.0.0",
  tools: [
    tool(
      "generate_ad_images",
      "Generate ad images from creative prompts",
      {
        prompts: z.array(z.object({
          text: z.string(),
          style: z.string(),
        })),
        outputDir: z.string(),
      },
      async (args) => {
        const results = await Promise.all(
          args.prompts.map(p => generateImage(p.text, p.style))
        );
        return { content: [{ type: "text", text: JSON.stringify(results) }] };
      }
    )
  ]
});
```

**Tool naming:** `mcp__{server_name}__{tool_name}` -- e.g. `mcp__campaign-tools__generate_ad_images`

**Handlers return:** `{ content: [{ type: 'text', text: string }] }`. Return errors as text (not thrown) so the agent can retry.

### Using Tools in query()

MCP tools require **streaming input mode** (async generator). Plain string prompts do not work with `mcpServers`.

```typescript
async function* prompt() {
  yield { type: "user" as const, message: { role: "user" as const, content: "Generate images" } };
}

for await (const msg of query({
  prompt: prompt(),
  options: {
    mcpServers: { "campaign-tools": myTools },
    allowedTools: ["mcp__campaign-tools__generate_ad_images", "Read", "Write"],
  }
})) { /* ... */ }
```

---

## 4. System Prompts (The Agent's Brain)

### Custom String (Full Control)

No built-in Claude Code instructions. You define everything.

```typescript
options: { systemPrompt: "You are a brand research agent. Always use WebFetch first..." }
```

### Preset with Append

Keeps Claude Code's built-in tool instructions, adds your rules on top.

```typescript
options: {
  systemPrompt: {
    type: "preset", preset: "claude_code",
    append: "Always include type annotations. Follow project conventions."
  }
}
```

### The Orchestrator Pattern

For multi-phase agents, the system prompt acts as a workflow definition:

```typescript
const ORCHESTRATOR_PROMPT = `You are a creative campaign agent. Execute these phases IN ORDER:

## Phase 1: Research
- Use WebFetch to analyze the brand URL
- Write findings to /files/research/brand_research.md

## Phase 2: Hook Generation
- Use the Skill tool to invoke "hook-methodology"

## Phase 3: Art Direction
- Use the Skill tool to invoke "art-style"
- Write prompts to /files/creatives/prompts.json

## Phase 4: Image Generation
- Use mcp__campaign-tools__generate_ad_images with all 6 prompts

IMPORTANT: Complete each phase fully before moving to the next.`;
```

---

## 5. Session Management

Sessions auto-create. The ID arrives in `system.init`.

**Resume:** Continue with full conversation history.
```typescript
query({ prompt: "Revise hook 2", options: { resume: sessionId } })
```

**Fork:** Branch from a point. Original unchanged.
```typescript
query({ prompt: "Try different approach", options: { resume: sessionId, forkSession: true } })
```

**Continue:** Pick up the most recent session (no ID needed).
```typescript
query({ prompt: "Keep going", options: { continue: true } })
```

### Gotchas

- JSONL on network filesystems (s3fs, FUSE) can corrupt with null bytes mid-flush. Prefer DB hydration for cold starts.
- `resume` loads full history -- may trigger immediate compaction on long sessions.
- `maxTurns` is per `query()` call, not cumulative across resumes.

---

## 6. Streaming Input Mode

The recommended mode. Uses an async generator for `prompt`, enabling multi-turn conversations, MCP tools, image attachments, and interruption within a single `query()` call.

```typescript
async function* messages() {
  yield { type: "user" as const, message: { role: "user" as const, content: "First task" } };

  const followUp = await waitForInput();  // block until next input arrives
  yield { type: "user" as const, message: { role: "user" as const, content: followUp } };
}

for await (const msg of query({ prompt: messages(), options: { maxTurns: 30 } })) {
  if (msg.type === 'result') console.log("Turn done");
  // After result, generator yields next message (or returns to end query)
}
```

**Single message mode** is simpler (`prompt: "..."`) but does not support MCP tools, hooks, images, or multi-turn.

---

## 7. Subagents & Skills

### Subagents (Programmatic)

```typescript
options: {
  agents: {
    "research-agent": {
      description: "Researches brands via web",
      tools: ["WebFetch", "WebSearch", "Read", "Write"],
      prompt: "You are a brand research specialist.",
      model: "haiku"  // 'sonnet' | 'opus' | 'haiku' | 'inherit'
    }
  }
}
```

Main agent invokes subagents via the `Task` tool. File-based agents go in `.claude/agents/`.

### Skills (File-Based Only)

Markdown files in `.claude/skills/{name}/SKILL.md` with YAML frontmatter. Require:
1. `settingSources: ['project']` to discover them
2. `"Skill"` in `allowedTools` to invoke them
3. Claude chooses when to use a skill based on its `description` field

Skills cannot be defined programmatically.

---

## 8. Hosting Patterns

| Pattern | Description | Best for |
|:--------|:------------|:---------|
| **Ephemeral** | New container per task, destroy when done | One-shot jobs |
| **Long-Running** | Persistent container, multiple `query()` calls | Chat bots, monitors |
| **Hybrid** (ours) | Ephemeral container hydrated from DB | Intermittent interaction |
| **Single Container** | Multiple agent processes in one container | Agent collaboration |

**Resource minimums:** 1 GiB RAM, 5 GiB disk, 1 CPU. Outbound HTTPS to `api.anthropic.com`.

---

## 9. The Agent Runner Pattern (Bridging SDK + Infrastructure)

The key pattern connecting the SDK to external infrastructure (Cloudflare Workers + Durable Objects). A long-lived process calls `query()` once with a streaming generator. The generator yields the initial prompt, then polls for follow-ups via file IPC.

### Architecture

```
[Durable Object] --WebSocket--> [Browser]
       |
       | getSandbox() + startProcess()
       v
[Sandbox Container: agent-runner.ts]
  └── query({ prompt: promptStream(), options })
       ├── stdout (JSON lines) → DO streams to client
       ├── /app/next-prompt.json ← DO writes follow-up prompts
       └── /app/turn-result.json → DO reads completion data
```

### The Prompt Stream Generator

```typescript
async function* promptStream() {
  // Turn 1: from env var
  yield { type: 'user' as const, message: { role: 'user' as const, content: process.env.PROMPT! } };

  // Subsequent turns: poll for file IPC
  while (true) {
    const data = await waitForPromptFile(); // polls /app/next-prompt.json
    if (!data || 'shutdown' in data) return;

    process.stdout.write(JSON.stringify({ type: 'turn_start', requestId: data.requestId }) + '\n');
    yield { type: 'user' as const, message: { role: 'user' as const, content: data.prompt } };
  }
}
```

### The Main Loop

```typescript
const options: Partial<Options> = {
  cwd: '/app/agent',
  model: 'claude-haiku-4-5-20251001',
  maxTurns: 30,
  settingSources: ['user', 'project'],
  allowedTools: ['Task', 'Skill', 'Read', 'Write', 'Bash', 'Edit', 'Glob', 'Grep',
                 'WebFetch', 'WebSearch', 'mcp__campaign-tools__generate_ad_images'],
  systemPrompt: ORCHESTRATOR_PROMPT,
  mcpServers: { 'campaign-tools': campaignToolServer },
  permissionMode: 'bypassPermissions',
};

for await (const msg of query({ prompt: promptStream(), options })) {
  process.stdout.write(JSON.stringify(msg) + '\n');  // DO reads this via streamProcessLogs

  if (msg.type === 'system' && msg.subtype === 'init') sdkSessionId = msg.session_id;
  if (msg.type === 'result') {
    writeCompletionMarker(blocks, text);
    process.stdout.write(JSON.stringify({ type: 'turn_complete' }) + '\n');
  }
}
```

### Key Options for Agent Runners

| Option | Value | Why |
|:-------|:------|:----|
| `permissionMode` | `'bypassPermissions'` | No human in the loop in containers |
| `settingSources` | `['user', 'project']` | Load CLAUDE.md, skills, agents from disk |
| `maxTurns` | `30` | Prevent loops, allow complex tasks |
| `cwd` | `'/app/agent'` | Agent workspace with skills and config |

### Sentinel Markers

The runner writes structured markers to stdout for the infrastructure layer:

- `{ type: 'turn_start', requestId }` -- skip log replay on reconnect
- `{ type: 'turn_complete' }` -- generic completion signal
- `COMPLETION:{requestId}` -- per-turn completion detection
- `{ type: 'trace', action }` -- diagnostics (heartbeat, phase changes)

### Heartbeat

Long API calls produce no stdout. Write a trace every 30s so the infrastructure knows the agent is alive:

```typescript
setInterval(() => {
  process.stdout.write(JSON.stringify({ type: 'trace', action: 'heartbeat', ts: Date.now() }) + '\n');
}, 30_000);
```

### Status File

The agent-runner writes `/app/agent-status.json` so the DO can check health without parsing logs:

```typescript
function writeStatus(status: 'starting' | 'processing' | 'idle' | 'error') {
  fs.writeFileSync('/app/agent-status.json', JSON.stringify({ status, ts: Date.now() }));
}
```

The DO's `isAgentProcessAlive()` reads this file: if status is `'idle'` and within 2h, the agent is alive and ready for a fast-path follow-up.

---

## 10. The Block Builder Pattern (Progress Tracking)

Tracks agent progress phases and builds structured message blocks for the UI. See `cloudflare/sandbox/block-builder.ts` (~137 lines).

### Block Types

```typescript
TextBlockData:     { type: 'text', id, content }
ThinkingBlockData: { type: 'thinking', id, label, status, expanded, children[], completedImages, expectedImages }
StatusBlockData:   { type: 'status', id, text, variant: 'info' | 'success' | 'error' }

ThinkingChild:     { id, kind: 'phase' | 'tool' | 'result' | 'progress' | 'error' | 'text' | 'status', text, timestamp }
```

### How It Works

The agent-runner processes each SDK message through `processMessageForBlocks()` which detects phases from tool usage:

```typescript
// In the SDK message processing loop:
if (msg.type === 'assistant') {
  for (const block of msg.message.content) {
    if (block.type === 'tool_use') {
      if (block.name === 'Task')  blockBuilder.openThinkingBlock('Researching');
      if (block.name === 'Skill') blockBuilder.openThinkingBlock('Generating Hooks');
      if (block.name.includes('mcp__')) blockBuilder.openThinkingBlock('Generating Images', 6);
    }
  }
}
if (msg.type === 'user') {
  // tool_result with images → blockBuilder.incrementCompletedImages()
}
if (msg.type === 'result') {
  blockBuilder.closeThinkingBlock('complete');
}
```

Blocks are serialized to JSON in the completion marker (`turn-result.json`) and stored in D1 `messages.blocks`. The client's `ChatMessage` component renders them on refresh.

### Adapting for Your Agent

Map YOUR agent's tool usage to phases:
- Which `Task` subagents → which phase labels?
- Which `Skill` invocations → which progress steps?
- Which MCP tool calls → which artifact progress counters?

---

## 11. The Orchestrator Prompt (Workflow Definition)

The system prompt is the most important piece — it defines what the agent actually does. See `cloudflare/sandbox/orchestrator-prompt.ts` (~107 lines) for the real implementation.

### Structure of a Production Orchestrator Prompt

```
1. ROLE DEFINITION     — "You are a [domain] agent"
2. INPUT PARSING       — How to extract parameters from user prompt
3. PHASE SEQUENCING    — Steps in order, each depends on previous
4. TOOL DELEGATION     — Which tool/skill/subagent for each phase
5. STYLE/MODE ROUTING  — Keyword detection for different workflows
6. REFERENCE INPUT     — Rules for handling user-provided assets
7. FOLLOW-UP RULES     — Check existing work before re-running phases
8. CONSTRAINTS         — Limits, sequential execution, brevity
```

### Key Patterns in the Orchestrator

**Phase sequencing with tool delegation:**
```
Phase 1: Research    → spawn "research" subagent (Task tool)  → outputs research.md
Phase 2: Hooks       → invoke "hook-methodology" (Skill tool) → outputs hooks.md
Phase 3: Art         → invoke "art-style" (Skill tool)        → outputs prompts.json
Phase 4: Images      → call MCP tool with prompts             → outputs images
```

**Style detection (keyword routing):**
The prompt lists keyword → style mappings. The agent scans the user's prompt for keywords and routes to the appropriate art-style workflow. No keyword → default style. This pattern generalizes to any agent with multiple modes/strategies.

**Reference image rules (critical for image-to-image):**
When users upload product photos, the prompt tells the agent:
1. Read the images FIRST (via Read tool on FUSE mount path)
2. Run research + hooks as normal
3. Run art-style skill for direction
4. Write NEW prompts describing the AD SCENE, not the product (the reference image provides the product appearance)
5. Pass `referenceImageUrls` to every MCP call

This pattern generalizes: whenever your agent receives user-provided inputs that modify the workflow, define explicit rules for how those inputs interact with each phase.

**Follow-up awareness:**
```
For follow-ups, check existing files first (Glob for research, hooks, prompts).
If they exist, skip those phases and work from existing context.
```

### Adapting for Your Domain

Replace the phases, tools, and routing logic:

```typescript
// NFT Art Agent orchestrator (example)
const ORCHESTRATOR_PROMPT = `You are an autonomous art creation agent.

## Input Parsing
Extract: art theme, style preference, target marketplace, price range

## Phase 1: Market Research
Spawn "market-research" subagent → analyze trending styles, recent sales, price points
Output: files/research/market_analysis.md

## Phase 2: Concept Development
Invoke "concept-design" skill → generate 3 unique art concepts from research
Output: files/concepts/concepts.json

## Phase 3: Art Generation
Call mcp__art-tools__generate_artwork with each concept
Output: 3 artwork images in /mnt/r2/artworks/

## Phase 4: Minting
Call mcp__blockchain__mint_nft for each artwork
Output: transaction hashes + token IDs

## Phase 5: Listing
Call mcp__marketplace__list_auction for each minted NFT
Output: listing URLs

RULES:
- Complete each phase before the next
- For follow-ups, check existing concepts before regenerating
- Max 3 artworks per cycle
- Trust skills, be brief in updates`;
```

---

## 12. MCP Tool Deep-Dive (nano-banana Pattern)

The production MCP tool (`nano-banana-mcp.ts`, ~358 lines) has patterns worth studying beyond the basic SDK docs. See the source for full implementation.

### Key Patterns

**Auto-routing based on inputs:**
```typescript
// Text-to-image vs image-to-image based on whether referenceImageUrls are provided
const endpoint = referenceImageUrls.length > 0
  ? 'fal-ai/nano-banana-pro/edit'   // image-to-image
  : 'fal-ai/nano-banana-pro';       // text-to-image
```

**Write verification (catches silent FUSE failures):**
```typescript
fs.writeFileSync(outputPath, buffer);
const stat = fs.statSync(outputPath);
if (stat.size !== buffer.length) {
  console.error(`Write verification failed: expected ${buffer.length}, got ${stat.size}`);
}
```

**Artifact tracking via JSONL (one file per turn, cleared after):**
```typescript
// After each image is saved:
fs.appendFileSync('/app/generated-images.jsonl',
  JSON.stringify({ filename, path: outputPath }) + '\n'
);

// In writeCompletionMarker(), read this file for the turn's images, then clear it
```

**Returning filepath so the agent can inspect its own output:**
```typescript
return {
  content: [{ type: 'text', text: JSON.stringify({
    images: [{ filename, filepath, url, hookType, prompt, ...metadata }]
  })}]
};
// The agent can then use Read tool on `filepath` to inspect the generated image
```

**Rate limiting between API calls:**
```typescript
// 500ms delay between requests to avoid rate limiting
await new Promise(resolve => setTimeout(resolve, 500));
```
