# Session 62 — Usage Tracking & Credit System Implementation (2026-04-03)

## What We Did

### 1. Plan Review & Gap Analysis

Reviewed the usage tracking plan (`docs/usage-tracking-credit-system-plan.md`) against the actual codebase and identified 10 gaps:

- Pre-flight credit check placed too late (after campaign creation — creates orphan campaigns)
- `turnResult` type missing `cost` field
- `isFollowUp` detection unspecified
- Client `WSServerMessage` type missing `credits_update` event
- `WSErrorEvent` missing `code` field for `INSUFFICIENT_CREDITS`
- Missing indexes on `usage_log`
- Double-charge risk (no idempotency key, turn-result.json not deleted after finalization)
- Local dev server integration barely addressed
- Stale balance if WS drops between `complete` and `credits_update`
- Initial balance fetch location unspecified

Updated the plan with all fixes before implementation.

### 2. Full 10-Phase Implementation

All 10 phases implemented across 18 files (4 new, 14 modified):

| Phase | What | Key Files |
|---|---|---|
| 1 | Cost instrumentation — extract `total_cost_usd`, tokens, duration from SDK result | `cloudflare/sandbox/agent-runner.ts` |
| 2 | D1 schema — `user_credits` + `usage_log` tables with `UNIQUE(campaign_id, request_id)` | `cloudflare/schema.sql`, `server/lib/database.ts` |
| 3 | DB access layer — `getOrCreateCredits`, `getBalance`, `recordUsage` (batch + INSERT OR IGNORE), `addCredits` | `cloudflare/src/db/credits.ts` (new), `server/lib/db/credits.ts` (new) |
| 4 | Pre-flight check — at top of `handleGenerate` and `handleFollowUp`, before any D1 writes | `cloudflare/src/durable-objects/campaign-session.ts` |
| 5 | Post-gen deduction — in `finalizeGeneration`, detects follow-up via `requestId`, deletes turn-result.json | `cloudflare/src/durable-objects/campaign-session.ts` |
| 6 | REST API — `GET /api/credits`, `GET /api/credits/usage` | `cloudflare/src/routes/credits.ts` (new), `cloudflare/src/router.ts` |
| 7 | Client types — `WSCreditsUpdateEvent`, `code` on `WSErrorEvent`, type guard | `client/src/types/websocket.ts` |
| 8 | Store + WS hook — `creditBalance` in Zustand, handle `credits_update` + `INSUFFICIENT_CREDITS` | `client/src/store/index.ts`, `client/src/hooks/useWebSocket.ts` |
| 9 | UI — balance badge in `UserMenu`, fetch on auth-ready in `App.tsx` | `client/src/components/auth/UserMenu.tsx`, `client/src/App.tsx` |
| 10 | Local dev mirror — pre-flight + deduction in `websocket-handler.ts`, exposed instrumentor fields | `server/lib/websocket-handler.ts`, `server/lib/instrumentor.ts` |

### 3. Credit System Design

- **10 credits = $1 USD**. DB stores USD, conversion at API/WS boundary.
- New users auto-provisioned with $5.00 = **50 credits**
- Full generation: ~14 credits (~$1.39). Follow-up: ~3 credits (~$0.30)
- `CREDITS_PER_USD = 10` constant defined in `cloudflare/src/db/credits.ts` and `server/lib/db/credits.ts`
- Display: `"50 credits"` next to user avatar

### 4. D1 Migration (Staging)

Tables created on staging D1:
```bash
npx wrangler d1 execute creative-agent-db --remote --env staging --command="CREATE TABLE IF NOT EXISTS user_credits (...)"
npx wrangler d1 execute creative-agent-db --remote --env staging --command="CREATE TABLE IF NOT EXISTS usage_log (...)"
# + indexes on user_id and campaign_id
```

Production migration NOT yet run — pending successful staging test.

### 5. Deployed to Staging

Three deploys total:
1. First deploy had wrong Clerk key (`npm run build` loaded `.env.production` live key)
2. Fixed with `npm run build:staging` — Clerk sign-in working
3. Third deploy added credits-as-points conversion and moved balance fetch to `App.tsx`

Final version: `211dd2e7` at `creative-agent-staging.alphasapien17.workers.dev`

## Issues Encountered

### Clerk Login Fields Missing
- **Symptom:** Sign-in page showed branding but no input fields
- **Root cause:** `npm run build` uses Vite's default `production` mode, which loads `.env.production` containing `pk_live_*` (domain-locked to `creativemachines.xyz`). Staging domain rejected.
- **Fix:** Always use `npm run build:staging` for staging deploys
- **Saved to memory:** Added as a gotcha in `environments.md`

### Credits Not Showing After Login
- **Root cause:** Balance fetch was in `AppLayout` with `useEffect([], [])` — ran before Clerk token was available. API returned 401, `.catch()` silently swallowed it.
- **Fix:** Moved fetch to `App.tsx` inside `loadData()` which waits for `isLoaded && isSignedIn`. Added to existing `Promise.all` alongside campaigns/folders.

### DO Reset on Deploy
- Deploy reset the active DO, killing in-flight generation with `"Durable Object reset because its code was updated"`
- Expected behavior — documented in CLAUDE.md gotchas
- Resolution: Cancel stale generation, start fresh in next session

## Commits

| Hash | Description |
|---|---|
| `9b63a15` | docs: Update usage tracking plan with gap fixes |
| (not yet committed) | feat: Usage tracking & credit system — full implementation |

## Interrupted Generation (campaign_mnj66diazsdg6b — "Dailyobjects Ads")

DO reset from deploy killed the in-flight generation. State in D1:
- **Research**: saved (6,358 chars)
- **Hooks**: saved (5,281 chars)
- **Prompts**: empty (agent hadn't reached this phase)
- **Images**: none
- **Status**: stuck in `generating`
- **Credits deducted**: zero — deduction only happens in `finalizeGeneration()` which requires `turn-result.json` (written only on SDK `result` message). Agent was killed before completing, so no result, no charge. Confirms the "failed/crashed = free" edge case works.

**Next session**: Cancel this campaign (or use as source for "New Campaign from Existing" to reuse the research). Start a fresh generation to test credits end-to-end.

## Not Yet Done

- **Commit the implementation** — all changes are local, not committed
- **Test a fresh generation on staging** — verify credits deducted, balance updates in UI
- **Production D1 migration** — run CREATE TABLE on prod DB after staging verified
- **Production deploy** — build with `build:production`, deploy with `--env production`
- **Manual verification steps** from the plan (7-9): crash recovery, turn-result cleanup, local dev

## How to Trace During Testing

```bash
# Live logs
npx wrangler tail creative-agent-staging

# D1 queries
npx wrangler d1 execute creative-agent-db --remote --env staging --command="SELECT * FROM user_credits"
npx wrangler d1 execute creative-agent-db --remote --env staging --command="SELECT * FROM usage_log ORDER BY created_at DESC LIMIT 5"

# API check (needs Bearer token from browser DevTools)
curl -s -H "Authorization: Bearer <token>" https://creative-agent-staging.alphasapien17.workers.dev/api/credits
```

Look for in tail logs:
- `[credits] Pre-flight check failed` — balance check errors
- `[credits] recorded` — cost/balance after deduction
- `[credits] Failed to record usage` — deduction errors
- `cost` trace line — USD cost from SDK result message
