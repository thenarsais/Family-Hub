import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

async function runMigrations() {
  const client = new Client({ connectionString });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read all SQL files from migrations directory
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('❌ No migration files found in migrations directory');
      await client.end();
      process.exit(1);
    }

    console.log(`📝 Found ${migrationFiles.length} migration(s)`);

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`\n📝 Running migration: ${file}`);

      try {
        await client.query(sql);
        console.log(`✅ Migration completed: ${file}`);
      } catch (error: any) {
        console.error(`❌ Error in migration ${file}:`);
        console.error(error.message);
        await client.end();
        process.exit(1);
      }
    }

    console.log('\n✨ All migrations completed successfully!');
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
