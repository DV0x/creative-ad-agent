# SESSION 148 — Step 2 (diversity architecture) BUILT — pending its fresh-brand validation run

**Date:** 2026-07-15 (same working session as S147/Step 1; plan: `docs/SESSION_145_PIPELINE_TEARDOWN_AND_PORTFOLIO_ENGINE_PLAN_2026-07-15.md` §Step 2 + Part 5 motor law + Part 6 taxonomy)
**Status:** All 6 Step-2 items + the motor-law fold-in are IMPLEMENTED. Code layer unit-tested
(bank: all assertions pass against a scratch store) + tsc clean. **UNCOMMITTED**, stacked on Step 1
(also uncommitted). Per the per-step discipline, Step 2's gate is a **FRESH-BRAND run** (not ON)
proving the contract yields 8 genuinely different concepts — founder runs/authorizes it. The bank
**seeding** (`seed-bank.ts`) costs ~15–45 scrape credits and is gated behind `--yes` — NOT run.

---

## What was built

### 2.1 Read schema +3 fields — `field/references/read-schema.md`
- `formatFamily` — the CLOSED 12-row taxonomy table (Part 6) now lives in the schema doc: definition,
  recognition cues, proof requirements, compliance notes per row (product-hero, lifestyle-in-use,
  ugc-style, testimonial-card, us-vs-them, problem-solution, text-billboard, offer-card,
  editorial-advertorial, meme-native, infographic-mechanism, `other:<describe>` escape hatch —
  recognized, never invented).
- `persona` — one line: who + awareness stage.
- `validity` (motor law) — none | event-bound | celebrity-required | status-required | seasonal |
  retargeting-context, with reason.

### 2.2 Brief upgrades — `field/references/field-brief.md`
- **TWO LEDGERS law**: every Working entry tagged PIXEL-ENDORSED (read exists) vs COPY-ENDORSED
  (dump-only); visual DNA may only be adapted from the pixel ledger.
- **Coverage map**: formatFamily × claimType matrix, endorsement per cell (monoculture made visible).
- **Format lanes**: absence locally + existence proof in bank/hunt = playable; brief supplies
  proven-elsewhere strength × fuel requirement, create finishes with blocker-fit × fuel-held
  (then renderable/compliant).
- **Motor typing** per Working construction: engine + fuel + validity (DO-NOT-CLONE's sibling).
- Brief now reads `bank/*.jsonl` for lane existence proofs.

### 2.3 Create portfolio contract — `create/SKILL.md` + `stages.ts`
- **8 specs** (quality the floor — honest gaps beat padding): ≤2 per formatFamily, ≥4 claimTypes,
  ≥2 personas, ≥1 format-lane play, ≥1 native/anti-polish LOGO-STRIPPED execution.
- **Own-family form rule** (the anti-collapse law) + **sourcing ladder**: local read → `bank:<id>` →
  hunt dump → `archetype:<family>` — NEVER freehand; sourceRead notation extended accordingly.
- **Motor law**: spec carries `motor: {engine, fuelHeld(anchor #), swappedFrom}` — explicit swaps only.
- Spec schema += formatFamily, persona, motor.

### 2.4 Buyer — `create/references/buyer.md` + `stages.ts` + `pipeline.ts`
- Batch audit across ALL THREE AXES (claimType × formatFamily × persona) + lane check (open AND
  format) + native check.
- TRUE test extended: **motor fueled** (verify the powering fact exists; unnamed swap or unfueled
  motor → KILL).
- **Approves 6–8 RANKED in money order** (not ≤3); 1–5 survivors → per-slot backfill instructions.
- **Backfill branch in the orchestrator** (new): WINNERS ≥6 → build; WINNERS 1–5 → ONE backfill
  create round (survivors untouched, replacements only) → buyer re-judges new specs + full batch
  tests → fresh complete verdict.md → build ships whatever survives (honest gaps ship); REJECT ALL →
  full redo as before (2 rounds max). `hook.ts` launch caps create/buy 2→3.

### 2.5 Gate — `build/references/gate.md` + `stages.ts` + `pipeline.ts`
- **Check 6: LP-CONGRUENCE** (structural, never re-render) — gate WebFetches the destination once;
  promise not cashable on the landing page → FAIL-structural; fetch failure → LP: UNVERIFIED, never
  a fail. Gate agent gains WebFetch.
- **The Batch line**: shipping set viewed side-by-side — different concepts or one family in
  costumes (named, not killed).
- **Re-gate law**: EVERY image re-viewed on a re-render round, including prior passes (the ON
  rubber-stamp fix).

### 2.6 Format bank — `agent-loop/bank.ts` (new) + wiring + `agent-loop/seed-bank.ts` (new)
- Store: `agent-loop/bank/<formatFamily>.jsonl` (committable — runs/ and .cache/ stay ignored),
  entries = unified reads + `bank: {run, bankedAt}` provenance + §5b `score: {flights, verdict,
  updatedAt}` scaffold. `CREATIVE_BANK_DIR` env override (tests).
- **Every run appends its reads**: `buildBaseOptions` symlinks `runDir/bank` → store (all seats
  Grep it with file tools) and a new **PostToolUse hook on the DONE.md write** (fires once, all
  three entry points — headless/chat/web) runs `appendRunReadsToBank` (dedupe by read id; first
  read wins, v1).
- **Seeding**: `seed-bank.ts` — 5 fingerprints (verified buyer, ★★★★★, so we made, do the math,
  unlike other) × US/IN/CA, statics-only impressions-ranked hunts → Sonnet pixel-read pass per hunt
  (top 5 images, read schema inlined) → bank append. Dry-runs by default; `--yes` required to spend.

### Capacity: `maxBudgetUsd` 20/28 → 26/34; buy maxTurns 12→20 (8-spec judging).

## Test evidence
- Bank unit test (scratch `CREATIVE_BANK_DIR`): familySlug normalization + other-collapse +
  unlabeled fallback; append writes per-family files with provenance + score scaffold; re-append
  dedupes (3 in → 0 added, 3 skipped); runDir/bank symlink resolves. ALL PASS.
- `tsc --noEmit` clean; `seed-bank.ts` dry-run prints the credit plan and exits without spending.

## Pending — validation (founder-gated)
1. **Fresh-brand run** (NOT ON — Step 2's gate): prove create yields 8 genuinely different concepts;
   watch the buyer's ranked call + any backfill round; gate's LP fetch + batch line; post-run bank
   auto-append (look for the `🏦 bank:` progress line).
2. **Bank seeding** (`npx tsx seed-bank.ts --yes`, ~15 credits at depth 1) — whenever you want the
   format lanes to have cross-market existence proofs. Optional before the validation run.
3. **The Verbis 30-min experiment** (plan §pacing): hand-write the 11-July flight numbers onto the
   matching bank entries → verify scores change create's picks (before Step 4 automates ingest).

## Caveats / watch-list for the run
- **Grep-through-symlink**: seats reach the bank via `runDir/bank` symlink; explicit-path
  Grep/Read follow symlinks, but verify the brief/create actually pull bank lines on the run.
- **Renders cost**: until Step 3's render-top-3 lands, build renders ALL approved winners (6–8
  images ≈ 60–80 KIE credits/run). If that's too hot for the validation run, say "render top 3"
  in the run instruction — or we pull Step 3.1 forward.
- Step 1's live-verify items still ride along: `last_days` semantics + one `depth:2` fetch.
- Old bank-less runs' reads have no formatFamily → they'd bank as `unlabeled.jsonl` (nothing lost,
  nothing polluted).
