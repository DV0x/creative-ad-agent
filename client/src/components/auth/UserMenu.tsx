import { UserButton } from '@clerk/clerk-react';
import { UserIcon, ChevronDown } from 'lucide-react';
import { isDevMode } from '@/lib/auth';
import { useStore } from '@/store';
import { paymentsApi } from '@/lib/api';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
};

function formatCreditCount(n: number | null): string {
  if (n === null) return '0';
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

function formatRenewalDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function CreditBadge() {
  const balance = useStore(state => state.creditBalance);
  const planBalance = useStore(state => state.planBalance);
  const topupBalance = useStore(state => state.topupBalance);
  const subscription = useStore(state => state.subscription);
  const openPricingModal = useStore(state => state.openPricingModal);
  const openTopupModal = useStore(state => state.openTopupModal);

  if (balance === null) return null;

  const display = formatCreditCount(balance);
  const plan = subscription?.plan || 'free';
  const isPaid = plan !== 'free';
  const renewalDate = formatRenewalDate(subscription?.current_period_end);

  // Show the tooltip only when we actually have the breakdown. Free users with no
  // balance at all don't benefit from a breakdown (both pools are 0).
  const hasBreakdown = planBalance !== null && topupBalance !== null;
  const showPlanLine = hasBreakdown && planBalance! > 0;
  const showTopupLine = hasBreakdown && topupBalance! > 0;
  const showTooltip = showPlanLine || showTopupLine;

  return (
    <div className="relative group">
      <button
        onClick={() => isPaid ? openTopupModal() : openPricingModal()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium tabular-nums bg-bg-elevated text-text-primary border border-border hover:border-border-emphasis transition-colors cursor-pointer"
      >
        {isPaid && (
          <span className="text-accent font-semibold">{PLAN_LABELS[plan]}</span>
        )}
        <span className="font-semibold">{display}</span>
        <span className="text-text-muted">credits</span>
        <ChevronDown className="w-3 h-3 text-text-muted" />
      </button>

      {/* Dropdown — opens a bit wider when we have a breakdown to show */}
      <div className={`absolute right-0 top-full mt-1 ${showTooltip ? 'w-56' : 'w-40'} rounded-lg border border-border bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50`}>
        {showTooltip && (
          <div className="px-3 py-2.5 border-b border-border">
            {showPlanLine && (
              <div className="mb-1.5 last:mb-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-text-primary font-medium tabular-nums">{formatCreditCount(planBalance)} plan</span>
                  <span className="text-[10px] text-text-muted">
                    {renewalDate ? `resets ${renewalDate}` : 'resets each cycle'}
                  </span>
                </div>
              </div>
            )}
            {showTopupLine && (
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-text-primary font-medium tabular-nums">{formatCreditCount(topupBalance)} top-up</span>
                  <span className="text-[10px] text-text-muted">never expire</span>
                </div>
              </div>
            )}
          </div>
        )}
        {!isPaid && (
          <button
            onClick={openPricingModal}
            className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-elevated transition-colors rounded-t-lg"
          >
            Upgrade Plan
          </button>
        )}
        {isPaid && (
          <button
            onClick={openPricingModal}
            className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-elevated transition-colors rounded-t-lg"
          >
            Change Plan
          </button>
        )}
        <button
          onClick={() => openTopupModal()}
          className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-elevated transition-colors"
        >
          Buy Credits
        </button>
        {isPaid && (
          <button
            onClick={async () => {
              try {
                const res = await paymentsApi.portal();
                window.open(res.portal_url, '_blank');
              } catch { /* ignore */ }
            }}
            className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-elevated transition-colors rounded-b-lg"
          >
            Manage Billing
          </button>
        )}
      </div>
    </div>
  );
}

export function UserMenu() {
  if (isDevMode()) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-7 w-7 rounded-full bg-bg-input border border-border flex items-center justify-center cursor-default">
            <UserIcon className="h-4 w-4 text-text-muted" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Dev Mode (no auth)
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <CreditBadge />
      <UserButton
        appearance={{
          elements: {
            avatarBox: 'h-7 w-7',
            userButtonPopoverCard: 'bg-bg-raised border border-border',
            userButtonPopoverActionButton: 'text-text-primary hover:bg-bg-input',
            userButtonPopoverActionButtonText: 'text-text-primary',
            userButtonPopoverActionButtonIcon: 'text-text-muted',
            userButtonPopoverFooter: '!hidden',
          },
        }}
      />
    </div>
  );
}
