import { useEffect, useState } from 'react'
import { Nav } from './Nav'
import { Hero } from './Hero'
import { BeforeAfter } from './BeforeAfter'
import { Pricing } from './Pricing'
import { DoneForYou } from './DoneForYou'
import { FAQ } from './FAQ'
import { Footer } from './Footer'
import './landing.css'

// "Resume your upgrade" banner. Fires when Dodo redirects back here after the
// user closed/cancelled checkout (cancel_url carries ?upgrade-cancelled=<plan-interval>
// or ?topup-cancelled=<amount>). Dismissible; one-click resume re-launches checkout.
function ResumeUpgradeBanner() {
  const [state, setState] = useState<
    | { kind: 'sub'; plan: 'starter' | 'pro'; interval: 'monthly' | 'yearly' }
    | { kind: 'topup'; amount: string }
    | null
  >(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sub = params.get('upgrade-cancelled')
    const topup = params.get('topup-cancelled')
    if (sub) {
      // sub format is "<plan>-<interval>" e.g. "starter-monthly", "pro-yearly"
      const [planPart, intervalPart] = sub.split('-')
      const plan = planPart === 'pro' ? 'pro' : 'starter'
      const interval = intervalPart === 'yearly' ? 'yearly' : 'monthly'
      setState({ kind: 'sub', plan, interval })
    } else if (topup) {
      setState({ kind: 'topup', amount: topup })
    }
    if (sub || topup) {
      params.delete('upgrade-cancelled')
      params.delete('topup-cancelled')
      const q = params.toString()
      window.history.replaceState({}, '', `${window.location.pathname}${q ? `?${q}` : ''}`)
    }
  }, [])

  if (!state) return null

  const resume = () => {
    if (state.kind === 'sub') {
      window.location.href = `/checkout/init?plan=${state.plan}&interval=${state.interval}`
    } else {
      window.location.href = `/checkout/init?plan=starter&interval=monthly`
    }
  }

  const label = state.kind === 'sub'
    ? `Continue your ${state.plan === 'pro' ? 'Pro' : 'Starter'} signup`
    : 'Pick up where you left off'

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border border-border shadow-lg rounded-xl px-4 py-3 max-w-md text-sm">
      <span className="text-text-secondary">{label} —</span>
      <button onClick={resume} className="text-accent font-medium hover:underline">
        Resume →
      </button>
      <button
        onClick={() => setState(null)}
        className="ml-1 text-text-muted hover:text-text-primary"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="lp-root">
      <ResumeUpgradeBanner />
      <Nav />
      <Hero />
      <BeforeAfter />
      <Pricing />
      <DoneForYou />
      <FAQ />
      <Footer />
    </div>
  )
}
