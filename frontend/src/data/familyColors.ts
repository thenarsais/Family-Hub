/**
 * The locked family palette (T-00 / FR-153). Each member gets one colour for
 * calendar event dots and the "just X" filter. The explicit name-to-colour
 * mapping is configured in the T-01 calendar settings panel; until then this
 * assigns colours in member order as a preview.
 */
export interface FamilyColor {
  key: string;
  label: string;
  /** light-mode hex, matches the --c-fam-* tokens in styles/index.css */
  hex: string;
}

export const FAMILY_COLORS: FamilyColor[] = [
  { key: 'krish', label: 'Brick red', hex: '#BC4238' },
  { key: 'karishma', label: 'Magenta-pink', hex: '#C15A93' },
  { key: 'priya', label: 'Plum purple', hex: '#7A4B8C' },
  { key: 'anand', label: 'Denim blue', hex: '#3A6EA5' },
  { key: 'dada', label: 'Forest green', hex: '#357A3E' },
  { key: 'maa', label: 'Amber gold', hex: '#AF8524' },
];

export const SHARED_COLOR: FamilyColor = { key: 'all', label: 'Warm stone', hex: '#8C8172' };

/** Colour for the Nth family member (0-based). Past the six named slots,
 *  everyone shares the neutral stone until T-01 lets you assign explicitly. */
export function colorForIndex(index: number): FamilyColor {
  return FAMILY_COLORS[index] ?? SHARED_COLOR;
}
