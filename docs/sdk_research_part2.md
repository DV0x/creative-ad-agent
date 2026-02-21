# SDK Research Part 2: Agent Patterns, Skills, and Deployment

## Research Summary

This report covers the Claude Agent SDK's agent-level capabilities: Skills system, slash commands, system prompt customization, permissions model, hosting/deployment patterns, cost tracking, migration path, and todo lists. Each section extracts key capabilities, technical constraints, hackathon relevance, and India-specific potential.

---

## 1. Agent Skills (SKILL.md System)

**Source:** `Agent_skills.md`, `skill_creator.md`, `skills_troubleshooting.md`

### Key Capabilities

- **Model-invoked modular capabilities**: Skills are packaged as `SKILL.md` files with YAML frontmatter (`name`, `description`) and markdown body. Claude autonomously decides when to invoke a Skill based on the description field -- no explicit user trigger needed.
- **Three Skill locations**: Project Skills (`.claude/skills/`, git-shared), Personal Skills (`~/.claude/skills/`, per-developer), and Plugin Skills (bundled with plugins).
- **Progressive disclosure architecture**: Only metadata (name + description) is preloaded into the system prompt at startup. The full SKILL.md body is loaded on-demand when triggered. Supporting files (reference docs, scripts, templates) are loaded only when Claude navigates to them. This means large reference files have zero context cost until accessed.
- **Multi-file Skill bundles**: A Skill directory can contain SKILL.md plus reference markdown files, utility scripts, templates, etc. Claude reads and executes these on-demand.
- **Executable utility scripts**: Skills can bundle Python/Bash scripts that Claude executes directly. Script output consumes tokens, but the script source code does not need to be loaded into context.
- **Tool restrictions via `allowed-tools`**: In Claude Code CLI, Skills can restrict which tools Claude uses (e.g., read-only skills). Note: this frontmatter field does NOT work in the SDK -- SDK tool access is controlled via the main `allowedTools` option.
- **Feedback loops and workflows**: Skills support checklist patterns, validation loops (run validator -> fix errors -> repeat), and multi-step workflows with clear sequential steps.

### Technical Constraints

- **Filesystem-only definition**: Skills MUST be created as filesystem artifacts (SKILL.md files). There is no programmatic API to register Skills in the SDK.
- **Explicit `settingSources` required**: By default, the SDK does NOT load any filesystem settings. You must pass `settingSources: ['user', 'project']` to load Skills.
- **`Skill` must be in `allowedTools`**: You must explicitly add `"Skill"` to the `allowedTools` array.
- **`allowed-tools` frontmatter not supported in SDK**: The per-Skill tool restriction only works in Claude Code CLI, not when using Skills through the SDK.
- **Name validation rules**: Max 64 chars, lowercase letters/numbers/hyphens only, no XML tags, cannot contain "anthropic" or "claude".
- **Description max 1024 chars**, must be non-empty, no XML tags.
- **SKILL.md body recommended under 500 lines** for optimal performance.
- **References should be one level deep** from SKILL.md -- deeply nested references cause Claude to partially read files.
- **Package installation**: On claude.ai, can install from npm/PyPI/GitHub. Via API, there is NO network access and no runtime package installation.

### Hackathon Relevance (HIGH)

- **Effort: LOW-MEDIUM** -- Creating a SKILL.md file is straightforward (just markdown + YAML). A team could create multiple domain-specific Skills in under an hour.
- **High impact**: Skills let you encode domain expertise once and have Claude use it automatically. Perfect for hackathon demos where you want Claude to behave like a domain expert.
- **Composability**: Multiple Skills can work together -- e.g., one Skill for data analysis, another for report generation.
- **Reusable**: Skills created during the hackathon can be demoed by simply asking questions that match the description.

### India-Specific Potential

- **Agriculture advisory Skill**: Bundle crop data schemas, MSP (Minimum Support Price) tables, weather pattern reference files. Claude automatically consults these when farmers ask questions.
- **GST/tax compliance Skill**: Encode Indian tax rules, GST slab information, filing deadlines as reference files. The Skill triggers when users ask about tax compliance.
- **Regional language education Skill**: Package grammar rules, vocabulary lists, and pedagogical approaches for Indian languages.
- **Government scheme navigator**: Bundle information about PM schemes (PM-KISAN, MGNREGA, Ayushman Bharat) with eligibility criteria as reference files.

---

## 2. Slash Commands in the SDK

**Source:** `slash_commands_sdk.md`

### Key Capabilities

- **User-invoked commands**: Unlike Skills (model-invoked), slash commands are explicitly triggered by the user typing `/command-name`. This gives users direct control over specific actions.
- **Built-in commands**: `/compact` (summarize conversation history to save tokens), `/clear` (start fresh conversation), `/help`.
- **Custom slash commands**: Defined as markdown files in `.claude/commands/` (project) or `~/.claude/commands/` (personal). The filename becomes the command name.
- **YAML frontmatter configuration**: Commands support `allowed-tools`, `description`, `model`, and `argument-hint` fields.
- **Dynamic arguments with placeholders**: Commands can use `$1`, `$2`, `$ARGUMENTS` for user-provided arguments. Example: `/fix-issue 123 high` maps `$1=123`, `$2=high`.
- **Bash command execution in commands**: Use `!` backtick syntax to embed bash output. Example: `!git status` in the command markdown gets replaced with actual git status output at runtime.
- **File references with `@` prefix**: Include file contents dynamically. Example: `@package.json` injects the file's contents.
- **Namespace organization**: Subdirectories organize commands (e.g., `frontend/component.md`, `backend/api-test.md`).
- **Auto-discovery**: Custom commands appear alongside built-in ones in the `slash_commands` list from the init system message.

### Technical Constraints

- **Requires `settingSources` configuration**: Like Skills, custom slash commands are only loaded when `settingSources` includes `"user"` or `"project"`.
- **No programmatic registration**: Commands must be filesystem artifacts (markdown files).
- **Subdirectory naming**: Subdirectory appears in description but does NOT affect the command name itself.
- **Arguments are positional**: `$1`, `$2`, etc. -- no named parameters.

### Hackathon Relevance (HIGH)

- **Effort: VERY LOW** -- Creating a slash command is literally creating a single markdown file. 5 minutes per command.
- **Great for demo flow**: Slash commands give the hackathon team a scripted demo path. `/analyze-market`, `/generate-campaign`, `/audit-compliance` -- each triggers a carefully crafted workflow.
- **Composable with Skills**: Commands can trigger workflows that use Skills.
- **Bash and file injection**: The `!` and `@` syntax allows commands to automatically pull in context (git diffs, config files, etc.) without manual copy-paste.

### India-Specific Potential

- **`/check-compliance`**: A command that pulls in relevant Indian regulatory context and analyzes a codebase or document for compliance.
- **`/translate-ui`**: A command that reads all UI strings from a project and generates translations for Indian languages.
- **`/market-analysis [sector]`**: Pull in India-specific market data and analyze a business sector.

---

## 3. System Prompt Customization

**Source:** `system_prompts.md`

### Key Capabilities

- **Three methods of customization**:
  1. **Output Styles** (persistent, file-based): Saved as markdown files in `~/.claude/output-styles/` or `.claude/output-styles/`. Reusable across sessions and projects. Managed via `/output-style` CLI command.
  2. **`systemPrompt` with append**: Use preset `"claude_code"` and add custom instructions via `append` property. Preserves all built-in tools, safety, and environment context.
  3. **Custom `systemPrompt` string**: Complete replacement of the system prompt. Full control but you lose all default tools, safety instructions, and environment context.

- **Default behavior in SDK**: Empty system prompt by default (unlike Claude Code CLI which has a rich default). To get Claude Code's behavior, you must explicitly set `systemPrompt: { preset: "claude_code" }`.

### Technical Constraints

| Feature | Output Styles | Append | Custom |
|---------|--------------|--------|--------|
| Persistence | File-based, reusable | Session only | Session only |
| Default tools | Preserved | Preserved | LOST |
| Built-in safety | Maintained | Maintained | LOST |
| Environment context | Automatic | Automatic | Must provide |
| Full control | No | Additions only | Yes |

- **Critical gotcha**: If you use a custom `systemPrompt` string, you lose ALL default tool instructions, safety rules, and environment context. You must provide these yourself.
- **Output styles require filesystem**: Need `settingSources` configured.

### Hackathon Relevance (HIGH)

- **Effort: VERY LOW** -- The `append` method is a single string addition. Custom system prompts are just strings.
- **Most practical approach for hackathon**: Use `preset: "claude_code"` with `append` to add domain-specific behavior while keeping all tools working.
- **Output styles are great for team consistency**: Create one style, share it via git.

### India-Specific Potential

- **Hindi/regional language response style**: Use `append` to instruct Claude to respond in Hindi or code-switch between English and regional languages.
- **Cultural context injection**: Add Indian business context, cultural norms, or market-specific knowledge via system prompt.
- **Regulatory persona**: Create a system prompt that makes Claude behave as an Indian regulatory compliance advisor.

---

## 4. Permissions Model

**Source:** `permissions.md`

### Key Capabilities

- **Four complementary permission layers**:
  1. **Permission Modes**: Global behavior settings (`default`, `plan`, `acceptEdits`, `bypassPermissions`).
  2. **`canUseTool` callback**: Runtime permission handler for dynamic approval. Fires when no other rule covers the tool use.
  3. **Hooks (PreToolUse/PostToolUse)**: Programmatic control over every tool execution. Can block, audit, or transform tool uses.
  4. **Permission rules (settings.json)**: Declarative allow/deny/ask rules with glob patterns and bash command parsing.

- **Permission flow**: PreToolUse Hook -> Ask Rules -> Deny Rules -> Permission Mode Check -> Allow Rules -> canUseTool Callback -> PostToolUse Hook.

- **Dynamic mode switching**: Can change permission mode mid-conversation via `q.setPermissionMode('acceptEdits')`.

- **Permission modes**:
  - `default`: Normal checks apply.
  - `plan`: Read-only tools only, presents plan before execution. **Not currently supported in SDK.**
  - `acceptEdits`: Auto-approves file edits and filesystem operations (mkdir, touch, rm, mv, cp).
  - `bypassPermissions`: All tools auto-approved (hooks can still block).

- **Bash command parsing**: Built-in parser understands pipes, redirects, command substitution. Supports prefix matching (`Bash(git:*)` matches any git command).

- **Hooks**:
  - `PreToolUse`: Runs before tool execution. Can block with reason or continue.
  - `PostToolUse`: Runs after tool execution. Can log/audit results.
  - Python hooks use `HookMatcher` with specific matchers per tool.

### Technical Constraints

- **`plan` mode not supported in SDK** currently.
- **Permission rules in settings.json are read-only from SDK** -- cannot be set programmatically yet, only read from filesystem.
- **`bypassPermissions` is dangerous** -- all tools run without prompts. Only for controlled environments.
- **Hooks execute for ALL tool uses** -- need to be performant.
- **Hooks require you to parse/validate inputs yourself** (unlike `canUseTool` which gets structured parameters).

### Hackathon Relevance (MEDIUM-HIGH)

- **Effort: LOW for basic modes, MEDIUM for hooks/rules**.
- **`acceptEdits` mode is hackathon gold**: Speeds up development significantly. Claude auto-approves all file operations.
- **`bypassPermissions` for rapid prototyping**: In a controlled hackathon environment, this lets Claude work at full speed with no interruptions.
- **Hooks for safety demos**: Could demo a "safe AI agent" that blocks dangerous commands.

### India-Specific Potential

- **Compliance hooks**: Build PreToolUse hooks that block operations violating Indian data protection rules (DPDPA). For example, block file writes to directories containing PII.
- **Audit trail**: PostToolUse hooks to log every action for regulatory audit requirements common in Indian banking/fintech.

---

## 5. Hosting and Deployment

**Source:** `sdk_hosting.md`

### Key Capabilities

- **Container-based architecture**: The SDK runs as a long-running process (not stateless API calls). It maintains conversational state and executes commands in a persistent environment.

- **Programmatic sandbox configuration**: The `sandbox` option supports `enabled`, `autoAllowBashIfSandboxed`, `excludedCommands`, and `network` settings (local binding, unix sockets).

- **Four deployment patterns**:
  1. **Ephemeral Sessions**: New container per task, destroyed on completion. Best for one-off tasks (bug investigation, invoice processing, translation).
  2. **Long-Running Sessions**: Persistent containers, multiple Claude processes. Best for proactive agents (email agents, site builders, high-frequency chatbots).
  3. **Hybrid Sessions**: Ephemeral containers hydrated with history/state from DB or session resumption. Best for intermittent interaction (project managers, deep research, customer support).
  4. **Single Containers**: Multiple SDK processes in one container. Best for agent collaboration/simulations. Least common due to conflict risk.

- **Sandbox providers**: Cloudflare Sandboxes, Modal Sandboxes, Daytona, E2B, Fly Machines, Vercel Sandbox.

- **System requirements per instance**: Python 3.10+ or Node.js 18+, Claude Code CLI installed globally, recommended 1GiB RAM + 5GiB disk + 1 CPU, outbound HTTPS to api.anthropic.com.

### Technical Constraints

- **Claude Code CLI is a prerequisite**: Must be installed globally (`npm install -g @anthropic-ai/claude-code`) in every container.
- **Not stateless**: Unlike typical LLM API calls, the SDK maintains state. Container lifecycle management is critical.
- **Cost**: Dominant cost is tokens, not compute. Container minimum roughly $0.05/hour.
- **No built-in session timeout**: Agent sessions don't timeout, but `maxTurns` is recommended to prevent loops.
- **Communication via exposed ports**: HTTP/WebSocket endpoints for external clients.

### Hackathon Relevance (MEDIUM)

- **Effort: MEDIUM-HIGH** -- Setting up container infrastructure during a 6-hour hackathon is ambitious.
- **Best approach**: Use a pre-built sandbox provider (E2B, Modal, or Cloudflare) rather than building from scratch.
- **Ephemeral pattern is simplest**: Spin up container, run task, destroy. Most feasible for hackathon.
- **Alternative**: Run SDK processes locally on laptops for the demo -- no container setup needed.

### India-Specific Potential

- **Low-cost hosting**: India's cloud infrastructure (like AWS Mumbai, Azure India) combined with ephemeral containers could serve agents at very low per-query costs -- important for price-sensitive Indian market.
- **WhatsApp integration**: Long-running session pattern maps perfectly to WhatsApp Business API chatbots, which are massive in India.
- **Offline-first hybrid**: Hybrid session pattern could support intermittent connectivity scenarios common in rural India.

---

## 6. Cost Tracking

**Source:** `tracking_costs.md`

### Key Capabilities

- **Per-message token usage reporting**: Every assistant message includes `usage` data with `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, and `service_tier`.
- **Deduplication by message ID**: Multiple messages in the same turn (text + parallel tool uses) share the same ID and identical usage data. Charge once per unique message ID.
- **Cumulative result**: The final `result` message contains `total_cost_usd` -- the authoritative total cost for the entire conversation.
- **Cache token tracking**: Separate tracking for ephemeral 5-minute and 1-hour cache creation/reads.
- **CostTracker pattern**: The docs provide a complete implementation of a cost tracking class that deduplicates by message ID and calculates per-step costs.
- **BillingAggregator pattern**: Aggregate usage across multiple conversations for per-user billing dashboards.

### Technical Constraints

- **Same ID = same usage**: All messages with the same `id` report identical usage. Must deduplicate.
- **Output token discrepancies**: In rare cases, different `output_tokens` values for same ID. Use the highest value.
- **`total_cost_usd` only in result message**: Not available in intermediate messages.
- **Pricing is manual**: The SDK doesn't provide built-in pricing tables. You must implement `calculateCost()` yourself with current token prices.

### Hackathon Relevance (MEDIUM)

- **Effort: LOW** -- The cost tracking pattern is copy-paste from the docs. The `total_cost_usd` field makes it trivial.
- **Useful for demo**: "Each query costs approximately X cents" is a compelling data point for judges.
- **Budget management**: With a limited hackathon API budget, cost tracking prevents overspending.

### India-Specific Potential

- **Micro-pricing models**: India's market demands low per-query pricing. The cost tracking infrastructure enables pay-per-query models at INR 1-5 per interaction.
- **Budget alerts**: Critical for Indian SMBs that need strict cost controls.
- **Token-efficient design**: Understanding token costs helps optimize for the cost-sensitive Indian market.

---

## 7. Migration to Claude Agent SDK

**Source:** `migration_to_agent_sdk.md`

### Key Capabilities

- **Rebranding from Claude Code SDK to Claude Agent SDK**: Reflects broader capabilities beyond coding tasks.
- **Package changes**:
  - TypeScript: `@anthropic-ai/claude-code` -> `@anthropic-ai/claude-agent-sdk`
  - Python: `claude-code-sdk` -> `claude-agent-sdk`
- **Python type rename**: `ClaudeCodeOptions` -> `ClaudeAgentOptions`.

### Breaking Changes (v0.1.0)

1. **System prompt no longer defaults to Claude Code's prompt**: SDK now uses an empty system prompt by default. Must explicitly set `systemPrompt: { preset: "claude_code" }` to get old behavior.
2. **Settings sources no longer loaded by default**: No filesystem settings (CLAUDE.md, settings.json, slash commands) are loaded unless `settingSources` is explicitly configured.
3. **Python type rename**: `ClaudeCodeOptions` -> `ClaudeAgentOptions`.

### Technical Constraints

- **Both breaking changes require explicit opt-in**: New SDK defaults to maximum isolation -- empty prompt, no filesystem settings.
- **Backward compatibility**: Add `settingSources: ['user', 'project', 'local']` and `systemPrompt: { preset: "claude_code" }` to restore old behavior.

### Hackathon Relevance (HIGH)

- **Critical for setup**: Any team using the SDK needs to know about these changes. The empty default system prompt is a common pitfall.
- **Naming reflects positioning**: "Agent SDK" signals that this is for building agents of all types, not just coding tools -- perfect framing for a hackathon building non-coding agents.
- **Effort: VERY LOW** -- Just import changes and adding config options.

### India-Specific Potential

- **Agent framing**: The "Agent SDK" branding supports building domain-specific agents for Indian markets (agriculture, healthcare, education, government services) rather than just coding tools.

---

## 8. Todo Lists

**Source:** `todo_lists.md`

### Key Capabilities

- **Built-in task tracking**: The SDK includes a `TodoWrite` tool that Claude uses automatically for complex multi-step tasks.
- **Todo lifecycle**: `pending` -> `in_progress` -> `completed` -> removed.
- **Automatic creation**: Claude creates todos for tasks with 3+ steps, user-provided task lists, and non-trivial operations.
- **Real-time progress display**: The `TodoTracker` pattern from the docs provides a class that monitors `TodoWrite` tool_use messages and displays progress.
- **`activeForm` field**: Each todo has an "active form" (present continuous verb) shown while the task is in progress -- e.g., "Running tests" vs. "Run tests".

### Technical Constraints

- **Intercepted via message stream**: Todos are exposed as `tool_use` messages with `name: "TodoWrite"`. You parse them from the message stream.
- **No separate todo API**: There's no dedicated endpoint to query todo state. You track it by monitoring the message stream.
- **Claude decides when to use todos**: You can't force todo creation; Claude autonomously decides based on task complexity.

### Hackathon Relevance (MEDIUM)

- **Effort: LOW** -- The TodoTracker pattern is a small class that monitors messages. Easy to integrate.
- **Great for UX**: A progress display with checkmarks is visually compelling for demos.
- **Natural for complex workflows**: If the hackathon project involves multi-step agent workflows, todos provide built-in progress tracking.

### India-Specific Potential

- **Government process tracking**: Indian government applications often involve multi-step processes (document submission, verification, approval). Todos can track these stages.
- **Educational progress**: Track student progress through multi-step learning modules.

---

## Cross-Cutting Analysis

### Architecture Patterns for Hackathon

The SDK's architecture supports a clean separation of concerns:

```
[Custom System Prompt / Append]
    + [Skills for domain expertise]
    + [Slash Commands for user workflows]
    + [Permission Hooks for safety]
    + [Cost Tracking for billing]
    + [Todo Lists for progress UX]
```

**Recommended hackathon stack:**
1. Use `systemPrompt` with `append` to set the agent's persona/domain
2. Create 2-3 Skills for domain-specific capabilities (e.g., Indian crop data, GST rules)
3. Create slash commands for demo flow (e.g., `/analyze`, `/recommend`)
4. Use `acceptEdits` permission mode for rapid development
5. Add TodoTracker for progress display in the UI
6. Add CostTracker to show per-query costs

### Feasibility Assessment for 6-Hour Hackathon

| Capability | Setup Time | Impact | Priority |
|-----------|-----------|--------|----------|
| System prompt customization | 15 min | HIGH | P0 |
| Skills (2-3 domain Skills) | 1 hour | HIGH | P0 |
| Slash commands (3-4 commands) | 30 min | MEDIUM-HIGH | P1 |
| Permission mode (acceptEdits) | 5 min | HIGH | P0 |
| Cost tracking | 30 min | MEDIUM | P2 |
| Todo progress display | 30 min | MEDIUM | P2 |
| Container hosting | 2+ hours | LOW for demo | P3 (skip for hackathon) |

### Key Gotchas to Avoid

1. **Empty system prompt by default**: Always set `systemPrompt` explicitly. Forgetting this means Claude has no tool instructions.
2. **`settingSources` must be configured**: Without this, Skills and slash commands won't load.
3. **`Skill` must be in `allowedTools`**: Easy to forget this one-liner.
4. **`allowed-tools` in SKILL.md doesn't work with SDK**: Don't rely on per-Skill tool restrictions.
5. **Plan mode not supported in SDK**: Don't try to use `permissionMode: 'plan'`.
6. **Container setup is time-consuming**: For a hackathon demo, run locally. Only containerize if you have a pre-built solution.
7. **Description quality determines Skill discovery**: Vague descriptions mean Claude won't find your Skills. Include trigger keywords.

### Top India-Focused Opportunities

1. **Agricultural Advisory Agent**: Skills bundling MSP data, crop calendars, weather patterns. System prompt for Hindi/regional language support. Slash commands for `/crop-advice [crop]`, `/market-price [commodity]`.

2. **GST/Tax Compliance Agent**: Skills with GST slabs, filing rules, penalty schedules. Hooks for data protection compliance. Cost-efficient per-query pricing for SMBs.

3. **Government Services Navigator**: Skills mapping government schemes to eligibility criteria. Todo tracking for multi-step application processes. WhatsApp-compatible via long-running session pattern.

4. **Education Tutor Agent**: Skills for curriculum content (NCERT/CBSE aligned). System prompt for adaptive difficulty. Progress tracking via todos.

5. **Healthcare Triage Agent**: Skills with symptom-to-specialist mappings, nearby hospital data. Compliance hooks for patient data protection. Low-cost ephemeral sessions.
