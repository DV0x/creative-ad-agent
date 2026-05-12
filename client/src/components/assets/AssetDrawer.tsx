import { useState, useEffect, useRef } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
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
  PencilIcon,
  CheckIcon,
  XIcon,
  LayersIcon,
  SearchIcon,
  MoreHorizontalIcon,
  ZapIcon,
  WalletIcon,
  ReceiptIcon,
  HistoryIcon,
  LogOutIcon,
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
import { FileUpload } from '@/components/assets/FileUpload'
import { useSidebars } from '@/components/layout/AppLayout'
import { isDevMode } from '@/lib/auth'
import { paymentsApi } from '@/lib/api'
import { cn, formatCampaignName } from '@/lib/utils'
import { AssetPreview, useAssetPreview } from './AssetPreview'

/** Map file type to a clean display label */
const FILE_TYPE_LABELS: Record<CampaignFileType, string> = {
  research: 'Research',
  hooks: 'Hooks',
  prompts: 'Prompts',
}

export function AssetDrawer() {
  const { previewFiles, previewIndex, isPreviewOpen, openPreview, closePreview, navigatePreview } = useAssetPreview()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex flex-col h-full">
      {/* Primary CTA: New Campaign */}
      <NewCampaignButton />

      {/* Search */}
      <SidebarSearch value={searchQuery} onChange={setSearchQuery} />

      <ScrollArea className="flex-1 min-h-0 constrained-scroll-area">
        {/* Campaigns Section */}
        <CampaignsSection searchQuery={searchQuery} />

        {/* Soft divider */}
        <div className="mx-4 my-3 h-px bg-border-emphasis/40" />

        {/* Assets Section */}
        <AssetsSection onPreviewFile={openPreview} />
      </ScrollArea>

      {/* Footer: credits panel + account menu */}
      <SidebarFooter />

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

function CampaignsSection({ searchQuery = '' }: { searchQuery?: string }) {
  const { campaigns, activeCampaignId, isCreatingCampaign, setActiveCampaignId, setIsCreatingCampaign, setAppState } = useStore()
  const { setRightOpen, setMobileDrawerOpen } = useSidebars()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Search filter — match brand name OR formatted campaign name
  const matchesQuery = (campaign: Campaign) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    if (campaign.brand?.toLowerCase().includes(q)) return true
    if (formatCampaignName(campaign.name).toLowerCase().includes(q)) return true
    return false
  }

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

  // Group campaigns by brand (after applying search filter)
  const filtered = campaigns.filter(matchesQuery)
  const brandGroups: { brand: string; campaigns: Campaign[] }[] = []
  const ungrouped: Campaign[] = []

  for (const c of filtered) {
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
      {/* Section Header — eyebrow + mono count */}
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 text-[10px] font-semibold text-text-secondary uppercase tracking-[0.14em] hover:text-text-primary transition-colors"
        >
          <ChevronRightIcon
            className={cn(
              'w-2.5 h-2.5 transition-transform duration-200 text-text-muted',
              !isCollapsed && 'rotate-90'
            )}
          />
          Campaigns
          {filtered.length > 0 && (
            <span className="text-[10px] text-text-muted/70 normal-case tracking-normal font-normal">
              {filtered.length}
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
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent/8 text-accent">
              <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
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
              <ImageIcon className="w-5 h-5 text-text-muted mx-auto mb-2" />
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
      const store = useStore.getState()
      store.renameBrandAsync(campaigns.map(c => c.id), newName)
    }
    setIsRenaming(false)
  }

  const handleDeleteBrand = () => {
    for (const c of campaigns) {
      deleteCampaignAsync(c.id)
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className="group flex items-center min-w-0"
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
            {!showActions && (
              <span className="text-[10px] text-text-muted/70">{campaigns.length}</span>
            )}
          </button>
        )}

        {/* Brand actions */}
        {showActions && !isRenaming && !isUngrouped && (
          <div className="shrink-0 flex items-center gap-0.5 mr-1">
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
        <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
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
        className="group flex items-center min-w-0"
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
          <span className={cn(
            'w-2 h-2 rounded-full shrink-0',
            isActive ? 'bg-accent' : 'bg-text-muted/40'
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
          <div className="shrink-0 flex items-center gap-0.5 mr-1">
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
      {/* Section Header — eyebrow + mono count */}
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-text-secondary uppercase tracking-[0.14em]">
          <span>Library</span>
          {assetFolders.length > 0 && (
            <span className="text-[10px] text-text-muted/70 normal-case tracking-normal font-normal">
              {assetFolders.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setIsCreating(true)}
          className="h-5 w-5 text-text-muted hover:text-text-primary"
          title="New folder"
        >
          <PlusIcon className="w-3 h-3" />
        </Button>
      </div>

      {/* Upload trigger — opens the FileUpload dialog (drag-drop, multi-file). */}
      <div className="px-2 mb-2">
        <FileUpload />
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
        className="group flex items-center min-w-0"
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
              'flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
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
            {!showActions && hasFiles && (
              <span className="text-xs text-text-muted">
                {folder.files.length}
              </span>
            )}
          </button>
        </CollapsibleTrigger>

        {/* Actions */}
        {showActions && (
          <div className="shrink-0 flex items-center gap-0.5 mr-1">
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
      className="group flex items-center gap-2 px-2 py-1 rounded-md text-xs hover:bg-bg-elevated transition-colors cursor-pointer min-w-0"
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
      <span className="flex-1 truncate text-text-muted min-w-0">
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
          className="shrink-0 h-5 w-5 text-text-muted hover:text-error"
        >
          <Trash2Icon className="w-3 h-3" />
        </Button>
      )}
    </div>
  )
}

// ============================================
// Sidebar Chrome — New Campaign CTA, Search, Footer (credits + account)
// ============================================

function NewCampaignButton() {
  const { setIsCreatingCampaign } = useStore()
  const { setRightOpen, setMobileDrawerOpen } = useSidebars()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const handleClick = () => {
    useStore.getState().setSourceCampaign(null)
    setIsCreatingCampaign(true)
    if (isMobile) setMobileDrawerOpen(true)
    else setRightOpen(true)
  }

  // ⌘N keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault()
        handleClick()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="px-3 pt-3 pb-1.5">
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-start gap-2 px-3 py-2 rounded-md bg-accent text-white text-[13px] font-semibold hover:bg-accent-hover transition-colors"
      >
        <PlusIcon className="w-3.5 h-3.5" />
        <span>New campaign</span>
        <span className="ml-auto flex gap-0.5">
          <kbd className="text-[10px] bg-white/15 text-white/80 px-1 py-px rounded leading-tight">⌘</kbd>
          <kbd className="text-[10px] bg-white/15 text-white/80 px-1 py-px rounded leading-tight">N</kbd>
        </span>
      </button>
    </div>
  )
}

function SidebarSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  // ⌘K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="px-3 pb-2">
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-bg-raised-2 border border-border focus-within:border-accent/50 transition-colors">
        <SearchIcon className="w-3 h-3 text-text-muted shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search"
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-xs text-text-primary placeholder:text-text-muted"
        />
        <kbd className="text-[10px] bg-bg-raised border border-border px-1 py-px rounded text-text-muted leading-tight">⌘K</kbd>
      </div>
    </div>
  )
}

function SidebarAvatar({ initial, size = 30 }: { initial: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0 text-white"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-press))',
        fontSize: Math.round(size * 0.4),
        fontFamily: 'var(--font-display)',
        letterSpacing: '-0.02em',
      }}
    >
      {initial}
    </div>
  )
}

function SidebarFooter() {
  const subscription = useStore(s => s.subscription)
  const balance = useStore(s => s.creditBalance)
  const openTopupModal = useStore(s => s.openTopupModal)
  const openPricingModal = useStore(s => s.openPricingModal)
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  const clerkUser = isDevMode() ? null : useUser().user
  const firstName =
    clerkUser?.firstName ||
    clerkUser?.username ||
    clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'You'
  const initial = firstName[0]?.toUpperCase() || 'U'
  const fullName = clerkUser?.fullName || firstName
  const email = clerkUser?.primaryEmailAddress?.emailAddress || (isDevMode() ? 'dev@local' : '')

  const plan = subscription?.plan || 'free'
  const planLabel = plan === 'pro' ? 'Pro' : plan === 'starter' ? 'Starter' : 'Free'
  const isFree = plan === 'free'

  // Renewal date — only meaningful for paid plans (when plan portion refills).
  const renewDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null

  // Total credits = plan + topup combined. No cap, no fraction (per design discussion).
  const totalCredits = balance ?? 0
  const formattedCredits = totalCredits.toLocaleString(undefined, { maximumFractionDigits: 1 })

  return (
    <div
      // No bg shift — inherits sidebar bone. Wine-tinted hairline on top is the only seam.
      className="px-3 pt-3 pb-3 relative"
      style={{ boxShadow: 'inset 0 1px 0 rgba(120, 40, 74, 0.08)' }}
    >
      {/* Identity row — avatar, name, plan badge, ⋯ menu */}
      <div className="flex items-center gap-2.5 mb-2">
        <SidebarAvatar initial={initial} size={28} />
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-text-primary truncate leading-tight">{firstName}</span>
          {!isFree ? (
            <span
              className="inline-block px-1 py-px rounded font-bold text-[9px] uppercase tracking-wider leading-none shrink-0"
              style={{ background: 'var(--color-pop)', color: 'var(--color-pop-ink)' }}
            >
              {planLabel}
            </span>
          ) : (
            <span className="text-[10px] text-text-muted uppercase tracking-wider shrink-0">{planLabel}</span>
          )}
        </div>
        <button
          onClick={() => setShowAccountMenu(v => !v)}
          className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors"
          title="Account"
        >
          <MoreHorizontalIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Credits row — indented to align under the name (avatar 28 + gap 10 = 38) */}
      <div className="ml-[38px] flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-text-primary tabular-nums text-[14px]">
            {formattedCredits}
          </span>
          <span className="text-[11px] text-text-muted">credits</span>
        </div>
        <button
          onClick={() => isFree ? openPricingModal() : openTopupModal()}
          className="text-[11px] text-accent font-semibold hover:text-accent-hover transition-colors"
        >
          {isFree ? 'Upgrade →' : 'Top up →'}
        </button>
      </div>

      {/* Renews date — small, muted, mono. Plan only. */}
      {renewDate && !isFree && (
        <div className="ml-[38px] mt-1 text-[10px] text-text-muted">
          Renews {renewDate}
        </div>
      )}

      {showAccountMenu && (
        <SidebarAccountMenu
          fullName={fullName}
          email={email}
          isFree={isFree}
          onClose={() => setShowAccountMenu(false)}
        />
      )}
    </div>
  )
}

function SidebarAccountMenu({
  fullName, email, isFree, onClose,
}: { fullName: string; email: string; isFree: boolean; onClose: () => void }) {
  const planBalance = useStore(s => s.planBalance)
  const topupBalance = useStore(s => s.topupBalance)
  const subscription = useStore(s => s.subscription)
  const openPricingModal = useStore(s => s.openPricingModal)
  const openTopupModal = useStore(s => s.openTopupModal)
  const openUsageDrawer = useStore(s => s.openUsageDrawer)
  const ref = useRef<HTMLDivElement>(null)
  const clerk = isDevMode() ? null : useClerk()

  // Mirror the old UserMenu credits-breakdown logic.
  const hasBreakdown = planBalance !== null && topupBalance !== null
  const showPlanLine = hasBreakdown && planBalance! > 0
  const showTopupLine = hasBreakdown && topupBalance! > 0
  const showBreakdown = showPlanLine || showTopupLine

  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  // Close on outside click + Esc
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const handleManageBilling = async () => {
    try {
      const res = await paymentsApi.portal()
      window.open(res.portal_url, '_blank')
    } catch { /* ignore */ }
    onClose()
  }

  return (
    <div
      ref={ref}
      className="absolute right-3 bottom-[calc(100%-12px)] w-60 bg-bg-base border border-border rounded-lg shadow-xl z-50 overflow-hidden"
    >
      {/* Identity */}
      <div className="px-3.5 py-3 border-b border-border">
        <div className="text-[13px] font-bold text-text-primary truncate leading-tight">{fullName}</div>
        <div className="text-[11px] text-text-muted truncate mt-0.5">{email}</div>
      </div>

      {/* Credits breakdown — only when we have plan/topup data */}
      {showBreakdown && (
        <div className="px-3.5 py-2.5 border-b border-border">
          {showPlanLine && (
            <div className="mb-1.5 last:mb-0 flex items-baseline justify-between gap-2">
              <span className="text-xs text-text-primary font-medium tabular-nums">
                {Math.round(planBalance! * 10) / 10} plan
              </span>
              <span className="text-[10px] text-text-muted">
                {renewalDate ? `resets ${renewalDate}` : 'resets each cycle'}
              </span>
            </div>
          )}
          {showTopupLine && (
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-text-primary font-medium tabular-nums">
                {Math.round(topupBalance! * 10) / 10} top-up
              </span>
              <span className="text-[10px] text-text-muted">never expire</span>
            </div>
          )}
        </div>
      )}

      {/* Actions — mirror old UserMenu options */}
      <div className="py-1.5">
        <button
          onClick={() => { openPricingModal(); onClose() }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-bg-elevated text-left transition-colors"
        >
          <ZapIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <span className="text-text-primary">{isFree ? 'Upgrade Plan' : 'Change Plan'}</span>
        </button>
        <button
          onClick={() => { openTopupModal(); onClose() }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-bg-elevated text-left transition-colors"
        >
          <WalletIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <span className="text-text-primary">Buy Credits</span>
        </button>
        <button
          onClick={() => { openUsageDrawer(); onClose() }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-bg-elevated text-left transition-colors"
        >
          <HistoryIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <span className="text-text-primary">Usage</span>
        </button>
        {!isFree && (
          <button
            onClick={handleManageBilling}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-bg-elevated text-left transition-colors"
          >
            <ReceiptIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="text-text-primary">Manage Billing</span>
          </button>
        )}
      </div>

      {clerk && (
        <div className="border-t border-border py-1.5">
          <button
            onClick={() => clerk.signOut()}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-bg-elevated text-left text-text-secondary transition-colors"
          >
            <LogOutIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  )
}
