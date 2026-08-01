# S158 — Memory architecture review + the forgetting ladder (S158 hardening batch)

**Date:** 2026-08-01 · **Continues:** `docs/SESSION_157_BRAND_MEMORY_LOOP_AND_RESEARCH_REVIEW_FIXES_2026-07-23.md`
**Status at close:** review done, three fixes built + committed + live-validated on `new-ui`.
Two of the new code paths (ladder denial, obeyed gate) are unit-proven but have not yet fired
in a live run — the next repeat-brand run exercises both. Nothing blocks the next session.

## Commits this session

```
23c1819  feat(lite): S158 — memory forgetting ladder, obeyed-gate fix, boot deposit sweep — validated live
6999c94  docs(handoff): S157 — brand-memory loop + research/review-capture fixes
```

---

## Part 1 — Architecture review: the memory loop vs published guidance

Reviewed the S157 brand-memory loop against Anthropic's context-engineering guidance
(structured note-taking / agentic memory, "smallest high-signal set", memory-surface advice
in the Fable 5 migration guide), the ACE paper (Stanford/SambaNova, arXiv 2510.04618 —
"context collapse" from iterative wholesale rewrites; itemized bullets + delta updates as
the fix), and the self-improving-agent literature (Reflexion, Voyager skill libraries,
Generative Agents reflection, Letta sleep-time consolidation).

**Verdict: the design independently matches the consensus patterns** — itemized rules with
stable ids (ACE's exact recommendation), raw diary + distilled notebook (memory stream +
reflection), staleness/tombstones (forgetting as a feature), edits-per-batch +
`LITE_MEMORY_OFF` (a measurement story most published systems lack). One place it is AHEAD
of published work: citation-enforced confidence — most systems let the model self-report
how sure it is; ours doesn't (F33).

**Gaps found, ranked:**

1. **Silent rule drops (ACE's context collapse — THE finding).** The deposit prompt says
   "rewrite it WHOLESALE" and nothing checked what *vanished*: `founderEditDiff` runs before
   the model (catches founder edits only) and `applyStalenessAndBumps` only processes what
   the model wrote. A rule the model failed to copy over simply ceased to exist — no
   tombstone, no diary event. Likeliest trigger: the 4KB cap's own denial message
   ("merge near-duplicate rules and drop the weakest hypotheses"). → **FIXED (Part 2.1)**
2. **`rule_obeyed` all-or-nothing.** One follow-up about anything blocked obeyed-checkmarks
   for every rule, so honored rules aged toward stale in any chatty run. → **FIXED (Part 2.2)**
3. **Memory learns only constraints, never wins.** `judge_ship` events sit unused; which
   hooks/formats ship clean per brand is rung-2 material (outcomes.csv → ranking). The
   research (Voyager et al.) confirms the planned path; it needs real outcome data, not code.
   → deliberately parked.
4. **No consolidation pass.** The bank-balance law means the full diary is never re-read;
   Letta-style periodic consolidation is the standard answer *at volume*. Fine at 5 brands.
   → parked.
5. **Truth vs provenance** (the S157 false-premise R5 lesson). Validators check citations
   exist, not that the world agrees. Founder eye-read stays a permanent loop step. → held.

## Part 2 — The S158 fix batch (`23c1819`)

### 2.1 The forgetting ladder + rule_dropped audit (fix for gap 1)

**The principle: forgetting follows the same law as remembering — the model proposes, code
disposes, and every removal leaves a receipt.**

- **Validator** (`memory-validate.ts`): a rewrite is diffed against the notebook the model
  was SHOWN (`priorNotebook` = on-disk pre-deposit state — founder edits included; hook now
  passes `notebookNow ?? snapshot`). A missing rule id is judged by the status ladder run in
  reverse:
  - `founder-stated` — never model-removable; only the founder retires a law (tombstone path;
    tombstoned rules are exempt from the ladder, which also prevents deadlock on hand-deleted
    notebooks).
  - `confirmed` — leaves only by MERGING: every citation must survive on some rule in the new
    write (checked mechanically). Otherwise denied.
  - `hypothesis` — droppable (cap pressure's escape valve stays open; the deposit logs it).
  - `stale` — carried verbatim; CODE retires stale rules on its own clock.
- **Deposit audit** (`memory-deposit.ts` `ruleDrops()`): every rule that left the notebook —
  model merge, model drop, or code stale-drop — appends a `rule_dropped` diary event
  (id, text, cites, reason ∈ merged/dropped/stale-aged-out). New `rule_dropped` entry in
  `EVENT_TYPES`. Audit ids fold UNDER the deposit watermark (bookkeeping, not new evidence —
  they must not re-open the next deposit). Tombstone-matched removals are excluded
  (`rule_deleted` already recorded them). Drops are recoverable (diary evidence persists,
  no tombstone); founder deletions are not — by design.
- **Prompt**: THE LAWS gained the forgetting clause so the model knows the ladder before the
  validator enforces it.

### 2.2 The obeyed-gate fix (fix for gap 2)

`memory-deposit.ts`: `hasBlockingFollowup()` — only a GLOBAL (unscoped) followup blocks the
run's rule_obeyed checkmarks; a followup naming `c<N>` specs is scoped feedback and blocks
nothing. Plus `ruleObeyedByEvidence()`: a POSITIVE mechanical rule (names a file token, no
negation words) earns a `verified: true` checkmark when the token appears in the run's
`creatives/*.json` — evidence beats inferred silence. Negation guard is load-bearing: for
"never use X", finding X means the opposite of obedience, so negated rules never qualify.

### 2.3 The boot deposit sweep (S157 open item 2)

`web.ts` `sweepDeposits()`: at server start, walk `runs/` oldest-first (run ordinals stay
chronological), deposit every run with `DONE.md`; the watermark makes already-deposited runs
a cheap skip. Closes the godesi gap (server killed post-DONE → onEnd deposit never fired).
**Rider fix the sweep exposed:** `founderEditDiff` events are now deduped against the diary —
an interrupted deposit (killed mid-model-pass) no longer re-appends the same
founder_note/rule_deleted on the next attempt (the snapshot write is the diff terminator,
and it only lands when a deposit completes).

## Part 3 — Validation

- 106 memory checks green (`npm run test:memory` — new sections [15] ladder+audit,
  [16] obeyed gate), `tsc --noEmit` clean, harvest regression unchanged (2 pre-existing
  Playwright-env failures, verified present with changes stashed).
- **Live, and a textbook close of the loop:** the sweep's first boot found that the S157
  founder hand-edit to trunativ R5 (reviews-exist correction) had never been deposited —
  the server was killed before onEnd. The sweep captured it as founder speech (E22), the
  interrupted-deposit retry appended nothing (dedupe guard: `+0 event(s)`), and the completed
  deposit **promoted R5 hypothesis → founder-stated citing [E17, E22]** — the founder's own
  edit is now the rule's receipt. $0.22, 0 denials, all 6 rules kept under the active ladder,
  idempotent on re-run and on second boot.

## Open items

1. **Ladder denial path + obeyed gate not yet live-fired** — both deterministic and
   unit-proven; the next repeat-brand run with a followup exercises them. Watch the deposit
   log for `logged N rule-drop(s) [...]` and `verified` obeyed events.
2. **F44 quote-integrity** (from S157, unchanged) — mixed-sentiment reviews are intel or
   quoted WHOLE, never fragmented. Next pipeline fix.
3. **Rung 2 (wins/outcomes)** — needs real ad results in outcomes.csv; plumbing exists.
4. **Known non-issues accepted:** `appendEvent` has no file lock (single founder, one run at
   a time; note for prod); the founder-edit diff attributes pending edits to the oldest
   swept run's id (citation currency is event id, not run — harmless).

## How to resume

- `cd lite-loop && npm run test:memory` (106 green) · `npm run stats` to see the store.
- `npm run web` — the sweep now runs at every boot; a fresh server always carries S158 code.
- Natural next moves: run a repeat brand (trunativ/godesi) to live-fire the ladder + obeyed
  gate and feed the loop, or pick up F44. Memory pointer: `project_brand_memory_loop.md`.
