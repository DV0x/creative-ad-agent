# Plan — Rebuilding the Local Agent on the New Agent SDK

**Date:** 2026-06-29
**Status:** Phase 0 cleared (pinned `@anthropic-ai/claude-agent-sdk@0.3.195`, §3a). **Phase 1 IN PROGRESS (2026-06-29)** — `agent-loop/` built; **research stage validated end-to-end** on a real brand (34KB sourced research.md). Key Phase-1 finding: must use **Streaming Input Mode** (§8b) — reverses the Phase-0 "drop the async-generator" note. **Next: full run (comp → strategy → cell + 2 renders).**
**Scope:** Rebuild the `server/` agent loop as a multi-agent pipeline on the current Claude Agent SDK (target **0.3.x**), for **LOCAL runs only** (OAuth on the Max subscription; no production, no API key).
**Method note:** every SDK claim below was verified against the local `claude_sdk/*.md` docs via parallel `claude-sdk-guide` passes (2026-06-29) and cross-checked against the existing `server/` code. Citations are inline as `file:line`.

---

## 0. The one-line shape

A code-light **LLM orchestrator** runs four specialist **subagents** in sequence — research → comp → strategy → cell — then a **critic** checks the cell's output. The orchestrator is smart about *what to run*: a fresh brand URL runs all four; a follow-up like "change the hook" runs only the needed one(s), reusing existing artifacts. That flexibility is the whole reason we use an LLM orchestrator and not a hardcoded loop — it's the fix for the "follow-ups always full-regen" UX bug.

```
your server code
 └─ orchestrator query()              ← one LLM; routing brain = its systemPrompt
      tools: Read, Glob, Agent          (it routes; it does not produce)
      ├─ Agent("research")  → binder(skill) · haiku    · perplexity
      ├─ Agent("comp")      → binder(skill) · …        · perplexity + scrapecreators
      ├─ Agent("strategy")  → binder(skill) · …
      └─ Agent("cell")      → binder(skill) · stronger · nano-banana + refs
 └─ critic                            ← checks cell output (placement = open decision §7)
```

---

## 1. Why this shape

- Programmatic `agents:` is the **doc-recommended** SDK pattern for multi-agent apps (`subagents.md:22`).
- An LLM orchestrator can route intelligently (re-run only what a follow-up needs); a fixed code sequence can't.
- The cost: invocation order is **not SDK-guaranteed** — the orchestrator LLM decides (`subagents.md:24,208,215`). We steer it via the prompt and can hard-enforce with a hook (§4).

---

## 2. Auth — OAuth only

- Local-only → use the **Max subscription login (OAuth)**. No `ANTHROPIC_API_KEY`, no fallback.
- **Make OAuth actually win:** if `ANTHROPIC_API_KEY` is present in the process env, the SDK/CLI prefers it over the login. So: don't load it from `.env` for this runner, and if we pass `options.env`, spread `process.env` *minus* that key (note TS `options.env` **replaces** the environment — `observability.md:27`). The SDK-spawned CLI inherits the login from the normal home/`~/.claude`.
- **Billing meter:** the "monthly Agent SDK credit" announced for 2026-06-15 (`overview.md:9-11`) is **paused** per the linked support article ("for now, nothing has changed"). So SDK usage currently draws from the **normal Max allowance, shared with interactive Claude Code** — heavy test batches eat the same pool. No separate meter exists to watch yet.
- (The "no claude.ai login for products" rule — `overview.md:97-98` — does **not** apply: we're local-only, not shipping a product on it.)

---

## 3. SDK upgrade + the VERIFY GATE — do this first

- Current: `server/package.json` pins `^0.1.54` → resolves **0.1.77**. That predates `agents:`, `outputFormat`, `plugins`, and adaptive thinking entirely.
- Pin an **exact recent 0.3.x** (never floating `"latest"`).
- **Gate (Phase 0 smoke test):** the docs are version-un-tagged, so confirm empirically on the pinned version that these exist and behave: programmatic `agents:`, `outputFormat`, `plugins`, adaptive-thinking-on-Opus, and a **subagent MCP call approving headlessly**.
- Breaking changes to handle on the 0.1.77 → 0.3.x jump:
  - `options.env` **replaces** `process.env` in TS — always spread it (`observability.md:27,96`). (Load-bearing for the OAuth env handling above.)
  - `Task` → `Agent` tool rename — list/parse **both** names (`subagents.md:304`).
  - `TodoWrite` is **still the default** (Task tools are opt-in via `CLAUDE_CODE_ENABLE_TASKS=1`) — leave as-is; the old audit's "TodoWrite deprecated" was wrong.
  - `thinking` default is `{type:'adaptive'}` for Opus 4.6+ — drop `maxThinkingTokens`; don't send the old thinking shape.
  - Pin `settingSources` **explicitly** (the omitted-default is ambiguous across doc versions).
  - peerDeps — **CONFIRMED (Phase 0): SDK 0.3.195 requires `zod@^4`** as a peer; `server/` is on `^3.22.4`. (`@anthropic-ai/sdk`, `@modelcontextprotocol/sdk` resolve transitively.)

---

## 3a. Phase 0 — GATE CLEARED ✅ (2026-06-29)

Pinned **`@anthropic-ai/claude-agent-sdk@0.3.195`**. Isolated smoke test on the Max login (no API key) confirmed all six load-bearing capabilities:

| Capability | Result |
|---|---|
| Subscription-login auth, no API key | ✅ real Opus calls succeed with `ANTHROPIC_API_KEY` deleted; init reports `apiKeySource:"none"` (no key = login auth). Cost reported is notional, billed to Max. |
| Programmatic `agents:` | ✅ orchestrator launched the subagent |
| `plugins` + `AgentDefinition.skills` preload | ✅ binder loaded from a local plugin, ran clean |
| Subagent `mcp__` approves headlessly via top-level `allowedTools` | ✅ `mcp__test__ping`→`pong`, zero `permission_denials` |
| `outputFormat` (query-level, schema-validated) | ✅ verdict returned in `result.structured_output` as a clean object |
| Adaptive thinking on Opus (`claude-opus-4-8`) | ✅ no 400; `api_error_status:null` |

**Findings that change the build:**
- **zod v4 is a hard peer** (above). The four MCP servers use only a stable zod surface (`z.string/array/enum/object/number/boolean`) → low-risk port; the broader `server/` zod-3 migration is a **Phase 2** task.
- **~~Drop the async-generator stdin trick~~ → REVERSED (Phase 1 — see §8b).** A *quick* subagent MCP call worked with a plain string prompt, but on a *long* run the in-process MCP bridge dies ("Stream closed") and hooks never fire — single-message mode supports **neither**. The held-open async generator (Streaming Input Mode) is **required**.
- **Plugin skill name resolves bare** — `skills:['research']` worked (also exposed as `creative-binders:research`); the `plugin:skill` fallback isn't needed.
- **`settingSources:[]` works, but does NOT cover account-connected MCP.** File-based servers (`pencil`; a project's `perplexity`) were correctly excluded; three `claude.ai` connectors (Gmail/Drive/Calendar) leaked in via the **account-login** channel. **`strictMcpConfig:true` strips them** to exactly our declared servers and does **not** break our own MCP or subagent MCP-by-name. **→ add `strictMcpConfig:true` to the orchestrator options.**

Smoke artifacts live in `scratchpad/phase0/` (throwaway; `server/` untouched).

---

## 4. The orchestrator

- One top-level `query()`. Custom **`systemPrompt` = the routing brain** (Pattern A — the only shape with worked examples; `subagents.md:56,111`).
- Tools: `["Read","Glob","Grep","Agent","Task"]` — it routes and inspects current state; it does **not** produce (no `Write`, no MCP — those live in the subagents).
- **Routing policy** (encoded in the systemPrompt):
  - fresh brand URL → invoke research → comp → strategy → cell, **one subagent per turn, in order**;
  - follow-up → invoke only the needed subagent(s) and reuse existing artifacts.
- Order is steerable, not guaranteed. **One `PreToolUse` hook, two jobs** (`hooks.md:239`): (1) **deny any `mcp__*` call whose `parent_tool_use_id` is `null`** → hard-blocks the orchestrator from calling MCP directly (the structural guarantee §6 can't give); (2) **deny out-of-order / concurrent `Agent` calls** → locks the fresh-run sequence and forces one-subagent-at-a-time (load-bearing for the file handoff — see §8 async-task finding + §9).
- **Context to a subagent** = the `Agent` call's `prompt` string only (the sole parent→subagent channel; subagents see no parent history — `subagents.md:193`). The orchestrator composes it with artifact **file paths** + the specific decision (e.g. "reuse research at `<path>`, comp at `<path>`; regenerate only the hook").

---

## 5. The four subagents

Each is an `AgentDefinition` in the top-level `agents:{}` map:

| field | value |
|---|---|
| `prompt` | a **thin role line** (required field) — the binder carries the actual method |
| `skills` | `['<binder>']` — **preloads** the binder skill at startup (deterministic; `subagents.md:169`) |
| `model` | research/comp/strategy → haiku/sonnet · cell → stronger |
| `tools` | `Read`, `Write`, its `mcp__*` tool(s) — **no `Agent`/`Task`** (keep it a leaf node — see §7 exception), **no `Skill`** (preload bypasses it) |
| `mcpServers` | its subset, by name (§6) |
| `maxTurns`, `effort` | per stage |

### Binders = preloaded plugin-skills (LOCKED decision)
- Binders **stay as skills** (SKILL.md + reference docs) — no rewrite of the files.
- **Sealed loading:** `settingSources: []` (kills the `~/.claude` leak **and** the project-`CLAUDE.md` bleed) **+ the `plugins` option** to load the binder skills from a local path — plugins are **not** gated by `settingSources` (`Agent_skills.md:28`).
- **Packaging (one-time):** wrap `agent/.claude/skills/{research,comp,strategy,cell}` as a small local plugin (`.claude-plugin/plugin.json` + a `skills/` folder). No change to binder content.
- Each subagent **preloads** its binder via `AgentDefinition.skills` (eager, deterministic) — **not** the load-on-trigger Skill tool.
- **Reference docs** (`formulas.md`, `workflows/*.md`, `worked-examples.md`) stay on disk, read **on demand** via `Read` (each subagent keeps `Read`). Progressive disclosure → no context bloat (`Agent_skills.md:89`; `skills_troubleshooting.md:123`).
- *Doc note for the record:* the SDK's literal best-practice for an agent's *core method* is the `prompt` string, not a skill (`system_prompts.md:34`). We are deliberately keeping skills (they're built, reusable, CLI-shareable); the plugin route makes that clean.

---

## 6. MCP servers

- Four **in-process** servers (`createSdkMcpServer`): `nano-banana` + `refs` (already in `server/lib/`), `perplexity` + `scrapecreators` (**PORT** from `cloudflare/eval/mini-eval/mcp/` — verify exact filenames at build).
- Declared **once** in the orchestrator's top-level `mcpServers`. Each subagent references its subset **by name** in `AgentDefinition.mcpServers` (`typescript_sdk.md:601-609`):
  - research → `["perplexity"]`
  - comp → `["perplexity","scrapecreators"]`
  - cell → `["nano-banana","refs"]`
- ⚠️ **CORRECTED (Phase 0 probe):** the orchestrator is **NOT** structurally barred from MCP. Empirically — the main agent **can** call an MCP tool when it's in top-level `allowedTools` (Scenario B), and a subagent's MCP call **fails without** that top-level grant (Scenario C). So the grant the subagent *requires* **also co-permits the orchestrator**. (`mcp.md:148`'s "visibility ≠ capability" is the general rule, but here we *must* grant the tool, so it doesn't isolate the orchestrator.) Keep the orchestrator off MCP via (a) its **prompt** — "route, don't produce", which held cleanly in testing — and (b) the **`PreToolUse` hook** (§4) for a hard guarantee.
- **Approval rule (verified):** each `mcp__*` name goes in **BOTH** the subagent's `tools` (capability) **AND** the top-level `allowedTools` (approval). `allowedTools` is the *only* allow-list — there is no per-subagent one (`permissions.md:50`; eval order `:17-39`). This matches the prior working repo, where the MCP grant lived top-level. **No `permissionMode`** (it interfered with MCP on 0.1.77 — `server/lib/ai-client.ts:32`; re-confirm still clean on 0.3.x).
- `ENABLE_TOOL_SEARCH=false` (≤10 tools; Haiku doesn't support tool search).
- nano-banana returns image **URLs** → return as text (or fetch+base64 if the model must *see* the pixels; image blocks have no URL field). **Wrap every handler in `isError:true`** — a thrown error kills the whole stage.

---

## 7. The critic (OPEN decision — Phase 3, not a v1 blocker)

The cell's swap-test critic must be **independent + stronger** than the generator. Two doc-grounded placements:

- **(A) Separate code-fired `query()`** after the cell returns — own stronger `model`, own `outputFormat` for a **schema-validated** `{concept_id,passes,severity,confidence,failures[]}` verdict, per concept, read + acted on by *your code*. This is the **only** path to a validated verdict (`outputFormat` is query-level only; subagents can't use it — `structured-outputs.md`; `typescript_sdk.md:566-581`). **Recommended** for a measurable hard gate.
- **(B) Nested inside the cell** (subagents can nest since CLI v2.1.172) — self-contained quality loop. But a nested critic **can't use `outputFormat`**, so the verdict comes back as **text** the cell interprets (parse JSON in code if needed). If we pick B, the **cell** specifically gets `Agent` in its `tools` (the one exception to the leaf-node rule in §5).
- **Decision driver:** who acts on the verdict — your code (A) or the cell's LLM (B). Lean A for measurability/eval pass-rates. Decide when we build the cell.

---

## 8. Streaming → WS UI

- `includePartialMessages: true`.
- Subagent progress **is** visible to the app message loop (tagged `parent_tool_use_id`) even though the orchestrator *model* only sees each subagent's final summary (`overview.md:313`). Read `subagent_type` off the `Agent` tool_use block → map to the WS phase (research/comp/strategy/cell).
- **Reuse** the existing `processSDKMessage` + WS routing (`server/lib/websocket-handler.ts`).
- ⚠️ **Finding (surfaced by the trace logger, Phase 1):** in `0.3.195` the `Agent` tool launches subagents as **async background tasks even without `background:true`** — the stream carries `SDKTask*` lifecycle messages (`task_started/progress/updated/notification`) and **emits multiple `result` messages** (one per segment). **The true "done" signal is the async iterator ENDING, not the first `result`** — always consume the full `for await`. The session id is preserved throughout; the last `result` carries cumulative cost. For the **sequential handoff**, the orchestrator must launch **one subagent at a time and await its task** (the §4 hook enforces this) or comp could start before `research.md` exists. **Re-verify with the real 4-stage pipeline.**

---

## 8a. Trace logging — observability for evals (Phase 1, BUILT)

`agent-loop/trace.ts` (`TraceLogger`) consumes the same SDK message stream and writes, per run:
- **`trace.jsonl`** — the full ordered event stream (replay / deep inspection);
- **`summary.json`** — per-stage rollup (model, tool calls, MCP calls), **anomalies**, result segment count, global cost/turns;
- **`trace.md`** — a human-readable **attributed** timeline.

**Attribution = `parent_tool_use_id`:** null → orchestrator; non-null → resolves to the `Agent` launch whose `input.subagent_type` names the stage. So every tool/MCP call is pinned to the agent that made it, and a `mcp__*` call with `parent=null` is logged as an **anomaly** (orchestrator broke role). Verified in the selftest: the MCP call attributed to the `echo` subagent; anomalies = none.

**Limitation:** per-stage **cost** is *not* separable here — the single orchestrator emits cumulative `result`(s) (+ per-model `modelUsage`). For per-stage cost/quality the **mini-eval harness** (sealed per-stage queries) stays the tool. This logger covers per-stage **behavior**.

---

## 8b. Input mode — MUST be Streaming Input (Phase 1 finding, 2026-06-29)

**This reverses the Phase-0 §3a "drop the async-generator" note.** The SDK has two input modes (`streaming_input.md`): a plain **string prompt** = *Single Message Input*, vs an **async generator held open** = *Streaming Input Mode* (default/recommended). Single-message mode **does not support hook integration** (`streaming_input.md:235`) and lets the **in-process MCP bridge close** mid-run. Both work only in Streaming Input Mode (`streaming_input.md:74,77`) — holding stdin open is what lets the CLI keep calling back into the in-process MCP servers (exactly what old `ai-client.ts:193-239` did).

**Symptoms when wrong (one root cause):** perplexity returned **"Stream closed"** on every call (handler never ran); the gathering-cap **hook never fired** for the subagent; → research **over-fetched** (70–133 WebFetch), *compensating* for the dead primary engine by crawling.

**The fix (`agent-loop/pipeline.ts`):** yield the user message from an async generator and **hold it open until the LAST stage's deliverable file exists** — NOT until the first `result`. Subagents run as **async background tasks** (multiple `result` segments + `SendMessage`), so closing on the first `result` shuts stdin mid-run and re-breaks it (a bug we hit). A wall-clock hard-stop guards a stage that never writes its file.

**Cascade insight:** fixing the MCP bridge **eliminated the runaway** — with perplexity alive, research converged in **4 gathering calls** (2 perplexity batches + 2 WebFetch), far under the cap. The over-fetch was a *symptom* of dead MCP, not a binder/Sonnet problem.

**Related findings:**
- **`AgentDefinition.maxTurns` is NOT enforced** in 0.3.195 (research did 77 calls vs `maxTurns:40`). So the gathering budget lives in the **`PreToolUse` hook** (`agent-loop/hook.ts`), keyed by `agent_id ?? agent_type` with a `defaultCap` (subagent calls sometimes reach the hook with `agent_type` absent). The hook also blocks orchestrator-direct MCP + stage re-launch.
- **Sync vs async subagents** (`background`, `subagents.md:173`): blocking (default) = orchestrator waits; `background:true` = fire-and-forget, enables parallelism. Sequential pipeline wants blocking; **parallel deep-research** (deep mode) will use async fan-out → synthesizer.
- **Validated:** research stage end-to-end on a real brand — 34KB sourced `research.md`, claim-vs-reality with the gap, 76 citations, no fabrication.

---

## 9. Sessions & follow-ups

- **No resume between stages** — artifacts handed forward as **files** (docs prefer this over session resume — `session_management.md:312`).
- Two follow-up regimes:
  - **warm** (socket open) → one long-lived orchestrator `query()`, push follow-ups via `streamInput()`.
  - **cold** (user returns later, new process) → fresh `query()` with current campaign state **injected from SQLite** (matches the existing cold-start hydration pattern).

---

## 10. Reuse vs new

**Reuse from `server/` (untouched):**
- in-process MCP servers (`nano-banana-mcp.ts`, `refs-mcp.ts`)
- the async-generator prompt that holds stdin open (`ai-client.ts:193-239`) — **REQUIRED, not optional** (Phase 1 §8b): Streaming Input Mode keeps the in-process MCP bridge alive + enables hooks. `agent-loop/pipeline.ts` reimplements it (hold open until the final deliverable exists, not the first `result`).
- `processSDKMessage` + WS routing (`websocket-handler.ts`)
- SQLite persistence

**New:**
- the orchestrator loop module (replaces the single-agent `AIClient` driver)
- the four `AgentDefinition`s + the binder plugin
- ported `perplexity` + `scrapecreators` MCP servers
- (Phase 3) the critic + follow-up routing

---

## 11. Build phases

- **Phase 0 — Verify gate. DONE ✅ (2026-06-29).** Pinned `0.3.195`; all capabilities confirmed on the Max login. Discovered along the way: `strictMcpConfig:true` needed for hermetic MCP, zod v4 is a hard peer. (The "plain string prompt works" note was later **REVERSED** — Streaming Input Mode is required; see §8b.) See §3a.
- **Phase 1 — Standalone spine. IN PROGRESS (2026-06-29).** Built in `agent-loop/` (orchestrator + 4 binder-subagents + 4 MCP + trace logger + surface/deep caps + hook). **Research stage VALIDATED end-to-end** on a real brand (34KB sourced `research.md`); required the **Streaming Input Mode** fix (§8b). NEXT: full run — comp → strategy → cell + 2 renders.
- **Phase 2 — Wire the server.** Stream to WS + persist to SQLite, behind a **new entry point**. Old loop stays runnable; cut over once solid.
- **Phase 3 — Quality + follow-ups.** Add the critic (decide A vs B) and follow-up routing (warm/cold).

---

## 12. Open decisions
1. ~~Exact 0.3.x version to pin~~ → **RESOLVED: `0.3.195`** (Phase 0).
2. Critic placement — **A** (separate query, recommended) vs **B** (nested).
3. Exact per-stage models (research/comp/strategy tiers; cell's stronger model).

## 13. Verify-at-build — ALL RESOLVED IN PHASE 0 ✅ (2026-06-29)
- ✅ `agents` / `outputFormat` / `plugins` exist + behave on `0.3.195`.
- ✅ A subagent's MCP call approves via top-level `allowedTools` headless.
- ✅ `strictMcpConfig:true` does **not** interfere with our MCP — and is the fix for account-connected-MCP isolation. (`permissionMode` left unset, as planned.)
- ✅ Plugin-skill name resolves with the **bare** name (`skills:['research']`); namespaced `creative-binders:research` also exposed.
- ✅ OAuth inherited cleanly by the SDK-spawned CLI with `ANTHROPIC_API_KEY` excluded (`apiKeySource:"none"`).

## Provenance
- SDK facts: `claude_sdk/*.md` (cited inline), verified via parallel `claude-sdk-guide` passes (2026-06-29).
- Existing server: `server/lib/{ai-client,orchestrator-prompt,nano-banana-mcp,refs-mcp,websocket-handler}.ts`.
- Prior agent repo reviewed: `github.com/DV0x/creative-ad-agent` — confirms the MCP grant lives in the **top-level** `allowedTools` (the `creative-director` provisioning is a comment; no such agent file exists).
