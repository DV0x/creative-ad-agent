# S156 — LITE runs 3–5: trunativ.co VALIDATES the pipeline (6/6 shipped, unattended)

**Date:** 2026-07-22 · **Continues:** `docs/SESSION_155_LITE_FIRST_RUN_FINDINGS_2026-07-21.md`
(F1–F30) · findings here continue the ledger at F31.
**Status at close:** all S156 fixes IMPLEMENTED — 118/118 fixture checks green, both loops
typecheck, web boots. Everything still UNCOMMITTED on `new-ui` (incl. all of S155).

## The three runs

**Run 3 (houseoftwilight.in, KILLED mid-research)** — the run-3 fix batch (F20–F30 + batching)
went live. Two failures surfaced: research stuck in a length-denial loop (27,472 → 15,422 →
12,515 chars vs the 8,000 cap — the "compress" denial bought shaving, not rewriting), and
capture had brought only ONE product (first `/products/` link) against a founder brief asking
for a catalogue mix. Founder called the restart.

**The orphan incident (F32, ★ the day's hardest lesson)** — killing the web server did NOT
kill the SDK's CLI child. It ran ~11 min orphaned — hooks, validators, trace, and MCP servers
all dead in the host process — wrote an over-cap research.md, 14 picks with NO manifest and
ZERO viewed images, and a 10KB field-summary. stdin EOF means "finish the current run" to the
CLI, not "die". Run dir quarantined (`*_ORPHANED-DO-NOT-RESUME`).

**Run 4 (houseoftwilight.in, abandoned at intake)** — founder pivoted to a cold brand;
restart cleanly interrupted the session (first live proof of the F32 fix — zero orphans).

**Run 5 (trunativ.co, COMPLETE — the validation run)** — cold brand, cold niche (Indian
supplements), founder-named product fetched at intake, **6/6 through judge, 0 interventions**.

## Run 5 scorecard

| gate | target | actual | |
|---|---|---|---|
| through judge | ≥4/6 | **6/6** (first clean sweep) | ✓ |
| interventions | 0 | **0** (1 SendMessage auto-nudge) | ✓ |
| logos bound not drawn | — | ✓ rasterized PNG in all 6 (but see F37) | ✓ |
| placeholder / video-chrome defects | 0 | **0** | ✓ |
| cost | ≤$3.50 | **$4.81** ($0.80/shipped — best yet; run 1 $2.22, run 2 $1.18) | ✗ |
| wall | ≤25m | **47.7m** (research 6.5 / field 14.4 / create 5.0 / judge 4.1 / build 12.1) | ✗ |

Run did 2× run-2's work at run-2's price: 27 images (vs 12), 58 clusters (vs 22), 6 renders
(vs 4), 3-product capture + intake fetch. Batch spans 3 products; every caption number traces;
c5 fills the field's open lane (text-billboard) on a real Rainmatter anchor [P15].

## Fixes built today (before/during the runs)

- **F31 — capture takes 3 products + full catalogue list** (was: first link only; 16 sat in
  the HTML). PLUS **founder-driven fetch [F]**: `capture_products` MCP tool — orchestrator's
  ONE exemption from the MCP block (`orchestratorMcpAllow`, hook.ts seam #3) — fetches
  intake-named products from brand.md's `## Catalogue` URL list. Fenced: same-domain,
  /products/ paths, exact URLs only, once/run, max 4. **Validated live**: founder named
  Everyday Fiber → 4 shots on disk pre-research → 2 specs used it.
- **F31b — research length loop**: surgical denial (exact overage, prose-line count, table
  cost, one-line-per-artifact format, ~7000 target) + budget stated in prompt + maxTurns
  6→10. **Validated live**: run 5 landed 7,973 chars w/ 42 artifacts + 12 domained
  competitors (run 3 never landed). Residual: still shaves (2 denials), doesn't one-shot.
- **F32 — orphan kill**: `ChatSession.interrupt()` (seam: chat/session.ts, additive) +
  web.ts liveSessions registry + SIGINT/SIGTERM hardStop. **Validated live** (run-4 kill).
- **Model-role law [F]**: "generated humans are fine — identity claims are not." Create +
  judge rubric now ban only the IDENTITY LIE (named customer / "our advisor" / testimonial
  face), never human presence. Memory: `feedback_generated_models_allowed.md`.

## Run-5 findings → fixes applied post-run (this doc's batch)

- **F33 ★ — the field seat CONFABULATED a failure**: reported "CDN expiry wiped pixels on
  17 of 27 images", named 13 files, downgraded 5 of its own picks ("judged NOT from viewed
  pixels"). Ground truth: harvest recorded exactly **1** failed download; all 13 named files
  on disk; all 27 Reads returned pixels (trace-verified); spot-view pristine. New failure
  class: FABRICATED HONESTY — a fake failure story reads as rigour. **Fix:** manifest now
  records `field.imageDownloads {planned, downloaded, failed, failedIds}`; `summaryProblem`
  denies any honesty[] image-failure claim exceeding the real count (quotes it back);
  vision law: "an image you Read is an image you SAW; quote exact error text or nothing."
- **F34 — wildcard lane structurally unfillable**: workhorse+fresh exhausted the global
  advertiser cap (3) before the wildcard pass; ALL 43 leftover clusters were cap-blocked
  (verified by re-running selection on the raw dumps). **Fix:** `WILDCARD_CAP_HEADROOM = 1`
  — an advertiser may hold 3 scored picks + 1 wildcard.
- **F35 — `captionFixes: null` denied**: cost one full Opus round-trip. **Fix:** null = "none".
- **F36 — brand.md logo self-contradiction**: extractor line "logo-site.svg — bind it as a
  render reference" vs the newer "never the .svg" note. **Fix:** `patchSvgBindNote()` in
  lite capture rewrites the sentence (no agent-loop fork).
- **F37 — logo GLYPH fidelity (founder-caught, DEFERRED [F])**: the Trunativ "a" carries a
  leaf-cutout-with-vein-arc; renders dropped it (c4 header: gone; c5 large: mangled sliver).
  Raster PNG is faithful — this is the generative-redraw limit: refs anchor form, sub-glyph
  counters below the fidelity floor get simplified; scale is the variable (big c5 got closer).
  Founder call: LEAVE for now. Sketched fix when picked up: build law names signature glyph
  details in the prompt + glance check 6 (mark fidelity vs bound ref); guaranteed-exact =
  compositing = Pro-tier question (founder rejects post-hoc overlays at this tier).

## Watch items (not fixed, deliberate)

- **Time 47.7m vs 25m gate** — ~70s/turn latency × 5 sequential seats is the whole story.
  Batching fixes proved out (field 18.2m→14.4m at 2× the images; 27 images in 6 messages
  @4.5/msg; picks 2/message; renders parallel 5.8m/6). Next lever is structural (fewer
  turns, not better prompts).
- Near-dupe pairs c2/c4 + c3/c6 (3 products × 6 slots ceiling — judge named + down-ranked
  them correctly; more products via intake fetch is the founder's lever).
- Research shaves (2 denials) instead of one decisive rewrite — ~1.5 min, acceptable.
- Adjacent lane empty: both adjacents ran zero Meta ads (field reality, honestly recorded —
  research could nominate 3–4 adjacents for fallback).
- Resolver namesake guards HELD on the cold niche (HK Vitals Nepal / True Elements
  Suplementos correctly excluded); suspect-likes flag live.

## S155 fixes PROVEN live in run 5

F26 collect-all (create fixed 11 problems in ONE rewrite; judge 7-in-one) · F24/F25 (zero
placeholder/chrome defects) · F28 SVG→PNG rasterizer (first live SVG brand; PNG bound in all
6 — glyph caveat F37) · F22 uniqueness (15/15 picks unique on an exactly-exhausted pool — the
run-2 padding case) · F21 announcements (wildcard-empty + suspect resolves surfaced honestly)
· verdict hook (2 denials → clean file) · batching laws (images 4–6/msg, picks 2/msg) ·
anti-halt + sanctioned nudge (research halt recovered invisibly).

## NEXT

Run 6 candidates: re-run HOT (cost/time A/B on the fixed pipeline) or another cold brand.
Time gate is the open engineering problem. COMMIT the whole batch (lite-loop + 3 agent-loop
seams + docs) — founder rule satisfied: validated end-to-end, unattended, on a cold brand.
