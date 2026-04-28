import { useState, useEffect, useRef } from 'react'
import { ArrowUp } from 'lucide-react'
import { useStore } from '@/store'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useRequireAuth } from '@/contexts/AuthContext'

const ADS = [
  { src: '/landing/ads/ad-tutor.png',                alt: 'Tutorly tutoring' },
  { src: '/landing/ads/ad-bombay-shirts.png',        alt: 'Bombay Shirts menswear' },
  { src: '/landing/ads/ad-barosi-milk.png',          alt: 'Barosi A2 milk' },
  { src: '/landing/ads/ad-commercial-space.png',     alt: 'Commercial space financing' },
  { src: '/landing/ads/ad-real-estate-approved.png', alt: 'Real estate approved' },
  { src: '/landing/ads/ad-real-estate-rejected.png', alt: 'Real estate rejected' },
]

const EXAMPLE_PROMPTS = [
  'Run a back-to-school promo for warbyparker.com glasses',
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
]

const ROTATE_ANIM_MS = 720

function useRotatingPrompt(prompts: string[], enabled: boolean, interval = 3500) {
  const [state, setState] = useState<{
    index: number
    previous: string | null
    tick: number
  }>({ index: 0, previous: null, tick: 0 })

  useEffect(() => {
    if (!enabled) return
    const timer = setInterval(() => {
      setState((s) => ({
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
      () => setState((s) => ({ ...s, previous: null })),
      ROTATE_ANIM_MS,
    )
    return () => clearTimeout(t)
  }, [state.tick, state.previous])

  return { current: prompts[state.index], previous: state.previous, tick: state.tick }
}

export function Hero() {
  const {
    prompt, setPrompt,
    selectedAspectRatio, setSelectedAspectRatio,
    pendingGeneration, setPendingGeneration,
  } = useStore()
  const { isConnected, generate } = useWebSocket()
  const { requireAuth } = useRequireAuth()
  const [inputFocused, setInputFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const showRotating = !prompt && !inputFocused
  const { current: rotatingText, previous: previousText, tick } = useRotatingPrompt(
    EXAMPLE_PROMPTS,
    showRotating,
  )

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!prompt.trim()) return
    sessionStorage.setItem('creative-agent:pendingPrompt', prompt)

    if (isConnected) {
      requireAuth(() => {
        sessionStorage.removeItem('creative-agent:pendingPrompt')
        generate(prompt.trim(), undefined, selectedAspectRatio)
      })
    } else {
      requireAuth(() => {})
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
  }, [prompt])

  // Pending generation handoff (after sign-in redirect)
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
    <section className="lp-hero" id="top">
      <div className="lp-wrap lp-hero-grid">
        <div>
          <h1 className="lp-h1 lp-hero-h1">
            Ship your next<br />
            <span className="lp-pop-word">winning ad</span><br />
            by 4pm.
          </h1>

          <p className="lp-hero-sub">
            Tell us what to run. We research the brand, write the hooks,
            and render <strong>a full creative pack</strong> — diverse enough
            to feed Meta and TikTok, in under five minutes.
          </p>

          <form className="lp-composer" onSubmit={handleSubmit} aria-label="Campaign brief">
            {showRotating && (
              <div
                className="lp-composer-placeholder"
                onClick={() => textareaRef.current?.focus()}
                aria-hidden="true"
              >
                {previousText && (
                  <span key={`out-${tick}`} className="lp-placeholder-text exiting">
                    {previousText}
                  </span>
                )}
                <span key={`in-${tick}`} className="lp-placeholder-text entering">
                  {rotatingText}
                </span>
              </div>
            )}
            <textarea
              ref={textareaRef}
              className="lp-composer-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={handleKeyDown}
              rows={3}
              aria-label="Describe the campaign you want"
            />
            <div className="lp-composer-foot">
              <div className="lp-ratio-chips" role="tablist" aria-label="Aspect ratio">
                {(['4:5', '1:1', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    className={`lp-ratio-chip ${selectedAspectRatio === ratio ? 'on' : ''}`}
                    onClick={() => setSelectedAspectRatio(ratio)}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                className="lp-composer-submit"
                disabled={!prompt.trim()}
                aria-label="Generate campaign"
              >
                <ArrowUp size={16} strokeWidth={2.2} />
              </button>
            </div>
          </form>

          <ol className="lp-pipeline" aria-label="What happens after you submit">
            <li><span className="n">1</span><span className="l">Research</span></li>
            <li className="dash" aria-hidden="true">—</li>
            <li><span className="n">2</span><span className="l">Ad hooks</span></li>
            <li className="dash" aria-hidden="true">—</li>
            <li><span className="n">3</span><span className="l">Creative pack</span></li>
          </ol>
        </div>

        <div className="lp-hero-bento" aria-label="Sample creatives generated by Creative Machines">
          <figure className="lp-bento-item lp-bento-hero">
            <img src={ADS[0].src} alt={ADS[0].alt} loading="lazy" />
          </figure>
          <figure className="lp-bento-item">
            <img src={ADS[1].src} alt={ADS[1].alt} loading="lazy" />
          </figure>
          <figure className="lp-bento-item">
            <img src={ADS[2].src} alt={ADS[2].alt} loading="lazy" />
          </figure>
          <figure className="lp-bento-item">
            <img src={ADS[3].src} alt={ADS[3].alt} loading="lazy" />
          </figure>
          <figure className="lp-bento-item">
            <img src={ADS[4].src} alt={ADS[4].alt} loading="lazy" />
          </figure>
          <figure className="lp-bento-item">
            <img src={ADS[5].src} alt={ADS[5].alt} loading="lazy" />
          </figure>
        </div>
      </div>
    </section>
  )
}
