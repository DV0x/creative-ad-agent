import { useState, useEffect, useRef, useCallback } from 'react'
import { FolderIcon, XIcon, FileTextIcon, ImageIcon, FileIcon } from 'lucide-react'
import { useStore, type AssetFolder, type AssetFile, type CampaignFileType } from '@/store'
import { cn } from '@/lib/utils'

// Types for mention items
type MentionItemType = 'campaign-file' | 'asset-folder' | 'asset-file'

interface MentionItem {
  id: string
  type: MentionItemType
  label: string
  description?: string
  icon: 'file-text' | 'folder' | 'image' | 'file'
  data: CampaignFileType | AssetFolder | AssetFile
}

// Campaign file options
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
}

export function AssetMention({
  value,
  onChange,
  onFolderMention,
  onFileMention,
  onAssetFileMention,
  mentionedFolders,
  mentionedFiles,
  mentionedAssetFiles,
  placeholder = 'Type a message... Use @ to mention files',
  className
}: AssetMentionProps) {
  const { assetFolders, getActiveCampaign } = useStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  const activeCampaign = getActiveCampaign()

  // Build list of all mentionable items
  const getAllItems = useCallback((): MentionItem[] => {
    const items: MentionItem[] = []

    // Campaign files (only if there's an active campaign)
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

    // Asset folders
    assetFolders.forEach(folder => {
      if (!mentionedFolders.some(f => f.id === folder.id)) {
        items.push({
          id: `folder-${folder.id}`,
          type: 'asset-folder',
          label: folder.name,
          description: `${folder.files.length} files`,
          icon: 'folder',
          data: folder,
        })

        // Individual files in each folder
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
      }
    })

    return items
  }, [activeCampaign, assetFolders, mentionedFiles, mentionedFolders, mentionedAssetFiles])

  // Filter items based on query
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

  // Detect @ mentions in input
  useEffect(() => {
    const cursorPos = inputRef.current?.selectionStart ?? value.length

    // Find the last @ before cursor that isn't followed by a space before cursor
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
      // Don't show dropdown if there's a space in the query (mention completed)
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

  // Reset selected index when filtered items change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredItems.length])

  // Scroll selected item into view
  useEffect(() => {
    if (showDropdown && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [selectedIndex, showDropdown])

  // Handle click outside to close
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

  // Handle item selection
  const handleSelectItem = (item: MentionItem) => {
    // Replace @query with empty (the mention is stored separately)
    const beforeMention = value.substring(0, mentionStartIndex)
    const afterMention = value.substring(mentionStartIndex + 1 + mentionQuery.length)
    onChange(beforeMention + afterMention)

    // Add to appropriate mention list
    if (item.type === 'campaign-file') {
      onFileMention([...mentionedFiles, item.data as CampaignFileType])
    } else if (item.type === 'asset-folder') {
      onFolderMention([...mentionedFolders, item.data as AssetFolder])
    } else if (item.type === 'asset-file') {
      onAssetFileMention([...mentionedAssetFiles, item.data as AssetFile])
    }

    setShowDropdown(false)
    setMentionQuery('')
    setMentionStartIndex(-1)

    // Keep focus on input
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredItems.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (filteredItems[selectedIndex]) {
          handleSelectItem(filteredItems[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowDropdown(false)
        break
      case 'Tab':
        if (filteredItems[selectedIndex]) {
          e.preventDefault()
          handleSelectItem(filteredItems[selectedIndex])
        }
        break
    }
  }

  // Remove mentions
  const handleRemoveFolderMention = (folderId: string) => {
    onFolderMention(mentionedFolders.filter(f => f.id !== folderId))
  }

  const handleRemoveFileMention = (fileType: CampaignFileType) => {
    onFileMention(mentionedFiles.filter(f => f !== fileType))
  }

  const handleRemoveAssetFileMention = (fileId: string) => {
    onAssetFileMention(mentionedAssetFiles.filter(f => f.id !== fileId))
  }

  // Get icon component
  const getIcon = (icon: MentionItem['icon'], className?: string) => {
    switch (icon) {
      case 'file-text':
        return <FileTextIcon className={className} />
      case 'folder':
        return <FolderIcon className={className} />
      case 'image':
        return <ImageIcon className={className} />
      case 'file':
        return <FileIcon className={className} />
    }
  }

  const hasMentions = mentionedFolders.length > 0 || mentionedFiles.length > 0 || mentionedAssetFiles.length > 0

  return (
    <div className={cn('relative', className)}>
      {/* Mentioned items tags */}
      {hasMentions && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {/* Campaign file tags */}
          {mentionedFiles.map(fileType => {
            const fileInfo = CAMPAIGN_FILE_ITEMS.find(f => f.type === fileType)
            return (
              <span
                key={fileType}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent/20 text-accent rounded-md border border-accent/30"
              >
                <FileTextIcon className="w-3 h-3" />
                @{fileInfo?.label || fileType}
                <button
                  type="button"
                  onClick={() => handleRemoveFileMention(fileType)}
                  className="hover:bg-accent/30 rounded-sm p-0.5 -mr-0.5"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            )
          })}
          {/* Folder tags */}
          {mentionedFolders.map(folder => (
            <span
              key={folder.id}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent/20 text-accent rounded-md border border-accent/30"
            >
              <FolderIcon className="w-3 h-3" />
              @{folder.name}
              <button
                type="button"
                onClick={() => handleRemoveFolderMention(folder.id)}
                className="hover:bg-accent/30 rounded-sm p-0.5 -mr-0.5"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
          {/* Asset file tags */}
          {mentionedAssetFiles.map(file => (
            <span
              key={file.id}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent/20 text-accent rounded-md border border-accent/30"
            >
              {file.type === 'image' ? (
                <ImageIcon className="w-3 h-3" />
              ) : (
                <FileIcon className="w-3 h-3" />
              )}
              @{file.name}
              <button
                type="button"
                onClick={() => handleRemoveAssetFileMention(file.id)}
                className="hover:bg-accent/30 rounded-sm p-0.5 -mr-0.5"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/25"
      />

      {/* Dropdown */}
      {showDropdown && filteredItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-1 left-0 w-full max-w-sm z-50 bg-bg-raised border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-border bg-bg-elevated/50">
            <span className="text-xs text-text-muted">
              {mentionQuery ? `Searching for "${mentionQuery}"` : 'Reference files'}
            </span>
          </div>

          {/* Items list */}
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                ref={el => { itemRefs.current[index] = el }}
                onClick={() => handleSelectItem(item)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
                  index === selectedIndex
                    ? 'bg-accent/10 text-accent'
                    : 'hover:bg-bg-elevated text-text-secondary'
                )}
              >
                <div className={cn(
                  'shrink-0',
                  index === selectedIndex ? 'text-accent' : 'text-text-muted'
                )}>
                  {getIcon(item.icon, 'w-4 h-4')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    @{item.label}
                  </div>
                  {item.description && (
                    <div className="text-xs text-text-muted truncate">
                      {item.description}
                    </div>
                  )}
                </div>
                {index === selectedIndex && (
                  <span className="text-xs text-text-muted shrink-0">
                    ↵
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-3 py-1.5 border-t border-border bg-bg-elevated/50">
            <span className="text-[10px] text-text-muted">
              ↑↓ navigate · ↵ select · esc close
            </span>
          </div>
        </div>
      )}

      {/* No results */}
      {showDropdown && filteredItems.length === 0 && mentionQuery && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-1 left-0 w-full max-w-sm z-50 bg-bg-raised border border-border rounded-lg shadow-lg overflow-hidden"
        >
          <div className="px-3 py-4 text-center text-sm text-text-muted">
            No files matching "{mentionQuery}"
          </div>
        </div>
      )}
    </div>
  )
}
