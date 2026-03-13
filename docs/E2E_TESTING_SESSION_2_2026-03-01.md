# End-to-End Testing Session 2 — 2026-03-01

> Status: Paused — ready for full generation test with upgraded instance
> Branch: `new-ui`
> Deployed URL: https://creative-agent.alphasapien17.workers.dev
> Deployed Version: `8c8b68a6`

---

## Summary

Second E2E testing session. Verified the full streaming pipeline works end-to-end. Fixed the API key issue (trailing newline corruption). A partial generation ran successfully (research + hooks start) but hung mid-pipeline — likely due to the `standard-1` container being too small (0.5 vCPU, 4GB RAM). Upgraded to `standard-2` (1 vCPU, 6GB RAM). Rollout completed — ready to test.

---

## Issues Found & Fixed

### 5. Trailing newline in Wrangler secrets (FIXED)

**Error:** `Failed to authenticate. API Error: 403 {"error":{"type":"forbidden","message":"Request not allowed"}}`

**Cause:** The `grep | cut | wrangler secret put` pipeline includes a trailing `\n` from grep's output. The Wrangler CLI stores the newline as part of the secret value, corrupting the API key.

**Fix:** Strip newline before piping:
```bash
grep '^ANTHROPIC_API_KEY=' ../.env | cut -d= -f2- | tr -d '\n' | npx wrangler secret put ANTHROPIC_API_KEY
grep '^FAL_KEY=' ../.env | cut -d= -f2- | tr -d '\n' | npx wrangler secret put FAL_KEY
```

**Important:** After updating secrets, you MUST redeploy (`npx wrangler deploy`) for the new values to take effect. Running DOs keep the old `env` object until evicted.

### 6. Partial JSON lines in onOutput (FIXED)

**Problem:** The sandbox `exec()` `onOutput` callback receives stdout in arbitrary chunks. A single JSON line from the SDK could be split across two chunks. The original code split by `\n` and tried `JSON.parse` on each piece — partial lines silently failed and the message was lost.

**Fix:** Added a line buffer (`stdoutBuffer`) that accumulates data across callbacks and only parses complete lines (terminated by `\n`). Any remaining data in the buffer is flushed when exec completes.

### 7. Container instance too small (IN PROGRESS — upgrade deployed)

**Symptom:** Generation runs successfully for ~2 minutes (research phase + hooks start), then hangs with no output for 5+ minutes. The exec process doesn't complete or produce errors.

**Likely Cause:** `standard-1` instance (0.5 vCPU, 4GB RAM) is insufficient for Claude Code CLI + subagents + MCP server + R2 FUSE mount. The CLI spawns subprocesses for each subagent (Task tool). Combined CPU/memory pressure likely causes the process to stall or OOM.

**Fix:** Upgraded to `standard-2` (1 vCPU, 6 GiB RAM, 12 GB disk) in `wrangler.jsonc`. Rollout completed — version 13 is live with the new specs.

**Reference:** The `fashion-shoot-agent` (similar workload) uses 1 vCPU / 6 GiB successfully.

---

## What Works (Verified This Session)

### Streaming Pipeline — Fully Verified

The complete streaming chain works end-to-end:

```
agent-runner.ts (sandbox) → stdout → onOutput callback (DO) → messageQueue → drain loop → processSDKMessage → emitEvent → WebSocket → browser
```

**Verified sequence from a partial generation:**
```
[0.0s]  WebSocket connect
[1.2s]  ACK + PHASE:parse
[3.5s]  Sandbox boot (getSandbox + cleanup + R2 mount)
[10.3s] MCP server initialized (nano-banana v5.1.0)
[33.5s] SDK system/init (session created)
[37.2s] First Claude response (MESSAGE: "I'll create a conversion-focused ad campaign...")
[39.2s] TOOL_START: Agent (research subagent)
[43.1s] system/task_started (subagent started)
[49.1s] TOOL_START: WebFetch (researching URL)
[63.0s] TOOL_END (WebFetch complete)
[64.8s] TOOL_START: WebFetch (second page)
[72.2s] TOOL_END
[85.1s] TOOL_START: Write + FILE: research (research.md created)
[91.2s] TOOL_END (research subagent done)
[101.7s] MESSAGE: "Research complete..."
[102.0s] TOOL_START: Skill + PHASE:hooks (hook-methodology)
[110.4s] MESSAGE: "Generating conversion hooks..."
[116.6s] TOOL_START: Bash (hook analysis)
[125.1s] TOOL_END
[127.7s] assistant (then hung — instance size issue)
```

### Timing Breakdown

| Phase | Time |
|-------|------|
| WebSocket connect + ACK | ~1s |
| Sandbox boot + R2 mount | ~3s |
| `npx tsx` compile + MCP init | ~7s |
| SDK initialization + first API call | ~30s from exec start |
| **Total before first visible event** | **~37s** |
| Research phase (WebFetch + Write) | ~65s |
| Hooks phase start | ~15s (then hung) |

### Other Verified Components

- **Health check:** Returns `{"status":"ok","d1":{"connected":true,"campaigns":N},"r2":{"bound":true}}`
- **Campaign creation:** D1 creates campaign + saves user message on `generate`
- **SDK session persistence:** `system/init` → `sdk_session_id` saved to D1
- **Phase detection:** `parse`, `research`, `hooks` phases all detected correctly
- **File detection:** Research file write detected and emitted as `file` event
- **Tool start/end:** All tool calls emit `tool_start`/`tool_end` events
- **Text messages:** Claude's text responses emitted as `message` events
- **Simple generation:** A prompt without URL completed in ~34s (Claude asked for URL)

---

## Current State (Where to Resume)

### What's deployed
- Worker version: `8c8b68a6`
- Container: `standard-2` (1 vCPU, 6 GiB RAM, 12 GB disk) — rollout COMPLETED (version 13)
- Secrets: ANTHROPIC_API_KEY and FAL_KEY both correctly set (no trailing newlines)
- Debug logging: WS-based status messages enabled (send `[debug]` messages via WebSocket)

### What to test next

1. **Full generation with standard-2**: Run the E2E test — the upgraded instance should prevent the mid-pipeline hang
2. **Cancel flow**: Start generation, wait for first events, send `{ "type": "cancel" }`
3. **Follow-up/resume**: After a complete generation, send `follow_up` with the campaignId
4. **REST API**: `GET /api/campaigns`, `GET /api/campaigns/:id`
5. **Image serving**: `GET /images/{sessionId}/{filename}` from R2
6. **Reconnect/subscribe**: Disconnect during generation, reconnect, send `subscribe` with `lastEventId`

### Test script

```bash
cd /Users/chakra/Documents/Agents/creative_agent
node test-e2e.mjs
```

The test script (`test-e2e.mjs`) has:
- 15-minute timeout
- 30-second ping keepalive
- Prompt: "Create conversion ads for Dark Roast Co at https://darkroastco.com - 3 ads in clay diorama style"

---

## Debug Logging (Currently Enabled)

The DO sends `[debug]` status messages via WebSocket at key points:

```
[debug] Getting sandbox...
[debug] Cleaning mount point...
[debug] Mounting R2 bucket...
[debug] Starting agent-runner exec...
[debug] R2 mounted, agent-runner started. Draining queue...
[debug] Non-JSON stdout: <mcp server messages>
[debug] SDK msg: <type>/<subtype>
[debug] Waiting for SDK output... Xs since last message, chunks=N
[debug] exec done: exit=X, stdout chunks=N, msgs=N
[debug] stderr: <error output>
[debug] Generation error: <error message>
```

These should be removed before production. They're in `cloudflare/src/durable-objects/campaign-session.ts`.

---

## Key Learnings

### 1. Wrangler secrets include trailing newlines
Always strip newlines: `grep ... | tr -d '\n' | npx wrangler secret put NAME`

### 2. Secrets need redeploy to take effect
`wrangler secret put` updates the secret in Cloudflare, but running DO instances keep their old `env`. Must redeploy or wait for DO eviction.

### 3. Container instance type changes require rollout
Changing `instance_type` in `wrangler.jsonc` triggers a container rollout that takes 2-3 minutes. Check status with:
```bash
npx wrangler containers info a033dfe8-c682-4146-baf3-cbcb96ad9c3f
```
Look for `"starting": 0` and `"healthy": N` to confirm completion.

### 4. SDK startup is ~30s from exec start
- `npx tsx` TypeScript compilation: ~5s
- MCP server creation: ~1s
- Claude Code CLI initialization: ~20s
- First API call: ~5s
- Total before first visible event: ~37s

### 5. wrangler tail doesn't show logs from long-running handlers
DO `console.log` calls inside `webSocketMessage()` are buffered and only visible in `wrangler tail` when the handler returns. For a generation that takes 5+ minutes, logs appear all at once at the end. Use WebSocket-based debug messages instead.

### 6. onOutput needs line buffering
The sandbox `exec()` `onOutput` callback streams data in arbitrary chunks, not by line. JSON messages split across chunks cause silent `JSON.parse` failures. Always accumulate a line buffer.

### 7. standard-1 is too small for Claude Code
Claude Code CLI + subagents + MCP server need at minimum `standard-2` (1 vCPU, 6 GiB). The 0.5 vCPU / 4 GiB of standard-1 causes the process to hang mid-execution.

---

## Files Modified This Session

| File | Changes |
|------|---------|
| `cloudflare/src/durable-objects/campaign-session.ts` | Added line buffer for partial JSON, WS debug messages, heartbeat timer, removed `stream: true` (not in API) |
| `cloudflare/wrangler.jsonc` | Upgraded `instance_type` from `standard-1` to `standard-2` |
| `test-e2e.mjs` | Increased timeout to 15 min, added ping keepalive, updated prompt with URL + style |

---

## Deployment Commands Reference

```bash
# From cloudflare/ directory:

# Deploy Worker + container
npx wrangler deploy

# Set secrets (ALWAYS strip newlines!)
grep '^ANTHROPIC_API_KEY=' ../.env | cut -d= -f2- | tr -d '\n' | npx wrangler secret put ANTHROPIC_API_KEY
grep '^FAL_KEY=' ../.env | cut -d= -f2- | tr -d '\n' | npx wrangler secret put FAL_KEY

# Check container status
npx wrangler containers list
npx wrangler containers info a033dfe8-c682-4146-baf3-cbcb96ad9c3f

# Tail logs (only shows completed handler logs)
npx wrangler tail

# Health check
curl https://creative-agent.alphasapien17.workers.dev/health
```

---

## Container Instance Types Reference

| Type | vCPU | RAM | Disk | Cost/vCPU-sec |
|------|------|-----|------|--------------|
| lite | 1/16 | 256 MiB | 2 GB | cheapest |
| basic | 1/4 | 1 GiB | 4 GB | |
| standard-1 | 1/2 | 4 GiB | 8 GB | |
| **standard-2** | **1** | **6 GiB** | **12 GB** | **current** |
| standard-3 | 2 | 8 GiB | 16 GB | |
| standard-4 | 4 | 12 GiB | 20 GB | |

Source: https://developers.cloudflare.com/containers/platform-details/limits/
