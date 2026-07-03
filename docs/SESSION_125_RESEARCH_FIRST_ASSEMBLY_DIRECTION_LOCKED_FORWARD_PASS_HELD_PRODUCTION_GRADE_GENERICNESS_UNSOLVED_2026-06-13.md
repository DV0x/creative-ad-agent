# Session 125 — Research-first reset: the industry doesn't chase the leap (assembly direction LOCKED), the forward pass HELD, but production-grade genericness is UNSOLVED — and design-principles-in-text don't fix it

**Date:** 2026-06-12 → 2026-06-13
**Branch:** `new-ui` (everything uncommitted)
**Status:** The S124 mandate ("research first, where is it going wrong") executed. The research answered the headline question and produced the **first positive calibration signal in the project's history** — the user said *"the direction holds."* A 6-ad TWT forward pass ran end-to-end on the new ASSEMBLY process and passed the floor + gate + the user's direction check. **But the session did NOT close the loop:** the user's named gap — "make it production-grade, not generic" — survived two attempts to fix it (design-principles-in-text → "looks generic"; the composition-reference reframe → teed up but not run). The session ends on the user's reframed question: **"why are we producing generic DR ads?"** — to be taken up fresh next session. This doc is the evidence base + the open question.

> **Read first (continuity chain):** this doc → `SESSION_124` (designed-poster target, calibration gauntlet, leap-is-the-ceiling) → `SESSION_123` (reset mandate) → `SESSION_122`/`SESSION_121` (visual strategy + cell skill) → `SESSION_117` (style-bank pivot + the ambition finding) → `SESSION_118` / `docs/anthropic-learnings/00-genericness-conclusion.md` (genericness = information failure). Memory: `project_first_principles_redesign` (S125 block). Research artifacts: `docs/research/static-ads-practice-2026-06-12/`.

---

## Part 0 — The arc in one paragraph

S124 closed with "no output has ever met the bar; the LEAP is the ceiling; research first next time." This session ran that research (20 Perplexity sonar-pro queries across three rounds, ~$1.35). The headline finding reframed everything: **the performance-marketing industry does not produce the creative leap and does not try** — winning statics are angle-audience match in deliberately boring PROVEN formats at volume; the leap-class work (Nutrich, TWT×Manja) belongs to the BRAND-CAMPAIGN industry, a different bar entirely. That answered S124's open "bar question": we'd been grading a performance product against a brand-campaign standard. From this, the cell's job flipped from **invention** to **assembly** (verbatim customer-language hook × proven format chosen by awareness stage × set diversity × kill discipline). A 6-ad TWT forward pass run by hand on this process passed the independent critic, the vision gate, and — for the first time ever — the user's direction check: *"the direction holds."* The user then named the remaining gap: copy + visuals need to be **production-grade, not generic**. Two attempts to close it both fell short: (1) a design-principles-rich prompt ("Swiss grid, flat color, tight tracking") → user: *"I don't see much difference, it looks generic"*; (2) the diagnosis that visual genericness is the same INFORMATION failure as everything else (abstract principles = the category average of "good design" → generic out; a SPECIFIC composition translated from a real artifact = not generic). That reframe pointed to **composition-from-artifact** as the untested lever — but the test wasn't run, because the reference the user supplied (Nutrich) is the conceptual leap-class one, which yielded a fresh learning rather than a render (see Part 6). The session ends on the user's question, posed with a fresh mind in mind: **why are we producing generic DR ads?**

---

## Part 1 — The research (3 rounds, 20 queries, ~$1.35)

No Perplexity MCP is connected this session; queries ran via the **direct sonar-pro API** (same model/settings as the mini-eval harness: `sonar-pro`, `search_context_size: high`, subject-binding system prompt). Scripts + raw JSON + per-query markdown + two synthesis docs all on disk in `docs/research/static-ads-practice-2026-06-12/`.

**Round 1 (8 queries, $0.56) — how performance statics are actually made.** `00-SYNTHESIS.md` is the capstone. Findings:
- The standard pipeline everywhere: mine verbatim customer language (reviews/Reddit/ad comments) → angles → **concept = angle × format** (format chosen by awareness stage) → 3–5 cheap variants → ABO test 4–7 days → kill/scale (≤2 iterations on winners; most bandwidth to NEW concepts). 8–16 new concepts/mo normal; top accounts 15–25 creatives/**week**; concept win rate ~5–20%.
- **The leap is not in this pipeline.** Practitioner consensus: clarity/offer/angle beats clever; "boring but clear" wins for conversion. The king-grabs-kebab class is brand-campaign work (TWT "behind the protein" = Manja, a creative agency). **This answers S124's bar question: the platform doesn't need the leap on any ad — spend judges.**
- The convert-optimal static is often UNDER-designed (lo-fi/native, "3–5× polished" per one practitioner; the "Pretty Ad Problem"). Statics still ~60–70% of Meta conversions; video carries reach.

**Round 2 (6 queries, $0.367) — "are these formats too old?" (user challenge).** `r2-q1..q6`. Findings:
- **Format ≠ execution.** Fatigue is AD-level (~28% degradation after 3–4 weeks, Omneky Q1-26), NEVER format-level — no source documents a proven DR format dying market-wide. Formats are durable chassis for constant buyer psychology; the hook/angle/execution is what rotates.
- Live proof: us-vs-them = **13% of Kajabi's live 80-ad library** (Motion, June 2026); listicle/comparison/tweet-style are 2026 S-tier. **Before/after = POLICY-dead in health verticals** (Meta compliance, not fatigue). Polished designed poster = bottom of the DR ranking.
- **This inverted S124's "Canva floor."** The convert-optimal static is often exactly what Canva could make → the edge moves to the SYSTEM (angle selection + format match + set diversity + kill discipline + velocity), not the pixels. The designed poster survives as ONE concept class in a diverse set, not the bar.

**Round 3 (6 queries, $0.427) — how creators prompt Nano Banana for non-slop design.** `01-DESIGN-PROMPT-PRINCIPLES.md`. Findings: name a real MEDIUM (the #1 anti-slop move), limit palette + flat (no gradients), name a design IDIOM (Swiss/brutalist/editorial — compresses 50 rules into 3 words), hierarchy as numbers not adjectives, grid/rhythm explicit, type with character, anti-slop negatives. JSON prompting's value = completeness-forcing (fill every field), not magic syntax. Google's own guidance: structured schema, "Image A for pose, Image B for style." (This round's principles drove the v2 attempt in Part 5 — which failed, see there.)

---

## Part 2 — The process pivot: ASSEMBLY, not invention (LOCKED)

The cell's job flips. Today (old skill): **invent** the picture-idea/staging/weld that makes the hook land. New: **assemble** — angle (from strategy) + verbatim customer sentence as hook + proven format chosen by awareness stage + DR furniture (offer/CTA). The "creativity" relocates to: (a) picking the angle from real customer language, (b) matching format to awareness stage, (c) set diversity, (d) kill discipline. It does NOT live in visual invention.

What survives from the existing architecture (almost everything):
- **Research binder** — already harvests customer language. Keeps job.
- **Strategy binder** — already produces angles + awareness stage. Keeps job.
- **Comp binder** — gets MORE important: it's the per-category format intelligence (revealed winners = long-running ads = the live format currency). The format repertoire is a PRIOR that comp updates per brand. Comp's format read is consulted by the cell AT chassis-choice time (no new round-trip; "comp pixels belong to the cell" — S117 lock).
- **Critic** — keeps the FLOOR knives only (honesty, binding, half-second clarity, set-distinctness), drops the taste-ceiling tests. Research independently confirms honesty violations are MODEL-DEFAULT → the floor critic stays load-bearing regardless of how boring the ad is.
- **Pixel binding + vision gate** — unchanged, still load-bearing.

The gate semantics, clarified for the user this session:
- **Critic** = floor gate (can KILL or force fixes, can NEVER approve into existence). Runs on TEXT, pre-render, before money.
- **Vision gate** = fidelity (named diffs, 1 targeted retry).
- **Founder set-verdict** = the per-run LOCK ("would I put ₹20k behind this set?"). Nothing ships on gates alone.
- **Real spend** = the only judge that locks LEARNING (which angle/format won → kill-ledger → next round).

---

## Part 3 — The forward pass (6 TWT ads, end-to-end, by hand)

Run on the locked binders' REAL outputs (research 2026-05-27 + strategy 2026-06-08 Bet, 2 angles). Artifacts: `cloudflare/eval/mini-eval/results/forward-pass-twt/`.

1. **`01-verbatim-harvest.md`** — hooks = verbatim customer sentences; explicit banned-list (29g room-error, star graphics, review counts, price, exclusivity, before/after, clinical claims).
2. **`02-set-spec.md`** — 6 ads, one angle×format each, with a full fact-trace table:

| # | Format (chassis) | Hook (verbatim) |
|---|---|---|
| FP-1 | review-card stack | "No bloating at all." |
| FP-2 | strikethrough checklist | "NOT in this tub:" (Sucralose/Gums/Thickeners) |
| FP-3 | label-as-hero macro | "Read the label. That's the whole ad." |
| FP-4 | complaint pull-quote flip | "More like cocoa and milk, not like a milkshake." — "Exactly." |
| FP-5 | clean offer card | "Cleanest, lightest whey protein. Ever." (pack claim) |
| FP-6 | type poster (the loud slot) | "JUST REORDERED THE 1KG PACK." |

3. **Independent clean-context critic (pre-render):** 0 KILLS, 3 honesty fixes ("tested"→"verified" not in room; pack-string drift; **invented Instagram handle `@thewholetruth`**) + 1 thumbnail-collision fix (FP-2/FP-4 shared silhouette → moved FP-4's pack to bottom-left). All folded.
4. **Renders (nano-banana-pro/edit, ref-bound, ~₹15 total).** Vision gate: 5/6 pass with ONE shared named diff — **wordmark stacking** ("whole / The Truth" vs reference "the / Whole / Truth"), caused by the binding paragraph never spelling the line order. Wrote an explicit-order line + PROVEN on FP-3's targeted retry (v2). FP-3 also had mis-pointed callout lines → fixed (pointer-lines → adjacent chips), v2 PASS. The S121/run-3 catches HELD: 24g per scoop frozen, no Bestseller ribbon, no gold seal (website graphics, not pack).

**Note on the wordmark fix:** explicit line-order is PROBABILISTIC, not guaranteed — it held on FP-3's retry, failed again on FP-1's v2 (Part 5). **The vision gate does not retire per render; no prompt line fully replaces it.**

---

## Part 4 — "The direction holds" — the first positive signal ever

After seeing the set, the user's verdict: **"the direction holds. theres still optimizations to be made to the copy and the visuals. like more production grade."**

This is historically significant. Every prior session's record was some flavor of "average / generic / not the bar / brand-not-DR." **S124's standing line was "no output has ever met the user's bar."** This is the first time the user has affirmed the DIRECTION (assembly) — while explicitly scoping the remaining gap to EXECUTION POLISH ("production grade"), not concept. The leap hunt is settled closed; the open work is making the assembled, boring-but-right ad look like a creative team made it.

Memory + index updated to read: the assembly DIRECTION passes; production polish pending. The taste target is no longer "unknown" at the direction level — it's known and passed; only the finish is open.

---

## Part 5 — Attempt #1 at production-grade: design-principles-in-text → FAILED

The user sharpened the gap twice:
- *"im not talking about rendering issues of some elements. im talking about the understanding of the layout and how to make it visually good not like AI slop. nano banana 2 and chatgpt image 2 render stunning graphics if the prompt is good."* (Consistent with memory `feedback_nano_banana_prompt_construction`: image issues = prompt construction, not the model.)

Diagnosis (correct as far as it went): our FP prompts were **zone maps** (what goes where + exact strings) with NO design direction — no medium, idiom, hierarchy ratios, grid numbers, flatness, texture. The model filled the design with its default, and its default IS the AI look.

The fix attempted — `prompt-fp-1-reviews-v2-design.txt` → `fp-1-reviews-v2-design.png`: same content/facts/layout bones, prompt rewritten with the round-3 design-direction layer (Swiss-grid editorial, 3-color flat palette, type character, hierarchy ratios, eye-flow, print-flat finish, anti-slop negatives). The derivation was sourced (brand adjectives → idiom; research §5 identity → palette/type; format → structure; awareness stage → eye-flow) — every decision had a written reason, no taste-by-fiat.

**Result: user — "I don't see much difference. it looks generic."** Some objective improvements were real (genuine hierarchy, the hero quote at ~3× the supporting cards, it breathed more, gold accent discipline, and it suppressed a decorative quotation-mark the model had added unprompted in v1). But the needle did NOT cross for the user. Defects also recurred: pack demoted/clipped off-frame, one chip rendered plum not gold, **wordmark scrambled again**.

**This echoes the S124 gauntlet finding:** craft LANGUAGE alone doesn't cross the bar (the type-poster elevation failed there too). Another adjective-richer prompt is not the move.

---

## Part 6 — The reframe + the Nutrich learning (Attempt #2, teed up, not run)

**The reframe (this is the load-bearing idea of the session's tail):** visual genericness is the SAME information failure as copy genericness (`00-genericness-conclusion.md`). A list of design principles ("Swiss grid, flat color, tight tracking") is ABSTRACT information — the category-average of "good design" — so the model returns the average. **Generic information in → generic out.** A SPECIFIC composition ("pouch tilted, cropped off the top edge, hero-scale at 60%, headline set into the negative space the product carves, one hard plum block behind the top third") is specific information the model can't average. The decisions stop being the model's to invent — they come from a real artifact.

The user's own contribution sharpened it further (and corrected my over-claim that you MUST attach an image at render): *"i see people also generating striking outputs with text prompt as well. but they might be taking inspiration from an image and translating it to text. even i see json prompting."* This is correct and our own S117 record supports it: S117 found that INVENTING a bold style in text is hard (the model defaults to safe) — it never tested TRANSLATING a specific image to text. **Text works as a medium when it is reverse-translated from a real composition, not invented from a principles vocabulary.** And translating to text is SAFER than attaching the image: it forces surface→structure abstraction (you can't carry pixels forward → can't surface-clone), mechanically honoring "clone the structure, never the surface." JSON = the same idea in costume (fielded completeness, not magic); we already have the shot spec — it just lacks a real COMPOSITION field filled with translated structure instead of adjectives.

**The Nutrich learning (why the test didn't run):** the user supplied the Nutrich kebab ad (the full-invented-world reference: a classical painting's king reaches out of the frame to grab a kebab; "When Kebabs look this good, The Frame gets hungrier than you"; Available on Zepto). Asked to "check this reference," the analysis produced a fresh, important distinction instead of a render:
- **A conceptual ad's composition CANNOT be lifted as a content-free skeleton — because its composition IS its idea.** Strip the king → no skeleton; keep the king → stolen gag. The composition-translation lever (translate to a reusable skeleton, pour our content in) only works for STRUCTURAL ads (the Anvika product-hero-poster class), NOT conceptual ones.
- What a conceptual reference CAN give is **production CRAFT** — cinematic warm directional light, a real lived environment with depth, photoreal product integration, designed playful headline type + the dark payoff pill, the retail availability bar. That craft layer is exactly our production-grade gap and IS transferable.
- **But "borrow the craft, never the job" bites:** Nutrich's craft serves an APPETITE claim (steam, food-glamour). Whey's claim is the opposite (gut-comfort, clean; strategy FORBIDS dessert/milkshake framing). So the craft must be re-aimed to whey's claim (calm clean morning kitchen, pouch + plain shake in real light), never copied literally — or you get Nutrich-for-whey, which is wrong.

The fork surfaced to the user: (1) chase the conceptual gag (advised against — it's the S124 "Keynote" attractor we scoped away from), or (2) borrow only the craft, keep our assembled honest idea, render a TWT lifestyle-scene-poster. **Recommendation given: #2.** Not run — the user chose to wrap and resume fresh.

---

## Part 7 — The open question for next session (the user's words)

**"why are we producing generic DR ads?"** — taken up fresh next session.

What we now know that bounds the question:
- It is NOT a concept/leap problem (direction holds; leap is settled out of scope; the assembled ideas are sound).
- It is NOT (per the user) a small-element rendering problem.
- It IS a "production-grade vs AI-slop" problem at the visual/layout layer.
- Design-principles-in-text does NOT fix it (Attempt #1, this session; echoed by S124's gauntlet).
- The standing hypothesis (UNTESTED): genericness = information failure at the visual layer; the fix is SPECIFIC composition information sourced/translated from a real artifact, not invented from principles. Structural references give reusable skeletons; conceptual references give only re-aimable craft.

Candidate threads for the fresh discussion (do not pre-judge — the user wants to think first):
1. **The composition-translation test never ran.** Run it cleanly on a STRUCTURAL reference (Anvika-class product-hero poster, or the brand's own category winners via comp), translate composition→skeleton, bind TWT content, render, compare to the card-stack. This is the direct test of the standing hypothesis.
2. **Where does the composition-source live?** Comp already pulls the live category ad field as real pixels — a fresh per-campaign source, not a stored bank (avoids the S117 menu→sameness death). Candidate: read the best-COMPOSED ads in the brand's field, translate structure, bind content.
3. **Is the unit even right?** S124 locked "designed poster." Nutrich is a lifestyle-scene-poster hybrid (real environment + designed type + product + retail bar). The lifestyle-scene poster may be both more achievable AND less generic than the pure card/poster. Reconsider the unit.
4. **Is "generic" partly a FORMAT-sameness problem, not a per-ad finish problem?** The 6 FP ads, though distinct, are all flat designed graphics. A set that mixed registers (one lifestyle scene, one screenshot-native, one bold type poster) might read less generic at the SET level even if each ad's finish is unchanged.
5. **The honest possibility:** maybe "production-grade" for the user means a specific visual quality bar we still haven't pinned in words — the same way the taste target was "unknown" until "direction holds." We may need to calibrate the FINISH target with reference pixels the way we finally calibrated the direction.

---

## Part 8 — The user's verdicts this session, verbatim (calibration corpus — preserve)

- (on the research) "so you are saying we have spent our time on optimising the wrong things? so what is the process exactly?"
- "even if the static is boring we need to kill atleast slop which is handled by the critic."
- "are these proven formats? i mean these formats are very old. are they still working?"
- "so its better to focus on what works?"
- "the direction holds. theres still optimizations to be made to the copy and the visuals. like more production grade." ← FIRST positive direction signal ever
- "im not talking about the rendering issues of some elements on the image. im talking about the understanding of the layout and how to make it visually good not like AI slop. the nanobanana 2 model and chatgpt image 2 model renders and create stunning graphics if the prompt is good."
- "I dont see much difference. it looks generic." ← killed Attempt #1 (design-principles-in-text)
- "i see people also generating striking outputs with text prompt as well. but they might be taking inspiration from an image and translating it to text. even i see json prompting." ← the translation reframe
- "why we are producing generic DR ads. lets wrapup this session ... discuss this with fresh mind in the next session."

---

## Part 9 — State of the repo

- **Cell skill: UNTOUCHED this session** (by design — the assembly process was run BY HAND as a forward pass; the skill is still the old invention-based S122-folded version. The rewrite is deliberately gated on the production-grade question being resolved, so we don't encode the wrong shape — S123 bloat lesson).
- **New artifacts:**
  - `docs/research/static-ads-practice-2026-06-12/` — 3 query scripts, 20 raw JSON, 20 per-query `.md`, `00-SYNTHESIS.md` (rounds 1+2), `01-DESIGN-PROMPT-PRINCIPLES.md` (round 3).
  - `cloudflare/eval/mini-eval/results/forward-pass-twt/` — `01-verbatim-harvest.md`, `02-set-spec.md`, 6 prompt files + FP-3 v2 + FP-1 v2-design, renders `fp-1..6` + `fp-3-label-v2` + `fp-1-reviews-v2-design`, pack zooms.
- `server/tmp-cell-render.mjs` — still the workhorse renderer; still pending delete-or-promote (now used across S121–S125).
- **Nutrich reference** lives only in this session's transcript — re-attach next session if needed; the Anvika product-hero poster (the STRUCTURAL reference, the right class for the composition-translation test) was NOT supplied and should be next session if thread #1 is pursued.
- Memory: `project_first_principles_redesign` S125 block + `MEMORY.md` index updated.
- Everything uncommitted on `new-ui`.

## Part 10 — Next session

Per the user: **fresh discussion of "why are we producing generic DR ads."** Start from Part 7's threads; the standing hypothesis to test or refute is **visual genericness = information failure → fix is specific composition translated from a real STRUCTURAL artifact (or the brand's own category winners via comp), not invented from design principles.** Decide: run the composition-translation test (#1), reconsider the unit (#3/#4), or calibrate the finish target with reference pixels (#5). Real spend (₹20–30k beta) remains the never-consulted judge and the ultimate settle.
