import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useUser } from '@clerk/clerk-react'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'
import { IS_AUTH_ENABLED, CLERK_PUBLISHABLE_KEY } from './lib/auth'

// Sentry — error tracking + performance. Skip in dev (no DSN bound, no noise).
if (import.meta.env.MODE !== 'development') {
  Sentry.init({
    dsn: 'https://b52a84f7592973fdffc109344c824ef2@o4511380721631232.ingest.us.sentry.io/4511380737490944',
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    sendDefaultPii: true,
  })
}

// Pushes the Clerk user id into Sentry's user scope once auth resolves.
function SentryUserSync() {
  const { user, isLoaded } = useUser()
  useEffect(() => {
    if (!isLoaded) return
    if (user?.id) Sentry.setUser({ id: user.id })
    else Sentry.setUser(null)
  }, [isLoaded, user?.id])
  return null
}

function ErrorFallback() {
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui', textAlign: 'center' }}>
      <h1>Something went wrong</h1>
      <p>The error has been reported. Try refreshing.</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '8px 16px' }}>
        Refresh
      </button>
    </div>
  )
}

function Root() {
  if (!IS_AUTH_ENABLED) {
    return <App />
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY!}
      signInUrl="/sign-in"
      signUpUrl="/sign-in"
      afterSignInUrl="/"
      afterSignUpUrl="/"
      afterSignOutUrl="/"
      appearance={{
        variables: { colorPrimary: '#E8553A' },
        elements: {
          footer: '!hidden',
          userButtonPopoverFooter: '!hidden',
        },
      }}
    >
      <SentryUserSync />
      <App />
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <Root />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
