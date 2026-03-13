# Known Issues

> Part of [Architecture Documentation](../INDEX.md) | Prioritized list with status and next steps

---

## Priority: High (Affects Reliability)

### 1. `waitForLog` hangs silently on RPC disconnect

**Where:** `campaign-session.ts` — `waitForLog('turn_complete')`

**Problem:** Uses HTTP SSE internally. If TCP connection drops without clean close (e.g., browser refresh), `reader.read()` blocks forever. No error, no reject. Only the outer timeout fires.

**Current mitigation (Session 39):** Four independent detection layers:
1. `waitForLog` re-attach (10 retries on SSE timeout)
2. `waitForExit` — instant crash detection
3. Alarm polling: R2 marker + log snapshot (`getProcessLogs`) every 30s
4. Client `/recover` endpoint as last resort

2-hour timeout as ultimate safety net.

**Status:** Effectively mitigated. The `getProcessLogs` log snapshot in the alarm is the most reliable backup — simple HTTP GET, no SSE dependency.

---

### 2. `parseSSEStream()` silently drops long messages

**Where:** `@cloudflare/sandbox` SDK (NOT our code — `dist/index.js:2489`)

**Problem:** If a JSON payload exceeds one SSE `data:` frame (~64KB), it gets split across frames. `parseSSEStream` tries `JSON.parse()` on each fragment separately — both fail silently (`catch {}`). Affects long `tool_result` messages with large content (especially after several follow-ups when conversation context grows).

**Current mitigation:** `reconcileImages()` and `reconcileFiles()` read `/app/turn-result.json` after each turn — catches any data missed by SSE.

**Fix needed:** Not actionable without SDK changes. The reconciliation pattern is the permanent workaround.

---

### 3. ~~`writeCompletionMarker()` scans ALL user images~~ (FIXED)

**Where:** `cloudflare/sandbox/agent-runner.ts`

**Problem:** Previously scanned `/mnt/r2/images/` which includes ALL campaigns for the user.

**Fix deployed:** `writeCompletionMarker()` now reads from `/app/generated-images.jsonl` — a tracking file written by the nano-banana MCP tool (`appendFileSync` per image). After each turn, the tracking file is cleared (`writeFileSync(trackingFile, '')`). No directory scanning. See `agent-runner.ts` lines ~106-123.

---

## Priority: Medium (Affects Usability / DX)

### 4. E2E tests broken with Clerk auth

**Where:** `test-e2e-*.mjs` files

**Problem:** Tests connect without JWT → 401. Worked before auth was added.

**Fix needed:** Either (a) test bypass mode, (b) real Clerk test tokens, or (c) a dev API key system.

---

### 5. No CI/CD pipeline

**Problem:** Deployment is manual: `npm run build && docker prune && wrangler deploy`.

**Fix needed:** GitHub Actions workflow for: lint → build → deploy (staging) → smoke test → deploy (production).

---

### 6. No production Clerk setup

**Problem:** Still using Clerk test keys. Production requires custom OAuth credentials + DNS CNAME records.

**Fix needed:** Set up production environment in Clerk dashboard, configure DNS, rotate keys.

---

### 7. Container cold start ~2.5 min

**Where:** Sandbox container startup

**Problem:** Claude CLI init + first API call dominates startup time. Pre-compilation saves ~30s but CLI init dominates.

**Mitigations in place:** `sleepAfter: '2h'` keeps container warm for follow-ups.

**Fix needed:** Investigate if pre-warming containers is possible, or if a lighter SDK initialization path exists.

---

### 8. No rate limiting

**Problem:** No limits on API calls or generations per user. A single user could exhaust all 50 container slots.

**Fix needed:** Per-user rate limits on `generate` and `follow_up` actions.

---

### ~~9. Debug diagnostics retained in campaign-session.ts~~ (FIXED)

**Where:** `campaign-session.ts`

**Fix deployed (Session 39):** Removed DO-side API key test block (~8s overhead). Replaced all `[debug]` `sendWS()` calls with `this.log()` (visible in `wrangler tail` only, not sent to client). The sandbox pre-flight IP check is retained (necessary for container IP blocking).

---

### 9a. s3fs mount failure after cancel (8ms race condition)

**Where:** `campaign-session.ts` — R2 mount sequence after cancel

**Problem:** After cancelling a campaign, `pkill -9 s3fs` + `umount` runs, then `mountBucket()` follows 8ms later. The kernel-level unmount may not have propagated — `mountBucket` fails with `Success: false`.

**Mitigation deployed (Session 24):** `unmountBucket('/mnt/r2')` is now called in the `finally` block of both `runGeneration` and `runFollowUpFast`. Before re-mounting, the setup sequence calls `sandbox.unmountBucket('/mnt/r2')` (try/catch) followed by `pkill -9 s3fs; umount -f; fusermount -u; rm -rf /mnt/r2; mkdir -p /mnt/r2`. This reduces but may not fully eliminate the race.

**Remaining risk:** Kernel-level unmount propagation delay could still cause `mountBucket` to fail in rare cases. A small delay or `mountpoint -q` check would fully close the gap.

---

### 9b. `local-ai-runner.ts` undocumented (376 lines)

**Where:** `cloudflare/src/lib/local-ai-runner.ts`

**Problem:** Runs Claude SDK in-process for `wrangler dev --env dev` (with `AI_BACKEND=local`). Has its own copy of the orchestrator prompt and MCP tool implementation. May diverge from the sandbox version.

**Fix needed:** Document in architecture docs and consider extracting shared code.

---

## Priority: Low (Tech Debt)

### 10. No error monitoring

**Problem:** No Sentry/Datadog. Debugging relies on `wrangler tail` + dashboard container logs.

---

### 11. Stale debug endpoints in local server

**Where:** `server/sdk-server.ts`

**Problem:** `/test`, `/generate`, `/debug/*` endpoints from early development. WebSocket is the primary interface.

**Fix needed:** Remove dead endpoints.

---

### 12. No R2 cleanup on campaign deletion

**Where:** `DELETE /api/campaigns/:id`

**Problem:** Deletes DB records but leaves images/files in R2. R2 costs accrue over time.

**Fix needed:** Delete R2 objects when campaign is deleted (list prefix → delete all).

---

### 13. Asset uploads not thoroughly tested e2e

**Problem:** Asset upload stores files in R2 and serves them, but the full flow (upload → reference in generation → serve) hasn't been verified end-to-end in production.

---

### 14. WebSocket transport 120s hardcoded timeout

**Where:** SDK source (`index.js:1006`)

**Problem:** `requestTimeoutMs ?? 12e4` in SDK source kills `waitForLog` after 2 min. Not configurable. Makes WebSocket transport unusable for long-running log watching.

**Decision:** Stuck with HTTP transport. Not actionable without SDK changes.

---

## Resolved Issues (for reference)

These were fixed in sessions 10-33. Kept here for context:

- WS component transition killing connection (Session 10) — 200ms grace period
- DO reset losing all state (Session 11) — persist to `this.state.storage`
- userId mismatch on DO reset (Session 11) — restore from storage + header priority
- DO hibernation killing background promises (Session 14) — alarm heartbeat
- `<img>` tags not sending auth headers (Session 15) — `AuthImage` component
- FUSE not flushing to R2 on destroy (Session 17) — `sync` + `unmountBucket`
- Stale `streamProcessLogs` replaying all stdout (Session 27) — `turn_start` sentinel
- SSE framing dropping long SDK messages (Session 28) — `reconcileImages` + `reconcileFiles` from `turn-result.json`
- Cancel race condition (Session 29) — abort signal pattern (cancel only sets signal)
- `file.contents` typo (Session 31) — fixed to `file.content` in 3 places (reconcileImages, reconcileFiles, isAgentProcessAlive)
- `waitForLog` as single completion path (Session 31) — replaced stream-based completion
- R2 alarm polling for completion (Session 33) — `pollR2CompletionMarker` every 30s
- Stuck `isGenerating` after DO reset (Session 29) — staleness check in `restoreSession()`
- Single-tab WebSocket (Session 39) — broadcast via `getWebSockets()` to all tabs
- Debug diagnostics overhead (Session 39) — replaced `sendWS` with `this.log()`
- Agent crash detection (Session 39) — `waitForExit()` for instant detection
- Log snapshot polling (Session 39) — `getProcessLogs()` in alarm for reliable backup

---

## See Also

- [Debugging](./DEBUGGING.md) — How to investigate production issues
- [Deployment](./DEPLOYMENT.md) — Deploy process and gotchas
