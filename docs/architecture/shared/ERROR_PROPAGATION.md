# Error Propagation Patterns

> Part of [Architecture Documentation](../INDEX.md) | How errors flow from origin → user | **Source:** `cloudflare/src/durable-objects/campaign-session.ts`, `cloudflare/src/routes/*`

---

## Overview

Errors originate at 6 layers and reach the user via 3 paths. This doc maps every error type, how it's caught, the user-facing copy, and the recovery path.

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
                        │    DO HANDLERS    │
                        │ try/catch/finally │
                        └─────────┬─────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
          ┌──────▼──────┐  ┌─────▼──────┐  ┌──────▼──────┐
          │  WS Event   │  │  REST API  │  │   Silent    │
          │  (realtime) │  │  (HTTP)    │  │   (logged)  │
          └──────┬──────┘  └─────┬──────┘  └──────┬──────┘
                 │               │                │
          Chat error block  API error JSON   console.log only
          or friendly copy  (no UI toast)    (wrangler tail)
```

---

## Error sources & handling

### 1. Sandbox RPC errors

Every `sandbox.*` call is wrapped in `timedRPC` with 60s timeout.

| Error | Cause | Handling | User sees |
|---|---|---|---|
| RPC timeout (60s) | Container unstable, lost connection | Traced, rethrown; caller decides fatal/non-fatal | "Live updates paused…" (non-fatal) or "Setup failed" (fatal) |
| Two-connection collision | Alarm reconnects during setup | `sandboxSetupInProgress` flag prevents | Never fires |
| Mount failure (FUSE) | R2 creds invalid, stale mount | Fatal — unmount/remount + retry new sandbox ID (3 attempts) | "Setup failed" if all 3 attempts fail |
| Process not found | Container evicted, agent killed | Alarm `listProcesses()` → mark incomplete | "The creative engine wandered off — your work's safe tho, give it another go" |
| "object to be reset" / "Network connection lost" | Sandbox container evicted | Fatal: null sandbox ref, mark incomplete, notify | "Connection went poof but your work didn't — hit send again and we're vibing" |
| Pre-flight IP 403 (all 3 retries) | Cloudflare IP blocked by Anthropic | Fatal: fall through without successful sandbox | "Setup failed: …" |

**Key pattern:** Stream errors where agent is still running are **non-fatal** (alarm finalizes). Setup errors where no agent was ever started are **fatal** (no recovery path).

```
Stream error, agent alive     → status "paused…" → alarm completes
Setup error, no agent started → error "Setup failed" → D1 status='error'
Fatal RPC mid-gen             → error friendly copy → D1 status='incomplete' → resume
```

---

### 2. Anthropic API errors

| Error | Detection | Handling | User sees | Recovery |
|---|---|---|---|---|
| **403 IP block** | `setupSandbox` pre-flight curl | Destroy sandbox, retry with fresh ID (up to 3) | "Setup failed" if all blocked | Manual retry (different container IP) |
| **429 rate limit** | SDK inside sandbox | Agent logs to stdout → parser shows error in chat | Error mid-thinking | Resume via follow-up or new gen |
| **500 / timeout** | SDK inside sandbox | Agent process may crash → alarm detects | "The creative engine wandered off…" | Resume |
| **Over `maxBudgetUsd: 3.0`** | SDK hard stop | Query throws; agent writes status=error | Incomplete state, error event | Review cost in D1 `usage_log`, retry |

---

### 3. D1 database errors

| Error | Context | Handling | Impact |
|---|---|---|---|
| Campaign not found | Any campaign lookup | Return 404 (REST) or send error event (WS) | User sees "not found" |
| User ID mismatch | Campaign created as `anonymous` post-DO-reset | Auto-fix: `UPDATE campaigns SET user_id=?` in `handleGenerate` | Transparent |
| `addMessage` insert failure | During finalization | Caught, logged, generation still marked complete | Missing assistant message after refresh — but `/recover` synthesizes one |
| Credit deduction failure | `recordUsage` throws | Caught in finalizeGeneration, logged via `this.log` | Generation still completes; audit via `usage_log` |
| Pre-flight balance lookup failure | `credits.getBalance` throws | Caught, gen proceeds — we err on allowing | Over-allowance possible; rare |
| Query execution failure | Any D1 call | Caught at call site, logged | Depends on site |

**Critical quirk:** D1 errors during `finalizeGeneration` are caught but generation is still marked complete. User may see "Complete" but be missing the assistant message. `/recover` synthesizes a replacement.

---

### 4. R2 storage errors

| Error | Context | Handling | Impact |
|---|---|---|---|
| FUSE mount failure | `setupSandbox` → `mountBucket` | Retried with new sandbox ID (up to 3) | Fatal after 3 — "Setup failed" |
| Image write failure | nano-banana MCP tool in sandbox | Write verification via `stat.size !== buffer.length` | Agent retries or logs error; image may be missing |
| File not found on serve | `GET /images/*` | Return 404 | Broken image in UI (rare — only if R2 was hit before FUSE flush) |
| Unmount failure | Cleanup in finally block | Caught, ignored | May block next gen's mount — handled by `cleanFuse` full reset on next setup |

**FUSE flush gotcha:** `writeFileSync` is safe in the MCP tool. Open file descriptors only flush on `close()` / `fsync()` / `unmountBucket()`. Linux `sync` does NOT trigger s3fs→R2 upload — this is why we `unmountBucket` before next setup rather than relying on `sync`.

---

### 5. Auth / JWT errors

| Error | Detection | Response | User sees |
|---|---|---|---|
| No token | `authenticateRequest` / WS upgrade query | 401 / upgrade rejected | Redirect to sign-in |
| Invalid JWT format | `verifyToken()` | null → 401 | Sign-in required |
| JWKS fetch failure | `verifyToken()` → Clerk endpoint | null → 401 | "Not connected" (WS won't open) |
| Signature invalid | `crypto.subtle.verify` | null → 401 | Sign-in required |
| Token expired | `exp` check | null → 401 | Token auto-refreshes via Clerk |

**Dev mode:** no `CLERK_SECRET_KEY` → all requests pass as `user_id='anonymous'`.

---

### 6. WebSocket network errors

| Error | Detection | Handling | User sees |
|---|---|---|---|
| Connection closed | `webSocketClose()` | Logged, no cleanup — generation continues | "Reconnecting..." (client auto-retry 5×) |
| Connection error | `webSocketError()` | Logged | "Disconnected" state |
| Send failure | `emitEvent` per-socket try/catch | Silently ignored that socket | Event buffered for reconnect replay |
| JSON parse failure (client→server) | `webSocketMessage()` | Error sent to THIS ws only | Error message in chat |

**Key design:** WS close does NOT abort generation. Events buffer in DO memory. Client reconnects, sends `subscribe` with `lastEventId`, missing events replay.

---

## Propagation paths

### Path 1: WebSocket events (primary — real-time)

```
Error in DO handler
    ↓
emitEvent({ type: 'error', error: 'copy' })   OR   sendWS(status)
    ↓
EventBuffer.append + broadcast to all sockets (or sendWS no-buffer)
    ↓
Client useWebSocket.handleMessage()
    ↓
case 'error':      → store.failGeneration() → error block in chat
case 'incomplete': → status='incomplete' → "Resume" button shown
case 'status':     → ephemeral info/warning in thinking section
```

Event types used for errors:

- `error` — terminal. Generation failed, campaign marked `error` or `incomplete`
- `incomplete` — recoverable. Generation interrupted; /recover or resume
- `status` — informational. "Live updates paused — generation still in progress..."

### Path 2: REST API (secondary — on demand)

```
Error in route handler
    ↓
try/catch → Response.json({ success: false, error: msg }, { status: 500 })
    ↓
Client apiFetch() → if (!response.ok) throw new Error(error.error)
    ↓
Caller .catch() → console.error(error)
```

**No UI toast or alert** for REST failures. Optimistic updates assume success. Failed saves are console-logged only. This is a known gap.

### Path 3: Silent (logged only)

Some errors are caught but never reach the user:

- `sendWS` / `emitEvent` per-socket send failure (closed sockets) → that send dropped, event still buffered
- SSE parse failures in `parseSSEStream` → message silently dropped (reconciliation from `turn-result.json` catches it)
- D1 message-insert failures during finalize → logged, generation marked complete
- Alarm handler internal errors → logged, alarm still reschedules

---

## Friendly error copy — full reference

Designed to feel human, not apologize excessively, and imply "your work is saved" where true. See [WEBSOCKET_PROTOCOL.md → error](./WEBSOCKET_PROTOCOL.md#error--generation-failed) for event shape.

| Trigger | Copy | Where |
|---|---|---|
| Pre-flight credit check | "Insufficient credits. Please top up to continue." | `campaign-session.ts:750, 918` (code `INSUFFICIENT_CREDITS`) |
| 2h safety net | "That took way too long, even for us — your work's saved, let's try a fresh start" | alarm `:147` |
| Zombie (5 min, no agent) | "Hmm something didn't start right — your work's saved, try again and we'll nail it" | alarm `:176` |
| Agent dead, no result | "The creative engine wandered off — your work's safe tho, give it another go" | alarm `:212` |
| Fatal sandbox RPC | "Connection went poof but your work didn't — hit send again and we're vibing" | alarm `:229` |
| Zombie on subscribe | "Reconnected! Looks like things got interrupted — your work's saved tho, just send that again" | `handleSubscribe:1149` |
| Concurrent gen block | "A generation is already in progress. Please wait or cancel first." | `handleGenerate:733`, `handleFollowUp:887` |
| Setup failed (runGeneration) | `Setup failed: ${error.message}` | `runGeneration:1691` |
| Follow-up fatal | `Follow-up failed: ${error.message}` | `runFollowUpFast:1609` |
| Cancel confirmation message | "No worries, scrapped that one — send a new idea whenever you're ready" | `runGeneration:1671`, `runFollowUpFast:1589` |
| Cancel ack | "Cancel requested" | `handleCancel:1100` |
| Campaign not found | "Campaign not found" | `handleFollowUp:905` |
| Session not found / stale | "Session not found or expired" | `handleSubscribe:1118, 1135` |
| Live UI paused (non-fatal stream error) | "Live updates paused — generation still in progress..." | `runGeneration:1687`, `runFollowUpFast:1605` |

**Style rules observed:** no "Error:" prefix, no stack traces, imply durability ("your work's saved"), colloquial where safe (lowercase "tho", "hit send again"), always invite retry.

---

## Campaign status transitions (error paths)

```
                    ┌──────────────────────────────┐
                    │        'generating'          │
                    └──┬───┬───┬───┬───┬───┬───┬──┘
                       │   │   │   │   │   │   │
          ┌────────────┘   │   │   │   │   │   └────────────┐
          │                │   │   │   │   │                │
  Normal completion   Cancel   │   │   │   │          Error/crash
          │                │   │   │   │   │                │
          ▼                ▼   │   │   │   │                │
   ┌──────────┐   ┌───────────┐│   │   │   │   ┌────────────┴────────┐
   │'complete'│   │'cancelled'││   │   │   │   │                     │
   └──────────┘   └───────────┘│   │   │   │   ▼                     ▼
                               │   │   │   │  ┌───────┐       ┌─────────────┐
                    Fatal setup│   │   │   └─→│'error'│       │'incomplete' │
                               │   │   │      └───────┘       └──────┬──────┘
                       Fatal RPC   │   │                             │
                               │   │   │                         /recover
                            Alarm  │   │                   or resume via new gen
                             agent │   │                             │
                             dead  │   │                             ▼
                                   │   │                       ┌──────────┐
                                 2h safety                      │'complete'│
                                   │                            └──────────┘
                                 Zombie
```

### What triggers each transition

| From → To | Trigger | Handler / line |
|---|---|---|
| generating → complete | Normal finalization (Layer 1 / 2) | `finalizeGeneration:421` |
| generating → cancelled | Cancel + finally block | `runGeneration:1682, 1667`, `runFollowUpFast:1585, 1600` |
| generating → error | Fatal setup (no agent started) | `runGeneration:1693` |
| generating → error | Follow-up setup exception | `handleFollowUp:987` |
| generating → error | Fatal fast-path runtime | `runFollowUpFast:1611` |
| generating → incomplete | 2h safety net | alarm `:149` |
| generating → incomplete | Zombie (alarm, 5 min) | alarm `:178` |
| generating → incomplete | Agent dead, no result | alarm `:214` |
| generating → incomplete | Fatal sandbox RPC | alarm `:231` |
| generating → incomplete | Zombie on subscribe | `handleSubscribe:1143` |
| generating → incomplete | Zombie pre-generate | `handleGenerate:725`, `handleFollowUp:879` |
| generating → incomplete | Zombie in restoreSession | `restoreSession:592` |
| incomplete / error → complete | `/recover` with D1 data | `routes/recovery.ts:62` |

**Terminal states:** `complete`, `cancelled`, `error`. `incomplete` can upgrade to `complete` via `/recover`.

---

## Error summary table

| Error | Origin | Fatal? | D1 status | User sees | Auto-recovery? |
|---|---|---|---|---|---|
| IP 403 (all 3 retries) | Pre-flight | Yes | error | "Setup failed" | No — manual retry |
| RPC timeout (stream) | `timedRPC` | No | generating | "Live updates paused…" | Yes — alarm finalizes |
| RPC timeout (setup) | `timedRPC` | Yes | error | "Setup failed" | No |
| Fatal sandbox error | alarm | Yes | incomplete | "Connection went poof…" | Yes — user re-sends |
| Agent crash | alarm | Maybe | error/incomplete | "Creative engine wandered off…" / partial complete | Resume or /recover |
| Rate limit 429 | Agent SDK | Depends | incomplete | Error in thinking block | Resume |
| FUSE mount failure | `setupSandbox` | Yes (after 3 retries) | error | "Setup failed" | No |
| D1 query failure | Any handler | Context-dependent | Varies | Varies | Depends |
| Auth failure | `verifyToken` | Yes (no WS) | N/A | "Not connected" | Clerk auto-refresh |
| WS disconnect | Network | No | unchanged | "Reconnecting..." | Yes — auto-reconnect 5× + subscribe replay |
| Zombie (5 min) | alarm | Yes | incomplete | "Something didn't start right…" | Resume |
| Zombie (subscribe) | `handleSubscribe` | Yes | incomplete | "Reconnected! Looks like things got interrupted…" | User re-sends |
| 2h safety net | alarm | Yes | incomplete | "That took way too long…" | Resume |
| SSE frame split | `parseSSEStream` | No | generating | Missing intermediate events | Yes — `tryFinalize` from `turn-result.json` |
| Insufficient credits | Pre-flight | Yes | (no campaign created) | "Insufficient credits. Please top up…" | User tops up |
| Concurrent gen attempt | handleGenerate/FollowUp | No (blocks new gen) | unchanged | "A generation is already in progress…" | Cancel current |

---

## Known gaps

1. **No error codes (mostly).** Only `INSUFFICIENT_CREDITS` has a code. Everything else is free-text. No machine-readable categorization.
2. **No UI error toasts for REST.** Optimistic updates assume success. Failures log to console only.
3. **Silent SSE drops.** Large SDK messages split across SSE frames are silently dropped in `parseSSEStream`. Mitigated by `turn-result.json` reconciliation.
4. **No centralized error tracking.** No Sentry/Datadog. Only `console.log` + `wrangler tail` + traces.
5. **2h safety net is near-silent.** Emits error event, but users who've left the tab won't see it — they discover on next page load.
6. **D1 errors during finalization are swallowed.** Generation marked complete even if assistant message insert fails. `/recover` adds a synthetic message to fill the gap.
7. **Local dev has no billing, no streaming.** Errors that manifest only in sandbox paths (FUSE, pre-flight) cannot be reproduced locally. See [Known Issues](../ops/KNOWN_ISSUES.md#9-local-dev-doesnt-stream-tokens-or-test-sandbox-path).

---

## See Also

- [Durable Object](../cloudflare/DURABLE_OBJECT.md) — completion detection, friendly error emission sites
- [DO State Machine](../cloudflare/DO_STATE_MACHINE.md) — which state produces which error
- [Streaming Pipeline](../cloudflare/STREAMING_PIPELINE.md) — SSE parsing where message drops happen
- [WebSocket Protocol](./WEBSOCKET_PROTOCOL.md) — error event shape
- [Billing](./BILLING.md) — `INSUFFICIENT_CREDITS` pre-flight
- [Known Issues](../ops/KNOWN_ISSUES.md) — prioritized gap tracker
