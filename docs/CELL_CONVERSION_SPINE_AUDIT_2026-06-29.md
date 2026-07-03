# Audit — The Cell's Missing Conversion Spine (+ the diagnostic method)

**Date:** 2026-06-29
**Status:** Audit complete; redesign blueprint proposed; **no binder edits made yet** (review this first). **Extended 2026-06-30** — a deeper end-to-end re-trace surfaced a *second* missing field (proof priority/type), a consolidated **16-gap inventory**, and a single-field (**"buying argument"**) synthesis that collapses the fix. See **§ Session addendum (2026-06-30)** below the blueprint. Next = design the buying-argument field, then edit. **Run 2 (2026-06-30 — controlled A/B: real founder brief + bound product, nothing else changed): the prediction was WRONG.** Most structural gaps did not visibly bite — run-1's failure was largely *input-starvation* + a *phantom* FoodPharmer proof. But the cell still shipped **generic, off-strategy safe-slop** (it picks winners on un-swappability, not conversion) → the conversion-spine + independent-critic fix is **vindicated, not less urgent.** See **§ Run 2** at the end.
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

## Session addendum (2026-06-30) — deeper trace, 16-gap inventory & the single-field synthesis

A second pass re-walked the same run end-to-end — **rendered image → cell output → testimonial format → strategy (`thebet.md`) → compiled prompt** — and (a) confirmed the original thesis from new angles, (b) surfaced a **second** field the room drops (proof *priority/type*, not just the conversion action), and (c) collapsed the fix to **one new field** the room carries. The original blueprint above still stands; this refines it.

### New since the original audit

1. **The room drops a second field — proof *priority + type* — and that, not the cell, buried the testimonial.** The bet's strongest, most-native proof — **FoodPharmer** (India's most-trusted food-honesty reviewer; a real influencer endorsement) — was demoted to a **sub-clause under "Trustified Gold certification"** (`thebet.md:49`). Consequence: it **never surfaced in the cell's five way-ins** (`cell-output:25–29` = certificate · scar · FSSAI timing · COA · Unbox score). So the cell never "chose the certificate over the influencer" — *the influencer was never a candidate.* Root: strategy's **proof field is a flat, complete, unranked, untyped bucket** (`strategy:233`); its only disciplines are *claimable* + *complete*, never *which is strongest / what kind / which leads.* Compounded by **ungoverned angle naming** (`strategy:246`) → named "The Certificate," which the cell drew literally. **No seat owns proof prioritization** — strategy treats it flat, the cell can't re-litigate the room (`cell:28`) — so it falls through the same seam as the conversion action.
2. **The compiled prompt carries no purpose — only a genre tag.** It opens *"A direct-response ad creative for Meta… feed-native, scroll-stopping"* (`cell-output:185`) — platform + look, not the conversion job. Satisfies the *letter* of the existing "render prompts must state the purpose" rule but not its spirit: *"direct-response ad for Meta"* is a **genre**, not a buying argument. The spine is absent at the **final** layer too.
3. **The honesty gate runs backwards, and the material gate has a hole.** The cell **killed** Take 2 (faked search-screenshot) and Take 3 (faked WhatsApp-forward) for fabrication (`cell-output:39,42`), then **crowned** Take 1, which fabricates an **entire lab certificate** (`:33`); the vision gate then passed the garbled fake rows because they *"read as real test data… at feed scale"* (`:284`). The testimonial **material gate never defines "review"**, so institutional proof was force-fit (`cell-output:10`) — strictly, the proof held **no customer review at all** (one influencer + institutions). Missing the **general** rule *"never render an artifact you have no real image of"*; the existing anti-fabrication lines are phrased only around *review-screenshot* chrome (`testimonial:70,117`).
4. **The maker was *starved*, not broken — keep the layer-stack binder.** The compiled maker ran generic — *"a photographer with a real camera"* (`cell-output:226`) — versus v13's specific maker (`testimonial:107`: iPhone main-camera, 7:30am window light, named surfaces/objects/CTA hex). Cause: the maker engine derives specificity from **real provenance**; a **fabricated** artifact + **no bound product reference** = nothing real to resolve → generic maker + unspecified document body → garbled render. A **downstream symptom** of the fabrication, not a layer-stack failure.

### The consolidated gap inventory (16, in 5 buckets)

**A — the missing conversion spine** (one cause, 5 layers):
1. Promise = want-as-provable-claim, not the buying argument (`strategy:232`).
2. The room omits the **conversion action** (`strategy:189` ≡ `cell:28`).
3. The cell recites proof + a "plain" CTA — no proof→argument→action transform (`cell:29,62,78`).
4. The critic has no conversion test.
5. The compiled prompt opens with a genre tag, not the purpose (`cell-output:185`).

**B — proof handling (priority & type)** — the FoodPharmer burial:
> ⚠️ **Corrected by § Run 2 (below): the "FoodPharmer buried hero" was a *phantom*.** Run-2 research, which explicitly checked, found **no** standalone FoodPharmer TWT review (`research.md:290`) — run-1 mis-attributed it. The flat-proof **mechanism** (gap 6) still stands; the **burial exemplar** (gaps 7–9) does not. Run-1's real failure here was **fabrication** (gap C), not burial.
6. Proof is a flat, complete, unranked, untyped bucket (`strategy:233`).
7. The strongest, most-native proof got buried (`thebet.md:49`) → never reached the cell's way-ins (`cell-output:25`).
8. Angle naming ungoverned (`strategy:246`) → "The Certificate," drawn literally.
9. No seat owns "which proof is the hero" — falls through the seam.

→ **A + B are both fixed by the one *buying-argument* field (below).**

**C — the fabrication / honesty hole** (a real separate bug):
10. The cell fabricated an artifact with no real image (fake cert → garbled rows/seal).
11. The testimonial material gate doesn't define "review" → institutional proof force-fit (`cell-output:10`); strictly, no customer review existed.
12. The honesty gate runs backwards — killed two small fakes, crowned one big fake (`cell-output:39,42,33`).
13. Missing the general rule "never render an artifact you have no real image of" (`testimonial:70,117`).

**D — downstream symptom** (auto-clears once C + the spine are fixed):
14. The maker ran generic — fabrication + no reference starves the specificity engine (`cell-output:226`).

**E — build / input gaps** (wiring, not philosophy):
15. No independent critic wired — the cell self-graded (v1 limitation).
16. No real product reference bound → garbled tub label.

### The synthesis — one field: the *buying argument*

A + B collapse into **one new field the room carries**, on both sides:

> **Buying argument** = *this buyer should **[conversion action]** because **[the single most persuasive, correctly-typed proof for them]**.*

It encodes the three things that kept leaking: the **conversion action** (the spine), the **hero proof ranked + typed** (customer / influencer / institution), and **why it converts**. Naming it for TWT-cold surfaces *FoodPharmer's endorsement* as the hero → the cell leads with his **real** review instead of a fabricated cert (gaps 10–14 clear) → the maker gets real provenance (14 clears) → the **CTA = the action**, not "check the certificate" (branding→DR).

This **refines** blueprint items 2 + 3 (reframe the promise *and* redefine the room) into a **single field**, and **adds proof priority/type** to it.

**Ripple** (anchored to the field):
- **Strategy** sets the buying argument; promise = *why you buy*; proof ranked + typed; angles not named after literal artifacts.
- **Cell** serves it: lead with the hero proof; CTA = the action; the **compiled prompt opens with the purpose**.
- **Critic** enforces it: actually independent (clean context) + a conversion kill-test ("branding ad in DR clothing → fail").
- **Backstops** (not the spine): the honesty rule (gap 13); bind a real product reference (gap 16); wire the independent critic (gap 15).

**The collapse:** 16 gaps → **1 spine + 1 proof-axis (= the one buying-argument field) · 1 fabrication rule · 2 wiring fixes.** Not fragmented.

### Next
Design the **buying-argument field** — exactly what it contains and how it sits in both the strategy and cell "room" — then the binder edits are mostly mechanical, then re-run (TWT A/B vs this run, with a real product reference bound). Open sub-decisions carried forward: **bend testimonial vs. add a credential format** (gap 11), and **critic wiring** (plan §7, A-vs-B).

---

## Run 2 — the brief + bound-product experiment (2026-06-30)

**Setup (controlled A/B).** Re-ran the *same* pipeline (TWT, surface mode, full spine) changing only the **inputs**: a real **founder brief** (conversion event = D2C purchase, goal = cold new-customer acquisition, ₹4.2 L/mo, ₹300 CPA, India) + a **bound product photo** (the real Light Cocoa pack, uploaded to fal → `refs.json`). Binders + pipeline code byte-identical. Run dir: `agent-loop/runs/2026-06-30-08-49-05_thewholetruthfoods-com/`. $3.22, 27.8 min. **Prediction, set in advance:** the structural gaps repeat, because no input rewrites a binder rule.

**Outcome: the prediction was wrong — and that *is* the finding.**

**1. The FoodPharmer "buried hero" was a phantom (corrects gap B's exemplar).** Run-2 research *explicitly* checked (queries #7, #11) and concluded (`research.md:290`): "FoodPharmer's direct review of TWT whey protein was not found." The only FoodPharmer/TWT content is a **brand-made video** where he is a guest and mildly *critical* (`:50`); the real lab tester is **"Golden Age Exclusive"** (`:36,:46`); FoodPharmer's ecosystem actually endorsed a **competitor** (OWN, `:170`). So run-1's *"Quote from FoodPharmer review: 'Trustified Gold Certified'"* was a **mis-attribution**, and the whole "strategy buried the strongest proof" thread rested on it. **Re-classification:** run-1's failure was **fabrication** (it invented a proof source, then a fake cert around it), not burial. Gap B's *mechanism* (flat unranked proof) is still structurally real but **unproven** here.

**2. The Bet improved sharply — the brief carried the conversion spine.** With a real brief, strategy reframed the promise as the **buying argument**, unprompted: Angle 2 literally named **"The Lab Result as the Buying Argument"** — its promise says the above-label result *"is a buying argument, not a marketing claim"* (`thebet.md:64,68`); Angle 1 "The Switcher's Story" — *"the price difference bought them actual certainty"* (`:44`); an explicit **anti-fabrication mandate** — *"a real buyer's experience, not a fabricated testimonial… not a brand-invented character"* (`:58`); honesty discipline jumped (flagged 3× that the Trustified cert was on the unflavoured WPC not Light Cocoa; pushed back on ₹300 CPA as aspirational; flagged the product page 403). **But the structure was unchanged** — proof still a flat unranked/untyped bucket, angle fields unchanged; conversion lives in Part 2 + the promise *text*, not a dedicated field. **Content improved (input-driven); mechanisms still latent.**

**3. The cell: NOT fabricated, but GENERIC + off-strategy (the new failure mode).** The cell chose Angle 1 and built the **"suuuuper light" verbal weld** (TWT's pack copy echoed verbatim by a real buyer's Instagram post). Right: **zero fabrication** — real buyer quote, real bound product; it *refused to invent* the resolution (killed way-in #1, `cell-output:25`); product rendered recognizably. **But the ad is generic + off-strategy:**
- **Generic form** — a flat designed **product-poster** (product centred on flat brand-colour blocks, headline above, quote below, CTA pill): the default DTC template; fails the Canva test it claimed to pass; textbook slop (`SKILL.md:177`).
- **Off-strategy copy** — *"suuuuper light"* is a **taste/texture** claim (every protein brand's line), not the **trust/certainty** buying argument the Bet identified. Headline starts mid-sentence; the same phrase repeats top + bottom; the "two-voices" weld is invisible to a scrolling viewer.
- **Wrong style for a testimonial** — chose a **designed poster** (made-object) against the format's **native-by-default** rule (`testimonial:69`); a typeset "buyer quote" reads as **brand-authored**, killing the peer-proof (`testimonial:18`). It even **passed over an available native take** (Take 3, a real Reddit screenshot) for the poster, on *"un-swappability."*

**4. Why it went generic — the conversion objective leaked again, at the cell.** The **on-strategy take** (the trust/certainty payoff) was **killed at way-in mining** (`cell-output:25`): no buyer quote proved it, the cell rightly won't fabricate — but it **didn't escalate** (route to the lab angle / flag strategy); it quietly dropped to a taste claim. The cell then ranked its **winner on "un-swappability,"** not conversion/on-strategy (`cell-output:80`). And the critic is the **maker self-grading (not independent)** (`cell-output:61`; forbidden by `SKILL.md:170`), so it **did not reject-all** the weak off-strategy batch (`SKILL.md:131`: *"forcing a pick from a failed batch ships the least-bad generic"*). It blessed the safe slop.

**5. Render fidelity: the bound product's FINE PRINT garbles.** nano-banana's edit endpoint **regenerates** the pack (it does not composite), so text below its resolution garbles **even with the reference bound** (front body copy, made-with/without panels, side panel, *"NUTRABALITICAL FOR ABULTE"*). Big elements clean; small print mangled. Minor at feed scale, real on a zoom, ironic for a *"read the label / #nothingtohide"* brand. **Pixel-exact fine print needs compositing, not generative edit.** The self-vision-gate missed it (again).

### The root cause — a research want-weighting regression (vs the 06-08 eval)

The whole Run-2 chain traces to **research picking the wrong hero want.** The validated **2026-06-08 strategy eval** (`cloudflare/eval/mini-eval/results/strategy-2026-06-08-twt-run2.md`, PASS) bet on **digestive comfort** — the brand's *verified, open-lane, ownable* differentiator (*"no competitor leads with this; the lane is yours"*) — and produced **two distinct, type-aligned angles** (the Bloat-Burned Switcher · the Ingredient Skeptic). Run-2's **live research led with TRUST**, and strategy inherited it.

**Evidence (run-2 `research.md`):** the **macro JTBD** is stated as *"feel certain they are not being cheated… **Trust is the product, not just protein"*** (`:149`). The decision criteria are ranked *"by how often they appear"* (`:158`) → **lab-tested/certified #1** (`:160`), **digestion/no-bloating #5** (`:164`). Digestive comfort is present (hero-product JTBD `:152`, criterion #5) — just **demoted.**

**Why it weighted trust over comfort — three mechanisms:**
1. **Ranked by frequency-of-mention, not conversion-power.** In a scandal climate, people *talk* about trust/lab-testing most → it ranks #1. But most-discussed ≠ best-converting. Research even flagged trust *"is NOT a cold-traffic conversion lever"* (`:165`) — then ranked it #1 anyway. It **surfaced the contradiction and didn't resolve it**, punting to strategy (which picked the loud one).
2. **Led with the CATEGORY anxiety, not the BRAND's differentiated want.** *"Trust is the product"* is what *every* brand in a scandal market faces (table stakes, crowding). The *ownable* want — digestive comfort, which no rival runs — is the conversion bet. Research led with the generic, not the differentiated.
3. **Recency/drama bias.** The FSSAI crackdown was "this week"; the mislabelling scandal is the loud current narrative. The recency-filtered, scandal-probing live run over-weighted the dramatic current event over the steady product truth. The 06-08 fixture (pre-scandal-peak) surfaced the steady comfort want.

**So research failed at its core job — getting the conversion-right JTBD — by using the wrong yardstick:** it ranked wants by *what's most discussed*, not *what converts + what this brand uniquely owns*, and left its own "loud-but-not-a-cold-lever" contradiction unresolved.

**The eval-vs-live lesson:** a strategy **PASS on a *curated* research fixture does not transfer** when the *live* research weights the want differently. The binders were validated on inputs the live pipeline doesn't reproduce. **Fix-pointer:** research must rank the JTBD by *conversion-power + differentiation* (the ownable, cold-effective want), not frequency-of-mention — and **resolve** loud-but-weak contradictions rather than punt them downstream.

### What Run 2 changes
- **Run-1's failure was largely input-starvation**, not binder-structure — empty brief, no product ref, a phantom proof attribution → a fabricated cert. With good inputs the *existing* binders produced an honest, conversion-framed Bet and a non-fabricated ad.
- **The conversion spine is VINDICATED, not "less urgent."** The brief fixed **strategy's** framing; the **cell** still selects winners on craft (un-swappability), not conversion → generic + off-strategy. The fix is still needed **at the cell**: a **conversion/on-strategy selection criterion**, a **real independent critic** that actually fires reject-all, a **conversion + genericness kill-test**, and **upstream escalation** when the on-strategy argument has no proof.
- **Fabrication (gap C) did not recur** with good inputs + the honesty gate holding.
- **Failure modes by run:** run-1 = **fabrication** (fake cert); run-2 = **genericness + strategy-drift** (safe-slop designed poster, taste claim). Different failure, still a failed ad.
- **New residual issues:** (a) fine-print fidelity on bound products → needs compositing; (b) the cell's winner-rule optimises un-swappability over conversion; (c) no escalation when the on-strategy argument lacks proof; (d) the self-critic won't reject-all its own batch.
- **Honest correction:** the first read of Run 2 over-called the ad "genuinely good" — graded against run-1's fabrication, not the absolute bar. It is **generic, off-strategy slop**: a different failure, not a success.

**Provenance (Run 2):** `agent-loop/runs/2026-06-30-08-49-05_thewholetruthfoods-com/` (`thebet.md`, `cell-output.md`, `research.md`, `images/`). Harness: `agent-loop/run.ts` (now accepts `--founder=<brief.md>` + `--product=<image>`; uploads to fal → `refs.json`). Brief: `scratchpad/twt-founder-brief.md`.

---

## The reusable method (for future eval work)

How we found a *structural* failure from a single "average" output — generalize this:

1. **Trace the failing signal upstream, link by link.** The objective degraded at brief → strategy → room → cell → critic. Don't stop at the first plausible cause (the CTA); follow the signal all the way to its source.
2. **Separate the axes.** *Non-generic* ≠ *performance*. An output can be excellent on one axis and fail on the other. Name which axis the failure is on before fixing.
3. **The look is a symptom.** Root-cause creative-execution failures to the **objective/concept upstream**, not the render model. (The wrong *maker* was downstream of the wrong *objective*.)
4. **Inputs vs judgment.** Check the trace: did the agent *read* what it needed? If yes, it's a judgment/structure problem, not an inputs problem — and the fix is in the binder/handoff, not the wiring.
5. **Audit the handoff unit ("the room").** Signals not carried in the unit a stage inherits get silently dropped. Two stages can *agree* on a room that omits a critical field.
6. **The gate must be independent and test for the failure you care about.** Self-critique rubber-stamps the writer; and an independent critic still can't catch a failure mode its rubric doesn't name.
7. **Run the controlled A/B to separate input from structure — then grade on the absolute bar.** A single bad output can't tell you whether the *binder* or the *inputs* failed. Re-run changing **only the inputs**: if it improves, the gap was starvation; if it repeats, it's structural. (Run 2 showed run-1 was *mostly* starvation — but also that a good brief only fixes the stage it feeds; downstream stages re-leak the objective.) And judge the result on the **absolute bar** — *does it convert / is it non-generic* — never on "better than the last failure": a non-fabricated ad can still be generic slop.

---

## Provenance

- **Run:** `agent-loop/runs/2026-06-29-12-52-54_thewholetruthfoods-com/` (`cell-output.md`, `thebet.md`, `images/…`, `trace.jsonl`).
- **Gold reference:** `cloudflare/eval/mini-eval/results/cell-dryrun/twt-testimonial-prompt-v13-shaker-fresh.txt` (+ the rendered v13).
- **Binders cited:** `agent/.claude/skills/cell/SKILL.md` (:10, :28, :29, :62, :78, :86, :96, :170) · `cell/references/{layer-stack,shot-spec,critic,counterexamples,style-grammar,type-grammar}.md` · `cell/references/formats/{testimonial,founder-pov,pas-real-world}.md` · `agent/.claude/skills/strategy/SKILL.md` (:189, :195, :232, :248, :255, :286).
- **Pipeline build:** `agent-loop/` (Phase 1) — see `docs/PLAN_LOCAL_AGENT_SDK_REBUILD_2026-06-29.md` (§7 = the open critic-placement decision).
- **Lineage:** extends the genericness arc (`docs/anthropic-learnings/00-genericness-conclusion.md`) with the conversion axis.
