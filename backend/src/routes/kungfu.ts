import { Router, Request, Response } from 'express';
import { getKungFuService } from '../services/kungfu';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
const kungfu = getKungFuService();

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
 * GET /api/kungfu/today — profile, today's individual log entries, and this
 * week's class/practice counts.
 */
router.get('/today', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const today = await kungfu.getToday(userId);
    res.json({ status: 'success', ...today, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to load kung fu today:', error);
    fail(res, 500, 'Failed to load kung fu today', error);
  }
});

/**
 * POST /api/kungfu/log
 * Body: { type: 'class' | 'practice' }. Multiple logs per day are allowed.
 */
router.post('/log', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { type } = req.body;
  if (type !== 'class' && type !== 'practice') {
    return fail(res, 400, "type must be 'class' or 'practice'");
  }

  try {
    const today = await kungfu.logSession(userId, type);
    res.status(201).json({ status: 'success', ...today, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to log kung fu session:', error);
    fail(res, 500, 'Failed to log kung fu session', error);
  }
});

/**
 * DELETE /api/kungfu/log/:id — undo one of today's logs and reverse its
 * points. Restricted to today's entries.
 */
router.delete('/log/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const undone = await kungfu.undoSession(userId, req.params.id as string);
    if (!undone) return fail(res, 404, 'No log to undo today');
    res.json({ status: 'success', message: 'Log undone', timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to undo kung fu log:', error);
    fail(res, 500, 'Failed to undo kung fu log', error);
  }
});

/**
 * GET /api/kungfu/profile?scope=mine|family
 */
router.get('/profile', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const scope = req.query.scope === 'family' ? 'family' : 'mine';
  try {
    if (scope === 'family') {
      const profiles = await kungfu.getFamilyProfiles(userId);
      return res.json({ status: 'success', profiles, timestamp: new Date().toISOString() });
    }
    const profile = await kungfu.getProfile(userId);
    res.json({ status: 'success', profile, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to load kung fu profile:', error);
    fail(res, 500, 'Failed to load kung fu profile', error);
  }
});

/**
 * PATCH /api/kungfu/profile/:userId
 * Body: { belt?, beltSince?, pointsPerClass?, pointsPerPractice? }.
 * Family-scoped: the caller must share a family with :userId.
 */
router.patch('/profile/:userId', async (req: Request, res: Response) => {
  const callerId = requireUser(req, res);
  if (!callerId) return;

  const { belt, beltSince, pointsPerClass, pointsPerPractice } = req.body;
  if (belt !== undefined && belt !== null && typeof belt !== 'string') {
    return fail(res, 400, 'belt must be a string or null');
  }
  if (beltSince !== undefined && beltSince !== null && typeof beltSince !== 'string') {
    return fail(res, 400, 'beltSince must be a date string or null');
  }
  if (!positiveNumber(pointsPerClass) || !positiveNumber(pointsPerPractice)) {
    return fail(res, 400, 'pointsPerClass and pointsPerPractice must be positive numbers');
  }

  const updates: Record<string, unknown> = {};
  if (belt !== undefined) updates.belt = belt;
  if (beltSince !== undefined) updates.belt_since = beltSince;
  if (pointsPerClass !== undefined) updates.points_per_class = pointsPerClass;
  if (pointsPerPractice !== undefined) updates.points_per_practice = pointsPerPractice;

  try {
    const profile = await kungfu.setProfile(callerId, req.params.userId as string, updates);
    res.json({ status: 'success', profile, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'bad-assignee') {
      return fail(res, 400, 'userId is not a member of your family');
    }
    console.error('Failed to save kung fu profile:', error);
    fail(res, 500, 'Failed to save kung fu profile', error);
  }
});

export default router;
