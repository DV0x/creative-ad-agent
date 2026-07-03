# Session 116 — Clean gold-standard chain: Sonar switch, apprentice→Sonnet, territory-not-treatment trim

**Date:** 2026-05-26
**Branch:** `new-ui` (all changes uncommitted)
**Status:** DONE for this session. The DailyObjects upstream chain (research → comp → strategy) is built, audited, and **fact-clean end-to-end**. Three architectural decisions locked + made. **Next session = BUILD THE CELL** (the actual Step-F goal) — exact steps in the last section.

> **Read first:** this doc → `docs/SESSION_115_CELL_GOLD_STANDARD_NOISE_PIPELINE_2026-05-25.md` (the cell conceptual spine — **still fully valid**, substitute DailyObjects for Noise) → `docs/SESSION_114_*` (the cell kickoff). The Bet/chain files are in `cloudflare/eval/mini-eval/results/*-2026-05-26*`. Memory: `project_eval_sonar_switch_and_apprentice_model.md` (new this session), `feedback_binder_teaches_thinking_not_looking.md`, `project_first_principles_redesign.md`.

---

## What this session was

We set out to build the cell gold standard (S115's mandate) on a **real, fresh end-to-end chain** for **DailyObjects** (gold-standard #1, replacing the retired Noise). We never reached the cell hand-build — because running the chain surfaced two real pipeline bugs and one binder-design flaw, all of which we fixed and validated first. The cell build is now teed up on a clean chain.

The session's through-line, and its most valuable lesson: **three times a binder already forbade exactly what the output did.** That tells you the failure is *not* a missing rule. Twice it was a model-capability ceiling (fixed by a better model); once it was a binder *contradiction* (fixed by removing the contradiction). Don't pile on prose when the rule already exists.

---

## The clean chain — what's on disk (the gold-standard upstream)

All three deliverables are audited fact-clean. The cell consumes these:

| Stage | File | Produced by | State |
|---|---|---|---|
| Research | `results/research-2026-05-26-bets/dailyobjects.md` | Sonar retrieval + **Haiku** apprentice | Fact-clean (₹320cr ARR correct, real prices ₹899–1,999, premium-vs-quality gap on attributed MouthShut reviews). Judge FAILED on ONE cosmetic §7 ad-line; **user chose to keep it**. |
| Comp | `results/comp-2026-05-26-bets/dailyobjects.md` | Sonar + ScrapeCreators + **Sonnet** apprentice | Clean **8/8**. Real rivals (Souled Store, Bewakoof, Mokobara live ads; Chumbak/CaseNation zero-ad = channel signal), durability + "designed in India" white space, behavioural-proxy read. |
| Strategy (The Bet) | `results/strategy-2026-05-26-bets/dailyobjects.md` | **Sonnet** apprentice, **trimmed** binder | PASS (4/4 criticals). Diagnoses real blocker = **unproven trust**; scopes to **bags**; exemplary honesty-fork (cases held until quality fixed). `angles` now fails on *residual* treatment-leak (see Decision 3). |

Fixtures (the inputs each stage read) live at `fixtures/{research,comp,strategy}/dailyobjects/`. Reference images (real, AVIF→PNG): `fixtures/research/dailyobjects/reference-images/{daily-classic-case-sage.png, lagoon-basalt-tote.png}`.

**Seed design:** `founder-facts.md` is deliberately **vague/URL-first** (no conversion event, budget, AOV, or SKU list) — to force *discovery* over brief-decoration and mirror real production intake. `meta.json` `shape`/`notes` are internal-only (never shown to apprentice/judge; only `meta.date` leaks as "today").

---

## Three decisions locked + made this session

### Decision 1 — Retrieval: Perplexity **Search API → Sonar Pro** (direct `/chat/completions`)
**Trigger:** a live provenance audit of research run #1 caught a fabrication — *"₹200cr revenue, bags = 40% of revenue."* Both false: ₹200cr was the founder's **family shoe business**; the real 40% was **Tier-3/4 demand**. The number "looked right," wore a citation, and was wrong.
**Root cause:** the Search API returns context-free **snippets** that strip a number's *subject*; a model re-binds the figure to the nearest plausible subject. **A snippet's subject is the first thing it loses.**
**Fix:** `mcp/perplexity.ts` rewritten to call `sonar-pro` (`/chat/completions`, `search_context_size: high`) — **NOT** the Agent API (the expensive multi-step one S111 moved off). Each query now returns a context-preserving **ANSWER** + `search_results` for attribution. Added a **system prompt** enforcing subject-binding at the retrieval layer. Both binders + both apprentice identity prompts updated (the old "Search API / no synthesis / quote from snippets" text was the *cause* — line ~207 of the research binder literally said "read from search_results, never the prose answer," which threw away the context). Added a **subject-binding rule** to both binders.
**Validated:** research re-run → fabrication gone (₹320cr ARR, correctly bound). Cost: ~$0.30/run Perplexity (was ~$0); worth it.

### Decision 2 — research + comp apprentices: **Haiku 4.5 → Sonnet 4.6**
**Trigger:** comp on Haiku failed 3 critical criteria the binder **already forbids explicitly**: finished hooks in the white-space section; a **pixel claim about competitors** that was actually DailyObjects' OWN site photography re-attached to "all competitors"; an **invented unsourced rival ("AMYRA")**. Research on Haiku also leaked a finished ad line (§7).
**Diagnosis:** all model-capability-shaped, not binder-shaped (the rules exist, the model slipped). The apprentice files' own comments **prescribed this swap "to isolate."**
**Fix:** bumped both apprentices to `claude-sonnet-4-6`.
**Validated:** comp re-run on Sonnet → clean **8/8**; AMYRA gone (0 occurrences), no pixel claims, no hooks. Same binder + fixture, only the model changed → proves it was a Haiku ceiling.
**OPEN:** production economics — Sonnet-per-seat (reliable, ~$1.18/comp + ~$1/research) vs keep Haiku for cost + a **deterministic lint gate** (catch hooks / pixel-adjectives-on-competitors / brand-not-in-sources mechanically). Not decided.

### Decision 3 — Strategy binder: **"territory, not treatment"** trim
**Trigger:** the strategy Bet (even clean, on Sonnet) art-directed — each angle's "visual lane" specified medium, palette (Lagoon/sage/teal), props (rain-wet surface, crowded metro), filters, typeface. That's the cell's job.
**Diagnosis — it's the binder, not the model.** §164 *defined* the lane AS "the mood, the **treatment**, the energy"; §172 ordered "assign **treatments** within the brand's identity system"; the rubric `angles` criterion **rewarded** "different visual treatments." The binder conflated *guarantee cross-cell distinctness* (legit, needs the widest view → strategist) with *specify the treatment* (overreach → cell's job).
**Fix (edits made):**
- `agent/.claude/skills/strategy/SKILL.md` §162–174 rewritten: strategist assigns **TERRITORY** (what the visual must *prove* + what to *differentiate from* + *register*) + **MANDATORIES** (showcase real product; respect a strong existing identity) — and **drops treatment** (medium/palette/props/type/layout = the cell's). Distinctness now comes from **distinct territory per cell**, not art-direction. Added explicit guard: *"if you catch yourself writing 'rain-wet surface, Lagoon-blue, no filters,' stop — you're art-directing blind."* Also fixed lines 158 + 185 (lane→territory).
- `rubrics/strategy.md` `angles` criterion: now **FAILS** treatment-drift (was rewarding it).
**Validated (informative, not clean):** strategy re-run → still PASS (criticals); **but `angles` now FAILS on residual treatment-leak** ("seams, zipper pulls"; "rain on a crowded street"). Two takeaways: (a) the **rubric fix works** — judge flipped from rewarding to penalizing treatment; (b) the **binder fix cut drift sharply but not to zero** — Sonnet still lands in the *fuzzy middle* of the territory/treatment boundary. **The cell's authority is what resolves the residual** (the cell overrides leaked treatment) — which is precisely what the next-session cell build should *demonstrate*.

---

## Files changed this session (uncommitted on `new-ui`)

- `cloudflare/eval/mini-eval/mcp/perplexity.ts` — Sonar Pro rewrite (header documents the S111→S116 reversal)
- `cloudflare/eval/mini-eval/apprentices/research.ts` — tool desc + model→sonnet
- `cloudflare/eval/mini-eval/apprentices/comp.ts` — tool desc + model→sonnet
- `agent/.claude/skills/research/SKILL.md` — Sonar reframe + subject-binding rule
- `agent/.claude/skills/comp/SKILL.md` — Sonar reframe + subject-binding rule
- `agent/.claude/skills/strategy/SKILL.md` — territory-not-treatment trim
- `cloudflare/eval/mini-eval/rubrics/strategy.md` — `angles` criterion enforces territory-not-treatment
- NEW fixtures: `fixtures/{research,comp,strategy}/dailyobjects/` (+ reference-images)
- NEW results: `results/{research,comp,strategy}-2026-05-26*`

(Per `feedback_no_commits_until_tested`: validated via evals, but not committed — left for the user's call.)

## Harness / env mechanics (carry forward)

- Run from `cloudflare/`: `npx tsx eval/mini-eval/run-mini-eval.ts <apprentice> <fixture>`.
- **Stale-key gotcha:** the shell exports a STALE `PERPLEXITY_API_KEY` (shadows `.env.local`; harness loader only fills a key if not already in env). Use the **per-run override** for research/comp:
  `PERPLEXITY_API_KEY="$(grep '^PERPLEXITY_API_KEY=' ../.env.local | head -1 | cut -d= -f2- | tr -d '\n"')" npx tsx …` (add `SCRAPECREATORS_API_KEY="$(grep …)"` for comp). The user opened `~/.zshrc` this session and may have removed the stale export — **re-check** before next run; if removed, no override needed. Validate a key: `curl -s -o /dev/null -w "%{http_code}" -X POST https://api.perplexity.ai/chat/completions -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{"model":"sonar","messages":[{"role":"user","content":"test"}]}'` → 200.
- Strategy needs **no** web keys (canned files). research → PERPLEXITY; comp → PERPLEXITY + SCRAPECREATORS.
- Models now: research + comp = **Sonnet 4.6** (was Haiku); strategy = Sonnet 4.6; judge = Sonnet 4.6. Opus 4.7 incompatible with the pinned SDK.

---

## Open decisions / carry-forward

1. **Production economics (Decision 2 tail):** Sonnet-per-seat vs Haiku + mechanical lint gate. The recurring failures (role-leakage, subject-mis-binding) are model-capability — a deterministic gate would let Haiku ship safely at lower cost. Decide when wiring apprentices into the production orchestrator (Phase-1 Step-2b).
2. **Strategy binder — optional further tightening:** add a concrete territory/treatment **boundary example** ("'show the construction' = territory; 'macro of the zipper pulls' = treatment"). DEFERRED until after the cell build, informed by where the line actually bites.
3. **Re-run research on Sonnet?** The chain's `research.md` is Haiku-produced (fact-clean, accepted). A Sonnet re-run would also drop the §7 hook line for a uniformly-clean chain. Optional; user declined this session.
4. **The cell's pixel access (S115 parked):** the trim *assumes* "the cell is the seat that holds the real image and sees the competitor pixels." The cell build must decide how the cell actually gets competitor pixels (comp parked the pixel read as "a later pass" — it likely belongs to the cell).

---

## Next session — exact steps (BUILD THE CELL)

**Method (locked, S115):** hand-build ONE outstanding ad — **copy + image prompt** (pixels come later via Nano Banana) — staying conscious of the **MOVES** while building; the moves *are* the cell binder. Then reverse-engineer the binder from the gold standard. No cell binder exists yet, by design.

**Inputs (all on disk, clean):**
- The Bet's **Angle 1 — "Design That Stays"** territory (durability/construction proof) — the anchor angle. *(Angle 2 "Built for Here" / India-climate is the alternate; build Angle 1 first as the gold standard.)*
- Hero product = **Lagoon Basalt tote** (bags, not cases — cases held by the honesty-fork). Reference image: `fixtures/research/dailyobjects/reference-images/lagoon-basalt-tote.png`.
- `research.md` + `competitors.md` (the full chain).

1. **Operate as the cell — decide the lane.** Take Angle 1's *territory + mandatories* only. Where the Bet **leaked treatment** ("seams, zipper pulls," "rain on a crowded street"), **override it explicitly and narrate why** — this demonstrates "strategist assigns territory; cell decides lane" in practice (Decision 3's residual, resolved by the cell's authority).
2. **Apply the S115 copy-craft moves** (each a candidate binder rule): start from the buyer's **JTBD**, not a frame the writer likes; **no fabrication** (state product facts only from research / the reference image); **no puns/cleverness**; **concrete** (photographable, a real object/number/moment, a clear ask); **voice = the buyer's inner monologue**; **copy and image *complete* each other, do not echo**.
3. **Use the real reference image** so the image renders the *actual* tote (this is the #1 failure — images-missing-content — we're fixing). Decide whether/how the cell sees competitor pixels (carry-forward #4).
4. **Hand-build:** the ad concept (one sharp idea with tension) → the copy → the image prompt. Narrate every move.
5. **Reverse-engineer the cell binder** from the gold standard — extract the MOVES (why/how), discard the SURFACE (what). The binder teaches THINKING, not LOOKING.
6. **Later:** repeat the gold-standard build for **Arjun Infra** + a 3rd sector → 3 exemplars sharing *no look, only moves* (collapse-proof).

---

## Memory written this session
- `project_eval_sonar_switch_and_apprentice_model.md` (+ indexed in `MEMORY.md`) — the Sonar switch + the Haiku-ceiling finding + the open prod-economics decision.
