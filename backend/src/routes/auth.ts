/**
 * Authentication Routes
 * Handles user signup, login, logout, and profile management
 */

import { Router, Request, Response } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as UserRepository from '../database/repositories/UserRepository';
import { getFamilyService } from '../services/family';

import { getErrorMessage } from '../utils/errors';
const router = Router();

// Lazy-initialize Supabase client
let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // For Node.js 18, provide ws transport for realtime
    let clientOptions: Parameters<typeof createClient>[2] = {};
    try {
      // Only for Node 18/16 - they don't have native WebSocket
      if (process.version.startsWith('v16') || process.version.startsWith('v18')) {
        const WebSocket = require('ws');
        clientOptions = {
          global: {
            fetch: fetch
          },
          realtime: {
            transport: WebSocket
          }
        };
      }
    } catch {
      // ws not available, continue without it
    }

    supabase = createClient(supabaseUrl, supabaseKey, clientOptions);
  }
  return supabase;
}

// Helper: Ensure user has a family (create if needed)
//
// This used to duplicate FamilyService.createFamily's logic inline via a
// separate getSupabase() call instead of going through the service -- two
// code paths writing the same families/family_members/family_settings
// tables through two different DB connections. Now just calls the service
// (raw Postgres, same as everywhere else that touches these tables).
async function ensureUserHasFamily(userId: string, userName: string) {
  try {
    const family = getFamilyService();
    const existing = await family.getUserFamily(userId);

    if (existing) {
      return; // User already has a family
    }

    await family.createFamily(userId, {
      name: `${userName}'s Family`,
      description: `Family created for ${userName}`,
      max_children: 5,
      max_parents: 2,
    });

    console.log(`✅ Created family for user ${userId}`);
  } catch (err: unknown) {
    console.warn(`⚠️ Failed to ensure family for user ${userId}:`, getErrorMessage(err));
  }
}

// ================================================
// SIGNUP ENDPOINT
// ================================================

/**
 * POST /auth/signup
 * Register a new user
 */
router.post('/signup', async (req: Request, res: Response) => {
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
        await getFamilyService().createFamily(user.id, {
          name: `${name}'s Family`,
          description: `Family created for ${name}`,
          max_children: 5,
          max_parents: 2,
        });

        console.log(`✅ Auto-created family for user ${user.id}`);
      }
    } catch (familyError: unknown) {
      console.warn('⚠️ Failed to auto-create family:', getErrorMessage(familyError));
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
  } catch (error: unknown) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Signup failed',
      message: getErrorMessage(error)
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
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing email or password'
      });
    }

    try {
      const { data, error } = await getSupabase().auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({
          error: 'Login failed',
          message: getErrorMessage(error)
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
    } catch {
      res.status(401).json({
        error: 'Login failed',
        message: 'Invalid credentials'
      });
    }
  } catch (error: unknown) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: getErrorMessage(error)
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
router.post('/logout', async (req: Request, res: Response) => {
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
      console.warn('Logout warning:', getErrorMessage(error));
    }

    res.json({
      message: 'Logout successful'
    });
  } catch (error: unknown) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: getErrorMessage(error)
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
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);

    // Try real authentication
    try {
      const { data, error } = await getSupabase().auth.getUser(token);

      if (error || !data.user) {
        return res.status(401).json({
          error: 'Invalid or expired token'
        });
      }

      // Get user from database
      const user = await UserRepository.getUserByEmail(data.user.email!);

      res.json({
        user: {
          id: user?.id,
          email: user?.email,
          name: user?.name,
          role: user?.role,
          created_at: user?.created_at
        }
      });
    } catch {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }
  } catch (error: unknown) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: getErrorMessage(error)
    });
  }
});

export default router;
