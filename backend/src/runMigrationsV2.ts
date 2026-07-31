import fs from 'fs';
import path from 'path';
import { pool } from './database/connection';

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
      } catch (error: any) {
        // Check if error is about already existing objects (this is OK)
        if (error.message.includes('already exists') || error.code === '42P07' || error.code === '42710') {
          console.warn(`⚠️  ${error.message} (this is OK if object already exists)\n`);
        } else {
          console.error(`❌ Error in migration ${file}:`);
          console.error(error.message);
          await pool.end();
          process.exit(1);
        }
      }
    }

    console.log('✨ All migrations completed successfully!');
    await pool.end();
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
