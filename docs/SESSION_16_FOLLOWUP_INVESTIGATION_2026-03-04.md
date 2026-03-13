# Session 16 — Follow-Up Stuck Investigation — 2026-03-04

> Status: **Root cause narrowed to FUSE sync race condition. Needs confirmation via browser network logs.**
> Branch: `new-ui`
> Deployed version: `b4099394` (unchanged from Session 15)

---

## Goal

Investigate why follow-up generation gets stuck (zero SDK output for 7+ minutes), as identified in Session 15.

## Key Finding: JSONL Session File Missing from R2

The SDK's `--resume` option requires a JSONL transcript file at `$HOME/.claude/projects/-app-agent/{sessionId}.jsonl`. This file **does not exist** in R2 for the stuck campaign's user.

### How `resume` works (SDK internals)

1. `agent-runner.ts` passes `resume: sdkSessionId` to the SDK's `query()` function
2. SDK spawns Claude Code CLI with `--resume {sessionId}`
3. CLI looks for JSONL at `$HOME/.claude/projects/{projectHash}/{sessionId}.jsonl`
4. In sandbox: `HOME=/mnt/r2`, `cwd=/app/agent` → project hash is `-app-agent`
5. Full path: `/mnt/r2/.claude/projects/-app-agent/{sessionId}.jsonl`
6. With R2 FUSE prefix `/users/{userId}`, R2 key: `users/{userId}/.claude/projects/-app-agent/{sessionId}.jsonl`

### R2 State Comparison (via Cloudflare Dashboard)

| Item | `user_38uxIJdR...` (stuck campaign) | `user_3AQQRoZ7...` (working campaign) |
|------|--------------------------------------|----------------------------------------|
| `.claude/` dir | Yes (backups, debug, telemetry) | Yes (backups, debug, plugins, projects, session-env, shell-snapshots, telemetry) |
| `.claude/projects/-app-agent/` | **Empty** | Has JSONL files |
| JSONL session file | **Missing** | `d1e1e432-...jsonl` (265 KB) |
| `images/` dir | **Missing — no images in R2** | 2 images (4.26 MB + 5.98 MB) |
| `.claude.json` | Yes (875 B) | Not checked |
| `.npm/` | Yes | Not checked |

### Campaign Data (D1)

| Campaign | User ID | Status | SDK Session ID | Created (UTC) |
|----------|---------|--------|----------------|---------------|
| `campaign_mmboxf6vpr6ih4` | `user_38uxIJdRftKkSkstogHasnk6c2J` | cancelled (was stuck at generating) | `a899a9dc-b6a0-4128-915e-d0bcefb02ab3` | Mar 4, 07:03 |
| `campaign_mmbn023teukodd` | `user_3AQQRoZ7M9jq7Rmhyg5aL9xXTxk` | incomplete | `d1e1e432-7d59-4b46-82c3-bed559993b8a` | Mar 4, 06:09 |
| `campaign_mmar1c3kbvnd5x` | `user_3ANzBpk1WdE1QZOshOLhHK8EAfI` | incomplete | `65f718a7-f79d-4b39-ae42-024e10b608c6` | Mar 3, 15:14 |
| `campaign_mmapxe4fklbjn4` | `user_3ANzBpk1WdE1QZOshOLhHK8EAfI` | incomplete | null | Mar 3, 14:43 |

All campaigns have the same first message: "create 2 ads for ravilagrandhotel.in targeting business travellers"

### User ID Confusion

- `user_38uxIJdRftKkSkstogHasnk6c2J` — the stuck campaign owner (user confirmed this is them)
- `user_3AQQRoZ7M9jq7Rmhyg5aL9xXTxk` — a different Clerk login (same person, different session)
- `user_3ANzBpk1WdE1QZOshOLhHK8EAfI` — earlier test sessions (March 3)
- wrangler CLI `r2 object get` was initially run against the wrong user ID, wasting investigation time

### Wrangler CLI vs Dashboard Discrepancy

- `wrangler r2 object get` reported "Download complete" for an image key under `user_38uxIJdR...`, but the downloaded file was 0 bytes
- The R2 dashboard shows **no images directory** for that user
- Lesson: always verify wrangler downloads by checking file size; "Download complete" doesn't guarantee the object exists

---

## Hypothesis: FUSE Sync Race Condition

### Evidence

1. For `user_38uxIJdR...`: No images, no JSONL in R2 — but generation "completed" (D1 has files, images table populated)
2. For `user_3AQQRoZ7...`: Images AND JSONL exist in R2 — generation also completed
3. Both used identical code paths
4. The stuck campaign's user can still see images in the UI (despite no images in R2)

### Theory

The R2 FUSE mount (`mountBucket`) acknowledges `writeFileSync()` calls locally (in the FUSE daemon's buffer) but syncs to R2 asynchronously. The race condition:

1. MCP tool writes images via `fs.writeFileSync()` → FUSE acks immediately (local buffer)
2. SDK writes JSONL to `.claude/projects/...` → also buffered locally
3. Agent emits `result` message → `agent-runner.ts` calls `process.exit(0)`
4. Back in DO, exec finishes → drain loop ends → D1 updates happen
5. `finally` block: `sandbox.destroy()` kills sandbox AND its FUSE daemon
6. **If FUSE hadn't finished syncing to R2 → data lost**

This explains why one user's data persisted (FUSE had time to sync) and another's didn't (destroyed too soon).

### Why images appear in UI despite not being in R2

Images are served with `Cache-Control: public, max-age=31536000, immutable`. Browser caches them for 1 year. Clearing cookies does NOT clear the HTTP image cache. A hard refresh (Cmd+Shift+R) would bypass cache and should show broken images.

---

## Next Session Plan

### 1. Confirm browser cache theory
- Open the app in Chrome for `user_38uxIJdR...`
- Check **Network tab** for image requests: are they served from cache (`disk cache`) or fetched from server?
- Hard refresh (Cmd+Shift+R) and see if images break
- Check **Console** for any 401/404 errors on image loads

### 2. Fix the FUSE sync race condition

Two potential fixes:

**Fix A: Force FUSE flush before sandbox destroy**
```typescript
// In finally block, before sandbox.destroy():
if (this.sandbox) {
  try {
    await this.sandbox.exec('sync');  // Force filesystem sync
    await new Promise(r => setTimeout(r, 2000)); // Give FUSE time to flush
  } catch (_) {}
  try { await this.sandbox.destroy(); } catch (_) {}
}
```

**Fix B: Remove `process.exit(0)` from agent-runner.ts**
```typescript
// Instead of process.exit(0), let the process exit naturally
// This gives the SDK time to flush its JSONL write
```

**Fix C: Both A and B together** (recommended — belt and suspenders)

### 3. Test follow-up end-to-end
- Deploy the fix
- Run a fresh initial generation
- Verify JSONL exists in R2 after completion
- Send a follow-up and verify it resumes correctly

---

## Files Investigated

| File | What we checked |
|------|----------------|
| `cloudflare/src/durable-objects/campaign-session.ts` | Full read — `handleFollowUp()`, `runGeneration()`, `finally` block, sandbox lifecycle |
| `cloudflare/sandbox/agent-runner.ts` | `resume` option handling, `process.exit(0)`, catch block for resume failures |
| `cloudflare/src/lib/sdk-message-parser.ts` | Where `sdk_session_id` is captured from `system/init` message and saved to D1 |
| `cloudflare/src/db/campaigns.ts` | `getSdkSessionId()`, `updateSdkSessionId()` |
| `cloudflare/src/routes/images.ts` | Image serving route — constructs R2 key as `users/${userId}/images/${path}` |
| `cloudflare/sandbox/nano-banana-mcp.ts` | Image saving — `fs.writeFileSync()` to `/mnt/r2/images/` via FUSE |
| R2 Dashboard (Chrome) | Browsed all user directories, confirmed missing images/JSONL for stuck user |
| D1 (wrangler CLI) | Checked campaign status, user IDs, sdk_session_ids, campaign_files, campaign_images |

## Key Learnings

1. **`wrangler r2 object get` silently creates 0-byte files** when the key doesn't exist (exit code 0, "Download complete"). Always check file size.
2. **Multiple Clerk user IDs per person** — same person can have different Clerk user IDs across sessions. Always verify which user ID is associated with the campaign being debugged.
3. **Browser image cache survives cookie clears** — `Cache-Control: immutable` means images persist in browser cache even after clearing cookies and re-logging.
4. **FUSE `writeFileSync` is not truly synchronous to R2** — it's synchronous to the local FUSE buffer, but the actual R2 upload happens asynchronously in the background.
