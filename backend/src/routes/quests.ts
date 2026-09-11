import { Router, Request, Response } from 'express';
import { getQuestService } from '../services/quests';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
const quests = getQuestService();

function requireUser(req: Request, res: Response): string | null {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({ status: 'error', message: 'User ID required' });
    return null;
  }
  return userId;
}

const fail = (res: Response, code: number, message: string, error?: unknown) =>
  res.status(code).json({
    status: 'error',
    message,
    ...(error ? { error: getErrorMessage(error) } : {}),
  });

/**
 * GET /api/quests/today — today's 3 assigned quests (assigned on first call of
 * the day), each checked live against the real underlying section, plus the
 * all-done +50 bonus (awarded at most once per day).
 */
router.get('/today', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const today = await quests.getToday(userId);
    res.json({ status: 'success', ...today, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to load quests today:', error);
    fail(res, 500, 'Failed to load quests today', error);
  }
});

export default router;
