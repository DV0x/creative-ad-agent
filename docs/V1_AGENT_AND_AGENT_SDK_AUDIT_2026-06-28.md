# v1 Agent on the Claude Agent SDK — Audit & SDK-Delta Reference

**What this is.** A detailed audit of the *existing v1 ad-creative agent* exactly as it is built on the Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`), plus a version-tagged map of what has changed in the SDK since the versions this repo pins, and the implications for building the new four-apprentice loop (research → comp → strategy → cell) locally on the SDK.

**Audience.** The engineer who will wire/rebuild the loop. Every structural claim points to a file:line.

**How it was produced.** A 13-agent ultracode workflow (`v1-agent-and-sdk-audit`, 2026-06-28): 9 readers (4 over the v1 SDK code paths, 5 over the Agent SDK docs + TS/Python changelogs) → 3 synthesizers → 1 merge.

### Verification provenance (read this before acting on version numbers)
- **Confirmed against source in the repo:** the three SDK pins, the runtime `query()` option objects, the env flags, the eval ceiling comment, the MCP wiring, the streaming/persistence paths. (file:line throughout.)
- **Confirmed against npm + the installed tree (2026-06-28, this session):** latest published `@anthropic-ai/claude-agent-sdk` = **0.3.195**; **0.2.111** exists; installed today = **server 0.1.77 / cloudflare 0.2.63 / sandbox 0.2.69**. The pins: `server/package.json:13` = `^0.1.54`, `cloudflare/package.json:19` = `"latest"`, `cloudflare/sandbox/package.json:6` = `0.2.69`. The eval harness has no separate package.json — it inherits `cloudflare/`'s 0.2.63.
- **Confirmed against the bundled authoritative Anthropic `claude-api` skill:** every model ID and the adaptive-thinking 400 behavior.
- **Changelog-sourced, NOT individually re-verified against npm release notes:** the specific *feature→release* attributions (e.g. "TodoWrite→Task tools in 0.3.142", "SessionStore in 0.2.113", "MCP non-blocking default in 0.3.142"). They are internally consistent and the load-bearing one (0.2.111 unblocks Opus 4.7/4.8) is corroborated by the eval's own `run-mini-eval.ts:102-108` comment and by npm confirming 0.2.111 exists. Treat the exact minor-version of a given feature as "very likely" rather than "verified" until you read the changelog at upgrade time.

---

## Part 0 — Executive summary

**v1 is a SINGLE-agent orchestrator, not a multi-agent system.** There is exactly one `query()` call driving one Haiku model. The whole pipeline — research → 6 hooks → art direction → 6 images — is sequenced by a **raw-string system prompt** (`ORCHESTRATOR_SYSTEM_PROMPT`), not by code. The orchestrator is given `Task`, `Skill`, `TodoWrite` and walks the order the prompt dictates: spawn the research subagent (Task) → invoke `hook-methodology` (Skill) → invoke `art-style` (Skill) → call `mcp__nano-banana__generate_ad_images`. Subagents and skills load **only** because of `settingSources:['user','project']` + `cwd=agent/` filesystem discovery; the programmatic `agents:` option is **never used anywhere in the repo**. Only one agent file exists on disk (`research.md`, no `model:` → silently inherits Haiku); the live prompt wires only the **two legacy** skills (`hook-methodology`, `art-style`). The new binders (`research`/`comp`/`strategy`/`cell`) are auto-discoverable but **never driven by production** — they run only in the mini-eval harness.

**Three SDK generations coexist and their option shapes are not interchangeable:** server `0.1.77`, worker+eval `0.2.63` (floating `"latest"`), sandbox `0.2.69`. The "Sonnet 4.6 is the strongest model the eval can drive" ceiling is enforced **only** by that floating lockfile — 0.2.63 emits the old `thinking:{type:'enabled',budget_tokens:N}` shape, which Opus 4.7/4.8 reject with a 400 (`run-mini-eval.ts:102-108`). Any `npm install` silently re-pins this. **Pin it first, independent of every other decision.**

**One version unblocks Opus 4.7/4.8: `0.2.111`.** It adds the adaptive-thinking wire shape (`thinking:{type:'adaptive'}`) and the `xhigh` effort level. Opus 4.8 needs nothing beyond that (it keeps 4.7's request surface). Current latest is **0.3.195**, which also brings programmatic `agents:`, the `skills` filter option, `SessionStore`, and `excludeDynamicSections`. The 0.3.x jump crosses real walls (TodoWrite→Task tools, MCP non-blocking default, `options.env` overlay→replace, peerDependencies).

**The headline recommendation: the four-apprentice loop already exists in the right shape — and it is NOT the orchestrator, it is the eval harness.** `run-mini-eval.ts:264-283` runs each apprentice as an isolated `query()` with `settingSources:[]`, the binder inlined as `systemPrompt`, per-stage `model`/`allowedTools`/`maxTurns`/`maxBudgetUsd`, and MCP injected per stage; the judge is a separate `maxTurns:1` `query()`. **Promote the harness; don't extend the orchestrator.** Reuse the plumbing verbatim — `processSDKMessage`, `sdk-message-parser.ts`, the in-process `createSdkMcpServer` servers, and the load-bearing async-generator prompt that holds stdin open for the MCP bridge.

**On models, split the bet.** Capability isn't the blocker for research/comp/strategy (S116: failures were only *sometimes* model-shaped) — keep them on Haiku/Sonnet 4.6. The genericness conclusion says same-model self-critique blesses generic output, so the cell's swap-test critic must be **stronger** than the generator — that is the one place to pay for Opus 4.8, and the only place that actually requires ≥0.2.111. Run it as its own clean-context `query()` (no parent history), rubric inlined, `outputFormat:{json_schema}` so the verdict is a validated object. **Authoritative caveat:** Opus 4.7/4.8 follow "only report high-severity / be conservative" *literally* and depress recall — so instruct the critic to report **every** failure with confidence+severity and filter downstream, or your "independent" critic quietly becomes the generic-blessing judge you're trying to escape.

---

## Part 1 — The v1 as-built map (verified against source)

### 1.1 The shape: one agent, prompt-driven orchestration
- One `query()`, one Haiku model. No multi-agent system. The entire pipeline is sequenced by a raw-string system prompt, not TypeScript. `server/lib/orchestrator-prompt.ts:31-38` defines the strict order; `server/lib/ai-client.ts:69` wires it as `systemPrompt`.
- Orchestrator tools: `Task`, `Skill`, `TodoWrite` (+ utility/subagent tools). Sequence: research subagent (`Task`) → `Skill hook-methodology` → `Skill art-style` → `mcp__nano-banana__generate_ad_images`. **Nothing in code enforces the order — the prompt does.**
- The programmatic `agents:` option is **never used anywhere**. Every subagent is filesystem-discovered from `.claude/agents/*.md`.

### 1.2 The three runtime variants (three hand-rolled `Partial<Options>`, no shared module)

| | Local Express | Production sandbox | wrangler-dev in-process |
|---|---|---|---|
| File | `server/lib/ai-client.ts:26-76` | `cloudflare/sandbox/agent-runner.ts:97-116` | `cloudflare/src/lib/local-ai-runner.ts:230-244` |
| SDK | `^0.1.54` → **0.1.77** | **0.2.69** (exact) | `"latest"` → **0.2.63** |
| `cwd` | `<repo>/agent` | `/app/agent` | (process cwd) |
| `model` | `claude-haiku-4-5-20251001` | `claude-haiku-4-5-20251001` | `claude-haiku-4-5-20251001` |
| `maxTurns` | 30 | 30 | 30 |
| `settingSources` | `['user','project']` | `['user','project']` | `['user','project']` |
| `maxBudgetUsd` | **none** | **3.0** | **none** |
| `includePartialMessages` | — | **true** | — |
| `mcpServers` | `{nano-banana, refs}` | `{nano-banana, refs}` | **`{nano-banana}` only** |
| Notes | comment: `strictMcpConfig`, `permissionMode`, `hooks` **removed** because they interfered with MCP execution (`:33,:75`) | the long-running container | **omits `refs`** → local dev cannot exercise reference-image campaigns; carries an older orchestrator prompt with no Reference Images workflow (`:16-87`) |

- Output tokens are set via **env, not options**: `CLAUDE_CODE_MAX_OUTPUT_TOKENS=16384` (`campaign-session.ts:1781`).
- Full local `allowedTools`: `[Task, Skill, TodoWrite, WebFetch, WebSearch, Read, Write, Glob, Grep, Bash, Edit, mcp__nano-banana__generate_ad_images, mcp__refs__get_reference_images]`.

### 1.3 Discovery is load-bearing — and leaky
- `settingSources:['user','project']` is the **only** reason skills/subagents load; `cwd` **must** be `agent/` or discovery silently fails.
- **`'user'` leaks the developer's global `~/.claude` agents/skills** into the creative agent (unrelated global skills become triggerable). The eval harness already isolates with `settingSources:[]` (`run-mini-eval.ts:270`).
- Only `agents/research.md` exists (`tools: WebFetch, Read, Write`; **no `model:`** → inherits Haiku). The `brand-researcher` / `culture-researcher` / `creative-director` names in `allowedTools` comments (`ai-client.ts:45-60`) are **dead** — those files don't exist.
- Six skills on disk; the live prompt wires only the **two legacy** ones (`hook-methodology`, `art-style`). `research`/`comp`/`strategy`/`cell` are auto-discoverable but driven only by the mini-eval.
- **Name collision:** `agents/research.md` (a Task subagent) vs `skills/research/SKILL.md` (a Skill) — different mechanisms, same name; the orchestrator means the *agent*.

### 1.4 In-process MCP — never bridged over stdio/HTTP
Both servers are genuine in-process SDK servers via `createSdkMcpServer({name,version,tools:[tool(...)]})`, sharing the agent process and `FAL_KEY`:
- **nano-banana** (`nano-banana-mcp.ts:115`, v5.1.0): `generate_ad_images`; zod schema (`prompts: z.array().min(1)`, `referenceImageUrls: z.array(z.url()).max(14)`). **Auto-routes**: `fal-ai/nano-banana-pro/edit` (with `image_urls`) when refs present, else `fal-ai/nano-banana-pro` text-to-image (`:242-281`).
- **refs** (`refs-mcp.ts:17`, v1.0.0): `get_reference_images`; empty `{}` schema; reads `/tmp/creative-agent-refs.json` (local) or `/app/refs.json` (prod) **fresh every call** — the DO/handler must write that file before each turn or it returns `{references:[]}`.
- Surfaced to the model as `mcp__nano-banana__*` / `mcp__refs__*`, listed in `allowedTools`.

### 1.5 The async-generator prompt (the subtle, load-bearing trick)
- `query()` is always called with an **async-generator prompt**, not a string (`ai-client.ts:211-239`, `agent-runner.ts:332`). It yields the user message, then **blocks on a `doneSignal` AbortController until the SDK emits `result`**. This holds stdin open so the in-process MCP bridge can deliver tool responses back to the CLI subprocess. **Return early → stdin closes → MCP dies.**
- `doneController` (lifecycle) is **deliberately separate** from the user-cancel `abortController` (`ai-client.ts:193,:378`) — conflating them either kills the process early or leaks the generator.
- Production extends this into a **multi-yield** generator: ONE `query()` per container lifetime; `promptStream()` yields the first prompt then loops on file IPC `/app/next-prompt.json` for each follow-up (`agent-runner.ts:271-312`). The DO writes that file to trigger a turn (`campaign-session.ts:1888`). Warm multi-turn context lives in the SDK's in-memory array — **no resume needed while warm.**

### 1.6 Streaming → WS/UI
- **Production:** `includePartialMessages:true` re-encodes SDK `stream_events` into newline-JSON stdout (`text_start`/`text_delta`/`text_end`/`tool_use_event`, `agent-runner.ts:339-405`). The DO reads via `streamProcessLogs` → `parseSSEStream` → `processSDKMessage` (`sdk-message-parser.ts`), **dedupes by `msg.uuid`** (each message yields twice), emits WS `ServerMessage`s; `text_delta` is ephemeral (`sdk-message-parser.ts:63-97`). **Gotcha:** subagent (Task) tool calls don't appear in the parent stream — they're manually re-emitted by filtering `parent_tool_use_id` (`agent-runner.ts:390-405`), or the research subagent's `Write` calls are invisible to the UI.
- **Local:** no deltas — iterates the raw message generator into the same `processSDKMessage` (`websocket-handler.ts:345-598`). Tool→phase map: `Task`→research (`:452`), `Skill hook-methodology`→hooks (`:468`), `Skill art-style`→art (`:478`), `mcp__nano-banana`→images (`:489`). WS routing switch at `:1737-1770`.

### 1.7 Persistence: coupled (local) vs decoupled (prod)
- **Local:** synchronous **better-sqlite3** inline as messages arrive (blocks the event loop; fine locally). Images deduped by a shared filename `Set` across two paths — real-time `imageEvents.on('image-saved')` (`websocket-handler.ts:746`) and an SDK-stream fallback (`:533`); a missing filename means a double-persist.
- **Production:** decoupled. agent-runner writes `/app/turn-result.json` (`{images,files,text,blocks,cost}`, `agent-runner.ts:222-261`); the DO's `tryFinalize` reads + reconciles (`campaign-session.ts:413-447`) — explicitly "local disk for reliable reading by DO alarm (no FUSE dependency)." Per-turn cost is a **delta** of cumulative `total_cost_usd` (`agent-runner.ts:427`).

### 1.8 Sessions: captured everywhere, resumed almost nowhere
- `session_id` captured from `system/init`, persisted to `campaigns.sdk_session_id` (`db/campaigns.ts:101`) plus, locally, `sessions/<id>.json`.
- **Resume is local-only:** `RESUME_SDK_SESSION_ID` is **hard-forced to `''` on Cloudflare** (`campaign-session.ts:1779`) because session JSONL over the s3fs/R2 FUSE mount corrupts with null bytes. Warm containers hold context in-memory; cold starts **rebuild from D1** (hydrate files + append history to the prompt, `campaign-session.ts:1257-1302`).
- Fast/slow fork: `isAgentProcessAlive + campaignMatch` → `runFollowUpFast` (file IPC into the warm `query()`, ~30–60s) else cold `runGeneration` (~3min). `resume:sdkSessionId` (with retry-fresh-on-error) and `forkSession:true` exist **only locally** (`ai-client.ts:327-341,:447-463`).
- **Stale flags:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:'1'` (`campaign-session.ts:1780`) — superseded by GA nested subagents; global `claude-code@2.1.64` CLI (`Dockerfile:10`) — predates nested subagents and is a second drifting surface (the SDK spawns its own pinned CLI since 0.2.113).

---

## Part 2 — The SDK delta since your pins

### 2.1 Bottom line
**One version unblocks Opus 4.7/4.8: `0.2.111`.** Everything before it sends `thinking:{type:'enabled',budget_tokens:N}`, which Opus 4.7/4.8 reject with a 400. All three runtimes predate it (0.1.77 / 0.2.63 / 0.2.69). The eval comment at `run-mini-eval.ts:102-108` correctly names 0.2.63 as the wall and pins the judge to `claude-sonnet-4-6` because of it; that constraint dissolves at 0.2.111. **Recommendation: jump straight to latest `0.3.195`** — cross one breaking wall, gain Fable 5, Task tools, SessionStore, and programmatic `agents` in one move.

### 2.2 Current versions + authoritative model IDs
- **Latest (npm-confirmed 2026-06-28):** TypeScript `@anthropic-ai/claude-agent-sdk` **0.3.195**; Python **0.2.110**.
- **Use bare aliases, never date suffixes:** `claude-opus-4-8` (default, $5/$25, 1M ctx), `claude-opus-4-7`, `claude-opus-4-6`, `claude-sonnet-4-6` ($3/$15), `claude-haiku-4-5` ($1/$5, 200K ctx; full `claude-haiku-4-5-20251001` also valid), `claude-fable-5` (most capable widely released, $10/$50, **above** Opus tier), `claude-mythos-5` (Project Glasswing only). Your code hardcodes the dated Haiku ID (`agent-runner.ts:99`, `ai-client.ts:28`) — the bare alias is equivalent.
- `Options.model` / `AgentDefinition.model` accept `fable | haiku | sonnet | opus | inherit` **or** a full ID. `inherit` = the parent's model — exactly what `research.md` lacks today.

### 2.3 Adaptive thinking — version-tagged
- `0.2.49`: capability discovery (`supportsAdaptiveThinking`, `supportedEffortLevels`).
- **`0.2.111`: Opus 4.7 + adaptive thinking (`ThinkingConfigAdaptive`) + the `xhigh` effort level + per-tool MCP permission policy. THE UNBLOCK.**
- `Options.thinking` is now `{type:'adaptive'|'enabled'|'disabled', budget_tokens?, display?}`; pair with `effort` (`low|medium|high|xhigh|max`). For a deterministic pipeline: set `effort` per stage, leave thinking adaptive. `budget_tokens` / `temperature` / `top_p` / `top_k` all **400** on 4.7/4.8/Fable. `thinking.display` defaults to `'omitted'` on 4.7/4.8/Fable — set `'summarized'` if you surface reasoning.

### 2.4 What changed that matters for the rebuild
- **Programmatic `agents:` record** (`AgentDefinition`: `description`, `prompt`, `tools`, `disallowedTools`, `model` alias, `skills`, `mcpServers`, `effort`, `maxTurns`, `background`, `permissionMode`) — the clean way to declare four apprentices in code with isolated context. Filesystem discovery still works. **Nested subagents** (max depth 5) in CLI v2.1.172; **Task→Agent tool rename** in v2.1.63 (SDK matches both names). Your `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS='1'` is a stale flag superseded by GA nesting. Since `0.2.113` the SDK spawns its own pinned CLI, so the separate global `claude-code@2.1.64` pin (`Dockerfile:10`) is a second drifting surface to drop.
- **New `skills` option** (`'all' | [] | ['name',…]`) filters discovered skills and auto-adds the Skill tool — lets the eval keep `settingSources:[]` isolation **and** selectively load a named skill.
- **MCP:** `createSdkMcpServer` unchanged (nano-banana/refs port as-is). `mcpServers` now types four transports (`stdio | sse | http | sdk`). **Breaking-ish: MCP servers connect non-blocking by default since `0.3.142`** — the session starts before slow servers finish. Fine for instant in-process servers, but if a stage calls the tool on turn one, set `MCP_CONNECTION_NONBLOCKING=0` or `alwaysLoad:true`.
- **Sessions:** the unstable V2 API was removed `0.3.142` (unused). `resume`/`continue`/`forkSession` unchanged. Big new primitive: **`SessionStore` (`0.2.113`)** — a pluggable S3/Redis/Postgres adapter for cross-host resume, the **correct** fix for the `RESUME_SDK_SESSION_ID=''` s3fs hack.
- **Caching:** `excludeDynamicSections:true` (`0.2.98`) freezes a stage's systemPrompt so the prompt cache survives across runs.
- **Hosting / strategy:** Managed Agents launched (beta `managed-agents-2026-04-01`) — directly relevant to the documented "build local on SDK, ship on Managed Agents" strategy. Its hosted Outcome loop (`user.define_outcome` + gradeable rubric + independent grader context) maps onto the swap-test critic.

### 2.5 Breaking changes on the 0.3.x jump (changelog-sourced; re-verify at upgrade)
1. **`0.3.142` TodoWrite→Task tools** (`TaskCreate/Update/Get/List`). Your `allowedTools` lists `'TodoWrite'` (`ai-client.ts:38-66`) — deprecated. Set `CLAUDE_CODE_ENABLE_TASKS=0` to keep old behavior, or migrate. **Re-check the tool→phase mapping** in `processSDKMessage` / `sdk-message-parser.ts` for the rename.
2. **`0.3.142` MCP non-blocking default** (above).
3. **`0.3.143` peerDependencies** — `@anthropic-ai/sdk` + `@modelcontextprotocol/sdk` moved to peerDeps; npm/pnpm/bun auto-install, yarn-classic must add explicitly.
4. **`options.env` flipped** overlay (`0.2.111`) → replace (`0.2.113`) — if you pass `env`, it now REPLACES `process.env`; spread it yourself. You currently inject via `startProcess` env (`campaign-session.ts:1771-1785`), not `options.env`, so probably safe — **verify**.
5. **Pin the version.** `cloudflare/package.json:19` floats `"latest"` — any `npm install` silently moves the thinking-shape behavior the eval depends on.

### 2.6 Underlying API drift (skill-authoritative — applies regardless of Agent SDK version)
- `thinking:{type:'enabled',budget_tokens:N}` → 400 on Opus 4.7/4.8/Fable 5; use `{type:'adaptive'}`. `temperature`/`top_p`/`top_k` → 400. Last-assistant-turn prefills → 400.
- Structured outputs: `output_config:{format:{type:'json_schema',schema}}` (deprecated `output_format`). The Agent SDK surfaces this as **`outputFormat`** — use it for the critic's validated verdict.
- **Opus 4.8 behavioral shifts the loop must prompt around:** under-reaches for subagents/memory/custom-tools (needs explicit "when to use" triggering, including in each tool's `description`); narrates more (add a silence-default for chatty stages); asks more often (grant autonomy on small decisions); and — critically for the critic — follows "only report high-severity / be conservative" **literally**, depressing recall. Instruct the critic to report every failure with confidence+severity and filter downstream.

---

## Part 3 — Implications & recommendations for the four-apprentice loop

### 3.1 The single most important fact
**The four-apprentice loop already exists in the right shape, and it is NOT the v1 orchestrator — it is the eval harness.** `run-mini-eval.ts:264-283` runs each apprentice as an isolated `query()`:
- `settingSources:[]` (`:270`)
- binder inlined as `systemPrompt` (`identityPrompt + binder`)
- `allowedTools` scoped per apprentice
- `maxTurns` 25 / 40 / 40 / 50
- `maxBudgetUsd` 1.5 / 2.5 / 2.5 / 4.0
- MCP injected per stage (research: perplexity; comp: perplexity + scrapecreators)
- judge = a separate `maxTurns:1` `query()` (`:347-354`)

That is the production architecture. **Promote the harness; don't extend the orchestrator.**

### 3.2 Reuse the plumbing, replace the brain
- **Replace** the Claude-agent orchestrator. Three problems for a fixed pipeline: it wires only the legacy `hook-methodology → art-style` path (`orchestrator-prompt.ts:31-38`); Skill-triggering is non-deterministic (the model reads frontmatter and decides); `settingSources:['user']` leaks `~/.claude`. Use a `for`-loop of `query()` calls in code, passing `research.md → competitors.md → bets.md → cell` as files. (The SDK even names this — the `Workflow` tool "moves orchestration into a script executed outside conversation context", TS 0.3.149+ — but the eval's plain runner is simpler; you don't need the tool.)
- **Reuse** `processSDKMessage` (`websocket-handler.ts:345`), `sdk-message-parser.ts`, the in-process `createSdkMcpServer` servers (`nano-banana-mcp.ts:115`, `refs-mcp.ts:17`), and the async-generator stdin-holding prompt (`ai-client.ts:193-239`) **verbatim**. The orchestrator becomes a plumber; the apprentices stay sealed.

### 3.3 Split the model bet
Capability isn't the blocker for research/comp/strategy — the binder is (S116: failures were only *sometimes* model-shaped). Keep those three on Haiku/Sonnet 4.6. The genericness conclusion says same-model self-critique blesses generic output, so the cell's swap-test critic must be **stronger** than the generator. Pay for Opus 4.8 **only** in the critic, as its own clean-context `query()` (`settingSources:[]`, rubric inlined, no parent history, `outputFormat:{json_schema}`) — matching the eval judge pattern and the "independent critic = clean-context SDK subagent" rule. **Only that one upgrade requires ≥0.2.111.** Authoritative caveat: tell the critic to report **every** failure with confidence+severity and filter downstream (Opus follows "be conservative" literally and will otherwise behave like the generic-blessing judge).

### 3.4 Keep local ↔ Cloudflare-Workers portable
- **`settingSources:[]` + inlined binder is the standard** — simultaneously the multi-tenant isolation requirement and the `~/.claude` leak kill-switch; portable across local Express, wrangler-dev, and the container. One source of truth per binder (read the `.md`, inline as `systemPrompt`). Add `excludeDynamicSections:true` (0.2.98) only if you move to the preset form for cross-run cache reuse.
- **Stay in-process MCP** (`createSdkMcpServer`) — no network, no separate lifecycle. Don't introduce HTTP/SSE unless sharing one server across many agents (you don't).
- **Don't reach for raw JSONL resume on Workers.** A sequential four-apprentice batch is naturally stateless — file handoffs need no resume. For warm multi-turn within an apprentice, keep the long-lived-query + `/app/next-prompt.json` file IPC, or adopt `SessionStore` (0.2.113) over D1/R2 — the supported primitive that retires the s3fs hack.

### 3.5 The ordered next moves
1. **Pin the SDK** — delete `"latest"` (`cloudflare/package.json:19`), unify `cloudflare/` + `sandbox/` on one explicit version. Zero-regret; do first.
2. **Stand up the loop engine from the eval runner** — a plain TS controller, four sealed `query()` calls, artifacts as files, wired to existing `processSDKMessage` / WS / D1 plumbing.
3. **Decide the upgrade** — bump to ≥0.2.111 (target 0.3.195) to unlock the Opus critic; burn down Task tools / MCP non-blocking / env semantics / native CLI; re-run the gold mini-eval set.
4. **Build the cell critic as an isolated Opus 4.8 `query()`** (clean context, swap-test rubric inlined, report-everything-filter-downstream).
5. **Standardize `settingSources:[]` + inlined binders** so the loop is identical local and on Workers, tenant-isolated, and immune to `~/.claude` leakage.

---

## Recommendations (ranked)

| # | Recommendation | Why | Risk |
|---|---|---|---|
| 1 | **Pin the SDK now** — delete `"latest"` (`cloudflare/package.json:19`), unify `cloudflare/` + `sandbox/`. | The Sonnet-4.6 ceiling is enforced only by the floating lockfile resolving to 0.2.63; any `npm install` silently re-pins and changes the thinking-shape behavior the gold mini-eval depends on. | None — pure reproducibility hardening. |
| 2 | **Build the loop by promoting the eval harness**, not extending the orchestrator — a TS controller of four sealed `query()` calls, binders inlined, per-stage model/tools/caps, artifacts as files. | The architecture already exists and is validated (`run-mini-eval.ts:264-283`). The orchestrator wires only the legacy path, triggers skills non-deterministically, and leaks `~/.claude`. | Low — reuse `processSDKMessage`, `sdk-message-parser.ts`, the MCP servers, and the async-generator prompt verbatim. |
| 3 | **Build the cell's swap-test critic as its own clean-context Opus 4.8 `query()`** (rubric inlined, no parent history, `outputFormat` json_schema). Keep upstream apprentices on Haiku/Sonnet. | Same-model self-critique blesses generic output; the critic must be stronger than the generator. This is the one place Opus capability moves the needle. | Medium — Opus follows "be conservative" literally; counter by reporting every failure with confidence+severity and filtering downstream. |
| 4 | **Upgrade to ≥0.2.111 (target 0.3.195)** to get the Opus critic, then burn down the breaking-change checklist and re-run the gold mini-eval. | On 0.2.63 the critic is capped at Sonnet-critiquing-Sonnet — the weak setup the genericness work indicts. | Medium — crosses TodoWrite→Task, MCP non-blocking, env overlay→replace, peerDeps, native CLI; new thinking shape changes outputs, so re-validate. |
| 5 | **Standardize `settingSources:[]` + inlined binders; stay in-process MCP; don't use raw JSONL resume on Workers.** | Isolation + tenant-safety + portability by construction; the batch loop is naturally stateless. | Low. |

## Open decisions (genuine forks)
1. **SDK upgrade vs stay pinned** — bump to ≥0.2.111 (target 0.3.195) to unlock an Opus-class critic + programmatic `agents:` / SessionStore / skills (accept the breaking-change burn-down + re-validation) **OR** stay on 0.2.63 with Sonnet 4.6 as the ceiling. The genericness work argues for the upgrade; the cost is re-baselining reproducibility.
2. **Critic model** — Opus 4.8 (default, $5/$25) vs Fable 5 ($10/$50, above-Opus). Opus 4.8 recommended; Fable 5 only if swap-test discrimination proves capability-bound. (Keeping the three upstream apprentices on Haiku/Sonnet is settled.)
3. **Orchestration declaration style** — script-orchestrated `for`-loop of sealed `query()` calls (recommended) vs the programmatic `agents:{}` coordinator. Decide whether the loop controller is a script or an SDK coordinator agent.
4. **Cross-host resume** — adopt `SessionStore` (0.2.113) over D1/R2 (the "correct" fix, adds an adapter to maintain) vs keep the rebuild-from-D1 cold start (the batch loop may not need resume at all).
5. **Build-local vs ship-on-Managed-Agents** — whether the production critic/cell loop stays on the self-hosted Agent SDK indefinitely, or migrates to the Managed Agents Outcome loop (the documented ship strategy).

---

## Version inventory (verified 2026-06-28)

| Surface | package.json spec | Resolves to | Notes |
|---|---|---|---|
| `server/` | `^0.1.54` | **0.1.77** | local Express; a different 0.1.x major |
| `cloudflare/` (+ eval) | `"latest"` | **0.2.63** | floating — **pin this** |
| `cloudflare/sandbox/` | `0.2.69` | **0.2.69** | exact pin |
| npm latest | — | **0.3.195** | `dist-tags: {latest, next} = 0.3.195` |
| Opus-4.7/4.8 unblock | — | **0.2.111** | exists on npm; adaptive-thinking wire shape |
| global CLI in image | `claude-code@2.1.64` | — | `Dockerfile:10`; SDK self-spawns its CLI since 0.2.113 — drop this |

## Key files
- **Local Express:** `server/lib/ai-client.ts:26-76` (options), `:193-239` (generator), `:310-341` (resume), `:447-463` (fork); `server/lib/orchestrator-prompt.ts:31-38`; `server/lib/websocket-handler.ts:345-598` (parse), `:746` (images), `:1737-1770` (WS routing); `server/lib/nano-banana-mcp.ts:115`; `server/lib/refs-mcp.ts:17`; `server/lib/db/campaigns.ts:101`; `server/package.json:13`.
- **Production sandbox:** `cloudflare/sandbox/agent-runner.ts:97-116` (options), `:222-261` (turn-result), `:271-312` (promptStream), `:339-405` (stream re-encode), `:427` (cost delta); `cloudflare/sandbox/orchestrator-prompt.ts`; `cloudflare/sandbox/Dockerfile:10`; `cloudflare/sandbox/package.json:6`.
- **wrangler-dev:** `cloudflare/src/lib/local-ai-runner.ts:16-87,230-244`; `cloudflare/src/lib/sdk-message-parser.ts:63-97`; `cloudflare/package.json:19`.
- **DO:** `cloudflare/src/durable-objects/campaign-session.ts:413-447` (finalize), `:1257-1302` (cold hydrate), `:1771-1785` (env), `:1779` (resume disabled), `:1781` (max output), `:1888` (next-prompt).
- **The new-loop reference:** `cloudflare/eval/mini-eval/run-mini-eval.ts:77-108` (judge/model), `:102-108` (the 0.2.63 ceiling comment), `:264-283` (apprentice query), `:270` (`settingSources:[]`), `:347-354` (judge query).

---

*Source: ultracode workflow `v1-agent-and-sdk-audit` (2026-06-28). As-built claims verified against source; headline SDK versions verified against npm + the installed tree; per-release feature attributions are changelog-sourced — confirm against the TS SDK CHANGELOG at upgrade time.*
