# Session 71 — Dodo Payments Implementation (2026-04-10)

## What We Did
Implemented the full Dodo Payments integration planned in Session 70 (Phases 1-5), deployed to staging for UI testing, and iterated on the pricing model before landing back on the original Session 70 plan.

## Pre-Implementation: Plan Feasibility Review

Did a staff-engineer review of `docs/DODO_PAYMENTS_INTEGRATION_PLAN.md` against the actual codebase. Found and fixed **3 critical issues** in the plan before writing any code:

### Critical Fixes
1. **Yearly credit grant math was broken** — PLAN_CONFIG mapped both monthly and yearly Starter to `baseCreditsUsd: 25.0`. Yearly subscribers would get 275 credits/year vs monthly's 3,300 credits/year. Fixed by setting yearly to 12× monthly (`300.0` for Starter, `900.0` for Pro).
2. **"No rollover" had no implementation** — Plan said no rollover but `addCredits()` just increments balance. Added `setBalance()` to `credits.ts` to reset balance to 0 on `subscription.renewed` before granting new credits.
3. **Webhook-to-client race condition** — User completes checkout → redirected to `/checkout/success` → client fetches credits → webhook hasn't arrived yet → user sees 0 credits. Fixed with optimistic UI that polls `/api/payments/subscription` every 2s for up to 30s.

### Also Fixed
- Added `refund.succeeded` webhook handler (plan missed this)
- Specified `crypto.subtle.verify('HMAC', ...)` for timing-safe verification
- Renamed `credits_added` column → `amount_credited_usd` (unit clarity)

## Implementation (Phases 1-5)

### Phase 1: Schema + DB Layer ✅
**Modified:**
- `cloudflare/schema.sql` — Added `user_subscriptions` + `payment_events` tables with CHECK constraints on plan/billing_interval/status
- `cloudflare/src/db/credits.ts` — `DEFAULT_BALANCE` 5.0 → 0 (hard paywall), added `setBalance()` function

**Created:**
- `cloudflare/src/db/subscriptions.ts` — `getSubscription`, `upsertSubscription`, `isWebhookProcessed`, `recordWebhookEvent`

### Phase 2: Webhook Handler ✅
**Created:**
- `cloudflare/src/routes/webhooks.ts` — Full handler with:
  - HMAC-SHA256 signature verification via `crypto.subtle.verify()` (constant-time)
  - 5-minute timestamp window (replay protection)
  - Idempotency via `webhook-id` header
  - Event handlers: `subscription.{active,renewed,cancelled,expired,on_hold,plan_changed}`, `payment.succeeded`, `refund.succeeded`
  - No-rollover enforcement on renewals
  - Refund deduction with floor at 0

**Modified:**
- `cloudflare/src/index.ts` — Wired `POST /webhooks/dodo` before auth check (unauthenticated path)
- `cloudflare/src/env.d.ts` — Added `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_SECRET`

### Phase 3: Payment Routes ✅
**Created:**
- `cloudflare/src/routes/payments.ts` — All authenticated:
  - `POST /api/payments/checkout` — subscription checkout
  - `POST /api/payments/topup` — one-time top-up (validates amount ≥ $5, matches TOPUP_PRODUCTS)
  - `GET /api/payments/subscription` — current plan status
  - `POST /api/payments/portal` — Dodo customer portal URL
  - Plain `fetch()` to Dodo API (no SDK dependency)

**Modified:**
- `cloudflare/src/router.ts` — Added `/api/payments/*` route after credits block

### Phase 4: Frontend State + API ✅
**Modified:**
- `client/src/lib/api.ts` — Added `paymentsApi` (getSubscription, checkout, topup, portal) + `Subscription` type
- `client/src/store/index.ts` — Added `subscription`, `pricingModalOpen`, `topupModalOpen` state + actions (+ reset state)
- `client/src/App.tsx` — Loads subscription via `Promise.all` on mount, added `<CheckoutSuccess>` component with polling logic, mounted `<PricingModal>` and `<TopupModal>` at root

### Phase 5: UI Components ✅
**Created:**
- `client/src/components/pricing/PricingModal.tsx` — 3 tier cards (Free/Starter/Pro), monthly/yearly toggle with "Save 16%" label, current plan badge, coral CTA for Pro
- `client/src/components/pricing/TopupModal.tsx` — 4-pack grid ($5/$10/$25/$50), "+20%" badge for Pro subscribers

**Modified:**
- `client/src/hooks/useWebSocket.ts`:
  - Pre-send paywall check in `generate()` and `followUp()` — opens PricingModal if `creditBalance <= 0`
  - `INSUFFICIENT_CREDITS` handler — now shows contextual upsell ("Subscribe" vs "Out of credits") and opens PricingModal
- `client/src/components/auth/UserMenu.tsx` — Plan badge next to credit count, hover dropdown with Upgrade/Buy Credits/Manage Billing

## Staging Deployment

1. Applied schema migration to staging D1 (`creative-agent-db`)
2. Set placeholder secrets (`DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_SECRET`) — real Dodo keys pending account creation
3. Built with `npm run build:staging` (not `build` — avoids production Clerk key issues)
4. Deployed to `https://creative-agent-staging.alphasapien17.workers.dev`
5. Zeroed credits for test user `user_38uxIJdRftKkSkstogHasnk6c2J` to trigger paywall UI

## Pricing Model Iteration

User tested the modal and found the "credits upfront" copy confusing. Iterated multiple times:

| Iteration | Starter credits | Pro credits | Notes |
|---|---|---|---|
| Original (Session 70) | 275 (250+10%) | 900 (750+20%) | 10% Starter bonus + 20% Pro bonus |
| Attempt 1 | 250 flat | 900 (750+20%) | Removed Starter bonus |
| Attempt 2 | 209 (10% on $19) | 588 (20% on $49) | Dialed down bonuses |
| Attempt 3 | 200 flat | 600 flat | Fully simplified, no bonuses |
| **Final** | **275 (250+10%)** | **900 (750+20%)** | Reverted to original |

**Why reverted:** Without bonuses, there's no reason to subscribe vs just top up — rates become identical (10 credits/$). The original 10%/20% subscription bonuses create a clear incentive to subscribe, and the Pro 20% top-up bonus reinforces Pro as the premium tier.

Also fixed copy bugs:
- "3,300 credits upfront" → "3,300 credits/year" (less jargon)
- Removed duplicate "275 credits/month" from Starter features list (already shown above features)
- Added explicit "10% credit bonus" and "20% credit bonus" lines to features for clarity
- Added "20% top-up bonus" to Pro features

## Files Changed

### Created (6 files)
| File | Purpose |
|------|---------|
| `cloudflare/src/db/subscriptions.ts` | Subscription + webhook event DB operations |
| `cloudflare/src/routes/webhooks.ts` | Dodo webhook handler with HMAC verification |
| `cloudflare/src/routes/payments.ts` | Checkout, topup, subscription status, portal routes |
| `client/src/components/pricing/PricingModal.tsx` | Tier comparison + checkout |
| `client/src/components/pricing/TopupModal.tsx` | Credit pack purchase |
| `docs/SESSION_71_DODO_PAYMENTS_IMPLEMENTATION_2026-04-10.md` | This file |

### Modified (11 files)
| File | Change |
|------|--------|
| `cloudflare/schema.sql` | Added user_subscriptions + payment_events tables |
| `cloudflare/src/db/credits.ts` | DEFAULT_BALANCE → 0, added setBalance() |
| `cloudflare/src/env.d.ts` | Added DODO_PAYMENTS_API_KEY, DODO_PAYMENTS_WEBHOOK_SECRET |
| `cloudflare/src/index.ts` | Added /webhooks/dodo route (pre-auth) |
| `cloudflare/src/router.ts` | Added /api/payments/* route |
| `client/src/lib/api.ts` | Added paymentsApi + Subscription type |
| `client/src/store/index.ts` | Added subscription + modal state |
| `client/src/App.tsx` | Load subscription on init, CheckoutSuccess component, mount modals |
| `client/src/hooks/useWebSocket.ts` | Pre-send paywall check + INSUFFICIENT_CREDITS upsell |
| `client/src/components/auth/UserMenu.tsx` | Plan badge + payment dropdown menu |
| `docs/DODO_PAYMENTS_INTEGRATION_PLAN.md` | Updated with all 3 critical fixes + 4 additional improvements |

## What's NOT Done Yet

### Phase 6: Dodo Dashboard Setup
- [ ] Create Dodo Payments account at dodopayments.com
- [ ] Create 8 products in test mode (4 subscriptions + 4 top-ups)
- [ ] Copy real product IDs into `PLAN_CONFIG` (webhooks.ts) and `CHECKOUT_PRODUCTS`/`TOPUP_PRODUCTS` (payments.ts)
- [ ] Configure webhook URL: `https://creative-agent-staging.alphasapien17.workers.dev/webhooks/dodo`
- [ ] Replace placeholder secrets with real test keys
- [ ] Also repeat for production environment

### End-to-End Testing
- [ ] Test real Dodo checkout → webhook fires → credits appear
- [ ] Test yearly subscription grants 12× credits upfront
- [ ] Test renewal resets balance to 0 then adds new credits (no rollover)
- [ ] Test refund deducts credits correctly
- [ ] Test `/checkout/success` polling with real webhook timing

## Verification Done
✅ TypeScript compiles clean (both `client/` and `cloudflare/`)
✅ Schema applied to staging D1
✅ Worker deployed to staging
✅ PricingModal renders 3 tiers + monthly/yearly toggle
✅ TopupModal renders 4 packs
✅ Credit badge dropdown shows appropriate menu based on plan
✅ Paywall gate triggers when balance = 0

## Key Design Decisions Reaffirmed

From the Session 70 plan, these decisions held through iteration:
1. **Subscription bonuses ARE needed** — removing them eliminates the incentive to subscribe vs top-up
2. **Pro tier premium feel** — 20% subscription bonus + 20% top-up bonus + priority support
3. **Starter as entry tier** — 10% subscription bonus, no top-up bonus
4. **No rollover** — monthly plans reset balance on renewal, yearly plans grant 12× upfront
5. **Top-up credits survive subscription expiry** — plan-agnostic

## Artifacts
- **Plan doc**: `docs/DODO_PAYMENTS_INTEGRATION_PLAN.md` (updated with all fixes)
- **Staging URL**: `https://creative-agent-staging.alphasapien17.workers.dev`
- **Version ID**: `61359550-03c7-4fe4-9c60-c3cee920a91c`

## Next Session — TODO
1. Create Dodo Payments account + 8 products
2. Swap placeholder secrets for real test keys on staging
3. Complete Phase 6 (dashboard setup)
4. End-to-end test with real checkout flow (test card `4242 4242 4242 4242`)
5. Verify all 4 webhook event types work correctly
6. Repeat secret setup + schema migration for production environment
