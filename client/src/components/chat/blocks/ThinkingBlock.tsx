import { useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { ThinkingBlockData, ThinkingChild } from '@/types/chat'

interface ThinkingBlockProps {
  block: ThinkingBlockData
  onToggle: () => void
}

const WINE_HAIRLINE = 'rgba(120, 40, 74, 0.12)'
const WINE_TINT = 'rgba(120, 40, 74, 0.04)'

export function ThinkingBlock({ block, onToggle }: ThinkingBlockProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { status, expanded, children, completedImages, expectedImages } = block

  const isActive = status === 'active'
  const isComplete = status === 'complete'
  const isError = status === 'error'

  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [children.length, expanded])

  const label = block.label || 'Thinking'
  const headerText = isActive ? `${label}…` : isComplete ? label : `${label} (Error)`

  const progressText = isActive && expectedImages > 0
    ? `${completedImages}/${expectedImages} images`
    : null

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div
        className={cn(
          'rounded-lg overflow-hidden transition-colors duration-200',
          isError && 'border border-red-500/20',
        )}
        style={{
          backgroundColor: isError ? undefined : WINE_TINT,
          boxShadow: isError ? undefined : `inset 0 0 0 1px ${WINE_HAIRLINE}`,
        }}
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-black/[0.02]">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-text-muted shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-text-muted shrink-0" />
            )}

            <StatusIcon status={status} />

            <span
              className={cn(
                'text-xs font-medium truncate',
                isActive && 'text-accent',
                isComplete && 'text-text-secondary',
                isError && 'text-red-500',
              )}
            >
              {headerText}
            </span>

            {progressText && (
              <span className="text-[11px] font-mono tabular-nums text-text-muted ml-auto shrink-0">
                {progressText}
              </span>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div ref={scrollRef} className="max-h-64 overflow-y-auto px-3 pb-3 space-y-1">
            {children.map((child) => (
              <ChildItem key={child.id} child={child} />
            ))}
            {children.length === 0 && isActive && (
              <div className="text-xs text-text-muted italic">Starting…</div>
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
      return <Loader2 className="h-3.5 w-3.5 text-accent animate-spin shrink-0" />
    case 'complete':
      return <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
    case 'error':
      return <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
  }
}

function ChildItem({ child }: { child: ThinkingChild }) {
  switch (child.kind) {
    case 'phase':
      return (
        <div className="flex items-center gap-2 text-xs pt-1.5 first:pt-0">
          <span
            className="inline-block w-1 h-1 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--color-accent)' }}
          />
          <span className="text-text-secondary font-medium">{child.text}</span>
        </div>
      )

    case 'tool':
      return (
        <div className="flex items-start gap-1.5 text-[11px] pl-3 font-mono">
          <span className="text-text-muted/70 mt-0.5 shrink-0">⚙</span>
          <span className="text-text-muted break-words">
            └─ {child.text}
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
        <div className="flex items-start gap-1.5 text-[11px] pl-3 font-mono">
          <span className="text-text-muted mt-0.5 shrink-0">→</span>
          <span className="text-text-muted break-words">└─ {child.text}</span>
        </div>
      )

    case 'progress':
      return (
        <div className="flex items-start gap-1.5 text-xs pl-3">
          <span className="text-accent mt-0.5 shrink-0">◐</span>
          <span className="text-accent break-words">{child.text}</span>
        </div>
      )

    case 'error':
      return (
        <div className="flex items-start gap-1.5 text-xs pl-3">
          <span className="text-red-500 mt-0.5 shrink-0">✗</span>
          <span className="text-red-500 break-words">{child.text}</span>
        </div>
      )
  }
}
