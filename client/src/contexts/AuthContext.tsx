import { createContext, useContext, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { isDevMode } from '@/lib/auth';

interface AuthContextValue {
  isSignedIn: boolean;
  isLoaded: boolean;
  requireAuth: (callback: () => void) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Provider for production mode (with Clerk)
function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const pendingCallback = useRef<(() => void) | null>(null);
  const prevSignedIn = useRef<boolean | undefined>(undefined);

  // Execute pending callback after sign-in transition (false → true)
  useEffect(() => {
    if (isSignedIn && prevSignedIn.current === false && pendingCallback.current) {
      const cb = pendingCallback.current;
      pendingCallback.current = null;
      cb();
    }
    prevSignedIn.current = !!isSignedIn;
  }, [isSignedIn]);

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (isSignedIn) {
        callback();
      } else {
        pendingCallback.current = callback;
        window.location.href = '/sign-in';
      }
    },
    [isSignedIn]
  );

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: isSignedIn ?? false,
        isLoaded: isLoaded ?? false,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Provider for dev mode (no auth)
function DevAuthProvider({ children }: { children: ReactNode }) {
  const requireAuth = useCallback((callback: () => void) => {
    callback();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: true,
        isLoaded: true,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Export the appropriate provider
export const AuthProvider = isDevMode() ? DevAuthProvider : ClerkAuthProvider;

// Hook to use auth context
export function useRequireAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useRequireAuth must be used within AuthProvider');
  }
  return context;
}
