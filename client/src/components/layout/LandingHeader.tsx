import { SignInButton, UserButton } from '@clerk/clerk-react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isDevMode } from '@/lib/auth';
import { useRequireAuth } from '@/contexts/AuthContext';

export function LandingHeader() {
  const { isSignedIn, isLoaded } = useRequireAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-6 bg-bg-base/80 backdrop-blur-sm border-b border-border/50">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-elevated">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <span className="font-semibold text-text-primary">Creative Agent</span>
      </div>

      {/* Auth button */}
      <div className="flex items-center gap-3">
        {isDevMode() ? (
          <span className="text-xs text-text-muted px-2 py-1 rounded bg-bg-raised">
            Dev Mode
          </span>
        ) : !isLoaded ? (
          <div className="w-20 h-9 rounded-lg bg-bg-raised animate-pulse" />
        ) : isSignedIn ? (
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8',
                userButtonPopoverCard: 'bg-bg-raised border border-border',
                userButtonPopoverActionButton: 'text-text-primary hover:bg-bg-input',
                userButtonPopoverActionButtonText: 'text-text-primary',
                userButtonPopoverActionButtonIcon: 'text-text-muted',
                userButtonPopoverFooter: 'hidden',
              },
            }}
          />
        ) : (
          <SignInButton mode="modal">
            <Button variant="outline" size="sm">
              Log in
            </Button>
          </SignInButton>
        )}
      </div>
    </header>
  );
}
