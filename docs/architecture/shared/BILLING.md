# Billing

> Part of [Architecture Documentation](../INDEX.md) | **Sources:** `cloudflare/src/db/credits.ts`, `db/subscriptions.ts`, `routes/credits.ts`, `routes/payments.ts`, `routes/webhooks.ts`

---

## What this covers

How production charges users for generations. Four moving parts:

1. **Credit pools** — two USD-denominated pools per user (plan + topup), stored in D1
2. **Spend** — per-generation cost deduction at turn end, with cancel/partial handling
3. **Dodo Payments** — checkout, subscriptions, one-time top-ups, webhook-driven credit grants
4. **Refunds** — reverse credits to the originating pool with spill

Scope is production-only. Local dev (`server/`) has no billing — generations are free there.

---

## The two-pool model

Each user has two balance pools on `user_credits`:

| Pool | Column | Grows from | Resets on |
|---|---|---|---|
| **Plan** | `balance_usd` | `subscription.renewed` (first billing + every renewal) | `subscription.renewed`, `subscription.expired` |
| **Top-up** | `balance_usd_topup` | `payment.succeeded` (one-time purchases) | Never auto-reset |

**Spend order:** plan pool first, spill to top-up. This ensures monthly allowance is consumed before explicitly-purchased credits.

**Why two pools:** a user paying $49/mo for Pro should burn their $90 monthly allowance before eating into a $20 top-up they bought six months ago. Merging into one pool would either rob the user (top-up gets wiped on renewal) or give away free credits (plan never resets). Split pools fix both.

Implementation: `recordUsage()` in `cloudflare/src/db/credits.ts` uses a single SQL `UPDATE` with two `CASE WHEN` expressions so the deduction is atomic. Order matters: the topup-pool `CASE` references the pre-update `balance_usd`, so SQL's old-value semantics give correct results without a transaction.

```sql
-- Conceptual (see credits.ts:198-218 for the real query)
SET balance_usd_topup = CASE
      WHEN balance_usd >= cost THEN balance_usd_topup
      ELSE balance_usd_topup - (cost - balance_usd)
    END,
    balance_usd = CASE
      WHEN balance_usd >= cost THEN balance_usd - cost
      ELSE 0
    END
```

**No floor.** If the pre-spend balance check missed an over-draw, the deduction is allowed to drive the total negative. This is intentional — a negative balance is a red flag in audit queries rather than a silently lost charge.

---

## Pricing model

### Constants

```ts
// cloudflare/src/db/credits.ts
export const CREDITS_PER_USD = 10;   // 10 credits = $1. Display-only conversion.
export const COST_MULTIPLIER = 4;    // Raw cost × 4 = charged cost. ~75% gross margin.
```

User-facing unit is "credits." Internal unit is USD (`REAL` columns). Conversion happens at the API boundary.

### Plan tiers & credit grants

Defined in `planConfig()` at `cloudflare/src/routes/webhooks.ts:27-34` (product IDs injected per-env via wrangler vars). Each renewal grants `baseCreditsUsd × BONUS_MULTIPLIER[plan]`:

| Plan | Interval | Base (USD) | Bonus | Credited (USD) | Credits (×10) |
|---|---|---|---|---|---|
| Starter | monthly | $25 | ×1.1 | $27.50 | 275 |
| Starter | yearly | $300 | ×1.1 | $330 | 3,300 |
| Pro | monthly | $75 | ×1.2 | $90 | 900 |
| Pro | yearly | $900 | ×1.2 | $1,080 | 10,800 |
| Free | — | $0 | ×1.0 | — | — |

### Top-up (Pay What You Want)

One product ID, variable `amount` in the checkout payload. Enforced minimum: `TOPUP_MIN_USD = 5` (`payments.ts:15`).

**Top-up bonus:** only Pro users receive a bonus (`×1.2`). Starter and Free do not — top-ups for non-Pro users grant `$amount` 1:1 into the topup pool (`webhooks.ts:302-308`).

---

## Database

Five tables drive billing. Full schema in [`D1_DATABASE.md`](../cloudflare/D1_DATABASE.md); brief recap here:

| Table | Key | Purpose |
|---|---|---|
| `user_credits` | `user_id` (PK) | Two pool balances + lifetime totals |
| `usage_log` | `id` (PK) + `UNIQUE(campaign_id, request_id)` | Per-turn cost record (idempotent) |
| `user_subscriptions` | `user_id` (PK) | Current plan, interval, status, period_end, Dodo IDs |
| `payment_events` | `webhook_id` (PK) | Webhook audit log + idempotency guard |
| `user_events` | `id` (PK) | Analytics (downloads, etc.) — adjacent, not strictly billing |

**Idempotency:**
- Webhooks: `payment_events.webhook_id` PK stops duplicate processing.
- Usage deduction: `usage_log.UNIQUE(campaign_id, request_id)` makes `recordUsage()` idempotent — a retried turn with the same `request_id` no-ops.

---

## Payment flow (user → credits)

```
User clicks "Get Started" / "Buy Credits"
   │
   ▼
Client → POST /api/payments/checkout (or /topup)
   │                      body: { plan, email, name }
   │                      metadata: { clerk_user_id }
   ▼
Worker → Dodo API POST /checkouts
   │                      returns: { checkout_url }
   ▼
Client redirects to checkout_url
   │
   ▼
User completes payment on Dodo
   │
   ▼
Dodo → POST /webhooks/dodo (signed)
   │     Signature verified (Standard Webhooks: HMAC-SHA256 of
   │     `{webhook_id}.{timestamp}.{body}`, 5-min replay window)
   │     Idempotency: webhook_id checked against payment_events
   ▼
Handler dispatches by event.type:
   │
   ├── subscription.renewed → setPlanBalance(0) + addPlanCredits(base × bonus)
   │                          upsertSubscription(active)
   │
   ├── payment.succeeded   → addTopupCredits(amount × bonus)
   │                          (skipped if data.subscription_id present — credited via .renewed)
   │
   ├── subscription.active → upsertSubscription(active) only (state, no grant)
   ├── subscription.expired → setPlanBalance(0) + upsertSubscription(free/expired)
   ├── subscription.cancelled → upsertSubscription(cancelled) — plan pool NOT wiped yet
   ├── subscription.on_hold → upsertSubscription(on_hold)
   ├── subscription.plan_changed → upsertSubscription(new plan)
   │
   └── refund.succeeded    → refundCredits(pool matching original grant) with spill
```

**Why `subscription.active` is state-only:** Dodo fires `subscription.active` AND `subscription.renewed` on first billing. Crediting on both would double-grant. We chose `renewed` because it fires on every billing cycle — `active` is just lifecycle state.

**Why `subscription.cancelled` doesn't wipe credits:** the user paid through `current_period_end`. Plan pool stays until `subscription.expired` fires at period end.

**Why top-up USD comes from metadata, not webhook amount:** webhook amount fields are in settlement currency (e.g. INR for India-settling merchants). Metadata `topup_usd_cents` is written at checkout time in USD and round-trips unchanged.

---

## Webhook events handled

`cloudflare/src/routes/webhooks.ts`. All events land via `POST /webhooks/dodo`:

| Event | Pool effect | Subscription state | Notes |
|---|---|---|---|
| `subscription.active` | — | → `active` | State only. No grant. |
| `subscription.renewed` | **setPlan(0) + addPlan(base × bonus)** | → `active`, updates `current_period_end` | Fires on first billing + every renewal. |
| `subscription.cancelled` | — | → `cancelled`, updates `current_period_end` | Plan pool retained until `.expired`. |
| `subscription.expired` | **setPlan(0)** | → `expired`, plan → `free`, interval → null | Period ended. Topup pool untouched. |
| `subscription.on_hold` | — | → `on_hold` | E.g., payment method failed. |
| `subscription.plan_changed` | — | updates plan + interval | Upgrade/downgrade. |
| `payment.succeeded` | **addTopup(amount × bonus)** if non-subscription | — | Skipped for subscription charges (`data.subscription_id` present). |
| `refund.succeeded` | **refund from original pool with spill** | — | Looks up original via `getPaymentCredit(payment_id)`. Empty metadata on refund webhooks → we derive user_id from our stored `payment_events` row. |

---

## Cost deduction (generation → usage_log + debit)

Owned by the Durable Object in `cloudflare/src/durable-objects/campaign-session.ts`.

**Pre-flight** (before spawning agent):
- `getBalance()` returns `balance_usd + balance_usd_topup`
- If below estimated cost, DO emits `error` event (insufficient credits UX) and does not start the sandbox.

**Post-turn** (after `tryFinalize`, inside `finalizeGeneration`):
1. Read cost data from `turn-result.json` (`totalCostUsd`, tokens, turns, duration)
2. Apply `COST_MULTIPLIER = 4`
3. Call `recordUsage(userId, campaignId, { requestId, eventType, … })`
4. `recordUsage` performs `INSERT OR IGNORE` on `usage_log`:
   - First insert wins → performs the atomic two-pool deduction and increments `total_spent_usd`, `total_generations`
   - Duplicate `(campaign_id, request_id)` → no-op, returns current balances with `alreadyRecorded: true`
5. DO emits `credits_update` WS event with new `balance`, `plan_balance`, `topup_balance`, `cost`

**Cancel / partial** (user cancels mid-turn): `recordCancelledUsage()` at `campaign-session.ts:483` still writes a `usage_log` row and deducts — partial work cost real API spend, user pays for it. Same idempotency guard via `request_id`.

**Per-turn delta cost:** the SDK reports cumulative cost across all turns of a session. `agent-runner.ts:323` declares `previousCostUsd`; `:396-399` computes the per-turn delta and passes it to the marker — so follow-ups are charged only for the follow-up's work, not the cumulative session cost.

---

## Refund mechanics

Refund webhooks from Dodo carry an empty metadata object — the original payment's `clerk_user_id` is NOT copied across. We reconstruct everything from our own audit trail.

`handleRefundSucceeded` (`webhooks.ts:313`):
1. Extract `data.payment_id` from the refund payload
2. Query `payment_events` for the most recent credit-granting row (`event_type IN ('payment.succeeded', 'subscription.renewed')`) matching that `payment_id`
3. Route the refund to the originating pool:
   - `subscription.renewed` → plan pool
   - `payment.succeeded` → topup pool
4. Call `refundCredits(userId, amount, preferPool)` which deducts from the preferred pool and spills into the other if insufficient. Floored at 0.

**Known gap:** partial refunds over-deduct. We deduct `original.amount_credited_usd` regardless of refund size. Acceptable until partial refunds become common — flagged in KNOWN_ISSUES.

---

## Client surface

### Zustand state (`client/src/store/index.ts`)

| Field | Type | Source |
|---|---|---|
| `creditBalance` | `number \| null` | `creditsApi.get().balance` (plan + topup, total spendable) |
| `planBalance` | `number \| null` | `creditsApi.get().plan_balance` |
| `topupBalance` | `number \| null` | `creditsApi.get().topup_balance` |
| `subscription` | `Subscription \| null` | `paymentsApi.getSubscription()` |
| `pricingModalOpen` | `boolean` | UI state |
| `topupModalOpen` | `boolean` | UI state |

Updates come from two sources:
- **REST** on app boot: `creditsApi.get()` + `paymentsApi.getSubscription()`
- **WS** during generation: `credits_update` event updates `creditBalance`, `planBalance`, `topupBalance` incrementally

### Components

| Path | Purpose |
|---|---|
| `client/src/components/pricing/PricingModal.tsx` | Plan selection (Starter/Pro, monthly/yearly). Calls `paymentsApi.checkout()`. |
| `client/src/components/pricing/TopupModal.tsx` | PWYW credit purchase. Min $5. Quick-picks $5/$10/$25/$50. Shows Pro bonus if applicable. Calls `paymentsApi.topup()`. |

### API client (`client/src/lib/api.ts`)

| Call | Endpoint |
|---|---|
| `creditsApi.get()` | `GET /api/credits` |
| `creditsApi.getUsage(limit, offset)` | `GET /api/credits/usage` |
| `paymentsApi.checkout(plan, email, name?)` | `POST /api/payments/checkout` |
| `paymentsApi.topup(amount, email, name?)` | `POST /api/payments/topup` |
| `paymentsApi.getSubscription()` | `GET /api/payments/subscription` |
| `paymentsApi.portal()` | `POST /api/payments/portal` |
| `eventsApi.track(eventType, campaignId?, metadata?)` | `POST /api/events` — fire-and-forget (`.catch(() => {})`), used for download analytics |

Modal state actions (also on the store): `openPricingModal()` / `closePricingModal()` / `openTopupModal()` / `closeTopupModal()`.

### Checkout return flow (`/checkout/success`)

`checkout` and `topup` responses return `{ checkout_url }` — client does `window.location = checkout_url`. Dodo redirects back to `/checkout/success`, handled inline by `CheckoutSuccess` in `App.tsx:368`. Behavior:

- Polls both `paymentsApi.getSubscription()` and `creditsApi.get()` in parallel
- Considers it a success when `sub.plan !== 'free'` OR `credits.balance > 0`
- Poll interval: 2s for first 30s, then 4s (to save API calls on slow webhooks)
- After 15s without success → flips to a "slow" UI surfacing a manual escape hatch; polling continues regardless
- On success: updates Zustand (`setSubscription`, `setCreditBalance`), redirects to `/` after 1.5s

This makes the UI resilient to webhook delays — webhooks can arrive seconds or minutes after the browser redirect depending on Dodo's retry schedule.

---

## Environment configuration

Product IDs and Dodo API base differ per environment. All in `cloudflare/wrangler.jsonc` under `env.staging.vars` and `env.production.vars`.

| Var | Staging | Production |
|---|---|---|
| `DODO_API_BASE` | `https://test.dodopayments.com` | `https://live.dodopayments.com` |
| `DODO_PRODUCT_STARTER_MONTHLY` | `pdt_0Ncsitv…` | `pdt_0NcxwIS…` |
| `DODO_PRODUCT_STARTER_YEARLY` | `pdt_0NcsjiT…` | `pdt_0NcxwZj…` |
| `DODO_PRODUCT_PRO_MONTHLY` | `pdt_0Ncsk05…` | `pdt_0NcxwnB…` |
| `DODO_PRODUCT_PRO_YEARLY` | `pdt_0NcskEv…` | `pdt_0NcxwyB…` |
| `DODO_PRODUCT_TOPUP` | `pdt_0NcskiE…` | `pdt_0NcxxG1…` |

Secrets (set via `wrangler secret put`, same names across envs — the API key itself is environment-specific):
- `DODO_PAYMENTS_API_KEY` — Bearer token for Dodo REST API
- `DODO_PAYMENTS_WEBHOOK_SECRET` — Format `whsec_<base64>`, used for HMAC signature verification

Webhook URLs Dodo posts to (configured in Dodo dashboard, not in wrangler):
- Staging: `https://creative-agent-staging.alphasapien17.workers.dev/webhooks/dodo`
- Production: `https://creativemachines.xyz/webhooks/dodo`

---

## Gotchas

1. **Webhook arrival is not instant.** Client redirects back to `/checkout/success` before the webhook fires ~90% of the time. The success page polls `/api/credits` indefinitely rather than showing a stale balance.

2. **Top-up amount comes from metadata, never webhook amount.** Dodo's webhook amount is in settlement currency (e.g. INR). Metadata `topup_usd_cents` is the USD source of truth.

3. **`subscription.active` fires twice on first billing (once for "active", once for "renewed").** We credit only on `renewed` to avoid double-grant. If you see missing credits after a first purchase, check that `subscription.renewed` actually fired.

4. **`subscription.cancelled` ≠ credits gone.** User keeps plan pool until `subscription.expired` at period end. The "Cancel" button in the customer portal sets `status='cancelled'` but leaves `balance_usd` intact.

5. **Refunds lose metadata.** Don't look for `clerk_user_id` on a `refund.succeeded` webhook — it's empty. Always look up via `getPaymentCredit(payment_id)`.

6. **Partial refunds over-deduct** (see Refund mechanics above). Flagged in KNOWN_ISSUES.

7. **No subscription-refund handling yet** — we always take from plan pool for subscription refunds, spilling to topup. If a user got refunded $25 but already spent $20 of their $27.50 plan grant, they lose ~$17.50 from their topup pool too. Documented, accepted for now.

8. **Local dev has no billing.** The local `server/` path does not enforce credits, does not talk to Dodo, and the `user_credits` table exists in the local SQLite but is never read. Any billing bug must be reproduced in staging.

9. **Cost multiplier of 4 is not exposed to users.** They see credits (USD × 10). Raw API costs stay in `usage_log` for audit — compare `claude_cost_usd + image_cost_usd` against `total_cost_usd` in that table to see the gross margin.

10. **`recordUsage` can produce negative balances.** By design. If you see `balance_usd < 0` or `balance_usd_topup < 0` in audit queries, a pre-flight check was skipped or a race condition fired — investigate rather than floor it.

---

## See Also

- [D1 Database](../cloudflare/D1_DATABASE.md) — full schema for `user_credits`, `usage_log`, `user_subscriptions`, `payment_events`, `user_events`
- [REST API](./REST_API.md) — endpoint reference for `/api/credits*`, `/api/payments/*`, `/webhooks/dodo`
- [Durable Object](../cloudflare/DURABLE_OBJECT.md) — where pre-flight check + post-turn deduction live
- [WebSocket Protocol](./WEBSOCKET_PROTOCOL.md) — `credits_update` event shape
- Session docs: `SESSION_62_USAGE_TRACKING_IMPLEMENTATION`, `SESSION_70-73` (Dodo Payments rollout)
