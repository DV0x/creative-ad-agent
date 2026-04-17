# Session 70 — Dodo Payments Integration Plan (2026-04-09)

## What We Did
Planned the full payment integration for Creative Agent using Dodo Payments. No code written — this was a research, pricing strategy, and architecture planning session.

## Key Decisions Made

### Pricing Structure
| | Free | Starter ($19/mo, $192/yr) | Pro ($49/mo, $492/yr) |
|---|---|---|---|
| Credits/mo | 0 | 275 (250+10%) | 900 (750+20%) |
| Top-ups | Yes, no bonus, $5 min | Yes, no bonus, $5 min | Yes, 20% bonus, $5 min |
| Rollover | No | No | No |
| Generation | Blocked | Yes | Yes |

### Strategic Decisions
1. **Hard paywall** — 0 free credits for new users. Not VC-funded, can't subsidize free usage.
2. **No rollover** — Industry standard (Midjourney, Adobe, Figma all expire monthly). Simpler for v1.
3. **Monthly + Yearly only** — No quarterly. ~16% annual discount (matches ChatGPT/Claude Pro).
4. **Top-up 20% bonus for Pro only** — Makes Pro feel premium.
5. **$5 minimum top-up** — Prevents micro-transactions.
6. **Subscriber bonuses applied server-side** — Dodo doesn't know about 10%/20%. Our webhook handler calculates and calls `addCredits()`.
7. **Cancel = keep credits until period end** — Don't punish users who cancel.
8. **Plan change = no mid-cycle credit grant** — Credits come at next renewal.
9. **Top-up credits are plan-agnostic** — Work regardless of subscription status.

### Research Done
- Surveyed subscription models across AI/SaaS tools (Midjourney, ChatGPT, Adobe, Figma, Leonardo.ai, etc.)
- Confirmed credit rollover is rare in the industry (~20% of AI tools do it)
- Annual discount sweet spot: 15-20% (we chose ~16%)
- Credit-based billing is trending in AI SaaS (79 companies in 2025, up from 35)

## Architecture Summary

### Backend (Cloudflare Workers)
- **2 new D1 tables**: `user_subscriptions`, `payment_events`
- **Webhook handler** (`POST /webhooks/dodo`): Unauthenticated, HMAC-verified, replay-protected (5 min window), idempotent via webhook_id
- **Payment routes** (`/api/payments/*`): checkout, topup, subscription status, Dodo portal — all authenticated
- **No Dodo SDK** — plain fetch() calls
- **Shared product config map** — maps Dodo product_ids to plan tiers + credit amounts

### Frontend (React + Zustand)
- **Two-layer paywall**: Client checks `creditBalance <= 0` before WS message (instant UX), server DO checks as security boundary
- **PricingModal** — tier comparison with monthly/yearly toggle
- **TopupModal** — credit pack grid with Pro bonus badges
- **UserMenu** — plan badge, upgrade/topup/billing links
- **EmptyState** — paywall on submit for free users
- **INSUFFICIENT_CREDITS** error → upsell with PricingModal/TopupModal buttons

### Dodo Dashboard Setup
- 8 products: 4 subscriptions (starter/pro x monthly/yearly) + 4 top-up packs ($5/$10/$25/$50)
- Webhook URL: `https://creative-agent.alphasapien17.workers.dev/webhooks/dodo`
- 2 secrets: `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_SECRET`

## Files Affected

### Modified (11 files)
| File | Change |
|------|--------|
| `cloudflare/schema.sql` | Add user_subscriptions + payment_events tables |
| `cloudflare/src/db/credits.ts` | DEFAULT_BALANCE → 0 |
| `cloudflare/src/env.d.ts` | Add Dodo secrets |
| `cloudflare/src/index.ts` | Add /webhooks/dodo route |
| `cloudflare/src/router.ts` | Add /api/payments/* route |
| `client/src/lib/api.ts` | Add paymentsApi + Subscription type |
| `client/src/store/index.ts` | Add subscription + modal state |
| `client/src/App.tsx` | Load subscription, handle /checkout/success |
| `client/src/hooks/useWebSocket.ts` | Pre-send paywall + INSUFFICIENT_CREDITS upsell |
| `client/src/components/auth/UserMenu.tsx` | Plan badge, upgrade/topup/billing links |
| `client/src/components/EmptyState.tsx` | Paywall on submit |

### Created (5 files)
| File | Purpose |
|------|---------|
| `cloudflare/src/db/subscriptions.ts` | Subscription + webhook DB operations |
| `cloudflare/src/routes/webhooks.ts` | Dodo webhook handler |
| `cloudflare/src/routes/payments.ts` | Checkout, topup, subscription, portal routes |
| `client/src/components/pricing/PricingModal.tsx` | Tier comparison + checkout |
| `client/src/components/pricing/TopupModal.tsx` | Credit pack purchase |

## Skills Installed
8 Dodo Payments skills at `.claude/skills/dodo-payments/`:
best-practices, billing-sdk, checkout-integration, credit-based-billing, license-keys, subscription-integration, usage-based-billing, webhook-integration

## Artifacts
- **Full plan**: `docs/DODO_PAYMENTS_INTEGRATION_PLAN.md`
- **Plan file**: `.claude/plans/smooth-munching-forest.md`
- **Memory**: `pricing_subscription_plan.md` (updated with hard paywall)

## Next Session — TODO
1. Review the plan doc one final time
2. Set up Dodo Payments account + create products in dashboard
3. Start implementation Phase 1 (schema + DB layer)
4. Continue through phases 2-6 in order

## Open Questions for Next Session
- Confirm Dodo product_ids after dashboard setup (placeholder IDs in config map)
- Decide: should the pricing page be a modal or a full route (`/pricing`)?
- Decide: any specific top-up amounts beyond $5/$10/$25/$50?
- Test mode vs live mode sequencing during development
