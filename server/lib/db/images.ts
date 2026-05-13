import { db } from '../database.js';

// Freeform — agent declares per image. See cloudflare/src/lib/types.ts for canonical hints.
export type HookType = string;

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

export function getCampaignImages(campaignId: string): CampaignImage[] {
  return db.prepare(`
    SELECT * FROM campaign_images
    WHERE campaign_id = ?
    ORDER BY image_index, version DESC
  `).all(campaignId) as CampaignImage[];
}

export function getLatestCampaignImages(campaignId: string): CampaignImage[] {
  // Get only the latest version of each image_index
  return db.prepare(`
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
  `).all(campaignId) as CampaignImage[];
}

export function addCampaignImage(input: AddImageInput): CampaignImage {
  const { campaignId, imageIndex, hookType, prompt, filePath } = input;

  // Idempotency: same file_path already persisted? Return existing row.
  const dup = db.prepare(`
    SELECT * FROM campaign_images WHERE campaign_id = ? AND file_path = ? LIMIT 1
  `).get(campaignId, filePath) as CampaignImage | undefined;
  if (dup) return dup;

  const existing = db.prepare(`
    SELECT MAX(version) as max_version
    FROM campaign_images
    WHERE campaign_id = ? AND image_index = ?
  `).get(campaignId, imageIndex) as { max_version: number | null };

  const version = (existing?.max_version ?? 0) + 1;

  try {
    db.prepare(`
      INSERT INTO campaign_images (campaign_id, image_index, hook_type, prompt, file_path, version)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(campaignId, imageIndex, hookType, prompt ?? null, filePath, version);
  } catch (err: any) {
    // Lost a race against a concurrent insert at the same (campaign_id, image_index, version).
    // Re-read to return whichever row landed.
    if (String(err?.code || err?.message || '').includes('UNIQUE')) {
      const winner = db.prepare(`
        SELECT * FROM campaign_images
        WHERE campaign_id = ? AND image_index = ? AND version = ?
      `).get(campaignId, imageIndex, version) as CampaignImage | undefined;
      if (winner) return winner;
    }
    throw err;
  }

  return db.prepare(`
    SELECT * FROM campaign_images
    WHERE campaign_id = ? AND image_index = ? AND version = ?
  `).get(campaignId, imageIndex, version) as CampaignImage;
}

// Slot count (latest-version-per-slot count) — used for UI summaries ("Created N ads").
export function getImageCount(campaignId: string): number {
  const result = db.prepare(`
    SELECT COUNT(DISTINCT image_index) as count
    FROM campaign_images
    WHERE campaign_id = ?
  `).get(campaignId) as { count: number };

  return result.count;
}

// Row count — used for BILLING (every image generation is one row, including edit-versions).
export function getImageRowCount(campaignId: string): number {
  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM campaign_images
    WHERE campaign_id = ?
  `).get(campaignId) as { count: number };

  return result.count;
}

// Max image_index used so far — for allocating the next fresh slot.
export function getMaxImageIndex(campaignId: string): number {
  const result = db.prepare(`
    SELECT COALESCE(MAX(image_index), 0) as max_index
    FROM campaign_images
    WHERE campaign_id = ?
  `).get(campaignId) as { max_index: number };

  return result?.max_index ?? 0;
}

export function deleteImage(imageId: number): void {
  db.prepare(`
    DELETE FROM campaign_images
    WHERE id = ?
  `).run(imageId);
}
