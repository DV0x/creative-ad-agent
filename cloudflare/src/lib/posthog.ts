// Server-side PostHog capture for the Worker.
// The only place real payment events exist: checkout completes on Dodo's hosted
// page and confirms via webhook → here. The browser never sees it, so the
// payment leg of the funnel must be captured server-side.
//
// distinct_id is the Clerk user_id — the same id the client passes to
// posthog.identify() — so server events unify onto the same person.

import type { Env } from '../env.js';

const DEFAULT_HOST = 'https://us.i.posthog.com';

export async function capturePostHog(
  env: Env,
  params: { event: string; distinctId: string; properties?: Record<string, unknown> },
): Promise<void> {
  const key = env.POSTHOG_KEY;
  // No key → analytics off (local dev, or not configured). Never throw.
  if (!key) return;
  const host = env.POSTHOG_HOST || DEFAULT_HOST;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      await fetch(`${host}/capture/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: key,
          event: params.event,
          distinct_id: params.distinctId,
          properties: {
            ...params.properties,
            // Split one PostHog project across envs (mirrors the client super-property).
            environment: env.SENTRY_ENVIRONMENT,
            $lib: 'creative-agent-worker',
          },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Best-effort telemetry — a slow/down PostHog must never break the webhook.
  }
}
