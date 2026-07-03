# Synthesis & Reference — The Eval-Driven Agent Rebuild (S103–S133)

**What this is.** A navigable reference to the macro arc that began with running evals on the production ad-creative loop (S103) and produced a new four-apprentice agent architecture (through S133). It exists so you can find *where the exact thinking lives* for any decision — every claim points to a session doc, a capstone, or a source file.

**How to use it.** Read §1 for the one framing fact. Use §2 (session ledger) and §7 (decisions ledger) as the index — find the row, open the linked doc. §3–§6 are the connected narrative; §8–§9 are the forward plan. §10 is the verified file map.

**Provenance.** Compiled 2026-06-28 by an 18-agent read+synthesis pass over S103–S133, the `anthropic-learnings/` capstones, the binders (`agent/.claude/skills/`), and the eval harness (`cloudflare/eval/mini-eval/`), with claims verified against source code. Status snapshot reflects the repo on the `new-ui` branch as of that date.

---

## 1. The one fact that frames everything

A grep of `cloudflare/src` + `cloudflare/sandbox` for every symbol of the new design — `thebet.md`, `competitors.md`, `apprentice`, `skills/strategy`, `skills/cell` — returns **zero hits** (verified 2026-06-28). Production still runs the *old* loop CLAUDE.md describes: research → 6 hooks (stat/story/fomo/curiosity/callout/contrast) → 14-style menu → 6 images. **That loop scored 22% on the floor checks (4/18, S105) and carries all six documented failure modes.** Every binder, locked format, and the whole cell pipeline lives only in `agent/.claude/skills/` and `cloudflare/eval/mini-eval/` as dev tooling. No paying user has touched any of it.

**So the macro state is: the *method* is a validated level-up; the *product* is unchanged.** The bottleneck to scaling is not genericness or format coverage — it is that none of the rebuild is wired into production, so the founding 22%→50% metric has never been re-measured.

---

## 2. Session ledger (the index)

Each row: the load-bearing move and its status. Open the linked doc for the exact reasoning. (All paths relative to `docs/`.)

### Act I — Measure the old loop (evals as spec)
| S | Date | Load-bearing move | Status | Source |
|---|---|---|---|---|
| 103 | 05-14 | Built eval tooling (`dump-eval-corpus.ts`, `build-eval-viewer.ts`); open-coding kickoff through a Type-A performance-marketer lens | method | [SESSION_103](SESSION_103_EVAL_HTML_VIEWER_AND_OPEN_CODING_KICKOFF_2026-05-14.md) |
| 104 | 05-14 | Open coding complete — 24/40 traces to saturation, 15 failure modes + PASS/FAIL anchors | method | [SESSION_104](SESSION_104_EVAL_OPEN_CODING_COMPLETE_AXIAL_CODING_NEXT_2026-05-14.md) |
| 105 | 05-15 | Axial coding as **2-coder inter-rater test** → 6 of 7 clusters converge; **PASS anchors are ceilings not floors** → split floor (F1–F6) vs ceiling; **baseline = 22%** | locked | [SESSION_105](SESSION_105_AXIAL_CODING_SYNTHESIS_AND_FLOOR_BASELINE_2026-05-15.md) · [eval-corpus/axial-coding-SYNTHESIS](eval-corpus/axial-coding-SYNTHESIS.md) · [floor-baseline](eval-corpus/floor-baseline-2026-05-15.md) |

### Act II — Diagnose & decide to rebuild
| S | Date | Load-bearing move | Status | Source |
|---|---|---|---|---|
| 106 | 05-15 | **Leak map**: 5 subagents trace every failure to file+line → one root cause, **"plumber, not a performance marketer"**; plumbing intact, break is instructional → first-principles rebuild | locked | [SESSION_106](SESSION_106_LEAK_MAP_AND_FIRST_PRINCIPLES_PIVOT_2026-05-15.md) · [leak-map](eval-corpus/leak-map-2026-05-15.md) |
| 107 | 05-16 | Q1–Q5 locked; 9-step loop with **exactly three evaluation points**; implementation plan; **full-corpus floor re-measure = Phase-1 GO/NO-GO** | locked | [SESSION_107](SESSION_107_Q5_LOCKED_AND_IMPLEMENTATION_PLAN_2026-05-16.md) · [first-principles-redesign](eval-corpus/first-principles-redesign.md) · [implementation-plan](eval-corpus/implementation-plan.md) |

### Act III — Build the rig, lock the upstream binders
| S | Date | Load-bearing move | Status | Source |
|---|---|---|---|---|
| 108 | 05-19 | Strategy binder built & validated (judgment-not-procedure) | superseded by S119 recut | [SESSION_108](SESSION_108_STRATEGY_BINDER_BUILT_AND_VALIDATED_2026-05-19.md) |
| 109 | 05-19 | **Mini-eval harness** built (`Apprentice = {identityPrompt, binderPaths, deliverable, model, tools, passRule}`; harness, not judge, computes verdict); surfaced **worked-example leakage** via `MINIEVAL_NO_EXAMPLES` ablation | locked | [SESSION_109](SESSION_109_MINI_EVAL_HARNESS_AND_STRATEGY_BINDER_VALIDATED_2026-05-19.md) |
| 110 | 05-21 | Research binder built & validated | open→locked S112 | [SESSION_110](SESSION_110_RESEARCH_BINDER_BUILT_AND_VALIDATED_2026-05-21.md) |
| 111 | 05-21 | Search-API + sourcing discipline; timing shows **97% of wall-time is the model** | method | [SESSION_111](SESSION_111_SEARCH_API_AND_SOURCING_DISCIPLINE_2026-05-21.md) |
| 112 | 05-22 | Research **locked** | locked | [SESSION_112](SESSION_112_RESEARCH_LOCKED_NEXT_STEPS_2026-05-22.md) |
| 113 | 05-23 | Comp binder built & locked (competitive intel off Meta Ad Library) | locked | [SESSION_113](SESSION_113_COMP_BINDER_BUILT_AND_LOCKED_2026-05-23.md) |
| 116 | 05-26 | **Search→Sonar Pro** (killed subject-mis-binding fabrication); **Haiku→Sonnet** apprentice bump (failures were model-capability-shaped); prod economics flagged OPEN | locked / econ open | [SESSION_116](SESSION_116_SONAR_SWITCH_APPRENTICE_BUMP_TERRITORY_TRIM_2026-05-26.md) |
| 119 | 06-08 | Strategy **recut** (promise + mandatories) validated & locked | locked | [SESSION_119](SESSION_119_STRATEGY_RECUT_PROMISE_MANDATORIES_VALIDATED_LOCKED_2026-06-08.md) |

### Act IV — The genericness conclusion
| S | Date | Load-bearing move | Status | Source |
|---|---|---|---|---|
| 117 | 05-27 | Tried to beat genericness **at the generator** (Creative-DNA, Quality-Diversity, Verbalized Sampling); upstream redesign + TWT validation | demoted by S118 | [SESSION_117](SESSION_117_UPSTREAM_REDESIGN_TWT_VALIDATION_REASONING_PRINCIPLES_2026-05-27.md) |
| 118 | 06-07 | **CAPSTONE**: genericness = INFORMATION failure; **judge ceiling** (self-grading blesses generic); only an independent clean-context critic breaks it; **copy = upstream-only, VISUAL = upstream + cell-craft** | locked law | [SESSION_118](SESSION_118_ANTHROPIC_DEEPDIVE_GENERICNESS_CONCLUSION_CELL_LOOP_2026-06-07.md) · [anthropic-learnings/00-genericness-conclusion](anthropic-learnings/00-genericness-conclusion.md) |

### Act V — The cell wars (rules-as-taste fails three times)
| S | Date | Load-bearing move | Status | Source |
|---|---|---|---|---|
| 114 | 05-23 | Cell binders from first principles — kickoff | superseded | [SESSION_114](SESSION_114_CELL_BINDERS_FROM_FIRST_PRINCIPLES_KICKOFF_2026-05-23.md) |
| 115 | 05-25 | Cell gold-standard vs noise pipeline | method | [SESSION_115](SESSION_115_CELL_GOLD_STANDARD_NOISE_PIPELINE_2026-05-25.md) |
| 120 | 06-09 | Cell forward process design (room / tenant / generator / critic) | superseded | [SESSION_120](SESSION_120_CELL_FORWARD_PROCESS_DESIGN_ROOM_TENANT_GENERATOR_CRITIC_2026-06-09.md) |
| 121 | 06-11 | Cell skill built; two dry runs; style-stack — fails to **tasteful center** | reversed | [SESSION_121](SESSION_121_CELL_SKILL_BUILT_TWO_DRY_RUNS_STYLE_STACK_2026-06-11.md) |
| 122 | 06-11 | Visual strategy staging; makers; conceptual takes | evolving | [SESSION_122](SESSION_122_VISUAL_STRATEGY_STAGING_MAKERS_CONCEPTUAL_TAKES_2026-06-11.md) |
| 123 | 06-12 | **User verdict: "not working"**; first-principles reset; **swap test demoted from ranker → kill-bar** (it crowned a branding ad) | reset | [SESSION_123](SESSION_123_TWO_DRY_RUNS_USER_VERDICT_NOT_WORKING_FIRST_PRINCIPLES_RESET_2026-06-12.md) |
| 124 | 06-12 | Designed-poster locked; calibration gauntlet (12 renders, 0/30 idea-spark) → **the leap is the ceiling (a law)** | locked law | [SESSION_124](SESSION_124_DESIGNED_POSTER_LOCKED_CALIBRATION_GAUNTLET_LEAP_IS_THE_CEILING_2026-06-12.md) |

### Act VI — The maker + the format library
| S | Date | Load-bearing move | Status | Source |
|---|---|---|---|---|
| 125 | 06-13 | Research-first assembly direction locked; forward pass held; **production-grade genericness unsolved** (acknowledged) | locked direction | [SESSION_125](SESSION_125_RESEARCH_FIRST_ASSEMBLY_DIRECTION_LOCKED_FORWARD_PASS_HELD_PRODUCTION_GRADE_GENERICNESS_UNSOLVED_2026-06-13.md) |
| 126 | 06-13 | **Why the cell is generic** → **INVENT→ASSEMBLY** pivot; **18-format, 3-tier repertoire frozen**; styles/references deferred | locked | [SESSION_126](SESSION_126_WHY_THE_CELL_IS_GENERIC_FORMAT_LIBRARY_PIVOT_18_FORMAT_REPERTOIRE_FROZEN_STYLES_AND_REFERENCES_DEFERRED_2026-06-13.md) |
| 127 | 06-13 | Format library is the **machine, not the skin**; Andromeda penalty debunked; **critic + vision-gate removed for prototype**; testimonial prototype next | locked / gaps opened | [SESSION_127](SESSION_127_FORMAT_LIBRARY_INTO_THE_CELL_MACHINE_NOT_SKIN_ANDROMEDA_DEBUNKED_CRITIC_AND_VISION_GATE_REMOVED_TESTIMONIAL_PROTOTYPE_NEXT_2026-06-13.md) |
| 128 | 06-14 | **THE MAKER is the keystone** (name one real maker, resolve every pixel); testimonial validated over **13 renders (v13 locked)**; **Fork B** (thin format docs over one shared method) locked; docs encoded | locked | [SESSION_128](SESSION_128_TESTIMONIAL_BUILT_AND_VALIDATED_13_RENDERS_THE_MAKER_IS_THE_KEYSTONE_FORK_B_LOCKED_DOCS_ENCODED_2026-06-14.md) |
| 129 | 06-15 | Type + style **grammars** built (7 hands, 5 looks); **founder-POV validated (v3 locked)**; **specification, not compositing** | locked | [SESSION_129](SESSION_129_TYPE_STYLE_GRAMMARS_BUILT_FOUNDER_POV_VALIDATED_V3_LOCKED_SPECIFICATION_NOT_COMPOSITING_2026-06-15.md) |

### Act VII — Competitive factory + first loop-shaped signal
| S | Date | Load-bearing move | Status | Source |
|---|---|---|---|---|
| 130 | 06-16 | Ad-library competitive research tool built (no perf data); **targeting locked: ingestibles → beauty → local services**; 452-ad ingestibles deep-dive (formats 18→23) | locked | [SESSION_130](SESSION_130_AD_LIBRARY_COMPETITIVE_RESEARCH_TOOL_BUILT_NO_PERF_DATA_TARGETING_LOCKED_INGESTIBLES_DEEP_DIVE_452_ADS_REPERTOIRE_18_TO_23_2026-06-16.md) |
| 131 | 06-16 | 262-creative image analysis + visual playbook; DCO clarified; **DR-native strategy frozen (SKIN × ENGINE)** | locked | [SESSION_131](SESSION_131_INGESTIBLES_IMAGE_ANALYSIS_262_CREATIVES_GALLERY_VISUAL_PLAYBOOK_DCO_CLARIFIED_DR_NATIVE_STRATEGY_FROZEN_SKIN_X_ENGINE_2026-06-16.md) |
| 132 | 06-17 | **Cell apprentice built; pipeline runs end-to-end autonomously (Verbis)** and out-derives the hand baseline; **research Google-Maps blindspot** surfaced | milestone / gap | [SESSION_132](SESSION_132_CELL_APPRENTICE_BUILT_PIPELINE_RUNS_END_TO_END_VERBIS_TESTIMONIAL_AUTONOMOUS_RESEARCH_GOOGLE_MAPS_BLINDSPOT_2026-06-17.md) |
| 133 | 06-23 | Skin library from 16 live ads (13 skins); native bet pressure-tested; **cell restructure scoped as refactor, not rebuild**; maker/layer-stack mental model | scoped | [SESSION_133](SESSION_133_SKIN_LIBRARY_BUILT_FROM_LIVE_ADS_NATIVE_BET_PRESSURE_TESTED_CELL_RESTRUCTURE_SCOPED_REFACTOR_NOT_REBUILD_MAKER_LAYER_STACK_MENTAL_MODEL_2026-06-23.md) |

> Out of arc: [SESSION_133 (Followup-hang, 06-19)](SESSION_133_FOLLOWUP_HANG_ON_REFERENCE_IMAGES_ROOTCAUSED_TO_AGENT_SIDE_WEDGE_NOT_THE_DO_NARROWED_TO_FUSE_READ_VS_FAL_EDIT_STDOUT_DUMP_DIAGNOSTIC_DEPLOYED_PROD_2026-06-19.md) is a production ops investigation, not part of the rebuild.

---

## 3. The narrative arc (linear read)

1. **Measure first (S103–105).** Refused to launch. Open-coded 24/40 real campaigns (10 prod + 30 staging, 99 R2 images) like a tough performance marketer. A 2-coder inter-rater test converged on 6 of 7 failure clusters. Key reframe: PASS anchors are reached only after 7–9 user-iteration turns, so anchoring a rubric to "good" fails every first-gen output → split a code-checkable **floor (F1–F6)** from a deferred ceiling. **Baseline 22%, target 50%+, ~$0.02/run.**
2. **Diagnose (S106).** The leak map traced every failure to one defect: the orchestrator is a *plumber* (routes, owns nothing, no judgment, no gate). The plumbing was intact — the break was purely instructional. That killed the patch plan and triggered a first-principles rebuild reusing the 6 clusters as invariants.
3. **Rebuild as specialists (S108+).** Four sealed apprentices (research → comp → strategy → cell), each its own agent with a clean context window and a **binder that teaches judgment, not procedure**, handing off via **files-as-contract**. Plus the **mini-eval harness** — the first way to test any stage in isolation against held-out fixtures.
4. **The deep idea (S118).** Genericness is an **information** failure: the model returns the category average when the brief is underspecified. You can't make it creative; you remove its excuse to be generic with real brand truth. And a same-model judge *blesses* the average — only an **independent** critic breaks the ceiling; only **real money** ranks toward a new good.
5. **The visual fought back (S114–124).** Rules-as-taste failed three times, each rule only *moving* the failure (cliché floor → tasteful center → conceptual theater). S124 falsified every execution variable — the "leap" is a law the training objective forbids, not an unfound setting.
6. **Assembly, the maker, the format library (S125–133).** The cell's job flipped INVENT→ASSEMBLY: assemble proven formats, fill them with the brand's real content. **THE MAKER** (name one real maker, resolve every pixel) made derivation operational; testimonial (v13) and founder-POV (v3) locked. The cell then ran **end-to-end autonomously on Verbis (S132)** and beat the hand-built baseline — immediately exposing one research bug (can't read Google Maps reviews).

---

## 4. The conceptual spine (one idea, recursed)

Each node is "remove the vacuum" at a finer grain. **Discovered-via** points to where the exact reasoning lives.

1. **Evals are the spec, not the QA.** The failure taxonomy is the to-do list; the leak map is the work order; 22% is the gate. *Discovered via S103–107; floor-graders, leak-map.*
2. **Genericness = INFORMATION failure, not creativity failure** (the root). Mode-seeking is RLHF-trained and unstoppable. *S118 / 00-genericness-conclusion.*
3. **The judge ceiling.** Self-grading blesses the generic; only an independent, clean-context, different-model critic breaks it — and even that is a floor knife (killed 4/5, then 5/5 on honesty) that can't recognize a new good. Only real money ranks toward a new good. *S118, hardened S123–126.*
4. **"Pick the room" (the cure).** Supply real retrieved truth upstream; the model always walks to the center of the room, so choose which room. Worked-example leakage is the same disease one level up. *S106 leak map + S109 NO_EXAMPLES ablation.*
5. **Copy is upstream-only; VISUAL needs upstream + cell-craft.** Visual has two vacuums — the info vacuum plus a cell-level collapse to the category look at art-direction. This is *why the cell exists*. *S118 (the most consequential split).*
6. **The cell's job is ASSEMBLY, not INVENTION — formats (jobs), not skins.** Two testimonials look nothing alike; a menu of *looks* is the dead bank that blurs brands. *S125 (20 Sonar queries) → S126 pivot, 18-format repertoire.*
7. **THE MAKER.** Name one real maker, resolve every element from it; read the copy's *provenance*; vague = generic at pixel grain; native-by-default; two makers fight; style/type are **derived via grammars**, never picked from a menu; **Fork B** keeps it cheap (thin format docs over one shared method). *S128 (13 renders, v13) → S129 (founder-POV v3).*
8. **Specification, not compositing.** The image model is also a mode-seeker — anything the spec doesn't decide, it fills with the average. Better specification fixed fidelity + alignment; compositing downgraded to a future pixel-exact refinement. *S129 / shot-spec.*
9. **The DR-native bet (the one external wager).** Native ("doesn't-look-like-an-ad") DR is genuine white space in ingestibles AND the one style where the AI-look stops being a liability. Frozen as SKIN × ENGINE. The "Andromeda 60%-similarity penalty" was debunked as agency lore — cross-cell sameness is a swap-test watch-item, not an algorithm penalty. *S130–133; S128/S133 debunk.*

**The decision this forces:** the moat is information acquisition + the maker-derivation method, *not* generation cleverness or the renderer (a commodity). Do **not** build rules-as-taste, a compositing pipeline, or per-format style guides — each was tried and reversed.

---

## 5. Architecture — old vs new

| Dimension | OLD (ships today) | NEW (harness only) |
|---|---|---|
| Stages | research → 6 hooks → art → 6 images | research → comp → **strategy** → cell |
| Stage isolation | one agent context, skills triggered | **sealed subagents, clean context each** |
| Method form | procedure (steps, 14-style menu, formulas) | **judgment binders** (moves, derive-not-menu) |
| Handoff | implicit, in-context | **files-as-contract** (`research.md → competitors.md → thebet.md → cell-output.md`) |
| Identity | "plumber" router | **persona per stage** |
| Quality gate | none — user iteration *is* the gate | swap-test critic + vision-verify *(designed, not wired)* |
| Competitive grounding | none | **comp stage** (Meta Ad Library) |
| Models | Haiku everywhere | Haiku extract / **Sonnet judgment** |
| Runs on | DO + sandbox container, **prod** | local Node harness, **dev only** |

**The deepest inversion:** the old loop puts judgment *nowhere*; the new loop pushes it *into each stage* (the binder persona) while keeping the orchestrator a thin router, concentrating gates at **three seams** (Bet critic, per-cell checks, completeness-locked deliverable) — not every seam. The 8,573-line art-style menu is being **deleted, not ported.**

**Genuine vs aspirational.** *In code:* the binders, the comp stage, files-as-contract handoffs, per-stage model economics, the mini-eval harness. *Designed but not wired:* the 9-step orchestrator loop (zero code refs); the **independent critic** (the cell self-critiques *inline* in v1 — literally the judge-ceiling failure the theory forbids); the **vision-verify gate** (removed for the prototype — the direct fix for the #1 user bug); the cell as an autonomous rubric-judged stage (only 2 of 18 formats render-validated). **The mini-eval proves stage CONTENT; it does not prove the LOOP** — assembly is where the integration risk lives.

---

## 6. The eval flywheel (the reusable rig)

`Apprentice = {identityPrompt, binderPaths, deliverable, model, tools, passRule}`. The harness inlines the binder into a system prompt, runs one `query()` in a temp fixture dir against **held-out** brands, an LLM judge scores per-criterion against `rubrics/<name>.md`, and **`computeOverall()` — not the judge — computes the verdict** from `passRule` (critical IDs + `maxSupportingFails:1`).

**Turn-key loop to run on any new binder:**
1. Write the binder as judgment-not-procedure (`SKILL.md`).
2. Define the apprentice object.
3. Write the rubric: critical (gate) + supporting; harness computes pass.
4. Gather 2–4 **held-out** fixtures across verticals/budget; rotate when they go stale (real train/test split).
5. Run → read cracks → fix **structurally** (e.g. drop worked-examples from runtime, not negative-instruction whack-a-mole) → re-run; ablate to isolate cause.
6. For genericness only: don't trust the in-loop judge — add an **independent, clean-context, different-model** critic applying the swap test as named rules, used as a floor.
7. Final judge = **real spend**. The loop guarantees a competent floor; only money certifies the ceiling.

**Rigor, honestly.** Above the bar: open-coding-before-rubrics, inter-rater convergence, binary-not-Likert, code>LLM>human grading, held-out fixtures, ablation. Gaps: the LLM judge was **never calibrated to the stated ≥90% human bar**; sample sizes are tiny (1–4 fixtures, often 1/1) vs 20–50 best practice; **the 22%→50% floor was never re-measured on production** because the binders aren't wired in.

---

## 7. Decisions ledger — locked / reversed / open

**Locked (load-bearing):**
- Evals are the spec; floor vs ceiling split; 22% baseline; full-corpus floor re-measure = Phase-1 GO/NO-GO *(S105–107)*.
- Four sealed apprentices with judgment binders + files-as-contract; gates at three seams *(S106–107)*.
- Research / comp / strategy binders locked *(S112 / S113 / S119)*.
- Search→Sonar Pro; Haiku extract / Sonnet judgment *(S116)*.
- Genericness = information failure; judge ceiling; copy-vs-visual split *(S118)*.
- Cell job = ASSEMBLY; 18-format 3-tier repertoire; formats-not-skins *(S126)*.
- THE MAKER keystone; Fork B (thin docs over one method); testimonial v13, founder-POV v3 *(S128–129)*.
- Specification-not-compositing *(S129)*.
- Targeting: ingestibles → beauty → local services; DR-native SKIN × ENGINE *(S130–131)*.

**Reversed / debunked (don't re-attempt):**
- Patch-the-old-loop plan → killed by the leak map *(S106)*.
- Beat genericness at the generator → demoted to a bounded multiplier *(S117→S118)*.
- Rules-as-taste in the cell → failed three times, each only moving the failure *(S121, S123, S124)*.
- Swap test as a **ranker** → demoted to a kill-bar (it crowned a branding ad) *(S123)*.
- Compositing pipeline as the fidelity fix → specification was the real fix *(S129)*.
- "Meta penalizes 60%-similar ads (Andromeda)" → agency lore; it's within-account cannibalization *(S128/S133)*.
- Per-format fat style guides → Fork B (one shared method) *(S128)*.

**Open (decide at the wiring moment):**
- Sonnet-everywhere vs Haiku+lint-gate per stage (economics: ~$4–6 serve vs $5 price; Sonnet 3× Haiku) *(S116)*.
- Whether assembly (sealed subagents in sequence + critic + vision gate) clears 22%→50% — never tested.
- Build-vertical (ingestibles) vs pay-vertical (local services): serve both or pick one.
- Feedback-loop moat (Q5 v2: CLIP embeddings + Vectorize + reach-as-gold) — before or after first revenue.

---

## 8. State of play — validated vs frozen

**Validated:** three upstream binders green standalone (research 1/1 $0.21, strategy 1/1 $0.94; latest pass 2026-06-17); two cell formats locked by render (testimonial v13, founder-POV v3); the cell runs **end-to-end autonomously (S132, Verbis)** and out-derives the hand baseline; the eval backbone; the mini-eval harness; a competitive-intel factory (452-ad deep-dive, 262-creative playbook, 13-skin library).

**Frozen / unsolved:**
1. **Production wiring — the real blocker.** Step-2b is aspirational; zero code refs; production ships the 22% loop.
2. **Production-grade visual genericness** — a law, not a bug; the cell installs a floor, not a ceiling.
3. **Format coverage** — 2 of 18–23 render-validated; `pas-real-world.md` built but unvalidated.
4. **Research Maps blindspot** — can't see Google-Maps reviews (Verbis falsely reported "none"); gates the paying track.
5. **Prod economics** — underwater; Sonnet-vs-Haiku+lint-gate still open.
6. **Cell production gaps** — critic not wired (inline self-critique); `tmp-cell-render.mjs` shims instead of a production MCP; comp + strategy still leak finished copy; Verbis run ~15 min, killed before writing `cell-output.md`.
7. **Eval rigor gaps** — judge uncalibrated to ≥90%; tiny samples.
8. **No feedback loop** — every campaign is cold; nothing compounds.

---

## 9. How to scale — ordered

1. **Fix the Google-Maps research blindspot first.** Cheap; unblocks the only vertical that pays today (Hyderabad hotel ₹10–15k/mo; education consultancy ₹30–50k/mo). Rule: must-fetch Maps for local/service brands, flag "couldn't reach," never assert "none."
2. **Ship the Step-2b orchestrator wire and re-measure the floor.** Lift the four apprentice objects out of `run-mini-eval.ts` into a real orchestrator; relocate `mcp/perplexity.ts` + `mcp/scrapecreators.ts` to `cloudflare/src/lib/mcp/`; **swap the cell's inline self-critic for an independent clean-context subagent** (mechanically an `AgentDefinition` with a fresh context window); restore vision-verify; replace `tmp-cell-render.mjs` with the production nano-banana MCP. **Re-run 22%→50% — never measured on the new pipeline.**
3. **Spend ₹20–30k of real beta money on ONE ingestibles campaign before building formats 3–18.** Real spend is "the only judge that outranks the swap test" and has never been consulted. No audited per-format performance data exists anywhere (verified 3× via Sonar).
4. **Resolve prod economics at the wiring moment** — pilot Haiku+lint-gate vs Sonnet per stage; guard each swap with its mini-eval rubric.
5. **Then** scale formats — cheap now that Fork B makes them thin recipes; do the S133 cell restructure (skins as a matchable maker-catalog feeding `layer-stack.md`); guard the v13/v3 bar with the swap test and the worked-example-leakage lesson.

**The discipline:** the team's gravity pulls toward *more method* (more grammars, more formats) when the highest-leverage unbuilt thing is the production wire. Stop deepening the lab until something ships and real spend decides what to build next.

**Open strategic questions:** does assembly actually clear 22%→50%? Can Sonnet-everywhere survive pricing? Serve both verticals or pick the one that pays? Is real spend *permanently* the only judge of a new good? When does the feedback-loop moat get built?

---

## 10. Verified file map (where to read the source)

**Old loop (shipping):**
- `cloudflare/sandbox/orchestrator-prompt.ts` — the "plumber" system prompt
- `cloudflare/sandbox/agent-runner.ts` — the long-running single-agent loop
- `cloudflare/sandbox/nano-banana-mcp.ts`, `refs-mcp.ts`, `block-builder.ts`
- `cloudflare/src/durable-objects/campaign-session.ts` — the core DO

**New binders (dev-only):**
- `agent/.claude/skills/research/` (`SKILL.md` + `reference/`)
- `agent/.claude/skills/comp/SKILL.md`
- `agent/.claude/skills/strategy/` (`SKILL.md` + `worked-examples.md`)
- `agent/.claude/skills/cell/` — `SKILL.md` + `references/{layer-stack,style-grammar,type-grammar,shot-spec,critic,counterexamples}.md` + `references/formats/{testimonial,founder-pov,pas-real-world}.md`

**Eval harness (dev-only):**
- `cloudflare/eval/mini-eval/run-mini-eval.ts` — the rig
- `cloudflare/eval/mini-eval/apprentices/{research,comp,strategy,cell}.ts`
- `cloudflare/eval/mini-eval/rubrics/{research,comp,strategy,cell}.md`
- `cloudflare/eval/mini-eval/mcp/{perplexity,scrapecreators}.ts`
- `cloudflare/eval/mini-eval/{fixtures,results}/`
- `cloudflare/scripts/floor-graders.ts` — the F1–F6 floor checks *(note: under `scripts/`, not `mini-eval/`)*

**Blueprint + capstone:**
- `docs/eval-corpus/{leak-map-2026-05-15,first-principles-redesign,implementation-plan,floor-baseline-2026-05-15,axial-coding-SYNTHESIS}.md`
- `docs/anthropic-learnings/00-genericness-conclusion.md` (+ deep-dive notes `01`–`04`, `cell-counterexamples.md`)

---

*End of reference. To regenerate or extend, re-run the S103–S133 read+synthesis pass and re-verify §1's grep and §10's paths against the current branch.*
