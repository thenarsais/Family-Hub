import { Router, Request, Response } from 'express';
import { getReminderService } from '../services/reminders';
import { isRecurring } from '../services/recurrence';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
const reminders = getReminderService();

function requireUser(req: Request, res: Response): string | null {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({ status: 'error', message: 'User ID required' });
    return null;
  }
  return userId;
}

const ok = (res: Response, data: unknown, extra: Record<string, unknown> = {}) =>
  res.json({ status: 'success', data, ...extra, timestamp: new Date().toISOString() });

const fail = (res: Response, code: number, message: string, error?: unknown) =>
  res.status(code).json({ status: 'error', message, ...(error ? { error: getErrorMessage(error) } : {}) });

/**
 * GET /api/reminders?filter=pending|dismissed|all
 * Every reminder in the caller's family (with the assignee's name).
 */
router.get('/', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const filter = req.query.filter as 'pending' | 'dismissed' | 'all' | undefined;
  try {
    const rows = await reminders.getRemindersForUser(userId, filter || 'all');
    ok(res, rows, { count: rows.length });
  } catch (error) {
    console.error('Failed to fetch reminders:', error);
    fail(res, 500, 'Failed to fetch reminders', error);
  }
});

/** GET /api/reminders/upcoming — not dismissed, due in the next 24h. */
router.get('/upcoming', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const rows = await reminders.getUpcomingReminders(userId);
    ok(res, rows, { count: rows.length });
  } catch (error) {
    console.error('Failed to fetch upcoming reminders:', error);
    fail(res, 500, 'Failed to fetch upcoming reminders', error);
  }
});

/** GET /api/reminders/due — not dismissed, scheduled for now or the past (the T-18 surface). */
router.get('/due', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const rows = await reminders.getDueReminders(userId);
    ok(res, rows, { count: rows.length });
  } catch (error) {
    console.error('Failed to fetch due reminders:', error);
    fail(res, 500, 'Failed to fetch due reminders', error);
  }
});

/**
 * POST /api/reminders
 * Body: { title, scheduled_time, description?, reminder_type?, recurrence?,
 *         recurrence_end_date?, assignee_user_id?, related_item_id?,
 *         related_item_type?, remind_before_minutes? }
 */
router.post('/', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { title, scheduled_time, recurrence, related_item_id, remind_before_minutes } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return fail(res, 400, 'title is required');
  }
  if (!scheduled_time || Number.isNaN(Date.parse(scheduled_time))) {
    return fail(res, 400, 'scheduled_time must be a valid date-time');
  }
  if (recurrence != null && recurrence !== 'once' && !isRecurring(recurrence)) {
    return fail(res, 400, 'recurrence must be once, daily, weekly or monthly');
  }
  if (related_item_id != null && (typeof related_item_id !== 'string' || !related_item_id.trim())) {
    return fail(res, 400, 'related_item_id must be a non-empty string');
  }
  if (
    remind_before_minutes != null &&
    (typeof remind_before_minutes !== 'number' ||
      !Number.isInteger(remind_before_minutes) ||
      remind_before_minutes < 0)
  ) {
    return fail(res, 400, 'remind_before_minutes must be a non-negative integer');
  }

  try {
    const result = await reminders.createReminder(userId, {
      title,
      description: req.body.description,
      reminder_type: req.body.reminder_type,
      assignee_user_id: req.body.assignee_user_id,
      scheduled_time,
      recurrence: recurrence ?? 'once',
      recurrence_end_date: req.body.recurrence_end_date,
      related_item_id: typeof related_item_id === 'string' ? related_item_id : undefined,
      related_item_type:
        typeof req.body.related_item_type === 'string' ? req.body.related_item_type : undefined,
      remind_before_minutes:
        typeof remind_before_minutes === 'number' ? remind_before_minutes : undefined,
    });
    if (result === null) return fail(res, 404, 'No family for this user');
    if (result === 'bad-assignee') return fail(res, 400, 'assignee_user_id is not a member of your family');
    res.status(201);
    ok(res, result);
  } catch (error) {
    console.error('Failed to create reminder:', error);
    fail(res, 500, 'Failed to create reminder', error);
  }
});

/** PATCH /api/reminders/:id — edit whitelisted fields (family-scoped). */
router.patch('/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const row = await reminders.updateReminder(userId, req.params.id as string, req.body);
    if (!row) return fail(res, 404, 'Reminder not found');
    ok(res, row);
  } catch (error) {
    console.error('Failed to update reminder:', error);
    fail(res, 500, 'Failed to update reminder', error);
  }
});

/**
 * POST /api/reminders/:id/dismiss
 * Recurring → "done this time", rolls to the next occurrence. One-off → hidden.
 */
router.post('/:id/dismiss', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const row = await reminders.dismissReminder(userId, req.params.id as string);
    if (!row) return fail(res, 404, 'Reminder not found');
    ok(res, row);
  } catch (error) {
    console.error('Failed to dismiss reminder:', error);
    fail(res, 500, 'Failed to dismiss reminder', error);
  }
});

/** POST /api/reminders/:id/restore — un-dismiss. */
router.post('/:id/restore', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const row = await reminders.restoreReminder(userId, req.params.id as string);
    if (!row) return fail(res, 404, 'Reminder not found');
    ok(res, row);
  } catch (error) {
    console.error('Failed to restore reminder:', error);
    fail(res, 500, 'Failed to restore reminder', error);
  }
});

/** DELETE /api/reminders/:id — permanent, family-scoped. */
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const removed = await reminders.deleteReminder(userId, req.params.id as string);
    if (!removed) return fail(res, 404, 'Reminder not found');
    res.json({ status: 'success', message: 'Reminder deleted', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Failed to delete reminder:', error);
    fail(res, 500, 'Failed to delete reminder', error);
  }
});

export default router;
