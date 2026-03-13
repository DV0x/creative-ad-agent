import { useEffect, useCallback } from 'react'
import { Download, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthImage } from '@/components/AuthImage'
import { authFetchBlob } from '@/lib/api'
import { HOOK_TYPE_LABELS, type GeneratedImage } from '@/types/chat'
import { cn } from '@/lib/utils'

interface ImageLightboxProps {
  images: GeneratedImage[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate: (index: number) => void
}

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const image = images[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < images.length - 1

  const handlePrev = useCallback(() => {
    if (hasPrev) onNavigate(currentIndex - 1)
  }, [hasPrev, currentIndex, onNavigate])

  const handleNext = useCallback(() => {
    if (hasNext) onNavigate(currentIndex + 1)
  }, [hasNext, currentIndex, onNavigate])

  const handleDownload = useCallback(async () => {
    if (!image) return
    try {
      const blobUrl = await authFetchBlob(image.url)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `image-${currentIndex + 1}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch {
      const link = document.createElement('a')
      link.href = image.url
      link.download = `image-${currentIndex + 1}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [image, currentIndex])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, handlePrev, handleNext])

  if (!isOpen || !image) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 animate-fadeIn"
        onClick={onClose}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-bg-base/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3">
          {image.hookType && HOOK_TYPE_LABELS[image.hookType] && (
            <span className="px-2.5 py-1 text-xs font-medium bg-accent/90 rounded-md text-white">
              {HOOK_TYPE_LABELS[image.hookType]}
            </span>
          )}
          <span className="text-sm text-text-secondary">
            Image {currentIndex + 1} of {images.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDownload}
            className="text-text-muted hover:text-text-primary"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary"
            title="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Image area */}
      <div className="relative z-10 flex-1 flex items-center justify-center min-h-0 p-4">
        <AuthImage
          src={image.url}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg"
        />

        {/* Prev button */}
        {hasPrev && (
          <button
            onClick={handlePrev}
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2',
              'w-10 h-10 rounded-full flex items-center justify-center',
              'bg-bg-elevated/80 backdrop-blur-sm border border-border',
              'text-text-secondary hover:text-text-primary hover:bg-bg-overlay',
              'transition-all duration-150'
            )}
            title="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Next button */}
        {hasNext && (
          <button
            onClick={handleNext}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2',
              'w-10 h-10 rounded-full flex items-center justify-center',
              'bg-bg-elevated/80 backdrop-blur-sm border border-border',
              'text-text-secondary hover:text-text-primary hover:bg-bg-overlay',
              'transition-all duration-150'
            )}
            title="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
