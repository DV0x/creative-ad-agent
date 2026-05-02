import * as React from 'react'
import { PanelLeftIcon, PanelRightIcon, FolderIcon, MessageCircleIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  TooltipProvider,
} from '@/components/ui/tooltip'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { AssetDrawer } from '@/components/assets/AssetDrawer'
import { MobileAssetsDrawer } from '@/components/assets/MobileAssetsDrawer'
import { MobileChatDrawer } from '@/components/chat/MobileChatDrawer'
import { FileEditorPanel } from '@/components/editor/FileEditor'
import { useIsMobile } from '@/hooks/use-mobile'
import { useStore } from '@/store'

// Sidebar dimensions
const SIDEBAR_MIN_WIDTH = 200
const SIDEBAR_MAX_WIDTH = 480
const SIDEBAR_DEFAULT_WIDTH = 256 // 16rem
const RIGHT_SIDEBAR_DEFAULT_WIDTH = 480 // max width — chat open wide by default
const SIDEBAR_COLLAPSED_WIDTH = 48 // 3rem
const EDITOR_MIN_WIDTH = 300
const EDITOR_MAX_WIDTH = 600
const EDITOR_DEFAULT_WIDTH = 400

// LocalStorage keys
const STORAGE_KEY_LEFT_WIDTH = 'sidebar-left-width'
const STORAGE_KEY_RIGHT_WIDTH = 'sidebar-right-width'
const STORAGE_KEY_EDITOR_WIDTH = 'editor-panel-width'

interface SidebarState {
  leftOpen: boolean
  rightOpen: boolean
  leftWidth: number
  rightWidth: number
  mobileDrawerOpen: boolean
  mobileAssetsOpen: boolean
  toggleLeft: () => void
  toggleRight: () => void
  setRightOpen: (open: boolean) => void
  setMobileDrawerOpen: (open: boolean) => void
  setMobileAssetsOpen: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarState | null>(null)

export function useSidebars() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebars must be used within AppLayout')
  }
  return context
}

// Load saved width from localStorage
function loadSavedWidth(key: string, defaultWidth: number, minWidth: number, maxWidth: number): number {
  if (typeof window === 'undefined') return defaultWidth
  const saved = localStorage.getItem(key)
  if (saved) {
    const width = parseInt(saved, 10)
    if (!isNaN(width) && width >= minWidth && width <= maxWidth) {
      return width
    }
  }
  return defaultWidth
}

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [leftOpen, setLeftOpen] = React.useState(false)
  const [rightOpen, setRightOpen] = React.useState(false)
  const [leftWidth, setLeftWidth] = React.useState(() => loadSavedWidth(STORAGE_KEY_LEFT_WIDTH, SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH))
  const [rightWidth, setRightWidth] = React.useState(() => loadSavedWidth(STORAGE_KEY_RIGHT_WIDTH, RIGHT_SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH))
  const [editorWidth, setEditorWidth] = React.useState(() => loadSavedWidth(STORAGE_KEY_EDITOR_WIDTH, EDITOR_DEFAULT_WIDTH, EDITOR_MIN_WIDTH, EDITOR_MAX_WIDTH))
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false)
  const [mobileAssetsOpen, setMobileAssetsOpen] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState<'left' | 'right' | 'editor' | null>(null)
  const isMobile = useIsMobile()

  // Get state from store
  const activeFileType = useStore(state => state.activeFileType)
  const appState = useStore(state => state.appState)
  const generatingCampaignId = useStore(state => state.generatingCampaignId)
  const campaignsCount = useStore(state => state.campaigns.length)
  const isEditorOpen = activeFileType !== null

  // Show workspace (sidebars) when in workspace mode
  const isWorkspace = appState === 'workspace'

  // Auto-open chat drawer when entering workspace with active generation
  React.useEffect(() => {
    if (isWorkspace && generatingCampaignId) {
      if (isMobile) {
        setMobileDrawerOpen(true)
      } else {
        setRightOpen(true)
      }
    }
  }, [isWorkspace, generatingCampaignId, isMobile])

  // Auto-open chat sidebar for first-time paying users (workspace + zero campaigns).
  // Desktop only — mobile drawer would block the empty-state input.
  React.useEffect(() => {
    if (isWorkspace && campaignsCount === 0 && !isMobile) {
      setRightOpen(true)
    }
  }, [isWorkspace, campaignsCount, isMobile])

  const toggleLeft = React.useCallback(() => {
    if (isMobile) {
      setMobileAssetsOpen(prev => !prev)
    } else {
      setLeftOpen(prev => !prev)
    }
  }, [isMobile])
  const toggleRight = React.useCallback(() => {
    if (isMobile) {
      setMobileDrawerOpen(prev => !prev)
    } else {
      setRightOpen(prev => !prev)
    }
  }, [isMobile])

  // Handle resize drag
  const handleResizeStart = React.useCallback((side: 'left' | 'right' | 'editor') => {
    setIsResizing(side)
  }, [])

  React.useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing === 'left') {
        const newWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, e.clientX))
        setLeftWidth(newWidth)
      } else if (isResizing === 'right') {
        const newWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, window.innerWidth - e.clientX))
        setRightWidth(newWidth)
      } else if (isResizing === 'editor') {
        // Editor resizes from its left edge
        // Calculate based on distance from right side of window
        const rightSidebarWidth = rightOpen ? rightWidth : SIDEBAR_COLLAPSED_WIDTH
        const editorRightEdge = window.innerWidth - rightSidebarWidth
        const newWidth = Math.min(EDITOR_MAX_WIDTH, Math.max(EDITOR_MIN_WIDTH, editorRightEdge - e.clientX))
        setEditorWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      // Save to localStorage
      if (isResizing === 'left') {
        localStorage.setItem(STORAGE_KEY_LEFT_WIDTH, String(leftWidth))
      } else if (isResizing === 'right') {
        localStorage.setItem(STORAGE_KEY_RIGHT_WIDTH, String(rightWidth))
      } else if (isResizing === 'editor') {
        localStorage.setItem(STORAGE_KEY_EDITOR_WIDTH, String(editorWidth))
      }
      setIsResizing(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    // Prevent text selection while dragging
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizing, leftWidth, rightWidth, editorWidth, rightOpen])

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '[') {
          e.preventDefault()
          toggleLeft()
        } else if (e.key === ']') {
          e.preventDefault()
          toggleRight()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleLeft, toggleRight])

  const contextValue = React.useMemo(
    () => ({ leftOpen, rightOpen, leftWidth, rightWidth, mobileDrawerOpen, mobileAssetsOpen, toggleLeft, toggleRight, setRightOpen, setMobileDrawerOpen, setMobileAssetsOpen }),
    [leftOpen, rightOpen, leftWidth, rightWidth, mobileDrawerOpen, mobileAssetsOpen, toggleLeft, toggleRight]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div className={cn(
          'flex h-screen w-full overflow-hidden',
          isWorkspace && 'bg-bg-raised md:p-2 md:gap-2'
        )}>
          {/* Left Sidebar - Assets (only in workspace) */}
          {isWorkspace && (
            <LeftSidebar
              open={leftOpen}
              width={leftWidth}
              onToggle={toggleLeft}
              onResizeStart={() => handleResizeStart('left')}
              isResizing={isResizing === 'left'}
            />
          )}

          {/* Main Content — floating canvas card on workspace */}
          <main
            className={cn(
              'flex-1 flex flex-col min-w-0 bg-bg-base',
              isWorkspace && 'md:rounded-xl md:overflow-hidden'
            )}
            style={isWorkspace ? {
              boxShadow: '0 0 0 1px rgba(120, 40, 74, 0.06), 0 1px 2px rgba(120, 40, 74, 0.06)',
            } : undefined}
          >
            {children}
          </main>

          {/* File Editor Panel (when a file is selected) */}
          {isWorkspace && isEditorOpen && (
            <FileEditorPanel
              width={editorWidth}
              onResizeStart={() => handleResizeStart('editor')}
              isResizing={isResizing === 'editor'}
            />
          )}

          {/* Right Sidebar - Chat (only in workspace, desktop only) */}
          {isWorkspace && (
            <RightSidebar
              open={rightOpen}
              width={rightWidth}
              onToggle={toggleRight}
              onResizeStart={() => handleResizeStart('right')}
              isResizing={isResizing === 'right'}
            />
          )}
        </div>

        {/* Mobile Chat Drawer (only in workspace) */}
        {isWorkspace && (
          <MobileChatDrawer
            open={mobileDrawerOpen}
            onOpenChange={setMobileDrawerOpen}
          />
        )}

        {/* Mobile Assets Drawer (only in workspace) */}
        {isWorkspace && (
          <MobileAssetsDrawer
            open={mobileAssetsOpen}
            onOpenChange={setMobileAssetsOpen}
          />
        )}
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

interface SidebarProps {
  open: boolean
  width: number
  onToggle: () => void
  onResizeStart: () => void
  isResizing: boolean
}

function LeftSidebar({ open, width, onToggle, onResizeStart, isResizing }: SidebarProps) {
  return (
    <aside
      data-state={open ? 'expanded' : 'collapsed'}
      className={cn(
        'hidden md:flex flex-col bg-bg-raised relative overflow-hidden md:rounded-xl',
        !isResizing && 'transition-[width] duration-200 ease-out'
      )}
      style={{ width: open ? `${width}px` : `${SIDEBAR_COLLAPSED_WIDTH}px` }}
    >
      {/* Header — wordmark + toggle. No border-b: spacing alone separates from content (S86 soft-pass). */}
      <div className={cn(
        'h-13 flex items-center px-3 pt-3',
        open ? 'justify-between' : 'justify-center'
      )}>
        {open && (
          <span className="text-base tracking-tight">
            <span className="font-normal text-accent">Creative</span>
            <span className="font-bold text-text-primary ml-1">Machines</span>
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7 text-text-muted hover:text-text-primary"
        >
          <PanelLeftIcon className="h-4 w-4" />
          <span className="sr-only">Toggle assets panel</span>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {open ? (
          <AssetDrawer />
        ) : (
          <div className="flex flex-col items-center gap-2 pt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 text-text-muted hover:text-text-primary"
            >
              <FolderIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Resize handle */}
      {open && <ResizeHandle side="left" onResizeStart={onResizeStart} />}
    </aside>
  )
}

function RightSidebar({ open, width, onToggle, onResizeStart, isResizing }: SidebarProps) {
  return (
    <aside
      data-state={open ? 'expanded' : 'collapsed'}
      className={cn(
        'hidden md:flex flex-col bg-bg-raised-2 relative overflow-hidden md:rounded-xl',
        !isResizing && 'transition-[width] duration-200 ease-out'
      )}
      style={{ width: open ? `${width}px` : `${SIDEBAR_COLLAPSED_WIDTH}px` }}
    >
      {/* Header — toggle + Chat label. UserMenu moved to LeftSidebar footer (Phase 2 sidebar redesign).
          Phase 4 will replace this header with the Sage agent identity strip. */}
      <div className={cn(
        'h-13 flex items-center px-3 pt-3',
        open ? 'justify-between' : 'justify-center'
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7 text-text-muted hover:text-text-primary"
        >
          <PanelRightIcon className="h-4 w-4" />
          <span className="sr-only">Toggle chat panel</span>
        </Button>
        {open && (
          <span className="text-sm font-medium text-text-secondary">Chat</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
        {open ? (
          <ChatSidebar />
        ) : (
          <div className="flex flex-col items-center gap-2 pt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 text-text-muted hover:text-text-primary"
            >
              <MessageCircleIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Resize handle */}
      {open && <ResizeHandle side="right" onResizeStart={onResizeStart} />}
    </aside>
  )
}

interface ResizeHandleProps {
  side: 'left' | 'right'
  onResizeStart: () => void
}

function ResizeHandle({ side, onResizeStart }: ResizeHandleProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault()
        onResizeStart()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        // Sit in the 8px gap between panels (workspace inset frame).
        'absolute top-0 bottom-0 w-1 z-30 cursor-col-resize group',
        side === 'left' ? '-right-2' : '-left-2'
      )}
    >
      {/* Visual indicator — wine on hover */}
      <div
        className={cn(
          'absolute top-0 bottom-0 w-0.5 left-1/2 -translate-x-1/2 transition-all duration-150 rounded-full',
          isHovered ? 'bg-accent opacity-50' : 'bg-transparent'
        )}
      />
      {/* Wider hit area */}
      <div className="absolute top-0 bottom-0 -left-1 -right-1" />
    </div>
  )
}
