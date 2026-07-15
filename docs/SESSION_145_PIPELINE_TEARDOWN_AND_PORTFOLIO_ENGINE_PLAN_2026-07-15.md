# SESSION 145 — Full pipeline teardown + the Portfolio Engine upgrade plan (+ format_hunt BUILT)

**Date:** 2026-07-15 (follows S143 field-first wiring `docs/SESSION_143_*.md`; S144 was TheRateFinder client work)
**Status:** STRATEGY + PLAN session with one build. The field-first pipeline was torn down end-to-end
(every binder, every ON-run artifact, the scraper internals) against fresh research on Meta Andromeda and
elite agency methodology. Verdict: **the spine survives — the gaps are in input cleanliness, output
diversity, and output shape.** One tool was BUILT and tested this session (`format_hunt` + delivery-field
capture). Everything else is a sequenced plan (Steps 0–4 below). **Nothing committed** (standing rule;
Step 0's ON re-run is the test that unlocks the commit).

**The goal driving all of it:** one-shot, launch-ready Meta static creatives for ANY business — the
showcase for a large agency deal. Agency drops a URL → adaptive intake → high-conversion DR creatives.
Mixed book (e-com + lead-gen). Static only. No guaranteed ad-account access (CSV ingest instead).

---

## Part 1 — What this session established (read these before changing anything)

### 1a. Research ground truth (both docs carry sources + confidence flags)
- `docs/research/ANDROMEDA_AD_SYSTEM_RESEARCH_2026-07-15.md` — Andromeda = Meta's ML **retrieval**
  engine (Dec-2024 eng blog; GEM = prediction brain, Nov-2025). Meta-endorsed creative implication:
  feed **distinct concepts** (angle × persona × context), not near-duplicates. The "Entity ID / 50 ads
  = 1 auction ticket" mechanic is UNOFFICIAL practitioner folklore — use the behavior, never cite the
  mechanism. Counter-current (Foxwell/Motion, HIGH confidence): mediocre volume corrupts delivery;
  ~5–6% of ads capture most spend. **Winning posture = diverse AND quality-gated.** Formats: 4:5 + 9:16
  + 1:1 covers ~90% of delivery; text-heavy statics get deprioritized; asset-pool model (10 img / 5 text
  / 5 headline) persists inside Advantage+.
- `docs/research/AGENCY_CREATIVE_METHODOLOGY_RESEARCH_2026-07-15.md` — elite-team benchmark. The unit:
  **CONCEPT = Offer × Audience × Angle** (CTC). Volume: 8–12 concepts/mo minimum at low spend; "consistency
  beats bursts." Iteration diagnosed by metric pattern (low thumbstop→hook; high CTR/low CVR→LP). Statics:
  the winners are **native/anti-polish/logo-stripped** — "beautiful, balanced, branded" causes feed
  blindness (Motion 8 static families; Barry Hott ugly-ads; Obvi $200K→$5M on statics). Compliance for a
  mixed book: personal-attributes subject-swap; SAC (financial/credit) kills targeting → creative carries
  everything; health needs disclaimer IN ad copy, no before/after. **The crux: Icon.com (best-funded pure-AI
  admaker) pivoted to a $1–3k/mo HUMAN agency because AI output "feels generic" — the unsolved layer is the
  strategist's judgment (research→specific angle→example-anchored brief→quality gate), which is exactly what
  our pipeline automates.** Our moat = the outcome-scored construction bank (see 1d).

### 1b. Teardown verdict (mechanical, evidence at `agent-loop/runs/2026-07-09-07-24-18_www-optimumnutrition-co-in/`)
The spine (field-scout → parallel readers → field-brief → collect → create ⇄ buy → build ⇄ gate) is
RIGHT — it is the elite human loop, automated, with cold adversarial seats that provably worked (buyer
killed fake-urgency C2 + duplicate C3; gate caught honest asset-fidelity limits). The failures are:
1. **Input pollution** — the only BigMuscles pixel reads were STORE-OPENING ads (357d/288d local-awareness,
   phone+address) and their hooks entered the hook bank. Ad Library exposes no campaign objective;
   longevity endorses survival at ANY job. → job classification (Step 1).
2. **Copy-vs-visual endorsement conflation** — the brief's top-5 constructions were all video/DCO
   (pixel-less); the shipped ads' VISUAL DNA came from Avvatar's 8-day launch flush (zero endorsement),
   11 of 16 read images = one brand's template. → two ledgers + read-slot allocation (Step 1/2).
3. **Monoculture** — 3 shipped ads = one visual family (polished product-hero), one persona. Reads have no
   formatFamily/persona fields, so no seat can even SEE the collapse; endorsement ranking concentrates on
   the #1 construction; renderability law biases to pack shots. → the diversity architecture (Step 2).
4. **Not launch-ready** — one 3:4 image per winner, no ratios/copy pool/naming/campaign sheet. → Step 3.
5. **No compounding** — brief + reads die with the run; `score.flights[]` designed (PLAN §5b) but unbuilt. → Step 4.
6. **Asset risk masked** — ON worked because GPT-Image knows the world-famous tub; unknown D2C brands have
   no model knowledge and fabrication rules (correctly) forbid inventing the pack. → intake hard-require (Step 3).

### 1c. The endorsement methodology (final form)
Hierarchy of what we can read, strongest first:
1. **Our own flight outcomes** (`score.flights[]`) — scores outrank proxies (already law in create binder).
2. **EU reach numbers** — real, when ads show in EU (DSA). Now captured opportunistically (built, 2a).
3. **Impressions rank ORDER** — `sort_by=total_impressions` works server-side on search/company endpoints;
   numbers hidden for commercial ads (probe-verified: `impressions_text:null`, `reach_estimate:null`).
4. **days × variants** — the workhorse proxy. Refinements needed (Step 1): construction-level accrual
   (twin flights + serial re-investment: MB ran ONE combo construction as 4 ads, 479–630d), time-decay
   (date-windowed "what wins NOW" read), churn (`status:ALL` → recently-retired winners = negative signal),
   brand calibration (launch-date distribution: active tester vs flush vs zombie — Avvatar trap),
   single-variant long-runners flagged "unchallenged, not proven."

### 1d. The moat (for the agency pitch)
Competitors each hold ONE piece: Foreplay = pictures without outcomes; Motion = outcomes without
generation (tag-level, own-account only); Icon/AdCreative = generation without memory; agencies = the
strategist's head (tacit, leaves with the person); Meta = outcomes it will never share. **Nobody has the
loop: construction genome + real CPA outcome + generation, accumulating across clients.** Every client's
flight makes every future client's first batch smarter. It becomes real the first time a flight report is
ingested (Step 4) — start early.

---

## Part 2 — BUILT this session (uncommitted, tested)

### 2a. `format_hunt` tool + delivery fields — `agent-loop/mcp/scrapecreators.ts`
- **New tool `format_hunt`** (server v0.4.0, third tool): keyword-fingerprint search across ALL
  advertisers via `GET /v1/facebook/adLibrary/search/ads`. Batched 1–8 hunts; defaults
  `keyword_exact_phrase` + `media_type=IMAGE_AND_MEME` (**statics only** — "MEME" is Meta-speak for
  text-on-image) + `ACTIVE` + `sort_by=total_impressions`; optional `country`, `status`, `depth` (cursor
  pagination, 1 credit/page ≈ 30 ads). Dumps every hit with PER-AD advertiser identity to
  `raw/ads/hunt-<slug>.jsonl`; downloads top statics to `raw/images/hunt-<slug>/<brand>__<adId>_<n>.jpg`;
  returns advertiser roll-up + impressions-ranked summaries (API order preserved — it encodes delivery).
  Exported: `runFormatHunts()` (direct-testable), `SCRAPECREATORS_FORMAT_HUNT_TOOL`.
- **`rawAdEntry` extended**: `pageLikes`, `reachEstimate`, `spend`, `impressionsText` captured when
  non-null (EU/political ads); undefined = dropped by JSON.stringify, dumps stay lean.
- **Wired**: `stages.ts` (FIELD_SCOUT tools + identityPrompt block describing when to hunt),
  `pipeline.ts` (ALL_MCP_TOOLS). Gathering-budget hook covers it automatically (name-prefix match).
- **Tested**: live probe (1 credit) verified response shape; then full path on 0 credits by seeding the
  MCP disk cache with the probe JSON (`agent-loop/.cache/scrapecreators/country=in&ep=search_ads&…=active.json`)
  → 29-line dump, 18 images downloaded, roll-up correct. Pixel spot-check: the hunt surfaced REAL
  testimonial statics in India (PURE MAMA before/after quote card; Zanskar = testimonial copy over a
  problem-callout visual — fingerprints find the neighborhood, READERS classify). `tsc --noEmit` clean
  (23s — run `./node_modules/.bin/tsc` directly; `npx tsc` via background shell wedged once).
- **Remaining untested**: one live non-cached hunt inside a real pipeline run (happens at Step 0).

### 2b. API facts locked down (probe + OpenAPI, `docs.scrapecreators.com/openapi.json`)
- `search/ads` params: query, search_type(keyword_exact_phrase|keyword_unordered),
  media_type(ALL|IMAGE|VIDEO|MEME|IMAGE_AND_MEME), country(one 2-letter), status(ACTIVE|INACTIVE|ALL),
  sort_by(total_impressions|relevancy_monthly_grouped), start_date/end_date(YYYY-MM-DD), cursor, trim.
- `company/ads` ALSO supports (unused today): **cursor** (the "30-ad cap" was just us never paginating),
  media_type, sort_by, language, start_date/end_date, companyName, trim.
- Response (commercial ads): impressions/reach/spend NULL; per-ad `page_name`/`page_id`;
  `snapshot.page_like_count`; same snapshot shape as company/ads (images[]/cards[]/videos[]).

---

## Part 3 — THE UPGRADE PLAN (execute in order)

**Execution pacing (agreed with founder):** one step at a time, each VALIDATED BY A RUN before the next
starts, each ending in its own commit (no-commit-until-tested applies per step, not just at the end).
- **Next session:** Step 0 (~1h: cache-cheap re-run + the diagnosis checklist → THE milestone commit —
  everything since S137 lands) + most/all of Step 1 (small scraper+binder edits, all testable against
  the cached ON data for ~0 credits) → second cheap re-run → second commit.
- **Session after:** Step 2 whole (schema, brief, create/buy/gate contracts, bank + seeding; motor-law
  note folds in here). It changes output shape, so it ends with a FRESH-BRAND run (not ON) proving the
  contract yields 8 genuinely different concepts → commit.
- **Then:** Step 3, then Step 4, same discipline.
- **Opportunistic early test:** the Verbis 11-July flight numbers already exist — once Step 2's bank
  exists, hand-write them onto the matching bank entries (30-min manual experiment) to prove scores
  change create's picks BEFORE building Step 4's automated CSV ingest.

### STEP 0 — validate & commit (gates everything)
Re-run ON India (all scrapes cached ≈ 0 credits; ~30 KIE credits): web UI `cd agent-loop && npm run web`
(:4141) or `npx tsx run.ts https://www.optimumnutrition.co.in/`. Upload the RIGHT hero photo (Gold
Standard Whey 2lbs, NOT creatine) or skip (model render proven).
**Diagnose:** (a) `raw/images/` jumps to ~150+ (DCO cards[] fix); (b) field-brief top constructions
(MuscleBlaze/BigMuscles/ON) carry REAL pixel reads; (c) create stops borrowing Avvatar scale; (d) readers
write ONCE cleanly; (e) if the scout fires a format_hunt, it works live. Also still pending from S143:
the small sourceRead copy-vs-pixel honesty edit (S143 §3.3) — fold into Step 1's binder pass if not done.
**If clean → COMMIT everything** (S143's 14+4 files + this session's scrapecreators/stages/pipeline edits
+ docs). Suggested: `feat(field-first): field-first pipeline + format_hunt — validated on ON India re-run`.

### STEP 1 — ad-data engine v2 (clean the input; scraper + binder edits)
1. **Job classification** per dumped ad: `job: conversion|retargeting|local|awareness|recruitment` from
   CTA type (CALL_NOW/GET_DIRECTIONS→local), link domain, copy shape (address+phone+no offer→local;
   catalog-boilerplate→DPA). Brief rule: ONLY conversion-job ads feed Working constructions + hook bank.
   (Kills the store-opening pollution.) Files: `mcp/scrapecreators.ts` (rawAdEntry), `field/references/field-brief.md`.
2. **Construction-level accrual**: twin-flight dedupe+sum, serial re-investment counted (same construction,
   multiple ads over time), cross-brand convergence named; single-variant long-runners flagged
   "unchallenged." Files: `field/SKILL.md` (shortlist rules), `field-brief.md` reference.
3. **Recency window**: a second date-windowed read (last ~90d, launched+variant-invested) alongside
   all-time — `start_date/end_date` params exist on both endpoints. Files: scraper tool schema + field binder.
4. **Churn read**: one `status:ALL` fetch per key rival → "recently retired winners" brief section
   (negative signal + fatigue map). Files: field binder (the param already exists in the tool).
5. **Brand calibration**: launch-date distribution per brand computed at dump time → active-tester /
   launch-flush / zombie label the brief must carry. Files: scraper (compute), brief reference (use).
6. **Scraper completeness**: cursor pagination for big pages; domain-based page resolution retries
   (TheRateFinder lesson — search by domain); coverage-score header in the brief ("read N of M brands,
   blind spots: …"); linkDomain read as funnel-sophistication signal. Files: scraper + field binder.
7. *(Video poster frames — PARKED by founder decision: statics only.)*

### STEP 2 — diversity architecture (widen the output; binder/rubric edits + bank)
1. **Read schema +2 fields**: `formatFamily` (CLOSED enum — table below) + `persona` (one line: who +
   awareness stage). File: `field/references/read-schema.md`. **The enum is a fixed table, never
   model-free-labeling** — aggregation across readers/runs/clients breaks otherwise. `other:<describe>`
   escape hatch, triaged into the table deliberately.
2. **Brief upgrades**: coverage map (formatFamily × claimType matrix, endorsement per cell); format lanes
   (open-lane logic for FORMS: absence here + existence proof in bank/hunt = playable); TWO endorsement
   ledgers (copy-endorsed vs pixel-endorsed — never conflate); format-lane RANKING rule =
   **proven-elsewhere × fits-the-diagnosed-blocker × brand-holds-the-fuel** (then renderable/compliant).
   File: `field/references/field-brief.md`.
3. **Create portfolio contract**: 8 specs — ≤2 per formatFamily, ≥4 claimTypes, ≥2 personas, ≥1
   format-lane play, ≥1 native/anti-polish/LOGO-STRIPPED execution; **form sourced from the most-endorsed
   exemplar OF ITS OWN FAMILY** (the single rule that stops winner-takes-all collapse); sourcing ladder =
   local field → format bank → fresh hunt → labeled archetype — NEVER freehand. File: `create/SKILL.md`.
4. **Buy**: batch audit across all three axes ("one bet in costumes" extended to format+persona); approve
   6–8 **RANKED** (not ≤3); partial kills → backfill create round (orchestrator branch, currently only
   REJECT-ALL loops — `pipeline.ts` orchestratorPrompt + `create/references/buyer.md`).
5. **Gate**: batch-level diversity line (view all shipped side-by-side); ALWAYS re-view every image on a
   re-gate (ON run rubber-stamped C1 from the prior verdict); LP-congruence check (CTA promise exists on
   the landing page). File: `build/references/gate.md`.
6. **Format bank**: persistent cross-client store — reads JSONL keyed by formatFamily + `score` field
   (schema already specced in `docs/PLAN_FIELD_FIRST_PIPELINE_2026-07-08.md` §5b/§bank). Location
   suggestion: `agent-loop/bank/`. Every run appends its reads; seed once via format_hunt fingerprints
   (testimonial→"verified buyer"/★★★★★; founder-POV→"so we made"; math-anchor→"do the math";
   us-vs-them→"unlike other"; run across US/IN/CA, statics-only, ~40–60 credits total).

### STEP 3 — output shape & intake (price it for a first-time user)
1. **Render economics (DECIDED)**: design 8 concepts ALWAYS (specs are ~free — the ON run's create+buy
   was ~$2–3); **render top-3 by buyer rank at 4:5 ONLY by default** (~30 KIE credits — same cost as
   today). Pre-run config: N-to-render + ratios. **"Render more" = build+gate over stored specs**
   (creatives.json already holds bought-but-unbuilt winners; file-state resume makes this a 10–15 min,
   ~10-credit/image operation with NO field/collect/create re-run). Files: `run.ts` flags, `web/server.ts`
   + `chat/*` knobs, orchestrator build branch, budget caps (`maxBudgetUsd` stays ~today's for default).
2. **Asset groups on demand**: 9:16 / 1:1 recomposed per ratio (render MCP already supports all —
   `mcp/render.ts:46-51`); 3 primaryText + 5 headline variants per winner (text ≈ free, Advantage+
   asset-pool shape). File: `build/SKILL.md` + creatives.json schema (variant slots).
3. **Naming convention**: `date_concept_angle_hook_format` on every render + copy row — the key that
   makes Step 4's CSV ingest attributable. Files: build binder + render job names.
4. **Launch kit**: per run — images by ratio, copy pool, naming map, campaign sheet (1 testing campaign,
   1 ad set/concept, $30–50/day, judge ~50 conversions, kill 72h; winners → ASC), and the TEST MAP (all 8
   concepts: what each probes, what a win teaches — rendered or not). New small deliverable, orchestrator
   final step or build addendum.
5. **Intake+**: hard-require hero product photo + logo (or auto-steer to pack-free constructions);
   compliance-lane profile (e-com / lead-gen / SAC-financial / health → lane rules inlined into
   create/buy/gate); the **brand-law question** ("what will this brand NEVER do — discounts? urgency?
   comparisons?"); ad-history question ("what have you tested; what won/lost"); accept client VoC files
   (reviews/surveys/tickets) as first-class collect artifacts; collect may fetch the brand's own site
   assets (logo/og-image). Files: `pipeline.ts` interactive intake block, `collect/SKILL.md`.

### STEP 4 — the outcome loop (the retainer + the moat)
1. **Ingest**: `flight-report.csv` (Ads Manager ad-level export) → outcome-reader stage maps rows via
   naming convention → writes `score.flights[]` onto bank entries + a scores section usable by create.
   (S142 plan §5b — schema exists; Verbis 11-July flight numbers are the first data points.)
2. **Iterate mode**: run takes flight report + prior run's specs/bank; field phase cached/light. On a
   WINNER: leave the live ad untouched; spread the validated ANGLE (new formats ≥2, new hooks, 1 new
   persona), widen its copy pool, queue a fatigue-refresh variant (~2–4wk window), write the confirmed
   hypothesis into the brief. On losers: metric-pattern autopsy (hook/body/LP/fatigue), DEAD angles need
   written reason to re-pick. ALWAYS one big-swing slot (anti-convergence). Buyer still judges cold.
3. **User-visible round-2 brief** before rendering: "C1 won at ₹212 (target 200–400), 60% of spend —
   confirmed: <hypothesis>. Next batch: …" — this doc IS the agency's weekly deliverable.

---

## Part 4 — Decisions log (founder calls this session)
- **Ignore video entirely** (poster frames parked). Statics done excellently.
- **Default run = design 8, render top-3 @ 4:5** ("thinking wide, rendering narrow"); more images/ratios
  = user-initiated, from stored specs. First-look cost ≈ today's run.
- **8 is a target, quality is the floor** — buyer keeps kill power + REJECT ALL; ship 6 real probes over
  8 padded ones; backfill fills honest gaps.
- **formatFamily = closed taxonomy table** in the schema (model recognizes, never labels freely).
- **White-space priority** = proven-elsewhere × fits-diagnosed-blocker × fuel-in-hand.
- **Endorsement trio confirmed + extended**: impressions order + timeline + variants, PLUS construction
  accrual, recency, churn, brand calibration (Step 1) — and outcomes above all.

## Part 5 — Parked notes (not scheduled; fold in where marked)
- **THE MOTOR LAW** (fold into Step 2 binder edits): every construction = SKIN (layout/craft/register —
  always transfers) + MOTOR (persuasion engine: price-aggression, rented-celebrity, owned-status, dated
  scarcity, certification, education — transfers ONLY if the brand holds the fuel). Brief types each
  construction's motor + fuel requirement (like DO-NOT-CLONE, but for compatibility); founder-facts
  declares held fuel (brand-law question); create may do an EXPLICIT motor swap (named in spec — e.g. BSC
  discount-math → ON value-math); buyer TRUE test verifies fuel. Evidence: TWT can never run MuscleBlaze
  price-combo constructions (positioning forbids discounting); C2's fake-urgency death was a motor
  incompatibility (dated-scarcity motor, no real deadline held) that typing would have stopped at pick.
  Include `validity` conditions on reads: event-bound | celebrity-required | status-required | seasonal |
  retargeting-context | none.
- **Rival-ad comments mining** (collect enrichment): ScrapeCreators has FB post-comments endpoints;
  comments on a rival's long-runner = verbatim objections/desires for OUR market.
- **PAS-type copy skeletons are NOT formatFamily** — three separate axes: formatFamily (visual form),
  claimType (argument), copy construction (PAS/question-hook/tutorial — lives in the copy layer).

## Part 6 — The formatFamily taxonomy draft (Step 2.1 starts here)
product-hero | lifestyle-in-use | ugc-style | testimonial-card | us-vs-them | problem-solution |
text-billboard | offer-card | editorial-advertorial | meme-native | infographic-mechanism | other:<describe>
Each table row in read-schema.md gets: definition, recognition cues, **proof requirements** (testimonial→
real verbatim quote w/ source, DESIGNED quote card never fake platform chrome (gate FABRICATION);
us-vs-them→anchored fact per cell; ugc→real photo or anonymous framing; text-billboard→one standalone-
strength fact; offer-card→real offer within OFFERS ALLOWED), and compliance notes (before/after =
restricted in health).

## Part 7 — Files & state for the next session
- **Modified this session (uncommitted):** `agent-loop/mcp/scrapecreators.ts`, `agent-loop/stages.ts`,
  `agent-loop/pipeline.ts`. Plus everything already uncommitted from S143 (its Part 5 lists it).
- **New docs:** this file + `docs/research/ANDROMEDA_AD_SYSTEM_RESEARCH_2026-07-15.md` +
  `docs/research/AGENCY_CREATIVE_METHODOLOGY_RESEARCH_2026-07-15.md`.
- **Cache note:** probe response seeded at `agent-loop/.cache/scrapecreators/country=in&ep=search_ads&
  media_type=image_and_meme&query=verified_buyer&search_type=keyword_exact_phrase&sort_by=total_
  impressions&status=active.json` — a hunt with those exact params is free.
- **Keys:** unchanged (`.env.local`: SCRAPECREATORS, PERPLEXITY, KIE; `FAL_KEY` still Forbidden since 07-07).
- **tsc:** clean (run `./node_modules/.bin/tsc --noEmit` directly; npx-in-background wedged once).
- **ON run dir (evidence for everything in Part 1b):**
  `agent-loop/runs/2026-07-09-07-24-18_www-optimumnutrition-co-in/`.
