import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

import { getErrorMessage, getErrorCode } from './utils/errors';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL!;

async function runMigrations() {
  let pool: Pool | null = null;

  try {
    console.log('🔄 Running migrations...');

    // Create connection pool for raw SQL execution
    pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Read all SQL files from migrations directory
    const migrationsDir = path.join(__dirname, '..', 'migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('❌ Migrations directory not found');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('❌ No migration files found');
      return;
    }

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`📝 Running migration: ${file}`);

      // Split SQL into individual statements (handle comments and multiple statements)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          const client = await pool.connect();
          try {
            await client.query(statement);
          } finally {
            client.release();
          }
        } catch (error: unknown) {
          // Log but continue - some statements might fail if objects already exist
          if (getErrorCode(error) === 'NOTICE' || getErrorMessage(error).includes('already exists')) {
            console.warn(`⚠️  ${getErrorMessage(error)}`);
          } else {
            console.error(`❌ Error executing statement: ${getErrorMessage(error)}`);
            throw error;
          }
        }
      }

      console.log(`✅ Migration completed: ${file}`);
    }

    console.log('✨ All migrations completed successfully!');
  } catch (error: unknown) {
    console.error('❌ Migration failed:', getErrorMessage(error));
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run migrations
runMigrations();
