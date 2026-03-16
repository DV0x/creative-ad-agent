# Session 53: S3FS Lazy Unmount Fix + Stuck Campaign Bug

**Date**: 2026-03-13
**Branch**: `new-ui`
**Previous session**: Session 52 (Follow-Up Bugs + Stream Trace Fix)
**Deploy version**: `3043e438-501d-4bf4-9697-32042c03dd26`
**Status**: Mount fix deployed and verified. New bug found: stuck campaign after deploy.

---

## Fix Deployed: S3FS Mount Error on Campaign Switch

### Root Cause (Investigated)

When switching from one campaign to a new campaign on the same warm container:

1. **R2 mount persists after normal completion** — by design, for fast-path follow-ups. `finalizeGeneration()` does NOT unmount R2.
2. **Sandbox DO loses mount tracking after hibernation** — the Sandbox DO (Cloudflare SDK code) tracks mounts in memory, not durable storage. When it hibernates between campaigns, it forgets the mount exists.
3. **`cleanFuse` failed silently** — the cleanup command used `umount -f` which could fail against a live/stale FUSE mount. All errors were swallowed (`2>/dev/null` + `;` chaining + exit code from `mkdir -p`).
4. **`mountBucket` fails** — s3fs refuses to mount on `/mnt/r2` because the old mount's content is still there: "MOUNTPOINT directory /mnt/r2 is not empty."

### Fix Applied

Changed `umount -f` to `umount -l` (lazy unmount) in `setupSandbox()`:

**File**: `cloudflare/src/durable-objects/campaign-session.ts` line 1013

```
Before: pkill -9 s3fs 2>/dev/null; umount -f /mnt/r2 2>/dev/null; fusermount -u /mnt/r2 2>/dev/null; rm -rf /mnt/r2; mkdir -p /mnt/r2
After:  pkill -9 s3fs 2>/dev/null; umount -l /mnt/r2 2>/dev/null; fusermount -u /mnt/r2 2>/dev/null; rm -rf /mnt/r2; mkdir -p /mnt/r2
```

`umount -l` (lazy unmount) immediately detaches the mountpoint from the filesystem tree, bypassing the Sandbox DO's lost tracking. The kernel cleans up the stale FUSE connection in the background.

### Verification (from `log-updatedmount.md`)

After deploy, the mount sequence for the old campaign's cold-path follow-up:

```
14:30:48.653  exec: pkill -f agent-runner — Success: true
14:30:48.693  unmountBucket: "Unmounting bucket from /mnt/r2"
14:30:48.812  exec: pkill -9 s3fs; umount -l /mnt/r2; ... — Success: true  ← NEW FLAG
14:30:48.853  mountBucket: "Mounting bucket creative-agent-assets to /mnt/r2"
14:30:49.175  s3fs mount — Success: true  ✅
14:30:49.175  "Successfully mounted bucket creative-agent-assets to /mnt/r2"  ✅
```

Mount succeeded. The `umount -l` fix works.

### Docs Updated

- `docs/architecture/ops/KNOWN_ISSUES.md` — Rewrote issue 9a with correct root cause and fix
- `docs/architecture/cloudflare/R2_STORAGE.md` — Updated `umount -f` → `umount -l`
- `docs/architecture/cloudflare/SANDBOX_CONTAINER.md` — Updated mount flow step 3
- `docs/architecture/GENERATION_FLOW.md` — Updated cleanup command

---

## New Bug Found: Campaign Stuck in Infinite Alarm Loop After Deploy

### Symptoms

After deploying version `3043e438`, the old campaign `campaign_mmoh48kqgxuip7` entered an infinite alarm loop:

- Alarm fires every 10 seconds
- `gen=true` (isGenerating restored from durable storage)
- `agent=null` (no agent process ID)
- Polls `readTurnResult` → "File not found: /app/turn-result.json" every iteration
- Never resolves — no agent is running to produce `turn-result.json`
- Will only self-resolve after 2h safety net timeout

### Log Evidence (from `log-updatedmount.md`)

```
[T3][alarm][enter]  iter=1  gen=true  agent=null  ageSec=11
[T15][readTurnResult.error] File not found: /app/turn-result.json
[T16][alarm][reschedule] nextIn=10000

[T18][alarm][enter]  iter=2  gen=true  agent=null  ageSec=27
[T20][readTurnResult.error] File not found: /app/turn-result.json
[T21][alarm][reschedule] nextIn=10000

... (repeats every 10s, reached iter=40+ at ageSec=410+)
```

### Timeline

1. Before deploy: old campaign (`campaign_mmoh48kqgxuip7`) had completed a follow-up. `isGenerating` was set to `true` during the follow-up and persisted to durable storage.
2. Deploy (`3043e438`): CampaignSession DO resets. In-memory state wiped.
3. DO wakes up (alarm or WS connect): `restoreSession()` reads from durable storage → `isGenerating = true`, `agentProcessId = null` (process was from old code version, killed by `setupSandbox`'s `pkill`)
4. Alarm loop starts: `isGenerating` is true → alarm keeps polling. But `agentProcessId` is null → crash detection is skipped (line 152: `if (this.agentProcessId)` guard). Only `tryFinalize` runs, which fails because no `turn-result.json` exists.

### Root Cause Analysis

The alarm handler at lines 150-216 has this structure:

```typescript
if (this.sandbox) {
  // Crash detection — only runs if agentProcessId is set
  if (this.agentProcessId) {
    // listProcesses, check alive, tryFinalize if dead
  }

  // Always runs: poll turn-result.json
  const finalized = await this.tryFinalize(...);
}

// Reschedule if still generating
if (this.isGenerating) {
  await this.state.storage.setAlarm(Date.now() + 10_000);
}
```

When `agentProcessId` is null:
- Crash detection is completely skipped
- `tryFinalize` always fails (no turn-result.json)
- `isGenerating` stays true forever
- Alarm reschedules every 10s
- Only the 2h safety net will break the loop

### What Needs Fixing

The alarm handler needs to detect the case where `isGenerating = true` but `agentProcessId = null` and no agent is running. This is a "zombie generation" state — the DO thinks generation is in progress but there's nothing actually running.

**Possible fix**: In the alarm handler, after restoring session, if `isGenerating = true` and `agentProcessId = null`:
1. Try `tryFinalize` one last time (maybe agent completed before dying)
2. If no turn-result.json, mark campaign as `incomplete` and set `isGenerating = false`

### What Still Works

- The `umount -l` mount fix is verified working
- New campaign creation should work (mount succeeds)
- The stuck campaign will self-resolve in 2h (safety net)

---

## Files Changed This Session

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts:1013` | `umount -f` → `umount -l` |
| `docs/architecture/ops/KNOWN_ISSUES.md` | Rewrote issue 9a |
| `docs/architecture/cloudflare/R2_STORAGE.md` | Updated mount command |
| `docs/architecture/cloudflare/SANDBOX_CONTAINER.md` | Updated mount flow |
| `docs/architecture/GENERATION_FLOW.md` | Updated cleanup command |

---

## Next Steps

1. **Fix the stuck campaign bug** — add zombie generation detection to alarm handler
2. **Test mount fix end-to-end** — create a new campaign after old campaign completes, verify no mount error
3. **Test campaign switching** — old → new → back to old, verify all work
4. **Remove Session 52 debug logging** — `[sdk-parser]` and per-line type logging (once Bug 1 duplication is diagnosed)
