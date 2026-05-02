import { X, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type HookType } from '@/types/chat'

interface ImageChipProps {
  imageId: number
  hookType?: HookType
  thumbnailUrl?: string
  onRemove?: () => void
  onClick?: () => void
  className?: string
}

/** Map hook type → CSS framework color token. */
const HOOK_COLOR: Record<HookType, string> = {
  stat: 'var(--color-fw-stat)',
  story: 'var(--color-fw-story)',
  fomo: 'var(--color-fw-fomo)',
  curiosity: 'var(--color-fw-curiosity)',
  callout: 'var(--color-fw-callout)',
  contrast: 'var(--color-fw-contrast)',
}

export function ImageChip({
  imageId,
  hookType,
  thumbnailUrl,
  onRemove,
  onClick,
  className,
}: ImageChipProps) {
  const isRemovable = !!onRemove
  const isClickable = !!onClick
  const dotColor = hookType ? HOOK_COLOR[hookType] : 'var(--color-accent)'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full text-[11px] font-mono tracking-tight',
        'border transition-colors duration-150',
        isClickable && 'cursor-pointer hover:bg-bg-elevated',
        isRemovable && 'pr-1',
        className,
      )}
      style={{
        borderColor: 'rgba(120, 40, 74, 0.18)',
        backgroundColor: 'var(--color-bg-base)',
        color: 'var(--color-text-primary)',
      }}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      {/* Thumbnail (if available) — overrides the dot */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={`Image ${imageId}`}
          className="w-4 h-4 rounded-full object-cover shrink-0"
        />
      ) : (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      )}

      <span>@image-{imageId}</span>

      {isRemovable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="ml-0.5 p-0.5 rounded-full text-text-muted hover:text-text-primary hover:bg-black/[0.06] transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          aria-label={`Remove image ${imageId}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

interface ImageChipCompactProps {
  imageId: number
  onClick?: () => void
}

export function ImageChipCompact({ imageId, onClick }: ImageChipCompactProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-mono',
        'bg-bg-elevated text-text-secondary border border-border',
        onClick && 'cursor-pointer hover:bg-bg-overlay hover:text-text-primary',
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <ImageIcon className="w-3 h-3" />
      <span>@image-{imageId}</span>
    </span>
  )
}
