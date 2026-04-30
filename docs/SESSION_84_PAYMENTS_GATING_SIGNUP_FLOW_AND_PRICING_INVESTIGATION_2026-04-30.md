# Session 84 — Payment gating, signed-out signup→checkout flow, $5 wedge, in-app locked top-up, and a real-world pricing-math investigation

**Date:** 2026-04-30
**Branch:** `new-ui` (pushed)
**Staging:** ✅ deployed twice — final version `7e6737c6` after the auth fix
**Production:** ⏸️ pending — staging tests passed for the subscribe → pay → provision happy path; image-skip bug + pricing-math revisit still open
**Node version required for deploy:** **v20** (Node 23 still broken — same regression as S83)

---

## TL;DR

| Area | What changed |
|---|---|
| **Top-up endpoint security** | Subscriber-only gate added at `payments.ts:77-114`. Free users blocked, EXCEPT one $5 trial per account (single-use, queried from `payment_events`). UI gate alone is bypassable via curl — this is the real lock. |
| **Signed-out pricing CTAs** | `Pricing.tsx` "Start with Starter" / "Go Pro" no longer dead-ends in PricingModal for signed-out visitors. Now: stash `{plan, interval}` in sessionStorage → redirect to `/sign-up?plan=…&interval=…` → after Clerk signup → `/checkout/init` auto-fires Dodo checkout. |
| **`/sign-up` route** | `SignIn.tsx` now renders ClerkSignUp on `/sign-up` and ClerkSignIn on `/sign-in` (path-based). Both forward `forceRedirectUrl` to `/checkout/init` when paid intent is present. |
| **`/checkout/init` route** | New bridge page in `App.tsx`. Reads `pendingCheckout` from sessionStorage (primary, robust to Clerk query-param stripping bugs), URL params as fallback. Calls `paymentsApi.checkout` for plans or `paymentsApi.topup` for the $5 wedge. |
| **Post-payment destination** | Was: `/`. Now: `/workspace?welcome=starter\|pro` with a 6-second one-shot toast banner ("✓ You're on Starter — 275 credits ready"). Self-strips the URL param via `replaceState`. |
| **Cancel handling** | `cancel_url` added to both Dodo checkouts → `/?upgrade-cancelled=plan-interval` or `/?topup-cancelled=amount`. Landing page shows a "Resume your upgrade" banner that one-click re-launches checkout. |
| **In-app TopupModal** | Free-tier users now see a locked state with "See plans" + "Try one campaign · $5" CTAs. Server-side 403 surfaced as inline error if trial already claimed. |
| **Landing top-up grid** | `Pricing.tsx`: replaced 4-button grid ($5/$10/$25/$50 with "no subscription needed" framing) with a single "Try one campaign · $5" wedge button. H2 reframed: "Pick a plan. Or try one campaign for $5." |
| **Admin grant tooling** | SQL command documented in `CLAUDE.md` for manual design-partner credit grants (no UI needed for solo-founder v1). |
| **Memory** | `pricing_subscription_plan.md` rewritten with new policy. `MEMORY.md` index updated. |

---

## Commits (this session)

To be pushed:
- `feat(payments): subscriber-only top-up gate + $5 wedge for cold traffic`
- `feat(auth): signed-out pricing CTA → signup → auto-checkout flow`
- `feat(billing): cancel-url + Resume Upgrade banner; locked in-app TopupModal for free users`
- `feat(workspace): post-payment WelcomeBanner with credit confirmation`
- `fix(checkout): wire tokenGetter on /checkout/init and /checkout/success`
- `docs: admin credit-grant SQL + Session 84 summary`

---

## What's in place now (file-level map)

### Server (Cloudflare worker)

**`cloudflare/src/routes/payments.ts`** — top-up gate + cancel URLs

```typescript
// payments.ts:87-114 — the actual lock
const subscription = await getSubscription(env.DB, userId);
const plan = subscription?.plan ?? 'free';
const status = subscription?.status ?? 'active';
const isActiveSubscriber =
  (plan === 'starter' || plan === 'pro') && status === 'active';

if (!isActiveSubscriber) {
  if (amount !== 5) {
    return Response.json(
      { success: false, error: 'Top-ups require an active Starter or Pro subscription.' },
      { status: 403 }
    );
  }
  // Single-use $5 trial: payment.succeeded only fires for top-ups (sub charges
  // fire subscription.renewed), so its presence for this user means the wedge
  // has already been used.
  const prior = await env.DB.prepare(
    `SELECT 1 FROM payment_events WHERE user_id = ? AND event_type = 'payment.succeeded' LIMIT 1`,
  ).bind(userId).first();
  if (prior) {
    return Response.json(
      { success: false, error: 'Trial already used — subscribe to Starter or Pro for more top-ups.' },
      { status: 403 }
    );
  }
}
```

Both `/checkout` and `/topup` now pass `cancel_url` to Dodo. **Verified field name `cancel_url` (snake_case) against the [Dodo Checkout Sessions docs](https://docs.dodopayments.com/developer-resources/checkout-session)** — passing it also adds a back button to Dodo's UI (otherwise no back button).

### Client (React)

**`client/src/components/landing/Pricing.tsx`**
- `PLANS` array got `id: 'starter' | 'pro'` field.
- `handlePlanCTA(planId)` — signed-in opens `PricingModal`; signed-out stashes `{plan, interval}` in sessionStorage and `window.location` to `/sign-up?plan=…&interval=…`.
- `handleWedgeCTA()` — same pattern but stashes `{wedge: true, amount: 5}` and routes to `/sign-up?wedge=1`.
- Top-up grid replaced with single `Try one campaign · $5` button in `.lp-topup` block.
- New H2: *"Pick a plan. Or try one campaign for $5."*

**`client/src/components/auth/SignIn.tsx`** — path-based form selection
- `/sign-in` → `<ClerkSignIn>`, `/sign-up` → `<ClerkSignUp>` (was: both rendered SignIn).
- `postAuthRedirectUrl()` returns `/checkout/init` (no query string — see "Clerk risk" below) when URL carries `?plan=…` or `?wedge=1`.
- Both Clerk components forward `signInUrl` / `signUpUrl` with the original query string preserved.

**`client/src/App.tsx`** — three new pieces
1. `CheckoutInit` component (~50 lines): `useUser` + `useAuth`, wires `setTokenGetter` (critical — see "Bug 1" below), reads `pendingCheckout` from sessionStorage primary / URL fallback, branches on `kind: 'plan' | 'wedge'`, calls the appropriate API, redirects to Dodo.
2. `WelcomeBanner` component (~40 lines): mounted at the root next to PricingModal/TopupModal, reads `?welcome=starter|pro` on mount, shows celebration toast for 6s, strips URL via `replaceState`.
3. `CheckoutSuccess` got the same tokenGetter fix and now redirects to `/workspace?welcome=…` instead of `/` (was a copy/behavior mismatch — slow-state link said "Go to workspace" but href was `/`).

**`client/src/components/pricing/TopupModal.tsx`** — locked state
- New early-return path for `isFree` users: shows lock icon, explanatory copy, "See plans" + "Try one campaign · $5" buttons.
- `handleTopup(amountOverride?)` accepts optional amount so the trial button can pass `$5` directly.
- Server 403 errors surface as inline red text — covers both "subscribe required" and "trial already used" cases.

**`client/src/components/landing/LandingPage.tsx`** — Resume Upgrade banner
- Reads `?upgrade-cancelled=plan-interval` (e.g. `starter-monthly`) or `?topup-cancelled=amount`.
- One-click resume button calls `window.location.href = '/checkout/init?plan=…&interval=…'`.
- Strips the param via `replaceState`.

### Memory + docs
- `CLAUDE.md`: added "Manual Credit Grants" section with the wrangler D1 SQL for design-partner grants. Updated D1 tables list.
- `pricing_subscription_plan.md` (auto-memory): full rewrite reflecting new policy (subscriber-only top-ups + $5 wedge + manual grants + eval strategy).
- `MEMORY.md`: index entry updated.

---

## Bugs found and fixed mid-flight

### Bug 1 — `tokenGetter` was null on `/checkout/init` (CRITICAL)

**Symptom:** First end-to-end test hit "Checkout couldn't start — Unauthorized" after Clerk signup completed. Wrangler logs showed `POST /api/payments/checkout status=401`.

**Root cause:** `setTokenGetter` was wired up only inside `AuthenticatedApp` (`App.tsx:341`). `App()`'s router renders different components based on path:
```typescript
if (pathname === '/sign-in' || pathname === '/sign-up') return <SignIn />
if (pathname === '/checkout/init') return <CheckoutInit />
if (pathname === '/checkout/success') return <CheckoutSuccess />
return <AuthenticatedApp />  // ← only here is tokenGetter wired
```
So when `CheckoutInit` ran, `tokenGetter` was still `null`, `apiFetch` skipped the Authorization header, worker returned 401.

**Fix:** Both `CheckoutInit` and `CheckoutSuccess` now call `setTokenGetter(...)` themselves at the top of their effect, using `useAuth().getToken`. Latent bug for `CheckoutSuccess` too — fixed proactively.

### Bug 2 — `WelcomeBanner` never rendered

**Symptom:** After successful payment, URL became `/workspace?welcome=starter` but no green toast appeared. The `?welcome=` param was still in the URL afterwards (proving the banner's `replaceState` never ran).

**Root cause:** `App.tsx:309-314` decides what to render based on `appState`:
```typescript
{showLanding && isCreatingCampaign && <EmptyState />}   // ← banner was here
{showWorkspace && <ResultsView />}                       // ← post-payment lands here
```
For workspace mode, `<ResultsView />` renders. My banner was inside `<EmptyState />` which wasn't mounting.

**Fix:** Moved `<WelcomeBanner />` to the root next to `<PricingModal />` / `<TopupModal />` so it renders regardless of view.

### Bug 3 — `LandingPage.tsx::ResumeUpgradeBanner` parsed the cancel param wrong (FIXED before deploy)

`cancel_url` carries `starter-monthly` (full plan-interval string), but the banner was treating it as just plan and always showing "Starter / monthly" regardless. Caught during code review before deploying.

### Hardening — Clerk `forceRedirectUrl` query-string risk

**Verification done:** Searched Clerk docs + GitHub issues ([clerk/javascript#2440](https://github.com/clerk/javascript/issues/2440), [#3796](https://github.com/clerk/javascript/issues/3796)). Docs are silent on whether query strings survive `forceRedirectUrl`. Past issues show query params getting stripped in some flows. Closed as "not planned."

**Mitigation:** Plan/interval is now persisted via `sessionStorage` (primary) with URL params as fallback. `forceRedirectUrl` is set to a clean path (`/checkout/init`, no query) — bypasses Clerk's query handling entirely. Still bookmarkable because URL fallback works on direct hits.

### Dodo `cancel_url` — verified, plus bonus learning

The Dodo docs ([Checkout Sessions](https://docs.dodopayments.com/developer-resources/checkout-session)) confirm `cancel_url` (snake_case). Bonus: `return_url` auto-receives `payment_id`, `subscription_id`, `status`, `license_key`, `email` as query params on success — could let us skip the polling on `/checkout/success` in a future optimization.

---

## End-to-end test results

### Hybrid test (you drove Clerk + payment, I drove verification)

**Test scenario completed:** signed-out → "Start with Starter" → Clerk sign-up → `/checkout/init` → Dodo test card → `/checkout/success` → `/workspace?welcome=starter`.

**Wrangler tail evidence (after the auth fix):**
```
12:09:06  POST /api/payments/checkout                       status=200
12:09:43  webhook subscription.active                       starter/monthly
12:09:43  webhook subscription.renewed                      plan pool reset + 27.50 USD
12:09:43  webhook payment.succeeded                         skipped (subscription charge)
```

**D1 verification:**
- `user_credits.balance_usd = 27.50` ($25 base × 1.1 Starter bonus = 275 credits) ✓
- `user_subscriptions = (starter, monthly, active, period_end=2026-05-30)` ✓
- Nav UI renders "Starter / 275 credits" badge ✓

**Test scenarios still NOT run** (deferred — not blocking):
- `/api/payments/topup` curl bypass test (free user → $10) — should 403
- `/api/payments/topup` curl bypass test (free user → $5 first time) — should 200
- `/api/payments/topup` curl bypass test (free user → $5 second time) — should 403 with "trial already used"
- $5 wedge from landing for fresh free user → Dodo → returns to workspace as paid trial
- Cancel-flow → `cancel_url` honored by Dodo? → Resume banner appears
- Decline-card test (`4000 0000 0000 0002`)
- WelcomeBanner visual confirmation (deployed but not re-tested in browser)

---

## Pricing-math investigation (NOT settled — user wants another look)

### What we found via real D1 data

**The campaign that just ran (`campaign_mol59kh6kt5vrr`, "Thewholetruthfoods whey protein"):**

| Event | Claude COGS | Image COGS | Images | Charged | Credits | Duration |
|---|---|---|---|---|---|---|
| 1 (text only) | $0.0468 | $0.00 | 0 | $0.187 | 1.87 | 12s |
| 2 (image gen) | $0.0147 | $0.30 | 2 | $1.259 | 12.59 | 60s |
| **TOTAL** | **$0.062** | **$0.30** | **2** | **$1.45** | **14.5 cr** | 72s |

**Extrapolated to a hypothetical full 6-image run:**
```
Claude (text):       $0.06        ← measured (cheap!)
Images (6 × $0.15):  $0.90        ← projected
Raw COGS:            $0.96
Charged @ 4× mult:   $3.84  =  ~38 credits
```

This **matches the landing copy "~37 credits per fresh 6-image campaign"** almost exactly. So the marketing claim is honest at this measurement.

**Implied per-plan capacity:**
- Starter ($19, 275 credits) → 275/38 = **7.2 campaigns** (matches "≈ 7 full campaigns" copy ✓)
- Pro ($49, 900 credits) → 900/38 = **23.7 campaigns** (matches "≈ 24 full campaigns" copy ✓)
- $5 wedge (50 credits) → 50/38 = **1.3 campaigns** (matches "1 full pack" copy ✓)

**Implied gross margins (at 100% usage = worst case):**
- Starter: $19 − $6.84 COGS = **64% margin**
- Pro: $49 − $22.51 COGS = **54% margin**

### Why this is NOT settled

User's response: *"no we need to check the math again"*. Reasons to revisit:

1. **The measured campaign only generated 2 of 6 images** before stopping (image-skip bug, see below). The "$0.06 Claude tokens" measurement is based on a single short-lived run — could be unrepresentative.
2. **Earlier D1 query showed one historical 6-image campaign with raw COGS of $1.59** (n=1), not $0.96. That campaign included follow-up turns. Real campaigns may include more research iteration than this test did.
3. **User's prior estimate was Claude $0.50–$0.80 per research+hooks cycle** — much higher than the $0.06 we just measured. Either the prior estimate was wrong, or this campaign was unusually short.
4. **Once the image-skip bug is fixed**, we should run 3–5 successful 6-image campaigns and average the actual COGS to ground the math.

### Action items for next pricing review

- [ ] Fix image-skip bug, then run 3–5 successful 6-image campaigns
- [ ] Compute average actual raw COGS per campaign across those runs
- [ ] Compute std dev — if variance is high, model the worst-case (90th percentile)
- [ ] Re-verify "37 credits per campaign" still matches measured charge
- [ ] If real average is closer to $1.55 (the earlier estimate), revisit one of:
  - Drop COST_MULTIPLIER from 4 → 2.5 (margin → 60%, copy stays accurate)
  - Update copy to "≈ 4 / ≈ 14 campaigns" (honest, but conversion risk)
  - Switch to cheaper image model (rejected by user — quality trumps margin)

---

## Open bugs / follow-ups (not blocking deploy)

### Bug — image-generation skip on the new account's first campaign
**Task #11.** `campaign_mol59kh6kt5vrr` finalized successfully with research/hooks/prompts files all `is_ready=1` but produced only 2 images (out of 6 expected). The `nano-banana` MCP tool DID fire (we see image_cost_usd=$0.30 in the second event row) but stopped after 2 images. Possibly:
- Orchestrator decided 2 was enough for the brief?
- nano-banana hit an error on images 3–6 and silently skipped?
- The brief "Thewholetruthfoods — Focus only on whey protein products" was too narrow?

User said: *"i guess theres some issue with new accounts. we will figure out later."* Reproduce with a simpler brief like `warbyparker.com glasses, back-to-school promo` before debugging in code.

### UX bug — workspace empty state for new paying users
A user who just paid and lands on `/workspace` with **0 campaigns** sees `<ResultsView />` showing *"Select a campaign to view images"* — terrible first-time UX since they have nothing to select. Should probably show `<EmptyState />` (composer ready) when `campaigns.length === 0` regardless of `appState`. Tweak in `App.tsx:309-313`.

### UX bug — generation status indicator stuck during research
User reported "looks like it's stuck in the research stage" mid-test, but logs showed agent was still working. The progress UI doesn't reflect `[sdk-parser] msg.type=trace` events. Consider streaming a "still thinking" indicator after N seconds of silence on the WS.

### Verification debt — Clerk and Dodo claims tested only in happy path
- `cancel_url` → Resume banner has not been observed firing yet (user didn't cancel a checkout in test).
- `forceRedirectUrl` with sessionStorage fallback works for the happy path but not stress-tested with private mode / different browsers.
- Trial-reuse rejection path (`Trial already used — subscribe…`) wasn't observed in test.

---

## Deploy notes (carry-over from S83)

**Node 23 still broken** — same `miniflare 4.20260305.0` → `undici 7.18.2` `CacheStorage` regression. Workflow: `nvm use 20` → wipe both `node_modules` → `npm ci` → build → deploy. Took ~6 min total this session, building the sandbox container is the slow part.

Two deploys went out this session:
1. `28ce04de` — initial deploy with auth/payment changes (had the tokenGetter bug)
2. `7e6737c6` — auth fix for `/checkout/init` and `/checkout/success`

`.nvmrc` follow-up still not done (S83 noted it).

---

## Files modified

```
M  CLAUDE.md                                          (admin grants section + tables)
M  cloudflare/src/routes/payments.ts                  (subscriber-only gate + cancel_url)
M  client/src/App.tsx                                 (CheckoutInit + WelcomeBanner + auth fix)
M  client/src/components/auth/SignIn.tsx              (path-based sign-in vs sign-up)
M  client/src/components/landing/LandingPage.tsx      (ResumeUpgradeBanner)
M  client/src/components/landing/Pricing.tsx          (signed-out CTA + $5 wedge)
M  client/src/components/pricing/TopupModal.tsx       (locked state for free users)
M  client/src/components/EmptyState.tsx               (removed inline WelcomeBanner)
+  docs/SESSION_84_…_2026-04-30.md                    (this doc)

memory/
M  pricing_subscription_plan.md                       (full rewrite for new policy)
M  MEMORY.md                                          (index update)
```

`docs/scratchpad.md` and the untracked research/HTML/SDK files are intentionally excluded from this commit (per S83 policy — those stay local).

---

## Architecture-doc updates needed (next session)

The architecture docs in `docs/architecture/` predate the payment system. The cleanest follow-ups:

1. **`docs/architecture/INDEX.md`** — add a new entry for the payment / billing flow.
2. **New doc: `docs/architecture/PAYMENT_FLOW.md`** covering:
   - Cold-traffic flow: landing CTA → `/sign-up?plan=…` → Clerk → `/checkout/init` → Dodo → `/checkout/success` → `/workspace?welcome=…`
   - In-app flow: signed-in user → PricingModal → `paymentsApi.checkout` → Dodo
   - $5 wedge flow: signed-out → `/sign-up?wedge=1` → Clerk → `/checkout/init` → topup checkout
   - Cancel flow: Dodo `cancel_url` → landing with `?upgrade-cancelled=…` → ResumeUpgradeBanner
   - Server-side gating: subscriber-only top-up + single-use $5 trial enforcement via `payment_events` lookup
   - Webhook handling: `subscription.active` (state only), `subscription.renewed` (credit grant), `payment.succeeded` (top-up grant), `refund.succeeded` (pool-aware reversal)
3. **Update `docs/architecture/DATA_MODEL.md`** — `user_credits`, `user_subscriptions`, `payment_events`, `usage_log` table descriptions
4. **Update `docs/architecture/CREDITS_AND_USAGE.md`** (if exists) or create one — covering plan pool vs top-up pool, COST_MULTIPLIER, per-event vs per-campaign cost recording

---

## Next session — opening punch list (in priority order)

### Highest priority (block production)
1. **Re-run pricing math on real successful campaigns** (per user request — not settled)
2. **Fix image-skip bug** (task #11) so we can complete the cost-measurement test
3. **Fix the workspace empty-state UX** for first-time paying users
4. **Run remaining test scenarios** — wedge happy path, wedge re-use rejection, cancel flow, decline card, curl bypass

### High priority (production-deployment-readiness)
5. **Add `.nvmrc`** to pin Node 20 (S83 carry-over)
6. **Pin / upgrade miniflare** to a version without the undici regression (S83 carry-over)
7. **BeforeAfter cost-per-creative claim still inflated by ~6×** (S82 / S83 carry-over)

### Medium priority (cold-launch readiness)
8. **Generation status indicator** doesn't reflect `msg.type=trace` events — add a "still thinking" UI after N seconds of silence
9. **Terms / Privacy / Image-IP pages** still don't exist (S83 carry-over)
10. **Curated eval set** (task #8) — 25–30 D2C brand URLs for baseline + LLM-as-judge

### Low priority (polish)
11. **5-marketer DM panel** for new H1 + sub copy (S83 carry-over)
12. **PostHog instrumentation** for new H1 (S83 carry-over)
13. **Cal.com event setup** — IST timezone, intake fields (S82 / S83 carry-over)
14. **Architecture-doc updates** for the new payment flow (see section above)

---

## Decisions explicitly NOT taken (so we don't relitigate)

- ❌ **Don't switch to a cheaper image model** to fix margins — user explicitly said quality matters; nano-banana-pro stays.
- ❌ **Don't push to production yet** — staging tests cover the happy path but the image-skip bug + the pricing-math re-check are open. Production deploy waits for those two.
- ❌ **Don't auto-grant credits on signup** — established this session: hard paywall + manual D1 grants for design partners is the cold-launch policy.
- ❌ **Don't include `docs/scratchpad.md` or untracked research files in the commit** — per the S83 / standing user direction.
- ❌ **Don't revisit Free / Starter / Pro tier prices** in this session — the question raised was about *capacity per dollar*, not pricing levels.
