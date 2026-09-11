import { Router, Request, Response } from 'express';
import { getReadingService } from '../services/reading';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
const reading = getReadingService();

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

const positiveNumber = (v: unknown) =>
  v === undefined || (typeof v === 'number' && Number.isFinite(v) && v > 0);

/**
 * GET /api/reading/today — today's goals, today's log (if any), this week's
 * total minutes, and the goal-met streak.
 */
router.get('/today', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const today = await reading.getToday(userId);
    res.json({ status: 'success', ...today, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to load reading today:', error);
    fail(res, 500, 'Failed to load reading today', error);
  }
});

/**
 * POST /api/reading/today
 * Body: { minutes }. One log per family-local day.
 */
router.post('/today', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { minutes } = req.body;
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 0) {
    return fail(res, 400, 'minutes must be a non-negative number');
  }

  try {
    const today = await reading.logToday(userId, minutes);
    res.status(201).json({ status: 'success', ...today, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg === 'already-logged') return fail(res, 409, 'Reading already logged today');
    if (msg === 'bad-minutes') return fail(res, 400, 'minutes must be a non-negative number');
    console.error('Failed to log reading:', error);
    fail(res, 500, 'Failed to log reading', error);
  }
});

/**
 * DELETE /api/reading/today — undo today's log and reverse its points.
 */
router.delete('/today', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const undone = await reading.undoToday(userId);
    if (!undone) return fail(res, 404, 'No log to undo today');
    res.json({ status: 'success', message: 'Reading log undone', timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to undo reading log:', error);
    fail(res, 500, 'Failed to undo reading log', error);
  }
});

/**
 * GET /api/reading/goals?scope=mine|family
 */
router.get('/goals', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const scope = req.query.scope === 'family' ? 'family' : 'mine';
  try {
    if (scope === 'family') {
      const goals = await reading.getFamilyGoals(userId);
      return res.json({ status: 'success', goals, timestamp: new Date().toISOString() });
    }
    const goals = await reading.getGoals(userId);
    res.json({ status: 'success', goals, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to load reading goals:', error);
    fail(res, 500, 'Failed to load reading goals', error);
  }
});

/**
 * PATCH /api/reading/goals/:userId
 * Body: { dailyMinutes?, weeklyMinutes?, pointsValue? }. Family-scoped: the
 * caller must share a family with :userId.
 */
router.patch('/goals/:userId', async (req: Request, res: Response) => {
  const callerId = requireUser(req, res);
  if (!callerId) return;

  const { dailyMinutes, weeklyMinutes, pointsValue } = req.body;
  if (!positiveNumber(dailyMinutes) || !positiveNumber(weeklyMinutes) || !positiveNumber(pointsValue)) {
    return fail(res, 400, 'dailyMinutes, weeklyMinutes and pointsValue must be positive numbers');
  }

  const updates: Record<string, unknown> = {};
  if (dailyMinutes !== undefined) updates.daily_minutes = dailyMinutes;
  if (weeklyMinutes !== undefined) updates.weekly_minutes = weeklyMinutes;
  if (pointsValue !== undefined) updates.points_value = pointsValue;

  try {
    const goals = await reading.setGoals(callerId, req.params.userId as string, updates);
    res.json({ status: 'success', goals, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'bad-assignee') {
      return fail(res, 400, 'userId is not a member of your family');
    }
    console.error('Failed to save reading goals:', error);
    fail(res, 500, 'Failed to save reading goals', error);
  }
});

export default router;
