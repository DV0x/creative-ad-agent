import { useEffect, useCallback } from 'react'
import { Download, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { AuthImage } from '@/components/AuthImage'
import { authFetchBlob } from '@/lib/api'
import { type GeneratedImage } from '@/types/chat'
import { cn } from '@/lib/utils'

interface ImageLightboxProps {
  images: GeneratedImage[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate: (index: number) => void
}

const CHROME_PILL: React.CSSProperties = {
  backgroundColor: 'rgba(35, 31, 32, 0.62)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
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

  const totalPadded = String(images.length).padStart(2, '0')
  const currentPadded = String(currentIndex + 1).padStart(2, '0')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop — deep ink, slight wine warmth */}
      <div
        className="absolute inset-0 animate-fadeIn"
        style={{ backgroundColor: 'rgba(20, 16, 18, 0.94)' }}
        onClick={onClose}
      />

      {/* Floating top-left: counter */}
      <div className="absolute top-5 left-5 z-10 animate-fadeIn">
        <span
          className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] tracking-[0.14em] text-white/85"
          style={CHROME_PILL}
        >
          {currentPadded} / {totalPadded}
        </span>
      </div>

      {/* Floating top-right: download + close */}
      <div className="absolute top-5 right-5 z-10 flex items-center gap-2 animate-fadeIn">
        <button
          onClick={handleDownload}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/85 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95"
          style={CHROME_PILL}
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/85 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95"
          style={CHROME_PILL}
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Image area — pointer-events-none so clicks around the image fall through
          to the backdrop (closes), while the image itself catches its own clicks. */}
      <div className="relative z-10 flex-1 flex items-center justify-center min-h-0 p-6 md:p-12 max-w-full max-h-full pointer-events-none">
        <AuthImage
          src={image.url}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-[88vh] object-contain rounded-lg animate-fadeIn pointer-events-auto"
          style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}
        />
      </div>

      {/* Prev */}
      {hasPrev && (
        <button
          onClick={handlePrev}
          className={cn(
            'absolute left-5 top-1/2 -translate-y-1/2 z-10',
            'w-11 h-11 rounded-full flex items-center justify-center',
            'text-white/85 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95'
          )}
          style={CHROME_PILL}
          title="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button
          onClick={handleNext}
          className={cn(
            'absolute right-5 top-1/2 -translate-y-1/2 z-10',
            'w-11 h-11 rounded-full flex items-center justify-center',
            'text-white/85 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95'
          )}
          style={CHROME_PILL}
          title="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
