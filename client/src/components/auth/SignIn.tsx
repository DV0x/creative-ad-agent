import { SignIn as ClerkSignIn, SignUp as ClerkSignUp } from '@clerk/clerk-react';
import { isDevMode } from '@/lib/auth';

// Build the post-auth destination. Visitors arriving from any paid CTA (plan
// signup or $5 wedge) carry a marker in the URL — we route them to
// /checkout/init, which reads sessionStorage to learn what to actually buy.
//
// Important: we deliberately pass /checkout/init WITHOUT a query string, even
// though we have info available. Clerk has a history of stripping query params
// from forceRedirectUrl in some flows (see clerk/javascript#2440 and #3796).
// The actual plan / wedge details are read from sessionStorage on the other
// side — set by Pricing.tsx before the navigation here.
function postAuthRedirectUrl(): string {
  if (typeof window === 'undefined') return '/';
  const params = new URLSearchParams(window.location.search);
  const plan = params.get('plan');
  const wedge = params.get('wedge');
  if (plan === 'starter' || plan === 'pro' || wedge === '1') {
    return `/checkout/init`;
  }
  return '/';
}

const clerkAppearance = {
  variables: {
    colorPrimary: '#E8553A',
    colorText: '#111111',
    colorTextSecondary: '#999999',
    colorBackground: '#FFFFFF',
    colorInputBackground: '#FFFFFF',
    colorInputText: '#111111',
    borderRadius: '0.75rem',
  },
  elements: {
    // Root card
    rootBox: 'w-full',
    cardBox: '!shadow-none',
    card: '!bg-white !border !border-[#E5E5E5] !rounded-2xl !shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
    // Hide Clerk's header — we have our own wordmark above
    header: '!hidden',
    // Social buttons (Google, etc.)
    socialButtonsBlockButton: '!border-[#E5E5E5] hover:!bg-[#F5F5F5] !rounded-xl !h-11',
    socialButtonsBlockButtonText: '!text-sm !font-medium',
    // Divider
    dividerLine: '!bg-[#E5E5E5]',
    dividerText: '!text-[#999999] !text-xs',
    // Form fields
    formFieldLabel: '!text-[#111111] !text-sm !font-medium',
    formFieldInput: '!border-[#E5E5E5] !rounded-xl !h-11 !text-sm',
    // Primary button (Continue) — coral
    formButtonPrimary: '!bg-[#E8553A] hover:!bg-[#D4442B] !text-white !rounded-xl !h-11 !text-sm !font-medium !shadow-none !border-none',
    // Footer — hide "Secured by Clerk"
    footer: '!hidden',
    // "Don't have an account? Sign up" link
    footerActionLink: '!text-[#E8553A] hover:!text-[#D4442B]',
    footerActionText: '!text-[#999999] !text-sm',
    footerAction: '!mt-4',
    // Internal links (edit email, resend code, back)
    identityPreviewEditButton: '!text-[#E8553A]',
    formResendCodeLink: '!text-[#E8553A]',
    otpCodeFieldInput: '!border-[#E5E5E5]',
    backLink: '!text-[#E8553A] hover:!text-[#D4442B]',
    // Alert styling
    alert: '!rounded-xl',
  },
  layout: {
    socialButtonsPlacement: 'top' as const,
    showOptionalFields: false,
  },
};

export function SignIn() {
  if (isDevMode()) {
    return null;
  }

  // Render sign-up vs sign-in based on path. Visitors arriving from a paid CTA
  // hit /sign-up — we want them on the sign-up form, not the sign-in form.
  const isSignUp = typeof window !== 'undefined' && window.location.pathname === '/sign-up';
  const redirectUrl = postAuthRedirectUrl();
  const queryString = typeof window !== 'undefined' ? window.location.search : '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-bg-base relative overflow-hidden">
      {/* Subtle gradient mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{
            background: 'radial-gradient(circle, #E8553A 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'mesh-float 20s cubic-bezier(0.65, 0, 0.35, 1) infinite',
          }}
        />
        <div
          className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, #475569 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'mesh-float-reverse 25s cubic-bezier(0.65, 0, 0.35, 1) infinite',
          }}
        />
      </div>

      {/* Wordmark */}
      <div className="relative z-10 mb-8 text-center">
        <span className="text-3xl tracking-tight">
          <span className="font-normal text-accent">Creative</span>
          <span className="font-bold text-text-primary ml-1.5">Machines</span>
        </span>
        <p className="mt-3 text-text-secondary text-base">
          Turn any brand into an ad campaign.
        </p>
      </div>

      {/* Embedded Clerk sign-in or sign-up */}
      <div className="relative z-10 w-full max-w-sm">
        {isSignUp ? (
          <ClerkSignUp
            appearance={clerkAppearance}
            forceRedirectUrl={redirectUrl}
            signInUrl={`/sign-in${queryString}`}
          />
        ) : (
          <ClerkSignIn
            appearance={clerkAppearance}
            forceRedirectUrl={redirectUrl}
            signUpUrl={`/sign-up${queryString}`}
          />
        )}
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-xs text-text-muted text-center">
        By continuing, you agree to our terms and privacy policy.
      </p>
    </div>
  );
}
