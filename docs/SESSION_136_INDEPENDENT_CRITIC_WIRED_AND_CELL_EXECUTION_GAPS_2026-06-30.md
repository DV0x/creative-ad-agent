# SESSION 136 — Independent critic wired (Option C), Run-3 validates the upstream fixes, and the cell EXECUTION layer is now the weak link

**Date:** 2026-06-30
**One line:** This session rebuilt the **want-pick** (strategy + comp binders), re-aimed the **cell critic** from un-swappability → conversion, discovered the SDK actually supports **nested subagents** (the cached doc was stale) and used that to wire a **truly independent critic** (Option C), then ran a controlled A/B (**Run-3**). The upstream chain — research → strategy → independent critic — is now **validated**: research surfaced the differentiated want, strategy picked it, and the independent critic **fired and killed the exact off-strategy take Run-2 shipped.** But the rendered ad exposed that the **cell's execution layer (staging → shot spec → render → vision gate) is now the weakest part of the pipeline.** This doc is the thinking tool for those cell-structure gaps.

> Companion docs: `docs/SESSION_135_RUN2_RESEARCH_WANT_WEIGHTING_AND_STRATEGY_HANDOFF_2026-06-30.md` (the prior run + the research fear-guard) and `docs/CELL_CONVERSION_SPINE_AUDIT_2026-06-29.md` (the conversion-spine blueprint). **All edits below are UNCOMMITTED on branch `new-ui`.**

---

## 1. What this session changed (the fixes)

All binder edits are **universal method** (no brand specifics). All are **uncommitted**.

**Strategy binder** — `agent/.claude/skills/strategy/SKILL.md`
- The winnable-want move (`:70–76`) went from **3 tests → 4**: added a **differentiation** test (read off comp's crowding table; a want every rival serves is *parity, not a pull*) and a **conversion-power** test ("does a cold stranger *buy* or just *nod*?"), plus the fear-as-hygiene mirror and "heed research's flags by default."
- Added the **friction→want arrow** (when the friction is "premium not justified vs a cheaper peer," the resolving want can't be one the peer also serves).
- Reinforced in the disciplines + the slop-gate self-check.

**Comp binder** — `agent/.claude/skills/comp/SKILL.md`
- White space is now an **unserved *want*, not an un-run *ad***: a creative-format gap (no rival runs a given arc) is **craft for the cell**, never positioning white space; a want crowded on comp's own axes table can't reappear as "open." (Map, not verdict.)

**Cell binder** — `agent/.claude/skills/cell/SKILL.md`
- Way-ins are now **"chosen to serve the room's promise,"** not just the most distinctive truths (the generation mirror of the critic re-aim).
- New move **"reach for a format, or build without one"** — the library is a *shortcut, not a gate*; if no mold fits, **build freestyle on the shared method** (the no-format escape hatch). Fixed the dangling "route to a stat card / a demo" fallbacks in all 3 format docs.
- Shape-of-job diagram updated (format-match step; conversion-first critic).

**Cell critic rubric** — `agent/.claude/skills/cell/references/critic.md` (REWRITTEN)
- **Selection criterion re-aimed: un-swappability → conversion.** Survivors now rank on *"which best makes the strategy's promise and would move the cold buyer to act."* Swap is now a **gate**, never the ranker.
- Added **promise-fidelity** and **format-fidelity** kill tests; collapsed the 4 genericness facets into the swap umbrella; trimmed the mechanical duplicates (now the cell's self-check) keeping a light **fabrication backstop**; added the **"re-mine sharper" vs "dead"** marking on kills.

**Cell style derivation** — `layer-stack.md` + `style-grammar.md`
- **A matched format's native rule outranks the general "go loud for contrast"** permission — find distinctiveness *within* the format's register (the fix for Run-2's poster-violates-testimonial).

**Independent critic wiring (Option C)** — `agent-loop/stages.ts` + `pipeline.ts`
- The cell now writes its takes to `takes.md`, **spawns a `critic` nested subagent** (`subagent_type "critic"`), honors the verdict (reject-all → re-mine, max 2 rounds, else flag upstream), and only a named winner renders.
- The `critic` agentDef: **fresh context, rubric inlined from `critic.md`, `Read`/`Write` only (no `Agent` → can't nest further, no MCP → clean), Opus 4.8.** `tsc --noEmit` clean.

**SDK doc correction** — `claude_sdk/subagents.md`
- The cached doc said "subagents cannot spawn subagents." **That is stale.** Nested subagents shipped in **Claude Code v2.1.172** (2026-06-10), depth-5 cap, enabled by listing `Agent` in a subagent's `tools`. Our SDK `0.3.195` bundles CLI `2.1.195`, so nesting works here. (Two grounding subagents inherited the stale line and reported the wrong restriction; the live docs corrected it.)

---

## 2. Run-3 — the controlled A/B (`runs/2026-06-30-14-27-08_thewholetruthfoods-com/`)

Identical inputs to Run-2 (same founder brief + product photo). Only the binders + the independent critic changed. **29.7 min, $4.87, all deliverables + 1 image, vision gate PASS, no retry.**

### The wins (the upstream chain is validated)
1. **Research fear-guard worked** (`research.md`). The S135 regression did NOT recur. Trust is now classified *"a trust-as-category-entry-**ticket** want, **not a differentiation want** — a floor"* (`:130`); the differentiated want is named (*"easy on my stomach, light, doesn't bloat me"* `:132`); the scandal-fear is quarantined (*"the fear is a toll-gate, not the destination"* `:137`; *"not the TWT-specific desire to advertise"* `:168`). Decision criteria flipped from **frequency** → **priority**: digestion **#3**, lab-cert **#4** (were #5 and #1 in Run-2).
2. **Strategy picked the differentiated want** (`thebet.md`). Angle 1 "The Formula You Feel" is the digestion want, and the promise rejects the parity claim out loud: *"The premium is worth it because you **feel the difference, not because a certificate says so**."* Angle 2 is the front-of-pack exact-percentage transparency *moat* (not generic "lab tested"). The portfolio matches the validated 06-08 eval structure (digestion switcher + ingredient skeptic).
3. **The independent critic fired and did real work** (`verdict.md`). Opus, fresh context, judged 5 takes on the new rubric. **It killed Take 2 "suuuuper light"** — *"On-strategy & conversion FAIL… 'suuuuper light' leads in the taste register, not the digestive-ease promise… a packshot that could sit under any 'look at our label' hook. Swap test FAIL."* **That is the precise taste-poster Run-2's self-critic blessed and shipped.** It also killed Take 4 (generic PAS + "Tired of X?" cliché) and Take 5 (claim *"short lists digest better"* **not in the proof** — fabrication-adjacent — and drifts to Angle 2). Winner: **Take 1 "Ever Encountered"** — a real r/Fitness_India digestibility review shown native, ranked on conversion. (0 reject-alls; it picked a winner. The "3 critic launches" in the log were stream artifacts, not rounds.)

**Net:** research → strategy → independent critic are now **proven**. The self-critic problem is solved. The conversion re-aim works.

### The render (where it falls down)
The winner rendered as a **native iPhone photo of a Reddit screenshot + the TWT pouch on a white-marble kitchen counter.** Categorically better than Run-2's flat designed poster (native testimonial, on-strategy digestion hero). **But the actual ad has execution problems** — see §3.

---

## 3. THE CELL STRUCTURE — gaps located stage by stage

The cell pipeline:

```
angle (room)
  → match a format / build freestyle
  → mine ~5 way-ins (serving the promise)
  → develop each into a TAKE (bound hook + picture + STAGING)
  → independent critic culls (conversion-ranked)        ← NOW INDEPENDENT ✓
  → freeze winner into the SHOT SPEC
  → compile the prompt
  → render once
  → vision gate                                         ← still self-administered + narrow
```

Walking it, marking ✓ validated / ⚠ gapped, with Run-3 evidence:

### Match format / freestyle — ✓ works, ⚠ the worked example seduces
The cell matched **testimonial** correctly (peer-proof want, a real review in proof). **Gap:** the format doc's *worked example* (`testimonial.md:94–109`, the `v13` sweep) is so concrete it gets **copied as a surface** rather than read as a move (see "Staging" below). The example is meant to teach the *derivation* (provenance → native screenshot maker); the cell took its *clothes*.

### Mine way-ins — ✓ the generation mirror worked
5 distinct, **promise-serving** way-ins (`cell-output.md:15–25`), each a different truth. The "way-ins serve the promise" edit landed.

### Develop takes — ✓ takes; ⚠ **STAGING copies the exemplar, not the claim** *(the big one)*
The takes were distinct. But the **staging** of the winner is a near-exact reproduction of the `v13` worked example:
- **`testimonial.md:107` (v13 sweep):** *"iPhone main-camera… handheld ~35° down · 7:30am neutral window light… · **white marble counter** · **soft-focus kitchen**… a small burgundy 'Try it →' pill."*
- **Run-3 shot spec (`cell-output.md §4`):** *iPhone rear-camera ~33° above · 8:30am window light · **white marble counter** · **soft-focus kitchen**.*

This is the **"binder teaches thinking, not looking — exemplars collapse into template slop"** failure (we have a memory on it). `layer-stack.md:15` says *"the setting comes from the claim — where it actually lives — never from the brand's existing product-photo style"* — but the cell pulled the setting from the *example*, not the claim. **Where does "easily digestible / no bloat" actually live?** The bloat moment — noon at the desk, the gym, the morning-after — not a generic DTC marble kitchen. The setting argues *nothing* about digestion; it's the exemplar's clothes.

### Independent critic — ✓ fires, conversion-ranked, kills the right things
The headline win. **But note its scope:** the critic judges the **takes (text + picture *description* + staging line)** — it does **not** see the rendered pixels. So it *cannot* catch "the phone is flat, so the hero quote is unreadable" or "the pouch rendered too prominent" — those are *render* properties, not take properties. Legibility/CTA-on-render fall in the seam **between** the critic (judges the spec) and the vision gate (judges the render, but narrowly).

### Freeze shot spec — ⚠ missing performance-ad constraints
The shot-spec schema (`references/shot-spec.md`) enumerates objects/action/composition/product-binding/must-show/forbid — but has **no constraint for:**
- **Legibility of the hero copy at thumbnail.** For a testimonial, the quote *is* the ad; nothing requires it to face the viewer / be large enough to read small. The drawability bar checks "can a stranger draw it," not "can a feed-scroller *read the load-bearing text* at thumbnail."
- **CTA as a required on-image element.** The testimonial format lists ASK/CTA as one of its four *necessary* elements, and `v13` had a CTA pill — but the cell put the CTA in the **caption only** (`cell-output.md:63`) and nothing flagged the on-image absence.
- **Managing the bound product's own copy when it contradicts the promise.** The pack prints *"…this whey protein is **suuuuper light**"* (taste) large on the front; the promise is digestion. The spec showed the pack front prominently — nothing said "angle/crop the pack so the contradicting on-pack copy isn't a competing element."

### Compile prompt — ✓ faithful
The compiled prompt (`cell-output.md §5`) is a faithful, native, photographic-real prompt (no designed headline, product bound, forbid-list compiled). Verbatim-as-rendered. Good.

### Render once — ⚠ fidelity limits
- **Fine-print garble** — nano-banana's edit endpoint *regenerates* the pack, so small text degrades even with the reference bound (known S135 residual). Big elements clean.
- **"Soft-focus background" not honored** — the spec put the pouch *"slightly soft in focus (background), ~20cm back"*; the render made it **sharp and prominent.**

### Vision gate — ⚠ **too narrow, too lenient, and self-administered** *(the structural weak seam)*
The vision gate (`cell-output.md §7`) checks: copy-exact, picture-demonstrates-claim, must-show-present, product-bound, forbid-list, maker-texture, composition. It **PASSED** — including *"Composition holds: eye lands on the lit phone screen first"* — when in the actual image the **pouch is co-dominant** and the **hero quote is barely readable.** The gate:
- is **self-administered by the cell** (the seat that built it) — the opposite of the now-independent take-critic;
- has a **mechanical assertion set** (copy-exact, product-bound, forbid-list) that misses the "**does this work as an ad**" questions: *is the hero copy legible at thumbnail? is there a CTA? is contradicting on-pack copy prominent? is the composition actually what the spec intended?*

**Every one of Run-3's execution misses slipped through this gate.**

---

## 4. The gaps, synthesized — and the one structural question

The stage-by-stage gaps cluster into **four root themes**:

- **A. Staging derivation copies the exemplar's surface, not the claim.** *(Develop-takes stage.)* The worked example's *what* (marble kitchen) gets reproduced instead of its *why* (provenance → native maker). The setting isn't derived from where the claim lives.
- **B. The vision gate is the weak seam** — self-administered, mechanically narrow, lenient. *(Vision-gate stage.)* It's the OPPOSITE of the take-critic we just made independent. All the render-quality misses live here.
- **C. The shot spec lacks performance-ad constraints** — legibility-at-thumbnail, CTA-as-on-image, manage-contradicting-on-pack-copy. *(Shot-spec stage.)*
- **D. Render fidelity limits** — nano-banana edit regenerates the pack (fine print); soft-focus/prominence not honored. *(Render stage.)*

**The structural question worth sitting with:** we made the **take-critic** independent and rigorous (judges the *spec*). But the **vision gate** — the only thing that judges the *actual rendered pixels* — is still the old **self-administered, narrow** check. Run-3 proves the pixel-judgment is now where ads fail. So:

> **Should the vision gate become a second independent critic** — a fresh seat that views the render and judges it against the spec *plus a "does this work as a performance ad" bar* (hero legible at thumbnail? CTA present? contradicting copy managed? composition true? product fidelity?) — mirroring exactly what we just did for the take-critic? Or is a **richer self-administered assertion set** enough? (The take-critic precedent says: a seat doesn't reliably judge its own work. The same logic that made us wire the independent take-critic applies to the render.)

This is the natural next decision — but it's a *think-about-it*, not a foregone conclusion.

---

## 5. Fixed and validated this session (do not re-litigate)

- **Conversion as the critic's selection criterion** (was un-swappability) — validated: the critic killed the taste take on conversion grounds.
- **The independent critic itself** (Option C, nested subagent) — validated: it fired, fresh-context, Opus, conversion-ranked, and caught the Run-2 failure.
- **The want-pick** (strategy 4-test) — validated: strategy picked digestion over trust.
- **Format-precedence** (format native > made-object contrast) — validated: the cell went native testimonial, not a poster.
- **The research fear-guard** (applied S135) — validated: the want-weighting regression did not recur.

---

## 6. Open questions to think about (not tickets)

1. **Staging:** how do we stop the cell copying the exemplar's surface? Options to weigh — make the worked example *abstract the move and hide the surface*; harden `layer-stack`'s "setting from the claim" into a check; add a "name where this specific claim lives" step before staging. (Connects to the standing memory: binders teach thinking, not looking.)
2. **The vision gate:** independent render-critic vs richer self-assertions? (See §4.) If independent — same nested-subagent pattern; it would view the image and judge against the spec + a performance bar.
3. **Performance-ad constraints:** where do legibility-at-thumbnail / CTA-required / manage-contradicting-pack-copy live — the shot-spec schema, the format docs, the vision gate, or all three?
4. **Render fidelity:** is the bound-pack fine-print garble worth solving now (compositing vs edit-regenerate), or is it acceptable for feed thumbnails? And the "soft-focus not honored" — a prompt-strength issue or a render limit?
5. **Critic scope:** the take-critic judges the spec, not the pixels. Is the legibility/CTA judgment *its* job (judge the spec for "will this be readable/have a CTA when rendered") or strictly the render-critic's? Where's the cleanest seam?

---

## 7. Reference map

**Run-3 artifacts** — `agent-loop/runs/2026-06-30-14-27-08_thewholetruthfoods-com/`:
- `research.md` — fear-guard validated (`:130` trust-as-floor, `:132` positive pull, `:137` fear-is-toll-gate, `:141` criteria priority-ranked, `:168` "not the TWT desire to advertise").
- `thebet.md` — the want-pick (`:40` Angle 1 digestion, the "feel the difference not a certificate" promise; `:62` Angle 2 transparency moat).
- `takes.md` — the 5 takes handed to the critic.
- `verdict.md` — the independent critic's judgment (Take 2 "suuuuper light" KILLED, winner Take 1).
- `cell-output.md` — `§1` format match, `§2` way-ins, `§3` critic summary, `§4` shot spec (the copied marble-kitchen sweep), `§5` compiled prompt, `§6` on-image copy (CTA in caption only, `:97`), `§7` vision gate (lenient PASS).
- `images/1782831227939_*.png` — the rendered ad (native Reddit testimonial; unreadable hero at thumbnail, no CTA, prominent "suuuuper light" pack, garbled fine print).

**Binders (all edited this session, UNCOMMITTED, branch `new-ui`):**
- `agent/.claude/skills/strategy/SKILL.md` · `comp/SKILL.md` · `cell/SKILL.md`
- `agent/.claude/skills/cell/references/critic.md` (rewritten) · `layer-stack.md` · `style-grammar.md` · `formats/{testimonial,pas-real-world,founder-pov}.md`
- **NOTE:** the entire `agent/.claude/skills/cell/` dir is **untracked in git** (`??`) — `git add` it when committing or the cell edits are lost.

**Wiring (UNCOMMITTED):**
- `agent-loop/stages.ts` — `CELL.tools` += `'Agent'`; the cell's critic block (write takes.md → spawn critic → honor verdict → render); `CRITIC_MODEL` + `CRITIC_IO_PROMPT`.
- `agent-loop/pipeline.ts` — the `critic` agentDef (rubric inlined, Read/Write, no MCP, Opus); orchestrator note; budget bump.
- `claude_sdk/subagents.md` — the nesting correction.

**Run-2 (the comparison)** — `agent-loop/runs/2026-06-30-08-49-05_thewholetruthfoods-com/` (the taste poster the self-critic shipped).
**The validated eval bet** — `cloudflare/eval/mini-eval/results/strategy-2026-06-08-twt-run2.md`.
**Independent-judge pattern (mirrored for the critic)** — `cloudflare/eval/mini-eval/run-mini-eval.ts:313` `judgeBet()`.

---

## 8. The one-sentence spine

The **upstream** is fixed and proven (research surfaces the converting want → strategy picks it → an **independent critic** judges on conversion and kills the off-strategy take). The **cell's execution layer** is now the weak link — it **copies the exemplar's surface instead of deriving from the claim**, and its **render-judgment (the vision gate) is still a narrow, self-administered check** where every Run-3 ad-quality miss slipped through. The next decision is whether the **render gate becomes a second independent critic**, the same move that just fixed the take-critic.
