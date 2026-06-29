# Audit — The Cell's Missing Conversion Spine (+ the diagnostic method)

**Date:** 2026-06-29
**Status:** Audit complete; redesign blueprint proposed; **no binder edits made yet** (review this first).
**Scope:** Why the new `agent-loop/` pipeline produced a structurally-correct direct-response ad that was actually a **branding** ad — traced from the rendered image all the way back to the founder brief — and the blueprint to fix it.
**Why this doc exists (two jobs):** (1) the redesign blueprint for the cell/strategy binders; (2) a worked record of *how we diagnosed it*, so the **method** is reusable for future eval work. Genericness is already solved by the binder (the "genericness conclusion" arc); this adds the **orthogonal** axis the binder is missing: *does it convert?*

---

## TL;DR — the one finding

The cell's mental model is a **sophisticated non-genericness engine with no conversion spine.** It optimizes relentlessly for *distinct + honest + on-concept* and is nearly silent on *does this drive the buy?* — at **every** layer: the founder brief never captures the objective, strategy frames the angle's promise as a want-claim (not a buying argument), the conversion event is excluded from the "room" both binders hand across, the cell recites the proof as the message with a "plain" CTA, and the critic has no conversion test (and in this run wasn't even independent). The result is a **branding ad in DR clothing, by construction.**

The fix is **not** a CTA patch. It is a **conversion spine threaded through all five layers — brief → strategy → the shared room → cell → critic — laid on top of the genericness engine, which we keep.**

---

## The trigger

First full `agent-loop` pipeline run (Phase 1, brand = The Whole Truth Foods, surface mode, 4 stages + 1 render, $3.20, 32 min).
Run dir: `agent-loop/runs/2026-06-29-12-52-54_thewholetruthfoods-com/`.

The cell produced **"The Stranger's Certificate"** — a lab-certification document as the hero, product leaning in, CTA **"Check the certificate →"**. Visually clean, swap-test-proof, honest, every line sourced. **And a credibility/branding ad, not a conversion ad.** The "average" feel the founder flagged was the tell.

---

## The diagnostic walk — step by step (the reusable trail)

This is the order we actually reasoned in. The *method* matters more than any single finding.

1. **Symptom: "the ad is average."** → First move: inspect the **compiled image prompt**, not blame the render model. (Standing principle: image failures root-cause to the *concept→prompt* step; Nano Banana renders text well.)
2. **Prompt vs the gold reference (`twt-testimonial-prompt-v13-shaker-fresh.txt`).** v13 is a UGC feed-native shot, specified to the rivet — *who shot it* (a 29-yr-old on her iPhone, 24mm), the light (7:30am, blown highlights), the objects (600ml shaker, wire whisk, condensation), the pack bound exactly, the review card down to `#FFA41C`. **Our prompt was far thinner** (no camera/lens, no light, no hex; the document body / seal / label left *unspecified* → garbled), **and it chose the wrong maker:** *"a photographer with a real camera (not a phone snapshot)"* — the opposite of feed-native UGC.
3. **"Did it just not read the reference files?"** → Checked the trace. The cell **read all 9** reference files (incl. `testimonial.md`, `layer-stack.md`, `shot-spec.md`). **So it's not an inputs problem — it's a judgment problem.** (Reusable: always separate *missing inputs* from *wrong judgment* before fixing.)
4. **It bent the format.** `testimonial.md:15` requires the PROOF to be *"a real customer quote."* The cell fed it an **institutional lab certificate** (self-labeled *"Testimonial (with institutional reviewer)"*). That single substitution cascaded: institutional proof → a *document* → an *editorial-photographer* maker → *"check the certificate"* CTA.
5. **Reframe — the maker is a *symptom*, not the disease.** The real failure is the **objective**: a DR *form* optimized for the wrong *goal*. The CTA is the tell — *"Check the certificate"* is a **verify** action (mid-funnel trust), not a **buy** action. Once the cell decided the job was "prove we're clean," the editorial maker + verify-CTA followed logically.
6. **Where does the objective leak? Strategy first.** The Bet is genuinely **good** — it has a `Part 2 — The Conversion Event` (*"Assumed: D2C website purchase... all 30 active ads carry 'Order now' CTAs"*), CPA-per-purchase sizing, and frames proof as *the mechanism to convert*. **But the leak:** the **angle** the cell inherits has a **trust-framed promise** (*"the one brand whose purity claim is a certificate a lab issued... the buyer can verify it"*) and **the conversion event sits *outside* the angle** (in Part 2, a global section).
7. **How does the cell derive the copy?** It **recites the proof field as the on-image message** — `SKILL.md:29` (every line from the proof), `:62` (*"the proof itself — sometimes the evidence is so sharp it IS the way in"*), `:78` (the hook carries the way-in), `testimonial.md:49` (*"almost all selected verbatim; only the CTA is written, plain"*). So copy = **(proof, recited) + (a "plain" CTA)**. **There is no transform from proof → the buying argument → the conversion action.**
8. **The strategy binder confirms it upstream.** It defines the promise as *"the one specific thing this ad commits to giving that buyer (their **want, turned into a claim the proof can back**)"* (`SKILL.md:232,255`) — i.e. the **want as a provable claim, never the buying argument**. A trust want → a trust promise, automatically. And it defines "the room" it hands down (`:189`: who · promise · proof, + mandatories `:195`) **byte-identically to the cell's definition of the room** (`cell SKILL.md:28`). **Both binders agree on a handoff unit that omits the conversion event — the shared-room seam.**
9. **The founder brief is the root.** In our run `founder-facts.md` was URL-only — *"name the gaps where founder intake (conversion event, budget, audience) would normally inform the work."* **The objective was never captured at intake.** Strategy *assumed* it and flagged it. A weak, assumed seed that then didn't propagate.
10. **The critic.** In this run **no independent critic ran** — the cell self-graded **inline** (a v1 limitation we wired into the cell's prompt; the cell even flagged *"self-judgment softens the swap test"*). The cell's own binder forbids this (`SKILL.md:170`: *"You do not grade your own work. The critic is independent."*). **Double gap:** (a) not independent (self-critique rubber-stamps the writer; same-model self-judgment blesses generic), **and** (b) even an independent critic, as `critic.md` is written, has **no conversion test** — so it would wave the branding ad through anyway.

---

## The structural audit — the cell's mental model

**The map (10 files, one spine).** `SKILL.md` = the mental model; flow = **room → mine ~5 way-ins → bound hook+picture takes → independent critic culls → shot spec → compile → render → vision gate.** Around it: the shared method — `layer-stack.md` (the *maker* keystone), `style-grammar.md` + `type-grammar.md` (look & lettering *derived* off the maker), `shot-spec.md` (the render contract), `counterexamples.md` (the floor), `critic.md` (the kill rubric) — and 3 format "machines" (`testimonial`, `founder-pov`, `pas-real-world`).

**What it gets RIGHT — preserve it.** This is a genuinely sophisticated **non-genericness engine**: the swap-test umbrella, the named floor (incl. tasteful-center / AI-gloss / AI-soft-3D), the maker-derivation keystone (*derive* the look, never pick it), the independent rule-not-taste critic with reject-all, the set-level spread reads (move / device / world / thumbnail), "machine not skin" formats with derived looks. The redesign must **not** weaken any of this.

**The core gap.** The conversion objective is a framing sentence (`SKILL.md:10`: *"ads that are bought, not admired… earn a click"*) with **zero operational enforcement** anywhere downstream. The binder handles the **awareness axis** (cold/warm/hot → how much cleverness) but not the **conversion objective** (what action the ad drives + that the CTA serves it).

---

## The conversion-spine diagnosis — where it leaks at every layer

| Layer | What it has today | What's missing |
|---|---|---|
| **Founder brief / intake** | objective optional → in our run, a flagged gap (URL only) | **capture** the conversion event, campaign goal, offer, funnel/audience as first-class |
| **Strategy — the promise** | promise = want-as-provable-claim (`SKILL.md:232,255`); conversion event in a separate Part 2 | frame the promise as the **buying argument**; pull the conversion action **into the angle** |
| **The shared "room"** | who · promise · proof · mandatories (`strategy:189` ≡ `cell:28`) | the **conversion action/objective** — excluded from the handoff unit on both sides |
| **Cell — copy derivation** | proof recited + "plain" CTA (`cell:29,62,78`; `testimonial:49`) | a **proof → buying-argument → conversion-action** transform; CTA = the conversion action; proof *serves* the buy |
| **Cell — format gate** | testimonial "PROOF = customer quote" is a *soft* gate | **harden** it (founder-pov's gate is hard); or add a **proof/credential** format for institutional proof |
| **The critic** | 10 kill tests (swap, floor, voice, honesty, drawability…); + in this run, **not independent** | **(1)** wire the independent critic for real (plan §7 A-vs-B); **(2)** add a **conversion kill test** ("branding ad in DR clothing → fail") |

Two secondary contributors, both real:
- **No product reference image** (URL-only run → text-to-image) → the pack label garbled and the concept drifted conceptual. v13 *binds* the real pack.
- **Off-piste → under-specification.** Every worked example is UGC (v13, founder-pov v3, pas gym-bag). The cell invented an institutional-document concept with **no exemplar** to anchor v13-level detail → garbled fine print.

---

## The redesign blueprint — the conversion spine

**Principle:** *non-generic* and *converting* are **orthogonal** axes. The binder nails the first; we add the second **without** touching the genericness engine. A distinct, honest, beautifully un-generic ad that doesn't drive the conversion action is still a failure for performance marketing.

Per-layer (the spine, top to bottom):
1. **Brief / intake** — make the **conversion event, campaign goal, offer, funnel/audience** first-class fields. If thin, the pipeline either demands them or assumes a sensible default **and propagates it hard** (don't let it stay a stranded assumption).
2. **Strategy** — reframe the **promise as the buying argument** (the want → *why you buy*, backed by proof), not just "the want as a provable claim." Pull the **conversion action** into the angle (the room), not a separate section.
3. **The room (the handoff unit)** — redefine it on **both** sides to carry the **conversion action/objective** alongside who · promise · proof · mandatories. This is the seam where the signal currently falls through.
4. **Cell** — add the **proof → buying-argument → conversion-action** step; the on-image **CTA = the conversion action** (proof *serves* the buy, never the destination); **harden the format material gate** (or add a credential format) so institutional proof doesn't get shoehorned into customer-testimonial; bind the **real product photo**.
5. **Critic** — wire the **independent** critic (clean-context subagent; plan §7) **and** give it a **conversion kill test** so a branding-ad-in-DR-clothing fails, not just flags.

---

## The reusable method (for future eval work)

How we found a *structural* failure from a single "average" output — generalize this:

1. **Trace the failing signal upstream, link by link.** The objective degraded at brief → strategy → room → cell → critic. Don't stop at the first plausible cause (the CTA); follow the signal all the way to its source.
2. **Separate the axes.** *Non-generic* ≠ *performance*. An output can be excellent on one axis and fail on the other. Name which axis the failure is on before fixing.
3. **The look is a symptom.** Root-cause creative-execution failures to the **objective/concept upstream**, not the render model. (The wrong *maker* was downstream of the wrong *objective*.)
4. **Inputs vs judgment.** Check the trace: did the agent *read* what it needed? If yes, it's a judgment/structure problem, not an inputs problem — and the fix is in the binder/handoff, not the wiring.
5. **Audit the handoff unit ("the room").** Signals not carried in the unit a stage inherits get silently dropped. Two stages can *agree* on a room that omits a critical field.
6. **The gate must be independent and test for the failure you care about.** Self-critique rubber-stamps the writer; and an independent critic still can't catch a failure mode its rubric doesn't name.

---

## Provenance

- **Run:** `agent-loop/runs/2026-06-29-12-52-54_thewholetruthfoods-com/` (`cell-output.md`, `thebet.md`, `images/…`, `trace.jsonl`).
- **Gold reference:** `cloudflare/eval/mini-eval/results/cell-dryrun/twt-testimonial-prompt-v13-shaker-fresh.txt` (+ the rendered v13).
- **Binders cited:** `agent/.claude/skills/cell/SKILL.md` (:10, :28, :29, :62, :78, :86, :96, :170) · `cell/references/{layer-stack,shot-spec,critic,counterexamples,style-grammar,type-grammar}.md` · `cell/references/formats/{testimonial,founder-pov,pas-real-world}.md` · `agent/.claude/skills/strategy/SKILL.md` (:189, :195, :232, :248, :255, :286).
- **Pipeline build:** `agent-loop/` (Phase 1) — see `docs/PLAN_LOCAL_AGENT_SDK_REBUILD_2026-06-29.md` (§7 = the open critic-placement decision).
- **Lineage:** extends the genericness arc (`docs/anthropic-learnings/00-genericness-conclusion.md`) with the conversion axis.
