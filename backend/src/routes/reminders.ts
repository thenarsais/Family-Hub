import { Router, Request, Response } from 'express';
import { getReminderService } from '../services/reminders';

const router = Router();
const reminders = getReminderService();

/**
 * GET /api/reminders
 * Get all reminders for authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const filter = req.query.filter as 'pending' | 'dismissed' | 'all' | undefined;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const userReminders = await reminders.getRemindersForUser(userId, filter || 'all');

    res.json({
      status: 'success',
      data: userReminders,
      count: userReminders.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to fetch reminders:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reminders',
      error: error.message,
    });
  }
});

/**
 * GET /api/reminders/upcoming
 * Get upcoming reminders (next 24 hours)
 */
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const upcomingReminders = await reminders.getUpcomingReminders(userId);

    res.json({
      status: 'success',
      data: upcomingReminders,
      count: upcomingReminders.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to fetch upcoming reminders:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch upcoming reminders',
      error: error.message,
    });
  }
});

/**
 * POST /api/reminders
 * Create a new reminder
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const {
      title,
      description,
      reminder_type,
      related_item_id,
      related_item_type,
      scheduled_time,
      remind_before_minutes,
      recurrence,
      recurrence_end_date,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (!title || !reminder_type || !scheduled_time) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: title, reminder_type, scheduled_time',
      });
    }

    const reminder = await reminders.createReminder(userId, {
      title,
      description,
      reminder_type,
      related_item_id,
      related_item_type,
      scheduled_time,
      remind_before_minutes,
      recurrence,
      recurrence_end_date,
    });

    res.status(201).json({
      status: 'success',
      data: reminder,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to create reminder:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create reminder',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/reminders/:id
 * Update a reminder
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Reminder ID required',
      });
    }

    const reminder = await reminders.updateReminder(id as string, updates);

    res.json({
      status: 'success',
      data: reminder,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to update reminder:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update reminder',
      error: error.message,
    });
  }
});

/**
 * POST /api/reminders/:id/dismiss
 * Dismiss a reminder
 */
router.post('/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Reminder ID required',
      });
    }

    await reminders.dismissReminder(id as string);

    res.json({
      status: 'success',
      message: 'Reminder dismissed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to dismiss reminder:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to dismiss reminder',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/reminders/:id
 * Delete a reminder
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Reminder ID required',
      });
    }

    await reminders.deleteReminder(id as string);

    res.json({
      status: 'success',
      message: 'Reminder deleted',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to delete reminder:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete reminder',
      error: error.message,
    });
  }
});

export default router;
