# Session 106 — Leak map + first-principles pivot

**Date:** 2026-05-15
**Branch:** `new-ui`
**Commits:** none (eval workflow artifacts only)
**Goal:** Execute Step 1 of S105 plan (empirical leak trace), then decide go-forward strategy.

---

## TL;DR

- Step 1 of the revamp plan **shipped**: traced 5 representative failing campaigns through the agent's instruction set; produced `docs/eval-corpus/leak-map-2026-05-15.md` — one row per cluster pointing to literal file + line where each leak originates.
- All 6 floor-check leaks have a designated owner stage; no new pipeline components needed for the *patch-level* fix.
- Operational definition of "zero edit" locked: **performance-marketer ship test** = floor-rubric pass (F1-F6) + quarterly beta-client sampling check for drift.
- **Strategic pivot:** dropped Scenario B (patch the existing handoffs). User called for first-principles rethink of the whole workflow — current pipeline is a plumber, not a performance marketer; patching has a ceiling.
- 5 framing questions agreed for the rethink. Q1 (identity) becomes the keystone for next session.

---

## What happened

### Step 1 — leak trace (shipped this session)

Five parallel general-purpose subagents traced 5 failing campaigns through the static instruction surface (skills, agent prompts, orchestrator). One additional agent audited orchestrator framing. Findings synthesized into `docs/eval-corpus/leak-map-2026-05-15.md`.

#### Headline findings (full detail in leak-map doc)

| Floor check | Leak location | Leak type |
|---|---|---|
| F1 brand | `agent/.claude/agents/research.md:22-81` + Rules `:217-225` | absent — no redirect detection, no resolved-URL output, no locale verification |
| F4 hook-in-image | `art-style/workflows/lifestyle-render-hybrid.md`, `service-realism.md`, `editorial-cutout.md` | wrong-instruction — "10% text max / minimal overlay" assumes a post-overlay step that doesn't exist |
| F5 refs deployed | `art-style/SKILL.md:151-198` (Step 2.5 orphaned) + 14 workflows with zero ref mentions | absent — Step 2.5 never re-stated in workflow templates |
| F5 ref-gate | both orchestrator-prompt.ts files | absent — only reverse-direction ref logic; no vertical detection; no upload prompt |
| F2 locale | `hook-methodology/SKILL.md:50-213` + `formulas.md:46` USD canonical | absent + biased exemplars — zero locale instruction; only USD examples |
| F6 CTA | `hook-methodology/SKILL.md:297-318` Step 4 CTA table | **wrong-instruction** — actively downgrades imperatives ("Apply now" labeled WEAK → "Get your answer") |
| Framing | `orchestrator-prompt.ts:6` (both files) | frame-drift — "You coordinate a 2-agent + skills system" = generic plumber, no audience, no judgment frame |

#### Cross-cutting patterns the leak map exposes

1. **Workflow files are self-contained → upstream contracts get orphaned.** Step 2.5 (ref roster) + locale extraction live in SKILL.md but are never re-stated in the workflow templates that actually produce `prompts.json`.
2. **Exemplars matter as much as rules.** Hook skill has zero locale instruction AND zero non-USD examples.
3. **The orchestrator owns nothing.** No vertical detection, no shippability gate, no reject-and-retry. Every fix requiring *judgment at the seams between stages* has nowhere to live today.
4. **Plumbing for refs is intact end-to-end** (D1 → R2 → fal → MCP edit endpoint). The break is purely the instruction surface.

#### Bonus finding (separate hygiene bug)

`cloudflare/sandbox/orchestrator-prompt.ts` and `server/lib/orchestrator-prompt.ts` have drifted. Server is stale: missing per-slot indexing, `targetImageIndices`, `hookTypes`, one-call-per-image rule, and iteration rules (Rules 6-7 in cloudflare). Local dev behaves differently from staging/prod until re-synced. Track separately.

### Operational definition locked

**Performance-marketer ship test** = output is zero-edit-shippable if it passes all 6 floor checks (F1-F6) + quarterly beta-client sampling check for drift detection.

Rationale: ties directly to the Type A eval lens (`feedback_eval_type_a_lens`), is code-checkable today via `cloudflare/scripts/floor-graders.ts`, and includes a slow human drift check for things code can't measure.

### Strategic pivot — Scenario B → first-principles rethink

S105 locked Scenario B (patch the existing pipeline via faithfulness handoff contracts). After reading the leak map, user called for a first-principles rethink of the whole workflow rather than stage-by-stage patches.

**Why the pivot is right:**
- Leak map proved current pipeline is structurally a plumber, not a performance marketer
- All 7 findings (6 leaks + framing) trace back to "no judgment / no gate / no critic loop"
- Patching closes specific holes but leaves the same architecture that produced them
- A first-principles redesign reuses the leak map's 6 categories as *invariants the new design must satisfy* — leak map is not wasted

**What this changes vs S105 plan:**
- Step 1 (empirical trace) — kept, done
- Steps 2-5 (research → handoff redesign → implement → prompt refinement) — paused until first-principles questions answered
- Step 2 hard cap (2 days) still applies to research, but Step 2 may happen *after* the rethink, not before
- Floor graders still the measurement instrument — 22% baseline → 50%+ target unchanged
- ~2-week estimate likely extends to ~3 weeks given rethink overhead

### The 5 framing questions for the rethink

In priority order — each question's answer cascades into the next:

1. **Identity / job-to-be-done.** What is the agent? Replacing a $5k/mo agency, an in-house junior marketer, a creative team? Is the job "make 6 ads" or "give me my next 2-week test plan"? Who can fire the agent and why?

2. **Output as deliverable.** What does the agent owe the user? A batch of creative? A test plan + variant tree? A weekly drop? What concrete artifact corresponds to "shippable to Meta with zero edits"?

3. **Input contract.** What does the user owe the agent? For each vertical, MUST-provide vs CAN-provide. Should the agent refuse to generate when essentials are missing, or generate-with-warning? Gates upstream of every leak in the map.

4. **Reasoning model (not architecture).** How does the agent think? Linear pipeline vs critic loop? Does it search Meta Ad Library for competitive context? Does it consider follow-up signal? Where does judgment live?

5. **Feedback loop.** How does the agent learn? Does it see what shipped vs what didn't? Where do floor graders feed back into the agent's own reasoning? Multimodal CLIP + reach-as-gold (already designed, see `feedback_loop_architecture` memory) plugs in here.

**Q1 is the keystone.** Without an identity answer, Q2-Q5 will be inconsistent.

#### Practical version of Q1 for next session

> Write one paragraph describing what a senior performance marketer hired by a beta-client D2C founder (e.g., the Hyderabad hotel or the edu consultancy) would do in their first week, including everything our agent doesn't do today. That paragraph becomes the agent's job description.

---

## What carries forward from S105

| S105 artifact | Status |
|---|---|
| 6-cluster locked taxonomy | ✓ still authoritative; the 6 categories are invariants any redesign must satisfy |
| 6 floor checks (F1-F6) | ✓ still authoritative; measurement instrument unchanged |
| 22% floor baseline | ✓ unchanged baseline |
| 50%+ floor target | ✓ unchanged target |
| `cloudflare/scripts/floor-graders.ts` | ✓ still the measurement script |
| Scenario B handoff redesign decision | ✗ **superseded** by first-principles rethink |
| Step 1 empirical trace | ✓ done this session (output: leak-map doc) |
| Steps 2-7 of the 2-week plan | ⏸ paused; sequencing depends on first-principles answers |

---

## Files touched this session

```
docs/eval-corpus/leak-map-2026-05-15.md                         — NEW (leak map, 6 clusters + framing)
docs/SESSION_106_LEAK_MAP_AND_FIRST_PRINCIPLES_PIVOT_2026-05-15.md — this file
```

No code commits. No memory updates this session.

---

## Open questions surfaced (still unresolved)

Carried from S105 + new this session — these probably resolve themselves during the first-principles rethink rather than as standalone decisions:

1. **F1 confirmation UX** — when domain redirects (mamaearth.in → .com), halt-and-ask vs generate-both vs extract-original-and-flag?
2. **F5 gate strictness** — for visual-first verticals without refs, refuse-to-generate vs generate-with-warning?
3. **Framing rewrite timing** — apply one-liner to orchestrator now or wait for redesign? (Likely subsumed by Q1 answer.)
4. **Server/cloudflare orchestrator drift** — separate hygiene PR now or roll into redesign? (Separate from the eval workflow — track as engineering ticket.)

---

## Next session opener

> Resume first-principles agent redesign. Read in this order:
> 1. `docs/SESSION_106_LEAK_MAP_AND_FIRST_PRINCIPLES_PIVOT_2026-05-15.md` (this file)
> 2. `docs/eval-corpus/leak-map-2026-05-15.md` (Step 1 output)
> 3. `docs/eval-corpus/axial-coding-SYNTHESIS.md` (locked taxonomy from S105)
>
> We agreed on 5 framing questions for the rethink: identity / output deliverable / input contract / reasoning model / feedback loop. Start with **Q1 (identity)** — it's the keystone.
>
> **Concrete Q1 task:** write one paragraph describing what a senior performance marketer hired by a beta-client D2C founder (Hyderabad hotel or edu consultancy) would do in their first week, including everything our agent doesn't do today. That paragraph becomes the agent's job description. The 6 cluster invariants + 6 floor checks from S105 are constraints any redesign must satisfy.
>
> Procrastination risk flag: if you find yourself avoiding the rethink for more than a day or two, sit down and answer Q1 imperfectly — a rough answer beats no answer. Floor baseline is 22%; nothing moves until this is locked.

---

## Open punch list — eval workflow

- [x] Step 1 leak trace
- [ ] Answer Q1 (agent identity / JTBD) — next session
- [ ] Answer Q2-Q5 (deliverable / input contract / reasoning model / feedback loop)
- [ ] Map first-principles answers back to leak map — verify all 6 cluster invariants satisfied
- [ ] Decide: full redesign vs hybrid (keep some, redesign others)
- [ ] Time-boxed external research (Meta rules + competitive — S105 Step 2, may run before or after Q1-Q5 depending on answers)
- [ ] Ship redesign; track floor-grader lift after each meaningful commit
- [ ] Target 50%+ floor pass rate
- [ ] (Lower priority) Fix grader calibration: F3 number normalization, F1 URL fallback patterns, F6 CTA extraction fallback
- [ ] Q3-ceiling rubric — after floor stabilizes
- [ ] Q4-ceiling LLM-judge graders (4b semantic fab, 5 template hooks, 6b channel mismatch)
- [ ] Q5 regression suite

## Open punch list carried unchanged (deferred non-eval work)

WS 1006 structural fix · Followup intent classification · Aspect-ratio drift · `new-ui` 135 commits ahead of master · Rotate prod Clerk Secret Key · Multi-reference selective replace Phase 1.1 · PR 2 undo/redo UI · **server/cloudflare orchestrator-prompt drift (new this session)**
