import { X, Image as ImageIcon } from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

interface ReferenceChipStripProps {
  campaignId: string
  className?: string
}

// Stable reference for the empty case — returning a new [] from the selector on
// every render triggers React's update-depth-exceeded loop (zustand default
// equality is Object.is).
const EMPTY_IDS: string[] = []

/**
 * Persistent (sticky) reference image chips for the active campaign.
 *
 * Display + remove only — selection happens via @mention in ChatInput.
 * Empty state renders nothing. Files no longer in the asset library skip silently
 * (server-side cascade-delete will eventually clean these up; client renders the
 * remaining valid ones in the meantime).
 */
export function ReferenceChipStrip({ campaignId, className }: ReferenceChipStripProps) {
  const activeIds = useStore((s) => s.activeReferencesByCampaign[campaignId]) ?? EMPTY_IDS
  const assetFolders = useStore((s) => s.assetFolders)
  const removeReference = useStore((s) => s.removeReference)

  if (activeIds.length === 0) return null

  // Flat lookup across all folders the user owns.
  const lookup = new Map<string, { name: string; thumbnailUrl?: string }>()
  for (const folder of assetFolders) {
    for (const file of folder.files) {
      lookup.set(file.id, {
        name: file.name,
        thumbnailUrl: file.thumbnailUrl ?? file.url,
      })
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5 mb-2', className)}>
      {activeIds.map((fileId) => {
        const meta = lookup.get(fileId)
        if (!meta) return null  // file deleted from library — skip silently
        return (
          <span
            key={fileId}
            className="inline-flex items-center gap-1.5 pl-1 pr-1 py-0.5 rounded-full text-[11px] font-mono tracking-tight border transition-colors duration-150"
            style={{
              borderColor: 'rgba(120, 40, 74, 0.18)',
              backgroundColor: 'var(--color-bg-base)',
              color: 'var(--color-text-primary)',
            }}
          >
            {meta.thumbnailUrl ? (
              <img
                src={meta.thumbnailUrl}
                alt={meta.name}
                className="w-4 h-4 rounded-full object-cover shrink-0"
              />
            ) : (
              <ImageIcon className="w-3 h-3 ml-1 text-text-muted" />
            )}
            <span className="truncate max-w-[12rem]">{meta.name}</span>
            <button
              type="button"
              onClick={() => removeReference(campaignId, fileId)}
              className="ml-0.5 p-0.5 rounded-full text-text-muted hover:text-text-primary hover:bg-black/[0.06] transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              aria-label={`Remove ${meta.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )
      })}
    </div>
  )
}
