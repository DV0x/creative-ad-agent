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

const QUICK_PICKS = [5, 10, 25, 50]
const MIN_USD = 5
const CREDITS_PER_USD = 10

export function TopupModal() {
  const { topupModalOpen, topupPresetAmount, closeTopupModal, subscription } = useStore()
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

  const isPro = subscription?.plan === 'pro'
  const bonusMultiplier = isPro ? 1.2 : 1.0

  const parsedAmount = parseFloat(amountInput)
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount >= MIN_USD
  const credits = validAmount ? Math.round(parsedAmount * CREDITS_PER_USD * bonusMultiplier) : 0

  async function handleTopup() {
    if (!validAmount) {
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
      const res = await paymentsApi.topup(parsedAmount, email, user?.fullName ?? undefined)
      window.location.href = res.checkout_url
    } catch (err: any) {
      console.error('Top-up failed:', err)
      setError(err?.message || 'Top-up failed')
      setLoading(false)
    }
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
          <Button size="sm" onClick={handleTopup} disabled={!validAmount || loading}>
            {loading ? 'Loading…' : `Buy ${credits.toLocaleString()} credits`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
