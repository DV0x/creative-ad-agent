# SESSION 151 — TRACE EVAL DONE: profiler + funnel walk + taste scores (HK Vitals run)

**Date:** 2026-07-17
**Status:** The S150 mandate ("analyze the trace, understand behavior, find the latency+cost") is
**COMPLETE**. This doc consolidates all three analyses — the quantitative profiler, the behavior/funnel
walk, and the taste scorecard — plus the ranked fix list they produce. Nothing is built this session;
this is the measured ground truth the next build session executes against.

**Analysis subject:** `agent-loop/runs/2026-07-16-09-52-58_www-hkvitals-com-sv-hk-vitals-100-magnes/`
(trace.jsonl, 2063 messages, 3 logger lifetimes L1=original run / L2=c6 resume / L3=c8 follow-up).

**Tooling built:** `agent-loop/trace-profile.cjs` — streaming profiler over any trace.jsonl.
`node agent-loop/trace-profile.cjs <trace.jsonl> [--json out.json]` → query-segment skeleton,
per-segment time partition (model-wait / tool-wait / other), token+cost counters per model,
top gaps with line numbers, rate-limit sightings. Zero cost, ~2s on the 69MB trace.

---

## Part 1 — THE MEASURED RUN (L1 original): ~110 min on the trace clock, $19.97

Trace structure: ONE SDK session (`915b892a`) resumed across 27 query segments (one per stage/phase).
Each stage query launches its seat as an Agent; `modelUsage` in each `result` is **cumulative per model
per logger lifetime** — per-stage cost = deltas between consecutive results (lags async work by up to
one segment; adjacent-stage attribution is ±$1).

| Stage | Wall | ~Cost | What the time actually was |
|---|---:|---:|---|
| intake + scout | 28.5m | $1.6 | ~10m image downloads, ~13m model, **mid-scout auto-compact** |
| read (5 ∥) | ~7m | ~$3.9 | 159-image multimodal reads; parallel; fine |
| brief | 5.6m | ~$0.3 | one long Sonnet write |
| collect | 4.3m | ~$0.7 | fine |
| **create (Opus)** | **38.9m** | **~$9** | ~90% regeneration waste — see autopsy |
| buy (Opus) | 2.6m | ~$1 | lean; verdict.md written once |
| build (renders) | 8.7m | ~$1.0 | 5m = render API wait |
| gate + kit + wrap | 7.8m | ~$2.6 | fine |
| milestone micro-queries (8×) | ~3m | ~$0.8 | tiny status-file writes as full queries |

**Cost decomposition** ($19.97 = Opus $10.56 + Sonnet $9.21 + Haiku $0.20). By token type:
**output $8.0** (Opus 233k out @ $25/M — mostly create; Sonnet 147k), **cache writes $6.7** (1.5M
tokens — 27 query-resumes of an ever-growing session × 5-min cache TTL that dies between stages,
plus ~12 subagent context caches), **cache reads $4.7** (13.2M), fresh input ~$0.3.
Rate limits: only ~6 min total (2 stalls inside create) — NOT the main story.

### create autopsy (the smoking gun — revises the S150 "merge under rate limits" hypothesis)

Minute-by-minute from the trace (lines 1183–1379): create read inputs and wrote all 8 specs into
creatives.md in **2.5 minutes**. The next ~36 minutes were harness failure modes stacking:
1. **16k output-token cap** → forced split-write ("I'll write in parts to stay within limits") →
   creatives.json (1–3) + creatives-4-8.json.
2. **Edit tool NOT in create's toolset** → planned an Edit-stitch, generated a 31k-char Edit call
   (~2 min of Opus output) → "Edit isn't available" → wasted.
3. Full-rewrite attempt → **hit the output cap with an API error** → orchestrator SendMessage-resumed it.
4. **Write-requires-Read rejection** → the 31k-char rewrite was generated TWICE more (announce-turns
   at 74.8/77.4/80.0m each ~2.5 min, Write rejected at 82.0, Read, Write again at 84.0).
Net: ~157k Opus output tokens for ~15k of useful deliverable — **~$5.5 and ~30 min pure waste**.
Even deleting the stray creatives-4-8.json took a rejected attempt + Read + retry.

### scout autopsy (why it compacted)

ONE scout subagent (launched min 4, lived ~24 min). Its own 200k context overflowed at min 22 from:
(a) raw MCP payloads returned INTO context (54k/46k/44k/42k/40k/34k chars — data that also lands on
disk as jsonl: it held both copies); (b) re-reading the same files — carbamidefort.jsonl Read **6×**;
(c) **WebFetch pulling image BINARY into context** (fbcdn URLs, "return its binary content" — worst
possible pattern; downloads must be curl-to-disk); (d) the orchestrator's round-2 wake (SendMessage
at 18.2m) piling onto a near-full context. Post-compact tax: re-read everything, re-wrote a
shortlist.md it had already written. ~6–8 min + ~$1.5 + specificity risk.

### Waste inventory (ranked)

| Waste | ~$ | ~min | Fix |
|---|---:|---:|---|
| create regeneration | 5.5 | 30 | file-per-spec + Edit in toolset (or code concat) |
| cache-write churn | 4–5 | — | 1h-TTL caching and/or slim orchestrator context |
| scout compact chain | 1.5 | 7 | payloads to disk, no binary WebFetch, read-once, download cap |
| milestone micro-queries | 0.8 | 3 | plain code, no model call |
| build/gate image payloads re-entering context 4× | 1 | — | only gate needs to SEE renders |

**Projection: ~$10–12 of $19.97 and ~40 of ~110 min is removable** before touching model tiers or
read-stage depth. Lean run on today's architecture ≈ **$8–9 / ~55 min**; create fix alone: 39m→~8m.

---

## Part 2 — FUNNEL WALK (behavior): specificity survives all six stages, pixel-verified

Method: walked 4 claims through field-ads → reads → brief → specs → verdict → render prompts → PIXELS
(viewed c4/c2/c1/c8 renders; grepped ground truth).

1. **Owned fact ("8x absorption")**: material.md [#1] → 4 specs → on c4 pixels verbatim ("8x Absorbed /
   not cheap oxide"). Same for 220mg / 72hr / 32%. **Zero invented numbers reached pixels.**
2. **Field construction (OZiva "SUDDEN MUSCLE CRAMPS?")**: ad → read → brief hook bank verbatim w/
   endorsement math → C2 keeps radial-dissection FORM, swaps every slot to HK-owned numbers → pixels
   verbatim. The swap test passing at construction level.
3. **The fabrication ("300 body functions")**: origin located precisely — **the brief contradicts
   itself**: hook bank (line 126) correctly tags it Carbamide Forte VIDEO copy; Open Lane #3 (line 160)
   asserts "HK holds the fuel — already in their own copy". create trusted the lane, built C5+C7,
   marked both "held-fuel" **with no anchor #** (the only unanchored numbers in all 8 specs). buy
   grepped material+founder-facts, confirmed absent, killed both. One unverified sentence upstream
   cost 25% of the portfolio; defense-in-depth contained it.
4. **Honest ladder (carousel C6)**: Man Matters 104d×3v is COPY-ENDORSED (image blocked) → brief said
   so → C6 took ARGUMENT from copy, LAYOUT from archetype, fuel from HK's own 3 benefits. No fake
   pixel-sourcing.

### Rubric scores (decision hygiene)

- **Grounding rate — the star metric:** 6/8 specs fully anchored; the exactly-2 unanchored = the
  exactly-2 kills. **Anchor discipline predicts kills** → a free lint replaces a $1 Opus catch.
- **Verification rate: 1 of 3 seats.** buy greps before judging (the catch was deliberate — "verify
  key TRUE facts before writing" visible in-trace); brief never self-checks; create read material.md
  and still didn't check its "held fuel".
- **Discrimination: real.** 2/8 killed with evidence; 6 ranked with distinct learn-hypotheses;
  ranking logic = actual media-buyer intent logic. Orchestrator also JSON-validated create's output
  before launching buy cold (the seal held).
- **Diversity: held after kills.** 5 claimTypes / 5 families / 6 personas; no mode collapse.
- **S118 verdict: the genericness disease is CURED in this run.** Failure mode moved from
  "information dies on the way down" to "one unverified assertion slipped in" — a two-lint fix.

### Behavior bugs found

- **Backfill branch never ran** — verdict ordered 2 replacement specs (BACKFILL section present);
  batch shipped 6 not 8. Investigate `pipeline.ts` partial-kill branch trigger.
- Ratio: instructed 4:5, KIE rendered 3:4 on all — KNOWN constraint (S143: KIE 4:5 disabled). Re-check
  whether KIE supports 4:5 now; Meta feed crops 3:4.

---

## Part 3 — TASTE SCORECARD (from pixels, performance-marketer lens, 1–5)

| | stop-power | swap test | register fidelity | line craft | native finish |
|---|---|---|---|---|---|
| c4 objection wall | 4 | 3 | 5 | 4.5 | 4.5 |
| c2 cramps radial | 4.5 | 5 | 5 | 4.5 | 4 |
| c1 wish card | 3.5 | 2 | **2** | 3 | 4.5 |
| c8 native card | 4 | 4.5 | 4 | 4.5 | **3.5** |

- **c1 = the batch's one taste failure: the meme got GENTRIFIED.** Picked for Carbamide's joke grammar
  (loud, Hinglish, cracker-box punchline); rendered as a premium still-life (diya, moody light, elegant
  type). "Me:" punchline survives as text but the VISUAL register flipped meme→boutique; 16-word
  punchline has no meme snap (source embeds "5x Strength" in ~8). Any premium brand could bottle-swap
  this image. → new metric: **register fidelity** (render register vs source-construction register),
  checkable at gate (gate already re-views all renders).
- **c8 = 80% native; the last 20% is countable AI tells:** too-cinematic window light, professionally
  kerned type on an "organic" post, label lit straight-on in a casual scene. Field has ZERO native
  executions so it still differentiates; a deliberate roughen pass would make it the best cold unit.
  → new metric: **AI-tell inventory** at gate.
- **c2 = taste high-point** — hook upgrade is real craft (OZiva's "SUDDEN MUSCLE CRAMPS?" →
  "…that stretching won't fix?" names the failed remedy = intent filter); all chips owned. Arguably
  the cold-traffic #1; c4 rightly wins the label-reader/retargeting segment but 3 of its 4 callouts
  are category-generic (only 8x is owned).
- **Batch-level: a register bet nobody made on purpose.** Field's biggest spender lives in Register A
  (mass/Hinglish/loud); HK's own live video is A-adjacent; the shipped batch is 5/6 Register B
  English-premium and the one A play was gentrified. Maybe correct — but it EMERGED, wasn't decided.
  → intake should ask the register question.
- Counterfactual selection check: create's skips of the brief's #1 (Carbamide symptom skeleton) and #3
  (father-authority comic) constructions are DEFENSIBLE on inspection (#1 = the brief's own "shared
  wallpaper" saturation call; #3's fuel requirement is a completeness count HK doesn't verifiably
  hold). Evidence of judgment, not omission.

---

## Part 4 — THE FIX LIST (ranked, what next session executes)

**A. Latency+cost (the big two):**
1. **Kill create regeneration**: specs write file-per-spec (`creatives/c1.json…c8.json`), code-side
   concat (orchestrator or post-hook); give create Edit (`stages.ts`); consider raising
   `CLAUDE_CODE_MAX_OUTPUT_TOKENS`. Expected: create 39m→~8m, −$5.5.
2. **Scout diet**: MCP payloads summarized-to-context / full-to-disk; ban binary-into-context
   WebFetch (curl to disk); read-once discipline; cap downloads to shortlist (159 fetched, ~15–20
   close-read). Expected: −7m, −$1.5, no compact.
3. Milestone writes → code, not queries (−$0.8). Cache: 1h-TTL and/or slim orchestrator resume context
   (−$3–4 potential — measure after 1+2).

**B. Correctness lints (funnel-proven, both are free):**
4. **create hard rule: no anchor # → not on-image copy** (would have caught C5+C7 pre-buy;
   `create/SKILL.md` self-gate — S150 refinement #2, now data-confirmed).
5. **brief self-consistency check**: every "brand holds X" assertion greps material/founder-facts
   (the S150 refinement #1; the contradiction was grep-detectable within the brief itself).
6. **Fix the backfill branch** (ordered, never ran — pipeline.ts).

**C. Taste (operationalize the scorecard):**
7. Gate additions: **register-fidelity check** (render vs source-construction register) +
   **AI-tell inventory** (light/type/composite tells) — gate already re-views renders, marginal cost ~0.
8. create lint: punchline/hook length budget per formatFamily (meme ≤~8 words).
9. Intake: ask the REGISTER question (A mass-loud vs B premium-clinical) — founder decides, not drift.
10. Re-check KIE 4:5 support (3:4 fallback is S143-known; Meta feed crops 3:4).

**Unchanged:** Step 4 (CSV outcome loop) remains the only unbuilt S145 piece — and is the true taste
ground truth (flights > judged scores).

## Part 5 — Fast pointers

- Profiler: `agent-loop/trace-profile.cjs` (this session). Segments/costs JSON:
  rerun with `--json` if needed.
- Cost accounting law (S150, confirmed): modelUsage/total_cost_usd cumulative per logger lifetime;
  MAX within segment, never sum, never file-last. L1=$19.97, L2=$2.14, L3=$2.35.
- Create autopsy lines: 1183–1379; scout compact: L300 (SUB-attributed summary); buy verification:
  L1440–1448.
- Prior handoffs: S150 (launchpad), S147/148/149 (builds), S145 (plan).
