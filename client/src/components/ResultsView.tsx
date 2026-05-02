import { useState, useCallback } from 'react'
import { Download, FolderIcon, ImageIcon, X, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageCard, ImageCardSkeleton } from '@/components/ImageCard'
import { ImageLightbox } from '@/components/ImageLightbox'
import { useStore } from '@/store'
import { useSidebars } from '@/components/layout/AppLayout'
import { formatCampaignName } from '@/lib/utils'
import { useWebSocket } from '@/hooks/useWebSocket'
import { authFetchBlob, eventsApi } from '@/lib/api'

export function ResultsView() {
  const {
    getActiveCampaign,
    selectedImageIds,
    toggleImageSelection,
    clearImageSelection,
    generationExpectedImages,
  } = useStore()

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isSavingAll, setIsSavingAll] = useState(false)

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false)
  }, [])
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

  const handleSaveAll = useCallback(async () => {
    if (!campaign || campaign.images.length === 0 || isSavingAll) return
    setIsSavingAll(true)
    eventsApi.track('download_all', campaign.id, { imageCount: campaign.images.length })
    const name = formatCampaignName(campaign.name).replace(/\s+/g, '-').toLowerCase()
    for (let i = 0; i < campaign.images.length; i++) {
      const img = campaign.images[i]
      try {
        const blobUrl = await authFetchBlob(img.url)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = `${name}-${i + 1}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
      } catch {
        const link = document.createElement('a')
        link.href = img.url
        link.download = `${name}-${i + 1}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      // Small delay between downloads so browser doesn't block them
      if (i < campaign.images.length - 1) {
        await new Promise(r => setTimeout(r, 300))
      }
    }
    setIsSavingAll(false)
  }, [campaign, isSavingAll])

  const handleMobileChatClick = () => {
    setMobileDrawerOpen(true)
  }

  const handleMobileAssetsClick = () => {
    setMobileAssetsOpen(true)
  }

  // If no campaign is active, show empty state
  if (!campaign) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-base">
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
    <div className="h-full flex flex-col bg-bg-base overflow-hidden">
      {/* Connection status banner */}
      {connectionState === 'reconnecting' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-700 text-center animate-fadeIn">
          Lost connection for a sec, reconnecting...
        </div>
      )}
      {connectionState === 'disconnected' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-600 text-center animate-fadeIn">
          Connection's being stubborn — try refreshing the page
        </div>
      )}
      {/* Header */}
      <header className="h-14 border-b border-border bg-bg-base/80 backdrop-blur-sm shrink-0 z-10">
        <div className="h-full px-4 flex items-center justify-between">
          <span className="text-text-primary font-medium">
            {formatCampaignName(campaign.name)}
          </span>
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
            {campaign.images.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSaveAll} disabled={isSavingAll}>
                {isSavingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="hidden sm:inline">{isSavingAll ? 'Saving...' : 'Save All'}</span>
              </Button>
            )}
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
                  index={index + 1}
                  selected={selectedImageIds.includes(image.id)}
                  onSelect={() => toggleImageSelection(image.id)}
                  onView={() => openLightbox(index)}
                  campaignId={campaign.id}
                  hookType={image.hookType}
                />
              ))}
              {/* Show skeleton cards for remaining images during generation */}
              {isGenerating && campaign.images.length < generationExpectedImages && (
                Array.from({ length: generationExpectedImages - campaign.images.length }).map((_, i) => (
                  <ImageCardSkeleton key={`skeleton-${i}`} index={campaign.images.length + i + 1} />
                ))
              )}
            </div>

            {/* Empty state for "campaign exists but no images yet" is now handled at App.tsx
                level — the welcome editorial hero stays mounted until generation kicks off. */}
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

      {/* Image lightbox */}
      <ImageLightbox
        images={campaign.images}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
        onNavigate={setLightboxIndex}
      />
    </div>
  )
}
