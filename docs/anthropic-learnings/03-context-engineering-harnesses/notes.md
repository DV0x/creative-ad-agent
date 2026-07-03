# Topic 3 — Context Engineering + Harnesses (Anthropic)

**Sources:**
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
**Deep-dive date:** 2026-05-28
**Why this matters for us:** This is the MACRO layer. Topic 2 was how a single prompt teaches thinking. This is what flows through the model's attention at each step, and the persistent structure AROUND the model that survives across sessions. One article is the *contents* of context; the other is the *container*.

---

## The two things, distinguished

- **Context engineering** = the discipline of curating what's IN the model's context window at each step (system prompt, tools, MCP, external data, message history).
- **Harness** = the framework AROUND the model that controls execution, scaffolding, state, and verification across sessions.

Contents vs container.

---

## The mental model — attention is a finite resource

> *"Like humans, who have limited working memory capacity, LLMs have an 'attention budget' that they draw on when parsing large volumes of context. Every new token introduced depletes this budget by some amount."*

**Tokens aren't free. Adding context is a cost, not a strategy.**

The mechanism — **context rot**:

> *"As the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases. This results in n² pairwise relationships for n tokens. As context length increases, a model's ability to capture these pairwise relationships gets stretched thin, creating a natural tension between context size and attention focus."*

Bigger context window ≠ better outcome. Quadratic cost to attention.

> *"Context must be treated as a finite resource with diminishing marginal returns."*

---

## Definitions

**Context engineering** — *"the set of strategies for curating and maintaining the optimal set of tokens during LLM inference, including all the other information that may land there outside of the prompts."*

How it differs from prompt engineering:
- Prompt engineering = *"writing and organizing LLM instructions for optimal outcomes"* — a discrete task.
- Context engineering = managing *"the entire context state"* across multiple turns. **Iterative** — every turn you decide what to pass. *"The curation phase happens each time we decide what to pass to the model."*

**Harness** (implicit) — the framework infrastructure that manages agent execution across sessions: scaffolding, environment setup, file structures, tool availability, state, testing. The Agent SDK is "a general-purpose agent harness."

**Division of labor:**
- **Harness controls:** environment, file layout, execution flow, available tools, testing infrastructure, state persistence.
- **Model controls:** strategic decisions, what to do next, how to implement, what to skip.

Harness = STRUCTURE. Model = decisions WITHIN the structure.

---

## The central principle — "right altitude"

> *"The right altitude is the Goldilocks zone between two common failure modes: hardcoding complex, brittle logic in prompts vs. providing vague, high-level guidance that fails to give the LLM concrete signals."*

> *"The optimal altitude strikes a balance: specific enough to guide behavior effectively, yet flexible enough to provide the model with strong heuristics."*

Two failure poles:
- **Too prescriptive** → brittle, high-maintenance, fragile.
- **Too vague** → no concrete signal, falsely assumes shared context.

**This is "moves not checklist" (our memory) in Anthropic's own words.** Governs all binder design.

---

## "Smallest high-signal tokens"

> *"Good context engineering means finding the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome."*

Crucial nuance:

> *"Minimal does not necessarily mean short; you still need to give the agent sufficient information up front to ensure it adheres to the desired behavior."*

The bar isn't "fewer words." It's **"every token earns its place."** A 500-line binder where every line carries signal beats a 100-line binder that needs another 400 lines to fix it. Efficiency = removing redundancy, not removing content.

---

## Three strategies for long-horizon work

### 1. Compaction
> *"Take a conversation nearing the context window limit, summarize its contents, and reinitiate a new context window with the summary."*

In Claude Code: *"The model preserves architectural decisions, unresolved bugs, and implementation details while discarding redundant tool outputs or messages."*

The art:
> *"The selection of what to keep versus what to discard. Overly aggressive compaction can result in the loss of subtle but critical context whose importance only becomes apparent later."*

Tuning rule: **maximize recall first** (capture everything relevant), **then improve precision** (eliminate superfluous). Low-hanging fruit: clear raw tool results once they're deep in history.

### 2. Structured note-taking (agentic memory)
> *"The agent regularly writes notes persisted to memory outside of the context window. These notes get pulled back into the context window at later times. Provides persistent memory with minimal overhead."*

Killer example — **Claude plays Pokémon**:
> *"For the last 1,234 steps I've been training my Pokémon in Route 1, Pikachu has gained 8 levels toward the target of 10."*

Maintains maps, achievements, combat strategies — all external, pulled in when needed. *"After context resets, the agent reads its own notes and continues multi-hour training sequences. This coherence across summarization steps enables long-horizon strategies impossible when keeping all information in the context window alone."*

(Anthropic shipped a file-based **memory tool** in public beta for exactly this.)

### 3. Sub-agents with clean context
> *"Rather than one agent attempting to maintain state across an entire project, specialized sub-agents can handle focused tasks with clean context windows. The main agent coordinates with a high-level plan while subagents perform deep technical work."*

Token economics:
> *"Each subagent might explore extensively, using tens of thousands of tokens or more, but returns only a condensed, distilled summary of its work (often 1,000-2,000 tokens)."*

> *"Clear separation of concerns—the detailed search context remains isolated within sub-agents, while the lead agent focuses on synthesizing the results."*

**This IS our apprentice architecture. Anthropic explicitly validates it.** *"Substantial improvement over single-agent systems on complex research tasks."*

### Selection criteria
- **Compaction** — *"maintains conversational flow for tasks requiring extensive back-and-forth."*
- **Note-taking** — *"excels for iterative development with clear milestones."*
- **Multi-agent** — *"handle complex research and analysis where parallel exploration pays dividends."*
- **Hybrid** — *"retrieve some data up front for speed, pursue further autonomous exploration at its discretion."*

---

## JIT (just-in-time) analysis — the hidden gem

> *"Rather than pre-processing all relevant data up front, agents built with the 'just in time' approach maintain lightweight identifiers (file paths, stored queries, web links, etc.) and use these references to dynamically load data into context at runtime using tools."*

Claude Code: *"The model can write targeted queries, store results, and leverage Bash commands like `head` and `tail` to analyze large volumes of data without ever loading the full data objects into context."*

The analogy: *"This mirrors human cognition: we don't memorize entire corpuses, but introduce external organization (file systems, inboxes, bookmarks) to retrieve relevant information on demand."*

Claude Code's hybrid: *"CLAUDE.md files are naively dropped into context up front, while primitives like glob and grep allow it to navigate and retrieve files just-in-time, bypassing stale indexing and complex syntax trees."*

---

## The Claude.ai clone harness — concrete patterns (from the harness article)

The reference long-running-agent build. Worth memorizing.

### Setup (initializer agent) — three foundational artifacts
1. **`init.sh`** — runs the dev server
2. **`claude-progress.txt`** — logs activities across sessions
3. **Initial git commit** — baseline state

### Feature definition (JSON)
200+ features as structured data:
```json
{
  "category": "functional",
  "description": "New chat button creates a fresh conversation",
  "steps": [...],
  "passes": false
}
```
Rule enforced: *"It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality."*

### One feature per session
> *"The next iteration of the coding agent was asked to work on only one feature at a time."*

Directly counters *"the tendency for agents to one-shot the app."*

### Session startup ritual (every session, same script)
1. `pwd` (identify dir)
2. Read git logs + progress file
3. Read features list, pick highest-priority incomplete
4. Run `init.sh` (start server)
5. Run a basic end-to-end test (new chat → message → response)
6. ONLY THEN begin new feature work

### Verification via browser automation
> *"Absent explicit prompting, Claude tended to make code changes but would fail to recognize that the feature didn't work end-to-end."*

Solution: Puppeteer MCP. Agents test *"as a human user would"* — catching bugs invisible in code review.

### Clean git state as recovery
> *"Use git to revert bad code changes and recover working states."*

**Core insight:**
> *"The harness succeeds by mimicking human engineering practices — clear handoff documentation, incremental feature work, version control discipline, and verification before sign-off."*

The hard truth about long-running agents:
> *"Each new session begins with no memory of what came before."* The `claude-progress.txt` + git history is the bridge.

---

# Application to OUR system

### Diagnosis 1 — Our apprentices ARE Anthropic-validated subagents ✅
Research / comp / strategy / cell each run with focused context and return distilled deliverables — exactly the clean-context-subagent pattern Anthropic calls *"substantial improvement over single-agent systems."* Don't second-guess the decomposition.

### Diagnosis 2 — Right altitude is the principle behind the S117 binder evolution
Pre-S117 binders drifted toward over-prescription. S117 moved toward right-altitude (desire-thread, match-spine, moves-not-checklist). Keep auditing for prescriptive bloat. *"Specific enough to guide, flexible enough to provide heuristics."*

### Diagnosis 3 — "Smallest high-signal tokens" = the lean pass S117 already named
S117 Part 5 #5 named it; Anthropic gave it the principle. The audit: every paragraph of every binder asked *"does this earn its place?"* Kill if not. Minimal ≠ short; signal-density is the bar.

### Diagnosis 4 — JIT: audit what each apprentice actually needs vs. what we pass
Cold-start hydrates from D1 (good — JIT). But the cell likely receives full research + comp + strategy when it may only need strategy + reference images. **Audit each apprentice's true input need.** The cell shouldn't read raw research transcripts if strategy already distilled them. (This is also a context-rot reduction.)

### Diagnosis 5 — No `progress.txt` equivalent for the cell
Pokémon + Claude.ai-clone both use external notes surviving context resets. When the cell works angle-by-angle, it needs a `cell-progress` equivalent: which angles drafted, which culled, what the user picked. D1 messages partially cover this but not in cell-shaped form.

### Diagnosis 6 — No verification step like Puppeteer-for-coding (REAL HOLE)
The harness article's deepest lesson: *"agents fail to recognize when their output doesn't work end-to-end."* For our cell, that's *"the generated image doesn't actually match the brief"* — the TOP failure mode in our eval data (`project_eval_top_failure_mode_image_content`). A verification step (vision-model check of generated image vs. brief) is the direct analog of browser automation. **This connects an Anthropic principle to our #1 known bug.**

### Diagnosis 7 — One-feature-per-session = one-scope-per-turn (Topic 1 connection)
Anthropic's harness pattern (one feature per session) IS our orchestrator-workers + scope-schema pattern (one scope per turn). Different domain, same principle: *don't one-shot the whole thing; commit to one bounded unit per session.* Two articles, same insight.

### Diagnosis 8 — Use the PreCompact hook for domain-specific compaction
CLAUDE.md notes the PreCompact hook can inject *"preserve campaign name, image paths, hook decisions."* Build a domain compaction prompt that **preserves**: brand identity, hero product, current angle, image paths, user verdicts on prior ads, format preferences; **discards**: research search results, comp scraping responses, intermediate tool outputs. Maximize recall first, then precision.

---

# Expert moves

1. **Treat tokens as a finite resource** — every token earns its place.
2. **Right altitude beats both extremes** — brittle prescription and vague guidance fail equally.
3. **Subagents with distilled summaries** beat single-agent state management.
4. **JIT > pre-loading** — load what's needed when it's needed via tools/queries.
5. **Compact early, preserve precisely** — recall first, then precision.
6. **External notes survive context resets** — filesystem (or D1) as long-term memory.
7. **Mimic human engineering practices in the harness** — version control, progress notes, verification, incremental work.
8. **Verify end-to-end** — agents don't notice when output doesn't actually work.
9. **One-feature/scope-per-session** — bound the scope of each invocation.
10. **"Do the simplest thing that works"** — Anthropic's repeated refrain.

---

# Pitfalls

- **Dumping everything into context** "to be safe" → context rot, degraded recall.
- **Over-prescriptive prompts** → brittle (wrong altitude, low end).
- **Vague prompts** → no signal (wrong altitude, high end).
- **Aggressive compaction** → loses subtle context whose importance only shows up later.
- **No verification step** → agent ships output that doesn't work and doesn't know it.
- **One-shotting** → agent tries the whole thing at once, half-finishes, loses state.
- **Pre-loading data the agent may not need** → wasted attention budget.
- **No persistent notes** → every new session starts blind.

---

# The single biggest insight

> **Context engineering is iterative — every turn you decide what flows through the model's attention. The harness provides the persistent structure; the model decides within it. As models improve, the model takes MORE of the decisions — but tokens stay finite, and curating the attention budget stays load-bearing forever.**

---

# What to read next

- Topic 4: Skills + Agent SDK + production agents — what a Skill IS (our binders ARE skills), how the multi-agent research system divides labor, the Agent SDK loop. The "how this works in practice" capstone.
