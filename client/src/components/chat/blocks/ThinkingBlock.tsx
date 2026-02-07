import { useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { ThinkingBlockData, ThinkingChild } from '@/types/chat'

interface ThinkingBlockProps {
  block: ThinkingBlockData
  onToggle: () => void
}

export function ThinkingBlock({ block, onToggle }: ThinkingBlockProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { status, expanded, children, completedImages, expectedImages } = block

  const isActive = status === 'active'
  const isComplete = status === 'complete'
  const isError = status === 'error'

  // Auto-scroll to bottom when new children are added
  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [children.length, expanded])

  // Header text - use label if available, otherwise fallback
  const label = block.label || 'Thinking'
  const headerText = isActive
    ? `${label}...`
    : isComplete
      ? label
      : `${label} (Error)`

  // Progress indicator for images
  const progressText = isActive && expectedImages > 0
    ? `${completedImages}/${expectedImages} images`
    : null

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div
        className={cn(
          'rounded-lg border transition-colors duration-200 overflow-hidden',
          isActive && 'border-accent/30 bg-accent/5',
          isComplete && 'border-border bg-bg-elevated/50',
          isError && 'border-red-500/30 bg-red-500/5',
        )}
      >
        {/* Header */}
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-elevated/50 rounded-t-lg transition-colors">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
            )}

            <StatusIcon status={status} />

            <span
              className={cn(
                'text-xs font-medium',
                isActive && 'text-accent',
                isComplete && 'text-text-secondary',
                isError && 'text-red-500',
              )}
            >
              {headerText}
            </span>

            {progressText && (
              <span className="text-xs text-text-muted ml-auto">
                {progressText}
              </span>
            )}
          </div>
        </CollapsibleTrigger>

        {/* Children */}
        <CollapsibleContent>
          <div
            ref={scrollRef}
            className="max-h-64 overflow-y-auto px-3 pb-3 space-y-1"
          >
            {children.map((child) => (
              <ChildItem key={child.id} child={child} />
            ))}
            {children.length === 0 && isActive && (
              <div className="text-xs text-text-muted italic">
                Starting...
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

function StatusIcon({ status }: { status: ThinkingBlockData['status'] }) {
  switch (status) {
    case 'active':
      return <Loader2 className="h-3.5 w-3.5 text-accent animate-spin flex-shrink-0" />
    case 'complete':
      return <CheckCircle2 className="h-3.5 w-3.5 text-accent flex-shrink-0" />
    case 'error':
      return <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
  }
}

function ChildItem({ child }: { child: ThinkingChild }) {
  switch (child.kind) {
    case 'phase':
      return (
        <div className="flex items-center gap-1.5 text-xs pt-1.5 first:pt-0">
          <span className="text-accent mt-0.5 flex-shrink-0">{'\u25CF'}</span>
          <span className="text-text-secondary font-medium">{child.text}</span>
        </div>
      )

    case 'tool':
      return (
        <div className="flex items-start gap-1.5 text-xs pl-3">
          <span className="text-violet-500 mt-0.5 flex-shrink-0">{'\u2699'}</span>
          <span className="text-text-muted font-mono break-words">
            {'\u2514\u2500 '}{child.text}
          </span>
        </div>
      )

    case 'text':
      return (
        <div className="text-xs text-text-secondary pl-3 py-0.5 break-words whitespace-pre-wrap">
          {child.text}
        </div>
      )

    case 'status':
      return (
        <div className="pl-3 py-0.5">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
              child.variant === 'info' && 'bg-accent/10 text-accent',
              child.variant === 'success' && 'bg-green-500/10 text-green-600',
              child.variant === 'error' && 'bg-red-500/10 text-red-500',
              !child.variant && 'bg-accent/10 text-accent',
            )}
          >
            {child.variant === 'success' && <CheckCircle2 className="h-2.5 w-2.5" />}
            {child.variant === 'error' && <AlertCircle className="h-2.5 w-2.5" />}
            {(child.variant === 'info' || !child.variant) && <Info className="h-2.5 w-2.5" />}
            {child.text}
          </span>
        </div>
      )

    case 'result':
      return (
        <div className="flex items-start gap-1.5 text-xs pl-3">
          <span className="text-text-muted mt-0.5 flex-shrink-0">{'\u2192'}</span>
          <span className="text-text-muted break-words">
            {'\u2514\u2500 '}{child.text}
          </span>
        </div>
      )

    case 'progress':
      return (
        <div className="flex items-start gap-1.5 text-xs pl-3">
          <span className="text-accent mt-0.5 flex-shrink-0">{'\u25D0'}</span>
          <span className="text-accent break-words">{child.text}</span>
        </div>
      )

    case 'error':
      return (
        <div className="flex items-start gap-1.5 text-xs pl-3">
          <span className="text-red-500 mt-0.5 flex-shrink-0">{'\u2717'}</span>
          <span className="text-red-500 break-words">{child.text}</span>
        </div>
      )
  }
}
