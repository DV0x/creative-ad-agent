import { useState } from 'react'
import { RefreshCw, Download, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HOOK_TYPE_LABELS, type HookType } from '@/types/chat'

interface ImageCardProps {
  url: string
  hookHeadline: string
  index: number
  hookType?: HookType
  selected?: boolean
  onSelect?: () => void
  isLoading?: boolean
  onRegenerate?: () => void
  onDownload?: () => void
}

export function ImageCard({
  url,
  hookHeadline,
  index,
  hookType,
  selected = false,
  onSelect,
  isLoading = false,
  onRegenerate,
  onDownload,
}: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const hookLabel = hookType ? HOOK_TYPE_LABELS[hookType] : undefined
  const imageLabel = `Image ${index}`
  const isSelectable = !!onSelect

  const handleClick = (e: React.MouseEvent) => {
    // If clicking on a button, don't toggle selection
    if ((e.target as HTMLElement).closest('button')) return
    onSelect?.()
  }

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden bg-bg-raised border transition-all duration-200 cursor-pointer animate-fadeIn',
        selected
          ? 'border-accent shadow-[0_0_20px_var(--color-accent-glow)] ring-2 ring-accent ring-offset-2 ring-offset-bg-base'
          : isHovered
            ? 'shadow-[0_0_30px_var(--color-accent-glow)] border-accent/50 -translate-y-1'
            : 'border-border shadow-lg hover:shadow-xl'
      )}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Image */}
      <div className="aspect-square relative">
        {/* Loading/skeleton state */}
        {(isLoading || !isImageLoaded) && (
          <div className="absolute inset-0 skeleton" />
        )}

        {/* Actual image */}
        {!isLoading && (
          <img
            src={url}
            alt={hookHeadline}
            className={cn(
              'w-full h-full object-cover transition-all duration-300',
              isImageLoaded ? 'opacity-100' : 'opacity-0',
              isHovered && !selected ? 'scale-105' : 'scale-100'
            )}
            onLoad={() => setIsImageLoaded(true)}
          />
        )}

        {/* Selection checkbox */}
        {isSelectable && (
          <div
            className={cn(
              'absolute top-3 left-3 transition-opacity duration-150',
              selected || isHovered ? 'opacity-100' : 'opacity-0'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150',
                selected
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-elevated/90 backdrop-blur-sm border border-border hover:border-accent/50'
              )}
            >
              {selected && <Check className="w-4 h-4" />}
            </div>
          </div>
        )}

        {/* Image label badge */}
        <div
          className={cn(
            'absolute bottom-3 left-3 transition-opacity duration-150',
            isHovered || selected ? 'opacity-100' : 'opacity-0'
          )}
        >
          <span className="px-2 py-1 text-xs font-medium bg-bg-elevated/90 backdrop-blur-sm rounded-md border border-border text-text-secondary">
            {imageLabel}
          </span>
        </div>

        {/* Hook type label */}
        {hookLabel && (
          <div
            className={cn(
              'absolute bottom-3 right-3 transition-opacity duration-150',
              isHovered || selected ? 'opacity-100' : 'opacity-0'
            )}
          >
            <span className="px-2 py-1 text-xs font-medium bg-accent/90 backdrop-blur-sm rounded-md text-white">
              {hookLabel}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          {/* Actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            {onRegenerate && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRegenerate()
                }}
                className="w-8 h-8 rounded-full bg-bg-elevated/90 backdrop-blur-sm hover:bg-accent hover:text-white flex items-center justify-center transition-all duration-150 border border-border hover:border-accent hover:scale-110 active:scale-95"
                title="Regenerate"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {onDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload()
                }}
                className="w-8 h-8 rounded-full bg-bg-elevated/90 backdrop-blur-sm hover:bg-accent hover:text-white flex items-center justify-center transition-all duration-150 border border-border hover:border-accent hover:scale-110 active:scale-95"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hook preview */}
      <div
        className={cn(
          'px-4 py-3 border-t border-border bg-bg-raised/95 backdrop-blur-sm transition-all duration-200',
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}
      >
        <p className="text-sm text-text-secondary line-clamp-2 italic">
          "{hookHeadline}"
        </p>
      </div>
    </div>
  )
}

// Skeleton version for loading state
export function ImageCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden bg-bg-raised border border-border animate-fadeIn"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="aspect-square skeleton" />
    </div>
  )
}
