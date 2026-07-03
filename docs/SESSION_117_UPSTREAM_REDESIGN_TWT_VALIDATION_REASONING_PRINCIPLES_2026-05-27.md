# Session 117 — Upstream binder redesign (desire-thread + match-spine), TWT end-to-end validation, and the Anthropic reasoning-principles deep-dive

**Date:** 2026-05-27
**Branch:** `new-ui` (all changes uncommitted, per `feedback_no_commits_until_tested`)
**Status:** IN PROGRESS. Three things done: (1) the upstream binders (research/comp/strategy) + rubrics were **redesigned** around a desire-thread + a strategy "match-spine" + anti-skew/demand-check/playbook; (2) a **full end-to-end validation run** on a fresh brand (**The Whole Truth Foods**, whey) was produced on the new binders (Haiku research+comp, Sonnet strategy, judge off — manual eval); (3) we pulled **Anthropic's published guidance** on agents + prompting and reassessed the binders against it. **Next session = the live discussion: make the binders LEAN + more SOPHISTICATED for reasoning** (scaffold + examples + self-correction), grounded in the principles in Part 4.

> **Read first:** this doc → `SESSION_116_*` (the prior clean DailyObjects chain + the Sonnet bump it reverses) → the three binders `agent/.claude/skills/{research,comp,strategy}/SKILL.md`. Memory: `project_first_principles_redesign`, `feedback_binder_teaches_thinking_not_looking`, `feedback_eval_type_a_lens`.

---

## Part 0 — The arc of this session (how we got here)

We started from the dead end of the **cell** (Step F): every attempt to hand-build a great DR ad produced **slop or a "spec sheet."** Working live on the DailyObjects tote, we localized *why*:

- The user's verdict on candidate concepts: *"I don't care about the bag"* + *"try-hard / performative."*
- Root cause: **every concept was about the product and its proof, never the buyer's desire.** Proof without desire = a spec sheet; and when the substance is dull, you crank the *voice* to fake interest → performative.
- Deeper root: **the whole upstream pipeline captures TRUTH and OBSTACLES, never DESIRE.** Research mines problems/objections; comp finds the unsaid *claim*; strategy diagnoses the *blocker*. So the cell inherited rich proof/trust/objection material and **zero desire material** — and built the only thing that ore allows.

That diagnosis drove the upstream redesign (Parts 1–2). Then we validated on a fresh brand (Part 3). Then the user pushed on two architectural questions that opened the reasoning-principles work (Part 4).

---

## Part 1 — The desire-thread redesign (research + comp + strategy)

**The unifying fix:** thread a **desire ("pull")** + **claimable proof** through the whole chain so it reaches the cell, balanced against the existing obstacle/honesty rigor. The cell needs four things — **Pull · Proof · Pixels · Voice** — and we found it got only Voice.

### Research (`agent/.claude/skills/research/SKILL.md`) — *originates pull + proof*
- **§2c — "What the buyer wants" (JTBD), two levels:** macro/brand umbrella + **hero-product** JTBD (keyed to the reference image). Mined from real verbatim voice, never invented.
- **Verified claimable strengths** added to §1 (claim-vs-reality) — the *positive* mirror of gap-hunting; the cell may only claim what a source backs (honesty ceiling).
- **Reference image classifies the hero product** → triggers the hero-product JTBD probe + focuses the strengths read (not appearance-only anymore).
- **Anti-skew discipline — "a review is a lead, not a verdict":** prevalence (not a bare quote) · triangulate on the right product · name source bias + missing average · **a complaint ≠ a desire** (hygiene vs motivator).
- Rubric: new `want-and-strengths` criterion + weighting clause in `no-fabrication`/`gap-named`.

### Comp (`agent/.claude/skills/comp/SKILL.md`) — *demand-checks + reads desire + playbook*
- **Demand-check the white space:** open ≠ wanted. Cross-reference research's JTBD → **open-and-wanted / open-but-unwanted (trap) / demand-unverified**. *Consumes* research's desire, never re-gathers (comp probes rivals; research probes buyers).
- **Read rivals on desire, not just claims** (grounded in their actual ad copy).
- **Read winners twice — playbook AND wallpaper:** the *proven craft* (format/structure/mechanics) is transferable and worth modelling; the *angle* rides the rival's unfair advantage + triggers Meta's sameness penalty → don't copy it. (Answers the user's "shouldn't we copy proven ads?" — borrow the craft, differentiate the angle.)
- Rubric: `white-space-named` (demand-check), `axes-read` (desire), `ad-read-handled` (playbook/wallpaper).

### Strategy (`agent/.claude/skills/strategy/SKILL.md`) — *full rewrite to the MATCH-spine*
**Core reframe — the Bet is a MATCH:** a *winnable want* × the brand's *honest ability to deliver* × the *friction cleared*. Two failure poles it must avoid: blocker-only → spec sheet; desire-only → a pretty lie that burns trust.

New/changed moves (negative rigor all **preserved**):
- **NEW "Find the winnable want"** (first-class positive half): pull from JTBD, gated by *weighted-not-one-review · attention-already-exists · open-and-wanted (comp's demand-check)* + the buyer & awareness stage.
- **Blocker reframed** as the counterpart (not the spine); honest fork intact.
- **NEW proof gate** ("can we honestly back it?"): a promise without claimable proof gets reframed or flagged — honesty ceiling.
- **Prescribe = build the matches**; Gate 2 now scores proof-exists + demand-state.
- **Territory** carries *desire-to-evoke* + the playbook/wallpaper stance (match craft, contrast angle).
- **Deliverable** is two-sided (the want + the friction); the angle is a 4-part brief (buyer/awareness/desire · hypothesis · why+claimable-proof · territory).
- Rubric: `diagnosis` (two-sided, fails blocker-only), `honesty-fork` (proof-backed promises), `memo` (want+blocker), `angles` (already fails blocker-only + unverified proof).

### Formatting fix (all three deliverables)
The outputs were **fragmented** (bold-label stubs + run-on Territory walls). User chose **"clean structured"**: labeled fields one per line, Territory as a scannable 5-line list (Prove · Evoke · Differentiate-from · Register · Mandatories), consistent shape, sparing dividers. Added to each binder's "Writing the deliverable" section; strategy carries the canonical angle shape.

---

## Part 2 — Models / harness state

- **research + comp → Haiku 4.5 (`claude-haiku-4-5-20251001`)**, reversing S116's Sonnet bump. Rationale: production-realistic test of the *redesigned* binder on the cheap model (the open Sonnet-per-seat vs Haiku+lint-gate economics call). Comments in the apprentice files updated.
- **strategy → Sonnet 4.6** (unchanged; Opus 4.7 SDK-incompatible).
- **Judge OFF** via new `MINIEVAL_NO_JUDGE` env gate in `run-mini-eval.ts` (user evaluates manually → runs report "INCONCLUSIVE" by design, not a fail).
- Stale-key gotcha still applies: pass `PERPLEXITY_API_KEY`/`SCRAPECREATORS_API_KEY` as per-run overrides from `.env.local` (both validated 200/present this session).

---

## Part 3 — TWT end-to-end validation run (the artifacts)

Fresh brand, **The Whole Truth Foods** (thewholetruthfoods.com), hero = **whey protein**. Chosen to validate the redesign *generalizes* beyond accessories + the user knows it (ground-truth audit). Founder seed gathered live: goal = new-customer cold purchase; hero = whey; budget ₹2–5L/mo; audience = *unknown who converts cold* (→ audience-discovery test).

- **Reference image:** real Light Cocoa 24g whey pouch pulled live from `media.thewholetruthfoods.com` (og:image of the product page) — on-pack claims visible ("Cleanest, lightest whey protein. Ever.", 24g/scoop, 6.8g BCAA, whey isolate+concentrate, Trustified Gold). Site is Wix; shop at `shop.thewholetruthfoods.com`; whey split into **"pro" vs "beginners"** (a real audience signal — left for research to discover).

| Stage | Model | Output (on disk) | User verdict |
|---|---|---|---|
| Research | Haiku | `cloudflare/eval/mini-eval/results/research-2026-05-27-bets/thewholetruthfoods.md` | "good" |
| Comp | Haiku | `results/comp-2026-05-27-bets/thewholetruthfoods.md` (rivals: MuscleBlaze, OZiva, ON India, Wellbeing, Bal Bharat) | "covered good brands" |
| The Bet | Sonnet | `results/strategy-2026-05-27-bets/thewholetruthfoods.md` | "decent" — but outputs too fragmented (→ format fix) |

The Bet came out strong: two-sided diagnosis (want = "protein I can take daily without bloating + verify every ingredient"; friction = distrust of the "clean" promise), an **audience-discovery** test (Burned Buyer / Hesitant First-Timer + a conditional Clean-Food Person), explicit **proof gates** per angle ("what the creative may stand on — and only this"), and honesty preconditions (funnel trust layer, pricing/offer, taste-not-dessert). Fixtures live at `fixtures/{research,comp,strategy}/thewholetruthfoods/`.

---

## Part 4 — The Anthropic reasoning-principles deep-dive (THE THING TO CONTINUE)

The user raised two challenges:
1. *"Are we using the subagent just for workflow, not its reasoning?"*
2. *"The binder is just 'you are a performance marketer' + instructions — there's no reasoning harness."*

We pulled Anthropic's actual guidance to answer them honestly.

### Sources
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — workflows vs agents, the 6 patterns, real applications.
- [Prompting best practices](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/chain-of-thought) — current (Opus 4.7/Sonnet 4.6/Haiku 4.5).
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — "right altitude," high-signal tokens, subagents.
- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents).
- [Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) + [Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) — Skills = filesystem domain expertise (what our binders *are*).

### Answer to Challenge 1 (workflow vs reasoning)
- Our pipeline (research→comp→strategy→cell) is the **prompt-chaining workflow** — and that is **Anthropic-recommended** for cleanly decomposable tasks; *"add multi-step agentic systems only when simpler solutions fall short."* So the workflow is correct, not a deficiency. (The marketing-copy→translate and outline→check→write examples are literally our shape.)
- BUT we leave reasoning on the table in two fixable ways: **(a) no adaptive-thinking/effort tuning** (thinking is *off unless enabled*; *"raise effort rather than prompting around shallow reasoning"*); **(b) no self-correction loop** (single-shot strategy). The cell is where genuine agency (generate-diverse→cull = parallelization + evaluator-optimizer) is warranted.

### Answer to Challenge 2 (binder = instructions, no reasoning harness)
**Largely correct.** The binder does *role* + *why* well, but is missing the highest-leverage levers:
1. **Examples** — Anthropic's #1 steering lever; we have ZERO (deliberate, the leakage fear). Resolution below.
2. **A "how to think" structure** — quote-ground evidence first, weigh competing hypotheses, self-check.
**Caveat (also Anthropic):** *"Prefer general instructions over prescriptive steps… Claude's reasoning frequently exceeds what a human would prescribe."* → light scaffold, not a rigid procedure (aligns with "moves, not a checklist").

### The principles (grouped)
- **"Right altitude"** (context-engineering essay): *"specific enough to guide behavior, yet flexible enough to provide strong heuristics."* Too specific → fragility; too vague → no signal. **Governs everything.** Plus: *"find the smallest set of high-signal tokens"* (= lean binders).
- **Examples:** *"the 'pictures' worth a thousand words."* Use **diverse, canonical** examples, **NOT laundry lists of edge cases**; 3–5; `<example>` tags; **put `<thinking>` tags inside examples to teach the reasoning pattern.** ← This is the exact resolution to our template-collapse fear: *diverse examples that share no surface, only the move.*
- **Reasoning scaffold:** general>prescriptive; quote-ground first (their physician `<quotes>`→`<info>` pattern); competing hypotheses + confidence + self-critique; adaptive thinking.
- **Self-correction / evaluator-optimizer:** draft→evaluate-against-criteria→refine. Works when *(1) feedback demonstrably improves the output and (2) the LLM can give that feedback.* **Our trigger is met — the rubrics are the criteria.** Discrimination > generation (same insight as the cell's generate→cull).

### The case studies (catalog)
| Case study | Lesson |
|---|---|
| Customer support agents | Loop = conversation + action; billed per *successful resolution* (measurable success). |
| Coding agent (SWE-bench) | Works because tests verify + agent iterates on feedback; **absolute-filepath poka-yoke** lesson. |
| Evaluator-optimizer: literary translation | Evaluator LLM critiques nuance the translator missed → refine. Taste-laden output — *like the cell.* |
| Evaluator-optimizer: complex search | Evaluator decides if more searching is warranted. |
| Prompt chaining | "marketing copy → translate"; "outline → check criteria → write" — **our pipeline shape.** |
| Orchestrator-workers | Multi-file coding changes via central delegation. |
| Multi-agent research system | Subagents w/ clean context return 1–2k-token summaries → "substantial improvement over single-agent." |
| Claude plays Pokémon | **Structured note-taking** → coherence across thousands of steps. |
| Claude Code — compaction | Preserves arch decisions, discards redundant tool output. |
| Claude Code — JIT analysis | Analyzes large DBs without loading them (head/tail + queries). |
| Claude.ai clone (long-running harness) | 200+ features in JSON; initializer+coding agents; **one feature per session**; verify via browser automation; clean git state. |

---

## Part 5 — The proposed direction + OPEN DECISIONS (for next session)

**Direction (user's words):** *"make the files lean and more sophisticated for reasoning."* Lean = the "smallest high-signal token set" / "right altitude" principle. Sophisticated = the three levers, done the *general-not-prescriptive* way.

Open decisions to work through:
1. **Examples — the contested one.** Do we add a *small, diverse, `<thinking>`-traced* set that teaches the MOVES (Anthropic's #1 lever, resolved against leakage by diversity + thinking-traces), or hold the no-examples line (`MINIEVAL_NO_EXAMPLES`)? Leaning: try it, carefully — different verticals, teach the move not the surface.
2. **Reasoning scaffold.** Add a light *invitation* to each binder: quote-ground the load-bearing evidence → weigh 2–3 competing reads → self-check against the disciplines, before writing. NOT a numbered procedure.
3. **Self-correction pass.** In-prompt self-check (cheap) and/or a true evaluator pass reusing the rubric (the judge infra already exists). Decide which.
4. **Thinking/effort config.** Verify whether the harness `query()` enables adaptive thinking; likely enable it + keep effort high. (Concrete reasoning uplift independent of prompt wording.)
5. **Lean pass.** With "right altitude" + "smallest high-signal tokens" as the bar, audit the binders for bloat we can cut now that reasoning is installed structurally rather than via prose volume.
6. **Re-validate.** Re-run the TWT chain (and/or DailyObjects) after the changes; compare outputs. Then return to the **cell build** (still the Step-F goal), now with sharper upstream + the evaluator-optimizer pattern for generate→cull.

---

## Part 6 — Files changed this session (all uncommitted on `new-ui`)
- `agent/.claude/skills/research/SKILL.md` — JTBD (§2c) + verified strengths + reference-image-classifies-hero + anti-skew discipline + format note.
- `agent/.claude/skills/comp/SKILL.md` — read-rivals-on-desire + demand-check white space + playbook/wallpaper + disciplines + format note.
- `agent/.claude/skills/strategy/SKILL.md` — **full rewrite to the match-spine** + format note + canonical angle shape.
- `cloudflare/eval/mini-eval/rubrics/{research,comp,strategy}.md` — companion criteria for all of the above.
- `cloudflare/eval/mini-eval/apprentices/{research,comp}.ts` — model → Haiku 4.5 (+ updated comments).
- `cloudflare/eval/mini-eval/run-mini-eval.ts` — `MINIEVAL_NO_JUDGE` env gate.
- NEW fixtures: `fixtures/{research,comp,strategy}/thewholetruthfoods/` (+ reference image `light-cocoa-24g-whey.png`).
- NEW results: `results/{research,comp,strategy}-2026-05-27*`.

## Part 7 — Immediate next step
Resume the **Part 5 discussion** — design the lean + reasoning-sophisticated binder changes (scaffold + examples + self-correction), starting by deciding the **examples** question (#1). Nothing here is committed; the TWT artifacts are the before-state to compare against after the reasoning changes land.
