import { Router, Request, Response } from 'express';
import { getRoutineService, type RoutineSlot } from '../services/routines';
import { getHabitService, MOOD_VALUES, type MoodValue } from '../services/habits';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody);
const routines = getRoutineService();
const habits = getHabitService();

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

const SLOTS: RoutineSlot[] = ['morning', 'evening'];
const MOOD_EMOJI: Record<MoodValue, string> = {
  great: '😄',
  good: '🙂',
  ok: '😐',
  low: '😕',
  sad: '😢',
};

/**
 * "Parent acting for a child" surface (T-12). Every route is called with the
 * PARENT's x-user-id; `:memberId` is the child. The RoutineService enforces
 * that the caller is that child or an active parent/admin in the same family.
 */

/** GET /api/kids/:memberId/routines — the child's routine checklist + today's ticks. */
router.get('/:memberId/routines', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const scope = req.query.scope === 'manage' ? 'manage' : 'board';
  try {
    const rows = await routines.getRoutines(userId, req.params.memberId as string, scope);
    res.json({ status: 'success', routines: rows, count: rows.length, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'not-allowed') return fail(res, 403, 'Not allowed');
    console.error('Failed to list routines:', error);
    fail(res, 500, 'Failed to list routines', error);
  }
});

/** POST /api/kids/:memberId/routines — add a routine item (parent only). */
router.post('/:memberId/routines', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const { slot, label, emoji, sortOrder } = req.body;
  if (!SLOTS.includes(slot)) return fail(res, 400, 'slot must be morning or evening');
  if (!label || typeof label !== 'string' || !label.trim()) return fail(res, 400, 'label is required');
  if (!emoji || typeof emoji !== 'string') return fail(res, 400, 'emoji is required');
  try {
    const routine = await routines.createRoutine(userId, req.params.memberId as string, {
      slot,
      label: label.trim(),
      emoji,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : undefined,
    });
    res.status(201).json({ status: 'success', message: 'Routine created', routine, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'not-allowed') return fail(res, 403, 'Not allowed');
    console.error('Failed to create routine:', error);
    fail(res, 500, 'Failed to create routine', error);
  }
});

/** PATCH /api/kids/:memberId/routines/:id — edit / enable-disable (parent only). */
router.patch('/:memberId/routines/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const { slot, label, emoji, sortOrder, enabled } = req.body;
  if (slot !== undefined && !SLOTS.includes(slot)) {
    return fail(res, 400, 'slot must be morning or evening');
  }
  const updates: Record<string, unknown> = {};
  if (slot !== undefined) updates.slot = slot;
  if (typeof label === 'string' && label.trim()) updates.label = label.trim();
  if (typeof emoji === 'string' && emoji) updates.emoji = emoji;
  if (typeof sortOrder === 'number') updates.sort_order = sortOrder;
  if (typeof enabled === 'boolean') updates.enabled = enabled;
  try {
    const routine = await routines.updateRoutine(userId, req.params.id as string, updates);
    if (!routine) return fail(res, 404, 'Routine not found');
    res.json({ status: 'success', message: 'Routine updated', routine, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to update routine:', error);
    fail(res, 500, 'Failed to update routine', error);
  }
});

/** POST /api/kids/:memberId/routines/:id/complete — tick it off for today. */
router.post('/:memberId/routines/:id/complete', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    await routines.completeRoutine(userId, req.params.id as string, req.params.memberId as string);
    res.json({ status: 'success', message: 'Routine done', timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg === 'not-allowed') return fail(res, 403, 'Not allowed');
    if (msg === 'not-found') return fail(res, 404, 'Routine not found');
    console.error('Failed to complete routine:', error);
    fail(res, 500, 'Failed to complete routine', error);
  }
});

/** DELETE /api/kids/:memberId/routines/:id/complete — un-tick today. */
router.delete('/:memberId/routines/:id/complete', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const undone = await routines.undoRoutine(userId, req.params.id as string, req.params.memberId as string);
    if (!undone) return fail(res, 404, 'Nothing to undo today');
    res.json({ status: 'success', message: 'Routine un-ticked', timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg === 'not-allowed') return fail(res, 403, 'Not allowed');
    if (msg === 'not-found') return fail(res, 404, 'Routine not found');
    console.error('Failed to undo routine:', error);
    fail(res, 500, 'Failed to undo routine', error);
  }
});

/** GET /api/kids/:memberId/mood — the child's mood for today (parent view). */
router.get('/:memberId/mood', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const memberId = req.params.memberId as string;
  try {
    if (!(await routines.isParentActingFor(userId, memberId))) return fail(res, 403, 'Not allowed');
    const mood = await habits.getTodayMood(memberId);
    res.json({ status: 'success', mood, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error("Failed to get child's mood:", error);
    fail(res, 500, "Failed to get child's mood", error);
  }
});

/** POST /api/kids/:memberId/mood — record the child's mood for today (parent tap). */
router.post('/:memberId/mood', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const memberId = req.params.memberId as string;
  const { mood } = req.body;
  if (!MOOD_VALUES.includes(mood as MoodValue)) {
    return fail(res, 400, `mood must be one of: ${MOOD_VALUES.join(', ')}`);
  }
  try {
    if (!(await routines.isParentActingFor(userId, memberId))) return fail(res, 403, 'Not allowed');
    const entry = await habits.setMood(memberId, mood as MoodValue, MOOD_EMOJI[mood as MoodValue]);
    res.json({ status: 'success', message: 'Mood recorded', mood: entry, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error("Failed to record child's mood:", error);
    fail(res, 500, "Failed to record child's mood", error);
  }
});

export default router;
