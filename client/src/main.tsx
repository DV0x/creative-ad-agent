import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import { IS_AUTH_ENABLED, CLERK_PUBLISHABLE_KEY } from './lib/auth'

function Root() {
  if (!IS_AUTH_ENABLED) {
    // Dev mode - no auth wrapper
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
    >
      <App />
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
