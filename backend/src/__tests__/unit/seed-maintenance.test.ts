jest.mock('../../database/connection', () => ({ pool: { query: jest.fn(), end: jest.fn() } }));

import { DEFAULT_MAINTENANCE_ITEMS } from '../../scripts/seed-maintenance';

describe('DEFAULT_MAINTENANCE_ITEMS', () => {
  it('has 7 starter items', () => {
    expect(DEFAULT_MAINTENANCE_ITEMS).toHaveLength(7);
  });

  it('every item has a non-empty name and a positive interval', () => {
    for (const item of DEFAULT_MAINTENANCE_ITEMS) {
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.intervalDays).toBeGreaterThan(0);
    }
  });

  it('names are unique', () => {
    expect(new Set(DEFAULT_MAINTENANCE_ITEMS.map((i) => i.name)).size).toBe(
      DEFAULT_MAINTENANCE_ITEMS.length,
    );
  });

  it('includes the safety-critical smoke/CO detector item', () => {
    expect(DEFAULT_MAINTENANCE_ITEMS.some((i) => /smoke.*CO/i.test(i.name))).toBe(true);
  });
});
