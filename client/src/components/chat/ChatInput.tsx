import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square, AtSign } from 'lucide-react'
import { AssetMention, type AssetMentionHandle } from '@/components/mentions/AssetMention'
import { ImageChip } from '@/components/chat/ImageChip'
import { ReferenceChipStrip } from '@/components/chat/ReferenceChipStrip'
import { useStore, type AssetFolder, type AssetFile, type CampaignFileType } from '@/store'

interface ChatInputProps {
  onSubmit: (message: {
    content: string
    fileRefs: { fileType: CampaignFileType }[]
    assetRefs: string[]
    imageRefs: { imageId: number }[]
  }) => void
  disabled?: boolean
  isGenerating?: boolean
  onCancel?: () => void
  autoFocus?: boolean
}

const ASPECT_RATIOS = ['4:5', '1:1', '9:16'] as const
const WINE_HAIRLINE = 'rgba(120, 40, 74, 0.14)'
const EMPTY_IDS: string[] = []

export function ChatInput({ onSubmit, disabled, isGenerating, onCancel, autoFocus }: ChatInputProps) {
  const {
    selectedImageIds,
    toggleImageSelection,
    clearImageSelection,
    getSelectedImages,
    selectedAspectRatio,
    setSelectedAspectRatio,
  } = useStore()

  // Reference image flow:
  //  - Active campaign exists → @mention dispatches addReference (sticky chip strip).
  //    `mentionedAssetFiles` stays empty so AssetMention's inline chips don't show.
  //  - No active campaign (creating new one) → fall back to local state; refs are
  //    threaded into generate() and attached on the freshly-minted campaign.
  const activeCampaignId = useStore((s) => s.activeCampaignId)
  const addReference = useStore((s) => s.addReference)
  // Returning a new [] from the selector on every render trips React's
  // update-depth-exceeded loop. Pull the value (possibly undefined), fall back
  // to a stable constant outside the selector.
  const activeRefIdsRaw = useStore((s) =>
    activeCampaignId ? s.activeReferencesByCampaign[activeCampaignId] : undefined,
  )
  const activeRefIds = activeRefIdsRaw ?? EMPTY_IDS

  const mentionRef = useRef<AssetMentionHandle>(null)

  const [message, setMessage] = useState('')
  const [mentionedFolders, setMentionedFolders] = useState<AssetFolder[]>([])
  const [mentionedFiles, setMentionedFiles] = useState<CampaignFileType[]>([])
  const [mentionedAssetFiles, setMentionedAssetFiles] = useState<AssetFile[]>([])

  // Drain pendingReferences (picked in the library before a campaign existed) into
  // mentionedAssetFiles so the freshly-rendered chat input shows them as chips and
  // the existing submit path threads them into the new campaign's active references.
  const pendingReferences = useStore((s) => s.pendingReferences)
  const clearPendingReferences = useStore((s) => s.clearPendingReferences)
  useEffect(() => {
    if (activeCampaignId) return
    if (pendingReferences.length === 0) return
    setMentionedAssetFiles((prev) => {
      const existing = new Set(prev.map((f) => f.id))
      const additions = pendingReferences.filter((f) => !existing.has(f.id))
      return additions.length > 0 ? [...prev, ...additions] : prev
    })
    clearPendingReferences()
  }, [pendingReferences, activeCampaignId, clearPendingReferences])

  const handleAssetFileMention = (files: AssetFile[]) => {
    if (activeCampaignId) {
      // Find the newly-mentioned file (the one not in our previous local snapshot)
      const known = new Set(mentionedAssetFiles.map((f) => f.id))
      const newest = files.find((f) => !known.has(f.id))
      if (newest && !activeRefIds.includes(newest.id)) {
        addReference(activeCampaignId, newest.id)
      }
      // Don't accumulate — chip strip is the persistent surface for active campaigns.
    } else {
      setMentionedAssetFiles(files)
    }
  }

  const selectedImages = getSelectedImages()
  const hasContent = message.trim() ||
    mentionedFolders.length > 0 ||
    mentionedFiles.length > 0 ||
    mentionedAssetFiles.length > 0 ||
    selectedImageIds.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasContent || disabled) return

    const campaignFileNames = mentionedFiles.map(f => `@${f}`).join(' ')
    const folderNames = mentionedFolders.map(f => `@${f.name}`).join(' ')
    const assetFileNames = mentionedAssetFiles.map(f => `@${f.name}`).join(' ')
    const imageNames = selectedImages.map(img => `[Image ${img.id}]`).join(' ')

    const mentionPrefix = [campaignFileNames, folderNames, assetFileNames, imageNames]
      .filter(Boolean)
      .join(' ')

    const fullMessage = mentionPrefix
      ? `${mentionPrefix} ${message.trim()}`.trim()
      : message.trim()

    // assetRefs for active campaigns: empty — refs already live on the campaign row.
    // For new-campaign creation, emit local mentionedAssetFiles so generate() can
    // dispatch set_active_references after minting the campaignId.
    const assetFileRefs = activeCampaignId
      ? []
      : mentionedAssetFiles.map(f => f.id)

    onSubmit({
      content: fullMessage,
      fileRefs: mentionedFiles.map(f => ({ fileType: f })),
      assetRefs: [...mentionedFolders.map(f => f.id), ...assetFileRefs],
      imageRefs: selectedImageIds.map(id => ({ imageId: id })),
    })

    setMessage('')
    setMentionedFolders([])
    setMentionedFiles([])
    setMentionedAssetFiles([])
    clearImageSelection()
  }

  const handleRemoveImage = (imageId: number) => {
    toggleImageSelection(imageId)
  }

  const handleActionClick = () => {
    if (isGenerating && onCancel) {
      onCancel()
    }
  }

  return (
    <div className="px-3 pb-3 pt-2">
      <form onSubmit={handleSubmit}>
        {/* Persistent reference images for the active campaign (sticky across turns) */}
        {activeCampaignId && <ReferenceChipStrip campaignId={activeCampaignId} />}

        {/* Selected images — reference chips above textarea */}
        {selectedImages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedImages.map(img => (
              <ImageChip
                key={img.id}
                imageId={img.id}
                hookType={img.hookType}
                thumbnailUrl={img.url}
                onRemove={() => handleRemoveImage(img.id)}
              />
            ))}
          </div>
        )}

        {/* Composer surface — near-white textarea, wine hairline, soft shadow */}
        <div
          className="relative rounded-xl px-2 pt-1.5 pb-2 transition-shadow duration-150"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            boxShadow: `0 0 0 1px ${WINE_HAIRLINE}, 0 1px 2px rgba(35, 31, 32, 0.04)`,
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 1px var(--color-accent), 0 0 0 4px var(--color-accent-subtle)`
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 1px ${WINE_HAIRLINE}, 0 1px 2px rgba(35, 31, 32, 0.04)`
          }}
        >
          {/* Textarea + mentions */}
          <div className="px-1.5 min-w-0">
            <AssetMention
              ref={mentionRef}
              value={message}
              onChange={setMessage}
              onFolderMention={setMentionedFolders}
              onFileMention={setMentionedFiles}
              onAssetFileMention={handleAssetFileMention}
              mentionedFolders={mentionedFolders}
              mentionedFiles={mentionedFiles}
              mentionedAssetFiles={activeCampaignId ? [] : mentionedAssetFiles}
              autoFocus={autoFocus}
              placeholder={selectedImages.length > 0
                ? 'Describe changes for the selected images…'
                : 'Ask Sage to create or refine…'
              }
            />
          </div>

          {/* Bottom row: @ trigger + aspect chips · ⌘↵ hint + send */}
          <div className="flex items-center gap-2 mt-1.5">
            {/* @ trigger button */}
            <button
              type="button"
              onClick={() => mentionRef.current?.openDropdown()}
              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:text-text-primary hover:bg-black/[0.04] transition-colors"
              title="Reference images, files, or assets"
            >
              <AtSign className="w-3.5 h-3.5" />
            </button>

            {/* Aspect ratio chips */}
            <div className="flex items-center gap-1">
              {ASPECT_RATIOS.map((ratio) => {
                const active = selectedAspectRatio === ratio
                return (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setSelectedAspectRatio(ratio)}
                    className="px-2 py-0.5 rounded-full text-[10px] tracking-tight transition-colors"
                    style={{
                      backgroundColor: active ? 'var(--color-accent)' : 'transparent',
                      color: active ? '#fff' : 'var(--color-text-muted)',
                      border: active ? '1px solid transparent' : `1px solid transparent`,
                    }}
                    onMouseEnter={(e) => {
                      if (active) return
                      e.currentTarget.style.color = 'var(--color-text-primary)'
                      e.currentTarget.style.backgroundColor = 'rgba(120, 40, 74, 0.06)'
                    }}
                    onMouseLeave={(e) => {
                      if (active) return
                      e.currentTarget.style.color = 'var(--color-text-muted)'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    {ratio}
                  </button>
                )
              })}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* ⌘↵ hint — hidden when nothing typed */}
            {hasContent && !isGenerating && (
              <span className="text-[10px] tracking-tight text-text-muted/70 hidden sm:inline">
                ⌘↵ to send
              </span>
            )}

            {/* Send / Stop button — wine pill */}
            {isGenerating ? (
              <button
                type="button"
                onClick={handleActionClick}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: '#231F20' }}
                title="Stop"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!hasContent || disabled}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                style={{
                  backgroundColor: hasContent ? 'var(--color-accent)' : 'rgba(120, 40, 74, 0.30)',
                  boxShadow: hasContent ? '0 1px 2px rgba(120, 40, 74, 0.20)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!hasContent || disabled) return
                  e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
                }}
                onMouseLeave={(e) => {
                  if (!hasContent || disabled) return
                  e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                }}
                title="Send"
              >
                <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
