# Known Issues

> Part of [Architecture Documentation](../INDEX.md) | Prioritized list with status and next steps | **Last reviewed:** 2026-04-22 (Session 74)

---

## Priority: High (Affects Reliability or UX)

### 1. Large SSE frames silently drop long SDK messages

**Where:** `@cloudflare/sandbox` SDK — `parseSSEStream` helper, consumed by `streamForLiveUI` (`campaign-session.ts:1243`).

**Problem:** If a JSON payload exceeds one SSE `data:` frame (~64KB), it gets split across frames. Each fragment is attempted with `JSON.parse()` inside a `try/catch{}` — both fragments fail silently. Affects long `tool_result` messages with large content (e.g., after several follow-ups where the agent sees large accumulated context).

**Current mitigation:** `tryFinalize()` reads `/app/turn-result.json` after each turn. Images and files reconcile from disk regardless of SSE drops. Live UI may skip intermediate events but end-of-turn state is always correct.

**Fix needed:** Not actionable without SDK changes. The `turn-result.json` reconciliation is the permanent workaround and has proven reliable.

---

### 2. Local dev doesn't stream tokens or test sandbox path

**Where:** `server/`, `cloudflare/src/lib/local-ai-runner.ts`, `runGenerationLocal()` at `campaign-session.ts:1724-1814`.

**Problem:** Production-only since Session 65. Local dev path:
- Does NOT set `includePartialMessages: true`
- Zero occurrences of `text_delta`, `stream_event`, `tool_use_event` in `server/`
- Runs SDK in-process, not in a sandbox container
- Has no billing enforcement (credit table exists but is never read)
- Has no FUSE mount, no pre-flight IP check, no R2 writes via s3fs

**Impact:** Features developed locally that depend on token-level UX (fade-ins, mid-stream interactions, per-token parsing) ship broken the first time through staging. Bugs specific to sandbox paths (FUSE mount failures, IP blocks, pre-flight timeouts, DO reset recovery) can't be reproduced locally.

**Mitigation:** Always validate on staging before deploying to production. Staging is the only place that mirrors production's streaming + sandbox + billing stack end-to-end.

**Fix needed:** Port the streaming path to `local-ai-runner.ts`. Medium effort — adds parity but also maintenance surface. Open question whether it's worth the duplication given staging is cheap.

---

### 3. Partial Dodo refunds over-deduct credits

**Where:** `cloudflare/src/routes/webhooks.ts:313` — `handleRefundSucceeded`, called on `refund.succeeded` event.

**Problem:** `refundCredits` deducts the FULL original `amount_credited_usd` from the preferred pool regardless of partial refund amount. If a user got a $50 top-up ($50 credited to topup pool) and Dodo issues a $10 partial refund, we deduct $50 from the user's credits — the user loses $40 of legitimately-earned credits.

**Mitigation:** Don't issue partial refunds until this is fixed. Documented in [BILLING.md](../shared/BILLING.md#refund-mechanics) under Known Gap.

**Fix needed:** Read `data.amount` from the refund webhook payload (with currency conversion for non-USD settlements) and deduct only that amount. Small fix (~10 lines in `handleRefundSucceeded`) but requires currency handling review.

---

### 4. Subscription refund routes over-deducts topup pool

**Where:** `webhooks.ts` `handleRefundSucceeded` → `refundCredits(preferPool='plan')`.

**Problem:** If a user's $25 monthly plan grant was refunded after they'd already spent $20 of the $27.50 credited ($25 base × 1.1 bonus), we deduct $25 starting from plan pool (leaves $2.50), then $22.50 spills into topup pool. That's ~$22.50 of legitimately-earned topup credits lost.

**Mitigation:** Documented and accepted for now in [BILLING.md](../shared/BILLING.md#gotchas) gotcha #7. Low frequency event — subscription refunds are rare.

**Fix needed:** Track pool-by-pool remaining balance at refund time, only deduct from the pool that was credited. Significant lift — requires a new `credit_grants` audit table linking each grant to its origin event and tracking residual balance.

---

### 5. Container cold start ~2.5 min

**Where:** Sandbox container startup in `setupSandbox`.

**Problem:** Claude CLI initialization + first API call dominates cold-start time. Docker image is pre-built but CLI init takes the majority of the 2.5 min.

**Current mitigations:**
- `sleepAfter: '2h'` keeps containers warm for follow-ups
- Pre-compilation of agent-runner via `tsc` in Docker build saves ~30s

**Fix needed:** Investigate pre-warming containers (e.g., keep one always-on sentinel), or a lighter SDK init path. Currently punted — warm containers cover the majority of user interactions.

---

## Priority: Medium (Affects Usability / DX)

### 6. E2E tests broken with Clerk auth

**Where:** `test-e2e-*.mjs` files.

**Problem:** Tests connect without JWT → 401. Broke when auth was added.

**Fix needed:** (a) Test bypass mode, (b) Clerk test tokens in CI, or (c) dev API key system that maps to a known test user.

---

### 7. No CI/CD pipeline

**Problem:** Manual deployment via `npm run build:{staging,production} && docker logout registry.cloudflare.com; docker builder prune -af && wrangler deploy --env {env}`.

**Fix needed:** GitHub Actions: lint → build → deploy (staging) → smoke test → deploy (production, manual approval).

---

### 8. No rate limiting

**Problem:** No per-user caps on `generate` / `follow_up`. A single user can exhaust all 50 container slots.

**Fix needed:** Per-user rate limits (e.g., 10 gens/hour, 50 follow-ups/hour). D1 table + a DO-level check in `handleGenerate` / `handleFollowUp`.

---

### 9. Stale line counts + component count in CLAUDE.md / OVERVIEW.md

**Where:** `CLAUDE.md` and `docs/architecture/OVERVIEW.md`.

**Problem:**
- `CLAUDE.md` says `client/src/store/index.ts` is 1054 lines — **actually 1267**
- `CLAUDE.md` says `client/src/hooks/useWebSocket.ts` is 471 lines — **actually 597**
- `CLAUDE.md` says `cloudflare/src/durable-objects/campaign-session.ts` is 1581 lines — **actually 1945**
- `OVERVIEW.md` claims "~37 components" — actual count is larger

**Fix needed:** Low priority — these are informational, not load-bearing. Candidate for a pre-commit hook to auto-update line counts.

---

### 10. `local-ai-runner.ts` undocumented

**Where:** `cloudflare/src/lib/local-ai-runner.ts`.

**Problem:** Runs Claude SDK in-process for `wrangler dev --env dev` (with `AI_BACKEND=local`). Has its own copy of orchestrator prompt + MCP tool impl. May diverge from the sandbox version silently.

**Fix needed:** Document in architecture docs (needs its own section in [LOCAL_ARCHITECTURE.md](../local/LOCAL_ARCHITECTURE.md) or a new doc). Consider extracting shared code so the two paths can't drift.

---

## Priority: Low (Tech Debt)

### 11. No error monitoring / observability

**Problem:** No Sentry, Datadog, or structured log aggregation. Debugging relies on `wrangler tail` + Cloudflare dashboard container logs. Post-incident forensics are hard.

**Fix needed:** Wire up Sentry for unhandled errors + a structured log sink for the trace events the DO emits.

---

### 12. Stale debug endpoints in local server

**Where:** `server/sdk-server.ts`.

**Problem:** `/test`, `/generate`, `/debug/*` endpoints from early development. WebSocket is the primary interface now.

**Fix needed:** Remove dead endpoints.

---

### 13. No R2 cleanup on campaign deletion

**Where:** `DELETE /api/campaigns/:id` in `routes/campaigns.ts`.

**Problem:** Deletes D1 rows but leaves images/files in R2. Storage costs accrue forever.

**Fix needed:** List R2 prefix + delete all objects when a campaign is deleted. Low priority — storage costs are negligible at current scale.

---

### 14. Asset uploads not e2e tested

**Problem:** Asset upload stores files in R2 and serves them, but the full flow (upload → reference in generation → fal.storage round-trip → serve) hasn't been verified end-to-end in production.

**Fix needed:** Add an E2E test that uploads an asset, starts a generation with it, verifies the fal URL + sandbox path were both injected into the prompt, and confirms the generated image shows product likeness.

---

### 15. WebSocket transport 120s hardcoded timeout in SDK

**Where:** `@cloudflare/sandbox` SDK source (`index.js:1006`).

**Problem:** `requestTimeoutMs ?? 12e4` in SDK source kills long-running log watching via WebSocket transport after 2 min. Not configurable.

**Status:** We're on HTTP transport, which doesn't have this issue. Flagged for awareness.

---

## Recently resolved (Session 55-74)

Kept here for post-hoc context. Resolved issues should eventually be removed or moved to an archive.

- **Log snapshot polling (Session 39)** — `getProcessLogs` in alarm for reliable backup when SSE transport flakes
- **Agent crash detection (Session 39)** — was `waitForExit`, now `alarm listProcesses` (Session 65+ rewrite)
- **Single-tab WebSocket (Session 39)** — broadcast via `getWebSockets()` to all tabs
- **Debug diagnostics overhead (Session 39)** — replaced `sendWS` with `this.log()` (wrangler-tail-only)
- **Stuck follow-up from canceled RPC (Session 55)** — `timedRPC` 60s timeout, `sandboxSetupInProgress` flag, 5-min zombie detection
- **Campaign switching context contamination (Session 55)** — `agentCampaignId` in DO storage, checked before fast path
- **Stale `turn-result.json` across campaigns/turns (Session 55)** — `tryFinalize` validates both `campaignId` and `requestId`
- **SDK JSONL null-byte corruption (Session 55)** — `RESUME_SDK_SESSION_ID` always empty string on Cloudflare
- **s3fs mount failure on campaign switch (Session 53)** — `umount -l` (lazy) replaces `umount -f`
- **HOME=/mnt/r2 pinning FUSE mount (Session 58)** — HOME now `/root`; FUSE handles come only from agent output files
- **Pre-Session-65 streaming architecture (Sessions 65-67)** — `waitForLog` / `waitForExit` / `attachStreamHandler` all removed; inline `streamForLiveUI` + post-streaming `tryFinalize` replace them
- **Alarm race window at turn end (Session 66)** — `tryFinalize` now called inline immediately after `streamForLiveUI` returns, before the next alarm tick
- **Billing system ship (Sessions 62, 70-73)** — credit deduction, Dodo Payments webhooks, two-pool model
- **Doc drift accumulated over 17 sessions (Session 74)** — Pass 0 + Pass 1 billing docs landed in `1579258`, `ad4ef18`, `8a399d9`; Pass 2 (this session) rewrote streaming/DO/state-machine/WS-protocol/errors/this-file

---

## See Also

- [Debugging](./DEBUGGING.md) — how to investigate production issues
- [Deployment](./DEPLOYMENT.md) — deploy process, gotchas
- [Durable Object](../cloudflare/DURABLE_OBJECT.md) — completion detection, zombie recovery
- [Streaming Pipeline](../cloudflare/STREAMING_PIPELINE.md) — SSE frame split issue origin
- [Billing](../shared/BILLING.md) — refund gotchas (issues #3, #4)
