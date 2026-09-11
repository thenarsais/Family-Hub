import { KungFuService } from '../../services/kungfu';
import * as connection from '../../database/connection';
import * as PointsRepository from '../../database/repositories/PointsRepository';

jest.mock('../../database/connection');
jest.mock('../../database/repositories/PointsRepository');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;
const mockAddPoints = PointsRepository.addPoints as jest.Mock;
const mockRemovePoints = PointsRepository.removePoints as jest.Mock;

describe('KungFuService', () => {
  let service: KungFuService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new KungFuService();
  });

  describe('getProfile', () => {
    it('falls back to defaults when no row exists', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      const profile = await service.getProfile('kid-1');
      expect(profile).toEqual({
        belt: null, beltSince: null, pointsPerClass: 15, pointsPerPractice: 5,
      });
    });

    it('returns the stored row', async () => {
      mockQueryOne.mockResolvedValueOnce({
        user_id: 'kid-1', belt: 'Yellow Sash', belt_since: '2026-06-01',
        points_per_class: 20, points_per_practice: 8,
      });
      const profile = await service.getProfile('kid-1');
      expect(profile).toEqual({
        belt: 'Yellow Sash', beltSince: '2026-06-01', pointsPerClass: 20, pointsPerPractice: 8,
      });
    });
  });

  describe('setProfile', () => {
    it('upserts for self without a family check', async () => {
      mockQueryOne
        .mockResolvedValueOnce(null) // getProfile (current) inside setProfile
        .mockResolvedValueOnce({
          user_id: 'kid-1', belt: 'Yellow Sash', belt_since: '2026-06-01',
          points_per_class: 15, points_per_practice: 5,
        }); // UPSERT RETURNING
      const profile = await service.setProfile('kid-1', 'kid-1', { belt: 'Yellow Sash', belt_since: '2026-06-01' });
      expect(profile.belt).toBe('Yellow Sash');
    });

    it('throws bad-assignee for a non-family target', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId(caller)
        .mockResolvedValueOnce(null); // membership check fails
      await expect(
        service.setProfile('parent-1', 'stranger', { belt: 'Black' }),
      ).rejects.toThrow('bad-assignee');
    });
  });

  describe('getFamilyProfiles', () => {
    it('returns [] when the viewer is in no family', async () => {
      mockQueryOne.mockResolvedValueOnce(null); // familyId
      const profiles = await service.getFamilyProfiles('nobody');
      expect(profiles).toEqual([]);
    });

    it('merges member rows with stored profiles, defaulting the rest', async () => {
      mockQueryOne.mockResolvedValueOnce({ family_id: 'fam-1' }); // familyId
      mockQuery
        .mockResolvedValueOnce({ rows: [{ user_id: 'kid-1', name: 'Krish' }, { user_id: 'kid-2', name: 'Karishma' }] })
        .mockResolvedValueOnce({ rows: [{ user_id: 'kid-1', belt: 'Yellow Sash', belt_since: '2026-06-01', points_per_class: 20, points_per_practice: 8 }] });
      const profiles = await service.getFamilyProfiles('parent-1');
      expect(profiles).toEqual([
        { userId: 'kid-1', name: 'Krish', belt: 'Yellow Sash', beltSince: '2026-06-01', pointsPerClass: 20, pointsPerPractice: 8 },
        { userId: 'kid-2', name: 'Karishma', belt: null, beltSince: null, pointsPerClass: 15, pointsPerPractice: 5 },
      ]);
    });
  });

  describe('logSession', () => {
    it('awards pointsPerClass for a class log', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce(null) // getProfile -> defaults
        .mockResolvedValueOnce({ id: 'log-1' }); // INSERT RETURNING id
      // getToday() at the end
      mockQueryOne.mockResolvedValueOnce(null); // getProfile inside getToday
      mockQueryOne.mockResolvedValueOnce({ timezone: 'America/Denver' }); // familyTz inside getToday
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'log-1', session_type: 'class', points_earned: 15, logged_at: '2026-09-11T10:00:00Z' }] })
        .mockResolvedValueOnce({ rows: [{ session_type: 'class', n: '1' }] });

      const result = await service.logSession('kid-1', 'class');
      expect(result.todayLogs).toHaveLength(1);
      expect(result.weekCounts).toEqual({ class: 1, practice: 0 });
      expect(mockAddPoints).toHaveBeenCalledWith('kid-1', 15, 'kungfu', 'Kung Fu class: log-1');
    });

    it('awards pointsPerPractice for a practice log', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'log-2' });
      mockQueryOne.mockResolvedValueOnce(null);
      mockQueryOne.mockResolvedValueOnce({ timezone: 'America/Denver' });
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await service.logSession('kid-1', 'practice');
      expect(mockAddPoints).toHaveBeenCalledWith('kid-1', 5, 'kungfu', 'Kung Fu practice: log-2');
    });

    it('throws bad-type for an invalid type', async () => {
      await expect(service.logSession('kid-1', 'sparring')).rejects.toThrow('bad-type');
      expect(mockQueryOne).not.toHaveBeenCalled();
    });
  });

  describe('undoSession', () => {
    it('reverses points and removes the row', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce({ session_type: 'class', points_earned: 15 });
      const ok = await service.undoSession('kid-1', 'log-1');
      expect(ok).toBe(true);
      expect(mockRemovePoints).toHaveBeenCalledWith('kid-1', 'kungfu', 'Kung Fu class: log-1');
    });

    it('returns false for a log from a previous day (or missing)', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce(null);
      const ok = await service.undoSession('kid-1', 'log-old');
      expect(ok).toBe(false);
      expect(mockRemovePoints).not.toHaveBeenCalled();
    });
  });

  describe('getToday', () => {
    it('groups week counts by session type', async () => {
      mockQueryOne
        .mockResolvedValueOnce(null) // getProfile
        .mockResolvedValueOnce({ timezone: 'America/Denver' }); // familyTz
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // todayLogs
        .mockResolvedValueOnce({ rows: [{ session_type: 'class', n: '2' }, { session_type: 'practice', n: '3' }] });
      const today = await service.getToday('kid-1');
      expect(today.weekCounts).toEqual({ class: 2, practice: 3 });
    });
  });
});
