# Research: Cloudflare Containers Observability

**Date:** 2026-03-13
**Scope:** Logging, monitoring, debugging, and observability for the Cloudflare Containers product (public beta, launched June 2025)

---

## Executive Summary

Cloudflare Containers observability is functional but immature. The platform provides **dashboard-based log viewing** (7-day retention on paid plans), **built-in CPU/memory metrics**, and **Logpush for enterprise users**. However, there is **no `wrangler containers logs` CLI command**, container stdout/stderr is not directly exposed through `wrangler tail`, and local development logging is a known gap (GitHub issue #10305, tracked as DEVX-2154). The Sandbox SDK (higher-level abstraction built on Containers) provides richer observability APIs (`getProcessLogs`, `streamProcessLogs`, `listProcesses`) that are the primary mechanism for programmatic process monitoring within containers. The Agents SDK v0.7.0 adds structured `diagnostics_channel` events for agent-level observability, forwarded automatically to Tail Workers.

---

## 1. Built-in Container Logging

### What Cloudflare Provides

**Dashboard Logs (Confidence: HIGH)**
- Container logs are viewable in the Cloudflare dashboard with live tailing capability
- Requires `"observability": { "enabled": true }` in your `wrangler.jsonc`
- Retention: 3 days (Free plans), 7 days (Paid plans)
- Dashboard path: Workers & Pages > [Your Worker] > Observability
- This captures `console.log()`, `console.warn()`, `console.error()` from Worker/DO code
- Source: [Containers FAQ](https://developers.cloudflare.com/containers/faq/), [Workers Logs docs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)

**Built-in Metrics (Confidence: HIGH)**
- CPU and memory usage tracking per container instance
- Instance status monitoring (running, sleeping, stopped)
- Accessible through the Containers Dashboard
- Source: [Containers public beta blog post](https://blog.cloudflare.com/containers-are-available-in-public-beta-for-simple-global-and-programmable/)

**What "container logs" actually means (Confidence: MEDIUM)**
- The documentation is ambiguous about whether "container logs" refers to Worker/DO-side `console.log()` or the container process's stdout/stderr
- Based on my experience with this project and the FAQ wording ("toggle observability to true in your Worker's wrangler config"), these logs appear to be **Worker-side logs** (i.e., `console.log()` in your DO code), not the raw stdout/stderr from processes running inside the container
- Container-internal process output (stdout/stderr) is accessed via the Sandbox SDK's `getProcessLogs()`/`streamProcessLogs()` APIs, not through the dashboard

### Configuration

```jsonc
// wrangler.jsonc
{
  "observability": {
    "enabled": true,
    "logs": {
      "invocation_logs": true,
      "head_sampling_rate": 1  // 0-1, default 1 = 100%
    }
  }
}
```

Minimum Wrangler version: 3.78.6

### Known Limitation: DO Alarm Log Noise

The `Container` class from `@cloudflare/containers` uses Durable Object alarms to manage container shutdown. This creates unnecessary log noise in the dashboard. Filtering is available via dashboard queries, and Cloudflare has stated automatic noise reduction is planned. Source: [Beta Info & Roadmap](https://developers.cloudflare.com/containers/beta-info/)

---

## 2. CLI Commands: No `wrangler containers logs`

### Available Container Commands (Confidence: HIGH)

The following `wrangler containers` subcommands exist:

| Command | Purpose |
|---------|---------|
| `wrangler containers list` | List containers in your account |
| `wrangler containers info <ID>` | Get container details + instance list |
| `wrangler containers delete <ID>` | Delete a container |
| `wrangler containers build` | Build container image from Dockerfile |
| `wrangler containers push` | Push image to Cloudflare registry |
| `wrangler containers images list` | List images in registry |
| `wrangler containers images delete` | Delete image from registry |
| `wrangler containers registries list` | List configured registries |
| `wrangler containers registries configure` | Configure external registry |
| `wrangler containers registries delete` | Remove registry configuration |

**There is NO `wrangler containers logs` command.** Source: [Wrangler Commands - Containers](https://developers.cloudflare.com/workers/wrangler/commands/containers/)

### Local Development Gap

- GitHub Issue [#10305](https://github.com/cloudflare/workers-sdk/issues/10305): "Local development with containers should support streaming of container logs"
- Internally tracked as DEVX-2154
- Status: **Backlog** (not actively being worked on)
- During local dev with `wrangler dev`, Worker logs are visible but container-internal logs are not exposed
- Attempted workaround (`docker ps` + `docker logs <CONTAINER_ID>`) does not work because wrangler-spawned containers don't consistently appear in `docker ps`
- 5 thumbs-up reactions, indicating community demand

---

## 3. `wrangler tail` and Durable Objects with Containers

### How `wrangler tail` works with DOs (Confidence: HIGH)

- `wrangler tail` displays a live feed of console and exception logs for both Worker and Durable Object requests
- `console.log()` statements in DO code DO appear in `wrangler tail`
- Maximum 10 concurrent clients can view a Worker's logs (dashboard + CLI combined)

### Critical Limitation: Hibernating WebSockets (Confidence: HIGH)

When using the Hibernation API (`state.acceptWebSocket(socket)`):
- `console.log()` in `webSocketMessage()`, `webSocketClose()`, and `webSocketError()` callbacks are **NOT visible** in `wrangler tail`
- This was a known bug (GitHub issue [#3936](https://github.com/cloudflare/workers-sdk/issues/3936)) that was eventually fixed ("fixed for some time" as of Feb 2024)
- However, there's a separate behavior: logs from WebSocket handlers are **buffered** until the connection closes, then flushed all at once
- **This directly affects the creative-agent project**: the DO uses Hibernation API, and background generation logs are invisible until the handler returns (which is why the project uses `tailLogs[]` buffer + alarm-based flushing)

### Container stdout/stderr in `wrangler tail` (Confidence: MEDIUM-LOW)

- `wrangler tail` captures **Worker/DO-side `console.log()`** only
- It does NOT capture raw stdout/stderr from processes running inside the container
- Container-internal output must be accessed programmatically via Sandbox SDK (`getProcessLogs`/`streamProcessLogs`)
- There is no documented mechanism to pipe container stdout/stderr into `wrangler tail`

---

## 4. Recommended Observability for Long-Running Container Processes

### Tier 1: Sandbox SDK Process APIs (Primary Mechanism)

The `@cloudflare/sandbox` SDK provides the richest process-level observability. These methods were added in the [August 5, 2025 major update](https://developers.cloudflare.com/changelog/2025-08-05-sandbox-sdk-major-update/):

#### `getProcessLogs(processId: string): Promise<string>`
- Retrieves ALL accumulated stdout/stderr from a process
- Returns a single string with complete historical output
- Replays entire buffer on each call (important: includes ALL prior output, not just new output)

#### `streamProcessLogs(processId: string): Promise<ReadableStream>`
- Real-time log streaming via Server-Sent Events (SSE)
- Returns a `ReadableStream` emitting `LogEvent` objects with `timestamp` and `data`
- Use with `parseSSEStream()` helper from `@cloudflare/sandbox`
- **Caveat from this project's experience**: Also replays historical stdout (server-side replays entire accumulated buffer). Must use sentinel markers to distinguish replay from new output

#### `listProcesses(): Promise<ProcessInfo[]>`
- Returns array of `ProcessInfo` objects with `id`, `command`, `pid`
- Useful for detecting zombie processes

#### `startProcess(command, options): Promise<Process>`
- Returns a `Process` object with built-in monitoring methods:
  - `process.getLogs()` - Get accumulated logs
  - `process.waitForLog(pattern, timeout)` - Wait for specific log pattern
  - `process.waitForPort(port, options)` - Wait for port to be listening
  - `process.waitForExit(timeout)` - Wait for process termination
  - `process.getStatus()` - Get current status
  - `process.kill()` - Terminate process

#### `execStream(command, options): Promise<ReadableStream>`
- Streaming command execution via SSE
- Events: `start`, `stdout`, `stderr`, `complete`, `error`
- Exit code included in `complete` event

### Tier 2: Worker/DO-Side Logging

- `console.log()` in DO code captured by Workers Logs (dashboard + `wrangler tail`)
- Use structured JSON logging for best queryability in the dashboard
- For Hibernation API DOs: buffer logs and flush via alarm handler (as this project does with `tailLogs[]`)

### Tier 3: Agents SDK Observability (v0.7.0+)

For projects using `@cloudflare/agents`, v0.7.0 (released March 2, 2026) provides structured observability:

- 7-8 named `diagnostics_channel` channels: `agents:state`, `agents:rpc`, `agents:message`, `agents:schedule`, `agents:lifecycle`, `agents:workflow`, `agents:mcp`, `agents:email`
- Zero overhead when nobody is listening
- Events auto-forwarded to Tail Workers in production
- Type-safe subscription via `subscribe("channel", callback)`
- Custom `Observability` interface override supported

### Tier 4: External Integrations

- **Logpush** (Enterprise only): Export container logs to external destinations
- **Tail Workers**: Receive diagnostics channel events; can forward to external services (Grafana Loki, Datadog, etc.)
- **Workers Logpush** (Paid + Enterprise): Send trace events to object storage or analytics platforms

---

## 5. Logpush, Tail Workers, and Container Integration

### Logpush (Confidence: HIGH for feature existence, MEDIUM for container-specific behavior)

- Enterprise users can export "container logs" via Logpush to preferred destinations
- The FAQ states this explicitly but does not clarify whether "container logs" means Worker-side `console.log()` or container-internal stdout/stderr
- Workers Logpush (available on Paid plans) includes "metadata about requests and responses, unstructured console.log() messages and any uncaught exceptions"
- Source: [Containers FAQ](https://developers.cloudflare.com/containers/faq/), [Workers Logpush](https://developers.cloudflare.com/workers/observability/logs/logpush/)

### Tail Workers (Confidence: HIGH)

- Available on Workers Paid and Enterprise tiers
- Receive telemetry data from your Worker (including DO logs)
- Can apply custom filtering, sampling, and transformation
- Can forward to any HTTP endpoint (Grafana, Datadog, Splunk, etc.)
- Agents SDK v0.7.0 diagnostics_channel events are automatically forwarded to Tail Workers
- Source: [Tail Workers docs](https://developers.cloudflare.com/workers/observability/logs/tail-workers/)

### Workers Observability (Confidence: HIGH)

- Workers Logs persists logs queryable in dashboard
- Includes invocation logs, custom logs (`console.log`), errors, uncaught exceptions
- All new Workers have observability enabled by default
- Supports structured JSON logging with automatic field extraction
- Source: [Workers Observability](https://developers.cloudflare.com/workers/observability/)

---

## 6. How People Debug Container Issues

### Dashboard (Production)

1. **Cloudflare Dashboard > Containers**: View instance status, CPU/memory metrics, 7-day log retention
2. **Cloudflare Dashboard > Workers & Pages > [Worker] > Observability**: View Worker/DO logs, filter by request, tail live
3. **Containers Dashboard > Logs tab**: Container-level error logs that may not appear in `wrangler tail` (from this project's experience)

### CLI (Production)

1. `wrangler tail` for live Worker/DO `console.log()` output (with hibernation caveats)
2. `wrangler containers info <ID>` to check container status and instance list
3. `wrangler containers list` to verify deployments

### Programmatic (In-Code)

1. Sandbox SDK's `getProcessLogs(processId)` to retrieve accumulated process output
2. Sandbox SDK's `streamProcessLogs(processId)` for real-time SSE streaming
3. Sandbox SDK's `listProcesses()` to detect zombie processes
4. `container.monitor()` (low-level DO Container API) resolves when container exits or errors

### Local Development

1. `wrangler dev` with `[R]` to rebuild/restart containers
2. Worker logs visible in terminal
3. **Container-internal logs NOT accessible** (known gap, GitHub issue #10305)
4. Workaround: Check Docker logs manually, though wrangler-spawned containers may not appear in `docker ps`

### Community Patterns

1. Write structured JSON to stdout from container processes, parse via `streamProcessLogs()`
2. Use sentinel markers in stdout to distinguish log replay from new output (as this project does with `turn_start`)
3. Write completion/status files to shared filesystem (R2 mount) as a secondary signal channel
4. Use Tail Workers to forward logs to external observability platforms

---

## 7. SDK Observability APIs Reference

### @cloudflare/containers (Container class)

**Observability is minimal.** The Container class provides:

| Method | Purpose |
|--------|---------|
| `getState()` | Returns current container state |
| `onStart()` | Lifecycle hook: container started |
| `onStop()` | Lifecycle hook: container stopped |
| `onError(error)` | Lifecycle hook: container error |
| `monitor()` | Promise that resolves on exit/error |
| `running` (attribute) | Boolean: is container running? |

**No process-level logging APIs.** No `getProcessLogs`, no `streamProcessLogs`, no `listProcesses`. Source: [Container Package docs](https://developers.cloudflare.com/containers/container-package/), [GitHub README](https://github.com/cloudflare/containers)

### @cloudflare/sandbox (Sandbox SDK)

**Rich process observability.** Added August 5, 2025:

| Method | Purpose |
|--------|---------|
| `getProcessLogs(id)` | Get accumulated stdout/stderr as string |
| `streamProcessLogs(id)` | Real-time SSE log stream |
| `listProcesses()` | List all running processes |
| `getProcess(id)` | Get specific process info |
| `startProcess(cmd, opts)` | Start background process with monitoring |
| `process.waitForLog(pattern, timeout)` | Wait for specific log pattern |
| `process.waitForPort(port, opts)` | Wait for port to be listening |
| `process.waitForExit(timeout)` | Wait for process termination |
| `process.getLogs()` | Get process logs |
| `process.getStatus()` | Get process status |
| `killProcess(id, signal)` | Kill specific process |
| `killAllProcesses()` | Kill all processes |

Source: [Sandbox SDK Commands API](https://developers.cloudflare.com/sandbox/api/commands/), [Background Processes guide](https://developers.cloudflare.com/sandbox/guides/background-processes/)

### Durable Object Container API (Low-Level)

The raw DO Container API (`this.ctx.container`) is minimal:

| Method | Purpose |
|--------|---------|
| `start(options)` | Boot container with env vars, entrypoint |
| `destroy(error)` | Stop container, optionally return error |
| `signal(signal)` | Send IPC signal (SIGTERM, SIGKILL) |
| `getTcpPort(port)` | Get TCP port for communication |
| `monitor()` | Promise resolving on exit/error |
| `running` | Boolean attribute |

**No process-level logging.** Source: [DO Container API](https://developers.cloudflare.com/durable-objects/api/container/)

### @cloudflare/agents (Agents SDK v0.7.0)

**Structured event observability via diagnostics_channel:**

| Channel | Events |
|---------|--------|
| `agents:state` | `state:update` |
| `agents:rpc` | `rpc`, `rpc:error` |
| `agents:message` | `message:request/response/clear/cancel/error`, `tool:result/approval` |
| `agents:schedule` | `schedule:create/execute/cancel/retry/error`, queue events |
| `agents:lifecycle` | `connect`, `disconnect`, `destroy` |
| `agents:workflow` | `workflow:start/event/approved/rejected/terminated/paused/resumed/restarted` |
| `agents:mcp` | `mcp:client:preconnect/connect/authorize/discover` |
| `agents:email` | `email:receive`, `email:reply` |

Source: [Agents Observability API](https://developers.cloudflare.com/agents/api-reference/observability/), [v0.7.0 Changelog](https://developers.cloudflare.com/changelog/post/2026-03-02-agents-sdk-v070/)

---

## 8. `streamProcessLogs()` and `getProcessLogs()` Analysis

### Are These the Official Observability Mechanisms?

**Yes, for process-level observability within containers.** (Confidence: HIGH)

These are Sandbox SDK methods, not part of the lower-level `@cloudflare/containers` or DO Container API. They are the **only programmatic way** to access stdout/stderr from processes running inside a container.

### How They Work (From Documentation + This Project's Experience)

**`streamProcessLogs(processId)`:**
- Opens an SSE (Server-Sent Events) connection to the container's process handler
- Server-side replays the entire accumulated stdout buffer, then streams new output
- Uses HTTP SSE internally; subject to transport timeouts
- **Known issue**: WebSocket transport has a hardcoded 120s timeout (`requestTimeoutMs ?? 12e4`) that kills the stream. HTTP transport does not have this limit, but TCP drops can cause silent hangs
- Parse with `parseSSEStream()` which yields events with `data` field

**`getProcessLogs(processId)`:**
- Returns a single string with all accumulated stdout/stderr
- Useful for one-shot retrieval (e.g., checking if a completion marker was printed)
- No streaming; returns immediately with current buffer contents

### Important Gotchas (From This Project's Production Experience)

1. **Replay behavior**: Both methods replay ALL historical stdout, not just new output. Must use sentinel markers (e.g., `turn_start:{turnId}`) to skip replay on reconnect
2. **Silent hangs**: `waitForLog()` (which uses `streamProcessLogs` internally) can hang forever if TCP disconnects without clean close. No heartbeat/keepalive on HTTP transport
3. **SSE frame splitting**: `parseSSEStream()` silently drops long messages that span multiple SSE `data:` frames. JSON payloads that exceed one frame get split, both fragments fail `JSON.parse()`, both silently dropped
4. **Transport timeout**: WebSocket transport kills streams after 120s (hardcoded). HTTP transport is the only viable option for long-running log watching

---

## Gaps and Uncertainties

### What I Could NOT Verify

1. **Whether dashboard "container logs" includes container stdout/stderr**: The FAQ says "toggle observability...to get logs in the Dashboard" but never specifies whether this captures container-internal process output or only Worker/DO-side `console.log()`. The wording suggests the latter. **Confidence: LOW** that container stdout/stderr flows to the dashboard automatically.

2. **Logpush scope for containers**: The FAQ says enterprise users can "export container logs via Logpush" but does not define what "container logs" includes. It likely means Worker/DO invocation logs, not raw container stdout. **Confidence: LOW**.

3. **Whether `wrangler tail` was fixed for Hibernation API**: GitHub issue #3936 was closed with "fixed for some time" in Feb 2024, but the Workers docs still note that "console.log statements within WebSocket event handlers are hidden until the WebSocket client closes." These may be different issues (hibernation bug vs. buffering behavior). **Confidence: MEDIUM**.

4. **Container metrics granularity**: The blog post mentions "CPU and memory usage" tracking but no documentation describes what specific metrics are available, at what resolution, or whether historical metrics are retained. **Confidence: LOW** on specifics.

5. **Sandbox SDK vs. Containers SDK relationship at the API level**: Both are Cloudflare products. Sandbox SDK is "built on Containers." But the process management APIs (getProcessLogs, streamProcessLogs, etc.) exist ONLY in the Sandbox SDK, not in `@cloudflare/containers`. If you use `@cloudflare/containers` directly (without Sandbox SDK), you have no programmatic process logging. **Confidence: HIGH**.

### Counter-Arguments and Disagreements

**Claim**: "Observability is built-in" (Cloudflare blog post)
- **Steel-man counter**: A practitioner using Containers for long-running workloads would argue that "built-in" overstates the current state. There is no `wrangler containers logs`, no container stdout in `wrangler tail`, no local dev container log streaming, and the dashboard log viewer likely only shows Worker-side logs. The Sandbox SDK provides process-level observability, but only if you use the Sandbox SDK (a separate package with its own abstractions).
- **Who would disagree**: A DevOps engineer accustomed to `kubectl logs`, `docker logs`, or ECS CloudWatch integration would find the current state lacking. Standard container observability means "I can see what my process printed to stdout." Cloudflare Containers makes this possible only through programmatic SDK calls, not through standard tooling.

**Claim**: Sandbox SDK's `streamProcessLogs()` is a reliable observability mechanism
- **Steel-man counter**: This project's experience shows that `streamProcessLogs` has multiple failure modes: silent TCP hangs, 120s WebSocket timeout, SSE frame splitting. It is usable but requires defensive coding (timeouts, re-attach logic, sentinel markers, secondary completion signals).
- **What would change this**: If Cloudflare added heartbeats/keepalives to the SSE stream, fixed the WebSocket transport timeout, and handled frame splitting gracefully, these APIs would be production-grade.

### What Would Change These Findings

- If Cloudflare releases a `wrangler containers logs` command (tracked in their backlog as DEVX-2154), the local dev story improves significantly
- If Workers Logs explicitly captures container stdout/stderr (not just Worker console.log), the dashboard becomes a real container logging solution
- If `streamProcessLogs` gets heartbeat support, the silent hang problem is resolved
- If `@cloudflare/containers` gains process-level APIs (matching Sandbox SDK), users won't need the Sandbox SDK abstraction for observability

---

## Relevance to This Project

The creative-agent project uses Sandbox SDK to run containers with long-running AI agent processes. Its observability approach includes:

1. `streamProcessLogs()` with `parseSSEStream()` for real-time agent output (primary)
2. `getProcessLogs()` for log snapshot in alarm handler (secondary)
3. `waitForLog()` for turn completion detection
4. `this.log()` buffer + alarm-based flushing for DO-side logs visible in `wrangler tail`
5. R2 completion markers as tertiary signal when streaming fails
6. `listProcesses()` for zombie process detection in alarm handler

This multi-layered approach exists precisely because no single observability mechanism is reliable enough for long-running (5-15 minute) container processes. The Sandbox SDK provides the building blocks, but production use requires defensive coding around each API's failure modes.

---

## Sources

- [Containers public beta blog post](https://blog.cloudflare.com/containers-are-available-in-public-beta-for-simple-global-and-programmable/) - June 2025
- [Containers FAQ](https://developers.cloudflare.com/containers/faq/) - Current
- [Containers Beta Info & Roadmap](https://developers.cloudflare.com/containers/beta-info/) - Current
- [Container Package docs](https://developers.cloudflare.com/containers/container-package/) - Current
- [Container Lifecycle/Architecture](https://developers.cloudflare.com/containers/platform-details/architecture/) - Current
- [Containers GitHub repo](https://github.com/cloudflare/containers) - Current
- [DO Container API](https://developers.cloudflare.com/durable-objects/api/container/) - Current
- [Sandbox SDK API - Commands](https://developers.cloudflare.com/sandbox/api/commands/) - Current
- [Sandbox SDK - Background Processes guide](https://developers.cloudflare.com/sandbox/guides/background-processes/) - Current
- [Sandbox SDK - Streaming Output guide](https://developers.cloudflare.com/sandbox/guides/streaming-output/) - Current
- [Sandbox SDK major update changelog](https://developers.cloudflare.com/changelog/2025-08-05-sandbox-sdk-major-update/) - August 2025
- [Workers Logs docs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) - Current
- [Workers Real-time Logs](https://developers.cloudflare.com/workers/observability/logs/real-time-logs/) - Current
- [Workers Logpush](https://developers.cloudflare.com/workers/observability/logs/logpush/) - Current
- [Tail Workers docs](https://developers.cloudflare.com/workers/observability/logs/tail-workers/) - Current
- [Workers Observability](https://developers.cloudflare.com/workers/observability/) - Current
- [Agents SDK Observability API](https://developers.cloudflare.com/agents/api-reference/observability/) - Current
- [Agents SDK v0.7.0 Changelog](https://developers.cloudflare.com/changelog/post/2026-03-02-agents-sdk-v070/) - March 2026
- [Wrangler Containers Commands](https://developers.cloudflare.com/workers/wrangler/commands/containers/) - Current
- [DO Observability/Troubleshooting](https://developers.cloudflare.com/durable-objects/observability/troubleshooting/) - Current
- [GitHub: wrangler tail DO hibernation issue #3936](https://github.com/cloudflare/workers-sdk/issues/3936) - Closed
- [GitHub: Container log streaming issue #10305](https://github.com/cloudflare/workers-sdk/issues/10305) - Open, Backlog
- [Community: Container logs through wrangler](https://community.cloudflare.com/t/when-developing-containers-locally-can-we-get-container-logs-through-wrangler/900882) - Current
- [Wrangler Configuration docs](https://developers.cloudflare.com/workers/wrangler/configuration/) - Current
