# Axial Coding — Synthesis (Locked Taxonomy)

**Date:** 2026-05-15
**Source inputs:**
- `axial-coding-A.md` — Coder A independent clustering
- `axial-coding-B.md` — Coder B independent clustering
- `docs/SESSION_104_EVAL_OPEN_CODING_COMPLETE_AXIAL_CODING_NEXT_2026-05-14.md` — 15-failure-mode list (third independent view)

**Method:** Two LLM coders independently axial-coded 16 campaigns (8 prod + 8 staging) from `~/Downloads/eval-notes-2026-05-14.md`. Neither saw S104's taxonomy. Synthesis = my third pass reconciling A + B + S104.

---

## TL;DR

- 6 of 7 clusters converged across both coders → taxonomy is locked
- Identical PASS + FAIL anchors across both coders → no anchor debate
- **Real strategic finding:** both PASS anchors are *ceilings* (7-9 user-iteration turns to reach), not *floors* — Q3 rubric needs a separate floor definition for first-gen shippability
- **Top 3 P0 fixes** are obvious from open coding; don't wait for full Q3 rubric to ship them
- **Baseline locked (2026-05-15):** 4/18 = **22%** floor pass rate. See `floor-baseline-2026-05-15.md`.

---

## Production-grade reframe (the actual goal)

> A D2C founder pays for the agent, gets output, and ships it to Meta with zero edits.

Current state: **0% first-generation pass rate.** Both PASS anchors required 7-9 user turns to reach quality.

Real Q3 goal: **Move first-generation shippability from 0% → 50%+ in two weeks.**

The taxonomy serves three downstream functions: (1) diagnose failures, (2) block bad outputs via in-agent rubric gates, (3) build a regression suite. The rubric is an **enforcement layer inside the agent**, not just an offline eval.

---

## Locked Taxonomy — 6 clusters

Ranked by **Priority = Severity × Frequency × Fixability**.

| # | Cluster | Freq | Severity | Fixability | Priority |
|---|---|---|---|---|---|
| 1 | Concept-to-prompt loss | 11/16 | Critical | Medium (per-style prompt audit) | **P0** |
| 2 | Reference image ignored | 7-8/16 | Critical | High (orchestrator gate) | **P0** |
| 3 | Wrong-brand / locale error | 6/16 (1 catastrophic) | Critical | High (research extractor check) | **P0** |
| 4 | Fabricated / amplified proof | 7-9/16 | Critical | Medium (faithfulness check) | **P1** |
| 5 | Template-grade generic hook | 9/16 | High | Hard (whole-construction problem) | **P1** |
| 6 | Soft / channel-mismatched CTA | 8/16 | High | Medium (orchestrator rubric) | **P2** |

### Cluster definitions

**1. Concept-to-prompt loss**
Hook content (headline, CTA, sourced numbers) exists in the hook bank but the image-generation prompt drops it and inherits only atmospheric description. Style-dependent — typography/infographic preserves, atmospheric/photorealistic/lifestyle-render strips. Includes pipeline-misalignment (hook ≠ art direction ≠ image) and style-workflow-split (prompts expecting a post-overlay step that doesn't exist).

**2. Reference image ignored**
User uploaded actual product/space/garment/brand photos; agent generates generic AI versions instead. Sub-pattern: agent doesn't gate or prompt for reference uploads even when vertical clearly needs them (hospitality, real-estate, apparel, accessories, distinctive-packaging D2C).

**3. Wrong-brand / locale error**
Research stage produces output targeting the wrong brand (domain redirect: mamaearth.in → mamaearth.com), wrong currency ($1,000 phone for Indian brand), or wrong locale. Cannot be patched downstream — entire campaign is built on broken foundation.

**4. Fabricated / amplified proof**
Agent invents a fact, testimonial, badge, or rating not in research, OR stretches a sourced number into a behavioral claim it doesn't support (newsletter subs → "read lab reports before buying"; 856 reviews → "16,000+ approved"). Meta-ads-policy + regulator + trust risk.

**5. Template-grade generic hook**
Whole hook construction works for any brand in the category — passes specific-data-point swap test but fails whole-construction swap test. "Premium hotel rooms. 50% less than [landmark]." applies to any hotel near any tech corridor. Founder-perceived as competitor's-ad-with-logo-swapped.

**6. Soft / channel-mismatched CTA**
Exploratory CTA ("See your options," "See what's inside") instead of action-driving, OR matches brand-mechanism but not platform-mechanism (Meta ad with "Set a reminder now"). Includes researcher's-proof-vs-buyer's-proof framing (leading with Glanbia parent for Indian gym-goers who don't recognize the brand).

### Anchors

- **PASS Ceiling 1:** `campaign_mosi22bwouky66` — TWT staging "Add muscle, not ingredients." (7 user turns to reach)
- **PASS Ceiling 2:** `campaign_mn9ulfufiarpro` — Theratefinder Mar 28 "Banks said no. We closed in 24 hours." (9 user turns to reach)
- **FAIL Anchor:** `campaign_mn4ogmsbujom9y` — Mamaearth wrong-brand-redirect (unshippable under any condition)

### What was consolidated (not separate clusters)

| S104 mode | Consolidated into | Reason |
|---|---|---|
| Pipeline misalignment (hook ≠ art dir ≠ image) | Cluster 1 | Same root cause: handoff faithfulness |
| Style-workflow split (textless + post-overlay) | Cluster 1 | Same fix: prompt construction by style |
| Style-dependent content preservation | Cluster 1 | Same axis, different lens |
| Currency/locale leak | Cluster 3 | Same root cause: research extraction |
| Page-dependent identity drift | Cluster 3 | Same root cause: research extraction |
| Researcher's-proof vs buyer's-proof | Cluster 6 | Same fix: CTA/proof orchestrator rubric |
| Hook + Image both generic (compound) | Clusters 5 + 1 | Not a single failure — two failures co-occurring |
| Over-generation (4-8 images for 2) | Not in top 6 | Real but Medium severity; 20-line fix; deprioritized |
| Vertical-specific rubrics needed | Methodology, not failure | Belongs in Q3 rubric design |
| Agent crash mid-conversation | Engineering ticket | Not a creative-quality failure |
| image_type DB column mismatch | Engineering ticket | Not a creative-quality failure |

### Positive patterns (capability ceiling evidence)

1. **Content-preserving styles** (typography / infographic) — verbatim hook + CTA + hex colors preserved end-to-end. 3 campaigns.
2. **Conversion-mechanism reading** — agent reads brand's actual top-of-funnel mechanic and mirrors it as CTA (Traya "Take the Hair Test," Theratefinder "Start my deal"). 5 campaigns.
3. **Brand-voice fidelity when sourced phrases available** — verbatim deployment of brand vocabulary (TWT "zero secrets," Traya "root cause"). 3 campaigns.
4. **Sourced-number-in-headline construction** — concrete research-sourced number in headline (Gonoise "15 days," Guardian "5.5g BCAAs," Theratefinder "856 people / 48 hours"). 4 campaigns.
5. **Emerging meta-capabilities** — logo-swap-check instructions, compliance badges on canvas, structured textOnImage JSON. 3 campaigns. *Ceiling is rising; default doesn't trigger consistently.*

---

## Framework status — where Q3 fits

### The 5 questions (Hamel's eval methodology) in plain English

| Q | Plain-English version | Restaurant analogy |
|---|---|---|
| Q1 DO | What is the agent supposed to do? | What's on the menu? |
| Q2 FAIL | What categories of things go wrong? | What ways can food be bad? (cold / wrong order / etc.) |
| Q3 SUCCESS | For each category, what does pass vs fail look like? | The rubric the head chef uses to grade each dish |
| Q4 DETECT | How do we check Q3 rubric automatically? | The actual inspection — thermometer, taste test |
| Q5 IMPROVE | How do we make sure each known failure never happens again? | "Complaint about cold soup → now we check every soup's temp" |

### Terminology — same thing, different words

- **"Categories" = "issues" = "failure modes" = "clusters"** — all four words refer to the 6 items in the locked taxonomy table above.

### What Q3 actually is

Q3 = **for each of the 6 categories, write down the pass/fail rule.** Not the fix. Not the detector. Just the rule.

Example:
```
Category 1: Concept-to-prompt loss
  PASS rule: Image prompt contains hook headline OR CTA verbatim.
  FAIL rule: Image prompt contains neither (only atmospheric description).
```

### Q3-floor vs Q3-ceiling

Q3 has two levels:

| Level | What it grades | Status |
|---|---|---|
| **Q3-floor** | Minimum acceptable on first generation | ✓ DONE this session (the 6 binary checks above) |
| **Q3-ceiling** | "Great" quality, anchored to TWT + Theratefinder | Deferred until floor stabilizes |

Reason for deferring ceiling: you can't write a meaningful "what does great look like" rubric until first-gen output reliably clears the "barely-acceptable" bar. Otherwise ceiling grades every output as failing and tells you nothing.

### Where P0 fixes sit in the framework

P0 fixes are **not a framework step.** They're the engineering work that closes the gap between current output and Q3-floor pass.

```
[Q1] What agent does
       ↓
[Q2] What goes wrong (6 categories)            ← DONE this session
       ↓
[Q3-floor] Pass/fail rules per category        ← DONE this session
       ↓
[Q4] Automated graders enforcing Q3            ← NEXT
       ↓
   Baseline measurement → reveals fix priority
       ↓
   Ship P0 fixes → re-measure → loop until floor = 50%+
       ↓
[Q3-ceiling] Rubric for "great" output         ← later
       ↓
[Q4-ceiling] LLM-judge graders                 ← later
       ↓
[Q5] Each new prod failure → regression test   ← ongoing
```

### Current framework status

```
Q1 DO         — agent does ad generation                  ✓ done
Q2 FAIL       — 6 failure categories locked                ✓ done
Q3 SUCCESS    — pass/fail rule per category                ◐ floor done, ceiling deferred
Q4 DETECT     — code that auto-checks Q3 rules             ◐ floor graders shipped (22% baseline)
Q5 IMPROVE    — add prod failures to regression suite      ⬜ ongoing, later
```

**Floor baseline (2026-05-15):** 4/18 campaigns pass all 6 checks = **22%**. Per-check rates: F1 83%, F2 83%, F3 56%, F4 72%, F5 83%, F6 56%. Full report: `floor-baseline-2026-05-15.md`. Script: `cloudflare/scripts/floor-graders.ts`.

---

## Floor vs Ceiling — the critical Q3 framing

### The problem with anchoring rubrics to PASS examples

Both PASS anchors are **ceilings** — best-case outputs reached through 7-9 user-iteration turns. If Q3 rubric is anchored to ceilings, every first-gen output fails. The rubric becomes useless because it doesn't discriminate.

### The two gaps

```
                  CEILING (Theratefinder + TWT, 9-turn iterated)
                  |
                  |  ← closed by EXISTING user-iteration UX (not a first-gen problem)
                  |
                  FLOOR (6 binary first-gen checks below)
                  |
                  |  ← closed by 3 P0 code changes (next 2 weeks)
                  |
                  CURRENT FIRST-GEN (often fails floor)
```

- **Bottom gap** = engineering work — current output → floor. Closed by P0 fixes.
- **Top gap** = user iteration UX (already exists) — floor → ceiling.

You don't need to make first-gen equal ceiling. You need first-gen to clear the floor; existing iteration carries the rest. That's a 10× cheaper problem than "make first-gen equal Theratefinder."

### The 6 Floor Checks (first-gen shippability rubric)

All binary pass/fail, all code-checkable on the prompts/research/output tables.

| # | Floor check | Pass condition | Maps to cluster |
|---|---|---|---|
| F1 | Right brand | Domain didn't redirect to different entity, OR agent confirmed with user before proceeding | 3 |
| F2 | Right locale | Currency/locale in hook matches research output (no USD for Indian brand) | 3 |
| F3 | No fabrication | Every number/claim in hook traces to a research line | 4 |
| F4 | Hook in image | Hook copy appears verbatim in image prompt OR clear visual representation of hook concept | 1 |
| F5 | Reference deployed | If user uploaded reference photos, image prompt explicitly uses them | 2 |
| F6 | CTA is action-shaped | CTA contains action verb; not "See your options" / "See the difference" | 6 |

**Note:** Cluster 5 (template-grade generic hook) has no floor check — it's a ceiling problem (hard to detect programmatically, requires whole-construction swap test). It belongs in the ceiling rubric, not the floor.

### Production-grade definition (operational)

> An output is production-grade-floor-shippable if it passes all 6 floor checks AND has no fabricated facts.

That's a definition the orchestrator can enforce as a pre-ship gate.

---

## Q4 — Grader methodology (code vs LLM-judge vs human)

### The 3 grader types

| Type | What it does | Cost | Reliability | When to use |
|---|---|---|---|---|
| **Code-based** (regex/SQL) | Checks literal/structural facts | ~free | Deterministic | "Does X string appear in Y field?" |
| **LLM-as-judge** | Checks semantic/subjective qualities | $0.0001–$0.01 per grade | Variable | "Does this hook feel generic?" |
| **Human-as-judge** | Gold standard | Slow + expensive | Highest | Calibrating the other two |

**Decision rule:** Try code first. Fall back to LLM-judge only when code can't do it. Use humans only to calibrate the LLM-judge.

### Code-graded vs LLM-graded split across the 6 categories

| Category | Code can grade? | Notes |
|---|---|---|
| 1. Concept-to-prompt loss | ✅ Yes | Substring match: hook headline in image prompt |
| 2. Reference image ignored | ✅ Yes | Substring match: prompt references uploaded file |
| 3. Wrong-brand / locale | ✅ Yes | Domain compare + currency regex |
| 4a. Fabrication (numbers) | ✅ Yes | Number extraction + research traceability |
| 4b. Fabrication (semantic stretch) | ❌ LLM-judge | "Newsletter subs ≠ lab-report readers" needs comprehension |
| 5. Template-grade hook | ❌ LLM-judge | Swap test requires category-context understanding |
| 6a. Soft CTA (action verb) | ✅ Yes | Verb whitelist/blacklist |
| 6b. Channel-mismatched CTA | ❌ LLM-judge | "Set a reminder" on Meta needs platform knowledge |

**3 of 6 categories have a semantic half that needs LLM-judge.** The other half is code-checkable.

### Example LLM-judge prompts

**Template hook detection (Cluster 5)**
```
You are a senior performance marketer. Below is an ad hook for {brand}, a
{vertical} brand.

Hook: "{hook_text}"

The "swap test": can you replace the brand name with any other brand in the
same vertical, change nothing else, and have the hook still read fine?

Return JSON: {
  "fails_swap_test": true/false,
  "alternative_brands_it_works_for": [list 2-3],
  "what_would_make_it_brand_specific": "<one line>"
}
```

**Semantic fabrication (Cluster 4b)**
```
Below is research output and a hook the agent generated.

Research: {research_json}
Hook: {hook_text}

For each factual claim in the hook, identify which research line supports it.
"Stretched" = research claim amplified beyond what it supports.
"Fabricated" = no research line supports it.

Return JSON: {
  "claims": [
    {"claim": "...", "supported_by": "<research line or null>",
     "verdict": "supported|stretched|fabricated"}
  ],
  "fails_fabrication_check": true/false
}
```

### The 4 LLM-judge gotchas (everyone hits these)

1. **Position / order bias** — pairwise judges favor whichever option came first. Fix: randomize order, or use absolute binary scoring.
2. **Verbosity bias** — judges prefer longer, more elaborate answers. Fix: explicit rubric that doesn't reward length.
3. **Score inflation** — LLM judges grade too leniently. Fix: force binary pass/fail, not 1-10 scales. "Is this fabricated? Yes/No" beats "Rate fabrication 1-10."
4. **Variance** — same input → different output across runs. Fix: temperature 0, run 3× and take majority.

### Calibration — the critical step

Before trusting LLM-judge output in production:

1. **Human** labels ~20 campaigns for the category (pass/fail per campaign)
2. **Run LLM-judge** on the same 20
3. **Measure agreement.** Trust LLM-judge in prod only if ≥90% agreement with human. <80% = prompt needs rewriting.

This calibration step IS the Q4-ceiling work. Without it, LLM-judge graders silently grade differently than you would.

### Cost ballpark

- 24 campaigns × 6 grader prompts × Haiku 4.5 ≈ **$0.02 per full eval run** (one-time baseline trivial)
- 1000 prod generations/day × 3 LLM-judge checks × Haiku ≈ **$3-5/day** (gate at scale)
- Same scale on Opus 4.7 ≈ **$100-150/day**

Build with Haiku. Escalate to Opus only if Haiku disagrees with humans during calibration.

### Sequencing rule

Don't build LLM-judge graders during Q4-floor. Reasons:
- All 6 floor checks are code-graded
- Need baseline + P0 fixes shipped first (most generations should clear basic bar before semantic grading matters)
- LLM-judge work belongs in Q4-ceiling phase

```
Q4-floor       (code-graded)        → ~2 days
P0 fixes ship                       → ~2 weeks
Q4-ceiling     (LLM-judge built)    → 3-4 weeks out
Calibration    (human vs LLM-judge) → before trusting in prod
Q5 regression  (LLM-judge inline)   → as prod gate, after calibration
```

---

## Recommended next moves

### Decision locked (2026-05-15)

**Approach: Handoff redesign, all 6 fixes in one revamp** (Scenario B), not 3-then-3 patches.

Reasoning: concept-to-prompt loss + pipeline misalignment + fabrication are all symptoms of weak handoffs between pipeline stages (research → hook bank → art direction → image prompt). Patching the orchestrator with 3 separate checks doesn't fix the root cause. A proper handoff redesign with explicit faithfulness contracts at each stage closes all 6 categories in one shot.

Tradeoff accepted: lose clean per-fix attribution. Mitigation: run floor graders after each meaningful commit during the revamp to catch regressions + see incremental lift.

### Stop doing
- Coding more campaigns. 24 is enough; saturation hit.
- Refining cluster definitions. The 6 above are locked.
- Splitting fixes into multiple PRs. One coherent revamp.

### Do next (in order)

1. ~~**Implement the 6 floor checks as code-based graders.**~~ ✓ Done 2026-05-15. `cloudflare/scripts/floor-graders.ts`.
2. ~~**Run graders against coded campaigns.**~~ ✓ Done. Baseline = 4/18 = 22%. Report: `floor-baseline-2026-05-15.md`.
3. **Design the handoff redesign.** Explicit faithfulness contracts at each pipeline stage:
   - Research stage → validated structured output (domain-redirect detection, locale, sourced-fact registry)
   - Hook bank stage → structured hooks with explicit fields (headline / CTA / sourced numbers / claims) that downstream stages must carry verbatim
   - Art direction stage → consumes hook bank fields with verbatim-preservation contract
   - Image prompt stage → must include hook headline OR CTA verbatim, must deploy reference images if uploaded
   - Orchestrator → vertical detection + reference-image gate for visual-first categories
4. **Implement the revamp.** Run floor graders after each commit. Target ~2-3 weeks.
5. **Final measurement.** Re-run graders against the same 24 campaigns + sample new generations. Target: 50%+ first-gen pass.

### Defer
- Q3-ceiling rubric — write after floor is shipping reliably
- Cluster 5 (template-grade generic hook) — semantic problem, needs LLM-judge, deferred to ceiling phase
- LLM-judge graders (3 semantic categories) — Q4-ceiling phase
- Vertical-specific sub-rubrics — premature optimization until floor stabilizes

---

## Open questions for human resolution

1. **Floor pass rate target** — is 50% first-gen shippability the right two-week goal, or should it be higher/lower given current 0% baseline?
2. **Confirmation UX for wrong-brand** — when domain redirects, do we (a) halt and ask user, (b) generate for both and let user pick, or (c) extract from original URL anyway and flag?
3. **Reference-image gate strictness** — should agent refuse to generate for visual-first verticals without references, or generate-with-warning?

---

## Files

```
docs/eval-corpus/axial-coding-A.md          — Coder A independent output
docs/eval-corpus/axial-coding-B.md          — Coder B independent output
docs/eval-corpus/axial-coding-SYNTHESIS.md  — this file (locked taxonomy)
docs/eval-corpus/campaigns-2026-05-14.md    — open-coding source notes
docs/eval-corpus/floor-baseline-2026-05-15.md  — Q4-floor baseline report (22% pass)
cloudflare/scripts/floor-graders.ts         — Q4-floor grader script
~/Downloads/eval-notes-2026-05-14.md        — exported viewer notes (input to coders)
```
