/**
 * Google OAuth Service Tests — everything except disconnectCalendar(),
 * which already has dedicated regression coverage in google-oauth.test.ts.
 */

process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder-service-role-key';

const mockOAuth2Instance = {
  generateAuthUrl: jest.fn(),
  getToken: jest.fn(),
  setCredentials: jest.fn(),
  refreshAccessToken: jest.fn(),
};

const mockCalendarListList = jest.fn();
const mockEventsList = jest.fn();
const mockEventsGet = jest.fn();
const mockEventsPatch = jest.fn();
const mockEventsInsert = jest.fn();
const mockEventsDelete = jest.fn();
const mockCalendarClient = {
  calendarList: { list: mockCalendarListList },
  events: {
    list: mockEventsList, get: mockEventsGet, patch: mockEventsPatch,
    insert: mockEventsInsert, delete: mockEventsDelete,
  },
};

jest.mock('googleapis', () => ({
  google: {
    auth: { OAuth2: jest.fn(() => mockOAuth2Instance) },
    calendar: jest.fn(() => mockCalendarClient),
  },
}));

interface MockChain {
  from: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  update: jest.Mock;
  upsert: jest.Mock;
  single: jest.Mock;
  then: (resolve: (value: { error: unknown }) => void) => void;
}

const mockChain: MockChain = {
  from: jest.fn(),
  select: jest.fn(),
  eq: jest.fn(),
  update: jest.fn(),
  upsert: jest.fn(),
  single: jest.fn(),
  then: () => {},
};
mockChain.from.mockReturnValue(mockChain);
mockChain.select.mockReturnValue(mockChain);
mockChain.eq.mockReturnValue(mockChain);
mockChain.update.mockReturnValue(mockChain);
mockChain.upsert.mockReturnValue(mockChain);
let thenResolution: { error: unknown } = { error: null };
mockChain.then = (resolve) => resolve(thenResolution);

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockChain),
}));
jest.mock('axios');

import { getGoogleOAuthService } from '../../services/google-oauth';

describe('GoogleOAuthService', () => {
  const userId = 'user-123';
  const service = getGoogleOAuthService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockChain.from.mockReturnValue(mockChain);
    mockChain.select.mockReturnValue(mockChain);
    mockChain.eq.mockReturnValue(mockChain);
    mockChain.update.mockReturnValue(mockChain);
    mockChain.upsert.mockReturnValue(mockChain);
    thenResolution = { error: null };
  });

  describe('getAuthUrl', () => {
    it('should generate an offline-access URL scoped to calendar read + events write, keyed by userId', () => {
      mockOAuth2Instance.generateAuthUrl.mockReturnValueOnce('https://accounts.google.com/auth?x=1');

      const url = service.getAuthUrl(userId);

      expect(mockOAuth2Instance.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/calendar.events',
        ],
        state: userId,
      });
      expect(url).toBe('https://accounts.google.com/auth?x=1');
    });
  });

  describe('declineEventIfInvited', () => {
    const validToken = () =>
      mockChain.single.mockResolvedValueOnce({
        data: {
          access_token: 'tok',
          refresh_token: null,
          token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        },
        error: null,
      });

    it('returns no_token when the user has no stored token', async () => {
      mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

      const result = await service.declineEventIfInvited(userId, 'cal-1', 'ev-1');

      expect(result).toEqual({ declined: false, reason: 'no_token' });
      expect(mockEventsGet).not.toHaveBeenCalled();
    });

    it('does not patch when the user is not an attendee', async () => {
      validToken();
      mockEventsGet.mockResolvedValueOnce({
        data: { attendees: [{ email: 'someone@else.com' }] },
      });

      const result = await service.declineEventIfInvited(userId, 'cal-1', 'ev-1');

      expect(result).toEqual({ declined: false, reason: 'not_an_attendee' });
      expect(mockEventsPatch).not.toHaveBeenCalled();
    });

    it('does not patch when the event has no attendees at all', async () => {
      validToken();
      mockEventsGet.mockResolvedValueOnce({ data: {} });

      const result = await service.declineEventIfInvited(userId, 'cal-1', 'ev-1');

      expect(result).toEqual({ declined: false, reason: 'not_an_attendee' });
    });

    it('patches the self attendee to declined and returns declined:true', async () => {
      validToken();
      mockEventsGet.mockResolvedValueOnce({
        data: {
          attendees: [
            { email: 'other@x.com', responseStatus: 'accepted' },
            { email: 'me@x.com', self: true, responseStatus: 'needsAction' },
          ],
        },
      });
      mockEventsPatch.mockResolvedValueOnce({ data: {} });

      const result = await service.declineEventIfInvited(userId, 'cal-1', 'ev-1');

      expect(result).toEqual({ declined: true });
      expect(mockEventsPatch).toHaveBeenCalledWith({
        calendarId: 'cal-1',
        eventId: 'ev-1',
        sendUpdates: 'none',
        requestBody: {
          attendees: [
            { email: 'other@x.com', responseStatus: 'accepted' },
            { email: 'me@x.com', self: true, responseStatus: 'declined' },
          ],
        },
      });
    });

    it('propagates a Google write error to the caller', async () => {
      validToken();
      mockEventsGet.mockResolvedValueOnce({ data: { attendees: [{ self: true }] } });
      mockEventsPatch.mockRejectedValueOnce({ code: 403, message: 'insufficient scope' });

      await expect(service.declineEventIfInvited(userId, 'cal-1', 'ev-1')).rejects.toMatchObject({ code: 403 });
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should convert a successful token exchange to GoogleAuthToken', async () => {
      const expiryDate = Date.now() + 3600 * 1000;
      mockOAuth2Instance.getToken.mockResolvedValueOnce({
        tokens: { access_token: 'tok', refresh_token: 'refresh', expiry_date: expiryDate, token_type: 'Bearer' },
      });

      const result = await service.exchangeCodeForToken('auth-code');

      expect(mockOAuth2Instance.getToken).toHaveBeenCalledWith('auth-code');
      expect(result.access_token).toBe('tok');
      expect(result.refresh_token).toBe('refresh');
      expect(result.expires_in).toBeGreaterThan(3500);
    });

    it('should default expires_in to 3600 when there is no expiry_date', async () => {
      mockOAuth2Instance.getToken.mockResolvedValueOnce({ tokens: { access_token: 'tok' } });

      const result = await service.exchangeCodeForToken('auth-code');

      expect(result.expires_in).toBe(3600);
      expect(result.token_type).toBe('Bearer');
    });

    it('should throw when the response has no access_token', async () => {
      mockOAuth2Instance.getToken.mockResolvedValueOnce({ tokens: {} });

      await expect(service.exchangeCodeForToken('auth-code')).rejects.toThrow(
        'Google OAuth response is missing an access_token'
      );
    });

    it('should propagate a failed exchange', async () => {
      mockOAuth2Instance.getToken.mockRejectedValueOnce(new Error('invalid_grant'));

      await expect(service.exchangeCodeForToken('bad-code')).rejects.toThrow('invalid_grant');
    });
  });

  describe('storeUserToken', () => {
    it('should upsert the token with a computed absolute expiry', async () => {
      await service.storeUserToken(userId, {
        access_token: 'tok',
        refresh_token: 'refresh',
        expires_in: 1800,
        token_type: 'Bearer',
      });

      expect(mockChain.from).toHaveBeenCalledWith('user_integrations');
      expect(mockChain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: userId, provider: 'google_calendar', access_token: 'tok', is_active: true }),
        { onConflict: 'user_id,provider' }
      );
    });

    it('should default expires_in to 3600 when falsy', async () => {
      await service.storeUserToken(userId, { access_token: 'tok', expires_in: 0, token_type: 'Bearer' });

      const upsertArg = mockChain.upsert.mock.calls[0][0];
      const expiresAt = new Date(upsertArg.token_expires_at).getTime();
      expect(expiresAt).toBeGreaterThan(Date.now() + 3500 * 1000);
    });

    it('should throw when the upsert fails', async () => {
      thenResolution = { error: new Error('constraint violation') };

      await expect(
        service.storeUserToken(userId, { access_token: 'tok', expires_in: 3600, token_type: 'Bearer' })
      ).rejects.toThrow('constraint violation');
    });
  });

  describe('getUserToken', () => {
    it('should return null when no active token row exists', async () => {
      mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

      const result = await service.getUserToken(userId);

      expect(result).toBeNull();
    });

    it('should compute expires_in from the stored absolute expiry', async () => {
      const futureExpiry = new Date(Date.now() + 1800 * 1000).toISOString();
      mockChain.single.mockResolvedValueOnce({
        data: { access_token: 'tok', refresh_token: 'refresh', token_expires_at: futureExpiry },
        error: null,
      });

      const result = await service.getUserToken(userId);

      expect(result?.access_token).toBe('tok');
      expect(result?.expires_in).toBeGreaterThan(1700);
      expect(result?.token_type).toBe('Bearer');
    });

    it('should return null when the lookup throws', async () => {
      mockChain.single.mockRejectedValueOnce(new Error('db down'));

      const result = await service.getUserToken(userId);

      expect(result).toBeNull();
    });
  });

  describe('refreshAccessToken', () => {
    it('should convert refreshed credentials to a GoogleAuthToken', async () => {
      const expiryDate = Date.now() + 3600 * 1000;
      mockOAuth2Instance.refreshAccessToken.mockResolvedValueOnce({
        credentials: { access_token: 'new-tok', expiry_date: expiryDate },
      });

      const result = await service.refreshAccessToken('refresh-tok');

      expect(mockOAuth2Instance.setCredentials).toHaveBeenCalledWith({ refresh_token: 'refresh-tok' });
      expect(result.access_token).toBe('new-tok');
    });

    it('should mark the integration inactive when refresh fails and a userId is given', async () => {
      mockOAuth2Instance.refreshAccessToken.mockRejectedValueOnce(new Error('invalid_grant'));

      await expect(service.refreshAccessToken('refresh-tok', userId)).rejects.toThrow('invalid_grant');

      expect(mockChain.update).toHaveBeenCalledWith({ is_active: false });
    });

    it('should still throw the original error even if marking inactive itself fails', async () => {
      mockOAuth2Instance.refreshAccessToken.mockRejectedValueOnce(new Error('invalid_grant'));
      thenResolution = { error: new Error('db down') };

      await expect(service.refreshAccessToken('refresh-tok', userId)).rejects.toThrow('invalid_grant');
    });

    it('should not attempt to mark inactive when no userId is given', async () => {
      mockOAuth2Instance.refreshAccessToken.mockRejectedValueOnce(new Error('invalid_grant'));

      await expect(service.refreshAccessToken('refresh-tok')).rejects.toThrow('invalid_grant');

      expect(mockChain.update).not.toHaveBeenCalled();
    });
  });

  describe('listCalendars', () => {
    it('should return an empty array when there is no stored token', async () => {
      mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

      const result = await service.listCalendars(userId);

      expect(result).toEqual([]);
    });

    it('should return calendars for a still-valid token', async () => {
      const futureExpiry = new Date(Date.now() + 3600 * 1000).toISOString();
      mockChain.single.mockResolvedValueOnce({
        data: { access_token: 'tok', refresh_token: null, token_expires_at: futureExpiry },
        error: null,
      });
      mockCalendarListList.mockResolvedValueOnce({ data: { items: [{ id: 'cal1', summary: 'Primary' }] } });

      const result = await service.listCalendars(userId);

      expect(result).toEqual([{ id: 'cal1', summary: 'Primary' }]);
    });

    it('should refresh an expiring token before listing calendars', async () => {
      const soonExpiry = new Date(Date.now() + 60 * 1000).toISOString();
      mockChain.single.mockResolvedValueOnce({
        data: { access_token: 'old-tok', refresh_token: 'refresh-tok', token_expires_at: soonExpiry },
        error: null,
      });
      mockOAuth2Instance.refreshAccessToken.mockResolvedValueOnce({
        credentials: { access_token: 'new-tok', expiry_date: Date.now() + 3600 * 1000 },
      });
      mockCalendarListList.mockResolvedValueOnce({ data: { items: [] } });

      const result = await service.listCalendars(userId);

      expect(mockChain.upsert).toHaveBeenCalled(); // storeUserToken persisted the refreshed token
      expect(result).toEqual([]);
    });

    it('should throw NO_REFRESH_TOKEN when expiring and there is no refresh token', async () => {
      const soonExpiry = new Date(Date.now() + 60 * 1000).toISOString();
      mockChain.single.mockResolvedValueOnce({
        data: { access_token: 'old-tok', refresh_token: null, token_expires_at: soonExpiry },
        error: null,
      });

      await expect(service.listCalendars(userId)).rejects.toMatchObject({ code: 'NO_REFRESH_TOKEN', status: 401 });
    });

    it('should throw TOKEN_REFRESH_FAILED when the refresh call itself fails', async () => {
      const soonExpiry = new Date(Date.now() + 60 * 1000).toISOString();
      mockChain.single.mockResolvedValueOnce({
        data: { access_token: 'old-tok', refresh_token: 'refresh-tok', token_expires_at: soonExpiry },
        error: null,
      });
      mockOAuth2Instance.refreshAccessToken.mockRejectedValueOnce(new Error('revoked'));

      await expect(service.listCalendars(userId)).rejects.toMatchObject({ code: 'TOKEN_REFRESH_FAILED', status: 401 });
    });
  });

  describe('getCalendarEvents', () => {
    it('should return an empty array when there is no stored token', async () => {
      mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

      const result = await service.getCalendarEvents(userId);

      expect(result).toEqual([]);
    });

    it('should aggregate and sort events across all calendars, tagging each with its source calendar', async () => {
      const futureExpiry = new Date(Date.now() + 3600 * 1000).toISOString();
      mockChain.single.mockResolvedValueOnce({
        data: { access_token: 'tok', refresh_token: null, token_expires_at: futureExpiry },
        error: null,
      });
      mockCalendarListList.mockResolvedValueOnce({
        data: {
          items: [
            { id: 'cal1', summary: 'Personal', backgroundColor: '#fff' },
            { id: 'cal2', summary: 'Work', backgroundColor: '#000' },
          ],
        },
      });
      mockEventsList
        .mockResolvedValueOnce({ data: { items: [{ id: 'e2', start: { dateTime: '2026-02-01T10:00:00Z' } }] } })
        .mockResolvedValueOnce({ data: { items: [{ id: 'e1', start: { dateTime: '2026-01-01T10:00:00Z' } }] } });

      const result = await service.getCalendarEvents(userId);

      expect(result.map((e) => e.id)).toEqual(['e1', 'e2']);
      expect(result[0].calendarId).toBe('cal2');
      expect(result[0].calendarName).toBe('Work');
      expect(result[1].calendarId).toBe('cal1');
    });

    it('should continue when one calendar fails to fetch events', async () => {
      const futureExpiry = new Date(Date.now() + 3600 * 1000).toISOString();
      mockChain.single.mockResolvedValueOnce({
        data: { access_token: 'tok', refresh_token: null, token_expires_at: futureExpiry },
        error: null,
      });
      mockCalendarListList.mockResolvedValueOnce({
        data: { items: [{ id: 'cal1', summary: 'Personal' }, { id: 'cal2', summary: 'Broken' }] },
      });
      mockEventsList
        .mockResolvedValueOnce({ data: { items: [{ id: 'e1', start: { dateTime: '2026-01-01T10:00:00Z' } }] } })
        .mockRejectedValueOnce(new Error('calendar unavailable'));

      const result = await service.getCalendarEvents(userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('e1');
    });

    it('should refresh an expiring token before fetching events', async () => {
      const soonExpiry = new Date(Date.now() + 60 * 1000).toISOString();
      mockChain.single.mockResolvedValueOnce({
        data: { access_token: 'old-tok', refresh_token: 'refresh-tok', token_expires_at: soonExpiry },
        error: null,
      });
      mockOAuth2Instance.refreshAccessToken.mockResolvedValueOnce({
        credentials: { access_token: 'new-tok', expiry_date: Date.now() + 3600 * 1000 },
      });
      mockCalendarListList.mockResolvedValueOnce({ data: { items: [] } });

      const result = await service.getCalendarEvents(userId);

      expect(result).toEqual([]);
    });

    it('should throw NO_REFRESH_TOKEN when expiring with no refresh token', async () => {
      const soonExpiry = new Date(Date.now() + 60 * 1000).toISOString();
      mockChain.single.mockResolvedValueOnce({
        data: { access_token: 'old-tok', refresh_token: null, token_expires_at: soonExpiry },
        error: null,
      });

      await expect(service.getCalendarEvents(userId)).rejects.toMatchObject({ code: 'NO_REFRESH_TOKEN' });
    });

    it('should throw TOKEN_REFRESH_FAILED when refresh itself fails', async () => {
      const soonExpiry = new Date(Date.now() + 60 * 1000).toISOString();
      mockChain.single.mockResolvedValueOnce({
        data: { access_token: 'old-tok', refresh_token: 'refresh-tok', token_expires_at: soonExpiry },
        error: null,
      });
      mockOAuth2Instance.refreshAccessToken.mockRejectedValueOnce(new Error('revoked'));

      await expect(service.getCalendarEvents(userId)).rejects.toMatchObject({ code: 'TOKEN_REFRESH_FAILED' });
    });
  });

  describe('createEvent / updateEvent / deleteEvent', () => {
    const validToken = () =>
      mockChain.single.mockResolvedValueOnce({
        data: {
          access_token: 'tok',
          refresh_token: null,
          token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        },
        error: null,
      });

    const timedInput = {
      summary: 'Dentist', description: 'checkup', location: 'Main St',
      allDay: false, startDate: '2026-09-10', startTime: '14:00',
      timeZone: 'America/New_York', attendees: ['mom@example.com'],
    };

    it('throws a typed 401 when the user has no token', async () => {
      mockChain.single.mockResolvedValueOnce({ data: null, error: { message: 'none' } });

      await expect(service.createEvent(userId, 'primary', timedInput, 'all'))
        .rejects.toMatchObject({ status: 401, code: 'NO_TOKEN' });
      expect(mockEventsInsert).not.toHaveBeenCalled();
    });

    it('inserts a timed event with dateTime + timeZone and mapped attendees', async () => {
      validToken();
      mockEventsInsert.mockResolvedValueOnce({ data: { id: 'g-new', summary: 'Dentist' } });

      const result = await service.createEvent(userId, 'primary', timedInput, 'all');

      expect(mockEventsInsert).toHaveBeenCalledWith({
        calendarId: 'primary',
        sendUpdates: 'all',
        requestBody: expect.objectContaining({
          summary: 'Dentist',
          description: 'checkup',
          location: 'Main St',
          attendees: [{ email: 'mom@example.com' }],
          start: { dateTime: '2026-09-10T14:00:00', timeZone: 'America/New_York' },
          end: { dateTime: '2026-09-10T15:00:00', timeZone: 'America/New_York' },
        }),
      });
      expect(result).toEqual({ id: 'g-new', summary: 'Dentist' });
    });

    it('defaults a blank end time to start + 1h, rolling past midnight', async () => {
      validToken();
      mockEventsInsert.mockResolvedValueOnce({ data: { id: 'g-late' } });

      await service.createEvent(userId, 'primary', {
        ...timedInput, startTime: '23:30', endTime: undefined, attendees: undefined,
      }, 'none');

      expect(mockEventsInsert).toHaveBeenCalledWith(expect.objectContaining({
        requestBody: expect.objectContaining({
          start: { dateTime: '2026-09-10T23:30:00', timeZone: 'America/New_York' },
          end: { dateTime: '2026-09-11T00:30:00', timeZone: 'America/New_York' },
        }),
      }));
    });

    it('sends an all-day event with an EXCLUSIVE end date (start + 1 day)', async () => {
      validToken();
      mockEventsInsert.mockResolvedValueOnce({ data: { id: 'g-allday' } });

      await service.createEvent(userId, 'primary', {
        summary: 'Trip', allDay: true, startDate: '2026-09-30',
        timeZone: 'America/New_York',
      }, 'none');

      expect(mockEventsInsert).toHaveBeenCalledWith(expect.objectContaining({
        requestBody: expect.objectContaining({
          start: { date: '2026-09-30' },
          end: { date: '2026-10-01' },
        }),
      }));
    });

    it('patches an event and returns the updated data', async () => {
      validToken();
      mockEventsPatch.mockResolvedValueOnce({ data: { id: 'g-1', summary: 'Dentist moved' } });

      const result = await service.updateEvent(userId, 'primary', 'g-1', timedInput, 'all');

      expect(mockEventsPatch).toHaveBeenCalledWith(expect.objectContaining({
        calendarId: 'primary', eventId: 'g-1', sendUpdates: 'all',
      }));
      expect(result).toEqual({ id: 'g-1', summary: 'Dentist moved' });
    });

    it('re-throws a Google 404 on patch as a typed NOT_FOUND', async () => {
      validToken();
      mockEventsPatch.mockRejectedValueOnce({ code: 404, message: 'Not Found' });

      await expect(service.updateEvent(userId, 'primary', 'g-gone', timedInput, 'all'))
        .rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
    });

    it('deletes an event', async () => {
      validToken();
      mockEventsDelete.mockResolvedValueOnce({});

      const result = await service.deleteEvent(userId, 'primary', 'g-1', 'all');

      expect(mockEventsDelete).toHaveBeenCalledWith({ calendarId: 'primary', eventId: 'g-1', sendUpdates: 'all' });
      expect(result).toEqual({ alreadyGone: false });
    });

    it('resolves delete as alreadyGone on a Google 410', async () => {
      validToken();
      mockEventsDelete.mockRejectedValueOnce({ code: 410, message: 'Resource has been deleted' });

      const result = await service.deleteEvent(userId, 'primary', 'g-1', 'all');

      expect(result).toEqual({ alreadyGone: true });
    });

    it('propagates a non-404 Google error on delete', async () => {
      validToken();
      mockEventsDelete.mockRejectedValueOnce({ code: 500, message: 'backend error' });

      await expect(service.deleteEvent(userId, 'primary', 'g-1', 'all')).rejects.toMatchObject({ code: 500 });
    });
  });
});
