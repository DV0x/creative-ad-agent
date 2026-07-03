# PLAN — Agent-loop critic rebuild: orchestrator-launched critics, cell split

**Date:** 2026-07-01
**Status:** PLAN — awaiting sign-off. No code touched yet.
**One line:** Fix the nested-subagent deadlock *without* sacrificing the flexible orchestrator — by promoting both critics to **orchestrator-launched** stages (depth-1, where async actually works) and splitting the cell so a critic can run between generate and render.

---

## 1. Why (the bug, and the constraint)

A full validation run **deadlocked** (7 hrs wedged, no creative). Root cause, proven three ways (trace + finished run + a standalone probe):

- Subagents in SDK **0.3.195 run in background/async mode by default** — `background: false` does **not** force sync (probe confirmed). A launch returns *"Async agent launched… you'll be notified,"* not the result.
- Completion notifications are pushed to the **top-level session only.** So when the **cell** (itself a subagent) spawned the **critic** (a *nested* subagent, depth-2), the critic's "done" reached the orchestrator, never the cell. The cell waited passively for a ping that never came → deadlock.
- The orchestrator's *own* launches (research→comp→strategy→cell, all depth-1) completed fine — because the orchestrator **is** top-level and gets the pings.

**Constraint (locked):** keep the **flexible LLM orchestrator.** A host-sequenced rewrite (hardcoded stages + `while` loops in `run.ts`) was considered and **rejected** — it makes the orchestrator rigid, against the intended "orchestrator = adaptive hub" design.

**The fix follows directly:** make *every* launch depth-1 (orchestrator → subagent). No nesting anywhere.

---

## 2. The shape

```
research → comp → strategy
   → cell-generate ──► take-critic ──► WINNER  → cell-render ──► render-critic ──► PASS → finalize
                          │                          ↑                               │
                          │ REJECT ALL               │ FAIL (re-render)              │
                          └──► re-mine (max 3) ───────┘ (max 1) ◄────────────────────┘
                               then flag upstream        FAIL (structural) → flag now
```

**Principle:** the orchestrator launches *all* stages and *both* critics — it stays the brain, reasoning about the flow and the retries. The cell no longer spawns anything.

---

## 3. Stages

The cell splits into two; the critics become ordinary orchestrator-run stages.

| Stage | Reads | Does | Writes |
|---|---|---|---|
| **cell-generate** | thebet.md, research.md, competitors.md (+ verdict.md on a re-mine round) | match format / freestyle · mine way-ins · develop ~5 takes · mechanical self-check | `takes.md` |
| **take-critic** | thebet.md, takes.md, **counterexamples.md** | judge on conversion + swap-test; kill/rank; mark each kill *re-mine sharper* / *dead* | `verdict.md` |
| **cell-render** | takes.md, verdict.md (the winner) (+ render-verdict.md on a re-render) | freeze the shot spec · compile the prompt · bind product ref · render once | `shotspec.md`, image, `cell-output.md` |
| **render-critic** | shotspec.md, **counterexamples.md**, the image, the product ref | judge pixels: spec fidelity + performance bar; PASS or named diffs (*re-render* / *structural*) | `render-verdict.md` |

*(cell-output.md is written by cell-render as the creative record; render-verdict.md rides alongside as the QA. Assembly detail flagged in §7.)*

---

## 4. Retry logic (orchestrator-managed — the flexible part)

**take-critic → REJECT ALL:** orchestrator re-triggers **cell-generate**, handing it the critic's reasons. The cell **re-mines NEW takes** — *re-conception, not polish* — digging the same winnable want deeper (for *re-mine sharper* kills) and dropping the *dead* ones. **Cap: 3 rounds.** Three clean batches all rejected ⇒ the problem is the **room/strategy**, not execution ⇒ orchestrator **stops and flags upstream** (never grinds).

**take-critic → WINNER:** proceed to cell-render.

**render-critic → FAIL:**
- *re-render* diffs (the prompt can fix it) → orchestrator re-triggers **cell-render** with the diffs. **Cap: 1** — because *every render is a paid fal.ai generation* (money + ~1 min each), unlike the cheap text re-mine.
- *structural* diffs (the spec/concept is wrong) → **flag immediately**, no re-roll.

**render-critic → PASS:** finalize.

**Asymmetry is deliberate:** generous where it's cheap (3× text re-mine), tight where it costs money (1× render).

---

## 5. Critic fixes (both critics)

1. **Give both the counterexample bank.** Today the take-critic's rubric *assumes* it's "handed the counterexample bank," but its I/O prompt says *read ONLY thebet.md + takes.md* — so the concrete anti-examples (gym-bro-mid-flex, marble flat-lay, powder-splash…) **never reach it**; it judges "is this a cliché?" from its own generic sense. Fix: add `references/counterexamples.md` to **both** critics' reads (it's already copied into cwd). Take-critic → runs the category-look test against the real list; render-critic → catches category-look drift the spec's forbid list didn't pre-anticipate.
2. **Feedback = diagnosis, not prescription.** The critic **quotes what killed each take** and marks *re-mine sharper* / *dead*. It never says "do X instead" — it can't add sharpness a take lacks; only the cell can go mine it.
3. **"Sharper" = new, deeper truth** from research/brand, not a polished version of the same take (polishing generic → prettier generic; the judge-ceiling trap).

---

## 6. Files touched

- **`stages.ts`** — split `CELL` → `CELL_GENERATE` + `CELL_RENDER`; remove the cell's "spawn the critic / spawn the render-critic" instructions (the orchestrator does it now); add `counterexamples.md` to both critics' read lists; move the 2→3 round-cap language out of the cell (it's the orchestrator's now).
- **`pipeline.ts`** — rewrite the **orchestrator prompt**: it now sequences cell-generate → take-critic → cell-render → render-critic and owns the two retry loops (3 / 1) + the flag-upstream calls. Register `cell-generate` + `cell-render`; the two critic agent-defs stay registered (now orchestrator-invoked). Make the **async-handling explicit** in the orchestrator prompt (*"a launch returns 'async launched' — wait for the completion notification, then confirm the deliverable file exists before proceeding; never give up waiting"*) to prevent the orchestrator repeating the cell's give-up mistake.
- **`run.ts`** — expand the cell in the stage `order` into its sub-stages; unchanged otherwise.
- **`hook.ts`** — largely unchanged: the no-double-launch guard and the async-task budget case are **still needed** (the orchestrator still launches async subagents). Minor.

**Preserved intact:** all binder work — #1 (templatization: examples removed, derive-from-claim hardened), #3 (performance bar + CTA + gate assertions), #2 (render-critic rubric + shotspec.md handoff). The #2 wiring gets *reorganized* into a stage, not thrown away. Trace logging, MCP, OAuth all stay.

---

## 7. Open decisions (need your call)

1. **Orchestrator model.** It now does real reasoning — conditional retries, round-counting, async coordination across 7+ launches. Today it's **Haiku** (a cheap router). Recommendation: **bump to Sonnet** for reliability; Haiku may fumble the branching. Your call.
2. **cell-output.md assembly.** Simplest: cell-render writes it (sections 1–6), render-verdict.md is the sibling QA file, orchestrator's final summary references both. Alternative: a tiny `cell-finalize` step merges the render-critic verdict into cell-output.md §7. I lean simplest (no extra stage). Confirm.

---

## 8. Residual risk (honest)

This design keeps the **orchestrator doing LLM-managed async coordination** — inherently less bulletproof than host-sequencing (which we rejected for rigidity). It *worked* for 4 stages this run; we're adding critics + branching. Mitigations: explicit async-wait instructions in the prompt (§6), a capable orchestrator model (§7), and the deliverable-file check before each step. If the orchestrator ever fumbles a wait, we'd see it and can revisit — but the top-level notification path is the one that demonstrably works, unlike the nested path that broke.

---

## 9. Testing

Re-run the same TWT A/B (Run-3 inputs). Success = it **completes end-to-end** (no wedge), the take-critic + render-critic both fire as orchestrator stages, and we finally get the cell-cluster evidence we were after: no marble-kitchen clone (#1), legible hero + on-image CTA (#3), render-critic catches pixel misses (#2).

---

## 10. Sequence of work

1. `stages.ts` — split the cell, add the bank to both critics, strip the cell's critic-spawns.
2. `pipeline.ts` — orchestrator prompt (sequence + retries + async-wait), register the new stages.
3. `run.ts` — stage-order expansion.
4. `tsc --noEmit`, then the validation re-run.
