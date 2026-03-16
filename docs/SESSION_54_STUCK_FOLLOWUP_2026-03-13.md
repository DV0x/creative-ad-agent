# Session 54: Stuck Follow-Up After Container Destroy — Root Cause Analysis

**Date**: 2026-03-13
**Branch**: `new-ui`
**Deploy version**: `3043e438-501d-4bf4-9697-32042c03dd26`
**Status**: Root cause identified. Fix not yet implemented.
**Log file**: `log-updatedmount.md`

---

## Timeline of Events

1. **Old campaign (`campaign_mmoh48kqgxuip7`) completed successfully.** Container is warm (idle, within 2hr sleep window).

2. **User created a new campaign** (different campaign). This new campaign tried to use the same warm container. `setupSandbox()` ran → `mountBucket()` failed because the old R2 mount was still active on the container. This is the s3fs mount error (the `umount -f` bug).

3. **Mount fix deployed** (`3043e438`): Changed `umount -f` to `umount -l` (lazy unmount) in `setupSandbox()` line 1013. Deploy resets all DOs.

4. **Container destroyed after ~2hr idle.** The `sleepAfter: '2h'` timer expired. Container gone. DO durable storage is unaffected.

5. **User came back to test the mount fix.** Instead of creating a new campaign, sent a **follow-up on the old campaign** (`campaign_mmoh48kqgxuip7`). This is the test captured in `log-updatedmount.md`.

6. **Follow-up got stuck in an infinite alarm loop.** Generation never started. UI shows "generating" forever.

---

## What the Log Shows

### Container boot (fresh container)

The old container was destroyed. A new container booted from scratch (180s / 3 min):

```
"Error checking 3000: The container is not listening in the TCP address 10.0.0.1:3000"
"Port 3000 is ready"
"Processes listed" → "0 processes"     ← fresh container, no agent
```

### Mount fix verified working

The `umount -l` fix works. Full mount sequence succeeded:

```
14:30:48.653  exec: pkill -f agent-runner — Success: true
14:30:48.693  unmountBucket: "Unmounting bucket from /mnt/r2"
14:30:48.812  exec: pkill -9 s3fs; umount -l /mnt/r2; ... — Success: true  ← lazy unmount
14:30:48.853  mountBucket: "Mounting bucket creative-agent-assets to /mnt/r2"
14:30:49.175  s3fs mount — Success: true ✅
```

### Canceled exec after mount

Immediately after mount succeeded, a sandbox exec was **canceled**:

```json
{
    "wallTime": 5023,
    "outcome": "canceled",
    "entrypoint": "Sandbox",
    "event": { "rpcMethod": "exec" }
}
```

No error message, no exception, no logs. Unknown cause. Possibly:
- Container instability after fresh 3-min boot
- Cloudflare platform-level interruption
- Sandbox DO dropped the RPC connection

**This is the point where things went wrong.** After this canceled exec, the agent was never started. No `startProcess` RPC appears anywhere in the log.

### Follow-up handler state

`handleFollowUp` ran successfully through its setup phase:
- `isGenerating = true` — persisted to DO storage
- `generationStartedAt = Date.now()` — persisted
- D1 status updated to `generating`
- `persistSession()` saved all of the above
- `startKeepAlive()` started alarm heartbeat
- Agent alive check → false (container was destroyed) → **slow path**
- `runGeneration()` fired as background promise

Inside `runGeneration()` → `setupSandbox()`:
- Line 1007: `agentProcessId = null` — **deleted from storage** (clearing old)
- Mount succeeded
- Next sandbox RPC → **canceled** → `setupSandbox` hung (no timeout)
- Line 1111 (`startProcess`) — **never reached**
- Line 1129 (`agentProcessId = proc.id`) — **never reached**

### Alarm loop (20+ iterations)

Every 10 seconds, identical pattern:

```
[alarm][enter]  gen=true  agent=null  ageSec=N
[rpc][readTurnResult.error] File not found: /app/turn-result.json
[alarm][reschedule] nextIn=10000
```

- `gen=true` — `isGenerating` stuck at true
- `agent=null` — `agentProcessId` was deleted at line 1007, never re-set
- No turn-result.json — no agent is running to produce it
- Reschedules forever — no escape

The subscribe handler made it worse:
```
[handler][subscribe.d1Check] d1Status=generating
[handler][subscribe.restartAlarm] reason=DO_reset_while_generating
```
D1 confirms "generating" → alarm loop perpetuated.

---

## Root Cause: Three Bugs Working Together

### Bug 1: `timedRPC` has no timeout (PRIMARY)

**File**: `campaign-session.ts` line 77-87

```typescript
private async timedRPC<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();  // ← waits forever, no timeout
      return result;
    } catch (err: any) {
      throw err;
    }
}
```

When a sandbox RPC hangs or gets canceled without throwing, `setupSandbox()` waits forever. The cleanup code in `runGeneration`'s catch block (line 1299-1307) never executes because the `await` at line 1270 never resolves.

The fire-and-forget `runGeneration()` promise stays alive because the alarm heartbeat keeps the DO from hibernating.

### Bug 2: `isGenerating=true` persisted before risky operations

**File**: `campaign-session.ts` lines 634-679 (handleFollowUp)

The sequence is:
1. `isGenerating = true` → persisted to storage (line 634, 679)
2. D1 status → `generating` (line 676)
3. `agentProcessId` → deleted (line 1007, inside setupSandbox)
4. Mount, pre-flight, agent start... → **any of these can fail**
5. Cleanup code resets `isGenerating` → **only runs if the catch block is reached**

If the code hangs between step 3 and step 5, durable storage has: `isGenerating=true`, `agentProcessId=null`, D1=`generating`. All three are stuck.

### Bug 3: Alarm has no zombie detection

**File**: `campaign-session.ts` lines 150-226

The alarm handler's crash detection is gated on `if (this.agentProcessId)` (line 152). When `agentProcessId` is null:

- Crash detection is **entirely skipped**
- The "agent dead, no result → mark incomplete" recovery path (lines 172-182) is **never reached**
- Only `tryFinalize()` runs, which always fails (no turn-result.json)
- `isGenerating` stays true → alarm reschedules forever
- Only the 2hr safety net can break the loop (if `generationStartedAt` is set)

---

## What Still Works

- **Mount fix (`umount -l`) is verified working** — mount succeeded on warm container reuse
- **New campaign creation should work** — this bug only affects follow-ups where setupSandbox hangs
- **2hr safety net will eventually break the loop** — but only if `generationStartedAt` is set (it was in this case: `ageSec` started at 11 and kept incrementing)

---

## Proposed Fixes

### Fix 1: Add timeout to `timedRPC` (HIGHEST PRIORITY)

Add a configurable timeout (e.g., 60s) to `timedRPC`. If a sandbox RPC doesn't resolve within the timeout, reject with an error. This allows `setupSandbox` to throw and the cleanup code to run.

```typescript
private async timedRPC<T>(label: string, fn: () => Promise<T>, timeoutMs = 60_000): Promise<T> {
    const start = Date.now();
    this.trace('rpc', `${label}.start`);
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`RPC ${label} timed out after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);
      this.trace('rpc', `${label}.done`, { ms: Date.now() - start });
      return result;
    } catch (err: any) {
      this.trace('rpc', `${label}.error`, { ms: Date.now() - start, err: err?.message?.substring(0, 100) });
      throw err;
    }
}
```

### Fix 2: Zombie detection in alarm handler

After the sandbox reconnect (line 148), before the `if (this.agentProcessId)` gate, add:

```typescript
// Zombie detection: isGenerating=true but no agent process
if (!this.agentProcessId) {
    // Check if any agent processes are running in sandbox
    try {
        const processes = await this.timedRPC('listProcesses', () => this.sandbox.listProcesses());
        const agentRunning = processes.some((p: any) => p.status === 'running');
        if (!agentRunning) {
            // Try one last finalize
            const finalized = await this.tryFinalize(this.campaignId, this.sessionId!);
            if (!finalized) {
                this.trace('alarm', 'zombie.detected');
                this.emitEvent({ type: 'error', timestamp: new Date().toISOString(), error: 'Generation failed — no agent running. Please try again.' });
                try { await db.updateCampaignStatus(this.env.DB, this.campaignId, 'incomplete'); } catch {}
                this.isGenerating = false;
                await this.persistSession();
                return;
            }
        }
    } catch {}
}
```

### Fix 3: Persist `isGenerating=true` later in the flow (OPTIONAL)

Move the `isGenerating=true` + `persistSession()` to AFTER setupSandbox succeeds and the agent process starts. This reduces the window where a failure can leave stuck state. Trade-off: if the DO resets between handleFollowUp start and agent start, the user sees no "generating" status. But that's better than being stuck forever.

---

## Investigation Needed

- **Why was the sandbox exec canceled?** Check Cloudflare Dashboard → Containers → Logs for container-side errors at 14:30:49 UTC on 2026-03-13. `wrangler tail` only shows the DO side.
- **Is the `runGeneration` promise still hanging?** If the DO is still running, the promise might still be alive waiting on the canceled RPC. A new deploy would kill it.
- **Does the 2hr safety net fire?** `generationStartedAt` is set (ageSec=11 and incrementing), so the safety net at line 131 should eventually fire after 2hr. But it would be better to fix the root cause.

---

## Files Referenced

| File | Lines | What |
|------|-------|------|
| `campaign-session.ts` | 77-87 | `timedRPC` — no timeout |
| `campaign-session.ts` | 150-226 | Alarm handler — no zombie detection |
| `campaign-session.ts` | 634-679 | `handleFollowUp` — persists isGenerating early |
| `campaign-session.ts` | 1007-1008 | `setupSandbox` — deletes agentProcessId before agent starts |
| `campaign-session.ts` | 1111-1131 | `setupSandbox` — starts agent, sets agentProcessId (never reached) |
| `campaign-session.ts` | 1270 | `runGeneration` — `await setupSandbox()` (hung here) |
| `campaign-session.ts` | 1299-1307 | `runGeneration` catch — cleanup code (never reached) |

---

## Next Steps

1. **Fix Bug 1**: Add timeout to `timedRPC` (60s default)
2. **Fix Bug 3**: Add zombie detection to alarm handler
3. **Deploy and test**: Follow-up on old campaign after container destroy
4. **Investigate**: Check Cloudflare container logs for the canceled exec cause
5. **Optional**: Consider moving `isGenerating=true` persistence to after agent start
