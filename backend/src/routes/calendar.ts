import { Router, Request, Response } from 'express';
import { getCalendarService } from '../services/calendar';
import { getFamilyService } from '../services/family';
import { getGoogleOAuthService } from '../services/google-oauth';

import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
const calendar = getCalendarService();
const family = getFamilyService();
const googleOAuth = getGoogleOAuthService();

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
  } catch (error: unknown) {
    console.error('Failed to fetch events:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch events',
      error: getErrorMessage(error),
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
  } catch (error: unknown) {
    console.error('Failed to fetch upcoming events:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch upcoming events',
      error: getErrorMessage(error),
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
  } catch (error: unknown) {
    console.error('Failed to create event:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create event',
      error: getErrorMessage(error),
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
  } catch (error: unknown) {
    console.error('Failed to update event:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update event',
      error: getErrorMessage(error),
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
  } catch (error: unknown) {
    console.error('Failed to delete event:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete event',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /auth/google
 * Start Google OAuth flow or check if already connected
 */
router.get('/auth/google', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] || req.query.userId) as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    // Only report "connected" if the token is still usable. An expired token
    // with no refresh_token cannot be renewed, so the user must re-consent —
    // reporting it as connected would leave them with no way to re-authorize.
    const existingToken = await googleOAuth.getUserToken(userId);
    const isUsable = existingToken?.access_token
      && (existingToken.expires_in > 300 || !!existingToken.refresh_token);

    if (isUsable) {
      return res.json({
        status: 'success',
        data: { connected: true, authUrl: null },
        timestamp: new Date().toISOString(),
      });
    }

    // No token exists, return OAuth URL
    const authUrl = googleOAuth.getAuthUrl(userId);
    res.json({
      status: 'success',
      data: { connected: false, authUrl },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to get auth URL:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get auth URL',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /auth/google/callback
 * Google OAuth callback
 */
router.get('/auth/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing authorization code or state',
      });
    }

    const userId = state as string;
    const token = await googleOAuth.exchangeCodeForToken(code as string);
    await googleOAuth.storeUserToken(userId, token);

    // Redirect back to dashboard with success parameter
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard?googleAuth=success`);
  } catch (error: unknown) {
    console.error('Failed to handle OAuth callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard?googleAuth=error&message=${encodeURIComponent(getErrorMessage(error))}`);
  }
});

/**
 * GET /google/events
 * Get user's Google Calendar events
 */
router.get('/google/events', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    let timeMin = req.query.timeMin as string | undefined;
    const timeMax = req.query.timeMax as string | undefined;
    const maxResults = parseInt(req.query.maxResults as string) || 250;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    // If no timeMin specified, use start of current week (Monday)
    if (!timeMin) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(now.setDate(diff));
      weekStart.setHours(0, 0, 0, 0);
      timeMin = weekStart.toISOString();
    }

    const events = await googleOAuth.getCalendarEvents(userId, timeMin, timeMax, maxResults);

    res.json({
      status: 'success',
      data: events,
      count: events.length,
      source: 'google_calendar',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to fetch Google Calendar events:', error);
    const errorObj = error as { status?: number; code?: unknown };
    const statusCode = errorObj?.status || 500;
    res.status(statusCode).json({
      status: 'error',
      code: errorObj?.code,
      message: getErrorMessage(error) || 'Failed to fetch Google Calendar events',
      error: getErrorMessage(error),
    });
  }
});

/**
 * POST /google/disconnect
 * Disconnect Google Calendar
 */
router.post('/google/disconnect', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    await googleOAuth.disconnectCalendar(userId);

    res.json({
      status: 'success',
      message: 'Google Calendar disconnected successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to disconnect Google Calendar:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to disconnect Google Calendar',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/calendar/dismissed
 * Get list of dismissed events for the user
 */
router.get('/dismissed', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const { data, error } = await require('../services/supabase').getSupabase()
      .from('dismissed_events')
      .select('event_id, calendar_id, dismissed_at')
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      status: 'success',
      data: data || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to fetch dismissed events:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dismissed events',
      error: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/calendar/events/:id/dismiss
 * Dismiss/hide an event from the calendar
 */
router.post('/events/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { calendarId, source } = req.body || {};

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Event ID required',
      });
    }

    // Local hide: always recorded, so the event stays out of this user's
    // Family Hub calendar regardless of what happens with Google below.
    const { error } = await require('../services/supabase').getSupabase()
      .from('dismissed_events')
      .upsert({
        user_id: userId,
        event_id: id,
        calendar_id: calendarId,
        dismissed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,event_id',
      });

    if (error) throw error;

    // Two-way sync: for a Google event the user is invited to, also decline
    // the invite in their Google Calendar. Owned / uninvited / local events
    // are a local hide only.
    let sync: { synced: boolean; action?: 'declined'; reason?: string } = { synced: false };
    if (source === 'google' && calendarId) {
      try {
        const result = await googleOAuth.declineEventIfInvited(userId, calendarId, id as string);
        sync = result.declined
          ? { synced: true, action: 'declined' }
          : { synced: false, reason: result.reason };
      } catch (syncError: unknown) {
        const status = (syncError as { status?: number; code?: number })?.status
          ?? (syncError as { code?: number })?.code;
        sync = { synced: false, reason: status === 403 ? 'reconnect_required' : 'google_error' };
        console.warn('Google decline failed during dismiss:', getErrorMessage(syncError));
      }
    }

    res.json({
      status: 'success',
      message: 'Event dismissed successfully',
      data: { local: true, ...sync },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to dismiss event:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to dismiss event',
      error: getErrorMessage(error),
    });
  }
});

export default router;
