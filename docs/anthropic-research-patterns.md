# Anthropic Research Patterns: Deep Research & Agentic Architecture

> Compiled 2026-02-24 from Anthropic's published engineering blog posts, product announcements, and documentation.

## Table of Contents

1. [Sources](#sources)
2. [Core Philosophical Principles](#core-philosophical-principles)
3. [The Augmented LLM Building Block](#the-augmented-llm-building-block)
4. [Workflow Patterns (from "Building Effective Agents")](#workflow-patterns)
5. [Autonomous Agent Pattern](#autonomous-agent-pattern)
6. [Multi-Agent Architecture for Research](#multi-agent-architecture-for-research)
7. [Claude's Research Feature: Product Architecture](#claudes-research-feature-product-architecture)
8. [Context Engineering for Agents](#context-engineering-for-agents)
9. [Tool Design Principles](#tool-design-principles)
10. [Single-Agent vs Multi-Agent Decision Framework](#single-agent-vs-multi-agent-decision-framework)
11. [Quality Control & Evaluation](#quality-control--evaluation)
12. [Long-Running Agent Harnesses](#long-running-agent-harnesses)
13. [The Claude Agent SDK Loop](#the-claude-agent-sdk-loop)
14. [Key Takeaways for Building Research Agents](#key-takeaways-for-building-research-agents)

---

## Sources

All findings synthesized from these primary Anthropic publications:

| # | Title | URL | Date |
|---|-------|-----|------|
| 1 | Building Effective Agents | https://www.anthropic.com/engineering/building-effective-agents | Dec 2024 |
| 2 | Building agents with the Claude Agent SDK | https://claude.com/blog/building-agents-with-the-claude-agent-sdk | Sep 2025 |
| 3 | Building multi-agent systems: When and how to use them | https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them | Jan 2026 |
| 4 | How we built our multi-agent research system | https://www.anthropic.com/engineering/multi-agent-research-system | 2026 |
| 5 | Effective context engineering for AI agents | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | Sep 2025 |
| 6 | Writing effective tools for AI agents -- using AI agents | https://www.anthropic.com/engineering/writing-tools-for-agents | 2025 |
| 7 | Effective harnesses for long-running agents | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents | 2026 |
| 8 | Claude takes research to new places (product announcement) | https://claude.com/blog/research | Apr 2025 |
| 9 | Using Research on Claude (Help Center) | https://support.claude.com/en/articles/11088861-using-research-on-claude | 2025 |

---

## Core Philosophical Principles

Anthropic's overarching guidance, repeated across all publications:

1. **Start simple, add complexity only when it demonstrably improves outcomes.** The most successful agent implementations use simple, composable patterns -- not complex frameworks or specialized libraries.

2. **Maintain simplicity in your agent's design.** Do not build agentic systems when a single optimized LLM call with retrieval and in-context examples is sufficient.

3. **Prioritize transparency** by explicitly showing the agent's planning steps.

4. **Carefully craft the agent-computer interface (ACI)** through thorough tool documentation and testing. Invest in ACI design as much as you would invest in human-computer interface (HCI) design.

5. **Workflows vs Agents** -- an important architectural distinction:
   - **Workflows**: LLMs and tools orchestrated through *predefined* code paths. Offer predictability and consistency.
   - **Agents**: LLMs *dynamically direct* their own processes and tool usage, maintaining control over how they accomplish tasks. Better when flexibility and model-driven decision-making are needed.

6. **Frameworks can help but understand what's underneath.** Incorrect assumptions about abstraction layers are a common source of error. Use LLM APIs directly when possible; many patterns can be implemented in a few lines of code.

---

## The Augmented LLM Building Block

The foundational unit of all agentic systems is an LLM enhanced with:

- **Retrieval** -- the model generates its own search queries
- **Tools** -- the model selects appropriate tools and invokes them
- **Memory** -- the model determines what information to retain

Anthropic recommends focusing on: (a) tailoring these capabilities to your specific use case, and (b) ensuring they provide an easy, well-documented interface for your LLM. The Model Context Protocol (MCP) is their recommended integration standard for third-party tools.

---

## Workflow Patterns

These are the five composable workflow patterns Anthropic identifies (from Source 1). They are building blocks, not prescriptive -- they should be shaped and combined to fit different use cases.

### Pattern 1: Prompt Chaining

**What**: Decompose a task into a sequence of steps, where each LLM call processes the output of the previous one. Programmatic checks ("gates") can be added on intermediate steps.

**When to use**: Task can be easily decomposed into fixed subtasks. Trades latency for higher accuracy by making each LLM call an easier task.

**Examples**:
- Generate marketing copy, then translate it
- Write document outline, verify it meets criteria, then write the document

### Pattern 2: Routing

**What**: Classify an input and direct it to a specialized followup task. Allows separation of concerns and building more specialized prompts.

**When to use**: Complex tasks with distinct categories better handled separately, where classification can be handled accurately.

**Examples**:
- Route customer service queries (general, refund, technical) to different processes/prompts/tools
- Route easy questions to smaller models (Haiku) and hard questions to capable models (Sonnet/Opus)

### Pattern 3: Parallelization

**What**: LLMs work simultaneously on a task with outputs aggregated programmatically. Two key variations:
- **Sectioning**: Breaking a task into independent subtasks run in parallel
- **Voting**: Running the same task multiple times for diverse outputs

**When to use**: Divided subtasks can be parallelized for speed, or multiple perspectives/attempts needed for higher confidence.

**Examples**:
- Guardrails: one model instance handles user queries while another screens for inappropriate content
- Code review: several different prompts review for vulnerabilities
- Content moderation: multiple prompts evaluate different aspects

### Pattern 4: Orchestrator-Workers

**What**: A central LLM dynamically breaks down tasks, delegates them to worker LLMs, and synthesizes their results.

**When to use**: Complex tasks where you cannot predict the subtasks needed. The key difference from parallelization is *flexibility* -- subtasks aren't pre-defined, but determined by the orchestrator based on specific input.

**Examples**:
- Coding products making complex changes to multiple files
- **Search tasks involving gathering and analyzing information from multiple sources** (this is the pattern used for deep research)

### Pattern 5: Evaluator-Optimizer

**What**: One LLM call generates a response while another provides evaluation and feedback in a loop.

**When to use**: Clear evaluation criteria exist, and iterative refinement provides measurable value. Two signs of good fit: (1) LLM responses can be demonstrably improved when feedback is articulated, (2) the LLM can provide such feedback.

**Examples**:
- Literary translation with nuance refinement
- **Complex search tasks requiring multiple rounds of searching and analysis, where the evaluator decides whether further searches are warranted**

---

## Autonomous Agent Pattern

Agents begin with either a command from, or interactive discussion with, the human user. Once the task is clear, they plan and operate independently.

**Key principles**:
- During execution, agents must gain "ground truth" from the environment at each step (tool call results, code execution) to assess progress
- Agents can pause for human feedback at checkpoints or when encountering blockers
- Tasks terminate upon completion or at stopping conditions (e.g., maximum iterations)
- Agents are typically just **LLMs using tools based on environmental feedback in a loop**

**When to use**: Open-ended problems where you cannot predict the required number of steps and cannot hardcode a fixed path. You must have some level of trust in the LLM's decision-making.

**Cost/risk**: Higher costs and potential for compounding errors. Extensive testing in sandboxed environments recommended, along with appropriate guardrails.

---

## Multi-Agent Architecture for Research

This is the most detailed and critical section, drawn primarily from Source 4 ("How we built our multi-agent research system").

### Why Multi-Agent for Research

Research involves open-ended problems where steps cannot be predicted in advance. The process is inherently dynamic and path-dependent. Researchers continuously update their approach based on discoveries.

**Key insight**: The essence of search is *compression* -- distilling insights from a vast corpus. Subagents facilitate compression by operating in parallel with their own context windows, exploring different aspects simultaneously before condensing the most important tokens for the lead agent.

**Performance data**:
- A multi-agent system with Claude Opus 4 (lead) + Claude Sonnet 4 (subagents) outperformed single-agent Claude Opus 4 by **90.2%** on internal research evaluations
- On the BrowseComp evaluation, **token usage alone explains 80% of performance variance**, with number of tool calls and model choice as the other two factors
- Multi-agent systems use approximately **15x more tokens** than chat interactions (agents use ~4x, multi-agent uses ~15x)
- Upgrading to a better model is a larger performance gain than doubling the token budget

### Architecture Overview

The system uses an **orchestrator-worker pattern**:

```
User Query
    |
    v
Lead Researcher Agent (Claude Opus 4)
    |
    |-- [Extended Thinking: plan approach, decide subagent count]
    |-- [Save plan to Memory (external persistence)]
    |
    |-- Spawn Subagent 1 (Claude Sonnet 4) --> [web_search, read_document] --> return findings
    |-- Spawn Subagent 2 (Claude Sonnet 4) --> [web_search, read_document] --> return findings
    |-- Spawn Subagent N (Claude Sonnet 4) --> [web_search, ...] --> return findings
    |
    v
Lead Researcher synthesizes results
    |
    |-- [Decides if more research needed]
    |-- [If yes: spawn more subagents or refine strategy]
    |-- [If no: compile final answer]
    |
    v
Citation Agent --> [processes documents + report, identifies citation locations]
    |
    v
Final Research Results with Citations --> User
```

### Detailed Process Flow

1. **User submits query** to the system
2. **LeadResearcher agent** is created, enters iterative research process
3. LeadResearcher uses **extended thinking** to plan approach
4. Plan is saved to **Memory** (external persistence) -- critical because if context window exceeds 200K tokens it will be truncated, and the plan must persist
5. LeadResearcher creates **specialized Subagents** (variable number) with specific research tasks
6. Each **Subagent independently**:
   - Performs web searches
   - Evaluates tool results using **interleaved thinking**
   - Returns findings to LeadResearcher
7. LeadResearcher **synthesizes results** and decides if more research needed
   - If yes: create additional subagents or refine strategy
   - If no: proceed to citation
8. **CitationAgent** processes documents and research report to identify specific citation locations
9. Final results with citations returned to user

### Key Architectural Differences from RAG

Traditional RAG uses **static retrieval** -- fetch chunks similar to an input query, generate response. Anthropic's architecture uses **multi-step dynamic search** that:
- Dynamically finds relevant information
- Adapts to new findings during the process
- Analyzes results to formulate high-quality answers
- Is iterative and path-dependent

### Prompt Engineering Principles for Research Agents

These are the specific lessons Anthropic learned building the research system:

#### 1. Think like your agents
Build simulations with exact prompts and tools, then watch agents work step-by-step. This reveals failure modes: agents continuing when they already have sufficient results, using overly verbose search queries, selecting incorrect tools. Develop an accurate mental model of the agent.

#### 2. Teach the orchestrator how to delegate
Each subagent needs:
- An **objective**
- An **output format**
- **Guidance on tools and sources** to use
- **Clear task boundaries**

Without detailed task descriptions, agents duplicate work, leave gaps, or fail to find necessary information. Short instructions like "research the semiconductor shortage" led to subagents misinterpreting the task or performing the exact same searches.

#### 3. Scale effort to query complexity
Embed scaling rules in prompts:
- **Simple fact-finding**: 1 agent, 3-10 tool calls
- **Direct comparisons**: 2-4 subagents, 10-15 calls each
- **Complex research**: 10+ subagents with clearly divided responsibilities

Without explicit guidelines, agents commonly overinvest in simple queries.

#### 4. Tool design and selection are critical
Agent-tool interfaces are as critical as human-computer interfaces. Give agents explicit heuristics:
- Examine all available tools first
- Match tool usage to user intent
- Search the web for broad external exploration
- Prefer specialized tools over generic ones

Bad tool descriptions send agents down completely wrong paths.

#### 5. Let agents improve themselves
Claude 4 models can be excellent prompt engineers. When given a prompt and a failure mode, they diagnose why the agent is failing and suggest improvements. A tool-testing agent that tests a flawed MCP tool and rewrites its description resulted in a **40% decrease in task completion time** for future agents.

#### 6. Start wide, then narrow down
Search strategy should mirror expert human research: explore the landscape before drilling into specifics. Agents default to overly long, specific queries that return few results. Prompt agents to start with short, broad queries, evaluate what's available, then progressively narrow focus.

#### 7. Guide the thinking process
**Extended thinking** serves as a controllable scratchpad for the lead agent -- planning approach, assessing which tools fit, determining query complexity and subagent count, defining each subagent's role. **Interleaved thinking** helps subagents evaluate quality after tool results, identify gaps, and refine next query.

#### 8. Parallel tool calling transforms speed and performance
Two kinds of parallelization:
1. Lead agent spins up 3-5 subagents in parallel
2. Subagents use 3+ tools in parallel

These changes cut research time by **up to 90%** for complex queries.

### Subagent Output to Filesystem

A critical optimization: rather than requiring subagents to communicate everything through the lead agent, implement **artifact systems** where specialized agents create outputs that persist independently. Subagents call tools to store work in external systems, then pass lightweight references back to the coordinator. This prevents information loss during multi-stage processing and reduces token overhead.

---

## Claude's Research Feature: Product Architecture

From the product announcement and help center (Sources 8, 9):

- **Behavior**: Claude operates agentically, conducting multiple searches that build on each other while determining exactly what to investigate next
- **Scope**: Searches across web, Google Workspace (Gmail, Calendar, Docs), and connected integrations (Jira, Confluence, Zapier, Cloudflare, Intercom, Asana, Square, Sentry, PayPal, Linear, Plaid)
- **Duration**: 5-45 minutes depending on query complexity
- **Output**: Comprehensive answers with inline citations for verification
- **Technique**: Explores different angles automatically, works through open questions systematically
- **Available on**: Max, Team, and Enterprise tiers

---

## Context Engineering for Agents

From Source 5 ("Effective context engineering for AI agents"). This is Anthropic's framework for managing the information that powers agents.

### Core Principle

Context engineering is about finding the **smallest possible set of high-signal tokens** that maximize the likelihood of some desired outcome, given that LLMs have a finite "attention budget."

### Why Context Matters

- **Context rot**: As tokens increase, the model's ability to accurately recall information decreases
- This is due to the transformer's n-squared pairwise attention relationships stretching thin
- Models trained on shorter sequences have less experience with long-range dependencies
- Performance degrades as a gradient, not a cliff -- but thoughtful curation is essential

### Context Components and Best Practices

#### System Prompts
- Use extremely clear, direct language at the "right altitude"
- Avoid two failure modes:
  - Too brittle: hardcoded complex if-else logic
  - Too vague: high-level guidance that lacks concrete signals
- Strive for the **minimal set of information that fully outlines expected behavior**
- Start with minimal prompt on best model, then add instructions based on failure modes

#### Tools
- Should be self-contained, robust to error, extremely clear about intended use
- Most common failure: bloated tool sets with too much functionality or ambiguous decision points
- If a human engineer cannot definitively say which tool to use, the agent cannot either

#### Examples (Few-Shot)
- Do NOT stuff a laundry list of edge cases
- Curate a set of diverse, canonical examples that portray expected behavior
- Examples are the "pictures" worth a thousand words for LLMs

### Context Retrieval Strategies

#### Just-In-Time Context (preferred for agents)
Instead of pre-processing all relevant data, agents maintain **lightweight identifiers** (file paths, stored queries, web links) and use these to dynamically load data at runtime using tools.

**Claude Code example**: The model writes targeted queries, stores results, uses bash commands like head and tail to analyze large data volumes without loading full objects into context.

This mirrors human cognition: we don't memorize entire corpuses but use organization systems (file systems, bookmarks) to retrieve information on demand.

#### Progressive Disclosure
Agents incrementally discover relevant context through exploration. Each interaction yields context that informs the next decision: file sizes suggest complexity, naming conventions hint at purpose, timestamps proxy for relevance.

#### Hybrid Strategy
Some data retrieved up front for speed, further autonomous exploration at agent's discretion. Claude Code uses this: CLAUDE.md files are dropped into context up front, while glob/grep allow just-in-time navigation.

### Long-Horizon Context Management

Three techniques for when token count exceeds the context window:

#### 1. Compaction
Summarize conversation contents near context limit, reinitiate new context window with the summary. The model preserves architectural decisions, unresolved bugs, and implementation details while discarding redundant tool outputs.

**Key detail**: Start by maximizing recall (capture every relevant piece), then iterate to improve precision (eliminate superfluous content). A safe lightweight form is **tool result clearing** -- once a tool has been called deep in history, the raw result is no longer needed.

#### 2. Structured Note-Taking (Agentic Memory)
Agent regularly writes notes persisted to external memory outside the context window. Notes are pulled back in at later times. Like maintaining a to-do list or NOTES.md file.

**Example**: Claude playing Pokemon maintains precise tallies across thousands of game steps, develops maps, remembers key achievements, maintains strategic notes -- all through self-directed note-taking.

#### 3. Sub-Agent Architectures
Specialized sub-agents handle focused tasks with clean context windows. Each might explore using tens of thousands of tokens but returns only a condensed summary (1,000-2,000 tokens). Achieves separation of concerns: detailed search context remains isolated within sub-agents.

### When to Use Which

- **Compaction**: Tasks requiring extensive back-and-forth conversational flow
- **Note-taking**: Iterative development with clear milestones
- **Multi-agent**: Complex research and analysis where parallel exploration pays dividends

---

## Tool Design Principles

From Source 6 ("Writing effective tools for AI agents").

### Fundamental Reorientation

Tools are a **new kind of software** reflecting a contract between deterministic systems and non-deterministic agents. When a user asks "Should I bring an umbrella today?", an agent might call a weather tool, answer from knowledge, or ask a clarifying question. Tools must be designed for agents, not for other developers or systems.

### Key Principles

#### 1. Choose the right tools (and NOT to implement)
- More tools do not always lead to better outcomes
- Avoid wrapping every API endpoint -- agents have different affordances than traditional software
- Build a few thoughtful tools targeting specific high-impact workflows
- Tools can consolidate functionality, handling multiple discrete operations under the hood

**Examples of good consolidation**:
- Instead of list_users + list_events + create_event, implement `schedule_event` that finds availability and schedules
- Instead of read_logs, implement `search_logs` that returns only relevant lines with surrounding context
- Instead of get_customer_by_id + list_transactions + list_notes, implement `get_customer_context` that compiles all relevant information at once

#### 2. Namespace your tools
Group related tools under common prefixes (e.g., asana_search, jira_search, asana_projects_search). This helps agents select the right tools when dozens of MCP servers and hundreds of tools are available. Prefix vs suffix naming has non-trivial effects -- choose based on evaluation.

#### 3. Return meaningful context
- Prioritize contextual relevance over flexibility
- Avoid low-level identifiers (uuid, 256px_image_url, mime_type)
- Prefer semantically meaningful fields (name, image_url, file_type)
- Resolving arbitrary alphanumeric UUIDs to human-readable language significantly improves precision and reduces hallucinations
- Consider a `response_format` enum (e.g., "concise" vs "detailed") to control verbosity

#### 4. Optimize for token efficiency
- Implement pagination, range selection, filtering, truncation with sensible defaults
- Claude Code restricts tool responses to 25,000 tokens by default
- If truncating, provide helpful instructions steering agents toward more efficient strategies (e.g., "make many small targeted searches instead of one broad search")
- Error responses should communicate specific, actionable improvements -- not opaque error codes

#### 5. Prompt-engineer tool descriptions
- Think of how you would describe the tool to a new hire on your team
- Make implicit context explicit: specialized query formats, niche terminology definitions, resource relationships
- Even small refinements to tool descriptions can yield dramatic improvements (Claude Sonnet 3.5 achieved SOTA on SWE-bench after precise description refinements)
- Avoid ambiguity: instead of a parameter named `user`, use `user_id`

### Tool Format Recommendations (from Source 1, Appendix 2)

- Give the model enough tokens to "think" before it writes itself into a corner
- Keep the format close to what the model has seen naturally in internet text
- Ensure no formatting "overhead" (e.g., having to keep an accurate count of lines, or string-escaping code)
- **Always require absolute filepaths** -- relative filepaths cause errors when agents move directories
- The "poka-yoke" principle: change arguments so that it is harder to make mistakes

---

## Single-Agent vs Multi-Agent Decision Framework

From Source 3 ("Building multi-agent systems").

### Default to Single Agent

A well-designed single agent with appropriate tools can accomplish far more than many developers expect. Multi-agent systems introduce overhead: every additional agent is another potential point of failure, another set of prompts to maintain, another source of unexpected behavior.

**Critical finding**: At Anthropic, teams invested months building elaborate multi-agent architectures only to discover that improved prompting on a single agent achieved equivalent results.

**Token overhead**: Multi-agent implementations typically use **3-10x more tokens** than single-agent approaches for equivalent tasks, due to duplicating context, coordination messages, and summarizing results for handoffs.

### Three Situations Where Multi-Agent Wins

#### 1. Context Protection (Context Pollution)
When an agent's context accumulates irrelevant information from one subtask that degrades subsequent subtasks. Subagents provide isolation -- each operates in its own clean context.

**Best when**: Subtasks generate high context volume (1000+ tokens) but most is irrelevant to the main task; the subtask is well-defined with clear criteria for what to extract; operations are lookup/retrieval that require filtering before use.

#### 2. Parallelization
Running multiple agents in parallel to explore a larger search space. The primary benefit is **thoroughness, not speed**. Higher token usage and often longer total execution time in exchange for more comprehensive results.

**This is the pattern used for Claude's Research feature.**

#### 3. Specialization
Different tasks benefit from different tool sets, system prompts, or domain expertise. Three signals that specialization would help:
- **Quantity**: Agent has 20+ tools and struggles to select the right one
- **Domain confusion**: Tools span multiple unrelated domains
- **Degraded performance**: Adding new tools degrades performance on existing tasks

### Context-Centric Decomposition (Critical)

The most important design decision for multi-agent systems is **how to divide work between agents**. Teams frequently get this wrong.

**Problem-centric decomposition (often counterproductive)**: Dividing by type of work (one agent writes features, another writes tests, a third reviews). Creates constant coordination overhead and context loss at each handoff.

**Context-centric decomposition (usually effective)**: Dividing by context boundaries. An agent handling a feature should also handle its tests because it already has the necessary context. Only split work when context can be truly isolated.

**Effective decomposition boundaries**:
- Independent research paths (e.g., "market trends in Asia" vs "market trends in Europe")
- Separate components with clean interfaces (frontend vs backend with defined API contract)
- Blackbox verification (verifier only needs to run tests and report results)

**Problematic boundaries**:
- Sequential phases of the same work (planning, implementation, testing of same feature)
- Tightly coupled components requiring constant back-and-forth
- Work requiring shared state with frequent synchronization

### The Verification Subagent Pattern

A dedicated agent whose sole responsibility is testing or validating the main agent's work. Consistently works well because:
- Verification requires minimal context transfer (no "telephone game" problem)
- A verifier can blackbox-test without needing the full history

**The "early victory" problem**: Verifiers often run one or two tests, see them pass, and declare success. Mitigation:
- Specify concrete criteria ("Run the full test suite and report all failures")
- Require testing multiple scenarios and edge cases
- Direct verifier to attempt inputs that should fail
- Explicit instruction: "You MUST run the complete test suite before marking as passed"

### Signals to Outgrow Single-Agent

- Approaching context limits with degraded performance
- Managing 15-20+ tools (consider Tool Search Tool first -- reduces token usage by up to 85%)
- Tasks with naturally parallelizable subtasks

---

## Quality Control & Evaluation

### Evaluation Principles for Research Agents (from Source 4)

#### 1. Start evaluating immediately with small samples
In early development, changes have dramatic impacts (30% to 80% success rate). Start with ~20 queries representing real usage patterns. Do not delay building evals -- small-scale testing right away beats delayed comprehensive evals.

#### 2. LLM-as-judge evaluation scales when done well
Research outputs are free-form text with rarely a single correct answer. Use an LLM judge evaluating against criteria in a rubric:
- **Factual accuracy**: Do claims match sources?
- **Citation accuracy**: Do cited sources match claims?
- **Completeness**: Are all requested aspects covered?
- **Source quality**: Primary sources over lower-quality secondary sources?
- **Tool efficiency**: Right tools, reasonable number of times?

A single LLM call with a single prompt outputting scores 0.0-1.0 and pass-fail was most consistent and aligned with human judgements. Especially effective when test cases have a clear answer.

#### 3. Human evaluation catches what automation misses
Human testers find edge cases: hallucinated answers on unusual queries, system failures, subtle source selection biases. Example: early agents consistently chose SEO-optimized content farms over authoritative but less highly-ranked sources (academic PDFs, personal blogs). Adding source quality heuristics to prompts helped resolve this.

#### 4. Multi-agent systems have emergent behaviors
Small changes to the lead agent can unpredictably change subagent behavior. Success requires understanding interaction patterns, not just individual agent behavior. The best prompts are frameworks for collaboration defining division of labor, problem-solving approaches, and effort budgets.

### Evaluation for Tool Design (from Source 6)

- Generate evaluation tasks grounded in real-world uses with realistic data
- Avoid overly simplistic "sandbox" environments
- Strong tasks require multiple tool calls (potentially dozens)
- Each prompt paired with a verifiable response/outcome
- Run evaluations programmatically with simple agentic loops
- Collect metrics: runtime, total tool calls, token consumption, tool errors
- Track tool calling patterns to reveal common workflows
- Use held-out test sets to ensure no overfitting

### Self-Verification (from Source 2, Claude Agent SDK)

Three approaches for agents to verify their own work:

1. **Defining rules**: Provide clearly defined rules for output, explain which rules failed and why. Code linting is excellent rules-based feedback. TypeScript > JavaScript because it provides additional feedback layers.

2. **Visual feedback**: For visual tasks (UI generation, testing), screenshots or renders fed back to the model for visual verification and iterative refinement. Check layout, styling, content hierarchy, responsiveness.

3. **LLM as judge**: Another model judges the output based on fuzzy rules. Not very robust and has heavy latency tradeoffs, but useful when any performance boost is worth the cost.

---

## Long-Running Agent Harnesses

From Source 7 ("Effective harnesses for long-running agents").

### The Core Problem

Long-running agents must work in discrete sessions. Each new session begins with no memory of what came before. Even with compaction, two failure modes emerge:

1. **Agent tries to do too much at once** -- attempts to one-shot the app, runs out of context mid-implementation, leaves environment in broken state
2. **Agent declares victory too early** -- sees some progress, marks job as done

### Two-Part Solution

#### Initializer Agent (first session only)
Sets up the environment with:
- An `init.sh` script (how to run the dev server, basic tests)
- A `claude-progress.txt` file (log of what agents have done)
- A comprehensive **feature list file** (JSON, not Markdown -- model is less likely to inappropriately change JSON). All features initially marked as "failing"
- An initial git commit showing what files were added

#### Coding Agent (every subsequent session)
Makes incremental progress while leaving environment clean:
1. Run `pwd` to see working directory
2. Read git logs and progress files to get up to speed
3. Read features list, choose highest-priority unfinished feature
4. Work on **one feature at a time** (critical for preventing one-shotting)
5. Commit progress to git with descriptive messages
6. Write progress summaries
7. Mark features as passing only after careful end-to-end testing

### Key Insights

- **Incremental progress is critical** -- agent must work on only one feature at a time
- **Clean state after each session** -- code appropriate for merging to main branch
- **Structured progress tracking** -- JSON feature lists + git history + progress notes
- **End-to-end testing** -- agent must verify features as a human user would (e.g., using browser automation tools like Puppeteer MCP for web apps)
- **Getting up to speed protocol** -- read progress file, git log, run basic test before starting new work

### Production Reliability (from Source 4)

#### Agents are stateful and errors compound
Minor system failures can be catastrophic. Build systems that can **resume from where the agent was** when errors occurred. Use the model's intelligence to handle issues gracefully -- letting the agent know when a tool is failing and letting it adapt works surprisingly well. Combine AI adaptability with deterministic safeguards (retry logic, regular checkpoints).

#### Debugging benefits from new approaches
Full production tracing to diagnose why agents failed. Monitor agent decision patterns and interaction structures (without monitoring individual conversation contents for privacy). High-level observability helps diagnose root causes, discover unexpected behaviors, fix common failures.

#### Deployment needs careful coordination
Agent systems are highly stateful webs of prompts, tools, and execution logic running almost continuously. Use **rainbow deployments** to avoid disrupting running agents -- gradually shift traffic from old to new versions while keeping both running.

---

## The Claude Agent SDK Loop

From Source 2 ("Building agents with the Claude Agent SDK").

### Core Design Principle

Give your agents a computer, allowing them to work like humans do. By providing tools to run bash commands, edit files, create files, and search files, Claude can read CSVs, search the web, build visualizations, interpret metrics, and do all sorts of digital work.

### The Agent Loop

```
Gather Context --> Take Action --> Verify Work --> Repeat
```

### Context Gathering Mechanisms

1. **Agentic search and the file system**: The file/folder structure becomes a form of context engineering. Agent uses bash scripts like grep and tail to selectively load data.

2. **Semantic search**: Faster than agentic search but less accurate, harder to maintain, less transparent. Involves chunking, embedding, vector querying. Start with agentic search; add semantic search only if you need faster results.

3. **Subagents**: Useful for parallelization (spin up multiple subagents on different tasks) and context management (subagents use isolated context windows, send only relevant information back to orchestrator). Ideal for sifting through large information where most won't be useful.

4. **Compaction**: Automatically summarizes previous messages when context limit approaches. Critical for long-running agents.

### Action Mechanisms

1. **Tools**: Primary building blocks. Prominent in Claude's context window, so they are the primary actions Claude considers. Be conscious about design to maximize context efficiency.

2. **Bash & scripts**: General-purpose tool for flexible work using a computer. Agent can write code to download, convert, and search through files.

3. **Code generation**: Code is precise, composable, and reusable -- an ideal output for agents needing complex operations reliably. Claude's file creation in Claude.AI relies entirely on code generation (Python scripts for Excel, PowerPoint, Word).

4. **MCPs**: Standardized integrations to external services. Handle authentication and API calls automatically. Growing ecosystem of pre-built integrations.

---

## Key Takeaways for Building Research Agents

Synthesizing across all sources, these are the architectural principles most relevant to building research-capable agent systems:

### Architecture

1. **Use the orchestrator-worker pattern** for research tasks. A lead agent decomposes the query, spawns subagents for parallel investigation, synthesizes results.
2. **Lead agent should be the most capable model** (e.g., Opus). Subagents can be a cheaper, fast model (e.g., Sonnet).
3. **Use extended thinking** for the lead agent's planning phase. Use interleaved thinking for subagents' quality evaluation after tool results.
4. **Save the research plan to external memory** early -- context windows may be truncated.
5. **Each subagent gets a clean, isolated context** focused on its specific task. Returns only a condensed summary (1,000-2,000 tokens) of its findings.
6. **Add a citation agent** at the end to process documents and ensure proper attribution.

### Search Strategy

7. **Start wide, then narrow down** -- mirror expert human research. Begin with short, broad queries; evaluate available information; progressively narrow focus.
8. **Parallel tool calling is essential** -- both across subagents (3-5 in parallel) and within subagents (3+ tools in parallel). Can reduce research time by up to 90%.
9. **Dynamic multi-step search** rather than static RAG. Adapt to new findings, follow leads that emerge during investigation.

### Quality Control

10. **Scale effort to query complexity** with explicit rules embedded in prompts (simple: 1 agent/3-10 calls; complex: 10+ subagents).
11. **Use LLM-as-judge evaluation** with rubrics covering factual accuracy, citation accuracy, completeness, source quality, and tool efficiency.
12. **Guard against SEO bias** -- add source quality heuristics to prefer authoritative sources over content farms.
13. **Guard against early victory** -- require comprehensive validation before marking tasks complete.

### Context Management

14. **Treat context as a finite resource** with diminishing marginal returns. Every token depletes the "attention budget."
15. **Use compaction** for long-running tasks, preserving architectural decisions and unresolved issues while discarding redundant outputs.
16. **Use structured note-taking** for persistent memory across context windows.
17. **Use just-in-time context retrieval** -- maintain lightweight identifiers and load data on demand rather than pre-loading everything.

### Tool Design

18. **Fewer, better-designed tools** beat many mediocre ones. Consolidate related functionality.
19. **Tool descriptions matter enormously** -- invest as much in ACI as in HCI. Test with agents and iterate.
20. **Return token-efficient responses** -- implement pagination, filtering, truncation with helpful guidance in error messages.
21. **Let agents improve their own tools** -- agent-driven tool description refinement yielded 40% faster task completion.

### When NOT to Use Multi-Agent

22. **Default to single agent** -- improved prompting often achieves equivalent results to elaborate multi-agent architectures.
23. **Only go multi-agent when**: context pollution degrades performance, tasks can run in parallel, or specialization improves tool selection.
24. **Decompose by context boundaries, not by problem type** -- avoid the "telephone game" where information degrades at every handoff.
