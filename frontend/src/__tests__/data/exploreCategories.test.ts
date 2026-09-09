import { EXPLORE_CATEGORIES } from '@/data/exploreCategories';

describe('EXPLORE_CATEGORIES', () => {
  it('has 5 categories with unique ids', () => {
    expect(EXPLORE_CATEGORIES).toHaveLength(5);
    const ids = EXPLORE_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(5);
    expect(ids).toEqual(expect.arrayContaining(['colors', 'numbers', 'animals', 'shapes', 'letters']));
  });

  it('every category has a title, an emoji, and 8-12 items', () => {
    for (const c of EXPLORE_CATEGORIES) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.emoji.length).toBeGreaterThan(0);
      expect(c.items.length).toBeGreaterThanOrEqual(8);
      expect(c.items.length).toBeLessThanOrEqual(12);
    }
  });

  it('every item has a non-empty emoji and label, and unique labels within a category', () => {
    for (const c of EXPLORE_CATEGORIES) {
      const labels = c.items.map((i) => i.label);
      expect(new Set(labels).size).toBe(labels.length);
      for (const it of c.items) {
        expect(it.emoji.length).toBeGreaterThan(0);
        expect(it.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('numbers category counts one to ten', () => {
    const numbers = EXPLORE_CATEGORIES.find((c) => c.id === 'numbers')!;
    expect(numbers.items.map((i) => i.label)).toEqual([
      'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    ]);
  });
});
