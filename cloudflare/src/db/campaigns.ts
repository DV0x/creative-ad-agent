import { generateId } from './utils.js';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  status: 'generating' | 'complete' | 'incomplete' | 'error' | 'cancelled';
  session_id: string | null;
  sdk_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function getCampaignsByUser(db: D1Database, userId: string): Promise<Campaign[]> {
  const result = await db.prepare(`
    SELECT * FROM campaigns
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).bind(userId).all<Campaign>();
  return result.results;
}

export async function getCampaignById(db: D1Database, id: string, userId: string): Promise<Campaign | null> {
  return await db.prepare(`
    SELECT * FROM campaigns
    WHERE id = ? AND user_id = ?
  `).bind(id, userId).first<Campaign>();
}

export async function getCampaignBySessionId(db: D1Database, sessionId: string): Promise<Campaign | null> {
  return await db.prepare(`
    SELECT * FROM campaigns
    WHERE session_id = ?
  `).bind(sessionId).first<Campaign>();
}

export async function createCampaign(
  db: D1Database,
  userId: string,
  name: string,
  sessionId?: string,
  brand?: string
): Promise<Campaign> {
  const id = generateId('campaign');

  await db.batch([
    db.prepare(`
      INSERT INTO campaigns (id, user_id, name, status, session_id, brand)
      VALUES (?, ?, ?, 'generating', ?, ?)
    `).bind(id, userId, name, sessionId ?? null, brand ?? null),
    db.prepare(`INSERT INTO campaign_files (campaign_id, file_type) VALUES (?, 'research')`).bind(id),
    db.prepare(`INSERT INTO campaign_files (campaign_id, file_type) VALUES (?, 'hooks')`).bind(id),
    db.prepare(`INSERT INTO campaign_files (campaign_id, file_type) VALUES (?, 'prompts')`).bind(id),
  ]);

  return (await getCampaignById(db, id, userId))!;
}

export async function updateCampaignStatus(
  db: D1Database,
  id: string,
  status: Campaign['status']
): Promise<void> {
  await db.prepare(`
    UPDATE campaigns SET status = ? WHERE id = ?
  `).bind(status, id).run();
}

export async function updateCampaignSessionId(
  db: D1Database,
  id: string,
  sessionId: string
): Promise<void> {
  await db.prepare(`
    UPDATE campaigns SET session_id = ? WHERE id = ?
  `).bind(sessionId, id).run();
}

export async function updateCampaignName(db: D1Database, id: string, name: string): Promise<void> {
  await db.prepare(`
    UPDATE campaigns SET name = ? WHERE id = ?
  `).bind(name, id).run();
}

export async function updateCampaignBrand(db: D1Database, id: string, brand: string): Promise<void> {
  await db.prepare(`
    UPDATE campaigns SET brand = ? WHERE id = ?
  `).bind(brand, id).run();
}

export async function deleteCampaign(db: D1Database, id: string): Promise<void> {
  await db.prepare(`
    DELETE FROM campaigns WHERE id = ?
  `).bind(id).run();
}

export async function updateSdkSessionId(db: D1Database, campaignId: string, sdkSessionId: string): Promise<void> {
  await db.prepare(`
    UPDATE campaigns SET sdk_session_id = ? WHERE id = ?
  `).bind(sdkSessionId, campaignId).run();
}

export async function getSdkSessionId(db: D1Database, campaignId: string): Promise<string | null> {
  const row = await db.prepare(`
    SELECT sdk_session_id FROM campaigns WHERE id = ?
  `).bind(campaignId).first<{ sdk_session_id: string | null }>();
  return row?.sdk_session_id ?? null;
}

export async function getRecentCampaigns(db: D1Database, userId: string, limit = 10): Promise<Campaign[]> {
  const result = await db.prepare(`
    SELECT * FROM campaigns
    WHERE user_id = ?
    ORDER BY updated_at DESC
    LIMIT ?
  `).bind(userId, limit).all<Campaign>();
  return result.results;
}
