import { useEffect, useCallback } from 'react'
import { Download, X, ChevronLeft, ChevronRight, Trash2, Plus, Check } from 'lucide-react'
import { AuthImage } from '@/components/AuthImage'
import { authFetchBlob } from '@/lib/api'
import { type AssetFile } from '@/store'
import { cn } from '@/lib/utils'

interface AssetLightboxProps {
  files: AssetFile[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate: (index: number) => void
  onDelete: (file: AssetFile) => void
  isReference: (file: AssetFile) => boolean
  onToggleReference: (file: AssetFile) => void
}

const CHROME_PILL: React.CSSProperties = {
  backgroundColor: 'rgba(35, 31, 32, 0.62)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
}

export function AssetLightbox({
  files,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onDelete,
  isReference,
  onToggleReference,
}: AssetLightboxProps) {
  const file = files[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < files.length - 1

  const handlePrev = useCallback(() => {
    if (hasPrev) onNavigate(currentIndex - 1)
  }, [hasPrev, currentIndex, onNavigate])

  const handleNext = useCallback(() => {
    if (hasNext) onNavigate(currentIndex + 1)
  }, [hasNext, currentIndex, onNavigate])

  const handleDownload = useCallback(async () => {
    if (!file) return
    try {
      const blobUrl = await authFetchBlob(file.url)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch {
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [file])

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

  if (!isOpen || !file) return null

  const totalPadded = String(files.length).padStart(2, '0')
  const currentPadded = String(currentIndex + 1).padStart(2, '0')
  const active = isReference(file)

  const handleDelete = () => {
    onDelete(file)
    if (files.length <= 1) {
      onClose()
    } else if (currentIndex >= files.length - 1) {
      onNavigate(currentIndex - 1)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fadeIn"
        style={{ backgroundColor: 'rgba(20, 16, 18, 0.94)' }}
        onClick={onClose}
      />

      {/* Top-left: counter */}
      <div className="absolute top-5 left-5 z-10 animate-fadeIn">
        <span
          className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] tracking-[0.14em] text-white/85"
          style={CHROME_PILL}
        >
          {currentPadded} / {totalPadded}
        </span>
      </div>

      {/* Top-right: reference toggle + download + delete + close */}
      <div className="absolute top-5 right-5 z-10 flex items-center gap-2 animate-fadeIn">
        <button
          onClick={() => onToggleReference(file)}
          className={cn(
            'h-9 px-3 rounded-full flex items-center gap-1.5 text-[11px] tracking-tight transition-all duration-150 hover:scale-105 active:scale-95',
            active ? 'text-white' : 'text-white/85 hover:text-white',
          )}
          style={
            active
              ? { backgroundColor: 'rgba(120, 40, 74, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)' }
              : CHROME_PILL
          }
          title={active ? 'Remove from chat' : 'Add to chat'}
        >
          {active ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {active ? 'In chat' : 'Add to chat'}
        </button>
        <button
          onClick={handleDownload}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/85 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95"
          style={CHROME_PILL}
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/85 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95"
          style={CHROME_PILL}
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
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

      {/* Image */}
      <div className="relative z-10 flex-1 flex items-center justify-center min-h-0 p-6 md:p-12 max-w-full max-h-full pointer-events-none">
        {file.type === 'image' && file.url ? (
          <AuthImage
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-[88vh] object-contain rounded-lg animate-fadeIn pointer-events-auto"
            style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}
          />
        ) : (
          <div className="pointer-events-auto px-8 py-12 rounded-lg text-white/80" style={CHROME_PILL}>
            {file.name}
          </div>
        )}
      </div>

      {/* Prev */}
      {hasPrev && (
        <button
          onClick={handlePrev}
          className={cn(
            'absolute left-5 top-1/2 -translate-y-1/2 z-10',
            'w-11 h-11 rounded-full flex items-center justify-center',
            'text-white/85 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95',
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
            'text-white/85 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95',
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
