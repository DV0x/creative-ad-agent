import { UserButton } from '@clerk/clerk-react';
import { UserIcon } from 'lucide-react';
import { isDevMode } from '@/lib/auth';
import { useStore } from '@/store';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function CreditBadge() {
  const balance = useStore(state => state.creditBalance);
  if (balance === null) return null;

  const display = balance % 1 === 0 ? balance : balance.toFixed(1);

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium tabular-nums bg-bg-elevated text-text-primary border border-border">
      <span className="font-semibold">{display}</span>
      <span className="text-text-muted">credits</span>
    </span>
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
