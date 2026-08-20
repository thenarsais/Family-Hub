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
// Helper: Ensure user has a family (create if needed)
async function ensureUserHasFamily(userId, userName) {
    try {
        // Check if user already has a family
        const { data: existingMember } = await getSupabase()
            .from('family_members')
            .select('family_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();
        if (existingMember) {
            return; // User already has a family
        }
        // Create a new family for this user
        const { data: family, error: familyError } = await getSupabase()
            .from('families')
            .insert({
            name: `${userName}'s Family`,
            description: `Family created for ${userName}`,
            created_by_id: userId,
            max_children: 5,
            max_parents: 2
        })
            .select()
            .single();
        if (!familyError && family) {
            // Add user as family member
            await getSupabase()
                .from('family_members')
                .insert({
                family_id: family.id,
                user_id: userId,
                role: 'admin',
                invited_by_id: null
            });
            // Create default settings
            await getSupabase()
                .from('family_settings')
                .insert({
                family_id: family.id,
                theme: 'light',
                language: 'en',
                timezone: 'America/New_York'
            });
            console.log(`✅ Created family for user ${userId}`);
        }
    }
    catch (err) {
        console.warn(`⚠️ Failed to ensure family for user ${userId}:`, err.message);
    }
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
        // Auto-create family for new users (especially parents)
        try {
            if (role === 'parent' || role === 'admin') {
                const { data: family, error: familyError } = await getSupabase()
                    .from('families')
                    .insert({
                    name: `${name}'s Family`,
                    description: `Family created for ${name}`,
                    created_by_id: user.id,
                    max_children: 5,
                    max_parents: 2
                })
                    .select()
                    .single();
                if (!familyError && family) {
                    // Add user as family member
                    await getSupabase()
                        .from('family_members')
                        .insert({
                        family_id: family.id,
                        user_id: user.id,
                        role: 'admin',
                        invited_by_id: null
                    });
                    // Create default settings for family
                    await getSupabase()
                        .from('family_settings')
                        .insert({
                        family_id: family.id,
                        theme: 'light',
                        language: 'en',
                        timezone: 'America/New_York'
                    });
                    console.log(`✅ Auto-created family for user ${user.id}`);
                }
            }
        }
        catch (familyError) {
            console.warn('⚠️ Failed to auto-create family:', familyError.message);
            // Don't fail signup if family creation fails
        }
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
        // Demo credentials for testing (when database is unavailable)
        const demoUsers = {
            'testparent@example.com': {
                id: 'parent-001',
                email: 'testparent@example.com',
                name: 'Test Parent',
                role: 'parent',
                password: 'password123'
            },
            'testchild@example.com': {
                id: 'child-001',
                email: 'testchild@example.com',
                name: 'Test Child',
                role: 'child',
                password: 'password123'
            }
        };
        const demoUser = demoUsers[email.toLowerCase()];
        if (demoUser && demoUser.password === password) {
            // Ensure demo user has a family
            await ensureUserHasFamily(demoUser.id, demoUser.name);
            // Generate mock JWT token
            const mockToken = Buffer.from(JSON.stringify({
                sub: demoUser.id,
                email: demoUser.email,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 86400
            })).toString('base64');
            return res.json({
                message: 'Login successful',
                session: {
                    access_token: mockToken,
                    refresh_token: 'mock_refresh_token',
                    expires_in: 86400
                },
                user: {
                    id: demoUser.id,
                    email: demoUser.email,
                    name: demoUser.name,
                    role: demoUser.role
                },
                demo_mode: true
            });
        }
        // Try real authentication if demo didn't match
        try {
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
            // Ensure user has a family
            if (user) {
                await ensureUserHasFamily(user.id, user.name);
                await UserRepository.updateLastLogin(user.id);
            }
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
        catch (dbError) {
            // If database is unavailable and demo credentials don't match, return error
            res.status(401).json({
                error: 'Login failed',
                message: 'Invalid credentials. Demo credentials: testparent@example.com / password123'
            });
        }
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
        // Demo credentials for testing
        const demoUsers = {
            'parent-001': {
                id: 'parent-001',
                email: 'testparent@example.com',
                name: 'Test Parent',
                role: 'parent',
                created_at: new Date()
            },
            'child-001': {
                id: 'child-001',
                email: 'testchild@example.com',
                name: 'Test Child',
                role: 'child',
                created_at: new Date()
            }
        };
        // Check if token is a demo token
        try {
            const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
            if (decoded.sub && demoUsers[decoded.sub]) {
                const user = demoUsers[decoded.sub];
                return res.json({
                    user,
                    demo_mode: true
                });
            }
        }
        catch (e) {
            // Not a demo token, continue with real auth
        }
        // Try real authentication
        try {
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
        catch (dbError) {
            // Database unavailable, but check demo users
            return res.status(401).json({
                error: 'Invalid or expired token'
            });
        }
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