"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_js_1 = require("@supabase/supabase-js");
dotenv_1.default.config({ path: '../.env.local' });
const app = (0, express_1.default)();
const PORT = process.env.API_PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});
// Test database connection
app.get('/test-db', async (req, res) => {
    try {
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