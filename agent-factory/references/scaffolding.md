# Agentic System on Cloudflare — Code Reference

These are the key code structures from a production agent system. They show HOW each component is built — study them to understand the patterns, then adapt the structures to your domain.

Each section shows the essential structure of a real component. The `CUSTOMIZE:` markers highlight where domain-specific changes go, but the goal is understanding the architecture, not find-replace.

**Source:** All structures are derived from the production codebase. For the full implementations, see the source files listed in `SKILL.md` → "Source Code Map".

---

## 1. wrangler.jsonc — Worker Configuration

```jsonc
{
  "name": "CUSTOMIZE:agent-name",
  "main": "src/index.ts",
  "compatibility_date": "2026-01-01",
  "compatibility_flags": ["nodejs_compat"],

  // Place Worker near your AI provider's API servers
  "placement": {
    "region": "aws:us-east-1"
  },

  // D1 database
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "CUSTOMIZE:db-name",
      "database_id": "CUSTOMIZE:db-id"
    }
  ],

  // R2 object storage (images, files, artifacts)
  "r2_buckets": [
    {
      "binding": "R2_BUCKET",
      "bucket_name": "CUSTOMIZE:bucket-name"
    }
  ],

  // Sandbox container — runs the AI SDK in an isolated environment
  // standard-2 = 1 vCPU, 6 GiB — needed for Claude SDK + subagents
  "containers": [{
    "class_name": "Sandbox",
    "image": "./sandbox/Dockerfile",
    "instance_type": "standard-2",
    "max_instances": 50
  }],

  // Durable Objects: session manager + sandbox binding
  "durable_objects": {
    "bindings": [
      {
        "name": "CUSTOMIZE:do-binding",
        "class_name": "CUSTOMIZE:do-class"
      },
      {
        "name": "SANDBOX",
        "class_name": "Sandbox"
      }
    ]
  },

  // DO migrations — add new tags as you add classes
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["CUSTOMIZE:do-class"]
    },
    {
      "tag": "v2",
      "new_sqlite_classes": ["Sandbox"]
    }
  ],

  // Static assets — serves your frontend from the same origin
  "assets": {
    "directory": "../client/dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application"
  },

  // Container logs in Cloudflare dashboard
  "observability": {
    "enabled": true
  }
}
```

---

## 2. Worker Entry — `src/index.ts`

Routes requests: `/ws` to Durable Object, `/api/*` to REST router, everything else to static assets.

```typescript
import type { Env } from './env.js';
import { handleApiRequest } from './router.js';
import { verifyWebSocketToken } from './auth.js';

// Re-export DO classes (required by wrangler)
export { AgentSession } from './durable-objects/agent-session.js'; // CUSTOMIZE:do-class
export { Sandbox } from '@cloudflare/sandbox';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // ── WebSocket upgrade → route to Durable Object ──
    if (url.pathname === '/ws') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }

      // CUSTOMIZE: your auth verification (JWT, Clerk, etc.)
      const token = url.searchParams.get('token');
      const userId = await verifyWebSocketToken(token, env);
      if (!userId) {
        return new Response('Unauthorized', { status: 401 });
      }

      // One DO per user — userId becomes the DO name
      const doId = env.AGENT_SESSION.idFromName(userId); // CUSTOMIZE:do-binding
      const stub = env.AGENT_SESSION.get(doId, { locationHint: 'enam' });

      // Pass userId via internal header (WS upgrade has no body)
      const doRequest = new Request(request.url, request);
      doRequest.headers.set('X-User-Id', userId);
      return stub.fetch(doRequest);
    }

    // ── REST API + health check ──
    if (
      url.pathname.startsWith('/api/') ||
      url.pathname === '/health'
    ) {
      return handleApiRequest(request, env);
    }

    // ── Static assets (SPA frontend) ──
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
```

---

## 3. Durable Object Skeleton — `src/durable-objects/agent-session.ts`

One DO per user. Accepts WebSocket via Hibernation API, manages sandbox lifecycle, dispatches client messages.

```typescript
import type { Env } from '../env.js';
import { EventBuffer } from '../lib/event-buffer.js';
import { getSandbox, parseSSEStream } from '@cloudflare/sandbox';
import * as db from '../db/index.js';

// CUSTOMIZE: your message types
interface ClientMessage {
  type: 'generate' | 'follow_up' | 'cancel' | 'subscribe' | 'ping';
  [key: string]: any;
}
interface ServerMessage {
  type: string;
  timestamp: string;
  [key: string]: any;
}

export class AgentSession implements DurableObject { // CUSTOMIZE:do-class
  // ── Transient state (lost on DO eviction/reset) ──
  private userId: string = 'anonymous';
  private sessionId: string | null = null;
  private taskId: string | null = null; // CUSTOMIZE: your primary entity ID
  private isGenerating = false;
  private abortController: AbortController | null = null;
  private sandbox: any = null;
  private agentProcessId: string | null = null;
  private eventBuffer = new EventBuffer();
  private tailLogs: string[] = [];
  private generationStartedAt = 0;
  private sandboxSetupInProgress = false;

  constructor(
    private state: DurableObjectState,
    private env: Env,
  ) {}

  // ─── Logging ───────────────────────────────────────────────────
  // Background promises (fire-and-forget) run outside handler context,
  // so console.log doesn't appear in wrangler tail. Buffer logs and
  // flush them during alarm(), which IS a handler invocation.

  private log(msg: string): void {
    this.tailLogs.push(msg);
    if (this.tailLogs.length > 500) this.tailLogs.splice(0, 250);
  }

  private flushTailLogs(): void {
    if (this.tailLogs.length === 0) return;
    for (const msg of this.tailLogs.splice(0)) console.log(msg);
  }

  // ─── WebSocket: Hibernation API ────────────────────────────────
  // The DO hibernates between messages to save resources. WebSocket
  // connections survive hibernation — the runtime wakes the DO on
  // incoming messages.

  async fetch(request: Request): Promise<Response> {
    // Extract userId from internal header (set by Worker entry)
    this.userId = request.headers.get('X-User-Id') || 'anonymous';

    // Restore persisted state after DO reset
    await this.restoreSession();

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept with Hibernation API (DO can sleep between messages)
    this.state.acceptWebSocket(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    try {
      const msg: ClientMessage = JSON.parse(raw as string);

      switch (msg.type) {
        case 'generate':
          await this.handleGenerate(msg, ws);
          break;
        case 'follow_up':
          await this.handleFollowUp(msg, ws);
          break;
        case 'cancel':
          await this.handleCancel();
          break;
        case 'subscribe':
          await this.handleSubscribe(msg, ws);
          break;
        case 'ping':
          this.sendToWS(ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;
      }
    } catch (err: any) {
      this.log(`[error] webSocketMessage: ${err.message}`);
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    // Hibernation API handles cleanup automatically
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    this.log(`[error] webSocketError: ${error}`);
  }

  // ─── Generate: create task + fire-and-forget agent ─────────────

  private async handleGenerate(msg: ClientMessage, ws: WebSocket): Promise<void> {
    if (this.isGenerating) {
      this.sendToWS(ws, {
        type: 'error',
        timestamp: new Date().toISOString(),
        error: 'A generation is already in progress.',
      });
      return;
    }

    // CUSTOMIZE: create your task in D1
    const taskId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    // await db.createTask(this.env.DB, { id: taskId, userId: this.userId, ... });

    this.taskId = taskId;
    this.sessionId = sessionId;
    this.isGenerating = true;
    this.generationStartedAt = Date.now();
    this.abortController = new AbortController();
    this.eventBuffer.clear();

    await this.persistSession();
    this.startKeepAlive();

    // Fire-and-forget: handler returns immediately, generation runs in background
    // The alarm heartbeat prevents the DO from hibernating during generation
    this.runGeneration(taskId, sessionId, msg.prompt).catch((err) => {
      this.log(`[error] runGeneration: ${err.message}`);
    });

    this.emitEvent({
      type: 'generation_started',
      timestamp: new Date().toISOString(),
      taskId,
    });
  }

  // ─── Run Generation: sandbox lifecycle ─────────────────────────

  private async runGeneration(taskId: string, sessionId: string, prompt: string): Promise<void> {
    this.sandboxSetupInProgress = true;

    try {
      // Abort check before sandbox setup
      if (this.abortController?.signal.aborted) return;

      // Get or create sandbox container (one per user, reused across tasks)
      const sandboxId = `user-${this.userId.toLowerCase()}-v2`;
      this.sandbox = getSandbox(this.env.SANDBOX, sandboxId, {
        sleepAfter: '2h',      // Keep warm for follow-ups
        normalizeId: true,
      });

      // Mount R2 bucket into sandbox filesystem via FUSE
      // IMPORTANT: unmount first if sandbox is reused (prevents InvalidMountConfigError)
      try { await this.sandbox.unmountBucket('/mnt/r2'); } catch {}
      await this.timedRPC('mountBucket', () =>
        this.sandbox.mountBucket('/mnt/r2', this.env.R2_BUCKET, {
          // CUSTOMIZE: R2 prefix scopes each user's files
          prefix: `users/${this.userId}/`,
          credentials: {
            accessKeyId: this.env.R2_ACCESS_KEY_ID,
            secretAccessKey: this.env.R2_SECRET_ACCESS_KEY,
          },
        })
      );

      // CUSTOMIZE: optional pre-flight check (e.g., test API connectivity from sandbox)
      // Some Cloudflare container IPs are blocked by AI providers.
      // If blocked, destroy sandbox and retry with a different ID.

      this.sandboxSetupInProgress = false;

      // Abort check after sandbox setup
      if (this.abortController?.signal.aborted) return;

      // Start agent process inside sandbox
      const proc = await this.timedRPC('startProcess', () =>
        this.sandbox.startProcess({
          command: ['node', '/app/agent-runner.js'],
          env: {
            ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY,
            // CUSTOMIZE: pass your API keys and config
            PROMPT: prompt,
            SESSION_ID: sessionId,
            TASK_ID: taskId,
          },
        })
      );
      this.agentProcessId = proc.id;

      // Attach stdout listener: parse SDK messages, emit events to client
      await this.attachStreamHandler(proc.id, taskId, sessionId);

      // Wait for agent to complete (via log sentinel pattern)
      await this.attachCompletionHandler(proc.id, taskId, sessionId);

    } catch (err: any) {
      if (this.abortController?.signal.aborted) return; // Cancel — not an error
      this.log(`[error] runGeneration failed: ${err.message}`);
      this.emitEvent({
        type: 'error',
        timestamp: new Date().toISOString(),
        error: `Generation failed: ${err.message}`,
      });
      // CUSTOMIZE: update task status in D1
      // await db.updateTaskStatus(this.env.DB, taskId, 'error');
    } finally {
      this.sandboxSetupInProgress = false;
      if (this.abortController?.signal.aborted) {
        // Cancel cleanup: kill agent, unmount R2
        if (this.agentProcessId) {
          try { await this.sandbox?.killProcess(this.agentProcessId); } catch {}
        }
        try { await this.sandbox?.unmountBucket('/mnt/r2'); } catch {}
      }
      // Do NOT destroy sandbox — keep warm for follow-ups (sleepAfter handles cleanup)
    }
  }

  // ─── Stream Handler: parse agent stdout → WebSocket events ─────

  private async attachStreamHandler(processId: string, taskId: string, sessionId: string): Promise<void> {
    try {
      const logStream = await this.sandbox.streamProcessLogs(processId);

      // streamProcessLogs replays ALL historical stdout on each call.
      // Use a sentinel marker (turn_start) to skip replayed content.
      let sawCurrentTurn = false;

      for await (const chunk of parseSSEStream(logStream)) {
        if (this.abortController?.signal.aborted) break;

        const lines = chunk.split('\n').filter((l: string) => l.trim());
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);

            // Skip replayed content from previous turns
            if (parsed.type === 'turn_start') {
              sawCurrentTurn = true;
              continue;
            }

            // CUSTOMIZE: process SDK messages → emit events to client
            // processSDKMessage(parsed, this.emitEvent.bind(this));
          } catch {
            // Non-JSON line — ignore
          }
        }
      }
    } catch (err: any) {
      this.log(`[error] attachStreamHandler: ${err.message}`);
    }
  }

  // ─── Completion Handler: wait for turn_complete sentinel ───────
  // The agent prints { type: 'turn_complete' } to stdout when done.
  // We watch for it via waitForLog() — a blocking SSE stream that
  // resolves when the pattern appears in the process's stdout.

  private async attachCompletionHandler(processId: string, taskId: string, sessionId: string): Promise<void> {
    const COMPLETION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

    try {
      await Promise.race([
        this.timedRPC('waitForLog', () =>
          this.sandbox.waitForLog(processId, { text: 'turn_complete' }),
          COMPLETION_TIMEOUT,
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Completion timeout')), COMPLETION_TIMEOUT)
        ),
      ]);

      // Agent completed — finalize results
      await this.finalizeTask(taskId, sessionId);

    } catch (err: any) {
      this.log(`[error] attachCompletionHandler: ${err.message}`);
      // Alarm R2 polling is the safety net — it will pick up results
      // if the waitForLog stream dies silently (SSE hang)
    }
  }

  // ─── Finalize: read turn-result.json, persist to D1 ───────────

  private async finalizeTask(taskId: string, sessionId: string): Promise<void> {
    try {
      // Read results written by agent-runner to local disk
      const resultJson = await this.timedRPC('readResult', () =>
        this.sandbox.readFile('/app/turn-result.json')
      );
      const result = JSON.parse(resultJson);

      // CUSTOMIZE: persist results to D1
      // await db.updateTaskStatus(this.env.DB, taskId, 'complete');
      // await db.saveTaskFiles(this.env.DB, taskId, result.files);
      // await db.saveTaskArtifacts(this.env.DB, taskId, result.artifacts);
      // await db.saveMessage(this.env.DB, { taskId, role: 'assistant', ... });

      this.emitEvent({
        type: 'generation_complete',
        timestamp: new Date().toISOString(),
        taskId,
      });
    } catch (err: any) {
      this.log(`[error] finalizeTask: ${err.message}`);
    } finally {
      this.isGenerating = false;
      this.agentProcessId = null;
      await this.persistSession();
    }
  }

  // ─── Follow-Up: reuse warm sandbox, file-based IPC ─────────────

  private async handleFollowUp(msg: ClientMessage, ws: WebSocket): Promise<void> {
    if (!this.sandbox || !this.agentProcessId) {
      // No warm agent — fall back to cold start
      await this.handleGenerate(msg, ws);
      return;
    }

    // Write prompt file for agent-runner to pick up (file-based IPC)
    const requestId = crypto.randomUUID();
    const promptPayload = JSON.stringify({
      prompt: msg.prompt,
      taskId: this.taskId,
      requestId,
    });

    await this.timedRPC('writePrompt', () =>
      this.sandbox.writeFile('/app/next-prompt.json', promptPayload)
    );

    // Wait for completion via sentinel in stdout
    await this.attachCompletionHandler(this.agentProcessId, this.taskId!, this.sessionId!);
  }

  // ─── Cancel ────────────────────────────────────────────────────
  // ONLY sets abort signal. The running generation handles its own
  // cleanup — it knows which agent process it started.

  private async handleCancel(): Promise<void> {
    if (!this.isGenerating) return;
    this.abortController?.abort();
    this.isGenerating = false;
    // CUSTOMIZE: update task status
    // await db.updateTaskStatus(this.env.DB, this.taskId!, 'cancelled');
    await this.persistSession();
    this.emitEvent({
      type: 'generation_cancelled',
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Subscribe: replay buffered events on reconnect ────────────

  private async handleSubscribe(msg: ClientMessage, ws: WebSocket): Promise<void> {
    const lastEventId = msg.lastEventId || 0;
    const missed = this.eventBuffer.getEventsSince(lastEventId);
    for (const evt of missed) {
      this.sendToWS(ws, evt.event);
    }
  }

  // ─── Keep-alive: alarm heartbeat prevents hibernation ──────────
  // With Hibernation API, if the handler returns and no alarm is
  // pending, the runtime destroys the class instance — killing all
  // background promises. The alarm heartbeat keeps the DO alive.

  private startKeepAlive(): void {
    this.state.storage.setAlarm(Date.now() + 10_000).catch(() => {});
  }

  async alarm(): Promise<void> {
    this.flushTailLogs();

    // Restore state after DO reset (code update)
    if (!this.taskId) await this.restoreSession();

    if (!this.isGenerating) return; // No active generation — let DO hibernate

    // Safety net: max generation age (2 hours)
    const MAX_AGE = 2 * 60 * 60 * 1000;
    if (this.generationStartedAt && (Date.now() - this.generationStartedAt) > MAX_AGE) {
      this.log('[alarm] Safety net: generation timed out');
      // CUSTOMIZE: update task status
      this.isGenerating = false;
      await this.persistSession();
      return;
    }

    // Zombie detection: isGenerating=true but no agent process after 5 min
    if (!this.agentProcessId && !this.sandboxSetupInProgress) {
      const ZOMBIE_THRESHOLD = 5 * 60 * 1000;
      if (this.generationStartedAt && (Date.now() - this.generationStartedAt) > ZOMBIE_THRESHOLD) {
        this.log('[alarm] Zombie detected — no agent running');
        this.emitEvent({
          type: 'error',
          timestamp: new Date().toISOString(),
          error: 'Generation failed. Please try again.',
        });
        this.isGenerating = false;
        await this.persistSession();
        return;
      }
    }

    // Reconnect sandbox after DO reset (but NOT during setup — two connections cancel RPCs)
    if (!this.sandbox && !this.sandboxSetupInProgress && this.userId !== 'anonymous') {
      const sandboxId = `user-${this.userId.toLowerCase()}-v2`;
      this.sandbox = getSandbox(this.env.SANDBOX, sandboxId, {
        sleepAfter: '2h',
        normalizeId: true,
      });
    }

    // CUSTOMIZE: R2 polling as safety net for silent SSE hangs
    // Read turn-result.json from sandbox, finalize if present

    // Reschedule alarm (30s heartbeat)
    this.state.storage.setAlarm(Date.now() + 30_000).catch(() => {});
  }

  // ─── Event helpers ─────────────────────────────────────────────

  private emitEvent(event: ServerMessage): void {
    this.eventBuffer.append(event);
    this.sendWS(event);
  }

  /** Broadcast to all connected WebSockets (multi-tab support) */
  private sendWS(msg: ServerMessage): void {
    const payload = JSON.stringify(msg);
    for (const ws of this.state.getWebSockets()) {
      try { ws.send(payload); } catch {}
    }
  }

  /** Send to a specific WebSocket */
  private sendToWS(ws: WebSocket, msg: ServerMessage): void {
    try { ws.send(JSON.stringify(msg)); } catch {}
  }

  // ─── Session persistence (survives DO resets) ──────────────────
  // DO code updates trigger a reset — all instance vars are cleared.
  // Persist critical state to durable storage so alarm() can restore.

  private async persistSession(): Promise<void> {
    await this.state.storage.put('session', {
      userId: this.userId,
      sessionId: this.sessionId,
      taskId: this.taskId,
      isGenerating: this.isGenerating,
      generationStartedAt: this.generationStartedAt,
      agentProcessId: this.agentProcessId,
    });
  }

  private async restoreSession(): Promise<void> {
    const saved = await this.state.storage.get<any>('session');
    if (!saved) return;

    // Don't overwrite a fresh userId from the header with a stale stored one
    if (this.userId === 'anonymous' && saved.userId) {
      this.userId = saved.userId;
    }
    this.sessionId = saved.sessionId || null;
    this.taskId = saved.taskId || null;
    this.isGenerating = saved.isGenerating || false;
    this.generationStartedAt = saved.generationStartedAt || 0;
    this.agentProcessId = saved.agentProcessId || null;
  }

  // ─── Timed RPC wrapper ────────────────────────────────────────

  private async timedRPC<T>(label: string, fn: () => Promise<T>, timeoutMs = 60_000): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`RPC ${label} timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }
}
```

---

## 4. Agent Runner — `sandbox/agent-runner.ts`

Long-running process inside the sandbox container. Stays alive between turns via file-based IPC. Prints structured JSON to stdout for the DO to parse.

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Options } from '@anthropic-ai/claude-agent-sdk';
// CUSTOMIZE: import your MCP server
// import { myToolMcpServer } from './my-tool-mcp.js';
import * as fs from 'fs';

// ── Environment (passed by DO via startProcess env) ──────────────
const prompt = process.env.PROMPT!;
const sessionId = process.env.SESSION_ID!;
const taskId = process.env.TASK_ID || '';

const PROMPT_FILE = '/app/next-prompt.json';
const STATUS_FILE = '/app/agent-status.json';

let currentRequestId: string | null = null;

// ── Structured trace logging (stdout → DO parses via streamProcessLogs) ──

function trace(action: string, data?: Record<string, any>): void {
  const entry: Record<string, any> = {
    type: 'trace',
    component: 'agent',
    action,
    ts: Date.now(),
    pid: process.pid,
  };
  if (taskId) entry.taskId = taskId;
  if (data) Object.assign(entry, data);
  process.stdout.write(JSON.stringify(entry) + '\n');
}

// ── Heartbeat (30s interval so DO alarm can verify agent is alive) ──

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

function startHeartbeat(): void {
  if (heartbeatInterval) return;
  heartbeatInterval = setInterval(() => {
    trace('heartbeat');
  }, 30_000);
}

function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// ── Status file (DO reads this for health checks) ────────────────

function writeStatus(status: 'starting' | 'processing' | 'idle' | 'error'): void {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({
      status,
      timestamp: Date.now(),
      pid: process.pid,
    }));
  } catch { /* ignore */ }
}

// ── File-based IPC: poll for next prompt ─────────────────────────
// The DO writes /app/next-prompt.json, the agent polls for it.
// This avoids RPC/WebSocket complexity for inter-turn communication.

function waitForPromptFile(): Promise<{ prompt: string; taskId: string; requestId: string } | { shutdown: true } | null> {
  return new Promise(resolve => {
    const check = () => {
      if (fs.existsSync(PROMPT_FILE)) {
        try {
          const data = JSON.parse(fs.readFileSync(PROMPT_FILE, 'utf-8'));
          fs.unlinkSync(PROMPT_FILE);
          resolve(data);
        } catch {
          setTimeout(check, 500); // Partial write — retry
        }
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}

// ── SDK options ──────────────────────────────────────────────────

const baseOptions: Partial<Options> = {
  cwd: '/app/agent',
  model: 'claude-haiku-4-5-20251001', // CUSTOMIZE: your model
  maxTurns: 30,
  settingSources: ['user', 'project'],
  allowedTools: [
    // CUSTOMIZE: your allowed tools
    'Task', 'Read', 'Write', 'Bash', 'Glob', 'Grep', 'WebFetch', 'WebSearch',
    // 'mcp__CUSTOMIZE:tool-name__your_tool',
  ],
  // CUSTOMIZE: your system prompt
  systemPrompt: 'You are a helpful agent. Complete the user\'s request.',
  // CUSTOMIZE: your MCP servers
  // mcpServers: { 'CUSTOMIZE:tool-name': myToolMcpServer },
};

// ── Completion marker (written to local disk for DO to read) ─────
// turn-result.json is the handoff point: agent writes results here,
// DO reads them during finalization.

function writeCompletionMarker(text: string): void {
  if (!taskId) return;
  try {
    // CUSTOMIZE: collect your domain-specific output files
    const files: Record<string, string> = {};
    // Example: scan output directories for generated files
    // const outputDir = '/app/agent/output/';
    // if (fs.existsSync(outputDir)) {
    //   for (const f of fs.readdirSync(outputDir)) {
    //     files[f] = fs.readFileSync(path.join(outputDir, f), 'utf-8');
    //   }
    // }

    // CUSTOMIZE: collect generated artifacts (images, etc.)
    const artifacts: { filename: string; path: string }[] = [];
    const trackingFile = '/app/generated-artifacts.jsonl';
    if (fs.existsSync(trackingFile)) {
      const lines = fs.readFileSync(trackingFile, 'utf-8').split('\n').filter(l => l.trim());
      for (const line of lines) {
        try { artifacts.push(JSON.parse(line)); } catch {}
      }
      fs.writeFileSync(trackingFile, ''); // Clear for next turn
    }

    fs.writeFileSync('/app/turn-result.json', JSON.stringify({
      artifacts,
      files,
      text,
      requestId: currentRequestId || 'initial',
      taskId,
    }));

    trace('marker_written', { artifacts: artifacts.length, files: Object.keys(files).length });
  } catch (err: any) {
    console.error(`[marker] Failed: ${err.message}`);
  }
}

// ── Multi-turn prompt stream (async generator) ───────────────────
// Turn 1: yield initial prompt from env var.
// Turn N: yield from next-prompt.json (written by DO).
// The SDK keeps full conversation context in memory across yields.

async function* promptStream() {
  // First turn
  yield {
    type: 'user' as const,
    message: { role: 'user' as const, content: prompt },
    parent_tool_use_id: null,
    session_id: sessionId,
  };

  // Subsequent turns — block on file-based IPC
  while (true) {
    writeStatus('idle');
    trace('waiting_for_prompt');
    const data = await waitForPromptFile();
    if (!data || 'shutdown' in data) {
      trace('shutdown');
      return; // Generator ends → query() ends → process exits
    }

    currentRequestId = data.requestId || null;
    trace('prompt_received', { requestId: currentRequestId || 'null' });

    // Clear stale results before starting new turn
    try { fs.unlinkSync('/app/turn-result.json'); } catch {}

    // Sentinel: DO uses this to skip replayed stdout from streamProcessLogs()
    process.stdout.write(JSON.stringify({
      type: 'turn_start',
      requestId: data.requestId,
    }) + '\n');

    writeStatus('processing');

    yield {
      type: 'user' as const,
      message: { role: 'user' as const, content: data.prompt },
      parent_tool_use_id: null,
      session_id: sessionId,
    };
  }
}

// ── Main loop ────────────────────────────────────────────────────

trace('startup', { sessionId, taskId, promptLen: prompt.length });
writeStatus('processing');
startHeartbeat();

let accumulatedText = '';

try {
  for await (const message of query({ prompt: promptStream(), options: baseOptions })) {
    // Print every SDK message to stdout (DO parses these via streamProcessLogs)
    process.stdout.write(JSON.stringify(message) + '\n');

    // CUSTOMIZE: extract text from assistant messages for persistence
    if (message.type === 'assistant') {
      const content = (message as any).message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text' && block.text) {
            accumulatedText += (accumulatedText ? '\n' : '') + block.text;
          }
        }
      }
    }

    // Turn completed — write results and sentinel
    if (message.type === 'result') {
      trace('turn_end', { requestId: currentRequestId || 'initial', textLen: accumulatedText.length });
      writeCompletionMarker(accumulatedText);

      // Sentinel markers for DO completion detection
      process.stdout.write(JSON.stringify({ type: 'turn_complete' }) + '\n');
      if (currentRequestId) {
        process.stdout.write(`COMPLETION:${currentRequestId}\n`);
      }

      accumulatedText = ''; // Reset for next turn
    }
  }
} catch (err: any) {
  trace('fatal_error', { err: err.message?.substring(0, 300) });
  writeStatus('error');
}

stopHeartbeat();
trace('exit');
writeStatus('idle');
```

---

## 5. MCP Tool Template — `sandbox/your-tool-mcp.ts`

Custom tool exposed to the Claude SDK via MCP. The agent calls this tool during generation.

```typescript
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// CUSTOMIZE: your tool's description and purpose
// This example shows a tool that generates artifacts and writes them to R2 via FUSE mount.

/**
 * Ensure output directory exists
 */
function ensureOutputDir(sessionId?: string): string {
  const baseDir = process.env.ARTIFACT_OUTPUT_DIR || '/mnt/r2/artifacts';
  const outputDir = sessionId ? path.join(baseDir, sessionId) : baseDir;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

/**
 * Track generated files for the completion marker to pick up.
 * Appends JSONL lines to a tracking file that writeCompletionMarker() reads.
 */
function trackArtifact(filename: string, filepath: string): void {
  const entry = JSON.stringify({ filename, path: filepath }) + '\n';
  fs.appendFileSync('/app/generated-artifacts.jsonl', entry);
}

// CUSTOMIZE: your MCP server with domain-specific tools
export const myToolMcpServer = createSdkMcpServer({
  name: 'CUSTOMIZE:tool-name',
  version: '1.0.0',
  tools: [
    tool({
      name: 'generate_artifact', // CUSTOMIZE: tool name
      description: 'Generates an artifact based on the provided specification.', // CUSTOMIZE
      schema: {
        // CUSTOMIZE: your tool's input schema
        spec: z.string().describe('Specification for the artifact to generate'),
        output_name: z.string().describe('Name for the output file'),
        format: z.enum(['json', 'markdown', 'text']).default('json')
          .describe('Output format'),
      },
      handler: async ({ spec, output_name, format }) => {
        try {
          // CUSTOMIZE: your tool's logic
          // Example: call an external API, process data, generate content
          const result = `Generated content for: ${spec}`;

          // Write to R2 via FUSE mount
          const sessionId = process.env.SESSION_ID;
          const outputDir = ensureOutputDir(sessionId);
          const filename = `${output_name}.${format}`;
          const filepath = path.join(outputDir, filename);

          fs.writeFileSync(filepath, result);

          // Verify write (catches silent FUSE failures)
          const stat = fs.statSync(filepath);
          if (stat.size === 0) {
            throw new Error(`Write verification failed: ${filepath} is empty`);
          }

          // Track for completion marker
          trackArtifact(filename, filepath);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  success: true,
                  filename,
                  filepath,
                  size: stat.size,
                }),
              },
            ],
          };
        } catch (err: any) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  success: false,
                  error: err.message,
                }),
              },
            ],
            isError: true,
          };
        }
      },
    }),
  ],
});
```

---

## 6. D1 Schema Template — `schema.sql`

Generic tables for an agentic system. Replace domain-specific columns as needed.

```sql
-- CUSTOMIZE: Agent System D1 Schema
-- Apply with: npx wrangler d1 execute CUSTOMIZE:db-name --remote --file=schema.sql

-- ── Primary entity (tasks, jobs, sessions, etc.) ──────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'generating'
    CHECK (status IN ('generating', 'complete', 'incomplete', 'error', 'cancelled')),
  session_id TEXT,           -- WebSocket session ID
  sdk_session_id TEXT,       -- Claude SDK session ID (for context resume)
  -- CUSTOMIZE: add domain-specific columns here
  -- e.g., brand_url TEXT, style TEXT, target_audience TEXT
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_session_id ON tasks(session_id);

-- ── Text files produced by the agent ──────────────────────────────
-- e.g., research notes, analysis, drafts
CREATE TABLE IF NOT EXISTS task_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,
    -- CUSTOMIZE: your file types
    -- CHECK (file_type IN ('research', 'analysis', 'draft', 'summary')),
  content TEXT DEFAULT '',
  is_ready INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, file_type)
);

CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON task_files(task_id);

-- ── Binary/media artifacts (images, PDFs, etc.) ──────────────────
-- file_path points to R2 key (served via /artifacts/:path)
CREATE TABLE IF NOT EXISTS task_artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  artifact_index INTEGER NOT NULL,
  artifact_type TEXT NOT NULL,
    -- CUSTOMIZE: your artifact types
    -- CHECK (artifact_type IN ('image', 'pdf', 'chart', 'export')),
  prompt TEXT,               -- The prompt/spec that generated this artifact
  file_path TEXT NOT NULL,   -- R2 key: users/{userId}/artifacts/{sessionId}_{index}.ext
  version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, artifact_index, version)
);

CREATE INDEX IF NOT EXISTS idx_task_artifacts_task_id ON task_artifacts(task_id);

-- ── Conversation messages ─────────────────────────────────────────
-- Stores user prompts + assistant responses for history/context hydration
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  artifact_refs TEXT,        -- JSON array of artifact references
  file_refs TEXT,            -- JSON array of file references
  blocks TEXT,               -- JSON array of UI blocks (progress, status, etc.)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_task_id ON messages(task_id);

-- ── Auto-update triggers ──────────────────────────────────────────

CREATE TRIGGER IF NOT EXISTS tasks_updated_at
  AFTER UPDATE ON tasks
  FOR EACH ROW
  BEGIN
    UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
  END;

CREATE TRIGGER IF NOT EXISTS task_files_updated_at
  AFTER UPDATE ON task_files
  FOR EACH ROW
  BEGIN
    UPDATE task_files SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
  END;
```

---

## 7. Event Buffer — `src/lib/event-buffer.ts`

Ring buffer with sequential IDs for WebSocket event replay on reconnect.

```typescript
// CUSTOMIZE: import your ServerMessage type
interface ServerMessage {
  type: string;
  timestamp: string;
  [key: string]: any;
}

interface BufferedEvent {
  id: number;
  event: ServerMessage;
  timestamp: number;
}

const MAX_EVENTS = 1000;
const TRIM_TO = 500;

export class EventBuffer {
  private events: BufferedEvent[] = [];
  private nextId = 1;

  /** Append an event. Returns the assigned sequential ID. */
  append(event: ServerMessage): number {
    const buffered: BufferedEvent = {
      id: this.nextId++,
      event,
      timestamp: Date.now(),
    };
    this.events.push(buffered);

    // Trim to prevent unbounded growth
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(-TRIM_TO);
    }

    return buffered.id;
  }

  /** Replay events after a given ID (client sends lastEventId on reconnect). */
  getEventsSince(afterId: number): BufferedEvent[] {
    return this.events.filter(e => e.id > afterId);
  }

  /** Current high-water mark. Client stores this and sends on reconnect. */
  getLatestEventId(): number {
    return this.nextId - 1;
  }

  /** Check if buffer has any events. */
  hasEvents(): boolean {
    return this.events.length > 0;
  }

  /** Clear all events (e.g., before starting a new task). */
  clear(): void {
    this.events = [];
    this.nextId = 1;
  }
}
```

---

## 8. Environment Types — `src/env.d.ts`

TypeScript bindings for all Cloudflare resources.

```typescript
import type { Sandbox } from '@cloudflare/sandbox';

export interface Env {
  // ── Static assets (frontend SPA) ──
  ASSETS: Fetcher;

  // ── D1 database ──
  DB: D1Database;

  // ── R2 object storage ──
  R2_BUCKET: R2Bucket;

  // ── Durable Object namespaces ──
  AGENT_SESSION: DurableObjectNamespace; // CUSTOMIZE:do-binding
  SANDBOX: DurableObjectNamespace<Sandbox>;

  // ── Secrets (set via `wrangler secret put KEY | tr -d '\n'`) ──
  ANTHROPIC_API_KEY: string;
  // CUSTOMIZE: add your API keys
  // MY_SERVICE_API_KEY: string;

  // ── R2 credentials for sandbox FUSE mount ──
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;

  // ── Auth secret (Clerk, Auth0, etc.) ──
  // CUSTOMIZE: your auth provider's secret
  AUTH_SECRET_KEY: string;

  // ── Vars (set in wrangler.jsonc) ──
  CF_ACCOUNT_ID: string;

  // ── Optional env overrides ──
  AI_BACKEND?: string;
}
```

---

## Quick Start Checklist

After copying these templates and doing find-replace on `CUSTOMIZE:` markers:

1. **Create Cloudflare resources**
   ```bash
   npx wrangler d1 create CUSTOMIZE:db-name
   npx wrangler r2 bucket create CUSTOMIZE:bucket-name
   ```

2. **Apply D1 schema**
   ```bash
   npx wrangler d1 execute CUSTOMIZE:db-name --remote --file=schema.sql
   ```

3. **Set secrets** (always strip trailing newlines)
   ```bash
   echo -n "sk-..." | npx wrangler secret put ANTHROPIC_API_KEY
   echo -n "..." | npx wrangler secret put R2_ACCESS_KEY_ID
   echo -n "..." | npx wrangler secret put R2_SECRET_ACCESS_KEY
   echo -n "..." | npx wrangler secret put AUTH_SECRET_KEY
   ```

4. **Create R2 API token** (for FUSE mount in sandbox)
   - Cloudflare Dashboard > R2 > Manage R2 API Tokens
   - Create token with Object Read & Write on your bucket
   - Use the Access Key ID and Secret Access Key as secrets above

5. **Build and deploy**
   ```bash
   cd client && npm run build
   docker builder prune -af   # Prevent cached layers from skipping push
   cd ../cloudflare && npx wrangler deploy
   ```

6. **Verify**
   ```bash
   curl -s https://CUSTOMIZE:agent-name.YOUR-SUBDOMAIN.workers.dev/health
   ```

---

## Architecture Notes

**Key patterns used in these templates:**

- **One DO per user** (not per task) — prevents concurrent generation conflicts. The `isGenerating` flag is a per-user lock.
- **Fire-and-forget + alarm heartbeat** — handler returns immediately (no Cloudflare 30s timeout). The alarm prevents hibernation from killing background promises.
- **File-based IPC** for follow-ups — the DO writes `next-prompt.json`, the agent polls for it. Simpler and more reliable than RPC for inter-turn communication.
- **Sentinel markers in stdout** — `turn_start` and `turn_complete` JSON lines. The DO watches for these via `waitForLog()`. Needed because `streamProcessLogs()` replays ALL historical stdout on each call.
- **R2 via FUSE mount** — `mountBucket()` mounts R2 into the sandbox filesystem. Files written to `/mnt/r2/` are uploaded to R2 on `close()`/`unmount`. Always `unmountBucket()` before `mountBucket()` on container reuse.
- **Event buffer for reconnect** — sequential IDs let the client request missed events. The DO replays from the ring buffer instead of re-querying D1.
- **Session persistence** — critical state (userId, taskId, isGenerating) persisted to DO storage. Survives code updates that reset the DO instance.
- **Tail log buffer** — background promise logs are invisible in `wrangler tail`. Buffer them and flush during `alarm()`.
