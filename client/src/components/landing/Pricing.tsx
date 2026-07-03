import { useState } from 'react'
import { useStore } from '@/store'
import { useRequireAuth } from '@/contexts/AuthContext'
import { track } from '@/lib/analytics'

type Bill = 'mo' | 'yr'
type PlanId = 'starter' | 'pro'

const PLANS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    monthly: 19, yearly: 16, // yearly = $192/yr → $16/mo equivalent
    credits: 275,
    creditsLine: '275 credits / month',
    campaignsLine: '≈ 7 full campaigns',
    pitch: 'For the brand builder running their own ads.',
    features: [
      'All 14 art styles',
      '+10% bonus on monthly credits',
      'Brand research from any URL',
      'Top up any time, $5 minimum',
    ],
    cta: 'Start with Starter',
    featured: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    monthly: 49, yearly: 41, // yearly = $492/yr → $41/mo equivalent
    credits: 900,
    creditsLine: '900 credits / month',
    campaignsLine: '≈ 24 full campaigns',
    pitch: 'For growth teams testing a new angle every week.',
    features: [
      'Everything in Starter',
      '+20% bonus on monthly credits',
      '20% bonus on every top-up',
      'Priority generation queue',
    ],
    cta: 'Go Pro',
    featured: true,
    badge: 'Best value',
  },
] as const

const WEDGE_USD = 5
const WEDGE_CREDITS = 50

export function Pricing() {
  const [bill, setBill] = useState<Bill>('mo')
  const { openPricingModal, openTopupModal } = useStore()
  const { isSignedIn } = useRequireAuth()

  // Signed-out → bounce to /sign-up. We persist the chosen plan in BOTH
  // sessionStorage and the URL: sessionStorage is the primary path (robust
  // against Clerk redirect weirdness — see GH clerk/javascript#2440), URL
  // params are kept for bookmarkability/refresh recovery.
  // Signed-in → keep the existing in-app PricingModal (lets them upgrade/switch).
  function handlePlanCTA(planId: PlanId) {
    if (isSignedIn) {
      openPricingModal()
      return
    }
    const interval = bill === 'mo' ? 'monthly' : 'yearly'
    // Signed-out cold traffic: this redirect IS the checkout intent (it bypasses the
    // in-app modal, which tracks its own checkout_started). Track here so we don't miss it.
    track('checkout_started', { type: 'subscription', plan: planId, interval, surface: 'landing', signed_out: true })
    try {
      sessionStorage.setItem('creative-agent:pendingCheckout', JSON.stringify({ plan: planId, interval }))
    } catch { /* private mode etc — URL fallback still works */ }
    window.location.href = `/sign-up?plan=${planId}&interval=${interval}`
  }

  // The $5 wedge: cold-traffic conversion path. One trial campaign per account.
  // Signed-out → signup → /checkout/init creates a $5 top-up checkout.
  // Signed-in → in-app TopupModal pre-filled at $5. Server enforces the one-shot
  // rule (see payments.ts), so a free user who already used their trial gets a
  // 403 with a clear "subscribe" message — surfaced by the modal.
  function handleWedgeCTA() {
    if (isSignedIn) {
      openTopupModal(WEDGE_USD)
      return
    }
    track('checkout_started', { type: 'topup', amount: WEDGE_USD, surface: 'landing_wedge', signed_out: true })
    try {
      sessionStorage.setItem('creative-agent:pendingCheckout', JSON.stringify({ wedge: true, amount: WEDGE_USD }))
    } catch { /* URL fallback */ }
    window.location.href = `/sign-up?wedge=1`
  }

  return (
    <section className="lp-sec" id="pricing">
      <div className="lp-wrap">
        <div className="lp-price-head">
          <div>
            <h2 className="lp-h2">Pick a plan. Or try one campaign for $5.</h2>
          </div>
          <div className="right">
            <p>
              Subscribe if you're shipping every week. Or run a single $5
              trial campaign first — see what we make for your brand before
              you commit. Credits meter real usage, no seat math.
            </p>
            <div className="lp-price-toggle">
              <button className={bill === 'mo' ? 'on' : ''} onClick={() => setBill('mo')}>
                Monthly
              </button>
              <button className={bill === 'yr' ? 'on' : ''} onClick={() => setBill('yr')}>
                Yearly <span className="save">− 16%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lp-plans">
          {PLANS.map((p) => (
            <div key={p.name} className={`lp-plan ${p.featured ? 'featured' : ''}`}>
              {'badge' in p && p.badge && <span className="lp-badge">{p.badge}</span>}
              <div className="lp-plan-name">{p.name}</div>
              <div className="lp-plan-price">
                <span className="lp-price-num">${bill === 'mo' ? p.monthly : p.yearly}</span>
                <span className="lp-price-unit">/ mo</span>
              </div>
              <div className="lp-price-sm">
                {p.creditsLine} · {p.campaignsLine}
                {bill === 'yr' ? ' · billed yearly' : ''}
              </div>
              <h3 className="lp-plan-h3">{p.pitch}</h3>
              <ul>
                {p.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <button
                type="button"
                className={`lp-btn ${p.featured ? 'lp-btn-primary' : 'lp-btn-secondary'} lp-plan-cta`}
                onClick={() => handlePlanCTA(p.id)}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="lp-price-foot">
          Credits meter real usage — research, hooks, and images. A fresh
          6-image campaign runs ~37 credits. Plan credits reset monthly;
          top-up credits never expire.
        </p>

        <div className="lp-topup">
          <div>
            <div className="lbl">Not ready to subscribe?</div>
            <div className="copy">
              Run one campaign for ${WEDGE_USD}. {WEDGE_CREDITS} credits — exactly
              one full 6-image pack. No subscription, no recurring charge. One
              trial per account; subscribe afterwards if it's a fit.
            </div>
          </div>
          <div className="creds">
            <button
              type="button"
              className="cred"
              onClick={handleWedgeCTA}
            >
              <span className="big">Try one campaign · ${WEDGE_USD}</span>
              <span className="sm">{WEDGE_CREDITS} credits · ≈ 1 full pack</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
