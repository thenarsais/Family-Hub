import { Router, Request, Response } from 'express';
import { getAnnouncementService } from '../services/announcements';

import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
const announcements = getAnnouncementService();

/**
 * GET /api/announcements
 * Get all announcements for authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const userAnnouncements = await announcements.getAnnouncementsForUser(userId);

    res.json({
      status: 'success',
      data: userAnnouncements,
      count: userAnnouncements.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to fetch announcements:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch announcements',
      error: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/announcements
 * Create announcement (parent/admin only)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const {
      family_id,
      title,
      message,
      announcement_type,
      priority,
      target_audience,
      target_user_ids,
      is_pinned,
      expires_at,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (!family_id || !title || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: family_id, title, message',
      });
    }

    const announcement = await announcements.createAnnouncement(userId, {
      family_id,
      title,
      message,
      announcement_type,
      priority,
      target_audience,
      target_user_ids,
      is_pinned,
      expires_at,
    });

    res.status(201).json({
      status: 'success',
      data: announcement,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to create announcement:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create announcement',
      error: getErrorMessage(error),
    });
  }
});

/**
 * PATCH /api/announcements/:id
 * Update announcement
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Announcement ID required',
      });
    }

    const announcement = await announcements.updateAnnouncement(id as string, updates);

    res.json({
      status: 'success',
      data: announcement,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to update announcement:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update announcement',
      error: getErrorMessage(error),
    });
  }
});

/**
 * DELETE /api/announcements/:id
 * Delete announcement
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Announcement ID required',
      });
    }

    await announcements.deleteAnnouncement(id as string);

    res.json({
      status: 'success',
      message: 'Announcement deleted',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to delete announcement:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete announcement',
      error: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/announcements/:id/read
 * Mark announcement as read
 */
router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Announcement ID required',
      });
    }

    await announcements.markAsRead(id as string, userId);

    res.json({
      status: 'success',
      message: 'Announcement marked as read',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to mark announcement as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark announcement as read',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/announcements/:id/readers
 * Get who has read announcement
 */
router.get('/:id/readers', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Announcement ID required',
      });
    }

    const readCount = await announcements.getReadCount(id as string);

    res.json({
      status: 'success',
      data: {
        announcement_id: id,
        read_count: readCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to get read count:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get read count',
      error: getErrorMessage(error),
    });
  }
});

export default router;
