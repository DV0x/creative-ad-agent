# Session 104 — Eval open-coding hit saturation, axial coding next

**Date:** 2026-05-14
**Branch:** `new-ui`
**Commits:** none
**Goal:** finish open-coding eval traces through Type A lens, identify failure modes + base-quality benchmarks, prepare for Q3 rubric

---

## TL;DR

Coded 24 of 40 campaigns (10 prod + 14 staging) through a **Type A lens** (performance marketer judging conversion potential for a D2C founder client). Hit theoretical saturation — patterns repeating, not new categories emerging.

**Two base-quality benchmarks identified:**
1. Staging Campaign 2 (TWT whey, `campaign_mosi22bwouky66`) — "Add muscle, not ingredients." after 7 user-iteration turns
2. Staging Theratefinder March 28 (`campaign_mn9ulfufiarpro`) — typography + infographic images with action-CTA buttons + compliance badges after 9 turns

**Top user-validated failure:** concept-to-prompt loss (3 paying users explicitly complained about images missing hook content — issue live 7+ weeks).

**Highest-severity failure found:** wrong-brand via domain redirect (Mamaearth campaign — built ads for US brand when user wanted Indian Mamaearth.in).

---

## Required reading for next session

| File | Purpose | Time |
|---|---|---|
| `docs/eval-corpus/campaigns-2026-05-14.md` | Full per-campaign notes (24 campaigns coded) | reference |
| User's downloaded `eval-notes-2026-05-14.md` (in Downloads) | Exported viewer notes — feed to axial-coding LLM | **read first** |
| `.claude/memory/MEMORY.md` | Index of 11 saved memories (4 new this session) | 2 min |
| `docs/SESSION_103_EVAL_HTML_VIEWER_AND_OPEN_CODING_KICKOFF_2026-05-14.md` | Prior session context (corpus dump + viewer build) | reference |

---

## Where we are in the framework

```
Q1 DO        — agent blueprint                       ✓ done
Q2 FAIL      — open-code 30+ traces → taxonomy       ✓ saturated (24 coded, patterns stable)
Q3 SUCCESS   — write pass/fail rubric per category    ← NEXT (after axial coding)
Q4 DETECT    — build graders (code → LLM → human)     after Q3
Q5 IMPROVE   — every prod failure becomes regression  after Q4
```

---

## Failure modes surfaced (sorted by severity / actionability)

| # | Failure mode | Severity | Evidence count |
|---|---|---|---|
| 1 | Wrong-brand via domain redirect | Critical | Mamaearth |
| 2 | Concept-to-prompt loss (image lacks hook/CTA/copy) | High | 3 user complaints + ~15 campaigns |
| 3 | Reference-image-ignored for visual-first verticals | High | Ravila, Arjun, Avvatar, Bewakoof, Dailyobjects |
| 4 | Fabricated numbers / narrative amplification | High | TWT C4, ON C2, TWT staging, Theratefinder Apr30 |
| 5 | Hook recycling (default per-brand + per-vertical) | Medium | TWT (4 runs identical hook), whey cluster anti-counterfeit template |
| 6 | Pipeline misalignment (hook bank ≠ art dir ≠ image) | Medium | Mamaearth, others |
| 7 | Currency/locale leak | Medium | Dailyobjects "$1,000 phone" for Indian brand |
| 8 | Researcher's-proof vs buyer's-proof | Medium | Glanbia framing in 3 ON campaigns |
| 9 | Soft / mushy CTAs vs site's actual CTAs | Medium | Multiple |
| 10 | Style-dependent content preservation | Medium | typography/infographic preserve, atmospheric styles drop content |
| 11 | Hook + Image both generic (compound) | Medium | Ravila clearest |
| 12 | Over-generation (4-8 images for 2 requested) | Low/UX | 6+ campaigns |
| 13 | Vertical-specific rubrics needed (SaaS / Real Estate / Fintech / Apparel) | Methodology | per-vertical observed |
| 14 | Agent crash mid-conversation ("scrapped that one") | Engineering | prod C2 Opti, staging C2 TWT |
| 15 | image_type DB column mismatch | Engineering | persistent |

Three new positive patterns spotted (capability evolution):
- Agent self-check in prompts ("Logo swap check" embedded — Theratefinder April 30)
- Structured `textOnImage` field with placement (Gonoise)
- Brand-anchor reasoning in art direction JSON (Theratefinder Mar 28)

---

## Two PASS anchors for Q3 rubric

### Anchor 1 — Staging Campaign 2 (TWT whey)
- **ID:** `campaign_mosi22bwouky66`
- **Image:** `docs/eval-corpus/images/staging_campaign_mosi22bwouky66_4.jpeg`
- **Hook:** "Add muscle, not ingredients."
- **Path:** 7 follow-up turns with user invoking "logo swap test" + "grabs attention" + "conversion hook"
- **What ships:** Hook on canvas + CTA on canvas + reference product (real TWT) + gym context + brand voice match

### Anchor 2 — Staging Theratefinder March 28
- **ID:** `campaign_mn9ulfufiarpro`
- **Images:**
  - `docs/eval-corpus/images/staging_campaign_mn9ulfufiarpro_1.jpeg` (typography-dominant)
  - `docs/eval-corpus/images/staging_campaign_mn9ulfufiarpro_2.jpeg` (infographic with compliance badges)
- **Hook:** "BANKS SAID NO. WE CLOSED IN 24 HOURS." + "4.8 stars. 856 people."
- **Path:** 9 follow-up turns with user invoking "the full content is not there" + "more polished" + "designed by a professional brand designer" + "this looks mediocre"
- **What ships:** Action-CTA pill buttons + sourced numbers (no fabrication) + fintech compliance badges + 2 distinct styles + content density

### Three causal factors both anchors share
1. Brief specificity (conversion intent baked in: "focus only on whey protein" / "good visuals that converts folks for short-term mortgages")
2. User iteration with explicit quality rejection (7-9 turns)
3. Content-preserving styles (typography-dominant / infographic-data, NOT atmospheric)

---

## FAIL anchor

**Staging Campaign 1 ON India (`campaign_mp3zdim0g07tlu`)** Image 1 prompt: literally ends with **"No text overlays."** Strips all selling content. Generic gym athlete with protein shake. No hook, no CTA, no product specificity. The clearest worst-case in corpus.

---

## What user already did this session

- Pasted Type A notes into viewer for ~17 campaigns
- Exported notes via viewer's "⬇ export notes" button → `eval-notes-2026-05-14.md` in Downloads folder
- Identified staging campaign 2 as best in corpus before we coded it together
- Confirmed Type A lens as eval bar
- Validated "no commits until tested" + nano-banana correction during session

---

## Memories saved this session (4 new + updated MEMORY.md)

- `feedback_eval_type_a_lens.md` — Type A lens for creative output
- `feedback_nano_banana_prompt_construction.md` — NB2 renders text well; root-cause to prompt construction
- `feedback_followup_count_not_failure_signal.md` — turn count alone is ambiguous; verify via transcript
- `feedback_swap_test_whole_construction.md` — test whole hook construction, not just brand-name presence
- `project_eval_top_failure_mode_image_content.md` — 3 user-verified complaints about images-missing-content
- `project_eval_reference_image_ignored.md` — user uploads ignored
- `project_eval_base_quality_benchmark.md` — TWT whey + Theratefinder co-anchors
- `project_eval_wrong_brand_redirect.md` — Mamaearth wrong-brand failure (critical severity)

Index updated in `MEMORY.md`.

---

## Decision queued for next session

User accepted Option C path:
1. Day 1: Fix wrong-brand-redirect detection (narrow code change in research extractor)
2. Day 1-2: Reference-image UX gate for visual-first verticals
3. Day 2-3: Axial-code in parallel, draft Q3 rubric anchored to fixes
4. Day 3+: Per-style prompt audit for concept-to-prompt loss

---

## Next session opener

> Last session finished open-coding 24 of 40 eval campaigns through Type A lens, hit theoretical saturation. Identified TWO base-quality benchmarks (staging campaign 2 TWT whey "Add muscle, not ingredients." + staging Theratefinder March 28 with pill CTAs + compliance badges) and 15 failure modes. User exported viewer notes to `eval-notes-2026-05-14.md` (in Downloads). Resume here.
>
> **First action — run axial coding on exported notes.** Feed the export file to a frontier LLM (Claude Opus extended thinking OR a fresh Claude Code session) with this prompt:
>
> ```
> You are doing axial coding on qualitative eval notes from a creative-agent product (AI generates ad creatives for D2C / local biz / SaaS).
>
> Read the attached eval-notes-2026-05-14.md. Each section is freeform open-coding notes on one campaign through a "Type A" lens (performance marketer judging conversion potential).
>
> Cluster the observations into 5-7 named failure modes (categories), each with:
> - Name (3-5 words, sharp)
> - Definition (1-2 sentences)
> - Frequency (count of campaigns where this appears)
> - Severity (Critical / High / Medium / Low)
> - 2-3 verbatim examples from the notes
>
> Also produce:
> - Positive patterns (3-5 named, with frequency)
> - 2 "PASS anchor" examples (campaigns identified as base-quality)
> - 1 "FAIL anchor" example (campaign identified as worst-case)
>
> Output as markdown.
> ```
>
> **After axial coding output:**
> 1. Compare LLM's clusters to the failure-mode list in this doc (table above) — sanity check
> 2. Lock the formal taxonomy
> 3. Move to Q3: write PASS/FAIL rubric per top 3 categories anchored to staging campaign 2 + Theratefinder March 28 + staging campaign 1 Image 1
>
> **Parallel track (if energy permits):** start fixing the two narrow bugs while axial coding runs:
> - Wrong-brand-redirect detection in research extractor (`agent/.claude/skills/research-skill/`)
> - Reference-image UX gate for visual-first verticals (orchestrator prompt — when category in {real-estate, hospitality, apparel, accessories}, prompt user to upload)

---

## Files touched this session

```
docs/eval-corpus/campaigns-2026-05-14.md           — full per-campaign notes for 24 coded campaigns
docs/SESSION_104_EVAL_OPEN_CODING_COMPLETE_AXIAL_CODING_NEXT_2026-05-14.md  — this file
.claude/memory/MEMORY.md                            — index updated
.claude/memory/feedback_eval_type_a_lens.md         — NEW
.claude/memory/feedback_nano_banana_prompt_construction.md — NEW
.claude/memory/feedback_followup_count_not_failure_signal.md — NEW
.claude/memory/feedback_swap_test_whole_construction.md — NEW
.claude/memory/project_eval_top_failure_mode_image_content.md — NEW
.claude/memory/project_eval_reference_image_ignored.md — NEW
.claude/memory/project_eval_base_quality_benchmark.md — NEW
.claude/memory/project_eval_wrong_brand_redirect.md — NEW
~/Downloads/eval-notes-2026-05-14.md                — exported viewer notes (user's local file)
```

---

## Skipped (low-priority — code if more saturation needed)

Staging campaigns not coded (16 remaining): Hi (×2), Ref-raycast-hero, Bean Supreme (coffee), Resend (B2B dev tool), Mostunderated, Golfoy, Create, Bewakoof (another), Claude (×2 meta), and others. Most are likely repeat verticals or test garbage. Code only if axial coding shows a category needs more examples.

---

## Open punch list — eval workflow

- [ ] Run axial coding on exported notes → formal failure mode taxonomy
- [ ] Q3: Write PASS/FAIL rubric for top 3 failure modes anchored to benchmarks
- [ ] Q4: Build first automated grader (code-based preferred: e.g., "is CTA verbatim in image prompt?" via regex on prompts table)
- [ ] Fix wrong-brand-redirect detection (research extractor) — separable from eval workflow, can ship anytime
- [ ] Fix reference-image UX gate for visual-first verticals — separable from eval workflow
- [ ] Per-style prompt audit for concept-to-prompt loss — the big leverage finding

## Open punch list carried from S102/S103 (unchanged — deferred)

WS 1006 structural fix · Followup intent classification · Aspect-ratio drift · `new-ui` 135 commits ahead of master · Rotate prod Clerk Secret Key · Multi-reference selective replace Phase 1.1 · PR 2 undo/redo UI
