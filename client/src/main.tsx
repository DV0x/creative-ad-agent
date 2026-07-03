import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useUser } from '@clerk/clerk-react'
import * as Sentry from '@sentry/react'
import posthog from 'posthog-js'
import { PostHogProvider, usePostHog } from '@posthog/react'
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

// PostHog — product analytics + session replay. Skip in dev; no-op until a real
// project key is set (so a missing key never inits with a bogus token).
const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined
const POSTHOG_HOST =
  (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com'
const ANALYTICS_ENABLED =
  import.meta.env.MODE !== 'development' &&
  !!POSTHOG_KEY &&
  POSTHOG_KEY.startsWith('phc_') &&
  !POSTHOG_KEY.includes('REPLACE') // placeholder → stay off until a real key is pasted

if (ANALYTICS_ENABLED) {
  posthog.init(POSTHOG_KEY!, {
    api_host: POSTHOG_HOST,
    defaults: '2026-01-30', // modern defaults: autocapture, SPA pageviews, pageleave
    session_recording: {
      // "Record prompt text, mask sensitive": the brief box is a <textarea> (Hero /
      // ChatInput), so keep input values visible (maskAllInputs:false) to see what
      // users type — but always mask password fields. The only other sensitive input
      // is Clerk's sign-in form (password masked here; email is captured intentionally
      // via identify() anyway), and payment runs on Dodo's external hosted page, which
      // session replay never records.
      maskAllInputs: false,
      maskInputOptions: { password: true },
    },
  })
  // Tag every event/replay with the build env so one project can split staging vs prod.
  posthog.register({ environment: import.meta.env.MODE })
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

// Links PostHog events + replays to the Clerk user id (the same id as campaigns.user_id
// in D1, so analytics joins cleanly with backend data). Mirrors SentryUserSync.
function PostHogUserSync() {
  const { user, isLoaded } = useUser()
  const ph = usePostHog()
  useEffect(() => {
    if (!isLoaded || !ph) return
    if (user?.id) ph.identify(user.id, { email: user.primaryEmailAddress?.emailAddress })
    else ph.reset()
  }, [isLoaded, user?.id, ph])
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
      {ANALYTICS_ENABLED && <PostHogUserSync />}
      <App />
    </ClerkProvider>
  )
}

const appTree = (
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <Root />
  </Sentry.ErrorBoundary>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {ANALYTICS_ENABLED ? <PostHogProvider client={posthog}>{appTree}</PostHogProvider> : appTree}
  </StrictMode>,
)
