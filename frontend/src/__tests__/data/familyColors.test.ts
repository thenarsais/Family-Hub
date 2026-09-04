import { FAMILY_COLORS, SHARED_COLOR, colorForIndex } from '@/data/familyColors';

describe('familyColors', () => {
  it('has six named member colours, all distinct hex values', () => {
    expect(FAMILY_COLORS).toHaveLength(6);
    const hexes = FAMILY_COLORS.map((c) => c.hex.toLowerCase());
    expect(new Set(hexes).size).toBe(6);
    hexes.forEach((h) => expect(h).toMatch(/^#[0-9a-f]{6}$/));
  });

  it('maps an index to its named slot', () => {
    expect(colorForIndex(0)).toBe(FAMILY_COLORS[0]);
    expect(colorForIndex(5)).toBe(FAMILY_COLORS[5]);
  });

  it('falls back to the shared stone colour past the named slots', () => {
    expect(colorForIndex(6)).toBe(SHARED_COLOR);
    expect(colorForIndex(99)).toBe(SHARED_COLOR);
  });
});
