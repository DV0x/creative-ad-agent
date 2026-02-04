// Clerk authentication utilities
// Dev mode detection based on whether Clerk publishable key is set

export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const IS_AUTH_ENABLED = !!CLERK_PUBLISHABLE_KEY;

export function isDevMode(): boolean {
  return !IS_AUTH_ENABLED;
}
