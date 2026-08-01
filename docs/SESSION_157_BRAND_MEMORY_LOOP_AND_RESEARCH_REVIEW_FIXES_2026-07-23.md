# S157 — Brand-memory loop (self-learning layer) + research/review-capture fixes

**Date:** 2026-07-23 · **Continues:** `docs/SESSION_156_LITE_RUNS_TRUNATIV_VALIDATED_2026-07-22.md`
**Status at close:** two features designed, built, live-validated, and COMMITTED on `new-ui`.
Nothing outstanding blocks the next session; two latent items logged (F44 quote-integrity,
server-kill deposit gap). Findings ledger continues at F38.

## Commits this session (on top of S156's `84d0831`)

```
9a7dd3f  fix(lite): research form-caps + review capture — root-cause the P4 delay & trunativ review miss
b67cff1  feat(lite): brand-memory loop — per-brand self-learning layer (P0-P4, validated live)
84d0831  (S156) LITE pipeline validated on trunativ
```

`lite-loop/memory/` is gitignored (per-account runtime data, not source). The plan doc
`docs/PLAN_BRAND_MEMORY_LOOP_2026-07-22.md` is the full build contract and is committed.

---

## Part 1 — The brand-memory loop (the session's main build)

### Why (founder's thesis, crosschecked)
The moat is MEMORY (founder's Cursor analogy — SpaceX/Anysphere $60B, June 2026, real; verified
live). The pipeline itself is replicable; accumulated per-customer data is not. Crosscheck landed
one correction: memory is a moat *earned with volume*, not built in advance — so the job now is to
INSTRUMENT so every run deposits data, even while volume is small. Learning ladder: **rung 1 =
remembering (BUILT), rung 2 = outcome-steered ranking (slot only — outcomes.csv), rung 3 =
pipeline self-improvement (stays manual, the F-ledger), rung 4 = fine-tuning (never at our scale).**

### Research done first (two subagents, grounded)
- Local SDK docs (`claude_sdk/`, SDK 0.3.195): NO built-in memory/learning feature. Hooks capture +
  prompt injection are the free primitives; `AgentDefinition.memory` field exists but undocumented.
- Anthropic public guidance: the GA API memory tool is client-side file-ops only (not needed — our
  pipeline is already file-first). Reference pattern = Claude Code auto-memory (small always-loaded
  index + on-demand detail, model-judged writes, recency stamps). Principles applied: **store rules
  not logs; smallest high-signal set; verify before marking done; simplicity first.**

### The design (settled in discussion, then built)
**Store** (`lite-loop/memory/<account>/`, account="local" now → Clerk uid in prod):
- `brands/<brand-key>/memory.md` — THE NOTEBOOK: distilled rules, one-regex grammar, ≤4KB.
- `brands/<brand-key>/events.jsonl` — THE DIARY: append-only signals, code-assigned monotonic ids,
  deposit watermarks. **Never injected, never re-read whole** (bank-balance: notebook + events-since-
  watermark only). Bloat is a non-issue.
- `brands/<brand-key>/outcomes.csv` — THE SCOREBOARD: real ad results, manual entry v1, mirrored to
  the diary at deposit (a fresh result re-opens the watermark → can promote rules).
- `user.md` — person-facts that hold across the founder's brands (cross-brand cites only).
- Brand key = REDIRECT-CONFIRMED landing host, dots→dashes. Account-first keying = tenant isolation
  from day one; brand lessons never bleed between brands.

**Rule grammar** (parses with `RULE_RE`, one regex):
`- R2 (confirmed, last r5) [E12, E31] — No gym-bro tone in copy.`
Statuses are ARITHMETIC, validator-enforced (the model proposes, code disposes):
- `founder-stated` — cites an intake_answer/founder_note (the founder SAID it); **never ages**.
- `confirmed` — ≥2 citations across ≥2 distinct runs OR ≥1 `outcomes:` citation.
- `hypothesis` — one citation buys this and no more.
- `stale` — written by CODE only (a model writing it is refused).

**The loop, three moves:**
1. CAPTURE (web.ts diary writers, all fail-soft): intake_answer on AskUserQuestion answers, followup
   + spec tokens on chat messages, "remember …" → founder_note.
2. INJECT (web.ts startRun): learned record inlined into research+create prompts ONLY. **THE JUDGE
   STAYS COLD [F]** — its independence is its value (S118 same-model-blessing). Orchestrator gets
   founder-stated rules + a contradiction-surfacing AskUserQuestion ("policy change or one-time
   exception?"). `LITE_MEMORY_OFF=1` = control run (capture on, injection off). Empty store →
   byte-identical prompts to a memory-less run (test-proven).
3. DEPOSIT (memory-deposit.ts, onEnd trigger + CLI): code-before-model (verdict→events, founder-edit
   diff→tombstones/founder_notes, backfill synthesis, rule_obeyed gating) → ONE Sonnet pass fenced by
   `notebookProblem` (writes ONLY the two notebook paths) → code-after-model (`applyStalenessAndBumps`:
   obeyed→bump last, unbacked hypothesis/confirmed ≥3 runs→stale, second-consecutive-stale→drop; laws
   exempt) → snapshot + watermark. Idempotent.

**Key laws that make it safe (all reuse validated pipeline machinery):**
- F33 defense: uncited memory is fabricated memory — every rule cites real events, code checks.
- The silence law (§6): a rule OBEYED but unmentioned gets its clock refreshed (quiet acceptance)
  but is NEVER promoted — silence keeps a rule alive, only evidence strengthens it.
- Tombstones: a deleted rule can't resurrect unless a NEWER founder statement says it again.
- Contradiction: recency wins in-run always; the deposit resolves the rule (replace / footnote
  exception) per the founder's conflict answer. Never silently resolved.

**User control:** say it ("remember: X"→founder-stated), edit the markdown by hand (diff re-grounds
it as founder speech; prod = a Brand Memory UI panel, the trust+retention surface), delete (tombstoned).
Notebook edits only; diary/scoreboard stay append-only ground truth.

**Measurement:** `npm run stats [brand]` — per-run edits/ships/kills/injected/obeyed/outcomes. THE
number = **edits-per-batch per brand, trending down.** Clean test = an occasional `LITE_MEMORY_OFF=1`
control re-run.

### Build + validation (P0–P4, all green)
- P0 store+validator: `memory-store.ts` + `memory-validate.ts` + `memory-test.ts` (89 checks green
  by session end). Gotcha caught by fixtures: a bare `host:port` parses as a URL SCHEME (empty
  hostname) — `brandKeyFor` only trusts URL() for real `scheme://`.
- P1 capture+injection: web.ts writers, pipeline.ts `buildLiteAgents(runDir)` inline + orchestrator
  conflict block, `LITE_MEMORY_OFF`. Judge/field/build prompts byte-identical with/without memory
  (test-proven).
- P2 deposit + BACKFILL: ran the CLI over the 3 completed pre-memory runs (houseoftwilight, TRF,
  trunativ — orphan + abandoned excluded by the DONE gate) → 5/9/3 rules, ZERO denials, $0.69.
- P3 scoreboard mirror + stats CLI.
- **P4 LIVE GATE (trunativ run 2, 5/6 shipped NORMAL):** injection ✓ (all 6 specs bound the learned
  PNG-logo rule without being re-asked); **R1+R2 promoted hypothesis→confirmed on the two-run
  arithmetic**; R3 bumped-not-promoted by the silence law; **the loop CLOSED — the judge's c5
  FABRICATION kill became rule R5, a caption fix became R4 (this run's failures = next run's
  guardrails)**; deposit $0.33, ZERO denials.

---

## Part 2 — Research + review-capture fixes (`9a7dd3f`)

Root-caused from the P4 trace (the run took 59min; research alone ate ~20). Then validated live on a
NEW cold brand (godesi.in).

### The research delay — char cap replaced with FORM caps
The 8000-char cap asked the model to count CHARACTERS (the one thing an LLM can't do). Result: drafts
overshot on rich input and shaved gradually — **13 denials, a seat starved 226-over, a relaunch that
rebuilt from scratch.** Draft size tracks INPUT size, not the stated cap (run 5 landed in 2 tries;
this run's page dumps were 3× bigger → 16.5K first draft).
- `researchProblem` now enforces FORM (code counts perfectly, a model obeys by line): 15–55 artifact
  lines, prose lines named by EXACT number, competitor section required. Length is emergent (~9–10K);
  a 15K runaway backstop remains. F39: the old "every number becomes one" wording was misread live as
  one-artifact-per-page — reworded.
- F38: denied research.md drafts stash to `raw/research-denied.md`; seat prompt + orchestrator
  relaunch both point a successor at it — starvation no longer discards progress.
- research maxTurns 10→14.

### The review miss — trunativ shipped "0 ratings" while 4.79★/145 sat in the HTML
The extractor trusted a theme's empty `0/0` JSON-LD aggregateRating stub AND missed the Judge.me
badge. Downstream: create had no social proof → c5 invented a testimonial → judge killed it for
FABRICATION → the deposit wrote a rule with a FALSE premise ("0 ratings on file"). **Validators check
provenance, not whether the world agrees — only the founder's eyes caught it.** (The F33 lesson, one
level deeper. Strong argument for the founder eye-read staying a permanent loop step.)
- F42a: 0-count JSON-LD rating = absence, ignored; three fallbacks (Judge.me/`data-*` badge attrs,
  microdata, visible "Based on N reviews" count-only). LIVE-verified on trunativ → 4.79★/145.
- F42b: review BODIES are JS-loaded — `runProductPhotos` does one rendered pull when `REVIEW_APP_RE`
  matches, writes `raw/pages/reviews-<slug>.txt` verbatim (author+stars+body, `extractWidgetReviews`).
- F43: the HTML cap slices mid-`<script>`, leaking raw Shopify JSON as "page text" (the 116KB dump; it
  also fooled the thin-text check so the rendered tier never fired). `htmlToText` now strips
  unterminated script/style blocks.

### Live validation (godesi.in cold brand, 4/6 shipped NORMAL)
- research: **1 denial** (a clean 57→55 ceiling trim) vs P4's 13; zero starvation.
- reviews FETCHED (2 verbatim on Mini Samosa) + cited as research artifacts [C5][C6]; rating real
  (4★/2, not a stub); page dumps clean (0 JSON leaks, 2–9KB).
- godesi's first notebook minted (5 rules, $0.20) — but via CLI (see open item below).

---

## Open items (logged, none blocking)

1. **F44 — quote-integrity (latent, candidate fix).** godesi's Mini Samosa had a 4★ review carrying a
   price/quantity OBJECTION ("quantity is very less for the price"). Create correctly AVOIDED it (used
   the clean review instead) — but by model JUDGMENT, not an enforced rule. A spec could cherry-pick
   the flattering half of a mixed review and pass every current validator. Candidate rule: a
   mixed-sentiment review is intel or quoted WHOLE, never fragmented. (The deposit independently
   distilled R5 = SKU-attribution discipline from the judge's ANCHOR kills — adjacent, not the same.)
2. **Server-kill deposit gap.** When the web server is killed AFTER a run completes, the onEnd
   auto-deposit is skipped (godesi's had to run via CLI). NOT an orphan — F32 held, the run had
   finished, no rogue agent. Fix candidate: a startup sweep that deposits any completed-but-
   undeposited run (Glob runs/ for DONE.md without a matching deposit watermark).
3. **Research still 1 denial, not 0.** Form-caps made it a clean mechanical trim — acceptable. Only if
   it regresses: the structural kill is one-file-per-artifact + code assembles/counts research.md (the
   field/picks pattern), whole-file denials cease as a class. Held in reserve.
4. **Time gate (from S156, unchanged).** ~70s/turn × 5 sequential seats. Structural, not fixed here.

## How to resume
- Everything is committed and green. `cd lite-loop && npm run test:memory && npm run test:harvest` to
  reconfirm. `npm run stats` to see the memory store (trunativ r1+r2, godesi r1, + backfilled TRF/HOT).
- To run: `npm run web` (port 4142), start a brand in the UI. A repeat brand tests memory; a new brand
  tests cold-start + adds to the store. **The web server must be freshly started to carry S157 code.**
- Natural next moves: pick up F44 or the deposit-sweep, OR just keep running brands to feed the loop
  (edits-per-batch is the metric to watch). The CLIP/Vectorize retrieval layer + cross-brand priors
  stay deliberately shelved until the plain-file version proves lift (S91 note + "simplicity first").
- Memory pointer: `project_brand_memory_loop.md` carries the compressed state; this doc is the detail.
