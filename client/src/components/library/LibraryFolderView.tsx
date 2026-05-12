import { useState, useRef, useCallback, useMemo } from 'react'
import {
  ArrowLeftIcon,
  UploadIcon,
  Trash2Icon,
  ImageIcon,
  FileIcon,
  CheckIcon,
  PlusIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  XIcon,
} from 'lucide-react'
import { AuthImage } from '@/components/AuthImage'
import { Button } from '@/components/ui/button'
import { useStore, type AssetFile } from '@/store'
import { assetsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { AssetLightbox } from './AssetLightbox'
import { useSidebars } from '@/components/layout/AppLayout'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_FILE_SIZE = 10 * 1024 * 1024

interface UploadJob {
  id: string
  name: string
  status: 'uploading' | 'error'
  error?: string
}

const EMPTY_REFS: string[] = []

const CHROME_PILL: React.CSSProperties = {
  backgroundColor: 'rgba(35, 31, 32, 0.72)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
}

export function LibraryFolderView() {
  const selectedFolderId = useStore((s) => s.selectedFolderId)
  const assetFolders = useStore((s) => s.assetFolders)
  const addFileToFolder = useStore((s) => s.addFileToFolder)
  const setWorkspaceView = useStore((s) => s.setWorkspaceView)
  const activeCampaignId = useStore((s) => s.activeCampaignId)
  const activeRefsRaw = useStore((s) =>
    activeCampaignId ? s.activeReferencesByCampaign[activeCampaignId] : undefined,
  )
  const activeRefs = activeRefsRaw ?? EMPTY_REFS
  const addReference = useStore((s) => s.addReference)
  const removeReference = useStore((s) => s.removeReference)
  const pendingReferences = useStore((s) => s.pendingReferences)
  const togglePendingReference = useStore((s) => s.togglePendingReference)
  const setIsCreatingCampaign = useStore((s) => s.setIsCreatingCampaign)
  const setSourceCampaign = useStore((s) => s.setSourceCampaign)
  const deleteFileAsync = useStore((s) => s.deleteFileAsync)

  const folder = useMemo(
    () => assetFolders.find((f) => f.id === selectedFolderId) ?? null,
    [assetFolders, selectedFolderId],
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([])
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  const [previewIndex, setPreviewIndex] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleBack = () => setWorkspaceView('campaign')

  const uploadOne = useCallback(
    async (file: File, folderId: string) => {
      const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setUploadJobs((prev) => [...prev, { id: jobId, name: file.name, status: 'uploading' }])
      try {
        const assetFile = await assetsApi.uploadFile(file, folderId)
        addFileToFolder(folderId, assetFile)
        setUploadJobs((prev) => prev.filter((j) => j.id !== jobId))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed'
        setUploadJobs((prev) =>
          prev.map((j) =>
            j.id === jobId ? { ...j, status: 'error', error: message } : j,
          ),
        )
      }
    },
    [addFileToFolder],
  )

  const processFiles = useCallback(
    (incoming: FileList | File[]) => {
      if (!folder) return
      setErrorBanner(null)
      const errors: string[] = []
      const accepted: File[] = []
      for (const file of Array.from(incoming)) {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          errors.push(`${file.name}: unsupported type`)
          continue
        }
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: too large (max 10MB)`)
          continue
        }
        accepted.push(file)
      }
      if (errors.length > 0) setErrorBanner(errors.join(' · '))
      for (const file of accepted) uploadOne(file, folder.id)
    },
    [folder, uploadOne],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
      e.target.value = ''
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files)
  }

  const toggleReference = (file: AssetFile) => {
    if (activeCampaignId) {
      if (activeRefs.includes(file.id)) {
        removeReference(activeCampaignId, file.id)
      } else {
        addReference(activeCampaignId, file.id)
      }
    } else {
      togglePendingReference(file)
    }
  }

  const isFileReference = (fileId: string) =>
    activeCampaignId
      ? activeRefs.includes(fileId)
      : pendingReferences.some((f) => f.id === fileId)

  const pendingCount = pendingReferences.length
  const showContinueCTA = !activeCampaignId && pendingCount > 0

  const { setRightOpen, setMobileDrawerOpen } = useSidebars()
  const handleContinue = () => {
    setSourceCampaign(null)
    setIsCreatingCampaign(true)
    setWorkspaceView('campaign')
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileDrawerOpen(true)
    } else {
      setRightOpen(true)
    }
  }

  const openPreviewAt = (file: AssetFile) => {
    if (!folder) return
    const idx = folder.files.findIndex((f) => f.id === file.id)
    setPreviewIndex(Math.max(idx, 0))
    setIsPreviewOpen(true)
  }

  if (!folder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
        <p className="text-sm">No folder selected.</p>
        <button
          onClick={handleBack}
          className="mt-3 text-xs text-accent hover:text-accent-hover"
        >
          Back to workspace
        </button>
      </div>
    )
  }

  const isEmpty = folder.files.length === 0

  return (
    <div
      className="relative flex-1 flex flex-col h-full overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {showContinueCTA ? (
            <button
              onClick={handleContinue}
              className="shrink-0 inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors"
              title={`Continue with ${pendingCount} reference${pendingCount === 1 ? '' : 's'}`}
            >
              <ArrowRightIcon className="w-3.5 h-3.5" />
              Continue with {pendingCount} reference{pendingCount === 1 ? '' : 's'}
            </button>
          ) : (
            <button
              onClick={handleBack}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
              title="Back to workspace"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <h1
              className="text-lg font-semibold text-text-primary truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {folder.name}
            </h1>
            <p className="text-xs text-text-muted">
              {folder.files.length} {folder.files.length === 1 ? 'file' : 'files'}
            </p>
          </div>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} size="sm" className="shrink-0">
          <UploadIcon className="w-4 h-4" />
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Upload + error banners */}
      {(uploadJobs.length > 0 || errorBanner) && (
        <div className="shrink-0 px-6 py-2 space-y-1.5 border-b border-border bg-bg-raised-2">
          {uploadJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center gap-2 text-xs text-text-secondary"
            >
              {job.status === 'uploading' ? (
                <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <AlertCircleIcon className="w-3 h-3 text-error shrink-0" />
              )}
              <span className="truncate flex-1">{job.name}</span>
              <span className="text-text-muted">
                {job.status === 'uploading' ? 'Uploading…' : job.error || 'Failed'}
              </span>
              {job.status === 'error' && (
                <button
                  onClick={() => setUploadJobs((prev) => prev.filter((j) => j.id !== job.id))}
                  className="text-text-muted hover:text-text-primary"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {errorBanner && (
            <div className="flex items-center gap-2 text-xs text-error">
              <AlertCircleIcon className="w-3 h-3 shrink-0" />
              <span className="flex-1 truncate">{errorBanner}</span>
              <button
                onClick={() => setErrorBanner(null)}
                className="text-error/70 hover:text-error"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {isEmpty ? (
          <EmptyDropZone onPickFiles={() => fileInputRef.current?.click()} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {folder.files.map((file, i) => (
              <FileTile
                key={file.id}
                file={file}
                index={i}
                isReference={isFileReference(file.id)}
                onView={() => openPreviewAt(file)}
                onToggleReference={() => toggleReference(file)}
                onDelete={() => deleteFileAsync(file.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drag overlay */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-accent/8 border-2 border-dashed border-accent rounded-md m-2">
          <div className="text-accent flex flex-col items-center gap-2">
            <UploadIcon className="w-10 h-10" />
            <span className="text-sm font-semibold">Drop to upload to {folder.name}</span>
          </div>
        </div>
      )}

      {/* Lightbox preview */}
      <AssetLightbox
        files={folder.files}
        currentIndex={previewIndex}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onNavigate={setPreviewIndex}
        onDelete={(f) => deleteFileAsync(f.id)}
        isReference={(f) => isFileReference(f.id)}
        onToggleReference={(f) => toggleReference(f)}
      />
    </div>
  )
}

// ============================================
// File tile — matches ImageCard chrome: thumbnail-only, info on hover
// ============================================

interface FileTileProps {
  file: AssetFile
  index: number
  isReference: boolean
  onView: () => void
  onToggleReference: () => void
  onDelete: () => void
}

function FileTile({
  file,
  index,
  isReference,
  onView,
  onToggleReference,
  onDelete,
}: FileTileProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    onView()
  }

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden bg-bg-raised cursor-pointer animate-fadeIn transition-shadow duration-200',
        isReference && 'ring-2 ring-accent ring-offset-2 ring-offset-bg-base',
      )}
      style={{
        animationDelay: `${index * 60}ms`,
        boxShadow: isReference
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
        {!isImageLoaded && file.type === 'image' && file.url && (
          <div className="absolute inset-0 skeleton" />
        )}

        {file.type === 'image' && file.url ? (
          <AuthImage
            src={file.url}
            alt={file.name}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              isImageLoaded ? 'opacity-100' : 'opacity-0',
            )}
            onLoad={() => setIsImageLoaded(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-elevated">
            {file.type === 'image' ? (
              <ImageIcon className="w-10 h-10 text-text-muted" />
            ) : (
              <FileIcon className="w-10 h-10 text-text-muted" />
            )}
          </div>
        )}

        {/* Persistent Reference badge — top-left */}
        {isReference && (
          <div className="absolute top-3 left-3 pointer-events-none">
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] tracking-tight text-white"
              style={{ backgroundColor: 'rgba(120, 40, 74, 0.85)', backdropFilter: 'blur(6px)' }}
            >
              <CheckIcon className="w-3 h-3" />
              Reference
            </span>
          </div>
        )}

        {/* Hover: filename pill — top-right */}
        <div
          className={cn(
            'absolute top-3 right-3 transition-opacity duration-150 pointer-events-none max-w-[70%]',
            isHovered ? 'opacity-100' : 'opacity-0',
          )}
        >
          <span
            className="px-2 py-1 rounded-md text-[11px] tracking-tight text-white truncate block"
            style={CHROME_PILL}
            title={file.name}
          >
            {file.name}
          </span>
        </div>

        {/* Hover: action buttons — bottom row */}
        <div
          className={cn(
            'absolute left-3 right-3 bottom-3 flex items-center justify-between gap-2 transition-opacity duration-150',
            isHovered ? 'opacity-100' : 'opacity-0',
          )}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleReference()
            }}
            className={cn(
              'h-8 px-3 rounded-full flex items-center gap-1.5 text-[11px] tracking-tight text-white transition-transform duration-150 hover:scale-105 active:scale-95',
            )}
            style={
              isReference
                ? { backgroundColor: 'rgba(120, 40, 74, 0.9)', backdropFilter: 'blur(6px)' }
                : CHROME_PILL
            }
            title={isReference ? 'Remove from chat' : 'Add to chat'}
          >
            {isReference ? (
              <>
                <CheckIcon className="w-3.5 h-3.5" />
                In chat
              </>
            ) : (
              <>
                <PlusIcon className="w-3.5 h-3.5" />
                Add to chat
              </>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform duration-150 hover:scale-110 active:scale-95"
            style={CHROME_PILL}
            title="Delete file"
          >
            <Trash2Icon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Empty state
// ============================================

function EmptyDropZone({ onPickFiles }: { onPickFiles: () => void }) {
  return (
    <div className="h-full min-h-[24rem] flex items-center justify-center">
      <button
        onClick={onPickFiles}
        className="flex flex-col items-center gap-3 px-12 py-16 rounded-xl border-2 border-dashed border-border hover:border-accent/60 hover:bg-bg-elevated transition-colors text-center"
      >
        <div className="w-14 h-14 rounded-full bg-bg-elevated flex items-center justify-center">
          <UploadIcon className="w-6 h-6 text-text-muted" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">Drop files here</p>
          <p className="text-xs text-text-muted mt-1">
            or click to browse · PNG, JPG, GIF, WebP up to 10MB
          </p>
        </div>
      </button>
    </div>
  )
}
