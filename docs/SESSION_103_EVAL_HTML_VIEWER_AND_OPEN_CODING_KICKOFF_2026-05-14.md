# Session 103 — Eval HTML viewer built, open-coding kickoff

**Date:** 2026-05-14
**Branch:** `new-ui`
**Commits:** none (will commit after staging verification per project convention)
**Goal:** start the eval workflow for Creative Agent before launch

---

## TL;DR

User asked "what's next before launch?" → answer was: do evals first, since the product is creative output (hard to unit-test). Followed Hamel Husain's **AI PM Eval Masterclass v3** — the doc happens to use a "Creative Campaign Agent" as its worked example, which IS our agent (same 6 hook types, same 14 art styles, same research → hooks → art direction → images pipeline).

**Method we're using:** open-coding of real production traces. This is **Q2 (FAIL)** of the 5-Question framework — discovering failure modes from real data before writing rubrics or building automated graders. **Not** building evals yet; doing the error analysis that comes before evals.

---

## Required reading for next session

| File | Purpose | Time |
|---|---|---|
| `docs/ai-pm-eval-cheatsheet.html` | 5 Questions, ACCT, 7 failure modes, error analysis process — distilled | **5 min — read first** |
| `docs/ai-pm-eval-masterclass-v3.html` Chapter 7 (line ~3618) | "Open Coding a Creative Campaign Agent" — literally our product | 15 min — reference |

---

## Where we are in the framework

```
Q1 DO        — agent blueprint                       ✓ done (research → 6 hooks → art direction → 6 images)
Q2 FAIL      — open-code 30+ traces → taxonomy       ← ON THIS NOW (2 of 10 prod campaigns coded)
Q3 SUCCESS   — write pass/fail rubric per category    next
Q4 DETECT    — build graders (code → LLM → human)     after Q3
Q5 IMPROVE   — every prod failure becomes a regression test
```

**Eval hierarchy — where we sit:**
```
Code grader   ← cheapest, fastest    (not yet)
LLM judge     ← flexible, $$           (not yet)
Human review  ← gold standard          ← we are here
```

---

## What we built this session

Two scripts in `cloudflare/scripts/`:

1. **`dump-eval-corpus.ts`** — pulls 40 real campaigns (10 prod + 30 staging, status=`complete`) from D1 into `docs/eval-corpus/campaigns-2026-05-14.md` (435KB MD with brief, research, hooks, art direction, image paths, blank notes section per campaign).

2. **`build-eval-viewer.ts`** — generates an interactive HTML viewer:
   - Downloads all 99 images from R2 (prod + staging buckets) to `docs/eval-corpus/images/` (gitignored, 246MB)
   - Renders `docs/eval-corpus/viewer.html` (1.2MB single file)
   - Dark theme, collapsible cards, inline image grid, notes textarea with localStorage save, "export notes to MD" button
   - Preserves existing notes from the .md file via `parseExistingNotes()`

**Open viewer:**
```bash
open /Users/chakra/Documents/Agents/creative_agent/docs/eval-corpus/viewer.html
```

**Rebuild after new campaigns land (or to refresh):**
```bash
cd cloudflare && npx tsx scripts/build-eval-viewer.ts
```

---

## Pre-coded campaigns (notes already in viewer + .md)

### 1. PROD — Whole Truth Foods (`campaign_mp40awylzb2gch`) — 2026-05-13
- Hook 1 headline ("What's actually in your protein powder?") fails swap test — works for any protein brand
- Hook 2 ("They say 'clean.' We show our work.") is more brand-specific
- Research surfaced concrete proof points ($6M Sequoia, FSSC cert, 50K newsletter subs, "Bada Barkhana" facility, ChemX) — NONE made it into hooks
- Brand voice signals ignored in research ("Cereal killa," "B.Y.O.B.")
- Single theme (transparency) across both ads — limited variety

### 2. PROD — Optimum Nutrition India (`campaign_mp3q9e5n9d2f81`) — 2026-05-13
- Hook 1 leads with "Glanbia" (parent) not "Optimum Nutrition" (consumer-facing brand)
- Possible fabrication: "global quality guarantee" — research had flagged "no certifications visible"
- 6 hooks in bank, only 2 images shipped — workflow question
- **Engineering bug:** `campaign_images.hook_type` column says ("stat", "story") but actual hooks are ("Direct Address", "Contrast"). File separately.
- Concept 1 image is text-heavy ("GLANBIA VERIFIED" overlay, QR codes) — fal.ai text rendering risk
- 3 follow-up turns — user iterated, suggests dissatisfaction worth investigating

---

## Patterns surfacing (provisional — only 2 of 10 prod coded)

These don't fully match the masterclass's pre-existing taxonomy. **Hold off locking categories until 30+ campaigns are coded** (theoretical saturation point per the doc).

- **Generic-headline-specific-body** — hook headline fails swap test, brand punch lives in body copy. Sub-form of "Brand disconnection" but specifically about headline placement.
- **Strong research, weak handoff** — research surfaces specifics, hooks ignore them. Doc has "Shallow research" but not "research → hooks handoff failure." May be a new category for our agent.
- **Fabricated proof** — possible match to doc's "Fabricated claims" but specifically about INVENTED certifications/guarantees, not fake stats.
- **Brand voice ignored** — research surfaces distinctive voice signals, hooks render in generic ad voice.

---

## Next session opener

> Last session built the eval HTML viewer (`docs/eval-corpus/viewer.html`) and open-coded 2 of 10 prod campaigns. Goal next session: finish open-coding remaining 8 prod campaigns together, campaign by campaign, then axial-code into a real failure taxonomy.
>
> **Method:** I read the trace text in chat. User views actual images in the viewer. Both add observations into the viewer's notes textarea per campaign. Notes auto-save to localStorage.
>
> **First action:**
> 1. Open `docs/eval-corpus/viewer.html` in browser.
> 2. Start with **campaign 3: Creat — `campaign_mp2v002v6n7lb4`** (line 546 in the .md if needed for cross-reference).
> 3. Skim `docs/ai-pm-eval-cheatsheet.html` if anything in the framework is fuzzy.
>
> **After all 10 prod coded:** click "⬇ export notes" in the viewer to dump `eval-notes-YYYY-MM-DD.md`. Feed that file to a frontier LLM with the axial coding prompt from the masterclass (cheatsheet has the prompt template) → get 5-6 categories with %. That's our taxonomy. Then Q3 (write rubrics).
>
> **If energy permits:** continue into staging campaigns to push closer to 30 (saturation point per the doc).

---

## Files touched

```
docs/eval-corpus/campaigns-2026-05-14.md          NEW — 40 campaign dump (435KB, committed)
docs/eval-corpus/viewer.html                       NEW — interactive viewer (1.2MB, gitignored)
docs/eval-corpus/images/                           NEW — 99 R2 images (246MB, gitignored)
cloudflare/scripts/dump-eval-corpus.ts             NEW — dump script
cloudflare/scripts/build-eval-viewer.ts            NEW — viewer build script
.gitignore                                          ADDED — exclude images/ + viewer.html
```

---

## Open punch list — eval-specific

- [ ] Open-code remaining 8 prod campaigns (3-10)
- [ ] Push to 30+ traces via staging campaigns for saturation
- [ ] Axial-code exported notes → failure taxonomy with %
- [ ] Q3: write pass/fail rubric for top-2 failure categories
- [ ] Q4: build first automated grader (code check preferred over LLM judge)
- [ ] **Bug filed separately:** `campaign_images.hook_type` column doesn't match hook bank types (found in campaign 2 / Opti)

## Open punch list carried from S102 (unchanged — deferred)

WS 1006 structural fix · Followup intent classification · Aspect-ratio drift · `new-ui` 135 commits ahead of master · Rotate prod Clerk Secret Key · Multi-reference selective replace Phase 1.1 · PR 2 undo/redo UI
