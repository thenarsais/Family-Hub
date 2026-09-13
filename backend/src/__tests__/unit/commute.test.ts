import { CommuteService } from '../../services/commute';
import * as connection from '../../database/connection';
import * as directions from '../../services/directions';

jest.mock('../../database/connection');
jest.mock('../../services/directions');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;
const mockIsConfigured = directions.isConfigured as jest.Mock;
const mockGetDrivingTime = directions.getDrivingTime as jest.Mock;

const ROUTE_ROW = {
  id: 'route-1',
  label: "Krish's school",
  destination_address: '456 School Ave',
  arrive_by_time: '08:00:00',
  buffer_minutes: 10,
};

describe('CommuteService', () => {
  let service: CommuteService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CommuteService();
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
        { id: 'route-1', label: "Krish's school", destinationAddress: '456 School Ave', arriveByTime: '08:00', bufferMinutes: 10 },
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
      expect(params).toEqual(['fam-1', null, "Krish's school", '456 School Ave', '08:00', null]);
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
