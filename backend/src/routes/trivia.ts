import { Router, Request, Response } from 'express';
import { getTriviaService } from '../services/trivia';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody);
const trivia = getTriviaService();

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
 * T-09 — Trivia v1 (FR-031). One shared daily question, a participation streak,
 * points (flat by difficulty) only on a correct answer. No games, no leaderboard.
 */

/** GET /api/trivia/today — today's question + this user's attempt + streak + stats. */
router.get('/today', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const payload = await trivia.getToday(userId);
    res.json({ status: 'success', ...payload, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to get today\'s trivia:', error);
    fail(res, 500, 'Failed to get trivia', error);
  }
});

/** POST /api/trivia/today — record today's answer. Body: { answer }. */
router.post('/today', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const { answer } = req.body;
  if (typeof answer !== 'string' || !answer.trim()) {
    return fail(res, 400, 'answer is required');
  }
  try {
    const payload = await trivia.submitToday(userId, answer);
    res.json({ status: 'success', ...payload, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg === 'bad-answer') return fail(res, 400, 'That is not one of the options');
    if (msg === 'no-question') return fail(res, 503, 'No trivia question is available');
    console.error('Failed to submit trivia answer:', error);
    fail(res, 500, 'Failed to submit answer', error);
  }
});

export default router;
