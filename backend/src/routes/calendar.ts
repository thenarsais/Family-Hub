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

    // Report whether the stored token is still usable, but ALWAYS hand back an
    // auth URL too. getAuthUrl is a pure function (no API call), and a token
    // can be broken in ways this check can't see — wrong scopes, revoked
    // upstream — so "re-authorize" has to work even when `connected` is true.
    const existingToken = await googleOAuth.getUserToken(userId);
    const connected = !!(existingToken?.access_token
      && (existingToken.expires_in > 300 || !!existingToken.refresh_token));

    res.json({
      status: 'success',
      data: { connected, authUrl: googleOAuth.getAuthUrl(userId) },
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

/* -------------------------------------------------------------------------- */
/* Google Calendar create / edit / delete (B-lite)                            */
/*                                                                            */
/* Google is the source of truth. Each of these writes to the caller's Google */
/* calendar first, then mirrors the result into calendar_events so non-       */
/* attendee family members see it. Parents/admins only.                       */
/* -------------------------------------------------------------------------- */

type GoogleEventBody = {
  summary?: unknown;
  description?: unknown;
  location?: unknown;
  allDay?: unknown;
  startDate?: unknown;
  startTime?: unknown;
  endDate?: unknown;
  endTime?: unknown;
  timeZone?: unknown;
  attendees?: unknown;
  sendInvites?: unknown;
  calendarId?: unknown;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate + normalise the request body into the CalendarEventInput the
 * google-oauth service expects. Nothing is passed through raw. Returns a
 * string on the first problem.
 */
function parseGoogleEventBody(
  body: GoogleEventBody,
): { input: import('../services/google-oauth').CalendarEventInput; sendUpdates: 'all' | 'none'; calendarId: string } | { error: string } {
  const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
  if (!summary) return { error: 'summary is required' };

  const startDate = typeof body.startDate === 'string' ? body.startDate : '';
  if (!DATE_RE.test(startDate)) return { error: 'startDate must be YYYY-MM-DD' };

  const allDay = body.allDay === true;

  let startTime: string | undefined;
  let endTime: string | undefined;
  if (!allDay) {
    startTime = typeof body.startTime === 'string' ? body.startTime : '';
    if (!TIME_RE.test(startTime)) return { error: 'startTime must be HH:MM for a timed event' };
    if (body.endTime != null && body.endTime !== '') {
      endTime = typeof body.endTime === 'string' ? body.endTime : '';
      if (!TIME_RE.test(endTime)) return { error: 'endTime must be HH:MM' };
    }
  }

  let endDate: string | undefined;
  if (body.endDate != null && body.endDate !== '') {
    endDate = typeof body.endDate === 'string' ? body.endDate : '';
    if (!DATE_RE.test(endDate)) return { error: 'endDate must be YYYY-MM-DD' };
    if (endDate < startDate) return { error: 'endDate cannot be before startDate' };
  }

  const timeZone = typeof body.timeZone === 'string' && body.timeZone ? body.timeZone : 'UTC';

  let attendees: string[] | undefined;
  if (body.attendees != null) {
    if (!Array.isArray(body.attendees)) return { error: 'attendees must be an array of email addresses' };
    attendees = body.attendees.map((a) => String(a).trim()).filter(Boolean);
    const bad = attendees.find((email) => !EMAIL_RE.test(email));
    if (bad) return { error: `"${bad}" is not a valid email address` };
  }

  return {
    input: { summary, description: typeof body.description === 'string' ? body.description : undefined,
      location: typeof body.location === 'string' ? body.location : undefined,
      allDay, startDate, startTime, endDate, endTime, timeZone, attendees },
    sendUpdates: body.sendInvites === false ? 'none' : 'all',
    calendarId: typeof body.calendarId === 'string' && body.calendarId ? body.calendarId : 'primary',
  };
}

/**
 * Resolve the caller's family and confirm they're a parent/admin. Mirrors the
 * gate in routes/family.ts. Returns the family on success, or a ready-to-send
 * { status, message } on failure.
 */
async function requireParent(
  userId: string | undefined,
): Promise<{ family: Awaited<ReturnType<typeof family.getUserFamily>> } | { fail: { status: number; message: string } }> {
  if (!userId) return { fail: { status: 401, message: 'User ID required' } };
  const userFamily = await family.getUserFamily(userId);
  if (!userFamily) return { fail: { status: 404, message: 'No family found' } };
  const caller = userFamily.members.find((m) => m.user_id === userId);
  if (!caller || !['admin', 'parent'].includes(caller.role)) {
    return { fail: { status: 403, message: 'Only a parent can manage calendar events' } };
  }
  return { family: userFamily };
}

function sendGoogleError(res: Response, error: unknown, fallback: string): void {
  const e = error as { status?: number; code?: unknown };
  const status = typeof e?.status === 'number' ? e.status : 500;
  res.status(status).json({
    status: 'error',
    code: e?.code,
    message: getErrorMessage(error) || fallback,
    error: getErrorMessage(error),
  });
}

/**
 * POST /api/calendar/google/events
 * Create an event on the caller's Google Calendar + mirror it locally.
 */
router.post('/google/events', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string | undefined;
    const gate = await requireParent(userId);
    if ('fail' in gate) {
      return res.status(gate.fail.status).json({ status: 'error', message: gate.fail.message });
    }

    const parsed = parseGoogleEventBody(req.body || {});
    if ('error' in parsed) {
      return res.status(400).json({ status: 'error', message: parsed.error });
    }

    const googleEvent = await googleOAuth.createEvent(
      userId as string, parsed.calendarId, parsed.input, parsed.sendUpdates,
    );

    if (!googleEvent.id) {
      return res.status(502).json({ status: 'error', message: 'Google did not return an event id' });
    }

    // Best-effort mirror: the event exists in Google either way, so a failure
    // here degrades family visibility but must not fail the request.
    let mirrorId: string | null = null;
    try {
      const row = await calendar.createMirrorRow(gate.family!.id, userId as string, {
        ...googleEvent, id: googleEvent.id, calendarId: parsed.calendarId,
      });
      mirrorId = row.id;
    } catch (mirrorError: unknown) {
      console.warn('Failed to write calendar mirror row:', getErrorMessage(mirrorError));
    }

    res.status(201).json({
      status: 'success',
      data: { ...googleEvent, google_event_id: googleEvent.id, google_calendar_id: parsed.calendarId, mirrorId },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to create Google Calendar event:', error);
    sendGoogleError(res, error, 'Failed to create Google Calendar event');
  }
});

/**
 * PATCH /api/calendar/google/events/:id
 * Update a feature-created Google event (creator only) + refresh the mirror.
 */
router.patch('/google/events/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string | undefined;
    const { id } = req.params;
    const gate = await requireParent(userId);
    if ('fail' in gate) {
      return res.status(gate.fail.status).json({ status: 'error', message: gate.fail.message });
    }

    const mirror = await calendar.getMirrorRowByGoogleId(id as string);
    if (!mirror) {
      return res.status(404).json({ status: 'error', message: 'That event was not created here' });
    }
    if (mirror.created_by_id !== userId) {
      return res.status(403).json({ status: 'error', message: 'Only the event creator can edit it' });
    }

    const parsed = parseGoogleEventBody(req.body || {});
    if ('error' in parsed) {
      return res.status(400).json({ status: 'error', message: parsed.error });
    }

    const calendarId = mirror.google_calendar_id || 'primary';
    let googleEvent: import('../services/google-oauth').GoogleCalendarEvent;
    try {
      googleEvent = await googleOAuth.updateEvent(
        userId as string, calendarId, id as string, parsed.input, parsed.sendUpdates,
      );
    } catch (error: unknown) {
      if ((error as { status?: number })?.status === 404) {
        await calendar.deleteMirrorByGoogleId(id as string);
      }
      throw error;
    }

    const row = await calendar.updateMirrorByGoogleId(id as string, {
      ...googleEvent, id: id as string, calendarId,
    });

    res.json({
      status: 'success',
      data: { ...googleEvent, google_event_id: id, google_calendar_id: calendarId, mirrorId: row?.id ?? null },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to update Google Calendar event:', error);
    sendGoogleError(res, error, 'Failed to update Google Calendar event');
  }
});

/**
 * DELETE /api/calendar/google/events/:id
 * Delete a feature-created Google event (creator only) + drop the mirror.
 */
router.delete('/google/events/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string | undefined;
    const { id } = req.params;
    const sendInvites = (req.body || {}).sendInvites;
    const gate = await requireParent(userId);
    if ('fail' in gate) {
      return res.status(gate.fail.status).json({ status: 'error', message: gate.fail.message });
    }

    const mirror = await calendar.getMirrorRowByGoogleId(id as string);
    if (!mirror) {
      return res.status(404).json({ status: 'error', message: 'That event was not created here' });
    }
    if (mirror.created_by_id !== userId) {
      return res.status(403).json({ status: 'error', message: 'Only the event creator can delete it' });
    }

    const calendarId = mirror.google_calendar_id || 'primary';
    const result = await googleOAuth.deleteEvent(
      userId as string, calendarId, id as string, sendInvites === false ? 'none' : 'all',
    );
    await calendar.deleteMirrorByGoogleId(id as string);

    res.json({
      status: 'success',
      message: result.alreadyGone ? 'Event was already removed in Google Calendar' : 'Event deleted',
      data: { alreadyGone: result.alreadyGone },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to delete Google Calendar event:', error);
    sendGoogleError(res, error, 'Failed to delete Google Calendar event');
  }
});

export default router;
