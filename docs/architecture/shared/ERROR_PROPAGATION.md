# Error Propagation Patterns

> Part of [Architecture Documentation](../INDEX.md) | How errors flow from origin → user

---

## Overview

Errors in the creative agent system originate at 6 layers and propagate through 3 paths to reach the user. This doc maps every error type, how it's caught, and what the user sees.

```
                     ERROR ORIGINS
    ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
    │ Sandbox  │ Anthropic│   D1     │   R2     │   Auth   │ WebSocket│
    │   RPC    │   API    │ Database │ Storage  │   JWT    │  Network │
    └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘
         │          │          │          │          │          │
         └──────────┴──────────┴──────────┴──────────┴──────────┘
                                    │
                          ┌─────────┴─────────┐
                          │    DO HANDLERS     │
                          │ (try/catch/finally)│
                          └─────────┬──────────┘
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                 │
            ┌──────▼──────┐  ┌─────▼──────┐  ┌──────▼──────┐
            │  WS Event   │  │  REST API  │  │   Silent    │
            │  (real-time)│  │  (HTTP)    │  │   (logged)  │
            └──────┬──────┘  └─────┬──────┘  └──────┬──────┘
                   │               │                 │
            ┌──────▼──────┐  ┌─────▼──────┐  ┌──────▼──────┐
            │ Chat error  │  │ API error  │  │ Console.log │
            │ block in UI │  │ (no toast) │  │ (invisible) │
            └─────────────┘  └────────────┘  └─────────────┘
```

---

## Error Sources & Handling

### 1. Sandbox RPC Errors

Every sandbox call is wrapped in `timedRPC()` with a 60s timeout.

| Error | Cause | Handling | User Sees |
|---|---|---|---|
| RPC timeout (60s) | Container unstable, network drop | Traced, re-thrown to caller | "Live updates paused..." (non-fatal) or "Setup failed" (fatal) |
| Two connections collide | Alarm reconnects during setup | `sandboxSetupInProgress` flag prevents | Never (guard prevents) |
| Mount failure | R2 credentials invalid, stale mount | Retry unmount+mount sequence | "Setup failed" if all retries fail |
| Process not found | Container evicted, agent killed | Alarm detects via `listProcesses()` | "Generation agent crashed" |

**Key pattern**: Stream errors are **non-fatal** if the agent is still running (alarm handles completion). Setup errors are **fatal** (no alarm recovery possible).

```
Stream error (agent alive)     →  status event "paused..." → alarm completes
Setup error (no agent started) →  error event "Setup failed" → D1 status='error'
```

---

### 2. Anthropic API Errors

| Error | Detection Point | Handling | User Sees | Recovery |
|---|---|---|---|---|
| **403 IP block** | Pre-flight check in `setupSandbox()` | Destroy sandbox, retry new ID (max 3) | "Setup failed" if all 3 blocked | Retry (different container IP) |
| **429 Rate limit** | Agent SDK `query()` in sandbox | SDK logs to stdout → DO streams | Error in thinking block (or silent if SSE drops) | Wait + resume |
| **500 Server error** | Agent SDK in sandbox | Agent process may crash | "Agent crashed" via alarm detection | Resume |

**IP blocking flow:**
```
Pre-flight curl → 403?
  ├── YES → sandbox.destroy() → retry with user-{id}-v2-{timestamp}
  │         (up to 3 attempts)
  └── NO  → continue setup
```

---

### 3. D1 Database Errors

| Error | Context | Handling | Impact |
|---|---|---|---|
| Campaign not found | Any campaign lookup | Return 404 (REST) or send error event (WS) | User sees "not found" |
| User ID mismatch | Campaign created as 'anonymous' after DO reset | Auto-fix: UPDATE user_id in D1 | Transparent to user |
| Message insert failure | During finalization | Caught, logged, generation still marked 'complete' | Missing chat message after refresh |
| Query execution failure | Any D1 call | Caught at call site, logged | Depends on context (may be silent) |

**Critical quirk**: D1 errors during `finalizeGeneration()` are caught but generation is still marked complete. The user may see "Complete" but be missing the assistant message or file content.

---

### 4. R2 Storage Errors

| Error | Context | Handling | Impact |
|---|---|---|---|
| FUSE mount failure | `setupSandbox()` | Fatal — emits error event | "Setup failed" |
| Image write failure | nano-banana MCP tool in sandbox | Write verification check (`stat.size !== buffer.length`) | Agent retries or reports failure |
| File not found on serve | `GET /images/*` | Return 404 | Broken image in UI |
| Unmount failure | Cleanup in finally block | Caught, ignored | May block next generation's mount |

**FUSE flush gotcha**: `writeFileSync` is safe. Open file descriptors only flush on `close()`/`fsync()`/`unmountBucket()`. Linux `sync` does NOT trigger s3fs→R2 upload.

---

### 5. Auth/JWT Errors

| Error | Detection | Response | User Sees |
|---|---|---|---|
| No token provided | `authenticateRequest()` / WS upgrade | 401 response / WS upgrade rejected | Sign-in required |
| Invalid JWT format | `verifyToken()` | Return null → 401 | Sign-in required |
| JWKS fetch failure | `verifyToken()` → Clerk endpoint | Return null → 401 | "Not connected" (WS won't open) |
| Signature invalid | Crypto.subtle.verify | Return null → 401 | Sign-in required |
| Token expired | Payload `exp` check | Return null → 401 | Token auto-refreshes via Clerk |

**Dev mode**: No `CLERK_SECRET_KEY` → all requests pass as `user_id='anonymous'`.

---

### 6. WebSocket Network Errors

| Error | Detection | Handling | User Sees |
|---|---|---|---|
| Connection closed | `webSocketClose()` | Logged, no cleanup — generation continues | "Reconnecting..." (client auto-retries 5x) |
| Connection error | `webSocketError()` | Logged | "Disconnected" state |
| Send failure | `emitEvent()` try/catch | Silently ignored per socket | Events buffered for reconnect |
| JSON parse failure | `webSocketMessage()` | Error sent to specific WS | Error message in chat |

**Key design**: WS close does NOT abort generation. Events buffer in DO memory. Client reconnects and sends `subscribe` with `lastEventId` to replay missed events.

---

## Propagation Paths

### Path 1: WebSocket Events (Primary — Real-Time)

```
Error in DO handler
    ↓
emitEvent({ type: 'error', error: 'message' })
    ↓
EventBuffer.append() + broadcast to ALL connected WebSockets
    ↓
Client useWebSocket.handleMessage()
    ↓
case 'error':     → store.failGeneration() → error block in chat
case 'incomplete': → status='incomplete' → "Resume" button shown
case 'status':     → info/warning block in thinking section
```

**Event types used for errors:**
- `type: 'error'` — Terminal. Generation failed, campaign marked error
- `type: 'incomplete'` — Recoverable. Generation interrupted, can resume
- `type: 'status'` — Informational. "Live updates paused..." (non-fatal)

---

### Path 2: REST API (Secondary — On Demand)

```
Error in route handler
    ↓
try/catch → Response.json({ success: false, error: msg }, { status: 500 })
    ↓
Client apiFetch() → if (!response.ok) throw new Error(error.error)
    ↓
Caller .catch() → console.error(error)
```

**No UI toast/alert** for REST API failures. Optimistic updates assume success. Failed saves are logged to console only.

---

### Path 3: Silent (Logged Only)

Some errors are caught and logged but never reach the user:
- `sendWS()` failures on closed sockets → event buffered but specific send silently dropped
- `parseSSEStream()` JSON parse failures → message silently dropped (no error event)
- D1 message insert failures during finalization → logged, generation still marked complete
- Alarm handler RPC failures → traced, continues polling

---

## Campaign Status State Machine (Error Transitions)

```
                    ┌──────────────────────────────┐
                    │         'generating'          │
                    └──────┬───────┬───────┬────────┘
                           │       │       │
              ┌────────────┘       │       └────────────┐
              │                    │                     │
    Normal completion      Cancel signal          Error/crash
              │                    │                     │
              ▼                    ▼                     │
       ┌──────────┐       ┌────────────┐      ┌────────┴────────┐
       │'complete' │       │'cancelled' │      │                 │
       └──────────┘       └────────────┘      ▼                 ▼
                                        ┌──────────┐     ┌──────────────┐
                                        │ 'error'  │     │'incomplete'  │
                                        └──────────┘     └──────┬───────┘
                                                                │
                                                         /recover or
                                                          resume
                                                                │
                                                                ▼
                                                         ┌──────────┐
                                                         │'complete' │
                                                         └──────────┘
```

**What triggers each transition:**

| From | To | Trigger |
|---|---|---|
| generating | complete | `finalizeGeneration()` — normal completion via any detection layer |
| generating | cancelled | `handleCancel()` abort signal → finally block updates D1 |
| generating | error | Fatal setup error, or alarm detects dead agent with no output |
| generating | incomplete | 2h safety net, zombie detection, crash with no turn-result |
| incomplete | complete | `/recover` endpoint (D1 has data) or resume + new generation |
| error | complete | Resume via new generation |

**No backwards transitions**: Once `complete`, `cancelled`, or `error` — status is final (except `incomplete` → `complete` via recovery).

---

## Error Summary Table

| Error | Origin | Fatal? | D1 Status | User Sees | Auto-Recovery? |
|---|---|---|---|---|---|
| IP 403 (all 3 retries) | Pre-flight | Yes | error | "Setup failed" | No — retry manually |
| RPC timeout (stream) | timedRPC | No | generating | "Live updates paused..." | Yes — alarm polls |
| RPC timeout (setup) | timedRPC | Yes | error | "Setup failed" | No |
| Agent crash | Alarm | Maybe | error/incomplete | "Agent crashed" or partial complete | Resume available |
| Rate limit 429 | Agent SDK | Depends | incomplete | Error in thinking block (or silent) | Resume available |
| FUSE mount failure | setupSandbox | Yes | error | "Setup failed" | No |
| D1 query failure | Any handler | Context-dependent | Varies | Varies (404, 500, or silent) | Depends |
| Auth failure | verifyToken | Yes (no WS) | N/A | "Not connected" | Clerk auto-refresh |
| WS disconnect | Network | No | unchanged | "Reconnecting..." | Yes — auto-reconnect 5x |
| Zombie (5min) | Alarm | Yes | incomplete | "No agent running" | Resume available |
| 2h safety net | Alarm | Yes | incomplete | (silent) | Resume available |
| SSE frame split | parseSSEStream | No | generating | Missing image/file events | Yes — reconcileImages fills gaps |

---

## Known Gaps

1. **No error codes** — All errors are free-text strings. No machine-readable error categorization
2. **No UI error toasts** — REST API failures logged to console only, user never sees them
3. **Silent SSE drops** — Large SDK messages split across SSE frames are silently dropped
4. **No centralized error tracking** — No Sentry/Datadog. Only `console.log` + `wrangler tail`
5. **2h safety net is silent** — Campaign goes to 'incomplete' with no WS event. User discovers on next page load
6. **D1 errors during finalization are swallowed** — Generation marked 'complete' even if message persistence fails

---

## See Also

- [Durable Object](../cloudflare/DURABLE_OBJECT.md) — Completion detection layers, alarm handler
- [DO State Machine](../cloudflare/DO_STATE_MACHINE.md) — Full state transition diagram
- [Streaming Pipeline](../cloudflare/STREAMING_PIPELINE.md) — SSE parsing, where message drops happen
- [Known Issues](../ops/KNOWN_ISSUES.md) — Prioritized issue tracker
