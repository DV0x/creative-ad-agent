# Plan — Credit Usage Tracking (Option A)

**Date:** 2026-05-04
**Status:** ⏸️ Planned, not started. Pick up next session at "Phase 0".
**Branch (current):** `new-ui` — create work branch off it (suggested: `feat/usage-tracking`)
**Total estimated effort:** ~7 hrs over 1–2 days

> Read top-to-bottom on first pickup. The **Decisions Locked** section is settled — do not relitigate. The **Open Decisions** section needs user input *during* execution. Pick-up instructions are at the bottom.

---

## TL;DR

Build a user-facing credit usage drawer so beta clients can see where their credits went. The data layer mostly exists — `usage_log` table is populated by `recordUsage()`, and `GET /api/credits/usage` already returns it.

But three problems block shipping it as-is:

1. **The existing endpoint leaks raw COGS** (`claude_cost_usd`, `image_cost_usd`, `total_cost_usd`, tokens, duration). Anyone with a Clerk session today can read these. Phase 0 is a hotfix.
2. **Displayed credit amounts may be wrong by 4×** because of `COST_MULTIPLIER = 4` semantic ambiguity. Phase 0.5 is a joint investigation.
3. **No UI surface exists.** Phases 1–3 add the drawer + dropdown wiring.

| Phase | Goal | Effort | Ship target |
|---|---|---|---|
| 0 | Hotfix COGS leak in existing endpoint | 30 min | Same-day standalone ship |
| 0.5 | Investigate `COST_MULTIPLIER` semantics (joint) | 45 min | Today, with user |
| 1 | Schema migration + queries + summary route | 2 hrs | This week |
| 2 | UsageDrawer component + dropdown wiring | 3 hrs | This week |
| 3 | Verification + production deploy | 1 hr | This week |

---

## Why we're doing this

- Beta-client launch is imminent (Hyderabad hotel + abroad ed consultancy)
- They will ask "where did my credits go?" — no UI for it today
- The data is already being recorded; the gap is presentation + a security-shaped hole in the existing endpoint
- Pre-launch is the right time to fix the COGS leak — no users to disrupt yet

---

## Findings from the grep session (2026-05-04)

### 🚨 Critical: `/api/credits/usage` already exists and leaks COGS

`cloudflare/src/routes/credits.ts:28-42` exposes:
```ts
return Response.json({
  usage: usage.map(u => ({
    ...u,                              // ← spreads EVERY field
    total_cost: ...,
    claude_cost: ...,
    image_cost: ...,
  })),
});
```

Every field of `usage_log` ships to the client today, including:
- `claude_cost_usd` (raw LLM cost)
- `image_cost_usd` (raw fal.ai cost)
- `total_cost_usd` (total raw COGS)
- `input_tokens`, `output_tokens` (back-calculable to LLM cost)
- `num_turns`, `duration_ms` (cost proxies)

Any authenticated user can hit the endpoint and reverse-engineer the gross margin in 30 seconds. **This is a live data leak, not a future risk.**

### 🟡 `COST_MULTIPLIER = 4` semantic ambiguity

In `cloudflare/src/db/credits.ts`:
- Line 6: `// 4x cost multiplier = 75% gross margin. Raw COGS stays in usage_log for visibility.`
- Line 7: `export const COST_MULTIPLIER = 4;`

But `COST_MULTIPLIER` is **never used** in this file. `recordUsage` deducts `usage.totalCostUsd` directly with no multiplication. Three possibilities, each implying different fixes:

| If… | Implication |
|---|---|
| `recordUsage` is called with **raw COGS** and 4× is applied somewhere upstream (pre-deduct) | `total_cost_usd` is the user-facing charge; comment about "raw COGS in usage_log" is misleading |
| `recordUsage` is called with **already-multiplied amount** | Same as above; column name is just confusingly suffixed `_usd` |
| Multiplier was designed but never wired | Production is running 0% margin; this is a pricing bug to fix before launch |

**This must be resolved before Phase 1.** The backfill formula and `credits_charged` semantics depend on the answer.

### 🟢 Other findings

| Finding | Location | Implication |
|---|---|---|
| Only 3 `event_type` values are emitted | `campaign-session.ts:440, 496` | Label mapping is small: `generation`, `follow_up`, `cancelled` |
| Image regeneration has no separate `event_type` | (absence in grep) | Either folds into `follow_up`, or isn't tracked — confirm in Phase 0.5 |
| `cancelled` events DO write to `usage_log` | `campaign-session.ts:496` | Drawer must handle "cancelled" — what credits were charged? |
| Refunds (`webhooks.ts:343` → `refundCredits`) don't write to `usage_log` | `db/credits.ts:119-159` | Out of scope for v1; flag for later |
| Same billing trio exists in TWO menus | `UserMenu.tsx:91-124` (CreditBadge dropdown) + `AssetDrawer.tsx:1117-1192` (popover) | Add "Usage" to **both** for parity |
| Screenshot menu = AssetDrawer popover (NOT Clerk-extended) | `AssetDrawer.tsx:1117-1192` | Plain React component, no Clerk API calls beyond `clerk.signOut()` |
| `getUsageLog` already exists | `db/credits.ts:227-238` | Reuse it; just shape the response in the route layer |
| Endpoint contract is `{ usage: [...] }` not bare array | `routes/credits.ts:34` | Frontend client must match this shape |

---

## Decisions Locked (do not relitigate)

| # | Decision | Why |
|---|---|---|
| D1 | **Modal/slide-over drawer for v1, NOT a full `/usage` page** | Pre-launch glance use case, not a dashboard. Going page-route would also fire the URL routing trigger — premature for current scope. |
| D2 | **Slide-over from right (drawer pattern), not centered modal** | Matches AssetDrawer visual language; consistent dismiss/animation; accommodates 30+ rows scrolling |
| D3 | **DTO at the route layer, NOT field omission via `delete u.foo`** | Explicit allowlist. Type-safe. Survives schema additions without leaking. |
| D4 | **Add `credits_charged` as a column in `usage_log`** (not computed on read) | If `COST_MULTIPLIER` ever changes per-tier or per-period, historical entries stay accurate. "Store the charge, not the rule" — same reason invoices don't get retroactively recalculated. |
| D5 | **`credits_charged` is INTEGER** | Credits are user-facing whole numbers. Decimal credits are confusing. Round at write time. |
| D6 | **Add "Usage" entry to BOTH CreditBadge dropdown AND AssetDrawer popover** | Same trio of billing actions appears in both today; parity prevents user confusion |
| D7 | **Drawer open/close = local React state, NOT Zustand persist** | Ephemeral; doesn't need to survive refresh; keeping persist allowlist tight (per S91 mental model) |
| D8 | **"This month" summary = calendar month, NOT rolling 30 days** | Matches how billing periods feel ("April 2026: 312 credits"); aligns with subscription renewal semantics |
| D9 | **Pagination via "Show more" button, NOT infinite scroll** | Simpler; bounded list; matches v1 modal scope |
| D10 | **Refunds are deferred to v1.5** | `refundCredits` doesn't touch `usage_log`; would need its own row schema; beta clients aren't getting refunds yet |
| D11 | **Naming: "Usage"** (matches Stripe / Vercel / OpenAI / GitHub) | Standard; "Activity" too vague; "Credit history" implies past-only |
| D12 | **Phase 0 ships standalone — even if rest of Option A delays** | The COGS leak is live; closing it is the highest-priority single change |
| D13 | **The Clerk avatar popover (header right) stays alone** — no "Usage" entry there | It's Clerk chrome; not a billing surface in users' mental model |
| D14 | **No CSV export, no charts, no filters in v1** | YAGNI; add only if beta clients ask |
| D15 | **No admin-side margin dashboard** | Run wrangler queries directly against D1 — no UI needed for solo founder |

---

## Open Decisions (need user input during execution)

| # | Decision | Blocks | Default if user unresponsive |
|---|---|---|---|
| O1 | What does `total_cost_usd` actually represent — raw COGS or user-facing charge? | Phase 1 backfill formula | Investigate jointly in Phase 0.5 |
| O2 | If COST_MULTIPLIER is unwired, do we wire it now or grandfather existing usage at the current rate? | Phase 1 schema migration | Wire it; current behavior is a pricing bug |
| O3 | Does image regeneration get its own `event_type` or fold into `follow_up`? | Phase 2 label mapping | Inspect `campaign-session.ts` deeper in Phase 0.5 |
| O4 | What does "cancelled" in usage history mean for the user — refunded? failed? | Phase 2 label copy | Show "Cancelled (no charge)" if cancellation refunds; else "Cancelled" with the credits-charged amount |
| O5 | Drawer width — match AssetDrawer width (≈320px) or wider for tabular data (≈480px)? | Phase 2 component | 480px (more breathing room for activity rows) |

---

## Phase 0 — Hotfix COGS leak (30 min, same-day ship)

### Goal
Stop exposing raw COGS through `GET /api/credits/usage`. Standalone ship — does not depend on rest of Option A.

### Pre-work
1. Grep `client/src` for any existing `/api/credits/usage` callers (response-shape change must not break callers):
   ```bash
   grep -rn "credits/usage\|api/credits" client/src
   ```
2. If no callers, the response can change freely.
3. If callers exist, note their expected fields and preserve those in the DTO.

### The change
File: `cloudflare/src/routes/credits.ts:28-42`

Replace the `...u` spread with an explicit DTO:

```ts
// GET /api/credits/usage — paginated usage history (DTO ONLY — no COGS)
if (sub === '/usage' && method === 'GET') {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const usage = await credits.getUsageLog(env.DB, userId, limit, offset);

  // ⚠️ DO NOT add cost or token fields to this response shape.
  // usage_log stores raw COGS for margin tracking — exposing claude_cost_usd,
  // image_cost_usd, total_cost_usd, input_tokens, output_tokens, num_turns,
  // or duration_ms lets users reverse-engineer our gross margin.
  // User-facing fields only: id, campaign_id, event_type, image_count,
  // credits_charged, created_at.
  return Response.json({
    usage: usage.map(u => ({
      id: u.id,
      campaign_id: u.campaign_id,
      event_type: u.event_type,
      image_count: u.image_count,
      credits_charged: Math.round(u.total_cost_usd * CREDITS_PER_USD * 10) / 10,
      created_at: u.created_at,
    })),
  });
}
```

> Note: Phase 0 uses the *current* `total_cost_usd * CREDITS_PER_USD` formula. If Phase 0.5 reveals this is wrong by 4×, the formula updates in Phase 1. Phase 0's job is closing the leak, not fixing the math.

### Verification
1. Build and deploy to staging:
   ```bash
   cd cloudflare && npx wrangler deploy --env staging
   ```
2. Authenticate, hit the endpoint, confirm response shape:
   ```bash
   curl -s -H "Authorization: Bearer <token>" \
     https://creative-agent-staging.alphasapien17.workers.dev/api/credits/usage | jq
   ```
   Verify NO fields named `claude_cost*`, `image_cost*`, `total_cost*`, `*_tokens`, `num_turns`, `duration_ms`.
3. Open the running app on staging, browse around, confirm no console errors.
4. Deploy to production:
   ```bash
   cd cloudflare && npx wrangler deploy --env production
   ```
5. Spot-check production response.

### Risks
- If a frontend caller expects `total_cost`, `claude_cost`, `image_cost`, or any `_usd` field, they'll break. Mitigated by the pre-work grep.
- Production deploy of S86→S91 is also pending. Decide before Phase 0 deploy whether Phase 0 rides on top of S91 (deploy all of `new-ui`) or as a cherry-pick (deploy a separate hotfix branch). **Recommendation: deploy all of `new-ui` together** — the S91 work is verified on staging and overdue for prod.

---

## Phase 0.5 — Resolve COST_MULTIPLIER semantics (45 min, joint with user)

### Goal
Determine what `total_cost_usd` actually represents so Phase 1's backfill formula is correct.

### Investigation steps
1. Grep for all usage of `COST_MULTIPLIER`:
   ```bash
   grep -rn "COST_MULTIPLIER" cloudflare/src server agent
   ```
2. Grep for all callers of `recordUsage` to see what value they pass for `totalCostUsd`:
   ```bash
   grep -rn "recordUsage" cloudflare/src server
   # Then read each caller to inspect the value flow
   ```
3. Trace the chain from agent execution → SDK message parser → DO → `recordUsage`. Find where dollar amounts are computed and whether the 4× multiplier is applied anywhere.
4. Inspect `usage_log` rows from staging via wrangler:
   ```bash
   npx wrangler d1 execute creative-agent-db --remote --command="
     SELECT id, event_type, claude_cost_usd, image_cost_usd, total_cost_usd
     FROM usage_log ORDER BY created_at DESC LIMIT 10
   "
   ```
   Compare ratios. If `total_cost_usd ≈ claude_cost_usd + image_cost_usd`, the row is raw COGS. If it's 4× larger, it's already multiplied.
5. **Walk the user through findings before deciding O2 (wire multiplier vs grandfather).**

### Outputs
- An updated decisions log entry (D-X) on whether `total_cost_usd` is raw COGS or user-charged amount
- A confirmed backfill formula for `credits_charged`
- A decision on whether to fix the multiplier flow (if unwired) before Phase 1 or in a separate task

---

## Phase 1 — Schema + queries + summary endpoint (2 hrs)

### 1.1 Schema migration

Add to `cloudflare/schema.sql` after the existing `usage_log` definition:

```sql
ALTER TABLE usage_log ADD COLUMN credits_charged INTEGER;

-- Backfill: formula confirmed in Phase 0.5
UPDATE usage_log
   SET credits_charged = CAST(ROUND(<formula from Phase 0.5>) AS INTEGER)
 WHERE credits_charged IS NULL;
```

Apply to staging:
```bash
npx wrangler d1 execute creative-agent-db --remote --command="ALTER TABLE usage_log ADD COLUMN credits_charged INTEGER"
npx wrangler d1 execute creative-agent-db --remote --command="UPDATE usage_log SET credits_charged = ... WHERE credits_charged IS NULL"
```

Then production (`creative-agent-db-prod`).

### 1.2 Update `recordUsage()` — TWO parallel implementations

There are two `recordUsage` definitions and four call sites. **Both must be kept in sync** or local dev will silently diverge from prod.

| File | Role |
|---|---|
| `cloudflare/src/db/credits.ts:163` | Production — Cloudflare Workers |
| `server/lib/db/credits.ts:66` | Local dev — Express server |

Caller sites (all four):
| File:line | Context |
|---|---|
| `cloudflare/src/durable-objects/campaign-session.ts:438` | Prod — generation / follow_up |
| `cloudflare/src/durable-objects/campaign-session.ts:494` | Prod — cancelled |
| `server/lib/websocket-handler.ts:818` | Local — generation / follow_up |
| `server/lib/websocket-handler.ts:1273` | Local — cancelled |

For each `recordUsage` definition:
- Add `creditsCharged: number` to `RecordUsageInput` interface
- Add `credits_charged` to the INSERT column list and bind a value
- Loud comment near the column: "user-facing charge; do NOT confuse with `total_cost_usd` (raw COGS)"

For each of the four caller sites:
- Compute `creditsCharged` from the same source as `totalCostUsd` (formula resolved in Phase 0.5)
- Pass it through the call

### 1.3 Add summary query

In `cloudflare/src/db/credits.ts`, after `getUsageLog`:

```ts
export interface UsageSummary {
  totalCredits: number;
  campaignCount: number;
  entryCount: number;
  since: string;
}

export async function getUsageSummary(
  db: D1Database,
  userId: string,
  sinceISODate: string,
): Promise<UsageSummary> {
  const row = await db.prepare(
    `SELECT
       COALESCE(SUM(credits_charged), 0) AS total_credits,
       COUNT(DISTINCT campaign_id) AS campaign_count,
       COUNT(*) AS entry_count
     FROM usage_log
     WHERE user_id = ? AND created_at >= ?`
  ).bind(userId, sinceISODate).first<{
    total_credits: number;
    campaign_count: number;
    entry_count: number;
  }>();

  return {
    totalCredits: row?.total_credits ?? 0,
    campaignCount: row?.campaign_count ?? 0,
    entryCount: row?.entry_count ?? 0,
    since: sinceISODate,
  };
}
```

### 1.4 Add summary route

In `cloudflare/src/routes/credits.ts`, after the `/usage` handler:

```ts
// GET /api/credits/usage/summary?since=YYYY-MM-DD
if (sub === '/usage/summary' && method === 'GET') {
  const url = new URL(request.url);
  const since = url.searchParams.get('since');
  if (!since) {
    return Response.json({ error: 'since param required' }, { status: 400 });
  }
  const summary = await credits.getUsageSummary(env.DB, userId, since);
  return Response.json(summary);
}
```

### 1.5 Update `/usage` handler to return `credits_charged` from the column

Replace Phase 0's interim formula with the column read:
```ts
credits_charged: u.credits_charged ?? 0,  // backfilled rows always have a value
```

### 1.6 Optional: also surface `campaign_name`

If we want "Liquid Death campaign · 47 credits" instead of "abc-uuid · 47 credits", join `campaigns` table:
```sql
SELECT u.*, c.name AS campaign_name
  FROM usage_log u
  LEFT JOIN campaigns c ON c.id = u.campaign_id
 WHERE u.user_id = ?
 ORDER BY u.created_at DESC
 LIMIT ? OFFSET ?
```
Add `campaign_name` to DTO. **Recommend doing this** — uuid in the UI is meaningless.

---

## Phase 2 — UI: UsageDrawer + dropdown wiring (3 hrs)

### 2.1 REST client

Add to `client/src/lib/api.ts`:

```ts
export interface UsageEntry {
  id: string;
  campaign_id: string | null;
  campaign_name?: string | null;
  event_type: string;  // 'generation' | 'follow_up' | 'cancelled'
  image_count: number;
  credits_charged: number;
  created_at: string;
}

export interface UsageSummary {
  totalCredits: number;
  campaignCount: number;
  entryCount: number;
  since: string;
}

export const creditsApi = {
  // ... existing ...
  async getUsage(limit = 20, offset = 0): Promise<{ usage: UsageEntry[] }> { ... },
  async getUsageSummary(since: string): Promise<UsageSummary> { ... },
};
```

### 2.2 Event-type → label mapping

Create `client/src/lib/usage-labels.ts`:

```ts
export const EVENT_TYPE_LABELS: Record<string, string> = {
  generation: 'Campaign generation',
  follow_up:  'Follow-up generation',
  cancelled:  'Cancelled',  // confirm copy in O4
};

export function labelForEventType(t: string): string {
  return EVENT_TYPE_LABELS[t] ?? 'Activity';
}
```

### 2.3 New component: `client/src/components/billing/UsageDrawer.tsx`

```tsx
type UsageDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function UsageDrawer({ open, onClose }: UsageDrawerProps) {
  // ... slide-over from right, ~480px wide
  // Header card: balance + "this month" summary
  // Activity list (paginated)
  // States: loading (skeletons), empty, error (with retry)
}
```

Visual structure:
```
┌─ Usage ───────────────────────────── ✕ ─┐
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  Balance: 1,197.6 credits       │    │
│  │  This month: 312 credits        │    │
│  │             across 8 campaigns   │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Recent activity                          │
│  ──────────────────────────────────       │
│  May 4  · Liquid Death · 47 credits       │
│  May 4  · Image regen   · 18 credits      │
│  May 3  · Brand research·  5 credits      │
│           ... (Show more)                 │
└──────────────────────────────────────────┘
```

### 2.4 Dropdown wiring

#### a) `AssetDrawer.tsx` popover (around line 1175, between Manage Billing and Sign out)

```tsx
{/* Usage — credit history */}
<button
  onClick={() => { openUsageDrawer(); onClose() }}
  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-bg-elevated text-left transition-colors"
>
  <ListIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
  <span className="text-text-primary">Usage</span>
</button>
```

(Final icon — pick from `lucide-react`. `ListIcon`, `BarChart3`, `Activity`, or `History` all fit.)

#### b) `UserMenu.tsx` `CreditBadge` dropdown (around line 111, between Buy Credits and Manage Billing)

Same button shape, no icon (matches existing text-only style of CreditBadge).

### 2.5 Drawer state

Open/close is local state. Where it lives:
- Option A: Add `usageDrawerOpen` to Zustand (NOT in persist allowlist) — accessible from anywhere
- Option B: Lift to `AppLayout` and prop-drill to both menus

**Recommend Option A** — two menus need to open it; Zustand local state (non-persisted) is the cleanest shared toggle. Add to store:
```ts
usageDrawerOpen: false,
openUsageDrawer: () => set({ usageDrawerOpen: true }),
closeUsageDrawer: () => set({ usageDrawerOpen: false }),
```

Mount the drawer once at `AppLayout` level so any menu trigger flips the same state.

---

## Phase 3 — Verification + ship (1 hr)

| Check | How |
|---|---|
| Drawer opens from AssetDrawer popover "Usage" entry | Click → drawer slides in |
| Drawer opens from CreditBadge dropdown "Usage" entry | Hover credit pill → click Usage → drawer opens |
| Recent activity renders | Pre-existing campaigns show with credits + timestamps |
| `credits_charged` math is correct | Compare drawer total vs `user_credits.total_spent_usd × 10` |
| Pagination works | Generate 25+ entries, "Show more" loads next page |
| **No COGS in network response** | DevTools → Network → `/api/credits/usage` → confirm DTO only |
| Backfilled column populated | `wrangler d1 execute creative-agent-db --remote --command="SELECT id, total_cost_usd, credits_charged FROM usage_log LIMIT 20"` |
| Empty state for new user | Sign in fresh test account → empty copy renders |
| Error state | Temporarily make API throw → drawer shows retry button |
| Mobile layout | Slide-over on small screens — full-width or constrained? |
| `cancelled` event renders sensibly | Find a cancelled row → confirm label per O4 |
| Both menus show "Usage" entry | Manual click-through on both surfaces |
| Production deploy | `npx wrangler deploy --env production` |
| Production smoke test | Open prod, open drawer, confirm data |

---

## Out of scope for v1 — explicit punts

| Feature | Why deferred | When to revisit |
|---|---|---|
| Refund entries in usage_log | `refundCredits` doesn't write rows; would need its own schema change | When a beta client reports a confusing balance discrepancy |
| Date filters / range picker | YAGNI | When a beta client asks "show me April only" |
| CSV export | Option B feature; signal-driven | When a beta client asks for accounting record |
| Per-campaign rollup card | Nice-to-have | If beta clients are running multi-campaign comparisons |
| Charts / trend graphs | Pure aesthetic for v1 | If billing transparency becomes a marketing point |
| Admin margin dashboard | Solo founder + wrangler CLI is enough | When team size > 1 |
| URL routing for `/usage` page | URL routing trigger memory says wait until ≥1 of: shareable link request / 3rd band-aid / new view / multi-tab need | See `feedback_url_routing_deferred.md` |

---

## Where to pick up next session

### Step 0 — read this doc top-to-bottom

### Step 1 — confirm pre-work
- [ ] Production deploy of S91 has happened (or will ride on Phase 0). Check current prod state via:
  ```bash
  curl -s https://creativemachines.xyz/health | python3 -m json.tool
  ```
- [ ] Disk space ≥30GB (S89 APFS recovery note still applies)
- [ ] On `new-ui` branch, clean working tree

### Step 2 — start Phase 0
1. Pre-work grep: any callers of `/api/credits/usage` in `client/src`?
2. Make the DTO change in `cloudflare/src/routes/credits.ts:28-42`
3. Deploy to staging, verify via curl
4. Deploy to production
5. Mark Phase 0 done

### Step 3 — Phase 0.5 (joint with user)
1. Grep `COST_MULTIPLIER` and `recordUsage` callers
2. Walk user through findings
3. Get answer on O1, O2, O3
4. Document the resolved decision in this doc (append to "Decisions Locked" section)

### Step 4 — Phases 1, 2, 3
Follow the order above. Each phase is independent enough that the user can pause between phases to review.

### Suggested git workflow
- Phase 0 → its own commit on `new-ui` (or `feat/cogs-leak-hotfix` if cherry-picked)
- Phase 1 → one commit (schema + queries + routes)
- Phase 2 → one commit (UI)
- Phase 3 verification + prod deploy → no commit needed

---

## File reference (post-grep, where to edit)

```
Phase 0:
  cloudflare/src/routes/credits.ts:28-42         ← DTO replacement

Phase 0.5 (read-only):
  cloudflare/src/db/credits.ts                   ← COST_MULTIPLIER definition
  cloudflare/src/durable-objects/campaign-session.ts:440, 496  ← recordUsage callers

Phase 1:
  cloudflare/schema.sql                          ← schema source of truth
  cloudflare/src/db/credits.ts:163               ← getUsageSummary, RecordUsageInput, INSERT
  cloudflare/src/routes/credits.ts               ← /usage and /usage/summary handlers
  cloudflare/src/durable-objects/campaign-session.ts:438, 494  ← pass creditsCharged (prod)
  server/lib/db/credits.ts:66                    ← parallel recordUsage (local dev) — keep in sync
  server/lib/websocket-handler.ts:818, 1273      ← pass creditsCharged (local dev)

Phase 2:
  client/src/lib/api.ts                          ← creditsApi.getUsage, getUsageSummary
  client/src/lib/usage-labels.ts                 ← (new) label mapping
  client/src/components/billing/UsageDrawer.tsx  ← (new) slide-over component
  client/src/components/auth/UserMenu.tsx:111    ← CreditBadge dropdown insertion
  client/src/components/assets/AssetDrawer.tsx:1175  ← popover insertion
  client/src/components/layout/AppLayout.tsx     ← mount UsageDrawer once
  client/src/store/index.ts                      ← usageDrawerOpen + setters
```

---

End of plan.
