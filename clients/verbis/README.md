# Verbis Edu — Meta ad creatives (client workspace)

Client: **Verbis Edu** · Offer: **"Score 79+ in PTE in 4 Hours — Live Masterclass"** (₹589, Sat 11 July 2026)
Goal: Meta ad creatives that convert cold study-abroad students into ₹589 registrations.

## Where things are
| Path | What |
|---|---|
| `brief.md` | The offer, audience, voice, **hard constraints (NO refund)**, assets, strategic wedge. Start here. |
| `competitors/findings.md` | Live Meta Ad Library read — free-consult set + paid-webinar set + the paid-webinar creative playbook. |
| `competitors/images/` | Real competitor creatives (reference), split free-consult vs paid-webinar. |
| `concepts/concepts-v1.md` | 6 ad concepts in 2 tracks (poster workhorses + native scroll-stoppers), full copy + visual direction. |
| `assets/` | **Client's real assets go here** (trainer photo, 90/90 score reports, review screenshots, logo). `from-website/` = pulled from LP. |
| `renders/` | Final generated Meta creatives (1:1 + 4:5). |

## Status (2026-07-01)
- ✅ Website read · audience + voice locked · competitor research done (both sets) · brief + concepts written.
- ✅ **Real assets harvested** (see `assets/ASSETS.md`): trainer photo, **4 real Pearson score cards (faces redacted → `scorecards-redacted/`)**, logo, brand tokens (gold + deep teal + cream, Exo 2). Concepts grounded in real score-card facts (Reading 65 → Overall 83) — no fabrication.
- ✅ **Google reviews captured** (`assets/google-reviews.md`): 4.9★ / 492, best PTE review (Elissa, names Partha). Added concept **B4** (social-proof) + a "4.9★ · 491+ reviews" trust bar on every creative.
- Decisions locked: **hold ₹589 (justify hard)** · risk-reducer = ₹3,000 exam coupon · **NO student faces** (trainer face OK).
- ✅ **Clean Parth photo received** → `assets/trainer/parth-clean.png` (1311×1200). Poster/face track unblocked.
- ✅ **Render pipeline LIVE + validated** — GPT Image 2 (OpenAI via fal.ai). Both endpoints smoke-tested (see `renders/_smoke/`): text-to-image renders crisp on-brand text; **edit mode keeps the real score card 100% intact**. See "Rendering" below.
- ✅ **APPROVED 4:5 creatives (5), brand-marks-as-references + native look:** `a1-reframe-ref` (reframe + Parth) · `a2-deadline-native` (offer-letter desk) · `b3-scorecard-ref` (65→83) · `b4-social-proof-ref` (4.9★ + Elissa) · `proofwall-results-native` (90·90·83 real cards). Logo + Google badge fed as edit-mode references (NOT composited). Dead files in `renders/`: a1-*-FINAL/v2/_smoke, pas-* (concept dropped).
- **Working rules (all locked, see memory + trust-map.md):** native not AI gloss · topic (PTE) + offer legible in dominant text · brand marks as references (never composited) · each concept leads with ONE trust proof (Parth/Google not wallpaper) · concept-check → render, one at a time, 4:5 only for now.
- ⏳ **NEXT:** more concepts from the pool (B2 Hinglish · C4 value-stack · C6 real-institute · C1 AU-PR · C3 pro/nurse), then 9:16 versions of the winners, then launch.
- Open flag for client: ₹589 is 6× Rahul Malodia's proven ₹99 tripwire price — consider a lower-entry price test.

## Rendering
Model: **GPT Image 2** (`fal-ai/gpt-image-2` + `/edit`), via `render.cjs`. Chosen for ~99% text fidelity (our creatives are copy-heavy). Reference images (Parth, score cards) go through **edit mode** so they stay real.
```bash
cd /Users/chakra/Documents/Agents/creative_agent
set -a; source ./.env; source ./.env.local; set +a      # FAL_KEY is in .env
NODE_PATH=./agent-loop/node_modules node clients/verbis/render.cjs clients/verbis/render-jobs/<job>.json
```
Job files live in `render-jobs/`, outputs in `renders/`. Job shape + size presets documented at the top of `render.cjs`.

**Brand marks are composited, never AI-drawn.** The AI paints the creative (told to leave the top-left corner + a badge slot empty), then the real **Verbis logo** and **Google badge** are stamped on with PIL for pixel-exactness — same rule as the score card. First finished proof: `renders/a1-reframe-poster-FINAL.png` (logo top-left, Google badge under the CTA). A reusable composite step should be factored out of the inline PIL used for A1.

## How to resume cold
Read `brief.md` → `competitors/findings.md` → `concepts/concepts-v1.md`. Everything needed to pick up is in this folder.
