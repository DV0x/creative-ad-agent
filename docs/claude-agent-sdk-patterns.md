# Claude Agent SDK & Anthropic Agent Patterns — Research Notes

> Compiled 2026-02-24. Sources: Anthropic engineering blog, official SDK docs, Claude API docs, and third-party analyses.

---

## Table of Contents

1. [The Claude Agent SDK](#1-the-claude-agent-sdk)
2. [The Agentic Loop — How the Inner Loop Works](#2-the-agentic-loop--how-the-inner-loop-works)
3. [Workflows vs. Agents — Architectural Spectrum](#3-workflows-vs-agents--architectural-spectrum)
4. [Tool Use Design for Agents](#4-tool-use-design-for-agents)
5. [Context Engineering — The Core Discipline](#5-context-engineering--the-core-discipline)
6. [Thinking, Extended Thinking, and the Think Tool](#6-thinking-extended-thinking-and-the-think-tool)
7. [Claude Code's Internal Architecture](#7-claude-codes-internal-architecture)
8. [Multi-Agent Research System](#8-multi-agent-research-system)
9. [Long-Running Agent Harnesses](#9-long-running-agent-harnesses)
10. [Self-Correction and Error Recovery](#10-self-correction-and-error-recovery)
11. [Orchestrator vs. Autonomous Agent Patterns](#11-orchestrator-vs-autonomous-agent-patterns)
12. [Key Takeaways for Our Project](#12-key-takeaways-for-our-project)

---

## 1. The Claude Agent SDK

The Claude Agent SDK (formerly "Claude Code SDK") gives developers programmatic access to the same tools, agentic loop, and context management that power Claude Code. Available in Python and TypeScript.

### Core API Surface

```python
# Python — minimal agent
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt="Find and fix the bug in auth.py",
    options=ClaudeAgentOptions(allowed_tools=["Read", "Edit", "Bash"]),
):
    print(message)
```

```typescript
// TypeScript — minimal agent
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix the bug in auth.py",
  options: { allowedTools: ["Read", "Edit", "Bash"] }
})) {
  console.log(message);
}
```

The key difference from the raw Anthropic Client SDK: **with the Agent SDK, Claude handles the tool loop autonomously**. You do not implement a while-loop polling for `stop_reason == "tool_use"` — the SDK does that internally.

### Built-in Tools

| Tool | Purpose |
|------|---------|
| **Read** | Read any file |
| **Write** | Create new files |
| **Edit** | Precise edits to existing files |
| **Bash** | Terminal commands, scripts, git |
| **Glob** | Find files by pattern |
| **Grep** | Search file contents with regex |
| **WebSearch** | Web search |
| **WebFetch** | Fetch and parse web pages |
| **AskUserQuestion** | Ask user clarifying questions |
| **Task** | Invoke subagents |

### Key Capabilities

- **Subagents**: Spawn specialized agents with isolated context windows, restricted tool access, and different models. Defined programmatically via `agents` parameter or as markdown files in `.claude/agents/`.
- **Sessions**: Maintain context across multiple `query()` calls. Resume sessions with `resume: sessionId`.
- **Hooks**: Run custom code at lifecycle points (PreToolUse, PostToolUse, Stop, SessionStart, SessionEnd, etc.) for validation, logging, or transformation.
- **MCP Integration**: Connect to external systems via Model Context Protocol (databases, browsers, APIs).
- **Permissions**: Control tool access — `bypassPermissions`, `acceptEdits`, or fine-grained per-tool control.
- **File Checkpointing**: Track file modifications and rewind to any previous state via checkpoint UUIDs.
- **Structured Output**: Return validated JSON matching a schema.
- **Skills/Commands/Memory**: CLAUDE.md files, `.claude/skills/`, `.claude/commands/` for project context.

### SDK vs. Client SDK

The Client SDK requires you to implement the tool execution loop yourself:

```python
# Client SDK: you implement the loop
response = client.messages.create(...)
while response.stop_reason == "tool_use":
    result = your_tool_executor(response.tool_use)
    response = client.messages.create(tool_result=result, **params)

# Agent SDK: Claude handles tools autonomously
async for message in query(prompt="Fix the bug in auth.py"):
    print(message)
```

---

## 2. The Agentic Loop — How the Inner Loop Works

### The Core Pattern: Think, Act, Observe, Repeat

At its most fundamental, every agent follows the same loop:

```
while has_tool_calls(response):
    1. THINK  — Claude decides what to do next
    2. ACT    — Claude calls one or more tools
    3. OBSERVE — Tool results come back as context
    4. REPEAT — Claude evaluates results, decides next step or stops
```

Anthropic's "Building Effective Agents" guide states: "Agents are typically just LLMs using tools based on environmental feedback in a loop." The loop terminates when Claude produces a text response without tool invocations.

### How Claude Decides What Tool to Call Next

Claude makes tool selection decisions based on:

1. **The current task** (system prompt + user prompt + conversation history)
2. **Available tools** (their names, descriptions, and input schemas)
3. **Prior tool results** (what information was already gathered)
4. **Interleaved thinking** (on Claude 4+ models with adaptive thinking, Claude reasons between each tool call)

The model does not use explicit planning algorithms — it relies on its training to select the next action. However, structured planning can be encouraged through:
- System prompt instructions to "think step by step"
- The **think tool** (a scratchpad for structured reasoning mid-loop)
- **Extended thinking** (deep reasoning before the first response)
- **TODO-based planning** (Claude Code uses TODO lists in notes files)

### The Agent SDK's Loop

The SDK's `query()` function encapsulates this entire loop. It:

1. Sends the prompt + tools to Claude
2. Receives a response (text or tool_use blocks)
3. If tool_use: executes the tool in a sandboxed environment
4. Feeds tool results back as the next user message
5. Repeats until Claude returns a text-only response (or hits limits)

The loop handles streaming, error recovery, permission checks, and hook callbacks at each step.

### Anthropic's Recommended Agentic Cycle (from SDK blog)

The SDK blog describes the cycle as: **"gather context -> take action -> verify work -> repeat."**

1. **Gather Context**: Search files, read code, explore with grep/glob, use subagents to sift large information sets
2. **Take Action**: Edit files, run commands, generate code, call APIs
3. **Verify Work**: Run tests, check output, use rules-based feedback, visual feedback (screenshots), or LLM-as-judge
4. **Repeat**: Continue until the task is complete or the agent determines it needs human input

---

## 3. Workflows vs. Agents — Architectural Spectrum

Anthropic draws a critical distinction between two types of agentic systems.

### Workflows

LLMs and tools orchestrated through **predefined code paths**. The developer controls the flow. Five composable patterns:

#### 1. Prompt Chaining
Sequential steps where each LLM call processes the output of the previous one. Programmable checkpoints between steps.

**When to use**: Task can be cleanly decomposed into fixed subtasks.
**Example**: Generate marketing copy, then translate it.

#### 2. Routing
Classify input and direct to specialized handlers. Enables optimization for distinct categories.

**When to use**: Different input types need fundamentally different processing.
**Example**: Customer service — route to refunds, technical support, or general inquiries.

#### 3. Parallelization
Two variants:
- **Sectioning**: Independent subtasks run simultaneously
- **Voting**: Same task run multiple times for diverse outputs

**Key insight**: "LLMs generally perform better when each consideration is handled by a separate LLM call."

#### 4. Orchestrator-Workers
A central LLM dynamically decomposes tasks and delegates to worker LLMs. **Subtasks are not pre-defined** — they're determined at runtime.

**When to use**: Complex tasks where scope depends on input (e.g., multi-file code changes).

#### 5. Evaluator-Optimizer
One LLM generates, another evaluates, in an iterative loop.

**When to use**: When feedback can demonstrably improve output quality.

### Agents (Autonomous)

LLMs **dynamically direct their own processes and tool usage**. The model controls the flow. The loop has no fixed number of steps — it continues until the task is done.

**When to use**: Open-ended problems where the number of steps is unpredictable.
**Trade-off**: Higher cost, latency, and compounding error risk vs. better performance on complex tasks.

### Anthropic's Advice

> "For many applications, optimizing single LLM calls with retrieval and in-context examples is usually enough."

Start simple. Add agentic complexity only when simpler approaches demonstrably underperform.

---

## 4. Tool Use Design for Agents

### Core Principle: Treat ACI Like HCI

Anthropic recommends treating the Agent-Computer Interface (ACI) with the same rigor as Human-Computer Interfaces. Practical guidelines:

### Tool Design Rules

1. **Self-contained with minimal overlap**: Each tool should have a clear, singular purpose. If a human would struggle to choose between two tools, so will the agent.
2. **Descriptive input parameters**: Parameter names and descriptions must be unambiguous.
3. **Token-efficient returns**: Tools should return the minimal useful information. Don't dump large payloads when a summary suffices.
4. **Natural format alignment**: Tool inputs/outputs should match patterns the model has seen in training data.
5. **No formatting overhead**: Avoid requiring the model to count lines, escape strings, or handle complex encoding.

### Advanced Tool Use Features

#### Programmatic Tool Calling (PTC)
Claude writes Python code to orchestrate multiple tools rather than making sequential API calls. Intermediate results stay outside the context window.

- **37% reduction** in average token usage (43,588 -> 27,297)
- Eliminates inference overhead by executing 20+ tool calls in a single code block
- Tools marked with `allowed_callers: ["code_execution_20250825"]`

#### Tool Use Examples
Add `input_examples` to tool definitions showing realistic usage patterns:
- Improved accuracy from **72% to 90%** on complex parameter handling

#### Deferred Tool Loading
Tools with `defer_loading: true` are only loaded after Claude searches for them via a Tool Search Tool. Enables accessing thousands of tools while consuming minimal upfront context tokens.

### The "Think" Tool — A Special-Purpose Tool

A lightweight scratchpad that lets Claude reason during tool chains without obtaining new information:

```json
{
  "name": "think",
  "description": "Use the tool to think about something. It will not obtain new information or change the database, but just append the thought to the log.",
  "input_schema": {
    "type": "object",
    "properties": {
      "thought": {
        "type": "string",
        "description": "A thought to think about."
      }
    },
    "required": ["thought"]
  }
}
```

**When to use the think tool** (vs. extended thinking):
- Complex sequential tool chains requiring analysis of each step's output
- Policy-heavy environments with detailed compliance requirements
- Sequential decision-making where errors compound

**Benchmarks**: On airline customer service scenarios (Tau Bench), the think tool with optimized prompting achieved a **54% relative improvement** over baseline.

---

## 5. Context Engineering — The Core Discipline

Anthropic's September 2025 engineering blog introduced "context engineering" as the successor to prompt engineering. Core definition:

> "Curating and maintaining the optimal set of tokens (information) during LLM inference."

### The Fundamental Constraint: Context Rot

As context windows expand, accuracy decreases when recalling information from larger contexts. This is an architectural constraint from the transformer's n-squared token relationships. **Context is finite and has diminishing returns.**

### Strategies

#### System Prompt Design — "The Right Altitude"
- **Too specific**: Brittle, breaks on edge cases
- **Too vague**: Assumes shared understanding the model doesn't have
- **Optimal**: Specific enough to guide behavior, flexible enough for the model to apply strong heuristics

#### Dynamic Context Retrieval (Just-In-Time)
Instead of pre-loading all relevant data, agents maintain lightweight identifiers (file paths, URLs) and dynamically retrieve needed information via tools at runtime. This mirrors human cognition.

**Claude Code exemplifies this**: CLAUDE.md files load initially (static context), while grep/glob enable runtime retrieval (dynamic context).

#### Compaction
Summarize conversation history when approaching context limits. Preserve critical details (architectural decisions, unresolved issues) while discarding redundant tool outputs.

- Trigger at ~80% capacity (e.g., ~160K of 200K tokens)
- Start by maximizing recall, then improve precision
- Use custom summary prompts to preserve critical information

#### Structured Note-Taking
Agents maintain persistent external memory files (NOTES.md, claude-progress.txt). Enables coherence across context resets without retaining everything in the context window.

#### Sub-Agent Architectures for Context Management
Specialized agents handle focused tasks with clean context windows, returning condensed summaries (1,000-2,000 tokens) to the main coordinator. This separates detailed exploration from high-level synthesis.

### Central Recommendation

> "Find the smallest set of high-signal tokens that maximize the likelihood of your desired outcome."

---

## 6. Thinking, Extended Thinking, and the Think Tool

Anthropic provides three distinct mechanisms for agent reasoning, each suited to different scenarios.

### Adaptive Thinking (Recommended for Claude 4.6+)

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=16000,
    thinking={"type": "adaptive"},  # Claude decides when/how much to think
    messages=[...]
)
```

Claude dynamically determines when and how much to use extended thinking based on request complexity.

**Effort levels** (soft guidance for thinking allocation):

| Level | Behavior |
|-------|----------|
| `max` | Always thinks, no constraints. Opus 4.6 only. |
| `high` (default) | Always thinks. Deep reasoning on complex tasks. |
| `medium` | Moderate thinking. May skip for simple queries. |
| `low` | Minimal thinking. Skips for simple tasks. |

**Critical for agents**: Adaptive thinking automatically enables **interleaved thinking** — Claude can think *between* tool calls, not just before the first response. This means:
- Claude reasons about tool results before deciding the next action
- Failed tool calls trigger reflection and strategy adjustment
- The model can self-correct mid-loop rather than repeating failed strategies

### Extended Thinking (Manual Mode)

```python
thinking={"type": "enabled", "budget_tokens": N}
```

Pre-planning before the first response. Fixed budget. Deprecated on Opus 4.6 / Sonnet 4.6 (use adaptive instead).

### The Think Tool (Runtime Scratchpad)

Operates *during* response generation, not before it. Used when Claude needs to process information from tool outputs mid-chain.

**Key distinction**: Extended thinking = pre-planning. Think tool = mid-execution reasoning about new information.

### When to Use Each

| Scenario | Mechanism |
|----------|-----------|
| Agentic workflow (multi-step tool use) | Adaptive thinking (interleaved) |
| Single complex reasoning task (math, code) | Extended thinking |
| Policy-heavy sequential decisions | Think tool + optimized prompt |
| Simple factual queries | No thinking (effort: low) |
| Pre-planning + mid-execution reasoning | Adaptive thinking (covers both) |

---

## 7. Claude Code's Internal Architecture

Claude Code itself is an agent. Understanding its architecture reveals Anthropic's production-tested patterns.

### Single-Threaded Master Loop (Codename: "nO")

The core is a classic while-loop:

```
while response contains tool_use blocks:
    execute tools
    feed results back
    get next response
```

**Design philosophy**: While competitors pursue multi-agent swarms, Anthropic built a single-threaded loop that does one thing obsessively well — think, act, observe, repeat.

Key properties:
- **Flat message history**: No threaded conversations or competing agent personas
- **Single main thread**: Avoids unpredictable behaviors from concurrent agents
- **Transparency and debuggability** prioritized over parallelism

### Real-Time Steering (Codename: "h2A")

An asynchronous dual-buffer queue that enables mid-task course correction:
- Pause/resume support
- User interjections mid-task without full restart
- New instructions injected into the active loop

### Tool System

- JSON tool calls flow to sandboxed execution environments
- Results return as plain text
- **No vector databases or embeddings** — Claude Code uses regex-powered search (like ripgrep) because Claude's inherent code understanding enables sophisticated regex crafting without search index overhead

### Planning: TODO-Based

Rather than complex planning algorithms, Claude Code uses TODO lists in notes files:
- Human-readable and transparent
- Persistent across context resets
- Updated as tasks complete

### Sub-Agent Policy

At most one sub-agent branch at a time. Prevents agent proliferation chaos while enabling problem decomposition. Sub-agents in the SDK:
- Cannot spawn their own sub-agents (no recursive spawning)
- Have isolated context windows
- Can use different models (e.g., Sonnet for workers, Opus for orchestrator)
- Return condensed results to the parent

### Context Management in Claude Code

- **CLAUDE.md files** load at session start (static context)
- **grep/glob tools** enable runtime retrieval (dynamic context)
- **Auto-compaction** at ~80% of context window capacity
- **.claudeignore** files exclude irrelevant directories
- **Subagent transcripts** stored separately, persist independently of main conversation compaction

---

## 8. Multi-Agent Research System

Anthropic's production research feature uses a multi-agent architecture documented in their June 2025 engineering blog.

### Architecture: Orchestrator-Worker

1. **Lead Researcher (Orchestrator)**: Plans research approach, saves strategy to memory, determines subagent count based on query complexity
2. **Subagents (Workers)**: Each explores a different research aspect in parallel, independently searching, reasoning, and citing sources
3. **Citation Agent**: Receives consolidated findings and handles source attribution

### Performance

- **90% improvement** over single-agent Claude Opus 4 when using multi-agent system
- **90% reduction in research time** from parallel subagent execution and parallel tool use within subagents
- ~15x more tokens than standard chat interactions

### Token Usage and Scaling

- Token usage explains **80% of performance variance** in browsing tasks
- Effort scaling: simple queries use 1 agent with 3-10 tool calls; complex research uses 10+ subagents
- Each subagent uses interleaved thinking to evaluate tool result quality and refine subsequent queries

### Prompt Engineering Lessons

1. **Effective delegation**: Subagents need clear objectives, output format, tool guidance, and task boundaries
2. **Iterative refinement**: Extended thinking helps agents plan; observability reveals failure modes
3. **Tool selection heuristics**: Clear rules prevent mismatched tool usage
4. **Source quality**: Early agents consistently chose SEO-optimized content farms over authoritative sources — required explicit quality heuristics

### Production Challenges

- **Compound errors**: Minor issues cascade — one step failing sends agents on entirely different trajectories
- **Error resilience**: System resumes from checkpoint states rather than restarting
- **Observability**: Full production tracing without monitoring conversation contents
- **Deployment**: Rainbow deployments (gradual traffic shifting) to avoid disrupting running agents
- **Current limitation**: Synchronous subagent execution constrains information flow; asynchronous execution is a future direction

---

## 9. Long-Running Agent Harnesses

Anthropic's engineering blog describes patterns for agents that work across hours or days, spanning multiple context windows.

### The Core Problem

Each new context window starts with no memory. Complex projects cannot complete within a single context window. Agents need to bridge the gap between sessions.

### Two-Part Solution

#### 1. Initializer Agent (First Session)
Specialized prompting that sets up infrastructure:
- Creates `init.sh` script for running development environments
- Generates `claude-progress.txt` for tracking work history
- Establishes initial git commits documenting file additions
- Produces comprehensive feature lists (200+ items) marked as "failing"

#### 2. Coding Agent (Subsequent Sessions)
Each session follows a structured protocol:
1. Check working directory
2. Read progress files and git history
3. Read feature requirements
4. Start development server
5. Run baseline functionality tests
6. Work on a single feature incrementally
7. Commit changes with descriptive messages
8. Update progress documentation before session end

### Critical Implementation Details

- **Feature lists in JSON, not Markdown**: Models are less likely to inappropriately modify JSON structures
- **Browser automation tools** (Puppeteer MCP) significantly outperform unit tests or curl for verification
- **Single-feature-per-session approach**: Prevents premature "done" declarations
- **Strong instructions** prevent agents from removing or editing requirements

### Failure Modes

| Problem | Prevention |
|---------|-----------|
| "One-shotting" entire projects | Structured feature list requiring incremental completion |
| Declaring done prematurely | Comprehensive feature tracking; single-feature-per-session |
| Broken code between sessions | Git commits + progress updates + startup testing |
| Inadequate verification | Explicit browser automation tool requirements |

---

## 10. Self-Correction and Error Recovery

### What Works

1. **Interleaved thinking**: Claude 4+ with adaptive thinking can reflect after a failed tool call and adjust strategy mid-loop, instead of repeating the same failed approach
2. **Checkpoint-based recovery**: Resume from checkpoint states rather than restarting entire processes
3. **Retry with exponential backoff**: For transient failures (API timeouts, rate limits)
4. **File checkpointing**: SDK tracks file modifications through Write/Edit/NotebookEdit tools; rewind to any checkpoint UUID
5. **Git-based recovery**: Frequent commits enable rollback to known-good states

### What Doesn't Work Well

Anthropic's own documentation and community observations reveal limitations:
- **Self-correction is not reliable for complex failures**: The agent may not proactively analyze available resources after self-inflicted mistakes
- **Meta-failure pattern**: Agents aware of their failure modes still reproduce them — self-awareness does not prevent the same errors
- **Compound errors in multi-agent systems**: A single step failure can send agents on entirely different trajectories

### Recommended Patterns

1. **Deterministic guardrails around non-deterministic agents**: Use hooks (PreToolUse, PostToolUse) for validation
2. **Rules-based feedback**: Formal checks (linting, type checking, test suites) that identify failures without LLM judgment
3. **Progressive verification**: Verify each step before proceeding (the "gather context -> act -> verify -> repeat" cycle)
4. **External memory**: Write decisions and rationale to files so future sessions can understand *why* certain approaches were taken, not just what was done

---

## 11. Orchestrator vs. Autonomous Agent Patterns

Anthropic supports both patterns, recommending different approaches for different use cases.

### Single-Loop Autonomous Agent (Claude Code Pattern)

**Architecture**: One agent, one loop, flat message history, TODO-based planning.

**Strengths**:
- Debuggable and transparent
- Predictable behavior
- No agent coordination overhead
- Works well for focused tasks (coding, analysis)

**Weaknesses**:
- Limited parallelism (at most one sub-agent at a time)
- Single context window constrains breadth
- Long-running tasks hit context limits

**Best for**: Coding tasks, focused analysis, single-domain work, interactive development.

### Orchestrator-Worker (Research System Pattern)

**Architecture**: Lead agent coordinates specialized subagents running in parallel.

**Strengths**:
- Parallel execution (3-5x or more speed improvement)
- Each agent has a clean, focused context window
- Can scale to 10+ subagents for complex tasks
- 90%+ improvement over single-agent on research tasks

**Weaknesses**:
- 15x token usage vs. chat
- Compound error risk
- More complex to debug and observe
- Synchronous coordination creates bottlenecks

**Best for**: Research tasks, parallel search, multi-file analysis, tasks with clear decomposition boundaries.

### Hybrid Approach

Many production systems combine both:
- Single main loop for orchestration
- Subagents for focused subtasks
- Main agent synthesizes results
- Different models for different roles (Opus for orchestrator, Sonnet for workers)

### Anthropic's Subagent Design Rules

From the SDK documentation:

1. **One job per subagent**: Clear, specific description of when to use each subagent
2. **Context isolation**: Subagents maintain separate context, preventing information overload
3. **Tool restrictions**: Limit subagents to only the tools they need (e.g., read-only for reviewers)
4. **No recursive spawning**: Subagents cannot spawn their own subagents
5. **Model selection**: Use cheaper/faster models for simple worker tasks, powerful models for complex orchestration

---

## 12. Key Takeaways for Our Project

### For the Creative Agent architecture specifically:

1. **Start with a single agentic loop**. The Agent SDK's `query()` handles the tool loop. Don't over-engineer with multi-agent patterns unless research/exploration parallelism is needed.

2. **Design tools as self-contained, token-efficient units**. Each MCP tool or built-in tool should have a clear purpose, minimal overlap, and return only what the agent needs.

3. **Use the think tool for complex campaign generation**. When the agent needs to reason about creative briefs, audience targeting, or multi-asset campaigns, the think tool provides mid-chain reasoning without new information retrieval.

4. **Context engineer aggressively**. Keep CLAUDE.md lean and high-signal. Use .claudeignore. Externalize persistent state (campaign history, user preferences) to files or DB rather than keeping it in context.

5. **For multi-step campaign workflows, consider the Orchestrator-Worker pattern**: A lead agent that plans the campaign strategy and delegates to specialized subagents (image generation, copywriting, hook writing) can improve quality and speed.

6. **Implement structured progress tracking** for long-running tasks. Use JSON-based progress files, frequent git commits, and clear session startup protocols.

7. **Adaptive thinking is the default choice** for agentic workflows on Claude 4.6+. It automatically enables interleaved thinking (reasoning between tool calls) which is critical for multi-step creative tasks.

8. **Verification is non-negotiable**. Every action should be followed by verification — whether through automated tests, visual inspection, or rules-based checks.

9. **File checkpointing** provides undo capability. Enable it for any agent that modifies user-facing files (creative assets, campaign configurations).

10. **Session management** enables multi-turn creative workflows. Capture session IDs and resume to maintain context across user interactions.

---

## Sources

- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Claude Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Anthropic: Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Anthropic: The "Think" Tool](https://www.anthropic.com/engineering/claude-think-tool)
- [Anthropic: How We Built Our Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Anthropic: Building Agents with the Claude Agent SDK](https://claude.com/blog/building-agents-with-the-claude-agent-sdk)
- [Anthropic: Introducing Advanced Tool Use](https://www.anthropic.com/engineering/advanced-tool-use)
- [Anthropic: Adaptive Thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Claude Agent SDK Subagents](https://platform.claude.com/docs/en/agent-sdk/subagents)
- [Claude Agent SDK Demos (GitHub)](https://github.com/anthropics/claude-agent-sdk-demos)
- [Claude Code Agent Architecture Analysis (ZenML)](https://www.zenml.io/llmops-database/claude-code-agent-architecture-single-threaded-master-loop-for-autonomous-coding)
- [Claude Code Master Agent Loop (PromptLayer)](https://blog.promptlayer.com/claude-code-behind-the-scenes-of-the-master-agent-loop/)
- [Claude Code System Prompts (GitHub)](https://github.com/Piebald-AI/claude-code-system-prompts)
