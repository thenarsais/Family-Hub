import { CommuteService } from '../../services/commute';
import * as connection from '../../database/connection';
import * as directions from '../../services/directions';
import * as googleOAuth from '../../services/google-oauth';
import * as calendarSvc from '../../services/calendar';

jest.mock('../../database/connection');
jest.mock('../../services/directions');
jest.mock('../../services/google-oauth');
jest.mock('../../services/calendar');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;
const mockIsConfigured = directions.isConfigured as jest.Mock;
const mockGetDrivingTime = directions.getDrivingTime as jest.Mock;
const mockGetGoogleOAuthService = googleOAuth.getGoogleOAuthService as jest.Mock;
const mockGetCalendarEvents = jest.fn();
const mockGetCalendarService = calendarSvc.getCalendarService as jest.Mock;
const mockGetEventPeople = jest.fn();

const ROUTE_ROW = {
  id: 'route-1',
  label: "Krish's school",
  destination_address: '456 School Ave',
  arrive_by_time: '08:00:00',
  buffer_minutes: 10,
  family_member_id: null,
  event_title_pattern: null,
  origin_override: null,
};

describe('CommuteService', () => {
  let service: CommuteService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CommuteService();
    mockGetGoogleOAuthService.mockReturnValue({ getCalendarEvents: mockGetCalendarEvents });
    mockGetCalendarService.mockReturnValue({ getEventPeople: mockGetEventPeople });
  });

  describe('getRoutes', () => {
    it('returns an empty list when the caller has no family', async () => {
      mockQueryOne.mockResolvedValueOnce(null); // familyId
      const routes = await service.getRoutes('nobody');
      expect(routes).toEqual([]);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("maps rows for the caller's family, arrive-time ascending", async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' });
      mockQuery.mockResolvedValueOnce({ rows: [ROUTE_ROW] });

      const routes = await service.getRoutes('user-1');

      expect(routes).toEqual([
        {
          id: 'route-1',
          label: "Krish's school",
          destinationAddress: '456 School Ave',
          arriveByTime: '08:00',
          bufferMinutes: 10,
          familyMemberId: null,
          eventTitlePattern: null,
          originOverride: null,
        },
      ]);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('WHERE family_id = $1');
      expect(params).toEqual(['fam-1']);
    });
  });

  describe('getSummary', () => {
    it('returns an unconfigured empty summary when the caller has no family', async () => {
      mockQueryOne.mockResolvedValueOnce(null); // familyId
      const summary = await service.getSummary('nobody');
      expect(summary).toEqual({ configured: false, homeAddress: null, noSchoolToday: false, routes: [] });
    });

    it('marks routes unconfigured (nulls, no Directions call) without a home address or API key', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId
        .mockResolvedValueOnce({ commute_home_address: null, commute_no_school_date: null }) // settingsFor
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTimezone
        .mockResolvedValueOnce({ family_id: 'fam-1' }); // getRoutes -> familyId (2nd call, Promise.all)
      mockQuery.mockResolvedValueOnce({ rows: [ROUTE_ROW] });
      mockIsConfigured.mockReturnValue(false);

      const summary = await service.getSummary('user-1');

      expect(summary.configured).toBe(false);
      expect(summary.routes).toHaveLength(1);
      expect(summary.routes[0].durationInTrafficMin).toBeNull();
      expect(summary.routes[0].leaveByTime).toBeNull();
      expect(mockGetDrivingTime).not.toHaveBeenCalled();
    });

    it('computes leaveByTime from a live Directions call when configured', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' })
        .mockResolvedValueOnce({ commute_home_address: '123 Home St', commute_no_school_date: null })
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce({ family_id: 'fam-1' });
      mockQuery.mockResolvedValueOnce({ rows: [ROUTE_ROW] });
      mockIsConfigured.mockReturnValue(true);
      mockGetDrivingTime.mockResolvedValueOnce({ durationMin: 15, durationInTrafficMin: 20, distanceMi: 10 });

      const summary = await service.getSummary('user-1');

      expect(summary.configured).toBe(true);
      expect(mockGetDrivingTime).toHaveBeenCalledWith('123 Home St', '456 School Ave');
      const [route] = summary.routes;
      expect(route.durationInTrafficMin).toBe(20);
      expect(route.distanceMi).toBe(10);
      expect(route.trafficDelayMin).toBe(5);
      expect(route.leaveByTime).toMatch(/^\d{2}:\d{2}$/);
    });

    it('surfaces a per-route error flag when Directions fails for that route, without failing the whole summary', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' })
        .mockResolvedValueOnce({ commute_home_address: '123 Home St', commute_no_school_date: null })
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce({ family_id: 'fam-1' });
      mockQuery.mockResolvedValueOnce({ rows: [ROUTE_ROW] });
      mockIsConfigured.mockReturnValue(true);
      mockGetDrivingTime.mockRejectedValueOnce(new Error('boom'));

      const summary = await service.getSummary('user-1');

      expect(summary.routes[0].error).toBe('directions-failed');
      expect(summary.routes[0].leaveByTime).toBeNull();
    });

    it("marks noSchoolToday only when the stored date is today in the family's timezone", async () => {
      const today = new Date().toISOString().slice(0, 10);
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' })
        .mockResolvedValueOnce({ commute_home_address: null, commute_no_school_date: today })
        .mockResolvedValueOnce({ timezone: 'UTC' })
        .mockResolvedValueOnce({ family_id: 'fam-1' });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockIsConfigured.mockReturnValue(false);

      const summary = await service.getSummary('user-1');
      expect(summary.noSchoolToday).toBe(true);
    });
  });

  describe('addRoute', () => {
    it('inserts under the caller\'s family with a default buffer', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' }).mockResolvedValueOnce(ROUTE_ROW);
      const route = await service.addRoute('parent-1', {
        label: "Krish's school",
        destinationAddress: '456 School Ave',
        arriveByTime: '08:00',
      });
      expect(route.label).toBe("Krish's school");
      const [, params] = mockQueryOne.mock.calls[1];
      expect(params).toEqual(['fam-1', null, "Krish's school", '456 School Ave', '08:00', null, null, null]);
    });

    it('throws no-family when the caller has none', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      await expect(
        service.addRoute('nobody', { label: 'x', destinationAddress: 'y', arriveByTime: '08:00' }),
      ).rejects.toThrow('no-family');
    });
  });

  describe('updateRoute / deleteRoute cross-family guard', () => {
    it('refuses to update a route in a different family', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' }).mockResolvedValueOnce({ family_id: 'fam-2' });
      const route = await service.updateRoute('outsider', 'route-1', { label: 'x' });
      expect(route).toBeNull();
    });

    it('refuses to delete a route in a different family', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' }).mockResolvedValueOnce({ family_id: 'fam-2' });
      const ok = await service.deleteRoute('outsider', 'route-1');
      expect(ok).toBe(false);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('getSuggestions (T-26)', () => {
    it('returns [] when the caller has no family', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      const suggestions = await service.getSuggestions('nobody');
      expect(suggestions).toEqual([]);
    });

    it('returns [] when no family member has a connected Google account', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' }).mockResolvedValueOnce(null);
      const suggestions = await service.getSuggestions('user-1');
      expect(suggestions).toEqual([]);
      expect(mockGetCalendarEvents).not.toHaveBeenCalled();
    });

    it('suggests a keyword-matched, timed, non-virtual event; skips all-day, virtual, and non-matching events', async () => {
      mockQueryOne.mockImplementation((sql: string) => {
        if (sql.includes('FROM user_integrations')) return Promise.resolve({ user_id: 'parent-1' });
        if (sql.includes('FROM family_members WHERE user_id')) return Promise.resolve({ family_id: 'fam-1' });
        return Promise.resolve(null);
      });
      mockQuery.mockResolvedValue({ rows: [] }); // no confirmed routes, no dismissed patterns
      mockGetCalendarEvents.mockResolvedValueOnce([
        { id: 'g1', summary: 'Swim Lessons', location: '123 Pool Rd', start: { dateTime: '2026-09-20T16:00:00-06:00' } },
        { id: 'g2', summary: 'Team meeting', location: 'https://meet.google.com/xyz', start: { dateTime: '2026-09-21T09:00:00-06:00' } },
        { id: 'g3', summary: "Krish's birthday", location: null, start: { date: '2026-09-22' } },
        { id: 'g4', summary: 'Standup', location: null, start: { dateTime: '2026-09-21T09:00:00-06:00' } },
      ]);

      const suggestions = await service.getSuggestions('user-1');

      expect(suggestions).toEqual([
        { titlePattern: 'Swim Lessons', matchedKeyword: 'swim', occurrenceCount: 1, nextDate: '2026-09-20', suggestedLocation: '123 Pool Rd' },
      ]);
    });

    it('excludes a title already covered by a confirmed event-linked route', async () => {
      mockQueryOne.mockImplementation((sql: string) => {
        if (sql.includes('FROM user_integrations')) return Promise.resolve({ user_id: 'parent-1' });
        if (sql.includes('FROM family_members WHERE user_id')) return Promise.resolve({ family_id: 'fam-1' });
        return Promise.resolve(null);
      });
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('FROM commute_routes')) {
          return Promise.resolve({ rows: [{ ...ROUTE_ROW, event_title_pattern: 'Swim Lessons', arrive_by_time: null }] });
        }
        return Promise.resolve({ rows: [] });
      });
      mockGetCalendarEvents.mockResolvedValueOnce([
        { id: 'g1', summary: 'Swim Lessons', location: '123 Pool Rd', start: { dateTime: '2026-09-20T16:00:00-06:00' } },
      ]);
      const suggestions = await service.getSuggestions('user-1');
      expect(suggestions).toEqual([]);
    });

    it('excludes a dismissed pattern', async () => {
      mockQueryOne.mockImplementation((sql: string) => {
        if (sql.includes('FROM user_integrations')) return Promise.resolve({ user_id: 'parent-1' });
        if (sql.includes('FROM family_members WHERE user_id')) return Promise.resolve({ family_id: 'fam-1' });
        return Promise.resolve(null);
      });
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('FROM commute_dismissed_suggestions')) return Promise.resolve({ rows: [{ title_pattern: 'swim lessons' }] });
        return Promise.resolve({ rows: [] });
      });
      mockGetCalendarEvents.mockResolvedValueOnce([
        { id: 'g1', summary: 'Swim Lessons', location: '123 Pool Rd', start: { dateTime: '2026-09-20T16:00:00-06:00' } },
      ]);
      const suggestions = await service.getSuggestions('user-1');
      expect(suggestions).toEqual([]);
    });

    it('returns [] gracefully when the calendar fetch throws (e.g. an expired token)', async () => {
      mockQueryOne.mockImplementation((sql: string) => {
        if (sql.includes('FROM user_integrations')) return Promise.resolve({ user_id: 'parent-1' });
        if (sql.includes('FROM family_members WHERE user_id')) return Promise.resolve({ family_id: 'fam-1' });
        return Promise.resolve(null);
      });
      mockQuery.mockResolvedValue({ rows: [] });
      mockGetCalendarEvents.mockRejectedValueOnce(new Error('token expired'));
      const suggestions = await service.getSuggestions('user-1');
      expect(suggestions).toEqual([]);
    });
  });

  describe('dismissSuggestion (T-26)', () => {
    it('inserts a normalized dismissal row', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await service.dismissSuggestion('parent-1', '  Swim Lessons  ');
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('commute_dismissed_suggestions'), ['fam-1', 'swim lessons']);
    });

    it('throws no-family when the caller has none', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      await expect(service.dismissSuggestion('nobody', 'swim')).rejects.toThrow('no-family');
    });
  });

  describe('getSummary — event-linked routes (T-26)', () => {
    const EVENT_ROUTE_ROW = {
      id: 'route-2',
      label: "Karishma's swim",
      destination_address: '456 Fallback Ave',
      arrive_by_time: null,
      buffer_minutes: 10,
      family_member_id: 'member-karishma',
      event_title_pattern: 'Swim Lessons',
      origin_override: null,
    };

    function mockCommonQueries(routeRows: unknown[], connected: string | null = 'parent-1') {
      mockQueryOne.mockImplementation((sql: string) => {
        if (sql.includes('FROM user_integrations')) return Promise.resolve(connected ? { user_id: connected } : null);
        if (sql.includes('commute_home_address')) return Promise.resolve({ commute_home_address: '123 Home St', commute_no_school_date: null });
        if (sql.includes('SELECT timezone FROM family_settings')) return Promise.resolve({ timezone: 'America/Denver' });
        if (sql.includes('FROM family_members WHERE user_id')) return Promise.resolve({ family_id: 'fam-1' });
        return Promise.resolve(null);
      });
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('FROM commute_routes')) return Promise.resolve({ rows: routeRows });
        return Promise.resolve({ rows: [] });
      });
    }

    it('omits an event-linked route entirely when no matching event occurs today', async () => {
      mockCommonQueries([EVENT_ROUTE_ROW]);
      mockIsConfigured.mockReturnValue(true);
      mockGetCalendarEvents.mockResolvedValueOnce([]);
      mockGetEventPeople.mockResolvedValueOnce([]);

      const summary = await service.getSummary('user-1');
      expect(summary.routes).toEqual([]);
      expect(mockGetDrivingTime).not.toHaveBeenCalled();
    });

    it("computes leave-by from today's matching event's own start time and location, not the saved fallback", async () => {
      mockCommonQueries([EVENT_ROUTE_ROW]);
      mockIsConfigured.mockReturnValue(true);
      mockGetDrivingTime.mockResolvedValueOnce({ durationMin: 15, durationInTrafficMin: 18, distanceMi: 6 });
      mockGetCalendarEvents.mockResolvedValueOnce([
        { id: 'g-swim', summary: 'Swim Lessons', location: '789 Real Pool Location', start: { dateTime: '2026-01-01T16:00:00-07:00' } },
      ]);
      mockGetEventPeople.mockResolvedValueOnce([]);

      const summary = await service.getSummary('user-1');

      expect(summary.routes).toHaveLength(1);
      const [route] = summary.routes;
      expect(route.destinationAddress).toBe('789 Real Pool Location');
      expect(route.arriveByTime).toBe('16:00');
      expect(route.matchedEventTitle).toBe('Swim Lessons');
      expect(mockGetDrivingTime).toHaveBeenCalledWith('123 Home St', '789 Real Pool Location');
    });

    it('falls back to the saved destination when the matched event has no location', async () => {
      mockCommonQueries([EVENT_ROUTE_ROW]);
      mockIsConfigured.mockReturnValue(true);
      mockGetDrivingTime.mockResolvedValueOnce({ durationMin: 15, durationInTrafficMin: 18, distanceMi: 6 });
      mockGetCalendarEvents.mockResolvedValueOnce([
        { id: 'g-swim', summary: 'Swim Lessons', location: null, start: { dateTime: '2026-01-01T16:00:00-07:00' } },
      ]);
      mockGetEventPeople.mockResolvedValueOnce([]);

      const summary = await service.getSummary('user-1');
      expect(summary.routes[0].destinationAddress).toBe('456 Fallback Ave');
    });

    it("resolves the trip's family member from a live 'Going' tag on today's event, overriding the route's saved default", async () => {
      mockCommonQueries([EVENT_ROUTE_ROW]);
      mockIsConfigured.mockReturnValue(true);
      mockGetDrivingTime.mockResolvedValueOnce({ durationMin: 15, durationInTrafficMin: 18, distanceMi: 6 });
      mockGetCalendarEvents.mockResolvedValueOnce([
        { id: 'g-swim', summary: 'Swim Lessons', location: '789 Pool Rd', start: { dateTime: '2026-01-01T16:00:00-07:00' } },
      ]);
      mockGetEventPeople.mockResolvedValueOnce([{ event_id: 'g-swim', family_member_id: 'member-krish', role: 'going' }]);

      const summary = await service.getSummary('user-1');
      expect(summary.routes[0].familyMemberId).toBe('member-krish');
    });

    it('drops event-linked routes gracefully when no family member has a connected Google account; fixed routes are unaffected', async () => {
      mockCommonQueries([ROUTE_ROW, EVENT_ROUTE_ROW], null);
      mockIsConfigured.mockReturnValue(true);
      mockGetDrivingTime.mockResolvedValueOnce({ durationMin: 15, durationInTrafficMin: 20, distanceMi: 10 });

      const summary = await service.getSummary('user-1');
      expect(summary.routes).toHaveLength(1);
      expect(summary.routes[0].id).toBe('route-1');
      expect(mockGetCalendarEvents).not.toHaveBeenCalled();
    });
  });

  describe('setHomeAddress / setNoSchoolToday', () => {
    it('writes the home address for the caller\'s family', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await service.setHomeAddress('parent-1', '123 Home St');
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('commute_home_address'), ['fam-1', '123 Home St']);
    });

    it('sets commute_no_school_date to null when turning the override off', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' }).mockResolvedValueOnce({ timezone: 'America/Denver' });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await service.setNoSchoolToday('parent-1', false);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('commute_no_school_date'), ['fam-1', null]);
    });
  });
});
