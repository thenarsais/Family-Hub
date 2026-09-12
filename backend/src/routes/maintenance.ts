import { Router, Request, Response } from 'express';
import { getMaintenanceService } from '../services/maintenance';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
const maintenance = getMaintenanceService();

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
 * GET /api/maintenance — every item for the caller's family, soonest-due first.
 */
router.get('/', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const items = await maintenance.getItems(userId);
    res.json({ status: 'success', items, count: items.length, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to list maintenance items:', error);
    fail(res, 500, 'Failed to list maintenance items', error);
  }
});

/**
 * POST /api/maintenance — Body: { name, intervalDays, lastDoneAt? }
 */
router.post('/', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { name, intervalDays, lastDoneAt } = req.body;
  if (typeof name !== 'string' || !name.trim()) {
    return fail(res, 400, 'name is required');
  }
  if (typeof intervalDays !== 'number' || !Number.isFinite(intervalDays) || intervalDays <= 0) {
    return fail(res, 400, 'intervalDays must be a positive number');
  }

  try {
    const item = await maintenance.createItem(userId, {
      name: name.trim(),
      intervalDays: Math.round(intervalDays),
      lastDoneAt: typeof lastDoneAt === 'string' ? lastDoneAt : undefined,
    });
    res.status(201).json({ status: 'success', item, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'no-family') {
      return fail(res, 400, 'Set up a family first');
    }
    console.error('Failed to add maintenance item:', error);
    fail(res, 500, 'Failed to add maintenance item', error);
  }
});

/**
 * POST /api/maintenance/:id/done — resets last_done_at to today, rescheduling.
 */
router.post('/:id/done', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const item = await maintenance.markDone(userId, id);
    if (!item) return fail(res, 404, 'Maintenance item not found');
    res.json({ status: 'success', item, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to mark maintenance item done:', error);
    fail(res, 500, 'Failed to mark maintenance item done', error);
  }
});

/**
 * PATCH /api/maintenance/:id — Body: { name?, intervalDays?, lastDoneAt? }
 */
router.patch('/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { name, intervalDays, lastDoneAt } = req.body;
  if (intervalDays !== undefined && (typeof intervalDays !== 'number' || intervalDays <= 0)) {
    return fail(res, 400, 'intervalDays must be a positive number');
  }

  const updates: Record<string, unknown> = {};
  if (typeof name === 'string' && name.trim()) updates.name = name.trim();
  if (intervalDays !== undefined) updates.interval_days = Math.round(intervalDays);
  if (typeof lastDoneAt === 'string') updates.last_done_at = lastDoneAt;

  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const item = await maintenance.updateItem(userId, id, updates);
    if (!item) return fail(res, 404, 'Maintenance item not found');
    res.json({ status: 'success', item, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to update maintenance item:', error);
    fail(res, 500, 'Failed to update maintenance item', error);
  }
});

/**
 * DELETE /api/maintenance/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const ok = await maintenance.deleteItem(userId, id);
    if (!ok) return fail(res, 404, 'Maintenance item not found');
    res.json({ status: 'success', timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to delete maintenance item:', error);
    fail(res, 500, 'Failed to delete maintenance item', error);
  }
});

export default router;
