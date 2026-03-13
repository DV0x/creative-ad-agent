# Research: Cloudflare Agents SDK and Container Architecture Patterns

**Date**: 2026-03-13
**Researcher**: Claude (Opus)
**Confidence levels**: HIGH = multiple primary sources agree; MEDIUM = single primary source or limited evidence; LOW = inferred or speculative

---

## Table of Contents
1. [Cloudflare Agents SDK](#1-cloudflare-agents-sdk)
2. [Sandbox SDK Internals](#2-sandbox-sdk-internals)
3. [Container SDK (@cloudflare/containers)](#3-container-sdk)
4. [Production Examples](#4-production-examples)
5. [Alternative Streaming/Communication Approaches](#5-alternative-approaches)
6. [Comparison with Our Architecture](#6-comparison-with-our-architecture)
7. [Recommendations](#7-recommendations)
8. [Gaps & Uncertainties](#8-gaps-and-uncertainties)

---

## 1. Cloudflare Agents SDK

**Repository**: https://github.com/cloudflare/agents
**Package**: `agents` (npm)
**Status**: Active development, v0.7.0 as of March 2026

### 1.1 Architecture Overview (Confidence: HIGH)

The Agents SDK is a framework for building stateful AI agents on Cloudflare Workers. The class hierarchy is:

```
DurableObject > Server (partyserver) > Agent
```

Each agent IS a Durable Object -- a globally addressable, single-threaded compute instance with built-in SQLite storage (KV and SQL). Key properties:
- **Per-agent SQLite database** for state, messages, schedules, and task queues
- **WebSocket connections** with lifecycle hooks (onConnect, onMessage, onClose, onError)
- **Hibernation support** -- agents sleep when idle, WebSocket connections persist across hibernation
- **Global edge deployment** -- one agent per user, session, or room
- **Type-safe RPC** via `@callable()` decorator

### 1.2 How It Handles Long-Running AI Tasks (Confidence: HIGH)

**keepAlive() -- introduced in v0.7.0 (March 2, 2026)**

Durable Objects are evicted after ~70-140 seconds of no incoming requests, WebSocket messages, or alarms. `keepAlive()` prevents this by creating a 30-second heartbeat schedule that resets the inactivity timer.

```javascript
// Manual management
const dispose = await this.keepAlive();
try {
  const result = await longRunningComputation();
} finally {
  dispose();
}

// Automatic wrapper
const result = await this.keepAliveWhile(async () => {
  return await longRunningComputation();
});
```

Key facts:
- Each `keepAlive()` call returns an independent disposer
- Multiple concurrent calls are safe
- `AIChatAgent` automatically calls `keepAlive()` during streaming responses
- Uses the existing scheduling system internally (single alarm, multiple schedules managed in SQL)
- Marked as **experimental** -- subject to change

**This is essentially the same alarm heartbeat pattern we independently implemented in Session 14.** The main difference is that the Agents SDK wraps it in a clean API while we manually manage `setAlarm()` and `isGenerating` flags.

### 1.3 Resumable Streaming (Confidence: HIGH)

The `@cloudflare/ai-chat` package provides resumable streaming:
- When a client disconnects mid-stream, chunks are buffered in SQLite
- On reconnect, the client receives all buffered chunks plus the live stream
- Works across page refreshes, broken connections, and multiple tabs/devices
- Automatic message compaction when messages approach SQLite limits

This is a significant architectural advantage. The Agent keeps running even if all clients disconnect. Clients catch up automatically on reconnect.

**How it compares to our approach**: We use R2 completion markers + `/recover` endpoint + client auto-recovery. The Agents SDK uses SQLite-buffered streaming which is more granular (per-chunk vs per-generation) and doesn't require separate recovery logic.

### 1.4 Task Queue (Confidence: HIGH)

Built-in deferred task execution via `this.queue()`, `this.dequeue()`, `this.dequeueAll()`. Tasks are persisted in the `cf_agents_queues` SQL table and automatically flushed in sequence. If a task succeeds, it is automatically dequeued.

### 1.5 Observability (Confidence: HIGH)

v0.7.0 replaced console.log with `diagnostics_channel` events across seven named channels: `agents:state`, `agents:rpc`, `agents:message`, `agents:schedule`, `agents:lifecycle`, `agents:workflow`, `agents:mcp`. Automatic forwarding to Tail Workers in production.

### 1.6 Workflows Integration (Confidence: HIGH)

Agents can integrate with Cloudflare Workflows for durable execution of long-running background tasks:

```javascript
// Agent starts a workflow
const instanceId = await this.runWorkflow("PROCESSING_WORKFLOW", { taskId, data });

// Workflow reports progress (non-durable -- may repeat on retry)
await this.reportProgress({ step: "process", percent: 0.5 });

// Workflow broadcasts to all connected WebSocket clients (non-durable)
this.broadcastToClients({ type: "update", data: result });

// Workflow updates durable Agent state (broadcasts to clients automatically)
await step.updateAgentState({ status: "processing" });

// Agent receives callbacks
async onWorkflowProgress(workflowName, instanceId, progress) { ... }
async onWorkflowComplete(workflowName, instanceId, result) { ... }
async onWorkflowError(workflowName, instanceId, error) { ... }
```

Key design: Workflows handle long-running background processing with automatic retry and recovery, while Agents handle real-time communication. Step completion is permanent and will not re-execute even if the workflow restarts.

**Relevance to our architecture**: The Agent + Workflow pattern is the closest official analog to our DO + Sandbox pattern. The Workflow can run for minutes/hours/days, report progress to the Agent, and the Agent relays to WebSocket clients. However, Workflows run in the Workers runtime (not in containers), so they have the same CPU/memory constraints as Workers. For heavy workloads requiring a full Linux environment (like running Claude CLI), containers are still needed.

---

## 2. Sandbox SDK Internals

**Repository**: https://github.com/cloudflare/sandbox-sdk
**Package**: `@cloudflare/sandbox` (npm)
**Status**: Beta, pre-v1.0, APIs may change

### 2.1 Architecture (Confidence: HIGH)

Three-layer architecture:
1. **Workers** -- application logic
2. **Durable Objects** -- persistent sandbox instances (the Sandbox class IS a DO)
3. **Containers** -- isolated Linux environments (Ubuntu with Python, Node.js, Git)

The Sandbox DO runs a modular HTTP client architecture: `CommandClient`, `FileClient`, `ProcessClient`, etc. Each client makes HTTP requests to the container's control plane.

### 2.2 Communication Protocol (Confidence: HIGH)

**Inside the container**: A Bun server runs on port 3000 as the control plane. This handles all SDK requests.

**Two transport modes** (configured via `SANDBOX_TRANSPORT` env var):

| Feature | HTTP (default) | WebSocket |
|---------|---------------|-----------|
| Connection | New request per operation | Single persistent connection |
| Subrequest cost | 1 per operation | 1 total (upgrade) |
| Streaming | Server-Sent Events (SSE) | WebSocket messages |
| Resilience | Stateless, simple | Auto-reconnect, in-flight ops preserved |
| Limit (Free) | 50 ops/request | Unlimited after upgrade |
| Limit (Paid) | 1,000 ops/request | Unlimited after upgrade |

**Port routing logic**:
- `/api/*` -> port 3000 (control plane)
- `/proxy/8080/*` -> port 8080 (user services)
- Default -> port 3000

### 2.3 streamProcessLogs() Internals (Confidence: HIGH)

```typescript
const stream = await sandbox.streamProcessLogs(processId: string): Promise<ReadableStream>
```

**Transport**: Server-Sent Events (SSE) over HTTP, or WebSocket messages if WebSocket transport is enabled.

**Event types emitted**:
- `stdout` -- standard output data (with timestamp)
- `stderr` -- standard error data (with timestamp)
- `complete` -- process finished (with exit code)
- `error` -- stream/process error

**How it works internally** (from DeepWiki analysis of source code):
1. The ProcessService uses "hybrid storage: memory for active processes, disk for completed ones"
2. `streamProcessLogs()` replays the accumulated stdout buffer on each call (confirmed by our Session 27 experience)
3. The stream is consumed via `parseSSEStream<LogEvent>(stream)` async iterator
4. **Cancellation**: The implementation checks "for cancellation between each event" supporting AbortSignal

**Key limitation confirmed by our experience**: `streamProcessLogs()` replays ALL historical stdout on each call. This is by design in the server-side `process-handler.ts`. Our Session 27 fix (sentinel `turn_start` markers to skip replay) is a workaround for this behavior.

### 2.4 getProcessLogs() (Confidence: HIGH)

```typescript
const logs = await sandbox.getProcessLogs(processId: string): Promise<string>
```

Returns all accumulated stdout/stderr as a single string. This is a snapshot, not a stream. Useful for checking if a process has already printed completion markers without holding an open stream.

### 2.5 waitForLog() (Confidence: HIGH)

```typescript
const result = await process.waitForLog(
  pattern: string | RegExp,
  timeout?: number
): Promise<{ line: string, matches: string[] }>
```

Waits for a pattern to appear in process output. Throws `ProcessReadyTimeoutError` or `ProcessExitedBeforeReadyError`.

**Internal implementation**: Not documented, but based on our experience (Sessions 31-33), it uses HTTP SSE internally. The WebSocket transport has a hardcoded 120s stream timeout (`requestTimeoutMs ?? 12e4` at SDK source `index.js:1006`), making it unusable for long-running log watching. The HTTP transport does not have this timeout but hangs silently on TCP disconnect.

### 2.6 waitForExit() (Confidence: HIGH)

```typescript
const result = await process.waitForExit(timeout?: number): Promise<{ exitCode: number }>
```

Waits for process termination. Returns exit code.

### 2.7 sandbox.watch() -- NEW (March 2026) (Confidence: HIGH)

```typescript
const stream = sandbox.watch(path: string, options?: {
  recursive?: boolean,
  include?: string[]  // glob patterns
}): ReadableStream
```

Real-time filesystem watching via SSE backed by native Linux inotify. Events: `create`, `modify`, `delete`, `move`. **This is significant** -- it provides a way to detect when a container process writes files (like completion markers or image outputs) without polling.

### 2.8 Other Notable APIs (Confidence: HIGH)

- **startProcess()**: Returns Process object with `id`, `pid`, `command`, `status`, plus methods `kill()`, `getStatus()`, `getLogs()`, `waitForPort()`, `waitForLog()`, `waitForExit()`
- **getProcess(id)**: Returns detailed process status
- **listProcesses()**: Lists all active processes
- **killProcess(id, signal)**: Sends signal to process group (prevents orphans)
- **createBackup() / restoreBackup()**: Snapshot and restore sandbox directories (Feb 2026)
- **wsConnect(request, port)**: Establish WebSocket connection from Worker to sandbox service

### 2.9 Timeout Behavior (Confidence: MEDIUM)

Per-command timeout > session-level `commandTimeoutMs` > global `COMMAND_TIMEOUT_MS` env var. When timeout fires, SDK raises error but **the underlying process continues running** until session deletion or sandbox destruction. This matches our experience.

---

## 3. Container SDK (@cloudflare/containers)

**Repository**: https://github.com/cloudflare/containers
**Package**: `@cloudflare/containers` (npm)
**Type**: Lower-level than Sandbox SDK

### 3.1 Architecture (Confidence: HIGH)

The Container class extends DurableObject directly. Key differences from Sandbox SDK:
- **No control plane** inside the container -- you build your own
- **Communication via `getTcpPort(port)`** returning a TcpPort object for HTTP/TCP
- **Lifecycle hooks**: `onStart()`, `onStop()`, `onError()`, `onActivityExpired()`
- **Activity timeout**: `sleepAfter` property, `renewActivityTimeout()` method
- **Container states**: `running`, `stopping`, `stopped`, `healthy`, `stopped_with_code`

### 3.2 Container-to-DO Communication (Confidence: HIGH)

The Container class provides these methods:

| Method | Purpose |
|--------|---------|
| `start(options)` | Boot with env vars, entrypoint, internet toggle |
| `destroy(error?)` | Stop container |
| `signal(number)` | Send POSIX signal |
| `getTcpPort(port)` | Get TcpPort for HTTP/TCP communication |
| `monitor()` | Promise that resolves on exit, rejects on error |
| `running` | Boolean status |

**TcpPort usage**:
```javascript
const port = this.ctx.container.getTcpPort(8080);
// HTTP
const response = await port.fetch("http://container/endpoint", { method: "POST", body: data });
// Raw TCP
const socket = port.connect("host:port"); // .readable, .writable
```

### 3.3 Crash Detection (Confidence: HIGH)

`monitor()` returns a promise:
- Resolves on graceful exit
- Rejects on error (including OOM)

OOM behavior: Instance throws error and is rebooted elsewhere. SIGTERM sent on shutdown, then SIGKILL after 15 minutes.

### 3.4 Networking (Confidence: HIGH)

- All container requests pass through a Worker -- end users cannot make non-HTTP TCP/UDP requests directly
- Containers run inside their own VM for strong isolation
- Outbound internet configurable via `enableInternet`
- No internal loopback to Worker's public URL from inside container (confirmed by Moltworker issue #60)
- Container does not need TLS -- encryption handled by Cloudflare network layer

### 3.5 WebSocket Support (Confidence: HIGH)

`fetch()` supports WebSocket upgrade (not `containerFetch()`). WebSocket connections are bi-directionally proxied with messages forwarded in both directions. Activity timeouts renew on message send/receive.

---

## 4. Production Examples

### 4.1 Moltworker (Confidence: HIGH)

**Repository**: https://github.com/cloudflare/moltworker
**Status**: Proof of concept (NOT a Cloudflare product)

Architecture:
- **Entrypoint Worker**: API router + proxy
- **Sandbox Container**: Runs OpenClaw (AI agent gateway) on port 18789
- **R2 Storage**: Mounted via FUSE for persistent state
- **Browser Rendering**: CDP proxy from sandbox through Worker

**Data persistence pattern**: NOT using `mountBucket()`. Instead, uses `rclone` with S3-compatible credentials:
- On startup: `rclone sync` restores config, workspace, and skills from R2
- During operation: Background sync loop every 30 seconds detects file changes via timestamps
- Manual trigger: `POST /api/admin/storage/sync`

**Communication**: Worker polls container state through API endpoints. Configuration flows one-way Worker -> Container via startup env vars.

**Known issue**: Container crashes every hour (community report). No automatic crash recovery documented.

### 4.2 VibeSDK (Confidence: HIGH)

**Repository**: https://github.com/cloudflare/vibesdk
**Architecture**:
- React+Vite frontend
- Workers backend with Durable Objects for agent coordination
- D1 via Drizzle, R2 for templates, KV for sessions
- Sandboxes/Containers for isolated builds
- Workers for Platforms to publish generated apps

**Streaming**: Recent updates added streaming support to deep debugger, WebSocket support for sandbox proxy, tool result events via WebSocket.

**Relevance**: Most architecturally similar to our project. Uses sandboxes for code execution with real-time streaming back to clients.

### 4.3 Cloud Claw (Third Party) (Confidence: MEDIUM)

**Repository**: https://github.com/miantiao-me/cloud-claw
**Pattern**: Worker handles routing + auth, forwards to singleton container running OpenClaw gateway. Uses Cloudflare Browser Rendering for browser automation.

### 4.4 Agents Starter (Confidence: HIGH)

**Repository**: https://github.com/cloudflare/agents-starter
**Pattern**: Uses the Agents SDK directly (no containers). Workers AI with tools, task scheduling. Good reference for Agents SDK patterns but does not handle heavy compute.

---

## 5. Alternative Streaming/Communication Approaches

### 5.1 Container -> DO via Exposed Port + Worker Fetch (Confidence: HIGH)

**Can containers make outbound HTTP calls to the DO?**

**NOT directly via loopback.** Confirmed by Moltworker issue #60: containers cannot reach their own Worker's public URL. `curl` from inside the container to the Worker URL times out (exit code 28) or returns 302 (Cloudflare Access redirect).

**Workaround**: The container can make outbound HTTP calls to the **public internet** (if `enableInternet: true`), so it could theoretically call the Worker's public URL -- but this goes through the public internet, not an internal path, and is subject to Cloudflare Access protection.

**Better alternative**: The DO can connect TO the container via `wsConnect()` or `getTcpPort().fetch()`, establishing a bidirectional channel that the container can use to push data back.

### 5.2 Container -> Worker via WebSocket (Confidence: HIGH)

The DO can establish a WebSocket connection to a service running inside the container:

```javascript
// In Worker/DO
const sandbox = getSandbox(env.Sandbox, "my-sandbox");
return await sandbox.wsConnect(request, 8080);
```

Once connected, the container's WebSocket server can push messages to the Worker. This is bidirectional. However, the connection must be initiated by the Worker/DO, not the container.

### 5.3 R2 Event Notifications -> Queue -> Worker (Confidence: HIGH)

R2 supports event notifications that send messages to a Queue when objects are created/modified/deleted:

```bash
wrangler r2 bucket notification create my-bucket \
  --event-type object-create \
  --queue my-notification-queue \
  --prefix "users/*/completion-markers/"
```

A consumer Worker processes queue messages:

```javascript
export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      const { key, action } = message.body;
      // Notify DO that container wrote a completion marker
    }
  }
}
```

**Feasibility for our use case**: This could replace R2 polling for completion markers. When the container writes the completion marker to R2 (via mounted FUSE), R2 sends an event notification to a Queue, which triggers a consumer Worker, which notifies the DO. However:
- Event notification delivery is eventually consistent (not guaranteed sub-second)
- Adds infrastructure complexity (Queue + consumer Worker + binding)
- Only works for R2 writes, not for stdout streaming
- FUSE writes to R2 happen on file close/unmount, not on every write

### 5.4 Cloudflare Queues from Container (Confidence: LOW)

**Can containers use Queues directly?** Queues require Worker bindings (`env.MY_QUEUE.send()`). Containers do not have access to Worker bindings directly. The container would need to either:
1. Make an HTTP call to the Worker, which then enqueues, OR
2. Use the Queues HTTP API directly (exists for pull-based consumers, but push/send is binding-only)

**Verdict**: Not practical for direct container -> Queue messaging without going through the Worker.

### 5.5 Container Direct R2/KV/D1 Access (Confidence: HIGH)

Containers can access R2 directly via the S3-compatible API:
- Endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- Auth: R2 API token (Access Key + Secret Key)
- Standard S3 client libraries work (boto3, AWS SDK, etc.)

This bypasses FUSE/mountBucket entirely. The container could write completion markers or status updates directly to R2 using the S3 API, and the DO could poll R2 or use R2 event notifications.

**KV and D1**: No direct container access documented. These require Worker bindings.

### 5.6 sandbox.watch() for File-Based Notification (Confidence: MEDIUM)

The new `sandbox.watch()` API (March 2026) could enable a pattern where:
1. Container process writes a completion file (e.g., `/app/done.json`)
2. DO watches for file creation via `sandbox.watch("/app/", { include: ["done.json"] })`
3. Watch event triggers DO to process results

This avoids polling and `waitForLog()` limitations. However:
- It's SSE-based, so it has the same potential disconnect issues as `streamProcessLogs()`
- It watches the container filesystem, not R2 (so the file must exist in the container, not just in mounted R2)
- It's brand new (March 2026) and in beta

### 5.7 Agent + Workflow Pattern (Confidence: HIGH)

For tasks that don't require a full container environment:
1. Agent receives user request via WebSocket
2. Agent starts a Workflow via `runWorkflow()`
3. Workflow runs durably -- steps persist, automatic retry, survives infrastructure failures
4. Workflow reports progress via `reportProgress()` -> triggers Agent's `onWorkflowProgress()`
5. Agent broadcasts to connected WebSocket clients
6. On completion, `onWorkflowComplete()` fires

**Limitation**: Workflows run in the Workers runtime, not in containers. They have the same CPU/memory constraints as Workers. Not suitable for running Claude CLI or heavy compute.

### 5.8 Hybrid Pattern: Agent + Workflow + Container (Confidence: MEDIUM)

A potential pattern combining all three:
1. Agent receives request, starts a Workflow
2. Workflow creates a sandbox/container as one of its steps
3. Workflow monitors the container (via `waitForLog()` or polling)
4. Workflow reports progress to Agent
5. Agent broadcasts to clients
6. If the Workflow step fails, it retries automatically

This adds durable execution guarantees to the container orchestration. The Workflow step wrapping the container call would persist its state, so if the DO is evicted and restarted, the Workflow continues where it left off.

**Trade-off**: More complex infrastructure, but more resilient. The Workflow acts as a "durable supervisor" for the container.

---

## 6. Comparison with Our Architecture

### What We Do vs. What the Agents SDK Does

| Aspect | Our Architecture | Agents SDK |
|--------|-----------------|------------|
| DO class | Custom CampaignSession extending DurableObject | Agent extending Server extending DurableObject |
| State storage | `this.state.storage` (KV) | Built-in SQLite (`cf_agents_state`, `cf_agents_queues`, etc.) |
| Keepalive | Manual alarm heartbeat (setAlarm every 30s) | `keepAlive()` / `keepAliveWhile()` (alarm heartbeat internally) |
| Streaming | stdout -> streamProcessLogs -> parseSSE -> WS | SQLite-buffered resumable streaming |
| Reconnection | R2 completion marker + /recover endpoint | SQLite catch-up streaming (automatic) |
| Message persistence | D1 (separate database) | Built-in SQLite in DO |
| WebSocket broadcast | `getWebSockets().forEach()` | Built-in `broadcast()` method |
| Background tasks | fire-and-forget promise + alarm keepalive | `keepAliveWhile()` + Workflows |

### Key Differences

1. **We're using the lower-level primitives** (Container SDK + manual DO) while the Agents SDK provides a higher-level abstraction. Our `@cloudflare/sandbox` usage is separate from the Agents SDK.

2. **The Agents SDK doesn't use containers at all** for its core features. It runs AI model calls directly from the DO using Workers AI or external APIs (OpenAI, Anthropic). Containers are a separate concern handled by the Sandbox SDK or Container SDK.

3. **Our streaming pipeline is more complex** because we run Claude CLI inside a container. The Agents SDK makes direct API calls from the DO, so streaming is just the LLM API response being forwarded to WebSocket clients.

4. **The Agents SDK's resumable streaming is superior** to our R2 completion marker approach. Their SQLite-based buffering captures every chunk and can resume mid-stream, while our approach only recovers completed generations.

### Could We Adopt the Agents SDK?

**Partial adoption is possible and potentially valuable:**
- `keepAlive()` / `keepAliveWhile()` -- could replace our manual alarm heartbeat
- SQLite-based message persistence -- could replace our D1 message storage
- Observability via diagnostics_channel -- could replace our tailLog buffer
- `broadcast()` -- could simplify multi-tab broadcasting

**Full adoption would require significant refactoring:**
- Our CampaignSession DO would need to extend `Agent` instead of `DurableObject`
- The container orchestration logic would need to be adapted to work within the Agent framework
- The streaming pipeline (container stdout -> SSE -> parse -> WS) doesn't have a direct equivalent in the Agents SDK

**What would NOT be covered by the Agents SDK:**
- Container lifecycle management (start, IP retry, R2 mount, process management)
- Claude CLI execution inside a container
- FUSE-based R2 mounting
- Agent-runner process management

---

## 7. Recommendations

### 7.1 Short-term: Adopt sandbox.watch() for Completion Detection

**Recommendation**: Replace R2 polling with `sandbox.watch()` to detect when the agent-runner writes completion files.

**What would change our mind**: If `sandbox.watch()` has the same silent-disconnect issues as `streamProcessLogs()` (which is likely since both use SSE), this would not be an improvement over our current approach.

### 7.2 Short-term: Switch to WebSocket Transport

**Recommendation**: Set `SANDBOX_TRANSPORT=websocket` to reduce subrequest consumption and potentially improve streaming reliability.

**What would change our mind**: If the 120s WebSocket stream timeout affects `sandbox.watch()` or other streaming operations (not just `waitForLog()`).

### 7.3 Medium-term: Evaluate Agents SDK for DO Base Class

**Recommendation**: Evaluate extending `Agent` instead of `DurableObject` directly to get `keepAlive()`, built-in SQLite state, observability, and broadcast() for free.

**What would change our mind**: If the Agent class imposes constraints that conflict with our container orchestration patterns, or if the partyserver dependency adds too much overhead.

### 7.4 Medium-term: Consider Agent + Workflow for Durable Orchestration

**Recommendation**: Wrap the container orchestration in a Workflow for automatic retry and state persistence across DO evictions.

**What would change our mind**: If Workflows add too much latency to the critical path, or if the step-based execution model doesn't fit the continuous streaming pattern of AI generation.

### 7.5 Long-term: Direct Container-to-DO WebSocket Channel

**Recommendation**: Instead of the current stdout -> streamProcessLogs -> parse pipeline, run a small HTTP/WS server inside the container that the DO connects to via `wsConnect()`. The container pushes structured events directly over this channel.

**What would change our mind**: If the SDK-level streaming (via control plane port 3000) is already reliable enough and the overhead of running our own server inside the container outweighs the benefits.

### 7.6 Do NOT Do: Container -> Worker HTTP Callback

**Not recommended**: Having the container make outbound HTTP calls back to the Worker URL. Confirmed broken by Moltworker issue #60 (loopback does not work). Even if it did, it would go through the public internet and be subject to Cloudflare Access protection.

---

## 8. Gaps & Uncertainties

### What I Could NOT Verify

1. **Sandbox SDK source code**: The GitHub repo (`cloudflare/sandbox-sdk`) is public but rate-limited. Could not read the actual TypeScript implementation of `streamProcessLogs()` to confirm the SSE internals. The DeepWiki analysis provides some details but may not be current. (Confidence in findings: MEDIUM)

2. **WebSocket transport timeout**: Whether the 120s timeout (`requestTimeoutMs ?? 12e4`) affects ALL streaming operations or only `waitForLog()` specifically. Our Session 33 confirmed it kills `waitForLog()`, but we haven't tested `streamProcessLogs()` over WebSocket transport. (Confidence: LOW)

3. **sandbox.watch() reliability**: This API was released March 3, 2026 -- only 10 days ago. No production reports on reliability, disconnect behavior, or performance under load. (Confidence: LOW)

4. **Agents SDK + Container integration**: No documentation or examples show using the Agents SDK Agent class together with sandbox/container orchestration. It's unclear if the Agent class's internal alarm/scheduling would conflict with manual container keepalive patterns. (Confidence: LOW)

5. **R2 event notification latency**: Documentation says events are delivered to Queues, but no SLA on delivery time. For real-time completion detection, sub-second delivery would be needed. (Confidence: LOW)

6. **Container-to-DO reverse channel reliability**: The `wsConnect()` approach for bidirectional communication is documented but no production examples show it being used for long-running background task monitoring. (Confidence: MEDIUM)

7. **Moltworker crash frequency**: Community reports say containers crash every hour, but no official Cloudflare response or fix documented. May be specific to Moltworker's workload. (Confidence: LOW)

8. **@cloudflare/ai-chat internals**: Could not access the npm package README due to rate limiting. The SQLite buffering implementation details are inferred from changelog descriptions. (Confidence: MEDIUM)

### Counter-Arguments to Consider

**Against adopting Agents SDK**: Adding another layer of abstraction increases complexity without solving our core problem (container process management). The Agents SDK is optimized for direct LLM API calls, not container orchestration. Migrating our DO to extend Agent would be a significant refactor for marginal benefit.

**Against sandbox.watch()**: SSE-based APIs have the same fundamental disconnect problem as `streamProcessLogs()`. Adding another streaming channel doesn't solve the root cause. R2 polling, while inelegant, is the most reliable completion detection method because it's stateless and restart-safe.

**Against Agent + Workflow**: The step-based execution model of Workflows (discrete steps with persistence between them) maps poorly to continuous AI generation. A single generation is essentially one long step, so the retry/persistence benefits are minimal.

---

## Sources

### Primary Sources (Cloudflare Official)
- [Cloudflare Agents Documentation](https://developers.cloudflare.com/agents/)
- [Agent Class Internals](https://developers.cloudflare.com/agents/concepts/agent-class/)
- [Agents SDK v0.7.0 Changelog (keepAlive)](https://developers.cloudflare.com/changelog/post/2026-03-02-agents-sdk-v070/)
- [Agents SDK v0.2.24 Changelog (resumable streaming)](https://developers.cloudflare.com/changelog/post/2025-11-26-agents-resumable-streaming/)
- [Sandbox SDK Overview](https://developers.cloudflare.com/sandbox/)
- [Sandbox Architecture](https://developers.cloudflare.com/sandbox/concepts/architecture/)
- [Sandbox Commands API](https://developers.cloudflare.com/sandbox/api/commands/)
- [Sandbox Background Processes](https://developers.cloudflare.com/sandbox/guides/background-processes/)
- [Sandbox Streaming Output](https://developers.cloudflare.com/sandbox/guides/streaming-output/)
- [Sandbox Transport Modes](https://developers.cloudflare.com/sandbox/configuration/transport/)
- [Sandbox Configuration Options](https://developers.cloudflare.com/sandbox/configuration/sandbox-options/)
- [Sandbox Lifecycle](https://developers.cloudflare.com/sandbox/concepts/sandboxes/)
- [Sandbox Limits](https://developers.cloudflare.com/sandbox/platform/limits/)
- [Sandbox WebSocket Connections](https://developers.cloudflare.com/sandbox/guides/websocket-connections/)
- [Sandbox Ports API](https://developers.cloudflare.com/sandbox/api/ports/)
- [Sandbox File Watching (March 2026)](https://developers.cloudflare.com/changelog/post/2026-03-03-sandbox-watch-file-events/)
- [Container Package Documentation](https://developers.cloudflare.com/containers/container-package/)
- [Container Lifecycle](https://developers.cloudflare.com/containers/platform-details/architecture/)
- [Container FAQ](https://developers.cloudflare.com/containers/faq/)
- [Durable Object Container API](https://developers.cloudflare.com/durable-objects/api/container/)
- [Workflows + Agents Integration](https://developers.cloudflare.com/agents/concepts/workflows/)
- [Run Workflows from Agents](https://developers.cloudflare.com/agents/api-reference/run-workflows/)
- [R2 Event Notifications](https://developers.cloudflare.com/r2/buckets/event-notifications/)
- [Cloudflare Workflows GA Blog](https://blog.cloudflare.com/workflows-ga-production-ready-durable-execution/)
- [Moltworker Blog Post](https://blog.cloudflare.com/moltworker-self-hosted-ai-agent/)
- [Containers Coming Blog (Architecture)](https://blog.cloudflare.com/cloudflare-containers-coming-2025/)
- [VibeSDK Blog Post](https://blog.cloudflare.com/deploy-your-own-ai-vibe-coding-platform/)

### GitHub Repositories
- [cloudflare/agents](https://github.com/cloudflare/agents) - Agents SDK monorepo
- [cloudflare/sandbox-sdk](https://github.com/cloudflare/sandbox-sdk) - Sandbox SDK monorepo
- [cloudflare/containers](https://github.com/cloudflare/containers) - Container package
- [cloudflare/agents-starter](https://github.com/cloudflare/agents-starter) - Starter template
- [cloudflare/moltworker](https://github.com/cloudflare/moltworker) - Moltworker (OpenClaw on CF)
- [cloudflare/vibesdk](https://github.com/cloudflare/vibesdk) - Vibe coding platform
- [cloudflare/awesome-agents](https://github.com/cloudflare/awesome-agents) - Curated list
- [miantiao-me/cloud-claw](https://github.com/miantiao-me/cloud-claw) - Third-party OpenClaw on CF
- [Moltworker Issue #60 - Loopback](https://github.com/cloudflare/moltworker/issues/60) - Container loopback limitation

### npm Packages
- [@cloudflare/sandbox](https://www.npmjs.com/package/@cloudflare/sandbox)
- [@cloudflare/containers](https://www.npmjs.com/package/@cloudflare/containers)

### Secondary Sources
- [DeepWiki: Sandbox SDK Command Execution](https://deepwiki.com/cloudflare/sandbox-sdk/3.1-executing-commands)
- [DeepWiki: Moltworker R2 Storage](https://deepwiki.com/cloudflare/moltworker/5.1-r2-storage-architecture)
- [Moltworker Container Crashes (Community)](https://community.cloudflare.com/t/moltworker-container-crash-every-hour/903732)
- [Container sleepAfter behavior (Community)](https://community.cloudflare.com/t/cloudflare-containers-help-understanding-sleepafter-and-container-termination/863468)
