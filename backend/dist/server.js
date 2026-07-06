"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const supabase_js_1 = require("@supabase/supabase-js");
// Load environment variables
// When running in Docker, these come from env_file in docker-compose.yml
// When running locally with npm run dev, load from .env.local
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env.local') });
const app = (0, express_1.default)();
const PORT = process.env.PORT || process.env.API_PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize Supabase (with fallback for Phase 1A development)
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'local-dev-key';
// Only create Supabase client if we have valid credentials
let supabase;
try {
    supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
}
catch (error) {
    console.warn('⚠️  Supabase initialization failed (Phase 1A placeholder):', error.message);
    // Create a dummy client for Phase 1A development
    console.log('   Using placeholder Supabase client for development');
}
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});
// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({
                error: 'Supabase not initialized',
                message: 'Phase 1A: Supabase will be configured in Phase 1B'
            });
        }
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        if (error)
            throw error;
        res.json({
            status: 'Database connected!',
            data
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Database connection failed',
            message: error.message
        });
    }
});
// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Test DB: http://localhost:${PORT}/test-db`);
});
exports.default = app;
//# sourceMappingURL=server.js.map