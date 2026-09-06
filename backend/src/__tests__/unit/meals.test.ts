import { getMealPlanService, isValidDate, isValidSlot, MEAL_SLOTS } from '../../services/meals';
import * as connection from '../../database/connection';

jest.mock('../../database/connection');

const service = getMealPlanService();
const queryOne = connection.queryOne as jest.Mock;
const query = connection.query as jest.Mock;
const FAMILY = { family_id: 'fam-1' };

describe('meal-plan validators', () => {
  it('isValidDate accepts YYYY-MM-DD only', () => {
    expect(isValidDate('2026-08-17')).toBe(true);
    expect(isValidDate('2026-8-1')).toBe(false);
    expect(isValidDate('nope')).toBe(false);
    expect(isValidDate(42)).toBe(false);
  });

  it('isValidSlot accepts the four slots', () => {
    for (const s of MEAL_SLOTS) expect(isValidSlot(s)).toBe(true);
    expect(isValidSlot('brunch')).toBe(false);
  });
});

describe('MealPlanService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRange', () => {
    it('returns [] when the user has no family', async () => {
      queryOne.mockResolvedValueOnce(null);
      expect(await service.getRange('user-1', '2026-08-01', '2026-08-07')).toEqual([]);
      expect(query).not.toHaveBeenCalled();
    });

    it('scopes the SELECT to family_id + the date range', async () => {
      queryOne.mockResolvedValueOnce(FAMILY);
      query.mockResolvedValueOnce({ rows: [{ id: 'm1' }], rowCount: 1 });

      const rows = await service.getRange('user-1', '2026-08-01', '2026-08-07');

      expect(rows).toEqual([{ id: 'm1' }]);
      expect(query.mock.calls[0][1]).toEqual(['fam-1', '2026-08-01', '2026-08-07']);
    });
  });

  describe('setSlot', () => {
    it('returns null when the user has no family', async () => {
      queryOne.mockResolvedValueOnce(null);
      expect(await service.setSlot('user-1', '2026-08-17', 'dinner', 'Tacos')).toBeNull();
    });

    it('upserts a trimmed value tagged with family + user', async () => {
      queryOne.mockResolvedValueOnce(FAMILY).mockResolvedValueOnce({ id: 'm2', text: 'Tacos' });

      const row = await service.setSlot('user-1', '2026-08-17', 'dinner', '  Tacos  ');

      expect(row).toEqual({ id: 'm2', text: 'Tacos' });
      expect(queryOne.mock.calls[1][1]).toEqual(['fam-1', '2026-08-17', 'dinner', 'Tacos', 'user-1']);
    });

    it('a blank value clears the slot and resolves to null', async () => {
      queryOne.mockResolvedValueOnce(FAMILY); // familyIdForUser inside setSlot
      queryOne.mockResolvedValueOnce(FAMILY); // familyIdForUser inside clearSlot
      query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const row = await service.setSlot('user-1', '2026-08-17', 'dinner', '   ');

      expect(row).toBeNull();
      // the DELETE ran, not an INSERT
      expect(query.mock.calls[0][0]).toMatch(/DELETE FROM meal_plans/);
      expect(queryOne.mock.calls.length).toBe(2); // both family lookups, no insert
    });
  });

  describe('clearSlot', () => {
    it('is true when a row was removed', async () => {
      queryOne.mockResolvedValueOnce(FAMILY);
      query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      expect(await service.clearSlot('user-1', '2026-08-17', 'lunch')).toBe(true);
      expect(query.mock.calls[0][1]).toEqual(['fam-1', '2026-08-17', 'lunch']);
    });

    it('is false with no family', async () => {
      queryOne.mockResolvedValueOnce(null);
      expect(await service.clearSlot('user-1', '2026-08-17', 'lunch')).toBe(false);
    });
  });
});
