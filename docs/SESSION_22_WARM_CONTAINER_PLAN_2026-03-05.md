# Session 22: Warm Container Plan

**Date:** 2026-03-05
**Branch:** `new-ui`
**Prior version:** `7555533b` (Session 21)

## What We Did

This was a research and planning session. No code was deployed (except one pre-fix committed but not deployed).

### 1. Diagnosed S3FS Mount Error

User tested after deploying Session 21 fixes and hit:
```
S3FSMountError: S3FS mount failed: s3fs: MOUNTPOINT directory /mnt/r2 is not empty
```

**Root cause:** Deploy has two propagation phases (Worker code update + container image push). User started testing between phases. Second phase reset the DO mid-generation, but the container survived (`keepAlive: true`) with s3fs still mounted on `/mnt/r2`. Next generation got the same container — stale FUSE mount blocked the new mount.

**Fix applied (not deployed):** Added `pkill -9 s3fs` before the existing cleanup at line 552-555 of `campaign-session.ts`. This kills the stale FUSE driver process before attempting unmount and cleanup.

### 2. Deep Dive: Sandbox Lifecycle

Explored the full sandbox lifecycle, Cloudflare docs, and SDK documentation to understand:

- **Container states:** Cold (doesn't exist, ~2 min boot) → Warm/Idle (exists, instant) → Sleep (auto-killed after timeout, all state lost)
- **`keepAlive: true`** — container lives forever, heartbeats every 30s, must be explicitly destroyed. Costs ~$41/month per idle container.
- **`sleepAfter: "2h"`** — container auto-kills after 2h idle. Charges stop. Sleep = full teardown (NOT pause). Next request = cold start.
- **Sleep destroys everything:** files, processes, mounts, shell state. Only R2 data survives (it's cloud storage, not local).
- **Mounts persist across exec() calls** — confirmed in SDK docs. "Mount once per sandbox."
- **Shell state persists between exec()** — working directory, env vars carry over.
- **`setKeepAlive()` is dynamic** — can toggle at runtime.
- **No `setSleepAfter()` method** — only set at creation time.

### 3. Pricing Analysis

- **CPU:** $0.00002/vCPU-second (active usage only — free when idle)
- **Memory:** $0.0000025/GiB-second (provisioned, not actual — pays for full 6 GiB even if using 500 MB)
- **Disk:** $0.00000007/GB-second (provisioned)
- **Per generation:** ~$0.02
- **Per user session (2 gens + idle):** ~$0.09
- **50 daily users:** ~$135/month
- **Free tier:** 375 vCPU-min + 25 GiB-hours + 200 GB-hours (~5 sessions/month)

### 4. Instance Limits (much higher than we set)

| Instance Type | Max Concurrent |
|---|---|
| lite | 15,000 |
| basic | 6,000 |
| standard-1 | 1,500 |
| **standard-2 (ours)** | **1,000** |

We have `max_instances: 10` — very conservative. Plan bumps to 50.

### 5. New Cloudflare Features Discovered

- **Backup/Restore API** (Feb 2026) — snapshot directories to R2, restore on fresh containers. Evaluated for cold start optimization but dropped — pre-compiling tsx in Dockerfile is simpler and gives 90% of the benefit.
- **Custom Instance Types** (Jan 2026) — configure exact vCPU/memory/disk. Could save costs if 6 GiB is overkill.
- **Real-time File Watching** (Mar 2026) — `sandbox.watch()` for SSE file events. Useful for future Level 2 (independent container).
- **Higher Limits** (Feb 2026) — 1000+ instances for standard-2.

### 6. Created Implementation Plan

Full plan at `docs/PHASE1_WARM_CONTAINER_PLAN.md`. Reviewed as staff engineer and fixed 5 issues before finalizing.

## Plan Summary (Phase 1: Warm Container)

**Goal:** Follow-ups from ~7 min to ~15 seconds.

| # | Change | What |
|---|---|---|
| 1 | `sleepAfter: '2h'` + `normalizeId: true` | Replace `keepAlive: true`. Auto-cleanup, stops idle charges |
| 2 | Conditional cold/warm path | Skip mount + IP check on warm container. Health check probe to detect slept containers |
| 3 | Keep `destroy()` in cancel only | Remove from finally block. Container stays warm after generation |
| 4 | Clean workspace for new campaigns | `rm -rf /app/agent/files/*` for new campaigns, not follow-ups |
| 5 | Kill lingering processes | `pkill -f agent-runner` before each exec |
| 6 | Pre-compile tsx in Dockerfile | `tsc` during Docker build, `node dist/agent-runner.js` at runtime |
| 7 | Bump `max_instances: 50` | Room for growth |

### Review Issues Found and Fixed

1. **Container slept but `sandboxReady` is true (CRITICAL)** — Added health check probe (`test -d /mnt/r2/images && echo WARM`). Falls back to cold path if probe fails. ~100ms overhead on warm.
2. **Pre-compilation fragility** — Removed fake `tsx --compile`. Install `typescript` globally, use `tsc -p tsconfig.json`. Added fallback plan if tsc fails.
3. **Error should reset `sandboxReady`** — If `sync` fails in finally block, reset `sandboxReady = false` and `this.sandbox = null`.
4. **`normalizeId` changes sandbox ID** — One-time cold start for all users on first deploy. Noted, not a code issue.
5. **IP re-blocked on warm container** — Known limitation, not worth solving. Rare edge case handled by existing API error flow.

### Files to Change

| File | Changes |
|------|---------|
| `campaign-session.ts` | Bulk of logic: cold/warm path, finally block, cancel, cleanup, exec command |
| `Dockerfile` | Add typescript install + pre-compilation step |
| `tsconfig.json` | New file for tsc config |
| `wrangler.jsonc` | `max_instances: 10` → `50` |

## What Was NOT Covered

- **Deploy-safe generation (Level 2)** — Active generations still die on deploy. Recovery layer (Session 18) handles post-crash, but real-time progress is lost. Separate future project.
- **Container pooling (Level 3)** — Not needed until 100+ concurrent users.
- **Backup/Restore API** — Dropped from plan. Pre-compilation in Dockerfile is simpler.
- **Session 21 testing** — Still untested: follow-up without refresh, messages on refresh, wrangler tail logs. These tests should pass after Phase 1 deploy since the underlying fixes are included.

## Pre-fix Applied (Not Deployed)

**File:** `campaign-session.ts` line 555
**Change:** Added `pkill -9 s3fs` to stale mount cleanup command. This is incorporated into the Phase 1 plan (Change 2, cold path).

## Next Session: Implementation

1. Implement all 7 changes from `PHASE1_WARM_CONTAINER_PLAN.md`
2. Test Docker build locally (`docker build -f sandbox/Dockerfile sandbox/`)
3. Deploy
4. Wait for full rollout (both phases — ~5 min)
5. Run test plan (7 tests in the plan doc)
