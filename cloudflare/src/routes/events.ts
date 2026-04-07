import type { Env } from '../env.js';
import * as events from '../db/events.js';

export async function handleEventsRequest(
  request: Request,
  env: Env,
  userId: string,
  path: string,
  method: string,
): Promise<Response> {
  const sub = path.replace('/api/events', '');

  // POST /api/events — track an event
  if (sub === '' && method === 'POST') {
    const body = await request.json<{
      eventType: string;
      campaignId?: string;
      metadata?: Record<string, unknown>;
    }>();

    if (!body.eventType) {
      return Response.json({ error: 'eventType is required' }, { status: 400 });
    }

    await events.trackEvent(env.DB, userId, body.eventType, body.campaignId, body.metadata);
    return Response.json({ success: true });
  }

  return new Response('Not Found', { status: 404 });
}
