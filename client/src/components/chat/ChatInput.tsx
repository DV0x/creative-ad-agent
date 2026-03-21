import { useState, useRef } from 'react'
import { ArrowUp, Square, Paperclip } from 'lucide-react'
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

export function ChatInput({ onSubmit, disabled, isGenerating, onCancel, autoFocus }: ChatInputProps) {
  const {
    selectedImageIds,
    toggleImageSelection,
    clearImageSelection,
    getSelectedImages,
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

    // Build message content with mentioned items
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

    // Clear all inputs
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
    <div className="px-3 pb-3 pt-1">
      <form onSubmit={handleSubmit}>
        {/* Selected images chips */}
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

        {/* Input container */}
        <div className="relative flex items-end gap-2 rounded-xl border border-border bg-bg-elevated p-1.5 pl-2 transition-colors focus-within:border-border-emphasis">
          {/* Attach button */}
          <button
            type="button"
            onClick={() => mentionRef.current?.openDropdown()}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
            title="Attach reference image"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Message input with @ mentions */}
          <div className="flex-1 min-w-0">
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
                ? "Describe changes for selected images..."
                : "Type a message..."
              }
            />
          </div>

          {/* Send / Stop button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={handleActionClick}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-text-primary flex items-center justify-center transition-colors hover:bg-text-secondary"
            >
              <Square className="w-3.5 h-3.5 text-bg-base fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!hasContent || disabled}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-text-primary flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-text-secondary"
            >
              <ArrowUp className="w-4 h-4 text-bg-base" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
