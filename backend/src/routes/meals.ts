import { Router, Request, Response } from 'express';
import { getMealPlanService, isValidDate, isValidSlot } from '../services/meals';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
const meals = getMealPlanService();

function requireUser(req: Request, res: Response): string | null {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({ status: 'error', message: 'User ID required' });
    return null;
  }
  return userId;
}

/** ISO date `n` days from today (UTC), 'YYYY-MM-DD'. */
function isoDaysFromToday(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * GET /api/meals?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Slot rows for the caller's family across the range. Defaults to a rolling
 * 7-day window starting today when the params are omitted.
 */
router.get('/', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const start = req.query.start ?? isoDaysFromToday(0);
  const end = req.query.end ?? isoDaysFromToday(6);
  if (!isValidDate(start) || !isValidDate(end)) {
    return res.status(400).json({ status: 'error', message: 'start and end must be YYYY-MM-DD' });
  }

  try {
    const rows = await meals.getRange(userId, start, end);
    res.json({
      status: 'success',
      data: rows,
      count: rows.length,
      range: { start, end },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to fetch meal plan:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch meal plan',
      error: getErrorMessage(error),
    });
  }
});

/**
 * PUT /api/meals/:date/:slot
 * Set one slot. Body: { text }. A blank text clears the slot.
 */
router.put('/:date/:slot', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { date, slot } = req.params;
  if (!isValidDate(date)) {
    return res.status(400).json({ status: 'error', message: 'date must be YYYY-MM-DD' });
  }
  if (!isValidSlot(slot)) {
    return res.status(400).json({
      status: 'error',
      message: 'slot must be one of breakfast, lunch, dinner, snack',
    });
  }
  if (typeof req.body.text !== 'string') {
    return res.status(400).json({ status: 'error', message: 'text (string) required' });
  }

  try {
    const row = await meals.setSlot(userId, date, slot, req.body.text);
    res.json({
      status: 'success',
      data: row, // null when the slot was cleared
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to set meal slot:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to set meal slot',
      error: getErrorMessage(error),
    });
  }
});

/**
 * DELETE /api/meals/:date/:slot
 * Clear one slot.
 */
router.delete('/:date/:slot', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { date, slot } = req.params;
  if (!isValidDate(date) || !isValidSlot(slot)) {
    return res.status(400).json({ status: 'error', message: 'Invalid date or slot' });
  }

  try {
    await meals.clearSlot(userId, date, slot);
    res.json({
      status: 'success',
      message: 'Slot cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to clear meal slot:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear meal slot',
      error: getErrorMessage(error),
    });
  }
});

export default router;
