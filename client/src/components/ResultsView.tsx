import { Download, Share2, ArrowLeft, FolderIcon, ImageIcon, MessageSquare, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageCard, ImageCardSkeleton } from '@/components/ImageCard'
import { useStore } from '@/store'
import { useSidebars } from '@/components/layout/AppLayout'
import { useWebSocket } from '@/hooks/useWebSocket'

export function ResultsView() {
  const {
    getActiveCampaign,
    reset,
    selectedImageIds,
    toggleImageSelection,
    clearImageSelection,
    generationExpectedImages,
  } = useStore()
  const { setMobileDrawerOpen, setMobileAssetsOpen } = useSidebars()
  const { connectionState, resume } = useWebSocket()

  const campaign = getActiveCampaign()
  const isGenerating = campaign?.status === 'generating'
  const isIncomplete = campaign?.status === 'incomplete'
  const hasSelection = selectedImageIds.length > 0

  // Handle resume for incomplete campaigns
  const handleResume = () => {
    if (!campaign) return

    // Build resume prompt from existing campaign files
    const researchFile = campaign.files.find(f => f.type === 'research')
    const hooksFile = campaign.files.find(f => f.type === 'hooks')
    const promptsFile = campaign.files.find(f => f.type === 'prompts')

    // Create a resume prompt with context
    const resumePrompt = `RESUME GENERATION for campaign "${campaign.name}".

Existing context:
${researchFile?.content ? `\n## Research:\n${researchFile.content.slice(0, 2000)}` : ''}
${hooksFile?.content ? `\n## Hooks:\n${hooksFile.content.slice(0, 2000)}` : ''}
${promptsFile?.content ? `\n## Prompts:\n${promptsFile.content.slice(0, 2000)}` : ''}

Images already generated: ${campaign.images.length}
Missing images: ${Math.max(0, generationExpectedImages - campaign.images.length)}

Please continue from where we left off and complete the remaining images.`

    resume(campaign.id, resumePrompt)
  }

  const handleMobileChatClick = () => {
    setMobileDrawerOpen(true)
  }

  const handleMobileAssetsClick = () => {
    setMobileAssetsOpen(true)
  }

  // If no campaign is active, show empty state
  if (!campaign) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-base">
        <div className="text-center space-y-3 animate-fadeIn">
          <div className="w-12 h-12 mx-auto rounded-xl bg-bg-elevated flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-text-muted">Select a campaign to view images</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-bg-base overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-bg-base/80 backdrop-blur-sm shrink-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="text-text-muted hover:text-text-primary transition-colors p-1 rounded hover:bg-bg-elevated"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-text-primary font-medium">
              {campaign.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Selection indicator */}
            {hasSelection && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-sm text-accent font-medium">
                  {selectedImageIds.length} selected
                </span>
                <button
                  onClick={clearImageSelection}
                  className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {/* Resume button for incomplete campaigns */}
            {isIncomplete && (
              <Button
                variant="glow"
                size="sm"
                onClick={handleResume}
                disabled={connectionState !== 'connected'}
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Resume</span>
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Save All</span>
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Image grid */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaign.images.map((image, index) => (
                <ImageCard
                  key={image.id}
                  url={image.url}
                  hookHeadline={image.prompt}
                  index={index + 1}
                  hookType={image.hookType}
                  selected={selectedImageIds.includes(image.id)}
                  onSelect={() => toggleImageSelection(image.id)}
                />
              ))}
              {/* Show skeleton cards for remaining images during generation */}
              {isGenerating && campaign.images.length < generationExpectedImages && (
                Array.from({ length: generationExpectedImages - campaign.images.length }).map((_, i) => (
                  <ImageCardSkeleton key={`skeleton-${i}`} index={campaign.images.length + i + 1} />
                ))
              )}
            </div>

            {/* Empty state for campaigns with no images */}
            {campaign.images.length === 0 && (
              <div className="text-center py-16 animate-fadeIn">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-text-muted" />
                </div>
                <p className="text-text-secondary font-medium mb-1">No images yet</p>
                <p className="text-text-muted text-sm max-w-xs mx-auto">
                  Use the chat to generate images for this campaign
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 md:hidden"
                  onClick={handleMobileChatClick}
                >
                  <MessageSquare className="w-4 h-4" />
                  Open Chat
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile floating buttons - only visible on mobile */}
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
    </div>
  )
}
