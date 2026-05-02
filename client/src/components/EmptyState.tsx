import { useEffect } from 'react'
import { FolderIcon } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import { useSidebars } from '@/components/layout/AppLayout'
import { useWebSocket } from '@/hooks/useWebSocket'
import { isDevMode } from '@/lib/auth'

/**
 * Editorial welcome hero. Renders whenever the workspace has no concrete work to show
 * (no campaigns yet, no active selection, fresh "+ New campaign" click, or active
 * campaign with no images yet). The chat sidebar is the action surface — no input here.
 *
 * Routing decisions live in App.tsx (showWelcomeHero gate). This component just renders.
 */
export function EmptyState() {
  const { prompt, selectedAspectRatio, activeCampaignId, pendingGeneration, setPendingGeneration } = useStore()
  const { setMobileDrawerOpen, setMobileAssetsOpen } = useSidebars()
  const { isConnected, generate } = useWebSocket()

  // First name for editorial greeting (conditional Clerk hook in dev mode).
  const clerkUser = isDevMode() ? null : useUser().user
  const firstName =
    clerkUser?.firstName ||
    clerkUser?.username ||
    clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    null

  // Pre-auth handoff: a prompt typed on the landing page is saved to sessionStorage
  // before the Clerk redirect; App.tsx restores it after sign-in and sets pendingGeneration.
  // We wait for the WS to connect, then auto-fire generate().
  useEffect(() => {
    if (pendingGeneration && isConnected) {
      setPendingGeneration(false)
      const savedPrompt = sessionStorage.getItem('creative-agent:pendingPrompt') || prompt
      if (savedPrompt.trim()) {
        sessionStorage.removeItem('creative-agent:pendingPrompt')
        generate(savedPrompt.trim(), undefined, selectedAspectRatio)
      }
    }
  }, [pendingGeneration, isConnected, setPendingGeneration, generate, prompt, selectedAspectRatio])

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-auto">
      <div className="relative flex-1 flex flex-col items-center justify-center min-h-[100vh] px-6 md:px-12 lg:px-16 pt-24 pb-12 gap-12 max-w-7xl mx-auto w-full">
        <div className="w-full lg:max-w-2xl">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary leading-[1.05] editorial-fade-up"
            style={{ animation: 'editorialFadeUp 600ms cubic-bezier(0.16, 1, 0.3, 1) 0ms both' }}
          >
            Welcome in{firstName ? <>, <span className="text-[#AB406C]">{firstName}</span></> : null}.
            <br />
            What ads are we cooking?
          </h1>
          <div
            className="mt-8 h-[2px] w-8 bg-[#AB406C] editorial-fade-up"
            style={{ animation: 'editorialFadeUp 480ms cubic-bezier(0.16, 1, 0.3, 1) 200ms both' }}
          />
        </div>

        {/* Long directional arrow → chat sidebar. Bottom-right, desktop only. */}
        <div
          className="absolute bottom-16 right-6 lg:right-12 hidden lg:flex items-center gap-4 text-sm font-medium text-text-secondary"
          style={{ animation: 'editorialFadeUp 480ms cubic-bezier(0.16, 1, 0.3, 1) 500ms both' }}
        >
          <span>Start a brief in chat</span>
          <span
            className="text-[#AB406C] inline-flex"
            style={{ animation: 'editorialArrowNudge 2s ease-in-out 2200ms infinite', willChange: 'transform' }}
            aria-hidden="true"
          >
            <svg width="220" height="24" viewBox="0 0 220 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M 4 14 C 40 14 60 10 100 11 S 160 13 200 12 L 210 12"
                style={{
                  strokeDasharray: 320,
                  strokeDashoffset: 320,
                  animation: 'editorialArrowDraw 1.4s cubic-bezier(0.65, 0, 0.35, 1) 700ms forwards',
                }}
              />
              <path
                d="M 204 8 L 210 12 L 204 16"
                style={{
                  strokeDasharray: 20,
                  strokeDashoffset: 20,
                  animation: 'editorialArrowDraw 0.3s cubic-bezier(0.65, 0, 0.35, 1) 1900ms forwards',
                }}
              />
            </svg>
          </span>
        </div>
      </div>

      {/* Mobile floating buttons — shown whenever this empty hero renders without an
          active campaign (mobile drawers are hidden by default and need affordances
          to access chat + assets). Desktop uses the always-visible sidebars. */}
      {!activeCampaignId && (
        <>
          <div className="md:hidden fixed bottom-4 left-4 z-20">
            <Button variant="outline" size="icon" onClick={() => setMobileAssetsOpen(true)} className="h-12 w-12 rounded-full shadow-lg bg-white">
              <FolderIcon className="w-5 h-5" />
            </Button>
          </div>
          <div className="md:hidden fixed bottom-4 right-4 z-20">
            <Button size="icon" onClick={() => setMobileDrawerOpen(true)} className="h-12 w-12 rounded-full shadow-lg bg-text-primary text-white hover:bg-text-primary/90">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
