/**
 * Tap-to-explore content for Karishma's Activity Board (T-12 / FR-047).
 * Big emoji tiles a pre-reader taps just to see them pop — colors, numbers,
 * animals, shapes, letters. No scoring, no navigation, no audio in v1; the
 * optional `say` field is reserved so browser-speech can be layered on later
 * without a data migration.
 */

export interface ExploreItem {
  emoji: string;
  label: string;
  /** What a future tap-to-hear feature would speak. Unused in v1. */
  say?: string;
}

export interface ExploreCategory {
  id: string;
  title: string;
  emoji: string;
  items: ExploreItem[];
}

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  {
    id: 'colors',
    title: 'Colors',
    emoji: '🎨',
    items: [
      { emoji: '🔴', label: 'Red' },
      { emoji: '🟠', label: 'Orange' },
      { emoji: '🟡', label: 'Yellow' },
      { emoji: '🟢', label: 'Green' },
      { emoji: '🔵', label: 'Blue' },
      { emoji: '🟣', label: 'Purple' },
      { emoji: '🩷', label: 'Pink' },
      { emoji: '🟤', label: 'Brown' },
      { emoji: '⚫', label: 'Black' },
      { emoji: '⚪', label: 'White' },
    ],
  },
  {
    id: 'numbers',
    title: 'Numbers',
    emoji: '🔢',
    items: [
      { emoji: '1️⃣', label: 'One' },
      { emoji: '2️⃣', label: 'Two' },
      { emoji: '3️⃣', label: 'Three' },
      { emoji: '4️⃣', label: 'Four' },
      { emoji: '5️⃣', label: 'Five' },
      { emoji: '6️⃣', label: 'Six' },
      { emoji: '7️⃣', label: 'Seven' },
      { emoji: '8️⃣', label: 'Eight' },
      { emoji: '9️⃣', label: 'Nine' },
      { emoji: '🔟', label: 'Ten' },
    ],
  },
  {
    id: 'animals',
    title: 'Animals',
    emoji: '🐾',
    items: [
      { emoji: '🐶', label: 'Dog' },
      { emoji: '🐱', label: 'Cat' },
      { emoji: '🐮', label: 'Cow' },
      { emoji: '🐷', label: 'Pig' },
      { emoji: '🐴', label: 'Horse' },
      { emoji: '🐘', label: 'Elephant' },
      { emoji: '🦁', label: 'Lion' },
      { emoji: '🐸', label: 'Frog' },
      { emoji: '🐝', label: 'Bee' },
      { emoji: '🐢', label: 'Turtle' },
      { emoji: '🐧', label: 'Penguin' },
      { emoji: '🦋', label: 'Butterfly' },
    ],
  },
  {
    id: 'shapes',
    title: 'Shapes',
    emoji: '🔷',
    items: [
      { emoji: '🔴', label: 'Circle' },
      { emoji: '🟥', label: 'Square' },
      { emoji: '🔺', label: 'Triangle' },
      { emoji: '⭐', label: 'Star' },
      { emoji: '❤️', label: 'Heart' },
      { emoji: '➕', label: 'Cross' },
      { emoji: '🔷', label: 'Diamond' },
      { emoji: '🌙', label: 'Crescent' },
    ],
  },
  {
    id: 'letters',
    title: 'Letters',
    emoji: '🔤',
    items: [
      { emoji: '🅰️', label: 'A' },
      { emoji: '🅱️', label: 'B' },
      { emoji: '🇨', label: 'C' },
      { emoji: '🇩', label: 'D' },
      { emoji: '🇪', label: 'E' },
      { emoji: '🇰', label: 'K' },
      { emoji: '🇲', label: 'M' },
      { emoji: '🅾️', label: 'O' },
      { emoji: '🇷', label: 'R' },
      { emoji: '🇸', label: 'S' },
      { emoji: '🇹', label: 'T' },
      { emoji: '🇿', label: 'Z' },
    ],
  },
];
