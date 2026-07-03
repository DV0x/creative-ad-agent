# Topic 2 — Prompting + Reasoning (Anthropic)

**Source:** Anthropic's unified prompt engineering guide (covers Opus 4.7 / Sonnet 4.6 / Haiku 4.5)
**Live URL:** https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/chain-of-thought
**Plus:** https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md (used as a real-world comparison)
**Deep-dive date:** 2026-05-28
**Why this matters for us:** This is the **micro-mechanics** layer — how a single prompt teaches a model HOW TO THINK. Most directly relevant to our binders.

---

## The mental model

> *"Think of Claude as a brilliant but new employee who lacks context on your norms and workflows. The more precisely you explain what you want, the better the result."*

**Golden rule:** *"Show your prompt to a colleague with minimal context on the task and ask them to follow it. If they'd be confused, Claude will be too."*

A prompt is not a spell. It's an **onboarding doc for a smart stranger.**

---

## The 6 universals (priority order)

### 1. Be clear and direct
- Specify the desired output format and constraints.
- Use numbered/bulleted steps when order or completeness matters.
- *"If you want 'above and beyond' behavior, explicitly request it rather than relying on the model to infer this from vague prompts."*

### 2. Add context — explain the WHY
- *"Less effective: NEVER use ellipses. More effective: Your response will be read aloud by TTS, so never use ellipses since the engine will not know how to pronounce them."*
- **Claude generalizes from the WHY.** Bare rules don't transfer to edge cases; explained rules do.

### 3. Examples (multishot) — *"one of the most reliable ways to steer Claude"*
Anthropic's exact words: *"Examples are one of the most reliable ways to steer Claude's output format, tone, and structure. A few well-crafted examples can dramatically improve accuracy and consistency."*

The prescription:
- **Relevant** — mirror the actual use case
- **Diverse** — cover edge cases; vary enough that Claude doesn't pick up unintended patterns ← the explicit anti-templatization lever
- **Structured** — wrap in `<example>` tags (multiple → `<examples>`)
- **3-5 is the sweet spot**

**Deep section below.** This is the contested topic.

### 4. XML structure
- Tag types of content: `<instructions>`, `<context>`, `<input>`, `<example>`, `<thinking>`, `<answer>`.
- Consistent, descriptive names. Nest naturally (`<documents>` → `<document index="n">`).
- Reduces misinterpretation; lets you reference sections precisely.

### 5. Long-context discipline
- **Long data at TOP, queries at BOTTOM.** *"Queries at the end can improve response quality by up to 30%."*
- Wrap inputs in `<documents>` → `<document_content>` + `<source>`.
- **Quote-ground FIRST.** The physician pattern:
  ```
  Find quotes from the patient records relevant to diagnosis.
  Place these in <quotes> tags. Then, based on these quotes,
  list diagnostic info. Place that in <info> tags.
  ```
  Cite-before-claim made structural.

### 6. Tell what TO do, not what NOT to do
- *"Don't use markdown" → "Your response should be composed of smoothly flowing prose paragraphs."*
- Positive instructions > negative instructions.

---

## Reasoning specifically — adaptive thinking + chain-of-thought

### Adaptive thinking (the new default in 4.6+)

Adaptive thinking (`thinking: {type: "adaptive"}`) replaces the older `budget_tokens` approach. The model dynamically decides when and how much to think, calibrated by the `effort` parameter.

Effort levels: `low / medium / high / xhigh / max`.

Two killer quotes:

> *"If you observe shallow reasoning on complex problems, raise effort to `high` or `xhigh` rather than prompting around it."*

> *"On internal evaluations, adaptive thinking reliably drives better performance than extended thinking."*

**Implication:** don't fight shallow reasoning with prose. Raise effort. Code change, not prompt change.

### Chain-of-thought in the prompt itself (when thinking is off, or when you want to shape it)

Four moves:

1. **Manual CoT** — *"Use structured tags like `<thinking>` and `<answer>` to cleanly separate reasoning from the final output."*
2. **`<thinking>` IN examples** — *"Use `<thinking>` tags inside your few-shot examples to show Claude the reasoning pattern. It will generalize that style to its own extended thinking blocks."*
3. **General > prescriptive** — *"A prompt like 'think thoroughly' often produces better reasoning than a hand-written step-by-step plan. Claude's reasoning frequently exceeds what a human would prescribe."*  ← endorses *"moves not checklist"*
4. **Self-check before finishing** — *"Append something like 'Before you finish, verify your answer against [test criteria].' This catches errors reliably."* ← single-call evaluator-optimizer

### The structured-research pattern (the hidden gem)

Tucked in the "agentic" section, but it's a prompt pattern for any binder needing rigorous reasoning:

> *"Search for this information in a structured way. As you gather data, **develop several competing hypotheses**. **Track your confidence levels** in your progress notes to improve calibration. **Regularly self-critique your approach and plan.** Update a hypothesis tree or research notes file to persist information and provide transparency."*

Four moves baked in: **competing hypotheses + confidence levels + self-critique + transparent notes.** Directly aligned with research/comp/strategy disciplines.

### 4.7's more-literal interpretation

> *"Claude Opus 4.7 interprets prompts more literally and explicitly than 4.6, particularly at lower effort levels. It will not silently generalize an instruction from one item to another."*

**Implication:** state scope explicitly. *"Apply the no-fabrication rule to EVERY claim in the output, including ones that feel obvious."*

---

# Examples — the deep dive

## How examples actually work (the mechanism)

Examples are **pattern completion / Bayesian prior**. The model treats the example set as evidence about what the answer should look like and locks onto whatever's **INVARIANT** across the set.

That's a feature when the valid output distribution is narrow (a JSON schema, a translation style, a coding pattern). It's a bug when the distribution should be wide (creative output where variety IS the point).

### Plain-English version (no jargon)

**"Bayesian prior" = a starting assumption that examples reset.** A *prior* is what you assume before you see specific evidence. "I'm thinking of an animal" → your guess is wide open (broad prior). "It's a pet, it purrs, it has whiskers" → you snap to *cat*. Each piece of evidence NARROWED your assumption. For the model, **the examples ARE that evidence.** Before examples, it could write the output a thousand ways. The moment you show 3 examples, it narrows to "oh, THIS kind of thing." That's why examples are the #1 steering lever — and why they're dangerous in creative work: **narrowing is the opposite of what you want when variety is the point.**

**"Locks onto the invariant" = it copies whatever's the SAME across your examples.** *Invariant* = the thing that doesn't change from one example to the next — the common thread. The model silently asks: *"What do all of these have in common? That must be what they want."* Whatever is the same = what it copies. Whatever differs = what it treats as free to vary.

**The concrete danger:** give research 3 examples that all happen to be sneaker brands, all ~200 words, all opening with "The buyer wants…". The model looks for the common thread and finds *four* invariants — sneakers, 200 words, that opening line, AND the real moves (triangulate JTBD, anti-skew, verify strengths). It can't tell which you *meant* to teach, so it copies all of them. Now even a hotel comes out as a 200-word sneaker-shaped doc opening with "The buyer wants…". That's templatization — it locked onto the surface invariants along with the real one.

**The fix (why diversity is load-bearing):** make the surface stuff VARY so the moves become the *only* invariant. Ex1: sneakers, 150 words, opens with a quote. Ex2: B2B SaaS, 300 words, opens with the JTBD. Ex3: hotel, 220 words, opens with the tension. Now the only common thread left standing is the moves — so the model is *forced* to learn the move, because it's the one invariant that survived. The surface has nothing in common, so there's no surface to copy.

**One line:** *the model copies whatever your examples share — so make them share ONLY the thing you're teaching, and deliberately vary everything else.*

## When examples templatize (failure conditions)

The model latches onto the most consistent feature. Templatization happens when:

1. **Surface features are shared** (same vertical, same length, same vocabulary) → model copies the surface, not the move.
2. **Examples are too few** (1-2). Insufficient diversity → model can't distinguish "the move" from "the surface."
3. **No `<thinking>` traces.** Model sees outputs only → assumes the OUTPUT is the pattern.
4. **Examples reinforce a "default."** All examples show the same answer-shape → that shape becomes mandatory.
5. **No counter-examples.** Model never learns the boundary.

## The 4 anti-templatization moves (priority order)

1. **Surface diversity is load-bearing.** Different verticals/products/voices/lengths. The MOVE has to be the only invariant. *Three examples all in sneakers = "you taught sneakers, not the move."*  ← Anthropic-explicit ("Diverse: vary enough that Claude doesn't pick up unintended patterns")
2. **`<thinking>` traces** — make the reasoning explicit; model picks up the procedure, not the result. ← Anthropic-explicit for teaching reasoning. The templatization-prevention angle is inferential (strong but inferential).
3. **Counter-examples ("here's what NOT to do, and why")** — bound the valid space from the wrong side.
4. **The swap test** — run the prompt on a brand NOT in your example set. If the output mirrors an example's surface, you've templatized. Iterate.

## The frontend-design finding (the killer data point)

Anthropic's own creative-domain skill — frontend-design SKILL.md — ships with **ZERO positive examples**.

What it uses instead:
- **Conceptual framing** ("BOLD aesthetic direction," "intentionality not intensity")
- **Explicit counter-examples** ("NEVER Inter / Roboto / Arial," "no purple gradients on white," "no Space Grotesk-style convergence")
- **Anti-pattern reasoning** — explains *why* clichés are clichés
- **Outcome-based comparisons** ("one orchestrated page load with staggered reveals beats scattered micro-interactions")
- **Principle-over-rule**

This contradicts the prompt guide's "examples are the #1 lever" claim on its face. Reconciling that contradiction is the deep learning.

## The reconciliation rule

> **Examples narrow. Use them when narrowing is what you want.**

| Output distribution | Strategy |
|---|---|
| **Narrow** (structured deliverable, fixed schema, defined style) | Multishot positive examples WITH `<thinking>` traces. Diversity load-bearing. |
| **Wide** (creative output where variety is the point) | Principles + counter-examples + outcome reasoning. NO positive examples. |

## The split for OUR pipeline

| Binder | Output type | Distribution | Example strategy |
|---|---|---|---|
| **Research** | Structured deliverable (labeled fields) | Narrow shape, varied content | **Multishot with `<thinking>`** — diverse content |
| **Comp** | Structured deliverable | Narrow shape, varied content | **Multishot with `<thinking>`** |
| **Strategy** | Structured deliverable (match-spine, 4-part angle) | Narrow shape, varied content | **Multishot with `<thinking>`** |
| **Cell** (creative output, when built) | Ad copy + visual — **unbounded creative** | WIDE | **Frontend-design pattern**: principles + counter-examples, NO positive examples |

**The S117 fear was correctly placed for the cell. It was over-applied to the upstream binders.**

## What a good upstream-binder example looks like (sketch)

```xml
<examples>
  <example>
    <brand_input>
      DTC apparel brand, hero = oversized linen shirt.
      Reference image: <flat-lay shot>
    </brand_input>

    <thinking>
      Hero-product classification: lightweight summer top.
      JTBD probe: macro (apparel) + hero (this shirt type).
      Buyer voice triangulation: comfort + breathability + "doesn't look
      like every linen shirt on Instagram" — the last is the *distinctive*
      desire, not a hygiene factor. Weighted, not one review.
      Anti-skew: 4 mentions / 2 sources → not single-voice noise.
      Strengths to verify: "GOTS-certified" — verified on-pack.
    </thinking>

    <deliverable>
      [labeled-field research output]
    </deliverable>
  </example>

  <example>
    <brand_input>
      B2B SaaS for dental practices, hero = patient-intake automation.
      No reference image.
    </brand_input>

    <thinking>
      Hero classification: SaaS workflow tool. No image → website + reviews.
      Buyer voice = practice managers, NOT dentists (audience-bias check).
      JTBD = "stop losing 15 minutes per intake to paper forms" —
      concrete, measurable, time-based.
      Anti-skew: dentist subreddit has 2 pricing complaints — HYGIENE,
      not desire. Don't put in want section.
      Strengths: "HIPAA-compliant" — verified via security page.
    </thinking>

    <deliverable>
      [labeled-field research output]
    </deliverable>
  </example>

  <example>
    <brand_input>
      Boutique hotel, hero = rooftop bar.
      Reference image: <bar at dusk>
    </brand_input>

    <thinking>
      Hero classification: experiential service. JTBD is experience-shaped.
      Buyer voice: "wanted a date spot that wasn't a chain" → macro want.
      Specific hero JTBD: "view-bar that doesn't feel like a hotel bar".
      The "doesn't feel like hotel" is load-bearing.
      Anti-skew: TripAdvisor skews complainers — discount 2 noise reviews,
      weight 8 "would return" reviews.
      Strengths: rooftop verified (image), seasonal cocktail menu (page).
    </thinking>

    <deliverable>
      [labeled-field research output]
    </deliverable>
  </example>
</examples>
```

**What's INVARIANT:** the MOVES (classify hero, triangulate JTBD, anti-skew, complaint-vs-desire, verify strengths). The `<thinking>` makes them explicit.

**What VARIES:** vertical, product type, image presence, JTBD shape, source bias direction, length and tone.

**Swap test:** run on a cosmetics brand (not in the set). If it mirrors an example's surface → templatized. If it produces a cosmetics-shaped deliverable applying the same moves → you taught the move.

## Honest synthesis caveat

What Anthropic LITERALLY says:
- **Diversity** prevents picking up unintended patterns. ← explicit
- **`<thinking>` tags** in examples teach reasoning patterns the model generalizes. ← explicit
- Anthropic does NOT explicitly claim `<thinking>` tags prevent templatization.

The combination ("diverse + `<thinking>` → anti-templatization") is a defensible synthesis but a synthesis. The load-bearing claim is **diversity**.

---

# XML tags — when to use them

**The rule:** Use XML where structure has to be machine-distinguishable or code has to extract a section. Use markdown everywhere else. (Anthropic's own SKILL.md files are mostly markdown.)

### Where XML earns its place

| Use case | Tag |
|---|---|
| Examples | `<example>` inside `<examples>` |
| Reasoning trace inside an example | `<thinking>` |
| Cite-before-claim (physician pattern) | `<quotes>` then `<info>` (or `<jtbd>`, etc.) |
| Multiple input docs fed downstream | `<documents>` → `<document index="N">` + `<source>` |
| Typed inputs to a downstream binder | `<research_doc>...</research_doc>` |
| Output Claude must produce, that code parses | `<deliverable>...</deliverable>` |
| Discrete instruction blocks (reusable, toggleable) | `<frontend_aesthetics>`, `<no_fabrication>`, etc. |

### Where markdown is fine

- Section headers (`## Discipline 1`)
- Bullet lists of moves and rules
- Definitions, prose explanations
- The skill's "what this binder does" intro
- Inline emphasis

### Concrete shape for our binders

```
## Examples
<examples>
  <example> ... </example>
  ... (3-5 of these)
</examples>

## How to produce the deliverable
[markdown prose with the moves, the disciplines, the WHY]

## Required output shape
<deliverable> ... </deliverable>
```

Body of the binder stays markdown. XML reserved for examples, citations, inputs/outputs, named-instruction blocks.

---

# Other loose ends worth knowing

### "Investigate before answering" (hallucination minimization)
> *"Never speculate about [evidence] you have not opened. Make sure to investigate and read relevant [sources] BEFORE answering. Never make claims about [things] before investigating unless you are certain — give grounded and hallucination-free answers."*

Same shape as our cite-before-claim discipline. Worth copying.

### Track confidence levels in the output
> *"Develop several competing hypotheses. Track your confidence levels in your progress notes to improve calibration. Regularly self-critique your approach."*

Each claim could carry implicit confidence (high/med/low + reason) rather than appearing as a flat assertion. Aligns with anti-skew.

### Prompt-style mirrors output-style (subtle but high-leverage)
> *"The formatting style used in your prompt may influence Claude's response style. If you are still experiencing steerability issues with output formatting, try matching your prompt style to your desired output style as closely as possible."*

**This is partly why S117's outputs were fragmented.** Binders are bullet-heavy → outputs come bullet-heavy. Want clean labeled fields? The binder's *own* prose has to demonstrate clean labeled fields, not describe them in bullets.

### "Think" word sensitivity (older models only)
> *"When extended thinking is disabled, Claude Opus 4.5 is particularly sensitive to the word 'think' and its variants."*

Mostly moot for us (4.6+ apprentices). Flagged for completeness.

---

# Application to OUR binders (the diagnoses)

### Diagnosis 1 — We have ZERO examples → skipping Anthropic's #1 lever
**Fix:** Add 3-5 diverse, canonical, `<thinking>`-traced examples to research/comp/strategy binders. Different verticals (apparel / supplements / hospitality / B2B SaaS / local services). The `<thinking>` traces show MOVES. Surface diversity prevents collapse. The S117 fear was right for the cell, wrong for the structured upstream binders.

### Diagnosis 2 — No quote-grounding step
**Fix:** Add the physician pattern explicitly. Research: *"Find verbatim quotes from buyer voice relevant to JTBD. Place in `<quotes>`. Then, based on these quotes, write the JTBD probe. Place in `<jtbd>`."* Cite-before-claim becomes structural, not optional.

### Diagnosis 3 — No self-check / evaluator pass
**Fix:** Append a small self-check to each deliverable section: *"Before finishing, verify your output against the discipline list (no fabrication / claim-vs-reality cited / hero-product JTBD present / etc.)."* Single-pass evaluator-optimizer for free.

### Diagnosis 4 — Thinking is probably OFF in the harness
**Fix (code-side):** enable `thinking: {type: "adaptive"}` + set `effort: "high"` for research/comp/strategy apprentices. Anthropic: *"adaptive thinking reliably drives better performance than extended thinking"* and *"raise effort rather than prompting around shallow reasoning."* One config change, measurable impact.

### Diagnosis 5 — Binders may be over-prescribing
**Fix:** Audit for prescriptive numbered procedures. Convert to general invitations ("weigh competing reads of the desire before committing"). Aligns with `feedback_binder_teaches_thinking_not_looking`.

### Diagnosis 6 — Prompt style is causing output fragmentation
**Fix:** The binders' own prose style shapes output style. If we want clean labeled fields, the binder must DEMONSTRATE clean labeled fields in its example outputs — not describe them in bullets.

### Diagnosis 7 — 4.7's literal-instruction quirk
**Fix:** Where we want a discipline to apply broadly, state scope explicitly. *"Apply the no-fabrication rule to EVERY claim, including ones that feel obvious."*

---

# Expert moves

1. **Show, don't tell** — examples > prose instructions (where narrowing is wanted).
2. **Quote-ground evidence before reasoning on it** (physician pattern, universal).
3. **`<thinking>` tags inside examples** teach the reasoning pattern.
4. **General invitations > prescriptive steps** — Claude generalizes; humans over-constrain.
5. **Add self-check before finishing** — cheapest evaluator-optimizer.
6. **Pull reasoning depth via `effort`, not prompt yelling.**
7. **Long data at top, query at bottom** — 30% quality lift, free.
8. **Match prompt style to desired output style** — markdown begets markdown; prose begets prose.
9. **State scope explicitly in 4.7** — literal interpretation means specify where rules apply.
10. **Tell what TO do, not what NOT to do.**
11. **Examples narrow. Use where you want narrowing (shape), avoid where you don't (creative content).**
12. **Surface diversity is the load-bearing anti-templatization lever.**
13. **XML earns its place where structure matters. Don't over-tag prose.**

---

# Pitfalls

- **No examples** → skipping the #1 lever (for structured-output binders).
- **Too few or too similar examples** → templatization.
- **Examples without `<thinking>`** → model picks up the OUTPUT, not the procedure.
- **Positive examples in creative-output domains** → narrows the space (frontend-design pattern is the antidote).
- **Prompting around shallow reasoning** instead of raising `effort` → wasted prose.
- **Over-prescriptive numbered procedures** → suppresses reasoning that would exceed the prescription.
- **Bullet-heavy binders producing bullet-heavy outputs** (style mirroring).
- **Bare rules without WHY** → don't transfer to edge cases.
- **XML-everywhere** → noisy, harder to read, no upside vs markdown for prose body.

---

# What to read next

- Topic 3: Context engineering + harnesses ("right altitude," "smallest high-signal tokens," subagents with clean context, structured note-taking, JIT analysis) — the MACRO view of what goes IN the context window.
- Topic 4: Skills + Agent SDK + production agents (Claude.ai clone, multi-agent research system, Claude plays Pokémon) — how this works in practice.
