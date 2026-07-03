# Session 107 — Q5 locked, redesign spec complete, implementation plan built

**Date:** 2026-05-16
**Branch:** `new-ui`
**Commits:** none (planning + research session — docs only, nothing tested/committed)
**Goal:** Finish the first-principles redesign spec (answer Q5), then turn the locked Q1–Q5 spec into a concrete, doc-grounded implementation plan.

---

## TL;DR

- **Q5 (feedback loop) LOCKED** — the redesign spec is now **complete (Q1–Q5)**. Q5 split: v1 = manual feedback (founder pastes round-1 results as a follow-up; reuses the existing loop), v2 = memory-retrieval/embeddings **deferred** post-launch.
- **New doc: `docs/eval-corpus/implementation-plan.md`** — the *how* and *how-much* for building the redesign. ~31–44 dev-days, 3 phases, with a 🚦 GO/NO-GO floor gate after Phase 1.
- **Verified the Cloudflare production stack** against the spec — the one-continuous-`query()`-loop harness Q4 wants **already exists** (`agent-runner.ts:271` `promptStream()`).
- **5 SDK-doc research passes + 4 Meta Ad Library research passes** resolved every open architecture and research-input question. Several earlier assumptions were **corrected** (see "Corrections" below).
- Both docs (`first-principles-redesign.md`, `implementation-plan.md`) + memory are now **consistent and current**.
- **Nothing built.** Next session = scope Phase 1 task-by-task.

---

## Next session opener

> Resume the first-principles redesign — **implementation**. Read in this order:
> 1. `docs/eval-corpus/implementation-plan.md` — the build plan (components, phases, effort)
> 2. `docs/eval-corpus/first-principles-redesign.md` — the locked Q1–Q5 spec (note the two Q4 Amendment blocks)
> 3. `docs/SESSION_107_*.md` (this file) — what was decided and why
>
> **First task: scope Phase 1 task-by-task** — turn "orchestrator rewrite + programmatic apprentices + skills rebuild + Bet critic + cell checks" into concrete, ordered work items with file targets and a build sequence. Phase 1 is a STAGING/EVAL milestone; it ends at a GO/NO-GO gate on the floor number (22% → target 50%+).
>
> Cloudflare-only scope. The skills rebuild is the biggest bet — start with ONE skill (strategy) end-to-end + a mini-eval before committing to all six.

---

## What happened

### 1. Q5 locked — spec now complete

The user wanted to pause the feedback loop ("memory retrieval adds significant engineering"). Rather than leave Q5 blank — which would dangle the Q2 Part 4 "round 2 needs round-1 results" dependency — Q5 was **split and locked**:

- **v1 (in scope):** manual feedback. The founder reports round-1 performance as a follow-up prompt; the same Q4 loop runs round 2 (variants of the winner). No persistence, no cross-campaign learning. Closes the Q2 Part 4 dependency.
- **v2 (deferred):** automatic learning — CLIP embeddings + Vectorize + reach-as-gold. Revisit post-launch once the floor clears 50%. Zero floor impact, separate engineering surface.

### 2. Implementation plan built

Created `docs/eval-corpus/implementation-plan.md` after a verified architecture review of the Cloudflare stack (3 parallel agents mapped the agent-definition layer, the DO/sandbox runtime, and the data/output layer). Key framing: the redesign is **not a from-scratch rebuild** — the continuous `query()` loop, `Task` subagents, MCP pattern, files-as-memory, and the stdout→WS pipeline all already exist. What's missing is the *thinking* layer.

11 components, ~31–44 dev-days, 3 phases:
- **Phase 1 — floor movers** (~3–4 wks, staging/eval milestone, GO/NO-GO gate): orchestrator rewrite, programmatic apprentices, skills rebuild, Bet critic, cell checks.
- **Phase 2 — interactivity** (~7–11d, first prod release): intake/checkpoint, locks, MCP tools.
- **Phase 3 — Test Brief surface** (~6–10d): `campaign_files` enum + viewers.

### 3. SDK research — 5 parallel passes over `claude_sdk/`

Resolved the open architecture questions against the local SDK docs. Findings folded into the redesign doc's Q4 **"Amendment — SDK research findings"**.

### 4. Meta Ad Library research — 4 parallel passes

The user challenged OQ3's "official API useless → best-effort WebSearch only" framing (people on X use the Ad Library productively). Research confirmed: official API *is* useless for non-EU commercial ads, **but** the public Ad Library is rich + global, and third-party scraper APIs wrap it cleanly. User chose **Tier 1** (real API). Apify + alternatives benchmarked → **ScrapeCreators** chosen as primary.

### 5. Test Brief UI resolved

The user corrected an over-flagged "open UI question": the workspace already renders on a **text→file / image→grid** split. The Test Brief rides the existing `campaign_files` + `FileEditorPanel` pattern — no new layout. The redesign doc's "open product/UI question" is now marked RESOLVED.

### 6. Reddit / voice-of-customer

Decided **not** to build a Reddit scraper. Instead, Step B's research binder gains a buyer-side **voice-of-customer pass** — mining Reddit, review sites, Q&A, forums via the `WebSearch`/`WebFetch` the apprentice already has. No scraper, no dependency.

---

## Decisions locked this session

| Topic | Decision |
|---|---|
| Q5 | v1 manual feedback (reuses follow-up loop); v2 memory-retrieval deferred post-launch |
| Scope | **Cloudflare only** — local-dev Express path dropped |
| Agent definitions | **Programmatic `AgentDefinition`** (not markdown) — prompts authored as files, loaded into the `prompt` field |
| Test Brief enforcement | Agent **writes a JSON file** + `PostToolUse` validation hook — NOT the SDK `outputFormat` (all-or-nothing per `query()`, would break intake/edit turns) |
| Completeness-lock | `Stop` hook (`decision:"block"` + `reason`; must guard `stop_hook_active`) — confirmed real |
| Orchestrator model | **Haiku** (router, no judgment — biggest cost lever); Sonnet for D/F/G/H |
| Model depth | No "medium" model tier — use the SDK **`effort`** dial (`low` B/C, `max` D, `medium` F/G/H) |
| SDK config | Raise `maxTurns` 30→~150+, `maxBudgetUsd` $3→~$15+; set `ENABLE_TOOL_SEARCH:"false"` |
| Intake/checkpoint | `AskUserQuestion` via the **`canUseTool` callback** — a genuine, supported, headless-safe mid-turn pause; `permissionMode:'default'` |
| Test Brief storage | Rides existing **text→file / image→grid** pattern — extend the `campaign_files.file_type` enum; no new layout |
| Step C competitive scan | `competitor-ads` MCP tool wrapping **ScrapeCreators** (Apify/SearchApi fallback, swappable adapter, D1-cached); non-blocking; proxy signals only |
| Step B research | Adds a buyer-side **voice-of-customer pass** via WebSearch — no scraper |
| Cost | Sonnet = 3× Haiku; campaign ≈ $4–6 to serve vs $5 price — **re-price after Phase 1's measured number** |

---

## Corrections made this session (for the record)

Several things were stated wrong mid-session and corrected — noted so the reasoning trail survives:

1. **Interactivity** — first called a "spike-level risk", then over-corrected to "a plain turn boundary". **Final, doc-grounded answer:** `AskUserQuestion` is a genuine *mid-turn pause* via the `canUseTool` callback — a first-class, documented, headless-safe SDK mechanism. Not a risk, not a turn boundary.
2. **Programmatic vs markdown agents** — first recommended markdown; SDK docs corrected this to **programmatic** (recommended for SDK apps; only documented way to set per-agent model/maxTurns/effort/skills).
3. **Prompt caching** — first said "the codebase has none"; the SDK does caching **automatically**.
4. **Test Brief UI** — over-flagged as an unresolved layout question; the existing workspace pattern already handles it.
5. **Meta Ad Library (OQ3)** — first concluded "best-effort WebSearch only"; corrected to a viable third-party-API path.

---

## Files touched this session

```
docs/eval-corpus/first-principles-redesign.md   — Q5 section added; Q4 two Amendment blocks
                                                   (SDK research + research inputs); OQ3 revised;
                                                   Test Brief UI marked RESOLVED; inline fixes
docs/eval-corpus/implementation-plan.md          — NEW (the build plan)
docs/SESSION_107_*.md                            — this file
(memory: project_first_principles_redesign.md + MEMORY.md updated)
```

No code touched. No commits.

---

## Open / watch items (not blockers)

- **2h `MAX_GENERATION_AGE`** counts founder think-time during a `canUseTool` pause — decide in Phase 2: pause the clock or accept a 2h abandon limit.
- **5 concurrent subagent contexts on `standard-2`** (~1 vCPU, ~12 GiB) — memory untested; a Phase-1 measure-it item.
- **Re-price** the campaign on the Phase-1 measured cost (current $5 / 50 credits may be break-even-to-negative).
- **ScrapeCreators** needs an account/API key before Phase 2.
- The Q1–Q4 work (locked 2026-05-16) did not get its own session doc — this doc backfills the Q5 + planning record; the Q1–Q4 detail lives in `first-principles-redesign.md`.

---

## Punch list — eval workflow (carried from S106, updated)

- [x] Step 1 leak trace
- [x] Answer Q1–Q4 (identity / deliverable / input contract / reasoning model)
- [x] Answer Q5 (feedback loop) — locked this session
- [x] Implementation plan built (`implementation-plan.md`)
- [ ] **Scope Phase 1 task-by-task — next session**
- [ ] Build Phase 1; re-run floor graders after each meaningful commit
- [ ] 🚦 GO/NO-GO gate on the floor number (22% → 50%+)
- [ ] Phases 2–3
- [ ] (Lower priority) Grader calibration: F3 number normalization, F1 URL fallback, F6 CTA extraction

## Punch list — deferred non-eval work (carried unchanged)

WS 1006 structural fix · Followup intent classification · Aspect-ratio drift · `new-ui` ahead of master · Rotate prod Clerk Secret Key · Multi-reference selective replace Phase 1.1 · PR 2 undo/redo UI · server/cloudflare orchestrator-prompt drift (now moot — Cloudflare-only scope)
