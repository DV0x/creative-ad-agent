# Session 113 — Comp binder built + first eval recorded + LOCKED

**Date:** 2026-05-23
**Branch:** `new-ui`
**Status:** Phase 1 Step 2a (comp binder, Step C of the 9-step loop) **built, first-eval recorded, LOCKED.** This is the 4th binder of the sequence (after harness, strategy, research). Read SESSION_112 first for the research handoff this continues.

> **Companion:** `docs/SESSION_112_RESEARCH_LOCKED_NEXT_STEPS_2026-05-22.md` — chose Track B (next binder = comp). This doc records building it.

---

## What was built

The competitive-intelligence apprentice (Step C). Mirrors the research binder's shape; reads the field a brand competes in and writes `competitors.md`.

| Piece | State |
|---|---|
| `agent/.claude/skills/comp/SKILL.md` | The binder. 4-section deliverable (the competitive field / clustering axes / white space / live ad field & visual zeitgeist). Discovers the field itself (research's "alternatives landscape" is a hint, not a dependency). Carryover provenance discipline (sourced / no-fabrication / no-marketing-copy / gap-named). **Locked.** |
| `cloudflare/eval/mini-eval/mcp/scrapecreators.ts` | **NEW** MCP wrapper for the Meta Ad Library. Two batched tools: `competitor_find_pages` (resolve names → pages; the wrong-brand defence) and `competitor_ads` (page_id → revealed-winner-ranked, trimmed ads). Disk-cached (`.cache/scrapecreators/`, gitignored) for credit discipline. **Locked.** |
| `cloudflare/eval/mini-eval/apprentices/comp.ts` | AgentDefinition. **Haiku 4.5.** Tools: Read/Write/WebFetch + Perplexity + the two ScrapeCreators tools. |
| `cloudflare/eval/mini-eval/rubrics/comp.md` | 4 critical (`sourced`, `no-fabrication`, `white-space-named`, `no-marketing-copy`) + 4 supporting (`field-segmented`, `axes-read`, `ad-read-handled`, `locale-anchored`); `maxSupportingFails: 1`. |
| Fixtures | `arjun-infra` (thin hyperlocal field — fallback ladder), `dailyobjects` (crowded field, live ads — ground-truth anchor), `noise` (commoditised + generic-name resolution). Each = founder-facts + research.md (competitors.md is the OUTPUT, deliberately absent). |
| `run-mini-eval.ts` | Wired: registry, MCP servers (perplexity + scrapecreators), maxTurns 40 / budget $2.5, required env (`PERPLEXITY_API_KEY` + `SCRAPECREATORS_API_KEY`). |

---

## First eval — dailyobjects (recorded, NOT re-run)

**Result: FAIL — but 6/8 criteria pass, and the failure is the known Haiku citation gap, not a comp-design flaw.** $0.20, 2.7 min, 15 turns, ~10 ScrapeCreators credits. Snapshots: `results/_snapshots/comp-2026-05-23-FIRST-EVAL.md` + `comp-dailyobjects-FIRST-EVAL.md`.

- **PASSED (every comp-specific structural criterion):** `white-space-named` (3 lanes + a format gap, tied to clustering, hedged), `axes-read`, `field-segmented` (3 tiers + price-floor pressure), `ad-read-handled` (revealed-winner ranking + behavioural-proxy framing + labelled confidence rung + no invented visuals), `no-marketing-copy`, `locale-anchored`. Judge: *"genuinely good… the work of someone who actually read the field rather than listing names."*
- **FAILED (2 sourcing criticals):** `sourced` — budget rivals (Zapvi, CaseKaro) given prices/ratings with no URL; Reels stats cited to "Meta's own research" with no link. `no-fabrication` — "Wittelsbach.ai D2C Meta playbooks" looks like a hallucinated citation.

**Diagnosis:** this is the **exact same Haiku citation-discipline gap the research binder has** (SESSION_112 parked item #1, "the `sourced` self-check"). Haiku does strong structural work but floats/invents a minority of citations. Comp-specific judgment is all there. Decision (user, S113): **lock and move on; momentum over tidiness.** The sourcing fix is parked, documented, mechanically fixable — same fix for research and comp.

---

## Decisions locked this session

1. **ScrapeCreators only — no fallback providers, no swappable-adapter abstraction.** (Plan doc updated; was "Apify/SearchApi fallback behind adapter".) Direct client.
2. **Comp scope = 4 sections, built as ONE unit** (no internal Phase-1/Phase-2 split). Field + axes + white space via Perplexity; live ad read via ScrapeCreators — all shipped together.
3. **Comp discovers the field itself** — does not depend on research having surfaced rivals (robust on thin-buyer-signal brands).
4. **Revealed-winner discipline:** no performance data exists for commercial ads; longevity × variant-count × placement-breadth are *behavioural proxies* the wrapper pre-ranks on, never measured wins.
5. **Format policy = Option 1 (format-agnostic reporting).** Comp reads ALL ad formats (static / DPA / DCO / video / Reels) and reports the truth — including format white space (e.g. "Reels are the open lane"). It gives **no creative advice** (`no-marketing-copy`). The "we only produce static images" constraint is applied **downstream in the strategist**, not baked into comp. Rationale: comp's job is truthful intelligence; hiding the video shift would blind us. (In the dailyobjects run comp found a *static* white space too — design-led lifestyle — so we lose nothing.)

---

## Parked items (mechanically fixable; mirror research's parked gaps)

1. **`sourced` self-check pass (shared with research).** Add a final end-of-run scan to the comp binder (and research): *"re-read; every number / price / stat / named source gets an inline (domain, date) or gets deleted; a source you can't point to is a guess."* Haiku follows an explicit checklist better than a background principle. **Acceptance:** dailyobjects passes `sourced` + `no-fabrication` on re-run.
2. **Run arjun-infra + noise.** Only dailyobjects was run (validates the full pipeline + the live-ad path). arjun-infra exercises the empty-Ad-Library fallback ladder; noise exercises generic-name page resolution. Run both when convenient (arjun's ScrapeCreators calls likely return empty = cheap).
3. **Pixel-level visual read.** The wrapper returns ad image URLs but they aren't viewed — the zeitgeist read is from format + copy + CTA + cadence only. A future multimodal pass (download top images → Read) would add real style reading. Not needed now.

---

## Credits

ScrapeCreators: 100 free → ~84 remaining after build-probing + the dailyobjects run. Disk cache means re-running dailyobjects is free for the ad-fetch part. Watch the dashboard; top up if a multi-fixture tuning pass drains it.

---

## The bigger picture — remaining Phase-1 work

- [x] Step 0 — mini-eval harness (S109)
- [x] Step 1 — strategy binder (S109)
- [x] Step 2a — research binder (S110-112, LOCKED)
- [x] **Step 2a — comp binder (S113, LOCKED)**
- [ ] **Step 2a — remaining 5 binders:** rigor-rubric/critic, hook, art, ad-unit, run-plan, next-move (6 listed; hook+art+ad-unit share one cell apprentice).
- [ ] Step 2b — harness engineering: orchestrator 9-step rewrite, wire apprentices, Bet critic loop, cell code-checks.
- [ ] Step 3 — integration on staging; run the corpus.
- [ ] 🚦 GO/NO-GO gate on the floor (22% → 50%+).

**Suggested next binder:** the **D critic (rigor-rubric)** — it completes Step D (strategist is already done), it's a *detection* test (catch known-bad Bets, pass known-good) rather than an output-quality test, and it needs no new tooling (works from canned good/bad Bets). Alternatively the **cell binders (hook/art/ad-unit, Step F)** if you'd rather build toward visible creative output next.

---

## File index

### Built this session (uncommitted on `new-ui`)
```
agent/.claude/skills/comp/SKILL.md ............................ the binder (locked)
cloudflare/eval/mini-eval/mcp/scrapecreators.ts ............... NEW Ad-Library wrapper (2 tools, cached)
cloudflare/eval/mini-eval/apprentices/comp.ts ................. apprentice — Haiku 4.5
cloudflare/eval/mini-eval/rubrics/comp.md ..................... judge rubric (4 critical + 4 supporting)
cloudflare/eval/mini-eval/fixtures/comp/{arjun-infra,dailyobjects,noise}/
cloudflare/eval/mini-eval/results/_snapshots/comp-*-FIRST-EVAL.md  first eval (recorded)
cloudflare/eval/mini-eval/run-mini-eval.ts ................... wired comp in
docs/eval-corpus/implementation-plan.md ...................... comp row + ScrapeCreators decision updated
.env.local (gitignored) ...................................... SCRAPECREATORS_API_KEY added
.gitignore .................................................... ignore .cache/
```

### Read next session
```
docs/SESSION_113_*.md (this) ................................. comp state + next steps
docs/SESSION_112_*.md ........................................ research handoff
docs/eval-corpus/implementation-plan.md §4.2 ................. binder inventory + build sequence
agent/.claude/skills/{strategy,research,comp}/ ............... the 3 locked binders to mirror for the next 5
```
