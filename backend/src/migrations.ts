import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const databaseUrl = process.env.DATABASE_URL!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  let pool: any = null;

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
        } catch (error: any) {
          // Log but continue - some statements might fail if objects already exist
          if (error.code === 'NOTICE' || error.message.includes('already exists')) {
            console.warn(`⚠️  ${error.message}`);
          } else {
            console.error(`❌ Error executing statement: ${error.message}`);
            throw error;
          }
        }
      }

      console.log(`✅ Migration completed: ${file}`);
    }

    console.log('✨ All migrations completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run migrations
runMigrations();
