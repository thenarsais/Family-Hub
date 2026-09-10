import { Router, Request, Response } from 'express';
import { getHomeworkService } from '../services/homework';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
const homework = getHomeworkService();

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

const validPoints = (v: unknown) =>
  v === undefined || (typeof v === 'number' && Number.isFinite(v) && v >= 1);

/**
 * GET /api/homework?scope=mine|family
 * `mine` (default) — the caller's open items due in the next 7 days or overdue,
 * plus anything completed today (the board). `family` — every family member's
 * open items + the last 30 days, with the assignee name (the parent panel).
 */
router.get('/', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const scope = req.query.scope === 'family' ? 'family' : 'mine';
  try {
    const items = await homework.getItems(userId, scope);
    res.json({
      status: 'success',
      items,
      count: items.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to list homework:', error);
    fail(res, 500, 'Failed to list homework', error);
  }
});

/**
 * POST /api/homework
 * Body: { title, dueDate, subject?, pointsValue?, assigneeId? }
 * `assigneeId` defaults to the caller; anyone in the family may be assigned.
 */
router.post('/', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { title, dueDate, subject, pointsValue, assigneeId } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return fail(res, 400, 'title is required');
  }
  if (!dueDate || typeof dueDate !== 'string') {
    return fail(res, 400, 'dueDate is required');
  }
  if (!validPoints(pointsValue)) {
    return fail(res, 400, 'pointsValue must be a positive number');
  }

  try {
    const item = await homework.createItem(userId, {
      title: title.trim(),
      dueDate,
      subject: typeof subject === 'string' && subject.trim() ? subject.trim() : undefined,
      pointsValue: typeof pointsValue === 'number' ? pointsValue : undefined,
      assigneeId: typeof assigneeId === 'string' ? assigneeId : undefined,
    });
    res.status(201).json({
      status: 'success',
      message: 'Homework created successfully',
      item,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg === 'bad-assignee') {
      return fail(res, 400, 'assigneeId is not a member of your family');
    }
    if (msg === 'bad-due-date') {
      return fail(res, 400, 'dueDate must be YYYY-MM-DD');
    }
    console.error('Failed to create homework:', error);
    fail(res, 500, 'Failed to create homework', error);
  }
});

/**
 * PATCH /api/homework/:id
 * Edit title / subject / dueDate / pointsValue. Family-scoped: the caller must
 * share a family with the item's assignee.
 */
router.patch('/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { title, subject, dueDate, pointsValue } = req.body;

  if (dueDate !== undefined && typeof dueDate !== 'string') {
    return fail(res, 400, 'dueDate must be a string');
  }
  if (!validPoints(pointsValue)) {
    return fail(res, 400, 'pointsValue must be a positive number');
  }

  const updates: Record<string, unknown> = {};
  if (typeof title === 'string' && title.trim()) updates.title = title.trim();
  if (subject !== undefined) {
    updates.subject = typeof subject === 'string' && subject.trim() ? subject.trim() : null;
  }
  if (dueDate !== undefined) updates.due_date = dueDate;
  if (pointsValue !== undefined) updates.points_value = pointsValue;

  try {
    const item = await homework.updateItem(userId, req.params.id as string, updates);
    if (!item) return fail(res, 404, 'Homework not found');
    res.json({
      status: 'success',
      message: 'Homework updated successfully',
      item,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg === 'bad-due-date') return fail(res, 400, 'dueDate must be YYYY-MM-DD');
    if (msg === 'bad-points') return fail(res, 400, 'pointsValue must be a positive number');
    console.error('Failed to update homework:', error);
    fail(res, 500, 'Failed to update homework', error);
  }
});

/**
 * DELETE /api/homework/:id
 * Remove an item (reverses its points if it was completed). Family-scoped.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    const removed = await homework.deleteItem(userId, req.params.id as string);
    if (!removed) return fail(res, 404, 'Homework not found');
    res.json({
      status: 'success',
      message: 'Homework deleted',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to delete homework:', error);
    fail(res, 500, 'Failed to delete homework', error);
  }
});

/**
 * POST /api/homework/:id/complete
 * Mark one of the caller's own items done and award its (flat) points.
 */
router.post('/:id/complete', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    const { pointsEarned } = await homework.completeItem(userId, req.params.id as string);
    res.json({
      status: 'success',
      message: 'Homework completed successfully',
      pointsEarned,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg === 'not-found') return fail(res, 404, 'Homework not found');
    if (msg === 'already-completed') return fail(res, 409, 'Homework already completed');
    console.error('Failed to complete homework:', error);
    fail(res, 500, 'Failed to complete homework', error);
  }
});

/**
 * DELETE /api/homework/:id/complete
 * Undo a completion — clears it and reverses the points.
 */
router.delete('/:id/complete', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    const undone = await homework.uncompleteItem(userId, req.params.id as string);
    if (!undone) return fail(res, 404, 'No completion to undo');
    res.json({
      status: 'success',
      message: 'Homework completion undone',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to undo homework completion:', error);
    fail(res, 500, 'Failed to undo homework completion', error);
  }
});

export default router;
