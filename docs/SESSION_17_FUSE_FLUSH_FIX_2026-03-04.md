# Session 17 — FUSE Flush Fix — 2026-03-04

> Status: **Deployed (`11f1e1e2`). Needs end-to-end testing.**
> Branch: `new-ui`

---

## Goal

Confirm Session 16's FUSE sync race condition hypothesis via browser analysis, then implement fixes.

## Browser Analysis — Confirmed

Used Chrome DevTools (via Claude in Chrome) to prove images are served from browser HTTP cache, not R2:

| Request type | Result |
|-------------|--------|
| `fetch()` with auth + `cache: 'no-store'` | **404** — image NOT in R2 |
| `fetch()` without auth + `cache: 'no-store'` | **401** — auth working correctly |
| `fetch()` without auth, default cache | **200** (4.67 MB) — browser HTTP cache |
| `curl` without auth | **401** |

- Logged-in user: `user_38uxIJdRftKkSkstogHasnk6c2J` (same user Session 16 found missing from R2)
- `Cache-Control: public, max-age=31536000, immutable` causes browser to serve cached images even after hard refresh (Cmd+Shift+R only reloads the HTML page; React then re-fetches images from HTTP cache)
- Auth is working correctly — Clerk key is set, 401 returned for unauthenticated requests

## Research — s3fs-fuse Behavior

Investigated how FUSE (s3fs) actually handles writes on Cloudflare Sandbox:

- **`writeFileSync()` IS synchronous to R2** — `close()` triggers `s3fs_flush` which uploads the entire file before returning
- **Open file descriptors are the problem** — files that haven't been `close()`'d lose their writes when the container is killed
- **The SDK's JSONL file stays open** throughout the entire generation (append mode). `process.exit(0)` kills the process before `close()` fires → JSONL never uploaded
- **No built-in "safe destroy"** in Sandbox SDK — Cloudflare docs don't document any flush mechanism

Sources: s3fs-fuse FAQ, Cloudflare Sandbox Storage API docs, Sandbox Lifecycle docs

## Fixes Deployed

### Fix 1: `cloudflare/sandbox/agent-runner.ts` — Delayed exit
```
- process.exit(0);
+ setTimeout(() => process.exit(0), 5000);
```
Gives the SDK 5 seconds to close file handles (triggering s3fs upload) before exiting. Best-effort — the real guarantee is Fix 2.

### Fix 2: `cloudflare/src/durable-objects/campaign-session.ts` — Flush before destroy
```typescript
// In finally block, BEFORE sandbox.destroy():
await this.sandbox.exec('sync');           // Flush kernel buffers
await this.sandbox.unmountBucket('/mnt/r2'); // Triggers s3fs final flush
// THEN:
await this.sandbox.destroy();              // Safe to kill now
```

Timeline:
```
1. agent-runner emits "result"     → SDK done
2. 5s delay                        → SDK closing files (best-effort)
3. process.exit(0)                 → agent-runner dies, container still alive
4. exec finishes                   → DO drain loop completes
5. sandbox.exec('sync')           → flushes kernel buffers
6. sandbox.unmountBucket('/mnt/r2') → s3fs uploads everything to R2
7. sandbox.destroy()               → container killed (safe now)
```

### Fix 3: `cloudflare/sandbox/nano-banana-mcp.ts` — Write verification
```typescript
// After writeFileSync, verify the file:
const stat = fs.statSync(filepath);
if (stat.size !== buffer.length) {
  throw new Error(`Image write verification failed...`);
}
```
Catches silent FUSE write failures immediately instead of discovering missing images later.

## Next Session — Test Plan

### 1. Run a fresh initial generation
- Open https://creative-agent.alphasapien17.workers.dev/
- Send: "create 2 ads for ravilagrandhotel.in targeting business travellers"
- Wait for completion

### 2. Verify JSONL persisted to R2
```bash
# Get the SDK session ID from D1
npx wrangler d1 execute creative-agent-db --remote --command="SELECT id, sdk_session_id, status FROM campaigns ORDER BY created_at DESC LIMIT 1"

# Check R2 for JSONL file
npx wrangler r2 object get "creative-agent-assets/users/{userId}/.claude/projects/-app-agent/{sdkSessionId}.jsonl" --remote --file=/tmp/test.jsonl
ls -la /tmp/test.jsonl  # Should be >0 bytes
```

### 3. Verify images persisted to R2
```bash
# Check R2 for images (use the image filenames from the UI)
npx wrangler r2 object get "creative-agent-assets/users/{userId}/images/{filename}.png" --remote --file=/tmp/test.png
ls -la /tmp/test.png  # Should be >0 bytes
```

### 4. Test follow-up
- In the same campaign, send a follow-up: "make the text bigger and add a QR code"
- Should resume (not start fresh) — look for `[gen] SDK message: system/init` with the existing session ID
- Should complete without getting stuck

### 5. Check wrangler tail for flush logs
```bash
npx wrangler tail --format=pretty
```
Look for:
- `[gen] Flushing filesystem before sandbox destroy...`
- `[gen] R2 unmounted, FUSE flush complete`
- `Write verified: /mnt/r2/images/... (XXXX bytes)`

## Files Changed

| File | Change |
|------|--------|
| `cloudflare/sandbox/agent-runner.ts` | `process.exit(0)` → `setTimeout(() => process.exit(0), 5000)` |
| `cloudflare/src/durable-objects/campaign-session.ts` | Added `sync` + `unmountBucket` before `destroy()` in finally block |
| `cloudflare/sandbox/nano-banana-mcp.ts` | Added `statSync` verification after image `writeFileSync` |

## Deployed Version
- Version: `11f1e1e2`
- Previous: `b4099394`
- Container image: `creative-agent-sandbox:11f1e1e2`
