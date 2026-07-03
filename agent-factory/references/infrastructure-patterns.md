# Reusable Cloudflare Infrastructure Patterns

Eight battle-tested patterns extracted from a production AI agent system (ad campaign generator) running on Cloudflare Workers, Durable Objects, Sandbox Containers, R2, and D1. Each pattern is domain-agnostic and can be adapted for any long-running agent architecture.

---

## Pattern 1: DO Orchestrator

**Problem it solves:** You need a single coordination point per user that manages WebSocket connections, orchestrates long-running agent work, survives code deploys, and handles reconnects gracefully.

### How it works

A single Durable Object instance per user (routed via `idFromName(userId)`) acts as the central coordinator. It owns the WebSocket lifecycle, dispatches work to sandbox containers, and maintains an event buffer for reconnect replay.

```
class SessionDO extends DurableObject {
  // --- Transient state (lost on DO reset) ---
  userId: string
  isGenerating: boolean
  campaignId: string | null
  sandbox: Sandbox | null
  agentProcessId: string | null
  eventBuffer: EventBuffer
  abortController: AbortController | null

  // --- Persisted state (survives DO reset) ---
  // Stored via this.state.storage.put/get:
  //   activeSession, userId, agentProcessId, agentCampaignId

  async fetch(request) {
    // WebSocket upgrade: extract userId from header, store it
    this.userId = request.headers.get('X-User-Id')
    const [client, server] = new WebSocketPair()
    this.state.acceptWebSocket(server)  // Hibernation API
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws, message) {
    const data = JSON.parse(message)
    switch (data.type) {
      case 'subscribe':    return this.handleSubscribe(ws, data)
      case 'generate':     return this.handleGenerate(ws, data)
      case 'cancel':       return this.handleCancel()
    }
  }

  // --- Three send methods ---

  emitEvent(event) {
    // Buffer for reconnect replay + broadcast to all connected clients
    this.eventBuffer.push(event)
    this.broadcastToAll(event)
  }

  sendWS(event) {
    // Broadcast only (no buffer) — for transient status updates
    this.broadcastToAll(event)
  }

  sendToWS(ws, event) {
    // Targeted — for subscribe responses, error replies
    ws.send(JSON.stringify(event))
  }

  broadcastToAll(event) {
    for (const ws of this.state.getWebSockets()) {
      ws.send(JSON.stringify(event))
    }
  }
}
```

**Fire-and-forget with alarm heartbeat:**

```
async handleGenerate(ws, data) {
  this.isGenerating = true
  this.startKeepAlive()          // Schedule first alarm
  this.runGeneration(data)       // Fire-and-forget (no await)
  this.sendToWS(ws, { type: 'ack' })  // Handler returns immediately
}

startKeepAlive() {
  this.state.storage.setAlarm(Date.now() + 10_000)  // 10s heartbeat
}

async alarm() {
  if (this.isGenerating) {
    this.flushTailLogs()             // Emit buffered logs
    this.pollCompletionMarker()      // Check R2 for completion
    this.state.storage.setAlarm(Date.now() + 30_000)  // Reschedule
  }
  // If not generating, alarm self-terminates (no reschedule)
}
```

**EventBuffer ring buffer:**

```
class EventBuffer {
  private events: Event[] = []
  private nextId = 1
  private MAX = 1000
  private TRIM_TO = 500

  push(event) {
    event.id = this.nextId++
    this.events.push(event)
    if (this.events.length > this.MAX) {
      this.events = this.events.slice(-this.TRIM_TO)
    }
  }

  since(lastEventId: number): Event[] {
    return this.events.filter(e => e.id > lastEventId)
  }
}
```

**Persist/restore for surviving DO resets:**

```
async persistSession() {
  await this.state.storage.put({
    activeSession: this.sessionData,
    userId: this.userId,
    agentProcessId: this.agentProcessId,
    agentCampaignId: this.campaignId,
  })
}

async restoreSession(freshUserId?: string) {
  const stored = await this.state.storage.get([
    'activeSession', 'userId', 'agentProcessId', 'agentCampaignId'
  ])
  // Never overwrite fresh header userId with stale stored one
  this.userId = freshUserId ?? stored.get('userId')

  // Staleness check: verify D1 before trusting isGenerating
  if (stored.get('agentCampaignId')) {
    const campaign = await this.db.getCampaign(stored.get('agentCampaignId'))
    if (campaign?.status === 'completed' || campaign?.status === 'failed') {
      this.isGenerating = false  // Don't restore stale flag
      return
    }
  }
  // Restore remaining state...
}
```

### Adaptation notes

- **Autonomous agents:** Use `alarm()` as a scheduler. After completing a task, `setAlarm` for the next check interval. The alarm handler becomes your agent loop.
- **Multi-agent:** Instead of one DO per user, route by `idFromName(agentId)` if agents are independent. Keep per-user routing if agents share state.
- **Higher throughput:** Increase `MAX` on EventBuffer if clients disconnect for long periods. Decrease `TRIM_TO` if memory is a concern.
- **Multi-tab support:** `getWebSockets()` returns all connected tabs. `emitEvent` broadcasts to all. No extra work needed.

---

## Pattern 2: Sandbox Container Agent

**Problem it solves:** You need to run a long-lived AI agent process (Claude CLI, LangChain, etc.) in an isolated container that survives between turns, mounts cloud storage, and handles infrastructure flakiness (IP blocks, cold starts).

### How it works

A Docker container runs a persistent agent-runner process. Turn 1 receives its prompt via environment variable. Subsequent turns use file-based IPC — the DO writes a JSON file to the container, and the agent-runner polls for it.

```
# Dockerfile
FROM node:22-slim
RUN npm i -g @anthropic-ai/claude-code
RUN apt-get install -y s3fs fuse
COPY agent/ /app/agent/
COPY agent-runner.ts /app/
# Pre-compile TypeScript (saves ~30s on cold start)
RUN npx tsx --compile /app/agent-runner.ts
WORKDIR /app
CMD ["npx", "tsx", "/app/agent-runner.ts"]
```

**Container lifecycle (DO side):**

```
async getOrCreateSandbox(userId: string): Promise<Sandbox> {
  const containerId = `user-${userId}-v2`
  const sandbox = await env.SANDBOX.get(containerId, {
    instance_type: 'standard-2',  // 1 vCPU, 6 GiB
    sleepAfter: '2h',
    max_instances: 50,
  })

  // Mount R2 storage
  await sandbox.unmountBucket('/mnt/r2').catch(() => {})  // Ignore if not mounted
  await sandbox.mountBucket('my-bucket', '/mnt/r2', {
    endpoint: R2_ENDPOINT,
    provider: 'cloudflare-r2',
    credentials: { accessKeyId, secretAccessKey },
    prefix: `users/${userId}/`,
  })

  // Pre-flight IP check
  await this.verifyApiAccess(sandbox, attempt)

  return sandbox
}

async verifyApiAccess(sandbox, attempt) {
  const result = await sandbox.exec('curl', ['-s', '-o', '/dev/null',
    '-w', '%{http_code}', 'https://api.anthropic.com/v1/messages',
    '-H', `x-api-key: ${apiKey}`, '-H', 'anthropic-version: 2023-06-01'])
  if (result.stdout.trim() === '403' && attempt < 3) {
    await sandbox.destroy()
    // Retry with unique ID to get different IP
    return this.getOrCreateSandbox(userId, attempt + 1)
  }
}
```

**Agent-runner (inside container):**

```
// agent-runner.ts — runs inside the sandbox container
const sdk = new ClaudeSDK()

// Turn 1: prompt from environment variable
let prompt = process.env.INITIAL_PROMPT
console.log(JSON.stringify({ type: 'turn_start', turn: 1 }))
let result = await sdk.query(prompt)
console.log(JSON.stringify({ type: 'turn_complete', turn: 1 }))
writeCompletionMarker(result)

// Turn N: poll for next prompt
let turn = 2
while (true) {
  const promptFile = '/app/next-prompt.json'
  while (!fs.existsSync(promptFile)) {
    await sleep(500)
  }
  const nextPrompt = JSON.parse(fs.readFileSync(promptFile, 'utf8'))
  fs.unlinkSync(promptFile)

  console.log(JSON.stringify({ type: 'turn_start', turn }))
  result = await sdk.query(nextPrompt.message)
  console.log(JSON.stringify({ type: 'turn_complete', turn }))
  writeCompletionMarker(result)
  turn++
}

function writeCompletionMarker(result) {
  // Write to both local disk (for log-based detection) and R2 (for alarm polling)
  const marker = { completedAt: Date.now(), ...result }
  fs.writeFileSync('/app/turn-result.json', JSON.stringify(marker))
  fs.writeFileSync('/mnt/r2/turn-result.json', JSON.stringify(marker))
}
```

### Adaptation notes

- **Different AI backends:** Replace Claude CLI with any long-running process (Python agent, LangChain, CrewAI). The file-based IPC pattern is universal.
- **Smaller workloads:** Use `standard-1` (0.5 vCPU, 3 GiB) if your agent does not need much memory. Adjust `sleepAfter` based on expected turn frequency.
- **No IP issues:** If your API provider does not block Cloudflare IPs, remove the pre-flight check entirely.
- **Multiple tools:** Install additional CLI tools in the Dockerfile. The container is a full Linux environment.
- **Stateless agents:** If your agent does not need to persist between turns, skip the polling loop and use `sandbox.exec()` directly for each turn.

---

## Pattern 3: Streaming Pipeline

**Problem it solves:** You need to stream structured events from a sandboxed agent process to a browser client in real time, parsing semantic meaning from raw stdout along the way.

### How it works

The agent writes JSON lines to stdout. The DO reads them via `streamProcessLogs()`, parses each line, extracts semantic events, and forwards them over WebSocket.

```
Agent stdout (JSON lines)
  → streamProcessLogs() (SSE transport from sandbox)
    → parseSSEStream() (extract data: frames)
      → lineBuffer (reassemble split lines)
        → JSON.parse() (parse each complete line)
          → processSDKMessage() (extract semantic events)
            → emitEvent() (buffer + WebSocket broadcast)
              → Client WebSocket handler
```

**Dual-path philosophy:** Streaming is best-effort for live UX. The filesystem (R2 + D1) is the source of truth. If a stream message is lost, the data is still recoverable from storage.

**processSDKMessage extracts semantic events:**

```
function processSDKMessage(msg) {
  // Phase detection from tool usage
  if (msg.type === 'tool_use' && msg.tool === 'research_brand') {
    emitEvent({ type: 'phase', phase: 'researching' })
  }

  // File creation from Write tool
  if (msg.type === 'tool_use' && msg.tool === 'Write') {
    emitEvent({ type: 'file_created', path: msg.params.file_path })
    saveToD1(msg.params.file_path, msg.params.content)
  }

  // Image detection from tool results
  if (msg.type === 'tool_result' && msg.content?.includes('.png')) {
    emitEvent({ type: 'image_ready', url: extractImageUrl(msg) })
  }

  // Text content for chat display
  if (msg.type === 'text') {
    emitEvent({ type: 'assistant_message', content: msg.text })
  }
}
```

**Sentinel markers for replay skip:**

```
// Agent-side: print sentinel before each turn
console.log(JSON.stringify({ type: 'turn_start', turn: turnNumber }))

// DO-side: on re-attach, skip everything before latest turn_start
function attachStreamHandler(process, skipReplay = false) {
  let foundLatestTurnStart = !skipReplay  // If not skipping, process everything
  process.streamLogs((line) => {
    const parsed = JSON.parse(line)
    if (parsed.type === 'turn_start') {
      foundLatestTurnStart = true
      return  // Don't emit the sentinel itself
    }
    if (!foundLatestTurnStart) return  // Skip replayed history
    processSDKMessage(parsed)
  })
}
```

### Adaptation notes

- **Different output formats:** If your agent does not emit JSON lines, adapt `processSDKMessage` to parse whatever format it uses (XML, plain text with markers, protocol buffers).
- **Richer events:** Add domain-specific event types. The pipeline is just a parser — add cases to `processSDKMessage` for your domain.
- **Backpressure:** If the agent produces events faster than the client can consume, the EventBuffer naturally handles this. The client catches up on reconnect via `since(lastEventId)`.
- **Multiple clients:** `broadcastToAll` via `getWebSockets()` handles multi-tab natively. No extra pub/sub needed.

---

## Pattern 4: Multi-Layer Completion Detection

**Problem it solves:** Network connections drop, SSE streams time out, containers crash, and processes hang. You need redundant detection so that no completed (or failed) generation goes unnoticed.

### How it works

Four independent layers race to detect completion. The first one to fire wins. All layers check `isGenerating` to avoid double-processing.

```
                    ┌─────────────────────┐
                    │   runGeneration()    │
                    └──────┬──────────────┘
                           │ starts all layers
            ┌──────────────┼──────────────────┐
            ▼              ▼                  ▼
     Layer 1: waitForLog   Layer 2: waitForExit   Layer 3: Alarm polling
     (SSE log stream)      (process exit event)   (every 30s)
            │              │                  │
            └──────────────┼──────────────────┘
                           ▼
                    First to fire calls
                    handleCompletion()
                           │
                    ┌──────┴──────┐
                    │ isGenerating │──▶ false? → skip (already handled)
                    │   = false    │
                    └─────────────┘

     Layer 4: Client /recover endpoint (last resort, user-triggered)
```

**Layer 1 — waitForLog (primary):**

```
async waitForLog(processId: string, sentinel: string) {
  let attempts = 0
  const MAX_ATTEMPTS = 10

  while (attempts < MAX_ATTEMPTS && this.isGenerating) {
    try {
      // SSE stream from sandbox — watches for sentinel in stdout
      await sandbox.waitForLog(processId, sentinel, { timeout: 120_000 })
      return 'completed'
    } catch (err) {
      if (err.message.includes('timeout')) {
        attempts++
        // Re-attach: checks existing logs first, resolves immediately
        // if sentinel already printed
        continue
      }
      throw err
    }
  }
}
```

**Layer 2 — waitForExit (crash detection):**

```
async waitForExit(processId: string) {
  const exitCode = await sandbox.waitForExit(processId)
  if (!this.isGenerating) return  // Another layer already handled it

  // Process crashed or exited — check if work was actually completed
  const logs = await sandbox.getProcessLogs(processId)
  const hasCompletionMarker = logs.includes('turn_complete')
  const r2MarkerExists = await this.checkR2Marker()

  if (hasCompletionMarker || r2MarkerExists) {
    await this.handleCompletion('completed')
  } else {
    await this.handleCompletion('failed', exitCode)
  }
}
```

**Layer 3 — Alarm polling (background):**

```
async alarm() {
  if (!this.isGenerating) return

  // Check R2 for completion marker
  const marker = await this.env.R2.get(`users/${userId}/turn-result.json`)
  if (marker) {
    await this.handleCompletion('completed')
    return
  }

  // Snapshot logs as a diagnostic breadcrumb
  if (this.agentProcessId && this.sandbox) {
    const logs = await this.sandbox.getProcessLogs(this.agentProcessId)
    this.log(`[alarm] log snapshot: last 200 chars: ${logs.slice(-200)}`)
  }

  // Reschedule
  this.state.storage.setAlarm(Date.now() + 30_000)
}
```

**Layer 4 — Client /recover endpoint:**

```
// Client calls POST /api/campaigns/:id/recover after timeout
async handleRecover(campaignId) {
  const files = await db.getCampaignFiles(campaignId)
  const images = await db.getCampaignImages(campaignId)
  if (files.length > 0 || images.length > 0) {
    await db.updateCampaignStatus(campaignId, 'completed')
    return { status: 'recovered', files: files.length, images: images.length }
  }
  return { status: 'no_data' }
}
```

### Adaptation notes

- **Simpler setups:** If your agent runs for under 2 minutes, Layer 1 alone is sufficient. Add layers as your reliability requirements increase.
- **Different storage:** Replace R2 marker checks with whatever your persistence layer is (S3, database flag, Redis key).
- **Alerting:** Add a notification (email, Slack) in Layer 3 if the alarm fires more than N times without completion. This catches zombie processes.
- **Safety net timeout:** Adjust the 2h timeout based on your maximum expected generation time. Set it to 2x your worst case.

---

## Pattern 5: State Persistence & Recovery

**Problem it solves:** Durable Object code deploys reset all in-memory state, containers go to sleep, and browsers refresh. You need every layer to recover gracefully without losing user work.

### How it works

State is split into three tiers with different persistence strategies:

```
┌──────────────────────────────────────────────────────┐
│ Tier 1: Ephemeral (lost on DO reset)                 │
│  isGenerating, sandbox ref, eventBuffer,             │
│  abortController, WebSocket refs                     │
│  → Reconstructed from Tier 2 + Tier 3 on restart     │
├──────────────────────────────────────────────────────┤
│ Tier 2: DO Storage (survives DO reset, fast access)  │
│  activeSession, userId, agentProcessId,              │
│  agentCampaignId                                     │
│  → this.state.storage.put() / .get()                 │
├──────────────────────────────────────────────────────┤
│ Tier 3: D1 + R2 (survives everything, source of truth│
│  Campaign data, files, images, messages              │
│  → SQL queries, R2 object reads                      │
└──────────────────────────────────────────────────────┘
```

**Restore sequence on DO reset:**

```
async restoreSession(freshUserId?: string) {
  // 1. Load from DO storage (Tier 2)
  const stored = await this.state.storage.get([
    'activeSession', 'userId', 'agentProcessId', 'agentCampaignId'
  ])

  // 2. Never overwrite fresh userId from HTTP header with stale stored value
  this.userId = freshUserId ?? stored.get('userId') ?? 'anonymous'

  // 3. Staleness check against D1 (Tier 3)
  const campaignId = stored.get('agentCampaignId')
  if (campaignId) {
    const campaign = await this.db.query(
      'SELECT status FROM campaigns WHERE id = ?', [campaignId]
    )
    if (campaign?.status === 'completed' || campaign?.status === 'failed') {
      // D1 says done — don't restore isGenerating
      this.isGenerating = false
      await this.state.storage.delete('agentProcessId')
      return
    }
  }

  // 4. Restore remaining state
  this.agentProcessId = stored.get('agentProcessId')
  this.campaignId = campaignId
  this.isGenerating = !!this.agentProcessId
}
```

**File hydration for cold container starts:**

```
async hydrateFilesFromD1(sandbox, campaignId) {
  const files = await this.db.query(
    'SELECT file_type, content FROM campaign_files WHERE campaign_id = ?',
    [campaignId]
  )
  for (const file of files) {
    const targetPath = FILE_TYPE_TO_PATH[file.file_type]
    await sandbox.exec('node', ['-e', `
      const fs = require('fs');
      fs.mkdirSync(require('path').dirname(${JSON.stringify(targetPath)}), {recursive:true});
      fs.writeFileSync(${JSON.stringify(targetPath)}, process.env.CONTENT);
    `], { env: { CONTENT: file.content } })
  }
}
```

**Client-side tracking:**

```
// localStorage per session
localStorage.set(`session:${sessionId}:lastEventId`, eventId)
localStorage.set(`session:${sessionId}:activeSession`, sessionData)

// On reconnect, send lastEventId to get missed events from EventBuffer
ws.send(JSON.stringify({
  type: 'subscribe',
  sessionId,
  lastEventId: localStorage.get(`session:${sessionId}:lastEventId`)
}))
```

### Adaptation notes

- **No D1:** Replace D1 queries with your database of choice. The three-tier pattern (ephemeral / DO storage / database) works with any stack.
- **Larger state:** If Tier 2 state exceeds DO storage limits (~128 KB per key), serialize to a single JSON blob or move to D1.
- **Multiple campaigns per user:** Track `agentCampaignId` to avoid restoring state for the wrong campaign. The staleness check catches this.
- **Client frameworks:** The localStorage tracking pattern works with any client. Zustand, Redux, or vanilla JS can all store `lastEventId`.

---

## Pattern 6: Cancel/Abort

**Problem it solves:** Users click "cancel" during a long generation. You need to stop the agent, clean up resources, update the database, and avoid race conditions where cancel overlaps with setup or completion.

### How it works

The key insight: `handleCancel` does NOT perform cleanup. It only sets a signal. The generation function's `finally` block handles cleanup, because only it knows which resources it created.

```
async handleCancel() {
  if (!this.isGenerating) return
  this.abortController?.abort()
  // That's it. No kill, no D1 update, no sandbox cleanup.
  // The generation function handles everything in its finally block.
}

async runGeneration(data) {
  this.abortController = new AbortController()
  const { signal } = this.abortController

  try {
    // Check abort before expensive setup
    if (signal.aborted) return

    const sandbox = await this.getOrCreateSandbox()

    // Check abort again after setup (cancel may have fired during setup)
    if (signal.aborted) return

    const processId = await sandbox.startProcess(/* ... */)
    this.agentProcessId = processId
    await this.persistSession()

    // Wait for completion (Layer 1-3)
    await this.waitForCompletion(processId)

  } finally {
    if (signal.aborted) {
      // Cancel path: kill agent, unmount R2, update D1 to 'cancelled'
      if (this.agentProcessId) {
        await sandbox.killProcess(this.agentProcessId).catch(() => {})
      }
      await sandbox.unmountBucket('/mnt/r2').catch(() => {})
      await this.db.updateCampaignStatus(this.campaignId, 'cancelled')
      this.emitEvent({ type: 'generation_cancelled' })
    } else {
      // Normal completion: keep container warm, update D1 to 'completed'
      await this.reconcileFiles()
      await this.db.updateCampaignStatus(this.campaignId, 'completed')
      this.emitEvent({ type: 'generation_complete' })
    }
    this.isGenerating = false
    this.agentProcessId = null
  }
}
```

**Why waitForExit cooperates:**

```
async waitForExit(processId) {
  const exitCode = await sandbox.waitForExit(processId)
  if (!this.isGenerating) return  // Cancel already set isGenerating=false
  // ... normal exit handling
}
```

### Adaptation notes

- **Graceful shutdown:** If your agent supports graceful shutdown (SIGTERM handling), send the signal before kill. Add a timeout and force-kill if it does not exit.
- **Partial results:** If your domain can use partial work (e.g., 3 of 6 images generated), check what was completed in the finally block before marking as cancelled.
- **Undo on cancel:** If your agent made external side effects (API calls, emails), the finally block is where you add compensating actions.
- **Nested cancellation:** If your agent spawns sub-processes, propagate the abort signal to all of them. The AbortController pattern composes well.

---

## Pattern 7: R2 FUSE Mount

**Problem it solves:** Your sandbox agent needs to read and write files to cloud storage (R2) as if they were local files, without changing any application code to use S3 APIs.

### How it works

s3fs-fuse mounts an R2 bucket as a local filesystem inside the container. Files written to `/mnt/r2/` are automatically uploaded to R2. A user-scoped prefix provides tenant isolation.

**Mount sequence (DO side):**

```
async mountR2(sandbox, userId) {
  // Clean any stale mount first
  await sandbox.exec('bash', ['-c', `
    pkill -9 s3fs 2>/dev/null || true;
    umount -l /mnt/r2 2>/dev/null || true;
    rm -rf /mnt/r2;
    mkdir -p /mnt/r2
  `])

  // SDK-level unmount (clears internal tracking)
  await sandbox.unmountBucket('/mnt/r2').catch(() => {})

  // Mount with user-scoped prefix
  await sandbox.mountBucket('creative-agent-assets', '/mnt/r2', {
    endpoint: R2_ENDPOINT,
    provider: 'cloudflare-r2',
    credentials: {
      accessKeyId: R2_ACCESS_KEY,
      secretAccessKey: R2_SECRET_KEY,
    },
    prefix: `users/${userId}/`,
  })
}
```

**Flush rules — critical to understand:**

```
// SAFE: writeFileSync opens, writes, closes → triggers s3fs upload on close()
fs.writeFileSync('/mnt/r2/images/photo.png', buffer)
// ✅ File is uploaded to R2

// UNSAFE: open fd stays open → no upload until close/fsync/unmount
const fd = fs.openSync('/mnt/r2/log.jsonl', 'a')
fs.writeSync(fd, 'some data\n')
// ❌ Data is NOT in R2 yet — only in local s3fs cache

// Linux sync does NOT trigger s3fs→R2 upload
execSync('sync')
// ❌ Still not in R2 — sync flushes kernel buffers to s3fs, not s3fs to R2

// GUARANTEED flush: unmountBucket forces all open fds to close+upload
await sandbox.unmountBucket('/mnt/r2')
// ✅ Everything is now in R2
```

**Unmount before destroy:**

```
async cleanupSandbox(sandbox) {
  // Always unmount before destroy to ensure data flush
  await sandbox.unmountBucket('/mnt/r2').catch(() => {})
  // Only destroy if not keeping warm
  if (shouldDestroy) {
    await sandbox.destroy()
  }
}
```

### Adaptation notes

- **Different object storage:** s3fs works with any S3-compatible API (AWS S3, MinIO, Backblaze B2). Change `endpoint` and `provider` accordingly.
- **Read-heavy workloads:** s3fs caches reads locally. For large datasets, mount with read-only options to avoid accidental writes.
- **Multiple mount points:** You can mount different prefixes to different paths (e.g., `/mnt/shared/` for team data, `/mnt/user/` for private data).
- **Alternative to FUSE:** If you do not need transparent filesystem access, use the R2 HTTP API directly. FUSE adds complexity — use it only when your application code expects local files.

---

## Pattern 8: Auth & Multi-Tenancy

**Problem it solves:** You need per-user isolation across compute (DO), storage (R2), and data (D1), with JWT-based auth that works for both REST and WebSocket, and a dev mode that bypasses auth for local development.

### How it works

```
┌──────────────┐     JWT in header     ┌──────────────┐
│   Browser     │ ──────────────────▶  │   Worker      │
│  (Clerk JS)   │     or query param   │  (auth.ts)    │
└──────────────┘                       └──────┬───────┘
                                              │ verified userId
                                              ▼
                              ┌────────────────────────────┐
                              │  DO: idFromName(userId)     │
                              │  R2 prefix: users/{userId}/ │
                              │  D1 WHERE user_id = ?       │
                              └────────────────────────────┘
```

**Auth middleware:**

```
async function verifyToken(request, env): Promise<string | null> {
  const clerkKey = env.CLERK_SECRET_KEY
  // Dev mode: no key configured → allow all as anonymous
  if (!clerkKey) return 'anonymous'

  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  // Key configured but no token → reject
  if (!token) return null

  // Verify JWT (RS256, fetch JWKS from Clerk)
  const payload = await clerkVerify(token, clerkKey)
  return payload.sub  // Clerk user ID like "user_2abc..."
}

async function verifyWebSocketToken(url, env): Promise<string | null> {
  const clerkKey = env.CLERK_SECRET_KEY
  if (!clerkKey) return 'anonymous'

  // WebSocket: token in query param (headers not supported in browser WS API)
  const token = new URL(url).searchParams.get('token')
  if (!token) return null

  const payload = await clerkVerify(token, clerkKey)
  return payload.sub
}
```

**Per-user routing in Worker:**

```
async function handleRequest(request, env) {
  const userId = await verifyToken(request, env)
  if (!userId) return new Response('Unauthorized', { status: 401 })

  // Route to user's DO
  const doId = env.SESSION_DO.idFromName(userId)
  const stub = env.SESSION_DO.get(doId)

  // Pass userId to DO via header
  const doRequest = new Request(request.url, {
    ...request,
    headers: new Headers({
      ...Object.fromEntries(request.headers),
      'X-User-Id': userId,
    }),
  })
  return stub.fetch(doRequest)
}
```

**AuthImage component (client side):**

```
function AuthImage({ src, alt, ...props }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const { getToken } = useAuth()  // Clerk hook

  useEffect(() => {
    async function fetchImage() {
      const token = await getToken()
      const response = await fetch(src, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const blob = await response.blob()
      setBlobUrl(URL.createObjectURL(blob))
    }
    fetchImage()
    return () => blobUrl && URL.revokeObjectURL(blobUrl)
  }, [src])

  if (!blobUrl) return <Skeleton />
  return <img src={blobUrl} alt={alt} {...props} />
}
```

**Why AuthImage is necessary:** `<img src="https://api.example.com/image.png">` does NOT send Authorization headers. The browser makes a simple GET request. If your images are behind auth, you must fetch them with credentials and convert to a blob URL.

### Adaptation notes

- **Different auth providers:** Replace Clerk with Auth0, Supabase Auth, Firebase Auth, or any JWT issuer. The pattern is the same: verify JWT, extract user ID, route by user.
- **API keys instead of JWT:** For server-to-server auth, skip JWT verification and use simple API key lookup. The multi-tenancy routing stays the same.
- **Team/org scoping:** Add an org layer: `idFromName(orgId)` for the DO, `orgs/{orgId}/users/{userId}/` for R2 prefix, `WHERE org_id = ?` in D1.
- **Rate limiting:** Add per-user rate limiting in the Worker before routing to the DO. The userId is already extracted — use it as the rate limit key.
- **Download auth:** Apply the same `authFetchBlob` pattern for file downloads. Never use plain `<a href>` for authenticated resources.

---

## Quick Reference: When to Use Each Pattern

| Situation | Pattern(s) |
|---|---|
| Need real-time updates to browser | 1 (DO Orchestrator) + 3 (Streaming) |
| Running AI agents for >30 seconds | 2 (Sandbox) + 4 (Completion Detection) |
| Users might refresh or disconnect | 5 (State Recovery) + 1 (EventBuffer) |
| Users can cancel long operations | 6 (Cancel/Abort) |
| Agent needs to read/write files to cloud | 7 (R2 FUSE Mount) |
| Multi-user SaaS with per-user isolation | 8 (Auth & Multi-Tenancy) |
| All of the above (full agent platform) | All 8 patterns together |
