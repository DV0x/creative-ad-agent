export type HookType = 'stat' | 'story' | 'fomo' | 'curiosity' | 'callout' | 'contrast';

export interface CampaignImage {
  id: number;
  campaign_id: string;
  image_index: number;
  hook_type: HookType;
  prompt: string | null;
  file_path: string;
  version: number;
  created_at: string;
}

export interface AddImageInput {
  campaignId: string;
  imageIndex: number;
  hookType: HookType;
  prompt?: string;
  filePath: string;
}

export async function getCampaignImages(db: D1Database, campaignId: string): Promise<CampaignImage[]> {
  const result = await db.prepare(`
    SELECT * FROM campaign_images
    WHERE campaign_id = ?
    ORDER BY image_index, version DESC
  `).bind(campaignId).all<CampaignImage>();
  return result.results;
}

export async function getLatestCampaignImages(db: D1Database, campaignId: string): Promise<CampaignImage[]> {
  const result = await db.prepare(`
    SELECT ci.*
    FROM campaign_images ci
    INNER JOIN (
      SELECT campaign_id, image_index, MAX(version) as max_version
      FROM campaign_images
      WHERE campaign_id = ?
      GROUP BY campaign_id, image_index
    ) latest ON ci.campaign_id = latest.campaign_id
      AND ci.image_index = latest.image_index
      AND ci.version = latest.max_version
    ORDER BY ci.image_index
  `).bind(campaignId).all<CampaignImage>();
  return result.results;
}

export async function addCampaignImage(db: D1Database, input: AddImageInput): Promise<CampaignImage> {
  const { campaignId, imageIndex, hookType, prompt, filePath } = input;

  // Dedup: if this exact file_path already exists for this campaign, return the existing row
  const dup = await db.prepare(`
    SELECT * FROM campaign_images WHERE campaign_id = ? AND file_path = ? LIMIT 1
  `).bind(campaignId, filePath).first<CampaignImage>();
  if (dup) return dup;

  const existing = await db.prepare(`
    SELECT MAX(version) as max_version
    FROM campaign_images
    WHERE campaign_id = ? AND image_index = ?
  `).bind(campaignId, imageIndex).first<{ max_version: number | null }>();

  const version = (existing?.max_version ?? 0) + 1;

  await db.prepare(`
    INSERT INTO campaign_images (campaign_id, image_index, hook_type, prompt, file_path, version)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(campaignId, imageIndex, hookType, prompt ?? null, filePath, version).run();

  return (await db.prepare(`
    SELECT * FROM campaign_images
    WHERE campaign_id = ? AND image_index = ? AND version = ?
  `).bind(campaignId, imageIndex, version).first<CampaignImage>())!;
}

export async function getImageCount(db: D1Database, campaignId: string): Promise<number> {
  const result = await db.prepare(`
    SELECT COUNT(DISTINCT image_index) as count
    FROM campaign_images
    WHERE campaign_id = ?
  `).bind(campaignId).first<{ count: number }>();
  return result?.count ?? 0;
}

export async function getMaxImageIndex(db: D1Database, campaignId: string): Promise<number> {
  const result = await db.prepare(`
    SELECT COALESCE(MAX(image_index), 0) as max_index
    FROM campaign_images
    WHERE campaign_id = ?
  `).bind(campaignId).first<{ max_index: number }>();
  return result?.max_index ?? 0;
}

export async function deleteImage(db: D1Database, imageId: number): Promise<void> {
  await db.prepare(`
    DELETE FROM campaign_images WHERE id = ?
  `).bind(imageId).run();
}
