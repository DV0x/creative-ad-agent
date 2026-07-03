# Session 119 — Strategy binder RE-CUT (promise/proof/mandatories + thinking scaffold), re-validated, and LOCKED

**Date:** 2026-06-08
**Branch:** `new-ui` (all changes uncommitted, per `feedback_no_commits_until_tested`)
**Status:** DONE for strategy. The strategy binder was re-cut to the S118 handoff contract, a `<thinking>` reasoning scaffold added, a craft-boundary sharpening folded in, the offline rubric synced, validated on two brands, and **LOCKED "for now" by the user.** The CELL is the next phase.

> **Read first (continuity chain):** this doc → `docs/SESSION_118_ANTHROPIC_DEEPDIVE_GENERICNESS_CONCLUSION_CELL_LOOP_2026-06-07.md` (the immediate predecessor — the genericness conclusion + the *decision* to sharpen strategy before the cell) → `docs/anthropic-learnings/00-genericness-conclusion.md` (the capstone) + `docs/anthropic-learnings/02-prompting-reasoning/notes.md` (the `<thinking>` / examples mechanics this session applied) + `docs/anthropic-learnings/03-context-engineering-harnesses/notes.md` (right-altitude / lean). Memory: `project_first_principles_redesign` (S119 status block added), `project_genericness_conclusion`, `feedback_binder_teaches_thinking_not_looking`. Deferred follow-ups live in `docs/scratchpad.md` (2026-06-08 section).

---

## Part 0 — Where this session sits

S118 ended with a **locked decision**: *sharpen STRATEGY before building the cell*, because "the cell can only walk to the center of the room strategy hands it" — genericness is won upstream, and strategy is where the room is picked. S118 also locked the **strategy→cell handoff contract**: strategy delivers angles handing the cell exactly **(1) who — buyer + awareness stage, (2) the one specific promise, (3) sourced proof**, plus honest mandatories — and **format and concept are NOT strategy's to give** (handing a format/treatment label re-introduces the killed "menu" anti-pattern).

This session executed that. It was an **implementation + validation** session: re-cut the strategy binder to the contract, prove it with the mini-eval, lock it.

---

## Part 1 — The strategy re-cut (the main work)

### The shape change

The angle deliverable went from four fields:

```
Buyer · Hypothesis · Why + claimable proof · Territory(prove/evoke/differentiate-from/register/mandatories)
```

to four leaner fields:

```
Buyer · Promise · Proof (only this) · Mandatories
```

What moved where, and why:
- **`hypothesis` → `promise`.** The old "hypothesis" was a *test bet* ("showing real reviews before the click converts this buyer") — strategist-facing reasoning. The new **`promise`** is the *one specific thing the ad commits to giving the buyer* (their want, turned into a claim the proof can back) — buyer/cell-facing. The hypothesis-style reasoning now lives in the new thinking pass, not in the clean handoff.
- **`territory` dissolves.** Its sub-fields split: *prove/evoke* fold up into the promise + the buyer's pull; **register/voice, "differentiate from" (category wallpaper), and format/proven-craft move to the CELL** (the cell reads `competitors.md` itself and owns category-look avoidance + treatment); **mandatories** (honesty/identity guardrails) are kept and promoted to their own field.
- **Distinctness re-homed.** Old logic: strategy guarantees N distinct ads via N distinct *territories*. New logic: strategy guarantees **concept/room** distinctness via distinct **who × promise**; **execution** distinctness is the cell's job. (Open architectural note: in sealed-parallel cells, nothing yet coordinates cross-cell *visual* distinctness — flagged, deferred to the cell build.)

### The `<thinking>` reasoning scaffold (new section)

A new **"Before you write — reason it through first"** section was added just before "Writing The Bet." It instructs the strategist to work the brand in a `<thinking>` block — walking every move (reconcile self-portrait vs reality → pin the conversion event → surface the winnable want → diagnose the friction + honesty fork → judge readiness → read which uncertainty/test-shape → size to budget → screen angles → frame each survivor) and **ending in a self-check** against "The disciplines you never break" — *then* writing the clean Bet.

**Why prompt-level `<thinking>` and not the SDK `effort` dial:** Topic-2 D4 (turn on adaptive-thinking + `effort: high`) is **BLOCKED** — the pinned `@anthropic-ai/claude-agent-sdk 0.2.63` still sends the old thinking-API shape and Opus 4.7 is incompatible (`run-mini-eval.ts:79-85`, `apprentices/research.ts:106`). Topic 2 says manual `<thinking>` CoT is exactly the substitute "when thinking is off." So the scaffold is the *available* lever, not a worse version of the blocked one.

### The craft-boundary sharpening (added after the first validation pass — see Part 3)

The runs surfaced one *consistent* slip: the model kept doing the cell's job inside the angle — writing the promise as a finished **headline**, and naming **palette/typeface** in the mandatories. A good-vs-bad contrast callout was added right under the angle template, using the exact failure lines the eval produced:

> **Promise = the claim, not the headline.** ✗ *"Your everyday carry, finally as deliberate as your setup."* → ✓ *"a bag whose design is as considered as the devices this buyer already chose."*
> **Mandatory = the guardrail, not the art-direction.** ✗ *"muted tones, clean sans-serif type, burgundy/white/gold palette"* → ✓ *"stay inside the brand's existing visual identity."*

Plus the test: *"if it reads like a line you could drop straight into the ad, you've written the cell's copy."*

### The rubric sync (the silent-breakage we caught)

`cloudflare/eval/mini-eval/rubrics/strategy.md`'s `angles` criterion hard-coded the OLD shape ("carries… **the hypothesis**… and **the territory**"). Left unchanged, the judge would have **false-failed the new correct output** for "missing hypothesis/territory." We rewrote the criterion in lockstep: hypothesis→promise, territory→mandatories, kept the no-art-direction FAIL (now also "the copy's voice") and "distinct at the room level." (The `honesty-fork` critical already said "promise" — it was already consistent.)

### The comp binder one-liner

The user surfaced a quote — *"the Ad Library shows the layout, not the belief."* We checked both binders and found we **already encode it structurally** (comp `:54` "never infer a desire the copy doesn't state"; the demand-check `:66-72`; revealed-winner-as-proxy `:89-98`; strategy's three white-space states). It's a better one-liner than anything in the binders, so it was added to comp's "read the live ad field" move as a crystallizing frame.

### worked-examples.md cleanup

The 3 worked examples (Ravila / TWT / TheRateFinder) had stale **"## The Bet that resulted"** blocks showing the OLD format *and* assigning treatment ("Lane: real-photo, warm, intimate"). Removed all three Bet blocks; trimmed the two narrative "visual lanes" paragraphs that assigned mood/register (now the cell's job); kept the reasoning narrative (the actual teaching value). `worked-examples.md` is **not loaded by the apprentice** (binderPaths = `SKILL.md` only), so this didn't affect the eval — it was de-contradiction hygiene for the production Skill path.

---

## Part 2 — Conceptual clarifications worked out live (the "why" behind the shape)

These came up as the user pressure-tested the design — worth preserving because they ARE the reasoning:

- **What `promise` is.** The promise sits *between* the want and the proof: the **want** is what the buyer already craves (brand-independent); the **promise** is what the brand commits to that want; the **proof** is why it's believable. It is NOT a feature (that's a spec sheet), and NOT the hypothesis (that's the test bet).
- **Promise ≠ copy.** The promise is *what to say* (the claim); the copy is the *actual words* (the headline). One promise → many possible headlines. Strategy hands the claim + the honesty ceiling; **the cell writes the words**, in a real voice, seeing the product. Strategy writing the headline = the same error as art-directing the visual blind.
- **How angles are decided / where the target audience lives.** Three layers: **research = the buyer material** (voice + want, descriptive — does NOT pick the target); **strategy = the audience decision** (picks who to bet on / generates the candidate "who" bets for an audience-discovery test); **the confirmed winning audience only exists after the test runs.** For national/single-line brands, research does NOT pre-sort the buyer pool into distinct *types* (sub-segments only fire for hyperlocal briefs), so strategy segments the voice fresh each run — which is *part of the test-shape variance* (see Part 3).
- **Demographics/age are unsourced.** Neither binder sources or requires age. In the TWT run, "aged 25–40" appears in research **only as an example inside an explicit GAP** ("strategist needs the founder to identify the sub-segment, e.g. 25–40 professionals vs beginners vs gym-goers", research.md:324) — and strategy **hardened it into a stated buyer demographic**, un-flagged. The cell needs age for execution (visual person, copy register, concept), so an unsourced age = category-average filler (genericness + honesty leak). The no-fabrication check *passed* it because "25–40" literally appears in research.md (the gap-context was lost). → Deferred follow-up.
- **What "test shape" is.** Which of two experiments you run: **audience-discovery** (you don't know *who* buys → same pitch to different people → testing WHO) vs **message test** (you know who, not what to say → same people, different pitches → testing WHAT). It decides whether angles target different *people* or the same person with different *messages*. The criterion checks the Bet both *named* the shape and *picked the right one*.

---

## Part 3 — Validation (the mini-eval runs)

Harness: `cloudflare/eval/mini-eval/`, run via `npx tsx run-mini-eval.ts strategy <fixture>`. Apprentice **and** judge = `claude-sonnet-4-6`. Fixtures are **canned, locked inputs** (research.md + competitors.md + founder-facts.md from S116/S117) — this *isolates the strategy binder*; same frozen inputs each run, so any output difference is the binder, not input drift.

| Run | Fixture | Result | Failed criteria | Note |
|---|---|---|---|---|
| 1 | thewholetruthfoods | **FAIL** | `test-shape`, `memo` | ran a message test when founder's unknown was *who* (audience-discovery); memo omitted the blocker. **Variance.** |
| 2 | thewholetruthfoods | **PASS** | `angles` (craft) | nailed audience-discovery; only ding = mandatories named palette/type. |
| 3 | dailyobjects | **PASS** | `angles` (craft) | promises written as finished headlines + palette/type in mandatories. |
| — | *(craft-boundary sharpening added here)* | | | |
| 4 | dailyobjects | **FAIL** | `test-shape`, `angles`(distinctness), `readiness` | **craft-boundary CONFIRMED FIXED** (mandatories now "stay inside the existing visual identity, the cell works within it" — no palette/type); but failed on a different cluster: didn't name the test shape, two angles were the same room on two SKUs (case vs bag), cases not demoted to conditional. **Variance.** |

**The load-bearing finding:** the **4 critical criteria** (`diagnosis`, `triangulation`, `honesty-fork`, `no-fabrication`) pass **4/4 runs — rock solid.** All the noise is on the **supporting test-rigor criteria** (`test-shape` is most fragile — missed 2/4; also angle-distinctness and readiness-demotion). On the strict rubric (`maxSupportingFails: 1`) this reads as ~50% overall. That ~50% is the binder's **historical baseline** (memory: "floor 22%→50%+"), i.e. **pre-existing variance, not a regression** — the re-cut changed the *shape*, not the pass rate.

What is CONFIRMED working:
- New angle shape generates cleanly (Buyer · Promise · Proof · Mandatories), every run.
- The synced rubric scores the new shape correctly (no false-fail for "missing hypothesis/territory").
- The craft-boundary sharpening took (run 4 mandatories are clean pointers; promises no longer flagged as headlines).
- The test-shape *distinction* works when the model engages it (run 2 correctly = audience-discovery; run 3 correctly = message test) — confirming run-1's miss was variance, not an inability.

Result snapshots preserved on disk: `results/strategy-2026-06-08-run1.md` (TWT run1), `…-twt-run2.md` (TWT run2 PASS), `…-do-run1.md` (DailyObjects run1 PASS); the live `results/strategy-2026-06-08.md` holds run 4.

---

## Part 4 — The lock decision

The user chose to **LOCK strategy "for now"** rather than chase the strict rubric further. Rationale, agreed: the foundation (criticals) is solid, the Bets are usable, the residual is *pre-existing* test-rigor variance on non-critical dimensions, and chasing 100% on a strict 1-slip rubric has diminishing returns. The one offered-but-declined next step was a targeted self-check strengthening (verify test-shape named / angles distinct / readiness acted on) — **available later if the variance ever bites in production**, but not worth blocking the cell on.

---

## Part 5 — Files created / changed this session (all uncommitted on `new-ui`)

**Binders / rubric:**
- `agent/.claude/skills/strategy/SKILL.md` — the re-cut (frontmatter, the visual-reality line, the "hand the cell the room, not the treatment" rewrite, the new `<thinking>` scaffold, deliverable Part 4, the format notes, the canonical template, the craft-boundary contrast callout).
- `agent/.claude/skills/strategy/worked-examples.md` — 3 stale Bet blocks removed, 2 visual-lane treatment paragraphs + their headers trimmed, 1 dangling "that Bet" reference fixed.
- `agent/.claude/skills/comp/SKILL.md` — the "Ad Library shows the layout, not the belief" line in the "read the live ad field" move.
- `cloudflare/eval/mini-eval/rubrics/strategy.md` — the `angles` criterion synced to the new shape.

**Docs / memory:**
- `docs/scratchpad.md` — a 2026-06-08 section with the two research-side deferred follow-ups + the dailyobjects-meta doc-fix.
- `~/.claude/.../memory/project_first_principles_redesign.md` — the S119 status block + an updated description line.
- `docs/SESSION_119_*.md` — this doc.

**Eval artifacts (generated):** `results/strategy-2026-06-08.md` + the three preserved snapshots + `results/strategy-2026-06-08-bets/`.

**No application code touched.** Research/comp binders unchanged except the comp one-liner.

---

## Part 6 — Deferred follow-ups (recorded in `docs/scratchpad.md`)

1. **RESEARCH — surface distinct buyer TYPES explicitly.** For national/single-line brands, research gives buyer *voice* + *want* but doesn't pre-sort the audience into candidate types (only hyperlocal sub-segments fire). Strategy must segment fresh each run → part of the `test-shape` variance. Fix: research clusters the voice into the buyer types it sees, each weighted + sourced — a firmer base for strategy's "who" bets.
2. **RESEARCH — source demographics (incl. age).** Currently unsourced; strategy hardens a research gap-example into a stated demographic. Fix: research surfaces demographics WHEN the data shows them (review skews, category reports), hedged; when unknown, the buyer stays psychographic and the cell infers visual age honestly — never assert a guess. Strategy-side: extend assumption-flagging to such promoted unknowns.
3. **DOC HYGIENE — `fixtures/strategy/dailyobjects/meta.json` item (3)** still frames the OLD "territory vs treatment" target (written S116, pre-re-cut). Doesn't affect scoring (judge uses the synced rubric), but should be updated to the new "who/promise/proof/mandatories; format+concept = cell's" framing.

(Also available, not blocking: commit the validated strategy work; a targeted self-check to reduce the test-rigor variance.)

---

## Part 7 — NEXT SESSION: the CELL

Strategy-first is now satisfied, so the cell is unblocked and is the **pre-launch blocker**. Setup is good — we have a *freshly-validated DailyObjects Bet* to run the forward process on (run-3/run-1 produced clean ones; **Angle 1 = "The Aesthetic Gap," hero = Lagoon Basalt tote**).

What's already locked for the cell (from S117/S118 — see `project_first_principles_redesign` S117 block + `project_genericness_conclusion`):
- Cell = a **direct-response creative team running a FORWARD process** (NOT reverse-engineering an artifact — that's dead). Strategist = Planner; the cell = the AD+CW pair; the judge = the CD's edit.
- **NO positive examples** in the cell skill (wide-output → frontend-design pattern: principles + counter-examples + the swap-test rubric).
- The loop: **diverge N concepts in TEXT → adversarial INDEPENDENT critic on a swap-test rubric → render winner ONCE → single vision-verify.** Beware the judge ceiling (only independence breaks it).
- Copy genericness = upstream-fixed (cell stays light: preserve + voice); **the VISUAL has a second genericness source** (category-look collapse at art-direction) → needs real cell-craft.
- The independent critic = a clean-context SDK subagent (Topic-4 mapping).

**The open fork to settle first (I teed this up; user hasn't decided):** *one sharp ad per angle* (S117's locked stance) **vs** *a deliberately diverse SET per angle* (the S117 style-bank pivot finding — Meta algorithmically penalizes sameness, so a diverse set may earn distribution; Meta selects, distinctness = the craft). This decision shapes the cell's whole spine. Caveat on the latter: authenticity counter-evidence (human +43% recall; "AI"-label hurts) → diverse *angle-anchored, human-feeling* execution at modest volume, not AI-spray.

**Concrete next step:** design the cell's forward-process / Creative-DNA-grammar binder (the spine), run it FORWARD on DailyObjects Angle 1, judge as a Type-A performance marketer, then prove brand-swap generalization (Arjun Infra). Do NOT one-shot the cell skill from a vacuum (Topic-4: that yields "vague, generic procedures").

Other parked items (from S118 Part 7, still open): the vision-verification gate (our #1 eval bug — `project_eval_top_failure_mode_image_content`); the orchestrator/follow-up-routing scope-schema; founder-elicitation investment; the Julius Korfgen email (needs concrete time slots before sending).

---

## Part 8 — The throughline to remember

Strategy now hands the cell a **room (who × promise), the proof it may stand on, and the honest guardrails — and nothing else.** Format, concept, voice, and the fight against the category look all belong to the cell, because the cell is the seat that sees the real product and the competitor pixels. The re-cut made the strategist behave like a planner, not a planner-plus-art-director. It's validated where it counts (the diagnosis never misses), consciously locked despite a known test-rigor wobble, and it sets up the real prize: the cell, where the visual genericness is actually defeated.
