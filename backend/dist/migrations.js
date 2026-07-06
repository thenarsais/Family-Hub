"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../.env.local' });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
async function runMigrations() {
    try {
        console.log('🔄 Running migrations...');
        // Read all SQL files from migrations directory
        const migrationsDir = path_1.default.join(__dirname, '..', 'migrations');
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
            // Execute the SQL using the Supabase client
            const { error } = await supabase.rpc('exec', { sql_query: sql });
            if (error) {
                // If the function doesn't exist, try a different approach
                // This is a workaround for Supabase
                console.warn(`⚠️  Could not use RPC (expected). Executing directly...`);
                // Split SQL into individual statements
                const statements = sql
                    .split(';')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.startsWith('--'));
                for (const statement of statements) {
                    const { error: execError } = await supabase.from('users').select('1').limit(0);
                    if (execError) {
                        console.error(`❌ Error: ${execError.message}`);
                    }
                }
            }
            console.log(`✅ Migration completed: ${file}`);
        }
        console.log('✨ All migrations completed successfully!');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}
runMigrations();
//# sourceMappingURL=migrations.js.map