import { db } from '../database.js';

export type FileType = 'research' | 'hooks' | 'prompts';

export interface CampaignFile {
  id: number;
  campaign_id: string;
  file_type: FileType;
  content: string;
  is_ready: number;
  updated_at: string;
}

export function getCampaignFiles(campaignId: string): CampaignFile[] {
  return db.prepare(`
    SELECT * FROM campaign_files
    WHERE campaign_id = ?
    ORDER BY file_type
  `).all(campaignId) as CampaignFile[];
}

export function getCampaignFile(
  campaignId: string,
  fileType: FileType
): CampaignFile | undefined {
  return db.prepare(`
    SELECT * FROM campaign_files
    WHERE campaign_id = ? AND file_type = ?
  `).get(campaignId, fileType) as CampaignFile | undefined;
}

export function updateCampaignFile(
  campaignId: string,
  fileType: FileType,
  content: string
): void {
  db.prepare(`
    UPDATE campaign_files
    SET content = ?, is_ready = 1
    WHERE campaign_id = ? AND file_type = ?
  `).run(content, campaignId, fileType);
}

export function markFileReady(
  campaignId: string,
  fileType: FileType
): void {
  db.prepare(`
    UPDATE campaign_files
    SET is_ready = 1
    WHERE campaign_id = ? AND file_type = ?
  `).run(campaignId, fileType);
}

export function areAllFilesReady(campaignId: string): boolean {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM campaign_files
    WHERE campaign_id = ? AND is_ready = 0
  `).get(campaignId) as { count: number };

  return result.count === 0;
}
