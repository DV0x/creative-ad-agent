# Session 110 — Research binder built and validated; wall-time + parallelism to debug

**Date:** 2026-05-21
**Branch:** `new-ui`
**Commits:** none yet — paused before commit for next-session debug
**Goal carried from S109:** Phase 1 Step 2a — start the other 8 binders. This session built one: **research**.

---

## TL;DR

- **The research binder is built and end-to-end validated** through the mini-eval harness against two held-out fixtures (Arjun Infra hyperlocal + The Whole Truth Foods national D2C). First clean runs: 1/1 PASS then 2/2 PASS.
- **Three structural binder additions surfaced by mid-session validation:** founder-images-first for visual reality; `WebFetch` for brand's own site (preserves image URLs + returns useful palette/typography descriptions from class names + alt text); a parallel-tool-batching discipline for independent probes.
- **Empirically validated against Perplexity Agent API across ~15 test queries** during the session — surfaced the Arjun-C synthetic-Tenglish hallucination under Sonar Chat Completions (caught + designed around with Agent API + instructions block), the dignity rule (no "paste your website" asks at intake), and 5 structural blind spots (Reddit, Google Maps reviews, JS-rendered brand sites, YouTube comments, WhatsApp).
- **Two unresolved debug items the next session opens with:**
  1. **Wall-clock is too long** — ~12 min per fixture; ~24 min for 2 fixtures. Cost is fine (~$1.50-2.00 per fixture) but time is not.
  2. **Parallel-tool-batching guidance in SKILL.md isn't sticking** — Sonnet keeps running probes sequentially despite explicit instruction. Need to investigate WHY (Sonnet behavior? binder phrasing? per-call output-token cap maxing out at 4000?).
- **One regression to fix:** Arjun-Infra failed `no-marketing-copy` on the last run after the parallel-batching binder edit — apprentice slipped into strategist-overreach ("Implication for downstream creative" paragraph) and hook-in-quotes ("beat the summer heat, enquire from home"). Same shape as S109's "cracks on second run" pattern.

---

## Next session opener

> Resume research-binder debugging — **wall-time + parallelism + the Arjun regression**. Read this doc, then:
> 1. **Add per-call query logging to `cloudflare/eval/mini-eval/mcp/perplexity.ts`** — currently logs cost/tokens/sources but NOT the actual question text. We need to see what the apprentice is asking, in what order, to diagnose the parallelism failure.
> 2. **Diagnose why Sonnet isn't batching parallel `tool_use` blocks** — read the call pattern from the new logs, look at input-token deltas between calls, decide if it's a Sonnet limit, a binder phrasing issue, or something the harness can scaffold.
> 3. **Fix the Arjun regression** — tighten the §5 and §7 anti-patterns in `agent/.claude/skills/research/SKILL.md` to explicitly forbid "Implication for downstream creative" paragraphs and any campaign-timing or hook-style copy in quotation marks. Re-run; should restore Arjun to PASS.
> 4. **Decide the wall-time lever** — if parallelism stays elusive, the alternative is capping `max_output_tokens` per Perplexity call from 4000 → 2500. Several calls hit 4000 today and take ~60s each to generate; halving that could shave 3-5 min per fixture.
> 5. **Restore the fixture name:** `cloudflare/eval/mini-eval/fixtures/research/_arjun-infra/` → `arjun-infra/` (was renamed mid-session to try to skip it; the harness doesn't skip `_`-prefixed dirs).

---

## What happened (in order)

### 1. The research binder was authored

`agent/.claude/skills/research/SKILL.md` — 285 lines, under the 500-line Anthropic guidance. Same voice as the strategy binder ("detective on a case, not a Wikipedia editor"). Output skeleton: case-file header + 8 sections (claim-vs-reality, two-level buyer voice, locale, visual reality, brand identity, cost reality, calendar, gaps).

`agent/.claude/skills/research/reference/hyperlocal.md` — 128 lines, conditional load when locale depth reaches city-or-tighter. Teaches three additional probes (language register, cultural anchors, sub-culture identity).

### 2. Empirical validation against Perplexity (mid-design)

Before authoring the binder, ran ~15 Perplexity test queries against Ravila Grand Hotel, Arjun Infra, and The Whole Truth Foods to validate the architecture. Findings:

- **Agent API + `instructions` block holds the grounding discipline** where Sonar Chat Completions does not. Caught the synthetic-Tenglish hallucination on Arjun under Chat Completions — the model had been fabricating buyer language that read as verbatim. Agent API with instructions block correctly returned "verbatim voice: none found."
- **Five structural blind spots empirically confirmed:** Reddit (Anthropic + Perplexity both blocked), Google Maps reviews (Google's anti-scraping), JS-rendered brand sites (TWT site returns empty), YouTube comment threads (rendered post-page-load), WhatsApp (closed by design).
- **WebFetch outperforms Perplexity on the brand's *own* site** for image-URL preservation and palette/typography description (via inference from class names + inline styles + alt text). The production research subagent's "describe colors" pattern works because of this inference path.
- **User decision: intake stays minimal.** No "paste your website" or "send Google reviews" asks. Reference images stay as the natural founder-side input. Structural gaps are absorbed by graceful degradation in the binder, not by founder-side workarounds.

### 3. Apprentice + MCP + rubric + fixtures + harness wiring

- `cloudflare/eval/mini-eval/apprentices/research.ts` — 121 lines. Sonnet 4.6 for mini-eval (production target Haiku, deferred). Tools: `Read`, `Write`, `WebFetch`, `mcp__perplexity__perplexity_research`. WebSearch deliberately dropped.
- `cloudflare/eval/mini-eval/mcp/perplexity.ts` — 361 lines. Custom MCP server wrapping Perplexity Agent API (`POST /v1/agent`, `pro-search` preset). Standard `instructions` block baked in (gap-naming + near-miss + no-marketing-copy + no-fabrication). Filter params: `recency`, `domains_allowed`, `domains_blocked`. Returns prose ANSWER + structured SOURCES.
- `cloudflare/eval/mini-eval/rubrics/research.md` — 190 lines. 4 critical (`sourced`, `no-fabrication`, `no-marketing-copy`, `gap-named`) + 5 supporting (`claim-vs-reality`, `two-level-buyer`, `locale-depth`, `visual-reality-handled`, `cost-and-calendar`). `maxSupportingFails: 1`.
- `cloudflare/eval/mini-eval/fixtures/research/arjun-infra/` — hyperlocal tier-3 Indian real estate, thin web presence, no reference images. Stresses 5 disciplines at once.
- `cloudflare/eval/mini-eval/fixtures/research/twt/` — national D2C clean-label snacks, JS-rendered own site, rich third-party signal. Deliberate contrast to arjun-infra.
- `cloudflare/eval/mini-eval/run-mini-eval.ts` — +89 lines, all additive: added `APPRENTICES['research']`, MCP server registry, extra-files registry (copies `reference/hyperlocal.md` into work dir), per-apprentice turn/budget caps, required-env-var check (fail-fast on missing `PERPLEXITY_API_KEY`), dynamic fixture-file copying, apprentice-aware judge prompt.

### 4. First run — Arjun-Infra only (1/1 PASS)

All 9 criteria green, $1.83, ~12 min wall-clock, 8 Perplexity calls. Judge: *"This is a genuinely strong research file… the apprentice shows actual judgment in three places that typically defeat juniors — labeling the WebFetch-paraphrased testimonials as paraphrased, flagging the RERA absence as a legitimacy gap rather than silently omitting it, and resisting the temptation to invent diaspora buyer voice when none was recoverable."*

### 5. Three binder additions, based on review

Reviewing the Arjun research file together surfaced gaps in support for the downstream art director (no visual identity recovered, no image URLs surfaced). Validated empirically that WebFetch preserves image URLs even when Perplexity's `fetch_url` strips them. Added three disciplines to SKILL.md:

- §4 visual reality — *"surface discovered image URLs even when content isn't visible; the URLs themselves are evidence"*
- §5 brand identity — *"use WebFetch on the brand's own site for palette/typography description; report 'palette not recoverable from page source' honestly when the site is signal-poor"*
- "How to wield the search tool" — *"prefer WebFetch for the brand's own site; batch independent probes in parallel"*

### 6. Second run — both fixtures (2/2 PASS)

Arjun $1.95, TWT $1.51, total $3.46, ~15 min wall-clock. TWT verdict was strong: *"This is a genuinely strong research file, not a polished one that merely looks complete. The FSSAI/ASCI regulatory finding in §1 is real strategic intelligence that a junior would smooth over or miss entirely."*

§5 visual identity worked cleanly on TWT — recovered real hex codes (#5048D5, #F4EBEF, #E5E4F2) and font names (Obviously, ObviouslyNarrow, Gooddog, Verveine) from page source. The WebFetch-for-brand-site discipline landed.

### 7. Third run — testing the parallel-batching edit (1/2; regression)

Added explicit "batch independent probes in parallel" guidance to the "How to wield" section. Re-ran (intended to be TWT-only but the harness picked up `_arjun-infra` too).

**Results:**

- arjun-infra: **FAIL on `no-marketing-copy`** — apprentice slipped into strategist-overreach ("Implication for downstream creative" paragraph in §5) and ad-copy-in-quotes ("beat the summer heat, enquire from home" in §7's calendar).
- twt: PASS at $1.44, 4 Perplexity calls (down from 6).
- **Wall-clock: ~24 min** for both fixtures (was ~15 min). Got *slower*, not faster.

**Why parallel batching didn't deliver:**

- Input-token patterns across TWT's 4 calls suggest sequential execution (input counts vary widely: 19k, 20k, 3.9k, 10k — parallel calls would share a starting context).
- Two TWT calls hit `max_output_tokens=4000`, each taking longer to generate; this is probably most of the wall-time regression.
- Sonnet 4.6 doesn't naturally batch tool calls even when explicitly told to. Either the binder phrasing is too soft, or Sonnet's training favours single-tool-per-turn for tool selection robustness.

---

## Decisions locked this session

| Topic | Decision |
|---|---|
| Research apprentice identity | Performance-marketing research analyst — "detective on a case, not a Wikipedia editor" |
| Output structure | Case-file header + 8 sections (claim/reality, two-level buyer, locale, visual, identity, cost, calendar, gaps) |
| Primary research engine | Perplexity Agent API via `mcp__perplexity__perplexity_research` (sonar-pro preset, custom MCP wrapper at `cloudflare/eval/mini-eval/mcp/perplexity.ts`) |
| Standard `instructions` block | Embedded in MCP wrapper; never user-overridable; enforces gap-naming + near-miss + no-marketing-copy + no-fabrication |
| WebFetch role | Primary for the brand's own site (text + image URLs + palette/typography via inference); secondary elsewhere |
| Locale depth | Dial; hyperlocal triggers `reference/hyperlocal.md` and three additional probes (language register, cultural anchors, sub-culture identity) |
| Visual reality input | Founder-supplied reference images primary; named gap when absent; no "paste your website" or "send Google reviews" asks at intake |
| Worked-examples.md | NOT authored (avoids the S109 leakage pattern at source) |
| Rubric structure | 4 critical + 5 supporting; `maxSupportingFails: 1` |
| Apprentice model | `claude-sonnet-4-6` for mini-eval (matches strategy); Haiku-downgrade test deferred per implementation plan §3 |
| Per-fixture caps | maxTurns: 40, maxBudgetUsd: $2.50 |
| WebSearch in apprentice tools | Dropped (Perplexity covers grounded retrieval more reliably) |

---

## Unresolved — debug queue for next session

### 1. Wall-clock is too long

- Two fixtures in ~24 min (12-15 min per fixture) is unacceptable for iteration cadence.
- Cost is fine (~$1.50-2.00 per fixture) — the issue is time, not money.

### 2. Parallel-tool-batching isn't happening

- Added explicit binder instruction; Sonnet still runs sequentially.
- Need per-call timing + query logging to verify what's actually being batched (if anything).
- Currently the MCP wrapper logs `cost / input / output / sources` to stderr but NOT the question text or call timestamp.

### 3. The Arjun no-marketing-copy regression

- Strategist-overreach in §5 ("Implication for downstream creative") and ad-copy-in-quotes in §7 ("beat the summer heat, enquire from home").
- Same shape as S109's strategy-binder cracks. Standard iteration target.
- Fix: tighten §5 and §7 with explicit anti-patterns. Re-run, should restore PASS.

### 4. Carry-over harness polish from S109 (still open)

- `results/<binder>-<date>-bets/` clears per-run for research (good) but the strategy path may still accumulate stale files.
- A judge *infra* failure currently reads as `fail`; should read `inconclusive`.

---

## File index

### Created this session
```
agent/.claude/skills/research/SKILL.md ........................ 285 lines, the binder
agent/.claude/skills/research/reference/hyperlocal.md .......... 128 lines, conditional load
cloudflare/eval/mini-eval/apprentices/research.ts .............. 121 lines, AgentDefinition
cloudflare/eval/mini-eval/mcp/perplexity.ts .................... 361 lines, Perplexity MCP wrapper
cloudflare/eval/mini-eval/rubrics/research.md .................. 190 lines, judge rubric
cloudflare/eval/mini-eval/fixtures/research/arjun-infra/ ....... held-out hyperlocal fixture
cloudflare/eval/mini-eval/fixtures/research/twt/ ............... held-out national D2C fixture
cloudflare/eval/mini-eval/results/research-2026-05-21*.md ...... three run reports + produced files
docs/SESSION_110_*.md .......................................... this file
~/.claude/.../memory/feedback_keep_responses_short.md .......... new user-preference memory
```

### Modified this session
```
cloudflare/eval/mini-eval/run-mini-eval.ts ..................... +89 lines all additive; strategy run path unchanged
~/.claude/.../memory/MEMORY.md ................................. +1 line pointing at the new feedback memory
```

### Reference files for next session
```
agent/.claude/skills/research/SKILL.md ......................... the binder (next session edits §5 + §7 + revisits parallel-batching para)
cloudflare/eval/mini-eval/mcp/perplexity.ts .................... add per-call query logging here
cloudflare/eval/mini-eval/results/research-2026-05-21-bets/    .. inspect produced files to see overreach patterns
docs/SESSION_109_*.md .......................................... the strategy-binder validation we mirrored
docs/eval-corpus/implementation-plan.md ........................ Step 2a build sequence (this is one of 8 binders)
```

---

## Punch list — redesign workflow

- [x] Step 0 — mini-eval harness (S109)
- [x] Step 1 — strategy binder + mini-eval (S109)
- [x] **Step 2a — research binder (this session)** — built and 2/2 validated; debug pending for wall-time + parallelism
- [ ] Step 2a — the remaining 7 binders (comp, rigor-rubric/critic, hook, art, ad-unit, run-plan, next-move)
- [ ] Step 2b — harness engineering (orchestrator 9-step rewrite, wire apprentices, Bet critic loop, cell code-checks)
- [ ] Step 3 — integration on staging; run the corpus
- [ ] 🚦 GO/NO-GO gate on the floor number (22% → 50%+)
