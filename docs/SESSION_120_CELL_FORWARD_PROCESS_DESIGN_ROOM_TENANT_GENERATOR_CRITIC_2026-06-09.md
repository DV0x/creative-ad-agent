# Session 120 — The CELL, worked out conceptually (room vs tenant · generator vs critic · DR placement · concept anatomy)

**Date:** 2026-06-09
**Branch:** `new-ui` (no code/binder changes this session — per `feedback_no_commits_until_tested`)
**Status:** **DESIGN DISCUSSION, not a build.** The cell's conceptual architecture was worked out end-to-end via Socratic dialogue (the user pressure-tested every claim). Nothing was written into a binder or code yet. **No files changed except this doc.** The output is a *shared, validated mental model* of the cell that we can author from next session. Also captured: an external-validation moment — the founder of **Creyaa** independently converged on our exact thesis, and the user opened a peer relationship.

> **Read first (continuity chain):** this doc → `docs/SESSION_119_STRATEGY_RECUT_PROMISE_MANDATORIES_VALIDATED_LOCKED_2026-06-08.md` (strategy LOCKED — the cell is now unblocked) → `docs/SESSION_118_ANTHROPIC_DEEPDIVE_GENERICNESS_CONCLUSION_CELL_LOOP_2026-06-07.md` (the decision to sharpen strategy before the cell) → the capstone `docs/anthropic-learnings/00-genericness-conclusion.md` + the four topic notes `01-building-effective-agents/` `02-prompting-reasoning/` `03-context-engineering-harnesses/` `04-skills-sdk-production/` + `docs/anthropic-learnings/cell-counterexamples.md` (the forbid-the-obvious bank). Earlier cell history: `SESSION_114` (cell kickoff), `SESSION_117` (upstream redesign + the DR-spine + voice unlock). Memory: `project_first_principles_redesign` (the S117 cell block), `project_genericness_conclusion`, `feedback_binder_teaches_thinking_not_looking`, `project_eval_top_failure_mode_image_content` (our #1 bug — the concept→image drift, which became the live topic with Creyaa).

---

## Part 0 — Where this sits

S119 **locked strategy.** That was the gate: "the cell can only walk to the center of the room strategy hands it," so the room had to be sharp first. It now is. The cell is the **pre-launch blocker** and the place where the *visual* genericness is actually defeated.

This session did NOT build the cell. It did something prerequisite (Topic-4's warning: *don't one-shot the cell skill from a vacuum*): we **reasoned out the cell's whole architecture** so that when we author the `SKILL.md`, it encodes *our* worked-out moves, not "be creative, avoid clichés" mush. The user drove by interrogation — every piece below survived a real challenge.

---

## Part 1 — The cell, end to end (the locked mental model)

```
strategy → ANGLE  (the "room": buyer + promise + proof + mandatories)
   → cell writes N≈5 genuinely-DIFFERENT takes   (each a full bundle: copy + picture, in words)
   → independent CRITIC culls on the swap test    (keeps the sharpest, or REJECTS ALL)
   → render the 1 winner ONCE
   → vision-check (did the render hold the concept?)
```

One ad **ships per angle**. The 5 are internal drafts. Everything below is the *why* behind each box.

---

## Part 2 — Where genericness is actually won or lost (the core)

- **Won in the ROOM, not the loop.** The model always walks to the center of the room — you can't stop that, you *pick the room*. A sharp brief = a tiny room = the center is already non-generic. (Straight from `00-genericness-conclusion.md`.)
- **Selection is not a source.** The critic can only *pick* from what's generated; it can't *invent* specificity. So "generate 5, pick 1" does **NOT** defeat genericness — the room does. *(The user independently re-derived this — it's the deepest point in the whole research. The loop is a drift-catcher, not a genius-maker.)*
- **Good room ≠ good ad ("good room, wrong tenant").** Even inside a tight room there's a flat center and a sharp edge; the cell (the tenant) still has to *reach* for the edge. A sharper room *shortens* the leap but never removes it. *(This was the user's sharpest contribution — it extends `00` beyond "pick the room.")*
- **Two tracks (copy vs visual differ):**
  - **Copy = craftsman.** Genericness is mostly fixed upstream; the cell says it faithfully in a real voice. Main failure = **dilution / fake-marketing voice**. There IS a small creative leap (the sharp way to *say* it), but it's small.
  - **Visual = inventor.** TWO genericness sources: the upstream insight AND the **execution** (the art-direction defaults to the category look *even in a perfect room*). The picture is a real creative leap the brief cannot supply. **Cell craft matters far more for the visual than the copy.**

---

## Part 3 — The generator (how the cell makes takes)

- **Idea-first, NOT format-menu.** The 5 takes come from the room's **specific truths** (different "ways in") — not "one ad per DR format." Seeding from the format menu re-creates the killed anti-pattern AND walks straight back into slop (each format becomes its own little room the generator centers in → 5 format-generics).
- **N ≈ 5, and *small wins* — not a magic constant.** Why small: (1) mode collapse → big-N is fake diversity (samples 6–20 rhyme with 1–5); (2) the judge ceiling caps how many the critic can truly discriminate; (3) **Goodhart / reward over-optimization** — with an imperfect judge, *more tries actively hurts* (you select for what best *fools* the critic). Fix ~5 to start; **tune on the mini-eval** (large effects show with ~20 cases). Don't trust a number from a math/code paper.
- **Text-first.** Diverge + judge in cheap TEXT; render only the winner ONCE. (Rendering N images = 5× cost + you'd be judging polish, not the idea.)
- **One ad ships per angle (Road A).** Meta's wanted variety comes from N *angles*, not from cloning one angle. **Escape hatch:** if a brand supports only 1–2 angles, the critic keeps the top 2–3 *genuinely different* survivors. *(This resolves the S118/119 "one ad vs diverse set" fork: the diverse SET = the angles; within an angle, diverge→cull→one.)*
- **Anatomy of ONE take (the unit):**
  - a **way-in** — the one specific truth from the room it attacks from (the real creative seed);
  - a **bound hook + visual pair** — the **hook** (scroll-stop, ~80% of perf) and a **visual that *demonstrates* that exact hook** (not decorates). *They must be judged together as a bundle — if the visual is decided in a separate later step, that step is unguarded and collapses to a packshot.*
  - **DR completion** — a short telescoped body + offer/CTA.
  - The two genuinely creative slots are the **way-in** and the **visual**; the hook just carries the way-in in a real voice.
- **Getting the right tenant is a GENERATOR problem** (the critic only culls). Push the generator off the center toward the edge via: **(a) forbid the obvious** (name the category floor — for whey: gym bro, moody gym, powder-mid-air, headless six-pack — `cell-counterexamples.md`); **(b) force genuinely-different leaps**; **(c) hand it the raw specifics to leap from.**
- **Playbook move discovered this session — mine the brand's OWNED LANGUAGE.** Name / tagline / signature ritual → un-swappable payoffs by construction (swap-test-proof). The live example: TWT closer "…ours is whey. **That's the whole truth.**" (vs the generic "that's the whole sentence" — which any clean-label brand could run). Conditional: strongest when the name *means* something (TWT, Liquid Death); not universal. *(Claude demonstrated the failure live — defaulted to the generic closer with the brand name sitting right there. "Good room, lazy tenant," in real time. Proof that even strong models default to center and must be pushed.)*
- **Voice = a real person talking (the AI tells to kill).** Surfaced concretely while drafting the Creyaa DM: the **"not X — it's Y" antithesis cadence** and **formulaic repeated closers** ("curious… + question" two messages running) both read as machine-generated / a *mechanism*. Read-aloud test; vary structure; share an open problem instead of always interrogating. These are the cell's copy-voice rules, validated on a real human-to-human channel.

---

## Part 4 — DR framework placement (worked out explicitly)

The user asked exactly where "the DR framework" lives. Answer has two layers:

- **DR *formats* (PAS / us-vs-them / demo / founder-or-customer-testimonial / social-proof) = a SPREAD-RULER**, used generator-side: after/while drafting the 5, check "did these collapse into the same shape?" and push for spread. **Descriptive, not a cookie-cutter.** The *lead* is always the specific truth; the form is read off afterward.
- **DR *spine / craft* = the GRAMMAR behind every take** — hook does ~80%, the visual *demonstrates* the claim, every ad is a testable bet, concrete > clever. This lives in the cell's core and shapes *every* take regardless of which shape it lands in.
- **Necessity:** the DR *mindset* is non-negotiable (performance marketing *is* modern direct response). The *formats list* is useful fluency + a ruler, **not** mandatory.
- **Agency mapping (the grounding):** we are a compressed performance agency — *creative strategist* (research/comp/strategy) → *AD + copywriter* (cell) → *creative director who kills weak work* (critic) → *QA* (vision-check) → *media buyer's measure-and-iterate-on-winners* (the reach-loop, deferred). The modern truth: **creative is the lever now** ("you can't out-target bad creative").

---

## Part 5 — The critic (the editor)

The user's frame: "the critic is like an editor for the creator." Yes — **sharpened on three points:**

1. **It KILLS / selects, it doesn't rewrite.** It can't *add* specificity that isn't there (selection ≠ source). You can't lean on it to rescue weak takes.
2. **It must be INDEPENDENT** — a clean-context subagent, fresh eyes, optionally a different model. A self-grading creator blesses its own generic favorite (the **judge ceiling**) — *only independence breaks it, not more iterations.* (Topic-4: this is mechanically just an SDK subagent with an isolated context window.)
3. **It judges by a RULE (the swap test), not by taste.** *Could a competitor run this with a logo swap? Is it the category look? Is it the obvious first idea?* Taste is the compromised thing (same taste as the writer → rubber-stamps the same slop). The swap test is rules-based = the most robust feedback tier.

**The critic can REJECT ALL.** The swap test is a *bar* (pass/fail), not a ranking. If nothing clears it, forcing a pick just ships the least-bad generic. Reject-all → **regenerate with feedback**, capped at ~2–3 rounds. **Persistent reject-all is a SIGNAL, not something to brute-force** — it means the problem is *upstream* (the room is too generic / brief too vague / the brand may lack differentiated truth → the commodity boundary in `00`). Flag up; don't grind. **Reject-all frequency becomes a health metric on brief quality.** (Product nuance: the app layer may still *show* the best attempt + a flag; but never wire "always pick one" into the critic.)

---

## Part 6 — Running example switched to The Whole Truth (TWT)

The user asked to drop DailyObjects and use **TWT** (they relate to it as a buyer). Illustrative TWT whey room used this session:
- **Buyer:** the label-reader who's been burned — found "proprietary blends" hiding sugar/junk, now distrusts every protein brand.
- **Promise:** a whey with nothing hidden — the whole label *is* the truth.
- **Proof:** no proprietary blend, named ingredients, no artificial anything.
- **Category floor to forbid:** gym bro mid-flex, dark moody gym, powder frozen mid-air, headless six-pack.
- TWT maps almost perfectly onto an example already in the research ("the guy burned by a fake lab report who trusts no protein brand," `00`).

---

## Part 7 — External validation: the Creyaa convergence (a live relationship)

While discussing the cell, the user surfaced an X exchange with the founder of **Creyaa** (a funded AI-creative company). The founder, independently:
- Confirmed the **self-critic / verification step** — *"checks the final creative actually held the angle instead of defaulting to a safer render"* — and said the problem it solves "came around constantly" before they added it.
- Named their **biggest make-or-break**: *"going from a very detailed creative brief and turning that into an equally detailed prompt for the image model. If the brief has gaps, the image model fills those gaps any way it pleases, which shifts it from the original creative concept."*

**Why this matters for the cell:** that is *verbatim* our genericness conclusion (the model fills a vacuum with its prior) **and** our **#1 eval failure mode** (`project_eval_top_failure_mode_image_content` — concept→prompt loss at art-direction). A funded competitor converged on the same mechanism AND the same hardest seam. Strong signal the thesis is right and the **concept→image jump is the real prize**.

**Relationship status:** the user chose **"just connect"** (peer, no ask — strongest long game with high-signal people). Drafting principle that emerged: lead with the *shared scar*, give a sharp *frame* (not the blueprint — Creyaa is also a competitor), end on a statement/shared-open-problem rather than a formulaic question, and write in real builder voice (kill the AI tells from Part 3). DM thread is warm and ongoing.

---

## Part 8 — Still open / NEXT SESSION

The mental model is locked; two pieces of the generator are **not yet designed** — and they are the actual work:

1. **(2) How the cell *thinks its way* to ONE good take** — the forward DR process for a single concept (buyer+awareness → way-in → bound hook+visual → completion), written as *moves not menu*, with the voice rules and forbid-the-obvious baked in.
2. **(3) How the cell forces 5 *genuinely different* leaps** — **the hard part.** "Be diverse" is weak against mode collapse. Open mechanism question: idea-first divergence with the DR formats as a *spread-ruler/diversity-constraint* (live during generation + post-hoc check) — needs a real forcing function, then test on the eval.

Also still open (architectural): **cross-cell visual distinctness** — if angles render in sealed parallel, two could land the same treatment; nothing coordinates this yet (flagged in S119 too). And: the **vision-verify gate** should compare the render against *structured intent* (the claim + promised visual mechanic + expected on-image copy), not pixels-on-vibes (Pokémon lesson, Topic 4) — run once, as an end gate.

**Concrete next step:** author the cell `SKILL.md` per Topic-4 (skeleton in the body < 5k tokens, depth in `references/`, **NO positive examples** — principles + counter-examples + the swap-test rubric), wire the **independent critic** as a clean-context subagent, add the **structured vision gate**. Then run it FORWARD on a TWT angle, judge as a **Type-A performance marketer**, and prove brand-swap generalization. Binders live at `agent/.claude/skills/{strategy,research,comp}/`; the cell joins them as `agent/.claude/skills/cell/`. Harness: `cloudflare/eval/mini-eval/`.

---

## Part 9 — The throughline

The cell is a **direct-response creative team running a forward process**: the strategist hands it a *room*, and the cell must be the *right tenant* — reach for the room's edge, not its center. Genericness was already won upstream (the room); the cell's remaining job is **(a)** carry the copy faithfully in a real human voice and **(b)** *invent* the visual that demonstrates the claim while clearing the category-look floor. The generator does the creating; the **independent, rule-based critic** is the editor that kills the drift and can reject the whole batch (which routes back to the room). Everything points at one seam — **concept → image** — which is both our #1 eval bug and, per a competitor's independent admission, the industry's. That's the prize the next session goes after.
