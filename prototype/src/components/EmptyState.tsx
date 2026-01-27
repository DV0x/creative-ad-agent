import { useState } from 'react'
import { ArrowRight, Sparkles, FolderIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store'
import { useSidebars } from '@/components/layout/AppLayout'

const EXAMPLES = [
  'nike.com - focus on sustainability',
  'Local bakery in Austin, artisan breads',
  'stripe.com - developer tools'
]

export function EmptyState() {
  const { prompt, setPrompt, startGeneration, isCreatingCampaign, campaigns, setActiveCampaignId, setAppState } = useStore()
  const { setMobileDrawerOpen, setMobileAssetsOpen } = useSidebars()
  const [inputFocused, setInputFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim()) {
      startGeneration()
    }
  }

  const handleExample = (example: string) => {
    setPrompt(example)
  }

  const handleMobileChatClick = () => {
    setMobileDrawerOpen(true)
  }

  const handleMobileAssetsClick = () => {
    setMobileAssetsOpen(true)
  }

  const handleRecentClick = (campaignId: string) => {
    setActiveCampaignId(campaignId)
    setAppState('results')
  }

  // Show recent campaigns from store instead of hardcoded
  const recentCampaigns = campaigns.slice(0, 3)

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-12 bg-bg-base overflow-auto relative">
      {/* Gradient mesh background */}
      <div className="gradient-mesh" aria-hidden="true">
        <div className="gradient-mesh-blob" />
      </div>

      <div className="w-full max-w-xl space-y-8 relative z-10">
        {/* Logo / Icon */}
        <div className="flex justify-center">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-bg-elevated">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-semibold text-center text-text-primary">
          {isCreatingCampaign ? 'Create a new campaign' : 'What would you like to create?'}
        </h1>

        {/* Subheadline for new campaign */}
        {isCreatingCampaign && (
          <p className="text-center text-text-muted -mt-4">
            Enter a website URL or describe the business to generate ad creatives
          </p>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="relative">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Enter a website URL or describe your business..."
            className={`h-14 pr-28 text-base bg-bg-raised border-border ${
              inputFocused ? 'shadow-[0_0_30px_var(--color-accent-glow)]' : ''
            }`}
            autoFocus={isCreatingCampaign}
          />
          <Button
            type="submit"
            disabled={!prompt.trim()}
            variant="glow"
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            Create
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* Example prompts */}
        <div className="text-center space-y-2">
          <p className="text-sm text-text-muted">Try:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                onClick={() => handleExample(example)}
                className="text-sm text-text-secondary hover:text-accent transition-all duration-200 px-3 py-1.5 rounded-full bg-bg-raised hover:bg-bg-elevated border border-border hover:border-accent/30 hover:shadow-[0_0_12px_var(--color-accent-glow)] active:scale-95"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>

        {/* Recent projects - only show when not creating from sidebar */}
        {!isCreatingCampaign && recentCampaigns.length > 0 && (
          <>
            <div className="border-t border-border" />
            <div className="space-y-3">
              <p className="text-sm text-text-muted">Recent</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recentCampaigns.map((campaign, index) => {
                  const colors = ['#ff6b00', '#268bd2', '#8b5cf6']
                  const color = colors[index % 3]
                  return (
                    <button
                      key={campaign.id}
                      onClick={() => handleRecentClick(campaign.id)}
                      className="flex-shrink-0 w-28 p-3 rounded-lg bg-bg-raised hover:bg-bg-elevated border border-border hover:border-border-emphasis transition-all duration-200 text-left group active:scale-95 hover:-translate-y-0.5"
                    >
                      <div
                        className="w-8 h-8 rounded mb-2 transition-all duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: color,
                          boxShadow: `0 0 0 0 ${color}40`
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 20px 4px ${color}40`}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = `0 0 0 0 ${color}40`}
                      />
                      <p className="text-sm font-medium text-text-primary truncate group-hover:text-white transition-colors">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {campaign.images.length} images
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile floating buttons - only when creating campaign (workspace mode) */}
      {isCreatingCampaign && (
        <>
          <div className="md:hidden fixed bottom-4 left-4 z-20">
            <Button
              variant="outline"
              size="icon"
              onClick={handleMobileAssetsClick}
              className="h-12 w-12 rounded-full shadow-lg bg-bg-raised"
            >
              <FolderIcon className="w-5 h-5" />
            </Button>
          </div>
          <div className="md:hidden fixed bottom-4 right-4 z-20">
            <Button
              variant="glow"
              size="icon"
              onClick={handleMobileChatClick}
              className="h-12 w-12 rounded-full shadow-lg"
            >
              <span className="text-lg">💬</span>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
