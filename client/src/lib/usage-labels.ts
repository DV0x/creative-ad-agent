// User-facing labels for usage_log event_type values.
// Keep small — only the values written by recordUsage callers (see
// cloudflare/src/durable-objects/campaign-session.ts and
// server/lib/websocket-handler.ts).
export const EVENT_TYPE_LABELS: Record<string, string> = {
  generation: 'Campaign generation',
  follow_up: 'Follow-up',
  cancelled: 'Cancelled',
};

export function labelForEventType(t: string): string {
  return EVENT_TYPE_LABELS[t] ?? 'Activity';
}

// LEFT JOIN against campaigns can return null for rows whose campaign was
// deleted (no FK cascade on usage_log). Surface this honestly so beta-client
// totals reconcile — hiding orphans would break "this month: X credits".
export function labelForCampaignName(name: string | null): string {
  return name ?? 'Deleted campaign';
}
