import { useEffect, useState } from 'react'
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
        <DialogContent className="sm:max-w-[480px]">
          <Eyebrow>
            <Lock className="w-3 h-3" />
            Starter · Pro only
          </Eyebrow>

          <DialogHeader className="mt-3">
            <DialogTitle>Top-ups need a plan.</DialogTitle>
            <DialogDescription>
              Credit top-ups are included with any paid plan. Subscribe to
              enable them — or run a single ${TRIAL_USD} trial campaign first to
              see what we make for your brand.
            </DialogDescription>
          </DialogHeader>

          {/* Benefits box — dashed editorial */}
          <div
            className="mt-5"
            style={{
              padding: '18px 20px',
              border: '1px dashed var(--color-text-primary)',
              borderRadius: 4,
              backgroundColor: 'var(--color-bg-base)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                marginBottom: 8,
              }}
            >
              What Starter unlocks
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: 13.5,
                lineHeight: 1.7,
                color: 'var(--color-text-secondary)',
              }}
            >
              {[
                '275 credits / month (≈ 7 full campaigns)',
                'Unlimited top-ups, $5 minimum',
                'All 14 art styles + brand research',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 700, flexShrink: 0 }}>→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <p className="text-[12px] text-red-600 mt-3" style={{ letterSpacing: '0.01em' }}>
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <EditorialButton variant="secondary" onClick={() => handleTopup(TRIAL_USD)} disabled={loading}>
              {loading ? 'Loading…' : `Try one campaign · $${TRIAL_USD}`}
            </EditorialButton>
            <EditorialButton variant="primary" onClick={handleSubscribeInstead} disabled={loading}>
              See plans
            </EditorialButton>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={topupModalOpen} onOpenChange={(open) => !open && closeTopupModal()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Buy credits.</DialogTitle>
          <DialogDescription>
            Credits never expire.{isPro && ' Pro subscribers get a 20% bonus on all top-ups.'}
          </DialogDescription>
        </DialogHeader>

        {/* Live credit count — Clash Display headline */}
        <div
          className="mt-6"
          style={{
            padding: '24px 24px 22px',
            border: '1px solid var(--color-text-primary)',
            borderRadius: 6,
            backgroundColor: 'var(--color-bg-base)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
            }}
          >
            You'll get
          </div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 52,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '-0.018em',
                color: 'var(--color-text-primary)',
              }}
            >
              {credits.toLocaleString()}
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>credits</span>
            {isPro && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '4px 8px',
                  borderRadius: 2,
                  background: 'var(--color-pop)',
                  color: 'var(--color-text-primary)',
                }}
              >
                +20%
              </span>
            )}
          </div>

          {/* Amount input */}
          <div style={{ marginTop: 18 }}>
            <label
              htmlFor="topup-amount"
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                marginBottom: 8,
              }}
            >
              Amount (USD)
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 18,
                  color: 'var(--color-text-muted)',
                  fontWeight: 600,
                  pointerEvents: 'none',
                }}
              >
                $
              </span>
              <input
                id="topup-amount"
                type="number"
                inputMode="decimal"
                min={MIN_USD}
                step="1"
                value={amountInput}
                onChange={(e) => { setAmountInput(e.target.value); setError(null) }}
                placeholder="10"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 30px',
                  fontSize: 18,
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-primary)',
                  background: 'transparent',
                  border: '1px solid var(--color-text-primary)',
                  borderRadius: 4,
                  outline: 'none',
                  transition: 'border-color 120ms ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-text-primary)' }}
              />
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 11.5,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.02em',
              }}
            >
              {validAmount ? `Min $${MIN_USD}` : `Enter ≥ $${MIN_USD} to continue`}
            </div>
          </div>

          {/* Quick picks */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            {QUICK_PICKS.map((amount) => {
              const active = parseFloat(amountInput) === amount
              return (
                <QuickPick
                  key={amount}
                  active={active}
                  onClick={() => { setAmountInput(String(amount)); setError(null) }}
                >
                  ${amount}
                </QuickPick>
              )
            })}
          </div>
        </div>

        {error && (
          <p className="text-[12px] text-red-600 mt-3" style={{ letterSpacing: '0.01em' }}>
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <EditorialButton variant="ghost" onClick={closeTopupModal} disabled={loading}>
            Cancel
          </EditorialButton>
          <EditorialButton
            variant="primary"
            onClick={() => handleTopup()}
            disabled={!validAmount || loading}
          >
            {loading ? 'Loading…' : `Buy ${credits.toLocaleString()} credits`}
          </EditorialButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        padding: '5px 10px',
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--color-text-secondary)',
        background: 'var(--color-bg-base)',
        border: '1px solid var(--color-border-emphasis)',
        borderRadius: 999,
      }}
    >
      {children}
    </div>
  )
}

function QuickPick({
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
        flex: 1,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        padding: '9px 12px',
        background: active ? 'var(--color-text-primary)' : 'transparent',
        color: active ? 'var(--color-bg-base)' : 'var(--color-text-primary)',
        border: '1px solid var(--color-text-primary)',
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (active) return
        e.currentTarget.style.background = 'var(--color-text-primary)'
        e.currentTarget.style.color = 'var(--color-bg-base)'
      }}
      onMouseLeave={(e) => {
        if (active) return
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--color-text-primary)'
      }}
    >
      {children}
    </button>
  )
}

function EditorialButton({
  variant,
  disabled,
  onClick,
  children,
}: {
  variant: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  const variants: Record<typeof variant, React.CSSProperties> = {
    primary: {
      background: 'var(--color-accent)',
      color: '#fff',
      border: '1px solid var(--color-accent)',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-text-primary)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-text-secondary)',
      border: '1px solid transparent',
    },
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 14,
        letterSpacing: '-0.01em',
        padding: '10px 18px',
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
        ...variants[variant],
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        if (variant === 'primary') {
          e.currentTarget.style.background = 'var(--color-accent-hover)'
          e.currentTarget.style.borderColor = 'var(--color-accent-hover)'
        } else if (variant === 'secondary') {
          e.currentTarget.style.background = 'var(--color-text-primary)'
          e.currentTarget.style.color = 'var(--color-bg-base)'
        } else {
          e.currentTarget.style.color = 'var(--color-text-primary)'
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        if (variant === 'primary') {
          e.currentTarget.style.background = 'var(--color-accent)'
          e.currentTarget.style.borderColor = 'var(--color-accent)'
        } else if (variant === 'secondary') {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--color-text-primary)'
        } else {
          e.currentTarget.style.color = 'var(--color-text-secondary)'
        }
      }}
    >
      {children}
    </button>
  )
}
