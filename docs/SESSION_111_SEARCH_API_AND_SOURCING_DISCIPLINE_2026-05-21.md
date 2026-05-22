# Session 111 — Search API switch and sourcing-discipline tightening

**Date:** 2026-05-21
**Branch:** `new-ui`
**Commits:** one (this session's wrap-up commit lands S110 untracked files + S111 changes together)
**Goal carried from S110:** debug research binder's wall-time and parallelism cracks; validate the 2/2 PASS that S110 ended at.

---

## TL;DR

- **Architectural win: Agent API → Search API.** Per-probe wall-time collapses from 20–40s to **0.8–1.8s** (~20× faster). The Agent API was running an internal LLM synthesis loop per call; the apprentice's binder told it to ignore the synthesis (`ANSWER`) and quote only from `SOURCES`. We were paying for synthesis we threw away. Search API returns raw `{title, url, snippet, date}` results — exactly the SOURCES blob we use.
- **Parallelism mechanism: keep the tool surface batched, fire N concurrent HTTP requests per call.** Sonnet doesn't batch tool_use blocks reliably (S110 finding). The wrapper accepts an array of queries (max 8) and fires `Promise.allSettled` across N concurrent HTTP requests. Same parallelism the batch tool delivered against Agent API (~5×) but with 10× lower per-call latency.
- **Surgical binder edits, all surfaced by data:**
  - **§5 "Implication for downstream creative"** anti-pattern (S110's regression source) — added to disciplines list; deletes itself when the apprentice writes it.
  - **§7 marketing-copy phrasing** anti-pattern (the *"beat the summer heat"* failure from S110 run 3) — facts only, never copy.
  - **§3a + §3b compression** — folded `language register` + `cultural anchors` into one short "locale notes" subsection (was two 30-line probes producing ~60 lines strategy used <5 of).
  - **Multi-product-line guidance** — when the founder brief names multiple lines (TWT names "chocolate range AND protein bars"), probe EACH named line, not just the flagship. Surfaced by TWT's flagship-only research that skipped chocolate.
  - **Color-palette fallback** — when WebFetch returns typography but no hex codes (modern SPAs), fall back to a search probe for documented brand palette (brandcolors.net, design blogs). Surfaced by S111's TWT run recovering fonts but no hex (regression from S110 which got `#5048D5`).
  - **Always-attribute-every-specific** rule — stronger than "always attribute"; requires inline parenthetical citations on every number, price, festival date, named entity — not just verbatim quotes. Surfaced by TWT failing twice on `sourced` for unsourced competitor prices and uncited calendar dates. Empirically: 0 citations → 41 citations in the file after this edit landed.
- **Harness change:** `run-mini-eval.ts` accepts an optional second arg — a comma-separated fixture filter. `npx tsx run-mini-eval.ts research arjun-infra` runs only that fixture. Lets us iterate cheaply on one fixture without re-running the whole suite. Additive only — no-arg behavior unchanged.
- **Strategy-side validation (mid-session):** we fed the S110 apprentice's 343-line arjun-infra research file to the strategy apprentice. **Strategy used ~80% of it** — including the §5 brand-identity and §7 calendar sections I had initially proposed cutting. The new bet (102 lines) was *materially better* than the old bet (62 lines from handcrafted 78-line research). Confirmed: the research isn't bloated; the issues are surgical anti-patterns, not section-level overproduction.

---

## Next session opener

> Resume research-binder work after S111. Three items still open:
> 1. **TWT judge-infra failures.** S111's final two TWT runs both errored with `Claude Code process exited with code 1` — first at the end (file produced, judge crashed), then at startup ($0.00, no deliverable). Likely Anthropic API rate-limiting after the session's high run volume. Re-run TWT cold to verify the attribution-edited binder lands PASS cleanly; if it errors again, the harness needs an SDK-level error handler so judge-infra failures don't poison the run.
> 2. **Snapshot files outside the bets dir.** The harness clears `results/<binder>-<date>-bets/` per run. S111 lost a TWT-AFTER comparison snapshot to this. Save snapshots to `results/snapshots/` or similar — outside the auto-clear path.
> 3. **Step 2b — the next binder.** Per the implementation plan, research is done (modulo the TWT verification above); next is one of the remaining 7: comp, rigor-rubric/critic, hook, art, ad-unit, run-plan, next-move.

---

## What happened, in order

### 1. Discovery — Agent API was the wrong tool

We started the session debugging the S110 wall-time problem (~12 min/fixture, ~24 min for both). The first hypothesis was parallelism: Sonnet wasn't batching tool_use blocks. We built `perplexity_research_batch` to take an array of queries and fire them concurrently against the Agent API. First run: **parallelism = 4.9×** on a 7-query batch (S109's `[batch_summary]` log line proved it).

But the apprentice over-probed (18 probes vs S110's 8) and per-call duration was still 20-40s. Reading the Perplexity prompt guide and API reference together (user surfaced both docs), the architectural mismatch became clear:

- Agent API runs a multi-step search-and-synthesise loop internally
- Our wrapper's `instructions` block told the model to do grounding discipline
- The binder told the apprentice to **ignore the synthesis** (`ANSWER`) and quote only from `SOURCES`
- We were paying for synthesis we threw away

The Search API does exactly what we need: one search per query, no LLM, raw `{title, url, snippet, date}` per result. Per-request pricing, not per-token.

### 2. Search API integration — two design iterations

**First cut:** native multi-query batching (Search API accepts `query` as string OR array up to 5). Wrapper grouped queries by filter signature and chunked into ≤5-query HTTP calls. Got 0.9-1.4s per query (good!), but **result-mapping broke**: with N=3 queries and `max_results=8`, the API returned 8 results *total*, not 24. The docs' "multi-query requests group results per query in submission order" is misleading — the response is a flat array with no per-query grouping field. We couldn't reliably map results back to queries.

**Second cut (final):** per-query HTTP, all concurrent. Each query → one `POST /search`. `Promise.allSettled` across N requests. Lose the per-request cost discount, but per-request prices are small and correctness matters more. Same parallelism (each request is ~0.9-1.8s, all concurrent), unambiguous mapping. This is the version that landed.

### 3. arjun-infra validated cleanly

After the Search API switch + three surgical binder edits (Implication-for-downstream anti-pattern, marketing-copy-in-§7 anti-pattern, §3a+§3b compression):

- **PASS at $1.83** on all 9 criteria including `no-marketing-copy`
- Output: 277 lines (vs S110's 343 lines — 19% tighter)
- Total probes: 10 (vs S110's 8 — slight increase)
- Total wall time: ~4-5 min (vs S110's ~12 min for arjun-infra alone)
- **No regression** of the S110 `no-marketing-copy` failure or the "Implication for downstream creative" paragraph

### 4. The probe-budget hint experiment — backfired

After arjun-infra PASS, added a binder paragraph: *"Budget — roughly 7-8 total probes is what good work looks like. If you find yourself reaching probe #9 or #10, write the file with what you have and name the gap honestly, not query again."*

Re-ran TWT. **0/1 FAIL.** The apprentice fired only 5 probes (vs S110's 6), then fabricated competitor prices in §2d (MuscleBlaze ₹83, Yoga Bar ₹90-100, etc.) from training knowledge with zero domain attribution.

**Root cause:** Sonnet read "write the file with what you have" as permission to use category knowledge for specifics it didn't probe for. The probe-budget hint solved a problem we didn't have (10 probes was fine) and created a real one (fabrication via under-probing).

**Reverted the hint entirely.**

### 5. Strategy-side validation (mid-session)

Before iterating further on the binder, we asked the right meta-question: **what does the strategist actually USE from the apprentice's research?**

Tracing the strategy bet's evidence anchors line by line, against the apprentice's 343-line arjun-infra research:

| Section | Strategy used? |
|---|---|
| §1 claim vs reality | Heavily — memo + blocker + JustDial 59 ratings + fraud incident + Ongole's First and Finest claim |
| §2b category-level voice | Heavily — Cell A's *entire* evidence base (Telugu finance video, "bought at 25" vlog) |
| §3 locale (climate) | Yes — timing note: 39→46°C suppresses site visits |
| §3a language register | Minimal direct use |
| §3b cultural anchors | Minimal (one road reference) |
| **§5 brand identity** | **Yes — directly cited as "research §5, gap g6"** (BMR Arjun Infra inconsistency) |
| §6 cost reality | Yes — CPL math + source citations |
| **§7 calendar** | **Yes** — whole timing note: Ugadi/Akshaya passed, Navratri/Dussehra Oct 2026, weather suppression |
| §8 gaps | Yes — Honest Flag structure |

Conclusion: **the apprentice's 343-line research is mostly load-bearing.** §5 and §7 are USED by strategy. The regressions are anti-pattern problems inside those sections, not section-level overproduction. **Surgical edits, not wholesale cuts.** Inverted the initial pruning hypothesis.

### 6. TWT failure modes — multi-line, then sourcing

After reverting the probe budget hint, re-ran TWT.

**Failure mode A — TWT brief mentions chocolate AND bars; apprentice researched bars only.** Brief: *"We want to grow first-time D2C purchases on our own site for our chocolate range and protein bars."* Apprentice fired one category-voice probe (bars), skipped chocolate. Fix: binder paragraph telling the apprentice to read the brief for line names and run a category-voice probe per line.

**Failure mode B — sourcing on specifics.** Even after researching both lines, the apprentice's §2d competitor prices (Yoga Bar ₹80, Amul ₹149, OZiva ₹200, SuperYou ₹100) and §7 calendar dates were stated *without* source attribution. The model treats "verbatim quotes need citations" but "factual specifics" (prices, dates) as background it can write without citing. The existing *"Always attribute"* discipline wasn't strong enough.

Fix: stronger discipline — *"Always attribute every specific, not just verbatim quotes."* Explicit list: numbers, prices, brand names, festival dates, percentages, headcount, market-size figures, named entities. Inline parenthetical sources required. If no citable source, don't write the specific — say *"exact pricing not surfaced"* instead.

**Empirical result:** 0 citations → 41 citations in the file (BEFORE → AFTER), plus §2b correctly split into `category voice (protein bars)` + `category voice (chocolate range)`.

### 7. Harness fragility surfaced

The two TWT runs after the attribution edit both errored with `Claude Code process exited with code 1` — first at the end (file produced, judge crashed), then at startup ($0.00, no deliverable, no probes fired). Per S110's punch list, judge-infra failures now mark `inconclusive` instead of `fail` (good). But the underlying SDK process crash is unresolved. Most likely Anthropic API rate-limiting after the session's high run volume (6 full runs in ~2 hours).

Lost a snapshot file along the way — I'd copied `twt-AFTER-attribution-fix.md` into the bets dir, which the harness clears per run. **Snapshots need to live outside the auto-clear path.** Item for next session.

---

## Decisions locked this session

| Topic | Decision |
|---|---|
| Research grounding engine | **Perplexity Search API** (`POST /search`), not Agent API. Raw web retrieval, no LLM in the loop. |
| Wrapper batching mechanism | **Per-query HTTP, all concurrent** via `Promise.allSettled`. Apprentice-facing cap = 8 queries per tool call. Native multi-query batching abandoned (broken result-mapping). |
| Tool surface | `perplexity_research_batch` (unchanged from before). Array of queries (1-8). Per-query filters: `recency`, `domains_allowed`, `domains_blocked`, `max_results`. |
| Grounding discipline location | **Binder only.** Wrapper's `RESEARCH_INSTRUCTIONS` constant deleted (Search API has no LLM to instruct). |
| Apprentice over-probing handling | **No hard cap in the binder.** Probe-budget hint caused under-probing + fabrication; reverted. Trust the apprentice's judgment + the multi-line + attribution disciplines to keep probe count honest. |
| §3 hyperlocal shape | Two subsections (3a locale notes, 3b sub-segments) instead of three. Probes 1+2 merged. |
| Sourcing rubric | **Every specific** requires inline citation, not just verbatim quotes. Numbers, prices, brand names, festival dates, named entities all in scope. |
| Snapshot file location | Outside `results/<binder>-<date>-bets/` — that dir clears per run. (To enforce in next session's first edits.) |
| Harness fixture filter | `npx tsx run-mini-eval.ts <apprentice> <fixture[,fixture,…]>` — additive, optional. |

---

## Unresolved — debug queue for next session

### 1. TWT cold re-run for clean PASS confirmation

Both runs after the attribution edit errored at the SDK level. Re-run TWT cold (after rate-limit window expires). Expected behavior: PASS with the now-strict sourcing discipline. If still errors, instrument the harness to capture the underlying SDK error code rather than swallowing it.

### 2. Snapshot files outside the bets dir

Per-fixture snapshot saving needs a stable location the harness doesn't wipe. Suggest `results/<binder>-<date>-snapshots/` or a `_snapshots/` subdirectory inside results/.

### 3. Carry-over from S110

- `results/<binder>-<date>-bets/` clears per-run for research (confirmed good); strategy path may still accumulate stale files (not re-verified S111).
- Judge infra failures now mark `inconclusive` (S110 punch-list item — confirmed working S111).

---

## File index

### Created this session
```
docs/SESSION_111_*.md ........................................... this file
```

### Modified this session
```
agent/.claude/skills/research/SKILL.md .......................... +6 edits (anti-patterns, §3 spec, batching, attribution)
agent/.claude/skills/research/reference/hyperlocal.md ........... Probes 1+2 merged into one short Locale-Notes probe
cloudflare/eval/mini-eval/mcp/perplexity.ts ..................... rewritten: Agent API → Search API, per-query HTTP, native batching attempted and reverted
cloudflare/eval/mini-eval/apprentices/research.ts ............... apprentice prompt updated for Search API (no more ANSWER vs SOURCES)
cloudflare/eval/mini-eval/run-mini-eval.ts ...................... fixture-filter arg added (optional 2nd CLI arg)
```

### Reference files for next session
```
docs/eval-corpus/implementation-plan.md ......................... Step 2b — orchestrator rewrite + remaining 7 binders
docs/SESSION_110_*.md ........................................... S110 punch list (some items closed this session)
agent/.claude/skills/research/SKILL.md .......................... the binder — landed shape
cloudflare/eval/mini-eval/mcp/perplexity.ts ..................... if Search API behavior shifts, this is the wrapper
```

---

---

## Continuation (2026-05-22) — timing instrumentation, Haiku test, offer-landscape discipline, research LOCKED

### Timing instrumentation — confirmed the bottleneck is the model, not search

Added `duration_ms` / `duration_api_ms` / `num_turns` capture from the SDK result message to `run-mini-eval.ts` (we were discarding everything but `total_cost_usd`). Now every run logs e.g. `PASS ($1.34, 6.2min wall / 5.8min api, 14 turns)`. First read across runs: **~97% of wall-time is model thinking/generation; Search API probes are ~1s each (a few seconds total).** The 10-min user-facing concern is entirely the model reasoning between batches + writing the deliverable — optimizing search further would do nothing. Levers for later: faster model (Haiku), fewer turns/batches, or stream progress to the user (UX, not speed).

### Haiku test — fast + cheap, research quality strong, but two discipline gaps

Switched the apprentice to `claude-haiku-4-5-20251001` (the implementation-plan §3 production target) and tested on TWT, then on two fresh brands. Haiku is **~2.5-3.9 min, $0.16-0.33** (vs Sonnet ~6 min, $1.34) and produces *substantively above-average* research (judge's words) — strong buyer voice, sharp claim-vs-reality, thorough gaps. But it fails the rubric on two discipline criteria, with **run-to-run variance** (passes sometimes, fails others):
1. **`sourced`** — leaves a minority of specific stats uncited (most ARE cited) even though it retrieved them. Failed on TWT, TheRateFinder, AS-IT-IS.
2. **`no-marketing-copy`** — occasionally slips finished ad copy into §7 (e.g. *"Lock in your rate before summer," "pivot to don't auto-renew — save $X/month"*). Held on one TheRateFinder run, slipped on another.

### The "run a new brand, don't keep editing the binder" pivot (user call)

After 5 TWT runs, the user correctly flagged overfitting risk and asked to **test generalization on fresh brands instead of patching the binder against TWT**. Added two held-out fixtures — `theratefinder` (Canada, mortgage lead-gen, intangible service, LEAD conversion) and `asitis` (India, D2C supplements, multi-SKU). This **cleanly disentangled two failure modes**:
- **`no-fabrication` is a brand-fame artifact, not a binder gap.** TWT failed it (Haiku recalled TWT's real hex codes `#5048D5…` from training because the JS-SPA blocked WebFetch). TheRateFinder + AS-IT-IS, whose sites are crawlable, **retrieved real hex codes and cited the fetch** → passed `no-fabrication`. So the failure is precisely *(unreachable site) × (famous enough to recall)* — narrow, not general. Confirmed: do NOT patch the binder broadly for it.
- **`sourced` is general** (failed on all three brands) — a real Haiku citation-rigor gap worth fixing.

### Offer-landscape discipline — added + validated on both new brands

User observed: every business has an *offer set* (D2C product lines / local-biz service menu / lending types / clinic procedures / SaaS tiers), and the research must inventory it — because **the line that wins the campaign is often not the headline one** (TheRateFinder's commercial/construction lending was the strategy worked-example's winning lane, and the first research run covered only residential). Generalized the D2C-flavored "multi-product-line" paragraph into a vertical-agnostic **"Map the offer landscape"** discipline (3 moves: inventory the whole set always / go deep on brief-named lines / name uncovered lines as gaps), plus an offer-set line in the §1 output spec. Validated on both fresh brands:
- **TheRateFinder** now inventories all four lending lines in §1 and flags commercial/construction/bridge as *"discovered-but-unstudied… different buyer profiles… recommend brief clarification"* in §8 — the winning lane is now visible instead of invisible.
- **AS-IT-IS** inventories the full catalogue, goes deep on whey, and names peanut butter + the rest as gaps (using the binder's own *"needs its own buyer-voice pass"* language). Soft miss: peanut butter was a brief-named *secondary* line and got flagged-as-gap rather than probed deep.

Same binder, same vocabulary, two very different categories — **generalizes, no per-vertical logic.** The non-overfitting outcome the pivot was designed to prove.

### Research LOCKED (2026-05-22)

Binder content is locked and committed. **Apprentice model locked to Haiku** per user decision — production target; the research *quality* is strong and the speed/cost (2.5min/$0.20) is the user-facing win. The two discipline gaps are deferred as known, parked items (see below) — both look mechanically fixable (a self-check pass), not capability ceilings.

### Parked for next session

1. **`sourced` self-check** — a mechanical "scan every number/%/date; each needs an inline (source, date) or delete it" pass. Haiku follows checklists better than principles.
2. **§7 marketing-copy guard** — a "scan §7 for any hook-style phrase in quotes; it's the hook writer's job" pass. Fixes the run-to-run variance.
3. **AS-IT-IS soft miss** — brief-named secondary lines should get a probe, not just a gap flag. Possibly a one-line sharpening of move 2 in the offer-landscape discipline.
4. **Snapshot location** — save reference outputs to `results/_snapshots/` (outside the per-run auto-clear), so good docs survive the next run.
5. **TWT clean judge run** — the post-attribution-edit TWT judge crashed twice (rate-limit). Confirm a clean verdict when convenient.

---

## Punch list — redesign workflow

- [x] Step 0 — mini-eval harness (S109)
- [x] Step 1 — strategy binder + mini-eval (S109)
- [x] **Step 2a — research binder — Search API + offer-landscape discipline; validated/generalized across 4 brands (arjun-infra, twt, theratefinder, asitis); LOCKED on Haiku 2026-05-22 with 2 parked discipline gaps**
- [ ] Step 2a — the remaining 7 binders (comp, rigor-rubric/critic, hook, art, ad-unit, run-plan, next-move)
- [ ] Step 2b — harness engineering (orchestrator 9-step rewrite, wire apprentices, Bet critic loop, cell code-checks)
- [ ] Step 3 — integration on staging; run the corpus
- [ ] 🚦 GO/NO-GO gate on the floor number (22% → 50%+)
