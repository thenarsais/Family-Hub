"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const supabase_js_1 = require("@supabase/supabase-js");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '.env.local') });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
async function runMigrations() {
    let pool = null;
    try {
        console.log('🔄 Running migrations...');
        // Create connection pool for raw SQL execution
        pool = (0, pg_1.createPool)({
            connectionString: databaseUrl,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        // Read all SQL files from migrations directory
        const migrationsDir = path_1.default.join(__dirname, '..', 'migrations');
        if (!fs_1.default.existsSync(migrationsDir)) {
            console.log('❌ Migrations directory not found');
            return;
        }
        const migrationFiles = fs_1.default.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();
        if (migrationFiles.length === 0) {
            console.log('❌ No migration files found');
            return;
        }
        for (const file of migrationFiles) {
            const filePath = path_1.default.join(migrationsDir, file);
            const sql = fs_1.default.readFileSync(filePath, 'utf8');
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
                    }
                    finally {
                        client.release();
                    }
                }
                catch (error) {
                    // Log but continue - some statements might fail if objects already exist
                    if (error.code === 'NOTICE' || error.message.includes('already exists')) {
                        console.warn(`⚠️  ${error.message}`);
                    }
                    else {
                        console.error(`❌ Error executing statement: ${error.message}`);
                        throw error;
                    }
                }
            }
            console.log(`✅ Migration completed: ${file}`);
        }
        console.log('✨ All migrations completed successfully!');
    }
    catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
    finally {
        if (pool) {
            await pool.end();
        }
    }
}
// Run migrations
runMigrations();
//# sourceMappingURL=migrations.js.map