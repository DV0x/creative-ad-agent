import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import { FolderIcon, XIcon, FileTextIcon, ImageIcon, FileIcon, LayoutGrid } from 'lucide-react'
import { AuthImage } from '@/components/AuthImage'
import { useStore, type AssetFolder, type AssetFile, type CampaignFileType, type GeneratedImage } from '@/store'
import { cn } from '@/lib/utils'
import { getHookLabel } from '@/types/chat'

export interface AssetMentionHandle {
  openDropdown: () => void
}

type MentionItemType = 'campaign-file' | 'asset-folder' | 'asset-file' | 'campaign-image'

interface MentionItem {
  id: string
  type: MentionItemType
  label: string
  description?: string
  icon: 'file-text' | 'folder' | 'image' | 'file' | 'grid'
  data: CampaignFileType | AssetFolder | AssetFile | GeneratedImage
}

const CAMPAIGN_FILE_ITEMS: { type: CampaignFileType; label: string; description: string }[] = [
  { type: 'research', label: 'research', description: 'Brand research & notes' },
  { type: 'hooks', label: 'hooks', description: 'Ad headlines & copy' },
  { type: 'prompts', label: 'prompts', description: 'Image generation prompts' },
]

interface AssetMentionProps {
  value: string
  onChange: (value: string) => void
  onFolderMention: (folders: AssetFolder[]) => void
  onFileMention: (files: CampaignFileType[]) => void
  onAssetFileMention: (files: AssetFile[]) => void
  mentionedFolders: AssetFolder[]
  mentionedFiles: CampaignFileType[]
  mentionedAssetFiles: AssetFile[]
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

const WINE_HAIRLINE = 'rgba(120, 40, 74, 0.16)'

export const AssetMention = forwardRef<AssetMentionHandle, AssetMentionProps>(function AssetMention({
  value,
  onChange,
  onFolderMention,
  onFileMention,
  onAssetFileMention,
  mentionedFolders,
  mentionedFiles,
  mentionedAssetFiles,
  placeholder = 'Type a message… use @ to reference',
  className,
  autoFocus,
}, ref) {
  const {
    assetFolders,
    getActiveCampaign,
    selectedImageIds,
    toggleImageSelection,
  } = useStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)

  const inputRef = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(ref, () => ({
    openDropdown: () => {
      setShowDropdown(true)
      setMentionQuery('')
      setMentionStartIndex(value.length)
      setSelectedIndex(0)
      inputRef.current?.focus()
    }
  }), [value])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  const activeCampaign = getActiveCampaign()

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  const getAllItems = useCallback((): MentionItem[] => {
    const items: MentionItem[] = []

    if (activeCampaign && activeCampaign.images.length > 0) {
      activeCampaign.images.forEach(image => {
        if (!selectedImageIds.includes(image.id)) {
          const hookLabel = image.hookType ? getHookLabel(image.hookType) : ''
          items.push({
            id: `image-${image.id}`,
            type: 'campaign-image',
            label: `image-${image.id}`,
            description: hookLabel || `Image ${image.id}`,
            icon: 'grid',
            data: image,
          })
        }
      })
    }

    if (activeCampaign) {
      CAMPAIGN_FILE_ITEMS.forEach(file => {
        if (!mentionedFiles.includes(file.type)) {
          items.push({
            id: `campaign-${file.type}`,
            type: 'campaign-file',
            label: file.label,
            description: file.description,
            icon: 'file-text',
            data: file.type,
          })
        }
      })
    }

    // Folders are not mentionable from the picker — selection is per-file only
    // (folder = container; users pick the individual asset they want to reference).
    assetFolders.forEach(folder => {
      folder.files.forEach(file => {
        if (!mentionedAssetFiles.some(f => f.id === file.id)) {
          items.push({
            id: `file-${file.id}`,
            type: 'asset-file',
            label: file.name,
            description: folder.name,
            icon: file.type === 'image' ? 'image' : 'file',
            data: file,
          })
        }
      })
    })

    return items
  }, [activeCampaign, assetFolders, mentionedFiles, mentionedFolders, mentionedAssetFiles, selectedImageIds])

  const getFilteredItems = useCallback((): MentionItem[] => {
    const allItems = getAllItems()
    if (!mentionQuery) return allItems

    const query = mentionQuery.toLowerCase()
    return allItems.filter(item =>
      item.label.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    )
  }, [getAllItems, mentionQuery])

  const filteredItems = getFilteredItems()

  useEffect(() => {
    const cursorPos = inputRef.current?.selectionStart ?? value.length

    let atIndex = -1
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (value[i] === '@') {
        atIndex = i
        break
      }
      if (value[i] === ' ') {
        break
      }
    }

    if (atIndex !== -1) {
      const query = value.substring(atIndex + 1, cursorPos)
      if (!query.includes(' ')) {
        setShowDropdown(true)
        setMentionQuery(query)
        setMentionStartIndex(atIndex)
        setSelectedIndex(0)
        return
      }
    }

    setShowDropdown(false)
    setMentionQuery('')
    setMentionStartIndex(-1)
  }, [value])

  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredItems.length])

  useEffect(() => {
    if (showDropdown && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [selectedIndex, showDropdown])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectItem = (item: MentionItem) => {
    const beforeMention = value.substring(0, mentionStartIndex)
    const afterMention = value.substring(mentionStartIndex + 1 + mentionQuery.length)
    onChange(beforeMention + afterMention)

    if (item.type === 'campaign-file') {
      onFileMention([...mentionedFiles, item.data as CampaignFileType])
    } else if (item.type === 'asset-folder') {
      onFolderMention([...mentionedFolders, item.data as AssetFolder])
    } else if (item.type === 'asset-file') {
      onAssetFileMention([...mentionedAssetFiles, item.data as AssetFile])
    } else if (item.type === 'campaign-image') {
      const image = item.data as GeneratedImage
      toggleImageSelection(image.id)
    }

    setShowDropdown(false)
    setMentionQuery('')
    setMentionStartIndex(-1)

    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showDropdown && filteredItems.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => prev < filteredItems.length - 1 ? prev + 1 : 0)
          return
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : filteredItems.length - 1)
          return
        case 'Enter':
          e.preventDefault()
          if (filteredItems[selectedIndex]) {
            handleSelectItem(filteredItems[selectedIndex])
          }
          return
        case 'Escape':
          e.preventDefault()
          setShowDropdown(false)
          return
        case 'Tab':
          if (filteredItems[selectedIndex]) {
            e.preventDefault()
            handleSelectItem(filteredItems[selectedIndex])
          }
          return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      inputRef.current?.form?.requestSubmit()
    }
  }

  const handleRemoveFolderMention = (folderId: string) => {
    onFolderMention(mentionedFolders.filter(f => f.id !== folderId))
  }

  const handleRemoveFileMention = (fileType: CampaignFileType) => {
    onFileMention(mentionedFiles.filter(f => f !== fileType))
  }

  const handleRemoveAssetFileMention = (fileId: string) => {
    onAssetFileMention(mentionedAssetFiles.filter(f => f.id !== fileId))
  }

  const getThumbnailUrl = (item: MentionItem): string | undefined => {
    if (item.type === 'asset-file') {
      const file = item.data as AssetFile
      if (file.type === 'image') return file.thumbnailUrl ?? file.url
    }
    if (item.type === 'campaign-image') {
      const image = item.data as GeneratedImage
      return image.url
    }
    return undefined
  }

  const getIcon = (icon: MentionItem['icon'], className?: string) => {
    switch (icon) {
      case 'file-text': return <FileTextIcon className={className} />
      case 'folder': return <FolderIcon className={className} />
      case 'image': return <ImageIcon className={className} />
      case 'file': return <FileIcon className={className} />
      case 'grid': return <LayoutGrid className={className} />
    }
  }

  const hasMentions = mentionedFolders.length > 0 || mentionedFiles.length > 0 || mentionedAssetFiles.length > 0

  return (
    <div className={cn('relative', className)}>
      {/* Mentioned items — editorial pill chips */}
      {hasMentions && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {mentionedFiles.map(fileType => {
            const fileInfo = CAMPAIGN_FILE_ITEMS.find(f => f.type === fileType)
            return (
              <RefChip
                key={fileType}
                icon={<FileTextIcon className="w-3 h-3" />}
                label={`@${fileInfo?.label || fileType}`}
                onRemove={() => handleRemoveFileMention(fileType)}
              />
            )
          })}
          {mentionedFolders.map(folder => (
            <RefChip
              key={folder.id}
              icon={<FolderIcon className="w-3 h-3" />}
              label={`@${folder.name}`}
              onRemove={() => handleRemoveFolderMention(folder.id)}
            />
          ))}
          {mentionedAssetFiles.map(file => (
            <RefChip
              key={file.id}
              icon={file.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <FileIcon className="w-3 h-3" />}
              label={`@${file.name}`}
              onRemove={() => handleRemoveAssetFileMention(file.id)}
            />
          ))}
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          const el = e.target
          el.style.height = 'auto'
          el.style.height = Math.min(el.scrollHeight, 160) + 'px'
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="w-full py-1.5 bg-transparent border-none text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none resize-none"
        style={{ outline: 'none', boxShadow: 'none' }}
      />

      {/* Dropdown */}
      {showDropdown && filteredItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-2 left-0 w-full max-w-md z-50 rounded-xl overflow-hidden animate-fadeIn"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            boxShadow: `0 0 0 1px ${WINE_HAIRLINE}, 0 12px 32px rgba(35, 31, 32, 0.10), 0 2px 6px rgba(35, 31, 32, 0.06)`,
          }}
        >
          {/* Header eyebrow */}
          <div
            className="px-3 py-2"
            style={{ borderBottom: `1px solid ${WINE_HAIRLINE}` }}
          >
            <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
              {mentionQuery ? `Filter · ${mentionQuery}` : 'Reference'}
            </span>
          </div>

          {/* Items */}
          <div className="max-h-80 overflow-y-auto overscroll-contain py-1">
            {filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex
              const thumbnailUrl = getThumbnailUrl(item)
              return (
                <div
                  key={item.id}
                  ref={el => { itemRefs.current[index] = el }}
                  onClick={() => handleSelectItem(item)}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'var(--color-bg-raised-2)' : 'transparent',
                  }}
                >
                  {thumbnailUrl ? (
                    <div
                      className={cn(
                        'shrink-0 w-12 h-12 rounded-md overflow-hidden bg-bg-elevated',
                        isSelected && 'ring-1 ring-accent/40',
                      )}
                    >
                      <AuthImage
                        src={thumbnailUrl}
                        alt={item.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'shrink-0 w-12 h-12 rounded-md bg-bg-elevated flex items-center justify-center',
                        isSelected ? 'text-accent' : 'text-text-muted',
                      )}
                    >
                      {getIcon(item.icon, 'w-5 h-5')}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      @{item.label}
                    </div>
                    {item.description && (
                      <div className="text-[11px] text-text-muted truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-[11px] tracking-tight text-text-muted shrink-0">
                      ↵
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer hint */}
          <div
            className="px-3 py-1.5"
            style={{ borderTop: `1px solid ${WINE_HAIRLINE}`, backgroundColor: 'var(--color-bg-raised-2)' }}
          >
            <span className="text-[10px] tracking-tight text-text-muted">
              ↑↓ navigate · ↵ select · esc close
            </span>
          </div>
        </div>
      )}

      {/* No results */}
      {showDropdown && filteredItems.length === 0 && mentionQuery && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-2 left-0 w-full max-w-md z-50 rounded-xl overflow-hidden animate-fadeIn"
          style={{
            backgroundColor: 'var(--color-bg-base)',
            boxShadow: `0 0 0 1px ${WINE_HAIRLINE}, 0 12px 32px rgba(35, 31, 32, 0.10)`,
          }}
        >
          <div className="px-3 py-4 text-center text-sm text-text-muted">
            No matches for <span>"{mentionQuery}"</span>
          </div>
        </div>
      )}
    </div>
  )
})

/**
 * Editorial reference chip — matches the chip vocabulary used across the workspace.
 * Cream surface, wine hairline, mono label.
 */
function RefChip({ icon, label, onRemove }: { icon: React.ReactNode; label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded-full text-[11px] tracking-tight text-text-primary"
      style={{
        backgroundColor: 'var(--color-bg-base)',
        border: `1px solid ${WINE_HAIRLINE}`,
      }}
    >
      <span className="text-text-muted">{icon}</span>
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 p-0.5 rounded-full text-text-muted hover:text-text-primary hover:bg-black/[0.06] transition-colors duration-150"
        aria-label={`Remove ${label}`}
      >
        <XIcon className="w-3 h-3" />
      </button>
    </span>
  )
}
