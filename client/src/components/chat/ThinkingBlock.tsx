import { useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Circle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { ThinkingLine, ThinkingLineType, GenerationStatus } from '@/types/chat'

interface ThinkingBlockProps {
  lines: ThinkingLine[]
  expanded: boolean
  onToggle: () => void
  status: GenerationStatus
  completedImages: number
  expectedImages: number
}

export function ThinkingBlock({
  lines,
  expanded,
  onToggle,
  status,
  completedImages,
  expectedImages,
}: ThinkingBlockProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines, expanded])

  const isGenerating = status === 'generating'
  const isComplete = status === 'complete'
  const isError = status === 'error'
  const isCancelled = status === 'cancelled'

  // Header text based on status
  const headerText = isGenerating
    ? 'Thinking...'
    : isComplete
      ? 'Thinking'
      : isError
        ? 'Error'
        : isCancelled
          ? 'Cancelled'
          : 'Thinking'

  // Progress indicator
  const progressText = isGenerating && expectedImages > 0
    ? `${completedImages}/${expectedImages} images`
    : null

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div
        className={cn(
          'rounded-lg border transition-colors duration-200',
          isGenerating && 'border-accent/30 bg-accent/5',
          isComplete && 'border-border bg-bg-elevated/50',
          isError && 'border-red-500/30 bg-red-500/5',
          isCancelled && 'border-yellow-500/30 bg-yellow-500/5'
        )}
      >
        {/* Header */}
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-elevated/50 rounded-t-lg transition-colors">
            {/* Expand/collapse icon */}
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
            )}

            {/* Status indicator */}
            <StatusIndicator status={status} />

            {/* Header text */}
            <span
              className={cn(
                'text-xs font-medium',
                isGenerating && 'text-accent',
                isComplete && 'text-text-secondary',
                isError && 'text-red-500',
                isCancelled && 'text-yellow-600'
              )}
            >
              {headerText}
            </span>

            {/* Progress */}
            {progressText && (
              <span className="text-xs text-text-muted ml-auto">
                {progressText}
              </span>
            )}
          </div>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent>
          <div
            ref={scrollRef}
            className="max-h-48 overflow-y-auto px-3 pb-3 space-y-1"
          >
            {lines.map((line) => (
              <ThinkingLineItem key={line.id} line={line} />
            ))}
            {lines.length === 0 && isGenerating && (
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

interface StatusIndicatorProps {
  status: GenerationStatus
}

function StatusIndicator({ status }: StatusIndicatorProps) {
  switch (status) {
    case 'generating':
      return <Loader2 className="h-3.5 w-3.5 text-accent animate-spin flex-shrink-0" />
    case 'complete':
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
    case 'error':
      return <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
    case 'cancelled':
      return <AlertCircle className="h-3.5 w-3.5 text-yellow-600 flex-shrink-0" />
    default:
      return <Circle className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />
  }
}

interface ThinkingLineItemProps {
  line: ThinkingLine
}

function ThinkingLineItem({ line }: ThinkingLineItemProps) {
  const { type, text, indent } = line

  return (
    <div
      className="flex items-start gap-1.5 text-xs"
      style={{ paddingLeft: `${indent * 12}px` }}
    >
      <LineIcon type={type} />
      <span
        className={cn(
          'break-words',
          type === 'phase' && 'text-text-secondary font-medium',
          type === 'tool' && 'text-text-muted font-mono',
          type === 'result' && 'text-text-muted',
          type === 'progress' && 'text-accent',
          type === 'error' && 'text-red-500',
          type === 'success' && 'text-green-500'
        )}
      >
        {type === 'tool' && indent > 0 && '└─ '}
        {type === 'result' && indent > 0 && '└─ '}
        {text}
      </span>
    </div>
  )
}

interface LineIconProps {
  type: ThinkingLineType
}

function LineIcon({ type }: LineIconProps) {
  switch (type) {
    case 'phase':
      return (
        <span className="text-accent mt-0.5 flex-shrink-0">●</span>
      )
    case 'tool':
      return (
        <span className="text-violet-500 mt-0.5 flex-shrink-0">⚙</span>
      )
    case 'result':
      return (
        <span className="text-text-muted mt-0.5 flex-shrink-0">→</span>
      )
    case 'progress':
      return (
        <span className="text-accent mt-0.5 flex-shrink-0">◐</span>
      )
    case 'error':
      return (
        <span className="text-red-500 mt-0.5 flex-shrink-0">✗</span>
      )
    case 'success':
      return (
        <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
      )
    default:
      return null
  }
}
