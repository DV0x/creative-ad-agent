# SESSION 152 — S151 fix list EXECUTED, validated on two live runs + brand-capture layer built

**Date:** 2026-07-18
**Status:** The S151 fix list (Part 4) is BUILT and VALIDATED live. Two TheRateFinder runs served as
the A/B: run 1 validated the S151 batch and exposed five NEW defects; the fixes for those were built
mid-session and run 2 validated them. A three-tool BRAND CAPTURE layer (`mcp/brand-identity.ts`)
was then built and live-tested against theratefinder.ca + thewholetruthfoods.com (+ a Shopify store
for the gallery tier). Everything committed this session; only #3 (milestone writes + cache TTL)
remains parked.

## Part 1 — The two validation runs (same brand, same cached field = clean A/B)

Run dirs: `agent-loop/runs/2026-07-18-07-46-38_www-theratefinder-ca/` (run 1, old field code),
`agent-loop/runs/2026-07-18-09-09-27_www-theratefinder-ca/` (run 2, after the S152 batch).

| | HK baseline (S151) | TRF run 1 | TRF run 2 |
|---|---:|---:|---:|
| Wall clock | ~110 min | 51.9 min | 63.6 min |
| Cost (MAX total_cost_usd) | $19.97 | $10.64 | $13.91 |
| Shipped / rendered | 3/3 (1 flagged batch) | **1 of 3** (2 LP-flagged) | **3 of 3** |
| $ / shipped creative | $6.66 | $10.64 | **$4.64** |
| Create stage | 38.9 min | ~8.7 min | ~8 min |
| Images downloaded | 159 | 18 | 20 |
| Auto-compactions | 1 | 0 | 0 |
| Specs sourced from client's own ads | n/a | **5 of 9** | **0 of 8** |
| Format hunts | 2 | 0 | 2 |
| Ring B/C adjacents fetched | n/a | 0 | 7 |
| Backfill loop | ordered, NEVER RAN | ran (7 survivors) | ran (6 survivors), both replacements survived |

Run 2 cost more than run 1 because it did MORE (deeper field: 22 resolves, 13 fetches incl. 2×depth-2,
2 hunts; backfill ×2; one re-render round) — but $/shipped dropped 2.3×.

## Part 2 — What was built (fix-by-fix, all committed)

**S151 list (validated by run 1):**
1. **create file-per-spec** — `creatives/c1..8.json` one object per file; `hook.ts` PostToolUse
   assembles `creatives.json` code-side (MERGE by creative number — old-run resumes keep survivors);
   Edit in create's toolset; backfill continues numbering (c9…). Run evidence: 0 Edit-stitches,
   0 split-writes, 0 read-before-write rejections, 0 stray files (HK had all four).
2. **Scout diet** — competitor_ads/format_hunt dump-only (no auto image download);
   `download_creatives` = phase two, shortlist-only, gathering-cap-EXEMPT; binary-WebFetch hook ban
   (fbcdn/cdninstagram/image paths, ALL seats); 120-char copy in context views; CONTEXT DIET block.
4. **Anchor gate** (create) — no anchor # → not on-image copy / fuelHeld; brief = testimony not proof.
5. **Brief self-check** — "brand holds X" grepped (founder-facts + brand's own dump) or written as a
   QUESTION; internal-contradiction check (a rival's fact can't reappear as the brand's).
6. **Backfill branch** — orchestrator obeys the BACKFILL section's PRESENCE, never a survivor count.
   Fired at 7 survivors (run 1) and 6 (run 2); both loops closed clean, replacements ranked 3rd both times.
7. **Gate checks 7+8** — REGISTER fidelity (render vs source-construction register, major) +
   AI-TELLS inventory (major on native executions). Both reasoned properly in both runs.
9. **Intake REGISTER question** (+ BRAND KIT question added later in session). "Follow the field" now
   produces a NAMED register decision in create's output.
10. KIE 4:5 — still falls back to 3:4; render.ts self-heals when KIE re-enables (fal does true 4:5).

**S152 batch (defects found in run 1, validated by run 2):**
11. **Job classifier: boosted posts** — fb.me destination OR no-CTA+no-destination → awareness
    (classifyJob). Run 2: client 9 conversion / 21 awareness, zero competitor false positives.
    Root insight: unmanaged boosted posts ride the days×variants ranking as fake endorsement.
12. → became the brand-capture layer (Part 3).
13. **Every-number anchor** — every on-image digit anchored VERBATIM (350+ ≠ 300+; an understated
    number with a qualifier = unverified subset claim → buyer TRUE kill). Run 2: buyer killed c8 with
    exactly this language; 350+ consistent across 6 specs.
14. **Brief citations name the actual file** ("verified in raw/ads/theratefinder.jsonl").
15. **Own-ads ban** — brand's own reads NEVER on the sourcing ladder (DO-NOT-CLONE evidence only);
    buyer CLONE(c) OWN-SOURCE kill; thin-field → hunts MANDATORY; context diet ≠ reason to skip
    depth/churn/hunts. Run 2: 0/8 own-sourced (run 1: 5/9).
16. **WINDOW-TRUNCATED cadence guard** (launchCadence) — a partial page-1 window REFUSES to emit a
    cadence; "re-call depth=2". Run 1's True North "LAUNCH-FLUSH" was a pagination artifact (newest-30
    window); run 2 re-fetched at depth 2 (real answer: genuinely launch-flush — but now KNOWN, not
    guessed; Loans Canada's window hid 715d ads).
17. **Resolve breadth-first + adjacents floor** — one name + one domain retry per candidate, then move
    on; the set must hold ≥2 fetched Ring B/C advertisers. Run 2: 7 adjacents; best constructions came
    from the adjacent lending category (Loans Canada 194d×7v / 80d×14v systems; 2 hunt finds).
+ buyer.md verdict template: BACKFILL section is plain text (run 2's buyer copied the template's
  literal `[...]` brackets).

## Part 3 — The brand-capture layer (`agent-loop/mcp/brand-identity.ts`, server `brand` v0.3.0)

Motivation: both TRF runs shipped forest-green/amber ads for a NAVY/MINT brand (#011a40 + #46be8a —
read from their logo file in one curl). No seat ever captured brand identity; create inferred
"equity" from ad pixels. WebFetch can't fix it: its markdown conversion strips meta/script/link/style
— the exact places identity lives — and its Q&A model paraphrases (a verbatim-law violation).

Three deterministic tools (no model in the loop, no credits), wired into COLLECT (call first):
- **brand_identity(url)** — logo found (incl. Next.js `_next/image` decode) + downloaded to
  `assets/logo-site.<ext>` (SVG colours read from the file); palette = hex frequency across HTML+CSS
  cross-confirmed vs logo (two tiers: logo-confirmed + frequency-dominant accents); fonts; VERBATIM
  voice (title, meta, h1-h3, CTAs). Dump: `raw/brand-identity.json`.
- **product_photos(pages[])** — structured-data-ONLY product capture (og:image + JSON-LD Product;
  cross-sell images of other SKUs never grabbed): pack shots to `assets/product-<slug>_<n>` (bare-URL
  trick upgrades sized variants to originals); Shopify tier = full gallery via public
  `/products/<handle>.json` (27/27 on a live store); name, price, AggregateRating (citable
  social-proof), 12 verbatim FAQ pairs, JSON-LD description; REVIEW-CARD images (testimonials
  published as pixels — TWT ships 21; collect VIEWS and transcribes verbatim). Dump:
  `raw/product-photos.json`. NOT taken: embedded-state attribute pairs (unscoped across products —
  cross-sell poisoning) and client-rendered %-tables/nutrition → NAMED gaps for Perplexity/founder.
- **page_text(url)** — verbatim page fetch replacing WebFetch ON COLLECT (WebFetch removed from that
  seat; kept on judgment seats: gate LP check, intake). Full text auto-saved to `raw/pages/<slug>.txt`;
  counts against the gathering budget (hook.ts).

Downstream binding: collect writes palette/typography/voice as NUMBERED artifacts → create's
`palette` must cite the BRAND PALETTE anchor (ad reads inform REGISTER only, never colours) + writes
in the brand's voice from the voice artifacts → gate's LP check gains VISUAL congruence (ad wearing
another brand's colours = FAIL, re-render). Intake round 3 asks REGISTER + BRAND KIT (founder hexes
outrank extraction).

Live-tested: theratefinder.ca (navy/mint confirmed), thewholetruthfoods.com (berry/pink/black,
custom font `obviously`, 20 voice lines, mango PDP: 2 pack shots incl. 2001×2001 original, 4.26★×724,
12 FAQs, 10 review cards, verbatim description), boat-lifestyle.com (Shopify 27-image gallery).
Demo output in `agent-loop/runs/brand-demo-twt/` (gitignored).

## Part 4 — Findings for the CLIENT (TheRateFinder) from the runs

- Run 2's shipped set: c7 "Banks stepped away" (commercial access ladder — the uncontested lane),
  c1 posted-rate ladder, c10 "Lenders for every credit profile" (subject-swap compliant, 5.99% hero).
- **Rate-match guarantee is NOT on theratefinder.ca** (gate + independent fetch both confirmed) —
  either add it to the LP or ads can't lead with it (killed 2 of 3 renders in run 1).
- Their true brand palette is NAVY #011a40 + MINT #46be8a (logo.svg) — both runs' creatives (and
  their own existing ads) don't use it consistently.
- 21 of their 30 live ads are boosted posts that cannot convert by construction (fb.me / no CTA).

## Part 5 — Remaining work (parked, in priority order)

1. **#3 milestone writes + cache TTL** (S151 A3) — milestone micro-writes as code not queries
   (−$0.8); 1h-TTL / slim orchestrator context (cache-write churn was $6.7 on HK, ~$4-5 addressable).
   Parked FOR a measured pass: run the profiler before/after on the next run.
2. **Step 4 CSV outcome loop** (S145) — the moat; unchanged, still the only unbuilt S145 piece.
3. Known loose ends: run 2's scout skipped nesto's mandated depth-2 (rule exists, behavioral miss);
   brand tools not yet validated INSIDE a full run (next run validates); SAC lane wording in run 2's
   founder-facts inverted ("no targeting restrictions" — should read "targeting IS restricted");
   consider fal-routing for true 4:5.

## Part 6 — Fast pointers

- Commit: this session, branch `new-ui`. Code: `agent-loop/mcp/brand-identity.ts` (new),
  `mcp/scrapecreators.ts` (0.7.0), `hook.ts`, `stages.ts`, `pipeline.ts`; binders: create/field/
  collect SKILL.md, field-brief.md, buyer.md, gate.md.
- Profiler: `agent-loop/trace-profile.cjs` (S151) — committed this session too.
- Cost law (S150): MAX total_cost_usd within segment, never sum, never file-last.
- Web server: detached launch recipe in S150 Part 5; MUST restart after code edits (tsx holds old
  code in memory — bit us once this session).
- Prior: S151 (trace eval), S150 (launchpad), S145 (plan).
