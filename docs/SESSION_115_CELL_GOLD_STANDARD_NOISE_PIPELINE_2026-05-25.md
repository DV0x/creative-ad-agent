# Session 115 — Cell gold-standard: first-principles reasoning + Noise pipeline setup

**Date:** 2026-05-25
**Branch:** `new-ui`
**Status:** IN PROGRESS — heavy first-principles reasoning done; Noise fresh-chain *set up* but **blocked on a stale-key gotcha**. No binder written yet (by design — gold standard comes first). Resume per §"Next session — exact steps".

> ## 🔄 SUPERSEDED 2026-05-26 — read this before anything below
> Two decisions retire the Noise-specific parts of this doc:
> 1. **Gold-standard #1 is now DailyObjects, not Noise.** Noise accumulated too much residue (stale stand-ins, a corrected-twice price, the URL-404 confusion, a discarded ad). All Noise fixtures + result files were **deleted** (`fixtures/{comp,research,strategy}/noise/`, `results/strategy-2026-05-{19,20}-bets/noise.md`). DailyObjects is a clean, reference-image-heavy D2C case with zero history.
> 2. **No pre-baked "ground-truth" fact table.** The "Verified Noise facts" table below has been removed — holding a fact table turns the audit into *answer-matching* when the real test is *provenance*: does the agent trace each claim to a source it actually pulled? Re-verify load-bearing facts **live at audit time**; never trust a stale table (it's just a fresh stand-in waiting to mislead).
> 3. **Key blocker resolved** — new Perplexity key in `.env.local` (200); stale `~/.zshrc` export removed. Use the per-run override in any shell that still has the old value in memory.
>
> **The conceptual spine below is brand-agnostic and still fully valid.** Everything Noise-specific (the fact table, the on-disk state, the next-steps) is obsolete — substitute DailyObjects.

> **Read first:** this doc → `docs/SESSION_114_CELL_BINDERS_FROM_FIRST_PRINCIPLES_KICKOFF_2026-05-23.md` (the kickoff that framed the cell) → the three locked binders (`agent/.claude/skills/{strategy,research,comp}/SKILL.md`). Memory: `feedback_binder_teaches_thinking_not_looking.md` (new this session), `project_first_principles_redesign.md`.

---

## What this session was

We began Session 114's mandate — build **the cell** (Step F, the direct-response creative seat that turns a Bet angle into a complete Meta ad). Per the kickoff's instruction we did **not** start coding; we reasoned the cell from first principles, then started setting up a **real end-to-end run** (research → comp → strategy) on **Noise** so the cell gold standard is built on genuine upstream, not stale stand-ins.

We got the reasoning largely done and the Noise fixture staged, but the fresh chain is blocked on an environment-key gotcha (below). Stopping to resume clean.

---

## The conceptual spine (the most valuable output — don't lose this)

### The cell's identity: a concept-first direct-response creative
- DR = direct response: ads engineered to make someone **act now** (click/buy), measurable — the opposite of brand advertising. Every ad our product makes is DR.
- **Outstanding ≠ average** collapses to one thing: a **single sharp concept with tension, where copy and image *complete* each other (not echo).** Average ads: copy describes the picture (redundant), template-filled, feature-listing, product-on-gradient.
- The "schools" of DR greatness — insight / concept / offer / native-to-feed — are **not a checklist.** A truly good idea **collapses all four into one** (insight *is* the concept *is* tied to offer *and* feels native). They're a **diagnostic** (use them to find why a weak idea is weak), never a build recipe. A checklist rebuilds the old slop machine.
- Reference bar = real performance creative (Harmon Brothers: Dollar Shave Club, Squatty Potty, Purple egg-drop, Liquid Death) — **NOT** the brand-advertising hall of fame (Economist, VW "Think Small"). Two tiers: Tier-1 (solid DR bones, plateaus = old-pipeline slop) vs Tier-2 (DR bones **+ one sharp idea** = scales). We want Tier-2.

### Why our first-gen output is slop — and the real fix
- **Not** because we generate one and don't review (that "generate-many-reject" framing was rejected as 2023 thinking — modern Opus-class models *can* one-shot outstanding).
- We **suppress** a capable model. Three suppressors: (1) **coverage not truth** (the "6 hooks across 6 types" quota — a quota is the enemy of sharpness); (2) **decorate a thin brief, not discover** (great creative is a *discovery* problem — find the one true, surprising, specific thing about *this* product/buyer the feed isn't saying); (3) **recipe buries taste** (the 8,573-line art-style library = procedure → recipe-output).
- **The unlock:** reframe the model's job from "produce an ad" to "**discover the one concrete true thing the competitive feed isn't saying, then express it as one ad**." Give it the full depth + freedom; get the procedure out of the way.

### Concreteness is the master discipline
- It prevents BOTH failure poles: **slop** (lazy-generic) and **abstraction** (pretentious-vague, "empowerment", moody gradient). Both are the *same disease* — non-specific.
- Two dials, both *bars* not recipes: **freedom** on *what* truth to find; **hard floor** on concrete + DR-function ("can you photograph it? can a non-marketer execute it? is there a real number/object/moment? is there a clear ask?"). The concreteness floor is also what fixes the #1 failure (images-missing-content): an abstract idea renders as a generic backdrop; a concrete one renders as a literal scene with the hook *in* it.

### Models DO have taste — they just don't apply it by default
- Recognition (discrimination) is real and strong; default *generation* regresses to the probable = average. They lack **conviction** (won't refuse) and **performance calibration** (aesthetic taste, unproven *converting* taste — comp's revealed-winners + the eval loop ground this).
- So we **don't encode taste as rules** (recipe trap). The binder **installs a point of view and forces the model to apply its own discriminator** ("would *this* stop your own thumb? is it concrete? is it true?"). That's why the mentor-persona binders work.

### The north star (saved to memory: `feedback-binder-teaches-thinking-not-looking`)
- **The binder teaches a way of THINKING, not a way of LOOKING.** Reverse-engineering the cell from a gold standard: extract the **moves** (why/how), discard the **surface** (what). Surface-as-rule = template collapse (the "Claude Design makes everything look the same" failure the user explicitly flagged).
- Variety is produced by **derivation**, never randomness or a style menu: style is derived from angle + sector + audience + real product + **the wallpaper-to-reject** (per-brand comp differs → look differs by construction). Guard worked-example leakage (the S109 crack; harness flag `MINIEVAL_NO_EXAMPLES`).
- **Build 3 sector-different gold standards** (Noise / Arjun / DailyObjects) so exemplars share *no look, only moves* → collapse is impossible.

### The method (locked): gold-standard first, binder second
Hand-build ONE outstanding ad (copy + image prompt — pixels come later via Nano Banana). Stay conscious of the **moves** while building; those moves *are* the binder. Then reverse-engineer.

---

## The strategy→cell visual-lane finding (architecture — needs a decision)

The user questioned the locked "strategist assigns the visual lane." Findings:
- Strategy's binder (§162–174) says "assign the lane = the direction/mood; you frame, they execute" — but its definition includes **"treatment,"** which drags the marketer into **art direction** (palette, props, layout). The Arjun Bet drifted there ("show a living room, a kitchen, a bedroom window").
- **Comp never looks at pixels** (comp SKILL line 163: format + copy only, "never describe an ad's visuals beyond its format"). So strategy's "X is visual white space" is *inferred from format/copy*, not seen. **Nobody in the pipeline currently views a competitor image.**
- Empirically the 4 Noise lanes **converged on "premium product on clean background"** — the strategist art-directing produced near-duplicates (the blurring §170 says strategy exists to prevent). **Distinctness lived in the territory, not the treatment.**

**Mental model to resolve all such boundary questions:**
- **Authority follows scope** — a decision belongs to the role with the *widest view it needs, and no wider.* Cross-cell distinctness needs to see all N → strategist. One ad's concept needs one angle + product + feed → cell.
- **Seeing isn't deciding** — inputs are shared freely; authority is scoped tightly.

**Real-agency truth:** planner writes the brief (*tight on strategy, loose on execution*); **Creative Director** owns visual direction + portfolio coherence; art director (= the cell) makes it. Our 2-seat design **folded the CD's job into the strategist.**

**Proposed trim (NOT yet done — touches the LOCKED strategy binder):** strategist assigns **TERRITORY + guardrails** (differentiate-from-wallpaper, register, mandatories like "show the real product / respect identity", and a distinct *territory* per cell) — **drop "treatment."** The **cell owns the lane + execution**, and the cell **sees the actual competitor ad images** (the pixel read comp parked as "a later pass" likely belongs to the cell). One-liner: **the strategist assigns the territory; the cell decides the lane.**

---

## Copy-craft moves discovered while hand-building (binder-rule candidates)

From a hand-built Noise ad (since discarded — see below), each move is a candidate cell-binder rule:
1. **Cleverness serves the writer; realness serves the truth.** Kill puns/wordplay (the discarded ad's "looks like none of your business" was a pun = try-hard tell). If a line sounds like a tagline auditioning for an award, cut it.
2. **Voice = the buyer's inner monologue, not the brand's pitch.** Write the sentence the buyer would actually think.
3. **Say the plain benefit before being interesting;** concrete proof carries, phrasing stays invisible.
4. **Start the discovery from the audience's job-to-be-done (evidenced), not a frame the writer likes.** (The discarded ad asserted "discretion = status" — which *contradicted* the chosen status angle and was never earned from the buyer's JTBD. JTBD reasoning pointed instead toward "the performance edge without another screen/distraction.")
5. **State product facts ONLY from research / verified sources.** Training/background knowledge is a *hypothesis to check*, never a claim. (While hand-building, the assistant fabricated "₹2,000" and "heart rate, activity tracking" from memory — exactly the fabrication failure we're killing.)
6. **The cell must SEE the real product** (reference image) so the image renders the actual object, and must see the competitor pixels so "unlike the wallpaper" is real.

> The discarded ad (concept "discretion = status," "Tracks your sleep, recovery & HRV — no one can tell you're wearing it", boardroom shot) is **not a keeper** — it leaned on the unverified "Red Dot" claim and an unearned JTBD frame. It served only to surface the moves above.

---

## The audit rule (replaces the removed "ground-truth" table)

> The "Verified Noise facts" table that used to live here was **deleted on 2026-05-26** — it was the anti-pattern. A fact table makes you audit by *answer-matching* ("does it say ₹21,999?") when the only test that matters is *provenance*.

**How to audit any `research.md` / Bet:**
- **Trace every claim to a source the agent actually pulled** — a URL it fetched, a search result, a reference image. A number with no traceable source is a fabrication, full stop, regardless of whether it "looks right."
- **Re-verify load-bearing facts live at audit time** (one product-page fetch + a search) — never against a remembered table. A stale table is just a fresh stand-in waiting to mislead.
- **The assistant's training knowledge is a hypothesis to check, never a claim** (this is how "₹2,000 / heart-rate tracking" got fabricated last session).
- **To localize a chain failure:** find the stage where a claim is first stated *without a source* — that's where it's born. The harness already grades `sourced`/`no-fabrication` per stage and flags untraced *numbers*.

**Lesson (the whole point):** the old Noise `research.md`/Bet were **hand-written stand-ins** — a human typed "Red Dot" and "₹8,000+" and everything downstream (and the assistant) trusted them. Only live verification caught it. The fix isn't a better table; it's making provenance the bar.

---

## Pipeline / harness mechanics (confirmed)

- Run from `cloudflare/`: `npx tsx eval/mini-eval/run-mini-eval.ts <apprentice> <fixture>`. Reads `fixtures/<apprentice>/<fixture>/` (needs `meta.json`), writes deliverable to `results/<apprentice>-<date>-bets/<fixture>.md` + report `results/<apprentice>-<date>.md`, then LLM-judges it.
- **Chain by hand:** each stage's deliverable → copy into the next stage's fixture dir.
  - research reads `founder-facts.md` (+ `reference-images/`) → `research.md`
  - comp reads `research.md` + `founder-facts.md` → `competitors.md`
  - strategy reads `research.md` + `competitors.md` + `founder-facts.md` → the Bet
- Models: research + comp = Haiku 4.5; strategy = Sonnet 4.6 (Opus 4.7 incompatible with pinned SDK). Required env: research → `PERPLEXITY_API_KEY`; comp → `PERPLEXITY_API_KEY` + `SCRAPECREATORS_API_KEY`.
- The **cell is NOT a subagent** — we hand-build it (no cell binder exists yet).
- `meta.json` is **never shown to the apprentice or judge** — harness skips it; only `meta.date` passes through as "today's date." (So keep fixture notes clean, but they don't leak.)

---

## 🚨 THE BLOCKER (fix first next session)

The harness env loader: `if (key && !(key in process.env)) process.env[key] = val;` — it only loads a key from `.env.local` **if not already in the environment.** The user's **shell profile (`~/.zshrc` etc.) exports a STALE `PERPLEXITY_API_KEY`** that every fresh shell reloads, shadowing the good key in `.env.local`. Confirmed: session env key ≠ `.env.local` key (both 53 chars); direct `curl` with the file key → **200 (returned ₹21,999)**, but the harness → **401** on every Perplexity call.

**Fixes (either):**
- **(a) Permanent:** remove/update the `export PERPLEXITY_API_KEY=...` line in `~/.zshrc` (and check `SCRAPECREATORS_API_KEY` the same way), then restart the shell. Cleanest.
- **(b) Per-run override:** `PERPLEXITY_API_KEY="$(grep '^PERPLEXITY_API_KEY=' .env.local | head -1 | cut -d= -f2-)" npx tsx eval/mini-eval/run-mini-eval.ts research noise` (do the same for `SCRAPECREATORS_API_KEY` on the comp run).

The valid Perplexity key is in `.env.local` (gitignored). Validate any key with: `curl -s -o /dev/null -w "%{http_code}" -X POST https://api.perplexity.ai/search -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{"query":"test","max_results":1}'` → expect 200.

---

## State on disk (what's staged)

> ⚠️ **Obsolete as of 2026-05-26** — everything below was deleted (all Noise fixtures + the old DailyObjects stand-in fixtures). DailyObjects eval *results* were kept. Next session stages a fresh DailyObjects fixture from scratch (see "Next session — exact steps"). Kept here only as a record of what the Noise setup looked like.

- **`cloudflare/eval/mini-eval/fixtures/research/noise/`** (NEW, created this session):
  - `founder-facts.md` — **URL-first, product-agnostic seed** (URL + goal + conversion + budget ₹30L; NO products, NO fabricated metrics). This is the deliberate design: matches the production entry point (URL-first) and seeds no errors.
  - `meta.json` — brand Noise, date 2026-05-25, clean notes.
  - `reference-images/luna-ring-lunar-black.png` (2560×1600, top-down black) + `luna-ring-sunlit-gold.png` (gold 3/4, shows sensor array) — **both verified real Luna Ring shots** (downloaded from gonoise CDN; CDN is NOT bot-blocked, unlike product pages).
- `.env.local` PERPLEXITY_API_KEY updated to the working value (but shadowed at runtime — see blocker).
- Old hand-written stand-ins (`fixtures/strategy/noise/{research,competitors}.md`, `results/strategy-2026-05-20-bets/noise.md`) are **stale — to be replaced by the fresh chain. Do not trust them.**

---

## Decisions locked this session

- ❌ **Do NOT port the old 8,573-line art-style library** — it's a mess and isn't working; the new art binder is built fresh (judgment, not the recipe library).
- ✅ First gold-standard brand = **Noise** (Luna Ring premium tier — a "product-is-the-conversion-lever" / reference-image case).
- ✅ **Full fresh end-to-end run** (research→comp→strategy) feeds the cell — never the stale stand-ins.
- ✅ Seed is **URL-first / product-agnostic** — the agent discovers products + facts; we seed nothing that can be wrong.
- ✅ Cell is **hand-built first**, binder reverse-engineered from the moves.

## Still-open decisions (carry forward)

- **hook-first vs art-first** — leaning "neither: concept-first" (concept drives both).
- **three binders vs one integrated cell binder** — unresolved.
- **the strategy-binder "territory not treatment" trim** — proposed above; not done (edits a locked binder); decide before/after the fresh strategy run.

---

## Next session — exact steps (DailyObjects, clean slate)

> Key blocker already cleared (2026-05-26): Perplexity key in `.env.local` = 200, stale `~/.zshrc` export removed. Any shell that still has the old value in memory → use the **per-run override**: `PERPLEXITY_API_KEY="$(grep '^PERPLEXITY_API_KEY=' .env.local | cut -d= -f2-)" npx tsx eval/mini-eval/run-mini-eval.ts …` (add `SCRAPECREATORS_API_KEY="$(grep …)"` for the comp run).

**Why DailyObjects:** clean (zero stale fixtures — both Noise and the old DailyObjects stand-in fixtures were deleted; DailyObjects eval *results* kept), and a **product-is-the-conversion-lever / reference-image** case — exactly the #1 failure (images-missing-content) we're fixing.

**On reference images (essential here):** in production the founder uploads their *real* product photos — that's what grounds the image to the actual object instead of a generic version. We simulate that. Two provenance rules (same bar as facts):
- **Real images only** — pulled live from dailyobjects.com / their CDN; never generated or guessed.
- **Record each image's source URL** so no asset is untraceable.
- Note: the **seed stays URL-first / product-agnostic** (research must *discover* facts), but the **images are product-specific** — not a contradiction; it mirrors production (URL + uploaded hero-product photos). So step 1 is choosing the hero product.

1. **Pick the hero product** (a signature DailyObjects case / Carry bag / tech organizer) and **pull 1–2 real reference images** of it (note source URLs). Drop them in `fixtures/research/dailyobjects/reference-images/`.
2. **Write the clean seed:** `fixtures/research/dailyobjects/founder-facts.md` — **URL-first, product-agnostic** (URL + goal + conversion event + budget; NO products, NO metrics) + `meta.json` (brand `dailyobjects`, date, clean notes).
3. **Run research** → **audit by provenance** (see "The audit rule" §): every claim traces to a pulled source; re-verify load-bearing facts live; training-knowledge is a hypothesis, not a claim. Also: what products did it discover from the bare URL?
4. **Validate ScrapeCreators key**, then **run comp:** copy fresh `research.md` → `fixtures/comp/dailyobjects/`, run it. Audit `competitors.md` — real ad wallpaper, no invented rivals/ads.
5. **Run strategy:** copy fresh `research.md` + `competitors.md` → `fixtures/strategy/dailyobjects/`, run it. Audit the Bet — introduces **no new facts**; check whether the visual lane is **territory** (right) or **treatment** (wrong) — and decide the "territory not treatment" strategy-binder trim (§ above).
6. **Hand-build the cell gold standard** on the fresh chain (copy + image prompt), **narrating each move** → the moves become the cell binder. Use the real reference images. Apply the copy-craft rules above (start from JTBD, no fabrication, no puns, concrete).
7. **Then** reverse-engineer the cell binder from the gold standard; later repeat the gold-standard build for **Arjun Infra** and a second sector → proves moves-not-look (3 sector-different exemplars sharing no look, only moves).

---

## Memory written this session
- `feedback_binder_teaches_thinking_not_looking.md` (+ indexed in `MEMORY.md`) — the north star.
