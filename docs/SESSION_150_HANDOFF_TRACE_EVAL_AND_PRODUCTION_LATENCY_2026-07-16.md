# SESSION 150 HANDOFF — Portfolio Engine SHIPPED + validated; NEXT = trace eval → production latency

**Date:** 2026-07-16
**Status:** Steps 1–3 of the Portfolio Engine + the follow-up router + session resume are **BUILT,
VALIDATED end-to-end on a fresh brand, and COMMITTED.** The web-UI follow-up roughness is fixed and
committed. **The next session's job:** analyze the current run's trace to understand the agent's
behavior, then make the pipeline **light enough for a production user who won't wait ~70–100 min —
WITHOUT compromising output quality.**

This doc is the launchpad: what shipped, exactly where the trace + artifacts are, the preliminary
latency map (a starting point, not a finished analysis), and the investigation directions.

---

## Part 0 — TL;DR for whoever picks this up

- The pipeline works. On a brand it had never seen (HK Vitals magnesium), it produced **4 publishable,
  genuinely-diverse, compliant creatives in one shot** — the best output after months of iteration
  (founder's words).
- It is **too slow AND too expensive for production**: **~60–70 min wall-clock and ~$20/run in tokens**
  (founder-observed; the ORIGINAL run only, NOT the follow-up). Both have to come down. Do NOT treat
  cost as free headroom — a ~$20 first-look is not viable for a self-serve production user; latency and
  cost must be optimized together.
  > COST-ACCOUNTING NOTE (a trap that already bit this doc once): `total_cost_usd` in the trace is
  > CUMULATIVE per query/session. The real run cost = the **MAX** total_cost_usd within the run's
  > segment ($19.97), NOT the file's last value and NOT the sum of segments ($185 = double-count).
  > This run's `trace.jsonl` is ALSO appended by the resume + c8 follow-up (a second query that resets
  > the counter to ~$2.35), so the file's last/simple readings are misleading — segment the trace at
  > the resume `init` first. The follow-up (c8 render) was ~$2.35 / ~18 min on its own.
- Two stages dominate the wall-clock and are the obvious first targets (see Part 3):
  1. **create's spec MERGE — ~36 min** (an artifact of splitting the 8-spec JSON across files then
     stitching it back under API rate-limiting; mostly *not real work*).
  2. **field-scout — ~24.5 min** (real work: discovery + page fetches + 159 image downloads).
  Together ≈ 60 min of a ~95 min run. Everything else is 3–7 min each.

---

## Part 1 — What shipped this session (two commits on `new-ui`)

### `a643e60` — Portfolio Engine Steps 1–3 + follow-up router + session resume
Full detail in `docs/SESSION_147/148/149_*.md`. One-line recap of each:
- **Step 1 (ad-data v2, scrapecreators 0.5.0):** per-ad job classification, launch-cadence
  calibration, job-aware ranking, `last_days` windows, cursor pagination, domain-retry; binders gain
  conversion-job-only shortlisting, construction accrual, recency-primary weighting, UNCHALLENGED
  zombie flag, kind-spread slice gate.
- **Step 2 (diversity):** formatFamily closed taxonomy + persona + validity in reads; two ledgers,
  coverage map, format lanes, motor law in the brief; 8-spec portfolio contract; buyer 6–8 RANKED +
  motor-fuel TRUE check + partial-kill backfill; gate LP-congruence + batch-diversity + re-view-all;
  format bank (`bank.ts`) auto-append + `seed-bank.ts`.
- **Step 3 (output shape):** render top-3 by rank @ 4:5 (`--render`/`--ratios`); copy pool (3 pt + 5
  hl); naming law; launch-kit seat; 2-round intake (compliance lane / brand laws / ad history /
  asset hard-require); collect reads VoC + brand-asset URL-REFs; render MCP materializes http refs.
- **Follow-up ROUTER:** iteration asks route to the smallest owning seat (Q&A / copy-edit / render-more
  / new-concept / upstream-change) — never a full re-run; iteration-mode launch caps after DONE.md.
- **Session RESUME:** SDK JSONL `resume` + web "continue a previous run".

### `60c785c` — web-UI: smooth follow-ups (3 view-layer fixes)
- Persistent input node (no more text wiped mid-type).
- Images as reducer `{kind:'image'}` feed items (land in timeline order, not dumped below).
- `rehydrateView` folds the run's own trace back through the reducer on resume (prior conversation +
  completed pipeline strip return). Resilient + >512KB per-line guard (360ms on the 69MB trace).

---

## Part 2 — THE CURRENT RUN (the analysis subject) — exact pointers

**Run dir (all artifacts + the trace live here; gitignored but PRESENT locally):**
`agent-loop/runs/2026-07-16-09-52-58_www-hkvitals-com-sv-hk-vitals-100-magnes/`

- `trace.jsonl` — **69 MB**, THE primary analysis input. It is the full ordered SDK message stream
  (the exact input the reducer consumes). NOTE it now also contains the resume + the c8 follow-up
  appended after the original run (append-mode). Each line = `{seq, tsRel, msg}`; `tsRel` resets at
  each session init (original run vs the resumed session), so segment boundaries matter when timing.
- Deliverables (the wall-clock milestones): `founder-facts.md`, `field/shortlist.md`,
  `field/reads/*.jsonl` (5 slices), `field/field-brief.md`, `material.md`, `creatives.md`,
  `creatives.json` (+ the intermediate `creatives-4-8.json` from the split-write), `verdict.md`,
  `build-output.md`, `gate-verdict.md`, `launch-kit.md`, `DONE.md`.
- `renders/` — 8 PNGs: c4/c2/c1 (main, top-3 by rank), c8 (router test), **c6 ×4** (carousel = 4
  panels, from the UI-fix verification). Filenames follow the naming law.
- `bank/` symlink → `agent-loop/bank/` (6 family jsonl files — the moat's first entries).

**What the run proved (validation results, for context):**
- 8-spec portfolio: 6 formatFamilies, 7 claimTypes, 8 personas; contract held.
- The buyer's **motor-fuel TRUE check caught a real fabrication**: the brief mis-attributed Carbamide
  Forte's "300 body functions" claim to HK as held fuel; create built C5+C7 on it; buyer verified it
  absent from material and killed both. Defense-in-depth working.
- Gate PASS on 3 renders (LP-congruence + batch-diversity confirmed). Pack bound 100% identical from
  the uploaded hero photo. Health-lane compliant. Brand law respected (no discount motor despite 35%
  off on-site).
- Router: "render creative 8 too" → resumed session woke with full memory → **only** build→gate→kit,
  zero upstream. 6th creative (the logo-stripped native card — arguably best of batch).

**How to analyze the trace next session (tooling that already exists):**
- `agent-loop/chat/_reducer-test.ts <trace.jsonl>` — replays the trace through the reducer, prints
  the final view (feed, stages, cost, verdicts). Zero cost. Good for a fast structural read.
- `agent-loop/trace.ts` (`TraceLogger`) writes `trace.md` + `summary.json` on `finalize()` — but
  NOTE finalize only runs on session `end()`, and the web session stays open, so `summary.json` may
  be empty (`{}`) for this run. Regenerate a proper summary by feeding trace.jsonl through the logger
  offline if needed, or parse trace.jsonl directly (per-stage timing via deliverable mtimes was the
  method used below).
- Per-stage wall-clock = gaps between deliverable mtimes (see Part 3). Per-stage TOKEN/turn counts =
  parse trace.jsonl by `parent_tool_use_id` attribution (same logic as trace.ts `stageFor`).

---

## Part 3 — PRELIMINARY LATENCY MAP (starting point — verify/deepen next session)

Measured from deliverable mtimes (gap = that stage's duration). **These are wall-clock, on THIS
machine (degraded: iCloud-synced `~/Documents`, load ~4, intermittent FS short-reads, 8 API
rate-limit events in the trace). Some slowness is environmental, some is architectural — next session
must separate the two.**

| Stage | Duration | Notes |
|---|---:|---|
| intake (human Q&A) | variable | 2 rounds of AskUserQuestion — human wait, not agent |
| **field-scout** | **~24m33s** | discovery (Perplexity) + resolve + fetch pages + **159 image downloads** + 2 format hunts. Real work, but serial-ish and download-heavy. |
| field-read (5 slices ∥) | ~6m57s | parallel readers (the one place we fan out). Reasonable. |
| field-brief | ~5m37s | synthesis. Reasonable. |
| collect | ~4m16s | brand material. Reasonable. |
| create (draft .md) | ~2m53s | the 8-spec creatives.md. Fine. |
| **create (MERGE .json)** | **~35m54s** | ⚠️ THE bottleneck. create split 8 specs into creatives.json (1–3) + creatives-4-8.json, then spent ~36 min Edit-stitching them into one file, throttled by API rate-limits + FS stalls. **Mostly not real work.** |
| buyer | ~3m06s | cold judge. Fine. |
| build (3 renders @ 4:5) | ~3–5m | KIE renders (~10 credits each). Fine. |
| gate (6 checks + LP fetch) | ~3m | Fine. |
| kit | ~2m31s | mechanical assembly. Fine. |

**Original run: ~60–70 min wall-clock (founder-observed) and ~$20 in tokens.** (The per-stage table
above is from deliverable MTIMES on a degraded FS and SUMS to ~95 min — treat it as approximate; the
FS lag likely inflated some mtimes, and the create-MERGE gap in particular overlaps idle/rate-limit
waits. **Next session: get authoritative per-stage timing AND per-stage cost from `trace.jsonl`
directly** — tsRel deltas for time, and attribute token/cost by `parent_tool_use_id` to see which
seats spend the $20. The 159 multimodal image reads + Opus create/buy/gate + the long create-merge are
the likely cost centers, but that's a hypothesis to confirm, not a measurement.)

**Two targets are still obvious for BOTH time and cost:** create-merge (~36m of wall-clock + whatever
tokens the rate-limited stitching burned, largely fixable) + scout (~24.5m + the cost of 159 image
downloads/reads, trimmable). But next session must MEASURE per-stage cost, not just time — the $20 has
to be attributed before it can be cut.

---

## Part 4 — OPTIMIZATION DIRECTIONS for next session (hypotheses, ranked)

Goal: **light enough for a production user, no quality loss — on BOTH axes: ~70 min → minutes, and
~$20 → a viable first-look price.** These sometimes trade against each other (parallelism cuts time but
not tokens; a cheaper model cuts both; skipping work cuts both). MEASURE per-stage cost first (Part 3),
then attack the biggest time×cost cells. Directions, roughly highest-leverage first:

1. **Kill the create-merge (~36 min → ~3 min).** Root cause: create's 8 detailed specs exceed a
   comfortable single-Write output, so it split + stitched under rate-limiting. Options to explore:
   (a) have create write EACH spec to its own file (`creatives/c1.json … c8.json`) and let a trivial
   code step concatenate them (no LLM merge at all — the orchestrator or a post-hook does it);
   (b) reduce per-spec verbosity in the JSON contract (the copy pool + textBlocks are large — trim to
   essentials, move prose to creatives.md only); (c) stream specs as create goes rather than one big
   final write. Option (a) is likely the cleanest and removes the whole failure mode. **Verify in the
   trace how many turns/tokens the merge actually burned.**

2. **Speed up field-scout (~24.5 min).** It's real work but download-heavy (159 images) and serial-ish.
   Options: parallelize the per-brand fetches + downloads more aggressively; cap image downloads lower
   (do we need 159? the readers only close-read ~15–20 — Step-1's kind-spread slice gate already picks
   the exemplars, so we may be downloading far more than we read); defer non-shortlisted downloads;
   or make discovery (Perplexity rings) lighter. **Check the trace for where scout's time actually
   goes — discovery vs fetch vs download.**

3. **Model tiering per stage.** Readers/collect/build/kit are on Sonnet already; create/buy/gate on
   Opus (the money seats). Re-examine whether any Opus stage can drop to Sonnet, or whether a faster
   model tier (or lower reasoning effort) on the mechanical stages cuts time. The copy is the product,
   so don't cheapen create/buy/gate — but readers, brief, collect, kit may have headroom.

4. **Streaming / early-start.** Could build begin rendering the top-ranked spec before ALL 8 are
   finalized? Could the gate's LP fetch run concurrently with rendering? Look for serialization that
   isn't logically required.

5. **Rate-limit handling.** 8 rate_limit_events in the trace amplified the create-merge stall. On a
   production account with higher limits this hurts less, but the merge fix (#1) removes the biggest
   exposure. Worth confirming the prod API tier.

6. **Environmental vs architectural — separate them.** Re-run the SAME brand on a healthy machine
   (project OUT of iCloud-synced `~/Documents`, not disk-pressured) to get a clean baseline. Some of
   the ~95 min is this machine's FS stalls, not the pipeline. The next real measurement should be on
   a clean box.

7. **The "production user can't wait" UX.** Even after cutting to ~30–40 min, that's long for a live
   web user. Consider: (a) an async/email-when-ready model (kick off, notify on DONE); (b) show the
   creatives.md portfolio (designed in ~30 min in) BEFORE the ~renders finish, so the user sees the
   thinking early; (c) a "fast preview" mode (render top-1 immediately, rest on demand — the
   render-more router path already supports this). The render-top-3 + render-more architecture is
   already latency-friendly; lean into it.

---

## Part 5 — Infra state & gotchas (so next session doesn't relive them)

- **The web server MUST be launched detached** or the harness reaps it mid-run. Working recipe:
  `python3 -c "import os,subprocess; os.setsid(); subprocess.Popen(['npm','run','web'], cwd='.../agent-loop', stdout=open('/tmp/creative-agent-web.log','w'), stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL)"`
  → ppid=1, survives. Plain `npm run web` in a Bash background task gets killed. (A user-run terminal
  also works.) **Server is currently RUNNING detached on :4141** (unless the user killed it) — check
  `lsof -i :4141`.
- **This machine's FS is degraded:** project is under iCloud-synced `~/Documents`, disk was ~96% full
  (freed to ~18GB this session), load ~4 → intermittent short reads (broke `git status`, crashed a
  node module load, stalled tsx startup 90s+). Recommend moving the project to a non-synced path
  (`~/dev/`) and/or freeing more disk before the next perf run. This is likely a chunk of the ~95 min.
- **Monitors fire on file-EXISTENCE, not completeness** — the readers and create's split-write both
  tripped premature "done" milestones. When watching stages, also read the last trace event / check
  for the closing `]` etc. before trusting a milestone.
- **`tsc-exit:$?` after a pipe reports the PIPE's exit, not tsc's** — capture tsc's exit directly
  (`tsc > out 2>&1; echo $?`). A new FeedItem/ChatEvent kind will break the exhaustive switches in
  `chat/App.tsx` (feedLine) — remember to add the case.
- **Cost accounting (this bit me — get it right):** `total_cost_usd` is CUMULATIVE within a
  query/session. Real run cost = the **MAX** total_cost_usd within that run's segment. Do NOT sum
  across result messages (that double-counts → $185 phantom). Do NOT take the FILE's last value either
  — this run's `trace.jsonl` is appended by the resume + follow-up (a SECOND query that resets the
  counter), so the last line is the cheap follow-up ($2.35), not the run. Segment the trace at the
  resume `init` boundary, then MAX per segment. **Original run = $19.97 (~$20); follow-up = $2.35.**
  (I initially reported $2.35 as the run cost — wrong; the founder caught it. Don't repeat it.)
- **bank/ is gitignored** (data churns every run; R2/D1 is the real store later, per S145 plan).

---

## Part 6 — Remaining plan work (unchanged by this session)

- **Step 4 — the CSV outcome loop** (real flight results → `score.flights[]` on bank entries → create
  prefers scored-converting constructions). The only unbuilt piece of the S145 plan. This is the moat.
  The Verbis 11-July flight numbers + this HK run are the first candidate data points.
- **Two refinements the HK run surfaced** (non-blocking; the buyer caught the one live case):
  1. The **brief** should verify "brand holds the fuel" assertions against founder-facts/material —
     it mis-attributed Carbamide's "300 body functions" claim to HK. (Edit: `field/references/field-brief.md`.)
  2. **create** should reject a motor fuel that cites no anchor `#` — C7's fuel was written "300+ body
     functions (held fuel)" with no anchor, while every other spec cited one; that missing `#` was the
     tell. A self-check gate in `create/SKILL.md` would catch it before the buyer.
- **Bank seeding** (`npx tsx seed-bank.ts --yes`, ~15 credits) — optional; gives cross-market format
  lane priors. The bank has its first 6 files from the HK run either way.

---

## Part 7 — Fast pointers
- **Commits (new-ui):** `a643e60` (Steps 1–3 + router + resume), `60c785c` (web-UI fixes). Prior:
  `eabc7e3` (Step 0), `ac7fbc9` (S146 plan).
- **Plan doc:** `docs/SESSION_145_PIPELINE_TEARDOWN_AND_PORTFOLIO_ENGINE_PLAN_2026-07-15.md` (Steps 0–4).
- **Build handoffs:** `docs/SESSION_147/148/149_*.md`.
- **Run to analyze:** `agent-loop/runs/2026-07-16-09-52-58_www-hkvitals-com-sv-hk-vitals-100-magnes/`
  (trace.jsonl is the input; deliverable mtimes are the timeline).
- **Key code:** `agent-loop/pipeline.ts` (orchestrator + router + stage flow), `stages.ts` (seats +
  models + maxTurns), `hook.ts` (launch/gather caps), `mcp/scrapecreators.ts` (scout's engine — the
  159-download + fetch logic), `create/SKILL.md` (the 8-spec contract that drove the big JSON).
- **Memory:** `project_field_first_pipeline.md` (updated this session with the validation + fixes).
