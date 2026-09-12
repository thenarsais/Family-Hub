/**
 * Seed a starter `maintenance_items` list for every family that doesn't have
 * one yet (T-15 / FR-078 + FR-080-core + FR-081). Families are meant to edit/
 * add to this list -- the seed is just a running start.
 *
 * Idempotent PER FAMILY: a family that already has any maintenance_items rows
 * (from an earlier run, or hand-added items) is skipped entirely.
 *
 *   npm run seed:maintenance
 */
import { pool } from '../database/connection';

export interface DefaultMaintenanceItem {
  name: string;
  intervalDays: number;
}

export const DEFAULT_MAINTENANCE_ITEMS: DefaultMaintenanceItem[] = [
  { name: 'HVAC air filter', intervalDays: 90 },
  { name: 'Fridge water filter', intervalDays: 182 },
  { name: 'Water heater flush', intervalDays: 365 },
  { name: 'Mattress flip', intervalDays: 182 },
  { name: 'Dryer vent / ducts', intervalDays: 365 },
  { name: 'Smoke & CO detector batteries', intervalDays: 365 },
  { name: 'Gutter cleaning', intervalDays: 182 },
];

async function main() {
  const { rows: families } = await pool.query<{ id: string }>(`SELECT id FROM families`);

  let seeded = 0;
  for (const family of families) {
    const { rows: existing } = await pool.query(
      `SELECT 1 FROM maintenance_items WHERE family_id = $1 LIMIT 1`,
      [family.id],
    );
    if (existing.length > 0) continue;

    for (const item of DEFAULT_MAINTENANCE_ITEMS) {
      await pool.query(
        `INSERT INTO maintenance_items (family_id, name, interval_days)
         VALUES ($1, $2, $3)`,
        [family.id, item.name, item.intervalDays],
      );
    }
    seeded++;
  }

  console.log(
    `Seeded the default ${DEFAULT_MAINTENANCE_ITEMS.length}-item maintenance list for ${seeded} of ${families.length} families.`,
  );
  await pool.end();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('seed-maintenance failed:', err);
    process.exitCode = 1;
    void pool.end();
  });
}
