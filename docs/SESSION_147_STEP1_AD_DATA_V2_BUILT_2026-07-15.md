# SESSION 147 — Step 1 (ad-data engine v2) BUILT — pending its validation run

**Date:** 2026-07-15 (same day as S145 plan + S146 Step-0 commit `eabc7e3` + plan refinement `ac7fbc9`)
**Status:** Step 1 of the Portfolio Engine plan (`docs/SESSION_145_PIPELINE_TEARDOWN_AND_PORTFOLIO_ENGINE_PLAN_2026-07-15.md`
§Step 1, items 1–7 + the S143 §3.3 fold-in) is IMPLEMENTED and unit-tested against the cached ON-India
data (0 credits, all assertions pass) + `tsc --noEmit` clean. **UNCOMMITTED** — per the per-step
discipline, the commit waits for the cache-cheap ON re-run (founder runs/authorizes it; standing rule:
no end-to-end run without founder permission).

---

## What was built

### Scraper — `agent-loop/mcp/scrapecreators.ts` (server 0.4.0 → 0.5.0)

1. **Job classification (item 1).** `classifyJob(rawAd)` — exported, deterministic:
   `conversion | retargeting | local | awareness | recruitment` from CTA type
   (GET_DIRECTIONS/CALL_NOW→local), link domain (g.co/maps→local, careers/linkedin→recruitment),
   copy shape ("now open"/"grand opening"→local, "we're hiring"→recruitment, `{{templates}}`→
   retargeting), format (DPA→retargeting, PAGE_LIKE→awareness, VIEW_INSTAGRAM_PROFILE→awareness).
   Default = conversion (conservative). `job` lands on every dump line (`rawAdEntry`) and every
   shaped result row; non-conversion ads are tagged `· job:<x>` in tool output.
2. **Job-aware ranking.** `rankRevealedWinners` and the image-download sort both put
   active → conversion-job → variants → days. The per-brand download cap (12 ads) is no longer
   spendable on store-opening/catalog pixels — the BigMuscles pollution dies at the source.
3. **Launch-cadence brand calibration (item 5).** `launchCadence(entries)` — exported: buckets
   active ads by launch age (≤30/31–90/91–180/>180d) → label
   `ACTIVE-TESTER | LAUNCH-FLUSH | ZOMBIE | STEADY | UNKNOWN` + note. Computed over
   **conversion-job ads only**, printed per page as a `LAUNCH CADENCE:` line beside a `JOB MIX:` line.
4. **Date windows (item 3).** `last_days` param on `competitor_ads` AND `format_hunt` → server-side
   `start_date` (today−N). The 90d recency read is the documented use. **NOT yet verified live**
   (new param = new cache key = live credit; see "Pending" below).
5. **Cursor pagination (item 6).** `depth` (1–3) on `competitor_ads`, same loop as format_hunt;
   `cursor` confirmed present on cached company/ads payloads. Result prints
   `MORE PAGES AVAILABLE — re-call with depth=N` when a cursor remains.
6. **Dump-clobber guard.** Re-fetch variants no longer overwrite the primary dump:
   `status:ALL/INACTIVE` → `<brand>.status-all.jsonl`, `last_days` → `<brand>.lastNd.jsonl`.
7. **Domain-retry resolve (item 6, TheRateFinder lesson).** `competitor_find_pages` description now
   instructs: name finds nothing/namesakes → retry with the brand's DOMAIN as query.

### Binders (symlinked into `agent-loop/plugin/creative-binders/skills/`)

- **`agent/.claude/skills/field/SKILL.md`** — §2 domain-retry; §3 job/cadence signals explained +
  deliberate extra fetches (churn read = `status:ALL` on 2–4 central rivals; `depth` on MORE);
  §4 rebuilt: conversion-job-only gate, re-investment-first ranking (twin dedupe + serial re-runs
  accrued at construction level), `UNCHALLENGED` flag for single-variant long-runners,
  cadence calibration, **NEW "slice gate" section (item 7)** — eyeball the pool into visibly-distinct
  KINDS; every kind gets one exemplar read slot before any brand's second read of the same kind;
  kind noted per slice line. Deliverable template: set table +`job mix`+`cadence` columns, shortlist
  lines +kind, new Churn section, Gaps names excluded non-conversion piles.
- **`agent/.claude/skills/field/references/field-brief.md`** (inlined into the brief seat) — new
  "endorsement discipline" section (conversion-job only; construction-level accrual; recency-primary /
  all-time-demoted-to-durable-angle; UNCHALLENGED; cadence calibration); hook bank = conversion-job
  only; deliverable +Coverage header (read N of M, blind spots), +Churn section, +linkDomain funnel
  read in the copy layer; hard rules updated.
- **`agent/.claude/skills/field/references/read-schema.md`** — endorsement object carries `job`
  (copied verbatim from the dump line; readers may correct it with reason).
- **`agent/.claude/skills/create/SKILL.md` + `references/buyer.md`** — S143 §3.3 sourceRead honesty:
  `copy:<brand>_<adId>` legitimately marks a copy-endorsed construction (no pixel read); spec's `keep`
  must name the real layout source; buyer treats a PLAIN sourceRead with no read line as TRUE-failure,
  judges `copy:` specs on the dump line + named layout source.

## Test evidence (this session)

- **Unit test** (`scratchpad/test-ad-data-v2.ts`, runs on cached ON payloads, 0 credits): ALL PASS —
  all 6 known BigMuscles store-opening ads → `local` (incl. the 390d one); every DPA → retargeting,
  PAGE_LIKE + IG-profile → awareness, GET_DIRECTIONS → local. Cadence labels match the teardown's
  ground truth: **Avvatar = LAUNCH-FLUSH** (29/29 ≤30d — the exact S143 trap), MuscleBlaze =
  ACTIVE-TESTER (4 fresh + 17 proven >180d), Dymatize = ZOMBIE (newest 142d), ON itself =
  LAUNCH-FLUSH (24/25 ≤30d — its own refresh spree; it's DO-NOT-CLONE anyway).
- **`./node_modules/.bin/tsc --noEmit`** clean after all scraper edits.

## Pending — the Step-1 validation run (founder-gated)

Cache-cheap ON India re-run (scrapes cached ≤48h TTL — the 07-15 cache is fresh today; ~30 KIE
credits for renders). Diagnose: (a) shortlist/brief carry job-mix + cadence columns and NO
store-opening hooks anywhere; (b) slices spread across kinds (OZiva's distinct DR construction gets
a read slot; MuscleBlaze ≤2 reads of the same construction); (c) brief's Working section shows
construction-accrued endorsement + UNCHALLENGED flags; (d) any `copy:` sourceRead judged correctly
by the buyer. **Live-verify** on real credits (cheap, 1–2 credits, can ride the same run): `last_days`
semantics on company/ads (does `start_date` filter by launch or by delivery-window?) and one `depth:2`
paginated fetch. → If clean, COMMIT as `feat(field-first): ad-data engine v2 (S146 Step 1)`.

Then: Step 2 (diversity architecture — formatFamily enum, two ledgers, portfolio contract, format
bank) per the plan's pacing, with a FRESH-BRAND run.
