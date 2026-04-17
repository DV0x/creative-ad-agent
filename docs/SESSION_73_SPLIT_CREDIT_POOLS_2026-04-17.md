# Session 73 — Split Credit Pools + Remaining Dodo E2E (2026-04-17)

## What We Did
Validated the remaining untested Dodo flows from Session 72, found and fixed **3 more bugs** (top-up currency still wrong for Indian merchants, refund currency, refund user_id lookup), then **redesigned the credit model into two separate pools** (`plan` and `topup`) so top-up credits no longer evaporate when a subscription renews. All validated end-to-end on staging.

## Bugs Found & Fixed

### 1. Top-up currency bug — `settlement_amount` is in settlement currency, not USD
- **Symptom**: $10 top-up credited **9,284 credits** instead of 100 on an Indian Visa
- **Root cause**: Session 72's fix assumed `settlement_amount` was always USD cents. For **Indian-registered Dodo merchants** (like ours), Dodo settles in INR regardless of what currency the user pays in. So `settlement_amount = 109562` was INR paise (₹1,095.62), not USD cents.
- **Class of bug we'd already seen**: Subscription credits don't hit this because we use `PLAN_CONFIG[product_id].baseCreditsUsd` (hardcoded). The lesson from Session 72 — "never trust currency fields on the webhook" — needed to be extended to top-ups.
- **Fix**: Stamp the user-chosen USD amount into checkout metadata (`topup_usd_cents`), read it back on webhook. No currency math, no FX, no tax handling.
  - `payments.ts` — add `topup_usd_cents: String(amountCents)` to checkout `metadata`
  - `webhooks.ts` `handlePaymentSucceeded` — replace `settlement_amount - settlement_tax` math with `data.metadata.topup_usd_cents` lookup

### 2. Same currency bug existed in `refund.succeeded`
- **Root cause**: `data.amount` in refund events is also in settlement currency (INR paise). Would have under- or over-deducted credits.
- **Fix**: Don't trust webhook money at all on refunds. Use `data.payment_id` to look up our own `payment_events` row and reclaim `amount_credited_usd` (what we actually credited at the time). Added `getPaymentCredit(db, paymentId)` helper.

### 3. Refund webhook's `data.metadata` is empty (Dodo does NOT copy original payment metadata)
- **Symptom**: Refund webhook landed with `userId=unknown`; `payment_events` row had `user_id=null`; no deduction applied. Money was refunded in Dodo, credits stayed in our DB.
- **Root cause**: Dodo treats refunds as their own entity with fresh metadata. The `clerk_user_id` we stamp on the original payment does NOT come back.
- **Fix**: In `handleRefundSucceeded`, derive `userId` from the payment-events lookup (same query as fix #2 now also returns `user_id`).

### 4. `subscription.expired` didn't wipe plan credits
- **Symptom** (latent): After a cancel + period-end expiry, users would keep their Pro-tier credits forever.
- **Fix**: Add `setPlanBalance(userId, 0)` to the `.expired` handler so plan credits drop to zero when the paid period ends. Top-up pool is untouched.

## Major: Split Credit Pools (Option A)

### The Problem
Before this session, `.renewed` called `setBalance(0)` + `addCredits(planAmount)`. That reset meant a user who had bought extra top-up credits would see them evaporate on the next billing cycle — punishing them for the explicit purchase. Every mainstream paid AI product (Runway, Suno, ElevenLabs, Midjourney) treats top-up credits as permanent and subscription credits as monthly allowance.

### Decision
Split the `user_credits.balance_usd` column into two pools:

| Column | Semantics | Reset behavior |
|---|---|---|
| `balance_usd` | Plan pool — from subscription | Reset to 0 on `subscription.renewed` and `.expired` |
| `balance_usd_topup` | Top-up pool — permanent | Only decreases on spend / refund. Never auto-wiped. |

**Spend order**: plan pool first, topup pool second — so users exhaust their "allowance" before eating into credits they explicitly paid for.

### Schema Migration
```sql
ALTER TABLE user_credits ADD COLUMN balance_usd_topup REAL NOT NULL DEFAULT 0;
```
Applied to staging D1. Production schema unchanged (not yet launched).

### New DB Helpers (`cloudflare/src/db/credits.ts`)
Replaced ambiguous `addCredits` / `setBalance` with explicit pool-targeted helpers:

- `addPlanCredits(userId, amount)` — subscription credit grant
- `addTopupCredits(userId, amount)` — top-up purchase
- `setPlanBalance(userId, amount)` — used by `.renewed` (to 0 before re-granting) and `.expired` (zero out)
- `refundCredits(userId, amount, preferPool)` — deducts from preferred pool first, spills to the other, floors at 0
- `getPaymentCredit(db, paymentId)` — look up original payment for refund matching. Returns `{ user_id, event_type, amount_credited_usd }`

### Spend Path — SQL CASE-WHEN for atomic split deduction
`recordUsage` now deducts plan-first using a single UPDATE with SQL's pre-update column semantics:

```sql
UPDATE user_credits SET
  balance_usd_topup = CASE
    WHEN balance_usd >= :cost THEN balance_usd_topup
    ELSE balance_usd_topup - (:cost - balance_usd)
  END,
  balance_usd = CASE
    WHEN balance_usd >= :cost THEN balance_usd - :cost
    ELSE 0
  END,
  total_spent_usd = total_spent_usd + :cost,
  total_generations = total_generations + 1
WHERE user_id = :uid
```
SQL evaluates all `SET` expressions against pre-update values, so the CASE for `balance_usd_topup` sees the old `balance_usd` correctly.

Also simplified the idempotency flow: instead of "INSERT+UPDATE in a batch, rollback UPDATE if INSERT was ignored", now it's "INSERT first, check `changes`, UPDATE only on first success." Cleaner, no transient wrong-state window.

### Refund Pool Targeting
`handleRefundSucceeded` looks up the original payment to decide which pool to reclaim from:
- Original event was `subscription.renewed` → deduct plan first
- Original event was `payment.succeeded` (top-up) → deduct topup first

Spill is automatic via the same CASE-WHEN pattern. Floored at 0 (we never create negative debt on refunds).

### API + WS Changes
- `GET /api/credits` now returns `{ balance, plan_balance, topup_balance, total_spent, total_generations }` — `balance` is the sum (backward compat).
- WS `credits_update` message carries `plan_balance` + `topup_balance` alongside `balance`, so the UI breakdown stays fresh after every generation.
- `recordUsage` return type extended with `planBalance` + `topupBalance`.

### UI (`UserMenu.tsx`, `PricingModal.tsx`)
- **Credit badge dropdown** now shows a breakdown section at the top:
  - `900 plan · resets May 17, 2026`
  - `60 top-up · never expire`
  - Lines only render when their pool is > 0
- **Pricing modal description** now reads: *"Plan credits reset each billing cycle. Top-up credits never expire."*
- **Top-up modal** already said "Credits never expire" — kept as is.
- Store extended with `planBalance` / `topupBalance`; cold-start `/api/credits` fetch + WS updates both populate them.

## Staff-engineer Review (what we decided NOT to do)
- **Pool-breakdown on floor-at-0 for spend path**: kept no-floor semantics (let `balance_usd` go negative if pre-check fails). The CASE construction looks like a floor but is actually the spill-to-topup mechanism. Consistent with pre-session behavior.
- **Starter top-up bonus alignment (1.0x vs 1.1x)**: out of scope. Current code gives Pro 1.2x and everyone else 1.0x (Starter gets no top-up bonus). User confirmed this is intentional.
- **`server/` local dev parity**: not touched — user tests on staging. Local dev path will break if run until we mirror the schema.
- **Dodo API base URL env-awareness**: still hardcoded to `test.dodopayments.com`. Carried forward from Session 72.
- **Subscription "cancel scheduled" UI banner**: portal-cancel doesn't fire `.cancelled` until period end, so our UI doesn't know to show "cancellation pending." Future work.

## Deployment Discipline Reminder
I initially deployed with `npm run build` (production mode, loads live Clerk keys). User caught it. Per `memory/environments.md`:
> **NEVER use `npm run build` for deploys** — always use `build:staging` or `build:production` explicitly. The live Clerk key is domain-locked to `creativemachines.xyz` and will silently break staging auth.

Corrected to `npm run build:staging` before redeploying.

## Files Changed

### Modified
| File | Change |
|---|---|
| `cloudflare/schema.sql` | +`balance_usd_topup` column |
| `cloudflare/src/db/credits.ts` | Full rewrite: split pools, `addPlanCredits`/`addTopupCredits`/`setPlanBalance`/`refundCredits`/`getPaymentCredit`, new `recordUsage` return shape |
| `cloudflare/src/db/index.ts` | Export surface updated |
| `cloudflare/src/routes/payments.ts` | Add `topup_usd_cents` to checkout metadata |
| `cloudflare/src/routes/webhooks.ts` | Read `topup_usd_cents` from metadata; refund path uses payment lookup; `.expired` wipes plan pool; `.renewed` uses `setPlanBalance` + `addPlanCredits` |
| `cloudflare/src/routes/credits.ts` | Return breakdown in API |
| `cloudflare/src/lib/types.ts` | WS message type: +`plan_balance`, +`topup_balance` |
| `cloudflare/src/durable-objects/campaign-session.ts` | Both `credits_update` sends include breakdown |
| `client/src/lib/api.ts` | `ApiCredits` type: +`plan_balance`, +`topup_balance` |
| `client/src/types/websocket.ts` | WSCreditsUpdateEvent: +`plan_balance`, +`topup_balance` |
| `client/src/store/index.ts` | +`planBalance`, +`topupBalance` state + setter signature |
| `client/src/App.tsx` | Cold-start `/api/credits` stores breakdown; checkout-success poll stores breakdown |
| `client/src/hooks/useWebSocket.ts` | `credits_update` handler stores breakdown |
| `client/src/components/auth/UserMenu.tsx` | Dropdown shows breakdown with expiry copy |
| `client/src/components/pricing/PricingModal.tsx` | Description copy explains plan-reset vs topup-permanent |

### Migration
`ALTER TABLE user_credits ADD COLUMN balance_usd_topup REAL NOT NULL DEFAULT 0;` — applied to staging `creative-agent-db`.

## Verification (all on staging)

| Test | Expected | Actual |
|---|---|---|
| Top-up $10 on Free | 100 credits, `balance_usd_topup = 10` | ✅ |
| Subscribe Pro Monthly | 900 credits, `balance_usd = 90`, topup untouched | ✅ |
| Top-up $10 on Pro | +120 credits (1.2× bonus), topup goes 0 → 12 while plan stays at 90 | ✅ |
| Portal-cancel Pro sub | Dodo queues cancel to period end; no webhook; DB unchanged (correct) | ✅ |
| Top-up $5 + refund | Plan stays $90; topup goes 0 → 6 → 0; `amount_credited_usd = -6` recorded | ✅ |
| Cold-start UI | Pro badge + plan label + 900 credits hydrated from `/api/credits` + `/api/payments/subscription` | ✅ |
| Breakdown tooltip | Hover badge shows `900 plan · resets May 17, 2026` / `0 top-up · never expire` | ✅ |

## Untested / Deferred
- **`subscription.cancelled` + `subscription.expired` webhook handlers**: portal-cancel only fires these at period end (2026-05-17). Force-cancel via API would fire them immediately but requires handing me the staging API key. Deferred.
- **Partial refunds**: current refund handler assumes full refund and deducts `amount_credited_usd` in full. Partial refunds (if Dodo fires them with `data.is_partial: true`) would over-deduct. Punted.
- **Production launch prep**: env-aware `DODO_API` base URL, live-mode products, live API key + webhook secret rotation. Still on Session 72's production checklist.

## Key Design Decisions

### Why metadata-based top-up crediting (not webhook money fields)
The core lesson: **settlement_amount is in the merchant's settlement currency**, which for Indian-registered Dodo merchants is always INR. There's no reliable way to derive USD from the webhook payload without an FX table. Instead, we pass our intent (USD cents) through the checkout metadata — Dodo round-trips it unchanged.

### Why not just convert INR → USD in the handler?
- No FX rates in the worker (would need an external API call per webhook)
- Rates drift; "we credited based on spot rate" creates refund-reconciliation nightmares
- The user chose $10. Credit $10. No translation layer.

### Why floor-at-0 on refunds but NOT on spend?
- Refunds should never create negative debt (user shouldn't pay and then get nothing next time they buy credits)
- Spend going negative means our pre-spend check missed something — leave it visible for audit/debugging rather than silently eating the overdraw

### Why show the breakdown in the badge dropdown, not a separate tooltip?
- Separate tooltip would conflict-position with the existing dropdown (both open on hover at `right-0 top-full`)
- Dropdown already opens on hover — adding a breakdown row at the top reuses that affordance
- Cleaner than two floating panels fighting for space

## Next Session TODO
1. **Production launch prep** (carried over from Session 72):
   - Env-aware `DODO_API` base URL (branch on `wrangler.jsonc` env)
   - Recreate 5 products in Dodo **live mode** (test products don't transfer)
   - Generate live API key + live webhook signing secret
   - Configure production webhook endpoint
   - Apply schema migration (including `balance_usd_topup`) to `creative-agent-db-prod`
   - Update `CHECKOUT_PRODUCTS` / `TOPUP_PRODUCT_ID` / `PLAN_CONFIG` with production product IDs
   - Consider: env-based product ID maps
2. **Rotate staging test secrets** (API key + webhook secret — both were shared in chat over the last two sessions)
3. **Validate `.cancelled`/`.expired` webhook path** — needs force-cancel via API or waiting for period end
4. **Partial refund handling** — decide whether to support and add `is_partial` branch
5. **Subscription "cancel scheduled" UI** — surface `cancel_at_next_billing_date` state to users

## Artifacts
- **Staging URL**: `https://creative-agent-staging.alphasapien17.workers.dev`
- **Latest worker version**: `2bfc9197-75e1-4a29-a27f-41a03540610a`
- **Worker versions this session** (in order): `64500c66` (top-up metadata fix) → `de911628` (split pools + refund rewrite + .expired wipe) → `3c8fb149` (refund user_id lookup fix) → `848cbc82` (UI tooltip — wrongly built with prod env) → `2bfc9197` (UI tooltip correctly built with staging env)
- **Test refund**: payment `pay_0NctbuFnLC5ZFKsABoagN`, refund `ref_0NctaIVo...`, `amount_credited_usd = -6`
