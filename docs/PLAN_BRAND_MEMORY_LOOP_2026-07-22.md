# PLAN — Brand Memory Loop (self-learning layer for the LITE pipeline)

**Date:** 2026-07-22 · **Status:** design approved by founder in discussion (S157); this doc is
the build contract. **Continues:** `docs/SESSION_156_LITE_RUNS_TRUNATIV_VALIDATED_2026-07-22.md`.
**Research ground truth:** two-agent sweep 2026-07-22 — Agent SDK 0.3.195 has NO built-in
memory/learning (hooks + prompt injection are the free primitives); Anthropic's reference pattern
is Claude Code auto-memory (small always-loaded index, model-judged writes, recency stamps);
principles: store rules not logs, smallest high-signal set, verify before marking done.

## §1 The thesis (why this exists)

The pipeline is replicable; accumulated per-customer data is not. The moat = memory, earned with
volume — so every run from now on must DEPOSIT data even while volume is small. Ladder: rung 1 =
remembering (THIS BUILD), rung 2 = outcome-steered ranking (slot only — outcomes.csv), rung 3 =
pipeline self-improvement (stays manual, the F-ledger), rung 4 = fine-tuning (never at our scale).

The loop in one breath: run happens → raw facts land in the DIARY → a deposit model distills them
into cited rules in the NOTEBOOK → next run injects the notebook into research + create → mistakes
made once don't repeat. Measured by **edits-per-batch trending down per brand**.

## §2 The store

```
lite-loop/memory/
  <account>/                      account FIRST — tenant isolation from day one.
    user.md                       rules about the PERSON (hold across their brands)
    brands/<brand-key>/
      memory.md                   THE NOTEBOOK — distilled rules, ≤4KB, validator-fenced
      memory.md.last              deposit's own snapshot (for founder-edit diffing, §5)
      events.jsonl                THE DIARY — append-only raw signals, never injected
      outcomes.csv                THE SCOREBOARD — real ad results, manual entry v1
```

- `<account>` = `"local"` for now; in prod it's the Clerk user id. Structure ports as-is.
- `<brand-key>` = landing host, dots→dashes (`trunativ-co`) — same `host()` normalization as
  capture.ts. The REDIRECT-confirmed landing host, not the entered URL (wrong-brand guard).
- Two customers never share memory even for the same domain. Brand lessons never bleed
  between brands. User-level rules are the only cross-brand channel, and only for
  person-facts ("would this still be true if they switched brands?").

## §3 File formats

### memory.md — the notebook (rule grammar, machine-parseable markdown)

```
# Brand memory — trunativ.co (account: local)

- R1 (founder-stated, r1) [E2] — Never discount framing; premium-clinical register.
- R2 (confirmed, last r5) [E12, E31] — No gym-bro tone in copy.
- R3 (hypothesis, r5) [E44] — Prefers headlines under 6 words.
- R4 (confirmed, last r5) [E9, outcomes:c5] — Text-billboard formats outperform for this brand.
```

One regex parses a rule: `^- R(\d+) \((founder-stated|confirmed|hypothesis|stale)(?:, (?:last )?r(\d+))?\) \[([^\]]+)\] — (.+)$`
Citations are diary event ids (`E12`), `outcomes:<creative>` rows, or (user.md only)
`<brand-key>:E12`. Rule ids are stable across deposits (edits keep the id; new rules take the
next free id). NOTHING else goes in the file — no prose sections, no history. ≤4,000 chars.

### events.jsonl — the diary (append-only, one JSON object per line)

```
{"e":"E14","run":"<runId>","ts":"<iso>","type":"followup","text":"make c3 headline shorter","specs":["c3"]}
```

`type` closed set v1: `intake_answer` (the AskUserQuestion answers, verbatim) · `followup`
(founder chat message after intake) · `judge_ship` / `judge_kill` (+`spec`, `reason` — copied
from verdict.json by CODE at deposit, never by the model) · `caption_fix` · `redo` ·
`rule_obeyed` (+`rule` — soft event, code-computed, §6) · `rule_deleted` (+`rule`, `text` —
tombstone) · `outcome` (+`creative`, mirror of a scoreboard row) · `deposit` (+`throughEvent` —
idempotence watermark) · `founder_note` (explicit "remember this").
Event ids `E<n>` are monotonic per brand file (next = count+1, code-assigned). The diary is
NEVER injected into any seat and NEVER re-read whole by deposit (bank-balance pattern:
notebook + events since last `deposit` watermark only). Bloat is a non-issue — nothing that
grows gets read, nothing that gets read grows.

### outcomes.csv — the scoreboard

```
run,creative,ran,start_date,days_live,spend,metric,value,source,note
2026-07-22-07-34-00_trunativ-co,c5,yes,2026-07-25,14,120.00,cpl,3.40,self_report,"founder DM"
```

Manual entry v1 (founder types it or tells us). `metric` ∈ cpl|ctr|roas|none. CPL is the gold
signal for lead-gen (S91 note stands). No Meta API ingestion in this build.

## §4 Capture — the diary writers (web.ts seams)

All writers are code, fail-soft, and land in the brand diary resolved from the run's landing
host. New module `lite-loop/memory-store.ts` owns append/read/id-assignment (pure core,
fixture-testable; fs at the edges — same split as harvest).

1. **`msg.type === 'answer'`** (web.ts:213) → `intake_answer` event, answers verbatim.
2. **`msg.type === 'message'`** (web.ts:216) → `followup` event. `specs[]` best-effort: filled
   when the text names `c<N>` tokens; else empty (deposit model may not backfill — events are
   facts, not interpretations). A message starting with "remember" (case-insensitive) is ALSO
   logged as `founder_note`.
3. **verdict.json → `judge_ship`/`judge_kill`/`caption_fix` events**: copied by code at deposit
   time (§5), one event per spec, `reason` = the kill's evidence line. NOT a live hook — the
   file on disk is already the record; copying at deposit keeps run-time surface untouched.
4. **`rule_obeyed` soft events**: code-computed at deposit (§6). Never written live.
5. Diary writes require the brand dir to exist — created lazily on first event for that brand.

## §5 Deposit — the distiller (new: lite-loop/memory-deposit.ts)

**Trigger:** (a) web.ts `onEnd` (session close) when `DONE.md` exists in the run dir — fire-and-
forget, failures logged not thrown; (b) CLI `node --experimental-strip-types memory-deposit.ts
<runDir>` for manual runs and BACKFILL of the five existing S155/S156 runs (first live test).
**Idempotent:** skip when a `deposit` event's watermark already covers the diary's last event
AND the run's verdict events were already copied.

**Order of operations (code before model):**
1. Copy verdict.json → diary events (§4.3), if not already copied for this run.
2. Founder-edit diff: compare `memory.md` on disk vs `memory.md.last`. Rules REMOVED by hand →
   auto-log `rule_deleted` tombstones. Rules ADDED/edited by hand → log `founder_note` events
   citing the edit (hand-written rules get re-grounded by the model pass: it must attach status
   + citation `[founder_note event]`, i.e. founder-stated).
3. Compute `rule_obeyed` soft events (§6).
4. THE MODEL PASS — one SDK `query()`: model `claude-sonnet-4-6`, `maxTurns: 8`, tools
   Read/Glob/Grep/Write, `cwd: runDir`, `additionalDirectories: [brand memory dir, account dir]`,
   `settingSources: []`. Prompt inputs: current notebook, user.md, NEW diary events since
   watermark (inlined — no diary reads), and pointers to the run's files (founder-facts.md,
   verdict.json, field-summary honesty[], trace.md) for context reads.
   The model judges: what is a LESSON vs noise · which notebook it belongs in (brand vs user —
   "still true if they switched brands?") · reinforce / contradict / new · phrasing as a RULE
   (constraint, not log). It writes memory.md (and user.md when warranted) in the §3 grammar.
5. Write `memory.md.last` snapshot + append the `deposit` watermark event.

**The validator** (new: `lite-loop/memory-validate.ts`, pure — `notebookProblem(content, diary,
injectedRules, priorNotebook)`), wired as a PreToolUse Write deny-hook in the deposit query's
options, collect-all denial style (F26 pattern, same as pipeline.ts denyWrite):
- parse failure on any rule line → refused with the grammar quoted back;
- every citation must EXIST (event id in diary / outcomes row / valid cross-brand ref) — F33
  defense: uncited memory is fabricated memory;
- **status arithmetic** (the model proposes, code disposes): `founder-stated` ⇢ ≥1 cited event
  of type `intake_answer`/`founder_note` whose text supports being said directly; `confirmed` ⇢
  ≥2 citations from ≥2 distinct runs OR ≥1 `outcomes:` citation; `hypothesis` ⇢ exactly what one
  citation buys. Demotions always legal; promotions must re-satisfy the arithmetic;
- **tombstones**: a new/kept rule whose normalized text exact-matches a `rule_deleted` tombstone
  is refused (belt); the deposit prompt also lists tombstones explicitly (suspenders — code
  can't catch a rephrase, the prompt handles that honestly);
- ≤4,000 chars; rule ids unique; statuses in the closed set. `stale` is written by code (§6),
  never by the model — a model writing `stale` is refused.

**Deposit prompt laws** (the ~20 lines that matter): rules are constraints that would change a
future run — never restate research facts, never log events as rules; quote-level specificity
("no emoji in headlines"), not vibes ("likes clean copy"); when a new event CONTRADICTS a rule,
replace it (recency wins — the diary keeps history) unless an `intake_answer` resolved it as a
one-time exception (then keep the law, append the exception to the rule text); prefer editing an
existing rule over adding a near-duplicate; when in doubt, DON'T write — a missing hypothesis
costs nothing, a wrong rule poisons every future run.

## §6 Staleness + the silence problem (all code, in deposit step 3)

- Every non-founder-stated rule carries `last r<N>` (last run whose evidence backed it).
- **Laws never age:** `founder-stated` rules are exempt until contradicted or tombstoned.
- **Quiet acceptance refreshes:** for each rule INJECTED this run (from `memory-injected.json`,
  §7): if the run reached DONE and no new event contradicts the rule (v1 check: no `followup`/
  `intake_answer` event whose text targets the rule — computed by the deposit model? NO: v1 keeps
  it mechanical and generous: any DONE run with zero followups counts as obeyed for ALL injected
  rules; a run WITH followups refreshes nothing automatically) → log `rule_obeyed` + code bumps
  `last` to this run. Soft events can never PROMOTE (validator arithmetic excludes `rule_obeyed`
  citations from the confirmed count) — silence keeps rules alive, only evidence strengthens.
- **Aging:** at deposit, any hypothesis/confirmed rule with `currentRun - last ≥ 3` brand-runs is
  re-stamped `stale` BY CODE after the model pass (post-write patch, same file). A stale rule is
  NOT injected (§7). Next deposit, the model must either re-cite it fresh (back to its earned
  status) or drop it; a stale rule surviving two consecutive deposits is dropped by code.

## §7 Injection (the notebook enters the run)

- **web.ts `startRun()`**, after `captureStepZero` + redirect resolution: read the brand
  notebook + user.md (skip `stale` rules), write `learned-record.md` into the run dir (audit
  copy) + `memory-injected.json` (rule ids injected — feeds §6). Env `LITE_MEMORY_OFF=1` skips
  injection entirely (still captures + deposits) — the memory-off CONTROL run for measurement.
- **pipeline.ts**: `buildLiteAgents(runDir)` gains the runDir param; the RESEARCH and CREATE
  agent prompts get the learned record INLINED (≤4KB + user.md — no extra Read turns, no
  reliance on the model choosing to look) under a fixed header:
  `LEARNED RECORD (from this brand's previous runs — advisory): … Fresh founder statements
  ALWAYS outrank this record. Cite a rule id when a rule shapes a choice.`
- **THE JUDGE STAYS COLD [F]** — no notebook, ever. Its independence is its value (S118
  same-model-blessing). Current founder laws reach it through founder-facts.md as today.
  FIELD and BUILD get nothing in v1 (field is evidence-driven; build executes specs).
- **Orchestrator conflict surfacing**: `liteOrchestratorPrompt` gains one intake instruction +
  the learned record inline: "If a founder answer CONTRADICTS a learned-record rule, add ONE
  AskUserQuestion: policy change or one-time exception? Record the answer verbatim in
  founder-facts.md under `## Memory conflicts`." Today's word always wins in-run regardless;
  the deposit resolves the rule per §5's contradiction law. Never silently resolved.

## §8 User control

- **Say it:** "remember: X" in chat → `founder_note` → founder-stated rule next deposit.
- **Edit it:** memory.md is plain markdown — founder edits by hand locally; §5.2's diff
  re-grounds hand-edits with citations. (Prod: a Brand Memory UI panel — the trust + retention
  surface. NOT in this build.)
- **Delete it:** remove the line → tombstoned via the diff → cannot resurrect (validator belt +
  prompt suspenders). Only returns if the founder says it again (`founder_note` outranks
  tombstone — code allows a tombstone override when a NEWER founder_note supports the rule).
- User edits touch the NOTEBOOK only. Diary + scoreboard stay append-only ground truth.

## §9 Measurement

- **The number: edits-per-batch per brand, trending down.** `lite-loop/memory-stats.ts` CLI:
  reads a brand's diary, prints per-run `followup` counts + ships-per-batch + injected-rule
  counts. No dashboard, one table.
- **The clean test:** occasional `LITE_MEMORY_OFF=1` re-run on a repeat brand; compare edits.
  If memory-on doesn't beat memory-off, the notebook isn't earning its context space.
- Deposit cost target: ≤$0.15/run (one Sonnet pass, ≤8 turns). Notebook injection cost: ~1K
  tokens per seat — negligible.

## §10 Explicitly OUT of this build [F]

CLIP/Vectorize retrieval (only if plain files prove lift — S91 note stands) · cross-brand
priors / format-bank steering (needs volume; must bias RANKING never inject content — the
genericness guard) · Meta API outcome ingestion (manual CSV first) · Brand Memory UI panel
(prod feature) · any change to the judge, field, or build seats' inputs · heavy agent-loop
wiring (lite only; heavy gets it after lite validates).

## §11 Build order

- **P0 — store + validator (pure, no wiring):** memory-store.ts (paths, append, ids, read-
  since-watermark) + memory-validate.ts (`notebookProblem`) + rule-grammar parser + fixtures:
  valid notebook · uncited rule · over-promoted status · tombstone resurrection · founder-stated
  without founder event · >4KB · stale-written-by-model · cross-brand citation. Green before
  any wiring (harvest-test.ts pattern, same file style).
- **P1 — capture + injection:** web.ts diary writers (§4.1–2) + startRun injection (§7) +
  `buildLiteAgents(runDir)` inline + orchestrator conflict line + `LITE_MEMORY_OFF`. Typecheck
  both loops; a no-memory brand must run EXACTLY as today (empty store = empty injection = no
  prompt delta beyond the fixed header being absent).
- **P2 — deposit:** memory-deposit.ts (§5 order-of-operations + §6 staleness code) + onEnd
  trigger + CLI. **First live validation = BACKFILL:** run the CLI over the five existing run
  dirs (2 houseoftwilight + trunativ + theratefinder + ON) — each must produce a ≤4KB cited
  notebook with zero validator loops >2 denials; founder reviews the trunativ notebook by eye
  (the F33 test: is anything in it not actually true?).
- **P3 — scoreboard + stats:** outcomes.csv convention + `outcome` mirror events +
  memory-stats.ts. Enter trunativ's real results when the founder has them.
- **P4 — the live gate:** re-run a DEPOSITED brand (trunativ or houseoftwilight) end-to-end.
  Gates: notebook injected (learned-record.md present, rules cited in seat output where used) ·
  ≥1 previously-learned preference visibly honored without being re-asked · zero new validator
  classes firing · deposit after the run updates statuses correctly (a repeat observation
  promotes hypothesis→confirmed) · edits-per-batch recorded. THEN commit the whole layer.

## §12 Open questions (decide at build time, none block P0)

1. Does the orchestrator need the FULL learned record, or founder-stated rules only? (Smaller =
   cheaper on its every-wake re-read — S156 taught us the orchestrator re-ingests everything.)
   Lean: founder-stated + contradiction-relevant only.
2. `intake_answer` verbatim vs summarized — verbatim is the diary law, but AskUserQuestion
   answers arrive structured; store the structure as-is (it IS verbatim).
3. Backfill event ids for pre-memory runs: synthesize events from trace.jsonl/verdict.json with
   `"backfill": true` — deposit model may cite them like any event. (Keeps the F33 rule intact:
   backfilled events still come from files on disk, not model memory.)
