import { useState } from 'react'
import { Download, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AuthImage } from '@/components/AuthImage'
import { authFetchBlob } from '@/lib/api'

interface ImageCardProps {
  url: string
  index: number
  selected?: boolean
  onSelect?: () => void
  onView?: () => void
  isLoading?: boolean
}

export function ImageCard({
  url,
  index,
  selected = false,
  onSelect,
  onView,
  isLoading = false,
}: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const isSelectable = !!onSelect

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    onView?.()
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const blobUrl = await authFetchBlob(url)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `image-${index}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch {
      // Fallback to direct download
      const link = document.createElement('a')
      link.href = url
      link.download = `image-${index}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
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
          <AuthImage
            src={url}
            alt={`Image ${index}`}
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
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.()
            }}
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
          </button>
        )}

        {/* Download button — hover only */}
        <div
          className={cn(
            'absolute top-3 right-3 transition-opacity duration-150',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <button
            onClick={handleDownload}
            className="w-8 h-8 rounded-full bg-bg-elevated/90 backdrop-blur-sm hover:bg-accent hover:text-white flex items-center justify-center transition-all duration-150 border border-border hover:border-accent hover:scale-110 active:scale-95"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

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
