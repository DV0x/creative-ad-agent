# Topic 1 — Building Effective Agents (Anthropic)

**Source:** https://www.anthropic.com/engineering/building-effective-agents
**Deep-dive date:** 2026-05-28
**Why this matters for us:** This is the foundational essay. It tells us the SHAPE of our system (chain + orchestrator), the language we should use to reason about it, and the principle for when to add complexity. Read this *before* designing the orchestrator + follow-up routing.

---

## TL;DR — the one big idea

Agentic systems are a **SPECTRUM**, not a binary. From simplest → most complex:

```
Augmented LLM  →  Workflows  →  Agents
(single call)     (predefined     (model directs
                  code paths)      its own process)
```

**Move RIGHT only when you have to.** Every step right buys flexibility and costs predictability + debuggability + cost.

Official definitions:
- **Workflow** = "LLMs and tools are orchestrated through predefined code paths."
- **Agent** = "LLMs dynamically direct their own processes and tool usage, maintaining control over how they accomplish tasks."

The dividing line: **who owns the orchestration?** You (the engineer) in workflows. The model in agents.

---

## The taxonomy

### Building block — the Augmented LLM
A single LLM call with retrieval, tools, and memory. Many products never need anything more. Default to this until proven insufficient.

### Workflow patterns (you control the path)

| Pattern | What it does | When to use |
|---|---|---|
| **Prompt chaining** | Sequential steps; each call processes previous output. Optional code "gates" between steps. | Task decomposes cleanly into fixed subtasks. *(Marketing copy → translate. Outline → check → write.)* |
| **Routing** | Classify input → dispatch to one of N specialized handlers. | Distinct categories benefit from specialized prompts. *(Support triage. Haiku-vs-Sonnet by difficulty.)* |
| **Parallelization — sectioning** | Different sub-tasks run simultaneously, code aggregates. | Sub-tasks are independent + parallelizable. *(Guardrails alongside the main loop.)* |
| **Parallelization — voting** | Same task run N times for diverse outputs. | Need confidence via multiple perspectives. *(Code vulnerability review.)* |
| **Orchestrator-workers** | Central LLM **dynamically** decomposes and delegates to workers. Sub-tasks NOT predefined. | Can't predict the decomposition ahead of time. *(Multi-file code changes.)* |
| **Evaluator-optimizer** | Generator + critic loop: draft → evaluate against criteria → refine. | (a) Feedback demonstrably improves output AND (b) an LLM can produce that feedback. *(Literary translation.)* |

### Agent pattern (the model controls the path)

| Pattern | What it does | When to use |
|---|---|---|
| **Autonomous agent** | Open-ended loop: plan → act → environmental feedback → repeat. | Open-ended problems where steps can't be predicted; bounded blast radius; substantial trust. *(Claude Code on SWE-bench. Computer use.)* |

---

## The 3 explicit principles

1. **Simplicity** — "Maintain simplicity in your agent's design."
2. **Transparency** — "Explicitly show the agent's planning steps."
3. **Carefully crafted Agent-Computer Interface (ACI)** — treat tool docs with the same rigor as the main prompt.

**Overarching philosophy:** *"The most successful implementations used simple, composable patterns rather than complex frameworks."* — Anthropic's clearest line in the essay.

---

## The ACI / tool design lesson (high-leverage, often missed)

> *"We actually spent more time optimizing our tools than the overall prompt."*

Four concrete moves:

- **Give the model tokens to think** before committing to a structured output.
- **Match formats the model has seen naturally** (markdown > custom DSL).
- **No formatting overhead** — no line-counting, no escape-character minefields.
- **Poka-yoke** — make wrong calls structurally impossible. *(Their canonical example: tools required absolute filepaths. Relative paths produced consistent errors. Switched → model used flawlessly.)*

---

## Case studies — what made them tractable

Anthropic only highlights TWO production-grade agent applications. Both share one structural property: **measurable ground truth.**

- **Customer support** — success = user resolution → companies charge **per successful resolution**.
- **Coding agents (SWE-bench)** — code is verifiable through automated tests → agent iterates on test feedback.

**The silent thesis:** *agents work where reality grades the output.* If reality can't grade it, you need a **stand-in grader** — which is exactly what evaluator-optimizer is for.

This is the key constraint for creative work: there's no automated test, so the rubric IS the grader. That's why our cell maps to evaluator-optimizer, not autonomous agent.

---

# Application to OUR system

## What pattern our pipeline actually is

| Layer | Pattern | Why |
|---|---|---|
| **First-gen** (research → comp → strategy → cell) | **Prompt chaining** | Task decomposes cleanly into fixed sequential subtasks. Each stage's output feeds the next. This is Anthropic's recommended shape for our problem. ✅ |
| **Follow-ups** | **Orchestrator-workers** (which absorbs routing as its degenerate case) | The session orchestrator decides per-input which workers to fire and with what scope. |
| **Cell internals** (future) | **Parallelization (sectioning) + evaluator-optimizer composed** | Generate-diverse → cull against rubric. Both Anthropic-supported patterns; no need for autonomous agency. |

**We are NOT going to autonomous-agent.** The space is bounded; we can enumerate the legal scopes; predictability matters more than open-endedness.

---

## Why orchestrator-workers > routing for our follow-ups

Both patterns answer "which handler runs?" — but at different granularity:

- **Routing** = pick ONE of N predefined paths. Decision: "which bucket?"
- **Orchestrator-workers** = build a PLAN of M workers (M can be 0, 1, or many). Decision: "which workers, what order, what scope?"

About 60-70% of follow-ups are clean buckets (routing handles them). 30-40% are compound or cascading (routing breaks). You can't ship just routing — the compound cases fail it.

**Key insight:** routing is the *degenerate case* of orchestrator-workers (1 worker picked). They're not two architectures — they're a spectrum of how many workers the orchestrator chooses to fire.

**Don't build both. Build one orchestrator that outputs a structured scope.** When it picks 1 stage, it *behaves* like routing. When it picks many, it's orchestrator-workers. Same code, both patterns.

---

## The scope schema — the ACI for the orchestrator

The orchestrator outputs a JSON object the dispatcher reads. The schema is the ACI.

### Conceptual shape

```typescript
{
  intents: [                              // list of intents (compositional)
    {
      kind: enum,                         // ONE of a fixed list — the "what"
      target?: { ... },                   // optional — the "what to"
    },
    ...
  ],
  stages_to_run: ("research" | "comp" | "strategy" | "cell")[],
  reuse: ("research" | "comp" | "strategy" | "cell")[],
}
```

### Starter `kind` vocabulary (grow from logs)

| `kind` | Meaning | Typical `stages_to_run` |
|---|---|---|
| `extend_angles` | Add more angles to existing strategy | `["strategy"]` (extend mode) + optional `["cell"]` |
| `new_audience` | Re-strategize for a different audience | `["strategy", "cell"]` |
| `regenerate_with_new_reference` | New image, SAME product (different angle/lighting) | `["cell"]` |
| `new_hero_product` | New image, SAME brand, DIFFERENT product | `["research", "comp", "strategy", "cell"]` (research partial) |
| `new_brand` | Different brand entirely | full chain, no reuse |
| `edit_hook` | Single hook rewrite for one ad | `["cell"]` (scoped) |
| `edit_image` | Single image regen | `["cell"]` (scoped) |
| `add_visual_inspiration` | Mood/style reference (not a product) | `["cell"]` |
| `qa_only` | Pure question about campaign | `[]` |
| `other` | **Fallback** — triggers clarify-or-escalate path | varies |

**Why enums:** Anthropic's "make wrong moves structurally impossible." Model can't invent a stage name; code can't misinterpret prose. Free-form `scope: string` loses all the safety.

### Compound requests = multiple intents queued

User: *"Add this reference image AND give me two more angles, then redo image 3"*
→ `intents: [{kind: "new_reference"}, {kind: "extend_angles", count: 2}, {kind: "edit_image", target: {angle: 3}}]`

Code runs them in order (or parallel where independent). This is why we use `intents: [...]` not `scope: "one_thing"`.

---

## Where this lives in code

Three pieces, three files:

1. **Schema** (the contract) — new file: `cloudflare/src/lib/followup-plan-schema.ts`. TypeScript types + matching JSON Schema for the tool's `input_schema`. Single source of truth.

2. **Orchestrator prompt** — in `cloudflare/src/durable-objects/campaign-session.ts` (or its prompt builder). Adds a `plan_followup` tool the orchestrator MUST call before doing anything.

3. **Dispatcher** — also in `campaign-session.ts`. After the orchestrator's tool call, code reads `intents` and dispatches: *"if any intent.kind needs strategy, queue strategy with this scope; if any needs cell, queue cell with that target."*

---

## Routing decisions that involve new artifacts (images, URLs, files)

**Key principle:** *routing decisions that depend on evidence must perceive the evidence first.*

For pure-text follow-ups, the words ARE the evidence — text classification suffices.

For follow-ups with new artifacts (e.g., a new reference image), the orchestrator needs a **perception step** before it can fill out the schema. This is the *Augmented LLM* building block: orchestrator + vision + memory of the existing artifact.

### Flow

```
User uploads new image + "make ads with this"
     │
     ▼
[PERCEIVE]  small Haiku-vision call:
            "Compare image A (existing) and image B (new). Return:
             same_product | same_brand_diff_product | different_brand | inspiration_only"
     │
     ▼
[DECIDE SCOPE]  scope follows directly from perception:
   same_product            → kind: "regenerate_with_new_reference"
   same_brand_diff_product → kind: "new_hero_product"
   different_brand         → kind: "new_brand"
   inspiration_only        → kind: "add_visual_inspiration"
```

### Three strategies for the perception step (use all three)

| Strategy | When | Cost / latency |
|---|---|---|
| **A — Vision check** | High-confidence cases | ~$0.001, ~500ms (small Haiku vision call) |
| **B — Ask the user** | Vision returns `unclear` or confidence is low | 1 round-trip with user; never wrong |
| **C — Default to research-and-let-it-decide** | Last-resort fallback; safety over speed | Full research run (research already classifies hero from image — built in S117) |

Pragmatic combo: **A for clear cases, B for ambiguous, C as the safe default for low-confidence edges.**

---

## The growth pattern (the bit most people miss)

You don't design every `kind` value on day one. You:

1. **Ship a starter set** (5-8 values covering obvious cases).
2. **Log every `kind: "other"`** + the user's actual prompt.
3. **Weekly review the logs** — look at what `other` cases looked like.
4. **Promote frequent patterns** into named `kind` values.

After a month: ~12-15 well-earned values covering 95%+ of follow-ups. You'll know exactly which 5% needs the fallback path.

This is Anthropic's *"measure performance and iterate"* applied to the scope schema. Vocabulary grows from data, not imagination.

---

## Fallback strategies (the unknown case must have a defined behavior)

When `kind: "other"` triggers, choose:

- **(a) Clarify** — orchestrator asks the user a focused question. *"Do you want to (i) regenerate all 6 angles with this new reference, or (ii) replace angle 3's image only?"* Best UX for ambiguous inputs.
- **(b) Default to full regen** — append the user's literal request to the next strategy prompt and run the full chain. Slow + costly, but never crashes.
- **(c) Escalate to a more agentic handler** — broader-scope model call with full conversation. Use sparingly, log everything.

**Never crash. Always degrade to something predictable.**

---

# Expert moves — what separates pattern-knowledge from expertise

1. **Default to the simplest thing that works.** Augmented LLM > workflow > agent. Resist sophistication.
2. **Diagnose the SHAPE of the problem** before picking a pattern (decomposable / categorical / parallel-able / iterative-refinable / open-ended).
3. **Compose patterns; don't invent new ones.** The cell = chaining + parallel sectioning + evaluator-optimizer composed.
4. **Tools as a first-class design surface.** Anthropic puts more effort there than on the prompt. The scope schema IS a tool.
5. **Routing on evidence = perceive first.** Never route blind.
6. **Measure on ground-truth outcomes** (or build a stand-in grader if reality can't grade).
7. **Avoid frameworks early.** They hide the prompts. Raw SDK + Skills.
8. **Iterate on prompt + tools + measurement together.** Not separately, not sequentially.

---

# Common pitfalls

- **Over-engineering before validation** — building orchestrator-workers when augmented LLM would have shipped.
- **Misunderstanding framework abstractions** — frameworks hide prompts; debugging gets harder.
- **Poor tool documentation / design** — agents fail on tool affordances, not reasoning.
- **Free-form scope decisions** (`scope: string`) — loses all the ACI safety.
- **No fallback path** — schema doesn't handle the unknown case → user gets stuck.
- **Routing blind on evidence-bearing inputs** — orchestrator picks a bucket without inspecting the new image.
- **Schema-by-committee** — trying to enumerate every possible request before shipping. Never ships.

---

# Open questions / things to think about when building

- **Implementation choice for the orchestrator's tool call:** Claude SDK tool with `input_schema` (validated automatically) vs structured-output via response format? *(Tool with input_schema is the cleanest, since it gives us the poka-yoke for free.)*
- **Where does the perception step live?** A new helper inside `campaign-session.ts`? A separate "perception" tool the orchestrator can call before `plan_followup`? Order-dependence matters.
- **Telemetry shape:** what gets logged per follow-up? At minimum: user prompt, orchestrator's `intents` output, dispatched stages, success/failure, latency. Powers the "promote from logs" loop.
- **Confidence thresholds:** what perception confidence triggers Strategy B (ask) vs Strategy C (research-fallback)? Empirical tune.
- **Backward-compat:** the existing `project_followup_intent_classification` memory entry says follow-ups currently always full-regen. The new orchestrator REPLACES that behavior — staged rollout?

---

# Source quotes worth keeping handy

- *"The most successful implementations used simple, composable patterns rather than complex frameworks."*
- *"Only increasing complexity when needed."*
- *"Agents can handle sophisticated tasks, but their implementation is often straightforward. They are typically just LLMs using tools based on environmental feedback in a loop."*
- *"We actually spent more time optimizing our tools than the overall prompt."*
- *"By following these principles, you can create agents that are not only powerful but reliable, maintainable, and trusted."*
- ACI / poka-yoke: *"We changed the tool to always require absolute filepaths — and the model used this flawlessly."*

---

# What to read next

- Topic 2: Prompting + reasoning (chain-of-thought, examples-as-#1-lever, `<thinking>` tags, "general not prescriptive") — the micro-mechanics of how a binder teaches reasoning.
- Topic 3: Context engineering + harnesses ("right altitude," "smallest high-signal tokens," subagents with clean context, structured note-taking, JIT analysis) — the macro view of what goes IN the context window.
- Topic 4: Skills + Agent SDK + production agents (Claude.ai clone, multi-agent research system, Claude plays Pokémon) — how this works in practice.
