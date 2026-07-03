# Session 123 — Two dry runs under the folded skill, the user's verdict ("this is not working"), and the mandate: revisit the cell from first principles

**Date:** 2026-06-12
**Branch:** `new-ui` (everything uncommitted)
**Status:** HONEST FAILURE RECORD. The S122 amendment package was folded and tested in two live runs (TWT rerun, DailyObjects cold angle). Both runs worked at the *process* level and disappointed at the *artifact* level. The user's closing verdict: the skill got bloated, the brainstorm did not produce the output, "we tried everything and it didn't work." **Next session = revisit the cell design from first principles.** This doc is the evidence base for that revisit — it deliberately does NOT prescribe the answer.

> **Read first (continuity chain):** this doc → `SESSION_122` (the visual strategy + amendment package this session tested) → `SESSION_121` (cell built, first two dry runs) → `docs/anthropic-learnings/00-genericness-conclusion.md`. Memory: `project_first_principles_redesign` (S123 block).

---

## Part 0 — The arc in one paragraph

S122's package A–H (+ Canva test, weld grades, spent furniture, look-level modes) was folded into the cell skill in the morning. Dry run 3 (controlled TWT rerun) followed: the new knives fired correctly, a take the user *likes* won ("On My Third Tub" — the shelf ad), but the render botched the pack (binding misread; gate checked the spec's words instead of the reference pixels) and the user called it: not looking good, not what we discussed. Three fixes were folded (pixels-vs-pixels gate, binding-written-with-reference-open, world-spread set-read) and dry run 4 ran on a fresh cold angle (DailyObjects "The Considered Case"). Round 1: all-realism takes → REJECT ALL (the world-spread knife working as built). Round 2: the conceptual door opened — capsule machine, fake-feed parody, keynote, wardrobe — and the critic crowned "The Keynote," the most un-swappable take. The user's verdict: **that is a branding ad, not DR** — 35 minutes for an ad that celebrates the company instead of selling to a buyer. Retrospective followed; the user closed with: revisit from first principles.

---

## Part 1 — What ran (compressed; full records in artifacts)

**Dry run 3 — TWT Angle 1, controlled rerun (same room as S121's dry run 2; folded skill = only variable).** Generator Sonnet 4.6 cold, critic Opus 4.8, byte-identical room. Round 1: 4 kills + 1 survivor (vs old skill's REJECT ALL on the same room). The new knives all drew blood: Canva test ×2, tasteful-center mode ×2 ("the tasteful center wearing a steel-glass costume"), thumbnail set-read failed 3/5. Winner: **"On My Third Tub"** — three depleted-to-fresh pouches on the buyer's shelf, wear-as-time staging, sourced hook. Render: pack came out dark/narrow/wrong — the generator misdescribed the reference pixels in the spec, the prompt carried the misread, the renderer obeyed the text over the image, and the orchestrator-gate validated against the same wrong text. **Correlated error; the gate was the organ that failed.** Artifacts: `results/cell-dryrun/twt-angle1-run3-*`.

**Three fixes folded between runs:** (1) gate = pixels-vs-pixels, the spec's description is never evidence (shot-spec.md); (2) product binding written with the reference image OPEN, re-checked item by item (shot-spec.md); (3) **world-spread set-read** at the critic — all-five-one-world = collapsed spread (critic.md).

**Dry run 4 — DailyObjects Angle 1 "The Considered Case" (fresh, cold, solution-unaware buyer; sage case reference).** Same seats. Round 1: five realism takes → **REJECT ALL** (world spread: "the set cannot contain a scroll-stopping click it never attempted"; thumbnail: 3/5 = "sage case on a surface"). Round 2: transformed — capsule vending machine dispensing the category's cases / flash-lit shop-wall anthropology / deadpan fake-feed parody / **the keynote** / case-on-a-miniature-hanger in a capsule wardrobe. 4 survivors. Critic ranked by un-swappability → winner "The Keynote" ("strip the brand and the take stops existing"). Binding under the new rule held pixel-for-pixel (4-wide ribbed dot grid, DO badge position, pill cutout; the interior-ribbing misread class explicitly fenced). Render v1 gate-FAIL on named diffs (oversized silhouette occluded the hook) → one targeted retry → v2 gate PASS. Cost: generator 120k tok, critic 48k, 2 renders, ~35 min wall-clock incl. the reject-all round trip. Artifacts: `results/cell-dryrun/do-run4-*`.

---

## Part 2 — The user's verdicts (the calibration data; preserve these)

- On run 3's render: *"this is not looking good. and also it didn't use the reference image... this is not what we discussed all along."*
- On run 4's keynote: *"it looks like a branding ad rather than DR ad. im dissapointed. i think we need to revisit how we framed the cell."* Also: 35 minutes is too long.
- Closing: *"we unnecessarily bloated lot of stuff in the skill. out of all these **i still like that shelf idea and the image**. even after doing all the brainstorm you were not able to get the output."* → *"we tried everything and it didn't work."* → mandate: **revisit the design from first principles next session.**

**The single most important signal:** the ad the user likes — across every output this project has ever produced — is "On My Third Tub": quiet, proof-led, buyer-voiced, wear-as-time. Consistent with the S121 winners and the TWT benchmark ("Add muscle, not ingredients"). The user's revealed taste = **the proof made arresting**, not conceptual theater. The turtle aspiration came from example ads; the shelf preference comes from their gut on OUR outputs. When they conflicted, the gut won.

> **ERRATUM (2026-06-12, next session):** the user says this paragraph is wrong — they **never liked the shelf ad**. Strike the "single most important signal" reading. Corrected calibration: **no output from any run has met the user's bar**; the taste target is unknown and must not be inferred from this doc.

---

## Part 3 — The retrospective (delivered in-session; the errors in cost order)

1. **Theorized away from our own evidence.** S121 ended with two validated quiet/proof-led wins and a narrow complaint (staging defaulted; renders AI-generic). S122 escalated that into a conceptual-ad ideology (turtles, welds, invented worlds) because the example batch was exciting. The user's taste never asked for theater.
2. **Folded everything at once, ran nothing in between.** Eight amendments + Canva test + three fixes in one day, despite the same session writing the autoresearch lesson (one change → one measurement → keep/reset). When run 4 drifted brand, no way to isolate which addition caused it.
3. **The world-spread knife was a quota wearing a detection costume.** After carefully rejecting style quotas (Option A over B), a rule was added in one turn that mandates invented worlds ("a regeneration must answer it"). The generator manufactured worlds to satisfy the ruler; the keynote is what quota-satisfying conceptualism looks like. Option B through the back door.
4. **The ranking never asked the DR question.** "Bought, not admired" exists in prose and in zero tests. The critic ranks survivors by un-swappability — and the most un-swappable thing any company owns is its own name → **the swap test, used as a RANKING key, has a brand-ad attractor** (name-weld = maximal self-reference). The swap test is a floor, not a compass. The critic's own #3 ("The Case Machine" — "Your phone was a decision. Your case was an accident.") was the buyer-centric DR take in that batch.
5. **Run 3's render failure was the orchestrator-gate's** (validated against spec text, not reference pixels) — fixed and proven in run 4, but it poisoned the user's read of the one ad they liked.
6. **Act-act-act under disappointment.** After each miss: new diagnosis + new fixes + new run within minutes — including starting a re-render while the user was asking for reflection. Inverse of "discuss before implementing."

**Root cause, one sentence:** every time taste disappointed, we added a RULE to the generator's room, and each rule moved the mode instead of removing it — forbid the cliché floor → tasteful center; forbid the center → conceptual theater. Third repetition of the project's own mode-seeking law (S117 style bank, S121 tasteful center, S123 world spread). **Three attempts to encode the taste ceiling as rules have now failed the same way.**

---

## Part 4 — What the evidence actually supports (the honest inventory)

**Working, evidenced across runs (keep):**
- The independent critic + REJECT-ALL mechanism (fired correctly every time: TWT honesty round, run-4 realism round).
- The floor knives: honesty/fabrication catches (invented testimonials, "for weeks," aggregates-as-stats, ₹399 inside a PARODY card — "the mandatory is a wall with no irony exception"), swap test AS A KILL BAR, category-look/cliché bank, mechanical self-check.
- **Pixels-open binding + pixels-vs-pixels gate** (run 4's case held detail-for-detail; the run-3 failure class is closed).
- **Staging-written-with-reasons** — the wear-as-time staging that makes the shelf ad good IS an S122 product; the old skill never wrote staging down.
- Artifacts-on-disk discipline; byte-identical room for both seats.

**Suspect / implicated in the failures (the first-principles revisit decides):**
- World-spread as a set-read that mandates invented worlds (quota dynamics — direct cause of run 4's drift).
- Un-swappability as the RANKING key (brand-ad attractor).
- The conceptual apparatus' weight in the skill (weld grammar, maker taxonomy, furniture quarry, two-worlds doctrine) — possibly fine as *available* thinking, harmful as *pressure*; SKILL.md ~4.6k tokens (18% over budget), critic at 10 kill tests + 1 flag + 4 set-reads.
- The Canva test's letter (fakeability) vs the user's spirit ("takes a creative team").
- No test anywhere asks the DR question: *who is the ad about, and what does the buyer get for acting?*
- 35-min wall-clock (≈12 min was the reject-all round trip; chat orchestration overhead inflates the rest; harness estimate 6–15 min — still needs validating).

**Upstream finding (strategy-side, for the revisit):** DailyObjects Angle 1's promise is an identity attribute ("design as considered as the device") with price banned and no concrete buyer outcome — a brand-positioning room wearing a DR jersey. Nothing in the strategy binder checks that a promise is a BUYER OUTCOME. With that input, brand drift downstream was overdetermined.

---

## Part 5 — The two judges never consulted (carried from the in-session close)

Three rule-encodings of taste have failed. The two judges the project's own docs call decisive have never been used:
1. **A real founder choosing from a set.** Run 4 quietly produced FOUR survivors (Case Machine / Fake Feed / Keynote / Wardrobe). Forcing a single winner is exactly where the brand-trophy bug bit. The S117 open fork ("one ad per angle vs the diverse set Meta wants") is back on the table — survivors-as-deliverable, founder/Meta as the selector.
2. **Real spend.** The ₹20–30k beta test has been queued behind "one more skill improvement" for weeks. It is the only judge that outranks the swap test, per the project's own conclusion.

---

## Part 6 — Open questions for the first-principles revisit (questions, not answers)

1. **What is the cell's deliverable — one winner, or a survivor set?** (Single-winner ranking caused the brand-trophy failure; Meta/Advantage+ and the founder-pick product story both favor sets.)
2. **Where does the taste ceiling live?** Rules have failed 3×. Candidates: founder pick, real reach data, human-in-the-loop curation as the v1 product (the floor stays automated).
3. **What is the minimal skill?** Which folded parts earn their place by run evidence (Part 4's "working" list) vs which exist because a brainstorm was exciting? What does the skill look like rebuilt at ~2.5–3k tokens around only the evidenced parts?
4. **Was "vivid" even the right brief?** The user's revealed taste = proof made arresting (the shelf). Is the right bar "the proof, staged with craft" rather than "conceptual click"? What do the beta clients' buyers actually respond to (empirical, not arguable)?
5. **Who is the ad about?** If the cell survives in roughly its shape: a buyer test (hook+picture about the buyer's situation; founder voice talks about the buyer's problem, never the company's philosophy) and a DR ranking key (strongest reason for THIS buyer to act; swap-proof = entry ticket, not trophy).
6. **Upstream contract:** must the angle's promise be a concrete buyer outcome? (DailyObjects Angle 1 fails that test; TWT Angle 1 passes — and note which room produced the ad the user likes.)
7. **Speed budget:** what's the acceptable per-ad wall-clock in production, and what does the harness (not chat orchestration) actually deliver?

---

## Part 7 — State of the repo (all uncommitted on `new-ui`)

**Skill (post-S122-fold + 3 same-day fixes):** `agent/.claude/skills/cell/SKILL.md` (~4.6k tok) · `references/layer-stack.md` (NEW) · `references/critic.md` (rewritten: 10 kill tests / 1 flag / 4 set-reads incl. world-spread) · `references/shot-spec.md` (staging-record carrier; pixels-open binding; pixels-vs-pixels gate) · `references/counterexamples.md` (+look-level modes, +spent famous furniture). One flagged sentence each on the locked strategy binder (S121's proof-field line; awareness-stage was confirmed already present, untouched).
**Artifacts:** `cloudflare/eval/mini-eval/results/cell-dryrun/` — run 3 (`twt-angle1-run3-{takes,verdict,spec}.md`, prompts, render + zooms), run 4 (`do-run4-spec-and-verdicts.md`, prompts v1/v2, renders v1/v2 + zooms incl. `do-run4-ref-left-unit.png`).
**Loose end:** `prompt-twt-run3-v2-fixedbinding.txt` — the corrected-binding shelf-ad prompt, written but **never rendered** (user interrupted; rendering it is a ~5-minute standing offer). `server/tmp-cell-render.mjs` still pending delete-or-promote.
**Docs:** SESSION_122 (the strategy this session falsified in part), this doc.

---

## Part 8 — The throughline

The machinery works: the critic kills, the self-check catches lies, the binding now holds pixels, the staging gets written down and argued. What failed is the thing we kept asking the machinery to do — contain the user's taste as rules. Three encodings, three modes: cliché floor → tasteful center → conceptual theater. Meanwhile the one ad the user likes came out of the simplest configuration: a true proof, staged with care, in the buyer's own voice. Next session starts from zero assumptions: what is the cell FOR, who judges its output, and what is the smallest skill the evidence actually supports — with the standing fact that the two strongest judges (a founder's pick, real spend) are still waiting to be asked.
