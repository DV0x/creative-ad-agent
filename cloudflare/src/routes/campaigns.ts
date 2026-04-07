import type { Env } from '../env.js';
import * as db from '../db/index.js';

/**
 * Campaign REST API routes — ported from server/routes/campaigns.ts.
 * All functions receive pre-verified userId (auth handled by router).
 */

/** GET /api/campaigns — List all campaigns for user */
export async function listCampaigns(env: Env, userId: string): Promise<Response> {
  try {
    const campaigns = await db.getCampaignsByUser(env.DB, userId);
    return Response.json({ success: true, campaigns });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch campaigns' },
      { status: 500 },
    );
  }
}

/** GET /api/campaigns/:id — Get campaign with files, images, messages */
export async function getCampaign(
  env: Env,
  userId: string,
  campaignId: string,
): Promise<Response> {
  try {
    const campaign = await db.getCampaignById(env.DB, campaignId, userId);
    if (!campaign) {
      return Response.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    const [files, images, messages] = await Promise.all([
      db.getCampaignFiles(env.DB, campaignId),
      db.getLatestCampaignImages(env.DB, campaignId),
      db.getMessages(env.DB, campaignId),
    ]);

    return Response.json({ success: true, campaign, files, images, messages });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch campaign' },
      { status: 500 },
    );
  }
}

/** POST /api/campaigns — Create a new campaign */
export async function createCampaign(
  request: Request,
  env: Env,
  userId: string,
): Promise<Response> {
  try {
    const body = (await request.json()) as { name?: string; sessionId?: string };
    const { name, sessionId } = body;

    if (!name) {
      return Response.json(
        { success: false, error: 'Campaign name is required' },
        { status: 400 },
      );
    }

    const campaign = await db.createCampaign(env.DB, userId, name, sessionId);
    return Response.json({ success: true, campaign }, { status: 201 });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to create campaign' },
      { status: 500 },
    );
  }
}

/** PATCH /api/campaigns/:id — Update campaign (name, status) */
export async function updateCampaign(
  request: Request,
  env: Env,
  userId: string,
  campaignId: string,
): Promise<Response> {
  try {
    const campaign = await db.getCampaignById(env.DB, campaignId, userId);
    if (!campaign) {
      return Response.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    const body = (await request.json()) as { name?: string; status?: string; brand?: string };

    if (body.name) {
      await db.updateCampaignName(env.DB, campaignId, body.name);
    }
    if (body.brand) {
      await db.updateCampaignBrand(env.DB, campaignId, body.brand);
    }
    if (body.status) {
      await db.updateCampaignStatus(
        env.DB,
        campaignId,
        body.status as db.Campaign['status'],
      );
    }

    const updated = await db.getCampaignById(env.DB, campaignId, userId);
    return Response.json({ success: true, campaign: updated });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to update campaign' },
      { status: 500 },
    );
  }
}

/** DELETE /api/campaigns/:id — Delete campaign and all related data */
export async function deleteCampaign(
  env: Env,
  userId: string,
  campaignId: string,
): Promise<Response> {
  try {
    const campaign = await db.getCampaignById(env.DB, campaignId, userId);
    if (!campaign) {
      return Response.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    // Note: In production, cancellation of active generations is handled by the DO.
    // The REST delete endpoint only cleans up DB records.
    await db.deleteCampaign(env.DB, campaignId);
    return Response.json({ success: true, message: 'Campaign deleted' });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to delete campaign' },
      { status: 500 },
    );
  }
}

// ============================================
// CAMPAIGN FILES
// ============================================

const VALID_FILE_TYPES = ['research', 'hooks', 'prompts'] as const;

/** GET /api/campaigns/:id/files/:type */
export async function getCampaignFile(
  env: Env,
  userId: string,
  campaignId: string,
  fileType: string,
): Promise<Response> {
  try {
    if (!VALID_FILE_TYPES.includes(fileType as any)) {
      return Response.json(
        { success: false, error: 'Invalid file type. Must be: research, hooks, or prompts' },
        { status: 400 },
      );
    }

    const campaign = await db.getCampaignById(env.DB, campaignId, userId);
    if (!campaign) {
      return Response.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    const file = await db.getCampaignFile(env.DB, campaignId, fileType as db.FileType);
    return Response.json({ success: true, file });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch file' },
      { status: 500 },
    );
  }
}

/** PUT /api/campaigns/:id/files/:type */
export async function updateCampaignFile(
  request: Request,
  env: Env,
  userId: string,
  campaignId: string,
  fileType: string,
): Promise<Response> {
  try {
    if (!VALID_FILE_TYPES.includes(fileType as any)) {
      return Response.json(
        { success: false, error: 'Invalid file type. Must be: research, hooks, or prompts' },
        { status: 400 },
      );
    }

    const campaign = await db.getCampaignById(env.DB, campaignId, userId);
    if (!campaign) {
      return Response.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    const body = (await request.json()) as { content?: string };
    await db.updateCampaignFile(env.DB, campaignId, fileType as db.FileType, body.content ?? '');

    const file = await db.getCampaignFile(env.DB, campaignId, fileType as db.FileType);
    return Response.json({ success: true, file });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to update file' },
      { status: 500 },
    );
  }
}

// ============================================
// CAMPAIGN IMAGES
// ============================================

/** GET /api/campaigns/:id/images */
export async function getCampaignImages(
  env: Env,
  userId: string,
  campaignId: string,
): Promise<Response> {
  try {
    const campaign = await db.getCampaignById(env.DB, campaignId, userId);
    if (!campaign) {
      return Response.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    const images = await db.getLatestCampaignImages(env.DB, campaignId);
    return Response.json({ success: true, images });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch images' },
      { status: 500 },
    );
  }
}

// ============================================
// MESSAGES
// ============================================

/** GET /api/campaigns/:id/messages */
export async function getCampaignMessages(
  env: Env,
  userId: string,
  campaignId: string,
): Promise<Response> {
  try {
    const campaign = await db.getCampaignById(env.DB, campaignId, userId);
    if (!campaign) {
      return Response.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    const messages = await db.getMessages(env.DB, campaignId);
    return Response.json({ success: true, messages });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch messages' },
      { status: 500 },
    );
  }
}

/** POST /api/campaigns/:id/messages */
export async function addCampaignMessage(
  request: Request,
  env: Env,
  userId: string,
  campaignId: string,
): Promise<Response> {
  try {
    const body = (await request.json()) as {
      role?: string;
      content?: string;
      imageRefs?: string[];
      fileRefs?: string[];
    };

    if (!body.role || !body.content) {
      return Response.json(
        { success: false, error: 'Role and content are required' },
        { status: 400 },
      );
    }

    if (!['user', 'assistant'].includes(body.role)) {
      return Response.json(
        { success: false, error: 'Role must be: user or assistant' },
        { status: 400 },
      );
    }

    const campaign = await db.getCampaignById(env.DB, campaignId, userId);
    if (!campaign) {
      return Response.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    const message = await db.addMessage(env.DB, {
      campaignId,
      role: body.role as 'user' | 'assistant',
      content: body.content,
      imageRefs: body.imageRefs,
      fileRefs: body.fileRefs,
    });

    return Response.json({ success: true, message }, { status: 201 });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to add message' },
      { status: 500 },
    );
  }
}

// ============================================
// CAMPAIGN STATUS
// ============================================

/**
 * GET /api/campaigns/:id/status
 * Check campaign status. In Cloudflare deployment, the DO handles
 * agent-running state, but REST API returns DB status + session info.
 */
export async function getCampaignStatus(
  env: Env,
  userId: string,
  campaignId: string,
): Promise<Response> {
  try {
    const campaign = await db.getCampaignById(env.DB, campaignId, userId);
    if (!campaign) {
      return Response.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      status: campaign.status,
      sessionId: campaign.session_id,
      // In Cloudflare, isAgentRunning/hasEventBuffer are determined by the DO,
      // not the REST API. The client uses WebSocket for real-time status.
      isAgentRunning: campaign.status === 'generating',
      hasEventBuffer: false,
    });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch status' },
      { status: 500 },
    );
  }
}
