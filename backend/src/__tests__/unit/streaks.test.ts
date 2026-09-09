import { applyMultiplier, pointsMultiplier, getDailyStreak } from '../../services/streaks';
import * as connection from '../../database/connection';

jest.mock('../../database/connection');

const mockQuery = connection.query as jest.Mock;

describe('streaks', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('pointsMultiplier', () => {
    it('is ×1 below 3 days', () => {
      expect(pointsMultiplier(0)).toBe(1);
      expect(pointsMultiplier(2)).toBe(1);
    });
    it('is ×1.1 from 3 to 6 days', () => {
      expect(pointsMultiplier(3)).toBe(1.1);
      expect(pointsMultiplier(6)).toBe(1.1);
    });
    it('is ×1.2 at 7+ days', () => {
      expect(pointsMultiplier(7)).toBe(1.2);
      expect(pointsMultiplier(40)).toBe(1.2);
    });
  });

  describe('applyMultiplier', () => {
    it('rounds the scaled base', () => {
      expect(applyMultiplier(20, 1)).toBe(20);
      expect(applyMultiplier(20, 3)).toBe(22); // 22.0
      expect(applyMultiplier(15, 3)).toBe(17); // 16.5 → 17
      expect(applyMultiplier(20, 7)).toBe(24);
    });
  });

  describe('getDailyStreak', () => {
    it('parses the streak length from the union query', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ len: '5' }] });
      const len = await getDailyStreak('u1', 'America/Denver');
      expect(len).toBe(5);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('chore_completions');
      expect(sql).toContain('habit_completions');
      expect(params).toEqual(['u1', 'America/Denver']);
    });

    it('returns 0 when there are no rows', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      expect(await getDailyStreak('u1', 'UTC')).toBe(0);
    });
  });
});
