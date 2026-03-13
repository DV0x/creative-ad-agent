# Session 13 — DO Crash Investigation & Status Fix — 2026-03-03

> Status: **Root cause identified, fix designed but not yet implemented**
> Branch: `new-ui`
> Deployed version: `c0a23580`

---

## What We Fixed This Session

### Gap 1: Stuck campaign status after DO eviction

**Problem:** When a DO gets evicted mid-generation (deploy, crash, memory), neither `catch` nor `finally` in `runGeneration()` executes. D1 stays at `status = 'generating'` forever. On reconnect, `handleSubscribe()` checks D1 and sees `generating` — thinks it's still running — campaign stuck forever.

**Fix:** In `handleSubscribe()`, if the DO was reset (event buffer empty, session restored from storage) AND D1 says `generating`, the generation is dead. Mark campaign as `incomplete` instead of pretending it's still running.

**Verified working:** Test generation crashed mid-run → campaign correctly marked `incomplete` in D1 (previously would have been stuck at `generating`).

### Gap 2: Missing safety net in `handleGenerate()`

**Problem:** `handleFollowUp()` wraps `runGeneration()` in try/catch/finally (catches errors, resets `isGenerating`, clears persisted session). `handleGenerate()` had a naked `await this.runGeneration()` with no wrapper — if anything leaked out, nobody cleaned up.

**Fix:** Added matching try/catch/finally around `handleGenerate()`'s `runGeneration()` call.

### Files Modified

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | (1) `handleSubscribe()` — mark campaign `incomplete` when DO was reset during generation. (2) `handleGenerate()` — wrap `runGeneration()` in try/catch/finally. |

---

## Test Generation — What Happened

Started a generation for "create 2 ads for https://www.ravilagrandhotel.in/".

### Timeline

| Time | Event |
|------|-------|
| 8:44:36 | User sends generate message. `webSocketMessage()` handler starts. |
| 8:44:58 | Sandbox 1 created → pre-flight API test → **403 blocked** → destroyed (~20s) |
| 8:45:18 | Sandbox 2 created → pre-flight API test → **403 blocked** → destroyed (~20s) |
| 8:45:38 | Sandbox 3 created → pre-flight API test → **passed** |
| 8:47:56 | First SDK message (`system/init`). Agent-runner booted (~2 min startup). |
| 8:48–8:50 | Generation progressing: research complete, hooks complete, entering art direction |
| **8:50:51** | **WS closed code=1001 ("Going Away")** — ~6 min into handler |
| 8:50:52 | Client auto-reconnects, fetches campaigns via REST (page-load pattern) |
| 8:50:53 | New WS closes code=1005 (subscribe queued, can't be processed) |
| 8:50:55 | SDK messages still flowing (generation alive in DO background) |
| 8:51:40 | `Alarm - Exception Thrown` (sandbox SDK internal health check) |
| 8:52:35 | Last SDK message seen |
| ~8:53 | Generation stops. Campaign marked `incomplete` (Gap 1 fix working). |

### What Got Saved Before the Crash

| Data | Status |
|------|--------|
| Research | ✅ Saved (6,307 chars) |
| Hooks | ✅ Saved (4,462 chars) |
| Prompts | ❌ Empty (crashed before writing) |
| Images | ❌ None |
| User message | ✅ Saved |
| Assistant message | ❌ Not saved (only saved on completion) |
| Campaign status | ✅ `incomplete` (Gap 1 fix worked!) |
| SDK session ID | ✅ Saved (enables future resume) |

---

## Root Cause: Handler Blocking

**The entire `runGeneration()` runs inside a single `webSocketMessage()` handler for 7+ minutes.**

### How Durable Object message handling works

With the Hibernation API, each `webSocketMessage()` call is a separate handler invocation. While a handler is running, the DO **cannot process any other WebSocket messages**. They queue up behind the running handler.

### What this blocks

1. **Client pings can't be answered.** The client sends `{ type: 'ping' }` every 25 seconds. The DO should respond with `{ type: 'pong' }`. But the ping message is queued — the handler is busy in the drain loop. The DO never sends a pong.

2. **Subscribe messages can't be processed.** When the client reconnects after a WS drop, it sends `{ type: 'subscribe' }`. This is also queued behind the still-running handler. The reconnect fails.

3. **Cloudflare closes the WebSocket.** After ~6 minutes of the server-side not processing any new incoming frames, Cloudflare's proxy layer closes the connection with code 1001 ("Going Away"). Even though the DO IS sending data to the client (events, debug messages), the server hasn't *processed* an incoming message in 6 minutes.

### Analogy

The DO has one door. `runGeneration()` walked in and stood in the doorway for 7 minutes. Nobody else (pings, subscribes, new connections) can get through until it moves.

---

## Proposed Fix: Fire-and-Forget Generation

### The Change

Don't `await` the generation inside the message handler. Fire it off and return immediately so the handler is free to process other messages.

**Current code (`handleGenerate` line ~243):**
```typescript
// Blocks the handler for the entire generation (~7 min)
await this.runGeneration(aiPrompt, sessionId);
```

**Proposed:**
```typescript
// Fire and forget — handler returns immediately, DO can process pings/subscribes
this.runGeneration(aiPrompt, sessionId).catch((err) => {
  console.error('[gen] Unhandled runGeneration error:', err);
});
```

Same change needed in `handleFollowUp()` (line ~310).

### Why This Is Safe

- `runGeneration()` already has comprehensive try/catch/finally — errors are handled internally, D1 is updated, `isGenerating` is reset, persisted session is cleared.
- The `catch()` on the fire-and-forget is just a safety net for truly unexpected errors that escape `runGeneration()`'s own handling.
- The outer try/catch/finally we added in Gap 2 (`handleGenerate`) would need to be adjusted since we're no longer awaiting. But the inner `runGeneration()` error handling is sufficient.

### What This Enables

After the handler returns:
- DO can immediately process ping messages → responds with pong → WS stays alive
- DO can process subscribe messages → reconnecting clients get event replay
- DO can process cancel messages → abort works without waiting for drain loop
- Cloudflare's proxy sees active message processing → doesn't close the connection

### Risk: DO Hibernation

With the Hibernation API, once a handler returns, the DO *can* hibernate (class instance destroyed, WebSocket kept alive by runtime). If the DO hibernates while `runGeneration()` is running as a background task, the generation dies.

**Mitigating factors:**
- The DO has connected WebSockets → runtime keeps it alive
- `sandbox.exec()` is an active I/O operation → shouldn't hibernate during active I/O
- The drain loop is continuously doing work (parsing, D1 writes, WS sends)

**If hibernation IS a problem**, alternative approaches:
1. Periodically send a message to self (triggers `webSocketMessage()`, resets hibernation timer)
2. Use `this.state.storage.setAlarm()` as a heartbeat to prevent hibernation
3. Accept the risk — if it hibernates, Gap 1 fix catches it on reconnect

### Implementation Notes

1. Change `handleGenerate()`:
   - Remove `await` from `this.runGeneration()`
   - Add `.catch()` for safety
   - Remove the outer try/catch/finally (Gap 2) since it would run immediately before generation finishes — the inner `runGeneration()` try/catch/finally handles cleanup

2. Change `handleFollowUp()`:
   - Same pattern: remove `await`, add `.catch()`
   - The existing outer try/catch/finally around setup code should stay (for campaign lookup, D1 operations before generation)
   - But the `runGeneration()` call should be fire-and-forget

3. Test that:
   - Pings are answered during generation (WS stays alive)
   - Subscribe works on reconnect (events replayed)
   - Cancel still works (abort signal checked in drain loop)
   - Generation completes successfully end-to-end
   - Gap 1 fix still works (DO eviction → incomplete status)

---

## D1 State After This Session

```sql
-- 2 campaigns, both incomplete
campaign_mmar1c3kbvnd5x  status=incomplete  (this session's test — crashed mid-generation)
campaign_mmapxe4fklbjn4   status=incomplete  (session 12 leftover)
```

---

## Key Learnings

1. **`webSocketMessage()` handlers block all other message processing.** With the Hibernation API, each handler runs to completion before the next message is processed. Long-running handlers prevent pings, subscribes, and all other messages from being handled.

2. **Cloudflare closes WebSockets after ~6 min of server-side inactivity on incoming frames.** Even if the DO is actively *sending* data, if it hasn't *processed* an incoming message in ~6 minutes, the proxy closes the connection with code 1001.

3. **Pre-flight IP retry adds 20s per blocked IP.** All 3 sandbox IPs were blocked this test, adding ~60s of startup delay. Combined with ~2 min agent-runner boot, the user waits ~3 min before seeing any output.

4. **Gap 1 fix verified working.** The crashed generation was correctly marked `incomplete` in D1, not stuck at `generating`. This is a real improvement from previous sessions.

---

## Deploy Command
```bash
cd client && npm run build && docker logout registry.cloudflare.com; docker builder prune -af; cd cloudflare && npx wrangler deploy
```
