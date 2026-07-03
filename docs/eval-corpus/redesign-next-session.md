# First-Principles Redesign — Next Session

**Created:** 2026-05-16
**Purpose:** Brief handoff so the next session can resume cold.

---

## Where we are

The first-principles agent redesign (`first-principles-redesign.md`) has **Q1–Q4 LOCKED:**

- **Q1** — identity: a senior performance marketer accountable for a decision-ready Meta test every run.
- **Q2** — deliverable: a **Test Brief** (The Bet · Test Cells · Run Plan · Next Move). *Amended 2026-05-16 — competitive scan is best-effort.*
- **Q3** — input contract: founder owes only what the agent can't derive; collected via `AskUserQuestion`.
- **Q4** — reasoning model: ONE orchestrator `query()` loop, **9 steps** (A intake → I assemble), hub + files + sealed-room subagents, three evaluation points (Bet critic, cell code-checks, completeness-lock), model-per-step.

Full detail in `docs/eval-corpus/first-principles-redesign.md`. State also in memory `project_first_principles_redesign.md`.

---

## Next session — two items to discuss

### 1. Q5 — Feedback loop (the last framing question)

**Pre-noted:** Round 2 (variants of a *winning* angle) depends on the agent knowing round-1 performance — i.e. the founder feeding results back in. Q5 must define how that data returns.

Open questions to work through:
- **How does round-1 data get back in?** Founder types the numbers? Uploads a screenshot? Meta API integration? (Confidence ladder from Q2: founder's own data is ground truth.)
- **What does the agent do with it** — the round-2 Test Brief logic (scale winner → test variants on one axis; kill losers; if all flat, next angle).
- **Two distinct loops to separate:** (a) per-campaign round-1 → round-2; (b) per-user *learned preferences* across campaigns — see memory `feedback_loop_architecture.md` (CLIP embeddings + Vectorize + reach-as-gold, designed not built).
- **Interaction with "New Campaign from Existing"** (research reuse) — does the feedback loop ride on that flow?

### 2. Per-step skill rebuilds (downstream implementation task)

**Locked principle:** skills = **judgment, not procedure** — the agent's senior-marketer brain (taste + worked good/bad examples with reasoning), not a checklist.

- Skills to rebuild, one per step that needs expertise: **research, strategy (new), hook, art, ad-unit (new), run-plan (new)** + the Bet-critic rubric.
- **Gated:** a skill serves a step — each step must be spec'd precisely before its skill can be written well. The 9 steps are named but not yet detailed.
- This is implementation work; sequence it **after Q5**.

---

## Quick pointers

- Living doc: `docs/eval-corpus/first-principles-redesign.md`
- Leak map (the "why"): `docs/eval-corpus/leak-map-2026-05-15.md`
- Invariants: 6-cluster taxonomy + F1–F6 floor checks (`axial-coding-SYNTHESIS.md`)
- Current agent: `cloudflare/sandbox/agent-runner.ts`, `orchestrator-prompt.ts`, skills in `agent/.claude/skills/`
- Target: floor pass 22% → 50%+. Pre-launch blocker.
