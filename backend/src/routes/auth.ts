/**
 * Authentication Routes
 * Handles user signup, login, logout, and profile management
 */

import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import * as UserRepository from '../database/repositories/UserRepository';

const router = Router();

// Get Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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
  } catch (error: any) {
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
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing email or password'
      });
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
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
    await UserRepository.updateLastLogin(user!.id);

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
  } catch (error: any) {
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
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        error: 'Missing access_token'
      });
    }

    // Sign out with Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.warn('Logout warning:', error.message);
    }

    res.json({
      message: 'Logout successful'
    });
  } catch (error: any) {
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
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

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
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: error.message
    });
  }
});

export default router;
