import { Router, Request, Response } from 'express';
import { getChoreService } from '../services/chores';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
const chores = getChoreService();

function requireUser(req: Request, res: Response): string | null {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({ status: 'error', message: 'User ID required' });
    return null;
  }
  return userId;
}

const TIME_SLOTS = ['morning', 'afternoon', 'evening'];
const fail = (res: Response, code: number, message: string, error?: unknown) =>
  res.status(code).json({
    status: 'error',
    message,
    ...(error ? { error: getErrorMessage(error) } : {}),
  });

/**
 * GET /api/chores?scope=mine|family
 * `mine` (default) — the caller's enabled chores + today's completion state (the
 * board). `family` — every family member's chores incl. disabled, with the
 * assignee name (the parent Manage panel).
 */
router.get('/', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const scope = req.query.scope === 'family' ? 'family' : 'mine';
  try {
    const rows = await chores.getChores(userId, scope);
    res.json({
      status: 'success',
      chores: rows,
      count: rows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to list chores:', error);
    fail(res, 500, 'Failed to list chores', error);
  }
});

/**
 * POST /api/chores
 * Body: { name, timeSlot, pointsValue, description?, assigneeId? }
 * `assigneeId` defaults to the caller; anyone in the family may be assigned.
 */
router.post('/', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { name, description, timeSlot, pointsValue, assigneeId } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return fail(res, 400, 'name is required');
  }
  if (!TIME_SLOTS.includes(timeSlot)) {
    return fail(res, 400, 'timeSlot must be morning, afternoon, or evening');
  }
  if (typeof pointsValue !== 'number' || !Number.isFinite(pointsValue) || pointsValue < 1) {
    return fail(res, 400, 'pointsValue must be a positive number');
  }

  try {
    const chore = await chores.createChore(
      userId,
      name.trim(),
      typeof description === 'string' ? description : undefined,
      timeSlot,
      pointsValue,
      typeof assigneeId === 'string' ? assigneeId : undefined,
    );
    res.status(201).json({
      status: 'success',
      message: 'Chore created successfully',
      chore,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'bad-assignee') {
      return fail(res, 400, 'assigneeId is not a member of your family');
    }
    console.error('Failed to create chore:', error);
    fail(res, 500, 'Failed to create chore', error);
  }
});

/**
 * PATCH /api/chores/:id
 * Edit name / description / timeSlot / pointsValue / enabled. Family-scoped: the
 * caller must share a family with the chore's assignee.
 */
router.patch('/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { name, description, timeSlot, pointsValue, enabled } = req.body;

  if (timeSlot !== undefined && !TIME_SLOTS.includes(timeSlot)) {
    return fail(res, 400, 'timeSlot must be morning, afternoon, or evening');
  }
  if (
    pointsValue !== undefined &&
    (typeof pointsValue !== 'number' || !Number.isFinite(pointsValue) || pointsValue < 1)
  ) {
    return fail(res, 400, 'pointsValue must be a positive number');
  }

  const updates: Record<string, unknown> = {};
  if (typeof name === 'string' && name.trim()) updates.name = name.trim();
  if (description !== undefined) updates.description = typeof description === 'string' ? description : null;
  if (timeSlot !== undefined) updates.time_slot = timeSlot;
  if (pointsValue !== undefined) updates.points_value = pointsValue;
  if (typeof enabled === 'boolean') updates.enabled = enabled;

  try {
    const chore = await chores.updateChore(userId, req.params.id as string, updates);
    if (!chore) return fail(res, 404, 'Chore not found');
    res.json({
      status: 'success',
      message: 'Chore updated successfully',
      chore,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to update chore:', error);
    fail(res, 500, 'Failed to update chore', error);
  }
});

/**
 * POST /api/chores/:choreId/complete
 * Mark one of the caller's own chores done for today and award its points.
 * One completion per family-local day.
 */
router.post('/:choreId/complete', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const choreId = req.params.choreId as string;

  try {
    const completion = await chores.completeChore(userId, choreId);
    const progress = await chores.getChoreProgress(userId);
    res.json({
      status: 'success',
      message: 'Chore completed successfully',
      completion,
      progress,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg === 'Chore not found') return fail(res, 404, 'Chore not found');
    if (msg === 'already-completed-today') {
      return fail(res, 409, 'Chore already completed today');
    }
    console.error('Failed to complete chore:', error);
    fail(res, 500, 'Failed to complete chore', error);
  }
});

/**
 * DELETE /api/chores/:choreId/complete
 * Undo today's completion — removes it and reverses the points.
 */
router.delete('/:choreId/complete', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    const undone = await chores.undoCompletion(userId, req.params.choreId as string);
    if (!undone) return fail(res, 404, 'No completion to undo today');
    const progress = await chores.getChoreProgress(userId);
    res.json({
      status: 'success',
      message: 'Chore completion undone',
      progress,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to undo chore completion:', error);
    fail(res, 500, 'Failed to undo chore completion', error);
  }
});

/**
 * GET /api/chores/progress/summary — completion counts + points summary.
 */
router.get('/progress/summary', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const progress = await chores.getChoreProgress(userId);
    const pointsSummary = await chores.getPointsSummary(userId);
    res.json({
      status: 'success',
      progress: { ...progress, ...pointsSummary },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to get chore progress:', error);
    fail(res, 500, 'Failed to get chore progress', error);
  }
});

/**
 * GET /api/chores/points/summary — daily / weekly / monthly / total points.
 */
router.get('/points/summary', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const pointsSummary = await chores.getPointsSummary(userId);
    res.json({ status: 'success', data: pointsSummary, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to get points summary:', error);
    fail(res, 500, 'Failed to get points summary', error);
  }
});

/**
 * GET /api/chores/points/history — recent point transactions.
 */
router.get('/points/history', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  try {
    const history = await chores.getTransactionHistory(userId, limit);
    res.json({
      status: 'success',
      history,
      count: history.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to get transaction history:', error);
    fail(res, 500, 'Failed to get transaction history', error);
  }
});

export default router;
