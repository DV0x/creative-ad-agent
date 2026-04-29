import { useState } from 'react'
import { useStore } from '@/store'

type Bill = 'mo' | 'yr'

const PLANS = [
  {
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

const TOPUPS = [
  { usd: 5,  credits: 50,  campaigns: '≈ 1 campaign' },
  { usd: 10, credits: 100, campaigns: '≈ 2 – 3 campaigns' },
  { usd: 25, credits: 250, campaigns: '≈ 6 – 7 campaigns' },
  { usd: 50, credits: 500, campaigns: '≈ 13 campaigns' },
] as const

export function Pricing() {
  const [bill, setBill] = useState<Bill>('mo')
  const { openPricingModal, openTopupModal } = useStore()

  return (
    <section className="lp-sec" id="pricing">
      <div className="lp-wrap">
        <div className="lp-price-head">
          <div>
            <h2 className="lp-h2">One subscription. Or one top-up. Your call.</h2>
          </div>
          <div className="right">
            <p>
              Subscribe if you're running campaigns every week. Top up if you just
              need a campaign by Friday. Credits meter actual usage — no seat math,
              no gotcha overages.
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
                onClick={openPricingModal}
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
            <div className="lbl">Top-up credits · no subscription</div>
            <div className="copy">
              Just need a campaign by Friday? Pay as you go. $5 minimum.
              Pro subscribers get +20% on every top-up.
            </div>
          </div>
          <div className="creds">
            {TOPUPS.map((t) => (
              <button
                key={t.usd}
                type="button"
                className="cred"
                onClick={() => openTopupModal(t.usd)}
              >
                <span className="big">${t.usd}</span>
                <span className="sm">{t.credits} cr · {t.campaigns}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
