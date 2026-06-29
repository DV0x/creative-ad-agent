# SESSION 134 — Agent-loop Phase 1 built + first full run + cell conversion-spine audit

**Date:** 2026-06-29
**One line:** Built the new multi-agent loop in `agent-loop/`, got the **full pipeline running end-to-end** (research → comp → strategy → cell + render, $3.20, 32 min, real sourced output), and **audited why the creative drifts to branding** — landing a redesign blueprint. **Next session: do the conversion-spine redesign, then another run.**

---

## What got done this session

1. **Phase 0 verify-gate CLEARED** — pinned `@anthropic-ai/claude-agent-sdk@0.3.195`; all 6 load-bearing capabilities confirmed on the Max login (programmatic `agents`, `plugins`, `outputFormat`, subagent-MCP-approval, OAuth, adaptive-thinking-on-Opus). Findings: **zod v4** is a hard peer, **`strictMcpConfig:true`** needed for hermetic MCP, plugin skill name resolves bare. (Plan §3a.)
2. **Trace logger built + verified** — `agent-loop/trace.ts` → `trace.jsonl` + `summary.json` + `trace.md`, attribution via `parent_tool_use_id`, anomaly flag for orchestrator-direct-MCP. (Plan §8a.)
3. **Phase 1 standalone spine built** in `agent-loop/`: orchestrator + 4 binder-subagents + 4 MCP servers + caps/modes + the PreToolUse hook + the trace logger. Typechecks clean.
4. **The streaming-input finding (load-bearing)** — a plain string prompt = *single-message mode*, which **kills the in-process MCP bridge ("Stream closed") and disables hooks**. Fix = **Streaming Input Mode** (async generator held open until the final deliverable exists). **This REVERSES Phase-0's "drop the async-generator" note.** (Plan §8b.) Cascade: fixing MCP also eliminated research's over-fetch (it had been crawling to compensate for dead perplexity).
5. **Research stage validated** end-to-end (34KB sourced `research.md`, real grounded data, no fabrication).
6. **First FULL pipeline run** (TWT, surface mode): all 4 deliverables + 1 rendered ad, **$3.20, 32 min, 0 anomalies**. ScrapeCreators pulled real competitor ads (user supplied a new API key mid-session). Output = "The Stranger's Certificate."
7. **Cell conversion-spine audit** — the ad was structurally-correct DR but actually **branding**. Traced the cause through every layer → `docs/CELL_CONVERSION_SPINE_AUDIT_2026-06-29.md` (full diagnostic + redesign blueprint + reusable method).

---

## Current state

- **`agent-loop/` runs end-to-end.** It is **isolated** (its own `node_modules`, SDK 0.3.195 + zod 4); the old `server/` is untouched.
- **How to run:**
  ```bash
  cd agent-loop
  npx tsx run.ts https://thewholetruthfoods.com                       # full pipeline, surface mode
  npx tsx run.ts https://thewholetruthfoods.com research --mode surface   # one stage
  ```
  Reads `../.env.local` (PERPLEXITY_API_KEY, SCRAPECREATORS_API_KEY) + `../.env` (FAL_KEY), strips `ANTHROPIC_API_KEY` → Max-login OAuth. Output → `agent-loop/runs/<stamp>_<brand>/` (deliverables + `images/` + `trace.{jsonl,md}` + `summary.json`).
- **Last run dir:** `agent-loop/runs/2026-06-29-12-52-54_thewholetruthfoods-com/` (the audited "Stranger's Certificate" run).
- **Models:** orchestrator = **Haiku 4.5**; all 4 stages = **Sonnet 4.6** (kept at Sonnet deliberately — testing wiring, not quality). Opus 4.8 is available (SDK supports it) for a future bump (cell + the critic).
- **Nothing committed** — all `agent-loop/` work + the two docs are uncommitted on branch `new-ui`.

## Load-bearing facts to remember (don't re-learn these)

- **Streaming Input Mode is REQUIRED** (`pipeline.ts`) — never a plain string prompt; the generator holds open until the LAST stage's deliverable file exists (not the first `result` — closing on a segment re-breaks it).
- **Caps live in the HOOK** (`hook.ts`), NOT `maxTurns` — `AgentDefinition.maxTurns` is **not enforced** in 0.3.195. Gathering cap keyed by `agent_id ?? agent_type` with a `defaultCap` (surface 15 / deep 35). The hook also blocks orchestrator-direct MCP + stage re-launch.
- **`strictMcpConfig:true`** = hermetic MCP (else ambient claude.ai connectors leak in).
- **zod v4** peer (agent-loop is on zod 4; `server/` is still zod 3 — a Phase-2 migration concern).
- **No independent critic yet** — the cell self-critiques **inline** (v1 limitation). The planned independent critic is plan §7 (separate `query()` A vs nested B), Opus.
- **No product reference** in URL-only runs → cell renders text-to-image → the pack label garbles. To test bound-product, drop a `runs/<id>/refs.json` (`{references:[{falUrl, localPath, fileId}]}`) before the cell stage.
- Subagents run as **async background tasks** → the stream emits multiple `result` segments + `SendMessage`. Consume the full iterator.

---

## NEXT SESSION — two tasks

### 1. The conversion-spine redesign (primary)
Blueprint: **`docs/CELL_CONVERSION_SPINE_AUDIT_2026-06-29.md`**. Core finding: the cell is a strong non-genericness engine with **no conversion spine** — the objective leaks at brief → strategy promise → the shared "room" → cell copy-derivation → critic. **Keep the genericness engine; add the conversion spine.** Recommended order:
- **(a) The shared "room" (keystone).** Redefine the handoff unit on both sides — `strategy/SKILL.md:189` ≡ `cell/SKILL.md:28` — to carry the **conversion action/objective** alongside who · promise · proof · mandatories.
- **(b) Strategy promise.** Reframe the promise as the **buying argument** (want → *why you buy*, backed by proof), not "the want as a provable claim" (`strategy/SKILL.md:232,255`).
- **(c) Cell.** Add the proof → buying-argument → **conversion-action** step; CTA = the conversion action; proof *serves* the buy. Harden the testimonial **material gate** ("PROOF = a real customer quote") so institutional proof can't shoehorn in (or add a credential format).
- **(d) The critic.** Wire the **independent** critic (§7) **and** give it a **conversion kill-test** ("branding ad in DR clothing → fail").
- Note: also consider binding a **real product photo** next run (the URL-only run starved the cell → garbled label).

### 2. Another full run to validate
After the redesign, re-run the full pipeline (TWT again for A/B against this run, or a fresh brand). Watch: does the cell now produce a **conversion-shaped** ad (buy-CTA, customer-proof / UGC where the angle wants it) instead of a branding document? Compare against the gold `twt-testimonial-prompt-v13`.

### Deferred (from the plan, not this session's focus)
- **Deep mode = parallel research gatherers → synthesizer** (the "parallel subagents for deep research" idea — design discussed, not built).
- **Phase 2** — wire `agent-loop` into the server (WS + SQLite), behind a new entry point.
- **"2 renders"** — the cell currently ships 1 finished ad (its winning concept); 2 distinct concepts = a small cell tweak.

---

## Pointers
- **Plan:** `docs/PLAN_LOCAL_AGENT_SDK_REBUILD_2026-06-29.md` (Phase 0 §3a, streaming §8b, trace §8a, critic decision §7).
- **Audit + blueprint:** `docs/CELL_CONVERSION_SPINE_AUDIT_2026-06-29.md`.
- **Code:** `agent-loop/{run,pipeline,stages,hook,trace}.ts`, `agent-loop/mcp/*`, `agent-loop/plugin/creative-binders/` (binders symlinked from `agent/.claude/skills/`).
- **Binders under redesign:** `agent/.claude/skills/{cell,strategy}/`.
- **Last run:** `agent-loop/runs/2026-06-29-12-52-54_thewholetruthfoods-com/`.
