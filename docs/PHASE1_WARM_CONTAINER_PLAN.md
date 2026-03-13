# Phase 1: Warm Container Optimization

**Date:** 2026-03-05
**Branch:** `new-ui`
**Goal:** Reduce follow-up/chat latency from ~7 min to ~15 seconds by keeping the sandbox container alive between generations.

## Problem

Every user interaction (generate, follow-up, chat) destroys the container in the finally block. The next interaction pays the full cold start: container boot + image pull + R2 mount + IP check + tsx compile + SDK init = ~2-3 min overhead before AI even starts.

## Impact

| Scenario | Before | After |
|---|---|---|
| First generation (cold) | ~7 min | ~3.5 min |
| Follow-up (warm) | ~7 min | **~15s** |
| New campaign (warm) | ~7 min | **~15s** |
| Quick chat (warm) | ~7 min | **~15s** |
| Return after 2h+ idle | ~7 min | ~3.5 min |

---

## Changes

### Change 1: Sandbox Options — `sleepAfter` replaces `keepAlive`

**File:** `cloudflare/src/durable-objects/campaign-session.ts` (line 549)

**Current:**
```typescript
sandbox = getSandbox(this.env.SANDBOX, sandboxId, { keepAlive: true });
```

**New:**
```typescript
sandbox = getSandbox(this.env.SANDBOX, sandboxId, {
  sleepAfter: '2h',
  normalizeId: true,
});
```

**Why:**
- `keepAlive: true` keeps container alive forever — pays for idle memory/disk ($41/month per container)
- `sleepAfter: '2h'` auto-kills after 2 hours idle — charges stop, slot freed
- `normalizeId: true` fixes the uppercase sandbox ID warning in logs
- UX is identical within the 2h window (container stays warm)

**Edge case:** Active `exec()` counts as activity — sleepAfter timer only starts after generation completes. No risk of container sleeping mid-generation.

**Note — `normalizeId` changes the sandbox ID:** Currently the ID is `user-user_3ANz...-v2` (uppercase). With `normalizeId: true`, it becomes `user-user_3anz...-v2` (lowercase). This is a different ID, so the first deploy forces a cold start for all users (old containers become orphans, cleaned up when they sleep after 2h). One-time transition, no data impact.

---

### Change 2: Skip Mount/Destroy on Warm Container

**File:** `cloudflare/src/durable-objects/campaign-session.ts`

This is the core change. The sandbox setup (lines 540-603) and cleanup (lines 855-878) need to handle two scenarios: cold container (first run) and warm container (subsequent runs).

#### 2a: Track container warmth

Add an instance variable to track whether this container is already set up:

```typescript
// Add to instance variables (line ~23)
private sandboxReady = false;  // true if container has R2 mounted + IP verified
```

#### 2b: Conditional setup in runGeneration()

**Current flow (lines 540-603):** Always unmount, mount, IP check, regardless of container state.

**New flow:**

```typescript
// 1. Get sandbox
const sandboxId = `user-${this.userId.toLowerCase()}-v2`;
sandbox = getSandbox(this.env.SANDBOX, sandboxId, {
  sleepAfter: '2h',
  normalizeId: true,
});

if (this.sandboxReady) {
  // WARM PATH — verify the container is actually still alive.
  // The container may have slept (sleepAfter expired) or died (Cloudflare killed it,
  // OOM, etc.) while sandboxReady was still true. A quick probe confirms liveness.
  // Cost: ~100-200ms on a warm container. On a dead container, the exec() triggers
  // a cold boot anyway, so total time is the same as going straight to cold path.
  try {
    const probe = await sandbox.exec('test -d /mnt/r2/images && echo WARM');
    if (!probe?.stdout?.includes('WARM')) {
      this.log('[gen] Container alive but R2 mount gone — falling back to cold path');
      this.sandboxReady = false;
    } else {
      this.log('[gen] Warm container — skipping mount and IP check');
    }
  } catch {
    this.log('[gen] Container health check failed — falling back to cold path');
    this.sandboxReady = false;
  }
}

if (!this.sandboxReady) {
  // COLD PATH — first run or after sleep/cancel/deploy/container death

  // Clean stale mounts (deploy interrupted previous generation)
  try { await sandbox.unmountBucket('/mnt/r2'); } catch (_) {}
  await sandbox.exec('pkill -9 s3fs 2>/dev/null; umount -f /mnt/r2 2>/dev/null; fusermount -u /mnt/r2 2>/dev/null; rm -rf /mnt/r2; mkdir -p /mnt/r2');

  // Mount R2
  await sandbox.mountBucket('creative-agent-assets', '/mnt/r2', {
    endpoint: `https://${this.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    provider: 'r2',
    credentials: {
      accessKeyId: this.env.R2_ACCESS_KEY_ID,
      secretAccessKey: this.env.R2_SECRET_ACCESS_KEY,
    },
    readOnly: false,
    prefix: `/users/${this.userId}`,
  });

  // Clean stale Claude CLI auth cache
  await sandbox.exec('rm -f /mnt/r2/.claude/.credentials /mnt/r2/.claude/config.json /mnt/r2/.claude/auth.json 2>/dev/null || true');

  // Pre-flight IP check (only on cold start)
  // ... existing IP check code (lines 573-602) ...
  // On IP failure + retry, the retry creates a new sandboxId and goes through cold path again

  this.sandboxReady = true;
}
```

**What this skips on warm:**
- `unmountBucket` + stale mount cleanup (~5s)
- `mountBucket` (~5-10s)
- Pre-flight IP check (~30s)
- Total saved: ~40s per follow-up
- Health check cost: ~100-200ms (negligible)

**Edge case — container slept but `sandboxReady` is true:** The health check (`test -d /mnt/r2/images`) catches this. If the probe fails, we reset `sandboxReady = false` and fall through to the cold path. The cold boot is triggered by the probe's `exec()` anyway (lazy start), so there's no wasted time.

**Edge case — IP check retry loop:** The retry loop currently creates new sandbox IDs on retry (`user-{userId}-v2-{Date.now()}`). These retry containers should NOT set `sandboxReady = true` until the IP check passes. Only the final successful sandbox sets the flag. This already works because `sandboxReady` is only set after the loop exits.

**Edge case — DO reset:** `sandboxReady` is an instance variable — it resets to `false` on DO reset. The container might still be warm, but we'll re-run the cold path anyway. This is safe — the stale mount cleanup handles any leftover state. Minor overhead (~40s) on the rare DO reset case, but correct.

#### 2c: Remove destroy + unmount from finally block

**Current (lines 855-878):**
```typescript
finally {
  this.isGenerating = false;
  this.abortController = null;
  if (this.sandbox) {
    try {
      await this.sandbox.exec('sync');
      await this.sandbox.unmountBucket('/mnt/r2');
    } catch (flushErr: any) { ... }
    try { await this.sandbox.destroy(); } catch (_) {}
  }
  this.sandbox = null;
  await this.clearPersistedSession();
}
```

**New:**
```typescript
finally {
  this.isGenerating = false;
  this.abortController = null;
  if (this.sandbox) {
    // Flush pending FUSE writes to R2 (SDK's JSONL session file, etc.)
    try {
      this.log('[gen] Flushing filesystem...');
      await this.sandbox.exec('sync');
      this.log('[gen] Filesystem sync complete');
    } catch (flushErr: any) {
      this.log(`[gen] WARN: Flush failed: ${flushErr?.message || flushErr}`);
      // If sync fails, the container is likely dead — reset for cold path next time
      this.sandboxReady = false;
      this.sandbox = null;
    }
    // Do NOT unmount R2 — keep mounted for follow-ups
    // Do NOT destroy sandbox — keep warm for follow-ups
  }
  // Do NOT null out this.sandbox — keep reference for next run
  await this.clearPersistedSession();
}
```

**What changed:**
- Removed `unmountBucket()` — R2 stays mounted for next run
- Removed `destroy()` — container stays alive
- Removed `this.sandbox = null` — keep reference for next `exec()`
- Kept `sync` — flushes FUSE cache to R2 (safety net for JSONL file)
- **Added:** If `sync` fails, reset `sandboxReady` and `sandbox` — the container is likely dead, so next run goes through cold path instead of trusting a dead container

---

### Change 3: Keep `destroy()` in Cancel Handler

**File:** `cloudflare/src/durable-objects/campaign-session.ts` (lines 394-412)

Cancel still needs to kill the running process. `destroy()` is the only reliable way.

**Current (no change needed — keep as-is):**
```typescript
private async handleCancel(): Promise<void> {
  if (this.abortController) {
    this.abortController.abort();
    if (this.sandbox) {
      this.sandbox.destroy().catch(() => {});
      this.sandbox = null;
    }
    // ...
  }
}
```

**Addition — reset warmth flag:**
```typescript
if (this.sandbox) {
  this.sandbox.destroy().catch(() => {});
  this.sandbox = null;
  this.sandboxReady = false;  // Next run goes through cold path
}
```

**Edge case:** After cancel, the next generation hits cold start (~3.5 min). This is acceptable — cancel is rare, and the user expects some delay when starting fresh.

---

### Change 4: Clean Agent Workspace for New Campaigns

**File:** `cloudflare/src/durable-objects/campaign-session.ts`

On a warm container, files from the previous campaign (research.md, hooks.md, prompts.json) are still on disk. A new campaign's agent would find them and get confused.

**Add before agent-runner exec (after the cold/warm branch, before line 646):**

```typescript
// Clean previous campaign's workspace files (only for NEW campaigns, not follow-ups)
if (!sdkSessionId) {
  await sandbox.exec('rm -rf /app/agent/files/* 2>/dev/null; rm -rf /app/agent/.claude/skills/hook-methodology/hook-bank/*.md 2>/dev/null || true');
  this.log('[gen] Cleaned workspace for new campaign');
}
```

**Why `!sdkSessionId`:** Follow-ups have a `sdkSessionId` (they resume a previous SDK session). New campaigns don't. Only clean for new campaigns.

**Edge case:** The file hydration step (lines 606-635) runs AFTER this cleanup and ONLY for follow-ups (`if (sdkSessionId && this.campaignId)`). So follow-ups restore from D1, new campaigns start clean. No conflict.

---

### Change 5: Kill Lingering Processes Before Exec

**File:** `cloudflare/src/durable-objects/campaign-session.ts`

If a previous agent-runner process hung or didn't exit cleanly, kill it before starting a new one.

**Add before agent-runner exec (before line 646):**

```typescript
// Kill any lingering agent-runner from a previous run
await sandbox.exec('pkill -f agent-runner 2>/dev/null || true');
```

**Edge case:** This kills ALL agent-runner processes, including one that might be in its 5-second exit delay (line 143 of agent-runner.ts: `setTimeout(() => process.exit(0), 5000)`). That's fine — the `sync` in the previous finally block already flushed the data. Killing the delayed-exit process loses nothing.

---

### Change 6: Pre-compile TypeScript in Dockerfile

**File:** `cloudflare/sandbox/Dockerfile`

**Current (line 22):**
```dockerfile
COPY agent-runner.ts orchestrator-prompt.ts nano-banana-mcp.ts ./
```

agent-runner.ts is compiled by `npx tsx` at runtime, costing ~30s per run.

**New:**
```dockerfile
# Copy sandbox entry point and supporting modules
COPY agent-runner.ts orchestrator-prompt.ts nano-banana-mcp.ts ./
COPY tsconfig.json ./

# Install TypeScript compiler + pre-compile to JavaScript
# (saves ~30s per run vs runtime tsx compilation)
RUN npm install -g typescript && \
    tsc -p tsconfig.json
```

**Also create:** `cloudflare/sandbox/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": ".",
    "strict": false,
    "skipLibCheck": true,
    "declaration": false
  },
  "include": ["agent-runner.ts", "orchestrator-prompt.ts", "nano-banana-mcp.ts"]
}
```

**Update exec command (line 646):**
```typescript
// Before:
const execPromise = sandbox.exec('npx tsx /app/agent-runner.ts', { ... });

// After:
const execPromise = sandbox.exec('node /app/dist/agent-runner.js', { ... });
```

**Why `npm install -g typescript` instead of `npx tsc`:** `tsx` (already in package.json) is a runtime compiler — it has no `--compile` or build mode. `tsc` is the proper build tool. Installing it globally ensures it's available at Docker build time. The `typescript` package adds ~40 MB to the image but only runs during build (no runtime impact).

**Edge case — import paths:** TypeScript imports use `.js` extensions (e.g., `import { foo } from './nano-banana-mcp.js'`). This is correct for ESM — `tsc` preserves the `.js` extension, and Node resolves it to the compiled `.js` file in the `dist/` directory.

**IMPORTANT — test locally first:** Before deploying, verify the Dockerfile builds successfully:
```bash
cd cloudflare && docker build -f sandbox/Dockerfile sandbox/
```
If `tsc` fails on type errors from third-party packages, `skipLibCheck: true` (already in tsconfig) should handle it. If it still fails, fall back to keeping `npx tsx` at runtime and skip this change — the warm container optimization alone saves far more time than the 30s tsx compile.

---

### Change 7: Bump max_instances

**File:** `cloudflare/wrangler.jsonc` (line 34)

**Current:**
```jsonc
"max_instances": 10
```

**New:**
```jsonc
"max_instances": 50
```

**Why 50:** At $0.02/generation with `sleepAfter: '2h'`, 50 concurrent users costs ~$1/day in generation + idle memory for active sessions. The platform limit for standard-2 is 1,000. We can increase further as user count grows.

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `cloudflare/src/durable-objects/campaign-session.ts` | `sleepAfter` + `normalizeId`, conditional setup (cold/warm), finally block cleanup, cancel warmth reset, workspace cleanup, process kill, exec command change |
| `cloudflare/sandbox/Dockerfile` | Add tsconfig copy + pre-compilation step |
| `cloudflare/sandbox/tsconfig.json` | **New file** — TypeScript compiler config for pre-compilation |
| `cloudflare/wrangler.jsonc` | `max_instances: 10` -> `50` |

---

## Testing Plan

### Test 1: First Generation (Cold Start)
1. Deploy the changes
2. Wait for full rollout (both phases)
3. Generate a campaign
4. **Verify:** Container boots, R2 mounts, IP check runs, generation completes
5. **Verify:** `wrangler tail` shows `[gen] Warm container` NOT logged (cold path taken)

### Test 2: Follow-Up (Warm Container)
1. Immediately after Test 1, send a follow-up message
2. **Verify:** No mount or IP check in logs
3. **Verify:** `wrangler tail` shows `[gen] Warm container — skipping mount and IP check`
4. **Verify:** Follow-up completes in ~15-30s (not 7 min)
5. **Verify:** Images and files from previous generation still accessible

### Test 3: New Campaign (Warm Container)
1. After Test 2, start a new campaign (different prompt)
2. **Verify:** Warm path taken (no mount/IP check)
3. **Verify:** Workspace cleaned (`[gen] Cleaned workspace for new campaign` in logs)
4. **Verify:** New campaign doesn't reference previous campaign's research/hooks

### Test 4: Cancel
1. Start a generation, cancel mid-way
2. **Verify:** Cancel completes, container destroyed
3. Start another generation
4. **Verify:** Cold path taken (new container boots)

### Test 5: Quick Chat
1. After a completed generation, send a simple text follow-up ("change the headline")
2. **Verify:** Response comes back in ~15-30s, not minutes

### Test 6: Sleep + Wake
1. Complete a generation
2. Wait > 2 hours (or temporarily set `sleepAfter: '2m'` for testing)
3. Send a new message
4. **Verify:** Cold start happens (container slept), generation still works

### Test 7: Deploy During Idle
1. Complete a generation (container warm)
2. Deploy new code
3. Start a new generation
4. **Verify:** Stale mount cleanup handles the reused container
5. **Verify:** Generation completes successfully

---

## What This Plan Does NOT Cover

- **Deploy-safe generation (Level 2):** Active generations still die on deploy. The existing recovery layer (Session 18) handles post-crash recovery, but the user loses real-time progress.
- **Container pooling (Level 3):** Each user still gets their own container. No shared pool.
- **Backup/Restore API:** Not needed — pre-compilation in Dockerfile covers the cold start optimization. Can revisit if user-specific setup becomes expensive.
- **First-generation cold start:** Still ~3.5 min for the very first generation (container boot + image pull). Unavoidable without pre-warming.

---

## Rollback Plan

If warm containers cause issues in production:
1. Revert to `keepAlive: true` and add `destroy()` back to finally block
2. Set `this.sandboxReady = false` always (forces cold path)
3. No data loss risk — R2 has all persisted data, D1 has all campaign state

---

## Cost Estimate

**Per user session (2 generations + 1 follow-up + idle):**
- Active: ~25 min × 1 vCPU = 1500 vCPU-sec = $0.03
- Memory: ~2.5 hours × 6 GiB = 15 GiB-hours = $0.05
- Disk: ~2.5 hours × 12 GB = 30 GB-hours = $0.008
- **Total per session: ~$0.09**

**Free tier covers:** 375 vCPU-min + 25 GiB-hours + 200 GB-hours = ~4-5 sessions/month free.

**50 daily active users:** ~$4.50/day = ~$135/month (well within reason for a paid product).
