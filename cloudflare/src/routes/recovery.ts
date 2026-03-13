import type { Env } from '../env.js';
import * as db from '../db/index.js';

/**
 * POST /api/campaigns/:id/recover
 * Checks if a stuck campaign actually completed (D1 has data) and syncs status.
 * No longer depends on R2 completion marker — uses D1 as source of truth.
 */
export async function recoverCampaign(
  env: Env,
  userId: string,
  campaignId: string,
): Promise<Response> {
  try {
    // 1. Look up campaign, verify ownership
    const campaign = await db.getCampaignById(env.DB, campaignId, userId);
    if (!campaign) {
      return Response.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    // 2. Only recover campaigns in a stuck state
    const recoverableStatuses = ['incomplete', 'generating', 'error'];
    if (!recoverableStatuses.includes(campaign.status)) {
      return Response.json({
        success: false,
        recovered: false,
        reason: 'not_recoverable',
        message: `Campaign status is '${campaign.status}', not recoverable`,
      });
    }

    // 3. Check if D1 already has completion data (files, images, assistant message)
    const [existingImages, existingFiles, lastMsg] = await Promise.all([
      db.getCampaignImages(env.DB, campaignId),
      db.getCampaignFiles(env.DB, campaignId),
      db.getLastAssistantMessage(env.DB, campaignId),
    ]);

    const hasData = existingImages.length > 0 || existingFiles.length > 0 || lastMsg;

    if (!hasData) {
      return Response.json({
        success: true,
        recovered: false,
        reason: 'no_data',
      });
    }

    // 4. Add synthetic assistant message if none exists
    if (!lastMsg) {
      const totalImages = existingImages.length;
      await db.addMessage(env.DB, {
        campaignId,
        role: 'assistant',
        content: totalImages > 0
          ? `Generation recovered. ${totalImages} image${totalImages !== 1 ? 's' : ''} found.`
          : 'Generation recovered.',
      });
    }

    // 5. Set status to complete
    await db.updateCampaignStatus(env.DB, campaignId, 'complete');

    // 6. Return full campaign data
    const [updatedCampaign, files, images, messages] = await Promise.all([
      db.getCampaignById(env.DB, campaignId, userId),
      db.getCampaignFiles(env.DB, campaignId),
      db.getLatestCampaignImages(env.DB, campaignId),
      db.getMessages(env.DB, campaignId),
    ]);

    return Response.json({
      success: true,
      recovered: true,
      imagesAdded: 0,
      filesUpdated: 0,
      campaign: updatedCampaign,
      files,
      images,
      messages,
    });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Recovery failed' },
      { status: 500 },
    );
  }
}
