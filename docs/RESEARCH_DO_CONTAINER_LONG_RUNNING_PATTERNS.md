# Research: Long-Running Background Tasks with Cloudflare Durable Objects, Containers, and Hibernation API

**Date**: 2026-03-12
**Researcher**: Claude (Opus)
**Confidence levels**: HIGH = multiple primary sources agree | MEDIUM = single primary source or inferred | LOW = secondary sources only or speculation

---

## Table of Contents

1. [Cloudflare's Recommended Patterns](#1-cloudflares-recommended-patterns)
2. [Hibernation API + Background Work](#2-hibernation-api--background-work-patterns)
3. [Alternative Architectures](#3-alternative-architectures)
4. [The "Controller is already closed" Bug](#4-the-controller-is-already-closed-bug)
5. [Synthesis: Architecture Recommendations](#5-synthesis-architecture-recommendations)
6. [Gaps & Uncertainties](#6-gaps--uncertainties)
7. [Sources](#7-sources)

---

## 1. Cloudflare's Recommended Patterns

### 1.1 Sandbox SDK Process Management API

**Confidence: HIGH** (primary source: official Cloudflare docs)

The Sandbox SDK provides three tiers of process execution:

| Method | Use Case | Completion Signal |
|--------|----------|-------------------|
| `exec()` | One-time commands that exit | Returns `{ stdout, stderr, exitCode }` |
| `execStream()` | One-time commands with real-time output | SSE stream with `complete` event |
| `startProcess()` | Long-running services/daemons | No completion — use `waitForLog()`, `waitForExit()`, or `streamProcessLogs()` |

**`startProcess()`** starts a process and returns `{ id, pid, command, status }`. The process continues running independently of the caller.

**`streamProcessLogs(processId)`** returns a readable SSE stream. Important behavior from the docs: the stream replays ALL accumulated stdout/stderr from the process, not just new output. This means reconnecting after a disconnect replays everything (confirmed by our Session 27 experience with sentinel markers).

**`waitForLog(pattern, timeout?)`** waits for a string/regex pattern in stdout/stderr. Returns the matching line + capture groups. If the pattern already appeared in accumulated logs, it resolves immediately. This is the intended completion detection mechanism.

**Critical timeout behavior**: When a command times out, the SDK raises an error on the caller side and closes the connection. The underlying process **continues running** inside the container. You must explicitly kill it.

**`keepAlive`** option: Prevents container auto-sleep by sending heartbeat pings every 30 seconds. Without this, containers auto-sleep after 10 minutes (configurable via `sleepAfter`). With `keepAlive: true`, you MUST call `sandbox.destroy()` when done.

**`setKeepAlive()`**: Can be toggled dynamically after sandbox creation — no need to recreate.

### 1.2 Transport Modes

**Confidence: HIGH** (primary source: official docs)

Two transport modes available:

**HTTP Transport (default)**: Each SDK operation (`exec()`, `readFile()`, `writeFile()`, etc.) makes a separate HTTP request. Uses SSE for streaming. Each operation counts as one subrequest.

**WebSocket Transport**: All operations multiplex over a single persistent WebSocket connection. The initial WS upgrade counts as one subrequest; subsequent operations are free. Enable via `SANDBOX_TRANSPORT=websocket` in wrangler vars.

**When to use WebSocket**: When hitting subrequest limits (50 free, 1000 paid per request) or performing many rapid operations. The transport is transparent to application code — all SDK methods work identically.

**Known issue with WebSocket transport**: Our project discovered a hardcoded 120-second `requestTimeoutMs` in the SDK source (`index.js:1006`). This kills `waitForLog` after 2 minutes, making WebSocket transport unusable for long-running log watching. HTTP transport does not have this limitation. (Confidence: HIGH — confirmed by source code inspection in Session 33)

### 1.3 Durable Object Container API (Native Containers, Not Sandbox SDK)

**Confidence: HIGH** (primary source: official docs + Cloudflare blog)

For native Cloudflare Containers (not the Sandbox SDK), the DO has a `ctx.container` API:

- **`start(options)`** — Boot with env vars, entrypoint, internet access control
- **`getTcpPort(port)`** — Get a fetchable interface for HTTP communication to the container
- **`monitor()`** — Returns a promise that resolves on container exit, rejects on error
- **`destroy(error?)`** — Stop with optional error message
- **`signal(sig)`** — Send POSIX signal (SIGTERM=15, SIGKILL=9)

The `getTcpPort().fetch()` pattern enables bidirectional HTTP communication between DO and container. The blog shows this pattern explicitly:

```javascript
const response = await this.ctx.container
  .getTcpPort(8080)
  .fetch("http://container/state", { body: initialState, method: 'POST' });
```

**Important distinction**: The Sandbox SDK (`@cloudflare/sandbox`) is a higher-level abstraction built on top of the Container API. The native Container API offers lower-level control but requires more manual orchestration. The Sandbox SDK wraps container lifecycle, file operations, and process management behind a simpler interface, but adds abstractions (like the SSE-based `streamProcessLogs()`) that can introduce their own failure modes.

### 1.4 Real-World Production Pattern: Workers Builds

**Confidence: HIGH** (primary source: Cloudflare engineering blog, June 2025)

Cloudflare's own Workers Builds system uses DOs + Containers at scale (1M+ DOs):

**Architecture**: Two DO classes — `Scheduler` (finds pending builds in Postgres) and `BuildBuddy` (manages individual build containers).

**BuildBuddy responsibilities**:
1. Create container via Cloudflare Containers
2. Monitor container with health checks
3. Receive build logs (streamed into the DO)
4. On failure, enqueue build ID to `BuildErrorsQueue` for async error analysis

**Key pattern**: Event-driven queuing, not polling. BuildBuddy enqueues failed builds asynchronously rather than synchronously invoking completion handlers. Logs are stored across millions of individual DOs (one per build), providing natural horizontal scaling.

**Takeaway**: Cloudflare themselves use a pattern where the DO monitors the container lifecycle and queues completion events — they don't rely on streaming connections staying alive indefinitely.

---

## 2. Hibernation API + Background Work Patterns

### 2.1 The Fundamental Constraint

**Confidence: HIGH** (primary source: official docs + workerd team)

Hibernation can ONLY occur when ALL conditions are true:
1. No `setTimeout`/`setInterval` callbacks scheduled
2. No in-progress `fetch()` awaited
3. No WebSocket standard API usage (only Hibernatable WebSocket API)
4. No request/event still being processed

**The critical implication**: If you start a fire-and-forget promise (unawaited background work) and the handler returns, the DO enters the "idle, hibernateable" state after ~10 seconds. If all hibernation conditions are met, the runtime discards in-memory state. **All background promises die silently.**

Kenton Varda (workerd maintainer) confirmed in GitHub issue #877: "Durable Objects don't have `waitUntil()` because it wouldn't do anything. A DO shuts down about 1 minute after the last client disconnects." The key difference from Workers: DOs automatically remain active as long as there is ongoing work or pending I/O.

### 2.2 What "Ongoing Work" Means in Practice

**Confidence: MEDIUM** (inferred from docs + observed behavior)

The DO stays alive (non-hibernateable) when:
- An awaited `fetch()` is in flight (including `streamProcessLogs()` which uses HTTP SSE internally)
- A `setTimeout`/`setInterval` is pending
- An alarm handler is executing
- A WebSocket message handler is executing

The DO CAN hibernate when:
- All handlers have returned
- No pending timers
- No in-flight fetch operations
- Using Hibernatable WebSocket API (not standard WS API)

**What this means for our architecture**: If `runGeneration()` awaits `waitForLog()` (which internally does `fetch()` to get SSE), the DO stays alive. But if `waitForLog()` disconnects (TCP drop, timeout), the `fetch()` resolves/rejects, and the DO is free to hibernate. This is exactly the failure mode we've observed.

### 2.3 The Alarm Heartbeat Pattern

**Confidence: HIGH** (primary source: official docs + Agents SDK v0.7.0)

The recommended pattern for keeping a DO alive during long-running work:

```javascript
async keepAlive() {
  await this.ctx.storage.setAlarm(Date.now() + 30_000);
}

async alarm() {
  if (this.isGenerating) {
    // Reschedule to keep alive
    await this.ctx.storage.setAlarm(Date.now() + 30_000);
    // Do any polling work here
  }
}
```

The Cloudflare Agents SDK v0.7.0 (released 2026-03-02) formalized this as `keepAlive()`:

- Creates a 30-second alarm heartbeat schedule
- Each alarm firing resets the inactivity timer
- Returns a disposer function to cancel when done
- `keepAliveWhile(asyncFn)` wraps with automatic cleanup
- Multiple concurrent callers get independent disposers
- `AIChatAgent` calls it automatically during streaming

**Does `setAlarm()` keep the IO context alive for streams?**: Not directly. The alarm keeps the DO from being evicted, but it doesn't maintain an existing stream connection. If a `streamProcessLogs()` SSE connection drops, the alarm firing won't restore it. The alarm fires as a new execution context — it can initiate new work (like polling R2 or re-attaching a stream), but it cannot resume a dead stream.

### 2.4 The DOs-Stay-Alive-Automatically Nuance

**Confidence: HIGH** (primary source: workerd team)

Unlike Workers, DOs DON'T need `waitUntil()`. A DO stays alive for ~70-140 seconds after the last activity even without hibernation. With an in-flight `fetch()` (like `waitForLog()`), it stays alive indefinitely.

**But**: "Stays alive" assumes the I/O operation remains healthy. A silently disconnected `reader.read()` (our `waitForLog` hang bug) looks like pending I/O to the runtime, so the DO stays alive but stuck. This is worse than dying — it's a zombie state where the DO is pinned to memory, burning GB-s charges, but doing nothing useful.

---

## 3. Alternative Architectures

### 3.1 Pattern A: File-Based IPC (Container Writes, DO Polls via Alarm)

**Confidence: HIGH** (this is our current approach + widely used)

**How it works**:
1. Container process writes output/status to files (e.g., R2 via FUSE mount)
2. DO sets a recurring alarm (every 10-30 seconds)
3. Alarm handler checks R2 for completion marker or status files
4. On completion, alarm reads results and notifies client via WebSocket

**Pros**:
- No persistent connection to maintain between DO and container
- Survives DO hibernation/restart (alarm + R2 state are durable)
- Natural recovery — new alarm can pick up where old one left off
- Container process is completely independent of DO lifecycle

**Cons**:
- Latency: polling interval adds delay to completion detection (10-30s)
- R2 eventual consistency: writes may not be immediately visible
- FUSE mount flush issues: `writeFileSync` is safe, but open file descriptors (JSONL) only flush on `close()`/`fsync(fd)`/`unmountBucket()` — NOT on Linux `sync`
- Polling cost: each alarm + R2 check costs subrequests

**Who would disagree**: Engineers optimizing for real-time UX. 10-30s polling latency is noticeable in an interactive chat UI. But the reliability gain may outweigh the latency cost.

**What would change this assessment**: If Cloudflare introduced durable/resumable streams between DO and container, or if R2 supported change notifications (pub/sub on key creation), polling would be unnecessary.

### 3.2 Pattern B: Container-to-DO Callback via HTTP

**Confidence: MEDIUM** (supported by Container API docs, not by Sandbox SDK)

**How it works**:
1. DO starts container and passes its own URL or ID as an env var
2. Container runs process, then makes an HTTP request back to the DO (or to the Worker which routes to the DO)
3. DO receives the callback and processes the result

**With native Container API**: The `getTcpPort().fetch()` pattern is well-documented and bidirectional — the DO can call the container, and the container can expose an HTTP server.

**With Sandbox SDK**: The Sandbox SDK does NOT expose the container's network to the DO for incoming connections. Communication is one-directional: DO calls sandbox methods. The container cannot call back to the DO.

**For our architecture**: We use the Sandbox SDK, so the container cannot make HTTP callbacks to the DO directly. The container could potentially call an external endpoint (the Worker's public URL), which would route to the DO. But this requires:
- `enableInternet: true` on the sandbox (which we already have for Anthropic API)
- The container knowing the Worker's URL and the session/campaign ID
- Authentication (the callback would need to bypass or include auth)

**Pros**:
- Near-instant completion notification (no polling delay)
- Container pushes status rather than DO pulling

**Cons**:
- Requires the container to have internet access to the Worker URL
- If the DO has been evicted/reset between the start and the callback, the callback hits a fresh DO that has no context (must persist state to storage)
- Network failures between container and Worker URL
- Not natively supported by Sandbox SDK (only by native Container API)

### 3.3 Pattern C: Queue-Based Patterns

**Confidence: HIGH** (primary source: official docs + Workers Builds example)

**How it works**:
1. Container writes completion status to a known location (R2 or shared storage)
2. DO publishes a message to Cloudflare Queue on task creation
3. Queue consumer Worker checks for completion and routes back to DO

OR (simpler):
1. DO polls via alarm (same as Pattern A)
2. On completion, DO publishes result to Queue for downstream processing

**Cloudflare Queues + DOs integration** is first-class:
```javascript
await this.env.YOUR_QUEUE.send({
  campaignId: this.campaignId,
  status: 'completed',
  imageCount: 6
});
```

Workers Builds uses this pattern: `BuildBuddy` enqueues failed builds to `BuildErrorsQueue` for async error analysis.

**Pros**:
- Guaranteed at-least-once delivery
- Automatic retries
- Decouples container lifecycle from DO lifecycle

**Cons**:
- Adds complexity (Queue configuration, consumer Worker)
- Not helpful for real-time streaming (good for completion events only)
- Additional cost (Queue pricing)

**Who would disagree**: Teams that need streaming output (our use case). Queues are great for completion events but can't replace real-time SSE/WebSocket streaming of generation progress.

### 3.4 Pattern D: Cloudflare Workflows for Durable Execution

**Confidence: HIGH** (primary source: official docs, Workflows GA blog)

Workflows is Cloudflare's durable execution engine built on top of DOs. Each "step" is checkpointed — if the Workflow crashes, it resumes from the last successful step.

**For AI agents**:
```javascript
await step.do('llm-turn-1', {
  retries: { limit: 3, delay: '10 seconds', backoff: 'exponential' }
}, async () => {
  // LLM API call — automatically retried on failure
});
```

**Key capabilities**:
- `step.sleep()` / `step.sleepUntil()` — pause for hours/days
- `reportProgress()` — real-time updates to connected clients
- Each step individually retryable
- Survives crashes, deploys, and evictions

**For our architecture**: Workflows could wrap the entire generation pipeline. Each LLM API call and tool execution becomes a step. The container process would still run independently, but the Workflow would manage the orchestration with built-in retry.

**Cons**:
- Requires significant refactoring of the generation pipeline
- Step boundaries must be carefully designed (each step is a checkpoint)
- Real-time streaming within a step is possible but adds complexity
- Workflows have their own limits (step count, duration)

**What would change this assessment**: If our generation pipeline already had clear step boundaries (research -> hooks -> images -> prompts), Workflows would be a natural fit. Our pipeline is more monolithic (single Claude agent making its own decisions), which makes step decomposition harder.

### 3.5 Pattern E: Hybrid — Stream + Alarm Fallback

**Confidence: MEDIUM** (this is what we've been converging toward)

**How it works**:
1. DO starts container and attaches `waitForLog()` to watch for completion
2. Simultaneously, DO starts alarm heartbeat (every 30s)
3. If `waitForLog()` resolves: fast path, immediate completion
4. If `waitForLog()` fails/disconnects: alarm polls R2 for completion marker
5. When alarm finds marker: slow path, delayed but reliable completion

**This is essentially our current architecture** (Session 33). The key insight is that neither streaming nor polling alone is sufficient:

| Approach | Reliability | Latency | Cost |
|----------|-------------|---------|------|
| Stream only (`waitForLog`) | LOW (disconnects) | Best | Low |
| Poll only (alarm + R2) | HIGH (durable) | 10-30s | Medium |
| Hybrid (stream + poll fallback) | HIGH | Best when stream works, 10-30s fallback | Medium |

---

## 4. The "Controller is already closed" Bug

### 4.1 Exact Error

**Confidence: MEDIUM** (multiple related issues found, but no exact match in Sandbox SDK context)

The error `"TypeError [ERR_INVALID_STATE]: Invalid state: Controller is already closed"` occurs at `ReadableByteStreamController.close()`. This is a standard JavaScript runtime error when code attempts to close a `ReadableStream` controller that has already been closed.

### 4.2 Known Related Issues

**RPC Stub Disposal (capnweb #110)**:
- Error: `"RPC stub used after being disposed"`
- Cause: RPC stubs received as parameters are auto-disposed when the RPC call returns. If you store them for later use, you must call `.dup()` to preserve them.
- Fix: Call `stub.dup()` before storing, accept stubs without re-wrapping.
- Relevance: HIGH — this could explain errors when the DO tries to use a sandbox reference after the handler that created it has returned.

**ReadableStream RPC Disconnection (community forum)**:
- Within 1-5 seconds of deployment, the DO shuts down and cuts off the ReadableStream, propagating the error upstream.
- Cause: Code updates trigger DO reset, killing all in-flight streams.
- Relevance: HIGH — this matches our "Deploy has two propagation phases" gotcha.

**Response Closed Due to Connection Limit (workerd #4471)**:
- Error: `"Response closed due to connection limit"`
- Cause: Each request is limited to 6 concurrent active subrequests. Exceeding this cancels existing subrequests.
- Relevance: MEDIUM — could affect our architecture if the DO has multiple concurrent operations (stream + fetch + R2 read).

**Port 18789 Stuck (moltworker issues)**:
- Gateway process locks port after deployment, subsequent redeployments fail
- Cause: Container process doesn't clean up properly, port remains locked
- Relevance: LOW — different from our error, but shows container lifecycle issues.

### 4.3 Root Cause Analysis for Our Context

**Confidence: MEDIUM** (inference from multiple sources)

In our architecture, "Controller is already closed" likely occurs when:

1. **DO reset during stream**: A `wrangler deploy` triggers DO code update. The DO instance is reset, killing the `streamProcessLogs()` SSE connection. The stream's `ReadableByteStreamController` is already closed by the runtime, but our code attempts to read from or close it again.

2. **Hibernation killing stream**: If the `waitForLog()` / `streamProcessLogs()` connection drops silently (TCP timeout), the DO may enter hibernation. When it wakes (alarm or new request), the old stream references are gone — the controller was closed during hibernation.

3. **Sandbox eviction**: If the sandbox sleeps/evicts while the DO still holds a reference to `streamProcessLogs()`, the stream controller is closed server-side (sandbox), but the DO doesn't get a clean error — it gets a "controller closed" error on the next read attempt.

4. **RPC context expiration**: Similar to the capnweb issue — the Sandbox SDK reference obtained in one handler execution may be auto-disposed when that handler returns. If a fire-and-forget promise tries to use it later, the RPC context is gone.

### 4.4 Recommended Mitigations

1. **Wrap all stream reads in try/catch**: Never assume a stream is still open. The controller can close at any time.

2. **Use the hybrid pattern**: Don't rely solely on `waitForLog()`. Have an alarm-based fallback that polls R2.

3. **Re-obtain sandbox references**: After a DO reset or alarm wake, get a fresh sandbox reference rather than reusing a stored one. `getSandbox()` with the same ID routes to the same container.

4. **Handle deploy-time resets**: Persist generation state to `this.state.storage` so a reset DO can recover context and re-attach.

5. **Avoid concurrent subrequests**: Keep concurrent sandbox operations under 6 to avoid the connection limit issue.

---

## 5. Synthesis: Architecture Recommendations

### 5.1 Recommended Architecture for Our Use Case

Based on all findings, the optimal architecture for a long-running AI generation pipeline (5-15 minutes) on Cloudflare is:

**Primary path: Stream with alarm heartbeat**
```
DO starts generation:
  1. Persist state to this.state.storage
  2. Start alarm heartbeat (30s intervals)
  3. Start container process via startProcess()
  4. Attach waitForLog("turn_complete") with generous timeout

If waitForLog resolves:
  -> Process results immediately
  -> Stop alarm heartbeat
  -> Notify client via WebSocket

If waitForLog fails/disconnects:
  -> Alarm handler takes over
  -> Poll R2 for completion marker
  -> If found: process results, notify client
  -> If not found: re-attach waitForLog (fresh reference)
```

**Key design principles**:
1. The container process must be self-sufficient — it writes its own completion marker and results to R2, regardless of whether the DO is watching.
2. The DO's role is observation, not control — it monitors the container but doesn't need to be alive for the container to complete.
3. All DO state is persisted incrementally — every significant state change is written to `this.state.storage` or D1.
4. Stream connections are treated as unreliable — they're a best-effort optimization for low latency, not a guarantee.

### 5.2 What Cloudflare Would Recommend (Based on Patterns)

Based on the Workers Builds architecture, Cloudflare's production pattern is:

1. **Use DOs as container lifecycle managers** (BuildBuddy pattern)
2. **Stream logs into the DO** for real-time visibility
3. **Use Queues for completion events** rather than relying on streams
4. **Enqueue failures** for async error analysis
5. **Don't rely on persistent stream connections** — use event-driven patterns

### 5.3 Future-Proofing

**What changes in 12 months**:
- Cloudflare Agents SDK is rapidly evolving (v0.7.0 just released). `keepAlive()` pattern may become first-class in the Sandbox SDK.
- Workflows integration could subsume the entire orchestration layer.
- Container-to-DO HTTP callbacks may become available in the Sandbox SDK.
- The 120s WebSocket transport timeout may be fixed.

**What would change the recommendation**:
- If Cloudflare adds durable/resumable streams (stream survives DO hibernation), the alarm fallback becomes unnecessary.
- If R2 supports change notifications (event-triggered on key creation), polling becomes event-driven.
- If the Sandbox SDK supports `getTcpPort()` style bidirectional communication, the container could push status directly.

---

## 6. Gaps & Uncertainties

### Things I Could Not Verify

1. **Exact behavior of stream during DO hibernation**: Does the stream cleanly close, or does `reader.read()` hang forever? Official docs don't address this. Our empirical observation (Session 33) suggests it hangs silently. Confidence: MEDIUM.

2. **Whether alarm handler can maintain a stream**: The docs don't say whether an alarm handler's IO context supports long-running `fetch()` operations (like re-attaching `streamProcessLogs()`). Our code does this, but it's unclear if it's officially supported. Confidence: LOW.

3. **Sandbox SDK's internal stream timeout on HTTP transport**: We know WebSocket has 120s hardcoded. HTTP transport doesn't seem to have this, but there may be Cloudflare proxy timeouts (Error 524 = 100s origin response timeout). Confidence: LOW.

4. **6 concurrent subrequest limit applicability**: Does this apply to DO-to-container communication via Sandbox SDK? If our DO has `waitForLog()` + `readFile()` + `writeFile()` concurrent, does that hit the limit? Confidence: LOW.

5. **Exact "Controller is already closed" trigger**: No exact reproduction found in Sandbox SDK GitHub issues. Issue #370 ("Investigate potential limits in reading stdout from the sandbox") is open but has no description. Confidence: LOW.

6. **R2 eventual consistency window**: How quickly do R2 writes become visible via `r2.get()`? Official docs say "strong consistency for objects in the same location" but FUSE mount adds a layer. Confidence: LOW.

7. **Container-to-Worker callback feasibility with Sandbox SDK**: Can a process inside a Sandbox SDK container make HTTP requests to the Worker's public URL? Theoretically yes (internet is enabled), but untested. Auth and routing would need design. Confidence: LOW.

8. **`getProcessLogs()` vs `streamProcessLogs()` reliability**: `getProcessLogs()` returns accumulated logs without a persistent stream. Could this be used for polling instead of streaming? Docs mention it but don't detail reliability characteristics. Confidence: MEDIUM.

### Counter-Arguments to Consider

**Against the hybrid pattern**: It's complex. Two code paths (stream + poll) means two sets of bugs. A simpler system with ONLY alarm polling (no stream at all) might be more reliable, at the cost of 10-30s latency.

**Against alarm heartbeat**: If the generation takes 15 minutes and alarms fire every 30 seconds, that's 30 alarm invocations. Each one keeps the DO alive but also costs GB-s duration. A dedicated Worker that polls would be cheaper.

**Against the current Sandbox SDK**: The native Container API (`ctx.container.getTcpPort().fetch()`) offers more control and bidirectional communication. Migrating from Sandbox SDK to native Container API would be a significant refactor but would unlock patterns like container-to-DO HTTP callbacks.

---

## 7. Sources

### Primary Sources (Official Cloudflare Documentation)

- [Run background processes - Sandbox SDK](https://developers.cloudflare.com/sandbox/guides/background-processes/) — `startProcess()`, `waitForLog()`, process management
- [Stream output - Sandbox SDK](https://developers.cloudflare.com/sandbox/guides/streaming-output/) — `streamProcessLogs()`, `parseSSEStream()`
- [Sandbox lifecycle](https://developers.cloudflare.com/sandbox/concepts/sandboxes/) — Container states, destruction behavior
- [Sandbox options](https://developers.cloudflare.com/sandbox/configuration/sandbox-options/) — `keepAlive`, `sleepAfter`
- [Transport modes - Sandbox SDK](https://developers.cloudflare.com/sandbox/configuration/transport/) — HTTP vs WebSocket, subrequest limits
- [Sandbox SDK Architecture](https://developers.cloudflare.com/sandbox/concepts/architecture/) — Communication model, transport layers
- [Sandbox SDK Limits](https://developers.cloudflare.com/sandbox/platform/limits/) — Subrequest limits, container limits
- [Sandbox SDK llms-full.txt](https://developers.cloudflare.com/sandbox/llms-full.txt) — Comprehensive API reference including timeout precedence
- [Rules of Durable Objects](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/) — Best practices, alarm patterns, WebSocket hibernation
- [Lifecycle of a Durable Object](https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/) — Hibernation conditions, eviction timeline
- [Durable Object Container API](https://developers.cloudflare.com/durable-objects/api/container/) — `start()`, `getTcpPort()`, `monitor()`, `destroy()`
- [Alarms API](https://developers.cloudflare.com/durable-objects/api/alarms/) — `setAlarm()`, `getAlarm()`, retry behavior
- [Known issues - Durable Objects](https://developers.cloudflare.com/durable-objects/platform/known-issues/) — Global uniqueness, WebSocket logging
- [Troubleshooting - Durable Objects](https://developers.cloudflare.com/durable-objects/observability/troubleshooting/) — Common errors, overload conditions
- [FAQs - Durable Objects](https://developers.cloudflare.com/durable-objects/reference/faq/) — Duration charges, CPU limits, storage limits
- [Queues with Durable Objects](https://developers.cloudflare.com/queues/examples/use-queues-with-durable-objects/) — Publishing from DO to Queue
- [Container Limits](https://developers.cloudflare.com/containers/platform-details/limits/) — Per-instance resource limits
- [Container Lifecycle](https://developers.cloudflare.com/containers/platform-details/architecture/) — How containers work with DOs
- [Build Durable AI Agent - Workflows](https://developers.cloudflare.com/workflows/get-started/durable-agents/) — Step-based durable execution with AI
- [Control/Data Plane Pattern](https://developers.cloudflare.com/reference-architecture/diagrams/storage/durable-object-control-data-plane-pattern/) — DO sharding architecture
- [Agent class internals - Agents SDK](https://developers.cloudflare.com/agents/concepts/agent-class/) — State management, scheduling, task queue

### Primary Sources (Cloudflare Engineering Blog)

- [Containers coming to Workers (April 2025)](https://blog.cloudflare.com/cloudflare-containers-coming-2025/) — Container architecture, `getTcpPort()` examples, orchestration patterns
- [Workers Builds across 1M DOs (June 2025)](https://blog.cloudflare.com/detecting-workers-builds-errors-across-1-million-durable-durable-objects/) — Production DO + container pattern, BuildBuddy architecture
- [Workflows GA (2025)](https://blog.cloudflare.com/workflows-ga-production-ready-durable-execution/) — Durable execution engine
- [Durable Objects Alarms](https://blog.cloudflare.com/durable-objects-alarms/) — Alarm design and use cases

### Primary Sources (GitHub)

- [workerd #877 — Why DOs don't need waitUntil](https://github.com/cloudflare/workerd/issues/877) — Kenton Varda's explanation of DO lifecycle
- [capnweb #110 — RPC stub disposal error](https://github.com/cloudflare/capnweb/issues/110) — `dup()` pattern for preserving stubs
- [workerd #4471 — Response closed due to connection limit](https://github.com/cloudflare/workerd/issues/4471) — 6 concurrent subrequest limit
- [workerd #4864 — Hibernation for outgoing WebSockets](https://github.com/cloudflare/workerd/issues/4864) — Feature request for outgoing WS hibernation
- [sandbox-sdk #370 — Stdout reading limits](https://github.com/cloudflare/sandbox-sdk/issues/370) — Open issue, no details yet
- [sandbox-sdk issues](https://github.com/cloudflare/sandbox-sdk/issues) — Multiple flaky test issues related to timeouts (#481-485)

### Changelogs

- [Agents SDK v0.7.0 (2026-03-02)](https://developers.cloudflare.com/changelog/post/2026-03-02-agents-sdk-v070/) — `keepAlive()`, `keepAliveWhile()`, `waitForMcpConnections`
- [Sandbox SDK Major Update (2025-08-05)](https://developers.cloudflare.com/changelog/post/2025-08-05-sandbox-sdk-major-update/) — Streaming, process control, Git support

### Community/Secondary Sources

- [Long-lived DO instance? - Community Forum](https://community.cloudflare.com/t/long-lived-durable-object-instance/362604) — Discussion of stream polling issues
- [DO response streaming flushing - Community Forum](https://community.cloudflare.com/t/durable-objects-response-streaming-doesnt-have-flushing-capabilities/330007) — Buffer flushing limitations
- [Triggering Long Jobs in Workers - DEV Community](https://dev.to/teaganga/triggering-long-jobs-in-cloudflare-workers-8mh) — Queue-based pattern
- [Job Scheduler with DOs and Queues - DEV Community](https://dev.to/shaikhalamin/building-a-reliable-job-scheduler-with-cloudflare-durable-objects-and-queues-3d27) — DO + Queue integration pattern
- [Container + DO binding failure - Community Forum](https://community.cloudflare.com/t/cloudflare-containers-durable-objects-critical-binding-failure-unable-to-acces/887027) — Container binding issues
- [Sandbox Container Port 18789 stuck - Community Forum](https://community.cloudflare.com/t/cloudflare-worker-with-sandbox-container-port-18789-stuck-after-deployment/887019) — Container cleanup issues
- [moltworker #156 — SANDBOX_SLEEP_AFTER not working](https://github.com/cloudflare/moltworker/issues/156) — Container lifecycle issues
