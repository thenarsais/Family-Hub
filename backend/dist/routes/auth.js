"use strict";
/**
 * Authentication Routes
 * Handles user signup, login, logout, and profile management
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_js_1 = require("@supabase/supabase-js");
const UserRepository = __importStar(require("../database/repositories/UserRepository"));
const router = (0, express_1.Router)();
// Lazy-initialize Supabase client
let supabase = null;
function getSupabase() {
    if (!supabase) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        // For Node.js 18, provide ws transport for realtime
        let clientOptions = {};
        try {
            // Only for Node 18/16 - they don't have native WebSocket
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
    }
    return supabase;
}
// ================================================
// SIGNUP ENDPOINT
// ================================================
/**
 * POST /auth/signup
 * Register a new user
 */
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, role, account_type } = req.body;
        // Validation
        if (!email || !password || !name || !role) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['email', 'password', 'name', 'role']
            });
        }
        if (!['parent', 'child'].includes(role)) {
            return res.status(400).json({
                error: 'Invalid role. Must be parent or child'
            });
        }
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await getSupabase().auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });
        if (authError) {
            return res.status(400).json({
                error: 'Signup failed',
                message: authError.message
            });
        }
        // Create user record in database
        const user = await UserRepository.createUser({
            email,
            name,
            role,
            account_type: account_type || 'primary',
            password_hash: authData.user?.id || '' // Use auth ID as reference
        });
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            error: 'Signup failed',
            message: error.message
        });
    }
});
// ================================================
// LOGIN ENDPOINT
// ================================================
/**
 * POST /auth/login
 * Authenticate user and return session
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing email or password'
            });
        }
        // Sign in with Supabase
        const { data, error } = await getSupabase().auth.signInWithPassword({
            email,
            password
        });
        if (error) {
            return res.status(401).json({
                error: 'Login failed',
                message: error.message
            });
        }
        // Get user profile
        const user = await UserRepository.getUserByEmail(email);
        // Update last login
        await UserRepository.updateLastLogin(user.id);
        res.json({
            message: 'Login successful',
            session: {
                access_token: data.session?.access_token,
                refresh_token: data.session?.refresh_token,
                expires_in: data.session?.expires_in
            },
            user: {
                id: user?.id,
                email: user?.email,
                name: user?.name,
                role: user?.role
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: error.message
        });
    }
});
// ================================================
// LOGOUT ENDPOINT
// ================================================
/**
 * POST /auth/logout
 * End user session
 */
router.post('/logout', async (req, res) => {
    try {
        const { access_token } = req.body;
        if (!access_token) {
            return res.status(400).json({
                error: 'Missing access_token'
            });
        }
        // Sign out with Supabase
        const { error } = await getSupabase().auth.signOut();
        if (error) {
            console.warn('Logout warning:', error.message);
        }
        res.json({
            message: 'Logout successful'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Logout failed',
            message: error.message
        });
    }
});
// ================================================
// GET CURRENT USER
// ================================================
/**
 * GET /auth/me
 * Get current authenticated user
 */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Missing or invalid authorization header'
            });
        }
        const token = authHeader.substring(7);
        // Verify token with Supabase
        const { data, error } = await getSupabase().auth.getUser(token);
        if (error || !data.user) {
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }
        // Get user from database
        const user = await UserRepository.getUserByEmail(data.user.email);
        res.json({
            user: {
                id: user?.id,
                email: user?.email,
                name: user?.name,
                role: user?.role,
                created_at: user?.created_at
            }
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            error: 'Failed to get user',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map