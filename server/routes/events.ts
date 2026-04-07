import { Router, Request, Response } from 'express';
import { authRequired, getUserId } from '../lib/auth.js';
import * as db from '../lib/db/index.js';

const router = Router();

router.use(authRequired);

// POST /api/events — track a user event
router.post('/', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { eventType, campaignId, metadata } = req.body;

  if (!eventType) {
    return res.status(400).json({ error: 'eventType is required' });
  }

  db.trackEvent(userId, eventType, campaignId, metadata);
  res.json({ success: true });
});

export default router;
