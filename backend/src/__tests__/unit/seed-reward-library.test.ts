jest.mock('../../database/connection', () => ({ pool: { query: jest.fn(), end: jest.fn() } }));

import { DEFAULT_REWARD_ITEMS } from '../../scripts/seed-reward-library';

describe('DEFAULT_REWARD_ITEMS', () => {
  it('has 12 starter items', () => {
    expect(DEFAULT_REWARD_ITEMS).toHaveLength(12);
  });

  it('every item has a non-empty title', () => {
    for (const item of DEFAULT_REWARD_ITEMS) {
      expect(item.title.length).toBeGreaterThan(0);
    }
  });

  it('titles are unique', () => {
    expect(new Set(DEFAULT_REWARD_ITEMS.map((i) => i.title)).size).toBe(DEFAULT_REWARD_ITEMS.length);
  });

  it('mixes cash and non-cash rewards', () => {
    const cash = DEFAULT_REWARD_ITEMS.filter((i) => i.cashAmount !== undefined);
    const nonCash = DEFAULT_REWARD_ITEMS.filter((i) => i.cashAmount === undefined);
    expect(cash.length).toBeGreaterThan(0);
    expect(nonCash.length).toBeGreaterThan(0);
  });

  it('cash amounts are positive numbers', () => {
    for (const item of DEFAULT_REWARD_ITEMS) {
      if (item.cashAmount !== undefined) {
        expect(item.cashAmount).toBeGreaterThan(0);
      }
    }
  });
});
