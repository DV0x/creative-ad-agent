# End-to-End Testing Session — 2026-03-01

> Status: In progress, paused for next session
> Branch: `new-ui`
> Deployed URL: https://creative-agent.alphasapien17.workers.dev

---

## Summary

First end-to-end testing session for the Cloudflare deployment (Phases 1-4b). Discovered and fixed 4 infrastructure issues. The sandbox now starts and executes the agent-runner, but streaming output hasn't been verified yet due to a stuck generation.

---

## Issues Found & Fixed

### 1. `s3fs` not installed in container (FIXED)

**Error:** `S3FSMountError: S3FS mount failed: bash: line 75: s3fs: command not found`

**Cause:** `sandbox.mountBucket()` runs `s3fs` inside the container to FUSE-mount R2. The Dockerfile didn't include it.

**Fix:** Added to `cloudflare/sandbox/Dockerfile`:
```dockerfile
RUN apt-get update && apt-get install -y s3fs fuse && rm -rf /var/lib/apt/lists/*
```

**Deployment gotcha:** After changing the Dockerfile, wrangler may not rebuild/push the Docker image on subsequent deploys if only Worker code changes. Had to clear local Docker images (`docker rmi`, `docker builder prune -f`) and redeploy to force a fresh push. Watch for the diff in deploy output — the container image line must show a `+`/`-` change, not just context.

### 2. R2 mount prefix missing leading `/` (FIXED)

**Error:** `InvalidMountConfigError: Prefix must start with '/': "users/anonymous"`

**Cause:** `mountBucket()` requires the prefix to start with `/`.

**Fix:** Changed in `cloudflare/src/durable-objects/campaign-session.ts`:
```typescript
// Before:
prefix: `users/${this.userId}`,
// After:
prefix: `/users/${this.userId}`,
```

### 3. Stale FUSE mount blocking re-mount (FIXED)

**Error:** `S3FSMountError: S3FS mount failed: s3fs: MOUNTPOINT directory /mnt/r2 is not empty`

**Cause:** A failed `mountBucket()` call left a stale FUSE mount or residual files at `/mnt/r2`. Subsequent mount attempts fail because the directory isn't empty.

**Fix:** Added cleanup step before mounting in `campaign-session.ts`:
```typescript
await sandbox.exec('fusermount -u /mnt/r2 2>/dev/null; umount /mnt/r2 2>/dev/null; rm -rf /mnt/r2; mkdir -p /mnt/r2');
```

### 4. ANTHROPIC_API_KEY mismatch (FIXED)

**Error:** `Failed to authenticate. API Error: 403 {"error":{"type":"forbidden","message":"Request not allowed"}}`

**Cause:** The Wrangler secret for `ANTHROPIC_API_KEY` didn't match the working key in `.env`.

**Fix:** Re-set the secret from `.env`:
```bash
cd cloudflare
grep ANTHROPIC_API_KEY ../.env | cut -d= -f2- | npx wrangler secret put ANTHROPIC_API_KEY
```

---

## Current State (Where to Resume)

### What works
- Health check: `GET /health` returns `{"status":"ok","d1":{"connected":true},"r2":{"bound":true}}`
- WebSocket connection: Connects, receives initial ACK
- Campaign creation: D1 creates campaign records on `generate` messages
- Phase events: `parse` phase emitted correctly
- Sandbox startup: Container starts with s3fs + fuse installed
- R2 FUSE mount: `mountBucket()` succeeds with per-user prefix
- Agent-runner execution: `npx tsx /app/agent-runner.ts` starts inside sandbox

### What's stuck / untested
- **Stuck generation**: The last test left a generation running in the DO (`isGenerating = true`). The WebSocket test timed out (client-side), but the DO kept running. New generate requests are blocked with "A generation is already in progress."
- **Streaming events**: After the `parse` phase, no further events were received during the 5-10 minute test window. Unknown if this is because the Claude Agent SDK takes very long to start (3+ minutes observed for the 403 case) or if there's a streaming issue.
- **Full generation flow**: phases, files, images, complete — all untested
- **Cancel**: Not tested
- **Follow-up/resume**: Not tested
- **REST API**: Not tested (campaigns list, campaign detail, assets)
- **Image serving**: Not tested (`GET /images/...` from R2)

### To do in next session

1. **Cancel the stuck generation**: Connect to WS and send `{ "type": "cancel" }` to unblock the DO. Or wait ~10 minutes for the sandbox `sleepAfter` to expire, then the DO should eventually recover.

2. **Test streaming visibility**: Add stderr logging to the agent-runner to see progress:
   - Check sandbox logs: `npx wrangler tail` (streams Worker/DO console output)
   - Or add debug logging to `onOutput` callback to track what comes from the sandbox

3. **Consider SDK startup time**: The Claude Agent SDK inside the sandbox has significant startup overhead:
   - `npx tsx` compiles TypeScript on the fly (~10-30s)
   - Claude Code CLI initialization (~30-60s)
   - First API call with large orchestrator prompt (~30-60s)
   - Total before first event: potentially 2-4 minutes
   - Consider pre-compiling TS to JS in the Dockerfile to reduce startup

4. **Run full e2e test**: After cancelling, run a fresh generation with a 15-minute timeout

5. **Test all flows**: cancel, follow-up/resume, reconnect/subscribe, REST API, image serving

---

## Streaming Pipeline — How It Should Work

Understanding the full streaming chain is critical for debugging. If any link breaks, no events reach the client.

### Chain: Agent SDK → stdout → onOutput → messageQueue → processSDKMessage → emitEvent → WebSocket

```
1. agent-runner.ts (inside sandbox)
   │  SDK query() yields messages
   │  process.stdout.write(JSON.stringify(message) + '\n')
   ▼
2. sandbox.exec() onOutput callback (in DO)
   │  Receives stdout data chunks
   │  Splits by '\n', JSON.parse each line
   │  Pushes parsed messages into messageQueue[]
   ▼
3. Concurrent drain loop (in DO)
   │  Polls messageQueue every 10ms
   │  Calls processSDKMessage(msg, ctx) for each
   ▼
4. processSDKMessage() (sdk-message-parser.ts)
   │  Inspects message.type and content blocks
   │  Calls ctx.emitEvent() for each WS event
   │  Writes to D1 for persistence
   ▼
5. emitEvent() → eventBuffer.append() + ws.send()
   │  Buffers for reconnect replay
   │  Sends JSON to connected WebSocket
   ▼
6. Browser receives event → Zustand store update → UI render
```

### Expected Event Sequence (Full Generation)

A successful generation should produce events in this order:

```
ACK          ← campaignId, sessionId (from handleGenerate)
PHASE:parse  ← "Parsing Request" (from handleGenerate)
─── sandbox starts, agent-runner boots ───
(silence for 2-4 min while SDK initializes + first API call)
─── first SDK messages arrive ───
TOOL_START   ← Task (research subagent)
PHASE:research ← "Researching"
TOOL_END     ← Task complete
FILE         ← fileType: "research", content: research doc
TOOL_START   ← Skill (hook-methodology)
PHASE:hooks  ← "Generating Hooks"
TOOL_END     ← Skill complete
FILE         ← fileType: "hooks", content: hook bank
TOOL_START   ← Skill (art-style)
PHASE:art    ← "Creating Art Direction"
TOOL_END     ← Skill complete
FILE         ← fileType: "prompts", content: prompts.json
TOOL_START   ← mcp__nano-banana__generate_ad_images
PHASE:images ← "Generating Images" (imageCount: N)
TOOL_END     ← MCP tool complete (contains image results)
IMAGE        ← urlPath, hookType: "stat", imageIndex: 1
IMAGE        ← urlPath, hookType: "story", imageIndex: 2
IMAGE        ← urlPath, hookType: "fomo", imageIndex: 3
...          ← (up to 6 images)
MESSAGE      ← assistant summary text
COMPLETE     ← summary, imageCount, duration
```

### Phase Detection Logic (sdk-message-parser.ts)

| SDK Message | Detected When | WS Event |
|-------------|---------------|----------|
| `assistant` + `tool_use: Task` with research desc | `block.input.subagent_type === 'Explore'` or description includes "research" | `phase: "research"` |
| `assistant` + `tool_use: Skill` | `block.input.skill === 'hook-methodology'` | `phase: "hooks"` |
| `assistant` + `tool_use: Skill` | `block.input.skill === 'art-style'` | `phase: "art"` |
| `assistant` + `tool_use: mcp__nano-banana__generate_ad_images` | Tool name match | `phase: "images"` |
| `assistant` + `tool_use: Write` | `file_path` contains "research", "hook", or "prompt" | `file` event with content |
| `user` + `tool_result` with `images` array | Parsed from tool result JSON | `image` events (one per image) |
| `result` | `message.type === 'result'` | `complete` (emitted by runGeneration, not parser) |

### Key Streaming Concerns

1. **Long silence after `parse`**: The agent-runner needs to:
   - Compile TS via `npx tsx` (~10-30s)
   - Claude Code CLI initializes (~30-60s)
   - First API call with orchestrator system prompt (~30-60s)
   - First SDK message (`system.init`) is NOT emitted as a WS event — it only saves `sdk_session_id` to D1
   - First visible event is when the orchestrator calls `Task` (research) — this could be 2-4 minutes after sandbox starts

2. **`onOutput` buffering**: The sandbox `exec()` streams stdout in chunks. A single chunk may contain multiple JSON lines (split by `\n`) or partial lines (incomplete JSON). The current code splits by `\n` and tries `JSON.parse` on each — partial lines will fail silently and that message is lost.

3. **`system.init` is invisible**: The first SDK message is `system.init` with `session_id`. The parser saves it to D1 but emits no WS event. If we add logging for this, it confirms the SDK is running.

4. **Drain loop timing**: The loop polls every 10ms. If `processSDKMessage()` does slow D1 writes, the queue could back up, but events still get emitted in order.

---

## Next Session Testing Plan

### Step 0: Cancel stuck generation

The DO for `user-anonymous` has `isGenerating = true` from the last test. Must cancel before testing:

```bash
# Quick cancel script:
node -e "
const WebSocket = require('./server/node_modules/ws');
const ws = new WebSocket('wss://creative-agent.alphasapien17.workers.dev/ws');
ws.on('open', () => { ws.send(JSON.stringify({ type: 'cancel' })); console.log('Sent cancel'); });
ws.on('message', d => { console.log(JSON.parse(d.toString())); });
setTimeout(() => { ws.close(); process.exit(0); }, 5000);
"
```

If cancel doesn't work (sandbox already dead), the `isGenerating` flag is transient — evicting the DO (waiting for idle timeout or redeploying) will reset it.

### Step 1: Verify streaming works

Add debug logging to the DO to confirm onOutput is firing:

In `campaign-session.ts`, add to the `onOutput` callback:
```typescript
onOutput: (stream: string, data: string) => {
  console.log(`[sandbox ${stream}] ${data.substring(0, 200)}`);  // ADD THIS
  if (stream === 'stdout') { ... }
}
```

Then run `npx wrangler tail` in one terminal to see DO logs, and `node test-e2e.mjs` in another.

**What to look for in wrangler tail:**
- `[sandbox stdout] {"type":"system","subtype":"init",...}` → SDK started, streaming works
- `[sandbox stderr] ...` → errors or SDK debug output
- No sandbox output at all → exec didn't start or is still initializing

### Step 2: Full generation test

Run with 15-minute timeout (update `test-e2e.mjs`). Expected timeline:
- 0-5s: ACK + parse phase
- 5s-3min: Sandbox boot + SDK initialization (silence)
- 3-5min: First SDK messages (system.init, research phase)
- 5-8min: Research + hooks
- 8-12min: Art direction + image generation
- 12-15min: Complete

### Step 3: Test cancel

Start a generation, wait for at least one phase event, then send cancel:
```json
{ "type": "cancel" }
```
Expect: `sandbox.destroy()` called, campaign status `cancelled`, WS ack.

### Step 4: Test follow-up/resume

After a completed generation, send:
```json
{ "type": "follow_up", "prompt": "make them blue", "campaignId": "<id-from-complete>" }
```
Expect: SDK resumes from R2 JSONL, new images appended with continued indexes.

### Step 5: REST API + image serving

```bash
# List campaigns
curl https://creative-agent.alphasapien17.workers.dev/api/campaigns

# Get campaign detail
curl https://creative-agent.alphasapien17.workers.dev/api/campaigns/<id>

# Serve image from R2
curl -I https://creative-agent.alphasapien17.workers.dev/images/<sessionId>/<filename>
```

### Step 6: Reconnect/subscribe

Disconnect during active generation, reconnect, send:
```json
{ "type": "subscribe", "sessionId": "<id>", "lastEventId": 0 }
```
Expect: All buffered events replayed.

---

## Potential Issues to Investigate

1. **Partial JSON lines in onOutput**: If stdout chunks split a JSON line across two callbacks, `JSON.parse` will fail on both halves and that SDK message is silently lost. Fix: accumulate a line buffer and only parse complete lines.

2. **SDK startup optimization**: `npx tsx` compiles TS at runtime. Pre-compiling in the Dockerfile (`npx tsx --build` or `tsc`) would cut 10-30s from startup.

3. **Sandbox reuse across deploys**: `getSandbox()` with a fixed ID (`user-anonymous`) reuses the same container. After deploying a new image, the old container keeps running until `sleepAfter` expires. For testing, use a unique sandbox ID or destroy the old sandbox.

---

## Files Modified This Session

| File | Changes |
|------|---------|
| `cloudflare/sandbox/Dockerfile` | Added `s3fs fuse` apt packages for R2 FUSE mount |
| `cloudflare/src/durable-objects/campaign-session.ts` | Fixed prefix (`/users/...`), added FUSE cleanup before mount |
| `test-e2e.mjs` | Created WebSocket test script (project root, not committed) |

---

## Test Script

A WebSocket test script was created at `test-e2e.mjs` (project root). Usage:

```bash
cd /Users/chakra/Documents/Agents/creative_agent
node test-e2e.mjs
```

It connects to the deployed worker, sends a `generate` message, and logs all received events. Uses the `ws` package from `server/node_modules/`. 10-minute timeout.

---

## Deployment Commands Reference

```bash
# From cloudflare/ directory:

# Deploy Worker + container
npx wrangler deploy

# Force fresh Docker build (if wrangler caches old image):
docker rmi $(docker images creative-agent-sandbox -q) 2>/dev/null
docker builder prune -f
npx wrangler deploy

# Update a secret
grep ANTHROPIC_API_KEY ../.env | cut -d= -f2- | npx wrangler secret put ANTHROPIC_API_KEY

# List secrets
npx wrangler secret list

# Tail logs (live)
npx wrangler tail
```
