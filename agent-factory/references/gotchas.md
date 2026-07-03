# Production Agent Gotchas on Cloudflare

Battle-tested lessons from 55+ debugging sessions building an AI agent system on Cloudflare Workers + Durable Objects + Sandbox Containers + R2. Each one cost real debugging time.

---

## Critical (Will Break Your System)

### 1. DO resets lose ALL in-memory state

Code deploys trigger Durable Object resets. Every instance variable (`isGenerating`, sandbox references, event buffers) becomes `undefined`. Active generations silently disappear with no error.

**Fix:** Persist critical state to `this.state.storage` on every mutation. Restore it at the top of every handler. Treat in-memory state as a cache, not the source of truth.

### 2. Two getSandbox() connections cancel each other's RPCs

The Sandbox DO treats a second connection as a replacement and cancels all in-flight RPCs on the first. Your alarm handler reconnecting while setup is running will silently kill the setup.

**Fix:** Use a `sandboxSetupInProgress` flag. Check it in the alarm handler before calling `getSandbox()`.

### 3. unmountBucket() before mountBucket() on container reuse

If a sandbox container was reused from a previous generation, `mountBucket()` fails with `InvalidMountConfigError` because the previous mount is still registered.

**Fix:** Always call `sandbox.unmountBucket('/mnt/r2')` before `mountBucket()`, wrapped in try/catch for the not-mounted case.

### 4. waitUntil() is a no-op in Durable Objects

Only works in regular Workers. With the Hibernation API, the DO runtime destroys the class instance after the handler returns if no alarm is pending. All background promises die silently.

**Fix:** Use alarm heartbeats. Call `this.state.storage.setAlarm(Date.now() + 30_000)` before starting fire-and-forget work. In `alarm()`, reschedule while work is in progress. The alarm self-terminates when the generation flag is false.

### 5. s3fs uploads on close()/fsync()/unmount -- NOT on Linux sync

`writeFileSync` is safe because it opens, writes, and closes the fd. But open file descriptors (like SDK JSONL log files) only upload to R2 when the fd is closed, fsync'd, or the mount is unmounted. The Linux `sync` command only flushes kernel buffers to s3fs -- it does NOT trigger the s3fs-to-R2 upload.

**Fix:** Always call `unmountBucket()` before `sandbox.destroy()`. This is the only guaranteed flush for all open files.

### 6. SDK JSONL via s3fs gets null-byte corruption

s3fs pre-allocates file size with `\x00` bytes, then writes content. If you read the file mid-flush, you get null bytes mixed into valid JSON. This makes SDK session resume (`RESUME_SDK_SESSION_ID`) completely unreliable on Cloudflare.

**Fix:** Never use SDK session resume on Cloudflare. Use D1 conversation history + file hydration as your context source. Reconstruct the agent's context from your own database, not from the SDK's JSONL.

### 7. handleCancel must NOT kill processes directly

If cancel kills `this.agentProcessId` during the setup phase, `agentProcessId` still points to the PREVIOUS campaign's agent. The new agent starts after cancel completes and is never killed -- it holds the R2 mount and blocks the next generation.

**Fix:** Cancel should only set an abort signal. Let the generation function check the signal and handle cleanup in its own `finally` block, since it knows which process it started.

---

## Important (Will Cause Subtle Bugs)

### 8. streamProcessLogs() replays ALL historical stdout

Despite the name suggesting real-time streaming, the server replays the entire accumulated stdout buffer on each call. If you re-attach after a reconnect, you process every message twice.

**Fix:** Write a `turn_start` sentinel marker at the beginning of each turn. On re-attach, skip everything before the latest sentinel.

### 9. parseSSEStream() silently drops long messages

If a JSON payload exceeds one SSE `data:` frame, it gets split across frames. Each fragment fails `JSON.parse()` independently, both are silently dropped in a `catch {}`. No error, no warning.

**Fix:** Use filesystem-based reconciliation (`turn-result.json`) as the reliable data path for large payloads. Don't rely on SSE for anything that might exceed ~64KB.

### 10. this.userId only set from headers during fetch()

After a DO reset, `webSocketMessage()` has no access to the original HTTP headers. The userId reverts to whatever was persisted (or `undefined`). Campaign queries filter by `user_id`, so mismatches cause silent failures.

**Fix:** Persist userId to `this.state.storage` immediately during `fetch()`. On restore, never overwrite a fresh header userId with a stale stored one.

### 11. Wrangler secrets have trailing newlines

API keys set via `wrangler secret put` silently include trailing newlines. This causes auth failures that look identical to wrong credentials.

**Fix:** Always pipe through `tr -d '\n'`: `echo -n "value" | npx wrangler secret put KEY` or `pbpaste | tr -d '\n' | npx wrangler secret put KEY`.

### 12. Each deploy resets active DOs

Deploys have two propagation phases: Worker code updates in seconds, container image push takes ~2 minutes. Each phase triggers DO resets independently. An in-flight generation will be interrupted twice.

**Fix:** Never deploy during an active generation. Wait for full rollout (check `wrangler containers info`) before testing.

### 13. Docker build cache prevents image updates

Wrangler checks if the container image already exists remotely. If Docker's build cache produces the same layer hashes, wrangler skips the push -- your code changes don't deploy.

**Fix:** Run `docker builder prune -af` before every `wrangler deploy`.

### 14. img tags don't send auth headers

Plain `<img src="/api/images/...">` sends a GET request with no Authorization header. If your images are behind auth, you get a 401 with a broken image icon and no console error.

**Fix:** Use an `AuthImage` component that fetches via `fetch()` with a Bearer token, creates a blob URL with `URL.createObjectURL()`, and sets that as the `src`.

### 15. Anthropic blocks some Cloudflare container IPs

Certain Cloudflare container IP subnets (e.g., `104.28.157.x`) are consistently blocked by Anthropic's API with a 403. You won't know until runtime.

**Fix:** Implement a pre-flight IP check after R2 mount: call the Anthropic API from inside the container. If 403, destroy the sandbox and create a new one with a unique ID suffix (e.g., `user-{id}-v2-{Date.now()}`). Max 3 attempts.

### 16. turn-result.json can contain data from a previous campaign

If a warm container serves multiple campaigns sequentially, `turn-result.json` persists between turns. The file may contain image paths or hook data from the previous campaign.

**Fix:** Always include `campaignId` in `turn-result.json` and validate it matches the current campaign before consuming the data.

---

## Good to Know (Save You Time)

### 17. Container cold start is ~2.5 minutes

Dominated by Claude CLI initialization and MCP server startup. Pre-compiling TypeScript saves ~30 seconds but doesn't change the fundamental bottleneck.

**Fix:** Use `sleepAfter: '2h'` to keep containers warm. Follow-up turns on warm containers take ~30-60 seconds instead of ~3 minutes.

### 18. wrangler tail buffers long handlers

`console.log` inside a DO only appears in `wrangler tail` when the handler returns. For fire-and-forget operations that run for minutes, you see nothing.

**Fix:** Buffer logs to an array (`this.tailLogs.push(msg)`). Flush them in the `alarm()` handler, which runs every 30 seconds. Logs appear in tail batched but visible.

### 19. placement.region does NOT control container placement

`placement.region` in `wrangler.jsonc` only controls Worker placement. `getSandbox()` calls `getContainer()` which calls `binding.get()` without a `locationHint` parameter. Container region is determined by Cloudflare internally.

**Fix:** No workaround exists. Be aware that your container may not be co-located with your Worker.

### 20. wrangler tail "Ok" does not mean HTTP 200

"Ok" means the Worker completed without an uncaught exception. A 401, 403, or 500 response still shows "Ok" in the tail output.

**Fix:** Always check the actual HTTP status code. Don't use `wrangler tail` output as a health signal.

### 21. No wrangler r2 list command

There is no CLI command to list objects in an R2 bucket. You need exact key paths.

**Fix:** Store all R2 key paths in D1 when writing objects. Query D1 to discover what's in R2.

### 22. wrangler r2 object get silently creates 0-byte files

When the requested key doesn't exist, the command exits with code 0 and prints "Download complete". The output file is 0 bytes.

**Fix:** Always check file size after `wrangler r2 object get`. Never trust the exit code or output message.

### 23. Browser HTTP cache hides missing R2 data

`Cache-Control: public, max-age=31536000, immutable` means the browser serves images from its disk cache even after a hard refresh. You may think R2 has the data when it doesn't.

**Fix:** Use `fetch(url, { cache: 'no-store' })` to bypass the cache when debugging. Or test in an incognito window.

### 24. Docker keychain credential conflict

If `wrangler deploy` fails with "error saving credentials...already exists in keychain", Docker's credential store has a stale entry for the Cloudflare registry.

**Fix:** Run `docker logout registry.cloudflare.com` before retrying `wrangler deploy`.

---

## Quick Reference

| # | Gotcha | One-line fix |
|---|--------|-------------|
| 1 | DO resets lose state | Persist to `this.state.storage`, restore in every handler |
| 2 | Two getSandbox() kills RPCs | Guard with `sandboxSetupInProgress` flag |
| 3 | mountBucket fails on reuse | Always unmountBucket first (try/catch) |
| 4 | waitUntil is no-op in DO | Use alarm heartbeats (30s interval) |
| 5 | sync doesn't flush s3fs to R2 | Call unmountBucket before destroy |
| 6 | s3fs JSONL gets null bytes | Use D1 for context, not SDK JSONL |
| 7 | Cancel kills wrong process | Set abort signal only, let generation clean up |
| 8 | Log replay on reconnect | Use turn_start sentinel markers |
| 9 | SSE drops large payloads | Use turn-result.json for large data |
| 10 | userId lost after DO reset | Persist on fetch, never overwrite fresh with stale |
| 11 | Secrets have trailing newlines | Pipe through `tr -d '\n'` |
| 12 | Deploys reset active DOs | Don't deploy during generation |
| 13 | Docker cache skips push | `docker builder prune -af` before deploy |
| 14 | img tags skip auth | Use AuthImage with fetch + blob URL |
| 15 | Some container IPs blocked | Pre-flight API check, retry with new sandbox ID |
| 16 | Stale turn-result.json | Validate campaignId before consuming |
| 17 | 2.5 min cold start | `sleepAfter: '2h'` for warm containers |
| 18 | tail buffers long handlers | Buffer logs, flush in alarm handler |
| 19 | placement.region ignored | No fix, containers placed by Cloudflare |
| 20 | tail "Ok" isn't HTTP 200 | Check actual status codes |
| 21 | No r2 list command | Track R2 keys in D1 |
| 22 | r2 get creates 0-byte files | Check file size after download |
| 23 | Cache hides missing R2 data | `fetch()` with `cache: 'no-store'` |
| 24 | Docker keychain conflict | `docker logout registry.cloudflare.com` |
