import { useEffect, useCallback, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { marked } from 'marked'
import { X, Undo2, Redo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore, type CampaignFileType } from '@/store'
import { PromptsViewer } from './PromptsViewer'
import { cn } from '@/lib/utils'

// Configure marked for clean HTML output
marked.setOptions({ breaks: true, gfm: true })

// Detect if content is already HTML (from TipTap save) vs raw markdown (from agent)
function isHtml(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.startsWith('<') && (
    trimmed.startsWith('<p>') ||
    trimmed.startsWith('<h') ||
    trimmed.startsWith('<ul') ||
    trimmed.startsWith('<ol') ||
    trimmed.startsWith('<div') ||
    trimmed.startsWith('<blockquote')
  )
}

// Convert markdown to HTML if needed
function ensureHtml(content: string): string {
  if (!content || isHtml(content)) return content
  return marked.parse(content) as string
}

// File type to display name mapping
const FILE_NAMES: Record<CampaignFileType, string> = {
  research: 'research.md',
  hooks: 'hooks.md',
  prompts: 'prompts.json',
}

// Save status type
type SaveStatus = 'saved' | 'saving' | 'unsaved'

interface FileEditorPanelProps {
  width: number
  onResizeStart: () => void
  isResizing: boolean
}

export function FileEditorPanel({ width, onResizeStart, isResizing }: FileEditorPanelProps) {
  const {
    activeFileType,
    setActiveFileType,
    getActiveFileContent,
    updateFileContent,
    saveFileAsync,
    getActiveCampaign,
    activeCampaignId,
  } = useStore()

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const campaign = getActiveCampaign()
  const content = getActiveFileContent()

  // Auto-save function
  const performSave = useCallback(async (newContent: string) => {
    if (!activeFileType || !activeCampaignId) return

    setSaveStatus('saving')
    // Update local state immediately
    updateFileContent(activeFileType, newContent)

    // Sync to API
    try {
      await saveFileAsync(activeCampaignId, activeFileType, newContent)
      setSaveStatus('saved')
      setLastSavedAt(new Date())
    } catch (error) {
      console.error('Failed to save file:', error)
      // Still mark as saved locally even if API fails
      setSaveStatus('saved')
      setLastSavedAt(new Date())
    }
  }, [activeFileType, activeCampaignId, updateFileContent, saveFileAsync])

  // Debounced save (1 second after last change)
  const debouncedSave = useCallback((newContent: string) => {
    setSaveStatus('unsaved')

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      performSave(newContent)
    }, 1000)
  }, [performSave])

  // TipTap editor setup
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: ensureHtml(content),
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-sm max-w-none focus:outline-none px-4 py-4',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      debouncedSave(html)
    },
  })

  // Update editor content when activeFileType changes
  useEffect(() => {
    if (editor && activeFileType) {
      const rawContent = getActiveFileContent()
      const htmlContent = ensureHtml(rawContent)
      if (editor.getHTML() !== htmlContent) {
        editor.commands.setContent(htmlContent, { emitUpdate: false })
        setSaveStatus('saved')
      }
    }
  }, [editor, activeFileType, getActiveFileContent])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Handle close - save any pending changes
  const handleClose = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (editor && activeFileType && saveStatus === 'unsaved') {
      performSave(editor.getHTML())
    }
    setActiveFileType(null)
  }

  // Undo/Redo handlers
  const handleUndo = () => {
    editor?.chain().focus().undo().run()
  }

  const handleRedo = () => {
    editor?.chain().focus().redo().run()
  }

  const canUndo = editor?.can().undo() ?? false
  const canRedo = editor?.can().redo() ?? false

  // Save status text
  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...'
      case 'saved':
        return lastSavedAt ? `Saved ${formatTimeAgo(lastSavedAt)}` : 'Saved'
      case 'unsaved':
        return 'Unsaved changes'
      default:
        return ''
    }
  }

  if (!activeFileType) return null

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-bg-raised border-l border-border relative h-screen',
        'animate-in slide-in-from-right-4 fade-in duration-200 ease-out',
        !isResizing && 'transition-[width] duration-200 ease-out'
      )}
      style={{ width: `${width}px` }}
    >
      {/* Resize handle on left edge */}
      <ResizeHandle onResizeStart={onResizeStart} />

      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-border shrink-0">
        <div className="flex flex-col min-w-0">
          <span className="text-text-primary font-medium text-sm truncate">
            {FILE_NAMES[activeFileType]}
          </span>
          <span className="text-text-muted text-xs flex items-center gap-1">
            {saveStatus === 'saved' && (
              <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
            )}
            {saveStatus === 'saving' && (
              <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse shrink-0" />
            )}
            {saveStatus === 'unsaved' && (
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted shrink-0" />
            )}
            <span className="truncate">
              {getSaveStatusText()}
              {campaign && ` · ${campaign.name}`}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {activeFileType !== 'prompts' && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleUndo}
                disabled={!canUndo}
                className={cn(!canUndo && 'opacity-50')}
                title="Undo (Cmd+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleRedo}
                disabled={!canRedo}
                className={cn(!canRedo && 'opacity-50')}
                title="Redo (Cmd+Shift+Z)"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
              <div className="w-px h-5 bg-border mx-1" />
            </>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClose}
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content area - scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {activeFileType === 'prompts' ? (
          <PromptsViewer content={content} />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
    </aside>
  )
}

// Resize handle component
interface ResizeHandleProps {
  onResizeStart: () => void
}

function ResizeHandle({ onResizeStart }: ResizeHandleProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault()
        onResizeStart()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute top-0 bottom-0 w-1 z-20 cursor-col-resize group -left-0.5"
    >
      {/* Visual indicator */}
      <div
        className={cn(
          'absolute top-0 bottom-0 w-1 transition-all duration-150 left-0',
          isHovered ? 'bg-accent' : 'bg-transparent'
        )}
      />
      {/* Wider hit area */}
      <div className="absolute top-0 bottom-0 -left-1 -right-1" />
    </div>
  )
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return date.toLocaleDateString()
}

// Keep the old export name for backwards compatibility during transition
export { FileEditorPanel as FileEditor }
