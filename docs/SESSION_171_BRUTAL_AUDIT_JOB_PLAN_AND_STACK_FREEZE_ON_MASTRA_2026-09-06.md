# SESSION 171 — brutal audit, the job plan, and the stack freeze on Mastra

**Date:** 2026-09-06 (Saturday, full day).
**Continues:** S170 (adloop CMA build shipped, 2026-08-08). Nothing in either repo was touched between Aug 8 and today.
**Status at close:** decisions locked, nothing built. **Next session builds adloop on Mastra.** Start at §7.
**Uncommitted:** this doc, `docs/research/AGENT_STACK_RESEARCH_YC_CREATIVE_EVALS_2026-09-06.md`, and two memory files. Nothing else changed on disk.

---

## 1. What this session was

The founder asked for brutal, honest feedback on nine months of work, then for a job strategy, then for a model-agnostic replacement for the Claude Agent SDK, then for a full research pass on how agent and creative companies build. Four questions, one arc. The arc ended in a single frozen stack and a 4-week plan whose only deliverable is a published scorecard.

---

## 2. The audit (the facts that framed everything)

| Fact | Number |
|---|---|
| Time since first commit | 9.5 months (2025-11-21) |
| Working sessions / docs | ~170 / 281 |
| Distinct pipeline versions built | 7 or 8 (v1 prod, four-apprentice, agent-loop, field-first, lite, three-parent, scratch, adloop) |
| Production campaigns ever | 16, by 7 users (first 2026-03-23, last 2026-07-02) |
| Campaigns in last 30 days / active subs / payment events | 0 / 0 / 1 |
| Production pipeline quality | 22% floor pass (4/18), unchanged since May |
| Prod agent | single Haiku 4.5, prompt-driven, homepage-fetch research, text-only render, 8,573-line static style menu |
| Infra vs live agent logic | ~26,000 LOC vs ~10,000 LOC |
| LITE validated run | 6/6, $4.81, 47.7 min; field 14.4 min = pure model latency viewing images one at a time; build 12.1 min; zero compactions |
| Scratch loop (Aug 8, no SDK) | 9 ads, 3 brands, 0 fabricated claims, ~5–15 min, ~$0.17/image render |
| agent-loop / lite auth | strip `ANTHROPIC_API_KEY` on purpose, run on Max login (`agent-loop/run.ts:28`) — ToS risk, never behind a product |

**The seven findings:** (1) a research lab, not a product; (2) slowness was design, not the SDK; (3) model lock-in half right, and CMA made it deeper; (4) positioning argued from the abandoned 47-min loop; (5) "zero competition below the agency floor" is false (makelocalads, Pomelli); (6) doc-to-ship ratio is the disease (June: 17 sessions, 1 commit); (7) a month of silence after the hackathon.

**What is genuinely good and must survive:** the eval discipline (open coding, floor/ceiling split, 2-coder inter-rater), the truth layer (facts with sources, forbidden list, `facts_used[]`, pixel verify), the genericness-is-an-information-failure insight, the competitor teardown method, the brand-memory ledger design.

---

## 3. Founder context (read `~/Documents/Agents/chakra-os/my-story.md` for the full story)

Non-technical PM, ~8 years product, builds everything with Claude Code, cannot read code. Unemployed, no runway, ample time. Lost the Aug 8 hackathon for not pushing to production. Goal: a job (US/EU first, India second) or a money-making business.

Job-search data in chakra-os: June ~46 cold sends, 11–17% founder reply rate, four founder conversations (Aigenc impressed but not hiring a PM; Lapis founder+CTO call went well then a respectful pass; Uplane; Creyaa), Equal Collective R1 rejected on a brain-teaser. Search retired Aug 12 for an open-weight video sprint (`~/projects/open-creative-stack`, 3 commits, stalled Aug 21). Restarted Sep 3. Identity changed 4× in 90 days.

**Diagnosis:** not the background. The message lands when sent. The failure is volume, consistency, wrong-stage targets, and switching strategy every few weeks — the same pattern as the pipeline rebuilds.

**Decision:** job as the main track, ad engine as a side service; no SaaS tool business now. Roles: deployment/adoption/forward-deployed strategist, founder's office, AI PM via founder intro, AI-native agencies. Never AI-engineer roles (code-reading gate). Segment ignored so far and highest odds: high-volume Indian advertisers and their agencies.

---

## 4. The job plan (4 weeks, 8 h/day, 6 days/week)

**Thesis:** the creative agent is not a job asset as a product; as a body of evidence it is rare. Package the evidence, not the software.

**The play: the AI Ad Creative Scorecard 2026.** 5 Indian D2C brands with ground truth (Trunativ, GO DESi, Minimalist, HK Vitals, TWT/ON India), 6–7 tools (Pomelli, makelocalads, AdCreative.ai, Creatify, Canva, one more, plus our own pipeline scored honestly), one batch each, scored on the floor rubric plus distinct-messages-per-batch and unsourced-claims rate, every score with a screenshot. 48-hour pre-read to every scored company = seven warm US/EU conversations by construction. Publish day 21 no matter what.

**Supporting assets:** repo cut to five documents (README, Method, Findings, Teardown, Scorecard; rest archived); a 5-minute demo with 3 preloaded brands, demo mode only; the ten laws on one page.

**Daily shape:** 4 h benchmark (→ outbound in week 4), 1 h outbound (evening IST), 45 min post (one/day, LinkedIn + X, not Instagram; 4 of 7 are raw receipts), 1 h agent reliability only (never output quality), 30 min speaking rehearsal, 45 min replies/tracker. Sunday half day.

**Weeks:** W1 protocol + repo cut + demo scope + 60-name target list + subscriptions + first 2 tools run; W2 all batches scored, demo live, pre-reads sent; W3 scorecard published day 21, laws series; W4 5–8 outbound/day US/EU then India, contract-to-hire and paid-pilot asks explicit.

**Kill rules:** no new rubric criteria after day 8; no new tools after day 10; publish ugly on day 21; a post over 45 min was an essay; touching agent output quality = relapse; take Indian paid work if offered while US/EU threads run.

**Honest expectation:** day 28 = scorecard live, ~30 posts, 100+ touches, 5–10 live US/EU threads. Offer at 60–90 days, likely contract-to-hire or paid pilot.

---

## 5. Adloop decisions

- **Freeze adloop's loop as the only brain.** Fast (5–15 min), cheap, strongest truth layer (sources + forbidden list + `facts_used[]` + pixel verify + input QA gate), the design the teardown validated ("the form is the talent"), ledger with edit→rule promotion validated live, API-key auth. Retire agent-loop, three-parent, and lite except lite's cold judge (with validators) which becomes the scorecard's scoring instrument.
- **Refs vs from-scratch, clarified:** the older loops borrowed *structure* from the Meta Ad Library as words, never pixels (`lite-loop/stages.ts:139,199`). Adloop does no market scrape; it renders image-to-image with curated packshots + logo attached (`adloop/sandbox/render.mjs:33`), a packaging spec written from viewing them, the 8-slot director brief, and the verbatim chassis (`assemble.py:49`: "the model must never draw the product from words"). Interview line: "we read what the market is funding and borrow the structure, never the pixels or the sentences." The field layer can return later as a words-only capture lane.
- **Health check not yet done.** CMA resources in `adloop/engine/state.json` (agent, envs, vault, two memory stores) have sat idle since Aug 8 and may have expired. `brands/*/batches/` are gitignored — pull any wanted outputs before they vanish. This matters only for reference now; the build moves off CMA.

---

## 6. The framework arc and the freeze

**Path:** SDK lock-in analysis (≈60% of agent-loop/lite is SDK plumbing; the brain is portable) → "remove CMA, go model-agnostic" → Pydantic AI (+ Harness; corrected my own earlier claim: it does have shell, files, subagents, compaction, skills, MCP) → founder: Python adloop was only a hackathon constraint → **Mastra** (TypeScript, matches the whole prod stack, runs inside the existing sandbox container) → checked pi (102k stars, coding-agent fame, one product on it: OpenClaw; no MCP/subagents/permissions by design) → checked eve (Vercel, Jun 17 2026, beta, v0.52.1, harness-shaped, no code-defined pipeline engine; revisit at GA) → three parallel research agents (YC stacks, creative pipelines, evals) → freeze.

**Key numbers behind the freeze** (full evidence in the research doc): multi-model is the norm (LangChain 2026, n=1,340); 89% observability vs 52% evals, quality the top blocker; Mastra $22M Series A Apr 2026, core 1.50, in prod at Brex/Fireworks/MongoDB/Replit/PayPal; no ad-creative company names a framework or documents a fabrication checker, an independent audit of a performance score, or per-edit learning; Langfuse + Braintrust dominate evals, both via OTel; OpenAI Evals API shuts down 2026-11-30; framework named in a job post correlates with *lower* pay — the credential is shipped systems + evals + MCP, not the library.

### The frozen stack

| Layer | Choice |
|---|---|
| Engine | Mastra workflows (TS), inside the existing Cloudflare sandbox container. **Not** the Workers deployer (open bundle-size bug #14494; CPU limits) |
| Chat + edits | Mastra agent; the workflow and its steps are its tools; suspend/resume for founder review |
| Client | Vercel AI SDK stream over the existing WebSocket |
| Models | per agent/step string via Mastra router; OpenRouter or AI Gateway behind it |
| Render | plain code; KIE gpt-image-2 first, others as a scorecard axis |
| Memory | our ledger files + D1; Mastra observational memory OFF |
| Tools | MCP where servers exist |
| Inner evals | Mastra scorers + datasets + experiments + Studio |
| Outer evals | Langfuse via Mastra exporter (Braintrust = upgrade if human review queues matter) |

**Rules:** pin `@mastra/core`, `ai`, `zod`; tag before benchmarking; one framework (pi allowed in the terminal only); never the OpenAI Evals API; next framework comparison only after the scorecard is published.

### The image-grading rig (ours)

Binary checks · judge from a different model family than the writer · 5 passes, majority · verbatim numeral/headline check vs the brief · CLIP brand-similarity + AI-detector native-look gate · claim grounding vs `facts.json` + forbidden list · human labels on a fixed set with agreement measured, then an experiment targeting the scorer to track judge accuracy. Mastra caveat: the scorer's judge prompt is text, so image grading = a code step calling a vision model via the AI SDK and returning a Zod verdict.

---

## 7. NEXT SESSION — build adloop on Mastra

**Goal:** Milestone 1 = same brain, new runtime. Reproduce the Aug 8 GO DESi batch on Mastra with the *same* models before changing anything. Only then Milestone 2 (model swaps) and Milestone 3 (scorers).

**Reference implementation to port from, byte for byte:**
- `~/Documents/Agents/adloop/engine/prompts.py` — agent system + 3 stage runbooks (capture/batch/edit); slot coaching; "never compress"
- `~/Documents/Agents/adloop/engine/schemas.py` — pinned briefs/ledger/verdict shapes + validators
- `~/Documents/Agents/adloop/engine/writer.py`, `batch.py`, `capture.py`, `edit.py` — stage logic
- `~/Documents/Agents/adloop/sandbox/assemble.py` — director template + "Product appearance:" spec + verbatim chassis
- `~/Documents/Agents/adloop/sandbox/render.mjs` — KIE gpt-image-2 image-to-image, per-ad refs, logo last, PNG magic + 100KB floor, render-report.json (already JS)
- `~/Documents/Agents/adloop/brands/godesi.in/` and `brands/beminimalist.co/` — inputs + brand.json (committed); `inputs/chassis.txt`, `packaging-spec.md`, `refs-manifest.json`, `facts.json`, `design-guide.md`, `personas.json`
- `~/Documents/Agents/adloop/reference/scratch-tests/` — the three validated runs (godesi, minimalist, theratefinder): briefs → prompts → refs → rendered ads = ground truth to reproduce
- `~/Documents/Agents/adloop/docs/PLAYBOOK_HIGH_FIDELITY_ADS_FROM_SCRATCH_2026-08-08.md` — 16 challenges→fixes
- `~/Documents/Agents/adloop/CLAUDE.md` — engineering rules (depth-1, pinned schemas, QA gate is correctness, per-ad refs, SVG logos rasterized, numeral lockdown, structure-not-craft, truth layer)
- lite's judge: `lite-loop/stages.ts:232–255` + `lite-loop/references/judge-rubric.md` + validators `lite-loop/pipeline.ts:269–496` — becomes the scorecard scorer

**Build order (Milestone 1):**
1. `npm create mastra@latest` in a new `adloop-mastra/` (or inside `cloudflare/sandbox/` once it runs); Node 22+; pin versions; `mastra dev` → Studio up.
2. Zod schemas from `schemas.py` (brief, batch, ledger entry, verdict, facts, refs manifest). Pinned. Parsers accept only the pinned shape.
3. Tools: `fetch_page`, `search` (Perplexity), `view_image` (image part to a vision model), `write_file`, `render` (wraps render.mjs), `assemble` (port of assemble.py to TS).
4. Workflow `batch`: `capture` = `.parallel([facts, designGuide, personas])` → `qaGate` (views every candidate image; one product, one packaging version, packshots only) → `writeBatch` (one structured call, forced rotation framework × layout × ground × CTA, `facts_used[]`, forbidden list) → `assemble` (code) → `render` (code, concurrent) → `verify` (vision, numeral diff vs facts_used, logo check) → `ledger` (append, status shipped). `suspend()` before render if founder review is on.
5. Agent `orchestrator`: tools = run the workflow, `edit_ad` (thin re-render → ledger `edited` → rule promotion on 2nd occurrence), `show_ledger`, `import_results` (CSV → status winning/fatigued). Model string per agent.
6. Memory: ledger = `brands/<domain>/history.json` + `memory.md`, read by the writer every batch. Observational memory off.
7. **Run GO DESi warm batch with the Aug 8 models.** Compare to `reference/scratch-tests/godesi` and the Aug 8 batch-2 renders. Same output = port correct. Tag `mastra-m1`.
8. Only then: Milestone 2 (writer → Kimi/DeepSeek/GPT/Gemini on the same brief; verify → vision models; judge → Fable/GPT-5/Gemini; render → Nano Banana/Flux/Seedream) and Milestone 3 (rubric as `createScorer`s, datasets from the 5 brands, experiments, Langfuse exporter).

**Hard stop:** if Milestone 1 has not reproduced GO DESi by day 5 of the job plan, run the scorecard with the scratch-loop method (Claude Code subagents, as on Aug 8) and finish the port after. The scorecard date does not move.

---

## 8. Open threads and risks

- Max-login OAuth on agent-loop/lite: never behind a customer. The new engine uses API keys.
- CMA resources may have expired; batches gitignored — pull before rebuilding anything on the old runtime (probably unnecessary).
- Mastra docs thin past basics (memory persistence, Cloudflare); Studio + the Mastra Claude Code skill (`npx skills add mastra-ai/skills --skill mastra`) compensate.
- Mastra observational memory makes hidden LLM calls — keep it off.
- Image inputs and tool-calling vary by model on OpenRouter; budget 2–3 days for capture on the first open model; writer swaps are cheap.
- The relapse risk is the founder, not the stack: the Sep 4 log shows a spec film until midnight the day after "the money hour" was written.

---

## 9. Pointers

- Research (evidence for the freeze): `docs/research/AGENT_STACK_RESEARCH_YC_CREATIVE_EVALS_2026-09-06.md`
- Positioning to update (still argues from the 47-min loop): `docs/POSITIONING_WHY_DIFFERENT_WHY_EXPENSIVE_2026-08-06.md`
- Teardown (the scorecard's method): `docs/research/COMPETITOR_MAKELOCALADS_TEARDOWN_2026-08-06.md`
- Floor rubric + baseline: `docs/eval-corpus/floor-baseline-2026-05-15.md`
- adloop: `~/Documents/Agents/adloop/CLAUDE.md`, `docs/ORIGINS.md`, `docs/SESSION_167..170_*.md`
- Founder context and job OS: `~/Documents/Agents/chakra-os/` (my-story.md, profile/, targets/job-harvest-2026-09-03.md, logs/2026-09-03.md)
- Memory: `user_situation_sep_2026.md`, `project_stack_freeze_sep_2026.md`
