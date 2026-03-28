import { useState, useEffect, useRef } from 'react'
import { ArrowUp, FolderIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import { useSidebars } from '@/components/layout/AppLayout'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useRequireAuth } from '@/contexts/AuthContext'

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

function useRotatingPrompt(prompts: string[], enabled: boolean, interval = 3000) {
  const [index, setIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const timer = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setIndex(i => (i + 1) % prompts.length)
        setIsTransitioning(false)
      }, 300)
    }, interval)
    return () => clearInterval(timer)
  }, [enabled, prompts.length, interval])

  return { text: prompts[index], isTransitioning }
}

export function EmptyState() {
  const { prompt, setPrompt, selectedAspectRatio, setSelectedAspectRatio, isCreatingCampaign, campaigns, setActiveCampaignId, setAppState, pendingGeneration, setPendingGeneration } = useStore()
  const { setMobileDrawerOpen, setMobileAssetsOpen } = useSidebars()
  const { isConnected, generate } = useWebSocket()
  const { requireAuth } = useRequireAuth()
  const [inputFocused, setInputFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Rotating placeholder — only runs when input is empty and not focused
  const showRotating = !prompt && !inputFocused && !isCreatingCampaign
  const { text: rotatingText, isTransitioning } = useRotatingPrompt(EXAMPLE_PROMPTS, showRotating)

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

      {/* Hero — split layout on desktop, stacked on mobile */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center min-h-[100vh] px-6 md:px-12 lg:px-16 pt-24 pb-12 gap-12 lg:gap-16 max-w-7xl mx-auto w-full">

        {/* Left: heading + input */}
        <div className="w-full lg:w-1/2 lg:max-w-lg">

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
              {/* Rotating placeholder overlay */}
              {showRotating && (
                <div
                  className="absolute left-4 top-4 right-12 pointer-events-none overflow-hidden"
                  onClick={() => textareaRef.current?.focus()}
                >
                  <span
                    className={`block text-base text-text-muted transition-all duration-300 ease-out ${
                      isTransitioning
                        ? 'opacity-0 -translate-y-2'
                        : 'opacity-100 translate-y-0'
                    }`}
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
              6 creatives
            </span>
          </div>

          {/* Recent campaigns — compact, below input on desktop */}
          {!isCreatingCampaign && recentCampaigns.length > 0 && (
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

        {/* Right: bento grid of sample creatives */}
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
      </div>

      {/* Mobile recent campaigns */}
      {!isCreatingCampaign && recentCampaigns.length > 0 && (
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
