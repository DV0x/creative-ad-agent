# Session 127 — The format library plugs INTO the cell (machine, not skin), the Andromeda "sameness penalty" is debunked, the critic AND vision gate come out for the prototype, and the testimonial format entry is the next thing to build

**Date:** 2026-06-13
**Branch:** `new-ui` (everything uncommitted)
**Status:** A **design + decision session — no code, no skill edits, nothing built.** It resolved most of the S126-deferred "styles + reference layer" questions by working out exactly *how a format library plugs into the existing cell architecture*, ran one **web fact-check that corrected a load-bearing belief** (the Andromeda "sameness penalty"), and ended mid-build: we had agreed to build the **testimonial format entry as the first prototype** and had just pulled the TWT research fixture to ground it when we stopped to write this doc. The cell skill and the art-style skill are **untouched.**

> **Read first (continuity chain):** this doc → `SESSION_126_WHY_THE_CELL_IS_GENERIC_FORMAT_LIBRARY_PIVOT_18_FORMAT_REPERTOIRE_FROZEN_STYLES_AND_REFERENCES_DEFERRED_2026-06-13.md` (the diagnosis: LLMs reward the probable = the average; the format-library pivot; the frozen 18-format list) → `SESSION_125` (assembly direction) → `SESSION_123/124` (cell reset, leap-is-the-ceiling). Memory: `project_first_principles_redesign` (S127 block). The frozen 18-format list lives in **S126 Part 6** — this session did not change it.

---

## Part 0 — The arc in one paragraph

S126 froze the *what* (18 DR formats) and deferred the *how-it-looks* (styles + the reference layer). This session worked out the **how it plugs in**. We started from the user's observation that **Anderson Clay Diorama** is the one production style that *consistently* produces good, varied, non-overlapping output — studied it, and found *why*: it's a fully **pre-decided decision-machine** (so the renderer defaults to nothing) AND it binds the image to the **idea**, not the product (so concepts don't collapse across brands). But clay is *old architecture* — a pickable style on a menu — and the new cell deliberately killed the menu. The reconciliation: a menu of **FORMATS** (jobs) is safe; a menu of **LOOKS** (skins) is the dead style-bank. So the format library feeds the cell a proven **chassis to adapt**, and each format carries a clay-style **machine** (pre-decides execution) whose **look is derived from the brand**, never a fixed skin — *machine, not skin*. A web fact-check then **debunked the "Andromeda collapses 60%-similar ads into one Entity ID and penalizes you" belief** (agency lore, not Meta): the real effect is *within-account near-duplicate cannibalization*, not a cross-brand penalty — which downgraded the "every-client-gets-the-same-look" worry from *algorithm penalty* to *minor commoditization watch-item, guarded by the swap test*. On the cell flow: the **front half is rebuilt** (mine-5-takes → match-format-and-fill), the user removed the **critic** and the **vision gate** for the prototype (we are the gate by hand), and the **back half is kept** (shot spec → compile-verbatim → reference binding → render). We nailed the **copy-fill mechanism** (the format is a copy skeleton with named slots; the cell maps the angle's proof/promise/buyer onto them; selected-verbatim for claims + written-connective in a real voice; the format **bends to available material**, never the reverse) and the **skeleton-derivation method** (derive each format's slots from its *job*, not my prior; the same cut that builds the skeleton sorts the forbid list). We agreed the next move is to **build one format entry — testimonial — end to end** as the prototype, as a *full self-contained document like the clay doc*. We stopped mid-build to write this.

---

## Part 1 — Why Anderson Clay works (the study that seeded everything)

The user flagged clay as the **only** production style giving *consistently* good output, and asked why. Read `agent/.claude/skills/art-style/workflows/anderson-clay-diorama.md` (~497 lines) + the `art-style` SKILL.md. Findings:

1. **It pre-decides everything (the machine).** The whole workflow is *decision tables* — lighting signature, camera spec, composition rule, texture hierarchy, color-temperature arc, typography. By the time it reaches the renderer there is almost nothing left to default to the category average. **This is the transferable mechanism** — the same thing the new shot-spec does, just hardwired at the style level.
2. **Clay-diorama sits far off any category's visual average,** so it physically can't read as "average ad" — it reads as a deliberate art style.
3. **It binds the image to the IDEA, not the product.** It reads the hook's *psychology* → maps to a "visual world" (revealing/trapped/opening/…) → stages that emotion as a clay scene at the *moment of change*. Different brand → different research → different hook → different scene. **That's why concepts don't overlap across brands: clay preserves the input variety; a product-shot style (product-on-gradient) washes it out because it binds the image to the product, which converges across a category.**
4. **This sharpened "why generic":** generic = the image bound to *product-in-context* (a tiny, shared, high-average space every brand lands in). Specific = the image bound to the *idea* (brand-specific by origin). The fix isn't better texture; it's *what the picture is bound to.*

**The catch (and a live test we ran):** clay is **idea-bound and product-loose.** The user tested passing a whey product **reference image** to clay — **it ignored the reference** and built an invented clay scene. Two causes: (a) surface — the clay workflow builds its scene from scratch in words and has *no line that binds a product reference*; (b) deeper — clay's premise is that *everything* becomes clay, which is incompatible with preserving a photoreal, text-dense product (a whey label). So **clay is for staging ideas (story/service brands — theratefinder, the hotel, the school), not product-faithful DR.** For a product where the pack *is* the pitch, the route is the opposite: keep the product photographic and do the idea-work *around* it (which is what the TWT forward-pass testimonial already did).

**Decision:** keep clay for story/local brands where it wins; **steal its *machine*, not its *skin*.**

---

## Part 2 — The new architecture, mapped (so we never confuse it with the old one again)

The user made me study the new pipeline thoroughly because **clay is old architecture.** The two worlds:

**OLD (in production — `server/` + `cloudflare/`):** a **menu.** `research → hook-methodology (6 FIXED hook types: stat/story/fomo/curiosity/callout/contrast → a "hook bank") → art-style (pick 3–4 of 14 styles by category lookup) → prompts.json → nano-banana MCP → 6 images.` Copy and picture are **divorced** — hook-methodology writes the copy upfront; art-style only *visualizes* it. Clay is one of the 14 styles.

**NEW (the redesign — `agent/.claude/skills/{research,comp,strategy,cell}/` + harness `cloudflare/eval/mini-eval/`):** four specialists in a chain, each writing one file the next reads:
- **research → `research.md`** — detective on the open web (Perplexity Sonar Pro + WebFetch). Claim-vs-reality, buyer voice *verbatim & sourced*, the offer set, visual reality, identity, cost, calendar, gaps. Every line sourced; no marketing copy.
- **comp → `competitors.md`** — chess player on the live Meta Ad Library (Perplexity + ScrapeCreators). Crowded axes, demand-checked white space, revealed-winners (behavioural proxy, no perf data), read twice (playbook craft + wallpaper). Best-effort, never blocks.
- **strategy → `thebet.md`** — doctor not blender. Diagnoses the one blocker, matches *winnable want + honest proof + cleared friction*, sizes the test to budget (N angles). Each angle = **buyer+awareness · promise · proof (only this) · mandatories**, and hands the cell **the room, not the treatment** (explicitly NOT the look/voice).
- **cell → takes → shot spec → render → vision gate** — the AD+CW seat. Currently: mine ~5 way-ins → 5 bound hook+picture takes → **independent critic** culls on the swap test (can reject all) → freeze winner → shot spec → compile-verbatim → render (fal **Nano Banana Pro** = Gemini 3 Pro Image) → vision gate.

**How it's tested:** the mini-eval harness (`run-mini-eval.ts`) inlines a binder into a system-prompt, runs it as an *apprentice* in one `query()` with minimal tools (research/comp get Perplexity/ScrapeCreators MCP; strategy gets Read/Write only), produces the deliverable, then an **LLM judge** grades per-criterion against `rubrics/<name>.md` with a deterministic `passRule`. Each binder is tested **in isolation** on **held-out** brand fixtures. **The cell is NOT wired as an apprentice yet** (no `apprentices/cell.ts`) — it's run by hand via `server/tmp-cell-render.mjs`. The **orchestrator (9-step loop)** that chains all four in production **isn't built.** Models: research+comp on Haiku 4.5 (testing if Haiku carries the binder), strategy + judge on Sonnet 4.6.

**The text-rendering fix the user mentioned** is NOT a model thing (both old and new use Nano Banana Pro). It's the **shot-spec discipline**: every on-image word goes into the prompt *in quotes, with placement*; the product is bound to the real reference (edit endpoint); the vision gate reads the render back character-by-character. Verified on the TWT forward-pass render — copy baked in clean, product correct.

**Why clay is genuinely "old architecture":** the old world *picks from a menu*; the new cell *derives* — its layer-stack says outright *"style is not a thing you pick — it's the residue of the staging questions,"* the 6 hook types are gone, and a fixed look is on the **forbid** list (counterexample bank names "the tasteful center," "AI-gloss"; the swap test kills anything a rival could run). Clay's whole premise (a fixed, pickable look) is the thing this architecture was built to reject.

---

## Part 3 — The reconciliation: a format library that DOESN'T rebuild the dead menu

The user's proposal: *the cell picks a format based on the angle, each format has its own style, and the cell follows that format's style guide (like clay's) — "it's a menu, but within the DR formats we have, instead of open-ended."* The reconciliation we locked:

- **A menu of FORMATS is safe; a menu of LOOKS is the dead bank.** A **format** is a *job/structure* (testimonial, us-vs-them, PAS) — filled with each brand's real content, so two brands' testimonials look nothing alike; sharing the format does NOT make brands converge. A **look** is a *decorative skin* (clay) — share it and brands blur.
- **It doesn't even fight the cell's own rule.** The cell already says *"form emerges from the idea + the awareness stage, never picked from a menu."* So the cell does **not freely pick** a format — it **matches** the angle+awareness to the fitting one (cold+social-proof → testimonial; comparison promise → us-vs-them), then the library hands it the proven execution-machine. Same input (the idea), but the structure is *matched to a proven chassis* instead of invented from a blank page — exactly the seam where the cell kept failing. Invent → adapt.
- **The style chain:** the angle decides the format, the format decides the style. The **founder never picks the format/style** (that would be a non-marketer art-directing + a menu pick). The founder picks among **finished ads = the bet**; **spend is the real judge.** One angle → one format → one ad. Diversity lives **across the N angles** (strategy's job), not inside one.

---

## Part 4 — THE ANDROMEDA / GEM FACT-CHECK (a corrected, load-bearing belief)

We've been repeating "Andromeda collapses ads >60% similar into one **Entity ID** and **penalizes** sameness." A web check of Meta's own engineering posts (vs. agency blogs) corrected this. **This supersedes the `project_first_principles_redesign` "Meta ALGORITHMICALLY PENALIZES SAMENESS (Andromeda, MED-conf)" line.**

- **Andromeda = the shortlister (retrieval).** From tens of millions of ads it picks the few thousand a *specific person* might want. Old question: "who should see this ad?"; Andromeda: "which ad should *this person* see?" Matches on the person's engagement history + the ad's copy/creative/format.
- **GEM = the brain (ranking).** Meta's largest recommendation foundation model (teacher-student so smaller models serve it); predicts conversions and orders the shortlist. Drove ~5% more IG conversions / ~3% FB.
- **What Andromeda actually penalizes: nothing, by that name.** Meta's Andromeda post mentions creative diversity only as a *future* enhancement — **no "sameness penalty," no "Entity ID," no "60% rule."** That framing is **agency-blog lore.** The *real* effect: hand Meta 10 near-identical ads and they match the **same** people → **your own ads bid against each other** (higher CPMs, no extra reach). 10 distinct ads match 10 kinds of people → more reach. Diversity wins because duplicates give the matcher nothing new — not because sameness is punished.
- **The correction that matters for us:** that effect is **within one brand's own ad set** (your ads cannibalizing your ads), **NOT** "Brand A penalized for resembling Brand B" — different advertisers aren't the same entity. So **a shared look across brands is NOT an algorithm problem.** The "every client gets clay → penalty" worry drops from *algorithm penalty* to **minor commoditization / swap-test watch-item** (craft, not algo). The part Andromeda *does* reward — a varied **set per brand** — is already covered by strategy producing N genuinely different angles.
- Sources: Meta Engineering on **Andromeda** (engineering.fb.com, 2024-12-02) and **GEM** (engineering.fb.com, 2025-11-10); Search Engine Land synthesis (2025). The Entity-ID/penalty framing traces to agency posts (ppcblogpro, scaledon, adsuploader, recharm), not Meta.

---

## Part 5 — The "look" verdict, and the cell-flow changes

**Look verdict:** **each format gets its own style guide — but it's clay's *machine*, not clay's *skin*.**
- The guide **pre-decides the format's execution** (composition, where copy/product sit, type treatment, what to forbid) — clay-rich, so the renderer defaults to nothing.
- The **look is derived from the brand**, not stamped by the format: strong-identity brand → its palette/type/product; thin-theme SMB → a competent **floor default** we install. *(Exception: formats whose whole job is a designed look — a poster or type-led card — may carry more aesthetic opinion. Most DR formats shouldn't.)*
- Safe because (1) shared look ≠ algorithm penalty (Part 4), and (2) the brand's real content keeps each ad un-swappable even on a shared look. **The consistency we liked in clay comes from the machine + the gates, not a pretty skin.**

**Cell-flow changes (front half rebuilt; back half kept):**
- **Current:** `angle → mine 5 way-ins → 5 open-ended takes → critic culls (reject-all) → freeze winner → shot spec → compile → render → vision gate`
- **New:** `angle → match angle+awareness to a format → fill that format's machine with the brand's sharpest content → shot spec → compile → render → [we look]`
- **Changes:** "mine 5 → invent 5 takes" becomes "**match a format → fill it**" (invent→adapt). The **weld/furniture** (leap machinery) recedes. The **layer-stack staging derivation** moves *into the format's machine* (the "no silent visual decisions" rule stays; the format answers it). The **critic is REMOVED** (user's call). With it goes within-angle "kill 4, pick 1" — one angle → one ad, nothing to cull.
- **Vision gate also REMOVED — for the prototype only.** *Important distinction:* the critic caught **genericness** (now handled upstream by the format floor); the vision gate caught **render errors** (wrong/missing text, drifted product, missing mandatory) which **nothing upstream prevents** — the renderer botched exactly these in every past dry run (24g↔29g drift, missing Trustified seal, wordmark stacking). For a hand-run prototype **we are the gate** (we eyeball every render), so dropping it is fine; **it must come back at production scale.**
- **Kept (back half):** the **shot spec** (it's not a gate — it's what makes the render *right*), **compile-verbatim, reference binding,** render, and the **mechanical self-check + voice rules** (which matter *more* now, being the only checks left before render).
- **Reframe (so removal is informative):** removing the critic turns the prototype into a clean **test of the bet** — *does the format floor raise quality enough that we don't need a critic?* Good output → bet worked. Generic output → the library alone isn't enough; the critic returns.

---

## Part 6 — The copy-fill mechanism + the skeleton-derivation method (load-bearing)

**The cell still thinks hard about copy — it IS the copywriter.** (S127 corrected an over-simplification: "selected verbatim" applies only to the *claim-bearing* lines; the hook and framing are *written*.) What it can't do is invent a **claim** (stat/quote/product-fact) beyond the proof.

**The cell sees:** the **angle** (its room: buyer+awareness, promise, proof, mandatories) · **research.md** (the quarry — full buyer voice + product specifics) · **competitors.md** · the **real product images** · **counterexamples**. Clean split: **the proof field = what it may *claim*; research.md = the quarry it mines for voice, language, and the sharp truth.**

**How the cell fills a format:** a format is a **copy skeleton with named slots, each with a job.** The cell maps the angle's pieces onto the slots. Two kinds of on-image text:
1. **Selected verbatim** — real customer quotes, verified facts, the product's own label — straight from the proof. Zero invention.
2. **Written connective** — the hook headline (where it isn't a quote), transitions, the CTA — in a **real voice** (format hints whose: testimonial = customer's; founder-POV = founder's), bound by the surviving rule: *claim nothing the proof doesn't back.*
The **format sets the ratio** (testimonial ≈ all selected; us-vs-them needs a written contrast headline; founder-POV ≈ mostly written founder voice). **Awareness tunes emphasis** (cold → name the problem first; hot → the offer).

**The format BENDS to available material — never the reverse** (this is the honesty rule expressed as structure):
- **Material gates selection.** A format's required material is part of its match (no real review → can't pick testimonial; no verified number → no stat-card). The S126 frozen list's **"brand supplies" column IS this gate.** (Also the asset-routing: thin-asset SMB → copy/native formats; rich-asset → product formats.)
- **Within a chosen format, slots flex** to the real material (3 quotes or 1; drop empty slots, never pad). Structure stays rigid (proven); *amount* flexes. A rigid "fill every slot" template is exactly what makes a model fabricate — the old hook-methodology failure (forced to produce a "stat" hook with no real stat → invented one).

**How the copy SKELETON is derived (the method for all 18):** **from the format's *job*, decomposed into what's structurally necessary — NOT from my prior.** My prior of "what a testimonial looks like" tangles the necessary structure together with decorative clichés (stars, stock faces, "as seen in"). Job-logic separates them: **the same cut builds the skeleton (necessary elements) AND sorts the forbid list (the decorative stuff the job doesn't need).** Worked for testimonial: job = *peer proof closes the sale* → necessary = the proof (a real quote) / its credibility (an attribution) / the referent (product + specific claim) / the ask (CTA). Those four *fall out of the job*. Test: every slot traces to the job, or it's cut. Then **confirm against real proven ads** (comp's Ad Library, swipe files, the S125–126 research); where real winners beat the job-logic, they win.
- **"Standard" skeleton ≠ generic.** The 18 formats and their skeletons ARE the established DR canon (the practitioner "periodic table of static ads") — we are *not* inventing them, and standard is the *point* (it's the proven **floor**). **Genericness lives in the content, not the structure** — a standard testimonial skeleton filled with TWT's *"no bloating"* review + their real pack is specific; the same skeleton with vague praise is generic. **Format = floor; brand content = specificity. You need both.**

---

## Part 7 — The testimonial prototype (where we stopped)

Agreed: **build ONE format entry — testimonial — end to end** as the prototype. It does double duty: (a) building the first real one **produces the template** the other 17 copy; (b) running it the full way **tests the whole bet cheaply** before writing 18 docs. It also **answers the parked reference-layer question** — build it **text-only (no concrete reference image)**; if the render is generic, that's the signal a format needs a concrete reference ad; if it's good, the text-machine suffices.

**The user's last instruction:** build it as a **full, self-contained document modeled on the clay doc** — *not* the thin v0 bullet sketch. Same *richness* as clay in pre-decided structure, but **look-fields take brand inputs** (machine, not skin). Structure to follow (clay's, adapted): **Job/philosophy → Match (+ material gate) → Copy skeleton → Decision tables (composition, type, product placement, treatment) → Prompt template → Worked example → Forbid/anti-patterns → Checklist.**

**The v0 sketch produced in-conversation (to expand into the full doc):**
- **Job** — peer proof closes the sale; a real customer's specific words do the selling; the brand gets out of the way.
- **Match** — cold→MOF + a social-proof want; *material gate (hard):* needs ≥1 real verbatim review (no review → don't pick).
- **Copy skeleton** — **Hero quote** *(required, verbatim from proof)* · **Supporting quotes** *(0–2, flex)* · **Source chip** *(required per quote — the credibility)* · **Product + spec chip** *(required — the referent: real product + one verified fact)* · **CTA** *(required, plain)*.
- **Style-machine** — hero quote = visual hero (largest type, top weight); supporting smaller; product anchored to a side/corner, never center-stage; quotes in quotation marks verbatim; reading order hero→supporting→product→CTA; one type family, ~3 sizes; **feel: reads like proof someone *collected*, not a poster the brand *designed*.**
- **Look-derivation** — strong-identity → brand palette/type/photography; thin-theme → floor (neutral ground, one accent = brand color, real product photo, flat clean cards); zero-identity → render as an actual review **screenshot**.
- **Forbid** — star-rating rows ("★★★★★ 5/5") · stock-photo smiling faces · "As seen in" press-logo bar · invented app/review-card chrome · five-quote walls.

**TWT grounding for the worked example** (pulled from `cloudflare/eval/mini-eval/fixtures/strategy/thewholetruthfoods/research.md`, read this session — use this so next session needn't re-read):
- **Angle (testimonial-fit):** Indian first-time whey buyer, *category-aware/skeptical* ("all whey makes me bloated"), social-proof want. **Promise:** a clean whey that's *easy on the stomach / no bloating*. This is the brand's **verified, differentiated strength** (digestive comfort, confirmed across Amazon + brand-site + Instagram).
- **Proof (verbatim, claimable):** *"no bloating at all"* · *"I can finally have protein daily without stomach issues"* · *"easy on the stomach"* (Amazon.in + brand-site reviews, 2023–2026); attributions: "Amazon review," "thewholetruthfoods.com review."
- **Product/visual:** burgundy/maroon matte stand-up pouch, white sans-serif wordmark, **Trustified gold-circle badge**, "Bestseller" red ribbon (a *listing* overlay — watch: not always on-pack), Indian-flag mark. Identity = **coherent system** (respect it): palette burgundy + white + gold accent, clean modern sans, premium feel. DTC-only (no marketplace fallback).
- **FACT-TRAP for the worked example:** the research fixture is internally inconsistent on protein grams (says "29g per serving" in §1/§4 but "24g variant" in the offer set); the actual reference product is **Light Cocoa 24g**, and a past dry run had to correct a wrong 29g→24g **via pack pixels.** Use **24g**, bound to the real pack — this is exactly why the pixels-outrank-prose binding rule exists. (Relevant once we add a reference image; the prototype is text-only first.)

**We stopped here** — after reading the TWT fixture, before writing the full testimonial document.

---

## Part 8 — Open threads / not yet resolved

1. **The reference layer is still the real open question** (S126's deferred hard part). We did NOT resolve "is a clay-style text-machine enough, or does each format need a concrete reference *ad image*?" — the testimonial prototype is designed to **answer it empirically** (text-only first; judge the render).
2. **Where the format library lives** (file location / its own skill vs under the cell) — undecided; provisional for the prototype.
3. **How the cell *matches* angle→format** — we have the principle (match on angle+awareness+available material) but not a written matching table across all 18.
4. **The cell-skill rewrite** is gated on the prototype validating — do NOT rewrite the cell skill until the testimonial prototype proves the approach (the user has been burned by over-building the cell before).
5. **Critic + vision gate** are out *for the prototype only*; both return at production scale (the vision gate especially — render errors have no other catch).
6. **Selection / orchestration** (founder-picks-the-set UI, spend as the lock) — design exists, nothing built.

---

## Part 9 — NEXT SESSION (S128)

1. **Write the full testimonial format entry** as a clay-style self-contained document (structure in Part 7), machine-not-skin, skeleton derived from the job, forbid list as the other half of that cut. Ground the worked example in the TWT material in Part 7.
2. **Run it end to end on TWT:** match → fill (from the angle's proof) → shot spec → compile-verbatim → render (Nano Banana Pro) → **we look** (no critic, no auto vision gate). Text-only, no reference image.
3. **Judge the render against the bet:** is it specific (not generic), honest (claims inside proof), and did the text/structure render right? This tells us (a) does the format floor work without a critic, (b) does the shot spec hold the render without an auto gate, (c) **does a text-machine suffice or do we need a concrete reference image** (the parked question).
4. If it holds → generalize the doc's shape into the template and consider the next format (**founder-POV** — the native SMB unlock, never built). If it's generic → the critic and/or a concrete reference layer come back.

---

## Part 10 — Repo state

- **No code, no skill edits, nothing built this session.** `cell`, `art-style`, all binders, the harness — **untouched.**
- **This doc is the only new artifact.** The testimonial format entry was *not* written (we stopped before writing it).
- `server/tmp-cell-render.mjs` still the manual renderer (carried since S121).
- Everything uncommitted on `new-ui`.
- Memory: `project_first_principles_redesign` S127 block + the Andromeda correction; `MEMORY.md` index pointer updated.

---

## Part 11 — User verdicts this session (calibration corpus — verbatim)

- *"anderson clay diorama ... is creating good visuals ... its the only that is generating constant good outputs."*
- *"when we pass reference to the clay it will transform that product to clay style which is also cool stuff and those are scroll stoppers."* → (then) *"even after providing the reference it didnt use it. so i guess its mostly for story based ads."*
- *"we will keep the style since its working for local businesses. but we need to take the draft of this style and should adapt to other styles for each format."*
- *"the clay style is based on the old architecture."* / *"first thoroughly check the pipeline so you understand the new architecture."*
- *"its a menu but instead of making the cell to think openended we are making it to think within the DR formats we have. so each format will have its own style as well."*
- *"the style depends on what format the founder picks right?"* → resolved: no, the **angle** decides the format; the founder picks the **bet**, not the style.
- *"we are going to remove the critic for now."* / *"we dont need vision gate as well for the model."*
- *"the format is flexible right the cell cant fill the info it doesn't have."*
- *"then what is the format we are talking all along for DR? theres no standard format for 18?"* → resolved: the 18 ARE standard DR formats; standard = the floor; genericness lives in the content.
- *"our clay style is itself one document"* → build the testimonial entry as a full self-contained document like clay.
