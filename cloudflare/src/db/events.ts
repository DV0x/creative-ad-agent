import { generateId } from './utils.js';

export interface UserEvent {
  id: string;
  user_id: string;
  event_type: string;
  campaign_id: string | null;
  metadata: string | null;
  created_at: string;
}

export async function trackEvent(
  db: D1Database,
  userId: string,
  eventType: string,
  campaignId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const id = generateId('evt');
  await db.prepare(`
    INSERT INTO user_events (id, user_id, event_type, campaign_id, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    id,
    userId,
    eventType,
    campaignId || null,
    metadata ? JSON.stringify(metadata) : null,
  ).run();
}

export async function getEvents(
  db: D1Database,
  userId: string,
  eventType?: string,
  limit = 100,
): Promise<UserEvent[]> {
  if (eventType) {
    const result = await db.prepare(`
      SELECT * FROM user_events
      WHERE user_id = ? AND event_type = ?
      ORDER BY created_at DESC LIMIT ?
    `).bind(userId, eventType, limit).all<UserEvent>();
    return result.results;
  }
  const result = await db.prepare(`
    SELECT * FROM user_events
    WHERE user_id = ?
    ORDER BY created_at DESC LIMIT ?
  `).bind(userId, limit).all<UserEvent>();
  return result.results;
}
