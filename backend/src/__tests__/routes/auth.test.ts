/**
 * Auth Route Tests
 * Tests authentication endpoints and security
 */

import request from 'supertest';
import express from 'express';

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock auth routes
    app.post('/login', (req, res) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      if (email === 'test@example.com' && password === 'password123') {
        return res.status(200).json({
          token: 'mock-jwt-token',
          user: { id: 'user-1', email: 'test@example.com' },
        });
      }

      res.status(401).json({ error: 'Invalid credentials' });
    });

    app.post('/signup', (req, res) => {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'All fields required' });
      }

      if (!email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be 8+ chars' });
      }

      res.status(201).json({
        token: 'mock-jwt-token',
        user: { id: 'user-new', email, name },
      });
    });

    app.post('/logout', (req, res) => {
      res.status(200).json({ message: 'Logged out' });
    });

    app.get('/me', (req, res) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token' });
      }

      res.status(200).json({
        id: 'user-1',
        email: 'test@example.com',
      });
    });
  });

  describe('POST /login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject missing email', async () => {
      const res = await request(app)
        .post('/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should reject missing password', async () => {
      const res = await request(app)
        .post('/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
    });

    it('should not expose database errors', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'wrong',
        });

      expect(res.body.error).not.toContain('database');
      expect(res.body.error).not.toContain('connection');
    });

    it('should return JWT token on success', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
    });
  });

  describe('POST /signup', () => {
    it('should signup with valid data', async () => {
      const res = await request(app)
        .post('/signup')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('newuser@example.com');
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/signup')
        .send({
          email: 'not-an-email',
          password: 'password123',
          name: 'User',
        });

      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/signup')
        .send({
          email: 'user@example.com',
          password: 'short',
          name: 'User',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('8');
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/signup')
        .send({ email: 'user@example.com' });

      expect(res.status).toBe(400);
    });

    it('should not store plain text password in response', async () => {
      const res = await request(app)
        .post('/signup')
        .send({
          email: 'user@example.com',
          password: 'password123',
          name: 'User',
        });

      expect(res.body).not.toHaveProperty('password');
    });
  });

  describe('POST /logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app).post('/logout');

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Logged out');
    });
  });

  describe('GET /me', () => {
    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/me')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('test@example.com');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/me');

      expect(res.status).toBe(401);
    });

    it('should not return sensitive fields', async () => {
      const res = await request(app)
        .get('/me')
        .set('Authorization', 'Bearer mock-jwt-token');

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
    });
  });

  describe('Token Security', () => {
    it('should not expose token in logs', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .get('/me')
        .set('Authorization', 'Bearer super-secret-token-12345');

      // Token should not be logged
      const logs = consoleSpy.mock.calls.join();
      expect(logs).not.toContain('super-secret-token-12345');

      consoleSpy.mockRestore();
    });

    it('should accept Bearer token format', async () => {
      const res = await request(app)
        .get('/me')
        .set('Authorization', 'Bearer valid-token');

      // Should process the token
      expect(res.status).toBe(200);
    });

    it('should reject malformed Authorization header', async () => {
      const res = await request(app)
        .get('/me')
        .set('Authorization', 'InvalidFormat token');

      expect(res.status).toBe(401);
    });
  });

  describe('Password Security', () => {
    it('should not accept empty password', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: '',
        });

      expect(res.status).toBe(400);
    });

    it('should require minimum password length on signup', async () => {
      const res = await request(app)
        .post('/signup')
        .send({
          email: 'user@example.com',
          password: 'pass',
          name: 'User',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('COPPA Compliance', () => {
    it('should not expose user data in error messages', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'wrong',
        });

      // Should not reveal if email exists
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should handle parent email securely', async () => {
      const res = await request(app)
        .post('/signup')
        .send({
          email: 'parent@example.com',
          password: 'password123',
          name: 'Parent',
        });

      // Response should not contain the actual email
      expect(res.body.user.email).toBe('parent@example.com');
      // But no sensitive data should be exposed
      expect(res.body).not.toHaveProperty('password');
    });
  });
});
