# Sandbox Container

> Part of [Architecture Documentation](../INDEX.md) | **Directory:** `cloudflare/sandbox/`

---

## What It Is

A Docker container running on Cloudflare's container infrastructure. Contains a long-lived Node.js process (`agent-runner.ts`) that runs the Claude SDK and generates ad campaigns. One container per user, reused across generations.

---

## Container Spec

| Property | Value |
|---|---|
| Base image | `node:22-slim` |
| Instance type | `standard-2` (1 vCPU, 6 GiB RAM) |
| Sleep timeout | `2h` (stays warm for follow-ups) |
| Max instances | 50 |
| Container ID | `user-{userId}-v2` (deterministic for reuse) |
| Cold start | ~2.5 min (dominated by Claude CLI init) |
| Warm follow-up | ~30-60s |

---

## Dockerfile (`cloudflare/sandbox/Dockerfile`)

```dockerfile
FROM node:22-slim

# Cloudflare sandbox runtime
COPY --from=docker.io/cloudflare/sandbox:0.7.10 /container-server/sandbox /sandbox

# s3fs-fuse for R2 FUSE mount
RUN apt-get update && apt-get install -y s3fs fuse

# Claude CLI (pinned version)
RUN npm install -g @anthropic-ai/claude-code@2.1.64

# App dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

# Agent workspace (skills, agents, examples)
COPY agent/ /app/agent/
COPY agent/.claude/ /app/agent/.claude/

# Entry point and modules
COPY agent-runner.ts orchestrator-prompt.ts nano-banana-mcp.ts tsconfig.json ./

# Pre-compile TypeScript (saves ~30s vs runtime tsx)
RUN npm install -g typescript && npm install --save-dev @types/node && tsc -p tsconfig.json

ENTRYPOINT ["/sandbox"]
```

---

## Container Lifecycle

```
User sends 'generate'
    │
    ▼
getSandbox(id: user-{userId}-v2, sleepAfter: '2h')
    │
    ├── Container exists and awake? ──YES──→ Reuse (warm path)
    │                                          │
    │                                    unmountBucket('/mnt/r2')
    │                                    mountBucket('/mnt/r2', ...)
    │                                          │
    └── No? ──→ Create new container ──→ ~2.5 min cold start
                  │                        (Docker pull + node init
                  │                         + Claude CLI startup)
                  │
                  ▼
            Pre-flight IP check
            curl Anthropic API from sandbox
                  │
                  ├── 200 OK → proceed
                  └── 403 → destroy sandbox, retry with unique ID
                            (max 3 attempts)
                  │
                  ▼
            startProcess('node', ['agent-runner.js'], { env })
                  │
                  ├── Turn 1: process prompt from env var
                  ├── waitForPromptFile() → idle polling 500ms
                  ├── Turn N: prompt from /app/next-prompt.json
                  └── ... repeats (long-running, survives across turns)
                  │
                  ▼
            After 2h idle (sleepAfter) → container sleeps
            Next request → container wakes (~2-5s)
```

**Warm container benefits:**
- Follow-ups skip cold start (~2.5 min → ~30-60s)
- Agent process retains full SDK conversation context
- R2 FUSE mount persists (just needs unmount+remount for fresh credentials)

---

## Agent Runner (`cloudflare/sandbox/agent-runner.ts` — 205 lines)

Long-lived process that stays alive between turns via file-based IPC.

### Turn Lifecycle

```
ENV: PROMPT, SESSION_ID, CAMPAIGN_ID, RESUME_SDK_SESSION_ID, API keys
    │
    ▼
Turn 1: prompt from PROMPT env var
    │
    ├── Claude SDK query() starts
    ├── SDK messages printed to stdout (JSON, one per line)
    ├── On result → writeCompletionMarker() → print turn_complete sentinel
    │
    ▼
Idle: waitForPromptFile() — polls /app/next-prompt.json every 500ms
    │
    ▼
Turn N: prompt from next-prompt.json (written by DO)
    │
    ├── Print turn_start sentinel (so DO can skip replayed stdout)
    ├── Claude SDK continues with same session
    ├── On result → writeCompletionMarker() → print turn_complete sentinel
    │
    ▼
... repeats until shutdown signal or process killed
```

### Key Files in Container

| File | Written By | Purpose |
|---|---|---|
| `/app/next-prompt.json` | DO (via writeFile) | Follow-up prompt for next turn |
| `/app/agent-status.json` | agent-runner | Health status (starting/processing/idle/error) |
| `/app/turn-result.json` | agent-runner | Image/file list after each turn |
| `/app/generated-images.jsonl` | MCP tool | Tracking file for images generated this turn (read and cleared by `writeCompletionMarker()` after each turn) |
| `/mnt/r2/completion_{campaignId}.json` | agent-runner | Completion marker in R2 |

### SDK Options

```typescript
model: 'claude-haiku-4-5-20251001'
maxTurns: 30
cwd: '/app/agent'
allowedTools: [
  'Task', 'Skill', 'TodoWrite',
  'WebFetch', 'WebSearch', 'Read', 'Write',
  'Bash', 'Edit', 'Glob', 'Grep',
  'mcp__nano-banana__generate_ad_images'
]
systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT
settingSources: ['user', 'project']
mcpServers: { 'nano-banana': nanoBananaMcpServer }
```

**Environment variables:**
- `RESUME_SDK_SESSION_ID` — If set, the SDK resumes an existing session instead of starting fresh. Used for follow-ups on warm containers. If resume fails (e.g., session expired), falls back to a fresh session automatically.

### Completion Marker (`writeCompletionMarker()`)

Written after each turn to R2 (FUSE) and local disk. The function:
1. Reads `/app/generated-images.jsonl` (populated by MCP tool) to get images from this turn only
2. Clears the tracking file so the next turn starts fresh
3. Reads agent output files (research, hooks, prompts) from their workspace directories
4. Writes the marker to both `/mnt/r2/completion_{campaignId}.json` and `/app/turn-result.json`

```json
{
  "version": 1,
  "status": "complete",
  "campaignId": "abc123",
  "sessionId": "sess-xxx",
  "sdkSessionId": "sdk-xxx",
  "timestamp": "2026-03-10T...",
  "images": [{ "filename": "1_stat_bold.png", "path": "/images/..." }],
  "files": { "research": "...", "hooks": "...", "prompts": "..." }
}
```

**Two copies written:**
1. `/app/turn-result.json` — local disk (fast, used by `reconcileImages`/`reconcileFiles` via `sandbox.readFile()`)
2. `/mnt/r2/completion_{campaignId}.json` — R2 via FUSE (used by alarm R2 polling + client `/recover`)

**Image tracking:** `writeCompletionMarker()` reads `/app/generated-images.jsonl` (populated by the MCP tool during the turn), then clears the tracking file for the next turn. This avoids scanning `/mnt/r2/images/` which contains ALL campaigns for this user.

---

## MCP Server: nano-banana (`cloudflare/sandbox/nano-banana-mcp.ts`)

Wraps fal.ai's Nano Banana Pro (Google Gemini image model) for image generation.

### Tool: `generate_ad_images`

**Input:**
```json
{
  "prompts": [
    { "prompt": "A bold stat ad...", "hookType": "stat", "aspectRatio": "1:1" }
  ],
  "referenceImageUrls": ["https://..."],
  "resolution": "2k"
}
```

**What it does:**
1. Sends each prompt to fal.ai API
2. Downloads generated image from fal.ai URL
3. Saves to `/mnt/r2/images/{sessionId}/{index}_{hookType}_{name}.png` (FUSE → R2)
4. Appends to `/app/generated-images.jsonl` (tracking file)
5. Returns result with image paths + `filepath` (so agent can inspect images)

**Key detail:** Images are saved to the FUSE mount, which means they're written to R2 via s3fs. `writeFileSync` is safe (triggers upload on close). But the completion marker write needs a `sync` call to ensure FUSE flushes.

**`filepath` limitation:** The MCP tool returns `filepath` only for newly generated images in the current turn. It is NOT available retroactively for images from earlier turns or existing campaign history.

---

## Orchestrator Prompt (`cloudflare/sandbox/orchestrator-prompt.ts`)

System prompt defining the multi-step campaign workflow:

1. **Research** — Spawn research subagent (WebFetch brand site, WebSearch cultural angles)
2. **Hooks** — Create 6 ad angles from research (stat, story, fomo, curiosity, callout, contrast)
3. **Art Direction** — Define visual style and art direction
4. **Image Prompts** — Write detailed prompts for each ad concept
5. **Generate Images** — Call `generate_ad_images` MCP tool
6. **Review** — Optional: inspect generated images, iterate

The prompt also defines the agent workspace layout, file paths, and output format conventions.

---

## R2 FUSE Mount

```
/mnt/r2 ←── s3fs FUSE mount ──→ R2 bucket (creative-agent-assets)
  └── Prefix: users/{userId}/
```

**Mount flow (in DO's runGeneration):**
1. `sandbox.exec('pkill -f agent-runner ...')` — kill stale agent first (holds mount open)
2. `sandbox.unmountBucket('/mnt/r2')` — unmount SDK-level tracking
3. `sandbox.exec('pkill -9 s3fs ...; umount -f ...; rm -rf /mnt/r2; mkdir -p /mnt/r2')` — clean stale FUSE
4. `sandbox.mountBucket('creative-agent-assets', '/mnt/r2', { endpoint, provider, credentials, prefix })`

**Signature:** `mountBucket(bucketName, mountPath, options)` — bucket name is FIRST arg, NOT in options

**Flush gotchas:**
- `writeFileSync` triggers upload on `close()` — safe
- Open file descriptors (SDK JSONL) only upload on `close()`/`fsync(fd)`/`unmount`
- Linux `sync` does NOT trigger s3fs→R2 upload
- `unmountBucket()` is the only guaranteed flush for all open files
- DO calls `unmountBucket()` before `sandbox.destroy()` to ensure data reaches R2

---

## Pre-flight IP Check

Some Cloudflare container IPs are blocked by Anthropic (403 response):

```
Blocked:  104.28.157.x
Working:  104.28.156.x, 104.28.160.x, 104.28.161.x
```

**Flow:**
1. After R2 mount, test Anthropic API from sandbox: `curl -s -o /dev/null -w "%{http_code}" -H "x-api-key: ..." https://api.anthropic.com/v1/messages`
2. If 403 → destroy sandbox, create new one with unique ID (`user-{userId}-v2-{Date.now()}`)
3. Max 3 attempts

---

## See Also

- [Durable Object](./DURABLE_OBJECT.md) — How the DO manages the sandbox
- [Streaming Pipeline](./STREAMING_PIPELINE.md) — stdout → WS events
- [AI Agent Pipeline](../shared/AI_AGENT_PIPELINE.md) — Orchestrator prompt details
- [Image Pipeline](../shared/IMAGE_PIPELINE.md) — MCP tool → FUSE → R2
