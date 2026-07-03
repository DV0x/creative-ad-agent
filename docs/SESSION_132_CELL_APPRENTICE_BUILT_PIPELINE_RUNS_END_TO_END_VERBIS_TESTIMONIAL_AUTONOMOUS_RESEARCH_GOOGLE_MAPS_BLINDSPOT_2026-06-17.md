# Session 132 — The **cell apprentice** built; the pipeline runs **end-to-end as agents** (research→comp→strategy→cell) on a real brand (Verbis Edu); the cell **autonomously** produced a real-provenance testimonial; and the research binder's **Google-Maps blind spot** surfaced

**Date:** 2026-06-17 · **Branch:** `new-ui` (everything uncommitted) · **Status:** Build + validation session. The cell now runs as an agent and works end-to-end; several real binder bugs found and logged for next session. Nothing committed. **Per request: memory was NOT touched this session — this doc is the whole handoff.**

> **Read first:**
> - This doc — the forward plan is Part 8.
> - `docs/research/ad-library/DR-FORMAT-KIT-FROZEN-2026-06-16.md` — the frozen SKIN × ENGINE strategy this session builds toward.
> - The cell-build arc that precedes this: `SESSION_128_*` (testimonial built + the MAKER keystone), `SESSION_129_*` (type/style grammars + founder-POV v3), `SESSION_131_*` (DR native strategy frozen). Full chain in Part 9.

---

## Part 0 — The arc in one paragraph

Started from S131's frozen kit to keep building the cell's DR formats. Wrote the **PAS × real-world** format doc (3rd format, not yet render-validated). Then, probing whether testimonial "returns the same look for every brand," ran a cross-brand test on **DailyObjects with a stand-in review** — which exposed two things: the *sameness* I first saw was **me defaulting the composition** (mirroring TWT v13's card-lower-third), and, more sharply (user's catch), **a fabricated review makes "derive the maker" collapse into "pick from a menu"** — the slop failure the whole binder exists to stop. Real specificity needs real upstream material. So we ran the **real pipeline on Verbis Education** (study-abroad consultancy, lead-gen free-counselling at /apply): **research → comp → strategy**, via the actual apprentices (Sonar + ScrapeCreators). Research **falsely reported "no reviews"** — but Verbis has **490 Google reviews @ 4.9★**; the cause is a real **research blind spot** (Sonar can't index Google-Maps reviews; Haiku wrote *can't-access* as *doesn't-exist*). The user's real Chrome (claude-in-chrome MCP) pulled the real verbatim reviews; I injected them into research; strategy then produced an **excellent, proof-backed Bet** (honest-assessment positioning + the 490/4.9 proof + named advisor Partha, 3-angle audience-discovery test). Then, on the user's instruction that **"the cell should derive the Bet and create copy + image, not you,"** I **built a cell apprentice** into the mini-eval harness and ran it — and it **autonomously** routed to testimonial, derived the maker as a **Google-Business-Profile screenshot on a phone (the "ZMOT" research moment)**, used the real verbatim review, and rendered a lead-gen ad (`verbis-cell-zmot-v1.png`) — a *better* compositional choice than my hand-built version. It was slow (~15 min) and I killed it just after the render (before its written deliverable). The pipeline now runs end-to-end as agents.

---

## Part 1 — PAS × real-world format doc built (NOT render-validated)

- New: `agent/.claude/skills/cell/references/formats/pas-real-world.md` — the 3rd format entry, same thin "format over the shared method" shape as testimonial/founder-pov.
- **Format-specific teaching:** PAS's failure mode is *its own cliché* — the rhetorical-question opener ("Tired of X?") / stock problem-face. Escaped by anchoring the problem in a **real lived line** (from research/proof) and **deriving the native scene** from the MAKER rule ("where does this problem live" → gym bag / 1am nightstand / cat at the bowl). Payload gate: a pretty scene with no problem+fix is a brand post, not DR.
- **It is the first doc that names its two halves out loud** (PAS engine × real-world skin) — the seam we'll later split engines/skins along.
- **Status: built, never rendered.** Render-validate it next (testimonial took 13 renders, founder-POV 2).

## Part 2 — Architecture decisions (kept lean, deliberately)

- **Did NOT pre-split into `skins/` + `engines/` folders.** SKIN × ENGINE is the two halves the cell already has (a job + a maker), pulled apart. We build bundled format docs and **factor the axes out later from evidence**, not impose the structure on day one. testimonial + founder-pov stay untouched as the two proven combos.
- **How a format derives from the Bet:** the strategist hands the cell a **room** (buyer + awareness + promise + proof + mandatories) — *never a treatment*. The cell reads each format doc's **"Match" section** + the angle and **judges** which fits (awareness + want + the hard **material gate**). **There is no router** — it's LLM judgment over the Match sections. The proper **gated match→derive inside SKILL.md is deferred** ("leave it until we have more formats"). The cell `SKILL.md` still describes the older "mine way-ins → takes" method and does **not** mention the format library — the two aren't merged; for the cell apprentice I bridged them in the **identity prompt** (a stopgap).

## Part 3 — Testimonial cross-brand variation test (DailyObjects, stand-in review)

- DO **failed testimonial's material gate** (no real positive reviews — its real reviews are negative quality complaints). The gate working, not a bug. User OK'd a **clearly-labeled stand-in review** to test the *look* only.
- **v1** (`do-testimonial-v1.png`): brand-site "Verified Buyer" card on a café-desk — *same silhouette* as TWT v13 (card lower-third) **because I mirrored the v13 prompt**.
- **v2** (`do-testimonial-v2-igstory.png`): full-bleed **Instagram-story** testimonial — radically different composition when the maker is derived independently.
- **Findings:** (1) the "sameness" was **my defaulting**, not the format. (2) **User's sharp catch:** v2 wasn't truly *derived* — with no real review I *picked* IG and back-filled a provenance. **A fabricated review collapses "derive the maker" into "pick from a menu" — the exact slop the binder fights.** Real upstream material is the whole point → motivated the real Verbis run.

## Part 4 — The real pipeline on Verbis Education (research → comp → strategy)

Fixtures + results all under `cloudflare/eval/mini-eval/`. Conversion = free-counselling lead via verbisedu.com/apply. Service brand (no product image).

- **RESEARCH** (Haiku + Sonar) → **PASS** ($0.21, 6.2 min). Strong category buyer-voice (visa-rejection anxiety, overpromising fear, hidden-cost dread). **BUT reported "zero reviews."**
- **🔴 THE HEADLINE BUG — research Google-Maps blind spot.** Verbis has **490 Google reviews @ 4.9★** (+ Justdial 486 @ 4.9, Collegedunia 365 @ 4.8, Estd 2004). Sonar (open-web retrieval) **cannot index Google-Maps / Business-Profile reviews** (Google's walled garden), and the brand site is a JS SPA — so the tool couldn't reach them and **Haiku wrote "can't access" as "doesn't exist."** This is a live hole in the whole **local-services track** (their proof lives on Google Maps).
- **Chrome rescue:** headless `gstack` daemon jammed (port 9400); the **claude-in-chrome MCP (user's real Chrome session)** pulled the real verbatim reviews from the Google Business Profile: **G. Bhavana** (*"From IELTS coaching to university selection and visa approval, I received excellent guidance at every stage."*), **Mahesh Ns** (*"Partha has been guiding/assisting us in all the stages of this process…"*), + an IG one (*"Partha Sir guided me step by step…"*). Named people: advisor **Partha**, IELTS trainer **Vinutha**.
- **COMP** (Haiku + Sonar + ScrapeCreators) → **FAIL** on ONE critical criterion: `no-marketing-copy` — it **authored a finished hook + sample ad lines** ("We Tell You Your Real Chances…"), crossing from *reporting the field* into *creative*. Content otherwise strong (real ad data: IDP 30 ads, Leverage 30, Edwise 0 [a finding], KC 5; named the open-and-wanted white space **"Honest Visa-First Guidance"**). ScrapeCreators credits hit 0/negative but the API still returned ad data.
- **Manual correction:** injected the real Google reviews into `fixtures/strategy/verbisedu/research.md` (§1 + §2a, clearly marked as a fix for the Sonar/Maps blind spot) so strategy's proof gate could see them. (The as-produced research result keeps the bug, as the honest record.)
- **STRATEGY** (Sonnet) → **PASS** ($0.94, 5.5 min). Excellent Bet — **used the injected reviews**: honest-assessment positioning backed by the 490/4.9 proof + Partha, **audience-discovery test** with 3 angles (Aspiring Student [primary], Working Professional, Parent). Honest flags: visa-success-% is an honesty-ceiling (unverified, don't state); advisor photos + landing-page proof needed.

## Part 5 — The CELL apprentice built + run autonomously

User: *"cell should derive the bet and create copy and image not you."* So I built the missing pipeline stage.

- **New:** `apprentices/cell.ts` (tools: Read/Write/Bash — renders by shelling to the existing `server/tmp-cell-render*.mjs` scripts, which self-load FAL_KEY + save to the persistent `results/cell-dryrun/`; **v1 limitation: self-critiques inline — no independent critic seat wired yet**), `rubrics/cell.md`. **Wired** into `run-mini-eval.ts`: registered `cell`, `EXTRA_FILES_FOR['cell']` (the 9 reference files placed at `references/…` so the binder's relative links resolve), `MAX_TURNS=50`, `MAX_BUDGET=$4`.
- **Ran it on the Verbis Bet → it worked autonomously** (`results/cell-dryrun/verbis-cell-zmot-v1.png`):
  - **Routed to testimonial** (real Google reviews satisfy its material gate).
  - **Derived the maker itself** = a **full Google-Business-Profile screenshot on a phone** — named the file `zmot` (Zero Moment of Truth = the moment a student Googles the brand). It reasoned about *where the proof actually lives* and rendered that research moment.
  - Used the **real verbatim Mahesh/Partha review + 490/4.9 + Mathikere location** from the corrected research; **lead-gen CTA** ("Book free counselling →").
  - **Out-derived my hand-built v1** (`verbis-testimonial-v1.png`, a Google *card* pinned on a desk): the cell rendered the *whole phone-screen research moment* — a better, more native choice. "Derive, don't default," working for real.
- **Caveats:** **slow (~15 min** to reach the render — whole binder inlined + 9 ref reads + full method + ~90s render); I **killed it just after the render**, so it never wrote `cell-output.md` (no written format-rationale / shot-spec / vision-gate verdict captured). The "failed exit 1" is the SIGKILL, not an organic failure.

## Part 6 — Key findings / learnings

1. **Testimonial sameness = defaulting the composition, not the format.** Real provenance → genuinely different look (TWT Amazon-card-in-a-kitchen vs Verbis Google-screenshot-on-a-desk). Proven.
2. **Fabricated proof → "derive" collapses into "pick."** The anti-genericness power is entirely downstream of real upstream material; the material gate protects this.
3. **🔴 Research can't see Google-Maps reviews → false "no reviews."** Biggest bug; breaks the local-services track. Fix: for local/service brands, treat Google-Maps reviews as **must-fetch** and **flag "couldn't reach" rather than asserting "none exist."**
4. **Comp (and strategy) leak into authoring.** Comp wrote a finished hook/sample lines (failed `no-marketing-copy`); strategy has the parallel "don't write headlines" leak. Both binders need a tighter **report/brief, don't author** guardrail.
5. **The cell works end-to-end as an agent** — routes to format, derives the maker from real provenance, uses real proof, renders, lead CTA — with no operator in the loop. Needs **speed work** + capturing the **full written deliverable**.
6. **Format routing is judgment, not a router** (over each format's Match section) — fine at 3 formats; needs the deferred gated match→derive + the SKILL.md/format-library merge as formats grow.

## Part 7 — Repo state (all uncommitted, `new-ui`)

**New files**
- `agent/.claude/skills/cell/references/formats/pas-real-world.md`
- `cloudflare/eval/mini-eval/apprentices/cell.ts`, `cloudflare/eval/mini-eval/rubrics/cell.md`
- `cloudflare/eval/mini-eval/fixtures/{research,comp,strategy,cell}/verbisedu/…` (the staged fixtures; **strategy/verbisedu/research.md is the manually-corrected one with the real reviews**)
- `cloudflare/eval/mini-eval/results/{research,comp,strategy}-2026-06-17*.md` (+ `*-bets/verbisedu.md` — research/strategy PASS, comp FAIL on `no-marketing-copy`)
- Renders in `results/cell-dryrun/`: `do-testimonial-v1.png`, `do-testimonial-v2-igstory.png`, `verbis-testimonial-v1.png` (hand-built baseline), **`verbis-cell-zmot-v1.png` (the autonomous cell — the key artifact)** + their `prompt-*.txt`.

**Changed**
- `cloudflare/eval/mini-eval/run-mini-eval.ts` (cell registered + EXTRA_FILES + turns/budget).

**Ops note:** ScrapeCreators credits **exhausted (~0)** — top up before the next comp run. Git index was timing out at session end (transient).

## Part 8 — NEXT SESSION (the plan)

1. **Re-run the cell to completion** to capture `cell-output.md` (its format rationale, shot spec, vision-gate verdict) — and **fix the ~15-min slowness** (trim what's inlined / reduce ref-read turns).
2. **🔴 Fix the research Google-Maps blind spot** (biggest impact — the local-services track depends on it): local/service brand → Google-Maps reviews are must-fetch; flag "couldn't reach," never assert "none."
3. **Fix the comp + strategy "cross into creative" leak** (report/brief, don't author hooks or sample lines).
4. **Render-validate `pas-real-world.md`** (built but never rendered).
5. Later: the **gated match→derive router** + merge the **format library into SKILL.md's method** (the SKILL.md/format-library seam); a proper **independent critic** subagent for the cell (vs v1 inline self-critique); a real **image-gen MCP** for the cell (vs Bash-shelling the one-off render scripts).

## Part 9 — Session-doc chain (the cell-build arc)

- `SESSION_126_*` — why the cell is generic → format-library pivot; FORMAT-REPERTOIRE frozen; styles/references deferred.
- `SESSION_127_*` — format library into the cell ("machine, not skin"); critic + vision-gate framing; testimonial prototype next.
- `SESSION_128_*` — **testimonial built + validated (13 renders); the MAKER is the keystone; Fork B locked.**
- `SESSION_129_*` — **type + style grammars built; founder-POV validated (v3 locked); specification, not compositing.**
- `SESSION_130_*` — ad-library competitive-research tool; no-perf-data finding; targeting locked (ingestibles → beauty → local-services); 452-ad ingestibles deep dive.
- `SESSION_131_*` — ingestibles image analysis (262 creatives); **DR native strategy FROZEN as SKIN × ENGINE.**
- **This session (S132)** continues that arc: built the 3rd format (PAS), proved testimonial varies on real provenance, and **stood up the cell as an autonomous pipeline stage end-to-end.**
- Supporting: `docs/research/ad-library/DR-FORMAT-KIT-FROZEN-2026-06-16.md`, `FINDINGS-2026-06-15.md`, `FORMAT-REPERTOIRE.md`.
- Standing memory pointers (NOT edited this session, per request): `project_first_principles_redesign`, `project_ad_library_competitive_research`.
