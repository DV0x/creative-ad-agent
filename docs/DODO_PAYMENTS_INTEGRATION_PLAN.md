# Dodo Payments Integration Plan

## Context
Creative Agent has a working credit system (10 credits = $1 USD, deducted per generation) but no way to buy credits or subscribe. We're adding Dodo Payments for subscriptions (Starter/Pro) and one-time credit top-ups. Free users get nothing — hard paywall. No VC subsidies.

## Pricing (finalized)
| | Free | Starter ($19/mo, $192/yr) | Pro ($49/mo, $492/yr) |
|---|---|---|---|
| Credits/mo | 0 | 275 (250+10%) | 900 (750+20%) |
| Top-ups | Yes, no bonus, $5 min | Yes, no bonus, $5 min | Yes, 20% bonus, $5 min |
| Rollover | No | No | No |
| Generation | Blocked | Yes | Yes |

**Hard paywall**: Free users get 0 credits, 0 generations. Any prompt → paywall upsell. Generation unlocks on first purchase (subscription or top-up).

---

## Phase 1: Backend — Schema + DB Layer

### 1a. Schema migration (`cloudflare/schema.sql`)
Add two new tables:

```sql
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id TEXT PRIMARY KEY,
  dodo_customer_id TEXT,
  dodo_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',     -- 'free' | 'starter' | 'pro'
  billing_interval TEXT,                 -- 'monthly' | 'yearly' | null
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'cancelled' | 'expired' | 'on_hold'
  current_period_end TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payment_events (
  webhook_id TEXT PRIMARY KEY,           -- from webhook-id header (dedup)
  event_type TEXT NOT NULL,
  user_id TEXT,
  amount_usd REAL,
  amount_credited_usd REAL,              -- USD added to balance (after bonus). All amounts in USD, not display credits.
  metadata TEXT,                         -- full event JSON for debugging
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payment_events_user ON payment_events(user_id);
```

### 1b. Update DEFAULT_BALANCE (`cloudflare/src/db/credits.ts`)
- Change `DEFAULT_BALANCE` from `5.0` to `0` (hard paywall, zero free credits)

### 1c. New DB module (`cloudflare/src/db/subscriptions.ts`)
Functions:
- `getSubscription(db, userId)` → returns user_subscriptions row or null (plan defaults to 'free')
- `upsertSubscription(db, userId, data)` → insert or update subscription record
- `isWebhookProcessed(db, webhookId)` → check payment_events table for dedup
- `recordWebhookEvent(db, webhookId, eventType, userId, amountUsd, creditsAdded, metadata)`

Reuses: `addCredits()` from existing `credits.ts`.

**New function in `credits.ts`** (needed for no-rollover):
- `setBalance(db, userId, amountUsd)` → sets `balance_usd` to exact value (used before granting renewal credits to enforce no-rollover)

---

## Phase 2: Backend — Webhook Handler

### 2a. Webhook route (`cloudflare/src/routes/webhooks.ts`)
- Path: `POST /webhooks/dodo`
- **Unauthenticated** — Dodo calls this, not the user
- Signature verification using `crypto.subtle` (native Workers API, no npm deps):
  - Reconstruct: `${webhook-timestamp}.${rawBody}`
  - HMAC-SHA256 with `DODO_PAYMENTS_WEBHOOK_SECRET`
  - Use `crypto.subtle.verify('HMAC', key, signature, data)` — inherently constant-time, no timing side-channel
  - Parse `webhook-signature` header (`v1,<base64sig>`) → extract base64 signature
  - **Reject if timestamp > 5 min old** (replay attack prevention)
- Idempotency: check `webhook-id` header against `payment_events` table before processing
- User identity: read `data.metadata.clerk_user_id` (set during checkout creation)

**Event handlers:**

| Event | Action |
|-------|--------|
| `subscription.active` | Upsert subscription (plan, interval, period_end). Add credits via PLAN_CONFIG lookup (monthly=1mo, yearly=12mo upfront) |
| `subscription.renewed` | **Reset balance to 0** (no rollover), then add renewal credits via PLAN_CONFIG. Same bonus math as active |
| `subscription.cancelled` | Set status='cancelled'. Keep credits until `current_period_end` |
| `subscription.expired` | Set status='expired', plan='free'. Don't zero out remaining credits (top-up credits are plan-agnostic) |
| `subscription.on_hold` | Set status='on_hold'. Credits remain, generation still works until expired |
| `subscription.plan_changed` | Update plan tier. Don't grant extra credits until next renewal |
| `payment.succeeded` (one-time) | Look up user's plan. Add credits: amount × CREDITS_PER_USD × (1.2 if Pro, else 1.0) |
| `refund.succeeded` | Deduct refunded amount from balance via `setBalance(db, userId, Math.max(0, currentBalance - refundAmountUsd))` |

**Credit bonus math** (stored internally as USD, displayed as credits × 10):

```
Subscription credits — MONTHLY (USD added to balance):
  Starter monthly: 25.0 * 1.1  = 27.50 USD =   275 credits
  Pro monthly:     75.0 * 1.2  = 90.00 USD =   900 credits

Subscription credits — YEARLY (12× monthly, granted upfront):
  Starter yearly: 300.0 * 1.1  = 330.00 USD = 3,300 credits
  Pro yearly:     900.0 * 1.2  = 1080.00 USD = 10,800 credits

Top-up credits (USD added, plan-agnostic — survive subscription expiry):
  Free/Starter: amount as-is      ($5 = 50 credits)
  Pro:          amount * 1.2       ($5 = 60 credits)

No-rollover enforcement (monthly plans only):
  On subscription.renewed → setBalance(db, userId, 0) THEN addCredits(db, userId, renewalAmount)
  Yearly plans: all credits granted upfront, no monthly reset needed
```

### 2b. Wire into entry point (`cloudflare/src/index.ts`)
Add **before** the `/api/` check (line ~40):
```typescript
if (url.pathname === '/webhooks/dodo' && method === 'POST') {
  return handleDodoWebhook(request, env);
}
```
Goes in `index.ts` not `router.ts` — webhooks are unauthenticated, don't follow `/api/` pattern.

### 2c. Env updates (`cloudflare/src/env.d.ts`)
```typescript
DODO_PAYMENTS_API_KEY: string;
DODO_PAYMENTS_WEBHOOK_SECRET: string;
```

---

## Phase 3: Backend — Payment Routes

### 3a. Payment routes (`cloudflare/src/routes/payments.ts`)
All authenticated (behind existing Clerk auth in router.ts):

**POST /api/payments/checkout** — Create subscription checkout
- Input: `{ plan: 'starter-monthly' | 'starter-yearly' | 'pro-monthly' | 'pro-yearly' }`
- Map plan string → Dodo product_id (hardcoded config map)
- Call Dodo API via fetch: `POST https://api.dodopayments.com/checkout-sessions`
- Include `metadata: { clerk_user_id: userId }` for webhook identity mapping
- Return: `{ checkout_url: string }`

**POST /api/payments/topup** — Create top-up checkout
- Input: `{ amount: number }` (validate >= 5)
- Create one-time product checkout via Dodo API
- Include metadata with clerk_user_id
- Return: `{ checkout_url: string }`

**GET /api/payments/subscription** — Get current plan
- Read from `user_subscriptions` table (defaults to `{ plan: 'free' }` if no row)
- Return: `{ plan, status, billing_interval, current_period_end }`

**POST /api/payments/portal** — Get Dodo customer portal URL
- Call Dodo API for portal session (billing management, cancel, payment method)
- Return: `{ portal_url: string }`

No Dodo SDK — plain `fetch()` calls with `Authorization: Bearer ${DODO_PAYMENTS_API_KEY}`. Keeps bundle small, avoids npm dep.

**Shared product config map** (used by both checkout routes and webhook handler):
```typescript
const PLAN_CONFIG: Record<string, { plan: 'starter' | 'pro'; interval: 'monthly' | 'yearly'; baseCreditsUsd: number }> = {
  'prod_starter_monthly': { plan: 'starter', interval: 'monthly', baseCreditsUsd: 25.0 },
  'prod_starter_yearly':  { plan: 'starter', interval: 'yearly',  baseCreditsUsd: 300.0 },  // 25 × 12
  'prod_pro_monthly':     { plan: 'pro',     interval: 'monthly', baseCreditsUsd: 75.0 },
  'prod_pro_yearly':      { plan: 'pro',     interval: 'yearly',  baseCreditsUsd: 900.0 },  // 75 × 12
};
// Product IDs will be replaced with actual Dodo product_ids after dashboard setup
```
This config is used by:
- **Checkout routes**: map plan string → product_id
- **Webhook handler**: map product_id → plan tier + credit amount for bonus calculation

### 3b. Router update (`cloudflare/src/router.ts`)
```typescript
import { handlePaymentsRequest } from './routes/payments.js';

// After credits route block (line ~52):
if (path.startsWith('/api/payments')) {
  return corsResponse(await handlePaymentsRequest(request, env, userId, path, method));
}
```

---

## Phase 4: Frontend — State + API

### 4a. API client (`client/src/lib/api.ts`)
```typescript
export interface Subscription {
  plan: 'free' | 'starter' | 'pro';
  status: string;
  billing_interval?: string;
  current_period_end?: string;
}

export const paymentsApi = {
  getSubscription: () => apiFetch<Subscription>('/payments/subscription'),
  checkout: (plan: string) => apiFetch<{ checkout_url: string }>('/payments/checkout', {
    method: 'POST', body: JSON.stringify({ plan }),
  }),
  topup: (amount: number) => apiFetch<{ checkout_url: string }>('/payments/topup', {
    method: 'POST', body: JSON.stringify({ amount }),
  }),
  portal: () => apiFetch<{ portal_url: string }>('/payments/portal', { method: 'POST' }),
};
```

### 4b. Zustand store (`client/src/store/index.ts`)
Add alongside existing `creditBalance`:
```typescript
subscription: Subscription | null
setSubscription: (sub: Subscription) => void
pricingModalOpen: boolean
openPricingModal: () => void
closePricingModal: () => void
topupModalOpen: boolean
openTopupModal: () => void
closeTopupModal: () => void
```

### 4c. Load on app init (`client/src/App.tsx`)
Add `paymentsApi.getSubscription()` to the existing `Promise.all` (line ~73):
```typescript
const [campaignsList, folders, creditsData, subscriptionData] = await Promise.all([
  campaignsApi.list(),
  assetsApi.listFolders(),
  creditsApi.get().catch(() => null),
  paymentsApi.getSubscription().catch(() => ({ plan: 'free' as const, status: 'active' })),
]);
```

---

## Phase 5: Frontend — UI Components

### 5a. Client-side paywall gate (`client/src/hooks/useWebSocket.ts`)
**Two layers of protection:**

**Layer 1 — Pre-send check (instant UX):**
In `generate()` (line ~443) and `followUp()` (line ~547), check `creditBalance <= 0` BEFORE sending the WS message. If blocked, open PricingModal instead of sending. This gives instant feedback without a server round-trip.

```typescript
// In generate() and followUp():
const { creditBalance } = useStore.getState();
if (creditBalance !== null && creditBalance <= 0) {
  store.openPricingModal(); // show paywall
  return;
}
```

**Layer 2 — Server-side error (security boundary, fallback):**
The `INSUFFICIENT_CREDITS` error handler (line ~272) currently just shows error text. Update to:
- Show contextual upsell message in chat: "Subscribe to get started" (never paid) vs "Out of credits — top up or upgrade" (ran out)
- Include "Subscribe" button → opens PricingModal
- Include "Buy Credits" button → opens TopupModal
- This catches race conditions (credits used between page load and submit)

### 5b. EmptyState paywall (`client/src/components/EmptyState.tsx`)
The landing page input box (`handleSubmit`, line 64) calls `generate()` directly. For free users (0 credits):
- Let them type in the input (see the UX, feel the product)
- On submit, open PricingModal instead of calling `generate()`
- The pre-send check in 5a handles this, but EmptyState could also show a subtle "Subscribe to generate" hint below the input

### 5c. PricingModal (`client/src/components/pricing/PricingModal.tsx`)
- Three tier cards: Free (current) / Starter / Pro
- Monthly ↔ Yearly toggle (show savings: "Save 16%")
- "Current Plan" badge on active tier
- CTA button → `paymentsApi.checkout(plan)` → `window.location.href = checkout_url`
- Uses existing Card, Button (glow variant for CTA), Dialog
- Design: monochrome + coral (#E8553A) CTA

### 5d. TopupModal (`client/src/components/pricing/TopupModal.tsx`)
- Credit pack grid: $5 (50), $10 (100), $25 (250), $50 (500)
- If user is Pro: show "+20% bonus" badge on each pack (e.g., "$5 → 60 credits")
- CTA → `paymentsApi.topup(amount)` → redirect to Dodo checkout

### 5e. UserMenu updates (`client/src/components/auth/UserMenu.tsx`)
- Show plan badge: "Free" / "Starter" / "Pro" next to credit balance
- Dropdown items: "Upgrade Plan" → PricingModal, "Buy Credits" → TopupModal
- If subscribed: "Manage Billing" → `paymentsApi.portal()` → open portal URL

### 5f. Return URL page — Optimistic UI
- Handle `/checkout/success` in App.tsx pathname routing
- **Optimistic approach** (webhook may not have arrived yet when Dodo redirects back):
  - Immediately show "Payment received! Your credits are on the way..." with a subtle loading spinner
  - Start polling `GET /api/payments/subscription` every 2s (max 30s / 15 attempts)
  - When subscription plan changes from 'free' → paid (or credits increase): show success toast, stop polling
  - If poll times out: show "Credits arriving shortly — you'll see them appear automatically" (WebSocket `credits_update` will catch up)
  - Auto-redirect to workspace after success confirmation
- Parse `?session_id=` from URL for analytics tracking
- Clear the checkout state from Zustand store

---

## Phase 6: Dodo Dashboard Setup + Secrets

### Products to create:
| Product | Type | Price |
|---------|------|-------|
| `starter-monthly` | Subscription | $19/mo |
| `starter-yearly` | Subscription | $192/yr |
| `pro-monthly` | Subscription | $49/mo |
| `pro-yearly` | Subscription | $492/yr |
| `topup-5` | One-time | $5 |
| `topup-10` | One-time | $10 |
| `topup-25` | One-time | $25 |
| `topup-50` | One-time | $50 |

### Webhook configuration:
- URL: `https://creative-agent.alphasapien17.workers.dev/webhooks/dodo`
- Events: `subscription.*`, `payment.succeeded`, `refund.succeeded`

### Secrets:
```bash
echo -n 'your-api-key' | npx wrangler secret put DODO_PAYMENTS_API_KEY
echo -n 'your-webhook-secret' | npx wrangler secret put DODO_PAYMENTS_WEBHOOK_SECRET
```

---

## Key Design Decisions

1. **Hard paywall** — 0 free credits, 0 free generations. Pay to play.
2. **Two-layer paywall** — Client checks `creditBalance <= 0` before sending WS message (instant UX). Server DO checks `balance <= 0` as security boundary (fallback).
3. **No Dodo SDK** — plain fetch() to Dodo API. No npm dependency.
4. **Bonuses in our webhook handler** — Dodo doesn't know about 10%/20%. We calculate and call `addCredits()`.
5. **User mapping via metadata** — Clerk userId passed in checkout metadata, read back in webhook.
6. **Cancel = keep credits until period end** — don't punish users who cancel. They paid for the month.
7. **Plan change = no immediate credit grant** — credits come at next renewal, not mid-cycle.
8. **Replay protection** — reject webhook timestamps > 5 min old.
9. **Negative balance possible** — mid-generation can overshoot, but next generation is blocked. Fine for v1.
10. **No local dev payment flow** — payments are production-only. Locally, manually set credits via SQLite.
11. **Top-up credits work regardless of subscription** — if subscription expires but user has leftover top-up credits (balance > 0), they can still generate. Credits are plan-agnostic.
12. **Shared product config map** — single source of truth mapping Dodo product_ids to plan tiers and credit amounts. Used by both checkout and webhook handler.
13. **No rollover (monthly plans)** — On `subscription.renewed`, reset balance to 0 before granting new credits. Unused subscription credits are lost (industry standard — Midjourney, Adobe, Figma). Top-up credits are NOT reset — they persist through renewals and even subscription expiry.
14. **Yearly = 12× upfront** — Yearly subscribers get all 12 months of credits at activation. No monthly drip. `subscription.renewed` fires once per year with the full yearly amount.
15. **Refunds deduct credits** — `refund.succeeded` webhook deducts the refunded USD from balance (floored at 0). No partial refund logic — full refund = full deduction.
16. **Optimistic checkout success UI** — `/checkout/success` shows immediate confirmation with polling fallback. Webhook race condition handled by polling subscription status + WebSocket `credits_update` catch-up.
17. **Timing-safe webhook verification** — Use `crypto.subtle.verify('HMAC', ...)` which is inherently constant-time. Never compare signature strings directly.

---

## Existing User Migration

When `DEFAULT_BALANCE` changes from 5.0 to 0:
- **Existing users**: Keep their current balance (no change to `user_credits` rows already in D1)
- **New signups**: Get 0 credits (hard paywall)
- **No migration script needed** — `getOrCreateCredits()` only inserts `DEFAULT_BALANCE` for users with no existing row
- Existing users with remaining free credits can continue using them until depleted

---

## Implementation Order
1. Schema + DB layer (Phase 1) — foundation
2. Webhook handler (Phase 2) — testable with Dodo test mode
3. Payment routes + router (Phase 3) — checkout flows
4. Frontend state + API (Phase 4) — wire up client
5. UI components (Phase 5) — paywall, pricing modal, top-up, badges
6. Dodo dashboard setup (Phase 6) — products, webhook URL, secrets

## Files Modified
| File | Change |
|------|--------|
| `cloudflare/schema.sql` | Add user_subscriptions + payment_events tables |
| `cloudflare/src/db/credits.ts` | DEFAULT_BALANCE → 0, add `setBalance()` for no-rollover reset |
| `cloudflare/src/env.d.ts` | Add DODO_PAYMENTS_API_KEY, DODO_PAYMENTS_WEBHOOK_SECRET |
| `cloudflare/src/index.ts` | Add /webhooks/dodo route (unauthenticated, before /api/) |
| `cloudflare/src/router.ts` | Add /api/payments/* route |
| `client/src/lib/api.ts` | Add paymentsApi + Subscription type |
| `client/src/store/index.ts` | Add subscription + modal state (pricingModalOpen, topupModalOpen) |
| `client/src/App.tsx` | Load subscription on init, handle /checkout/success |
| `client/src/hooks/useWebSocket.ts` | Pre-send paywall check in generate()/followUp() + INSUFFICIENT_CREDITS upsell |
| `client/src/components/auth/UserMenu.tsx` | Plan badge, upgrade/topup/billing links |
| `client/src/components/EmptyState.tsx` | Paywall check on submit for free users |

## Files Created
| File | Purpose |
|------|---------|
| `cloudflare/src/db/subscriptions.ts` | Subscription + webhook DB operations |
| `cloudflare/src/routes/webhooks.ts` | Dodo webhook handler (HMAC + timestamp verified) |
| `cloudflare/src/routes/payments.ts` | Checkout, topup, subscription, portal routes |
| `client/src/components/pricing/PricingModal.tsx` | Tier comparison + checkout |
| `client/src/components/pricing/TopupModal.tsx` | Credit pack purchase |

## Verification
1. Set Dodo to test mode, create all 8 products
2. `wrangler secret put` both keys
3. Deploy, send test webhook to `/webhooks/dodo` — verify 200, dedup, credits added
4. Test replay rejection (old timestamp → 400)
5. `POST /api/payments/checkout` — verify redirect URL returns
6. Complete test checkout → webhook fires → credits appear in UI
7. Test top-up: free user (no bonus) vs Pro user (20% bonus)
8. Test subscription lifecycle: active → renewed → cancelled → expired
9. Test no-rollover: subscribe → use some credits → trigger renewal → verify balance reset to 0 + new credits (not accumulated)
10. Test yearly grant: yearly subscription → verify 12× credits granted upfront
11. Test refund: issue refund via Dodo → verify credits deducted, balance floors at 0
12. Test hard paywall: new user → 0 credits → try generate → paywall shown
13. Test return URL: `/checkout/success` shows optimistic UI → polls until credits appear → redirects to workspace
14. Test webhook race: complete checkout → verify optimistic UI handles delay gracefully (spinner → success)
