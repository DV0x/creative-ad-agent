# Session 105 — Axial coding synthesis + floor-grader baseline

**Date:** 2026-05-15
**Branch:** `new-ui`
**Commits:** none (eval workflow artifacts only)
**Goal:** Lock the failure-mode taxonomy via inter-rater axial coding, write Q3-floor rubric, ship Q4-floor graders, measure baseline.

---

## TL;DR

- Axial coding completed via **2-coder inter-rater** pattern (two independent general-purpose agents, no shared context, neither saw S104's taxonomy)
- 6 of 7 clusters converged → taxonomy **locked** at 6 categories
- Both coders + S104 list named identical PASS + FAIL anchors → no anchor debate
- Surfaced critical Q3 framing: **PASS anchors are *ceilings* (7-9 user-iteration turns to reach), not *floors*** — separate floor rubric needed for first-gen shippability
- Wrote 6 binary floor checks (F1-F6), built `floor-graders.ts`, ran against 18 campaigns
- **Baseline locked: 4/18 = 22% floor pass rate**
- Decision locked: **Scenario B handoff redesign** (all 6 fixes in one workflow revamp, not 3-then-3 patches)

---

## Required reading for next session

| File | Purpose | Time |
|---|---|---|
| `docs/eval-corpus/axial-coding-SYNTHESIS.md` | Locked taxonomy + floor checks + framework status + handoff-redesign decision | **read first, 10 min** |
| `docs/eval-corpus/floor-baseline-2026-05-15.md` | Per-campaign baseline report (which checks fail where) | 5 min |
| `cloudflare/scripts/floor-graders.ts` | The graders implementing F1-F6 | reference |
| `docs/SESSION_104_EVAL_OPEN_CODING_COMPLETE_AXIAL_CODING_NEXT_2026-05-14.md` | Prior session — open coding completion | reference only |

---

## Where we are in the framework

```
Q1 DO         — agent does ad generation                  ✓ done
Q2 FAIL       — 6 failure categories locked                ✓ done (this session)
Q3 SUCCESS    — pass/fail rule per category                ◐ floor done, ceiling deferred
Q4 DETECT     — code that auto-checks Q3 rules             ◐ floor graders shipped (22% baseline)
Q5 IMPROVE    — add prod failures to regression suite      ⬜ ongoing, later
```

---

## Locked taxonomy (6 categories, ranked by Priority = Severity × Frequency × Fixability)

| # | Cluster | Freq | Severity | Priority |
|---|---|---|---|---|
| 1 | Concept-to-prompt loss | 11/16 | Critical | P0 |
| 2 | Reference image ignored | 7-8/16 | Critical | P0 |
| 3 | Wrong-brand / locale error | 6/16 | Critical | P0 |
| 4 | Fabricated / amplified proof | 7-9/16 | Critical | P1 |
| 5 | Template-grade generic hook | 9/16 | High | P1 |
| 6 | Soft / channel-mismatched CTA | 8/16 | High | P2 |

---

## Floor baseline — 4/18 = 22%

| Check | Pass rate | Notes |
|---|---|---|
| F1 Right brand | 15/18 (83%) | 1 real fail (Mamaearth wrong-brand-redirect) + 2 parser-limitation fails |
| F2 Right locale | 15/18 (83%) | 3 real fails — USD leak in Indian D2C hooks |
| F3 No fabrication | 10/18 (56%) | 8 fails, **some false positives** from `50k` vs `50,000` format mismatch |
| F4 Hook in image | 13/18 (72%) | 5 real fails — direct measure of concept-to-prompt loss |
| F5 Refs deployed | 15/18 (83%) | 3 real fails — direct measure of reference-image-ignored |
| F6 Action CTA | 10/18 (56%) | Mix of real soft-CTA + "no CTAs detectable" parser limitations |

### Anchor validation — grader correctly calibrated

| Anchor | Result |
|---|---|
| **Mamaearth (FAIL)** | ✓ Caught: F1 `MISMATCH: user=mamaearth.in research=mamaearth.com` |
| **Theratefinder Mar 28 (PASS)** | ✓ Passes all 6 |
| **TWT staging (PASS)** | Mixed — F6 caught real pipeline misalignment between hook bank (soft CTAs) and image prompts (action CTAs). Real signal, not a grader bug. |
| **Staging-Creat (FAIL)** | ✓ Caught: F5 `1 refs uploaded, 0/2 prompts use them` |

### 4 passing campaigns (the working sample)

- `mn9ulfufiarpro` Theratefinder Mar 28 (staging) — true base-quality
- `mn3egfu1pjxp5r` Ravila (prod, no follow-ups)
- `mn4fy5gosonhqt` Verbisedu (prod, 1 follow-up)
- `molat687fo6wad` Guardian whey (staging) — emerged as a 4th anchor candidate worth coding next round

---

## Decision locked this session

**Approach: Scenario B handoff redesign**, all 6 fixes in one workflow revamp.

Reasoning: concept-to-prompt loss + pipeline misalignment + fabrication are all symptoms of weak handoffs between pipeline stages (research → hook bank → art direction → image prompt). Patching the orchestrator with 3 separate checks doesn't fix the root cause. A proper redesign with explicit faithfulness contracts at each stage closes all 6 categories in one shot.

**Tradeoff accepted:** lose clean per-fix attribution.
**Mitigation:** run floor graders after each meaningful commit during the revamp.

---

## Next session opener

> Read `docs/eval-corpus/axial-coding-SYNTHESIS.md` first (the locked taxonomy + floor rubric + handoff-redesign decision). Then `docs/eval-corpus/floor-baseline-2026-05-15.md` for the per-campaign baseline.
>
> Baseline is **22%**. Target after revamp: **50%+**.
>
> **First action — design the handoff contracts.** Open `agent/.claude/skills/` and sketch the explicit handoff contracts between pipeline stages:
>
> 1. **Research stage** → must output: validated brand URL (no silent redirect), locale, sourced-fact registry, currency.
> 2. **Hook bank stage** → must output: structured hooks with explicit fields (headline / CTA / sourced numbers / claims), each claim tagged with source-line from research.
> 3. **Art direction stage** → must consume hook bank fields. Verbatim-preservation contract: headline + CTA fields must appear in art direction output.
> 4. **Image prompt stage** → must include hook headline OR CTA verbatim, must deploy reference images if uploaded, must NOT contain "no text overlay" instructions for content-preserving styles.
> 5. **Orchestrator** → vertical detection + reference-image gate for visual-first categories (hospitality, real-estate, apparel, accessories, distinctive-packaging D2C).
>
> Then implement the revamp. Run `npx tsx cloudflare/scripts/floor-graders.ts` from `cloudflare/` after each meaningful commit to track lift.
>
> **Parallel track:** fix grader calibration issues (F3 number normalization for `k`/`m`/`b` suffixes, F1 URL pattern flexibility, F6 CTA extraction fallback). ~30 min work. Probably not worth doing before revamp ships — let the redesign settle the data shape first.

---

## Next-session plan — step-by-step

User's plan (validated): map issues → evaluate current flow → find the leaks → plug them via revamp. Eval lens stays Type A (performance marketer for D2C founder). Audience: D2C + local biz founders. Output target: **zero-edit creative that can ship to Meta**.

### Step 0 — Orient (15 min)

1. Read this doc top to bottom
2. Read `docs/eval-corpus/axial-coding-SYNTHESIS.md` (10 min)
3. Read `docs/eval-corpus/floor-baseline-2026-05-15.md` per-campaign detail (5 min)

### Step 1 — Empirical leak trace (~1 day)

**Don't just read code — trace real failing campaigns through the actual code path.** Pick 3-5 representative failures from the baseline report and find the literal line where each leak happens.

Suggested traces (each maps to a P0 cluster):

| Campaign | Failure mode | Trace through |
|---|---|---|
| `mn4ogmsbujom9y` Mamaearth | Wrong-brand redirect (F1) | `agent/.claude/skills/research-skill/` — find where redirect was followed silently. Should be a single line. |
| `mp3zdim0g07tlu` Staging-Creat | "No text overlays" in image prompt (F4) + refs ignored (F5) | `agent/.claude/skills/art-style/workflows/` — which workflow generated this? Why does it strip text? |
| `mn3egfu1pjxp5r` Ravila | Reference photos ignored (F5) | Orchestrator → check whether vertical detection happens + whether refs are wired to image prompt construction |
| `mp40awylzb2gch` TWT prod | USD leak in hooks for Indian brand (F2) | Hook bank skill — how is locale signal passed from research → hook generation? |
| `moo0j70x7xapvv` Arjuninfra | Soft CTAs + no detectable hooks structure | Hook bank skill — what's the prompt instructing it to produce? |

Output of this step: a **"leak map"** doc — one row per cluster, pointing to the specific file + function + line where the failure originates. Without this, the redesign is theoretical.

**Also at this step:** check whether current orchestrator system prompt orients the agent as "performance marketer building ads for D2C founder clients" or as "creative assistant." If it's the latter, that wording change alone is high-leverage.

### Step 2 — Time-boxed research (~2 days, hard cap)

**Research is the highest-risk-of-procrastination phase.** Hard cap at 2 days.

**Day 2a — Meta rules** (1 day):
- Personal attributes ("Are you struggling with X?")
- Health/fitness claim restrictions (relevant for TWT, Optimum, Avvatar, Guardian)
- Before/after image rules (apparel, hospitality)
- Sensational / clickbait claims
- Sourced-claim requirements
- Output: 1-page cheat sheet for the agent

**Day 2b — Competitive review** (1 day):
- Use Meta Ad Library (free) — pull 30-50 high-performing ads from your beta clients' verticals: hospitality (Ravila), D2C supplements (TWT/Optimum), fintech (Theratefinder), apparel (Bewakoof), local services
- Reverse-engineer the patterns: headline structures, CTA verbs, visual conventions, claim formats
- Output: 1-page "what works on Meta for your audience" cheat sheet

Both cheat sheets get baked into agent prompts at Step 5.

### Step 3 — Structural redesign sketch (~1 day)

Separate structural work from prompt work. **Structural first** — handoff contracts between pipeline stages. No prompt editing yet.

Sketch the contract per stage:

| Stage | Must output (contract) | Faithfulness rule |
|---|---|---|
| Research | Validated brand URL (redirect-checked, user-confirmed if needed), locale, currency, sourced-fact registry | None upstream |
| Hook bank | Structured hooks: each with `headline`, `cta`, `claims[]`. Each claim tagged with source-line from research. | Every claim must trace to research |
| Art direction | Must consume `headline` + `cta` verbatim. Cannot introduce new claims not in hook bank. | Verbatim-preservation: `headline` + `cta` fields appear in art direction output |
| Image prompt | Must embed `headline` OR `cta` verbatim. Must deploy uploaded references. Must NOT contain "no text overlay" for content-preserving styles. | Hook substring must appear in prompt |
| Orchestrator | Vertical detection + reference-image gate for visual-first verticals | Halts generation if visual-first + no reference uploaded (or generates with warning) |

Output: schema doc per stage + handoff validation rules.

### Step 4 — Implement structural revamp (~5 days)

Engineering work only. No prompt rewriting yet. Build the schemas + validation layers.

**Run `npx tsx cloudflare/scripts/floor-graders.ts` from `cloudflare/` after each meaningful commit.** Track lift incrementally. Even a 22% → 30% bump after Step 4 alone is meaningful signal.

### Step 5 — Prompt-level refinement (~2 days)

Now encode the Type A lens + Meta rules + competitive patterns into each skill's prompt:

- Orchestrator system prompt → frame agent as "performance marketer building ads for D2C founder clients"
- Research-skill prompt → output schema + redirect-detection instructions
- Hook bank prompt → Meta-compliance rules + claim-source tagging + Type A swap-test self-check
- Art direction prompt → faithfulness contract from Step 3
- Per-style image prompts → embed hook headline verbatim + deploy references rule

### Step 6 — New-brand validation (~1 day)

**Don't just rerun graders on the same 18 campaigns** — that's training data. Generate fresh campaigns for 5-6 NEW brands (mix of D2C + local biz + different verticals) and grade those. Test data tells you if it generalizes.

### Step 7 — Final measurement + writeup (~half day)

- Rerun floor graders on 18 baseline + 5-6 new = ~24 campaigns
- Target: **50%+ pass rate**
- Write up gap to 100% target (what's left for Q3-ceiling work)

### Estimated total: ~2 weeks

```
Step 1  — empirical trace               1 day
Step 2  — research (time-boxed)         2 days
Step 3  — structural sketch             1 day
Step 4  — implement structure           5 days
Step 5  — prompt-level refinement       2 days
Step 6  — new-brand validation          1 day
Step 7  — final measurement + writeup   0.5 day
                                       ────────
                                       ~12.5 days
```

### Operational definition of "zero edit"

Pick ONE and commit to it before Step 1, otherwise "zero edit" stays vague enough to claim victory falsely.

| Definition | Pros | Cons |
|---|---|---|
| **Meta-approval test** — clears Meta policy bot on first submission | Concrete, measurable | Doesn't measure conversion quality |
| **Founder ship test** — beta client would launch as-is (ask 3-5 quarterly) | Real validation | Slow, biased by sample |
| **Performance-marketer ship test** — marketer would launch for paying D2C client | Tied to eval lens | Subjective unless rubric'd |

**Recommended: performance-marketer ship test**, operationalized as floor-rubric pass + quarterly beta-client sampling check for drift detection.

### Two risks to actively manage

1. **Research procrastination** — hard cap Step 2 at 2 days. If you're still researching on day 3, ship Step 3 anyway with what you have.
2. **Structural ↔ prompt rewriting interleaving** — don't mix them. Ship structural skeleton first, then refine prompts. Otherwise you'll rewrite both repeatedly.

### Cross-cutting principle

**Type A lens should be a gate inside the agent, not just an external eval.** Every prompt that produces user-facing output should end with: "Before responding, ask yourself: would a performance marketer ship this for a D2C founder client without edits? If no, revise." Same logic for orchestrator's pre-ship check.

---

## What user did this session

- Read S104 cold; asked clarifying questions: what is axial coding, single agent vs team, severity vs frequency, what's the synthesis pass, what's Q3, what's LLM-as-judge, what's the baseline metric
- Pushed back on "ship 3 first, measure, then 3 more" — argued for all-6-in-one-revamp since handoff redesign touches everything anyway. Correct strategic call.
- Locked the 6-cluster taxonomy, the floor-rubric framing, and the Scenario B redesign decision

---

## Methodology notes for future eval sessions

- **Inter-rater axial coding works** — 2 general-purpose agents in parallel, identical prompts, neither shown the existing taxonomy. 6 of 7 clusters converged. Cheap (~3-5 min wall time, trivial cost). Recommended pattern for future qualitative rounds.
- **Floor vs ceiling distinction is load-bearing** — PASS anchors required 7-9 user-iteration turns. Anchoring Q3 to ceilings makes every output fail. Floor rubric is separate, lower bar, code-checkable, reachable today with revamp.
- **Code-graders first, LLM-judge later** — All 6 floor checks are code-checkable (regex + substring match + number extraction). LLM-judge belongs in Q4-ceiling phase (template-hook detection + semantic fabrication + channel-mismatched CTA).
- **Calibrate LLM-judges against human** before trusting in prod — 90% agreement bar.

---

## Files touched this session

```
docs/eval-corpus/axial-coding-A.md                — NEW (Coder A independent output)
docs/eval-corpus/axial-coding-B.md                — NEW (Coder B independent output)
docs/eval-corpus/axial-coding-SYNTHESIS.md        — NEW (locked taxonomy + framework + LLM-judge methodology)
docs/eval-corpus/floor-baseline-2026-05-15.md     — NEW (Q4-floor baseline report)
cloudflare/scripts/floor-graders.ts               — NEW (348 lines, F1-F6 graders)
docs/SESSION_105_*.md                             — this file
```

No commits. No code changes outside `cloudflare/scripts/`. No memory updates needed (all info captured in synthesis doc).

---

## Open punch list — eval workflow

- [ ] Design + ship handoff redesign (Scenario B) — closes all 6 categories at root
- [ ] Re-run floor graders after each commit during revamp
- [ ] Target 50%+ floor pass rate at end of revamp
- [ ] (Lower priority) Fix grader calibration: F3 number normalization, F1 URL fallback patterns, F6 CTA extraction fallback
- [ ] Q3-ceiling rubric — write after floor stabilizes
- [ ] Q4-ceiling LLM-judge graders for clusters 4b (semantic fabrication), 5 (template hooks), 6b (channel mismatch)
- [ ] Calibrate LLM-judges against human ground truth (~20 campaigns, 90% agreement bar)
- [ ] Q5 regression suite — every new prod failure becomes a test case

## Open punch list carried from S104 (unchanged — deferred)

WS 1006 structural fix · Followup intent classification · Aspect-ratio drift · `new-ui` 135 commits ahead of master · Rotate prod Clerk Secret Key · Multi-reference selective replace Phase 1.1 · PR 2 undo/redo UI
