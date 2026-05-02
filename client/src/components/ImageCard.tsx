import { useState } from 'react'
import { Download, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AuthImage } from '@/components/AuthImage'
import { authFetchBlob, eventsApi } from '@/lib/api'

interface ImageCardProps {
  url: string
  index: number
  selected?: boolean
  onSelect?: () => void
  onView?: () => void
  isLoading?: boolean
  campaignId?: string
  hookType?: string
}

function computeAspectLabel(w: number, h: number): string {
  if (!w || !h) return ''
  const r = w / h
  // Snap to the three aspect ratios the product actually generates
  if (Math.abs(r - 4 / 5) < 0.04) return '4:5'
  if (Math.abs(r - 1) < 0.04) return '1:1'
  if (Math.abs(r - 9 / 16) < 0.04) return '9:16'
  // Fallback — show simplified ratio
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const g = gcd(w, h)
  return `${w / g}:${h / g}`
}

export function ImageCard({
  url,
  index,
  selected = false,
  onSelect,
  onView,
  isLoading = false,
  campaignId,
  hookType,
}: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [aspectLabel, setAspectLabel] = useState<string>('')

  const isSelectable = !!onSelect

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    onView?.()
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsImageLoaded(true)
    const img = e.currentTarget
    setAspectLabel(computeAspectLabel(img.naturalWidth, img.naturalHeight))
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    eventsApi.track('image_download', campaignId, { hookType, imageIndex: index })
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
        'group relative rounded-xl overflow-hidden bg-bg-raised cursor-pointer animate-fadeIn transition-shadow duration-200',
        selected && 'ring-2 ring-accent ring-offset-2 ring-offset-bg-base'
      )}
      style={{
        animationDelay: `${index * 100}ms`,
        boxShadow: selected
          ? '0 4px 12px rgba(120, 40, 74, 0.18)'
          : isHovered
          ? '0 0 0 1px rgba(120, 40, 74, 0.12), 0 4px 14px rgba(120, 40, 74, 0.10)'
          : '0 0 0 1px rgba(120, 40, 74, 0.06), 0 1px 2px rgba(120, 40, 74, 0.06)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="aspect-square relative">
        {(isLoading || !isImageLoaded) && (
          <div className="absolute inset-0 skeleton" />
        )}

        {!isLoading && (
          <AuthImage
            src={url}
            alt={`Image ${index}`}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={handleImageLoad}
          />
        )}

        {/* Selection checkbox — shows on hover or when selected */}
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

        {/* Hover-only overlay: @image-N (top-right) + meta strip (bottom) */}
        <div
          className={cn(
            'absolute top-3 right-3 transition-opacity duration-150 pointer-events-none',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <span
            className="px-2 py-1 rounded-md text-[11px] font-mono tracking-tight text-white"
            style={{ backgroundColor: 'rgba(35, 31, 32, 0.72)', backdropFilter: 'blur(6px)' }}
          >
            @image-{index}
          </span>
        </div>

        <div
          className={cn(
            'absolute left-3 right-3 bottom-3 flex items-center justify-between transition-opacity duration-150',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          {aspectLabel ? (
            <span
              className="px-2 py-1 rounded-md text-[11px] font-mono tracking-tight text-white pointer-events-none"
              style={{ backgroundColor: 'rgba(35, 31, 32, 0.72)', backdropFilter: 'blur(6px)' }}
            >
              {aspectLabel}
            </span>
          ) : <span />}
          <button
            onClick={handleDownload}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform duration-150 hover:scale-110 active:scale-95"
            style={{ backgroundColor: 'rgba(35, 31, 32, 0.72)', backdropFilter: 'blur(6px)' }}
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function ImageCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden bg-bg-raised animate-fadeIn"
      style={{
        animationDelay: `${index * 100}ms`,
        boxShadow: '0 0 0 1px rgba(120, 40, 74, 0.06), 0 1px 2px rgba(120, 40, 74, 0.06)',
      }}
    >
      <div className="aspect-square skeleton" />
    </div>
  )
}
