# Session 129 — Type & style grammars BUILT, founder-POV (2nd format) VALIDATED and **v3 LOCKED**, and the render fixes came from **specification, not a compositing pipeline**

**Date:** 2026-06-15
**Branch:** `new-ui` (everything uncommitted)
**Status:** A **build + validation session.** We wrote the two missing reference books (`type-grammar.md`, `style-grammar.md`), wired the brain to point at them, built the **second format** (`founder-pov.md`), validated it over **3 hand-run TWT renders** and **locked v3** as its reference image. The big course-correction: the product-fidelity + text-alignment problems were fixed by **better prompt specification** (purpose-led framing + "reproduce 100% identical / exclude e-commerce overlays" + a simple aligned grid) — **not** by the compositing pipeline I'd briefly proposed. Compositing is downgraded to a possible *future pixel-exact refinement*, not a blocker.

> **Read first — continuity chain (previous docs indexed):**
> - `docs/SESSION_128_*2026-06-14.md` — testimonial format built + validated (13 renders), the **maker keystone**, Fork B locked, learnings encoded.
> - `docs/SESSION_127_*` — the design session that set up S128 (machine-not-skin; critic/vision-gate pulled; testimonial-prototype-next).
> - `docs/SESSION_126_*` — the format-library pivot + the frozen 18-format list.
> - `docs/SESSION_125_*` — assembly-not-invention.
> - Full S108→S129 arc + current status: memory `project_first_principles_redesign`. Related new memories: `feedback_product_100_identical`, `feedback_prompt_include_purpose`. Also `feedback_binder_teaches_thinking_not_looking`.

---

## Part 0 — The arc in one paragraph

The S128 plan said: write the two reference books the conversation kept circling (a **type grammar** and a **style grammar**), then prove the thin-format mold generalizes by building a **second** format. All done. The grammars are *dictionaries* (signal · when-earned · resolve-to-the-real-thing · fake-twin), **not menus**; the brain (`layer-stack.md`) stays the *spine* and now points at them. Founder-POV — structurally the **opposite** of testimonial (authored voice vs selected verbatim; founder-as-maker; action allowed; a *second* reference asset, the founder likeness) — reached good, on-brand creative direction in **3 renders**, and the early fixes were *applications of existing layer-stack rules, not new discoveries* → **the mold generalizes.** Along the way the user caught two execution defects (a website "Trustified" badge baked onto the pack; crooked typography) and pushed back hard on my instinct to build a compositing pipeline: *"why are you making it complicated, the image renders well — just add right specification."* They were right. **v3** fixed both with specification alone (purpose-led prompt + "reproduce 100% identical / exclude the Bestseller & Trustified overlays" + a left-aligned single-margin grid) and is now the **locked** founder-POV reference. We captured the prompt-completeness lessons in the binder and deferred any automated gate.

---

## Part 1 — The two grammars BUILT + the wiring

- **`cell/references/type-grammar.md`** — the maker's *handwriting*. 7 hands, ordered found → borrowed → designed: **system/native · handwritten · stamped · editorial · condensed-caps/loud · rounded/friendly · neutral-grotesk/premium.** Honest ceiling: you can't name a typeface to the renderer, only a **vernacular + knobs** (weight/case/width/contrast + a "like X" reference). Type is read *off the named maker*, never picked.
- **`cell/references/style-grammar.md`** — the maker's *whole look*. 5 looks: **photographic-real · constructed/poster · borrowed · crafted-sculptural · drawn/illustrated.** The crafted look **routes into the existing clay workflows** (`art-style/workflows/anderson-clay-diorama.md`, `soft-brutalism-clay.md`, + craft cousins) instead of re-teaching them.
- **Entry shape (both):** Signal · When earned · Resolve to (the *real, nameable* convention — the dig-here part) · The fake twin (the generic version to forbid).
- **`cell/references/layer-stack.md` wiring:** two additive pointers — step 4 hands off to `style-grammar.md` (look) + `type-grammar.md` (lettering); the bottom "style questions" point at the style grammar. Spine stays the spine; grammars are the dictionaries it looks words up in.

**Architecture:** name the maker → look resolves in the style grammar → lettering resolves in the type grammar → crafted look routes into clay. One maker, everything falls out.

---

## Part 2 — Founder-POV: the 2nd format, validated, **v3 LOCKED**

- **`cell/references/formats/founder-pov.md`** — written to the thin Fork-B shape, deliberately **structurally opposite** to testimonial:

  | | Testimonial | Founder-POV |
  |---|---|---|
  | who talks | brand quiet, customer speaks | the founder speaks |
  | copy | selected **verbatim** | **authored** in the founder's voice |
  | material gate | ≥1 real review | a real founder + a *true* origin |
  | maker | a review artifact | the founder in a real artifact (selfie-video still / note / post) |
  | extra | — | needs a **2nd reference asset** (the founder likeness) |

- **The gauntlet (hand-gated, `results/cell-dryrun/twt-founder-pov-v{1,2,3}`):**
  - **v1** — native founder talking-head, product bound, face a stand-in. Worked as native UGC, copy specific — but the *picture* was a generic "founder holds sealed pack," and "See what's inside →" over a sealed front was a contradiction. Rule applied: *make the hook literally true / does the staging add?* → derive the **action** from the claim.
  - **v2** — same copy, but he **shows what's inside** (a scoop of the real cocoa powder); layout pinned to a grid. Action fix landed. **User then caught:** a "Trustified" badge baked onto the pack (from my prompt + a listing-image reference) and still-crooked typography.
  - **v3 (LOCKED)** — purpose-led prompt + "reproduce 100% identical / exclude the Bestseller & Trustified website overlays" + a left-aligned single-margin grid. **Pack rendered clean, text aligned.** Locked as the founder-POV reference (`founder-pov.md` worked example now points at `twt-founder-pov-v3.png`).
- **Finding:** the mold generalizes — the fixes were *applications* of existing layer-stack rules. Copy-discipline also generalized (answer + skin-in-the-game lines moved to **post copy** to keep the frame native — "the maker disciplines the copy," applied to a new format).
- **Open nit:** the burgundy CTA pill rendered light 3× — needs a forceful "solid filled maroon" spec, or accept the native light pill.

---

## Part 3 — The course-correction: SPECIFICATION, not compositing

Mid-session I diagnosed the product-fidelity + alignment defects as **render-mechanism limits** and proposed building a composite pipeline (generate scene → paste real product + real text layer). The user pushed back, and was right. **v3 proved better *specification* fixes both:**

1. **Product fidelity** — the "Trustified" badge wasn't a model limit; it was **my prompt** (I described "gold Trustified seal" from doc lore) **+ a bad reference** (an e-commerce listing image with a "Bestseller" ribbon and a "Trustified" badge overlaid on it). Spec fix: *"reproduce the pouch 100% identical; those overlays are not on the product — exclude them."* → clean pack.
2. **Text alignment** — the model *can* align when the spec is **simple and explicit** (one left margin, not three competing alignments). It struggled only because my spec was ambiguous.
3. **Purpose** — opening the prompt with *"create a direct-response ad creative for Meta…"* lets the model reason about the whole frame as an ad.

**So the render path works via specification.** Compositing is only for *literal pixel-exact* fidelity someday — **not** the bottleneck. (This corrects the mid-session "compositing next" conclusion.)

---

## Part 4 — Rules locked + binder updates

- **Uploaded products render 100% identical** (never redesigned, nothing added/removed). Memory `feedback_product_100_identical`; encoded in `shot-spec.md` (binding field + compile rule: "reproduce 100% identical; exclude e-commerce overlays").
- **Prompts lead with the purpose** ("a DR ad creative for Meta"), structured PURPOSE → SCENE → PRODUCT → TEXT. Memory `feedback_prompt_include_purpose`; encoded in `shot-spec.md` compile rule 1.
- **Prompt-completeness checklist** kept in the binder (`shot-spec.md` sweep now names *which* device, **layout/alignment**, and **CTA color** — the exact things that slipped). **Automated gate deferred** ("we'll see later") — for now the sweep is the contract, run by hand.
- **Worked-example "Trustified lore" fixed** in `testimonial.md` + `founder-pov.md`: the product is bound **from the pixels**, not described in prose (the docs are brand-agnostic; only the worked example modeled describe-from-prose).

---

## Part 5 — Repo state

- **New (uncommitted, `new-ui`):** `cell/references/type-grammar.md`, `cell/references/style-grammar.md`, `cell/references/formats/founder-pov.md`; render artifacts `results/cell-dryrun/twt-founder-pov-v{1,2,3}.{png,txt}` (v3 = locked reference).
- **Edited:** `cell/references/layer-stack.md` (2 grammar pointers), `cell/references/shot-spec.md` (100%-identical binding + overlay rule + purpose-lead + completeness sweep additions), `cell/references/formats/testimonial.md` (worked-example bind-from-pixels), `cell/references/formats/founder-pov.md` (worked example → v3 locked).
- **Untouched / gated:** cell `SKILL.md` (match→derive wiring still gated), `critic.md`, `counterexamples.md`; the art-style skill (clay machines — routed into, not changed); harness `server/tmp-cell-render.mjs` (still binds **one** reference; two-reference ≈ 3-line change, deferred until a real founder-likeness render is needed).
- **Memory:** `feedback_product_100_identical` + `feedback_prompt_include_purpose` added; `project_first_principles_redesign` updated (v3 LOCKED; next = scale formats).
- **Nothing committed** — per the "no commits until tested end-to-end" rule.

---

## Part 6 — NEXT (S130)

1. **Scale the remaining formats** — the mold is proven across **2** (testimonial + founder-POV). Pick the next from the frozen 18-format list (S126 Part 6), write the thin format doc, run a short hand-gauntlet, lock a reference render. Repeat.
2. **Then wire match→derive into the cell `SKILL.md`** (still gated) so the cell picks the format from the angle and derives the look via the grammars automatically.
3. **Deferred:** the automated prompt-completeness gate; the two-reference harness tweak + a real founder-likeness asset (for a true founder-POV render); the burgundy-CTA spec fix; the rawer customer voice / research depth (S128 thread); the angle→format matching table; compositing (only if/when literal pixel-exact fidelity is required).

> **⚠ Guardrail when scaling — worked-example leakage (ADAPT, don't COPY).** What we lock (v3, the worked examples) teaches the **moves**; the cell must **adapt** them per brand, never **copy** the surface. Reused across brands = the **machine** (format job + copy skeleton + forbid) and the **method** (read provenance → name maker → derive every element). NOT copied = the surface (v3's cocoa scoop / kitchen / specific maker = *TWT's* derivation only). Two founder-POVs should look nothing alike. **The risk is real and already proven:** in the strategy binder (S109) the apprentice copied facts/phrasing straight from its worked examples — the fix was to pull worked examples **OUT of the agent's runtime context** (authoring references only) and lean on the gate. So when wiring `SKILL.md` + scaling: (a) treat each worked example / locked render as *one derivation to learn the move from*, not a template; (b) the **swap test** ("could a rival run this with a logo swap? → fail") is the guardrail that catches slippage into copying; (c) consider keeping the worked examples out of the cell's *runtime* context (the S109 pattern), and/or framing them explicitly as "one derivation, derive your own." See memory `feedback_binder_teaches_thinking_not_looking` + `feedback_swap_test_whole_construction`.

---

## Part 7 — User verdicts this session (calibration corpus — verbatim)

- *"why is trustified seal on the pack? … did you use the uploaded reference or what did you add in the prompt?"* (→ pixels-over-prose; listing-image overlays)
- *"whenever the products are uploaded dont change anything it should be 100% identical to the uploaded products. do you understand?"* (→ the 100%-identical rule)
- *"the typography is still not aligned if you check the generated image."* (→ alignment via simpler spec)
- *"why do we need to fix the lore in the .md files we created those for any product or brand right?"* (→ docs are generic; the worked example shouldn't enumerate pack chrome from prose)
- *"why are you making it complicated, the image renders well. just add right specification like using 100% identity and all."* (→ specification, not compositing — the course-correction)
- *"in the prompt we should always include the purpose."* (→ purpose-led prompts)
- *"the v3 prompt you forgot the which phone camera lol … how do we make sure we add all the specifications in the prompt in production?"* (→ completeness checklist in the binder; gate deferred)
