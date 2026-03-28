import { UserButton } from '@clerk/clerk-react';
import { isDevMode } from '@/lib/auth';
import { useRequireAuth } from '@/contexts/AuthContext';

export function LandingHeader() {
  const { isSignedIn, isLoaded } = useRequireAuth();

  return (
    <header className="fixed top-4 left-4 right-4 z-50 flex justify-center">
      <div className="w-full max-w-5xl flex items-center justify-between px-5 py-2.5 rounded-full bg-[rgba(235,235,235,0.65)] backdrop-blur-2xl border border-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
        {/* Logo — two-weight wordmark */}
        <span className="text-lg tracking-tight">
          <span className="font-normal text-accent">Creative</span>
          <span className="font-bold text-text-primary ml-1">Machines</span>
        </span>

        {/* Auth button — dark pill */}
        <div className="flex items-center">
          {isDevMode() ? (
            <span className="text-xs text-text-muted px-3 py-1.5 rounded-full bg-bg-elevated">
              Dev Mode
            </span>
          ) : isLoaded && isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                  userButtonPopoverCard: 'bg-white border border-border shadow-lg',
                  userButtonPopoverActionButton: 'text-text-primary hover:bg-bg-elevated',
                  userButtonPopoverActionButtonText: 'text-text-primary',
                  userButtonPopoverActionButtonIcon: 'text-text-muted',
                  userButtonPopoverFooter: 'hidden',
                },
              }}
            />
          ) : (
            <a
              href="/sign-in"
              className="px-4 py-2 rounded-full bg-text-primary text-white text-sm font-medium hover:bg-text-primary/90 transition-colors duration-150 no-underline"
            >
              Login or Sign up
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
