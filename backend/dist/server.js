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
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const badges_1 = __importDefault(require("./routes/badges"));
const points_1 = __importDefault(require("./routes/points"));
const external_apis_1 = __importDefault(require("./routes/external-apis"));
const response_formatter_1 = require("./middleware/response-formatter");
const error_handler_1 = require("./middleware/error-handler");
// Load environment variables
// When running in Docker, these come from env_file in docker-compose.yml
// When running locally with npm run dev, load from .env.local
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env.local') });
const app = (0, express_1.default)();
const PORT = process.env.PORT || process.env.API_PORT || 3000;
// ================================================
// MIDDLEWARE
// ================================================
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, response_formatter_1.responseFormatter)()); // Standard response formatting
// Lazy-initialize Supabase
let supabase = null;
function getSupabase() {
    if (!supabase) {
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            // For Node.js 18, provide ws transport for realtime
            let clientOptions = {};
            try {
                if (process.version.startsWith('v16') || process.version.startsWith('v18')) {
                    const WebSocket = require('ws');
                    clientOptions = {
                        global: {
                            fetch: fetch,
                            WebSocket: WebSocket
                        }
                    };
                }
            }
            catch (e) {
                // ws not available, continue without it
            }
            supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, clientOptions);
            console.log('✅ Supabase client initialized');
        }
        catch (error) {
            console.error('❌ Supabase initialization failed:', error.message);
            throw error;
        }
    }
    return supabase;
}
// ================================================
// HEALTH CHECK
// ================================================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        environment: process.env.ENVIRONMENT || 'unknown'
    });
});
// ================================================
// API ROUTES
// ================================================
// Auth endpoints: POST /auth/signup, POST /auth/login, POST /auth/logout, GET /auth/me
app.use('/auth', auth_1.default);
// User endpoints: GET /users, GET /users/:id, PUT /users/:id, DELETE /users/:id
app.use('/users', users_1.default);
// Badge endpoints: GET /badges, GET /badges/:id, POST/DELETE user badges
app.use('/badges', badges_1.default);
// Points endpoints: GET/POST user points, leaderboard
app.use('/points', points_1.default);
// External APIs: Dictionary, Weather, Email
app.use('/api/external', external_apis_1.default);
// ================================================
// TEST ENDPOINTS
// ================================================
app.get('/test-db', async (req, res) => {
    try {
        const client = getSupabase();
        const { data, error } = await client
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
// ================================================
// 404 HANDLER
// ================================================
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
        method: req.method
    });
});
// ================================================
// ERROR HANDLER (MUST BE LAST)
// ================================================
app.use((0, error_handler_1.errorHandler)());
// ================================================
// START SERVER
// ================================================
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.ENVIRONMENT || 'unknown'}`);
    console.log(`   Health: GET /health`);
    console.log(`   Auth: 4 endpoints`);
    console.log(`   Users: 4 endpoints`);
    console.log(`   Badges: 8 endpoints`);
    console.log(`   Points: 8+ endpoints`);
    console.log(`   External APIs: 10+ endpoints (dictionary, weather, email)`);
    console.log(`   📊 34+ Total Endpoints Ready!`);
});
exports.default = app;
//# sourceMappingURL=server.js.map