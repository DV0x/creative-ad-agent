# SESSION 149 — Step 3 (output shape & intake) + the FOLLOW-UP ROUTER — BUILT

**Date:** 2026-07-16 (continues S147 Step 1 + S148 Step 2, all in one working arc)
**Status:** All 5 Step-3 items (S145 plan §Step 3) + a founder-requested addition (the follow-up
ROUTER — iteration requests route to the smallest owning seat, never a full re-run) are IMPLEMENTED,
tsc clean, wiring smoke-tested. **UNCOMMITTED**, stacked on Steps 1+2. Validation plan (founder
decision this session): ONE fresh-brand end-to-end run validates Steps 1+2+3 together — Step 3.1
makes that run cost ≈ today's runs (~30 KIE credits + fresh-brand scrapes).

---

## What was built

### 3.1 Render economics — "think wide, render narrow"
- Orchestrator instructs build to render ONLY the top-N winners by the buyer's ranked call
  (default **top-3 @ 4:5**); every other approved spec stays STORED in creatives.json.
- Config: `run.ts --render=N --ratios=4:5,1:1`; `renderTop`/`ratios` flow through
  `runPipeline`/`buildBaseOptions` (chat + web inherit the defaults automatically).
- "Render more" is a follow-up route (build+gate over stored specs — no upstream re-run).
- Files: `run.ts`, `pipeline.ts` (orchestratorPrompt build branch + plumbing), `stages.ts` (BUILD
  identity), `build/SKILL.md`.

### 3.2 Asset groups (Advantage+ pool shape)
- creatives.json `meta` now carries the copy pool per spec: 3 primary texts + 5 headlines
  (`primaryTextAlts`, `headlineAlts`) — alternates are different WAYS IN, not paraphrases; written
  by create (text ≈ free), assembled by the kit. Ratios beyond the default are follow-up territory
  (render MCP supports 1:1/9:16/etc. already).
- Files: `create/SKILL.md` (copy-pool law + schema).

### 3.3 The naming law
- Render job name = ad name = filename: `yyyymmdd_cN_<claimType>_<hook-slug>_<formatFamily>_<ratio>`
  (e.g. `20260716_c3_social-proof_still-sore-after_testimonial-card_4x5`). This is the key that maps
  a flight-CSV row back to its bank construction (Step 4's ingest depends on it).
- Files: `build/SKILL.md` (the law + build-output.md mapping), `mcp/render.ts` (job-name description).

### 3.4 The launch kit — new `kit` seat
- New orchestrator-launched seat (Sonnet, mechanical assembly — the orchestrator itself may not
  produce): writes **launch-kit.md** = shipped images by ratio · copy pool per shipped creative ·
  naming map (ad name → creative → construction) · campaign sheet (1 testing campaign, 1 ad
  set/concept, $30–50/day equivalent, judge ~50 conversions/72h, winners → ASC) · TEST MAP covering
  EVERY approved concept (SHIPPED / STORED / BLOCKED).
- launch-kit.md added to `doneRequires` (runs that built must ship launchable); kit re-runs after
  any follow-up that changes shipped work. Launch cap: kit=2 (iteration mode lifts it).
- Files: `stages.ts` (KIT_IO_PROMPT), `pipeline.ts` (agent + flow + doneRequires), `hook.ts` (cap).

### 3.5 Intake+
- Interactive intake now TWO AskUserQuestion rounds: (1) conversion event/CPA/budget/buyer;
  (2) **compliance lane** (e-com / lead-gen / financial-SAC / health) + **brand laws** ("what will
  this brand NEVER do; what real fuel does it hold" — feeds the motor law) + **ad history** +
  **assets** (hard-ask for hero photo + logo upload, explicit "no photo" option). founder-facts.md
  gets explicit sections incl. ASSETS ("NO HERO PHOTO — steer pack-free").
- Lane rules inlined: create (subject-swap for financial, disclaimer-in-copy + no before/after for
  health, LP-match for lead-gen), buyer APPROVABLE (lane-aware), gate (lane sharpens
  FABRICATION/NAMED).
- Collect upgrades: client-uploaded VoC files are FIRST-CLASS (read before web hunting, cite
  "client-provided"); brand-owned site assets recordable as `URL-REF` in material.md — and
  `mcp/render.ts` now materializes http(s) refs (downloads once into assets/, then binds as local).
- Files: `pipeline.ts` (intake block), `create/SKILL.md`, `create/references/buyer.md`,
  `build/references/gate.md`, `collect/SKILL.md`, `mcp/render.ts`.

### The FOLLOW-UP ROUTER (founder ask, this session)
- The orchestrator's follow-up block is now a routing table — a follow-up NEVER re-runs the
  pipeline: Q&A → answer from files, launch nothing · copy/spec change → create (scoped edit,
  survivors untouched) → build (scoped) → gate — buyer SKIPPED on founder-directed edits · render
  problem → build → gate · render more / new ratios → build+gate from stored specs · NEW concept →
  create → **buy** (new bets face the buyer) → build → gate · upstream truth changed → AskUserQuestion
  to confirm cost FIRST, then partial chain; field/readers never re-run for creative-level asks.
  After any change to shipped work → kit re-runs so launch-kit.md stays true.
- **Iteration mode in the hook**: once DONE.md exists, launch ceilings switch from the strict
  mid-run caps to ITERATION_LAUNCH_CAP=12 per stage (founder-driven cycles must not be denied by
  the runaway guard; maxBudgetUsd still guards). Files: `pipeline.ts`, `hook.ts` (donePath).

### SESSION RESUME (founder ask, this session — the docs' recommended path)
- JSONL resume wired end-to-end per `session_management.md:27-28/194` (the decision-table row for
  "resume a specific past session"): `resumeSessionId` flows `web → ChatSession → buildBaseOptions
  → options.resume`. The orchestrator wakes with its FULL conversation (intake answers, verdicts,
  gate calls) and the follow-up router + iteration-mode caps apply on top. cwd = runDir (stable),
  so the docs' silent-fresh-session gotcha (`:233`) can't bite.
- Web UI: welcome screen now lists "continue a previous run" (newest 8 runs with a captured
  session — brand, date, ✓ finished/⏸ interrupted, shipped-ad count); clicking reopens the run,
  REPLAYS the existing renders into the chat, and waits for the founder's follow-up (no kickoff
  message). New WS messages: `runs`, `resume`, `resumed`.
- `chat/setup.ts`: `readSessionInfo()` + `listResumableRuns()`. Fallback: a run without
  session.json gets a clear "predates resume support — start a new run" error.
- **Bug found & fixed**: `TraceLogger` truncated `trace.jsonl` on construction — reopening a run
  would have DESTROYED the original run's trace. Now `{append: true}` on the resume path.
- DONE.md kept (founder decision after review): it is the headless runner's only end-of-job signal
  (streaming-input sessions emit a ResultMessage every exchange, not at job end — the SDK has no
  "pipeline finished" concept), the false-completion guard, and the iteration/bank trigger. Cost
  ≈ 200–300 tokens/run. Invisible in the web flow.
- Known cosmetic gap: a resumed run's pipeline strip starts blank (the reducer view isn't rebuilt
  from history — only new activity shows). The conversation itself has full memory.

## Test evidence
- `tsc --noEmit` clean over all Step-3 + resume code.
- Resume wiring test ALL PASS: options.resume set/omitted correctly; session.json parse + rejects;
  listResumableRuns found 5 real resumable runs (TWT run: done, 3 renders) — the picker has real
  data on day one.
- Wiring smoke test (buildBaseOptions inspection): render top-N + ratios land in the build branch;
  kit seat registered + in flow; backfill branch + router + intake round-two present; gate has
  WebFetch; defaults = top-3 @ 4:5; non-interactive prompt has no router. ALL PASS.
- NOT run (needs the founder-gated run): everything agentic.

## The validation run (founder-gated — the next action)
ONE fresh-brand end-to-end run via the web UI (interactive intake is part of what's being
validated). Watch, per step: **S147** — job-mix/cadence in shortlist, no store-opening pollution,
kind-spread slices; **S148** — 8 genuinely different specs (the coverage axes), ranked verdict,
backfill if triggered, bank auto-append (`🏦 bank:` line), gate batch line + LP check; **S149** —
intake rounds land in founder-facts, top-3-only renders, naming-law filenames, launch-kit.md, then
exercise the ROUTER with 1–2 follow-ups ("change c2's headline", "render c4 too"). Optional
pre-run: seed the bank (`npx tsx seed-bank.ts --yes`, ~15 credits).
