# SESSION 137 — The agent-loop rebuild: async-deadlock fix, orchestrator-launched critics, `--resume`, and the critic's scene/product judgment

**Date:** 2026-07-01
**Branch:** `new-ui` (everything below is **UNCOMMITTED**; `agent/.claude/skills/cell/` is git-untracked)
**One line:** We found *why* the cell cloned the marble-kitchen exemplar (positive examples in a wide-output skill), fixed it, built the performance bar + an independent render-critic — then hit a hard **nested-subagent async deadlock**, diagnosed it to the ground, and **rebuilt the agent-loop** so the orchestrator launches both critics (depth-1, where async works) with the cell split in two. Proved it end-to-end on a live run, fixed the completion + retry-guard + added `--resume`, and last, corrected the critics' *judgment*: the real product is **ground truth**, and the **scene must be plausible** (take-critic primary).

> **NEXT SESSION GOAL (why this doc exists):** make the pipeline run **at CLI level with the whole process visible live** — stage tree, subagent launches, critics firing + verdicts, retry loops, cost/timing — instead of the block-buffered stdout that made "what's it doing right now?" nearly un-answerable all session. See **§7**.

---

## 1. TL;DR — the spine

1. **Templatization root cause found & fixed.** The cell cloned the v13 marble-kitchen because the 3 format docs each carried a fully-resolved *positive worked example* — which our OWN Anthropic research says never to put in a wide-output (creative) skill (they re-templatize; the frontend-design pattern = principles + counter-examples, NO positive examples). Removed all 3; hardened "derive from the claim, never a remembered example."
2. **Cell cluster built:** #1 templatization (above), #3 a **performance bar** (legible-at-thumbnail, CTA-on-image), #2 an **independent render-critic** (judges the pixels).
3. **THE deadlock.** A validation run wedged for ~7 hours. Root cause (proven 3 ways): in **SDK 0.3.195, subagents run *background/async* by default** (no flag set — a probe confirmed `background:false` doesn't stop it). A **nested** subagent (cell → critic) deadlocks because the completion notification is pushed to the **top-level session only**, never down to the nested parent. The cell waited forever.
4. **Rebuild (the fix).** Keep the flexible LLM orchestrator; move **both critics up to orchestrator-launched stages** (depth-1, where async works). **Split the cell** into `cell-generate` + `cell-render` so a critic runs between them. Orchestrator → **Sonnet** (it now reasons about retries). Full plan: `docs/PLAN_AGENT_LOOP_CRITIC_REBUILD_2026-07-01.md`.
5. **Validated live.** After 2 casualties (the deadlock; then a *network drop* — not our code), a clean run went the full distance: research → comp → strategy → cell-generate → **take-critic** → cell-render → **render-critic** → retry — **no deadlock**, both critics fired, the retry loop ran.
6. **Plumbing fixes:** completion now keys on a **`DONE.md`** sentinel (was `cell-output.md` — closed too early, cut off the retry); guard #2 made **retry-aware** (was once-only, latent block); added **`--resume=<dir>`** (fresh-query over cached file-state — grounded in `session_management.md:313`, portable to prod, NOT JSONL session resume).
7. **Critic judgment corrected (universal).** The render-critic was nitpicking the product's own pack copy ("suuuuper light") — WRONG: the real product is **ground truth**. And it missed the real problem: a **bathroom** setting for a protein ad. Fix (encoded as universal MOVES across 4 seats): **product = ground truth, never critiqued**, and **the scene must be a believable, on-message place for this product** — take-critic as the *primary* catch (before a render is spent).

---

## 2. What happened, in order (the arc)

**Phase A — templatization diagnosis.** Read `SESSION_136`. The cell cloned v13's marble kitchen. Grounded against our own notes (`docs/anthropic-learnings/00-genericness-conclusion.md:119`, `02-prompting-reasoning.md:163/172`, `04-skills-sdk-production.md:274`): a wide-output skill must have **principles + counter-examples, NO positive examples**; ours had 3. An example is a Bayesian prior — with n=1 (and all three the same brand, TWT) the model copies the whole surface.

**Phase B — the skin×engine + engine-placement discussion (DECIDED, DEFERRED).** Re-surfaced the frozen "Native DR Kit — skin × engine" (`docs/research/ad-library/DR-FORMAT-KIT-FROZEN-2026-06-16.md`). Pressure-tested where the **engine** (PAS/offer/us-vs-them/proof) should live: **strategy decides the engine, comp maps the traction** (same "map, not verdict" rule as the want; the engine is a per-*angle* property and angles are strategy's invention). Also: research/comp feed the engine *indirectly* (friction + proof + field-traction), not by "gathering formats"; keep comp's firewall (un-run format ≠ open want). **Not built this session** — a next arc.

**Phase C — brand-read / vision (DEFERRED).** Real gap: research is **visually blind** — it reads the brand as text, never *sees* the logo/palette/product. Native UGC stays the default; brand identity shows up through the real product (product) / native artifacts (services: chat avatar, letterhead, signage). Logo capture: Brandfetch fast-path + HTML-parse/vision fallback. **Deferred** ("do it later").

**Phase D — cell cluster (#1/#2/#3) built.** See §5.

**Phase E — the async deadlock.** First rebuilt-pipeline validation wedged 7 hrs. Traced (`trace.jsonl`, live-appended): every `Agent` launch returns *"Async agent launched… use SendMessage… you'll be notified."* Orchestrator→stage handoffs survived (top-level gets the notification + polls the file); the **cell→critic nested handoff** deadlocked (the cell polled `verdict.md` 3× too early, then passively "waited for the notification" that never reaches a nested parent). A standalone probe (`_probe_sync.ts`, since deleted) proved `background:false` does NOT force sync — background is the 0.3.195 default here. Grounded in `claude_sdk/subagents.md` (nesting supported but every doc example is **main→reviewer**), `session_management.md`, `hooks.md`.

**Phase F — the rebuild.** §4 + the plan doc.

**Phase G — validation.** Run 1 (`runs/2026-06-30-20-13-56`) = the 7-hr deadlock. Run 2 (`runs/2026-07-01-04-30-09`) = died at comp with `ConnectionRefused` (user's **network drop**, not our code — research completed clean, orchestrator cleanly launched comp = the rebuild working). Run 3 (`runs/2026-07-01-05-18-52`) = **full success**: both critics fired, retry ran, `DONE.md` written.

**Phase H — plumbing + `--resume` + the judgment fix.** §6, §7-not, §3-item-7.

---

## 3. The new architecture (current state)

```
research → comp → strategy → cell-generate → take-critic → cell-render → render-critic → DONE.md
                                  ↑ REJECT-ALL: re-mine (max 3 rounds) → then flag upstream
                                                          ↑ FAIL(re-render): re-render (max 1); FAIL(structural): flag
```

- **Flexible LLM orchestrator kept** (the locked "orchestrator = hub" design). It launches ALL stages **and both critics** — every launch is **depth-1** (where async notifications reach the launcher). No nesting anywhere.
- **Cell split:** `cell-generate` (mine → `takes.md`, no spawns) and `cell-render` (winner → shot spec → render → `cell-output.md`). A critic runs between.
- **Retry loops** owned by the orchestrator (Sonnet): take-critic REJECT-ALL → re-mine (**3** rounds, cheap text) then flag; render-critic FAIL(re-render) → re-render (**1**, paid pixels) / FAIL(structural) → flag now.
- **Completion = `DONE.md`** the orchestrator writes as its final act (after render-critic PASS or an upstream flag). Fixes the too-early close.
- **`--resume=<dir>`** = fresh `query()` over the cached file-state (files-as-handoff), NOT SDK session/JSONL resume (grounded: `session_management.md:313` — more robust + host-portable to the prod sandbox).

---

## 4. Key technical findings (don't re-derive)

- **SDK 0.3.195 backgrounds subagents by default.** No `background`/`run_in_background` in our config or the model's calls, yet every `Agent` launch is `async_launched`. Probe-confirmed `background:false` doesn't stop it. Completion notification (`task-notification` synthetic turn) is pushed to the **top-level session only** — a nested parent never gets it → deadlock. **Rule: never let a subagent spawn a subagent it must await. Keep launches depth-1.**
- **The docs favor main→reviewer.** `subagents.md`: "only its final message returns to the parent" (blocking model); every worked example is the *main* agent launching a reviewer. Nesting is *supported* (depth-5 cap) but undocumented for the await path.
- **Session resume ≠ our need.** `session_management.md:313`: for cross-host/ephemeral (our prod sandbox), "don't rely on session resume — pass application state into a fresh session's prompt; more robust." Our files-as-handoff already IS this. Same-machine JSONL resume works but reloads the whole orchestrator transcript — wrong tool for a stage re-run.
- **The render-critic's real find (fidelity vs angle).** Binding the product for 100% fidelity (fal *edit* mode) **anchors the pack front-on** — you *cannot* rotate it to a 3/4 angle via prompt. So "hide the pack's own copy by angling it" is impossible when bound. The render-critic correctly escalated FAIL(re-render) → **FAIL(structural)**, stopped, and flagged — the anti-slop behavior working. (This is *why* the pack-copy check was wrong-headed AND unachievable; the judgment fix in §item-7 removes it.)

---

## 5. File-change inventory (all UNCOMMITTED)

**Binders — `agent/.claude/skills/cell/`:**
- `references/formats/{testimonial,founder-pov,pas-real-world}.md` — **removed** the "Worked example — The Whole Truth" sections (#1); preserved the exclude-listing-overlays gotcha into each checklist; v-bump footers.
- `references/layer-stack.md` — hardened "setting from the claim, never a prior render/remembered example" (#1); **added scene-plausibility** ("would someone actually be here, with this?"); removed the claim-specific "morning kitchen" illustration.
- `SKILL.md` — added a mechanical self-check bullet: setting derived-from-this-claim, not lifted.
- `references/shot-spec.md` — added the **performance bar** (#3: legible-at-thumbnail, CTA-on-image) + vision-gate assertions + Must-show; the vision gate now points to the independent render-critic; **replaced** the on-pack-copy item with **scene-plausibility** (judgment fix).
- `references/render-critic.md` — **NEW** (#2: independent pixel critic — spec fidelity + performance bar, PASS / diffs marked re-render|structural). Then judgment fix: **product = ground truth (don't critique the pack)** + **scene-plausibility (backstop)**.
- `references/critic.md` — take-critic now **reads the counterexample bank** (was told "read ONLY thebet+takes"); **added scene-plausibility as a primary kill test** (test 1), routes to re-mine, "judge the scene the cell chose, never the product."

**Code — `agent-loop/`:**
- `stages.ts` — split `CELL` → `CELL_GENERATE` + `CELL_RENDER` (added `skill?` field so both use the `cell` binder); both critics read `counterexamples.md`; render-critic **Globs** the image; `CRITIC_*`/`RENDER_CRITIC_*` I/O prompts reworded to "orchestrator-launched"; `STAGES`/`STAGE_ORDER` updated.
- `pipeline.ts` — orchestrator prompt **rewritten** (new flow + the two retry loops + explicit "wait for the notification, never give up, one Agent in flight"); critics registered as orchestrator-launched; render-critic tools += `Glob`; **orchestrator model → Sonnet**; **completion → `DONE.md`**; budget bumped (28/20).
- `hook.ts` — guard #2 **retry-aware** (per-stage `LAUNCH_CAPS` instead of once-only Set).
- `run.ts` — **`--resume=<dir>`** flag (fresh-query over an existing run dir; keeps founder-facts/refs); `EXTRA_FILES` keyed to `cell-generate`+`cell-render`; FAL-key check → `cell-render`.

**Docs:** `docs/PLAN_AGENT_LOOP_CRITIC_REBUILD_2026-07-01.md` (the rebuild plan). `_probe_sync.ts` created + deleted.

---

## 6. Validation state — proven vs. not-yet

**Proven live (Run 3, `runs/2026-07-01-05-18-52`):** pipeline runs end-to-end; **both critics fire orchestrator-launched, zero deadlock**; the **retry loop runs**; the **structural-escalation** works (FAIL re-render → same diff survives → FAIL structural → stop, flag); **`DONE.md` completion** holds; **`--resume`** works (ran only cell-render on cached upstream). Renders: the first (rejected) + the retry are in that dir's `images/`.

**NOT yet run-validated (logic-complete only):** the **scene/product judgment fix** (§item-7) — the take-critic catching an implausible scene, and the cell deriving a plausible one. A **cell resume** (`--resume` with `order=cell-generate,cell-render`, after clearing stale cell outputs) is the ~15-min test. User opted not to run it this session.

**Known residuals:** (a) `--resume` doesn't auto-clear a re-run stage's stale outputs (a cell resume needs `render-verdict.md` cleared by hand or `cell-render` mistakes it for a re-render instruction) — small robustness fix. (b) The **fidelity-vs-angle** limitation is real: to actually resolve a pack whose own copy clashes with strategy, the fix is upstream (composite the pack / crop / restage), never a re-render — but per §item-7 we now mostly DON'T fault the product anyway.

---

## 7. NEXT SESSION — run the pipeline at CLI level with the whole process visible

**The problem this session exposed.** All session, answering "what is it doing right now?" was painful. `run.ts` does `onProgress: (line) => console.log(line)`, and `pipeline.ts` `emitProgress()` logs: `· session init`, `▶ launching subagent: <name>`, `· mcp call: …`, `■ result segment (turns, cost)`, `✓ final deliverable present`. But when the run is backgrounded, **stdout is block-buffered (~8 KB)** — so live progress is invisible until a flush; we resorted to grepping the output file + `ps`/`lsof` CPU/network checks to infer the stage. The subagent *internals* (the cell/critic reasoning) are entirely opaque — only tool calls surface.

**The goal.** A real CLI where you SEE the whole process live: the stage tree with per-stage status (running/done/failed/cost/time), each subagent launch, **the critics firing and their verdicts inline**, the retry loops, and totals — in real time, readable.

**Starting points for the build:**
- **`trace.jsonl` is the gold source** — `trace.ts` `record(m)` **appendFileSync**'s every SDK message *live* (one JSON/line). A live view can tail it. It carries assistant text/thinking, `tool_use` (incl. `subagent_type`), `tool_result`, `result` (turns/cost/subtype), `system/init`, and `parent_tool_use_id` (which distinguishes orchestrator vs subagent messages).
- **The emit path** — `pipeline.ts` `emitProgress()` + the `onProgress` callback threaded from `run.ts`. This is where a richer renderer hooks in.
- **Options to weigh (fan out, decide next session):**
  1. *Minimal:* force unbuffered stdout (write+flush per line) so a plain background tail shows live progress. Cheapest visibility win.
  2. *TUI:* an `ink`/`blessed` live dashboard — a stage tree, per-stage spinner→✓/✗, running cost/time, the two critic verdicts rendered inline, the retry counter. Best UX.
  3. *Trace viewer:* a separate process that tails `trace.jsonl` and renders it (grouped by stage via `parent_tool_use_id`), so a headless run and a live viewer are decoupled.
  4. *Surface subagent internals:* today only tool calls show; decide how much reasoning/thinking to render (cost of noise vs insight).
- **Watch-outs:** the SDK streams in **streaming-input mode** (held-open generator — required for the MCP bridge + hooks; do NOT drop it). Subagents run **async/background** (§4) — the CLI must render out-of-order segments coherently (group by `parent_tool_use_id`, not arrival order). Costs arrive per `result` segment; sum them for a live total.

---

## 8. Open / deferred (not this session)

- **Scene/product fix — run-validate** (the ~15-min cell resume). *(the only untested piece of this session's work)*
- **Engine → strategy** (Phase B, decided not built): strategy picks the engine per angle; comp maps traction. Requires strategy-binder + comp-binder edits.
- **Brand-read / vision upstream** (Phase C): capture logo + product pixels + identity; feed the maker/skin. Brandfetch + fallback.
- **Skin × engine grammar** in the cell (the frozen kit) — the generative two-axis library; still only 3 fused format docs exist.
- **`--resume` auto-clear** of a re-run stage's stale outputs.
- **Commit** — everything is uncommitted on `new-ui`; `agent/.claude/skills/cell/` is untracked (`git add` it). Per our rule: commit after the scene fix is run-validated.

---

## 9. Reference map

- **The rebuild plan:** `docs/PLAN_AGENT_LOOP_CRITIC_REBUILD_2026-07-01.md`
- **Prior session:** `docs/SESSION_136_INDEPENDENT_CRITIC_WIRED_AND_CELL_EXECUTION_GAPS_2026-06-30.md`
- **The winning run (validated):** `agent-loop/runs/2026-07-01-05-18-52_thewholetruthfoods-com/` — `cell-output.md`, `verdict.md` (take-critic), `render-verdict.md` (render-critic, FAIL→structural), `DONE.md`, `images/` (the rejected render + the retry), `trace.jsonl`.
- **Anthropic research (why no positive examples in the cell):** `docs/anthropic-learnings/00-genericness-conclusion.md:119`, `02-prompting-reasoning.md`, `04-skills-sdk-production.md`.
- **SDK docs used:** `claude_sdk/subagents.md`, `session_management.md`, `hooks.md`, `How-the-agent-loop-works.md`, `streaming_input.md`.
- **Frozen DR kit:** `docs/research/ad-library/DR-FORMAT-KIT-FROZEN-2026-06-16.md`.
- **Code:** `agent-loop/{run,pipeline,stages,hook,trace}.ts`; binders `agent/.claude/skills/cell/` (symlinked into `agent-loop/plugin/creative-binders/skills/`).
