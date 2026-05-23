# First-Principles Redesign — Implementation Plan

**Created:** 2026-05-16 · **Last updated:** 2026-05-16 (SDK research + deliverable storage model folded in)
**Pairs with:** `docs/eval-corpus/first-principles-redesign.md` (the LOCKED Q1-Q5 spec — see its Q4 SDK Amendment)
**Goal:** Build the 9-step reasoning loop (Q4) that delivers the Test Brief (Q2). Floor: 22% → 50%+.
**Scope:** Cloudflare production only. The local-dev Express path (`server/`, `local-ai-runner.ts`) is out of scope.

This doc is the *how* and the *how-much*. The spec doc is the *what*. Effort numbers are dev-days for the user paired with Claude; ranges, not promises.

---

## 1. Architecture fit — what already exists

The redesign is **not a from-scratch rebuild.** A verified read of the Cloudflare production stack (`agent-runner.ts`, `campaign-session.ts`, `sdk-message-parser.ts`) shows the harness shape Q4 specified already exists:

| Q4 requirement | Status today |
|---|---|
| ONE continuous `query()` loop, not chained calls | ✅ `agent-runner.ts:271-332` — `promptStream()` multi-yield generator |
| Turn mechanism (idle → wait → next turn, same session) | ✅ `waitForPromptFile()` + `/app/next-prompt.json` file-IPC |
| Subagent via `Task` tool | ✅ `research.md` works today |
| MCP server pattern | ✅ `createSdkMcpServer` — 2 servers live |
| Files as memory spine | ✅ Agent writes research/hooks/prompts to disk |
| stdout → WS event pipeline | ✅ `sdk-message-parser.ts` — extend with new event types |
| Follow-up round-trip (DO → `next-prompt.json` → loop) | ✅ `handleFollowUp` / `runFollowUpFast` |
| Q5 v1 manual feedback | ✅ Already supported — it *is* the follow-up loop |

**The loop is right.** What's missing is the *thinking*: the multi-apprentice topology, the gates/critic, interactivity, the structured deliverable, and the judgment-skills.

---

## 2. How interactivity works — `canUseTool` (corrected)

An earlier draft of this plan first called interactivity a "spike-level risk," then over-corrected to "a plain turn boundary." Both were wrong. The SDK docs settle it:

- Asking the founder a question = the agent calls the built-in **`AskUserQuestion`** tool.
- That tool routes through the **`canUseTool` callback** — a function we add to `agent-runner.ts`'s `query()` options. When the callback runs, the agent loop **suspends mid-turn** and stays suspended until the callback returns (*"can stay pending indefinitely"*).
- This is a **documented, first-class, headless-safe** mechanism — not new plumbing and not a turn boundary. It requires `permissionMode: 'default'`.
- It is **main-agent only** — `AskUserQuestion` is unavailable in subagents — which is *why* intake (A) and checkpoint (E) are orchestrator-owned.
- Verified safe with our liveness logic: a `canUseTool` pause keeps the turn open, so the DO's stream consumer stays attached and keeps draining the 5s heartbeat → no false `heartbeat_silent` alarm. One watch item: the 2h `MAX_GENERATION_AGE` cap counts the founder's think-time.

Flow: agent calls `AskUserQuestion` → our `canUseTool` writes the questions to stdout → DO relays a `question` WS event → chat renders a menu → founder answers → DO writes an answer file into the container → `canUseTool` reads it and returns `{behavior:'allow', updatedInput:{questions, answers}}` → loop resumes.

**No spike needed.** Effort for intake + checkpoint: M, ~2–3d.

---

## 3. SDK research findings — locked decisions

Five SDK-doc research passes resolved the open architecture questions. These are now decisions, not options:

- **Agents: programmatic `AgentDefinition`.** SDK-recommended for SDK apps; the only documented way to set per-agent `model` / `maxTurns` / `effort` / `skills` / `mcpServers`. Agent *prompts* are authored as `.md` files and loaded into the `prompt` field — keeps prompt iteration diffable.
- **Test Brief: Write-a-file + validation hook, NOT `outputFormat`.** `outputFormat` is all-or-nothing per `query()` — it would force every intake/checkpoint/edit turn to match the brief schema. Instead the agent `Write`s the brief as JSON; a `PostToolUse` hook validates it against a JSON Schema.
- **Orchestrator runs on Haiku.** It routes and holds the growing conversation but makes no judgment — judgment lives in the Sonnet subagents (sealed fresh contexts). Biggest single cost lever.
- **Model/effort per step:** Haiku for B/C extraction + the orchestrator; Sonnet for D/F/G/H. No "medium" model tier exists — depth is the SDK `effort` dial: `low` for B/C, `max` for D, `medium` for F/G/H. (TS SDK defaults `effort` to `high`.)
- **Completeness-lock = `Stop` hook**, confirmed real: returns `decision:"block"` + `reason` to resume the loop. Hook **must** check `stop_hook_active`, and it won't fire if `maxTurns` is exhausted first.
- **SDK config fixes:** raise `maxTurns` 30 → ~150+ and `maxBudgetUsd` $3 → ~$15+ (both cumulative across the whole continuous `query()` — campaign + warm follow-ups); set `ENABLE_TOOL_SEARCH: "false"` (3 MCP tools, below the ~10 threshold; Haiku can't use tool search anyway).

---

## 4. Component change list

| # | Component | Today | Redesign needs | Effort |
|---|---|---|---|---|
| 1 | Orchestrator prompt + SDK config | 132-line linear prompt; `maxTurns:30`, `maxBudgetUsd:3` | 9-step hub loop (A-I); raise maxTurns/budget; `ENABLE_TOOL_SEARCH:false`; `permissionMode:'default'` | 2-3d |
| 2 | Apprentice topology | 1 markdown subagent, Haiku everywhere | ~6 programmatic `AgentDefinition`s (research, comp, strategy, critic, cell, run-plan); per-apprentice identity (§4.1); model + `effort` per agent; orchestrator → Haiku | 3-4d |
| 3 | Skills rebuild | 2 procedural skills (452 + ~8,000 lines) | Rewrite both + 7 new binders as judgment-not-procedure (9 total, §4.2); each binder ships a mini-eval | 8-12d |
| 4 | Bet critic | None | Critic apprentice + rigor rubric + ≤2-retry loop | 2-3d |
| 5 | Cell code-checks | Offline only (`floor-graders.ts`) | In-loop per-cell F1/F2/F4/F5/F6 + drop-angle retry | 2-3d |
| 6 | Intake + checkpoint | Not used | `canUseTool` + `AskUserQuestion`; `question` WS event; chat menu (port `ActionCard`) | 2-3d |
| 7 | Spend-lock + completeness-lock | No `canUseTool`, no hooks | `canUseTool` freezes image MCP pre-checkpoint; `Stop` hook gates "done" (`stop_hook_active` guard) | 2-3d |
| 8 | New MCP tools | Don't exist | Budget-calculator (deterministic, learning-phase math) + `competitor-ads` (Step C — direct ScrapeCreators client, no fallback adapter, D1-cached) | 2-3d |
| 9 | Test Brief data model | `campaign_files` enum: `research\|hooks\|prompts` | Extend the `file_type` enum (+`bet`, `run_plan`, `next_move`, `cells`); staging + prod migration | 1-2d |
| 10 | Test Brief file types + validation | Image-centric; 3 file types | New file types ride the existing `campaign_files` + `file` WS-event path; agent writes the 4 brief files; `PostToolUse` hook validates the structured `cells` file | 2-3d |
| 11 | Test Brief client UI | File list + slide-in `FileEditorPanel`; image grid | Add 4 file-list entries + viewers; the `cells` viewer renders ad-unit previews (`PromptsViewer` pattern); grid unchanged | 3-5d |

**Total: ~31-44 dev-days ≈ 6-9 weeks.** The skills rebuild (#3) alone is ~a third of the total. (Local-dev parity — formerly #12 — dropped: Cloudflare-only scope.)

### 4.1 Apprentice identities (component #2)

Each apprentice's `AgentDefinition.prompt` opens with an **identity** — the job title and the quality bar it holds itself to. Identity is distinct from the skill/binder: identity = "who I am and my standard"; skill = "how a master of this craft thinks." The Q1 "senior performance marketer" is the *whole agent's* identity; the apprentices are specialist seats on its team — the agent is structured as a **small ad agency**: orchestrator = PM, apprentices = departments.

| Apprentice | Identity | Rationale |
|---|---|---|
| Orchestrator (Haiku) | Disciplined **project dispatcher** — deliberately NOT a marketer | Routes + holds a thin index, makes no judgment; a marketer identity would tempt judgment that belongs in sealed subagents |
| B — Research | **Performance-marketing research analyst** | Digs for buyer pain, objections, locale, voice-of-customer — marketing framing, not encyclopedic |
| C — Comp scan | **Competitive intelligence analyst** | Reads rival ads for clustering + white space; triage mindset, not measurement |
| D — Strategist | **Senior performance / growth marketing strategist** (NOT creative director) | Owns The Bet — a conversion hypothesis, not an aesthetic; a creative-director lens would drift The Bet back toward artifact |
| D — Critic | **Skeptical head of growth reviewing a junior's test plan** | Fresh-context reviewer; identity *is* the rigor — assume wrong until proven |
| F — Cell | **Direct-response creative** — conversion copywriter + art director | Step F merged copy + visual; the one true creative-director seat |
| G/H — Run Plan / Next Move | **Meta media buyer** | Learning-phase math, account setup, kill rules — media-buying expertise |

Style assignment stays in D as a **strategic framing call** (which visual lane communicates each angle, + Entity-ID diversity); the creative *craft* happens in F.

### 4.2 Binder inventory + per-apprentice mini-evals (component #3)

A **binder** is a skill rebuilt as *judgment-not-procedure* — worked good-vs-bad examples with the reasoning, an apprenticeship under a master, not an IKEA sheet. The current 2 skills are 450-line procedural recipes; box-ticking lets the agent mistake process-compliance for quality. Each apprentice that exercises judgment gets its own binder.

The Q4 subagent-topology table demands **9 binders, not the "~4 new" an earlier draft assumed** — corrected here:

| Binder | Apprentice | Status | Mini-eval (canned input → what's judged) |
|---|---|---|---|
| research | B | **NEW** | brand URL → is research factual, locale-correct, voice-of-customer present? |
| comp (light) | C | **DONE — LOCKED (S113)** | brand + vertical → are rival clusters / white space + current visual zeitgeist read correctly? Built on ScrapeCreators Ad-Library + Perplexity; 6/8 first eval, parked the shared Haiku `sourced` self-check. |
| strategy | D strategist | **NEW** | canned `research.md` → are the N angles distinct competing hypotheses, blocker sound, no fabrication? **Build + mini-eval this one FIRST** |
| rigor rubric | D critic | **NEW** (light) | known-good + known-bad Bets → does it catch the bad ones *and* pass the good? (a detection test, not an output-quality test) |
| hook | F cell | **REWRITE** (from `hook-methodology`, 452 ln) | angle + style + research → is the copy research-anchored, locale-correct, action-oriented? |
| art | F cell | **REWRITE** (from `art-style`, ~8,000 ln) | angle + style + research → is the image prompt a *scene* (not a product redesign), hook rendered on-image? |
| ad-unit | F cell | **NEW** | hook + art exercised together → do copy + image + CTA cohere as one Meta ad unit? |
| run-plan | G | **NEW** | canned facts + budget → is the learning-phase math correct, the plan runnable? |
| next-move | H | **NEW** (small) | canned round-1 results → is the decision tree sound? |

**Total: 7 new + 2 rewrites = 9 binders.** The orchestrator gets **no binder** — it is a dispatcher; the 9-step loop lives in its prompt, judgment kept out by design.

**Mini-evals — one per binder.** A mini-eval validates *one binder in isolation*: feed the apprentice a hand-written fixture standing in for the upstream step's output, then judge only that apprentice's file. Each needs (a) a canned input fixture and (b) a short scoring rubric — budget ~0.5d setup per binder, folded into the 8–12d. Two roles:

- **The strategy mini-eval is the gate-before-scaling.** If judgment-not-procedure doesn't visibly sharpen The Bet on 3–5 varied brands, stop and rethink the approach before writing the other 8.
- **Every other mini-eval runs as its binder is written** — catching a weak binder before its errors compound downstream. F's three binders (hook / art / ad-unit) are exercised by one apprentice, so their mini-evals can share a single cell-level fixture.

Mini-evals are *not* the Phase-1 GO/NO-GO gate: that gate is the full-corpus floor number after the whole 9-step loop runs. Mini-evals are the cheap, single-step checks *inside* the skills-rebuild task.

**Deliverable storage model:** the Test Brief follows the existing **text→file, image→grid** pattern — the Bet / Run Plan / Next Move / cell-copy are `campaign_files` rows; cell images are `campaign_images` rows. No new storage paradigm and no new workspace layout — it rides the file-list → `FileEditorPanel` mechanism that `research`/`hooks`/`prompts` use today. The `cells` file gets a bespoke viewer (the `PromptsViewer` pattern) that renders each cell as an ad-unit preview — that is where Q2's "complete Meta ad unit / executability bar" is met.

**Research inputs (Steps B & C):** Step B's research binder includes a **voice-of-customer pass** — the research apprentice mines buyer-side sources (Reddit, review sites — Amazon / Trustpilot / Google / TripAdvisor — Q&A, forums) via the `WebSearch` / `WebFetch` it already has, weighted by vertical and locale; no scraper, no new dependency. Step C's competitive scan is upgraded from its Phase-1 Perplexity-Search read to a real **`competitor-ads` MCP tool** that calls **ScrapeCreators directly** (synchronous JSON, India coverage; results D1-cached). **Decision (S113): ScrapeCreators only — no fallback providers, no swappable-adapter abstraction.** If ScrapeCreators is ever insufficient we revisit then; we don't pre-build for a vendor swap. It returns rivals' real creatives, copy, CTAs, start dates and variant counts — but **no performance metrics exist** for commercial ads; Step C derives proxy signals only (days-running, variant count, placement breadth) as a triage. From those same creatives Step C also surfaces the **current visual zeitgeist** in the category — which styles, formats and energies dominate competitors' active ads right now, and which look saturated versus unoccupied — for the strategy binder's "frame the creative" move to reason about (match / contrast / ignore). Both feed Step D; neither blocks it.

---

## 5. Phasing — front-load the floor, gate before the UI

The 22%→50% climb is won by #1-#5 — **not** by the Test Brief UI. Phase 1 produces a measurable floor number *before* any weeks go into UI. Note: with no local-dev path, the Phase-1 iterate-and-eval loop runs through **staging**.

### Phase 1 — Floor movers · ~17-25 dev-days, ~3-4 wks calendar · STAGING/EVAL MILESTONE

Goal: rebuild the reasoning core and **measure the floor**. The skills rebuild is largely independent writing and can run parallel to the harness engineering.

- Orchestrator prompt rewrite — 9-step loop, Step A stubbed (default facts / eval fixtures), Step E auto-approve; SDK config fixes (maxTurns, budget, tool-search) — *2-3d*
- Apprentice topology — programmatic `AgentDefinition`s; per-apprentice identity (§4.1); model + `effort` per agent; orchestrator on Haiku — *3-4d*
- **Skills rebuild — 9 binders (§4.2); start with the strategy binder end-to-end + its mini-eval (the gate-before-scaling), THEN commit to the rest; each binder ships with its own mini-eval** — *8-12d*
- Bet critic apprentice + ≤2-retry / drop-angle loop — *2-3d*
- Cell code-checks in-loop (port `floor-graders.ts`) + retry — *2-3d*
- Deliverable rendered as a structured file (reuse the existing file viewer — no new UI)
- Re-run floor graders after each meaningful commit

#### Phase 1 build sequence

Two orders must not be conflated. The **runtime flow** (A→I) is locked by Q4 — nothing to decide. This is the **build order** — the order the pieces get constructed. Key fact: a mini-eval tests one apprentice in isolation against a canned fixture, so it does **not** need the orchestrator loop — which is why the testing rig is built first and each apprentice is proven standalone *before* the loop exists.

Shape: a single thread (0→1), a fork into two parallel tracks (2a/2b), a merge (3→4). The fork does not start until Step 1 clears.

| Step | Build | Rationale |
|---|---|---|
| **0** ✅ | Mini-eval harness + apprentice scaffold (ticket below) | Blocks everything — no binder can be proven without it · **DONE (S109)** |
| **1** ✅ | Strategy binder + strategy apprentice → run its mini-eval | The **gate-before-scaling** · **DONE (S109) — 3/3 held-out fixtures pass, 3 cracks fixed** |
| **2a** | The other 8 binders — write + mini-eval each *(parallel track)* | Independent writing |
| **2b** | Harness engineering — orchestrator 9-step rewrite + SDK config; wire all 6 apprentices into the loop; Bet critic + retry loop; cell code-checks *(parallel track)* | Plumbing — independent of binder content |
| **3** | Integration — full 9-step loop on staging, run the corpus | Needs both tracks done |
| **4** | 🚦 GO/NO-GO gate on the floor number | End of Phase 1 |

#### Status — 2026-05-19 (Session 109)

- **Step 0 — mini-eval harness: DONE.** `cloudflare/eval/mini-eval/` — a plain local Node script (`run-mini-eval.ts`) that runs one apprentice binder against canned held-out fixtures, scores the deliverable with an LLM judge against a per-binder rubric, and computes a deterministic pass/fail. Done-check met: `run-mini-eval.ts strategy` produces a scored report. Judge model is `claude-sonnet-4-6` — Opus 4.7 is incompatible with the pinned SDK 0.2.63 (old thinking-API shape).
- **Step 1 — strategy binder: DONE, validated automatically.** The strategy `AgentDefinition` is built (`apprentices/strategy.ts`). The binder was mini-eval'd *by the harness* (no longer by hand) against 6 held-out brands; the gate surfaced and we fixed 3 real cracks — worked-example leakage (→ `worked-examples.md` dropped from the apprentice's runtime context, kept as an authoring artifact), always-N=3 (→ the right-size move rewritten so N is derived from budget ÷ cost-per-event; re-validated N=2/3/5 across a 50× budget range), and geo-blindness (→ a founder→research-range cost confidence ladder, reasoned as a sensitivity, plus geo as a strategic lever). Final run: 3/3 held-out fixtures pass, all 9 criteria each. Committed `df06f14` on `new-ui`; full record in `docs/SESSION_109_*.md`.
- **Next session — Step 2a:** the other 8 binders, each with its own apprentice definition + rubric + held-out fixtures, run through the proven harness.
- **Carry-over harness polish (small):** the `results/<binder>-<date>-bets/` folder accumulates stale files across runs; a judge *infra* failure currently reads `fail` and should read `inconclusive`.

#### Step 0 ticket — mini-eval harness

Work items, ordered:
1. **Apprentice scaffold** — minimal programmatic `AgentDefinition` (identity prompt + binder + model + `effort`); the definition mechanism only, not yet wired into any loop.
2. **Standalone runner** — takes `(one AgentDefinition, one fixture)` → runs a single `query()` with only that apprentice → captures its output file. No DO, sandbox, or orchestrator.
3. **Fixtures** — canned inputs per binder; the strategy binder = a hand-written `research.md` for 3–5 varied brands, lifted from the existing eval corpus (`dump-eval-corpus.ts`).
4. **Rubric format** — a small scoring rubric per binder (criteria + pass bar); The Bet's rubric is the same one the Step-D critic will use — write once, reuse.
5. **Scorer** — pluggable: an LLM-judge for judgment binders, code asserts (reuse `floor-graders.ts`) for code-checkable ones.
6. **Report** — per-fixture score, pass/fail, aggregate.

File targets:
```
cloudflare/eval/mini-eval/run-mini-eval.ts    — runner
cloudflare/eval/mini-eval/fixtures/<binder>/  — canned inputs per binder
cloudflare/eval/mini-eval/rubrics/<binder>.md — scoring rubric per binder
(reuse the existing floor-graders.ts for code-checkable scoring)
```

**Runtime — LOCKED: the harness runs as a plain local Node script**, calling the SDK directly — no container, DO, or staging deploy. A mini-eval tests a *binder* (a prompt/judgment artifact), which behaves identically wherever the SDK runs; the container/DO plumbing is exactly what a mini-eval deliberately skips. This is **dev tooling, not the product runtime** — it does not reintroduce the dropped local-dev Express path. Staging is reserved for the full-loop eval at Step 3.

Dependencies: SDK invocable from a plain script — nothing else (the point of building it first). Done-check: `run-mini-eval.ts strategy` produces a scored report over 3–5 fixtures. Effort: ~1–2d for the runner/scaffold; per-binder fixtures + rubrics are already budgeted inside components #2 and #3.

**Phase 1 is an eval milestone, not a launch** — it asks no questions and auto-approves. Deploy to staging, run the corpus, read the floor number.

**🚦 GO/NO-GO GATE:** if the floor hasn't moved meaningfully off 22%, stop and rethink the skills approach *before* spending Phases 2-3.

### Phase 2 — Interactivity & the strategy gate · ~7-11d · FIRST PROD-WORTHY RELEASE

Goal: founder-in-the-loop. Only worth building if Phase 1 moved the floor.

- Step A intake — `canUseTool` + `AskUserQuestion`; `question` WS event; chat menu component (port `ActionCard`) — *2-3d*
- Step E checkpoint — reuses the same `canUseTool` + menu — *1d*
- Spend-lock (`canUseTool`) + completeness-lock (`Stop` hook) — *2-3d*
- New MCP tools — budget-calculator + `competitor-ads` (ScrapeCreators) — plus real Run Plan (Step G) — *2-4d*
- Q5 v1 manual feedback — lands free here (reuses the follow-up loop)

(Step C's competitive scan runs from Phase 1 on the **Perplexity Search wrapper** the research binder already uses — validated S113 to feed rival-field, clustering, white-space and a hedged category visual-zeitgeist read; only the per-rival live-creative read needs the upgrade. The `competitor-ads` ScrapeCreators tool upgrades it here. Step B's voice-of-customer pass ships in Phase 1 as part of the research-binder rebuild — it needs no new tooling.)

### Phase 3 — The real deliverable surface · ~6-10d

Goal: the Test Brief as first-class files + viewers. Rides the existing `campaign_files` + `FileEditorPanel` pattern (text→file, image→grid) — no new layout.

- Extend `campaign_files.file_type` enum (`bet`, `run_plan`, `next_move`, `cells`) — staging + prod migration — *1-2d*
- Agent writes the 4 brief files + `PostToolUse` validation hook on the structured `cells` file — *2-3d*
- File-list entries + viewers; the `cells` viewer renders ad-unit previews (the `PromptsViewer` pattern) — *3-5d*

---

## 6. Cost

Confirmed pricing ($/MTok): **Haiku 4.5 = $1/$5 · Sonnet 4.6 = $3/$15** — Sonnet is exactly 3× Haiku. Cache read = 0.1× input (auto-applied by the SDK).

Rough campaign cost (token estimates ±2×):

| Component | Cost |
|---|---|
| Haiku research + comp (`effort: low`) | ~$0.05 |
| Sonnet strategy + critic (with retries) | ~$0.5 |
| Sonnet cells ×~4 | ~$1.0 |
| Sonnet run-plan + next-move | ~$0.25 |
| Orchestrator hub — **Haiku ~$0.6** (vs Sonnet ~$2) | ~$0.6 |
| fal.ai images (separate) | ~$1-2 |
| **Total to serve** | **~$4-6** |

Priced at $5 (50 credits) → roughly break-even. **`maxBudgetUsd` must rise from $3** regardless. Decision: lock Sonnet for strategy/critic/cells; **Haiku orchestrator**; **re-price on the measured Phase-1 number** — don't re-price on this estimate.

---

## 7. Risks & open questions

1. **Skills rebuild is the biggest bet** — 8-12d, mostly writing/judgment, and the floor's success rides on it. Mitigation: build *one* skill (strategy) end-to-end and mini-eval it before committing to all six.
2. **Cost** — see §6; campaign cost rises to roughly the $5 price. Re-price after the Phase-1 measurement.
3. **5 concurrent subagent contexts on `standard-2`** (~1 vCPU, ~12 GiB) — not blocked by code, but memory under 5 parallel SDK contexts is untested. A Phase-1 measure-it item, not a blocker.
4. **The 2h `MAX_GENERATION_AGE` cap counts human think-time** during a `canUseTool` pause. Decide during the Phase-2 build: pause that clock while awaiting the founder, or accept that an abandoned intake dies after 2h.
5. **Phase 1 deploys a question-less loop** — coherent for eval, not a user-facing release. First prod release is end of Phase 2.

The Test Brief layout — formerly a flagged open question — is **resolved**: it rides the existing text→file / image→grid pattern (see §4). The only remaining choices are minor (bespoke vs shared doc viewer; whether The Bet also pins to the canvas) — normal Phase-3 component decisions, not blockers.

---

## 8. Open: not yet scoped

- Q5 v2 (memory retrieval) — deferred post-launch by spec; not in this plan.
- The Q3-ceiling / Q4-ceiling eval rubrics — after the floor stabilizes.
- WS 1006 fix, followup intent classification, master-merge — pre-existing deferred work, tracked separately.
