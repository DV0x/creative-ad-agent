/**
 * Client observability helpers — Sentry breadcrumbs + scope tagging.
 *
 * Breadcrumbs are kept in-memory by Sentry (last 100) and auto-attached
 * to the next captured event. They never ship on their own — so they're
 * effectively free until something goes wrong, then they give us the full
 * autopsy trail of what happened just before.
 */

import * as Sentry from '@sentry/react';

/**
 * Log a breadcrumb to Sentry AND mirror to console for live debugging.
 *
 * Use for high-signal lifecycle events: WS connect/close, inbound message
 * types, store mutations that matter, navigation, etc.
 */
export function crumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  Sentry.addBreadcrumb({ category, message, level: 'info', data });
  // Console mirror keeps existing local-debugging UX intact
  if (data) {
    console.log(`[${category}] ${message}`, data);
  } else {
    console.log(`[${category}] ${message}`);
  }
}

/**
 * Set the active campaign/session/message tags on the Sentry scope so
 * every subsequent capture from this client carries them. Call from the
 * store whenever the active campaign or generating message changes.
 *
 * Pass null/undefined to clear a tag.
 */
export function setSentryContext(ctx: {
  campaignId?: string | null;
  sessionId?: string | null;
  messageId?: string | null;
}): void {
  if ('campaignId' in ctx) {
    Sentry.setTag('campaignId', ctx.campaignId ?? undefined);
  }
  if ('sessionId' in ctx) {
    Sentry.setTag('sessionId', ctx.sessionId ?? undefined);
  }
  if ('messageId' in ctx) {
    Sentry.setTag('messageId', ctx.messageId ?? undefined);
  }
}
