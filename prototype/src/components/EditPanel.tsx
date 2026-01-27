import { useEffect, useCallback, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { X, Undo2, Redo2, Check, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'research', label: 'Research' },
  { key: 'hooks', label: 'Hooks' },
  { key: 'prompts', label: 'Prompts' },
] as const

type TabKey = typeof TABS[number]['key']

// Generate research content for TipTap
function generateResearchContent(
  research: { brandName: string; tagline: string; tone: string; colors: string[] } | null
): string {
  if (!research) return '<p>No research data available</p>'

  let content = `<h2>Brand Research</h2>`
  content += `<p><strong>Brand Name:</strong> ${research.brandName}</p>`
  content += `<p><strong>Tagline:</strong> ${research.tagline}</p>`
  content += `<p><strong>Tone:</strong> ${research.tone}</p>`
  content += `<h3>Color Palette</h3>`
  content += `<ul>`
  research.colors.forEach((color, i) => {
    const label = i === 0 ? 'Primary' : i === 1 ? 'Secondary' : 'Accent'
    content += `<li>${label}: <code>${color}</code></li>`
  })
  content += `</ul>`
  content += `<h3>Notes</h3>`
  content += `<p>Add your research notes here...</p>`

  return content
}

export function EditPanel() {
  const { setAppState, hooks, research, editTab, setEditTab } = useStore()
  const [activeTab, setActiveTab] = useState<TabKey>(editTab || 'research')

  // Sync with store
  useEffect(() => {
    setEditTab(activeTab as 'research' | 'hooks' | 'prompts')
  }, [activeTab, setEditTab])

  return (
    <div className="h-full flex flex-col bg-bg-raised">
      {/* Header with tabs */}
      <div className="border-b border-border shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Edit</span>
          <button
            onClick={() => setAppState('results')}
            className="p-1.5 hover:bg-bg-elevated rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>
        {/* Tabs */}
        <div className="px-4 pb-2 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                activeTab === tab.key
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'research' && <ResearchTab />}
        {activeTab === 'hooks' && <HooksTab />}
        {activeTab === 'prompts' && <PromptsTab />}
      </div>
    </div>
  )
}

// ============================================
// Research Tab - TipTap Editor
// ============================================
function ResearchTab() {
  const { research, setEditorSaveStatus } = useStore()
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  // History for undo/redo
  const historyRef = useRef<string[]>([])
  const historyIndexRef = useRef(-1)
  const isUndoRedoRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const initialContent = generateResearchContent(research)

  // Add to history with debouncing
  const addToHistory = useCallback((content: string) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      const history = historyRef.current
      const currentIndex = historyIndexRef.current

      if (history[currentIndex] === content) return

      const newHistory = history.slice(0, currentIndex + 1)
      newHistory.push(content)

      if (newHistory.length > 50) {
        newHistory.shift()
      }

      historyRef.current = newHistory
      historyIndexRef.current = newHistory.length - 1
    }, 500)
  }, [])

  // Perform save
  const performSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    setSaveStatus('saving')
    setTimeout(() => {
      setSaveStatus('saved')
      setLastSavedAt(new Date())
      setEditorSaveStatus('saved')
    }, 200)
  }, [setEditorSaveStatus])

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-4',
      },
    },
    onCreate: ({ editor }) => {
      const content = editor.getHTML()
      historyRef.current = [content]
      historyIndexRef.current = 0
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML()
      addToHistory(content)
      setSaveStatus('unsaved')

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      saveTimerRef.current = setTimeout(() => {
        performSave()
      }, 1000)
    },
    onBlur: () => {
      performSave()
    },
  })

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0 || !editor) return
    isUndoRedoRef.current = true
    historyIndexRef.current -= 1
    editor.commands.setContent(historyRef.current[historyIndexRef.current], false)
    setSaveStatus('unsaved')
  }, [editor])

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1 || !editor) return
    isUndoRedoRef.current = true
    historyIndexRef.current += 1
    editor.commands.setContent(historyRef.current[historyIndexRef.current], false)
    setSaveStatus('unsaved')
  }, [editor])

  const canUndo = historyIndexRef.current > 0
  const canRedo = historyIndexRef.current < historyRef.current.length - 1

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...'
      case 'saved': return lastSavedAt ? `Saved ${formatTimeAgo(lastSavedAt)}` : 'Saved'
      case 'unsaved': return 'Unsaved'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-between shrink-0">
        <span className="text-xs text-text-muted flex items-center gap-1">
          {saveStatus === 'saved' && <Check className="w-3 h-3 text-success" />}
          {getSaveStatusText()}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUndo}
            disabled={!canUndo}
            className={cn('h-7 w-7', !canUndo && 'opacity-50')}
            title="Undo (Cmd+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRedo}
            disabled={!canRedo}
            className={cn('h-7 w-7', !canRedo && 'opacity-50')}
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <EditorContent editor={editor} />
        </ScrollArea>
      </div>
    </div>
  )
}

// ============================================
// Hooks Tab - Structured Cards
// ============================================
function HooksTab() {
  const { hooks, setHooks } = useStore()
  const [editingId, setEditingId] = useState<number | null>(null)

  const handleHeadlineChange = (id: number, value: string) => {
    setHooks(hooks.map(h => h.id === id ? { ...h, headline: value } : h))
  }

  const handleBodyChange = (id: number, value: string) => {
    setHooks(hooks.map(h => h.id === id ? { ...h, body: value } : h))
  }

  const handleRegenerate = (id: number) => {
    // TODO: Implement regeneration logic
    console.log('Regenerate hook:', id)
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {hooks.map((hook, index) => (
          <div
            key={hook.id}
            className="p-3 bg-bg-elevated border border-border rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-muted uppercase tracking-wide">
                {index + 1}. {hook.type}
              </span>
              <Button
                variant="ghost"
                size="xs"
                className="text-xs h-7 px-2"
                onClick={() => handleRegenerate(hook.id)}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Regen
              </Button>
            </div>

            {/* Headline */}
            <div className="mb-2">
              <label className="text-xs text-text-muted block mb-1">Headline</label>
              <textarea
                value={hook.headline}
                onChange={(e) => handleHeadlineChange(hook.id, e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-bg-base border border-border rounded-md text-sm text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/25 resize-none"
              />
            </div>

            {/* Body (collapsible) */}
            <div>
              <button
                onClick={() => setEditingId(editingId === hook.id ? null : hook.id)}
                className="text-xs text-accent hover:text-accent-hover"
              >
                {editingId === hook.id ? 'Hide details' : 'Edit details'}
              </button>

              {editingId === hook.id && (
                <div className="mt-2 space-y-2 animate-fadeIn">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Body</label>
                    <textarea
                      value={hook.body}
                      onChange={(e) => handleBodyChange(hook.id, e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-bg-base border border-border rounded-md text-sm text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/25 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">CTA</label>
                    <input
                      type="text"
                      value={hook.cta}
                      onChange={(e) => setHooks(hooks.map(h => h.id === hook.id ? { ...h, cta: e.target.value } : h))}
                      className="w-full px-3 py-2 bg-bg-base border border-border rounded-md text-sm text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/25"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Regenerate All */}
        <Button variant="outline" className="w-full mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate All Hooks
        </Button>
      </div>
    </ScrollArea>
  )
}

// ============================================
// Prompts Tab - Structured Cards
// ============================================
function PromptsTab() {
  const { hooks, images } = useStore()
  const [prompts, setPrompts] = useState<Record<number, string>>({})

  // Initialize prompts from hooks
  useEffect(() => {
    const initialPrompts: Record<number, string> = {}
    hooks.forEach((hook) => {
      const image = images.find(img => img.hookId === hook.id)
      initialPrompts[hook.id] = image?.prompt ||
        `Soft brutalism clay render, ${hook.headline.toLowerCase()}, warm lighting, pastel tones, 3D illustration`
    })
    setPrompts(initialPrompts)
  }, [hooks, images])

  const handlePromptChange = (hookId: number, value: string) => {
    setPrompts(prev => ({ ...prev, [hookId]: value }))
  }

  const handleRegenerateImage = (hookId: number) => {
    // TODO: Implement image regeneration
    console.log('Regenerate image for hook:', hookId, 'with prompt:', prompts[hookId])
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        <p className="text-xs text-text-muted mb-4">
          Edit the prompts used to generate images for each hook.
        </p>

        {hooks.map((hook, index) => {
          const image = images.find(img => img.hookId === hook.id)

          return (
            <div
              key={hook.id}
              className="p-3 bg-bg-elevated border border-border rounded-lg"
            >
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                {image && (
                  <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 border border-border">
                    <img
                      src={image.url}
                      alt={hook.headline}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-muted uppercase tracking-wide">
                      Prompt {index + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-xs h-7 px-2"
                      onClick={() => handleRegenerateImage(hook.id)}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Regen
                    </Button>
                  </div>

                  <p className="text-xs text-text-secondary mb-2 truncate">
                    {hook.headline}
                  </p>

                  <textarea
                    value={prompts[hook.id] || ''}
                    onChange={(e) => handlePromptChange(hook.id, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-bg-base border border-border rounded-md text-xs font-mono text-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/25 resize-none"
                    placeholder="Enter image generation prompt..."
                  />
                </div>
              </div>
            </div>
          )
        })}

        {/* Regenerate All Images */}
        <Button variant="glow" className="w-full mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate All Images
        </Button>
      </div>
    </ScrollArea>
  )
}

// Helper to format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return date.toLocaleTimeString()
}
