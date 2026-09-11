import { Router, Request, Response } from 'express';
import { getRewardService } from '../services/rewards';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
const rewards = getRewardService();

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
 * GET /api/rewards/today — checks the weekly goal + monthly tiers against the
 * current points totals, records any newly-crossed milestone, and returns the
 * current progress.
 */
router.get('/today', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const today = await rewards.checkAndRecord(userId);
    res.json({ status: 'success', ...today, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to load rewards today:', error);
    fail(res, 500, 'Failed to load rewards today', error);
  }
});

/**
 * GET /api/rewards/earned?scope=mine|family
 */
router.get('/earned', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const scope = req.query.scope === 'family' ? 'family' : 'mine';
  try {
    const earned = await rewards.getEarned(userId, scope);
    res.json({ status: 'success', earned, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to list earned rewards:', error);
    fail(res, 500, 'Failed to list earned rewards', error);
  }
});

/**
 * POST /api/rewards/earned/:id/fulfill
 * Body: { libraryItemId, note? }
 */
router.post('/earned/:id/fulfill', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { libraryItemId, note } = req.body;
  if (!libraryItemId || typeof libraryItemId !== 'string') {
    return fail(res, 400, 'libraryItemId is required');
  }

  try {
    const reward = await rewards.fulfillReward(
      userId,
      req.params.id as string,
      libraryItemId,
      typeof note === 'string' ? note : undefined,
    );
    res.json({ status: 'success', reward, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg === 'not-found') return fail(res, 404, 'Reward not found');
    if (msg === 'already-fulfilled') return fail(res, 409, 'Reward already fulfilled');
    if (msg === 'bad-assignee') return fail(res, 400, 'Not a member of that family');
    if (msg === 'bad-library-item') return fail(res, 400, 'libraryItemId is not in your family library');
    console.error('Failed to fulfill reward:', error);
    fail(res, 500, 'Failed to fulfill reward', error);
  }
});

/**
 * GET /api/rewards/library — every (active + retired) item for the caller's family.
 */
router.get('/library', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const library = await rewards.getLibrary(userId);
    res.json({ status: 'success', library, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to list reward library:', error);
    fail(res, 500, 'Failed to list reward library', error);
  }
});

/**
 * POST /api/rewards/library
 * Body: { title, description?, cashAmount? }
 */
router.post('/library', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { title, description, cashAmount } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return fail(res, 400, 'title is required');
  }
  if (!positiveNumber(cashAmount)) {
    return fail(res, 400, 'cashAmount must be a positive number');
  }

  try {
    const item = await rewards.addLibraryItem(userId, {
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : undefined,
      cashAmount: typeof cashAmount === 'number' ? cashAmount : undefined,
    });
    res.status(201).json({ status: 'success', item, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'no-family') {
      return fail(res, 400, 'You must be in a family to add a reward');
    }
    console.error('Failed to add reward:', error);
    fail(res, 500, 'Failed to add reward', error);
  }
});

/**
 * PATCH /api/rewards/library/:id
 * Body: { title?, description?, cashAmount?, active? }
 */
router.patch('/library/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { title, description, cashAmount, active } = req.body;
  if (!positiveNumber(cashAmount)) {
    return fail(res, 400, 'cashAmount must be a positive number');
  }

  const updates: Record<string, unknown> = {};
  if (typeof title === 'string' && title.trim()) updates.title = title.trim();
  if (description !== undefined) {
    updates.description = typeof description === 'string' && description.trim() ? description.trim() : null;
  }
  if (cashAmount !== undefined) updates.cash_amount = cashAmount;
  if (typeof active === 'boolean') updates.active = active;

  try {
    const item = await rewards.updateLibraryItem(userId, req.params.id as string, updates);
    if (!item) return fail(res, 404, 'Reward not found');
    res.json({ status: 'success', item, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to update reward:', error);
    fail(res, 500, 'Failed to update reward', error);
  }
});

/**
 * GET /api/rewards/settings?scope=mine|family
 */
router.get('/settings', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const scope = req.query.scope === 'family' ? 'family' : 'mine';
  try {
    if (scope === 'family') {
      const settings = await rewards.getFamilySettings(userId);
      return res.json({ status: 'success', settings, timestamp: new Date().toISOString() });
    }
    const settings = await rewards.getSettings(userId);
    res.json({ status: 'success', settings, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to load reward settings:', error);
    fail(res, 500, 'Failed to load reward settings', error);
  }
});

/**
 * PATCH /api/rewards/settings/:userId
 * Body: { weeklyGoal }
 */
router.patch('/settings/:userId', async (req: Request, res: Response) => {
  const callerId = requireUser(req, res);
  if (!callerId) return;

  const { weeklyGoal } = req.body;
  if (typeof weeklyGoal !== 'number' || !Number.isFinite(weeklyGoal) || weeklyGoal <= 0) {
    return fail(res, 400, 'weeklyGoal must be a positive number');
  }

  try {
    const settings = await rewards.setSettings(callerId, req.params.userId as string, weeklyGoal);
    res.json({ status: 'success', settings, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'bad-assignee') {
      return fail(res, 400, 'userId is not a member of your family');
    }
    console.error('Failed to save reward settings:', error);
    fail(res, 500, 'Failed to save reward settings', error);
  }
});

export default router;
