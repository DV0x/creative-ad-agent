# SESSION 135 — Run 2 (brief + bound product), the research want-weighting root cause, the research-binder fix, and the strategy-edits handoff

**Date:** 2026-06-30
**One line:** Ran the controlled **brief + bound-product A/B** (Run 2). The prediction was **WRONG** — run-1's failure was mostly **input-starvation + a phantom FoodPharmer proof**, not binder structure. With good inputs, **strategy improved** (promises became buying arguments) but the **cell still shipped generic, off-strategy safe-slop** — root-caused to a **research want-weighting regression** (research ranked the want by *frequency*, not conversion/differentiation, and promoted a category-*fear* into the want). **Applied the research-binder fear-guard fix. NEXT = the strategy-reasoning edits (the winnable-want PICK) — designed below, not yet applied.**

> Master record for the diagnosis lives in `docs/CELL_CONVERSION_SPINE_AUDIT_2026-06-29.md` (now extended with the full Run-2 section + the root-cause subsection). This doc is the **handoff** for next session's strategy edits.

---

## 1. What got done this session

1. Walked the conversion-spine blueprint and deep-dived run-1's "Stranger's Certificate" failure end-to-end (cell → testimonial format → strategy → research).
2. Synthesized the fix into **ONE field — the "buying argument"** — plus the **16-gap inventory**; folded both into the audit doc.
3. Built the **`run.ts --founder/--product` feature** (harness now accepts a real founder brief + uploads a product photo to fal → `refs.json`); deleted the throwaway runner.
4. **Ran Run 2** — same brand (TWT), surface mode, binders/code byte-identical, ONLY the inputs changed (real brief + bound Light Cocoa pack). $3.22, 27.8 min.
5. Diagnosed Run 2 in depth (findings in §2).
6. **Applied two research-binder edits** (the fear-vs-desire guard).
7. Folded all Run-2 findings into the audit doc (Run-2 section + root-cause subsection + reusable-method lesson #7 + correction markers).
8. **Designed the strategy-reasoning edits** (§4) — discussed, NOT applied.

---

## 2. The big findings (Run 2)

**Prediction (set in advance):** structural gaps repeat, because no input rewrites a binder rule. **Verdict: WRONG.**

1. **The FoodPharmer "buried hero" was a PHANTOM.** Run-2 research explicitly checked and found NO standalone FoodPharmer TWT review (`research.md:290`); the real tester is "Golden Age Exclusive" (`:36,:46`); FoodPharmer's ecosystem actually endorsed a competitor (OWN, `:170`). Run-1 mis-attributed a non-existent review → the whole "strategy buried the strongest proof" thread rested on a phantom. **Gap B's *mechanism* (flat proof) stands; its *exemplar* doesn't.** Run-1's real failure = **fabrication**.
2. **Run-1's failure was largely input-starvation, not binder structure.** Empty brief + no product ref + the phantom proof → the fabricated cert. With good inputs, the *existing* binders produced an honest, conversion-framed Bet and a non-fabricated ad.
3. **Strategy improved with the brief** — promises became **buying arguments** (Angle 2 literally named "The Lab Result as the Buying Argument," `thebet.md:64,68`), an explicit **anti-fabrication mandate** (`:58`), real honesty discipline (flagged the cert is for the unflavoured WPC not Light Cocoa 3×; pushed back on the ₹300 CPA). But the *structure* was unchanged (flat proof, no conversion-action field).
4. **The cell still shipped GENERIC, OFF-STRATEGY safe-slop.** Chose Angle 1, built the "suuuuper light" verbal weld — NO fabrication (real buyer quote, real bound product; it refused to invent, `cell-output:25`) — but the output is a **flat designed product-poster** (Canva-tier DTC template; chose made-object over native, `cell-output:162` vs `testimonial:69`), with an **off-strategy taste headline** ("suuuuper light" — a taste claim, not the *trust* buying-argument the Bet promised). It won on **"un-swappability"** not conversion (`:80`), and the **self-critic (not independent, `:61`) blessed it** instead of reject-all.
5. **The promise/proof TYPE-mismatch (Angle 1).** Angle 1's *promise* = trust/certainty, but its *peer-voice proof* = taste/comfort (the trust proof is institutional only). A testimonial (peer-voice) angle fed taste proof can only make a taste ad. The cell *saw* this (killed the trust way-in for lack of a buyer quote) then **drifted to taste instead of escalating.** Angles 2 & 3 are type-aligned; the cell effectively built an **Angle-3 (taste) ad under an Angle-1 banner** — even pulling the "suuuuper light" quote from Angle 3's proof (`thebet.md:97`) and mislabeling it Angle-1 (`cell-output:296`). **Proof is duplicated across angles** (same Reddit quotes in Angle 1 `:52` ≡ Angle 3 `:97`) — the flat "carry it complete" dump made the angle boundaries mushy.
6. **The eval regression (the comparison).** The validated **2026-06-08 eval bet** (`cloudflare/eval/mini-eval/results/strategy-2026-06-08-twt-run2.md`, PASS) bet on **digestive comfort** — the brand's verified, open-lane, ownable differentiator — and produced **2 distinct, type-aligned angles** (Bloat-Burned Switcher · Ingredient Skeptic). Run-2 bet on **TRUST** and produced muddled angles. **Same binders; the live research weighted the want differently.**
7. **ROOT CAUSE — a research want-weighting regression.** Run-2 research framed the macro JTBD as TRUST (*"Trust is the product, not just protein,"* `research.md:149`) and ranked the decision criteria **by frequency-of-mention** (`:158`) → lab-tested/certified **#1** (`:160`), digestion/no-bloating **#5** (`:164`). Digestive comfort was present (hero-product JTBD `:152`) but demoted. **Why:** (a) frequency ≠ conversion; (b) led with the CATEGORY anxiety, not the BRAND's differentiated want; (c) recency/drama bias (FSSAI scandal "this week"). **The damning part:** research itself wrote brand trust *"is NOT a cold-traffic conversion lever"* (`:165`) — then ranked it #1 anyway, surfaced the contradiction and **punted it to strategy.** Research used a **frequency** yardstick where a **conversion + differentiation** yardstick was needed.
8. **Render fidelity (new residual).** The bound product's **fine print garbles** — nano-banana's edit endpoint *regenerates* the pack (doesn't composite), so small text degrades even with the reference bound. Big elements clean. **Pixel-exact fine print needs compositing.**

---

## 3. What got edited this session (all applied, all UNCOMMITTED, branch `new-ui`)

- **Research binder** — `agent/.claude/skills/research/SKILL.md` — TWO edits:
  - `:127` — extended *"A complaint is not a desire"* → **"and neither is a fear"** (a loud current category-fear is a hygiene factor to clear, not a desire to sell; log in §2f, keep hunting §2c for the positive pull).
  - `:325` — mirrored the fear-guard in the closing disciplines.
- **Harness** — `agent-loop/run.ts` — added `--founder=<brief.md>` + `--product=<image>` (uploads to fal → writes `refs.json`); usage line + header updated. Deleted throwaway `run-experiment.ts`.
- **Audit doc** — `docs/CELL_CONVERSION_SPINE_AUDIT_2026-06-29.md` — status-header Run-2 flag, ⚠️ correction marker on the FoodPharmer phantom, the full **"Run 2" section**, the **"root cause — research want-weighting regression"** subsection, **reusable-method lesson #7**.
- **Memory index** — the audit pointer updated with the Run-2 result.

---

## 4. NEXT SESSION — the strategy-reasoning edits (PRIMARY TASK, designed not applied)

**The matched pair:** research now stops *calling* a fear the want (applied). **Strategy must stop *picking* the loud want.** Strategy's one irreplaceable job is the **winnable-want PICK** — override research's loudest want with a *conversion + differentiation* judgment. In Run 2 it abdicated: took research's #1-loud want (trust), called the crowded lane "open white space," ignored research's "not a cold lever" flag. **Clerk, not doctor.**

### 4a. KEYSTONE edit — the winnable-want filter (`strategy/SKILL.md:66–76`)
The filter has 3 tests; on "trust" they failed thus:
- *"Is it real/weighted?"* (prevalence) → **passed** (trust is prevalent).
- *"Does attention exist?"* → **passed** (the scandal is live).
- *"Is the lane open AND wanted?"* (comp white-space) → **mis-applied** (called the crowded trust-want "open").
- **MISSING:** a **conversion-power** test (will this move a *cold* stranger?) + the **fear-vs-want** check (mirror the research fix).

**Proposed additions:** (i) a conversion-power / cold-lever test; (ii) the fear-vs-want check; (iii) when research has flagged a want as "not a cold lever," strategy heeds it by default (override only with explicit reasoning).

### 4b. Downstream structural edits (follow from picking the right want)
- **Promise = the buying argument**, not "the want as a provable claim" (`:232`). [The "buying-argument field" — see the audit doc synthesis.]
- **Promise/proof TYPE-match:** the promise must carry proof of the *right type* for its format (testimonial promise → peer-voice proof; institutional promise → institutional proof). Catch Angle-1-style mismatches at strategy.
- **Proof: typed + attached to the promise**, not a flat "carry it complete" dump (`:233`) duplicated across angles. [Gap B — now with a *real* demonstrated case.]
- **Portfolio distinctness:** enforce the existing "collapse same-hypothesis angles" rule (`:157`) — Run-2 shipped 1≈2 and *admitted* they're "the same bet" (`thebet.md:109`).
- **Angle naming** (`:246`) — don't let the name become a literal render instruction (run-1's "The Certificate").

### 4c. Open design questions (decide first)
1. **Where does "open lane / cold lever" live** — harden strategy's filter, push **comp** to flag *crowded-vs-open* more bluntly, or both? *(Lean: both.)*
2. **Hard gate or judgment?** *(Lean: judgment for differentiation; near-hard flag for "not a cold lever.")*
3. **Heed research's flags or override?** *(Lean: heed by default; override only with stated reasoning.)*

### 4d. After the strategy edits — RE-RUN to validate
Re-run the full pipeline (command in §6) and check: does research now classify the trust-scare as a fear (not the want) and surface digestive comfort? Does strategy PICK the differentiated/cold-effective want? Does the cell produce a conversion-shaped, on-strategy ad? A/B against the 06-08 eval bet.

---

## 5. The reference map (file paths + key line cites)

**Binders (under edit):**
- **Research** — `agent/.claude/skills/research/SKILL.md` — want §2c (`:84–91`), buyer-voice disciplines (`:124–127`, edited `:127`), "research ≠ strategy's job" rule (`:322`), closing disciplines (`:318–327`, edited `:325`).
- **Strategy** — `agent/.claude/skills/strategy/SKILL.md` — winnable-want filter (`:66–76`), proof gate (`:118–122`), Gate 2 (`:151–155`), portfolio collapse (`:157`), the room (`:189`), promise def (`:232`), proof field/"carry it complete" (`:233`), angle naming (`:246`). Also `worked-examples.md`.
- **Cell** — `agent/.claude/skills/cell/SKILL.md` — way-in mining (`:56–70`), reject-all (`:131`), independent critic rule (`:170`), slop def (`:177`); `references/formats/testimonial.md` — polished-kills-belief (`:18`), native-by-default (`:69`), v13 maker (`:107`).

**Run-2 artifacts** — `agent-loop/runs/2026-06-30-08-49-05_thewholetruthfoods-com/`:
- `research.md` — `:149` ("Trust is the product"), `:152` (hero-product JTBD incl. comfort), `:154` (thin/negative want), `:158` (ranked by frequency), `:160` (#1 lab-tested), `:164` (#5 digestion), `:165` ("not a cold-traffic lever"), `:290` (FoodPharmer phantom), `:36/:46` (Golden Age Exclusive), `:170` (FoodPharmer → OWN).
- `thebet.md` — `:34` (prescribed 2 angles), `:44`+`:46–53` (Angle 1 promise/proof = the mismatch), `:58` (anti-fabrication mandate), `:64/:68` (Angle 2 buying argument), `:71/:76/:83` (WPC-not-SKU), `:97` (Angle 3 proof / "suuuuper light"), `:52≡:97` (duplicated quotes), `:109` ("same bet" admission).
- `cell-output.md` — `:2` (Angle 1), `:8` (testimonial format), `:25` (trust way-in killed), `:61` (self-critic), `:80` (won on un-swappability), `:162` (designed-poster maker), `:296` (mislabeled Angle-1 proof).
- `images/…png` (rendered ad — fine print garbled), `founder-facts.md`, `competitors.md`, `trace.md`.

**The "better" eval bet (the comparison):** `cloudflare/eval/mini-eval/results/strategy-2026-06-08-twt-run2.md` — 2 distinct, type-aligned angles on digestive comfort; judge PASS.

**Run 1 (audited "Stranger's Certificate"):** `agent-loop/runs/2026-06-29-12-52-54_thewholetruthfoods-com/`.

**Master diagnosis doc:** `docs/CELL_CONVERSION_SPINE_AUDIT_2026-06-29.md` (blueprint + 16-gap inventory + buying-argument synthesis + Run-2 section + root-cause subsection).

**Founder brief used:** the file passed via `--founder` (D2C purchase · cold acquisition · ₹4.2L/mo · ₹300 CPA · India · whey).

**Harness:** `agent-loop/{run,pipeline,stages}.ts`, `agent-loop/mcp/{refs,nano-banana}.ts`.

---

## 6. How to re-run (after the strategy edits)

```bash
cd agent-loop
npx tsx run.ts https://thewholetruthfoods.com \
  --founder=<path>/twt-founder-brief.md \
  --product=/Users/chakra/Downloads/twt-1.jpg
# surface mode (default), full pipeline. Reads ../.env.local + ../.env; strips ANTHROPIC_API_KEY → Max OAuth.
# Output → agent-loop/runs/<stamp>_thewholetruthfoods-com/
# (re-create the founder brief if the scratchpad was cleared — contents in §5 / the audit doc)
```

---

## 7. The one-sentence spine

Research must surface the **conversion-right, differentiated** want (not the loudest fear) → strategy must **PICK** it (override loudness with a conversion + differentiation judgment) → the angle must be **coherent** (promise = buying argument; proof typed + matched to it; portfolio distinct) → the cell must **serve** it (not drift to un-swappability) → an **independent critic** must reject-all when it doesn't. Run 2 fixed the research-classification half (the fear-guard); **the strategy-PICK half is next.**
