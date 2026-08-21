/**
 * Auth Route Tests
 * Tests authentication endpoints and security
 *
 * This file previously didn't import routes/auth.ts at all — it built a
 * fake Express app with hand-rolled handlers (checking a single hardcoded
 * test@example.com/password123 pair) that bore no relation to the real
 * route, which has a demo-credential bypass for two fixed accounts PLUS a
 * real Supabase auth path, calls UserRepository, and side-effects a family
 * creation on every login. None of that was ever exercised. Rewritten
 * against the real router.
 *
 * getSupabase() lazily creates and caches a client on first use (module-
 * scoped `let supabase`), so — unlike the getXService() singleton bug fixed
 * elsewhere in this suite — mocking createClient() to always return the same
 * object works fine here: the route calls getSupabase() fresh each request,
 * it just happens to return the same mock every time.
 */

import request from 'supertest';
import express from 'express';

const mockSupabaseClient: any = {
  auth: {
    admin: { createUser: jest.fn() },
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
  },
  from: jest.fn(),
  select: jest.fn(),
  eq: jest.fn(),
  insert: jest.fn(),
  single: jest.fn(),
};
// Chainable: from/select/eq/insert all return the same object so
// .from(...).select(...).eq(...).eq(...).single() resolves however
// .single() is configured for that call.
mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));
jest.mock('../../database/repositories/UserRepository');

import * as UserRepository from '../../database/repositories/UserRepository';
import authRoutes from '../../routes/auth';

const app = express();
app.use(express.json());
app.use('/', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: ensureUserHasFamily's internal chain always finds "no
    // existing member" and its own family-insert also comes back empty, so
    // it quietly no-ops rather than erroring. Family creation itself is
    // already covered by direct integration testing elsewhere — these tests
    // are about what the auth endpoints themselves return.
    mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
  });

  describe('POST /login — demo credentials', () => {
    it('should log in with the demo parent account', async () => {
      const res = await request(app)
        .post('/login')
        .send({ email: 'testparent@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.demo_mode).toBe(true);
      expect(res.body.user.email).toBe('testparent@example.com');
      expect(res.body.user.role).toBe('parent');
      expect(res.body.session.access_token).toBeDefined();
    });

    it('should log in with the demo child account', async () => {
      const res = await request(app)
        .post('/login')
        .send({ email: 'testchild@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('child');
    });

    it('should reject the demo email with the wrong password', async () => {
      // Wrong password means it falls through to the real Supabase path,
      // which isn't configured to succeed here — it must not silently log
      // in as the demo user just because the email matched.
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      const res = await request(app)
        .post('/login')
        .send({ email: 'testparent@example.com', password: 'wrong' });

      expect(res.status).not.toBe(200);
    });

    it('should not reveal whether an email exists in the error message', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      const res = await request(app)
        .post('/login')
        .send({ email: 'nobody@example.com', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.message).not.toContain('nobody@example.com');
    });
  });

  describe('POST /login — real Supabase path', () => {
    it('should log in a real user', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { session: { access_token: 'real-token', refresh_token: 'real-refresh', expires_in: 3600 } },
        error: null,
      });
      (UserRepository.getUserByEmail as jest.Mock).mockResolvedValueOnce({
        id: 'user-real-1',
        email: 'real@example.com',
        name: 'Real User',
        role: 'parent',
      });
      (UserRepository.updateLastLogin as jest.Mock).mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/login')
        .send({ email: 'real@example.com', password: 'realpassword' });

      expect(res.status).toBe(200);
      expect(res.body.session.access_token).toBe('real-token');
      expect(res.body.user.email).toBe('real@example.com');
      expect(res.body.demo_mode).toBeUndefined();
    });

    it('should reject invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      const res = await request(app)
        .post('/login')
        .send({ email: 'real@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should require email and password', async () => {
      const res = await request(app).post('/login').send({ email: 'a@example.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /signup', () => {
    it('should create a new user', async () => {
      mockSupabaseClient.auth.admin.createUser.mockResolvedValueOnce({
        data: { user: { id: 'auth-id-1' } },
        error: null,
      });
      (UserRepository.createUser as jest.Mock).mockResolvedValueOnce({
        id: 'user-new-1',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'parent',
      });

      const res = await request(app)
        .post('/signup')
        .send({ email: 'newuser@example.com', password: 'password123', name: 'New User', role: 'parent' });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('newuser@example.com');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should require email, password, name, and role', async () => {
      const res = await request(app)
        .post('/signup')
        .send({ email: 'user@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.required).toEqual(['email', 'password', 'name', 'role']);
    });

    it('should reject a role that is not parent or child', async () => {
      const res = await request(app)
        .post('/signup')
        .send({ email: 'user@example.com', password: 'password123', name: 'User', role: 'admin' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('parent or child');
    });

    it('should surface a Supabase signup failure without a 500', async () => {
      mockSupabaseClient.auth.admin.createUser.mockResolvedValueOnce({
        data: null,
        error: { message: 'Email already registered' },
      });

      const res = await request(app)
        .post('/signup')
        .send({ email: 'existing@example.com', password: 'password123', name: 'User', role: 'parent' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Signup failed');
    });

    it('should not include the password in the response', async () => {
      mockSupabaseClient.auth.admin.createUser.mockResolvedValueOnce({
        data: { user: { id: 'auth-id-2' } },
        error: null,
      });
      (UserRepository.createUser as jest.Mock).mockResolvedValueOnce({
        id: 'user-new-2',
        email: 'user2@example.com',
        name: 'User Two',
        role: 'child',
      });

      const res = await request(app)
        .post('/signup')
        .send({ email: 'user2@example.com', password: 'password123', name: 'User Two', role: 'child' });

      expect(JSON.stringify(res.body)).not.toContain('password123');
    });
  });

  describe('POST /logout', () => {
    it('should log out successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({ error: null });

      const res = await request(app)
        .post('/logout')
        .send({ access_token: 'some-token' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logout successful');
    });

    it('should require an access_token', async () => {
      const res = await request(app).post('/logout').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /me — demo token', () => {
    it('should return the demo parent from a demo token', async () => {
      const demoToken = Buffer.from(
        JSON.stringify({ sub: '00000000-0000-0000-0000-000000000001', email: 'testparent@example.com' })
      ).toString('base64');

      const res = await request(app)
        .get('/me')
        .set('Authorization', `Bearer ${demoToken}`);

      expect(res.status).toBe(200);
      expect(res.body.demo_mode).toBe(true);
      expect(res.body.user.email).toBe('testparent@example.com');
    });

    it('should require an Authorization header', async () => {
      const res = await request(app).get('/me');
      expect(res.status).toBe(401);
    });

    it('should reject a malformed Authorization header', async () => {
      const res = await request(app)
        .get('/me')
        .set('Authorization', 'NotBearer sometoken');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /me — real Supabase token', () => {
    it('should return the real user for a valid token', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { email: 'real@example.com' } },
        error: null,
      });
      (UserRepository.getUserByEmail as jest.Mock).mockResolvedValueOnce({
        id: 'user-real-1',
        email: 'real@example.com',
        name: 'Real User',
        role: 'parent',
        created_at: new Date(),
      });

      const res = await request(app)
        .get('/me')
        .set('Authorization', 'Bearer a-real-looking-token');

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('real@example.com');
    });

    it('should reject an invalid or expired token', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Token expired' },
      });

      const res = await request(app)
        .get('/me')
        .set('Authorization', 'Bearer expired-token');

      expect(res.status).toBe(401);
    });

    it('should not return password or password hash fields', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { email: 'real@example.com' } },
        error: null,
      });
      (UserRepository.getUserByEmail as jest.Mock).mockResolvedValueOnce({
        id: 'user-real-1',
        email: 'real@example.com',
        name: 'Real User',
        role: 'parent',
        password_hash: 'should-never-appear',
      });

      const res = await request(app)
        .get('/me')
        .set('Authorization', 'Bearer a-real-looking-token');

      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('password_hash');
    });
  });

  describe('Token security', () => {
    it('should not log the raw token', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'invalid' },
      });

      await request(app)
        .get('/me')
        .set('Authorization', 'Bearer super-secret-token-12345');

      const logs = consoleSpy.mock.calls.flat().join(' ');
      expect(logs).not.toContain('super-secret-token-12345');
      consoleSpy.mockRestore();
    });
  });
});
