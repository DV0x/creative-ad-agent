# Session 14 — Fire-and-Forget + Alarm Heartbeat + Sandbox keepAlive — 2026-03-04

> Status: **Three fixes deployed, pending end-to-end test**
> Branch: `new-ui`
> Deployed version: `9aca815e`

---

## What We Did This Session

### Problem 1: WebSocket dies at ~6 minutes during generation

**Root cause (identified Session 13):** `runGeneration()` was `await`ed inside the `webSocketMessage()` handler, blocking it for 7+ minutes. With the Hibernation API, no other messages (pings, subscribes, cancels) can be processed while a handler is running. After ~6 minutes of the server not processing incoming frames, Cloudflare's proxy kills the WebSocket with code 1001 ("Going Away").

### Fix 1: Fire-and-Forget (from Session 13 plan)

Removed the `await` from `runGeneration()` in both `handleGenerate()` and `handleFollowUp()`. The handler now fires off the generation and returns immediately, freeing the DO to process other messages.

```typescript
// Before (blocks handler for 7 minutes):
await this.runGeneration(aiPrompt, sessionId);

// After (handler returns immediately):
this.runGeneration(aiPrompt, sessionId).catch((err) => {
  console.error('[gen] Unhandled runGeneration error:', err);
});
```

### Test 1: Fire-and-Forget Only — FAILED (DO hibernated)

Deployed version `f9f9859e` with fire-and-forget only.

**What happened:** Agent-runner booted (MCP server startup message visible), but zero SDK output for 5+ minutes. Ping/pong flowing every 25s. D1: 0 chars in all campaign_files.

**Root cause:** Hibernation API destroys the class instance when no handler is running. Background `runGeneration()` promise dies silently.

### Fix 2: Alarm Heartbeat

A 30-second recurring alarm prevents the DO from hibernating during generation.

```typescript
private startKeepAlive(): void {
  this.state.storage.setAlarm(Date.now() + 30_000);
}

async alarm(): Promise<void> {
  if (this.isGenerating) {
    this.state.storage.setAlarm(Date.now() + 30_000);  // Reschedule
  }
}
```

### Test 2: Fire-and-Forget + Alarm — PARTIALLY WORKED

Deployed version `426efcd2`.

**What worked:**
- Alarm heartbeat kept DO alive (alarms firing every 30s in logs)
- SDK output flowing for ~5 minutes (research phase completed, 8,417 chars saved)
- Generation survived past the old 6-minute WS death point
- Gap 1 fix verified again (deploy reset DO → campaign correctly marked `incomplete`)

**What failed:** At 11:47:33 (~8 min in), sandbox container died with `"Shutdown container connection"` error. Campaign stuck at `generating` — D1 never updated.

### Problem 2: Sandbox container killed by `sleepAfter` timer

**Root cause:** The sandbox SDK has its own "activity timer" (`sleepAfter: '10m'`). This timer is only reset when you make SDK API calls (`sandbox.exec()`, `sandbox.mountBucket()`). Once the main `sandbox.exec()` starts streaming, no more API calls are made — the SDK considers the sandbox "idle" even though the agent-runner is actively working inside.

The timer expired ~10 minutes after the last API call (sandbox creation + setup took ~2 min, then ~8 min of generation work = ~10 min total).

**Analogy:** The DO (manager) and the sandbox (worker) are in separate buildings. The alarm heartbeat keeps the manager's building open. But the worker's building has its own shutdown timer that nobody was resetting — after 10 minutes of no new instructions from the manager, the building shuts down, even though the worker is still actively working inside.

### Problem 3: exec promise hangs when container dies → D1 never updated

**Root cause:** The `sandbox.exec()` promise chain only sets `execDone = true` in the `.then()` handler (success path). When the container dies, the promise rejects — `.then()` is skipped, `execDone` stays false. The drain loop (`while(true)`) checks `execDone` to know when to stop, so it loops forever. The `finally` block (which resets `isGenerating`, updates D1, destroys the sandbox) is never reached.

```typescript
// Before: no .catch() — rejection leaves execDone=false, drain loop hangs
const execPromise = sandbox.exec(...).then((result) => {
    execDone = true;  // Only runs on success
    return result;
});

// After: .catch() sets execDone=true so drain loop can exit
}).catch((err) => {
    execDone = true;  // Unblocks drain loop
    throw err;        // Rethrow → outer catch updates D1
});
```

### Fix 3: `keepAlive: true` on sandbox

```typescript
// Before (container auto-shuts down after 10 min of no SDK calls):
sandbox = getSandbox(this.env.SANDBOX, sandboxId, { sleepAfter: '10m' });

// After (container stays alive until we destroy it):
sandbox = getSandbox(this.env.SANDBOX, sandboxId, { keepAlive: true });
```

With `keepAlive: true`, the sandbox SDK sends its own heartbeat pings every 30 seconds to the container, preventing eviction. We then explicitly call `sandbox.destroy()` in the `finally` block.

### Fix 4: `sandbox.destroy()` in finally block

```typescript
} finally {
    this.isGenerating = false;
    this.abortController = null;
    if (this.sandbox) {
        try { await this.sandbox.destroy(); } catch (_) {}
    }
    this.sandbox = null;
    this.stopKeepAlive();
    await this.clearPersistedSession();
}
```

Previously, `finally` just set `this.sandbox = null` without destroying. With `sleepAfter`, the container would eventually clean itself up. With `keepAlive: true`, it would leak containers forever. Now we always explicitly destroy.

---

## Files Modified

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | (1) `keepAlive: true` in `getSandbox()`. (2) `.catch()` on exec promise chain sets `execDone = true`. (3) `sandbox.destroy()` in `finally` block. (4) Alarm heartbeat (from earlier this session). (5) Fire-and-forget pattern (from earlier this session). |
| `docs/ARCHITECTURE_FLOW.md` | Updated with alarm heartbeat, sandbox keepAlive, and exec error handling in key technical decisions. |

---

## Deployment Timeline

| Version | What changed | Result |
|---------|-------------|--------|
| `f9f9859e` | Fire-and-forget only | DO hibernated, generation killed |
| `426efcd2` | + alarm heartbeat | DO alive, but sandbox killed by sleepAfter at ~10 min |
| `9aca815e` | + keepAlive + exec .catch() + destroy in finally | Deployed, pending test |

---

## Three Separate Keep-Alive Mechanisms

This session revealed that three independent systems need their own keep-alive:

| System | What kills it | Keep-alive mechanism |
|--------|--------------|---------------------|
| **WebSocket** (browser ↔ DO) | Cloudflare proxy kills idle connections (~6 min) | Client ping/pong every 25 seconds |
| **Durable Object** (class instance) | Hibernation API destroys idle DOs | Alarm heartbeat every 30 seconds |
| **Sandbox Container** (Linux container) | `sleepAfter` timer (10 min of no SDK calls) | `keepAlive: true` (SDK heartbeat pings) |

Each is independent — fixing one doesn't help the others.

---

## Key Learnings

1. **`sleepAfter` tracks SDK API calls, not container CPU activity.** Even if a process is actively running inside the container, the SDK considers it "idle" if no one is calling `sandbox.exec()`, `sandbox.mountBucket()`, etc.

2. **`keepAlive: true` prevents sandbox eviction.** The SDK sends heartbeat pings every 30 seconds. Must explicitly `destroy()` when done.

3. **`.catch()` on promise chains is critical.** Without it, a rejected exec promise leaves `execDone = false` forever, and the drain loop hangs — preventing all cleanup.

4. **`waitUntil()` is a no-op in Durable Objects.** Only works in regular Workers.

5. **Three independent keep-alive systems.** WebSocket (ping/pong), DO (alarm heartbeat), and sandbox (keepAlive) each need their own mechanism.

6. **Gap 1 fix verified working again.** Deploy reset the DO, reconnecting browser triggered `handleSubscribe()`, which correctly marked the stuck campaign as `incomplete`.

---

## What's Next

- [ ] **End-to-end test** of deployed version `9aca815e` (all three fixes)
- [ ] Verify: generation completes successfully with images
- [ ] Verify: sandbox destroyed after completion (no leaked containers)
- [ ] Verify: reconnect/subscribe works mid-generation
- [ ] Verify: cancel works mid-generation

---

## Deploy Command
```bash
cd client && npm run build && docker logout registry.cloudflare.com; docker builder prune -af; cd cloudflare && npx wrangler deploy
```
