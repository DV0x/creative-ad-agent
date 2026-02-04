import { SignIn as ClerkSignIn } from '@clerk/clerk-react';
import { isDevMode } from '@/lib/auth';

export function SignIn() {
  // In dev mode, return null (should never be shown anyway)
  if (isDevMode()) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <ClerkSignIn
        appearance={{
          baseTheme: undefined,
          variables: {
            colorPrimary: '#6366f1',
            colorBackground: '#1a1a1a',
            colorInputBackground: '#262626',
            colorInputText: '#fafafa',
            colorText: '#fafafa',
            colorTextSecondary: '#a3a3a3',
            colorDanger: '#ef4444',
            borderRadius: '0.5rem',
          },
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-bg-raised border border-border shadow-xl',
            headerTitle: 'text-text-primary',
            headerSubtitle: 'text-text-secondary',
            socialButtonsBlockButton: 'bg-bg-input hover:bg-bg-raised border-border',
            socialButtonsBlockButtonText: 'text-text-primary',
            formFieldLabel: 'text-text-secondary',
            formFieldInput: 'bg-bg-input border-border text-text-primary',
            formButtonPrimary: 'bg-accent hover:bg-accent/90',
            footerActionLink: 'text-accent hover:text-accent/80',
            identityPreviewText: 'text-text-primary',
            identityPreviewEditButton: 'text-accent',
          },
        }}
      />
    </div>
  );
}
