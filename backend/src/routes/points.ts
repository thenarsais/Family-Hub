/**
 * Points Routes
 * Handles points tracking, history, and analytics
 */

import express, { Router, Request, Response } from 'express';
import * as PointsRepository from '../database/repositories/PointsRepository';

const router = Router();

// Middleware to verify auth header
const verifyAuth = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  next();
};

// ================================================
// GET TOTAL POINTS
// ================================================

/**
 * GET /users/:userId/points
 * Get total points for a user
 */
router.get('/users/:userId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const totalPoints = await PointsRepository.getTotalPoints(userId);

    res.json({
      user_id: userId,
      total_points: totalPoints
    });
  } catch (error: any) {
    console.error('Get total points error:', error);
    res.status(500).json({
      error: 'Failed to get total points',
      message: error.message
    });
  }
});

// ================================================
// GET POINTS HISTORY
// ================================================

/**
 * GET /users/:userId/points/history
 * Get points transaction history
 */
router.get('/users/:userId/history', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const history = await PointsRepository.getPointsHistory(userId, limit);

    res.json({
      user_id: userId,
      count: history.length,
      history: history.map((entry: any) => ({
        id: entry.id,
        activity_type: entry.activity_type,
        points: entry.points,
        reason: entry.reason,
        created_at: entry.created_at
      }))
    });
  } catch (error: any) {
    console.error('Get points history error:', error);
    res.status(500).json({
      error: 'Failed to get points history',
      message: error.message
    });
  }
});

// ================================================
// GET POINTS BREAKDOWN
// ================================================

/**
 * GET /users/:userId/points/breakdown
 * Get points breakdown by activity type
 */
router.get('/users/:userId/breakdown', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const breakdown = await PointsRepository.getPointsBreakdown(userId);

    res.json({
      user_id: userId,
      breakdown
    });
  } catch (error: any) {
    console.error('Get points breakdown error:', error);
    res.status(500).json({
      error: 'Failed to get points breakdown',
      message: error.message
    });
  }
});

// ================================================
// GET POINTS BY DATE RANGE
// ================================================

/**
 * GET /users/:userId/points/range?start=ISO&end=ISO
 * Get points in date range
 */
router.get('/users/:userId/range', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        error: 'Missing start or end date parameter'
      });
    }

    const rangePoints = await PointsRepository.getPointsInRange(
      userId,
      new Date(start as string),
      new Date(end as string)
    );

    res.json({
      user_id: userId,
      date_range: { start, end },
      total_points: rangePoints
    });
  } catch (error: any) {
    console.error('Get points in range error:', error);
    res.status(500).json({
      error: 'Failed to get points in date range',
      message: error.message
    });
  }
});

// ================================================
// GET TIME-BASED POINTS
// ================================================

/**
 * GET /users/:userId/points/today
 * Get points earned today
 */
router.get('/users/:userId/today', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const todayPoints = await PointsRepository.getPointsToday(userId);

    res.json({
      user_id: userId,
      period: 'today',
      points: todayPoints
    });
  } catch (error: any) {
    console.error('Get points today error:', error);
    res.status(500).json({
      error: 'Failed to get today points',
      message: error.message
    });
  }
});

/**
 * GET /users/:userId/points/week
 * Get points earned this week
 */
router.get('/users/:userId/week', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const weekPoints = await PointsRepository.getPointsThisWeek(userId);

    res.json({
      user_id: userId,
      period: 'this_week',
      points: weekPoints
    });
  } catch (error: any) {
    console.error('Get points this week error:', error);
    res.status(500).json({
      error: 'Failed to get week points',
      message: error.message
    });
  }
});

/**
 * GET /users/:userId/points/month
 * Get points earned this month
 */
router.get('/users/:userId/month', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const monthPoints = await PointsRepository.getPointsThisMonth(userId);

    res.json({
      user_id: userId,
      period: 'this_month',
      points: monthPoints
    });
  } catch (error: any) {
    console.error('Get points this month error:', error);
    res.status(500).json({
      error: 'Failed to get month points',
      message: error.message
    });
  }
});

// ================================================
// ADD POINTS
// ================================================

/**
 * POST /users/:userId/points
 * Award points to user
 */
router.post('/users/:userId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { points, activity_type, reason } = req.body;

    if (!points || !activity_type) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['points', 'activity_type']
      });
    }

    if (isNaN(points) || points <= 0) {
      return res.status(400).json({
        error: 'Points must be a positive number'
      });
    }

    const entry = await PointsRepository.addPoints(
      userId,
      points,
      activity_type,
      reason || 'Activity completed'
    );

    res.status(201).json({
      message: 'Points awarded successfully',
      entry: {
        id: entry.id,
        user_id: entry.user_id,
        points: entry.points,
        activity_type: entry.activity_type,
        reason: entry.reason,
        created_at: entry.created_at
      }
    });
  } catch (error: any) {
    console.error('Add points error:', error);
    res.status(500).json({
      error: 'Failed to add points',
      message: error.message
    });
  }
});

// ================================================
// SUBTRACT POINTS (PENALTY)
// ================================================

/**
 * POST /users/:userId/points/subtract
 * Remove points from user (penalty)
 */
router.post('/users/:userId/subtract', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { points, reason } = req.body;

    if (!points) {
      return res.status(400).json({
        error: 'Missing points parameter'
      });
    }

    if (isNaN(points) || points <= 0) {
      return res.status(400).json({
        error: 'Points must be a positive number'
      });
    }

    await PointsRepository.subtractPoints(
      userId,
      points,
      reason || 'Points deducted'
    );

    res.status(201).json({
      message: 'Points deducted successfully',
      deducted_points: points,
      reason: reason || 'Points deducted'
    });
  } catch (error: any) {
    console.error('Subtract points error:', error);
    res.status(500).json({
      error: 'Failed to subtract points',
      message: error.message
    });
  }
});

// ================================================
// GET LEADERBOARD
// ================================================

/**
 * GET /points/leaderboard?limit=10
 * Get top users by points
 */
router.get('/leaderboard', verifyAuth, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Limit must be between 1 and 100'
      });
    }

    const leaderboard = await PointsRepository.getTopUsersByPoints(limit);

    res.json({
      limit,
      count: leaderboard.length,
      leaderboard: leaderboard.map((entry: any, index: number) => ({
        rank: index + 1,
        user_id: entry.user_id,
        points: entry.total_points
      }))
    });
  } catch (error: any) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to get leaderboard',
      message: error.message
    });
  }
});

export default router;
