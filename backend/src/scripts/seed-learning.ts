/**
 * Seed `learning_lessons` from seed-data/gujarati-curriculum.json.
 *
 * Idempotent: relies on the unique index (phase, subcategory, sequence_order)
 * from migration 017 and upserts content, so re-running refreshes lesson text
 * without touching anyone's `learning_progress`.
 *
 *   npm run seed:learning
 */
import fs from 'fs';
import path from 'path';
import { pool } from '../database/connection';

type Category = 'alphabet' | 'numbers' | 'vocabulary';

interface LessonContent {
  text: string;
  romanization: string;
  pronunciation: string;
  english: string;
  word?: string;
}

interface LessonRow {
  category: Category;
  phase: string;
  subcategory: string;
  sequenceOrder: number;
  content: LessonContent;
  pointsValue: number;
}

const CURRICULUM = path.resolve(__dirname, '../../seed-data/gujarati-curriculum.json');
const POINTS = 10;

interface RawItem {
  letter?: string;
  numeral?: string;
  gujarati?: string;
  romanization: string;
  pronunciation: string;
  english: string;
  word?: string;
}

/** Normalise a curriculum item to a consistent lesson `content` shape. */
function toContent(item: RawItem): LessonContent {
  const content: LessonContent = {
    text: item.letter ?? item.numeral ?? item.gujarati ?? '',
    romanization: item.romanization,
    pronunciation: item.pronunciation,
    english: item.english,
  };
  if (item.word) content.word = item.word; // Gujarati spelled-out word (numbers)
  return content;
}

export function flattenCurriculum(raw: Record<string, unknown>): LessonRow[] {
  const rows: LessonRow[] = [];

  const alphabet = (raw.phase_1_alphabet ?? {}) as Record<string, { lessons: RawItem[] }>;
  for (const sub of ['vowels', 'consonants']) {
    const lessons = alphabet[sub]?.lessons ?? [];
    lessons.forEach((item, i) => {
      rows.push({
        category: 'alphabet',
        phase: 'phase_1_alphabet',
        subcategory: sub,
        sequenceOrder: i,
        content: toContent(item),
        pointsValue: POINTS,
      });
    });
  }

  const numbers = ((raw.phase_2_numbers ?? {}) as { lessons?: Record<string, RawItem> }).lessons ?? {};
  for (const [key, item] of Object.entries(numbers)) {
    rows.push({
      category: 'numbers',
      phase: 'phase_2_numbers',
      subcategory: 'digits',
      sequenceOrder: Number(key),
      content: toContent(item),
      pointsValue: POINTS,
    });
  }

  const vocab = ((raw.phase_3_vocabulary ?? {}) as { categories?: Record<string, { lessons: RawItem[] }> }).categories ?? {};
  for (const [cat, body] of Object.entries(vocab)) {
    (body.lessons ?? []).forEach((item, i) => {
      rows.push({
        category: 'vocabulary',
        phase: 'phase_3_vocabulary',
        subcategory: cat,
        sequenceOrder: i,
        content: toContent(item),
        pointsValue: POINTS,
      });
    });
  }

  return rows;
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(CURRICULUM, 'utf8')) as Record<string, unknown>;
  const rows = flattenCurriculum(raw);
  console.log(`Flattened ${rows.length} lessons from the curriculum.`);

  let upserts = 0;
  for (const r of rows) {
    await pool.query(
      `INSERT INTO learning_lessons (category, phase, subcategory, sequence_order, content, points_value)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (phase, subcategory, sequence_order)
       DO UPDATE SET content = EXCLUDED.content, points_value = EXCLUDED.points_value`,
      [r.category, r.phase, r.subcategory, r.sequenceOrder, JSON.stringify(r.content), r.pointsValue],
    );
    upserts += 1;
  }

  const { rows: counts } = await pool.query(
    `SELECT category, COUNT(*)::int AS n FROM learning_lessons GROUP BY category ORDER BY category`,
  );
  console.log(`Upserted ${upserts} lessons. Table now holds:`);
  for (const c of counts) console.log(`  ${c.category}: ${c.n}`);

  await pool.end();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('seed-learning failed:', err);
    process.exitCode = 1;
    void pool.end();
  });
}
