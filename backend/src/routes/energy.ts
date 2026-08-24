import { Router, Request, Response } from 'express';
import { getEnergyService } from '../services/energy';

import { getErrorMessage } from '../utils/errors';
const router = Router();
const energy = getEnergyService();

/**
 * GET /api/energy/usage
 * Get energy usage data
 */
router.get('/usage', async (req: Request, res: Response) => {
  try {
    const daysBack = parseInt(req.query.daysBack as string) || 30;
    const deviceId = req.query.deviceId as string | undefined;

    const data = await energy.getEnergyUsage(daysBack, deviceId);

    res.json({
      status: 'success',
      data,
      count: data.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to fetch energy usage:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch energy usage',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/energy/summary
 * Get energy summary (daily/weekly/monthly)
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
    const monthsBack = parseInt(req.query.monthsBack as string) || 12;

    const data = await energy.getEnergySummary(period, monthsBack);

    res.json({
      status: 'success',
      data,
      count: data.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to fetch energy summary:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch energy summary',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/energy/current-month
 * Get current month energy usage
 */
router.get('/current-month', async (req: Request, res: Response) => {
  try {
    const total = await energy.getCurrentMonthUsage();

    res.json({
      status: 'success',
      data: {
        period: 'current_month',
        total_kwh: total,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to get current month usage:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get current month usage',
      error: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/energy/goals
 * Create energy goal
 */
router.post('/goals', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { goal_type, target_kwh, start_date, end_date, points_reward } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (!goal_type || !target_kwh || !start_date || !end_date) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
      });
    }

    const goal = await energy.createEnergyGoal(userId, {
      goal_type,
      target_kwh,
      start_date,
      end_date,
      points_reward,
    });

    res.status(201).json({
      status: 'success',
      data: goal,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to create goal:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create goal',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/energy/goals
 * Get user energy goals
 */
router.get('/goals', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const goals = await energy.getEnergyGoals(userId);

    res.json({
      status: 'success',
      data: goals,
      count: goals.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to fetch goals:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch goals',
      error: getErrorMessage(error),
    });
  }
});

export default router;
