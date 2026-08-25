#!/usr/bin/env node
/**
 * COPPA schema verification (FRAMEWORK.md Decision #29).
 *
 * The eslint-local-rules.js "no-exact-dob-or-gps" rule catches this pattern
 * in application code, but it can't see the live database -- a column could
 * be added directly via the SQL editor (this project's history has done
 * that before, see migrations-drift memory) and no lint run would ever
 * catch it. This script audits the actual live schema instead, independent
 * of what any migration file claims.
 *
 * Checks:
 *   1. No column storing an exact date of birth (date_of_birth, dob, etc.)
 *      -- the compliant pattern is birth_year (coarse) + is_under_13.
 *   2. No column storing precise GPS coordinates (latitude, longitude, etc.)
 *      -- coarse location (city, zip) is fine if location is needed at all.
 *
 * Usage: node scripts/check-coppa.js
 * Exit code 0 = clean, 1 = violations found.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env.local') });
const { Pool } = require('pg');

const DOB_PATTERN = /^(date_?of_?birth|dob|birth_?date)$/i;
const GPS_PATTERN = /^(lat(itude)?|lon(gitude)?|gps_?coord(inates)?)$/i;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const { rows } = await pool.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
       ORDER BY table_name, column_name`
    );

    const violations = rows.filter(
      (r) => DOB_PATTERN.test(r.column_name) || GPS_PATTERN.test(r.column_name)
    );

    if (violations.length === 0) {
      console.log(`✅ COPPA schema check passed (${rows.length} columns scanned, no violations)`);
      process.exit(0);
    }

    console.error(`❌ COPPA schema violations found (${violations.length}):\n`);
    for (const v of violations) {
      const kind = DOB_PATTERN.test(v.column_name) ? 'exact date of birth' : 'precise GPS coordinate';
      console.error(`  ${v.table_name}.${v.column_name} — looks like an ${kind} column`);
    }
    console.error(
      '\nSee FRAMEWORK.md Decision #29: use birth_year + is_under_13 instead of an exact DOB, ' +
      'and coarse location (city/zip) instead of precise coordinates.'
    );
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ COPPA check failed to run:', err.message);
  process.exit(1);
});
