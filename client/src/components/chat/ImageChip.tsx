import { X, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HOOK_TYPE_LABELS, type HookType } from '@/types/chat'

interface ImageChipProps {
  imageId: number
  hookType?: HookType
  thumbnailUrl?: string
  onRemove?: () => void
  onClick?: () => void
  className?: string
}

export function ImageChip({
  imageId,
  hookType,
  thumbnailUrl,
  onRemove,
  onClick,
  className,
}: ImageChipProps) {
  const label = hookType ? HOOK_TYPE_LABELS[hookType] : `Image ${imageId}`
  const isRemovable = !!onRemove
  const isClickable = !!onClick

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
        'bg-accent/10 text-accent border border-accent/20',
        'transition-colors duration-150',
        isClickable && 'cursor-pointer hover:bg-accent/20',
        isRemovable && 'pr-1',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      {/* Thumbnail or icon */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={`Image ${imageId}`}
          className="w-4 h-4 rounded object-cover"
        />
      ) : (
        <ImageIcon className="w-3 h-3" />
      )}

      {/* Label */}
      <span>{label}</span>

      {/* Remove button */}
      {isRemovable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className={cn(
            'ml-0.5 p-0.5 rounded-sm',
            'hover:bg-accent/20 text-accent/70 hover:text-accent',
            'transition-colors duration-150',
            'focus:outline-none focus-visible:ring-1 focus-visible:ring-accent'
          )}
          aria-label={`Remove ${label}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

// Compact version for inline text
interface ImageChipCompactProps {
  imageId: number
  onClick?: () => void
}

export function ImageChipCompact({ imageId, onClick }: ImageChipCompactProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-xs',
        'bg-bg-elevated text-text-secondary border border-border',
        onClick && 'cursor-pointer hover:bg-bg-overlay hover:text-text-primary'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <ImageIcon className="w-3 h-3" />
      <span>{imageId}</span>
    </span>
  )
}
