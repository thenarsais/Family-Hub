import { Router, Request, Response } from 'express';
import { getHabitService } from '../services/habits';
import { MOOD_VALUES, type MoodValue } from '../services/habits';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
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

const validTarget = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 7;
const validPoints = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 1;

/**
 * GET /api/habits?scope=mine|family
 * `mine` (default) — the caller's enabled habits + this week's progress/streak
 * (the board). `family` — every member's habits incl. disabled (Manage panel).
 */
router.get('/', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const scope = req.query.scope === 'family' ? 'family' : 'mine';
  try {
    const rows = await habits.getHabits(userId, scope);
    res.json({ status: 'success', habits: rows, count: rows.length, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to list habits:', error);
    fail(res, 500, 'Failed to list habits', error);
  }
});

/**
 * POST /api/habits
 * Body: { title, weeklyTarget, pointsValue, description?, assigneeId? }
 */
router.post('/', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { title, description, weeklyTarget, pointsValue, assigneeId } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return fail(res, 400, 'title is required');
  }
  if (!validTarget(weeklyTarget)) {
    return fail(res, 400, 'weeklyTarget must be a whole number from 1 to 7');
  }
  if (!validPoints(pointsValue)) {
    return fail(res, 400, 'pointsValue must be a positive number');
  }

  try {
    const habit = await habits.createHabit(
      userId,
      title.trim(),
      typeof description === 'string' ? description : undefined,
      weeklyTarget,
      pointsValue,
      typeof assigneeId === 'string' ? assigneeId : undefined,
    );
    res.status(201).json({
      status: 'success',
      message: 'Habit created successfully',
      habit,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'bad-assignee') {
      return fail(res, 400, 'assigneeId is not a member of your family');
    }
    console.error('Failed to create habit:', error);
    fail(res, 500, 'Failed to create habit', error);
  }
});

/**
 * PATCH /api/habits/:id — edit title / description / weeklyTarget / pointsValue /
 * enabled. Family-scoped: the caller must share a family with the assignee.
 */
router.patch('/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { title, description, weeklyTarget, pointsValue, enabled } = req.body;

  if (weeklyTarget !== undefined && !validTarget(weeklyTarget)) {
    return fail(res, 400, 'weeklyTarget must be a whole number from 1 to 7');
  }
  if (pointsValue !== undefined && !validPoints(pointsValue)) {
    return fail(res, 400, 'pointsValue must be a positive number');
  }

  const updates: Record<string, unknown> = {};
  if (typeof title === 'string' && title.trim()) updates.title = title.trim();
  if (description !== undefined) updates.description = typeof description === 'string' ? description : null;
  if (weeklyTarget !== undefined) updates.weekly_target = weeklyTarget;
  if (pointsValue !== undefined) updates.points_value = pointsValue;
  if (typeof enabled === 'boolean') updates.enabled = enabled;

  try {
    const habit = await habits.updateHabit(userId, req.params.id as string, updates);
    if (!habit) return fail(res, 404, 'Habit not found');
    res.json({
      status: 'success',
      message: 'Habit updated successfully',
      habit,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to update habit:', error);
    fail(res, 500, 'Failed to update habit', error);
  }
});

/**
 * POST /api/habits/:habitId/complete — mark one of the caller's own habits done
 * for today and award its (streak-scaled) points. One per family-local day.
 */
router.post('/:habitId/complete', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    const result = await habits.completeHabit(userId, req.params.habitId as string);
    res.json({
      status: 'success',
      message: 'Habit completed',
      pointsEarned: result.pointsEarned,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg === 'Habit not found') return fail(res, 404, 'Habit not found');
    if (msg === 'already-completed-today') return fail(res, 409, 'Habit already completed today');
    console.error('Failed to complete habit:', error);
    fail(res, 500, 'Failed to complete habit', error);
  }
});

/**
 * DELETE /api/habits/:habitId/complete — undo today's completion.
 */
router.delete('/:habitId/complete', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    const undone = await habits.undoHabitCompletion(userId, req.params.habitId as string);
    if (!undone) return fail(res, 404, 'No completion to undo today');
    res.json({ status: 'success', message: 'Habit completion undone', timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to undo habit completion:', error);
    fail(res, 500, 'Failed to undo habit completion', error);
  }
});

/**
 * GET /api/habits/mood/today — the caller's mood for the family-local today.
 */
router.get('/mood/today', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const mood = await habits.getTodayMood(userId);
    res.json({ status: 'success', mood, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error("Failed to get today's mood:", error);
    fail(res, 500, "Failed to get today's mood", error);
  }
});

/**
 * POST /api/habits/mood — record (or replace) the caller's mood for today.
 * Body: { mood: 'great'|'good'|'ok'|'low'|'sad', emoji?, note? }
 */
router.post('/mood', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { mood, emoji, note } = req.body;
  if (!MOOD_VALUES.includes(mood as MoodValue)) {
    return fail(res, 400, `mood must be one of: ${MOOD_VALUES.join(', ')}`);
  }
  try {
    const entry = await habits.setMood(
      userId,
      mood as MoodValue,
      typeof emoji === 'string' ? emoji : undefined,
      typeof note === 'string' ? note : undefined,
    );
    res.json({ status: 'success', message: 'Mood recorded', mood: entry, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to record mood:', error);
    fail(res, 500, 'Failed to record mood', error);
  }
});

/**
 * GET /api/habits/mood/history?days=35 — one row per member per day, family-
 * scoped, for the parent mood heatmap (FR-149). Parents/admins only.
 */
router.get('/mood/history', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const days = parseInt(req.query.days as string, 10) || 35;
  try {
    const history = await habits.getFamilyMoodHistory(userId, days);
    res.json({
      status: 'success',
      history,
      count: history.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'not-parent') return fail(res, 403, 'Parents only');
    console.error('Failed to get mood history:', error);
    fail(res, 500, 'Failed to get mood history', error);
  }
});

export default router;
