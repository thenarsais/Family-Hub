import { Router, Request, Response } from 'express';
import { getActivityLogService } from '../services/activity-log';

import { getErrorMessage } from '../utils/errors';
const router = Router();
const activityLog = getActivityLogService();

/**
 * GET /api/activity/feed
 * Get user activity feed
 */
router.get('/feed', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const activity = await activityLog.getUserActivity(userId, limit);

    res.json({
      status: 'success',
      data: activity,
      count: activity.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to fetch activity feed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activity feed',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/activity/family-feed
 * Get family activity feed
 */
router.get('/family-feed', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const limit = parseInt(req.query.limit as string) || 100;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    // Get user's family
    const { data: familyMember } = await require('../services/supabase').supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', userId)
      .single();

    if (!familyMember) {
      return res.status(404).json({
        status: 'error',
        message: 'User not in a family',
      });
    }

    const activity = await activityLog.getFamilyActivity(familyMember.family_id, limit);

    res.json({
      status: 'success',
      data: activity,
      count: activity.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to fetch family activity:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch family activity',
      error: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/activity/log
 * Log an activity (internal use)
 */
router.post('/log', async (req: Request, res: Response) => {
  try {
    const { user_id, activity_type, action, points_earned, achievement_title, related_item_id, related_item_type, metadata } = req.body;

    if (!user_id || !activity_type || !action) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: user_id, activity_type, action',
      });
    }

    const entry = await activityLog.logActivity(user_id, {
      activity_type,
      action,
      points_earned,
      achievement_title,
      related_item_id,
      related_item_type,
      metadata,
    });

    res.status(201).json({
      status: 'success',
      data: entry,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to log activity:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to log activity',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/activity/stats
 * Get activity statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const daysBack = parseInt(req.query.daysBack as string) || 7;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const stats = await activityLog.getActivityStats(userId, daysBack);

    res.json({
      status: 'success',
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to fetch stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch stats',
      error: getErrorMessage(error),
    });
  }
});

export default router;
