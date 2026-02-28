# Claude Code Agent Teams - Research Notes

> Research compiled 2026-02-24. Sources: official Anthropic docs, engineering blogs, community guides.

## Table of Contents

- [1. Overview and Launch Context](#1-overview-and-launch-context)
- [2. Architecture](#2-architecture)
- [3. Core Primitives (Tools)](#3-core-primitives-tools)
- [4. Custom Subagents (.claude/agents/)](#4-custom-subagents-claudeagents)
- [5. Agent SDK (Programmatic / Headless)](#5-agent-sdk-programmatic--headless)
- [6. Configuration and Enablement](#6-configuration-and-enablement)
- [7. Display Modes](#7-display-modes)
- [8. Hooks and Quality Gates](#8-hooks-and-quality-gates)
- [9. Orchestration Patterns](#9-orchestration-patterns)
- [10. Best Practices](#10-best-practices)
- [11. Limitations](#11-limitations)
- [12. Cost and Token Usage](#12-cost-and-token-usage)
- [13. Real-World Case Studies](#13-real-world-case-studies)
- [14. Agent Teams vs Subagents vs Manual Parallelism](#14-agent-teams-vs-subagents-vs-manual-parallelism)
- [15. Sources](#15-sources)

---

## 1. Overview and Launch Context

Agent teams (also known as "swarm mode") launched alongside Claude Opus 4.6 on **February 5, 2026**. The feature was discovered in Claude Code's binary in December 2025 before the official announcement.

Agent teams transform Claude Code from a single AI assistant into a **multi-agent orchestration system**. Multiple Claude instances work in parallel on a shared codebase, coordinated through a shared task list and peer-to-peer messaging.

The feature is **experimental and disabled by default**. It uses significantly more tokens than a single session.

Key mental model: one session is the **team lead** (coordinator). It spawns **teammates** (independent Claude Code sessions), each with their own context window. Teammates communicate directly with each other and coordinate through a shared task list.

---

## 2. Architecture

### Components

| Component      | Role                                                                  |
|----------------|-----------------------------------------------------------------------|
| **Team lead**  | Main Claude Code session that creates the team, spawns teammates, coordinates |
| **Teammates**  | Separate Claude Code instances, each with independent context windows |
| **Task list**  | Shared work items stored at `~/.claude/tasks/{team-name}/`            |
| **Mailbox**    | Messaging system for inter-agent communication                       |
| **Team config**| Stored at `~/.claude/teams/{team-name}/config.json`                   |

### File System Layout

```
~/.claude/
  teams/{team-name}/
    config.json          # Members array: name, agentId, agentType
    messages/{session-id}/  # Inbox per agent
  tasks/{team-name}/
    1.json               # Individual task files
    2.json
    ...
```

### Environment Variables (Auto-set for teammates)

```
CLAUDE_CODE_TEAM_NAME="my-project"
CLAUDE_CODE_AGENT_ID="worker-1@my-project"
CLAUDE_CODE_AGENT_NAME="worker-1"
CLAUDE_CODE_AGENT_TYPE="Explore"
CLAUDE_CODE_AGENT_COLOR="#4A90D9"
CLAUDE_CODE_PLAN_MODE_REQUIRED="false"
CLAUDE_CODE_PARENT_SESSION_ID="session-xyz"
```

### Permissions

Teammates inherit the lead's permission settings at spawn time. If the lead uses `--dangerously-skip-permissions`, all teammates do too. Individual teammate modes can be changed after spawning but not at spawn time.

### Context

Each teammate loads the same project context as a regular session (CLAUDE.md, MCP servers, skills) plus a spawn prompt from the lead. The lead's conversation history does **not** carry over.

---

## 3. Core Primitives (Tools)

### 3.1 TeamCreate

Creates a new team. Establishes team config and task list directories.

```
TeamCreate({
  team_name: "my-project",
  description: "Working on feature X"
})
```

Creates:
- `~/.claude/teams/{team-name}/config.json`
- `~/.claude/tasks/{team-name}/`

### 3.2 TaskCreate

Creates a work item in the shared task list.

```
TaskCreate({
  subject: "Fix authentication bug in login flow",       // Imperative form
  description: "Detailed description of what to do...",
  activeForm: "Fixing authentication bug"                // Present continuous, shown in spinner
})
```

Tasks are created with status `pending` and no owner. All tasks have:
- **subject**: Brief actionable title
- **description**: Detailed acceptance criteria
- **activeForm**: Spinner text when in_progress
- **status**: `pending` -> `in_progress` -> `completed`
- **owner**: Agent name (set via TaskUpdate)
- **blocks/blockedBy**: Task dependency graph

### 3.3 TaskUpdate

Updates task status, ownership, or dependencies.

```
TaskUpdate({ taskId: "1", status: "in_progress", owner: "security-reviewer" })
TaskUpdate({ taskId: "1", status: "completed" })
TaskUpdate({ taskId: "2", addBlockedBy: ["1"] })   // Task 2 waits for task 1
TaskUpdate({ taskId: "1", status: "deleted" })      // Remove task
```

Task claiming uses **file locking** to prevent race conditions when multiple teammates try to claim the same task.

Dependencies auto-unblock: completing task #1 automatically makes tasks blocked by #1 claimable.

### 3.4 TaskList

Returns summary of all tasks: id, subject, status, owner, blockedBy.

```
TaskList({})
```

### 3.5 TaskGet

Retrieve full details of a specific task.

```
TaskGet({ taskId: "1" })
```

### 3.6 SendMessage

Inter-agent communication. Four message types:

**Direct message** (most common):
```
SendMessage({
  type: "message",
  recipient: "researcher",     // Agent NAME, not ID
  content: "Found the bug in auth.py line 42",
  summary: "Auth bug found"    // 5-10 word preview
})
```

**Broadcast** (use sparingly -- costs N messages for N teammates):
```
SendMessage({
  type: "broadcast",
  content: "Stop all work, blocking issue found",
  summary: "Critical blocking issue"
})
```

**Shutdown request**:
```
SendMessage({
  type: "shutdown_request",
  recipient: "researcher",
  content: "Task complete, wrapping up"
})
```

**Shutdown response** (teammate responds):
```
SendMessage({
  type: "shutdown_response",
  request_id: "abc-123",
  approve: true
})
```

**Plan approval response** (for plan-mode teammates):
```
SendMessage({
  type: "plan_approval_response",
  request_id: "abc-123",
  recipient: "architect",
  approve: true   // or false with content feedback
})
```

Messages are **automatically delivered** to recipients. The lead does not need to poll.

### 3.7 TeamDelete

Removes team and task directories. **Fails if active teammates exist** -- shut them down first.

```
TeamDelete({})
```

### 3.8 EnterWorktree

Creates an isolated git worktree for a teammate. Each agent works in a separate worktree to avoid file conflicts.

```
EnterWorktree({ name: "feature-auth" })
```

---

## 4. Custom Subagents (.claude/agents/)

Subagents are defined as Markdown files with YAML frontmatter. They can be used both as one-off subagents (within a single session) and as teammate types in agent teams.

### File Format

```markdown
---
name: security-reviewer
description: Reviews code for security vulnerabilities. Use proactively after code changes.
tools: Read, Grep, Glob, Bash
model: sonnet
permissionMode: default
maxTurns: 50
memory: user
background: false
isolation: worktree
skills:
  - api-conventions
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate.sh"
---

You are a security reviewer. When invoked, analyze code for...
```

### Frontmatter Fields

| Field             | Required | Description                                                    |
|-------------------|----------|----------------------------------------------------------------|
| `name`            | Yes      | Unique identifier (lowercase, hyphens)                         |
| `description`     | Yes      | When Claude should delegate to this agent                      |
| `tools`           | No       | Tool allowlist. Inherits all if omitted                        |
| `disallowedTools` | No       | Tool denylist                                                  |
| `model`           | No       | `sonnet`, `opus`, `haiku`, or `inherit` (default: `inherit`)   |
| `permissionMode`  | No       | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `maxTurns`        | No       | Max agentic turns before stopping                              |
| `skills`          | No       | Skills to preload into context                                 |
| `mcpServers`      | No       | MCP server configs                                             |
| `hooks`           | No       | Lifecycle hooks scoped to this agent                           |
| `memory`          | No       | `user`, `project`, or `local` -- persistent cross-session memory |
| `background`      | No       | `true` to always run as background task                        |
| `isolation`       | No       | `worktree` for isolated git worktree                           |

### Storage Locations (Priority Order)

1. `--agents` CLI flag (session-only, highest priority)
2. `.claude/agents/` (project-level, version-controlled)
3. `~/.claude/agents/` (user-level, all projects)
4. Plugin's `agents/` directory (lowest priority)

### Built-in Agent Types

| Type               | Model   | Tools          | Best For                        |
|--------------------|---------|----------------|---------------------------------|
| **Explore**        | Haiku   | Read-only      | Codebase search, file discovery |
| **Plan**           | Inherit | Read-only      | Architecture, planning          |
| **general-purpose**| Inherit | All tools      | Complex multi-step tasks        |
| **Bash**           | Inherit | Shell only     | Terminal commands                |
| **Claude Code Guide** | Haiku | Read + Web  | Questions about Claude Code     |

### Persistent Memory

When `memory` is set, the agent gets a persistent directory that survives across conversations:

| Scope     | Location                                       |
|-----------|-------------------------------------------------|
| `user`    | `~/.claude/agent-memory/<agent-name>/`          |
| `project` | `.claude/agent-memory/<agent-name>/`            |
| `local`   | `.claude/agent-memory-local/<agent-name>/`      |

The agent's system prompt includes instructions for reading/writing to `MEMORY.md` in this directory. First 200 lines of MEMORY.md are auto-loaded.

### Restricting Which Subagents Can Be Spawned

Use `Task(agent_type)` syntax in the tools field:
```yaml
tools: Task(worker, researcher), Read, Bash
```

This means only `worker` and `researcher` can be spawned. `Task` without parentheses allows all.

---

## 5. Agent SDK (Programmatic / Headless)

The Claude Code SDK was **renamed to Claude Agent SDK**. Available in TypeScript and Python.

### Installation

```bash
# TypeScript
npm install @anthropic-ai/claude-agent-sdk

# Python
pip install claude-agent-sdk
```

### Basic Usage

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="Find and fix the bug in auth.py",
        options=ClaudeAgentOptions(allowed_tools=["Read", "Edit", "Bash"]),
    ):
        print(message)

asyncio.run(main())
```

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix the bug in auth.py",
  options: { allowedTools: ["Read", "Edit", "Bash"] }
})) {
  console.log(message);
}
```

### Key Capabilities

- **Built-in tools**: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, AskUserQuestion
- **Custom subagents**: Define via `agents` option with description, prompt, tools, model
- **Hooks**: Callback functions for PreToolUse, PostToolUse, Stop, SessionStart, SessionEnd, etc.
- **MCP servers**: Connect to external systems (databases, browsers, APIs)
- **Sessions**: Resume or fork sessions with `resume: sessionId`
- **Permissions**: `bypassPermissions`, `acceptEdits`, `dontAsk`, `default`
- **CLAUDE.md support**: Set `settingSources: ['project']` to load project config

### Headless Mode (CLI)

```bash
claude -p "Find all TODO comments and create a summary"
```

The `-p` flag enables non-interactive execution for CI/CD pipelines.

### SDK vs CLI Decision

| Use case               | Best choice |
|------------------------|-------------|
| Interactive development | CLI         |
| CI/CD pipelines        | SDK         |
| Custom applications    | SDK         |
| One-off tasks          | CLI         |
| Production automation  | SDK         |

### Authentication

- Direct API: `ANTHROPIC_API_KEY`
- Amazon Bedrock: `CLAUDE_CODE_USE_BEDROCK=1`
- Google Vertex AI: `CLAUDE_CODE_USE_VERTEX=1`
- Microsoft Azure: `CLAUDE_CODE_USE_FOUNDRY=1`

---

## 6. Configuration and Enablement

### Enable Agent Teams

Add to `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Or set environment variable:
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

### Teammate Mode

```json
{
  "teammateMode": "in-process"   // or "auto" (default), "tmux"
}
```

CLI override:
```bash
claude --teammate-mode in-process
```

### Spawn Backend

Auto-detected, or force with:
```bash
export CLAUDE_CODE_SPAWN_BACKEND=in-process|tmux|iterm2
```

| Backend       | Visibility | Persistence        | Speed   |
|---------------|------------|--------------------| --------|
| **in-process**| Hidden     | Dies with leader   | Fastest |
| **tmux**      | Visible    | Survives exit      | Medium  |
| **iterm2**    | Visible    | Dies with window   | Medium  |

---

## 7. Display Modes

### In-Process Mode (Default)

All teammates run inside the main terminal. Navigation:
- **Shift+Down**: Cycle through teammates
- **Enter**: View a teammate's session
- **Escape**: Interrupt a teammate's current turn
- **Ctrl+T**: Toggle the task list

### Split-Pane Mode (tmux/iTerm2)

Each teammate gets its own pane. Click into a pane to interact directly.

Requires:
- tmux: Install via package manager
- iTerm2: Install `it2` CLI, enable Python API in settings

Note: `tmux -CC` in iTerm2 is the recommended tmux entrypoint. Split panes are **not supported** in VS Code terminal, Windows Terminal, or Ghostty.

---

## 8. Hooks and Quality Gates

### Team-Specific Hook Events

| Event             | When It Fires                              | Exit Code 2 Behavior                     |
|-------------------|--------------------------------------------|-------------------------------------------|
| **TeammateIdle**  | Teammate is about to go idle               | Sends feedback, keeps teammate working    |
| **TaskCompleted** | Task is being marked complete              | Prevents completion, sends feedback       |

### Full Hook Events List (14 total)

`SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `PostToolUseFailure`, `Notification`, `SubagentStart`, `SubagentStop`, `Stop`, `TeammateIdle`, `TaskCompleted`, `PreCompact`, `SessionEnd`

### Three Hook Types

1. **Command hooks**: Execute shell scripts, receive JSON stdin, use exit codes
2. **Prompt hooks**: Invoke fast Claude models for single-turn evaluation
3. **Agent hooks**: Spawn subagents with Read, Grep, Glob tool access

### Async Hooks

Set `"async": true` to run hooks non-blocking in background. Results delivered via `systemMessage` or `additionalContext` on next turn. Timeout: 10 minutes.

### Example: Quality Gate via TaskCompleted Hook

```json
{
  "hooks": {
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/run-tests.sh"
          }
        ]
      }
    ]
  }
}
```

The script exits with code 2 to reject task completion if tests fail. This means **no task closes with broken tests**, regardless of which teammate worked on it.

---

## 9. Orchestration Patterns

### Pattern 1: Parallel Specialists

Spawn multiple reviewers simultaneously, each applying a different lens:

```
Create an agent team to review PR #142:
- One focused on security implications
- One checking performance impact
- One validating test coverage
```

### Pattern 2: Competing Hypotheses (Adversarial)

Multiple agents investigate different theories and actively try to disprove each other:

```
Spawn 5 agent teammates to investigate different hypotheses.
Have them talk to each other to disprove each other's theories.
```

### Pattern 3: Pipeline (Sequential Dependencies)

Tasks with linear dependencies: #2 blocked by #1, #3 blocked by #2. Workers claim available tasks as they unblock.

```
TaskCreate({ subject: "Design API schema" })           // Task 1
TaskCreate({ subject: "Implement endpoints" })          // Task 2
TaskUpdate({ taskId: "2", addBlockedBy: ["1"] })        // 2 waits for 1
```

### Pattern 4: Self-Organizing Swarm

Create independent task pool (no dependencies). Spawn 3+ workers with identical prompts. They race to claim pending tasks and naturally load-balance.

### Pattern 5: Plan Approval

Spawn architect with plan mode required. Architect sends plan, lead reviews and approves/rejects:

```
Spawn an architect teammate to refactor the auth module.
Require plan approval before they make any changes.
```

### Pattern 6: Research then Implement

Synchronous research phase returns findings, then implementation phase uses results. Can mix subagents (for research) with team members (for implementation).

### Pattern 7: Cross-Layer Coordination

Frontend, backend, and test teammates each own different files. Integration task blocked by all three:

```
TaskUpdate({ taskId: "integration", addBlockedBy: ["frontend", "backend", "tests"] })
```

---

## 10. Best Practices

### Team Size

- Start with **3-5 teammates** for most workflows
- **5-6 tasks per teammate** keeps everyone productive
- Beyond 5-6 teammates, diminishing returns and coordination overhead increase
- 3 focused teammates often outperform 5 scattered ones

### Task Sizing

- **Too small**: Coordination overhead exceeds benefit
- **Too large**: Teammates work too long without check-ins
- **Just right**: Self-contained units producing a clear deliverable (function, test file, review)

### Context

- Teammates do NOT inherit the lead's conversation history
- Include task-specific details in spawn prompts
- CLAUDE.md is loaded automatically by all teammates
- Use CLAUDE.md for project-wide guidance

### Model Selection

- Lead: Opus (best coordination, more expensive)
- Teammates doing implementation: Sonnet (cheaper, still capable)
- Teammates doing search/exploration: Haiku (fast, cheap)

### File Conflicts

- **Avoid two teammates editing the same file** -- leads to overwrites
- Break work so each teammate owns different files
- Use `isolation: worktree` for git-level isolation

### Monitoring

- Check in on progress regularly
- Redirect approaches that aren't working
- Use `Shift+Down` (in-process) or click panes (split) to inspect

### Graceful Shutdown Sequence

```
1. SendMessage(shutdown_request) to each teammate
2. Wait for shutdown_approved from each
3. TeamDelete() to clean up
```

Always use the lead to clean up. Teammates should not run cleanup.

### Delegate Mode

Press `Shift+Tab` to restrict the team lead to coordination only, preventing it from doing implementation work itself. Useful when the lead keeps implementing instead of delegating.

---

## 11. Limitations

| Limitation                          | Details                                                                  |
|-------------------------------------|--------------------------------------------------------------------------|
| **No session resumption**           | `/resume` and `/rewind` don't restore in-process teammates               |
| **Task status can lag**             | Teammates sometimes forget to mark tasks completed                       |
| **Slow shutdown**                   | Teammates finish current request before shutting down                     |
| **One team per session**            | Clean up current team before starting a new one                          |
| **No nested teams**                 | Teammates cannot spawn their own teams                                   |
| **Fixed lead**                      | Cannot promote a teammate or transfer leadership                         |
| **Permissions set at spawn**        | All teammates inherit lead's mode; can change after but not at spawn     |
| **Split panes require tmux/iTerm2** | Not supported in VS Code terminal, Windows Terminal, Ghostty             |
| **Subagents can't spawn subagents** | Only one level of nesting                                                |
| **No cross-team communication**     | Teams are isolated from each other                                       |

---

## 12. Cost and Token Usage

### Token Scaling

- Each teammate has its own context window (up to 200K tokens, or 1M in beta)
- Token usage scales **linearly** with number of active teammates
- Agent teams use ~800K tokens for 3 agents vs ~440K for 3 subagents (rough estimate)

### C Compiler Case Study (16 agents, 2 weeks)

- 2 billion input tokens, 140 million output tokens
- ~2,000 Claude Code sessions
- Total cost: ~$20,000

### Anthropic's Multi-Agent Research System

- Agents use ~4x more tokens than chat
- Multi-agent systems use ~15x more tokens than chat
- Three factors explain 95% of performance variance: **token usage (80%)**, tool calls, model selection

### Cost Optimization

- Use Sonnet for teammates when possible (cheaper than Opus)
- Use Haiku for read-only exploration tasks
- Plan mode (~10K tokens) before committing full team resources
- Single sessions are more cost-effective for routine/sequential tasks

---

## 13. Real-World Case Studies

### C Compiler (Anthropic Internal)

- **16 parallel agents** in Docker containers
- Built a **100,000-line Rust C compiler** compiling Linux 6.9 on x86/ARM/RISC-V
- 99% pass rate on GCC torture tests
- Compiled QEMU, FFmpeg, SQLite, PostgreSQL, Redis, Doom
- Git-based task locking: agents write to `current_tasks/` directory
- Key insight: "The task verifier must be nearly perfect" -- agents will solve the wrong problem if tests are wrong

### Multi-Agent Research System (Anthropic)

- Orchestrator-worker pattern: lead on Opus 4, subagents on Sonnet 4
- **90.2% better** than single-agent Opus 4 on internal research evaluations
- Best for breadth-first queries needing parallel exploration
- 3-5 subagents with 3+ parallel tool calls
- Not ideal for coding tasks (fewer parallelizable subtasks)

### QA Swarm (Community Example)

- 5 Sonnet agents testing different aspects of a website simultaneously
- Each finished independently and sent structured reports via SendMessage
- Lead synthesized findings into prioritized issue list

### Growth Marketing (Anthropic Internal)

- Agentic workflow processing CSV files with hundreds of ads
- Identifies underperformers, generates new variations
- Two specialized sub-agents within strict character limits

---

## 14. Agent Teams vs Subagents vs Manual Parallelism

| Aspect              | Subagents                          | Agent Teams                              | Manual (Git Worktrees)         |
|---------------------|------------------------------------|------------------------------------------|--------------------------------|
| **Communication**   | Report to parent only              | Direct peer messaging                    | None (manual coordination)     |
| **Coordination**    | Parent manages all                 | Shared task list, self-claim             | Manual                         |
| **Context**         | Own window, results return         | Own window, fully independent            | Own window, fully independent  |
| **Token cost**      | Lower (summarized back)            | Higher (each is full session)            | Separate billing               |
| **Best for**        | Focused tasks, result matters      | Complex work needing discussion          | Full manual control            |
| **Nesting**         | Cannot spawn sub-subagents         | Cannot spawn nested teams                | N/A                            |
| **Automation**      | Automatic delegation               | Automatic via team lead                  | Manual                         |

**Decision guide:**
- Use **subagents** when workers just need to report results back
- Use **agent teams** when workers need to share findings, coordinate, and challenge each other
- Use **manual worktrees** when you want full control over each session

---

## 15. Sources

### Official Documentation
- [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams) -- Official docs
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents) -- Agent definition format
- [Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) -- Programmatic SDK

### Anthropic Engineering Blog
- [Building a C Compiler with Agent Teams](https://www.anthropic.com/engineering/building-c-compiler) -- 16-agent case study
- [Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system) -- Research architecture
- [Building Agents with the Claude Agent SDK](https://claude.com/blog/building-agents-with-the-claude-agent-sdk) -- SDK guide

### Community Guides and Analysis
- [Claude Code's Hidden Multi-Agent System](https://paddo.dev/blog/claude-code-hidden-swarm/) -- TeammateTool internals
- [From Tasks to Swarms](https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code/) -- Practical patterns
- [Claude Code Swarm Orchestration Skill](https://gist.github.com/kieranklaassen/4f2aba89594a4aea4ad64d753984b2ea) -- Complete reference gist
- [What's New: Opus 4.6 and Agent Teams](https://zircote.com/blog/2026/02/whats-new-in-claude-code-opus-4-6/) -- Feature roundup
- [Addy Osmani: Claude Code Swarms](https://addyosmani.com/blog/claude-code-agent-teams/) -- Google engineer's perspective

### Launch Coverage
- [TechCrunch: Opus 4.6 with Agent Teams](https://techcrunch.com/2026/02/05/anthropic-releases-opus-4-6-with-new-agent-teams/)
- [VentureBeat: 1M Context and Agent Teams](https://venturebeat.com/technology/anthropics-claude-opus-4-6-brings-1m-token-context-and-agent-teams-to-take)

### SDK Repositories
- [TypeScript SDK](https://github.com/anthropics/claude-agent-sdk-typescript)
- [Python SDK](https://github.com/anthropics/claude-agent-sdk-python)
- [SDK Demos](https://github.com/anthropics/claude-agent-sdk-demos)
