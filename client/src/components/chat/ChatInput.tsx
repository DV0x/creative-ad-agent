import { useState } from 'react'
import { Send, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AssetMention } from '@/components/mentions/AssetMention'
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
}

export function ChatInput({ onSubmit, disabled, isGenerating, onCancel }: ChatInputProps) {
  const {
    selectedImageIds,
    toggleImageSelection,
    clearImageSelection,
    getSelectedImages,
  } = useStore()

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

  return (
    <div className="p-3 border-t border-border">
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Selected images chips */}
        {selectedImages.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
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

        {/* Message input with @ mentions */}
        <AssetMention
          value={message}
          onChange={setMessage}
          onFolderMention={setMentionedFolders}
          onFileMention={setMentionedFiles}
          onAssetFileMention={setMentionedAssetFiles}
          mentionedFolders={mentionedFolders}
          mentionedFiles={mentionedFiles}
          mentionedAssetFiles={mentionedAssetFiles}
          placeholder={selectedImages.length > 0
            ? "Describe changes for selected images..."
            : "Type a message..."
          }
        />

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          {isGenerating && onCancel && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onCancel}
            >
              <Square className="w-4 h-4" />
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!hasContent || disabled}
            variant="glow"
          >
            <Send className="w-4 h-4" />
            {selectedImages.length > 0 ? 'Regenerate' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  )
}
