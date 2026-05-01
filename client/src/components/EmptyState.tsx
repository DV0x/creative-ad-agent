import { useState, useEffect, useRef } from 'react'
import { ArrowUp, FolderIcon } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import { useSidebars } from '@/components/layout/AppLayout'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useRequireAuth } from '@/contexts/AuthContext'
import { isDevMode } from '@/lib/auth'

const SHOWCASE_IMAGES = [
  '/showcase/1.png',
  '/showcase/2.png',
  '/showcase/3.png',
  '/showcase/4.png',
  '/showcase/5.png',
  '/showcase/6.png',
]

const EXAMPLE_PROMPTS = [
  'Create ads for glossier.com targeting Gen Z for summer skincare',
  'I need a campaign for my mortgage brokerage in Austin',
  'Run ads for allbirds.com promoting their new trail runners',
  'Build creatives for a luxury real estate agent in Miami',
  'Create a launch campaign for brooklinen.com cozy season bundle',
  'I run a coffee roastery in Portland, need ads for subscriptions',
  'Make ads for hims.com targeting men 25-40 for hair regrowth',
  'Promote my RE/MAX listings for first-time homebuyers',
  'Create a holiday campaign for bombas.com gift sets',
  'I need creatives for casper.com Memorial Day mattress sale',
  'Build ads for ritual.com prenatal vitamins for expecting moms',
  'Run a back-to-school promo for warbyparker.com glasses',
]

const TICKER_ANIM_MS = 720

function useRotatingPrompt(prompts: string[], enabled: boolean, interval = 3500) {
  const [state, setState] = useState<{
    index: number
    previous: string | null
    tick: number
  }>({ index: 0, previous: null, tick: 0 })

  useEffect(() => {
    if (!enabled) return
    const timer = setInterval(() => {
      setState(s => ({
        index: (s.index + 1) % prompts.length,
        previous: prompts[s.index],
        tick: s.tick + 1,
      }))
    }, interval)
    return () => clearInterval(timer)
  }, [enabled, prompts.length, interval, prompts])

  // Drop the outgoing layer once its exit animation finishes
  useEffect(() => {
    if (state.previous == null) return
    const t = setTimeout(
      () => setState(s => ({ ...s, previous: null })),
      TICKER_ANIM_MS,
    )
    return () => clearTimeout(t)
  }, [state.tick, state.previous])

  return { current: prompts[state.index], previous: state.previous, tick: state.tick }
}

export function EmptyState() {
  const { prompt, setPrompt, selectedAspectRatio, setSelectedAspectRatio, isCreatingCampaign, campaigns, activeCampaignId, generatingCampaignId, setActiveCampaignId, setAppState, pendingGeneration, setPendingGeneration, appState } = useStore()
  const { setMobileDrawerOpen, setMobileAssetsOpen } = useSidebars()
  const { isConnected, generate } = useWebSocket()
  const { requireAuth } = useRequireAuth()
  const [inputFocused, setInputFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Editorial mode: workspace + no visual work to display (zero campaigns, or active campaign
  // hasn't kicked off image generation yet). App.tsx duplicates this gate when picking what to render.
  const activeCampaign = activeCampaignId ? campaigns.find(c => c.id === activeCampaignId) : null
  const isActiveGenerating = generatingCampaignId !== null && generatingCampaignId === activeCampaignId
  const isWorkspaceEmpty = appState === 'workspace' && (
    campaigns.length === 0 ||
    (!!activeCampaign && activeCampaign.images.length === 0 && !isActiveGenerating)
  )

  // First name for editorial greeting. Match codebase pattern (conditional Clerk hook in dev mode).
  const clerkUser = isDevMode() ? null : useUser().user
  const firstName =
    clerkUser?.firstName ||
    clerkUser?.username ||
    clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    null

  // Rotating placeholder — only runs when input is empty and not focused
  const showRotating = !prompt && !inputFocused && !isCreatingCampaign
  const { current: rotatingText, previous: previousText, tick } = useRotatingPrompt(EXAMPLE_PROMPTS, showRotating)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!prompt.trim()) return

    // Save prompt before any redirect
    sessionStorage.setItem('creative-agent:pendingPrompt', prompt)

    if (isConnected) {
      // Already signed in + connected — generate directly
      requireAuth(() => {
        sessionStorage.removeItem('creative-agent:pendingPrompt')
        generate(prompt.trim(), undefined, selectedAspectRatio)
      })
    } else {
      // Not signed in — redirect to sign-in, prompt will auto-generate after
      requireAuth(() => {})
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  useEffect(() => {
    if (pendingGeneration && isConnected) {
      setPendingGeneration(false)
      const savedPrompt = sessionStorage.getItem('creative-agent:pendingPrompt') || prompt
      if (savedPrompt.trim()) {
        sessionStorage.removeItem('creative-agent:pendingPrompt')
        generate(savedPrompt.trim(), undefined, selectedAspectRatio)
      }
    }
  }, [pendingGeneration, isConnected, setPendingGeneration, generate, prompt])

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
    }
  }, [prompt])

  const handleRecentClick = (campaignId: string) => {
    setActiveCampaignId(campaignId)
    setAppState('workspace')
  }

  const handleMobileChatClick = () => setMobileDrawerOpen(true)
  const handleMobileAssetsClick = () => setMobileAssetsOpen(true)

  const recentCampaigns = campaigns.slice(0, 4)

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-auto">

      {/* Hero — split layout on desktop, stacked on mobile. Workspace-empty mode collapses to single column. */}
      <div className={`relative flex-1 flex flex-col items-center justify-center min-h-[100vh] px-6 md:px-12 lg:px-16 pt-24 pb-12 gap-12 max-w-7xl mx-auto w-full ${!isWorkspaceEmpty ? 'lg:flex-row lg:gap-16' : ''}`}>

        {/* Left: heading + input */}
        <div className={`w-full ${!isWorkspaceEmpty ? 'lg:w-1/2 lg:max-w-lg' : 'lg:max-w-2xl'}`}>

          {isWorkspaceEmpty ? (
            <>
              {/* Editorial empty-state hero — chat sidebar is the action surface */}
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary leading-[1.05] editorial-fade-up"
                style={{ animation: 'editorialFadeUp 600ms cubic-bezier(0.16, 1, 0.3, 1) 0ms both' }}
              >
                Welcome in{firstName ? <>, <span className="text-[#AB406C]">{firstName}</span></> : null}.
                <br />
                Your studio is open.
              </h1>

              <div
                className="mt-8 h-[2px] w-8 bg-[#AB406C] editorial-fade-up"
                style={{ animation: 'editorialFadeUp 480ms cubic-bezier(0.16, 1, 0.3, 1) 200ms both' }}
              />
            </>
          ) : (
            <>
              {/* Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-text-primary leading-[1.08]">
                {isCreatingCampaign
                  ? 'New campaign'
                  : <>Turn any brand into{' '}<br className="hidden md:block" />an ad campaign.</>}
              </h1>
              <p className="mt-4 text-text-secondary text-base leading-relaxed">
                {isCreatingCampaign
                  ? 'Enter a website URL or describe the business.'
                  : 'Just drop a URL. AI handles the research, strategy, and creatives.'}
              </p>

              {/* Input card */}
              <form onSubmit={handleSubmit} className="mt-8">
                <div className={`rounded-2xl border bg-white transition-all duration-200 relative ${
                  inputFocused
                    ? 'border-border-emphasis shadow-lg'
                    : 'border-border shadow-md'
                }`}>
                  {/* Rotating placeholder — ticker-style cross-slide */}
                  {showRotating && (
                    <div
                      className="absolute left-4 top-4 right-12 h-6 overflow-hidden cursor-text"
                      onClick={() => textareaRef.current?.focus()}
                      aria-hidden="true"
                    >
                      {previousText && (
                        <span
                          key={`out-${tick}`}
                          className="absolute inset-0 block text-base text-text-muted whitespace-nowrap overflow-hidden text-ellipsis ticker-text-exiting"
                          style={{ animation: 'tickerRotateOut 720ms cubic-bezier(0.16, 1, 0.3, 1) both', willChange: 'transform, opacity' }}
                        >
                          {previousText}
                        </span>
                      )}
                      <span
                        key={`in-${tick}`}
                        className="absolute inset-0 block text-base text-text-muted whitespace-nowrap overflow-hidden text-ellipsis ticker-text-entering"
                        style={{ animation: 'tickerRotateIn 720ms cubic-bezier(0.16, 1, 0.3, 1) both', willChange: 'transform, opacity' }}
                      >
                        {rotatingText}
                      </span>
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder={inputFocused ? 'Enter a URL or describe your business...' : ''}
                    rows={2}
                    className="w-full resize-none bg-transparent text-text-primary placeholder:text-text-muted px-4 pt-4 pb-2 text-base outline-none focus:outline-none focus-visible:outline-none relative z-10"
                    autoFocus={isCreatingCampaign}
                  />

                  <div className="flex items-center justify-between px-3 pb-3">
                    <div className="flex items-center gap-1">
                      {(['4:5', '1:1', '9:16'] as const).map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setSelectedAspectRatio(ratio)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150 ${
                            selectedAspectRatio === ratio
                              ? 'bg-bg-elevated text-text-primary'
                              : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated/50'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={!prompt.trim()}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-text-primary text-white hover:bg-text-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Process strip */}
              <div className="mt-5 flex items-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-bg-elevated flex items-center justify-center text-[10px] font-bold text-text-secondary">1</span>
                  Research
                </span>
                <span className="text-border-emphasis">—</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-bg-elevated flex items-center justify-center text-[10px] font-bold text-text-secondary">2</span>
                  Ad hooks
                </span>
                <span className="text-border-emphasis">—</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-bg-elevated flex items-center justify-center text-[10px] font-bold text-text-secondary">3</span>
                  Creative pack
                </span>
              </div>
            </>
          )}

          {/* Recent campaigns — compact, below input on desktop */}
          {!isCreatingCampaign && !isWorkspaceEmpty && recentCampaigns.length > 0 && (
            <div className="mt-8 hidden lg:block">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Recent</p>
              <div className="flex gap-2 flex-wrap">
                {recentCampaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => handleRecentClick(campaign.id)}
                    className="px-3 py-1.5 rounded-full text-sm text-text-secondary border border-border hover:border-border-emphasis hover:text-text-primary bg-white transition-all duration-150 active:scale-[0.97]"
                  >
                    {campaign.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: bento grid of sample creatives — hidden in workspace-empty mode */}
        {!isWorkspaceEmpty && (
        <div className="w-full lg:w-1/2 lg:max-w-xl">
          <div className="grid grid-cols-3 gap-3 auto-rows-auto">
            {/* Row 1: large + two stacked */}
            <div className="col-span-2 row-span-2">
              <img
                src={SHOWCASE_IMAGES[0]}
                alt=""
                className="w-full h-full object-cover rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 opacity-0 animate-[bentoIn_0.6s_ease-out_0.1s_forwards]"
              />
            </div>
            <div>
              <img
                src={SHOWCASE_IMAGES[1]}
                alt=""
                className="w-full aspect-square object-cover rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.03] transition-all duration-300 opacity-0 animate-[bentoIn_0.6s_ease-out_0.2s_forwards]"
              />
            </div>
            <div>
              <img
                src={SHOWCASE_IMAGES[2]}
                alt=""
                className="w-full aspect-square object-cover rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.03] transition-all duration-300 opacity-0 animate-[bentoIn_0.6s_ease-out_0.3s_forwards]"
              />
            </div>

            {/* Row 2: two stacked + large */}
            <div>
              <img
                src={SHOWCASE_IMAGES[3]}
                alt=""
                className="w-full aspect-square object-cover rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.03] transition-all duration-300 opacity-0 animate-[bentoIn_0.6s_ease-out_0.4s_forwards]"
              />
            </div>
            <div>
              <img
                src={SHOWCASE_IMAGES[4]}
                alt=""
                className="w-full aspect-square object-cover rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.03] transition-all duration-300 opacity-0 animate-[bentoIn_0.6s_ease-out_0.5s_forwards]"
              />
            </div>
            <div>
              <img
                src={SHOWCASE_IMAGES[5]}
                alt=""
                className="w-full aspect-square object-cover rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.03] transition-all duration-300 opacity-0 animate-[bentoIn_0.6s_ease-out_0.6s_forwards]"
              />
            </div>
          </div>
        </div>
        )}

        {/* Long directional arrow → chat. Bottom-right of hero, desktop only. */}
        {isWorkspaceEmpty && (
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
              <svg
                width="220"
                height="24"
                viewBox="0 0 220 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Long, gently curving line — hand-drawn quality */}
                <path
                  d="M 4 14 C 40 14 60 10 100 11 S 160 13 200 12 L 210 12"
                  style={{
                    strokeDasharray: 320,
                    strokeDashoffset: 320,
                    animation: 'editorialArrowDraw 1.4s cubic-bezier(0.65, 0, 0.35, 1) 700ms forwards',
                  }}
                />
                {/* Arrowhead */}
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
        )}
      </div>

      {/* Mobile recent campaigns */}
      {!isCreatingCampaign && !isWorkspaceEmpty && recentCampaigns.length > 0 && (
        <div className="lg:hidden px-6 pb-12">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Recent</p>
          <div className="flex gap-2 flex-wrap">
            {recentCampaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => handleRecentClick(campaign.id)}
                className="px-3 py-1.5 rounded-full text-sm text-text-secondary border border-border hover:border-border-emphasis hover:text-text-primary bg-white transition-all duration-150"
              >
                {campaign.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile floating buttons */}
      {isCreatingCampaign && (
        <>
          <div className="md:hidden fixed bottom-4 left-4 z-20">
            <Button variant="outline" size="icon" onClick={handleMobileAssetsClick} className="h-12 w-12 rounded-full shadow-lg bg-white">
              <FolderIcon className="w-5 h-5" />
            </Button>
          </div>
          <div className="md:hidden fixed bottom-4 right-4 z-20">
            <Button size="icon" onClick={handleMobileChatClick} className="h-12 w-12 rounded-full shadow-lg bg-text-primary text-white hover:bg-text-primary/90">
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
