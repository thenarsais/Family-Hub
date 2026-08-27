import request from 'supertest';
import express from 'express';

const mockCalendarService = {
  getFamilyEvents: jest.fn(),
  getUpcomingEvents: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
};
jest.mock('../../services/calendar', () => ({ getCalendarService: () => mockCalendarService }));

const mockFamilyService = {
  getUserFamily: jest.fn(),
};
jest.mock('../../services/family', () => ({ getFamilyService: () => mockFamilyService }));

const mockGoogleOAuthService = {
  getUserToken: jest.fn(),
  getAuthUrl: jest.fn(),
  exchangeCodeForToken: jest.fn(),
  storeUserToken: jest.fn(),
  getCalendarEvents: jest.fn(),
  declineEventIfInvited: jest.fn(),
  disconnectCalendar: jest.fn(),
};
jest.mock('../../services/google-oauth', () => ({ getGoogleOAuthService: () => mockGoogleOAuthService }));

const mockEq = jest.fn();
const mockUpsert = jest.fn();
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: mockEq,
  upsert: mockUpsert,
};
jest.mock('../../services/supabase', () => ({ getSupabase: () => mockSupabase }));

import calendarRoutes from '../../routes/calendar';

const app = express();
app.use(express.json());
app.use('/api/calendar', calendarRoutes);

describe('Calendar Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
  });

  describe('GET /api/calendar/events', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/calendar/events').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should return 404 when the user has no family', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/calendar/events').set('x-user-id', 'user-1').expect(404);
      expect(res.body.message).toBe('No family found');
    });

    it('should return events for the family, forwarding date range', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({ id: 'family-1' });
      mockCalendarService.getFamilyEvents.mockResolvedValueOnce([{ id: 'e1' }]);

      const res = await request(app)
        .get('/api/calendar/events?startDate=2026-01-01&endDate=2026-01-31')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(mockCalendarService.getFamilyEvents).toHaveBeenCalledWith('family-1', '2026-01-01', '2026-01-31');
      expect(res.body.count).toBe(1);
    });

    it('should return 500 on service failure', async () => {
      mockFamilyService.getUserFamily.mockRejectedValueOnce(new Error('down'));

      const res = await request(app).get('/api/calendar/events').set('x-user-id', 'user-1').expect(500);
      expect(res.body.message).toBe('Failed to fetch events');
    });
  });

  describe('GET /api/calendar/upcoming', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/calendar/upcoming').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should return 404 when the user has no family', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/calendar/upcoming').set('x-user-id', 'user-1').expect(404);
      expect(res.body.message).toBe('No family found');
    });

    it('should return upcoming events', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({ id: 'family-1' });
      mockCalendarService.getUpcomingEvents.mockResolvedValueOnce([{ id: 'e1' }]);

      const res = await request(app).get('/api/calendar/upcoming').set('x-user-id', 'user-1').expect(200);
      expect(res.body.count).toBe(1);
    });
  });

  describe('POST /api/calendar/events', () => {
    it('should require a user id', async () => {
      const res = await request(app)
        .post('/api/calendar/events')
        .send({ event_title: 't', event_date: '2026-01-01' })
        .expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should require event_title and event_date', async () => {
      const res = await request(app)
        .post('/api/calendar/events')
        .set('x-user-id', 'user-1')
        .send({})
        .expect(400);
      expect(res.body.message).toBe('Missing required fields: event_title, event_date');
    });

    it('should return 404 when the user has no family', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/calendar/events')
        .set('x-user-id', 'user-1')
        .send({ event_title: 't', event_date: '2026-01-01' })
        .expect(404);
      expect(res.body.message).toBe('No family found');
    });

    it('should create an event', async () => {
      mockFamilyService.getUserFamily.mockResolvedValueOnce({ id: 'family-1' });
      const created = { id: 'e1' };
      mockCalendarService.createEvent.mockResolvedValueOnce(created);

      const res = await request(app)
        .post('/api/calendar/events')
        .set('x-user-id', 'user-1')
        .send({ event_title: 'Soccer', event_date: '2026-01-01' })
        .expect(201);

      expect(mockCalendarService.createEvent).toHaveBeenCalledWith(
        'family-1',
        'user-1',
        expect.objectContaining({ event_title: 'Soccer', event_date: '2026-01-01' })
      );
      expect(res.body.data).toEqual(created);
    });

    it('should return 500 on service failure', async () => {
      mockFamilyService.getUserFamily.mockRejectedValueOnce(new Error('down'));

      const res = await request(app)
        .post('/api/calendar/events')
        .set('x-user-id', 'user-1')
        .send({ event_title: 't', event_date: '2026-01-01' })
        .expect(500);
      expect(res.body.message).toBe('Failed to create event');
    });
  });

  describe('PATCH /api/calendar/events/:id', () => {
    it('should update an event', async () => {
      const updated = { id: 'e1', event_title: 'New' };
      mockCalendarService.updateEvent.mockResolvedValueOnce(updated);

      const res = await request(app)
        .patch('/api/calendar/events/e1')
        .send({ event_title: 'New' })
        .expect(200);

      expect(mockCalendarService.updateEvent).toHaveBeenCalledWith('e1', { event_title: 'New' });
      expect(res.body.data).toEqual(updated);
    });

    it('should return 500 on service failure', async () => {
      mockCalendarService.updateEvent.mockRejectedValueOnce(new Error('down'));

      const res = await request(app).patch('/api/calendar/events/e1').send({}).expect(500);
      expect(res.body.message).toBe('Failed to update event');
    });
  });

  describe('DELETE /api/calendar/events/:id', () => {
    it('should delete an event', async () => {
      mockCalendarService.deleteEvent.mockResolvedValueOnce(undefined);

      const res = await request(app).delete('/api/calendar/events/e1').expect(200);

      expect(mockCalendarService.deleteEvent).toHaveBeenCalledWith('e1');
      expect(res.body.message).toBe('Event deleted');
    });

    it('should return 500 on service failure', async () => {
      mockCalendarService.deleteEvent.mockRejectedValueOnce(new Error('down'));

      const res = await request(app).delete('/api/calendar/events/e1').expect(500);
      expect(res.body.message).toBe('Failed to delete event');
    });
  });

  describe('GET /api/calendar/auth/google', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/calendar/auth/google').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('reports connected AND still hands back an auth URL for a usable token', async () => {
      mockGoogleOAuthService.getUserToken.mockResolvedValueOnce({
        access_token: 'tok',
        expires_in: 3600,
      });
      mockGoogleOAuthService.getAuthUrl.mockReturnValueOnce('https://accounts.google.com/auth');

      const res = await request(app).get('/api/calendar/auth/google').set('x-user-id', 'user-1').expect(200);

      expect(res.body.data).toEqual({ connected: true, authUrl: 'https://accounts.google.com/auth' });
    });

    it('should report connected when expiring soon but a refresh_token exists', async () => {
      mockGoogleOAuthService.getUserToken.mockResolvedValueOnce({
        access_token: 'tok',
        expires_in: 60,
        refresh_token: 'refresh',
      });
      mockGoogleOAuthService.getAuthUrl.mockReturnValueOnce('https://accounts.google.com/auth');

      const res = await request(app).get('/api/calendar/auth/google').set('x-user-id', 'user-1').expect(200);

      expect(res.body.data.connected).toBe(true);
    });

    it('should return an auth URL when no usable token exists', async () => {
      mockGoogleOAuthService.getUserToken.mockResolvedValueOnce(null);
      mockGoogleOAuthService.getAuthUrl.mockReturnValueOnce('https://accounts.google.com/auth');

      const res = await request(app).get('/api/calendar/auth/google').set('x-user-id', 'user-1').expect(200);

      expect(res.body.data).toEqual({ connected: false, authUrl: 'https://accounts.google.com/auth' });
    });

    it('should return an auth URL when the token is expired with no refresh token', async () => {
      mockGoogleOAuthService.getUserToken.mockResolvedValueOnce({ access_token: 'tok', expires_in: 60 });
      mockGoogleOAuthService.getAuthUrl.mockReturnValueOnce('https://accounts.google.com/auth');

      const res = await request(app).get('/api/calendar/auth/google').set('x-user-id', 'user-1').expect(200);

      expect(res.body.data.connected).toBe(false);
    });

    it('should return 500 on service failure', async () => {
      mockGoogleOAuthService.getUserToken.mockRejectedValueOnce(new Error('down'));

      const res = await request(app).get('/api/calendar/auth/google').set('x-user-id', 'user-1').expect(500);
      expect(res.body.message).toBe('Failed to get auth URL');
    });
  });

  describe('GET /api/calendar/auth/google/callback', () => {
    it('should require code and state', async () => {
      const res = await request(app).get('/api/calendar/auth/google/callback').expect(400);
      expect(res.body.message).toBe('Missing authorization code or state');
    });

    it('should exchange the code, store the token, and redirect with success', async () => {
      mockGoogleOAuthService.exchangeCodeForToken.mockResolvedValueOnce({ access_token: 'tok' });
      mockGoogleOAuthService.storeUserToken.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .get('/api/calendar/auth/google/callback?code=abc&state=user-1')
        .expect(302);

      expect(mockGoogleOAuthService.exchangeCodeForToken).toHaveBeenCalledWith('abc');
      expect(mockGoogleOAuthService.storeUserToken).toHaveBeenCalledWith('user-1', { access_token: 'tok' });
      expect(res.headers.location).toContain('googleAuth=success');
    });

    it('should redirect with an error param when the exchange fails', async () => {
      mockGoogleOAuthService.exchangeCodeForToken.mockRejectedValueOnce(new Error('bad code'));

      const res = await request(app)
        .get('/api/calendar/auth/google/callback?code=abc&state=user-1')
        .expect(302);

      expect(res.headers.location).toContain('googleAuth=error');
    });
  });

  describe('GET /api/calendar/google/events', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/calendar/google/events').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should default maxResults to 250 and derive timeMin as this week\'s Monday', async () => {
      mockGoogleOAuthService.getCalendarEvents.mockResolvedValueOnce([{ id: 'ev1' }]);

      const res = await request(app).get('/api/calendar/google/events').set('x-user-id', 'user-1').expect(200);

      expect(mockGoogleOAuthService.getCalendarEvents).toHaveBeenCalledWith(
        'user-1',
        expect.any(String),
        undefined,
        250
      );
      expect(res.body.source).toBe('google_calendar');
      expect(res.body.count).toBe(1);
    });

    it('should pass through explicit timeMin/timeMax/maxResults', async () => {
      mockGoogleOAuthService.getCalendarEvents.mockResolvedValueOnce([]);

      await request(app)
        .get('/api/calendar/google/events?timeMin=2026-01-01T00:00:00Z&timeMax=2026-01-31T00:00:00Z&maxResults=10')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(mockGoogleOAuthService.getCalendarEvents).toHaveBeenCalledWith(
        'user-1',
        '2026-01-01T00:00:00Z',
        '2026-01-31T00:00:00Z',
        10
      );
    });

    it('should surface a custom status/code from a thrown error', async () => {
      const err = Object.assign(new Error('token expired'), { status: 401, code: 'TOKEN_EXPIRED' });
      mockGoogleOAuthService.getCalendarEvents.mockRejectedValueOnce(err);

      const res = await request(app).get('/api/calendar/google/events').set('x-user-id', 'user-1').expect(401);

      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should default to 500 when the error has no status', async () => {
      mockGoogleOAuthService.getCalendarEvents.mockRejectedValueOnce(new Error('boom'));

      const res = await request(app).get('/api/calendar/google/events').set('x-user-id', 'user-1').expect(500);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/calendar/google/disconnect', () => {
    it('should require a user id', async () => {
      const res = await request(app).post('/api/calendar/google/disconnect').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should disconnect the calendar', async () => {
      mockGoogleOAuthService.disconnectCalendar.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/calendar/google/disconnect')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(mockGoogleOAuthService.disconnectCalendar).toHaveBeenCalledWith('user-1');
      expect(res.body.message).toBe('Google Calendar disconnected successfully');
    });

    it('should return 500 on service failure', async () => {
      mockGoogleOAuthService.disconnectCalendar.mockRejectedValueOnce(new Error('down'));

      const res = await request(app)
        .post('/api/calendar/google/disconnect')
        .set('x-user-id', 'user-1')
        .expect(500);
      expect(res.body.message).toBe('Failed to disconnect Google Calendar');
    });
  });

  describe('GET /api/calendar/dismissed', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/calendar/dismissed').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should return dismissed events for the user', async () => {
      mockEq.mockResolvedValueOnce({ data: [{ event_id: 'e1' }], error: null });

      const res = await request(app).get('/api/calendar/dismissed').set('x-user-id', 'user-1').expect(200);

      expect(res.body.data).toEqual([{ event_id: 'e1' }]);
    });

    it('should default to an empty array when data is null', async () => {
      mockEq.mockResolvedValueOnce({ data: null, error: null });

      const res = await request(app).get('/api/calendar/dismissed').set('x-user-id', 'user-1').expect(200);

      expect(res.body.data).toEqual([]);
    });

    it('should return 500 when supabase returns an error', async () => {
      mockEq.mockResolvedValueOnce({ data: null, error: new Error('rls denied') });

      const res = await request(app).get('/api/calendar/dismissed').set('x-user-id', 'user-1').expect(500);
      expect(res.body.message).toBe('Failed to fetch dismissed events');
    });
  });

  describe('POST /api/calendar/events/:id/dismiss', () => {
    it('should require a user id', async () => {
      const res = await request(app).post('/api/calendar/events/e1/dismiss').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should upsert a dismissal record', async () => {
      mockUpsert.mockResolvedValueOnce({ error: null });

      const res = await request(app)
        .post('/api/calendar/events/e1/dismiss')
        .set('x-user-id', 'user-1')
        .send({ calendarId: 'cal-1' })
        .expect(200);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1', event_id: 'e1', calendar_id: 'cal-1' }),
        { onConflict: 'user_id,event_id' }
      );
      expect(res.body.message).toBe('Event dismissed successfully');
    });

    it('should return 500 when supabase returns an error', async () => {
      mockUpsert.mockResolvedValueOnce({ error: new Error('rls denied') });

      const res = await request(app)
        .post('/api/calendar/events/e1/dismiss')
        .set('x-user-id', 'user-1')
        .send({})
        .expect(500);
      expect(res.body.message).toBe('Failed to dismiss event');
    });

    it('declines the invite in Google for a google event the user attends', async () => {
      mockUpsert.mockResolvedValueOnce({ error: null });
      mockGoogleOAuthService.declineEventIfInvited.mockResolvedValueOnce({ declined: true });

      const res = await request(app)
        .post('/api/calendar/events/g1/dismiss')
        .set('x-user-id', 'user-1')
        .send({ calendarId: 'cal-1', source: 'google' })
        .expect(200);

      expect(mockGoogleOAuthService.declineEventIfInvited).toHaveBeenCalledWith('user-1', 'cal-1', 'g1');
      expect(res.body.data).toEqual({ local: true, synced: true, action: 'declined' });
    });

    it('local-hides only when the user is not an attendee of the google event', async () => {
      mockUpsert.mockResolvedValueOnce({ error: null });
      mockGoogleOAuthService.declineEventIfInvited.mockResolvedValueOnce({ declined: false, reason: 'not_an_attendee' });

      const res = await request(app)
        .post('/api/calendar/events/g1/dismiss')
        .set('x-user-id', 'user-1')
        .send({ calendarId: 'cal-1', source: 'google' })
        .expect(200);

      expect(res.body.data).toEqual({ local: true, synced: false, reason: 'not_an_attendee' });
    });

    it('reports reconnect_required when the Google write is rejected for scope', async () => {
      mockUpsert.mockResolvedValueOnce({ error: null });
      mockGoogleOAuthService.declineEventIfInvited.mockRejectedValueOnce({ status: 403 });

      const res = await request(app)
        .post('/api/calendar/events/g1/dismiss')
        .set('x-user-id', 'user-1')
        .send({ calendarId: 'cal-1', source: 'google' })
        .expect(200);

      expect(res.body.data).toEqual({ local: true, synced: false, reason: 'reconnect_required' });
    });

    it('does not touch Google for a local event', async () => {
      mockUpsert.mockResolvedValueOnce({ error: null });

      await request(app)
        .post('/api/calendar/events/l1/dismiss')
        .set('x-user-id', 'user-1')
        .send({ calendarId: 'family', source: 'local' })
        .expect(200);

      expect(mockGoogleOAuthService.declineEventIfInvited).not.toHaveBeenCalled();
    });
  });
});
