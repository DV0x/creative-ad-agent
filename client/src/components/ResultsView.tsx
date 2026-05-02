import { useState, useCallback } from 'react'
import { Download, FolderIcon, X, RefreshCw, Loader2, ChevronRight } from 'lucide-react'
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

  const handleResume = () => {
    if (!campaign) return

    const researchFile = campaign.files.find(f => f.type === 'research')
    const hooksFile = campaign.files.find(f => f.type === 'hooks')
    const promptsFile = campaign.files.find(f => f.type === 'prompts')

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

  // App.tsx routes to <EmptyState /> whenever there is no active campaign, so this
  // component is only ever rendered with a real campaign. Assert the invariant so
  // TypeScript narrows below and any future routing regression fails loudly.
  if (!campaign) {
    throw new Error('ResultsView rendered without an active campaign')
  }

  const imageCount = campaign.images.length
  const showActiveChip = isGenerating
  const showWorkingSession = imageCount > 0 || isGenerating

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-hidden">
      {/* Editorial toolbar — no border, breathes via spacing */}
      <header className="h-13 shrink-0 z-10">
        <div className="h-full px-5 flex items-center justify-between gap-4">
          {/* Left: breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            {campaign.brand && (
              <>
                <span className="text-[11px] uppercase tracking-[0.14em] font-mono text-text-muted truncate">
                  {campaign.brand}
                </span>
                <ChevronRight className="w-3 h-3 text-text-muted/60 shrink-0" />
              </>
            )}
            <span className="text-text-primary font-medium truncate">
              {formatCampaignName(campaign.name)}
            </span>
            {showActiveChip && (
              <span
                className="ml-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.12em] font-mono shrink-0"
                style={{
                  backgroundColor: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)',
                }}
              >
                Active
              </span>
            )}
          </div>

          {/* Right: connection + actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Connection status — small inline pill */}
            {connectionState === 'reconnecting' && (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-mono animate-fadeIn"
                style={{
                  backgroundColor: 'rgba(184, 121, 31, 0.10)',
                  color: '#8a5a18',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: '#b8791f', animation: 'cm-breathe 1.4s ease-in-out infinite' }}
                />
                reconnecting
              </span>
            )}
            {connectionState === 'disconnected' && (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-mono animate-fadeIn"
                style={{
                  backgroundColor: 'rgba(180, 35, 24, 0.10)',
                  color: '#a52a1f',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#a52a1f' }} />
                offline · refresh
              </span>
            )}

            {hasSelection && (
              <div className="flex items-center gap-2">
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

            {imageCount > 0 && (
              <button
                onClick={handleSaveAll}
                disabled={isSavingAll}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12px] font-medium text-white transition-all duration-150 disabled:opacity-70 active:scale-[0.97]"
                style={{
                  backgroundColor: isSavingAll ? 'var(--color-accent-press)' : 'var(--color-accent)',
                  boxShadow: '0 1px 2px rgba(120, 40, 74, 0.18)',
                }}
                onMouseEnter={(e) => {
                  if (isSavingAll) return
                  e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
                }}
                onMouseLeave={(e) => {
                  if (isSavingAll) return
                  e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                }}
                title="Download all"
              >
                {isSavingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{isSavingAll ? 'Saving…' : 'Save all'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="px-5 pb-6 pt-1 md:px-6 md:pb-8">
            {showWorkingSession && (
              <div className="flex items-center gap-2 mb-5 animate-fadeIn">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    animation: isGenerating ? 'cm-breathe 1.6s ease-in-out infinite' : undefined,
                  }}
                />
                <span className="text-[11px] uppercase tracking-[0.14em] font-mono text-text-muted">
                  Working session
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
              {isGenerating && campaign.images.length < generationExpectedImages && (
                Array.from({ length: generationExpectedImages - campaign.images.length }).map((_, i) => (
                  <ImageCardSkeleton key={`skeleton-${i}`} index={campaign.images.length + i + 1} />
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile floating buttons */}
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
