import fs from 'fs';
import path from 'path';
import { pool } from './database/connection';

import { getErrorMessage, getErrorCode } from './utils/errors';
async function runMigrations() {
  try {
    console.log('🔄 Running migrations...');

    // Read all SQL files from migrations directory
    const migrationsDir = path.join(__dirname, '..', 'migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('❌ Migrations directory not found');
      await pool.end();
      process.exit(1);
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('❌ No migration files found');
      await pool.end();
      process.exit(1);
    }

    console.log(`📝 Found ${migrationFiles.length} migration(s)\n`);

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`📝 Running migration: ${file}`);

      try {
        await pool.query(sql);
        console.log(`✅ Migration completed: ${file}\n`);
      } catch (error: unknown) {
        // Check if error is about already existing objects (this is OK)
        if (getErrorMessage(error).includes('already exists') || getErrorCode(error) === '42P07' || getErrorCode(error) === '42710') {
          console.warn(`⚠️  ${getErrorMessage(error)} (this is OK if object already exists)\n`);
        } else {
          console.error(`❌ Error in migration ${file}:`);
          console.error(getErrorMessage(error));
          await pool.end();
          process.exit(1);
        }
      }
    }

    console.log('✨ All migrations completed successfully!');
    await pool.end();
  } catch (error: unknown) {
    console.error('❌ Migration failed:', getErrorMessage(error));
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
