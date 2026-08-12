import { Router, Request, Response } from 'express';
import { getCalendarService } from '../services/calendar';
import { getFamilyService } from '../services/family';

const router = Router();
const calendar = getCalendarService();
const family = getFamilyService();

/**
 * GET /api/calendar/events
 * Get all calendar events for user's family
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const userFamily = await family.getUserFamily(userId);

    if (!userFamily) {
      return res.status(404).json({
        status: 'error',
        message: 'No family found',
      });
    }

    const events = await calendar.getFamilyEvents(userFamily.id, startDate, endDate);

    res.json({
      status: 'success',
      data: events,
      count: events.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to fetch events:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch events',
      error: error.message,
    });
  }
});

/**
 * GET /api/calendar/upcoming
 * Get upcoming events (next 7 days)
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

    const userFamily = await family.getUserFamily(userId);

    if (!userFamily) {
      return res.status(404).json({
        status: 'error',
        message: 'No family found',
      });
    }

    const events = await calendar.getUpcomingEvents(userFamily.id);

    res.json({
      status: 'success',
      data: events,
      count: events.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to fetch upcoming events:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch upcoming events',
      error: error.message,
    });
  }
});

/**
 * POST /api/calendar/events
 * Create a calendar event
 */
router.post('/events', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { event_title, event_description, event_type, event_date, start_time, end_time, location } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (!event_title || !event_date) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: event_title, event_date',
      });
    }

    const userFamily = await family.getUserFamily(userId);

    if (!userFamily) {
      return res.status(404).json({
        status: 'error',
        message: 'No family found',
      });
    }

    const event = await calendar.createEvent(userFamily.id, userId, {
      event_title,
      event_description,
      event_type,
      event_date,
      start_time,
      end_time,
      location,
    });

    res.status(201).json({
      status: 'success',
      data: event,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to create event:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create event',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/calendar/events/:id
 * Update calendar event
 */
router.patch('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Event ID required',
      });
    }

    const event = await calendar.updateEvent(id as string, updates);

    res.json({
      status: 'success',
      data: event,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to update event:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update event',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/calendar/events/:id
 * Delete calendar event
 */
router.delete('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Event ID required',
      });
    }

    await calendar.deleteEvent(id as string);

    res.json({
      status: 'success',
      message: 'Event deleted',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to delete event:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete event',
      error: error.message,
    });
  }
});

export default router;
