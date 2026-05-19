# Session 109 — Mini-eval harness built; strategy binder validated, 3 cracks fixed

**Date:** 2026-05-19
**Branch:** `new-ui`
**Commits:** 1 — `feat(evals): mini-eval harness + strategy binder validated, 3 cracks fixed`
**Goal:** Resume the first-principles redesign at Phase 1. Build **Step 0 — the mini-eval harness** — then use it to validate the strategy binder (the Step-1 deliverable from S108) against held-out brands.

---

## TL;DR

- **Step 0 is done: the mini-eval harness is built and proven.** `cloudflare/eval/mini-eval/` — a plain local Node script that runs one apprentice binder against canned fixtures, scores the deliverable with an LLM judge against a rubric, and computes a deterministic pass/fail. `npx tsx eval/mini-eval/run-mini-eval.ts strategy` produces a scored report + a folder of the produced Bets.
- **The strategy binder was validated against 6 held-out brands** — and the gate immediately earned its keep: it surfaced **three real cracks**, all now fixed and re-validated.
  1. **Worked-example leakage** — the apprentice copied facts (`13%`) and phrasing ("every room you fill") from the binder's worked examples into unrelated brands' Bets. An **ablation** (running with `worked-examples.md` removed) showed Bet quality holds without them → worked examples dropped from the apprentice's runtime context.
  2. **Always-N=3** — every Bet shipped exactly 3 angles regardless of budget. Root cause was *not* the worked examples (the ablation disproved that) — it was that SKILL.md's "Right-size" move described N as a judgment but never *forced* the derivation. Rewrote it.
  3. **Geo-blindness** — the right-size math used one nationwide cost guess; it ignored that cost-per-result swings hugely by geography, and that geo-targeting is itself a strategic lever.
- **Final run: 3/3 held-out fixtures pass, all 9 criteria each, and N varied 2 / 3 / 5 — tracking the budget.** The "always 3" is gone.
- **Nothing was built into production.** The harness is dev tooling; the binder is a skill file. `agent-runner.ts` was not touched.

---

## Next session opener

> Resume the first-principles redesign — **Phase 1, Step 2a: the other 8 binders.**
> 1. Read `docs/SESSION_109_*.md` (this file).
> 2. Read `cloudflare/eval/mini-eval/README.md` + `run-mini-eval.ts` — the proven harness.
> 3. Read `agent/.claude/skills/strategy/` — the validated binder (the model for the other 8).
>
> Step 0 (harness) and Step 1 (strategy binder + its mini-eval) are done. Next is **Step 2a — write the other 8 binders** (research, comp, rigor-rubric/critic, hook, art, ad-unit, run-plan, next-move), each with its own `apprentices/<name>.ts`, `rubrics/<name>.md`, and held-out fixtures, all evaluable through the same harness. Parallel track 2b is the orchestrator/harness engineering.
>
> Carry-over harness polish (small, optional): the `results/<binder>-<date>-bets/` folder accumulates stale files across runs (clear it per run); a judge *infra* failure currently reads as `fail` and should read `inconclusive`.

---

## What happened

### 1. The harness was designed, then built

Design discussion locked four things: **inline the binder** into the apprentice's system prompt (test binder *content*, not Skill-tool triggering); the apprentice definition uses the SDK `AgentDefinition` shape (one definition, later reused by the orchestrator); the scorer is an **LLM judge** against a rubric (strategy is a judgment binder) plus a number-traceability advisory; **fixtures must be held-out** brands — never the binder's own worked examples.

Built `cloudflare/eval/mini-eval/`: `run-mini-eval.ts` (env load, binder inlining, the apprentice run, the judge, the report), `apprentices/strategy.ts`, `rubrics/strategy.md` (9 criteria derived directly from the binder's own "how to tell your work from slop" + the 5-part Bet spec; 4 critical + 5 supporting; overall computed deterministically by the harness, not the judge).

Two environment snags fixed: the SDK's bundled `cli.js` refuses to start inside a Claude Code session (`CLAUDECODE` env var) → the harness clears it; Opus 4.7 returns a 400 with the pinned SDK (`0.2.63` sends the old `thinking.type.enabled` shape) → judge model is `claude-sonnet-4-6`, the strongest model this SDK can drive.

### 2. First validation batch — 3 fixtures, leakage found

Built 3 held-out fixtures (Ever/Body, Bearaby, Verbis Edu). First runs surfaced **worked-example leakage**: the apprentice stated "a ~13% category-wide input cost pressure" for Ever/Body — a figure lifted from the TWT worked example; and opened Bearaby's memo "Every *room* Bearaby has filled" — Ravila (a hotel) phrasing, on a blanket brand. Two patch attempts (negative instructions in the binder) were recognised as whack-a-mole.

### 3. The ablation — leakage vs always-N=3 separated

Added a `MINIEVAL_NO_EXAMPLES` ablation switch and re-ran with `worked-examples.md` removed. Result: **quality held (3/3 pass), leakage gone by construction — but N stayed 3/3/3.** This cleanly disproved the hypothesis that worked examples anchored N=3, and split one tangled problem into two: leakage (caused by worked examples) and always-3 (a separate SKILL.md gap — the right-size move was never forcing).

### 4. The cost / geo discussion

The Verbis Edu Bet had concluded "₹80k is too thin for 3 cells" — resting on a CPL the apprentice *guessed* (₹500–1,000). That guess was likely too high and entirely geography-blind. Decision: cost-per-result follows a **confidence ladder** — the founder's own number first, a hedged researched range as fallback, never a blind guess — and the upstream research is the right place to surface that hedged, geo-aware range. Geo-targeting is a strategic lever, not just a cost knob.

### 5. Second validation batch — 3 fresh brands, all 3 fixes, re-validated

The first 3 fixtures had become the binder's iteration set (overfitting risk), so a fresh held-out trio was chosen — deliberately spread across budget: **Arjun Infra** (₹60k/mo, small — an Ongole/AP real-estate developer), **DailyObjects** (₹5L/mo, mid — D2C accessories), **Noise** (₹30L/mo, large — India's #1 smartwatch brand). All fixtures gained a hedged "media cost reality" section in `research.md`; founder-facts were varied so both ladder rungs are exercised (Noise supplies a real CPA; the other two do not).

Applied the fixes — dropped `worked-examples.md` from `binderPaths`, rewrote SKILL.md's right-size move — and re-ran. **3/3 pass; N = 2 / 3 / 5, each derived from budget arithmetic shown in full; no leakage; the geo lever used (Arjun Infra ran a Telugu/Hyderabad-diaspora cell).** DailyObjects even evaluated N=4 and rejected it on the math.

---

## Decisions locked this session

| Topic | Decision |
|---|---|
| Mini-eval harness | A plain local Node script, `cloudflare/eval/mini-eval/`; binder inlined into the apprentice's system prompt; LLM-judge scorer; deterministic overall verdict from a per-apprentice pass rule |
| Judge model | `claude-sonnet-4-6` — Opus 4.7 is incompatible with the pinned SDK 0.2.63 (old thinking-API shape) |
| Fixtures | Must be held-out brands; never the binder's worked examples, and rotated when a set becomes the iteration set |
| Worked examples at runtime | **Removed.** Ablation showed quality holds without them and they were the leakage source. `worked-examples.md` stays as an authoring/reference artifact only |
| Right-sizing N | N is **derived** from budget ÷ realistic cost-per-event, computed before angles; not defaulted to 3; moves both down and up |
| Cost-per-result | A confidence ladder: founder's data → hedged researched range (reasoned as a sensitivity, not a point estimate) → never a blind guess |
| Geography | A strategic lever (cost and audience), reasoned about — not a default setting |

---

## File index

### Created this session
```
cloudflare/eval/mini-eval/run-mini-eval.ts ............. the harness runner
cloudflare/eval/mini-eval/apprentices/strategy.ts ...... the strategy apprentice definition
cloudflare/eval/mini-eval/rubrics/strategy.md .......... the 9-criterion scoring rubric
cloudflare/eval/mini-eval/README.md .................... how to run / extend the harness
cloudflare/eval/mini-eval/fixtures/strategy/{arjun-infra,dailyobjects,noise}/ ... 3 active held-out fixtures
cloudflare/eval/mini-eval/fixtures/_archive/strategy/{everbody,bearaby,verbisedu}/ ... 3 archived fixtures
cloudflare/eval/mini-eval/results/ ..................... generated reports + produced Bets
docs/SESSION_109_*.md .................................. this file
```

### Modified this session
```
agent/.claude/skills/strategy/SKILL.md ... right-size move rewritten (N derived, cost ladder,
                                           sensitivity reasoning, geo lever); worked-examples
                                           references removed; "~3" nudges de-anchored
~/.claude/.../memory/project_first_principles_redesign.md ... status updated
```

### Key reference files for next session
```
cloudflare/eval/mini-eval/ ..................... the proven harness — the template for binders 2-9
agent/.claude/skills/strategy/SKILL.md ......... the validated binder — the model for the other 8
docs/eval-corpus/implementation-plan.md ........ §5 build sequence (its §5 Status block is now stale)
cloudflare/sandbox/agent-runner.ts ............. where the orchestrator + AgentDefinitions wire in (Step 2b)
```

---

## Punch list — redesign workflow

- [x] Build Step 0 — the mini-eval harness
- [x] Build the strategy apprentice definition + rubric + fixtures
- [x] Run the strategy mini-eval automated; validate on held-out brands
- [x] Fix the 3 cracks the gate surfaced (leakage, always-N=3, geo-blindness) and re-validate
- [ ] **Step 2a — the other 8 binders** (research, comp, rigor-rubric/critic, hook, art, ad-unit, run-plan, next-move), each with its own mini-eval — *next session*
- [ ] Step 2b — harness engineering (orchestrator 9-step rewrite, wire apprentices, Bet critic loop, cell code-checks)
- [ ] Step 3 — integration on staging; run the corpus
- [ ] 🚦 GO/NO-GO gate on the floor number (22% → 50%+)

## Open / watch items

- The strategy binder is validated on **6 held-out brands** across both test shapes, both cost-ladder rungs, and a 50× budget range — a strong Step-1 result. Minor judge-flagged soft spots remain (diagnosis sometimes framed as a channel gap rather than a crisp conversion barrier; some memos allude to the blocker rather than state it) — a refinement layer, not cracks.
- Harness polish carried: stale-file accumulation in the bets folder; judge-infra-failure should read `inconclusive` not `fail`.
- The implementation-plan §5 Status block still says "Step 0 — not started" — stale; update next session.
- There is a large backlog of uncommitted docs in `docs/` (≈20 session docs, plan files) predating this work — not committed here; commit separately if desired.
