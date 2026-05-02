import { useState, useRef } from 'react'
import { ArrowUp, Square, AtSign } from 'lucide-react'
import { AssetMention, type AssetMentionHandle } from '@/components/mentions/AssetMention'
import { ImageChip } from '@/components/chat/ImageChip'
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

export function ChatInput({ onSubmit, disabled, isGenerating, onCancel, autoFocus }: ChatInputProps) {
  const {
    selectedImageIds,
    toggleImageSelection,
    clearImageSelection,
    getSelectedImages,
    selectedAspectRatio,
    setSelectedAspectRatio,
  } = useStore()

  const mentionRef = useRef<AssetMentionHandle>(null)

  const [message, setMessage] = useState('')
  const [mentionedFolders, setMentionedFolders] = useState<AssetFolder[]>([])
  const [mentionedFiles, setMentionedFiles] = useState<CampaignFileType[]>([])
  const [mentionedAssetFiles, setMentionedAssetFiles] = useState<AssetFile[]>([])

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

    onSubmit({
      content: fullMessage,
      fileRefs: mentionedFiles.map(f => ({ fileType: f })),
      assetRefs: [...mentionedFolders.map(f => f.id), ...mentionedAssetFiles.map(f => f.id)],
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
              onAssetFileMention={setMentionedAssetFiles}
              mentionedFolders={mentionedFolders}
              mentionedFiles={mentionedFiles}
              mentionedAssetFiles={mentionedAssetFiles}
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
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-tight transition-colors"
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
              <span className="text-[10px] font-mono tracking-tight text-text-muted/70 hidden sm:inline">
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
