# Session 92 — Credit usage tracking + S84-S92 prod deploy

**Date:** 2026-05-04
**Branch:** `new-ui` @ `4f97705` (pushed to `origin/new-ui`)
**Staging:** ✅ deployed multiple times — final `6e47bd86-8d4c-4d3c-bc65-0a0f6a4d0e68`
**Production:** ✅ **DEPLOYED** — final `14d5d7d6-36f3-4eb9-ad5f-6127e9589453` (creativemachines.xyz) — S84 → S92 bundle shipped together
**Node version for deploy:** **v20** (Node 23 still broken — `nvm use 20` always)

> This session shipped the credit usage tracking plan from `docs/PLAN_CREDIT_USAGE_TRACKING_2026-05-04.md` end-to-end, then bundled it with the 8-session backlog (S84-S91) into a single production deploy. It also includes a column rename done at the very end to remove a footgun discovered during Phase 0.5.

---

## Combined TL;DR

| Area | What changed | Verified? |
|---|---|---|
| **P0 — COGS leak hotfix** | `/api/credits/usage` was spreading every `usage_log` field, exposing claude_cost_usd, image_cost_usd, total_cost_usd, tokens, num_turns, duration_ms — anyone signed in could reverse-engineer gross margin. Replaced with explicit DTO. | ✅ verified on staging via Chrome JS fetch |
| **P0.5 — Multiplier semantics** | Investigated whether `COST_MULTIPLIER = 4` was actually wired. **It is.** Production code computes `chargedCost = rawCost × 4` and writes that to the column. Plan's hypothesis ("multiplier might be unwired") was wrong. | ✅ confirmed by D1 sample: every row has `total_cost_usd / (claude+image) = 4.0` |
| **P1 — Schema + summary endpoint** | Added `credits_charged REAL` column with backfill. Added `getUsageSummary()` query and `/api/credits/usage/summary?since=ISO` endpoint. JOINed `campaigns` so DTO surfaces `campaign_name`. | ✅ verified — 393.2 credits / 18 campaigns / 137 entries since April 1 on staging |
| **P2 — UsageDrawer UI** | New 480px slide-over (Radix Sheet) with balance + monthly summary card, paginated activity list, "Show more", loading/empty/error states. Wired into AssetDrawer popover and CreditBadge dropdown. Mounted at AppLayout. | ✅ verified end-to-end on staging including "Deleted campaign" labels for 49 orphaned rows |
| **P3 — Production migration + deploy** | Diffed staging vs prod schemas: prod was missing `campaigns.brand` (S84 era) AND `usage_log.credits_charged` (today). Applied both migrations on prod D1 first, then bundled S84→S92 into one deploy. | ✅ creativemachines.xyz health green |
| **Bonus — column rename** | `total_cost_usd` was misleading (read like "total of cost components"; actually stored user-charged amount). Renamed → `charged_amount_usd` end-to-end (DB + types + INSERT/UPDATE + call sites + route fallback). Both staging + prod migrated. | ✅ shipped to staging + prod |

---

## Decisions locked (do not relitigate)

| # | Decision | Why |
|---|---|---|
| D1 | `credits_charged` is **REAL not INTEGER** (the plan locked INTEGER but staging data showed ~half the rows are sub-credit research turns; INTEGER would round real charges to "0"). | Honest display matters more than visual cleanliness for sub-credit rows. |
| D2 | Orphaned `usage_log` rows (campaign deleted, no FK cascade) render as **"Deleted campaign"**, NOT hidden. | 30% of staging rows are orphans; hiding would break total reconciliation. |
| D3 | UsageDrawer state (`usageDrawerOpen`) **NOT** in Zustand persist allowlist — pure ephemeral UI. | Matches S91 mental model — keep persist tight. |
| D4 | Surface `campaign_name` via LEFT JOIN, not stored on the row. | Avoids stale-name issues; campaigns can be renamed. |
| D5 | Phase 0 hotfix shipped **standalone** ahead of P1+P2 — closed the live data leak immediately. | The COGS leak was production-live and unbounded; couldn't wait for the full feature to land. |
| D6 | Column rename done at the end, not skipped. | Comment fix wasn't enough — the trap (`total_cost_usd` reads like sum of components) would bite future devs. |

---

## Cost flow (now lives in `cloudflare/src/db/credits.ts`)

```
turnResult.cost.totalCostUsd  ← Claude SDK's raw cost (claudeCost)
+ imagesAdded × $0.15         ← raw image cost (imageCost)
= rawCost                     ← raw COGS

chargedCost = rawCost × COST_MULTIPLIER (4×)

recordUsage({
  claudeCostUsd: claudeCost,        → claude_cost_usd       (raw)
  imageCostUsd:  imageCost,         → image_cost_usd        (raw)
  chargedAmountUsd: chargedCost,    → charged_amount_usd    (USER CHARGE)
  creditsCharged: chargedCost × 10, → credits_charged       (USER CHARGE in credits, frozen)
  ...
})

UPDATE user_credits SET balance_usd = balance_usd - chargedAmountUsd
```

**Schema after the rename:**
- `claude_cost_usd` — raw Claude tokens cost
- `image_cost_usd` — raw fal.ai cost
- `charged_amount_usd` — user-facing charge in USD (= raw × 4)
- `credits_charged` — same charge in credits (= charged_amount_usd × 10)

---

## What shipped to production today (the S84-S92 bundle)

Production was at S83 before today. Single deploy bundle:

| Session | What |
|---|---|
| S84 | Payment gating + signup→checkout flow + $5 wedge top-up |
| S85 | Live streaming fixes (research streams live + one-image-per-call) |
| S86 | Workspace empty-state UX overhaul (editorial welcome hero) |
| S87 | Welcome hero flicker fix + stranded-campaign recovery |
| S88 | Workspace redesign Phases 1-2 (inset shell + sidebar redesign) |
| S89 | Workspace redesign Phases 3-4 (editorial canvas + lightbox + Sage chat panel) |
| S90 | Chat panel polish (drop bubble, timestamps, Sage tagline) |
| S91 | Persistent campaign state refactor + data-driven UI dispatch |
| **S92** | **Today** — credit usage tracking + column rename |

**Schema migrations applied on prod D1:**
1. `ALTER TABLE campaigns ADD COLUMN brand TEXT` (S84-era — never had landed)
2. `ALTER TABLE usage_log ADD COLUMN credits_charged REAL`
3. `UPDATE usage_log SET credits_charged = ROUND(total_cost_usd * 10, 1) WHERE credits_charged IS NULL` (3 rows backfilled)
4. `ALTER TABLE usage_log RENAME COLUMN total_cost_usd TO charged_amount_usd`

---

## Operational gotchas hit (and how)

### 1. Deploy chain silently ships stale bundle on build failure

The CLAUDE.md deploy command is:
```
cd client && npm run build:production && docker logout registry.cloudflare.com; docker builder prune -af; cd ../cloudflare && npx wrangler deploy --env production
```

The `;` between `docker logout` and `docker builder prune` means **a vite build failure does NOT halt wrangler** — wrangler ships whatever's in `client/dist/` from the last successful build. We hit this on staging during P2: `use-sidecar` was partially-deleted in `node_modules` (only `dist/`, no `package.json`), vite failed, wrangler shipped the stale bundle.

**Fix:** verify the dist contains your new symbols before letting wrangler ship:
```bash
grep -c "openUsageDrawer" client/dist/assets/index-*.js   # > 0 expected
```

Saved as memory: `feedback_deploy_chain_silent_failure.md`.

### 2. Cursor leaves stale git lock files on crash

Saw three this session: `HEAD.lock`, `refs/heads/new-ui.lock`, `refs/remotes/origin/new-ui 2`. All from a previous Cursor crash 52h+ ago. Pattern: empty file, May 2 timestamp. Safe to remove if you confirm no live `git` process is running.

### 3. Wrangler `/containers/me` flake on first prod deploy

First prod deploy attempt failed with `Unauthorized` on `https://api.cloudflare.com/client/v4/accounts/.../containers/me` — but auth was valid (staging deployed fine 30 min earlier with the same token). Retry succeeded. Treat as transient; just retry.

### 4. Node 23 still broken for wrangler

S85+ docs flagged this and it persisted into S92. `nvm use 20` is mandatory before any wrangler command on this machine.

---

## Memory notes saved this session

- `feedback_deploy_chain_silent_failure.md` — the silent-stale-bundle footgun above

---

## Open follow-ups (low priority)

- **Local server `COST_MULTIPLIER = 5` mismatch** — `server/lib/websocket-handler.ts:812, 1267` hardcodes `5x`, while production (`cloudflare/src/db/credits.ts:7`) is `4x`. Local-dev only impact, but inconsistent. Either align on 4x or extract to a shared module.
- **Refunds don't write to `usage_log`** — `refundCredits` (`cloudflare/src/db/credits.ts:119`) updates `user_credits` but doesn't insert a `usage_log` row. Drawer can show a discrepancy if a beta client gets a refund. Plan punted this to v1.5; revisit when the first refund happens.
- **No CSV export, no charts, no filters in UsageDrawer** — punted in plan. Add only if beta clients ask.
- **No admin margin dashboard** — solo founder + wrangler CLI is enough. Revisit when team > 1.
- **Local SQLite migration for developers** — anyone with existing local data needs `ALTER TABLE usage_log RENAME COLUMN total_cost_usd TO charged_amount_usd` on their SQLite. Not enforced; flagged in the rename commit.

---

## Architectural decisions

### Why the schema migration was decoupled from the deploy

The production deploy plan ran the schema migration **before** any code change. Old prod code didn't reference `credits_charged`, so adding the column was a no-op for production behavior. This decoupled two distinct risks:
- Schema risk (DDL fails)
- Code risk (worker deploy fails)

Migration runs hours/days before code can. If something goes sideways during the deploy, the schema is already proven, rollback target is the previous worker version, no DB state to untangle.

For the column rename, the same principle applied but inverted: the rename and the code update have to be near-simultaneous because the rename invalidates old code references. Pre-launch (zero traffic), this is fine.

### Why decimal credits, not integer

The plan locked INTEGER (D5: "Credits are user-facing whole numbers"). But staging data showed ~half of all `usage_log` rows are research-only turns charging $0.01-$0.04 (under 0.5 credits). With INTEGER + ROUND, those would display as "0 credits" — confusing ("why is this row even listed?") and inaccurate (a real charge appears as nothing).

REAL with one decimal preserves the truth ("1.2 credits") and matches the precision of the existing `CreditBadge` display. `formatCredits()` in UsageDrawer hides trailing `.0` for whole-credit charges to keep visuals clean.

### Why "Deleted campaign" not hidden orphans

Per `cloudflare/src/db/campaigns.ts:92`, the `deleteCampaign` route hard-deletes from `campaigns`. `usage_log` has no FK cascade, so the row orphans. `LEFT JOIN campaigns` returns null for `campaign_name`.

On staging, **49 of 163 rows (~30%)** are orphans. Hiding them would mean: drawer total ≠ `total_spent`, summary "this month" ≠ deductions. Breaks billing transparency.

Showing the campaign_id (truncated) is ugly. "Deleted campaign" is honest, matches the user's mental model ("oh right, I deleted that one"), and keeps totals reconciling.

### Why rename the column rather than just fix the comment

The original comment in `cloudflare/src/db/credits.ts:6` said: *"4x cost multiplier = 75% gross margin. Raw COGS stays in usage_log for visibility."* That comment is technically true but misleading — only the per-component columns hold raw COGS; `total_cost_usd` holds the multiplied charge. Naming three columns `*_cost_usd` and assuming `total = sum` is the natural read.

Updated comment first; later realized the trap is in the *name*, not the comment. Renamed `total_cost_usd → charged_amount_usd` to make the role self-documenting:
- `*_cost_usd` reliably means raw cost
- `charged_*` reliably means user charge

---

## Files touched this session

```
docs/PLAN_CREDIT_USAGE_TRACKING_2026-05-04.md       (new — the plan that drove the work)

Schema:
cloudflare/schema.sql                                + credits_charged, comment, rename
server/lib/database.ts                               + credits_charged, rename

Backend (Cloudflare):
cloudflare/src/db/credits.ts                         types, INSERT, UPDATE, getUsageSummary, rename
cloudflare/src/durable-objects/campaign-session.ts   creditsCharged, rename @ 444 + 501
cloudflare/src/routes/credits.ts                     DTO hotfix, /usage/summary, fallback rename

Backend (local server):
server/lib/db/credits.ts                             mirror of Cloudflare changes
server/lib/websocket-handler.ts                      pass creditsCharged @ 824 + 1280, rename

Frontend:
client/src/lib/api.ts                                ApiUsageEntry, ApiUsageSummary, getUsageSummary
client/src/lib/usage-labels.ts                       (new — event_type + campaign_name labels)
client/src/components/billing/UsageDrawer.tsx        (new — slide-over component)
client/src/components/auth/UserMenu.tsx              "Usage" entry in CreditBadge dropdown
client/src/components/assets/AssetDrawer.tsx         "Usage" entry in popover (HistoryIcon)
client/src/store/index.ts                            usageDrawerOpen + setters (NOT persisted)
client/src/App.tsx                                   <UsageDrawer /> mounted at root
```

---

## Commits to push (already done)

```
c557f89 fix(credits): stop leaking raw COGS through /api/credits/usage          ← P0
05ab01a feat(credits): add credits_charged column + usage summary endpoint      ← P1
ef9bc91 feat(billing): UsageDrawer — slide-over showing recent credit charges   ← P2
24fae21 docs: credit usage tracking plan (Option A) — Phases 0/0.5/1/2/3        ← plan doc
4f97705 refactor(credits): rename total_cost_usd → charged_amount_usd           ← naming hygiene
```

All pushed to `origin/new-ui`. All deployed to staging + production.

---

## Where to pick up next session

The credit usage tracking work is done. Production is current. Next session has options:

1. **Beta client onboarding** — Hyderabad hotel + abroad ed consultancy. Use the manual D1 grant recipe in `CLAUDE.md`. The Usage drawer is live for them to see where credits go.
2. **URL routing refactor** (still deferred per memory `feedback_url_routing_deferred.md`) — `/workspace/c/:id`, `/workspace/new`. Trigger threshold not hit yet.
3. **Mobile parity from S91** — Sage badge in `MobileChatDrawer`, floating chrome in mobile lightbox, editorial breadcrumb in mobile toolbar.
4. **Refunds → usage_log** — when the first refund happens, this stops being deferred.
5. **Local-server multiplier alignment** — `server/lib/websocket-handler.ts:812, 1267` hardcodes `5x` vs prod's `4x`. Quick fix; only matters if anyone uses local dev for revenue math.

---

End of S92.
