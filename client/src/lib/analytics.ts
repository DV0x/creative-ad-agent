import posthog from 'posthog-js'

// Safe PostHog event capture. No-ops when PostHog isn't initialized — local dev,
// missing/placeholder key, or before init() runs — so analytics can never break a
// flow. Mirrors the crumb() breadcrumb helper in observability.ts: terse call
// sites, all the safety in one place.
//
// Custom events complement autocapture: autocapture sees DOM clicks, but the
// outcomes that matter for funnels (did generation succeed? did checkout start?)
// arrive async over WebSocket / after a redirect, which autocapture is blind to.
export function track(event: string, props?: Record<string, unknown>): void {
  try {
    // __loaded is set by posthog.init(); guarding on it avoids the "You must
    // initialize PostHog" warning in dev where init is intentionally skipped.
    if ((posthog as unknown as { __loaded?: boolean }).__loaded) {
      posthog.capture(event, props)
    }
  } catch {
    // Analytics is best-effort — never throw into the caller.
  }
}
