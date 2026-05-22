# Session 112 — Research binder LOCKED; handoff + next steps

**Date:** 2026-05-22
**Branch:** `new-ui`
**Commits this session:** `a53c7c7` (research lock). Prior in arc: `bc8319a` (research binder + Search API), S109 `df06f14` (harness + strategy).
**Status:** Phase 1 Step 2a (research binder) **DONE + LOCKED**. This doc is the forward-looking handoff — read it first next session.

> **Companion doc:** `docs/SESSION_111_SEARCH_API_AND_SOURCING_DISCIPLINE_2026-05-21.md` holds the full narrative (Agent-API → Search-API switch, the timing diagnosis, the Haiku test, the fame-artifact disentanglement, the offer-landscape validation). This doc (112) is the *state + next-steps* summary. If 111 and 112 disagree, 112 is newer.

---

## Next session opener

> Research is locked. Pick ONE of two tracks:
>
> **Track A — make research rubric-clean first (small, ~1 session).** Knock out the 2 parked Haiku discipline gaps (the `sourced` self-check + the §7 marketing-copy guard) so research passes the rubric cleanly on Haiku, then re-run all 4 fixtures to confirm. Low risk, closes the loop.
>
> **Track B — start the next binder (bigger, the real Phase-1 work).** Move to one of the remaining 7 binders. Recommended next: **comp** (competitive scan) — it's the natural §C step after research in the 9-step loop, and it shares the Perplexity Search wrapper that's already built and proven.
>
> My recommendation: **Track A first** (it's an afternoon and leaves research truly done), then Track B. But if momentum matters more than tidiness, go straight to Track B — the parked items are documented and safe to defer.

---

## What is locked (research binder)

| Piece | State |
|---|---|
| `agent/.claude/skills/research/SKILL.md` | The binder. Search-tool discipline, offer-landscape discipline, §5/§7 anti-patterns, attribution rules, 8-section output skeleton. **Locked.** |
| `agent/.claude/skills/research/reference/hyperlocal.md` | Conditional load for city-or-tighter locales. 2 probes (locale-notes, sub-segments). **Locked.** |
| `cloudflare/eval/mini-eval/apprentices/research.ts` | AgentDefinition. **Model = `claude-haiku-4-5-20251001`** (production target, user-locked 2026-05-22). |
| `cloudflare/eval/mini-eval/mcp/perplexity.ts` | Perplexity **Search API** wrapper. `perplexity_research_batch` (array of 1-8 queries, per-query concurrent HTTP). No LLM in the loop. **Locked.** |
| `cloudflare/eval/mini-eval/rubrics/research.md` | 4 critical + 5 supporting; `maxSupportingFails: 1`. **Locked.** |
| Fixtures | `arjun-infra`, `twt`, `theratefinder`, `asitis` — 4 held-out brands across 2 countries, 3 conversion-event types, 4 verticals. |

**Validation reached:** the binder generalizes across hyperlocal Indian real estate, national D2C food, Canadian mortgage lead-gen, and Indian D2C supplements — same vocabulary, no per-vertical logic. arjun-infra passes clean on Sonnet; Haiku produces strong research everywhere but trips the 2 parked discipline gaps.

---

## Parked items — detailed, ready to execute

### 1. `sourced` self-check pass (the main one)

**Problem:** Haiku retrieves specifics (stats, prices, dates) but inconsistently appends the inline `(source, date)`. Most lines ARE cited; a minority float. Failed on twt, theratefinder, asitis (general gap, not brand-specific). The prose rule "always attribute every specific" exists in the binder but doesn't land hard enough on Haiku.

**Fix approach:** mechanical, not more prose. Add a final self-check *move* to the binder — a literal pass the apprentice runs before writing is "done":
> *"Before you finish: re-read your file and scan for every number, percentage, price, date, headcount, market-share figure, and named statistic. Each one must end with an inline (domain, date). For any that doesn't: either append the source you retrieved it from, or delete the claim. A statistic you can't attach a source to is not research — it's a guess the strategist can't defend."*

Haiku follows checklists better than principles, so framing it as a discrete end-of-run scan (not a background rule) is the bet.

**File:** `agent/.claude/skills/research/SKILL.md` — add as a closing move or strengthen "The disciplines you never break."
**Acceptance:** twt + theratefinder + asitis all pass `sourced` on Haiku.

### 2. §7 marketing-copy guard (the variance one)

**Problem:** Haiku occasionally slips finished ad copy into §7 (calendar), e.g. *"Lock in your rate before summer," "pivot to don't auto-renew — save $X/month."* The §7 anti-pattern bullet exists but holds only run-to-run (passed one theratefinder run, failed another). This is `no-marketing-copy` (critical) variance.

**Fix approach:** same mechanical shape — a §7-specific scan in the self-check: *"Scan §7 for any phrase that reads like a hook, headline, or ad line — anything in quotes that sounds like copy a customer would see. Delete it. §7 states facts (dates, weather, market windows); the strategist writes the angle, the hook writer writes the copy."*

**File:** same. Fold into the self-check move from item 1.
**Acceptance:** theratefinder passes `no-marketing-copy` on repeated runs (no variance).

### 3. AS-IT-IS soft miss — brief-named secondary line

**Problem:** the offer-landscape discipline's move 2 says "go deep on the line(s) the brief names." AS-IT-IS's brief named peanut butter as a *secondary* focus; Haiku inventoried it and flagged it as a gap rather than probing its buyer voice. Defensible (founder called it secondary) but not ideal.

**Fix approach:** one-line sharpening of move 2 — *"a brief-named line gets at least one buyer-voice probe even when secondary; only lines the brief does NOT name get the inventory-only treatment."*
**File:** the "Map the offer landscape" paragraph in `SKILL.md`.
**Acceptance:** asitis runs a peanut-butter buyer-voice probe (visible in the search logs).

### 4. Snapshot dir outside the auto-clear path

**Problem:** `results/<binder>-<date>-bets/` is wiped at the start of every run. Lost a TWT comparison snapshot to this. Reference outputs need a stable home.

**Fix approach:** save good outputs to `cloudflare/eval/mini-eval/results/_snapshots/` (the harness only clears `<binder>-<date>-bets/`, not `_snapshots/`). Optionally a tiny `--snapshot` flag on the runner, or just `cp` by hand.

### 5. TWT clean judge run

**Problem:** the post-attribution-edit TWT runs had the *judge* (Sonnet) crash twice — `Claude Code process exited with code 1`, suspected Anthropic rate-limiting after a high-volume session. We never got a clean TWT verdict post-edit (the file showed 41 citations, a big improvement, but pass/fail unconfirmed).

**Fix approach:** just re-run `research twt` cold when not rate-limited. If it crashes again at the SDK level, instrument the harness to surface the real error code instead of swallowing it into `inconclusive`.

---

## Key learnings — do not relearn these

1. **Search API, not Agent API, for grounded retrieval.** Agent API ran an internal synthesis loop (20-40s/call) whose output we discarded. Search API is raw retrieval, ~1s/call, ~20× faster. The wrapper does per-query concurrent HTTP (NOT native multi-query batching — that returns a flat truncated list with no per-query grouping, despite the docs).

2. **The wall-time bottleneck is the model, not search.** Timing instrumentation showed ~97% of run time is model thinking/generation across turns. Search is a rounding error now. Levers: faster model, fewer turns/batches, or stream progress to the user (UX).

3. **Haiku tradeoff:** ~2.5min/$0.20 (vs Sonnet ~6min/$1.34), research *quality* is strong, but it has run-to-run discipline variance on citations + §7 copy. Likely fixable with mechanical self-checks (items 1-2), not a capability ceiling.

4. **`no-fabrication` failures track brand-fame, not the binder.** Haiku recalls famous brands' specifics (TWT's hex codes) from training when retrieval fails (JS-SPA blocks WebFetch). Mid-fame brands with crawlable sites retrieve + cite correctly. Don't broadly patch for this; the narrow §5 recall-guard ("if WebFetch is empty you don't have the palette") is enough if we ever want it.

5. **Run a fresh brand before patching the binder.** After 5 TWT runs we were overfitting. Adding theratefinder + asitis disentangled fame-artifact from general-gap in one move. **When a fixture fails repeatedly, add a contrasting brand rather than tuning to the failing one.**

6. **Offer landscape is universal.** Every business has an offer set (products / services / lending types / procedures / tiers). One vertical-agnostic discipline (inventory all / deep on brief-named / gap the rest) handles all of them. The winning campaign lane is often NOT the headline offer — inventory exists for strategic optionality, not just completeness.

---

## The bigger picture — remaining Phase-1 work

Build sequence (from `docs/eval-corpus/implementation-plan.md`):

- [x] Step 0 — mini-eval harness (S109)
- [x] Step 1 — strategy binder (S109)
- [x] **Step 2a — research binder (S110-112, LOCKED)**
- [ ] **Step 2a — remaining 7 binders:** comp, rigor-rubric/critic, hook, art, ad-unit, run-plan, next-move. Each = binder (`SKILL.md`) + apprentice (`apprentices/<name>.ts`) + rubric (`rubrics/<name>.md`) + 2-4 held-out fixtures, run through the proven harness.
- [ ] Step 2b — harness engineering: orchestrator 9-step rewrite (A intake → B research → C comp → D Bet+critic → E checkpoint → F build cells ×N → G run plan → H next move → I assemble), wire apprentices, the Bet critic loop, cell code-checks.
- [ ] Step 3 — integration on staging; run the corpus.
- [ ] 🚦 GO/NO-GO gate on the floor number (22% → 50%+). Pre-launch blocker.

**Suggested next binder: `comp`** (competitive scan). It's §C — the step right after research — and reuses the Perplexity Search wrapper that's already built and proven. Per Q2/Q4 decisions it's *best-effort* (never blocking; The Bet stands on research + founder facts alone, comp only sharpens it), so it's a lower-stakes binder to build next while the harness pattern is fresh.

---

## How to resume (commands)

```bash
# from repo root
cd cloudflare

# run one fixture (fast iteration)
npx tsx eval/mini-eval/run-mini-eval.ts research arjun-infra

# run several
npx tsx eval/mini-eval/run-mini-eval.ts research theratefinder,asitis

# run all research fixtures
npx tsx eval/mini-eval/run-mini-eval.ts research

# PERPLEXITY_API_KEY is exported in the user's shell rc; the harness reads it
# from env (or repo-root .env.local). ANTHROPIC_API_KEY likewise.
```

Background runs from a fresh shell must `cd` into `cloudflare/` explicitly (the
background shell does not inherit the foreground cwd). Reports land in
`cloudflare/eval/mini-eval/results/research-<date>.md`; produced files in
`…/research-<date>-bets/` (cleared per run).

---

## File index

### Locked / committed this arc (`a53c7c7`, `bc8319a`)
```
agent/.claude/skills/research/SKILL.md ........................ the binder (locked)
agent/.claude/skills/research/reference/hyperlocal.md ......... conditional locale reference
cloudflare/eval/mini-eval/apprentices/research.ts ............. apprentice — Haiku 4.5
cloudflare/eval/mini-eval/mcp/perplexity.ts ................... Search API wrapper
cloudflare/eval/mini-eval/rubrics/research.md ................. judge rubric
cloudflare/eval/mini-eval/fixtures/research/{arjun-infra,twt,theratefinder,asitis}/
cloudflare/eval/mini-eval/run-mini-eval.ts ................... harness (+ fixture filter, + timing)
```

### Read next session
```
docs/SESSION_112_*.md (this) .................................. state + next steps
docs/SESSION_111_*.md ......................................... full narrative
docs/eval-corpus/implementation-plan.md ....................... §4.2 binder inventory, §5 build sequence
agent/.claude/skills/strategy/ ................................ the reference binder shape to mirror for the next 7
```
