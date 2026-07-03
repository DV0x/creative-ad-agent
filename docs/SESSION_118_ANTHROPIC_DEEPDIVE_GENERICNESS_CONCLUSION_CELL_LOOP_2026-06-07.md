# Session 118 — Anthropic engineering deep-dive, the genericness conclusion, the cell self-correction loop, + the orchestrator/follow-up routing thread

**Date:** 2026-06-07 (work spanned ~June 5–7)
**Branch:** `new-ui` (all changes uncommitted, per `feedback_no_commits_until_tested`)
**Status:** IN PROGRESS. A learning + conclusion session, no code written. Three threads: (1) a structured **deep-dive on Anthropic's own engineering guidance** (4 topics planned; 1–4 done — **series complete**, Topic 4 added 2026-06-07); (2) a **settled conclusion on creative genericness** — it's an information failure, fixed upstream, with a two-track copy-vs-visual split and a cell self-correction-loop design; (3) an applied **orchestrator / follow-up-routing** thread (Topic-1 application). Plus a drafted (unsent) cold-email reply to a peer CEO.

> **Read first:** this doc → `docs/anthropic-learnings/00-genericness-conclusion.md` (the capstone) → the four topic notes `docs/anthropic-learnings/01..04` → `docs/anthropic-learnings/cell-counterexamples.md`. Memory: `project_genericness_conclusion` (new), `project_first_principles_redesign` (S118 status added), `feedback_binder_teaches_thinking_not_looking`, `feedback_swap_test_whole_construction`, `feedback_eval_type_a_lens`.

---

## Part 0 — How this session started and where it went

Opened by re-reading SESSION_117 (the upstream binder redesign + the parked "make binders lean + reasoning-sophisticated" work). The user chose to **first become expert in Anthropic's own published guidance** before touching binders. That deep-dive then triggered the real prize: a **first-principles resolution of why the agent's creative is generic** — which sharpens (and partly corrects) S117's "diversity at the generator" conclusion. Along the way we worked an **orchestrator/follow-up-routing** design (off Topic 1) and drafted a **CEO email** that forced the genericness thinking into plain language.

---

## Part 1 — The Anthropic deep-dive (the learning series)

Goal: become expert in building + harnessing agentic systems by studying the teams who built Claude Code, Skills, the SDK. Four topics planned; **each gets its own notes doc with principles → case studies → "what it means for our binders" → expert moves → pitfalls.**

### Topic 1 — Building Effective Agents ✅ `docs/anthropic-learnings/01-building-effective-agents/notes.md`
- Source: https://www.anthropic.com/engineering/building-effective-agents
- **Core:** agentic systems are a spectrum (augmented LLM → workflows → agents); move right only when needed. Workflow = predefined code paths (you orchestrate); agent = model directs itself.
- The 6 patterns: prompt chaining, routing, parallelization (sectioning/voting), orchestrator-workers, evaluator-optimizer, autonomous agent.
- 3 principles: simplicity, transparency, ACI (tool design — *"we spent more time optimizing tools than the prompt"*; poka-yoke / absolute-filepaths lesson).
- The silent thesis: **agents work where reality grades the output** (support = resolutions, coding = tests). Creative has no auto-grader → the rubric is the stand-in → evaluator-optimizer.
- **For us:** research→comp→strategy→cell = prompt chaining (the recommended shape, not a deficiency). The cell = evaluator-optimizer + parallel sectioning composed. Do NOT go autonomous (space is bounded).

### Topic 2 — Prompting + Reasoning ✅ `docs/anthropic-learnings/02-prompting-reasoning/notes.md`
- Sources: the unified prompt guide (platform.claude.com, Opus 4.7/Sonnet 4.6/Haiku 4.5) + frontend-design SKILL.md (as a real creative-skill comparison).
- 6 universals; adaptive thinking + `effort` (*raise effort, don't prompt around shallow reasoning*); CoT moves (`<thinking>` in examples, general>prescriptive, self-check); the physician quote-ground pattern; structured-research pattern (competing hypotheses + confidence + self-critique).
- **The examples deep-dive** (the contested one): examples = Bayesian prior; the model copies whatever's INVARIANT across the set. **Diversity is the load-bearing anti-templatization lever** (Anthropic-explicit). `<thinking>` traces teach the move (Anthropic-explicit for reasoning; templatization-prevention is my synthesis). **Frontend-design ships ZERO positive examples** → reconciliation rule: **examples narrow; use them where you want narrowing.** Structured upstream binders → multishot-with-`<thinking>`; the **cell (wide output) → principles + counter-examples, NO positive examples.**
- Plain-English explainer for "Bayesian prior / locks onto invariant" folded into the doc.
- **For us (diagnoses):** zero examples in upstream binders = skipping the #1 lever; no quote-grounding; no self-check; thinking probably off (enable adaptive + effort high); over-prescription; prompt-style mirrors output-style (cause of S117 fragmentation).

### Topic 3 — Context Engineering + Harnesses ✅ `docs/anthropic-learnings/03-context-engineering-harnesses/notes.md`
- Sources: effective-context-engineering-for-ai-agents + effective-harnesses-for-long-running-agents.
- Attention is finite (context rot, n² relationships); "right altitude" = the Goldilocks zone (= "moves not checklist" in Anthropic's words); "smallest high-signal tokens" (minimal ≠ short); three long-horizon strategies (compaction / structured note-taking / subagents-with-clean-context); JIT analysis; the Claude.ai-clone harness (init.sh + progress.txt + git, one-feature-per-session, startup ritual, browser-automation verification).
- **For us:** our apprentices ARE Anthropic-validated clean-context subagents ✅; right altitude + lean pass = the S117 parked work, now named; **a verification step is a real hole** (vision-check render vs brief = the analog of Puppeteer-for-coding, and our top eval bug); one-feature-per-session = one-scope-per-turn (the Topic-1 follow-up routing).

### Topic 4 — Skills + Agent SDK + production agents ✅ `docs/anthropic-learnings/04-skills-sdk-production/notes.md`
- Sources (all live-fetched): equipping-agents-with-agent-skills + Claude Code skills docs + open standard; building-agents-with-the-claude-agent-sdk + SDK docs; the multi-agent research system; Claude plays Pokémon (Anthropic-primary thin → third-party harness detail, flagged).
- **The capstone connection:** the conclusion's load-bearing upgrade — an **independent adversarial critic** to break the judge ceiling — is mechanically *just an SDK subagent with a clean context window.* Every unbuilt piece of the cell loop now maps to a concrete primitive.
- **Skills:** progressive disclosure (metadata always / body on trigger / files JIT); description carries the whole trigger burden; body is a *recurring* per-turn token cost (= S117 lean pass, now with a mechanism); scripts for determinism; gotchas = highest-value content; *"teach how to approach a class of problems, not what to produce for an instance"* (= `feedback_binder_teaches_thinking_not_looking`, Anthropic's words). **Genericness echo:** an LLM-generated skill from a vacuum = *"vague, generic procedures"* → don't one-shot the cell skill.
- **Agent SDK:** *"give your agents a computer"*; loop = gather→act→**verify**→repeat; subagents = context isolation (parent sees only the final summary); hooks run in-process (zero context); **verification hierarchy: rules > visual > LLM-judge** (ranks our checks: swap test = rules-based, render-vs-brief = visual, critic = LLM-judge).
- **Multi-agent:** *"work mainly because they help spend enough tokens"* — token usage = **80% of variance**, 15× tokens, +90.2% vs single-agent; complete task descriptions (objective/format/tools/boundaries); effort-scaling in the orchestrator prompt; tool-testing agent = **40%** faster; 5-criteria LLM-judge + start-small eval; rainbow deploys; **sync bottleneck unsolved**; NOT for shared-context/coding/tight-coordination (→ our chain is correctly NOT parallel multi-agent).
- **Pokémon:** long-horizon coherence = **note quality, not raw smarts**; separate recency-compaction from semantic-persistence; model-controlled knowledge base survives resets; **note quality is a correctness problem** (the staircase→"escalator" hallucination-into-notes cascade); structured text > vision-only for verification; strip harness complexity over time.
- **For us:** 13 diagnoses in the notes. Headlines — cell IS a skill (skeleton + references, NO positive examples); **independent critic = clean-context subagent = how the judge ceiling breaks**; vision-verify = SDK visual-feedback but feed *structured metadata* not just pixels (fixes our #1 eval bug); swap test = rules-based (keep out of quality-scoring); **token-spend caveat — applies upstream (search, reality-graded), NOT to cell generation (polishes the mode)**; cell memory = knowledge-base pattern + cite-before-commit; adopt the 5-criteria judge in mini-eval; build a tool-tester for fal/Perplexity.

---

## Part 2 — THE conclusion: creative genericness (the session's main output)

Full write-up: **`docs/anthropic-learnings/00-genericness-conclusion.md`** (capstone). Memory: **`project_genericness_conclusion`**.

**One line:** *Genericness is an information failure, not a creativity failure. You can't stop mode-seeking (RLHF trains it); you choose which room it collapses in. Supply real brand-specific truth upstream so the safest completion is already differentiated. You don't make the model creative — you remove its excuse to be generic.*

Key moves in the argument:
- **mode = category average = differentiates nothing = slop.** The model can't invent specificity it wasn't given → fills the vacuum with the category average. Genericness is the correct statistical answer to an underspecified question.
- **"Pick the room"** mental model (whey-ad room = slop; burned-buyer-fake-lab-report room = already good).
- **Honesty = genericness (same root):** both are the model filling a vacuum with its prior (category-average = boring slop; invented specifics = fake/dishonest slop). One cure: real retrieved truth. The whole S117 upstream redesign was ONE discipline.
- **Two-track refinement (the important correction):**
  - **Copy** genericness = pure information problem → fixed **upstream**; cell stays light (preserve + voice).
  - **Visual** genericness = TWO sources → vague insight [upstream] **+** collapse to the **category look** at art-direction [cell], independent of brief quality. The picture-idea is invented at the cell (real short leap). **Upstream necessary but not sufficient for the visual.**
- **Build redirect:** invest in **information acquisition** (research depth + **founder elicitation** of the un-Googleable truth) over generation cleverness; **swap test = north-star metric**; generator diversity = a multiplier (the diverse SET vs Meta's sameness penalty), mostly delivered by N strategy angles.
- **Boundary:** true commodity with no differentiated truth = a product problem, not a prompt problem.
- **Founding observation resolved:** "model recognizes good but doesn't reach for it" — recognition is a *selector, not a source*; missing brand-truth comes from upstream.
- **What changed from S117:** S117 located the fix AT THE GENERATOR ("diversity forced at the generator," Creative-DNA grammar, QD, Verbalized Sampling). **That's now SECONDARY.** Genericness is won upstream; visual = upstream + cell-craft. Generator tricks keep a bounded role (the diverse set) but are NOT where slop is defeated.

---

## Part 3 — The cell self-correction loop (design locked, not built)

Evaluator-optimizer, built to actually catch genericness rather than polish it. (In `00-genericness-conclusion.md` + `project_genericness_conclusion`.)

- **The trap:** naive "loop + quality rubric" POLISHES slop (refinement ≠ re-conception; judge ceiling; quality rubrics pass generic).
- **Four conditions:** sharp brief first · **diverge before you loop** · **independent/adversarial critic** · rubric tests genericness **comparatively** (swap test, category-look, obvious-first-idea) — NOT a quality checklist.
- **Flow:** diverge N concepts in TEXT → adversarial critic culls on swap-test rubric → refine winner → render ONCE → single vision-verify. (Diversity/judging in cheap text; camera runs once; vision is an end-gate, never the loop.)
- **Three rubrics, kept distinct:** generation-principles (in the cell skill) / runtime-eval (swap-test) / offline-eval (`cloudflare/eval/mini-eval/rubrics/`). Runtime + offline share the swap-test definition.
- **The judge ceiling:** a self-correcting loop converges to the limit of the judge's own taste; same-model self-critique blesses generic. **More iterations don't break it — only more independence does** (adversarial framing → fresh context → different model → external swap-test yardstick). Concrete checks (proof/honesty/dilution/voice) sit below the ceiling (in-prompt self-check OK); the **genericness check** sits at it (needs the separate adversarial critic).
- **Current state:** hooks use **self-selection** (same agent generates + picks) → subject to the ceiling → "decent." The **independent critic is the planned upgrade**, starting with visuals. Visual loop NOT built yet.
- **Component split:** copy's cell-side check is light (dilution + hook swap test); the visual rubric adds the **category-look** criterion (its second genericness source).
- **Counter-example bank:** `docs/anthropic-learnings/cell-counterexamples.md` — the "forbid the obvious" list (gym-bro-with-tub, gradient float, flat-lay, "Meet [Product]", "not just X, a Y", etc.), per-category, feeding the category-look + obvious-first-idea tests. Caveat: clearing the list is necessary-not-sufficient (avoiding cliché ≠ specificity → else *weird-empty* slop).

---

## Part 4 — The orchestrator / follow-up routing thread (Topic-1 application)

A substantial design discussion off Topic 1; not yet captured in its own doc, summarized here. Connects to the deferred memory `project_followup_intent_classification`.

- **First-gen = prompt chaining. Follow-ups = orchestrator-workers (which absorbs routing as its 1-worker degenerate case).** Don't build routing and orchestrator separately — build ONE orchestrator that emits a structured scope.
- **The scope schema = the ACI** (poka-yoke). A JSON object with **enums** (closed value lists) the model fills and code dispatches from. Sketch:
  - `intents: [{ kind: <enum>, target?: {...} }]` (compositional, for compound follow-ups)
  - `stages_to_run: ("research"|"comp"|"strategy"|"cell")[]`, `reuse: [...]`
  - Starter `kind` vocabulary: `extend_angles`, `new_audience`, `regenerate_with_new_reference`, `new_hero_product`, `new_brand`, `edit_hook`, `edit_image`, `add_visual_inspiration`, `qa_only`, `other` (fallback).
- **Routing on new artifacts must PERCEIVE first:** a new reference image needs a small vision step (same_product / same_brand_diff_product / different_brand / inspiration_only) BEFORE filling the schema. Strategy A vision-check (cheap) / B ask-the-user (ambiguous) / C research-and-let-it-decide (safe fallback).
- **Growth pattern:** ship a starter `kind` set → log every `other` → promote frequent patterns. Never crash; the unknown case has a defined fallback (clarify / full-regen / escalate).
- **Where it lives:** schema file (e.g. `cloudflare/src/lib/followup-plan-schema.ts`) + orchestrator prompt + dispatcher, all around `cloudflare/src/durable-objects/campaign-session.ts`.
- **Detail in Topic-1 notes** (`docs/anthropic-learnings/01-building-effective-agents/notes.md`, the "Application to OUR system" section has the full schema + perception-step writeup).

---

## Part 5 — The CEO email (Julius Korfgen, Uplane) — drafted, NOT sent

Cold-outreach reply. He has the same problem ("models recognize good work but don't reach for it" — that was Chakra's line; Julius asked "what's your approach?"). The final draft (in conversation, ready to paste) is first-person, plain, no em dashes, human voice (per `feedback_hero_copy_approach` voice discipline + S117 read-aloud test). It leads with **upstream specificity** ("pick the room"), shares the two eval findings (examples backfired; copy/visual cost split), and is **honest about built-vs-planned** (hooks self-selection is built + decent; the visual independent-critic loop is the *plan*, not built). Closes proposing a call with two day options. **Open:** swap "Tuesday or Thursday" for two concrete time slots + timezone before sending.

---

## Part 6 — Files created / changed this session (all uncommitted on `new-ui`)

**New docs:**
- `docs/anthropic-learnings/00-genericness-conclusion.md` — the capstone synthesis.
- `docs/anthropic-learnings/01-building-effective-agents/notes.md`
- `docs/anthropic-learnings/02-prompting-reasoning/notes.md`
- `docs/anthropic-learnings/03-context-engineering-harnesses/notes.md`
- `docs/anthropic-learnings/04-skills-sdk-production/notes.md` — Topic 4, the build-practice capstone (added 2026-06-07).
- `docs/anthropic-learnings/cell-counterexamples.md` — the forbid-the-obvious bank.
- `docs/SESSION_118_*.md` — this doc.

**Memory:**
- NEW `project_genericness_conclusion.md` (+ MEMORY.md index line at top of Active Plans).
- UPDATED `project_first_principles_redesign.md` — added an S118 status block marking S117's "diversity at the generator" as SECONDARY.

**No code touched.** No binders changed this session (strategy/research/comp still LOCKED from S116/117).

---

## Part 7 — Open items / next steps (pick up here)

> **DECIDED 2026-06-07 (end of session) — SEQUENCING: sharpen STRATEGY before building the cell.** The cell can only walk to the center of the room strategy hands it (genericness is won upstream; strategy is where the room is picked), so the strategy upgrade (item 4) now runs **before** the cell (item 2). New order: **strategy → then cell.**
>
> **LOCKED — the strategy→cell handoff contract.** Strategy's deliverable = a set of **angles** (the "bets"), differentiated by **who** (not by treatment). Each angle hands the cell exactly: **(1) who — buyer + awareness stage; (2) the one specific promise; (3) sourced proof** — the fact-sheet the cell may cite, with an explicit ceiling. **Format and concept are NOT strategy's to give:** in our DR spine "pick concept/format" is a CELL step, derived from the awareness stage; handing a format label re-introduces the killed "menu" anti-pattern. (`format` = the proven ad structure — PAS / us-vs-them / testimonial / demo / social-proof; `concept` = the specific creative idea that fills it. Both = cell's job.)
>
> **Sanity-check vs the real run** (`cloudflare/eval/mini-eval/results/strategy-2026-05-27-bets/thewholetruthfoods.md` — the S117-validated TWT bet, 3 angles split by WHO: Burned Buyer / Hesitant First-Timer / Clean-Food Person): the contract is **~80% already there.** Who+awareness = explicit ✅. **Sourced proof = excellent** — the per-angle *"what the creative may stand on (and only this)"* block IS the fact-sheet + cite-before-commit firewall, already built ✅. The one promise = present but woven into hypothesis/territory → **sharpen to one crisp line per angle.** **OPEN QUESTION:** each angle's **"Territory"** block also hands the cell execution direction (register/voice, "differentiate from," format context) — by the locked contract that's the cell's job. So the strategy upgrade is mostly a **subtraction**: trim Territory to who/promise/proof, **keep** the honest mandatories ("show the real pouch," "don't frame as dessert"), hand voice/format/concept to the cell.
>
> Then apply the Topic 2/3 upgrades to strategy (item 4): diverse `<thinking>`-traced example angles, quote-grounding, in-prompt self-check, adaptive-thinking/effort, lean pass.

1. ~~**Topic 4 deep-dive**~~ ✅ DONE (2026-06-07) — `docs/anthropic-learnings/04-skills-sdk-production/notes.md`. Learning series complete. **→ the cell skill (next item) is now the top live next step.**
2. **Start the cell skill** — apply the conclusion: principles + counter-examples (NO positive examples) + the swap-test rubric + the diverge→adversarial-critic→render-once→verify loop. Run FORWARD on DailyObjects Angle 1 (hero = Lagoon Basalt tote), judge as a Type-A performance marketer, prove brand-swap generalization (Arjun Infra).
3. **The verification step** — design the vision-check (render vs brief) gate; it's both an Anthropic harness principle and our #1 eval bug (`project_eval_top_failure_mode_image_content`).
4. **Upstream binder upgrades (S117 parked + Topic 2/3 diagnoses)** — add diverse `<thinking>`-traced examples to research/comp/strategy; quote-grounding (physician pattern); in-prompt self-check; verify adaptive-thinking + effort config in the apprentices; lean pass (smallest high-signal tokens); fix prompt-style→output-style fragmentation.
5. **Orchestrator / follow-up routing** — build the scope-schema + perception-step (resolves the deferred `project_followup_intent_classification`). Hybrid: scout inline, then the structured orchestrator.
6. **Send the Julius email** — add concrete time slots first.
7. **Founder-elicitation investment** — the highest-leverage build per the conclusion (the un-Googleable truth enters here); likely under-built today.

---

## Part 8 — The throughline to remember

> Stop trying to make the model creative; spend effort acquiring and sharpening real brand-specific information **upstream**, because the model's safest answer to a sharp-enough brief is already a differentiated ad. The cell's self-correction loop (swap-test rubric + adversarial independent critic, in text then render once) is the **secondary, cell-side** complement — load-bearing for the **visual** (which has a second, execution-level genericness source) and light for **copy**. Slop is just the correct statistical answer to a question you didn't make specific enough.
