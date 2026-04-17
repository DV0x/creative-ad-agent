# Session 72 — Dodo Payments End-to-End on Staging (2026-04-17)

## What We Did
Completed Phase 6 from Session 71's TODO. Created Dodo account + 5 products, wired real product IDs, fixed **9 bugs** discovered through E2E testing, validated subscription purchase end-to-end on staging. The integration now correctly grants exact credits with no double-counting.

## Dodo Dashboard Setup

### Account + Products (test mode)
Created 5 products instead of the originally-planned 8 — collapsed the 4 fixed top-up packs into a single Pay-What-You-Want product with quick-pick chips in the UI.

| # | Name | Type | Price | Product ID |
|---|------|------|-------|-----------|
| 1 | Starter Monthly | Subscription, 1 Month | $19 | `pdt_0NcsitvWGHrNBkCZWZI3m` |
| 2 | Starter Yearly | Subscription, 1 Year | $192 | `pdt_0NcsjiTK1Y8BE0vVf2CIK` |
| 3 | Pro Monthly | Subscription, 1 Month | $49 | `pdt_0Ncsk05kzD4TfbTVmH21i` |
| 4 | Pro Yearly | Subscription, 1 Year | $492 | `pdt_0NcskEvBnUSeKaFX9MbQd` |
| 5 | Credits Top-up | One-time, **PWYW min $5** | variable | `pdt_0NcskiE2H7xCcT7vIIkJQ` |

### Webhook Configuration
- URL: `https://creative-agent-staging.alphasapien17.workers.dev/webhooks/dodo`
- 8 events subscribed: `subscription.{active,renewed,cancelled,expired,on_hold,plan_changed}`, `payment.succeeded`, `refund.succeeded`
- ⚠️ **Test API key was shared in chat** — should be rotated before any production use

## Bugs Found & Fixed (in order discovered)

### 1. Wrong Dodo API base URL
- **Symptom**: HTTP 530 + Cloudflare error 1016 ("origin unreachable")
- **Cause**: We hardcoded `https://api.dodopayments.com` from the SDK skill docs
- **Fix**: Dodo has separate base URLs per mode — `https://test.dodopayments.com` for test, `https://live.dodopayments.com` for live
- File: `cloudflare/src/routes/payments.ts`

### 2. Wrong checkout endpoint
- **Symptom**: HTTP 403 "RBAC: access denied" — even though API key had read+write
- **Cause**: REST endpoint is `/checkouts`, not `/checkout-sessions` (the SDK exposes it as `client.checkoutSessions.create()` which is misleading)
- **Fix**: Changed all `/checkout-sessions` → `/checkouts`

### 3. Wrong checkout payload shape
- **Symptom**: 403 even with correct endpoint
- **Cause**: We sent `{ product_id: "...", ... }` — Dodo expects `{ product_cart: [{ product_id, quantity }], customer: { email }, ... }`
- **Fix**: Wrapped product in cart array, added required `customer.email`

### 4. Webhook signature verification was wrong
- **Symptom**: All webhook deliveries returned 401 "Invalid signature"; `payment_events` table stayed empty after successful payments
- **Cause**: We treated the entire `whsec_JP/oj...` string as the HMAC key (UTF-8 bytes). Dodo follows **Standard Webhooks** spec which requires:
  1. Strip `whsec_` prefix
  2. Base64-decode the rest into raw bytes
  3. Use those bytes as HMAC-SHA256 key
  4. Sign `{webhook-id}.{timestamp}.{body}` (not `{timestamp}.{body}` like in our original code)
- **Fix**: Implemented proper Standard Webhooks verification in `verifyWebhookSignature()`
- File: `cloudflare/src/routes/webhooks.ts`

### 5. Wrong customer portal endpoint
- **Symptom**: 404 from Dodo when clicking "Manage Billing"
- **Cause**: Endpoint is `/customers/{id}/customer-portal/session`, response field is `link` (not `portal_url`)
- **Fix**: Updated path + field name

### 6. Webhook field names mismatched Dodo's actual schema
- `data.customer_id` → `data.customer?.customer_id`
- `data.current_period_end` → `data.next_billing_date`
- `data.amount` (payment.succeeded) → `data.total_amount` (initial), then changed again in fix #8
- File: `cloudflare/src/routes/webhooks.ts`

### 7. `subscription.active` + `subscription.renewed` both fired on initial signup → double credits
- **Symptom**: Pro Monthly purchase granted 900 + 900 = 1800 credits instead of 900
- **Cause**: Dodo fires both events on the first billing cycle (both are semantically true — state changed AND a billing period was issued)
- **Fix**: Made `subscription.active` state-only (just upserts the row, no credit grant). Credits are now granted **only** on `subscription.renewed`, which fires every billing cycle including the first.

### 8. `payment.succeeded` was crediting on subscription charges → triple credits
- **Symptom**: Pro Monthly purchase added another ~$5,580 USD to balance
- **Cause**: For subscriptions, `payment.succeeded` fires alongside `subscription.{active,renewed}`. We were treating it as a top-up.
- **Fix**: Skip the handler entirely if `data.subscription_id` is set — only credit when it's a true one-time top-up

### 9. Currency mismatch on top-ups (`total_amount` vs `settlement_amount`)
- **Symptom**: Indian user's $49 charge was logged as `total_amount=558093` and credited as $5,580.93
- **Cause**: `total_amount` is in **transaction currency cents** (INR paise here), not USD cents
- **Fix**: Use `data.settlement_amount` (always USD cents)

### 10. Top-ups would over-credit by tax amount
- **Symptom**: Found post-fix-9: `settlement_amount` includes tax. India GST = 18%, so $10 top-up would credit $11.80
- **Fix**: Use `(settlement_amount - settlement_tax) / 100` for pre-tax USD
- ⚠️ **Untested** — applied after the validated subscription test

### 11. CheckoutSuccess polling gave up at 30s
- **Symptom**: User saw "Almost there!" and had to manually click "Go to workspace"; credits then appeared after refresh
- **Cause**: Polling stopped after 15 attempts × 2s = 30s. Indian payment processing took ~32s. Polling missed the webhook by 2 seconds.
- **Fix**: Polling now never stops. After 15s the UI updates to "Almost there!" with a manual escape link, but the background poll keeps going every 4s and auto-redirects when credits arrive.
- File: `client/src/App.tsx`

### 12. "Manage Billing" button looked disabled
- Cosmetic — was using `text-text-muted` instead of `text-text-primary`
- File: `client/src/components/auth/UserMenu.tsx`

## Top-up UX Redesign (still in this session)
Replaced the 4 fixed top-up products + buttons with a **single PWYW product + flexible UI**:
- One Dodo product (`Credits Top-up`, PWYW, min $5) instead of 4
- TopupModal now has: amount input field, $5/$10/$25/$50 quick-pick chips, live credit preview, single "Buy X credits" CTA
- Backend dropped `TOPUP_PRODUCTS` whitelist; accepts any `amount ≥ 5`, sends `product_cart[].amount` in cents to Dodo

## Important Insight: India Payment Processing Time

Confirmed via two timestamps in a single webhook payload:
- `data.created_at` = `09:00:33.172` (payment record created at user submit)
- `timestamp` (top-level) = `09:01:04.755` (event fired by Dodo)
- **Diff = 31.6 seconds** of Dodo's payment processing

Once events fire, webhook delivery to our handler is **<1 second**. Our handler runs in <1 second.

The 30s delay is **RBI mandate validation + 3DS** specific to Indian INR subscriptions. US/EU users buying in USD will see ~2-5 seconds end-to-end. The CheckoutSuccess fix (resilient polling) handles both cases automatically.

## Files Changed

### Modified (5 files)
| File | Change |
|------|--------|
| `cloudflare/src/routes/payments.ts` | Base URL → test.dodopayments.com; endpoint → /checkouts; payload → product_cart array; portal endpoint + field; PWYW topup; real product IDs |
| `cloudflare/src/routes/webhooks.ts` | Standard Webhooks signature; field name fixes; .active state-only; .renewed credit-grants; payment.succeeded skip-if-subscription; settlement_amount minus tax; real product IDs in PLAN_CONFIG |
| `client/src/lib/api.ts` | `paymentsApi.checkout(plan, email, name?)` and `topup(amount, email, name?)` signatures |
| `client/src/components/pricing/PricingModal.tsx` | Use `useUser()` from Clerk to pass email/name |
| `client/src/components/pricing/TopupModal.tsx` | Full rewrite: input field + quick-pick chips + live credit preview + single CTA |
| `client/src/components/auth/UserMenu.tsx` | Manage Billing color fix (muted → primary) |
| `client/src/App.tsx` | CheckoutSuccess: indefinite polling, slower interval after 30s, "slow" UI state with escape link |

### Wrangler Secrets Set (staging only)
- `DODO_PAYMENTS_API_KEY` (test key)
- `DODO_PAYMENTS_WEBHOOK_SECRET` (whsec_... format)

## Verification Done
- ✅ TypeScript clean on both client and worker
- ✅ Worker deployed to staging multiple times throughout session
- ✅ End-to-end: Pro Monthly purchase → exactly 900 credits granted
- ✅ Webhook events recorded correctly: subscription.active (no credit), subscription.renewed (+$90), payment.succeeded (skipped)
- ✅ Customer portal opens, cancel subscription works (queues at end of period)
- ✅ Force-cancel via API works (subscription transitions to `cancelled` immediately)
- ✅ Manage Billing button styling fixed

## Untested in This Session (Verify Next Time)
- ⚠️ **Top-up purchase flow** — bug fixes #9 and #10 deployed but never tested with real money. Buy a $10 top-up and verify exactly 100 credits (Free) or 120 credits (Pro 20% bonus) are granted.
- ⚠️ **Refund flow** — refund a payment in Dodo dashboard, verify `refund.succeeded` webhook fires and credits are deducted (floor at 0)
- ⚠️ **`subscription.cancelled` webhook** — force-cancel via API should fire this; verify our DB updates `status='cancelled'`
- ⚠️ **Cold-start UI** — log out + back in, verify Pro plan badge appears from `/api/payments/subscription` fetch
- ⚠️ **Indefinite polling on slow webhook** — simulate by killing webhook subscription, retry payment, verify "Almost there!" persists with background polling continuing

## Production Launch Checklist (Future Session)
1. **Re-create all 5 products in live mode** in Dodo dashboard (test products don't transfer to live)
2. Generate **live API key** + **live webhook signing secret**
3. Make `DODO_API` base URL **environment-aware** — currently hardcoded to `test.dodopayments.com`. Read from env or branch on `wrangler.jsonc` env. Production must use `https://live.dodopayments.com`.
4. Configure Dodo webhook for production: `https://creative-agent.alphasapien17.workers.dev/webhooks/dodo` (or the custom domain `creativemachines.xyz` if proxied)
5. Set production secrets via `wrangler secret put DODO_PAYMENTS_API_KEY --env production` and same for webhook secret
6. Apply `cloudflare/schema.sql` migration to production D1 (`creative-agent-db-prod`)
7. Update `CHECKOUT_PRODUCTS`, `TOPUP_PRODUCT_ID`, and `PLAN_CONFIG` with **production product IDs** (different from staging)
8. Consider: env-based product ID maps so both staging + prod can run from the same code

## Security Hygiene
- 🔒 **Rotate the staging test API key** that was pasted in chat (`e_WyrK...`). Test keys can't process real money but it's still good practice. Dodo dashboard → Developer → API Keys → revoke + regenerate, then `wrangler secret put DODO_PAYMENTS_API_KEY --env staging`.
- 🔒 The webhook signing secret was also shared. Same approach — regenerate in Dodo dashboard, re-put.

## Key Design Decisions Made

### Why one PWYW top-up product instead of 4 fixed packs
- 1 product to maintain in Dodo dashboard, not 5
- Custom amounts work natively (user can top up to round their balance)
- Quick-pick chips ($5/$10/$25/$50) preserve the fast-purchase UX
- Cleaner backend code (no `TOPUP_PRODUCTS` whitelist, no per-amount product lookup)

### Why credit only on `subscription.renewed`, not `subscription.active`
- Dodo fires both events on the first billing cycle (semantically both are true)
- If we credit on `.active`, we'd also need defensive dedupe against `.renewed` which arrives at the same time
- `.renewed` fires on **every** billing cycle including the first → using it as the single credit-grant event guarantees exactly-once crediting per period
- `.active` is still useful for resuming from `on_hold` (failed payment recovered) — but the next `.renewed` will follow

### Why use `settlement_amount - settlement_tax` for top-ups
- `settlement_amount` is the gross USD amount Dodo collected (includes regional tax like India GST)
- Crediting the gross amount over-credits by the tax — user pays $11.80 for a $10 top-up but would get 118 credits
- Pre-tax `settlement_amount - settlement_tax` reflects what the user actually intended to spend on credits
- Subscriptions don't hit this bug because they use `PLAN_CONFIG.baseCreditsUsd` (hardcoded), not the payment field

### Why polling indefinitely instead of bumping the timeout
- Dodo's retry policy: instant → 5s → 5min → 30min → 2hr → 5hr → 10hr (8 attempts total)
- If a webhook is delayed (transient outage, retry queue), no fixed timeout is "long enough"
- Background polling auto-recovers from any delay scenario without user intervention
- The 15s "slow" UI message provides a manual escape hatch but doesn't stop polling

## Artifacts
- **Staging URL**: `https://creative-agent-staging.alphasapien17.workers.dev`
- **Latest deploy version**: `b4180f13-e434-4b5e-8ad6-3ca42b65bcb1`
- **Dodo business ID**: `bus_0NcsgGELzkvcuvXb2k3YC` (from webhook payloads)
- **Test customer in Dodo**: `cus_0NcsqWJ43vtZt4B5xVKMn` (alphasapien17@gmail.com / "invictus D")
- **Subscriptions created during testing**: 4 (1 pending, 1 cancelled, 2 active — all should be cleaned up before next session)

## Next Session — TODO
1. **Test top-up flow** — buy a $10 PWYW top-up, verify pre-tax credit calculation works (expect 100 credits Free / 120 credits Pro)
2. **Test refund flow** — refund a payment via Dodo dashboard, verify `refund.succeeded` deducts credits correctly
3. **Cancel all stale test subscriptions** in Dodo dashboard (or via API)
4. **Wipe test user's DB** before each test (`UPDATE user_credits SET balance_usd=0; DELETE FROM user_subscriptions; DELETE FROM payment_events`)
5. **Production launch prep** — start with the checklist above (recreate products, secrets, env-aware URL)
6. **Optional**: rotate exposed test secrets for hygiene
7. **Optional**: write integration tests for webhook handler (signature verification, event routing, idempotency)
