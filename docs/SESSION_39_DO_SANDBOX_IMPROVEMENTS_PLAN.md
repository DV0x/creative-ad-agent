# Session 39: DO & Sandbox Reliability Improvements — Implementation Plan

**Date:** 2026-03-10
**Branch:** `new-ui`
**Prior state:** Session 38 (two bug fixes written, NOT deployed)
**File:** `cloudflare/src/durable-objects/campaign-session.ts`

## Background

Audited CampaignSession DO and Sandbox SDK usage against full Cloudflare capabilities. Found 5 actionable improvements — 2 fix real bugs/blind spots, 3 improve robustness.

## Pre-Condition: Session 38 Changes (NOT YET DEPLOYED)

Session 38 wrote two fixes that are in the code but not deployed:

1. **Image pollution fix** (line ~1262): `rm -f /app/generated-images.jsonl /app/turn-result.json` before every generation
2. **waitForLog re-attach** (line ~256-271): On `waitForLog` failure, re-attach up to 10 retries instead of marking incomplete

Both changes are compatible with everything below. No conflicts. Deploy them together.

---

## Change 1: Multi-Tab Broadcast (`getWebSockets()`)

### Problem

`CampaignSession` tracks exactly ONE WebSocket via `this.ws`. If a user opens two tabs, only the last connection gets events. The first tab goes dark silently — no error, no indication.

### Root Cause

```typescript
// Current: single ws reference
private ws: WebSocket | null = null;

emitEvent(event) {
  if (this.ws) this.ws.send(...);  // only last tab
}
```

### Fix

Replace `this.ws` with `this.state.getWebSockets()` which returns ALL connected WebSockets managed by the Hibernation API.

### Code Changes

**a) Remove `this.ws` instance variable (line 18)**

```typescript
// DELETE this line:
private ws: WebSocket | null = null;
```

**b) Rewrite `emitEvent()` (lines 1581-1591) — broadcast to all**

```typescript
private emitEvent(event: ServerMessage): void {
  const eventId = this.eventBuffer.append(event);
  const payload = JSON.stringify({ ...event, id: eventId });
  for (const ws of this.state.getWebSockets()) {
    try { ws.send(payload); } catch { /* closed — ignore */ }
  }
}
```

**c) Rewrite `sendWS()` (lines 1594-1602) — broadcast to all**

```typescript
private sendWS(event: ServerMessage): void {
  const payload = JSON.stringify(event);
  for (const ws of this.state.getWebSockets()) {
    try { ws.send(payload); } catch { /* closed — ignore */ }
  }
}
```

**d) Add `sendToWS()` — targeted send for subscribe replay**

```typescript
/** Send to a specific WebSocket (for subscribe replay, not broadcast) */
private sendToWS(ws: WebSocket, event: ServerMessage): void {
  try { ws.send(JSON.stringify(event)); } catch { /* closed — ignore */ }
}
```

**e) Update `fetch()` (lines 472-474) — remove `this.ws = server`**

```typescript
// Accept with Hibernation API
this.state.acceptWebSocket(server);
// DELETE: this.ws = server;

// Send initial ack to THIS connection only
this.sendToWS(server, {
  type: 'ack',
  timestamp: new Date().toISOString(),
  message: 'Connected to Creative Machine',
});
```

**f) Update `webSocketMessage()` (line 488) — remove `this.ws = ws`**

```typescript
async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
  // DELETE: this.ws = ws;
  await this.restoreSession();
  // ... rest unchanged
```

But note: error responses to parse failures should go to the specific ws that sent the bad message:

```typescript
} catch {
  this.sendToWS(ws, { type: 'error', timestamp: new Date().toISOString(), error: 'Invalid message format' });
  return;
}
```

**g) Update `webSocketClose()` (lines 530-537) — simplify**

```typescript
async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
  console.log(`WS closed: session=${this.sessionId}, code=${code}, reason=${reason}`);
  // No cleanup needed — getWebSockets() automatically excludes closed connections
}
```

**h) Update `webSocketError()` (lines 539-544) — simplify**

```typescript
async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
  console.error('WS error:', error);
  // No cleanup needed — getWebSockets() automatically excludes errored connections
}
```

**i) Update `handleSubscribe()` (lines 836-859) — use targeted send for replay**

```typescript
// Replace: this.ws = ws;
// (DELETE — no longer tracking single ws)

// Replay missed events to THIS WebSocket only (not all tabs)
const missedEvents = this.eventBuffer.getEventsSince(lastEventId ?? 0);
for (const entry of missedEvents) {
  this.sendToWS(ws, { ...entry.event, id: entry.id });
}

// Send subscription confirmation to THIS WebSocket only
this.sendToWS(ws, {
  type: 'subscribed',
  timestamp: new Date().toISOString(),
  sessionId,
  message: `Replayed ${missedEvents.length} events`,
  success: true,
});

// If generation is active, re-attach streaming (unchanged)
```

### Interaction with Session 38

None. Session 38's waitForLog re-attach calls `emitEvent()` for completion — that now broadcasts to all tabs instead of one. Correct behavior.

### Interaction with Existing Fixes

- **Subscribe replay (Session 11):** Now uses `sendToWS(ws, ...)` instead of `sendWS()` — replay goes only to the reconnecting tab, not all tabs. This is correct because other tabs may have already received those events.
- **Debug status messages:** `sendWS()` calls in `runGeneration()` (e.g., `[debug] API key check`) now broadcast to all tabs. Fine — debug info is harmless.

---

## Change 2: Agent Crash Detection (`waitForExit()`)

### Problem

If the agent-runner process crashes (OOM, unhandled exception), the only detection is the 2-hour safety net timeout in the alarm handler. The user waits 2 hours before seeing "incomplete".

### Why `waitForExit()` works here

The agent-runner is a **long-lived process** that stays alive between turns (polling for `/app/next-prompt.json`). It does NOT exit after `turn_complete`. So `waitForExit()` only fires if:
- Agent crashes (unhandled exception, OOM)
- Agent is killed (cancel via `killProcess`, or `pkill -f agent-runner` during setup)

In normal operation, it never fires. It's purely crash detection.

### Code Changes

**a) Add `attachCrashHandler()` method — after `attachCompletionHandler()` definition (~line 281)**

```typescript
// ─── Agent crash detection ──────────────────────────────────
// If the agent process exits unexpectedly, detect it immediately
// instead of waiting for the 2h safety net.

private attachCrashHandler(campaignId: string, sessionId: string): void {
  if (!this.agentProcess) return;

  this.agentProcess.waitForExit().then(async (exitInfo: any) => {
    if (!this.isGenerating) return; // Already completed via another path

    const exitCode = exitInfo?.exitCode ?? exitInfo ?? 'unknown';
    this.log(`[crash] Agent process exited unexpectedly: exitCode=${exitCode}, campaign=${campaignId}`);

    // Check if turn_complete was printed before crash (race window)
    try {
      if (this.sandbox && this.agentProcessId) {
        const logs = await this.sandbox.getProcessLogs(this.agentProcessId);
        if (logs.stdout && logs.stdout.includes('turn_complete')) {
          this.log('[crash] turn_complete found in logs — letting waitForLog/R2 polling handle completion');
          return; // waitForLog or R2 polling will handle it
        }
      }
    } catch {
      // Can't read logs — fall through to R2 check
    }

    // Check R2 completion marker (agent may have written it before crashing)
    const recovered = await this.pollR2CompletionMarker(campaignId, sessionId);
    if (recovered) return;

    // Agent truly crashed before completing — mark incomplete immediately
    this.log(`[crash] No completion marker found — marking campaign ${campaignId} incomplete`);
    this.emitEvent({
      type: 'error',
      timestamp: new Date().toISOString(),
      error: 'Generation agent crashed unexpectedly. Please try again.',
    });
    try { await db.updateCampaignStatus(this.env.DB, campaignId, 'incomplete'); } catch {}
    this.isGenerating = false;
    await this.persistSession();
  }).catch((err: any) => {
    // waitForExit itself failed (RPC disconnect, etc.) — non-fatal
    // Other detection paths (waitForLog, R2 polling, safety net) are still active
    this.log(`[crash] waitForExit error (non-fatal): ${err?.message || err}`);
  });
}
```

**b) Call it in `runGeneration()` after `attachCompletionHandler()` (line ~1334)**

```typescript
// 6. Attach completion handler (waitForLog) — primary completion path
this.agentProcess = agentProcess;
this.attachCompletionHandler(this.campaignId!, sessionId);

// 6b. Attach crash handler (waitForExit) — detect agent crashes instantly
this.attachCrashHandler(this.campaignId!, sessionId);
```

**c) Call it in `runFollowUpFast()` after `attachCompletionHandler()` (line ~1017)**

```typescript
// 1. Attach completion handler BEFORE writing prompt
this.attachCompletionHandler(campaignId, sessionId);

// 1b. Attach crash handler
this.attachCrashHandler(campaignId, sessionId);
```

### Race Condition Analysis

All completion paths check `if (!this.isGenerating) return;` before acting:

| Detection Path | Guard | Can double-complete? |
|---------------|-------|---------------------|
| `waitForLog` (.then) | `if (!this.isGenerating)` at line 214 | No |
| `waitForLog` (.catch → re-attach) | `if (!this.isGenerating)` at line 258 | No |
| `waitForExit` (new) | `if (!this.isGenerating)` at top | No |
| `pollR2CompletionMarker` | `if (!this.isGenerating)` at line 360 | No |
| `getProcessLogs` in alarm (Change 3) | `if (!this.isGenerating)` | No |

Only one path sets `isGenerating = false` → all others return early. Safe.

### Interaction with Cancel Flow

On cancel: `handleCancel()` sets abort signal → `runGeneration` finally block sets `isGenerating = false` and calls `killProcess()`. The kill causes `waitForExit()` to resolve, but `isGenerating` is already false → returns early. Safe.

---

## Change 3: Log Snapshot Polling in Alarm (`getProcessLogs()`)

### Problem

The `waitForLog` re-attach pattern (Session 38) depends on SSE streaming. Each re-attach opens a new SSE stream, which has the 120s SDK timeout. After 10 retries (~20 min), it gives up entirely and relies on R2 polling.

But `getProcessLogs()` is a simple HTTP GET that returns the full accumulated stdout as a string. No streaming, no timeout. Much more reliable.

### Code Changes

**Add log snapshot check in `alarm()` — after R2 polling (~line 90)**

```typescript
// R2 completion marker polling
const recovered = await this.pollR2CompletionMarker(this.campaignId, this.sessionId!);
if (recovered) return;

// Log snapshot polling — check if turn_complete is in stdout
// More reliable than waitForLog re-attach (no SSE streaming dependency)
if (this.sandbox && this.agentProcessId) {
  try {
    const logs = await this.sandbox.getProcessLogs(this.agentProcessId);
    if (logs.stdout && logs.stdout.includes('turn_complete')) {
      this.log(`[alarm] turn_complete found in log snapshot — reconciling`);
      // Handle completion same as waitForLog resolution
      try {
        const existingImageCount = await db.getImageCount(this.env.DB, this.campaignId!) || 0;
        const imageCounter = { next: existingImageCount + 1 };
        await this.reconcileImages(this.sandbox, this.campaignId!, imageCounter, (event) => this.emitEvent(event));
        await this.reconcileFiles(this.sandbox, this.campaignId!);

        this.emitEvent({
          type: 'complete',
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId!,
          campaignId: this.campaignId!,
          duration: 0,
          imageCount: imageCounter.next - 1,
          summary: 'Generation complete.',
        });

        await db.updateCampaignStatus(this.env.DB, this.campaignId!, 'complete');
        await db.addMessage(this.env.DB, {
          campaignId: this.campaignId!,
          role: 'assistant',
          content: 'Generation complete.',
          blocks: [],
        });

        this.isGenerating = false;
        await this.persistSession();
        this.log(`[alarm] Campaign ${this.campaignId} completed via log snapshot`);
        return; // Don't reschedule alarm
      } catch (err: any) {
        this.log(`[alarm] Log snapshot completion failed: ${err?.message || err}`);
        // Fall through to re-try next alarm cycle
      }
    }
  } catch {
    // getProcessLogs failed (sandbox disconnected, etc.) — non-fatal
  }
}
```

### Why not extract a shared completion function?

The completion logic (reconcile images/files → emit complete → update D1 → mark complete) appears in 3 places:
1. `attachCompletionHandler` .then block (line ~221-254)
2. `pollR2CompletionMarker` (line ~376-443)
3. New: alarm log snapshot (above)

These look similar but differ in subtle ways:
- #1 reads from `turn-result.json` (sandbox local disk)
- #2 reads from R2 completion marker
- #3 reads from `turn-result.json` (same as #1)

Extracting a shared function is a good refactor but risks introducing bugs if the subtle differences aren't handled. **Recommendation: do the refactor in a follow-up session after this is tested.** For now, inline the logic.

---

## Change 4: Zombie Process Cleanup

### Problem

Warm containers accumulate completed processes from previous generations. These consume memory.

### Code Change

**Add one line in `runGeneration()` — after getting sandbox, before killing old agent-runner (~line 1200)**

```typescript
// Clean up completed processes from previous generations
await sandbox.cleanupCompletedProcesses().catch(() => {});

// Kill agent-runner FIRST — it holds /mnt/r2 open
await sandbox.exec('pkill -f agent-runner 2>/dev/null || true');
```

---

## Change 5: Remove Debug Diagnostics

### Problem

Session notes say: "Debug diagnostics in campaign-session.ts intentionally retained for future instance type testing. Adds ~8s overhead. Remove before production."

These are the API key test and debug `sendWS` calls in `runGeneration()` (lines ~1160-1182).

### Code Change

**Delete the debug block in `runGeneration()` (lines 1159-1182)**

```typescript
// DELETE everything between these comments:
// 0. Debug: verify API key reaches DO correctly
// ... through ...
// this.sendWS({ type: 'status', ..., message: `[debug] API key test error: ...` });
```

Also remove debug `sendWS` calls scattered through `runGeneration()`:
- Line 1194: `[debug] Getting sandbox (attempt ...)`
- Line 1211: `[debug] Mounting R2 bucket...`
- Line 1241: `[debug] Net test (attempt ...)`
- Line 1249: `[debug] Sandbox IP blocked ...`
- Line 1253: `[debug] WARNING: All ... IPs blocked`
- Line 1292: `[debug] Hydrated ... files from D1`
- Line 1307: `[debug] Starting agent-runner process...`
- Line 1330: `[debug] Agent process started: ...`

Replace with `this.log()` calls (visible in `wrangler tail` via alarm flush, not sent to client).

---

## Completion Detection — Updated Architecture

After these changes, there are **4 independent detection layers** (up from 3):

```
Agent prints turn_complete + writes completion marker to R2
                    │
    ┌───────────────┼───────────────┬───────────────────┐
    │               │               │                   │
    ▼               ▼               ▼                   ▼

Layer 1:        Layer 2:        Layer 3:           Layer 4:
waitForLog      waitForExit     Alarm polling      /recover
────────────    ───────────     ─────────────      ────────
Primary.        Crash detect.   Every 30s:         Client POST
Watches for     Fires if agent  a) R2 marker       reads R2
turn_complete   process exits.  b) Log snapshot    marker.
in stdout.      Checks logs +      (getProcessLogs)
On fail:        R2 marker
re-attach 10x.  before marking
                incomplete.
    │               │               │                   │
    └───────────────┴───────────────┴───────────────────┘
                              │
                    All check isGenerating
                    Only first one wins
```

| Failure Scenario | What detects it | Time to detect |
|-----------------|----------------|----------------|
| Normal completion | Layer 1 (waitForLog) | Instant |
| SSE stream timeout (120s) | Layer 1 re-attach → Layer 3b (log snapshot) | 30s (next alarm) |
| Agent crash (OOM, exception) | **Layer 2 (waitForExit)** — NEW | Instant |
| RPC disconnect (sandbox lost) | Layer 3a (R2 marker) | 30s (next alarm) |
| Everything fails | 2h safety net in alarm | 2 hours |

**Key improvement:** Agent crashes go from 2h detection to instant.

---

## Files Changed

| File | Changes |
|------|---------|
| `cloudflare/src/durable-objects/campaign-session.ts` | All 5 changes above |

No other files need modification. All changes are in the DO.

---

## Verification with Previous Session Fixes

| Session | Fix | Compatible? | Notes |
|---------|-----|-------------|-------|
| 38 | Image pollution (rm tracking files) | Yes | Untouched — cleanup runs before any of our new code |
| 38 | waitForLog re-attach (10 retries) | Yes | Our Layer 2 (waitForExit) and Layer 3b (log snapshot) are independent. All paths check `isGenerating` |
| 33 | R2 alarm polling | Yes | Our Layer 3b (log snapshot) runs right after R2 polling in the same alarm handler |
| 31 | waitForLog as sole completion path | Updated | No longer sole path — now 4 layers. But waitForLog is still primary |
| 29 | Cancel flow (abort signal only) | Yes | Cancel sets `isGenerating = false` before killing agent. `waitForExit` returns early |
| 27 | Replay fix (turn_start sentinel) | Yes | Streaming unchanged — multi-tab just changes how emitEvent sends |
| 11 | Subscribe replay + staleness check | Yes | Subscribe now uses `sendToWS(ws)` for replay — only subscribing tab gets replay |
| 10 | WS grace period (unsubscribe) | Yes | Client-side change, not affected |

---

## Testing Plan

### Test 1: Multi-tab broadcast
1. Open two browser tabs
2. Start a generation from Tab 1
3. Verify Tab 2 shows live generation progress
4. Verify Tab 2 shows completion + images
5. Verify subscribe replay only goes to the reconnecting tab (refresh Tab 2 mid-generation)

### Test 2: Crash detection
1. Start a generation
2. Via `wrangler tail`, watch for `[gen] Agent process started: id=...`
3. Kill the agent: `sandbox.exec('kill -9 <pid>')` or wait for a natural crash
4. Verify campaign marked incomplete within seconds (not 2h)
5. Verify error event sent to client

### Test 3: Log snapshot polling
1. Start a generation
2. Wait for completion
3. In `wrangler tail`, check if `[alarm] turn_complete found in log snapshot` appears
   (This may not fire if waitForLog handles it first — that's correct)
4. To force-test: temporarily disable waitForLog and verify alarm log snapshot catches completion

### Test 4: Debug removal
1. Start a generation
2. Verify NO `[debug]` messages appear in the client chat UI
3. Verify `wrangler tail` still shows generation progress via `this.log()` calls

---

## Deploy Command

```bash
cd client && npm run build && docker logout registry.cloudflare.com; docker builder prune -af; cd ../cloudflare && npx wrangler deploy
```

Note: This deploys Session 38 fixes AND Session 39 improvements together.

---

## Future Refactors (Not This Session)

1. **Extract shared `handleCompletion()` function** — deduplicate reconcile+complete logic across waitForLog, R2 polling, and log snapshot paths
2. **serializeAttachment()** — minor optimization for hibernation wake (saves one async storage read), low priority
3. **Backup/restore SDK** — for cold follow-up file hydration, overkill at current scale
4. **Migrate DO to SQLite storage** — can't do without data loss on existing DOs, not worth it
