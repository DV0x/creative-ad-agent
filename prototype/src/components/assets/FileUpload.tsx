import { useState, useRef, useCallback } from 'react'
import { UploadIcon, XIcon, FileIcon, AlertCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  className?: string
}

interface UploadFile {
  file: File
  preview: string
  name: string
  size: number
  type: 'image' | 'document' | 'other'
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function getFileType(mimeType: string): 'image' | 'document' | 'other' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document'
  return 'other'
}

export function FileUpload({ className }: FileUploadProps) {
  const { assetFolders, selectedFolderId, addFileToFolder, addFolder, setSelectedFolderId } = useStore()

  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Set target folder when dialog opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setTargetFolderId(selectedFolderId || (assetFolders[0]?.id ?? null))
      setFiles([])
      setError(null)
    }
  }

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: UploadFile[] = []
    const errors: string[] = []

    Array.from(fileList).forEach(file => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 10MB)`)
        return
      }

      // Only accept images for now
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Unsupported file type`)
        return
      }

      const preview = URL.createObjectURL(file)
      newFiles.push({
        file,
        preview,
        name: file.name,
        size: file.size,
        type: getFileType(file.type)
      })
    })

    if (errors.length > 0) {
      setError(errors.join('\n'))
    }

    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set dragging false if leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles)
    }
  }, [processFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }, [processFiles])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }, [])

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return

    // If no target folder, create "Uploads" folder
    let folderId = targetFolderId
    if (!folderId) {
      addFolder('Uploads')
      // Get the newly created folder
      const folders = useStore.getState().assetFolders
      folderId = folders[folders.length - 1]?.id
      if (folderId) {
        setSelectedFolderId(folderId)
      }
    }

    if (!folderId) {
      setError('No folder selected')
      return
    }

    // Add files to folder
    for (const uploadFile of files) {
      addFileToFolder(folderId, {
        name: uploadFile.name,
        url: uploadFile.preview, // Using object URL for demo (in real app, would upload to server)
        type: uploadFile.type,
        size: uploadFile.size
      })
    }

    // Clean up and close
    setFiles([])
    setIsOpen(false)
  }, [files, targetFolderId, addFileToFolder, addFolder, setSelectedFolderId])

  return (
    <>
      <Button
        variant="outline"
        className={cn('w-full', className)}
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <UploadIcon className="w-4 h-4" />
        Upload Files
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Upload images to your asset library. Drag & drop or click to browse.
            </DialogDescription>
          </DialogHeader>

          {/* Drop zone */}
          <div
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragging
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-accent/50 hover:bg-bg-elevated'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            <UploadIcon className={cn(
              'w-10 h-10 mx-auto mb-3',
              isDragging ? 'text-accent' : 'text-text-muted'
            )} />

            <p className="text-sm text-text-secondary mb-1">
              {isDragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-text-muted">
              or click to browse
            </p>
            <p className="text-xs text-text-muted mt-2">
              PNG, JPG, GIF, WebP, SVG up to 10MB
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 text-error text-sm">
              <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="whitespace-pre-line">{error}</p>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setError(null)}
                className="ml-auto shrink-0 text-error hover:text-error"
              >
                <XIcon className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* File previews */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-text-muted">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </p>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-lg overflow-hidden bg-bg-elevated"
                  >
                    {file.type === 'image' ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileIcon className="w-8 h-8 text-text-muted" />
                      </div>
                    )}

                    {/* Overlay with name and remove button */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index)
                        }}
                        className="self-end h-5 w-5 bg-black/50 hover:bg-black/70 text-white"
                      >
                        <XIcon className="w-3 h-3" />
                      </Button>
                      <div className="text-white text-[10px] truncate">
                        {file.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target folder selector */}
          {files.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-text-muted">Upload to folder:</label>
              <div className="flex flex-wrap gap-1.5">
                {assetFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setTargetFolderId(folder.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs transition-colors',
                      targetFolderId === folder.id
                        ? 'bg-accent text-white'
                        : 'bg-bg-elevated text-text-secondary hover:bg-bg-elevated/80'
                    )}
                  >
                    {folder.name}
                  </button>
                ))}
                {assetFolders.length === 0 && (
                  <span className="text-xs text-text-muted">
                    New "Uploads" folder will be created
                  </span>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0}
            >
              <UploadIcon className="w-4 h-4" />
              Upload {files.length > 0 && `(${files.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
