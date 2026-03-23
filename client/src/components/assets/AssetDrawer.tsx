import { useState, useEffect, useRef } from 'react'
import { AuthImage } from '@/components/AuthImage'
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
  XIcon,
  LayersIcon,
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
import { useSidebars } from '@/components/layout/AppLayout'
import { cn, formatCampaignName } from '@/lib/utils'
import { FileUpload } from './FileUpload'
import { AssetPreview, useAssetPreview } from './AssetPreview'

/** Map file type to a clean display label */
const FILE_TYPE_LABELS: Record<CampaignFileType, string> = {
  research: 'Research',
  hooks: 'Hooks',
  prompts: 'Prompts',
}

export function AssetDrawer() {
  const { previewFiles, previewIndex, isPreviewOpen, openPreview, closePreview, navigatePreview } = useAssetPreview()

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 min-h-0">
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
        files={previewFiles}
        currentIndex={previewIndex}
        isOpen={isPreviewOpen}
        onClose={closePreview}
        onNavigate={navigatePreview}
      />
    </div>
  )
}

// ============================================
// Campaigns Section
// ============================================

function CampaignsSection() {
  const { campaigns, activeCampaignId, isCreatingCampaign, setActiveCampaignId, setIsCreatingCampaign, setAppState } = useStore()
  const { setRightOpen, setMobileDrawerOpen } = useSidebars()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleCampaignClick = (campaignId: string) => {
    setActiveCampaignId(campaignId)
    setAppState('workspace')
  }

  const handleNewBrand = () => {
    // Clear any source campaign — this is a fresh brand
    const store = useStore.getState()
    store.setSourceCampaign(null)
    setIsCreatingCampaign(true)
    setIsCollapsed(false)
    if (isMobile) {
      setMobileDrawerOpen(true)
    } else {
      setRightOpen(true)
    }
  }

  const handleNewCampaignForBrand = (brandName: string) => {
    // Find the oldest campaign in this brand to use as research source
    const brandCampaigns = campaigns
      .filter(c => c.brand === brandName)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const source = brandCampaigns[0]
    if (!source) return

    const store = useStore.getState()
    store.setSourceCampaign(source.id, brandName)
    setIsCreatingCampaign(true)
    if (isMobile) {
      setMobileDrawerOpen(true)
    } else {
      setRightOpen(true)
    }
  }

  // Group campaigns by brand
  const brandGroups: { brand: string; campaigns: Campaign[] }[] = []
  const ungrouped: Campaign[] = []

  for (const c of campaigns) {
    if (c.brand) {
      const existing = brandGroups.find(g => g.brand === c.brand)
      if (existing) {
        existing.campaigns.push(c)
      } else {
        brandGroups.push({ brand: c.brand, campaigns: [c] })
      }
    } else {
      ungrouped.push(c)
    }
  }

  return (
    <div className="p-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1 text-xs font-medium text-text-muted uppercase tracking-wider hover:text-text-secondary transition-colors"
        >
          <ChevronRightIcon
            className={cn(
              'w-3 h-3 transition-transform duration-200',
              !isCollapsed && 'rotate-90'
            )}
          />
          Campaigns
          {isCollapsed && campaigns.length > 0 && (
            <span className="text-text-muted/60 normal-case tracking-normal font-normal">
              ({campaigns.length})
            </span>
          )}
        </button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleNewBrand}
          className="h-5 w-5 text-text-muted hover:text-text-primary"
          title="New brand"
        >
          <PlusIcon className="w-3 h-3" />
        </Button>
      </div>

      {/* Campaign List grouped by brand */}
      {!isCollapsed && (
        <div className="space-y-1">
          {/* New Campaign indicator */}
          {isCreatingCampaign && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent/10 text-accent">
              <SparklesIcon className="w-4 h-4" />
              <span className="text-sm font-medium">New Campaign</span>
            </div>
          )}

          {/* Brand groups */}
          {brandGroups.map((group) => (
            <BrandGroup
              key={group.brand}
              brand={group.brand}
              campaigns={group.campaigns}
              activeCampaignId={activeCampaignId}
              isCreatingCampaign={isCreatingCampaign}
              onCampaignSelect={handleCampaignClick}
              onNewCampaign={() => handleNewCampaignForBrand(group.brand)}
            />
          ))}

          {/* Ungrouped campaigns */}
          {ungrouped.length > 0 && (
            <BrandGroup
              brand="Ungrouped"
              campaigns={ungrouped}
              activeCampaignId={activeCampaignId}
              isCreatingCampaign={isCreatingCampaign}
              onCampaignSelect={handleCampaignClick}
              isUngrouped
            />
          )}

          {campaigns.length === 0 && !isCreatingCampaign && (
            <div className="text-center py-4 px-2">
              <SparklesIcon className="w-5 h-5 text-text-muted mx-auto mb-2" />
              <p className="text-xs text-text-muted">
                No campaigns yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// Brand Group (collapsible folder)
// ============================================

interface BrandGroupProps {
  brand: string
  campaigns: Campaign[]
  activeCampaignId: string | null
  isCreatingCampaign: boolean
  onCampaignSelect: (id: string) => void
  onNewCampaign?: () => void
  isUngrouped?: boolean
}

function BrandGroup({ brand, campaigns, activeCampaignId, isCreatingCampaign, onCampaignSelect, onNewCampaign, isUngrouped }: BrandGroupProps) {
  const { deleteCampaignAsync } = useStore()
  const hasActiveCampaign = campaigns.some(c => c.id === activeCampaignId && !isCreatingCampaign)
  const [isOpen, setIsOpen] = useState(hasActiveCampaign || campaigns.length <= 3)
  const [showActions, setShowActions] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(brand)

  // Auto-expand when a campaign in this brand becomes active
  useEffect(() => {
    if (hasActiveCampaign) setIsOpen(true)
  }, [hasActiveCampaign])

  const handleRenameBrand = () => {
    const newName = renameValue.trim()
    if (newName && newName !== brand) {
      // Update brand on all campaigns in this group
      const store = useStore.getState()
      for (const c of campaigns) {
        store.renameBrand(c.id, newName)
      }
    }
    setIsRenaming(false)
  }

  const handleDeleteBrand = () => {
    for (const c of campaigns) {
      deleteCampaignAsync(c.id)
    }
  }

  const totalImages = campaigns.reduce((sum, c) => sum + c.images.length, 0)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className="group relative flex items-center"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <CollapsibleTrigger asChild>
          <button className="shrink-0 w-7 h-7 flex items-center justify-center rounded hover:bg-bg-elevated">
            <ChevronRightIcon
              className={cn(
                'w-3.5 h-3.5 text-text-muted transition-transform duration-200',
                isOpen && 'rotate-90'
              )}
            />
          </button>
        </CollapsibleTrigger>

        {isRenaming ? (
          <div className="flex-1 flex items-center gap-1 min-w-0">
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameBrand()
                if (e.key === 'Escape') { setRenameValue(brand); setIsRenaming(false) }
              }}
              onBlur={handleRenameBrand}
              className="h-6 text-xs bg-bg-elevated flex-1"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 min-w-0 flex items-center gap-2 px-1.5 py-2 rounded-md text-sm hover:bg-bg-elevated transition-colors"
          >
            <LayersIcon className={cn('w-4 h-4 shrink-0', hasActiveCampaign ? 'text-accent' : 'text-text-muted')} />
            <span className={cn('flex-1 text-left truncate font-medium', hasActiveCampaign ? 'text-accent' : 'text-text-secondary')}>
              {brand}
            </span>
            {!showActions && totalImages > 0 && (
              <span className="text-[10px] text-text-muted">{totalImages} img</span>
            )}
          </button>
        )}

        {/* Brand actions */}
        {showActions && !isRenaming && !isUngrouped && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {onNewCampaign && (
              <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); onNewCampaign() }}
                className="h-5 w-5 text-text-muted hover:text-accent" title="New campaign for this brand">
                <PlusIcon className="w-3 h-3" />
              </Button>
            )}
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setRenameValue(brand); setIsRenaming(true) }}
              className="h-5 w-5 text-text-muted hover:text-text-primary" title="Rename brand">
              <PencilIcon className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); handleDeleteBrand() }}
              className="h-5 w-5 text-text-muted hover:text-error" title="Delete brand">
              <Trash2Icon className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      <CollapsibleContent>
        <div className="ml-3 pl-2 border-l border-border space-y-0.5 py-0.5">
          {campaigns.map((campaign) => (
            <CampaignItem
              key={campaign.id}
              campaign={campaign}
              isActive={activeCampaignId === campaign.id && !isCreatingCampaign}
              onSelect={() => onCampaignSelect(campaign.id)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface CampaignItemProps {
  campaign: Campaign
  isActive: boolean
  onSelect: () => void
}

function CampaignItem({ campaign, isActive, onSelect }: CampaignItemProps) {
  const { activeFileType, setActiveFileType, deleteCampaignAsync, renameCampaignAsync } = useStore()
  const [isOpen, setIsOpen] = useState(isActive)
  const [showActions, setShowActions] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renamingValue, setRenamingValue] = useState(campaign.name)
  const wasActive = useRef(isActive)

  // Auto-expand only when isActive transitions false → true (e.g. selected from elsewhere)
  useEffect(() => {
    if (isActive && !wasActive.current) {
      setIsOpen(true)
    }
    wasActive.current = isActive
  }, [isActive])

  const handleFileClick = (fileType: CampaignFileType) => {
    onSelect() // Make this campaign active
    setActiveFileType(fileType)
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleSelect = () => {
    if (isActive) {
      // Already active — toggle expand/collapse
      setIsOpen(!isOpen)
    } else {
      // Newly selected — select and expand
      onSelect()
      setIsOpen(true)
    }
  }

  const handleRenameSubmit = () => {
    if (renamingValue.trim() && renamingValue !== campaign.name) {
      renameCampaignAsync(campaign.id, renamingValue.trim())
    }
    setIsRenaming(false)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setRenamingValue(formatCampaignName(campaign.name))
      setIsRenaming(false)
    }
  }

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingValue(formatCampaignName(campaign.name))
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
            setRenamingValue(formatCampaignName(campaign.name))
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
        className="group relative flex items-center"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Chevron — independent click target, not nested in the row button */}
        <button
          onClick={handleToggle}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded hover:bg-bg-elevated"
        >
          <ChevronRightIcon
            className={cn(
              'w-3.5 h-3.5 text-text-muted transition-transform duration-200',
              isOpen && 'rotate-90'
            )}
          />
        </button>

        {/* Campaign name row */}
        <button
          onClick={handleSelect}
          onDoubleClick={startRename}
          className={cn(
            'flex-1 min-w-0 flex items-center gap-2 px-1.5 py-2 rounded-md text-sm transition-colors',
            'hover:bg-bg-elevated',
            isActive && 'bg-accent/10 text-accent'
          )}
        >
          <SparklesIcon className={cn(
            'w-4 h-4 shrink-0',
            isActive ? 'text-accent' : 'text-text-muted'
          )} />
          <span className={cn(
            'flex-1 text-left truncate',
            isActive ? 'text-accent font-medium' : 'text-text-secondary'
          )}>
            {formatCampaignName(campaign.name)}
          </span>
        </button>

        {/* Actions — rename + delete only */}
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
                deleteCampaignAsync(campaign.id)
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
                {FILE_TYPE_LABELS[file.type] ?? file.name}
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
  onPreviewFile: (file: AssetFile, allFiles: AssetFile[]) => void
}

function AssetsSection({ onPreviewFile }: AssetsSectionProps) {
  const {
    assetFolders,
    selectedFolderId,
    setSelectedFolderId,
    createFolderAsync,
    deleteFolderAsync
  } = useStore()
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolderAsync(newFolderName.trim())
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
            onDelete={() => deleteFolderAsync(folder.id)}
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
  onPreviewFile: (file: AssetFile, allFiles: AssetFile[]) => void
}

function FolderItem({ folder, isSelected, onSelect, onDelete, onPreviewFile }: FolderItemProps) {
  const { renameFolderAsync } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renamingValue, setRenamingValue] = useState(folder.name)

  const hasFiles = folder.files.length > 0

  const handleRenameSubmit = () => {
    if (renamingValue.trim() && renamingValue !== folder.name) {
      renameFolderAsync(folder.id, renamingValue.trim())
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
            <AssetFileItem key={file.id} file={file} onPreview={() => onPreviewFile(file, folder.files)} />
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
  const { deleteFileAsync } = useStore()
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
        <AuthImage
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
            deleteFileAsync(file.id)
          }}
          className="h-5 w-5 text-text-muted hover:text-error"
        >
          <Trash2Icon className="w-3 h-3" />
        </Button>
      )}
    </div>
  )
}
