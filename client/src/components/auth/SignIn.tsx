import { SignInButton } from '@clerk/clerk-react';
import { isDevMode } from '@/lib/auth';

export function SignIn() {
  if (isDevMode()) {
    return null;
  }

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
      <div className="relative z-10 mb-10 text-center">
        <span className="text-3xl tracking-tight">
          <span className="font-normal text-accent">Creative</span>
          <span className="font-bold text-text-primary ml-1.5">Machines</span>
        </span>
        <p className="mt-3 text-text-secondary text-base">
          Turn any brand into an ad campaign.
        </p>
      </div>

      {/* Sign-in card */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-8 text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-text-muted mb-6">
            Sign in to continue to Creative Machines
          </p>

          <SignInButton mode="modal" forceRedirectUrl="/">
            <button className="w-full py-3 px-4 rounded-xl bg-[#E8553A] hover:bg-[#D4442B] text-white font-medium transition-colors duration-150 text-sm">
              Continue with Sign In
            </button>
          </SignInButton>
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-10 text-xs text-text-muted text-center">
        By continuing, you agree to our terms and privacy policy.
      </p>
    </div>
  );
}
