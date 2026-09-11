/**
 * Seed a starter `reward_library` for every family that doesn't have one yet
 * (T-24 / FR-142). Families are meant to edit/replace/add to this list — the
 * seed is just a running start, not a fixed catalog.
 *
 * Idempotent PER FAMILY: a family that already has any reward_library rows
 * (from an earlier run, or hand-added items) is skipped entirely.
 *
 *   npm run seed:rewards
 */
import { pool } from '../database/connection';

export interface DefaultRewardItem {
  title: string;
  description?: string;
  cashAmount?: number;
}

export const DEFAULT_REWARD_ITEMS: DefaultRewardItem[] = [
  { title: '$5 allowance', cashAmount: 5 },
  { title: '$10 allowance', cashAmount: 10 },
  { title: '$15 allowance', cashAmount: 15 },
  { title: 'Extra 30 min of screen time' },
  { title: 'Pick the movie for family night' },
  { title: 'Stay up 30 minutes later' },
  { title: "Choose what's for dinner" },
  { title: 'Skip one chore, no points lost' },
  { title: 'A trip for ice cream' },
  { title: 'A new book of your choice' },
  { title: 'A friend sleepover' },
  { title: 'A small toy from the store' },
];

async function main() {
  const { rows: families } = await pool.query<{ id: string }>(`SELECT id FROM families`);

  let seeded = 0;
  for (const family of families) {
    const { rows: existing } = await pool.query(
      `SELECT 1 FROM reward_library WHERE family_id = $1 LIMIT 1`,
      [family.id],
    );
    if (existing.length > 0) continue;

    for (const item of DEFAULT_REWARD_ITEMS) {
      await pool.query(
        `INSERT INTO reward_library (family_id, title, description, cash_amount)
         VALUES ($1, $2, $3, $4)`,
        [family.id, item.title, item.description || null, item.cashAmount ?? null],
      );
    }
    seeded++;
  }

  console.log(
    `Seeded the default ${DEFAULT_REWARD_ITEMS.length}-item reward library for ${seeded} of ${families.length} families.`,
  );
  await pool.end();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('seed-reward-library failed:', err);
    process.exitCode = 1;
    void pool.end();
  });
}
