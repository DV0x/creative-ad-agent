import { UserButton } from '@clerk/clerk-react';
import { UserIcon } from 'lucide-react';
import { isDevMode } from '@/lib/auth';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
    <UserButton
      appearance={{
        elements: {
          avatarBox: 'h-7 w-7',
          userButtonPopoverCard: 'bg-bg-raised border border-border',
          userButtonPopoverActionButton: 'text-text-primary hover:bg-bg-input',
          userButtonPopoverActionButtonText: 'text-text-primary',
          userButtonPopoverActionButtonIcon: 'text-text-muted',
          userButtonPopoverFooter: 'hidden',
        },
      }}
    />
  );
}
