import {
  FAMILY_COLORS,
  SHARED_COLOR,
  ALL_FAMILY_COLORS,
  colorForIndex,
  resolveMemberColor,
} from '@/data/familyColors';

describe('familyColors', () => {
  it('has seven named member colours, all distinct hex values', () => {
    expect(FAMILY_COLORS).toHaveLength(7);
    const hexes = FAMILY_COLORS.map((c) => c.hex.toLowerCase());
    expect(new Set(hexes).size).toBe(7);
    hexes.forEach((h) => expect(h).toMatch(/^#[0-9a-f]{6}$/));
  });

  it('maps an index to its named slot', () => {
    expect(colorForIndex(0)).toBe(FAMILY_COLORS[0]);
    expect(colorForIndex(6)).toBe(FAMILY_COLORS[6]);
  });

  it('falls back to the shared neutral colour past the named slots', () => {
    expect(colorForIndex(7)).toBe(SHARED_COLOR);
    expect(colorForIndex(99)).toBe(SHARED_COLOR);
  });

  it('ALL_FAMILY_COLORS is the seven named slots plus the shared neutral', () => {
    expect(ALL_FAMILY_COLORS).toHaveLength(8);
    expect(ALL_FAMILY_COLORS[7]).toBe(SHARED_COLOR);
  });

  describe('resolveMemberColor', () => {
    it('uses an explicit key when set', () => {
      expect(resolveMemberColor('priya', 0).key).toBe('priya');
      expect(resolveMemberColor('all', 2).key).toBe('all');
    });

    it('falls back to the index default when the key is null/unknown', () => {
      expect(resolveMemberColor(null, 3)).toBe(FAMILY_COLORS[3]);
      expect(resolveMemberColor(undefined, 0)).toBe(FAMILY_COLORS[0]);
      expect(resolveMemberColor('bogus', 1)).toBe(FAMILY_COLORS[1]);
    });
  });
});
