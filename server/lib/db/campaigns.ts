import { db, generateId } from '../database.js';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  status: 'generating' | 'complete' | 'incomplete' | 'error' | 'cancelled';
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export function getCampaignsByUser(userId: string): Campaign[] {
  return db.prepare(`
    SELECT * FROM campaigns
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as Campaign[];
}

export function getCampaignById(id: string, userId: string): Campaign | undefined {
  return db.prepare(`
    SELECT * FROM campaigns
    WHERE id = ? AND user_id = ?
  `).get(id, userId) as Campaign | undefined;
}

export function getCampaignBySessionId(sessionId: string): Campaign | undefined {
  return db.prepare(`
    SELECT * FROM campaigns
    WHERE session_id = ?
  `).get(sessionId) as Campaign | undefined;
}

export function createCampaign(
  userId: string,
  name: string,
  sessionId?: string
): Campaign {
  const id = generateId('campaign');

  db.prepare(`
    INSERT INTO campaigns (id, user_id, name, status, session_id)
    VALUES (?, ?, ?, 'generating', ?)
  `).run(id, userId, name, sessionId ?? null);

  // Create empty files for research, hooks, prompts
  const insertFile = db.prepare(`
    INSERT INTO campaign_files (campaign_id, file_type)
    VALUES (?, ?)
  `);

  for (const fileType of ['research', 'hooks', 'prompts']) {
    insertFile.run(id, fileType);
  }

  return getCampaignById(id, userId)!;
}

export function updateCampaignStatus(
  id: string,
  status: Campaign['status']
): void {
  db.prepare(`
    UPDATE campaigns
    SET status = ?
    WHERE id = ?
  `).run(status, id);
}

export function updateCampaignSessionId(
  id: string,
  sessionId: string
): void {
  db.prepare(`
    UPDATE campaigns
    SET session_id = ?
    WHERE id = ?
  `).run(sessionId, id);
}

export function updateCampaignName(id: string, name: string): void {
  db.prepare(`
    UPDATE campaigns
    SET name = ?
    WHERE id = ?
  `).run(name, id);
}

export function deleteCampaign(id: string): void {
  db.prepare(`
    DELETE FROM campaigns
    WHERE id = ?
  `).run(id);
}

export function getRecentCampaigns(userId: string, limit = 10): Campaign[] {
  return db.prepare(`
    SELECT * FROM campaigns
    WHERE user_id = ?
    ORDER BY updated_at DESC
    LIMIT ?
  `).all(userId, limit) as Campaign[];
}
