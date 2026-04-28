import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/clerk-react'
import { ArrowRight } from 'lucide-react'
import { isDevMode } from '@/lib/auth'
import { useRequireAuth } from '@/contexts/AuthContext'
import { useStore } from '@/store'

export function Nav() {
  const { isSignedIn, isLoaded } = useRequireAuth()
  const { setAppState, campaigns } = useStore()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const showOpenWorkspace = isLoaded && isSignedIn && campaigns.length > 0

  return (
    <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="lp-wrap lp-nav-inner">
        <a href="#top" aria-label="Creative Machines" className="lp-nav-logo">
          <span className="word-light">Creative</span>
          <span className="word-bold">Machines</span>
        </a>

        <div className="lp-nav-links">
          <a href="#shift">The shift</a>
          <a href="#run-growth">Run growth</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>

        <div className="lp-nav-right">
          {isDevMode() ? (
            <span className="lp-mono" style={{ padding: '6px 10px', background: 'var(--color-bg-elevated)', borderRadius: 999 }}>
              Dev mode
            </span>
          ) : showOpenWorkspace ? (
            <>
              <button
                type="button"
                className="lp-btn lp-btn-ghost"
                onClick={() => setAppState('workspace')}
              >
                Open workspace
              </button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8',
                    userButtonPopoverFooter: '!hidden',
                  },
                }}
              />
            </>
          ) : isLoaded && isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                  userButtonPopoverFooter: '!hidden',
                },
              }}
            />
          ) : (
            <>
              <a className="lp-btn lp-btn-ghost" href="/sign-in">Log in</a>
              <a className="lp-btn lp-btn-ink" href="/sign-in">
                Get started <ArrowRight size={14} strokeWidth={1.75} />
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
