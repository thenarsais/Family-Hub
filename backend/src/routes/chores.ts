import { Router, Request, Response } from 'express';
import { getChoreService } from '../services/chores';

const router = Router();
const chores = getChoreService();

/**
 * GET /api/chores
 * List all chores for authenticated user
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

    const userChores = await chores.getUserChores(userId);

    res.json({
      status: 'success',
      chores: userChores,
      count: userChores.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to list chores:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to list chores',
      error: error.message,
    });
  }
});

/**
 * POST /api/chores
 * Create a new chore
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { name, description, timeSlot, pointsValue } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (!name || !timeSlot || !pointsValue) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, timeSlot, and pointsValue are required',
      });
    }

    if (!['morning', 'afternoon', 'evening'].includes(timeSlot)) {
      return res.status(400).json({
        status: 'error',
        message: 'timeSlot must be morning, afternoon, or evening',
      });
    }

    if (typeof pointsValue !== 'number' || pointsValue < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'pointsValue must be a positive number',
      });
    }

    const chore = await chores.createChore(userId, name, description, timeSlot, pointsValue);

    res.status(201).json({
      status: 'success',
      message: 'Chore created successfully',
      chore,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to create chore:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create chore',
      error: error.message,
    });
  }
});

/**
 * POST /api/chores/:choreId/complete
 * Mark a chore as complete and award points
 */
router.post('/:choreId/complete', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const choreId = Array.isArray(req.params.choreId) ? req.params.choreId[0] : req.params.choreId;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (!choreId) {
      return res.status(400).json({
        status: 'error',
        message: 'Chore ID is required',
      });
    }

    const completion = await chores.completeChore(userId, choreId);
    const progress = await chores.getChoreProgress(userId);

    res.json({
      status: 'success',
      message: 'Chore completed successfully',
      completion,
      progress,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error.message === 'Chore not found') {
      return res.status(404).json({
        status: 'error',
        message: 'Chore not found',
      });
    }

    console.error('Failed to complete chore:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to complete chore',
      error: error.message,
    });
  }
});

/**
 * GET /api/chores/progress
 * Get chore progress/statistics for authenticated user
 */
router.get('/progress/summary', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const progress = await chores.getChoreProgress(userId);
    const pointsSummary = await chores.getPointsSummary(userId);

    res.json({
      status: 'success',
      progress: {
        ...progress,
        ...pointsSummary,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to get chore progress:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get chore progress',
      error: error.message,
    });
  }
});

/**
 * GET /api/chores/points/summary
 * Get user's points summary (daily, weekly, monthly, total)
 */
router.get('/points/summary', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const pointsSummary = await chores.getPointsSummary(userId);

    res.json({
      status: 'success',
      data: pointsSummary,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to get points summary:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get points summary',
      error: error.message,
    });
  }
});

/**
 * GET /api/chores/points/history
 * Get user's point transaction history
 */
router.get('/points/history', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const history = await chores.getTransactionHistory(userId, limit);

    res.json({
      status: 'success',
      history,
      count: history.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to get transaction history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get transaction history',
      error: error.message,
    });
  }
});

export default router;
