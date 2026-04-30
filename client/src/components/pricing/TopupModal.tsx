import { useEffect, useState } from 'react'
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
import { Lock } from 'lucide-react'

const QUICK_PICKS = [5, 10, 25, 50]
const MIN_USD = 5
const CREDITS_PER_USD = 10
const TRIAL_USD = 5

export function TopupModal() {
  const { topupModalOpen, topupPresetAmount, closeTopupModal, subscription, openPricingModal } = useStore()
  const { user } = useUser()
  const [amountInput, setAmountInput] = useState<string>('10')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (topupModalOpen && topupPresetAmount != null) {
      setAmountInput(String(topupPresetAmount))
      setError(null)
    }
  }, [topupModalOpen, topupPresetAmount])

  const plan = subscription?.plan || 'free'
  const isPro = plan === 'pro'
  const isFree = plan === 'free'
  const bonusMultiplier = isPro ? 1.2 : 1.0

  const parsedAmount = parseFloat(amountInput)
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount >= MIN_USD
  const credits = validAmount ? Math.round(parsedAmount * CREDITS_PER_USD * bonusMultiplier) : 0

  async function handleTopup(amountOverride?: number) {
    const amount = amountOverride ?? parsedAmount
    if (!Number.isFinite(amount) || amount < MIN_USD) {
      setError(`Minimum is $${MIN_USD}`)
      return
    }
    const email = user?.primaryEmailAddress?.emailAddress
    if (!email) {
      setError('No email on account')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await paymentsApi.topup(amount, email, user?.fullName ?? undefined)
      window.location.href = res.checkout_url
    } catch (err: any) {
      console.error('Top-up failed:', err)
      // Server returns 403 with clear copy ("Top-ups require..." / "Trial already used...").
      // Surface that directly so the user knows whether to subscribe or just try.
      setError(err?.message || 'Top-up failed')
      setLoading(false)
    }
  }

  function handleSubscribeInstead() {
    closeTopupModal()
    openPricingModal()
  }

  // Free-tier locked state: ad-hoc top-ups require a subscription. We still
  // offer the one-shot $5 trial as an escape hatch — server enforces single-use,
  // so if they've already claimed it the API returns a clear 403 we surface here.
  if (isFree) {
    return (
      <Dialog open={topupModalOpen} onOpenChange={(open) => !open && closeTopupModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-text-muted" />
              Top-ups are a Starter / Pro feature
            </DialogTitle>
            <DialogDescription>
              Credit top-ups are included with any paid plan. Subscribe to enable
              them — or run a single ${TRIAL_USD} trial campaign first to see what
              we make for your brand.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border bg-bg-elevated p-3 mt-2 text-xs text-text-secondary">
            <div className="font-medium text-text-primary mb-1">What you get with Starter ($19/mo)</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>275 credits / month (≈ 7 full campaigns)</li>
              <li>Unlimited top-ups, $5 minimum</li>
              <li>All 14 art styles + brand research</li>
            </ul>
          </div>

          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => handleTopup(TRIAL_USD)} disabled={loading}>
              {loading ? 'Loading…' : `Try one campaign · $${TRIAL_USD}`}
            </Button>
            <Button size="sm" onClick={handleSubscribeInstead} disabled={loading}>
              See plans
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={topupModalOpen} onOpenChange={(open) => !open && closeTopupModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy credits</DialogTitle>
          <DialogDescription>
            Credits never expire. {isPro && 'Pro subscribers get a 20% bonus on all top-ups.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">$</span>
              <input
                type="number"
                inputMode="decimal"
                min={MIN_USD}
                step="1"
                value={amountInput}
                onChange={(e) => { setAmountInput(e.target.value); setError(null) }}
                className="w-full rounded-lg border border-border bg-bg-elevated px-7 py-2.5 text-lg font-semibold text-text-primary outline-none focus:border-accent transition-colors"
                placeholder="10"
              />
              {isPro && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  +20%
                </span>
              )}
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-text-muted">
              <span>Min ${MIN_USD}</span>
              <span>{validAmount ? `${credits.toLocaleString()} credits` : `Enter ≥ $${MIN_USD}`}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {QUICK_PICKS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => { setAmountInput(String(amount)); setError(null) }}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  parseFloat(amountInput) === amount
                    ? 'border-accent bg-accent/5 text-accent font-medium'
                    : 'border-border text-text-secondary hover:border-border-emphasis'
                }`}
              >
                ${amount}
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={closeTopupModal} disabled={loading}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => handleTopup()} disabled={!validAmount || loading}>
            {loading ? 'Loading…' : `Buy ${credits.toLocaleString()} credits`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
