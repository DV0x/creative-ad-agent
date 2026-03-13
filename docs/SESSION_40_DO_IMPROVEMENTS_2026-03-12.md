# Session 40: DO & Sandbox Improvements (2026-03-12)

## Scope

5 improvements to `campaign-session.ts`, all from `docs/SESSION_39_DO_SANDBOX_IMPROVEMENTS_PLAN.md`. Deployed as version `6cef30ae`.

---

## Changes

### 1. Multi-Tab WebSocket Broadcast

**Problem:** Single `this.ws` ref meant only one tab received events. Opening a second tab overwrote the ref — first tab went silent.

**Fix:**
- Removed `private ws: WebSocket | null` entirely
- `emitEvent()` and `sendWS()` now loop over `this.state.getWebSockets()` to broadcast to ALL connected tabs
- Added `sendToWS(ws, event)` for targeted sends (subscribe replay, parse errors, initial ack)
- `webSocketClose()`/`webSocketError()` simplified — no cleanup needed, `getWebSockets()` auto-excludes closed sockets
- `handleSubscribe()` replay + confirmation use `sendToWS(ws)` so only the reconnecting tab gets replayed events

### 2. Agent Crash Detection (`waitForExit`)

**Problem:** If the agent process crashed (OOM, unhandled exception), nothing detected it instantly. Had to wait for R2 polling (30s) or 2h safety net.

**Fix:**
- New `attachCrashHandler(campaignId, sessionId)` method
- Uses `agentProcess.waitForExit()` — fires only on crash/kill, never during normal operation
- On exit: checks logs for `turn_complete` (race window), checks R2 marker, then marks `incomplete` + emits error
- Cancel safety: `isGenerating` is set to `false` before `killProcess()`, so `waitForExit` resolves but returns early
- Called after `attachCompletionHandler()` in both `runGeneration()` and `runFollowUpFast()`

### 3. Log Snapshot Polling in Alarm (`getProcessLogs`)

**Problem:** If `waitForLog` SSE stream timed out and re-attach also failed, only R2 marker polling remained. But R2 marker depends on the agent writing it (FUSE flush timing).

**Fix:**
- After R2 polling in `alarm()`, calls `sandbox.getProcessLogs(agentProcessId)`
- Simple HTTP GET — returns full accumulated stdout as a string
- If `turn_complete` found: reconciles images/files, marks complete, stops alarm
- More reliable than SSE-based `waitForLog` re-attach (no streaming dependency)
- Falls through gracefully on any error

### 4. Zombie Process Cleanup

**Problem:** Completed processes from previous generations accumulate in the container, consuming memory.

**Fix:**
- `sandbox.cleanupCompletedProcesses()` called before killing old agent-runner in `runGeneration()`
- `.catch(() => {})` — non-fatal if the method doesn't exist or fails

### 5. Debug Diagnostics Removal

**Problem:** DO-side API key test block added ~8s overhead per generation. `[debug]` messages sent to client chat cluttered the UI.

**Fix:**
- Deleted the DO-side API key test block (~25 lines) — tested from DO, not sandbox, so was useless for IP blocking detection
- Replaced 8 `sendWS({ ... '[debug]' ... })` calls with `this.log()` — visible in `wrangler tail` only
- Sandbox pre-flight IP check retained (necessary for container IP blocking)

---

## Completion Detection: 3 → 4 Layers

| Layer | Method | Detects | Speed |
|-------|--------|---------|-------|
| 1 | `waitForLog('turn_complete')` | Normal completion | Instant |
| 2 | `waitForExit()` | Agent crash (OOM, exception) | Instant |
| 3a | `pollR2CompletionMarker()` | RPC disconnect | 30s (alarm) |
| 3b | `getProcessLogs()` | SSE timeout, any missed completion | 30s (alarm) |
| 4 | `POST /recover` | Everything else | User-triggered |

All layers guard on `if (!this.isGenerating) return` — only the first one wins.

---

## Files Modified

| File | Lines Changed | What |
|------|--------------|------|
| `cloudflare/src/durable-objects/campaign-session.ts` | ~120 net | All 5 changes |
| `docs/architecture/cloudflare/DURABLE_OBJECT.md` | ~80 | State, completion layers, alarm flow, helpers, gotchas |
| `docs/architecture/cloudflare/STREAMING_PIPELINE.md` | ~20 | emitEvent code, dual-path diagram, send methods |
| `docs/architecture/shared/WEBSOCKET_PROTOCOL.md` | ~15 | Multi-tab note, reconnect flow, R2+log polling |
| `docs/architecture/ops/KNOWN_ISSUES.md` | ~15 | Issue 1 mitigation, issue 9 fixed, resolved list |

---

## Deploy

```
cd client && npm run build && docker logout registry.cloudflare.com; docker builder prune -af; cd ../cloudflare && npx wrangler deploy
```

Version: `6cef30ae-ac4a-4a49-bbbf-60eee980a6ab`

---

## Testing Plan

1. **Multi-tab**: Open two tabs → generate from Tab 1 → verify Tab 2 gets live progress + completion
2. **Debug removal**: Verify no `[debug]` messages in client chat UI during generation
3. **Crash detection**: Check `wrangler tail` for `[crash]` logs (only fires on actual crash — may not appear in normal testing)
4. **Log snapshot**: Check `wrangler tail` for `[alarm] turn_complete found in log snapshot` (may not fire if waitForLog handles it first — that's correct behavior)

---

## Status

- **Deployed**: Yes (`6cef30ae`)
- **Tested**: Pending
