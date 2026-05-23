# Session 114 (kickoff) — The cell binders, from first principles

**Written:** end of Session 113, to seed the next session.
**Branch:** `new-ui`
**Status:** NOT STARTED. This is a forward-looking handoff for the single most important artifact in the redesign — the **cell** (Step F), where research → comp → The Bet finally becomes the ad a founder sees.

> **Read first, in order:** this doc → `docs/SESSION_113_*` (comp, just locked — the freshest binder pattern) → the three locked binders (`agent/.claude/skills/{strategy,research,comp}/SKILL.md`) for the house voice → the two skills we rewrite FROM (`hook-methodology/`, `art-style/`).

---

## Next-session opener

> We are building the **cell** — the direct-response creative seat that turns one of The Bet's angles into a complete Meta ad unit (copy + image prompt + CTA). It is Step F of the 9-step loop and the **highest-leverage, highest-risk binder in the project**: two of the corpus's top recorded failure modes live here, and everything upstream is wasted if the cell ships slop.
>
> **Do NOT start by coding.** Start by reasoning from first principles — the way Q1-Q5 and the research/comp binders were reasoned before a line was written. The questions to answer are in §"The first-principles questions" below. Lock the answers with the user, *then* build: cell apprentice + binder(s) + a shared cell-level fixture + rubric, run through the proven mini-eval harness.
>
> Open decision to settle first: **hook-first or art-first**, and **three separate binders or one integrated cell binder** (see §"Open decisions").

---

## Where we've been (session lineage — the road to here)

The redesign trail, newest last. Each `SESSION_*` doc + the project memory hold the detail; this is the breadcrumb so a fresh session has the lineage in one place.

- **Spec (S101-107):** first-principles redesign Q1-Q5 LOCKED — identity = senior performance marketer delivering a decision-ready Meta test; deliverable = a "Test Brief" (The Bet + N test cells + run plan + next move); 9-step orchestrator loop (A intake → B research → C comp → D Bet+critic → E checkpoint → **F build cells** → G run plan → H next move → I assemble). Living doc: `docs/eval-corpus/first-principles-redesign.md`; plan: `docs/eval-corpus/implementation-plan.md`.
- **S108-109:** mini-eval harness built (`cloudflare/eval/mini-eval/`, the proven pattern every binder uses) + **strategy binder LOCKED** — judgment-not-procedure, validated on 6 held-out brands; cracks fixed (worked-example leakage, always-N=3, geo-blindness). Committed `df06f14`.
- **S110-112:** **research binder LOCKED** — the big switch from Perplexity Agent API → Search API (~20× faster), offer-landscape discipline, attribution rules; generalized across 4 brands. Parked the Haiku `sourced` self-check + §7 copy guard. Committed `a53c7c7`.
- **S113 (just now):** **comp binder LOCKED** — Step C; new ScrapeCreators Ad-Library wrapper (2 cached tools), revealed-winner = behavioural proxy, format-agnostic reporting (static filter is downstream). First eval 6/8 — failed only the *same* Haiku `sourced` gap research has (now a shared parked fix). Uncommitted on `new-ui`. Doc: `docs/SESSION_113_*`.
- **S114 (this kickoff → next session):** **the cell binders** — Step F, where it all becomes the ad. The subject of this doc.

The single source of truth for cross-session status is the project memory `project_first_principles_redesign.md` (per-session Status blocks) + `implementation-plan.md` §4.2 (binder inventory, with locked/done markers).

---

## Why this is the most important artifact

Research, comp, and The Bet are all *upstream judgment* — invisible to the founder. The **cell is the first thing they actually see.** A flawless Bet rendered as a generic, text-missing image is, to the founder, a failed product. The entire redesign's floor number (22% → 50%+) will move most on this step, because this is where quality becomes visible.

And it is where the product **visibly breaks today.** From the eval corpus (memory):
- **[[project-eval-top-failure-mode-image-content]]** — "images missing content" is the #1 failure: the concept→prompt step in art direction loses the hook's substance, so the image renders generic. 3 users complained directly. Live 7+ weeks. Pre-launch blocker.
- **[[project-eval-base-quality-benchmark]]** — the first-gen-vs-iterated gap: TWT's "Add muscle, not ingredients." took the user 7 fighting turns to reach. First-generation cell output is the gap to close.
- **[[project-eval-reference-image-ignored]]** — uploaded product/room photos ignored; generic versions generated instead. Critical for the verticals where the real product *is* the conversion lever.

The cell binder's job is to make first-generation output land where iterated output lands today — and to never lose the concept between hook and image.

---

## What the cell is (locked spec — `implementation-plan.md` §4.1/§4.2)

- **One apprentice** = **direct-response creative** (conversion copywriter + art director merged) — "the one true creative-director seat." Runs on **Sonnet** (creative judgment, not Haiku extraction).
- **Consumes:** one angle from The Bet + the **visual style assigned by the strategist in Step D** (style assignment is a *strategic* call upstream; the *craft* happens here) + the research (`research.md`) + any founder reference images.
- **Produces:** a complete Meta **ad unit** — primary text / headline / CTA + an **image prompt** that renders the hook *on the image*. (Image generation itself is Nano Banana 2 downstream; the cell's deliverable is the prompt + copy, not the pixels.)
- **Three binders, one apprentice, one shared fixture** (§4.2):
  | Binder | From | The judgment under test |
  |---|---|---|
  | **hook** | rewrite of `hook-methodology` (452-ln SKILL + `formulas.md` + ~30-entry `hook-bank/`) | copy research-anchored (not template-filled), locale-correct, action-oriented |
  | **art** | rewrite of `art-style` (**8,573 lines** across SKILL + 14 `workflows/`) | image prompt is a *scene*, not a product redesign; the hook is rendered on-image; reference images respected |
  | **ad-unit** | NEW | copy + image + CTA cohere as ONE Meta ad |
- **Storage (no new paradigm):** cell copy = `campaign_files` rows; cell images = `campaign_images` rows; the `cells` file gets a bespoke viewer (the `PromptsViewer` pattern) that renders each cell as an ad-unit preview. This is where Q2's "complete, executable Meta ad unit" bar is met.

---

## What's LOCKED — do not relitigate

- **One apprentice, copy+art merged** (Q4/§4.1). Copy and visual must cohere as one unit; splitting them is the failure being killed.
- **Image issues = prompt construction, NOT the model.** [[feedback-nano-banana-prompt-construction]] — we use Nano Banana 2, which renders text beautifully. Root-cause every image failure to the concept→prompt step, never to the image model. The art binder's whole reason to exist is this.
- **Hook = research-anchored, swap-tested.** [[feedback-swap-test-whole-construction]] — a hook that works for any brand in the category is not brand-specific; test the *whole construction*, not just the data points slotted into a template. The hook-bank is an authoring artifact; beware worked-example leakage (the exact crack the strategy binder hit — S109).
- **Eval lens = Type A.** [[feedback-eval-type-a-lens]] — judge the output like a performance marketer reviewing for a D2C founder, not a creative director grading craft.
- **Style assignment lives in D (strategist), craft lives in F.** The cell receives an assigned style + Entity-ID diversity intent; it executes, it doesn't re-choose the lane.
- **No-marketing-copy boundary inverts here.** Research/comp are forbidden from writing copy; the cell's *entire job* is finished copy. The discipline that carries over is **research-anchoring + no-fabrication** (every claim in the copy traces to research), not copy-abstinence.

---

## The first-principles questions (answer these BEFORE building)

The cell was specced at the loop level but never reasoned at the binder level. These are its Q1-Q5:

1. **Identity & bar.** Who is this creative, and what is the quality bar they refuse to ship below? (Direct-response creative for a D2C founder, Type A lens — but written as a mentor persona like the other binders.)
2. **The deliverable, exactly.** What are the precise fields of one ad unit? (primary text / headline / description / CTA button + the image prompt.) What makes it *executable by a non-marketer* — the Q2 bar?
3. **Hook→art relationship.** Is it sequential (write the hook, then the art prompt renders it) or co-designed (concept first, copy and visual fall out together)? The merged-seat decision implies co-design — reason it through. This decides whether it's 3 binders or one integrated binder with 3 facets.
4. **How "the hook is rendered on-image" is enforced.** This is the #1 failure mode. What discipline guarantees the concept survives into the prompt and appears *in* the image (text + visual metaphor), not as a generic backdrop? This is the core of the art binder.
5. **What survives the 8,573-line art-style rewrite.** Is the 14-style library judgment or procedure? How much is load-bearing vs. box-ticking? A style is a *lane of visual judgment*, not a recipe — what does a style workflow become when rewritten judgment-not-procedure? (This is the biggest single rewrite in the project — scope it deliberately.)
6. **Reference-image handling.** When the founder uploaded the actual product/room, how does the cell make the prompt *use* it rather than generate a generic version? ([[project-eval-reference-image-ignored]].)
7. **The rubric.** What are the critical criteria? Candidates: `hook-on-image` (concept rendered, not generic), `image-is-a-scene` (not a product redesign), `copy-research-anchored`, `no-fabrication`, `locale-correct`, `unit-coherence` (copy+image+CTA are one ad), `reference-respected`.

---

## Open decisions (settle with the user at the top of the session)

- **Order: hook-first or art-first?** Hook-first is the natural pipeline order (art renders the hook). Art-first attacks the known #1 failure mode soonest and is the bigger rewrite. The user was mid-deciding when we chose to start fresh — ask.
- **Three binders or one integrated cell binder?** §4.2 lists three, but the merged-seat + co-design logic (Q3 above) may argue for one binder with hook/art/ad-unit as facets. Reason it; don't default.
- **How much of the 14-style library to port now?** All 14 rewritten, or a representative few to prove the judgment-not-procedure pattern, then port the rest? (Mirrors how research proved the pattern on a few moves first.)

---

## Inputs & fixtures needed

The cell mini-eval needs a **canned fixture** standing in for The Bet: `research.md` + **one chosen angle** (with its assigned visual style) + (optionally) founder reference images. Good news: real `thebet.md` outputs exist from the strategy mini-eval (`results/strategy-*-bets/`) and real `research.md` files exist in the strategy/comp fixtures — harvest an angle + style from a thebet.md to build the fixture, so the cell is tested on genuine upstream output, not hand-waved input. One shared fixture exercises all three binders (§4.2). Pick 2-4 brands across verticals (the usual discipline — incl. a visual-first vertical with reference images to exercise Q6).

---

## How to resume (commands)

```bash
cd cloudflare
# the proven harness — same pattern comp/research used; add a `cell` apprentice + rubric + fixtures
npx tsx eval/mini-eval/run-mini-eval.ts cell <brand>
# reference outputs already on disk to harvest fixtures from:
#   eval/mini-eval/results/strategy-*-bets/   (thebet.md — angle + assigned style)
#   eval/mini-eval/fixtures/{strategy,comp}/*/research.md
```

The harness is generic: a new binder needs a registry entry, a rubric `rubrics/cell.md`, an apprentice `apprentices/cell.ts`, and `fixtures/cell/<brand>/`. The cell apprentice has **no new MCP tools** (it reasons from canned files like strategy does) unless we decide it needs to read reference images (built-in `Read`, multimodal) — likely yes for Q6.

---

## State of the rest of Phase 1 (context)

Locked binders: harness (S109) · strategy (S109) · research (S110-112) · comp (S113). **Remaining after the cell: rigor-rubric/critic (parked by user this session), run-plan, next-move.** Then Step 2b (orchestrator 9-step rewrite + wiring + Bet critic loop + cell code-checks) → Step 3 integration on staging → 🚦 GO/NO-GO on the floor number. The cell is the last *creative-quality* binder; after it, the remaining binders are media-buying math (run-plan) and decision logic (next-move), both lower-variance.
