import { db, generateId } from '../database.js';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  status: 'generating' | 'complete' | 'incomplete' | 'error' | 'cancelled';
  session_id: string | null;
  sdk_session_id: string | null;
  active_reference_file_ids: string | null;
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
  sessionId?: string,
  brand?: string
): Campaign {
  const id = generateId('campaign');

  db.prepare(`
    INSERT INTO campaigns (id, user_id, name, status, session_id, brand)
    VALUES (?, ?, ?, 'generating', ?, ?)
  `).run(id, userId, name, sessionId ?? null, brand ?? null);

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

export function updateSdkSessionId(campaignId: string, sdkSessionId: string): void {
  db.prepare('UPDATE campaigns SET sdk_session_id = ? WHERE id = ?').run(sdkSessionId, campaignId);
}

export function getSdkSessionId(campaignId: string): string | null {
  const row = db.prepare('SELECT sdk_session_id FROM campaigns WHERE id = ?').get(campaignId) as any;
  return row?.sdk_session_id || null;
}

export function getRecentCampaigns(userId: string, limit = 10): Campaign[] {
  return db.prepare(`
    SELECT * FROM campaigns
    WHERE user_id = ?
    ORDER BY updated_at DESC
    LIMIT ?
  `).all(userId, limit) as Campaign[];
}

/** Returns the array of asset_files.id values currently active for this campaign. */
export function getActiveReferences(campaignId: string): string[] {
  const row = db.prepare(`
    SELECT active_reference_file_ids FROM campaigns WHERE id = ?
  `).get(campaignId) as { active_reference_file_ids: string | null } | undefined;
  if (!row?.active_reference_file_ids) return [];
  try {
    const parsed = JSON.parse(row.active_reference_file_ids);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Replaces the active reference set for this campaign. Pass [] to clear. */
export function setActiveReferences(campaignId: string, fileIds: string[]): void {
  db.prepare(`
    UPDATE campaigns SET active_reference_file_ids = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(JSON.stringify(fileIds), campaignId);
}

/** Removes a fileId from every campaign's active_reference_file_ids array.
 *  Returns the list of campaign IDs that were affected. */
export function removeFileFromAllCampaigns(userId: string, fileId: string): string[] {
  const rows = db.prepare(`
    SELECT id, active_reference_file_ids FROM campaigns
    WHERE user_id = ? AND active_reference_file_ids LIKE ?
  `).all(userId, `%"${fileId}"%`) as Array<{ id: string; active_reference_file_ids: string }>;

  const update = db.prepare(`
    UPDATE campaigns SET active_reference_file_ids = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  const affected: string[] = [];
  for (const row of rows) {
    try {
      const arr = JSON.parse(row.active_reference_file_ids) as string[];
      if (!Array.isArray(arr)) continue;
      const filtered = arr.filter((id) => id !== fileId);
      if (filtered.length !== arr.length) {
        update.run(JSON.stringify(filtered), row.id);
        affected.push(row.id);
      }
    } catch { /* malformed JSON — skip */ }
  }
  return affected;
}
