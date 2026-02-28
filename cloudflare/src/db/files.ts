export type FileType = 'research' | 'hooks' | 'prompts';

export interface CampaignFile {
  id: number;
  campaign_id: string;
  file_type: FileType;
  content: string;
  is_ready: number;
  updated_at: string;
}

export async function getCampaignFiles(db: D1Database, campaignId: string): Promise<CampaignFile[]> {
  const result = await db.prepare(`
    SELECT * FROM campaign_files
    WHERE campaign_id = ?
    ORDER BY file_type
  `).bind(campaignId).all<CampaignFile>();
  return result.results;
}

export async function getCampaignFile(
  db: D1Database,
  campaignId: string,
  fileType: FileType
): Promise<CampaignFile | null> {
  return await db.prepare(`
    SELECT * FROM campaign_files
    WHERE campaign_id = ? AND file_type = ?
  `).bind(campaignId, fileType).first<CampaignFile>();
}

export async function updateCampaignFile(
  db: D1Database,
  campaignId: string,
  fileType: FileType,
  content: string
): Promise<void> {
  await db.prepare(`
    UPDATE campaign_files
    SET content = ?, is_ready = 1
    WHERE campaign_id = ? AND file_type = ?
  `).bind(content, campaignId, fileType).run();
}

export async function markFileReady(
  db: D1Database,
  campaignId: string,
  fileType: FileType
): Promise<void> {
  await db.prepare(`
    UPDATE campaign_files
    SET is_ready = 1
    WHERE campaign_id = ? AND file_type = ?
  `).bind(campaignId, fileType).run();
}

export async function areAllFilesReady(db: D1Database, campaignId: string): Promise<boolean> {
  const result = await db.prepare(`
    SELECT COUNT(*) as count FROM campaign_files
    WHERE campaign_id = ? AND is_ready = 0
  `).bind(campaignId).first<{ count: number }>();
  return (result?.count ?? 0) === 0;
}
