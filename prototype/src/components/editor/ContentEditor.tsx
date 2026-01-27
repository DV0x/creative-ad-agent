import { useEffect, useCallback, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { ArrowLeft, Undo2, Redo2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

// Debounce hook for auto-save
function useDebounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  ) as T

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

export function ContentEditor() {
  const {
    editor: editorState,
    setEditorContent,
    editorUndo,
    editorRedo,
    setEditorSaveStatus,
    setAppState,
    research,
    canUndo,
    canRedo,
  } = useStore()

  const [copied, setCopied] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-save function
  const performSave = useCallback(() => {
    setEditorSaveStatus('saving')
    // Simulate save delay (in real app, this would be an API call)
    setTimeout(() => {
      setEditorSaveStatus('saved')
    }, 300)
  }, [setEditorSaveStatus])

  // Debounced save (1 second after last change)
  const debouncedSave = useDebounce(performSave, 1000)

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
    content: editorState.content,
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[calc(100vh-140px)] px-4 py-6 md:px-8 md:py-8',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setEditorContent(html, true)
      debouncedSave()
    },
    onBlur: () => {
      // Save immediately on blur
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      performSave()
    },
  })

  // Sync editor content when store changes (for undo/redo)
  useEffect(() => {
    if (editor && editor.getHTML() !== editorState.content) {
      editor.commands.setContent(editorState.content, false)
    }
  }, [editor, editorState.content])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault()
          handleRedo()
        } else {
          e.preventDefault()
          handleUndo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleUndo = () => {
    if (canUndo()) {
      editorUndo()
    }
  }

  const handleRedo = () => {
    if (canRedo()) {
      editorRedo()
    }
  }

  const handleCopyAll = async () => {
    if (editor) {
      const text = editor.getText()
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleBack = () => {
    // Save before going back
    performSave()
    setAppState('results')
  }

  // Save status indicator text
  const getSaveStatusText = () => {
    switch (editorState.saveStatus) {
      case 'saving':
        return 'Saving...'
      case 'saved':
        return editorState.lastSavedAt
          ? `Saved ${formatTimeAgo(editorState.lastSavedAt)}`
          : 'Saved'
      case 'unsaved':
        return 'Unsaved changes'
      default:
        return ''
    }
  }

  return (
    <div className="h-screen flex flex-col bg-bg-base">
      {/* Header */}
      <header className="border-b border-border bg-bg-raised/80 backdrop-blur-sm shrink-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Left: Back button and title */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="text-text-muted hover:text-text-primary transition-colors p-1.5 rounded-md hover:bg-bg-elevated"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col">
              <span className="text-text-primary font-medium text-sm">
                {research?.brandName ? `Research: ${research.brandName}` : 'Content Editor'}
              </span>
              <span className="text-text-muted text-xs">
                {getSaveStatusText()}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo()}
              className={cn(!canUndo() && 'opacity-50 cursor-not-allowed')}
            >
              <Undo2 className="w-4 h-4" />
              <span className="hidden sm:inline">Undo</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo()}
              className={cn(!canRedo() && 'opacity-50 cursor-not-allowed')}
            >
              <Redo2 className="w-4 h-4" />
              <span className="hidden sm:inline">Redo</span>
            </Button>
            <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
            <Button variant="outline" size="sm" onClick={handleCopyAll}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-success" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy All</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Editor Area */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <EditorContent editor={editor} />
        </div>
      </main>
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
