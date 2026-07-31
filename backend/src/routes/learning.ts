import { Router, Request, Response } from 'express';
import { getLearningService } from '../services/learning';

const router = Router();
const learning = getLearningService();

/**
 * POST /api/learning/lessons/:lessonId/complete
 * Record lesson completion and award points
 */
router.post('/lessons/:lessonId/complete', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const lessonId = Array.isArray(req.params.lessonId) ? req.params.lessonId[0] : req.params.lessonId;
    const { category, phase, pointsValue = 10 } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (!category || !phase) {
      return res.status(400).json({
        status: 'error',
        message: 'Category and phase are required',
      });
    }

    if (!['alphabet', 'numbers', 'vocabulary'].includes(category)) {
      return res.status(400).json({
        status: 'error',
        message: 'Category must be alphabet, numbers, or vocabulary',
      });
    }

    const progress = await learning.completeLesson(userId, lessonId, category, phase, pointsValue);
    const stats = await learning.getLearningStats(userId);

    res.status(201).json({
      status: 'success',
      message: 'Lesson completed successfully',
      progress,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to complete lesson:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to complete lesson',
      error: error.message,
    });
  }
});

/**
 * POST /api/learning/quiz/answer
 * Record quiz answer and score points if correct
 */
router.post('/quiz/answer', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { lessonId, questionNumber, selectedAnswer, correctAnswer, pointsEarned = 5 } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (lessonId === undefined || questionNumber === undefined || selectedAnswer === undefined || correctAnswer === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'lessonId, questionNumber, selectedAnswer, and correctAnswer are required',
      });
    }

    const isCorrect = selectedAnswer === correctAnswer;

    await learning.recordQuizAnswer(userId, lessonId, questionNumber, selectedAnswer, correctAnswer, pointsEarned);

    res.status(201).json({
      status: 'success',
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer',
      result: {
        isCorrect,
        pointsEarned: isCorrect ? pointsEarned : 0,
        selectedAnswer,
        correctAnswer,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to record quiz answer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record quiz answer',
      error: error.message,
    });
  }
});

/**
 * GET /api/learning/progress/:phase
 * Get progress for a specific phase
 */
router.get('/progress/:phase', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const phase = Array.isArray(req.params.phase) ? req.params.phase[0] : req.params.phase;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (!phase) {
      return res.status(400).json({
        status: 'error',
        message: 'Phase is required',
      });
    }

    const progress = await learning.getPhaseProgress(userId, phase);

    res.json({
      status: 'success',
      phase,
      progress,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to get phase progress:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get phase progress',
      error: error.message,
    });
  }
});

/**
 * GET /api/learning/stats
 * Get overall learning statistics for user
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const stats = await learning.getLearningStats(userId);

    res.json({
      status: 'success',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to get learning stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get learning stats',
      error: error.message,
    });
  }
});

/**
 * GET /api/learning/quiz/performance
 * Get quiz performance metrics
 */
router.get('/quiz/performance', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const performance = await learning.getQuizPerformance(userId);

    res.json({
      status: 'success',
      performance,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to get quiz performance:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get quiz performance',
      error: error.message,
    });
  }
});

/**
 * GET /api/learning/activity/recent
 * Get recent learning activity
 */
router.get('/activity/recent', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const activity = await learning.getRecentActivity(userId, limit);

    res.json({
      status: 'success',
      activity,
      count: activity.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to get recent activity:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get recent activity',
      error: error.message,
    });
  }
});

export default router;
