# E2E Testing Session 5 — 2026-03-02

> Status: **Partial — cancel fix deployed, follow-up/reconnect need retry**
> Branch: `new-ui`
> Deployed: https://creative-agent.alphasapien17.workers.dev
> Version ID: `c0efd5b8-54bf-41a4-aea5-55290173ab2c`

---

## Session Goal

Run the 5 remaining E2E tests from the Session 5 plan (`docs/E2E_TESTING_SESSION_5_PLAN.md`).

---

## Test Results

| # | Test | Result | Duration | Notes |
|---|------|--------|----------|-------|
| 1 | REST API | **PASS** (53/53) | ~5s | All endpoints, all assertions |
| 2 | Image Serving | **PASS** (14/14) | ~3s | PNG magic bytes, cache headers, 404 |
| 3 | Cancel | **PASS** (3/3) | ~52s | After 3 deploys to fix — see below |
| 4 | Follow-Up / Resume | **Inconclusive** | — | SDK resumed but sandbox got IP-blocked (403) |
| 5 | Reconnect / Subscribe | **Not run** | — | Blocked by follow-up test |

---

## Bug Found & Fixed: Cancel Flow Leaves `isGenerating = true`

### Problem

When a user cancels during generation, `handleCancel()` destroys the sandbox and sends the cancel ack, but `runGeneration()` is still running. The drain loop exits correctly, but then **hangs forever** on `await execPromise` (line 543) because the destroyed sandbox never settles the exec promise. This blocks the `finally` block, so `isGenerating` stays `true` and the next generate/follow-up gets rejected with "A generation is already in progress."

### Root Cause Trace

```
1. handleCancel() calls sandbox.destroy() (fire-and-forget) + abortController.abort()
2. Drain loop detects abort → wasCancelled = true, break
3. Line 543: await execPromise  ← HANGS (destroyed sandbox doesn't settle the promise)
4. finally block never runs → isGenerating stays true forever
5. Next generate/follow_up → "A generation is already in progress"
```

### Fix Applied (3 changes in `campaign-session.ts`)

**Change 1: Await `handleCancel()` in dispatcher (line 85)**
```typescript
// Before:
this.handleCancel();
// After:
await this.handleCancel();
```
Ensures D1 write completes before WS handler returns.

**Change 2: `handleCancel()` updates D1 immediately (line 259-277)**
```typescript
// Before: void, no D1 update
private handleCancel(): void { ... }

// After: async, updates D1 before sending ack
private async handleCancel(): Promise<void> {
  this.abortController.abort();
  this.sandbox.destroy().catch(() => {});
  this.sandbox = null;
  // NEW: Update D1 immediately
  await db.updateCampaignStatus(this.env.DB, this.campaignId, 'cancelled');
  this.sendWS({ type: 'ack', message: 'Cancel requested' });
}
```

**Change 3: Race `execPromise` with timeout if cancelled (line 543)**
```typescript
// Before:
const result = await execPromise;  // hangs forever after destroy()

// After:
if (wasCancelled) {
  await Promise.race([
    execPromise.catch(() => {}),
    new Promise(resolve => setTimeout(resolve, 5000)),  // 5s safety net
  ]);
} else {
  await execPromise;
}
```

**Change 4: Abort checks in drain loop idle branches (lines 515-526)**
```typescript
// Added abort signal checks when queue is empty:
} else if (execDone) {
  if (this.abortController?.signal.aborted) wasCancelled = true;  // NEW
  break;
} else {
  if (this.abortController?.signal.aborted) { wasCancelled = true; break; }  // NEW
  await new Promise(r => setTimeout(r, 10));
}
```

### What We Tried That Didn't Work

**Passing `signal` to `sandbox.exec()`**: The Sandbox SDK accepts `signal?: AbortSignal` in `ExecOptions`, so we tried passing the abort signal. This caused the exec to produce **zero output chunks** — the process hung silently without even emitting the MCP server startup message. Removed. Cancel is handled by `sandbox.destroy()` + drain loop abort checks instead.

### Test Script Fix

`test-e2e-cancel.mjs`: Added polling (up to 10 retries, 1s apart) for the D1 status check instead of checking immediately after cancel ack. Also included `statusOk` in the `allPassed` condition.

---

## Follow-Up Test: Partial Success

### What Worked

- Cancel fix confirmed: follow-up accepted immediately after cancel (no "already generating" error)
- SDK resume from JSONL on R2 works (system/init received at ~38s)
- SDK resumed conversation context and started generating with the follow-up prompt
- Events streamed correctly (assistant messages, tool_start for Agent subagent)

### What Failed

**Attempt 1**: SDK spawned a WebFetch subagent that hung for 5+ minutes (AI behavior — prompt triggered unnecessary research). Prompt was: `"Make the headlines shorter and punchier. Use one-word power openers."`

**Attempt 2**: Changed prompt to explicitly avoid research: `"Rewrite just the hook headlines to be shorter and punchier. Do NOT do any new research or web fetches..."`. Sandbox got a blocked IP (`WITH_KEY=403` from sandbox, `200` from DO). SDK hung silently after MCP server startup.

**Attempt 3**: Same IP blocking issue — sandbox IP `104.28.157.199` returned 403 from Anthropic API.

### Follow-Up Test Status for Next Session

The follow-up **code path is verified working** from attempt 1:
- `handleFollowUp()` correctly looks up campaign + sdk_session_id from D1
- `runGeneration()` passes `RESUME_SDK_SESSION_ID` to agent-runner
- SDK successfully reads JSONL from R2 FUSE mount and resumes conversation
- Events stream correctly through the pipeline

What needs retrying:
- A full end-to-end follow-up completion (complete event + D1 status check)
- Requires a sandbox IP that isn't blocked by Anthropic

---

## Sandbox IP Blocking — Ongoing Issue

### Pattern Observed

| Time | Sandbox IP | Anthropic Response | Result |
|------|-----------|-------------------|--------|
| Cancel test 1 | 104.28.156.131 | 200 | Generation worked |
| Cancel test 2 | 104.28.157.201 | 403 | SDK never reached init |
| Cancel test 3 (deployed fix) | 104.28.157.193 | 403 | SDK reached init but API calls fail |
| Follow-up attempt 1 | 104.28.161.29 | 200 | SDK resumed, generation worked |
| Follow-up attempt 2 | 104.28.157.199 | 403 | SDK hung after MCP startup |
| Follow-up attempt 3 | 104.28.157.199 | 403 | Same blocked IP |

### Analysis

- All IPs are Cloudflare `104.28.x.x` range — the `placement.region: "aws:us-east-1"` config is working (containers are in US)
- Anthropic appears to block specific IPs within that range intermittently
- The `104.28.157.x` subnet seems consistently blocked, while `104.28.156.x`, `104.28.160.x`, `104.28.161.x` work
- Restarting the sandbox (via cancel + new generation) sometimes gets a new IP, sometimes the same one
- This is outside our control — Anthropic's IP allowlist for their API

### Mitigation Options

1. **Retry with new sandbox**: Call `sandbox.destroy()` and `getSandbox()` again to get a new container with potentially different IP
2. **Pre-flight API check**: The debug diagnostics already test `WITH_KEY` from sandbox. Could auto-retry sandbox creation on 403
3. **Contact Anthropic**: Ask about IP allowlisting for Cloudflare container IPs
4. **Use Workers AI gateway**: Proxy Anthropic API calls through Workers AI to use stable Worker IPs (not container IPs)

---

## D1 State After Session

Campaigns created during testing:

| Campaign ID | Status | SDK Session | Created | Notes |
|------------|--------|-------------|---------|-------|
| `campaign_mm8scvpnq2uchx` | cancelled | null | 06:16 | Cancel test 3 (final, all pass) |
| `campaign_mm8rxt38a19aoy` | cancelled | null | 06:04 | Cancel test 2 |
| `campaign_mm8rcg2dp3msxc` | cancelled | null | 05:48 | Cancel test 1 (before D1 fix) |
| `campaign_mm8r8w7jagkxrf` | generating | null | 05:45 | Stale — stuck from early cancel test |
| `campaign_mm8r3ahldm3chr` | generating | `8894e9f1...` | 05:40 | Stale — stuck from first cancel test |

Note: `campaign_mm7qbx1iinmllh` (Session 4's known-good campaign) now has status `cancelled` because the follow-up tests selected it and then got cancelled. Two other good complete campaigns remain: `campaign_mm7n01h7txlqmv` and `campaign_mm7mo39nzzl3z8`.

### Stale campaigns to clean up

```sql
-- Fix stale 'generating' campaigns left by early tests
UPDATE campaigns SET status = 'error' WHERE status = 'generating' AND id IN ('campaign_mm8r8w7jagkxrf', 'campaign_mm8r3ahldm3chr');
```

---

## Deployed Version

**Version**: `c0efd5b8-54bf-41a4-aea5-55290173ab2c`

Changes deployed:
- Cancel flow fix (4 changes in `campaign-session.ts`)
- `signal` NOT passed to `sandbox.exec()` (caused zero output — comment explains why)

---

## Files Modified This Session

### Server (deployed)
- `cloudflare/src/durable-objects/campaign-session.ts` — Cancel flow fix (+28 lines, -4 lines)

### Test scripts (untracked, local only)
- `test-e2e-cancel.mjs` — Added D1 status polling + `statusOk` in `allPassed`
- `test-e2e-follow-up.mjs` — Changed prompt to avoid triggering WebFetch research

---

## Next Session: What to Do

### 1. Clean up stale D1 campaigns

```bash
npx wrangler d1 execute creative-agent-db --remote --command="UPDATE campaigns SET status = 'error' WHERE status = 'generating' AND created_at < '2026-03-02 06:00:00'"
```

### 2. Re-run follow-up test

```bash
node test-e2e-follow-up.mjs
```

If sandbox gets a blocked IP (check for `WITH_KEY=403` in output):
- Cancel the test
- Wait 1-2 minutes for sandbox to sleep
- Retry (new sandbox may get a different IP)
- If consistently blocked: consider the pre-flight retry mitigation

Use `campaign_mm7n01h7txlqmv` (complete, has sdk_session_id):
```bash
node test-e2e-follow-up.mjs campaign_mm7n01h7txlqmv
```

### 3. Run reconnect test

```bash
node test-e2e-reconnect.mjs
```

Same IP blocking caveat applies — needs a sandbox with a working IP.

### 4. If all tests pass

- Remove debug diagnostics from `campaign-session.ts` (API key check, network test — saves ~8s per generation)
- Run `node test-e2e-all.mjs` for a clean full suite run
- Connect React client to deployed Worker

### 5. Consider: Pre-flight IP retry

Add auto-retry logic after the sandbox network test:
```typescript
if (netTestResult.includes('WITH_KEY=403')) {
  // Destroy and recreate sandbox with new container
  sandbox.destroy();
  sandbox = getSandbox(env.SANDBOX, `user-${userId}-${Date.now()}`);
  // Re-mount R2 and retry...
}
```

This would make the system resilient to IP blocking without manual intervention.
