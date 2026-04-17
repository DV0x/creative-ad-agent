import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useStore } from '@/store'
import { paymentsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Check } from 'lucide-react'

type Interval = 'monthly' | 'yearly'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    yearly: 0,
    credits: { monthly: 0, yearly: 0 },
    features: ['Browse campaigns', 'View showcase'],
    cta: 'Current Plan',
  },
  {
    id: 'starter',
    name: 'Starter',
    monthly: 19,
    yearly: 192,
    credits: { monthly: 275, yearly: 3300 },
    features: ['10% credit bonus', 'All 14 art styles', 'Brand research', 'Credit top-ups'],
    cta: 'Get Started',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 49,
    yearly: 492,
    credits: { monthly: 900, yearly: 10800 },
    features: ['20% credit bonus', 'All 14 art styles', 'Brand research', '20% top-up bonus', 'Priority support'],
    cta: 'Go Pro',
    highlight: true,
  },
]

export function PricingModal() {
  const { pricingModalOpen, closePricingModal, subscription } = useStore()
  const { user } = useUser()
  const [interval, setInterval] = useState<Interval>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  const currentPlan = subscription?.plan || 'free'

  async function handleCheckout(planId: string) {
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose your plan</DialogTitle>
          <DialogDescription>
            Plan credits reset each billing cycle. Top-up credits never expire.
          </DialogDescription>
        </DialogHeader>

        {/* Interval toggle */}
        <div className="flex justify-center">
          <div className="inline-flex items-center rounded-lg border border-border bg-bg-elevated p-0.5 text-sm">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-4 py-1.5 rounded-md transition-colors ${
                interval === 'monthly'
                  ? 'bg-white text-text-primary shadow-sm font-medium'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`px-4 py-1.5 rounded-md transition-colors ${
                interval === 'yearly'
                  ? 'bg-white text-text-primary shadow-sm font-medium'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Yearly <span className="text-accent text-xs font-medium ml-1">Save 16%</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan
            const price = interval === 'monthly' ? plan.monthly : plan.yearly
            const credits = interval === 'monthly' ? plan.credits.monthly : plan.credits.yearly
            const isLoading = loading === plan.id

            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-4 flex flex-col ${
                  plan.highlight
                    ? 'border-accent/40 bg-accent/[0.03] ring-1 ring-accent/20'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary">{plan.name}</h3>
                  {isCurrent && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  {price > 0 ? (
                    <>
                      <span className="text-2xl font-bold text-text-primary">${price}</span>
                      <span className="text-text-muted text-sm">/{interval === 'monthly' ? 'mo' : 'yr'}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-text-muted">$0</span>
                  )}
                </div>

                {credits > 0 && (
                  <p className="text-xs text-text-secondary mb-3">
                    {credits.toLocaleString()} credits{interval === 'yearly' ? '/year' : '/month'}
                  </p>
                )}

                <ul className="space-y-1.5 mb-4 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-text-secondary">
                      <Check className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.highlight ? 'glow' : 'outline'}
                  size="sm"
                  disabled={isCurrent || plan.id === 'free' || isLoading}
                  onClick={() => handleCheckout(plan.id)}
                  className="w-full"
                >
                  {isLoading ? 'Redirecting...' : isCurrent ? 'Current Plan' : plan.cta}
                </Button>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
