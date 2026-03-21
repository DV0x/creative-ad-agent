import { useEffect, useCallback } from 'react'
import { XIcon, Trash2Icon, DownloadIcon, ImageIcon, FileIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { AuthImage } from '@/components/AuthImage'
import { authFetchBlob } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useStore, type AssetFile } from '@/store'
import { cn } from '@/lib/utils'

interface AssetPreviewProps {
  files: AssetFile[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate: (index: number) => void
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AssetPreview({ files, currentIndex, isOpen, onClose, onNavigate }: AssetPreviewProps) {
  const { removeFile } = useStore()
  const file = files[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < files.length - 1

  const handlePrev = useCallback(() => {
    if (hasPrev) onNavigate(currentIndex - 1)
  }, [hasPrev, currentIndex, onNavigate])

  const handleNext = useCallback(() => {
    if (hasNext) onNavigate(currentIndex + 1)
  }, [hasNext, currentIndex, onNavigate])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handlePrev, handleNext])

  if (!file) return null

  const handleDelete = () => {
    removeFile(file.id)
    // Navigate to prev or next, or close if last file
    if (files.length <= 1) {
      onClose()
    } else if (currentIndex >= files.length - 1) {
      onNavigate(currentIndex - 1)
    }
  }

  const handleDownload = async () => {
    const blobUrl = await authFetchBlob(file.url)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden" showCloseButton={false}>
        {/* Header with file info */}
        <DialogHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {file.type === 'image' ? (
                <div className="w-8 h-8 rounded bg-bg-elevated flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4 text-text-muted" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded bg-bg-elevated flex items-center justify-center shrink-0">
                  <FileIcon className="w-4 h-4 text-text-muted" />
                </div>
              )}
              <div className="min-w-0">
                <DialogTitle className="text-sm font-medium truncate">
                  {file.name}
                </DialogTitle>
                <p className="text-xs text-text-muted">
                  {formatFileSize(file.size)}
                  {files.length > 1 && ` · ${currentIndex + 1} of ${files.length}`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleDownload}
                className="text-text-muted hover:text-text-primary"
                title="Download"
              >
                <DownloadIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleDelete}
                className="text-text-muted hover:text-error"
                title="Delete"
              >
                <Trash2Icon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="text-text-muted hover:text-text-primary"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Image preview with navigation */}
        <div className="relative bg-black/90 flex items-center justify-center min-h-[300px] max-h-[70vh]">
          {file.type === 'image' ? (
            <AuthImage
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-[70vh] object-contain"
            />
          ) : (
            <div className="py-16 text-center">
              <FileIcon className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">Preview not available</p>
            </div>
          )}

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
              title="Previous file"
            >
              <ChevronLeftIcon className="w-5 h-5" />
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
              title="Next file"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// Hook for managing preview state
// ============================================

import { useState } from 'react'

export function useAssetPreview() {
  const [previewFiles, setPreviewFiles] = useState<AssetFile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const openPreview = useCallback((file: AssetFile, allFiles: AssetFile[]) => {
    setPreviewFiles(allFiles)
    setCurrentIndex(allFiles.findIndex(f => f.id === file.id) || 0)
    setIsOpen(true)
  }, [])

  const closePreview = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => {
      setPreviewFiles([])
      setCurrentIndex(0)
    }, 200)
  }, [])

  return {
    previewFiles,
    previewIndex: currentIndex,
    isPreviewOpen: isOpen,
    openPreview,
    closePreview,
    navigatePreview: setCurrentIndex,
  }
}
