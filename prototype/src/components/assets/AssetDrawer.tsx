import { useState } from 'react'
import {
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  Trash2Icon,
  ImageIcon,
  FileIcon,
  FileTextIcon,
  ChevronRightIcon,
  SparklesIcon,
  PencilIcon,
  CheckIcon,
  XIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useStore, type AssetFolder, type AssetFile, type Campaign, type CampaignFileType } from '@/store'
import { cn } from '@/lib/utils'
import { FileUpload } from './FileUpload'
import { AssetPreview, useAssetPreview } from './AssetPreview'

export function AssetDrawer() {
  const { previewFile, isPreviewOpen, openPreview, closePreview } = useAssetPreview()

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        {/* Campaigns Section */}
        <CampaignsSection />

        {/* Divider */}
        <div className="mx-3 my-2 border-t border-border" />

        {/* Assets Section */}
        <AssetsSection onPreviewFile={openPreview} />
      </ScrollArea>

      {/* Upload button */}
      <div className="p-3 border-t border-border">
        <FileUpload />
      </div>

      {/* Asset Preview Modal */}
      <AssetPreview
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={closePreview}
      />
    </div>
  )
}

// ============================================
// Campaigns Section
// ============================================

function CampaignsSection() {
  const { campaigns, activeCampaignId, isCreatingCampaign, setActiveCampaignId, setIsCreatingCampaign, setAppState } = useStore()

  const handleCampaignClick = (campaignId: string) => {
    setActiveCampaignId(campaignId)
    setAppState('results')
  }

  const handleNewCampaign = () => {
    setIsCreatingCampaign(true)
    setAppState('empty')
  }

  return (
    <div className="p-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Campaigns
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleNewCampaign}
          className="h-5 w-5 text-text-muted hover:text-text-primary"
          title="New campaign"
        >
          <PlusIcon className="w-3 h-3" />
        </Button>
      </div>

      {/* Campaign List */}
      <div className="space-y-0.5">
        {/* New Campaign item (when creating) */}
        {isCreatingCampaign && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent/10 text-accent">
            <SparklesIcon className="w-4 h-4" />
            <span className="text-sm font-medium">New Campaign</span>
          </div>
        )}

        {campaigns.map((campaign) => (
          <CampaignItem
            key={campaign.id}
            campaign={campaign}
            isActive={activeCampaignId === campaign.id && !isCreatingCampaign}
            onSelect={() => handleCampaignClick(campaign.id)}
          />
        ))}

        {campaigns.length === 0 && !isCreatingCampaign && (
          <div className="text-center py-4 px-2">
            <SparklesIcon className="w-5 h-5 text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-muted">
              No campaigns yet
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

interface CampaignItemProps {
  campaign: Campaign
  isActive: boolean
  onSelect: () => void
}

function CampaignItem({ campaign, isActive, onSelect }: CampaignItemProps) {
  const { activeFileType, setActiveFileType, removeCampaign, renameCampaign } = useStore()
  const [isOpen, setIsOpen] = useState(isActive)
  const [showActions, setShowActions] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renamingValue, setRenamingValue] = useState(campaign.name)

  // Open when campaign becomes active
  if (isActive && !isOpen) {
    setIsOpen(true)
  }

  const handleFileClick = (fileType: CampaignFileType) => {
    onSelect() // Make this campaign active
    setActiveFileType(fileType)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const handleSelect = () => {
    onSelect()
    // Auto-expand when selecting
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleRenameSubmit = () => {
    if (renamingValue.trim() && renamingValue !== campaign.name) {
      renameCampaign(campaign.id, renamingValue.trim())
    }
    setIsRenaming(false)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setRenamingValue(campaign.name)
      setIsRenaming(false)
    }
  }

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingValue(campaign.name)
    setIsRenaming(true)
  }

  // Renaming mode
  if (isRenaming) {
    return (
      <div className="flex items-center gap-1 px-2 py-1">
        <SparklesIcon className="w-4 h-4 text-accent shrink-0" />
        <Input
          autoFocus
          value={renamingValue}
          onChange={(e) => setRenamingValue(e.target.value)}
          onKeyDown={handleRenameKeyDown}
          onBlur={handleRenameSubmit}
          className="h-6 text-xs bg-bg-elevated flex-1"
        />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleRenameSubmit}
          className="h-5 w-5 text-accent"
        >
          <CheckIcon className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            setRenamingValue(campaign.name)
            setIsRenaming(false)
          }}
          className="h-5 w-5 text-text-muted"
        >
          <XIcon className="w-3 h-3" />
        </Button>
      </div>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className="group relative"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <button
          onClick={handleSelect}
          onDoubleClick={startRename}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
            'hover:bg-bg-elevated',
            isActive && 'bg-accent/10 text-accent'
          )}
        >
          {/* Chevron toggle - separate click handler */}
          <span
            onClick={handleToggle}
            className="shrink-0 p-0.5 -m-0.5 rounded hover:bg-bg-elevated"
          >
            <ChevronRightIcon
              className={cn(
                'w-3 h-3 text-text-muted transition-transform duration-200',
                isOpen && 'rotate-90'
              )}
            />
          </span>
          <SparklesIcon className={cn(
            'w-4 h-4 shrink-0',
            isActive ? 'text-accent' : 'text-text-muted'
          )} />
          <span className={cn(
            'flex-1 text-left truncate',
            isActive ? 'text-accent font-medium' : 'text-text-secondary'
          )}>
            {campaign.name}
          </span>
          <span className="text-xs text-text-muted">
            {campaign.images.length}
          </span>
        </button>

        {/* Actions */}
        {showActions && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={startRename}
              className="h-5 w-5 text-text-muted hover:text-text-primary"
              title="Rename campaign"
            >
              <PencilIcon className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation()
                removeCampaign(campaign.id)
              }}
              className="h-5 w-5 text-text-muted hover:text-error"
              title="Delete campaign"
            >
              <Trash2Icon className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      <CollapsibleContent>
        <div className="ml-5 pl-2 border-l border-border space-y-0.5 py-1">
          {campaign.files.map((file) => (
            <button
              key={file.type}
              onClick={() => handleFileClick(file.type)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1 rounded-md text-xs transition-colors',
                'hover:bg-bg-elevated',
                isActive && activeFileType === file.type && 'bg-accent/10 text-accent'
              )}
            >
              <FileTextIcon className={cn(
                'w-3.5 h-3.5 shrink-0',
                isActive && activeFileType === file.type ? 'text-accent' : 'text-text-muted'
              )} />
              <span className={cn(
                'flex-1 text-left truncate',
                isActive && activeFileType === file.type ? 'text-accent' : 'text-text-muted'
              )}>
                {file.name}
              </span>
            </button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ============================================
// Assets Section
// ============================================

interface AssetsSectionProps {
  onPreviewFile: (file: AssetFile) => void
}

function AssetsSection({ onPreviewFile }: AssetsSectionProps) {
  const {
    assetFolders,
    selectedFolderId,
    setSelectedFolderId,
    addFolder,
    removeFolder
  } = useStore()
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim())
      setNewFolderName('')
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateFolder()
    } else if (e.key === 'Escape') {
      setIsCreating(false)
      setNewFolderName('')
    }
  }

  return (
    <div className="p-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Assets
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setIsCreating(true)}
          className="h-5 w-5 text-text-muted hover:text-text-primary"
        >
          <PlusIcon className="w-3 h-3" />
        </Button>
      </div>

      {/* Folder List */}
      <div className="space-y-0.5">
        {/* New folder input */}
        {isCreating && (
          <div className="flex items-center gap-2 px-2 py-1">
            <FolderIcon className="w-4 h-4 text-accent shrink-0" />
            <Input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newFolderName.trim()) {
                  setIsCreating(false)
                }
              }}
              placeholder="Folder name..."
              className="h-6 text-xs bg-bg-elevated"
            />
          </div>
        )}

        {/* Folders */}
        {assetFolders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            isSelected={selectedFolderId === folder.id}
            onSelect={() => setSelectedFolderId(
              selectedFolderId === folder.id ? null : folder.id
            )}
            onDelete={() => removeFolder(folder.id)}
            onPreviewFile={onPreviewFile}
          />
        ))}

        {/* Empty state */}
        {assetFolders.length === 0 && !isCreating && (
          <div className="text-center py-4 px-2">
            <FolderIcon className="w-5 h-5 text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-muted mb-2">
              No assets yet
            </p>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setIsCreating(true)}
              className="text-xs"
            >
              <PlusIcon className="w-3 h-3" />
              New Folder
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

interface FolderItemProps {
  folder: AssetFolder
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onPreviewFile: (file: AssetFile) => void
}

function FolderItem({ folder, isSelected, onSelect, onDelete, onPreviewFile }: FolderItemProps) {
  const { renameFolder } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renamingValue, setRenamingValue] = useState(folder.name)

  const hasFiles = folder.files.length > 0

  const handleRenameSubmit = () => {
    if (renamingValue.trim() && renamingValue !== folder.name) {
      renameFolder(folder.id, renamingValue.trim())
    }
    setIsRenaming(false)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setRenamingValue(folder.name)
      setIsRenaming(false)
    }
  }

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingValue(folder.name)
    setIsRenaming(true)
  }

  // Renaming mode
  if (isRenaming) {
    return (
      <div className="flex items-center gap-1 px-2 py-1">
        <FolderIcon className="w-4 h-4 text-accent shrink-0" />
        <Input
          autoFocus
          value={renamingValue}
          onChange={(e) => setRenamingValue(e.target.value)}
          onKeyDown={handleRenameKeyDown}
          onBlur={handleRenameSubmit}
          className="h-6 text-xs bg-bg-elevated flex-1"
        />
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleRenameSubmit}
          className="h-5 w-5 text-accent"
        >
          <CheckIcon className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            setRenamingValue(folder.name)
            setIsRenaming(false)
          }}
          className="h-5 w-5 text-text-muted"
        >
          <XIcon className="w-3 h-3" />
        </Button>
      </div>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className="group relative"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <CollapsibleTrigger asChild>
          <button
            onClick={() => {
              if (hasFiles) {
                setIsOpen(!isOpen)
              }
              onSelect()
            }}
            onDoubleClick={startRename}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
              'hover:bg-bg-elevated',
              isSelected && 'bg-bg-elevated text-text-primary'
            )}
          >
            {isOpen ? (
              <FolderOpenIcon className="w-4 h-4 text-accent shrink-0" />
            ) : (
              <FolderIcon className="w-4 h-4 text-text-muted shrink-0" />
            )}
            <span className="flex-1 text-left truncate text-text-secondary text-xs">
              {folder.name}
            </span>
            {hasFiles && (
              <span className="text-xs text-text-muted">
                {folder.files.length}
              </span>
            )}
          </button>
        </CollapsibleTrigger>

        {/* Actions */}
        {showActions && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={startRename}
              className="h-5 w-5 text-text-muted hover:text-text-primary"
              title="Rename folder"
            >
              <PencilIcon className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="h-5 w-5 text-text-muted hover:text-error"
              title="Delete folder"
            >
              <Trash2Icon className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      <CollapsibleContent>
        <div className="ml-4 pl-2 border-l border-border space-y-0.5 py-1">
          {folder.files.map((file) => (
            <AssetFileItem key={file.id} file={file} onPreview={() => onPreviewFile(file)} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface AssetFileItemProps {
  file: AssetFile
  onPreview: () => void
}

function AssetFileItem({ file, onPreview }: AssetFileItemProps) {
  const { removeFile } = useStore()
  const [showActions, setShowActions] = useState(false)

  const Icon = file.type === 'image' ? ImageIcon : FileIcon

  return (
    <div
      className="group relative flex items-center gap-2 px-2 py-1 rounded-md text-xs hover:bg-bg-elevated transition-colors cursor-pointer"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={onPreview}
    >
      {file.type === 'image' && file.url ? (
        <img
          src={file.url}
          alt={file.name}
          className="w-4 h-4 rounded object-cover shrink-0"
        />
      ) : (
        <Icon className="w-3.5 h-3.5 text-text-muted shrink-0" />
      )}
      <span className="flex-1 truncate text-text-muted">
        {file.name}
      </span>

      {showActions && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation()
            removeFile(file.id)
          }}
          className="h-5 w-5 text-text-muted hover:text-error"
        >
          <Trash2Icon className="w-3 h-3" />
        </Button>
      )}
    </div>
  )
}
