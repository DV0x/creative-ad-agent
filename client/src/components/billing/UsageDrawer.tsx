import * as React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore } from '@/store'
import { creditsApi, type ApiUsageEntry, type ApiUsageSummary } from '@/lib/api'
import { labelForEventType, labelForCampaignName } from '@/lib/usage-labels'

const PAGE_SIZE = 20

// First day of the current calendar month, ISO date (YYYY-MM-DD).
// The summary endpoint compares against `usage_log.created_at` which is
// stored as `'YYYY-MM-DD HH:MM:SS'` — date-only ISO is a valid string-prefix
// comparison since SQLite uses lexicographic order on TEXT.
function firstOfMonthISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatDate(iso: string): string {
  // usage_log.created_at = "YYYY-MM-DD HH:MM:SS" — parse with fallback.
  const d = new Date(iso.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatCredits(n: number): string {
  // Match CreditBadge: hide trailing .0 for whole-number charges.
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

function monthLabel(): string {
  const d = new Date()
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function UsageDrawer() {
  const open = useStore(s => s.usageDrawerOpen)
  const closeUsageDrawer = useStore(s => s.closeUsageDrawer)
  const balance = useStore(s => s.creditBalance)

  const [entries, setEntries] = React.useState<ApiUsageEntry[]>([])
  const [summary, setSummary] = React.useState<ApiUsageSummary | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [hasMore, setHasMore] = React.useState(true)

  const sinceRef = React.useRef<string>(firstOfMonthISO())

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usageResp, summaryResp] = await Promise.all([
        creditsApi.getUsage(PAGE_SIZE, 0),
        creditsApi.getUsageSummary(sinceRef.current),
      ])
      setEntries(usageResp.usage)
      setSummary(summaryResp)
      setHasMore(usageResp.usage.length === PAGE_SIZE)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load usage')
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh every time the drawer opens — credit history is live and beta
  // clients will open it right after a generation finishes. Stale data
  // would defeat the point.
  React.useEffect(() => {
    if (open) {
      sinceRef.current = firstOfMonthISO()
      void load()
    }
  }, [open, load])

  const loadMore = React.useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const resp = await creditsApi.getUsage(PAGE_SIZE, entries.length)
      setEntries(prev => [...prev, ...resp.usage])
      setHasMore(resp.usage.length === PAGE_SIZE)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load more')
    } finally {
      setLoadingMore(false)
    }
  }, [entries.length, hasMore, loadingMore])

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeUsageDrawer()}>
      <SheetContent
        side="right"
        className="!max-w-[480px] sm:!max-w-[480px] w-full bg-bg-base p-0 flex flex-col gap-0"
      >
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="text-base font-semibold text-text-primary">Usage</SheetTitle>
        </SheetHeader>

        {/* Summary card */}
        <div className="px-5 py-4 border-b border-border">
          <div className="rounded-lg bg-bg-elevated border border-border p-4">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <span className="text-[11px] uppercase tracking-wide text-text-muted">Balance</span>
              <span className="text-2xl font-semibold tabular-nums text-text-primary">
                {balance !== null ? formatCredits(balance) : '—'}
                <span className="text-xs font-normal text-text-muted ml-1.5">credits</span>
              </span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] uppercase tracking-wide text-text-muted">{monthLabel()}</span>
                <div className="text-right">
                  <span className="text-base font-semibold tabular-nums text-text-primary">
                    {summary ? formatCredits(summary.totalCredits) : '—'}
                  </span>
                  <span className="text-xs font-normal text-text-muted ml-1.5">credits</span>
                </div>
              </div>
              {summary && summary.campaignCount > 0 && (
                <div className="text-[11px] text-text-muted mt-1 text-right">
                  across {summary.campaignCount} {summary.campaignCount === 1 ? 'campaign' : 'campaigns'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="px-5 pt-4 pb-2 flex items-baseline justify-between">
          <h3 className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Recent activity</h3>
          {summary && summary.entryCount > 0 && (
            <span className="text-[11px] text-text-muted tabular-nums">
              {summary.entryCount} this month
            </span>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 pb-5">
            {loading && entries.length === 0 ? (
              <ActivitySkeletons />
            ) : error ? (
              <ErrorState message={error} onRetry={load} />
            ) : entries.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="divide-y divide-border">
                {entries.map(entry => (
                  <UsageRow key={entry.id} entry={entry} />
                ))}
                {hasMore && (
                  <li className="pt-3">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="w-full text-center text-xs text-text-muted hover:text-text-primary py-2 transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading…' : 'Show more'}
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function UsageRow({ entry }: { entry: ApiUsageEntry }) {
  const campaignLabel = labelForCampaignName(entry.campaign_name)
  const eventLabel = labelForEventType(entry.event_type)

  return (
    <li className="py-2.5 flex items-baseline justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-text-primary truncate" title={campaignLabel}>
          {campaignLabel}
        </div>
        <div className="text-[11px] text-text-muted mt-0.5">
          {formatDate(entry.created_at)} · {eventLabel}
          {entry.image_count > 0 && ` · ${entry.image_count} ${entry.image_count === 1 ? 'image' : 'images'}`}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-[13px] font-medium tabular-nums text-text-primary">
          {formatCredits(entry.credits_charged)}
        </span>
        <span className="text-[11px] text-text-muted ml-1">credits</span>
      </div>
    </li>
  )
}

function ActivitySkeletons() {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="py-3">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-3.5 w-2/3 mb-1.5" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
            <Skeleton className="h-3.5 w-12 shrink-0" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-[13px] text-text-primary mb-1">No activity yet</div>
      <div className="text-[11px] text-text-muted">
        Generate a campaign and your credit usage will show up here.
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-[13px] text-text-primary mb-1">Couldn’t load usage</div>
      <div className="text-[11px] text-text-muted mb-4">{message}</div>
      <button
        onClick={onRetry}
        className="text-xs text-accent hover:underline"
      >
        Try again
      </button>
    </div>
  )
}
