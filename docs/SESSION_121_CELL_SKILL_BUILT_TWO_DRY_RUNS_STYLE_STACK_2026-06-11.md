# Session 121 — Cell skill BUILT, two end-to-end dry runs PASSED, style-convergence thread opened (the five-layer stack)

**Date:** 2026-06-11
**Branch:** `new-ui` (all changes uncommitted, per `feedback_no_commits_until_tested` — but note: the cell now HAS passed its dry-run bar; commit is queued as next-session item)
**Status:** The cell went from "mental model" (S120) to **built, amended, and validated end-to-end twice** — including the first actual rendered ads the new pipeline has ever produced. A new design thread (style convergence / the five-layer stack) was opened by the user and is **discussed but NOT yet folded** — it is the first topic for next session.

> **Read first (continuity chain):** this doc → `SESSION_120` (cell mental model locked) → `SESSION_119` (strategy locked) → `docs/anthropic-learnings/00-genericness-conclusion.md` (the capstone). Memory: `project_first_principles_redesign` (S121 block added), `feedback_binder_teaches_thinking_not_looking`, NEW `feedback_plain_language_not_docs`.

---

## Part 0 — Where this sits

S120 ended with the cell worked out conceptually and a warning not to one-shot it from a vacuum. This session: (1) a fresh creative-director review of the whole project, (2) the concept→prompt-loss seam diagnosed and closed in design (the shot spec), (3) live research on Meta Andromeda/GEM, (4) the cell skill **authored**, (5) **two full dry runs** (DailyObjects, TWT) through every organ, (6) six amendments folded from what the runs taught, (7) the style-convergence thread opened (pending).

---

## Part 1 — The opening review (fresh CD eyes on the project)

Verdict: thesis sound and externally validated; upstream artifacts genuinely senior-level (the DailyObjects Bet would not embarrass a paid consultant). Risks named, ranked: **(1) zero ads produced** — the prize seam (visual) untouched while upstream got polished; **(2) no ground truth** — swap test measures distinctiveness, not conversion; beta clients + design-partner credits sitting idle; **(3) compounding chain variance** — stages validated only in isolation, no end-to-end number; **(4) invisible integration debt** — production still runs the old 6-hook + 14-style pipeline (`agent-runner.ts:99` = Haiku 4.5 everything); **(5)** cross-cell distinctness, angle-vs-angle swap test, founder elicitation unscheduled. Call: build the cell rough NOW, stop designing. (This session did exactly that.)

---

## Part 2 — The seam fix: the SHOT SPEC (concept→prompt loss closed in design)

The #1 eval failure (concept→prompt loss) happens at a seam S120 left as "just an arrow": between the winning concept and the render prompt. The fix, now in the skill:

- **The thesis applies fractally: the image model is also a mode-seeker.** The prompt is the room you hand the renderer; an underspecified prompt is a vacuum it fills with the category average (= Creyaa's "fills those gaps any way it pleases," verbatim).
- **Shot spec = first-class artifact authored at concept-lock** (not reconstructed at verify): claim · on-image copy VERBATIM + placement · objects · action · composition · product binding (the reference image + what must stay true) · aesthetic · must-show · forbid. Rule: **anything the spec doesn't decide, the image model decides.**
- **Compile = mechanical translation** (decides nothing, drops nothing); **forbids compile into positive decisions** (renderers ignore negations — "no gradient" must become the actual stated background).
- **Vision gate checks the render against the same spec** as assertions → named diffs → ONE targeted retry (rest byte-identical) → flag.
- **Drawability gate at the critic**: a "theme" ("conveys trust") is unrenderable; a picture is objects + action + composition a stranger could draw.
- By the project's own taxonomy this seam is a *craftsman* problem (dilution — below the judge ceiling) → mechanical discipline + gate suffice; no independent critic needed for it.

---

## Part 3 — Andromeda/GEM research (live, primary sources)

- **Andromeda = the retrieval stage** (Meta eng blog, Dec 2024): selects ~thousands from tens of millions of candidate ads per user, on pre-computed ad embeddings; built to exploit "exponential growth in volume of eligible ads creatives." NVIDIA Grace Hopper; +6% recall, +8% ads quality on selected segments.
- **GEM = LLM-scale ranking foundation model** (Meta eng blog, Nov 2025): features include "creative representation"; roadmap = multimodal learning across text/images/audio/video.
- **No beauty score exists.** The system reads *what the ad is* (content fingerprint) to route it. **"The algorithm doesn't reward beautiful ads, it routes distinct ones."** The swap test ≈ an embedding-distance test — our rubric and Meta's retrieval math want the same thing.
- Practitioner consensus (Motion, SEL): diversity counts at the **concept** level (visual + messaging + audience); **near-duplicates get collapsed** ("multiple product shots with slightly different copy = a single ad"; HexClad 75 variants → 6 genuinely different); fatigue fast (~4 exposures → conversion odds −45%). Agency numbers ("10–20 concepts required," "20–35% ROAS") = folklore, no primary source.
- Consequences for us: N angles = exactly the rewarded diversity; one-ad-per-angle (Road A) matches dedup reality; fatigue speed = the argument for the angle bench as refresh pipeline.

---

## Part 4 — The cell skill: BUILT

`agent/.claude/skills/cell/` — **SKILL.md** (~3.9k tokens, under the Topic-4 budget) + `references/critic.md` (the independent CD's 7-test rubric) + `references/shot-spec.md` (spec schema + compile rules + gate checklist) + `references/counterexamples.md` (the bank, MOVED here as canonical; pointer left at `docs/anthropic-learnings/cell-counterexamples.md`).

Spine: identity (DR shop's AD+CW seat; "creative is the targeting") → **way-in mining** (enumerate ~5 one-line truths from the files BEFORE writing; way-ins are found, never invented; creativity is spent on the picture and the voice) → **the bound pair** (a take = ONE idea expressed twice, hook + picture conceived and judged together; picture DEMONSTRATES the claim) → voice rules (who is speaking; read-aloud; kill-list) → **mechanical self-check** → **independent critic** (clean context, different model, 7 pass/fail tests, uncertain=fail, kills-not-rewrites, REJECT-ALL legal → one regeneration with named reasons → second reject-all routes upstream) → **shot spec → compile → render once → vision gate** (named diffs, one targeted retry).

Deliberately absent: positive ad examples, the 6-hook menu, DR-formats-as-menu (spread-ruler only). The TWT "peel" example from chat deliberately NOT in the skill (would plant a template).

**Critic's seven tests:** swap (umbrella) · category-look (vs bank) · obvious-first-idea · bundle coherence (could this picture sit under three hooks?) · drawability · voice · honesty (no margin).

---

## Part 5 — Dry run 1: DailyObjects Angle 2 "The Deliberate Carry" (the smooth path)

Seats: generator = **Fable 5** (main session) · critic = **Sonnet 4.6** clean subagent · renderer = **fal-ai/nano-banana-pro/edit** (the exact production endpoint) at 1K · gate = Fable.

- 5 way-ins (owned name / metro sameness / the Lagoon colour / built-for-the-364 / vibes-vs-evidence) → 5 takes → **critic killed 4**. The kills that matter:
  - **Set-level catch:** takes 1–4 were ONE move ("contrast against the grey category") in four outfits — surfaces varied, the argument didn't. The generator (Fable, with the bank in context) missed it; the independent critic didn't. Judge-ceiling thesis demonstrated live.
  - Caught a **banked cliché in the generator's own copy** ("Meet your daily" = "Meet [Product]").
  - Caught honesty-by-inversion ("your daily bag gets durability and nothing else" = unproven competitor claim).
- Winner: **"Or Just Look"** — the category's own wallpaper words ("EFFORTLESS. ICONIC. PREMIUM. SOFT.") washed out, then "Every bag ad this year. Or just look:" and the real tote on a café chair. Sophistication-stage play (market tired of claims → show).
- Spec → compile → **render → gate PASS first try** (two cosmetic diffs, no retry). Reference binding verified at zoom level: black top panel, twin pocket seams, logo tab, strap construction all carried from `lagoon-basalt-tote.png`. **#1 failure mode (concept→prompt loss) and #2 (reference ignored) both did not fire.**
- Artifacts: `cloudflare/eval/mini-eval/results/cell-dryrun/` → `dailyobjects-angle2-orjustlook-v1.png`, `bag-zoom.png`, `prompt-v1.txt`.

---

## Part 6 — Dry run 2: TWT Angle 1 "The Stomach Angle" (the full-loop rehearsal — every defense fired)

Production-realistic seats: generator = **Sonnet 4.6 reading the skill COLD** (clean subagent; Fable only orchestrated) · critic = **Opus** (different model, clean context, round-1 context kept for round 2) · same renderer/gate. Room = Angle 1 from `results/strategy-2026-06-08-bets-run1/thewholetruthfoods.md`.

- **The room carried a factual error** ("29g protein badge"; the real pack reads 24g). Left in deliberately. The generator read the reference image and **silently bound to the pixels (24g everywhere, never parroted 29g)** — the spec discipline absorbed an upstream error.
- **Round 1: REJECT ALL.** All five takes passed craft tests 1–6; all five failed honesty: "Hundreds of people…", "100+ Amazon reviews" (hook!), "Protein doesn't bloat you. Sucralose does." (invented causation), others-do-wrong framing, and an out-of-proof testimonial. Opus set-level read: *"the batch reaches past its proof boundary for force."* → **Model capability shows up as discipline-under-constraint, not craft.** The loop is MORE load-bearing at production tier, exactly as the architecture predicted.
- **Seam artifact discovered:** the "killed-as-fabricated" quote was REAL — *"This is the only protein I can have with just water"* sits at research.md:111 (Instagram). The angle's "Proof (only this)" just didn't carry it. → The boundary rule didn't exist in the skill yet (now folded, Part 7). Also real: "~8–12 Amazon reviews citing stomach comfort" (research.md:114) → the "100+" kill was fully justified.
- **Regeneration with named reasons → Round 2: 3 survivors, winner "The Boring Review"** — *"We framed the most boring review we get."* + a wooden photo frame holding the card *"'Easy on the stomach.' — Amazon review"* next to the pack. Opus: the only take a competitor cannot run even in principle (the pattern-claim needs the review corpus; the quiet-vs-shout stance self-indicts every shouting rival). Kills: Take 3 "The Streak" on **bundle coherence** (the habit-calendar picture is cause-agnostic — would sit under a taste or price hook unchanged → decoration, the textbook case); Take 5 on swap + honesty — where "tastes like real cocoa" was ANOTHER seam artifact: the strategist's taste note was given to the generator but not the critic → **the room must be byte-identical for both seats** (now folded).
- Sonnet wrote the **shot spec + compiled prompt itself** (orchestrator audit: pass — every field landed, nothing new authored, forbids → positive decisions).
- **Render v1 → gate FAIL: the round gold Trustified seal missing** (a named must-show). One targeted retry (correction appended, rest byte-identical) → **v2 PASS, no regression** (card text character-exact; pack faithful incl. wordmark caret, 24g badge + sub-lines, flavor band, Bestseller ribbon).
- Artifacts: `twt-angle1-boringreview-v1.png` (gate-fail), `-v2.png` (final), zooms, `prompt-twt-v1/-v2.txt`. **Takes/verdicts/specs live only in this conversation transcript** — harness wiring (next session) fixes that.

**Cost/latency shape:** 2 generator calls + 2 critic calls + 2 renders ≈ 10 min wall-clock; text cost trivial next to image spend.

---

## Part 7 — Amendments FOLDED (six, all evidenced by the runs)

1. **Proof boundary** (cell SKILL.md): research = quarry for way-ins/scenes/voice; **every claim and quote in the ad comes from the angle's proof field**; true-but-unpromoted material → flag upstream, never use.
2. **Move-level spread-ruler**: name each take's argument move (contrast/demonstration/dare/testimony/…); ≥3 distinct moves; one-proof-device convergence = same failure; "re-mining, not re-costuming."
3. **Take artifact format**: the canonical `--- TAKE N ---` block now in the skill (was living in orchestration prompts).
4. **Mechanical self-check before the critic**: verbatim-quote check, count check, mandatory scan, read-aloud vs bank, drawability — "needs no taste, which is why it is yours." (Would have saved the entire TWT round-1 critic pass.)
5. **Byte-identical room**: in the SKILL's critic paragraph + an orchestrator contract note in `references/critic.md`.
6. **Strategy binder, ONE sentence** (locked binder, touched deliberately, easily reverted): proof field must be carried **complete** — "a quote you leave out is a quote the ad cannot use."

---

## Part 8 — The style-convergence thread (OPEN — first topic next session)

The user looked at both finals and called it: **they converge on one look** — muted still life + witty clean sans + soft window light + cream. Worked out live (user pressure-testing throughout):

- **The "tasteful center" is the anti-cliché cliché.** Forbidding the category floor doesn't make the model creative — it relocates the mode one level up, to the default "good ad." Mode-seeking never dies; it moves.
- Per-ad vs portfolio: each dry-run ad individually **clears its own feed** (comp-relative distinctness — TWT's rivals run price graphics + gym UGC; DailyObjects' run gradient DCO + fandom prints). The convergence is OUR house wallpaper — it bites at portfolio scale (N angles, repeated campaigns, Meta fatigue) = the parked **cross-cell distinctness** gap surfacing after just two outputs.
- **Visual vernacular** = what KIND of image it is, read before any content (screenshot / snapshot / still life / documentary / newsprint…). Each vernacular borrows trust from its native habitat (screenshot = "evidence I found"; UGC = "a friend's post"). The cell never consciously asks "what kind of image should this claim arrive as?" — so the renderer answers with its favorite.
- **"The model has the library, not taste."** It can execute papercut/clay/sticker/Pixar on demand; what it lacks is a *reason to pick one* — taste = a selection function, externalized into derivation. Four doors for crafted styles: (1) the claim can't be photographed (abstract → illustration/craft performs it); (2) the brand identity owns a crafted world; (3) the buyer's feed-culture; (4) comp wallpaper contrast. Guardrails: the real product stays photographically real inside any stylized world (reference binding); craft must demonstrate, not decorate. **AI-soft-3D/Pixar = AI slop's own emerging signature → bank candidate.**
- **The five-layer stack** (plain version): every ad image answers five questions — (1) who took this photo? (2) clean or beat-up? (3) what do the words look like? (4) did someone mark it up? (5) what's it sitting in? Each has a boring default; **all-five-defaults = the tasteful center.** Our two runs took the default at every layer.
- **The implied-author shortcut** collapses five decisions into one: *who supposedly made this image?* The buyer (flash snapshot + marker circle + scrawl) / the founder (documentary + handwritten note) / the internet (screenshot + UI chrome) / an institution (scan + stamp) / the brand (still life + set type). **The take's VOICE picks the author; the author picks the stack.** One fiction per image; deviations need reasons; defaults allowed when chosen consciously.
- **Honesty line settled:** the brand makes every ad — the author is a COSTUME, not a deception (it says Sponsored; same as writing copy in a friendly voice). Borrow the look, never the facts: screenshot-style of a REAL review = fine; invented reviewer/quote = killed (the critic already proved it kills these).
- **PENDING amendments (4) — discussed, NOT folded, user approval pending:**
  1. Bank: name the **tasteful center** + **AI-soft-3D** as universal modes.
  2. Spread-ruler: five pictures must differ **at first glance** (vernacular/layer-stack, not just content).
  3. Spec Aesthetic field → decomposed into the five layers, each a conscious, reasoned decision (or author-first derivation).
  4. Voice→treatment mapping written into the skill ("treatment is voice made visible").
  Packaging plan: depth goes to `references/layer-stack.md` (skeleton stays lean), Aesthetic field points at it.

---

## Part 9 — Communication rule (meta)

The layer-stack first explanation was delivered in "documentation-writer" voice and lost the user. Permanent fix: **CLAUDE.md now opens with "How To Talk To Me"** (plain everyday language, one idea at a time, concrete example before abstraction, no docs-voice) + memory `feedback_plain_language_not_docs`. Teach via one worked example, never a taxonomy.

---

## Part 10 — Files changed this session (all uncommitted on `new-ui`)

**New:** `agent/.claude/skills/cell/SKILL.md` + `references/{critic.md, shot-spec.md, counterexamples.md}` · `cloudflare/eval/mini-eval/results/cell-dryrun/` (2 finals, 1 gate-fail render, 4 zooms, 3 prompts) · `server/tmp-cell-render.mjs` (**TEMP one-off renderer** — delete or promote into the harness) · this doc.
**Edited:** cell SKILL.md + critic.md (the six amendments) · `agent/.claude/skills/strategy/SKILL.md` (one proof-field sentence — flagged, locked binder) · `CLAUDE.md` ("How To Talk To Me") · `docs/anthropic-learnings/cell-counterexamples.md` (moved-pointer) · memory: `project_first_principles_redesign.md` S121 block, `MEMORY.md` index, new `feedback_plain_language_not_docs.md`.

**Models used:** generators Fable 5 (run 1) / Sonnet 4.6 cold (run 2) · critics Sonnet 4.6 (run 1) / Opus (run 2) · renderer fal-ai/nano-banana-pro/edit @1K · gate Fable 5. Production note: prod agent (old pipeline) is Haiku-4.5-everything; eval apprentices: strategy=Sonnet, research/comp=Haiku (comp.ts:115 carries the swap-back-to-Sonnet comment). **Cell recommendation: generator Sonnet minimum (most judgment-heavy seat; TWT round 1 = the evidence), critic = different model, gate = Haiku-tolerant.**

---

## Part 11 — NEXT SESSION

1. **Settle + fold the style-layer amendments** (Part 8's four) → `references/layer-stack.md`. The open design question: exactly how the Aesthetic field forces the layer decision without becoming a menu.
2. **Commit the validated stack** (binders S113→now + cell + dry-run artifacts; delete or promote `tmp-cell-render.mjs`).
3. **Wire `apprentices/cell.ts` into the mini-eval** + offline rubric (distinct from runtime critic, shared swap-test definition) + fixtures incl. reference images + a frozen Bet angle → artifacts to disk, model-seat economics testable (Sonnet vs Haiku per seat).
4. **Fresh end-to-end chain on a third brand** (research→comp→strategy→cell, no canned fixtures) → generalization + the first chain-reliability number.
5. **Real spend** — the pipeline is now semi-manually runnable; put one campaign behind ₹20–30k for a beta client while production integration proceeds in parallel. The only judge that outranks the swap test.
Parked: cross-cell visual distinctness (now urgent-adjacent via Part 8), founder elicitation, production orchestrator integration.

---

## Part 12 — The throughline

The cell exists, and it works the way the theory said it would: the generator — any generator, Fable included — walks to the center; the **independent critic** catches it (one-move-in-four-outfits; the banked cliché; five honesty inflations); the **spec** makes the renderer execute the concept instead of re-deciding it; the **gate** catches what slips and fixes it in one named retry. Two brands, two finished ads, both failure modes (#1 concept→prompt loss, #2 reference ignored) silent in both runs. The new frontier the user found by just *looking* at the two outputs: the system's own house style — the all-defaults stack — which is where the next round of design goes.
