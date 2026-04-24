# Session 74 — Architecture Doc Drift Cleanup (Pass 0 + Pass 1 complete, Pass 2 + 3 pending)

**Date:** 2026-04-22
**Branch:** `new-ui`
**Commits landed:** `1579258`, `ad4ef18`, `8a399d9`

---

## Summary

User noticed architecture docs hadn't been updated in a while. Audited the full doc tree against code across two Explore agents + manual verification. Found ~17 sessions of drift (last doc touch was `726e885` on 2026-03-21). Landed tactical fixes (Pass 0) and the full billing docs (Pass 1). Pass 2 (streaming + DO rewrites) and Pass 3 (operational) pending.

The first audit agent got some things wrong, so there's a second layer of "what the audit got wrong" verified in this session. All facts below are verified against code, not against the audit's summary.

---

## Current commit stack (on top of 2026-04-17's `64da18c`)

```
8a399d9  docs: Fix gaps in Pass 1 billing docs — event types, CheckoutSuccess, eventsApi
ad4ef18  docs: Add BILLING.md + billing coverage in D1/REST API — Pass 1
1579258  docs: Correct immediate drift — INDEX, OVERVIEW, CLAUDE.md, stale HOME comment
```

Neither Pass 2 nor Pass 3 has been started.

---

## What landed (Pass 0 + Pass 1)

### Pass 0 — Tactical "stop lying" fixes (`1579258`)
- `INDEX.md` — last-updated bumped to 2026-04-22; dropped `waitForLog`/`waitForExit` framing from Key Numbers; split ping (25s) / agent heartbeat (30s) / alarm (10s); added zombie threshold; added drift notice; placeholders for BILLING / STAGING_PRODUCTION
- `OVERVIEW.md` — React 18 → 19 + Tailwind v4; Clerk prod + Google OAuth noted; separate staging/prod D1 and R2 named; new Streaming + Billing rows; explicit local-vs-prod divergence callout
- `CLAUDE.md` — separate staging + production deploy commands with `--env` flag; correct D1 name (`creative-agent-db-prod`); correct production URL (`creativemachines.xyz`)
- `campaign-session.ts:1335` — fixed stale `HOME=/mnt/r2` comment (HOME is `/root` since Session 58)

### Pass 1 — Billing (`ad4ef18` + gap patch `8a399d9`)
- **NEW** `docs/architecture/shared/BILLING.md` (313 lines now) — comprehensive: two-pool model, pricing table, payment flow, 8 webhook events, cost-deduction lifecycle, refund mechanics, client surface, per-env config, 10 gotchas
- `D1_DATABASE.md` — added 5 new table definitions (`user_credits`, `usage_log`, `user_subscriptions`, `payment_events`, `user_events`); added `brand` column to `campaigns`; new access-layer sections for `credits.ts`, `subscriptions.ts`, `events.ts`
- `REST_API.md` — fixed base URL; added `brand` to PATCH campaigns; rewrote `/recover` description to match current D1-first flow (dropped stale R2-marker story); new sections for Credits (2 endpoints), Payments (4), Events (1 with actual `image_download` / `download_all` event types + client signature), Webhooks (1 with all 8 events)
- `INDEX.md` — BILLING placeholder replaced with live link

---

## Drift audit findings (the full picture)

### My audits got these wrong (now corrected)
1. **Staging D1 shared with production** — WRONG. Verified separate: staging is `creative-agent-db` (`ddcd29d7…`), production is `creative-agent-db-prod` (`8128f3b2…`).
2. **Alarm interval "30s"** — WRONG. Actually **10s** (`campaign-session.ts:104, 283, 292`).
3. **11 allowed tools** — WRONG. Actually **12** in `agent-runner.ts:103-108`: Task, Skill, TodoWrite, WebFetch, WebSearch, Read, Write, Bash, Edit, Glob, Grep, `mcp__nano-banana__generate_ad_images`.
4. **`useWebSocket.ts` 471 lines** — WRONG. Actually **597 lines**.
5. **"4 completion layers (waitForLog → waitForExit → alarm polling → /recover)"** — WRONG. Both `waitForLog` and `waitForExit` are GONE from the codebase. See real completion detection below.
6. **Dodo API base URL hardcoded** — WRONG. Session 73 claim is stale; `DODO_API_BASE` is per-env wrangler var (`payments.ts:24`).
7. **"HOME=/mnt/r2 → /root" was a Dockerfile change** — WRONG. Dockerfile never sets HOME. The fix is in DO spawn args (`campaign-session.ts:1481`).
8. **"cloudflare/migrations/ has many files"** — WRONG. One file: `prod_dodo_parity.sql`. Real schema source is `cloudflare/schema.sql`.
9. **"3 completion detection layers" (my initial summary)** — wrong count, also wrong architecture. See below.

### Things the audits missed entirely
- **`user_events` table** (analytics) + `cloudflare/src/db/events.ts` + `routes/events.ts` — Session `f2e5c46`. Now documented.
- **`hasStreamedDeltas` dedup** in parser (`sdk-message-parser.ts:204-216`) — when deltas streamed, final `assistant` message's text isn't re-emitted as a `message` event. Critical for streaming doc rewrite.
- **`processedFilenames: Set<string>`** filename dedup in parser (`sdk-message-parser.ts:353-355`).
- **Dual-path tool handling** in parser — prod path uses `tool_use_event` from stream (line 85); local-dev path uses `assistant` → `tool_use` blocks (line 217). Same logic, intentional duplication.
- **`previousCostUsd` per-turn delta cost** (`agent-runner.ts:397-402`) — SDK reports cumulative cost; we compute per-turn delta before writing marker.
- **`maxBudgetUsd: 3.0`** SDK option (`agent-runner.ts:100`).
- **`includePartialMessages: true`** SDK option (`agent-runner.ts:101`) — **THE switch that enables streaming**. Without it, no `stream_event` messages. Must be front-and-center in STREAMING_PIPELINE.md.
- **Dual completion sentinels** — both `turn_complete` (generic) and `COMPLETION:${requestId}` (per-turn for follow-up) at `agent-runner.ts:418, 421`.
- **SDK double-yield dedup by UUID** — `campaign-session.ts:1282-1287`: "SDK yields each message twice (streaming + final). Skip messages we've already processed by UUID." Another critical streaming detail.

### Three Pass 2 verification questions (all answered)
1. **Does `waitForExit` exist?** NO. Neither `waitForLog` nor `waitForExit` appear in cloudflare/. Full completion architecture:
   - **Primary:** inline stdout stream-parse loop at `campaign-session.ts:1260-1293` — detects `turn_complete` or `result` message type, sets `turnDone = true`, breaks loop
   - **Post-loop:** `tryFinalize()` called immediately after the loop (Session 66 fix — eliminated alarm race)
   - **Fallback 1:** alarm (10s) calls `listProcesses()` — if agent is dead, retries `tryFinalize()`
   - **Fallback 2:** alarm detects zombie (no agent process + 5 min elapsed) → mark incomplete + friendly error
   - **Fallback 3:** client `/api/campaigns/:id/recover`

2. **Does server/ local dev match production streaming?** NO. Zero occurrences of `includePartialMessages`, `text_delta`, `stream_event`, `hasStreamedDeltas`, `tool_use_event` in any of `server/sdk-server.ts`, `server/lib/websocket-handler.ts`, `server/lib/ai-client.ts`. Local is on the pre-Session-65 model: assembled messages only, text arrives in chunks per turn, no token-level streaming.

3. **Other stale inline comments in campaign-session.ts?** Scanned, only the HOME one was clearly wrong, and that's fixed in Pass 0.

---

## Pass 2 — Streaming + DO rewrites (TO DO)

### Files to rewrite

| File | Why |
|---|---|
| `docs/architecture/cloudflare/STREAMING_PIPELINE.md` | Full rewrite — current text describes pre-Session-65 architecture. |
| `docs/architecture/cloudflare/DURABLE_OBJECT.md` | Completion detection section is architecturally wrong (waitForLog/waitForExit are gone). Credits finalization not documented. Zombie recovery missing. |
| `docs/architecture/cloudflare/DO_STATE_MACHINE.md` | Missing zombie state, `currentRequestId` field, `hasSourceResearch` flag. |
| `docs/architecture/shared/WEBSOCKET_PROTOCOL.md` | Missing `text_delta`/`text_start`/`text_end`, `tool_use_event`, `credits_update`. `status` event underspecified. |
| `docs/architecture/shared/ERROR_PROPAGATION.md` | Missing friendly error copy, fatal sandbox error detection, zombie notify-on-subscribe. |
| `docs/architecture/ops/KNOWN_ISSUES.md` | Add: local dev doesn't stream tokens; partial Dodo refunds over-deduct; subscription-refund routing to plan pool may over-deduct topup. |

### Canonical facts to include (cited by file:line, verified this session)

**Streaming — production only (local dev is on the old model)**

Enabling switch: `includePartialMessages: true` in SDK options at `cloudflare/sandbox/agent-runner.ts:101`. Without this, no stream events flow.

Agent-runner stream-event handling at `agent-runner.ts:326-375`:
- `stream_event` with `content_block_start` + `text` → emits `{type: 'text_start'}` to stdout
- `stream_event` with `content_block_delta` + `text_delta` → emits `{type: 'text_delta', delta: '...'}` to stdout
- `stream_event` with `content_block_stop` (text) → emits `{type: 'text_end'}` to stdout
- `stream_event` with `content_block_start` + `tool_use` → captures name, id, begins accumulating input JSON
- `stream_event` with `content_block_delta` + `input_json_delta` → accumulates `toolInputBuffer`
- `stream_event` with `content_block_stop` (tool_use) → parses accumulated JSON, emits `{type: 'tool_use_event', name, id, input}` to stdout

DO stream-parse loop at `campaign-session.ts:1260-1293`:
- Reads stdout line by line
- `msg.type === 'turn_complete'` or `'result'` → sets `turnDone = true`, breaks
- Dedup via `seenUuids.add(msg.uuid)` — SDK yields each message twice (streaming + final), skip by UUID
- Otherwise → `processSDKMessage(msg, ctx)` in `sdk-message-parser.ts`

Parser dedup logic at `sdk-message-parser.ts:204-216`: if any `text_delta` was streamed in this turn (`hasStreamedDeltas = true`), the final `assistant` message's text is only **accumulated** (for DB persistence) — NOT re-emitted as a `message` event. This is how duplication is avoided.

Parser has TWO paths for tool_use:
- Prod path (`sdk-message-parser.ts:85`): handles `tool_use_event` from stream events
- Local-dev path (`sdk-message-parser.ts:217`): handles `tool_use` blocks from assembled `assistant` messages

Filename dedup for images at `sdk-message-parser.ts:353-355`: `processedFilenames: Set<string>` prevents the same image firing twice when both stream and assembled paths see it.

Dual completion sentinels at `agent-runner.ts:418, 421`:
- `{type: 'turn_complete'}` — generic marker (for alarm log snapshot fallback)
- `COMPLETION:${requestId}` — per-turn marker (for follow-up completion detection)

Per-turn cost delta at `agent-runner.ts:397-402`: `previousCostUsd` tracks cumulative, `turnCost = Math.max(0, cumulativeCost - previousCostUsd)`. Written to `turn-result.json`.

**DO completion — the real 4 layers**

1. **Inline stream-parse** (`campaign-session.ts:1260-1293`) → sets `turnDone` on `turn_complete`/`result`
2. **Post-streaming `tryFinalize()`** called immediately after the loop at `campaign-session.ts:1580` (follow-up) and `1662` (initial) — Session 66 fix that eliminated the alarm race
3. **Alarm `listProcesses` check** at `campaign-session.ts:186-218` — if agent dead, calls `tryFinalize()` one more time. Runs every 10s.
4. **Client `/api/campaigns/:id/recover`** (`routes/recovery.ts`) — last resort; D1-first reconciliation (no R2 marker involved)

**Zombie detection**

At `campaign-session.ts:167-184`: if `!this.agentProcessId && !this.sandboxSetupInProgress` and `generationStartedAt > 5 min`, emit friendly error and mark incomplete. `ZOMBIE_THRESHOLD = 5 * 60 * 1000`.

Also detected on subscribe (`campaign-session.ts:1142-1150`) — if D1 says generating but no sandbox, treat as zombie, emit recovery notify message, reset `isGenerating`.

Also detected pre-generate (`campaign-session.ts:722, 876`) — safety net before attempting a new sandbox RPC.

**Credits finalization in DO**

At `campaign-session.ts:427-466`: after `tryFinalize` writes files/images, `recordUsage` is called with the per-turn cost. Result emits `credits_update` WS event with new `balance`, `plan_balance`, `topup_balance`, `cost`.

Cancel/partial at `campaign-session.ts:483`: `recordCancelledUsage` — still deducts, same idempotency guard.

**New WS events (must-add to WEBSOCKET_PROTOCOL.md)**

| Event | Shape | Notes |
|---|---|---|
| `text_start` | `{type, timestamp}` | Ephemeral, not buffered |
| `text_delta` | `{type, timestamp, delta}` | Ephemeral, not buffered |
| `text_end` | `{type, timestamp}` | Ephemeral, not buffered |
| `tool_use_event` | Not a client event — transport-only, converted to `tool_start` |
| `credits_update` | `{type, balance, plan_balance, topup_balance, cost}` | Emitted after generation finalizes |
| `status` | `{type, timestamp, message}` | Zombie notify, "Live updates paused", etc. Ephemeral. |

### What to cut from existing docs
- All mentions of `waitForLog(...)` and `waitForExit(...)` — these functions don't exist
- "4 completion paths" framed as `waitForLog → waitForExit → alarm → recover` — wrong architecture
- References to "process.exit detection" as a separate layer — it's just the alarm's `listProcesses()` check
- Any framing of streaming as "multi-path with dedup of assembled messages vs deltas" without mentioning `hasStreamedDeltas` — the dedup is asymmetric (deltas win, assembled text is only persisted to DB)

### Known issues to add to KNOWN_ISSUES.md
- **Local dev doesn't stream tokens.** Production-only since Session 65. Features tested locally should be validated on staging before deploy if they depend on token-level UX.
- **Partial Dodo refunds over-deduct** (noted in BILLING.md too). `refundCredits` uses the full original `amount_credited_usd` regardless of partial refund amount.
- **Subscription-refund routing may over-deduct topup pool.** If a user got refunded $25 of their $27.50 plan grant but already spent $20, we deduct $25 starting from plan (leaves $2.50), then $22.50 spills into topup. That's ~$22.50 of earned topup credits lost. Documented as accepted for now in BILLING.md.
- **Stale `CLAUDE.md` line counts** — says store is 1054 lines (actually 1267), `useWebSocket.ts` is 471 (actually 597). Low priority.
- **Stale `OVERVIEW.md` "37 components"** claim — the client/src/components tree is larger now. Low priority.

---

## Pass 3 — Operational (TO DO after Pass 2)

| File | Change |
|---|---|
| `docs/architecture/ops/STAGING_PRODUCTION.md` | NEW. Env matrix (worker names, D1 names, R2 bucket names, Dodo API base, Clerk instance, domain), separate deploy commands, webhook URL per env, secret rotation. |
| `docs/architecture/ops/DEPLOYMENT.md` | Fix bare `wrangler deploy` → `--env staging` / `--env production`. Add new secrets (DODO_*, etc.). List per-env var differences. Add staging vs production disciplines (test Dodo keys vs live, etc.). |
| `docs/architecture/shared/AUTH_FLOW.md` | Add Clerk production instance on creativemachines.xyz with Google OAuth. Document how staging uses Clerk test keys vs production live keys via env-aware build. |
| `docs/architecture/cloudflare/SANDBOX_CONTAINER.md` | Fix HOME framing — HOME=/root, not /mnt/r2. Document the former (pre-Session-58) reason for reference but not as current truth. |
| `docs/architecture/INDEX.md` | Replace STAGING_PRODUCTION placeholder with live link once the doc exists. |

---

## How to resume Pass 2 in the next session

### Context to load
1. Read this session doc
2. Read `docs/architecture/shared/BILLING.md` (completed Pass 1, shows the style/depth to match)
3. Read current (stale) versions of the Pass 2 target docs so you know what's changing
4. Cross-reference against source files listed below

### Source files of truth for Pass 2
```
cloudflare/src/durable-objects/campaign-session.ts   # 1944 lines — the heart
cloudflare/src/lib/sdk-message-parser.ts             # 398 lines — streaming translation
cloudflare/src/lib/event-buffer.ts                   # EventBuffer class, MAX_EVENTS=1000
cloudflare/src/lib/block-builder.ts                  # MessageBlock construction
cloudflare/sandbox/agent-runner.ts                   # 441 lines — SDK loop + stream events
cloudflare/src/routes/recovery.ts                    # 88 lines — /recover endpoint
client/src/lib/websocket-manager.ts                  # 286 lines — client WS singleton
client/src/hooks/useWebSocket.ts                     # 597 lines — client WS hook + event handling
client/src/store/index.ts                            # 1267 lines — Zustand + event-to-state logic
```

### Prerequisites already verified this session (do NOT re-verify)
- `waitForLog`/`waitForExit` don't exist (grepped whole cloudflare/)
- server/ streaming is on pre-Session-65 model (grepped for markers)
- No other obviously-stale inline comments in campaign-session.ts besides the HOME one (already fixed)
- Alarm interval is 10s (multiple confirmations)
- Zombie threshold is 5 min
- `MAX_EVENTS = 1000` in event-buffer.ts

### Suggested Pass 2 commit structure
1. `docs: Pass 2A — rewrite STREAMING_PIPELINE.md for scratch-pad model + deltas` (biggest single rewrite)
2. `docs: Pass 2B — rewrite DURABLE_OBJECT.md completion detection + credits finalization + zombie recovery`
3. `docs: Pass 2C — DO_STATE_MACHINE.md, WEBSOCKET_PROTOCOL.md, ERROR_PROPAGATION.md, KNOWN_ISSUES.md`

Or one big commit if preferred — the user previously said "one commit per step (Pass)" is their lean.

### Feedback memories that apply
- **Explain things simply** — everyday analogies, not jargon. Default to "explain like a noob" framing when documenting gotchas.
- **Always discuss before implementing** — propose the doc structure first, get approval, then write.

---

## Notes for the next session

- The INDEX.md drift notice still says "subsystem docs are being rewritten in passes." Once Pass 2 lands, that notice should be softened (only Pass 3 remaining) or removed (if Pass 3 lands same session).
- The BILLING.md placeholder in INDEX.md was replaced with a live link. The STAGING_PRODUCTION.md placeholder is still there — replace it when Pass 3 creates that doc.
- Don't forget to update INDEX.md's Documentation Map tree to reference BILLING.md (done in Pass 1) and STAGING_PRODUCTION.md (Pass 3).
- The `pending rewrite` wording in INDEX.md is a good marker — search for it to find what's still stubbed.

---

## Open strategic questions (not blocking Pass 2)

1. **Should we port streaming to local dev?** Right now features developed locally don't get token-streaming UX until deployed to staging. Session 65+ explicitly made production-only. Worth reconsidering?
2. **Should the stale `CLAUDE.md` line counts and OVERVIEW.md "37 components" be automated?** Would be easy to have a pre-commit hook count lines and update the markdown. Out of scope for doc cleanup but a candidate for a separate small effort.
3. **Should we consolidate the "stale architecture" audit process?** The drift that accumulated over 17 sessions is real. A quarterly doc-review checklist would prevent this recurring.
