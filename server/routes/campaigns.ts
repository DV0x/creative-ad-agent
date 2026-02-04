import { Router, Request, Response } from 'express';
import { authRequired, getUserId } from '../lib/auth.js';
import * as db from '../lib/db/index.js';
import { isAgentRunning, abortSession } from '../lib/websocket-handler.js';
import { hasBuffer } from '../lib/event-buffer.js';

const router = Router();

// All routes require authentication
router.use(authRequired);

/**
 * GET /api/campaigns
 * List all campaigns for the authenticated user
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const campaigns = db.getCampaignsByUser(userId);

    res.json({
      success: true,
      campaigns,
    });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch campaigns',
    });
  }
});

/**
 * GET /api/campaigns/:id
 * Get a single campaign with all related data (files, images, messages)
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const campaign = db.getCampaignById(id, userId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    // Fetch related data
    const files = db.getCampaignFiles(id);
    const images = db.getLatestCampaignImages(id);
    const messages = db.getMessages(id);

    res.json({
      success: true,
      campaign,
      files,
      images,
      messages,
    });
  } catch (error: any) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch campaign',
    });
  }
});

/**
 * POST /api/campaigns
 * Create a new campaign
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name, sessionId } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Campaign name is required',
      });
    }

    const campaign = db.createCampaign(userId, name, sessionId);

    res.status(201).json({
      success: true,
      campaign,
    });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create campaign',
    });
  }
});

/**
 * PATCH /api/campaigns/:id
 * Update campaign (name, status)
 */
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name, status } = req.body;

    // Verify ownership
    const campaign = db.getCampaignById(id, userId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    // Update fields
    if (name) {
      db.updateCampaignName(id, name);
    }
    if (status) {
      db.updateCampaignStatus(id, status);
    }

    // Return updated campaign
    const updated = db.getCampaignById(id, userId);

    res.json({
      success: true,
      campaign: updated,
    });
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update campaign',
    });
  }
});

/**
 * DELETE /api/campaigns/:id
 * Delete a campaign and all related data
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    // Verify ownership
    const campaign = db.getCampaignById(id, userId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    // If this campaign has an active generation, abort it first
    if (campaign.session_id) {
      abortSession(campaign.session_id);
    }

    db.deleteCampaign(id);

    res.json({
      success: true,
      message: 'Campaign deleted',
    });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete campaign',
    });
  }
});

// ============================================
// CAMPAIGN FILES
// ============================================

/**
 * GET /api/campaigns/:id/files/:type
 * Get a specific file (research, hooks, prompts)
 */
router.get('/:id/files/:type', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id, type } = req.params;

    // Validate file type
    if (!['research', 'hooks', 'prompts'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Must be: research, hooks, or prompts',
      });
    }

    // Verify campaign ownership
    const campaign = db.getCampaignById(id, userId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    const file = db.getCampaignFile(id, type as db.FileType);

    res.json({
      success: true,
      file,
    });
  } catch (error: any) {
    console.error('Error fetching file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch file',
    });
  }
});

/**
 * PUT /api/campaigns/:id/files/:type
 * Update file content
 */
router.put('/:id/files/:type', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id, type } = req.params;
    const { content } = req.body;

    // Validate file type
    if (!['research', 'hooks', 'prompts'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Must be: research, hooks, or prompts',
      });
    }

    // Verify campaign ownership
    const campaign = db.getCampaignById(id, userId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    db.updateCampaignFile(id, type as db.FileType, content ?? '');

    const file = db.getCampaignFile(id, type as db.FileType);

    res.json({
      success: true,
      file,
    });
  } catch (error: any) {
    console.error('Error updating file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update file',
    });
  }
});

// ============================================
// CAMPAIGN IMAGES
// ============================================

/**
 * GET /api/campaigns/:id/images
 * List all images for a campaign
 */
router.get('/:id/images', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    // Verify campaign ownership
    const campaign = db.getCampaignById(id, userId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    const images = db.getLatestCampaignImages(id);

    res.json({
      success: true,
      images,
    });
  } catch (error: any) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch images',
    });
  }
});

// ============================================
// MESSAGES
// ============================================

/**
 * GET /api/campaigns/:id/messages
 * Get chat history for a campaign
 */
router.get('/:id/messages', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    // Verify campaign ownership
    const campaign = db.getCampaignById(id, userId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    const messages = db.getMessages(id);

    res.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch messages',
    });
  }
});

/**
 * POST /api/campaigns/:id/messages
 * Add a message to chat history
 */
router.post('/:id/messages', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { role, content, imageRefs, fileRefs } = req.body;

    // Validate required fields
    if (!role || !content) {
      return res.status(400).json({
        success: false,
        error: 'Role and content are required',
      });
    }

    if (!['user', 'assistant'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be: user or assistant',
      });
    }

    // Verify campaign ownership
    const campaign = db.getCampaignById(id, userId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    const message = db.addMessage({
      campaignId: id,
      role,
      content,
      imageRefs,
      fileRefs,
    });

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add message',
    });
  }
});

// ============================================
// CAMPAIGN STATUS
// ============================================

/**
 * GET /api/campaigns/:id/status
 * Check if agent is running for this campaign
 * Returns actual agent state, not just DB status
 */
router.get('/:id/status', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const campaign = db.getCampaignById(id, userId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    // Check if agent is actually running (not just DB status)
    let agentRunning = false;
    let hasEventBuffer = false;
    let currentStatus = campaign.status;

    if (campaign.session_id) {
      agentRunning = isAgentRunning(campaign.session_id);
      hasEventBuffer = hasBuffer(campaign.session_id);

      // If DB says generating but agent isn't running, mark as incomplete
      if (campaign.status === 'generating' && !agentRunning) {
        db.updateCampaignStatus(id, 'incomplete');
        currentStatus = 'incomplete';
        console.log(`📋 Campaign ${id} marked as incomplete (agent stopped)`);
      }
    }

    res.json({
      success: true,
      status: currentStatus,
      sessionId: campaign.session_id,
      isAgentRunning: agentRunning,
      hasEventBuffer,
    });
  } catch (error: any) {
    console.error('Error fetching status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch status',
    });
  }
});

export default router;
