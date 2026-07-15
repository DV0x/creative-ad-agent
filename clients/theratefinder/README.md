# TheRateFinder — Meta ad creatives (client workspace)

Client: **TheRateFinder** (`theratefinder.ca`) · mortgage brokerage / "lending hub", **Woodbridge, Ontario**
Goal: **conversions** — Meta ad creatives that turn cold Canadian traffic into mortgage **applications**, not clicks.

## Where things are
| Path | What |
|---|---|
| `brief.md` | Offer, product lines, audience segments, **the regulated-category constraints**, the strategic wedge, and the open questions for the client. **Start here.** |
| `assets/ASSETS.md` | The asset shopping list. **We have nothing yet** — and no proof asset is the #1 risk. |
| `competitors/` | Meta Ad Library read of real Canadian mortgage ads → `findings.md`, creatives in `images/`. |
| `field/` | Field-first artifacts: discovery → pixel-level reads of real ads → `field-brief.md`. |
| `concepts/` | Ad concepts with full copy + visual direction, before rendering. |
| `render-jobs/` | Render job JSONs (prompt + refs + size). |
| `renders/` | Final generated creatives. |

## Status (2026-07-14) — field pass DONE, gap analysis DONE, nothing rendered
- ✅ Folder created, site read, `brief.md` grounded in what theratefinder.ca actually says.
- ✅ Render runners copied + repointed (`kie-render.mjs` primary, `render.cjs` = fal failover). Both syntax-clean, **neither run yet.**
- ✅ **FIELD PASS COMPLETE** — 137 live Canadian mortgage ads pulled from the Meta Ad Library across 21 pages,
  creatives downloaded + read. → `competitors/findings.md`
- ✅ **GAP ANALYSIS COMPLETE** → **`field/gap-analysis.md`** — the map of what's taken vs open, plus 9 hooks
  in 3 tracks. **Read this before writing any concept.**
- 🔴 **Blocked on the client** for the things we cannot invent: the pixel + conversion event, the economics,
  the **FSRA licence #**, **any proof asset**, and the two claims that make or break the strategy —
  **is the 24–48h rush close real**, and **can we publish the six funded deals?**

## The four things the field pass proved
1. **They are ALREADY advertising — 30 live ads since April 2026.** (I initially got this wrong; see
   `field/client-ad-audit.md`.) The pixel is **not** cold. And they're already in the commercial/investor
   lane — which my competitor scan says is **completely uncontested (0 of 137 competitor ads)**. Their
   strategic instinct is right.
2. **But only 4 of their 30 ads carry an offer.** 18 are brand/engagement, 7 are market commentary (GDP,
   Mark Carney, tariffs). **7 have no CTA button. 12 point at `fb.me`** — boosted posts, not conversion ads.
   Only 11 of 30 point at their own site. **Two-thirds of the account cannot convert by construction.**
   ← *this is the conversion problem, and fixing the plumbing is free.*
3. **Do not fight on rate.** 109 of 137 competitor ads are rate ads. True North runs **2.49%**, Ratehub
   **3.45%**, nesto **4.09%** — TheRateFinder's site says **"from 4.19%."** Worst number on the field.
4. **"Bank said no?" is a trap, not a gap.** Meta's Personal Attributes policy bans copy implying knowledge of
   someone's finances — which is why 8 brokers who sell "approved when banks say no" on their websites run
   **zero** Meta ads for it. The workaround is the **SUBJECT SWAP**: describe the *lender's box* or *our
   capability*, never the borrower's condition.

**Their best ad already exists:** *"$2.2M to buy a 50-year-old trucking company. New dad. Small-time operator.
Recent immigrant."* — a real deal, a real number, a real person. That's the receipt construction, and it should
be the workhorse rather than the exception.

## The two things that make this client different from Verbis
1. **It's a regulated category.** Mortgage ads are almost certainly Meta **Special Ad Category: Credit** — which
   likely means **no age / gender / postal-code targeting and no lookalikes.** If that holds, **the creative has to
   do the targeting**: the ad must name its buyer in the first three words, because Meta won't aim it for us.
   Verify in Ads Manager before designing around it.
2. **There is no proof asset.** No reviews, no rating, no testimonials, no face on the entire site. On Verbis, the
   *proof* creative was the best-performing ad of the campaign (2.36× ROAS — and we starved it). A mortgage is a
   bigger trust purchase than a ₹589 workshop. **Solve the proof gap before rendering.**

## Rendering
Primary = **KIE** (GPT Image 2). `render.cjs` is the fal.ai failover — same job-file shape.
```bash
cd /Users/chakra/Documents/Agents/creative_agent
set -a; source ./.env; source ./.env.local; set +a          # KIE_API_KEY / FAL_KEY
node clients/theratefinder/kie-render.mjs clients/theratefinder/render-jobs/<job>.json
```
Job files live in `render-jobs/`, outputs in `renders/`. Paths inside a job file (`refs`, `outDir`) are relative to
`clients/theratefinder/`. Job shape + size presets are documented at the top of `render.cjs`.

**Standing render rules (carried over from Verbis — hard-won, don't relitigate):**
- Brand marks (logo, badges) go in as **reference images** to the render — never composited afterwards, never AI-drawn.
- **Native, not AI gloss** — it has to look like it belongs in the feed.
- Each concept leads with **ONE** trust proof, foregrounded — proof is not wallpaper.
- Concept-check → render, **one at a time.**

## How to resume cold
Read `brief.md` (esp. the HARD CONSTRAINTS and the open questions) → `assets/ASSETS.md` → then `competitors/` and
`field/` once the field pass has run. Everything needed to pick this up is in this folder.
