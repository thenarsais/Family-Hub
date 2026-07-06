"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../.env.local' });
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
}
async function runMigrations() {
    const client = new pg_1.Client({ connectionString });
    try {
        console.log('🔄 Connecting to database...');
        await client.connect();
        console.log('✅ Connected to database');
        // Read all SQL files from migrations directory
        const migrationsDir = path_1.default.join(__dirname, '..', 'migrations');
        const migrationFiles = fs_1.default.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();
        if (migrationFiles.length === 0) {
            console.log('❌ No migration files found in migrations directory');
            await client.end();
            process.exit(1);
        }
        console.log(`📝 Found ${migrationFiles.length} migration(s)`);
        for (const file of migrationFiles) {
            const filePath = path_1.default.join(migrationsDir, file);
            const sql = fs_1.default.readFileSync(filePath, 'utf8');
            console.log(`\n📝 Running migration: ${file}`);
            try {
                await client.query(sql);
                console.log(`✅ Migration completed: ${file}`);
            }
            catch (error) {
                console.error(`❌ Error in migration ${file}:`);
                console.error(error.message);
                await client.end();
                process.exit(1);
            }
        }
        console.log('\n✨ All migrations completed successfully!');
    }
    catch (error) {
        console.error('❌ Connection failed:', error.message);
        process.exit(1);
    }
    finally {
        await client.end();
    }
}
runMigrations();
//# sourceMappingURL=runMigrations.js.map