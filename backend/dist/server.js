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
// Load environment variables
// When running in Docker, these come from env_file in docker-compose.yml
// When running locally with npm run dev, load from .env.local
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env.local') });
const app = (0, express_1.default)();
const PORT = process.env.PORT || process.env.API_PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase;
try {
    supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
}
catch (error) {
    console.error('❌ Supabase initialization failed:', error.message);
    process.exit(1);
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
// ================================================
// TEST ENDPOINTS
// ================================================
app.get('/test-db', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({
                error: 'Supabase not initialized'
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
// ================================================
// 404 HANDLER
// ================================================
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
        method: req.method
    });
});
// ================================================
// ERROR HANDLER
// ================================================
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.ENVIRONMENT === 'development' ? err.message : undefined
    });
});
// ================================================
// START SERVER
// ================================================
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.ENVIRONMENT || 'unknown'}`);
    console.log(`   Health: GET /health`);
    console.log(`   Auth: POST /auth/signup, POST /auth/login, POST /auth/logout`);
    console.log(`   Users: GET /users, GET /users/:id, PUT /users/:id, DELETE /users/:id`);
});
exports.default = app;
//# sourceMappingURL=server.js.map