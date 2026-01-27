import { XIcon, Trash2Icon, DownloadIcon, ImageIcon, FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useStore, type AssetFile } from '@/store'

interface AssetPreviewProps {
  file: AssetFile | null
  isOpen: boolean
  onClose: () => void
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AssetPreview({ file, isOpen, onClose }: AssetPreviewProps) {
  const { removeFile } = useStore()

  if (!file) return null

  const handleDelete = () => {
    removeFile(file.id)
    onClose()
  }

  const handleDownload = () => {
    // Create a download link
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
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

        {/* Image preview */}
        <div className="relative bg-black/90 flex items-center justify-center min-h-[300px] max-h-[70vh]">
          {file.type === 'image' ? (
            <img
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// Hook for managing preview state
// ============================================

import { useState, useCallback } from 'react'

export function useAssetPreview() {
  const [previewFile, setPreviewFile] = useState<AssetFile | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const openPreview = useCallback((file: AssetFile) => {
    setPreviewFile(file)
    setIsOpen(true)
  }, [])

  const closePreview = useCallback(() => {
    setIsOpen(false)
    // Delay clearing file to allow close animation
    setTimeout(() => setPreviewFile(null), 200)
  }, [])

  return {
    previewFile,
    isPreviewOpen: isOpen,
    openPreview,
    closePreview
  }
}
