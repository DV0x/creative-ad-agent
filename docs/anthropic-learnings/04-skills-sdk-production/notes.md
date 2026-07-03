# Topic 4 — Skills + Agent SDK + Production Agents (Anthropic)

**Sources:**
- Agent Skills: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills + Claude Code skills docs (code.claude.com/docs/en/skills) + the open standard (agentskills.io / agentskills.dev)
- Agent SDK: https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk + SDK docs (code.claude.com/docs/en/agent-sdk: agent-loop, subagents, hooks, sessions, permissions)
- Multi-agent research system: https://www.anthropic.com/engineering/multi-agent-research-system
- Claude plays Pokémon: the context-engineering post (the "1,234 steps" note), the Claude 4 announcement (the "real notes taken by Opus 4" Navigation Guide), the 3.7 announcement / visible-extended-thinking — plus third-party harness analysis (Hershey interview, LessWrong)

**Deep-dive date:** 2026-06-07
**Why this matters for us:** This is the **capstone**. Topics 1–3 were theory — the SHAPE of the system (1), how a prompt teaches thinking (2), what flows through attention (3). Topic 4 is **how you actually construct it**: how to author a Skill, what the SDK harness gives you, how to wire an orchestrator + parallel subagents, and how long-horizon memory really works. It closes the gap between the genericness *conclusion* (what to build) and the *build* (how to build it well).

> **The capstone connection, up front:** the conclusion's load-bearing upgrade — an **independent adversarial critic** to break the judge ceiling — is, mechanically, *just an SDK subagent with a clean context window.* The primitive already exists. Every unbuilt piece of the cell loop (the critic, the vision-verify gate, the diverge step, the angle-by-angle memory) maps to an Anthropic-validated construction primitive in this topic. We are no longer missing the "how."

---

## TL;DR — four sources, four build layers

| Source | The layer it owns | The one thing to take |
|---|---|---|
| **Agent Skills** | How you **package** expertise (our binders + the cell ARE skills) | Progressive disclosure — metadata always loaded, body on trigger, files JIT. "Teach how to approach a class of problems, not what to produce for an instance." |
| **Agent SDK** | The **harness** you build on | "Give your agents a computer." The loop = gather → act → **verify** → repeat. Verification hierarchy: **rules > visual > LLM-judge.** Subagents = context isolation. |
| **Multi-agent system** | How to **orchestrate** lead + parallel workers | "Multi-agent systems work mainly because they help spend enough tokens." Token usage = **80% of variance.** Complete task descriptions. When NOT to: shared-context / coding. |
| **Pokémon** | **Long-horizon memory** | Separate recency-compaction from semantic-persistence. The knowledge base is model-controlled and survives resets. **Note quality is a correctness problem.** |

---

# PART A — Agent Skills (how to author the cell + the binders)

## What a Skill IS

A Skill is a **folder** with a `SKILL.md` (YAML frontmatter + markdown body) plus optional `scripts/`, `references/`, `assets/`. The frontmatter `name` + `description` are the trigger metadata; the body is the procedure; linked files are loaded on demand.

> *"Building a skill for an agent is like putting together an onboarding guide for a new hire… anyone can now specialize their agents with composable capabilities by capturing and sharing their procedural knowledge."*

This is the same mental model as Topic 2's "onboarding doc for a smart stranger." **Our binders (`agent/.claude/skills/{strategy,research,comp}/`) are already Skills.** Everything below is how to author them — and the cell — well.

## Progressive disclosure (the core mechanic — get this exactly right)

| Stage | What loads | When | Cost |
|---|---|---|---|
| **1 — Discovery** | `name` + `description` only | At startup, into the system prompt | ~100 tokens/skill; budget ≈ **1% of context window**; least-recently-used dropped first |
| **2 — Activation** | The full `SKILL.md` body | When the model decides it's relevant (it literally Reads the file via a tool) | Recommended **< 5,000 tokens / < 500 lines**; stays in context the rest of the session |
| **3 — Execution** | Linked `references/`, `scripts/`, `assets/` | When the body references them for a sub-task | JIT — *"effectively unbounded"* total bundle |

> *"The amount of context that can be bundled into a skill is effectively unbounded."* — because with a filesystem + code execution, the agent loads only the slice it needs.

**The trigger floor (surprising):** *"A simple, one-step request like 'read this PDF' may not trigger a PDF skill even if the description matches perfectly, because the agent can handle it with basic tools."* Skills fire on tasks needing **specialized** knowledge, not every task in the domain.

**Compaction can silently drop a skill:** after auto-compact, skills are re-attached at 5,000 tokens each, **25,000 combined**, most-recent first. A skill invoked early in a long session can vanish entirely. *"If a skill seems to stop influencing behavior after the first response… re-invoke it."*

## Authoring best practices

**The `description` carries the entire burden of triggering.**
- *"Use imperative phrasing… 'Use this skill when…' rather than 'This skill does…'"*
- *"Focus on user intent, not implementation."*
- *"Err on the side of being pushy"* — list the contexts, *"even if they don't explicitly mention"* the domain.
- Concise. Hard caps: **1,024 chars** (open standard) / **1,536 chars** in the Claude Code listing. Put the key use case first.

**Body conciseness is a recurring cost, not a one-time one:** *"Once a skill loads, its content stays in context across turns, so every line is a recurring token cost."* → This is Topic 3's "smallest high-signal tokens" with a mechanism. The S117 **lean pass is not cosmetic — it's a per-turn tax.**

**Scripts for determinism:** *"sorting a list via token generation is far more expensive than simply running a sorting algorithm… many applications require the deterministic reliability that only code can provide."* The signal to extract a script: *"If you notice the agent independently reinventing the same logic each run… write a tested script once and bundle it."*

**Right altitude = coherent unit:** *"Deciding what a skill should cover is like deciding what a function should do."* Too narrow → many skills load, conflicting instructions. Too broad → can't activate precisely.

**Gotchas are the highest-value content:** *"The highest-value content in many skills is a list of gotchas — environment-specific facts that defy reasonable assumptions."* For the cell, the "gotchas" = the **voice rules** (no floating authoritative claims, read-aloud test), the **DR spine**, the **swap-test rubric**, the **forbid-the-obvious** bank.

## The genericness echo (this stopped me)

The skill-authoring best-practices warn against the exact failure our whole project is about — *at the authoring layer*:

> *"A common pitfall… is asking an LLM to generate a skill without providing domain-specific context — relying solely on the LLM's general training knowledge. The result is vague, generic procedures ('handle errors appropriately,' 'follow best practices') rather than the specific API patterns, edge cases, and project conventions that make a skill valuable."*

That is **the genericness conclusion, recursively.** A skill written from a vacuum is slop for the same reason an ad written from a vacuum is slop: no specific information → the model fills with the category average. **Corollary: do NOT let an LLM one-shot the cell skill from a vacuum.** It must encode *our* hard-won moves (S116/117), or it produces "be creative, avoid clichés" mush.

And the partner line — Anthropic's own words for `feedback_binder_teaches_thinking_not_looking`:

> *"A skill should teach the agent how to approach a class of problems, not what to produce for a specific instance."*

## Skills — quotes worth keeping

- *"Keep the body itself concise… every line is a recurring token cost."*
- *"Overly comprehensive skills can hurt more than they help — the agent struggles to extract what's relevant and may pursue unproductive paths."*
- *"context: fork only makes sense for skills with explicit instructions"* (a guideline-only fork returns nothing useful).
- *"Iterate with Claude: ask Claude to capture its successful approaches and common mistakes into reusable context… instead of trying to anticipate it upfront."*

---

# PART B — Claude Agent SDK (the harness we build on)

## Core thesis: give Claude a computer

> *"The key design principle behind the Claude Agent SDK is to give your agents a computer, allowing them to work like humans do."*

The SDK *is* Claude Code's internals extracted as a library (`query()`), renamed from "Claude Code SDK" → "Claude Agent SDK" (Sept 2025) to signal it's domain-general. Behaviour you see in the CLI maps directly to SDK behaviour.

> *"The folder and file structure of an agent becomes a form of context engineering."* — the JIT lesson (Topic 3) with a mechanism: directory layout *is* the agent's external memory; it greps/tails rather than pre-loading.

> *"Semantic search is usually faster than agentic search, but less accurate, more difficult to maintain, and less transparent… start with agentic search."* — relevant if we ever reach for embeddings: default to grep/file-nav first.

## The agent loop

> **gather context → take action → verify work → repeat**

Mechanically: receive prompt → Claude emits text and/or tool calls → SDK executes tools, feeds results back → repeat until a turn has no tool calls → return. A **"turn" is one round** (model output → tools → results), not a user message. The loop is internal to the SDK until the task completes or a limit (`max_turns`, `max_budget_usd`) hits. **`verify` is not a separate stage — it's the same loop:** run a check tool, read the result, fix, re-run.

## Harness primitives (what you get for free)

| Primitive | What it's for | Our use |
|---|---|---|
| Built-in tools (Read/Edit/Write, Glob/Grep, Bash, WebSearch/WebFetch, **ToolSearch**) | Give the agent a computer | Already on it |
| **MCP** | External services; schemas **deferred** (loaded via ToolSearch) to keep context lean | fal.ai, Perplexity |
| **Subagents** (`AgentDefinition`) | **Context isolation** + parallelism; only the final summary returns to the parent | Our apprentices; the **critic** |
| **Hooks** (`PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, `PreCompact`, …) | Intercept/modify/block; **run in your process, zero context cost** | Verification gates, domain compaction |
| **Sessions** (`continue` / `resume` / `fork_session`) | JSONL history on disk | We bypass on CF (hydrate from D1) |
| **Permissions** (Hooks → Deny → Mode → Allow → callback) | Guardrails; **deny always wins**, even in bypass | Lock down the render/critic subagents |
| **Compaction** + `CLAUDE.md` | Auto-summarize; CLAUDE.md re-injected every request (prompt-cached) | `PreCompact` hook = preserve campaign name/paths/decisions |

**Subagent isolation is stricter than it sounds:** the child sees its own system prompt + project context, **not the parent's turns** — not even a summary. The parent's context grows only by the child's final response. *"Subagents use their own isolated context windows, and only send relevant information back to the orchestrator."* (This is the same clean-context pattern Topic 3 validated — here's the API for it.)

## The verification hierarchy (load-bearing for the cell)

Anthropic ranks feedback by robustness:

1. **Rules-based (most robust):** *"The best form of feedback is providing clearly defined rules for an output, then explaining which rules failed and why."* (Their flagship: lint TS rather than ship JS — more layers of feedback.)
2. **Visual feedback:** screenshot the output, feed it back for the model to check against a checklist (layout/spacing/color/hierarchy). Playwright MCP automates it.
3. **LLM-as-judge (least robust):** *"generally not a very robust method, and can have heavy latency tradeoffs, but… can be helpful."*

> *"Agents that can check and improve their own output are fundamentally more reliable — they catch mistakes before they compound, self-correct when they drift, and get better as they iterate."*

This **ranks our cell's checks for us:** the **swap test is rules-based** (competitor-swap? category-look? obvious-first-idea?) → the most robust tier, beating any "rate quality 1–10." The **render-vs-brief check is visual feedback.** The **adversarial critic is LLM-judge** → least robust *unless* you add independence (Parts C + the judge ceiling).

## SDK vs raw API vs Managed Agents

- **Raw Messages API:** you write the tool loop yourself. SDK does it for you.
- **Agent SDK:** runs in *your* process/infra; agent works on *your* filesystem; sessions = JSONL on your disk.
- **Managed Agents:** Anthropic-hosted sandbox + event-log per session. *"A common path is to prototype with the Agent SDK locally, then move to Managed Agents for production"* — exactly our `managed_agents_strategy`.

## SDK — quotes worth keeping

- *"Tools are prominent in Claude's context window, making them the primary actions Claude will consider."*
- *"Code is precise, composable, and infinitely reusable, making it an ideal output for agents."*
- *"The best way to improve an agent is to look carefully at its output, especially the cases where it fails, and to put yourself in its shoes: does it have the right tools for the job?"*

---

# PART C — Multi-agent research system (how to orchestrate)

## Core thesis: multi-agent is a token-spend mechanism

> *"Multi-agent systems work mainly because they help spend enough tokens to solve the problem."*

Not "more agents = smarter." The architecture is how you *deploy compute* across parallel streams. The data:

- *"Token usage by itself explains 80% of the variance"* (three factors — tokens, tool calls, model — explain 95%) on BrowseComp.
- *"Agents typically use about 4× more tokens than chat… multi-agent systems use about 15× more tokens than chats."*
- Multi-agent (Opus-4 lead + Sonnet-4 subagents) **beat single-agent Opus-4 by 90.2%.**
- *"Upgrading to Claude Sonnet 4 is a larger performance gain than doubling the token budget on Claude Sonnet 3.7."* (Model tier > raw budget — echoes our S116 Haiku→Sonnet bump.)

## Architecture: orchestrator-worker, two tiers

**Lead** plans → persists the plan to external memory → spawns parallel subagents with defined objectives → synthesizes → decides if more cycles are needed. **Subagents** run clean-context, search, use interleaved thinking, return findings. A specialized **CitationAgent** attributes every claim at the end. **Outputs persist externally; the lead holds lightweight references, not full copies** (prevents token bloat from copying through history).

## The orchestrator prompt principles (the operational gold)

1. **Complete task descriptions — the #1 failure mode.** Each subagent needs **objective + output format + tools/sources + boundaries.** *"Short, vague instructions like 'research the semiconductor shortage' created duplicated work; detailed task descriptions prevented misalignment."*
2. **Effort-scaling rules in the lead prompt:** *"Simple fact-finding requires just 1 agent with 3-10 tool calls, direct comparisons might need 2-4 subagents… complex research might use more than 10 subagents."* Prevents over/under-investment.
3. **Parallelize at two levels** (lead spawns 3–5 at once; each subagent fires 3+ tools at once) → *"reduced research time by up to 90%."*
4. **Tool design = prompt design:** *"Agent-tool interfaces are as essential as human-computer interfaces."* A **tool-testing agent** that uses a flawed tool dozens of times and rewrites its description → **40% decrease in task completion time.**
5. **Let agents self-improve prompts:** *"given a prompt and a failure mode, they are able to diagnose why the agent is failing and suggest improvements."*
6. **Teach search progression:** start broad → evaluate → narrow. Agents default to over-specific queries.
7. **Extended thinking as the orchestration scratchpad** (how many subagents, what roles; subagents use interleaved thinking to evaluate each result).

## Eval discipline (directly portable to our mini-eval)

- **Start small:** *"With effect sizes this large, you can spot changes with just a few test cases."* ~20 queries; prompt tweaks moved 30% → 80%.
- **LLM-as-judge, one call, 5-criteria rubric:** factual accuracy, citation accuracy, completeness, source quality, tool efficiency. (When a clear answer exists, just verify correctness.)
- **Human eval is not optional:** testers caught agents preferring **SEO content farms over authoritative sources** — automation missed it. → encode source-quality heuristics explicitly.

## Production reliability

- **Stateful + compounding errors:** resume from **checkpoints**, not the beginning. Minor failures cascade.
- **Rainbow deploys:** *"gradually shifting traffic from old to new versions while keeping both running"* — for long-running stateful agents you can't interrupt mid-flight.
- **The synchronous bottleneck (unsolved at Anthropic):** the lead waits for all subagents; it **cannot steer them mid-execution.** Async would fix it but breaks coordination/state. *"The last mile often becomes most of the journey."*

## When multi-agent does NOT work

> *"Some domains that require all agents to share the same context or involve many dependencies between agents are not a good fit… most coding tasks involve fewer truly parallelizable tasks than research, and LLM agents are not yet great at coordinating and delegating to other agents in real time."*

Three anti-cases: **shared-context tasks, heavy interdependencies, most coding.** The test: *does it decompose into independent subtasks that need no mid-execution communication?*

---

# PART D — Claude plays Pokémon (long-horizon memory)

> **Provenance:** the Anthropic-primary material is thin — the *"1,234 steps"* note-taking example (context-engineering post), the *"real notes taken by Opus 4"* Navigation Guide (Claude 4 announcement), and the 3.0-couldn't-leave-the-house → 3.7-beat-3-gym-leaders framing. The rich harness/failure detail is **third-party** (Hershey's interview, LessWrong) — high-signal but lower-confidence; flagged as such.

## Core thesis: long-horizon coherence = note quality, not raw smarts

The agent has, in effect, **anterograde amnesia** — each context reset wipes working memory; the only thing that survives is what it wrote down. *"Whenever you hit refresh, everything they have figured out… is gone."*

## The harness

- **Perception:** screenshot **+ structured game-state read from RAM.** Vision-only fails — models can't tell passable from impassable tiles without the structured overlay.
- **Three tools:** button-press, a **Navigator** (point-to-location pathfinding that offloads spatial reasoning), and a **Knowledge Base** (self-managed persistent notes embedded in the prompt).
- **The loop:** ~30 actions → summarize that block ("accordion" summarization, older blocks condensed). **The knowledge base persists across every summarization boundary — it is never summarized away.**

## Memory design — the build-relevant core

1. **Two mechanisms, two jobs.** Accordion summarization = recency compression. Knowledge base = semantic persistence. *"Trying to keep everything in the summary can bloat it; the knowledge base is a way to track longer-horizon things."* **Don't conflate them.**
2. **Model-controlled, no fixed schema:** *"The model has full control over this knowledge base — it decides what to store and how to organize it."* It develops maps, achievements, combat strategies *"without any prompting about memory structure."*
3. **The canonical note:** *"for the last 1,234 steps I've been training my Pokémon in Route 1, Pikachu has gained 8 levels toward the target of 10."*

## Note quality is a correctness problem (the warning that matters most)

> *"Claude is utterly dependent on the quality of his notes. One incorrect assumption or hallucination embedded into a note can crater progress for days."*

The cascade (third-party but vivid): the agent misreads a **staircase as an elevator**, fails to find the elevator, then **renames the staircase "escalator" in its notes** to resolve the dissonance — and marches on with the hallucination now hardcoded as ground truth. Two corollaries:
- **A wrong note is worse than no note** — it propagates as authority. → cite-the-source-before-committing for anything written to durable memory (the physician pattern, Topic 2, applied to memory writes).
- **Agents have no difficulty signal:** *"they will not consistently record 'HOW TO SOLVE THAT PUZZLE THAT TOOK FOREVER' because they don't realize it took forever."* The hard-won insight is exactly what they fail to preserve — inject difficulty awareness (iteration count, rejection history) externally.

## Pokémon — other lessons

- **Strip harness complexity over time, don't add it** (Hershey *removed* scaffolding as models improved) → prune band-aid prompts on every model upgrade.
- **Same harness, different model = categorical jump** (3.0 stuck in the house → 3.7 three badges) → model capability is the real variable; the harness is a forcing function.
- **A secondary "critique/guide" model injected at the summarization boundary** redirected stuck states → the natural seam for an oversight/critic pass is the handoff moment.

---

# Application to OUR system (the diagnoses)

### Diagnosis 1 — The cell IS a Skill; author it with progressive disclosure
`SKILL.md` body = the **process skeleton only** (DR spine, diverge mandate, the swap-test rubric, voice rules). Move the awareness-stage reference, the concept/format menu, and the forbid-the-obvious bank to `references/`, loaded conditionally (*"Read references/X.md when…"*, not "see references/"). Per Topic 2: **principles + counter-examples, NO positive examples** (wide-output skill). Keep the body < 5,000 tokens — it's a per-turn tax.

### Diagnosis 2 — The upstream binders ARE Skills; the lean pass is a recurring tax
S117's "make binders lean" now has Anthropic's mechanism: *"every line is a recurring token cost."* Audit `agent/.claude/skills/{strategy,research,comp}/SKILL.md` for body bloat; push reference material to linked files. Right altitude = the coherent-unit test.

### Diagnosis 3 — The independent adversarial critic = an SDK subagent (THIS breaks the judge ceiling)
The conclusion said only **independence** breaks the judge ceiling, not iterations. Topic 4 supplies the mechanism: a **subagent with an isolated context window** (`AgentDefinition`, Read-only tools, a rival-CD system prompt, the swap-test rubric). Clean context = the fresh-eyes independence; a different `model` in frontmatter raises the ceiling further. This is the single most important construction primitive in the whole series for us. (Today's hooks use **self-selection** → ceiling-bound → "decent." This is the upgrade.)

### Diagnosis 4 — The vision-verify gate = SDK "visual feedback," but feed structured metadata, not just pixels
The render-vs-brief check is Anthropic's visual-feedback pattern (screenshot → checklist). **But Pokémon's lesson:** vision-only is unreliable; pair the image with **structured text** (the brief's claim, the promised visual mechanic, expected on-image copy) so the verifier compares against machine-readable intent, not a vibe. This is the direct fix for `project_eval_top_failure_mode_image_content`. Run it **once, as an end gate** (Topic 3) — never as the loop.

### Diagnosis 5 — The swap test is rules-based feedback → keep it out of "quality scoring"
Anthropic ranks rules-based feedback as **most robust**, LLM-judge as least. The swap test (competitor-swap / category-look / obvious-first-idea) is *rules-based* — that's why it beats a quality rubric (which "passes generic," per the conclusion). Frame the critic's job as **applying named rules and saying which failed and why**, not emitting a 1–10.

### Diagnosis 6 — Cell angle-by-angle memory = the knowledge-base pattern + note-quality discipline
When the cell works angle-by-angle it needs Pokémon's **two mechanisms**: a rolling session summary (recency) **and** a durable, model-controlled "decisions + why + user verdicts" store (semantics) that survives resets. Our D1 `messages` are the substrate, but not in cell-shaped form. **Critically:** apply note-quality-as-correctness — cite-source-before-commit for any durable note, or a hallucinated brand fact propagates exactly like the "escalator."

### Diagnosis 7 — Token-spend caveat: do NOT naively port "15× tokens" to the cell
The multi-agent token finding (80% of variance) is from **search-shaped, reality-graded** tasks. It applies to our **upstream** (research/comp) — spend tokens on deeper search, parallel sources, the tool-testing agent — and **reinforces** the conclusion's "invest in information acquisition." It does **NOT** apply to **cell generation**: more tokens there generate more variations of the *mode* (polishing slop; judge-ceiling-bound). Spend cell tokens on **breadth (diverge N concepts) and independence (the critic)** — never on iterating a single concept deeper.

### Diagnosis 8 — Our first-gen chain is correctly NOT parallel multi-agent
research → comp → strategy → cell has **tight sequential dependencies** (each needs the prior) — exactly Anthropic's "shared-context / heavy-interdependency → not a fit for multi-agent." Prompt chaining (Topic 1) is right. Parallelism belongs **inside** the cell (diverge = independent concepts) and in the critic — the genuinely independent sub-problems.

### Diagnosis 9 — The orchestrator/follow-up (Topic 1) gets the multi-agent prompt discipline
When we build the follow-up orchestrator: give each dispatched worker a **complete task description** (objective + output format + tools + boundaries) and put **effort-scaling rules** in the orchestrator prompt. The scope-schema enums (Topic 1) are the ACI; these are the per-worker briefs.

### Diagnosis 10 — Adopt the multi-agent eval template in `cloudflare/eval/mini-eval/`
Port the **5-criteria LLM-judge rubric** (accuracy / citation / completeness / source quality / tool efficiency) and the **start-small** discipline (≈20 queries; large effect sizes are visible early). **Share the swap-test definition** of "generic" between the runtime critic and the offline rubric (per the conclusion's three-rubrics rule).

### Diagnosis 11 — Build a tool-testing agent for our MCP tools
fal.ai and Perplexity are our agent-tool interfaces. A dedicated agent that exercises each dozens of times and rewrites the description bought Anthropic **40%** faster completion. Cheap, high-leverage, and *"agent-tool interfaces are as essential as human-computer interfaces."*

### Diagnosis 12 — Don't LLM-generate the cell skill from a vacuum
The genericness echo: a skill written from training-knowledge alone yields *"vague, generic procedures."* The cell skill must encode **our** S116/117 moves (DR spine, voice unlock, counter-example bank), or it becomes "be creative, avoid clichés" mush — the exact slop we're fighting, one level up.

### Diagnosis 13 — `PreCompact` hook for domain compaction (now with the API)
CLAUDE.md already names it; Topic 4 confirms the mechanism. Preserve campaign identity / hero product / current angle / image paths / user verdicts; discard raw research + comp tool dumps. Maximize recall first, then precision (Topic 3).

---

# Expert moves

1. **Author the cell as a Skill: skeleton in `SKILL.md`, depth in `references/`, conditional load triggers.** No positive examples.
2. **Make the critic a separate subagent with a clean context** — that *is* the independence the judge ceiling demands. Optionally a different model.
3. **Rank your feedback: rules > visual > LLM-judge.** Push checks up the hierarchy; the swap test is rules-based by design.
4. **Verify with structured metadata, not pixels alone** (Pokémon) — and verify once, as an end gate (Topic 3).
5. **Separate recency-compaction from semantic-persistence** in any long-horizon memory; model-control the store but verify what gets written.
6. **Treat note/memory writes as a correctness surface** — cite-before-commit; a wrong note is worse than none.
7. **Spend tokens where reality grades (upstream search), not where the judge ceiling caps (cell iteration).**
8. **Complete task descriptions for every worker** (objective/format/tools/boundaries) + effort-scaling rules in the orchestrator.
9. **Build a tool-testing agent** for fal/Perplexity; let it rewrite the tool descriptions.
10. **Eval small and early** with the 5-criteria judge; share the swap-test definition runtime↔offline.
11. **Strip harness complexity on every model upgrade** — prune band-aids that paper over fixed limitations.
12. **Keep skill bodies lean** — every line is a per-turn cost; right-altitude the scope.

# Pitfalls

- **One-shotting the cell skill from a vacuum** → generic procedures (the genericness conclusion, recursively).
- **A self-selecting critic** (same context that generated) → judge-ceiling-bound; polishes the mode. Independence is the fix, not more loops.
- **Vision-only verification** → unreliable; pair with structured intent.
- **Treating the swap test as a quality score** → loses the rules-based robustness; generic ads pass quality rubrics.
- **Porting "spend 15× tokens" to creative generation** → expensive slop. Tokens help search, not mode-escape.
- **Forcing the chain into parallel multi-agent** → it's a shared-context/dependency task; chaining is correct.
- **Terse subagent briefs** → duplicated work + gaps (Anthropic's #1 documented orchestration failure).
- **Over-comprehensive skills** → agent pursues irrelevant instructions; *"struggles to extract what's relevant."*
- **`context: fork` on a guideline-only skill** → returns nothing (needs an actionable task).
- **Unverified durable notes** → the "escalator" cascade; a hallucination becomes hardcoded truth.
- **Skill silently dropped after compaction** → re-invoke; don't assume it's still steering.
- **Forgetting the trigger floor** → a perfect description still won't fire on a task the model can do bare-handed.

# Source quotes worth keeping handy

- *"Multi-agent systems work mainly because they help spend enough tokens to solve the problem."*
- *"Token usage by itself explains 80% of the variance."*
- *"A skill should teach the agent how to approach a class of problems, not what to produce for a specific instance."*
- *"The best form of feedback is providing clearly defined rules for an output, then explaining which rules failed and why."*
- *"Agents that can check and improve their own output are fundamentally more reliable."*
- *"Subagents use their own isolated context windows, and only send relevant information back to the orchestrator."*
- *"The amount of context that can be bundled into a skill is effectively unbounded."*
- *"Every line is a recurring token cost."*
- *"Agent-tool interfaces are as essential as human-computer interfaces."* → *"a 40% decrease in task completion time."*
- *"Claude is utterly dependent on the quality of his notes."*
- *"The last mile often becomes most of the journey."*

---

# What to read next

**The learning series is complete (Topics 1–4 ✅).** The arc: *what shape* (1) → *how a prompt teaches* (2) → *what's in context* (3) → *how to build it* (4). Every piece of the unbuilt cell loop from `00-genericness-conclusion.md` now has a concrete primitive.

Go **build the cell skill** (SESSION_118 Part 7 #2): author it per Part A (skeleton + references, no positive examples), wire the **independent critic as a clean-context subagent** (Diagnosis 3), add the **structured vision-verify end gate** (Diagnosis 4), run it FORWARD on DailyObjects Angle 1 (hero = Lagoon Basalt tote), judge as a Type-A performance marketer, and prove brand-swap generalization (Arjun Infra).
