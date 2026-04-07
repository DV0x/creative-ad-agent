import { db, generateId } from '../database.js';

export interface UserEvent {
  id: string;
  user_id: string;
  event_type: string;
  campaign_id: string | null;
  metadata: string | null;
  created_at: string;
}

export function trackEvent(
  userId: string,
  eventType: string,
  campaignId?: string,
  metadata?: Record<string, unknown>,
): void {
  const id = generateId('evt');
  db.prepare(`
    INSERT INTO user_events (id, user_id, event_type, campaign_id, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, eventType, campaignId || null, metadata ? JSON.stringify(metadata) : null);
}

export function getEvents(
  userId: string,
  eventType?: string,
  limit = 100,
): UserEvent[] {
  if (eventType) {
    return db.prepare(`
      SELECT * FROM user_events
      WHERE user_id = ? AND event_type = ?
      ORDER BY created_at DESC LIMIT ?
    `).all(userId, eventType, limit) as UserEvent[];
  }
  return db.prepare(`
    SELECT * FROM user_events
    WHERE user_id = ?
    ORDER BY created_at DESC LIMIT ?
  `).all(userId, limit) as UserEvent[];
}
