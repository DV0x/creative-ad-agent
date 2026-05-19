# Session 108 — Strategy binder built, and validated across 3 brands

**Date:** 2026-05-19
**Branch:** `new-ui`
**Commits:** none (skills + docs only — nothing tested end-to-end, nothing committed)
**Goal:** Resume the first-principles redesign at Phase 1. Scope Phase 1, then build the first and highest-stakes piece — the **strategy binder** — and run the gate-before-scaling mini-eval on it.

---

## TL;DR

- **Phase 1 Step 1 is done: the strategy binder is written.** Two files in `agent/.claude/skills/strategy/` — `SKILL.md` (the method, judgment-not-procedure, mentor voice) and `worked-examples.md` (3 cross-vertical worked cases).
- **It was mini-eval'd BY HAND against 3 deliberately different brands** — Ravila Grand Hotel (local hotel / booking), The Whole Truth Foods (national D2C / purchase), TheRateFinder (Canadian mortgage lead-gen / lead). **All GO.** The reasoning engine held on every shape.
- **Two crack-fix passes** folded back into the binder: 5 over-fit-to-Ravila cracks (found by the TWT run), then the "brand-not-ready" move + the "run it anyway" branch (found by the TheRateFinder run).
- **Phase 1 was scoped** along the way: `implementation-plan.md` gained §4.1 (apprentice identities), §4.2 (9-binder inventory + per-binder mini-evals), and §5 (the build sequence + Step 0 harness ticket + a status block).
- **Key method decision:** the strategy binder is ONE vertical-agnostic method + a growing library of cross-vertical worked examples — **never split per vertical** (a vertical playbook reintroduces stereotype-matching, the exact failure being killed).
- **Nothing built in code.** The strategy `AgentDefinition` (the apprentice) and the mini-eval harness do not exist yet — the mini-eval was run by hand.

---

## Next session opener

> Resume the first-principles redesign — **Phase 1, the machinery**. Read in this order:
> 1. `docs/SESSION_108_*.md` (this file) — what was built and decided.
> 2. `docs/eval-corpus/implementation-plan.md` — §5 build sequence + the Status block; §4.1, §4.2.
> 3. `agent/.claude/skills/strategy/SKILL.md` + `worked-examples.md` — the finished strategy binder (the Step-1 deliverable).
>
> **Two build tasks, this order:**
> 1. **Step 0 — the mini-eval harness** (`cloudflare/scripts/mini-eval/`, a plain local Node script — see `implementation-plan.md` §5 Step 0 ticket).
> 2. **The strategy `AgentDefinition`** — the programmatic apprentice that loads the strategy binder (`cloudflare/sandbox/agents/` — verify against how `agent-runner.ts` imports).
>
> Then run the strategy mini-eval *for real* (automated, not by hand) to confirm the by-hand GO. Then Step 2a — the other 8 binders.
>
> Do NOT start the other binders or the orchestrator rewrite before the harness exists — every binder after strategy must be evaluable automatically, not by hand.

---

## What happened

### 1. Phase 1 got scoped (then we stopped scoping)

Picked up from S107's "scope Phase 1 task-by-task." Produced, in `implementation-plan.md`:
- **§4.1 — apprentice identities.** A 7-persona team (orchestrator = dispatcher, B = research analyst, C = competitive-intel analyst, D = Head of Performance Marketing, D-critic = skeptical head of growth, F = direct-response creative, G/H = media buyer). Strategist locked as **performance** marketing, not growth (scope boundary: Meta paid creative test, not the funnel).
- **§4.2 — binder inventory.** 9 binders (7 new + 2 rewrites), each with its own mini-eval. Corrected the plan's "~4 new binders" undercount.
- **§5 — the Phase 1 build sequence.** Single thread (Step 0 harness → Step 1 strategy binder) → fork (2a: other 8 binders ∥ 2b: harness engineering) → integrate → 🚦 gate. Step 0 mini-eval harness = a plain **local Node script** (`cloudflare/scripts/mini-eval/`), not staging.

The user then called a halt — the scoping had become rigid "ticket" work with no room to think. **Pivoted from planning to doing.** (Captured as the `feedback_dont_over_structure_planning` memory.)

### 2. The strategist's identity + jobs were reasoned out

Identity = **Head of Performance Marketing**, a fractional-consultant framing (serves a different founder each campaign → explains its reasoning, protects the client's money). Jobs-to-be-done: diagnose the blocker → prescribe competing angles → right-size to budget → frame the creative (visual lane) → justify legibly. Plus the honesty addition: **"is creative even the problem?"** — name the non-creative ceiling, don't be a yes-man.

### 3. Ravila Grand Hotel — worked end-to-end as a real reasoning exercise

4 parallel research agents + a Chrome pass. The research overturned the brand's self-portrait: the website sells a "Premium Business Hotel near HITEC City," but the reviews, the gallery photos (budget rooms staged with party balloons), the hidden banquet halls, and the real commute times showed a **budget celebration/events hotel mis-positioned as a corridor business hotel**. Produced The Bet — an **audience-discovery test**: 3 competing "who" bets (celebration stay / family-visit / hospital-stay). Surfaced the local-events calendar thread and the current-date-anchoring rule.

### 4. The strategy binder was written

The session's reasoning trail was distilled into `SKILL.md` (the method) + `worked-examples.md` (Ravila as the first worked case). Decision: skills are judgment-not-procedure — moves, not steps; worked examples carry the teaching.

### 5. Vertical-split question — resolved

Decided **against** per-vertical strategy binders. The method is vertical-agnostic; a vertical playbook would reintroduce stereotype-matching (a "hotel playbook" would have produced the exact Ravila wrong-turn). Vertical breadth lives in the **worked-examples library**; genuine vertical priors belong in the *research* binder as lenses, not in strategy as assumptions.

### 6. Mini-eval #1 — The Whole Truth Foods

Ran the binder (as written) on TWT. The method **generalized** — it correctly flipped the test shape from audience-discovery (Ravila) to a **message test** (TWT knows its audience; the unknown is what to say about a price/value blocker). But it exposed **5 cracks**, all from over-fitting the Ravila shape: (1) assumes founder facts exist; (2) triangulation framed as lie-detection only; (3) the 2-gate screen built for audience tests; (4) visual lanes assume from-scratch assignment; (5) the calendar thread is local-business-shaped. **All 5 fixed in `SKILL.md`.** TWT added as worked example #2.

### 7. Mini-eval #2 — TheRateFinder

Ran the binder on a Canadian mortgage lead-gen platform. The engine held again (triangulation found a *third* kind of self-portrait gap — a brand "at war with itself"; the honesty fork carried the whole diagnosis). But it exposed the **"brand-not-ready" gap**: the binder had no move for a brand that should not be marketed yet (no licence shown, no reviews, leaky funnel). Added a new move — **"judge whether the brand is ready to be marketed"** (3-setting spectrum; the second kind of un-runnability = the destination leaks) — plus the **"run it anyway" branch** (founder overrides → adapt to a capped diagnostic creative-learning test, don't refuse, don't comply blindly). Both fixed in `SKILL.md`. TheRateFinder added as worked example #3.

---

## Decisions locked this session

| Topic | Decision |
|---|---|
| Strategist identity | **Head of Performance Marketing** — performance, not growth (scope = Meta paid creative test, not the funnel); consultant framing |
| Binder structure | One **vertical-agnostic method** + a growing library of cross-vertical **worked examples**. NEVER split per vertical |
| Skill form | Judgment-not-procedure — "moves," not numbered steps; mentor voice; teaching lives in worked examples incl. the wrong turns |
| Apprentice identities | 7-persona team — §4.1 of `implementation-plan.md` |
| Binder inventory | 9 binders (7 new + 2 rewrites), each ships its own mini-eval — §4.2 |
| Build sequence | Step 0 harness → Step 1 strategy binder → fork (2a binders ∥ 2b harness eng) → integrate → 🚦 gate |
| Mini-eval harness | A plain **local Node script** (`cloudflare/scripts/mini-eval/`), not staging — it tests a binder, which behaves the same anywhere |
| Strategy binder status | **Written; hand-validated GO across 3 brands; cracks fixed.** Step 1 substantially done |

---

## The strategy binder — what `SKILL.md` encodes (summary)

So next session need not re-read the whole file. The method, as moves:

- **The reframe** — a doctor, not a blender. The product is a *judgment* (The Bet), not ads.
- **What you hold** — `research.md` + `competitors.md` + founder facts + current date; no web access; read like a detective; missing founder facts → state assumptions explicitly.
- **Never inherit the brand's self-portrait** — triangulate. 3 kinds of gap: a lie / true-but-not-the-blocker / a brand at war with itself.
- **Pin the win** — the conversion event; warm vs cold demand.
- **Diagnose the blocker** — the single biggest one; the honesty fork (creative-addressable vs not).
- **Judge whether the brand is ready to be marketed** — 3 settings (ready / flagged-but-testable / not-ready); the 2 kinds of un-runnability (budget can't read it / the funnel leaks); the "run it anyway" branch.
- **Read what kind of uncertainty** — unknown audience → audience test; unknown message → message test.
- **Prescribe** — generate freely, screen hard (Gate 1 mechanical, Gate 2 strategic, portfolio check); right-size N to budget.
- **The threads** — local/seasonal demand calendar + date-anchoring; reference images / visual reality.
- **Frame the creative** — assign each angle a visual lane (lane, not craft; treatments-within-identity for established brands).
- **Write The Bet** — memo + conversion event + blocker + angles (hypothesis/why/lane) + honest flag.
- **Round 2** — variants of the winner; the downstream diagnostic.
- **Disciplines** — no fabrication; confidence ladder; never test variants of an unvalidated angle; never ship an unrunnable test (2 senses).

---

## File index

### Created this session
```
agent/.claude/skills/strategy/SKILL.md ............... The strategy binder — the method (judgment-not-procedure)
agent/.claude/skills/strategy/worked-examples.md ..... 3 worked cases: Ravila Grand Hotel, The Whole Truth Foods, TheRateFinder
docs/SESSION_108_STRATEGY_BINDER_BUILT_AND_VALIDATED_2026-05-19.md ... this file
~/.claude/.../memory/feedback_dont_over_structure_planning.md ....... feedback memory (don't over-structure; brainstorm)
```

### Modified this session
```
docs/eval-corpus/implementation-plan.md .. added §4.1 (apprentice identities), §4.2 (9-binder inventory + mini-evals),
                                           §5 build sequence + Step 0 harness ticket + Status block (2026-05-19)
~/.claude/.../memory/MEMORY.md ........... updated the first-principles-redesign pointer
~/.claude/.../memory/project_first_principles_redesign.md ... added the Session 108 status block
```

### Key reference files for next session
```
docs/eval-corpus/implementation-plan.md ........ THE build plan — §5 build sequence, §5 Step 0 harness ticket, Status block
docs/eval-corpus/first-principles-redesign.md .. the locked Q1-Q5 spec
agent/.claude/skills/strategy/ ................. the strategy binder (Step-1 deliverable; the model for the other 8)
agent/.claude/skills/hook-methodology/ ......... OLD procedural skill — to be rebuilt as the hook binder
agent/.claude/skills/art-style/ ................ OLD procedural skill (~8k lines) — to be rebuilt as the art binder
agent/.claude/agents/research.md ............... the current single markdown subagent (redesign → programmatic)
cloudflare/sandbox/agent-runner.ts ............. where the continuous query() loop lives; where AgentDefinitions wire in
cloudflare/scripts/floor-graders.ts ............ the F1-F6 graders — reused by the mini-eval harness scorer
cloudflare/scripts/dump-eval-corpus.ts ......... eval corpus dump — a fixture source for mini-eval fixtures
```

---

## Punch list — redesign workflow

- [x] Scope Phase 1 (apprentice identities §4.1, binder inventory §4.2, build sequence §5)
- [x] Build the strategy binder (`SKILL.md` + `worked-examples.md`)
- [x] Mini-eval the strategy binder by hand — 3 brands, all GO; cracks fixed
- [ ] **Build Step 0 — the mini-eval harness** (`cloudflare/scripts/mini-eval/`, local Node script) — *next session*
- [ ] **Build the strategy `AgentDefinition`** — the programmatic apprentice — *next session*
- [ ] Run the strategy mini-eval automated (confirm the by-hand GO)
- [ ] Step 2a — the other 8 binders (research, comp, rigor-rubric/critic, hook, art, ad-unit, run-plan, next-move)
- [ ] Step 2b — harness engineering (orchestrator 9-step rewrite, wire apprentices, Bet critic loop, cell code-checks)
- [ ] Step 3 — integration on staging; run the corpus
- [ ] 🚦 GO/NO-GO gate on the floor number (22% → 50%+)

## Punch list — deferred non-eval work (carried, unchanged)

WS 1006 structural fix · Followup intent classification · Aspect-ratio drift · `new-ui` ahead of `master` · Rotate prod Clerk Secret Key · Multi-reference selective replace Phase 1.1 · PR 2 undo/redo UI

---

## Open / watch items

- The strategy mini-eval was run **by hand** this session — it validated the *approach*, which is what the gate needs. The harness must still confirm it mechanically, and is a prerequisite for evaluating the other 8 binders without hand-grading.
- The strategy binder pairs with the strategy `AgentDefinition` (identity prompt) — write them so the persona and the binder do not contradict.
- 3 worked examples now exist; adding a 4th of yet another shape would further harden the binder, but is not blocking.
- Nothing committed. The `new-ui` branch is still ahead of `master`.
