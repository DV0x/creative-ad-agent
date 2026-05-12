import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useStore } from '@/store'
import { paymentsApi } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

type Interval = 'monthly' | 'yearly'

type PlanId = 'free' | 'starter' | 'pro'

interface Plan {
  id: PlanId
  name: string
  monthly: number
  yearly: number
  credits: { monthly: number; yearly: number }
  pitch: string
  features: string[]
  cta: string
  featured?: boolean
  badge?: string
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    yearly: 0,
    credits: { monthly: 0, yearly: 0 },
    pitch: 'Browse what others have made.',
    features: ['Browse public campaigns', 'View the showcase'],
    cta: 'Current Plan',
  },
  {
    id: 'starter',
    name: 'Starter',
    monthly: 19,
    yearly: 16,
    credits: { monthly: 275, yearly: 3300 },
    pitch: 'For the brand builder running their own ads.',
    features: [
      'All 14 art styles',
      '+10% bonus on monthly credits',
      'Brand research from any URL',
      'Top up any time, $5 minimum',
    ],
    cta: 'Get Started',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 49,
    yearly: 41,
    credits: { monthly: 900, yearly: 10800 },
    pitch: 'For teams testing a new angle every week.',
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
]

export function PricingModal() {
  const { pricingModalOpen, closePricingModal, subscription } = useStore()
  const { user } = useUser()
  const [interval, setInterval] = useState<Interval>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  const currentPlan = subscription?.plan || 'free'

  async function handleCheckout(planId: PlanId) {
    if (planId === 'free' || planId === currentPlan) return
    const email = user?.primaryEmailAddress?.emailAddress
    if (!email) {
      console.error('No email on Clerk user')
      return
    }
    setLoading(planId)
    try {
      const res = await paymentsApi.checkout(`${planId}-${interval}`, email, user?.fullName ?? undefined)
      window.location.href = res.checkout_url
    } catch (err) {
      console.error('Checkout failed:', err)
      setLoading(null)
    }
  }

  return (
    <Dialog open={pricingModalOpen} onOpenChange={(open) => !open && closePricingModal()}>
      <DialogContent className="sm:max-w-[940px] p-9">
        {/* Header */}
        <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_auto] items-end gap-6 mb-7">
          <DialogHeader className="gap-2">
            <DialogTitle>Pick a plan.</DialogTitle>
            <DialogDescription className="max-w-[44ch]">
              Plan credits reset each billing cycle. Top-up credits never expire.
              Credits meter real usage — no seat math.
            </DialogDescription>
          </DialogHeader>

          {/* Interval toggle — landing-style ink pill */}
          <div
            className="inline-flex p-[3px] self-end"
            style={{
              border: '1px solid var(--color-text-primary)',
              borderRadius: 999,
              backgroundColor: 'var(--color-bg-base)',
            }}
          >
            <ToggleButton active={interval === 'monthly'} onClick={() => setInterval('monthly')}>
              Monthly
            </ToggleButton>
            <ToggleButton active={interval === 'yearly'} onClick={() => setInterval('yearly')}>
              Yearly
              <span
                style={{
                  fontSize: 10,
                  marginLeft: 4,
                  letterSpacing: '0.08em',
                  color: interval === 'yearly' ? 'var(--color-pop)' : 'var(--color-accent)',
                }}
              >
                − 16%
              </span>
            </ToggleButton>
          </div>
        </div>

        {/* Plan cards — hard-bordered grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3"
          style={{
            border: '1px solid var(--color-text-primary)',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: 'var(--color-bg-base)',
          }}
        >
          {PLANS.map((plan, idx) => {
            const isCurrent = plan.id === currentPlan
            const isLast = idx === PLANS.length - 1
            const price = interval === 'monthly' ? plan.monthly : plan.yearly
            const credits = interval === 'monthly' ? plan.credits.monthly : plan.credits.yearly
            const isLoading = loading === plan.id

            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                price={price}
                credits={credits}
                isCurrent={isCurrent}
                isLoading={isLoading}
                isLast={isLast}
                interval={interval}
                onCheckout={() => handleCheckout(plan.id)}
              />
            )
          })}
        </div>

        {/* Footer note */}
        <p
          className="mt-5 text-text-muted"
          style={{ fontSize: 12, lineHeight: 1.6, letterSpacing: '0.01em', maxWidth: 640 }}
        >
          Credits meter real usage — research, hooks, and images. A fresh
          6-image campaign runs ~37 credits. Plan credits reset monthly;
          top-up credits never expire.
        </p>
      </DialogContent>
    </Dialog>
  )
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: '0.02em',
        padding: '7px 16px',
        border: 'none',
        background: active ? 'var(--color-text-primary)' : 'transparent',
        color: active ? 'var(--color-bg-base)' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        borderRadius: 999,
        transition: 'all 120ms ease',
      }}
    >
      {children}
    </button>
  )
}

function PlanCard({
  plan,
  price,
  credits,
  isCurrent,
  isLoading,
  isLast,
  interval,
  onCheckout,
}: {
  plan: Plan
  price: number
  credits: number
  isCurrent: boolean
  isLoading: boolean
  isLast: boolean
  interval: Interval
  onCheckout: () => void
}) {
  const featured = !!plan.featured

  const cardStyle: React.CSSProperties = {
    padding: '32px 26px',
    borderRight: isLast ? 'none' : '1px solid var(--color-text-primary)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: featured ? 'var(--color-text-primary)' : 'transparent',
    color: featured ? 'var(--color-bg-base)' : 'var(--color-text-primary)',
    minHeight: 460,
  }

  const nameColor = featured ? 'var(--color-bg-base)' : 'var(--color-text-secondary)'
  const subColor = featured ? 'rgba(251,249,245,0.55)' : 'var(--color-text-muted)'
  const featureColor = featured ? 'rgba(251,249,245,0.85)' : 'var(--color-text-secondary)'
  const arrowColor = featured ? 'var(--color-pop)' : 'var(--color-accent)'

  return (
    <div style={cardStyle}>
      {/* Top-right badge slot: CURRENT badge wins if applicable, else plan.badge */}
      {isCurrent ? (
        <span
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            padding: '4px 8px',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            borderRadius: 2,
            background: featured ? 'var(--color-pop)' : 'var(--color-accent)',
            color: featured ? 'var(--color-text-primary)' : '#fff',
          }}
        >
          Current
        </span>
      ) : plan.badge ? (
        <span
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            padding: '4px 8px',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            borderRadius: 2,
            background: 'var(--color-pop)',
            color: 'var(--color-text-primary)',
          }}
        >
          {plan.badge}
        </span>
      ) : null}

      {/* Plan name eyebrow */}
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: nameColor,
        }}
      >
        {plan.name}
      </div>

      {/* Price */}
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: '-0.018em',
            color: 'inherit',
          }}
        >
          ${price}
        </span>
        <span style={{ fontSize: 13, color: subColor }}>/ mo</span>
      </div>

      {/* Credits sub-line */}
      <div style={{ marginTop: 8, fontSize: 12, color: subColor, letterSpacing: '0.02em' }}>
        {credits > 0
          ? `${credits.toLocaleString()} credits${interval === 'yearly' ? ' / year' : ' / month'}`
          : 'No included credits'}
        {interval === 'yearly' && credits > 0 ? ' · billed yearly' : ''}
      </div>

      {/* Pitch */}
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 17,
          lineHeight: 1.22,
          letterSpacing: '-0.012em',
          marginTop: 18,
          marginBottom: 0,
          color: 'inherit',
        }}
      >
        {plan.pitch}
      </h3>

      {/* Features */}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '18px 0 24px',
          fontSize: 13.5,
          lineHeight: 1.75,
          color: featureColor,
        }}
      >
        {plan.features.map((f) => (
          <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
            <span style={{ color: arrowColor, fontWeight: 700, flexShrink: 0 }}>→</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <CTAButton
        featured={featured}
        disabled={isCurrent || plan.id === 'free' || isLoading}
        onClick={onCheckout}
      >
        {isLoading ? 'Redirecting…' : isCurrent ? 'Current Plan' : plan.cta}
      </CTAButton>
    </div>
  )
}

function CTAButton({
  featured,
  disabled,
  onClick,
  children,
}: {
  featured: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  // Two variants matching landing's lp-btn-primary / lp-btn-secondary.
  // Featured (Pro) card sits on ink, so its CTA is wine; non-featured cards on
  // cream get the ink-outline secondary that fills on hover.
  const primary: React.CSSProperties = {
    background: 'var(--color-accent)',
    color: '#fff',
    border: '1px solid var(--color-accent)',
  }
  const secondary: React.CSSProperties = {
    background: 'transparent',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-text-primary)',
  }
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: 14,
    letterSpacing: '-0.01em',
    padding: '11px 18px',
    borderRadius: 4,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
    width: '100%',
    marginTop: 'auto',
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ ...base, ...(featured ? primary : secondary) }}
      onMouseEnter={(e) => {
        if (disabled) return
        if (featured) {
          e.currentTarget.style.background = 'var(--color-accent-hover)'
          e.currentTarget.style.borderColor = 'var(--color-accent-hover)'
        } else {
          e.currentTarget.style.background = 'var(--color-text-primary)'
          e.currentTarget.style.color = 'var(--color-bg-base)'
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        if (featured) {
          e.currentTarget.style.background = 'var(--color-accent)'
          e.currentTarget.style.borderColor = 'var(--color-accent)'
        } else {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--color-text-primary)'
        }
      }}
    >
      {children}
    </button>
  )
}
