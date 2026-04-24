# Sandbox Container

> Part of [Architecture Documentation](../INDEX.md) | **Directory:** `cloudflare/sandbox/`

---

## What it is

A Docker container running on Cloudflare's container infrastructure. Contains a long-lived Node.js process (`agent-runner.ts`) that runs the Claude SDK and generates ad campaigns. One container per user (`user-{userId}-v2`), reused across generations.

---

## Container spec

| Property | Value |
|---|---|
| Base image | `node:22-slim` |
| Sandbox runtime | `cloudflare/sandbox:0.7.19` |
| Instance type | `standard-2` (1 vCPU, 6 GiB RAM) |
| Sleep timeout | `2h` (`sleepAfter`) |
| Max instances | 50 |
| Container ID | `user-{userId}-v2` (normalised + deterministic) |
| Cold start | ~2.5 min (dominated by Claude CLI init) |
| Warm follow-up | ~30-60 s |
| Identical across staging + production | Yes (same Dockerfile, same image) |

Source: `cloudflare/wrangler.jsonc:30-35`.

---

## Dockerfile

`cloudflare/sandbox/Dockerfile`:

```dockerfile
FROM node:22-slim

# Cloudflare sandbox runtime — MUST match @cloudflare/sandbox version in package.json
COPY --from=docker.io/cloudflare/sandbox:0.7.19 /container-server/sandbox /sandbox

# s3fs-fuse for R2 FUSE mount
RUN apt-get update && apt-get install -y s3fs fuse && rm -rf /var/lib/apt/lists/*

# Claude CLI (pinned version)
RUN npm install -g @anthropic-ai/claude-code@2.1.64

# App dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

# Agent workspace (skills, subagents)
COPY agent/ /app/agent/
COPY agent/.claude/ /app/agent/.claude/

# Sandbox entry + modules
COPY agent-runner.ts orchestrator-prompt.ts nano-banana-mcp.ts block-builder.ts tsconfig.json ./

# Pre-compile TypeScript (saves ~30s vs runtime tsx compilation)
RUN npm install -g typescript && npm install --save-dev @types/node && tsc -p tsconfig.json

RUN chmod -R a+rX /app
EXPOSE 8080
ENTRYPOINT ["/sandbox"]
```

**Dockerfile does NOT set HOME or IMAGE_OUTPUT_DIR.** Those are injected at process spawn time by the DO — see [Runtime env vars](#runtime-env-vars) below.

---

## Container lifecycle

```
User sends 'generate'
    │
    ▼
getSandbox(id: user-{userId}-v2, sleepAfter: '2h', normalizeId: true)
    │
    ├── Container exists + awake? ──YES──→ Reuse (warm path)
    │                                        │
    │                                  pkill agent (releases FUSE handles)
    │                                  unmountBucket('/mnt/r2') + full FUSE reset
    │                                  mountBucket('/mnt/r2', …)
    │                                        │
    └── No? ──→ Create new container ──→ ~2.5 min cold start
                  │                        (Docker pull + node init + Claude CLI init)
                  │
                  ▼
            Pre-flight IP check (curl Anthropic API)
                  │
                  ├── 200 OK → proceed
                  └── 403 → destroy, retry new ID (user-{id}-v2-{Date.now()})
                            max 3 attempts
                  │
                  ▼
            startProcess('node /app/dist/agent-runner.js', { cwd: '/app', env: {…} })
                  │
                  ├── Turn 1: prompt from PROMPT env var
                  ├── waitForPromptFile() polls /app/next-prompt.json every 500 ms
                  ├── Turn N: prompt from next-prompt.json
                  └── Loops until shutdown or killProcess
                  │
                  ▼
            After 2 h idle → container sleeps
            Next request → container wakes (~2–5 s)
```

**Warm-container benefits:**

- Follow-ups skip cold start (~2.5 min → ~30–60 s)
- Agent process retains full SDK conversation context in-memory (no JSONL resume — that's disabled on Cloudflare)
- R2 FUSE mount persists but is always re-mounted per gen (fresh credentials + stale mount cleanup)

---

## Agent runner (`cloudflare/sandbox/agent-runner.ts` — 441 lines)

Long-lived Node.js process. Stays alive between turns via file-based IPC with the DO. Full streaming behaviour in [STREAMING_PIPELINE.md](./STREAMING_PIPELINE.md) — this section is container-side only.

### Turn lifecycle

```
ENV: PROMPT, SESSION_ID, CAMPAIGN_ID, ANTHROPIC_API_KEY, FAL_KEY, HOME=/root, IMAGE_OUTPUT_DIR=/mnt/r2/images, ...
    │
    ▼
Turn 1: prompt comes from PROMPT env var
    │
    ├── Claude SDK query() starts with includePartialMessages: true
    ├── Messages + stream_events emitted to stdout as newline-delimited JSON
    ├── 30s heartbeat trace line for alarm visibility (agent-runner.ts:47-51)
    ├── On 'result' message:
    │     - Compute per-turn cost delta (agent-runner.ts:397-402)
    │     - writeCompletionMarker → /app/turn-result.json
    │     - Emit {type:'turn_complete'} sentinel
    │     - Emit COMPLETION:${requestId} raw line
    │     - Reset block builder + streaming state
    │
    ▼
Idle: waitForPromptFile() — polls /app/next-prompt.json every 500 ms
    │
    ▼
Turn N: prompt from next-prompt.json (written by DO runFollowUpFast)
    │
    ├── Emit {type:'turn_start', requestId} sentinel (lets DO skip replayed stdout)
    ├── Claude SDK continues with same in-memory session
    ├── On 'result': same as Turn 1 completion sequence
    │
    ▼
Loops. Exits only on process kill, shutdown signal, or fatal SDK error.
```

### Key files inside the container

| File | Written by | Read by | Purpose |
|---|---|---|---|
| `/app/next-prompt.json` | DO (`sandbox.writeFile`) | agent-runner | Follow-up prompt for next turn |
| `/app/agent-status.json` | agent-runner | DO (`isAgentProcessAlive`) | Health status: `starting` / `processing` / `idle` / `error` |
| `/app/turn-result.json` | agent-runner (`writeCompletionMarker`) | DO (`tryFinalize`) | Per-turn result — images, files, text, blocks, cost, requestId, campaignId |
| `/app/generated-images.jsonl` | nano-banana MCP tool | agent-runner | Tracks images generated this turn, cleared after each completion marker |
| `/mnt/r2/images/{sessionId}/{index}_{hookType}_{name}.png` | nano-banana MCP tool | Worker via R2 binding | Generated images written via FUSE → R2 |

**No `/mnt/r2/completion_{campaignId}.json` anymore.** The old R2 dual-write was removed when `/recover` became D1-first. Only `/app/turn-result.json` is written today.

### SDK options

From `agent-runner.ts:96-111`:

```ts
model:                    'claude-haiku-4-5-20251001'
maxTurns:                 30
maxBudgetUsd:             3.0
includePartialMessages:   true           // enables stream_event messages
settingSources:           ['user', 'project']
allowedTools:             [
  'Task', 'Skill', 'TodoWrite',
  'WebFetch', 'WebSearch', 'Read', 'Write',
  'Bash', 'Edit', 'Glob', 'Grep',
  'mcp__nano-banana__generate_ad_images'
]
systemPrompt:             ORCHESTRATOR_SYSTEM_PROMPT
mcpServers:               { 'nano-banana': nanoBananaMcpServer }
cwd:                      '/app/agent'
```

Twelve allowed tools. See [STREAMING_PIPELINE.md](./STREAMING_PIPELINE.md#the-enabling-switch-includepartialmessages-true) for why `includePartialMessages` is critical.

### `writeCompletionMarker()`

`agent-runner.ts:216-261`. Runs once per turn on SDK `result` message.

1. Read `/app/generated-images.jsonl` (appended by nano-banana MCP per image). Parse each line.
2. Clear tracking file (`writeFileSync(trackingFile, '')`) — next turn starts fresh.
3. Read research/hooks/prompts from workspace dirs (first file in each).
4. Write `/app/turn-result.json`:

```json
{
  "images": [{ "filename": "...", "path": "/mnt/r2/images/..." }],
  "files":  { "research": "...", "hooks": "...", "prompts": "..." },
  "text":   "accumulated assistant text this turn",
  "blocks": [{ /* MessageBlock[] */ }],
  "requestId": "req_1710000000000" | "turn_{ts}" | null,
  "campaignId": "abc123",
  "cost": {
    "totalCostUsd": 0.043,
    "inputTokens": 1200,
    "outputTokens": 850,
    "numTurns": 6,
    "durationMs": 124000
  }
}
```

The `cost.totalCostUsd` is the **per-turn delta** (not cumulative) — see `previousCostUsd` tracking at `agent-runner.ts:397-402`.

---

## Runtime env vars

`HOME` and `IMAGE_OUTPUT_DIR` are set at process spawn in the DO (`campaign-session.ts:1471-1485`), NOT in the Dockerfile:

| Var | Value | Purpose |
|---|---|---|
| `PROMPT` | First-turn prompt | Initial input |
| `SESSION_ID` | WebSocket session ID | Correlation |
| `CAMPAIGN_ID` | Campaign ID | Cross-campaign validation in `turn-result.json` |
| `RESUME_SDK_SESSION_ID` | `''` (empty) | **Always empty on Cloudflare.** s3fs FUSE corrupts SDK JSONL with null bytes. Context recovery uses D1 hydration instead. |
| `ANTHROPIC_API_KEY` | — | SDK auth |
| `FAL_KEY` | — | nano-banana auth |
| `HOME` | `/root` | **Must NOT be `/mnt/r2`.** An earlier revision set it to `/mnt/r2`, which caused shell history files (`.node_repl_history` etc.) to be written to the FUSE mount, pinning it open and blocking unmount. `/root` decouples shell scratch from R2. |
| `IMAGE_OUTPUT_DIR` | `/mnt/r2/images` | Where the nano-banana MCP writes generated images. MCP reads `process.env.IMAGE_OUTPUT_DIR || '/mnt/r2/images'` at `nano-banana-mcp.ts:43`. |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | `'1'` | SDK-side feature flag |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | `'16384'` | Max output tokens per SDK turn |

### HOME historical note

HOME used to be `/mnt/r2` so that shell CWD convention aligned with output. That kept open file descriptors under the FUSE mount (shell history, node REPL history), pinning the mount even after `pkill agent-runner`. Fix: set HOME to `/root`, which is outside the mount. Output files written by the agent to `/mnt/r2/images/…` are closed explicitly by the MCP tool after each generation, so those don't pin the mount.

---

## MCP server: nano-banana (`cloudflare/sandbox/nano-banana-mcp.ts`)

Wraps fal.ai's Nano Banana Pro (Google Gemini image model) for in-sandbox image generation.

### Tool: `generate_ad_images`

**Input:**

```json
{
  "prompts": [
    { "prompt": "A bold stat ad…", "hookType": "stat", "aspectRatio": "1:1" }
  ],
  "referenceImageUrls": ["https://..."],
  "resolution": "2k"
}
```

**What it does:**

1. Sends each prompt to fal.ai API
2. Downloads generated image from fal.ai URL
3. Saves to `${IMAGE_OUTPUT_DIR}/{sessionId}/{index}_{hookType}_{name}.png` (default `/mnt/r2/images/…`)
4. Appends `{filename, path}` to `/app/generated-images.jsonl`
5. Returns result with image paths + `filepath` (so agent can inspect via `Read` tool)

**Key detail:** images write to the FUSE mount. `writeFileSync` triggers upload on `close()` — safe, since the MCP tool closes per image. But the completion marker write ordering matters: the tracking file must be read + cleared before the DO reads `turn-result.json`.

**`filepath` limitation:** the MCP returns `filepath` only for images generated in THIS turn. Not available retroactively for earlier turns or existing campaign history.

---

## Orchestrator prompt (`cloudflare/sandbox/orchestrator-prompt.ts`)

System prompt defining the multi-step campaign workflow:

1. **Research** — spawn research subagent (WebFetch brand site, WebSearch cultural angles)
2. **Hooks** — create 6 ad angles from research (stat, story, fomo, curiosity, callout, contrast)
3. **Art direction** — define visual style + art direction
4. **Image prompts** — write detailed prompts for each ad concept
5. **Generate images** — call `generate_ad_images` MCP tool
6. **Review** — optional: inspect generated images, iterate

Also defines the agent workspace layout + file paths + output conventions. See [AI_AGENT_PIPELINE.md](../shared/AI_AGENT_PIPELINE.md).

---

## R2 FUSE mount

```
/mnt/r2 ←── s3fs FUSE mount ──→ R2 bucket
                                  • staging:    creative-agent-assets
                                  • production: creative-agent-assets-prod
  └── Prefix: users/{userId}/
```

Mount sequence in `setupSandbox` (per [DURABLE_OBJECT.md](./DURABLE_OBJECT.md#setupsandbox-prompt-sessionid-sdksessionid)):

1. `pkill -f agent-runner` — release file handles under `/mnt/r2`
2. `unmountBucket('/mnt/r2')` — tell Sandbox DO to forget this mount
3. `pkill -9 s3fs; umount -l /mnt/r2; fusermount -u /mnt/r2; rm -rf /mnt/r2; mkdir -p /mnt/r2` — full FUSE reset. `umount -l` (lazy) replaces `-f`: `-f` fails if handles are still open under the mount, lazy unmount returns immediately and tears down once handles close.
4. `mountBucket(bucketName, '/mnt/r2', { endpoint, provider: 'r2', credentials, prefix: 'users/{userId}/' })`

**Signature:** `mountBucket(bucketName, mountPath, options)` — bucket name is the FIRST positional arg, NOT in options.

**Flush gotchas:**

- `writeFileSync` triggers upload on `close()` — safe when the writer fully closes
- Open file descriptors only upload on `close()` / `fsync(fd)` / `unmountBucket()`
- Linux `sync` does NOT trigger s3fs→R2 upload
- `unmountBucket()` is the only guaranteed flush for any open file

---

## Pre-flight IP check

Some Cloudflare container IPs are blocked by Anthropic (403). Observed:

```
Blocked:  104.28.157.x
Working:  104.28.156.x, 104.28.160.x, 104.28.161.x
```

Flow (`setupSandbox:1363-1393`):

1. After R2 mount, run from inside the sandbox:
   ```bash
   node -e "fetch('https://api.anthropic.com/v1/messages', {...}); fetch('https://httpbin.org/ip')"
   ```
2. Look for `WITH_KEY=200` in stdout
3. If 403 → `sandbox.destroy()`, retry with new ID `user-{id}-v2-{Date.now()}`
4. Max 3 attempts — if all blocked, proceed anyway and setup will fail downstream

This is what surfaces as "Setup failed" to users on a bad-IP-streak. See [KNOWN_ISSUES.md](../ops/KNOWN_ISSUES.md).

---

## Per-env differences

Container config is **identical across staging and production**. Same Dockerfile, same spec, same allowed tools. The only environmental differences are:

- `R2_BUCKET_NAME` var (passed to `mountBucket`): `creative-agent-assets` vs `creative-agent-assets-prod`
- Secrets injected at process spawn (`ANTHROPIC_API_KEY`, `FAL_KEY`) — may carry identical values but are scoped per env

See [STAGING_PRODUCTION.md](../ops/STAGING_PRODUCTION.md) for the full env matrix.

---

## See Also

- [Durable Object](./DURABLE_OBJECT.md) — how the DO manages the sandbox
- [Streaming Pipeline](./STREAMING_PIPELINE.md) — stdout → WS events
- [AI Agent Pipeline](../shared/AI_AGENT_PIPELINE.md) — orchestrator prompt
- [Image Pipeline](../shared/IMAGE_PIPELINE.md) — MCP tool → FUSE → R2
- [Staging vs Production](../ops/STAGING_PRODUCTION.md) — env matrix
- [Known Issues](../ops/KNOWN_ISSUES.md) — IP blocks, cold start, local-dev gap
