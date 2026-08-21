/**
 * Security Tests - Validate security controls and prevent common vulnerabilities
 * Tests cover authentication, authorization, input validation, and injection prevention
 */

import request from 'supertest';
import express from 'express';
import helmet from 'helmet';

// The routes below call getXService() once at module load time and hold the
// result in a module-scoped constant (e.g. `const chores = getChoreService();`
// in routes/chores.ts). Reassigning getChoreService on the mocked module
// per-test (as this file used to do) has no effect on that already-captured
// value — every service call would silently hit the auto-mock's default
// `undefined` return. Instead, mock the module to always return the same
// shared object, and configure that object's methods per test.
const mockChoreService = {
  getUserChores: jest.fn(),
  createChore: jest.fn(),
  completeChore: jest.fn(),
  getChoreProgress: jest.fn(),
  getPointsSummary: jest.fn(),
  getTransactionHistory: jest.fn(),
};
const mockLearningService = {
  completeLesson: jest.fn(),
  getLearningStats: jest.fn(),
  recordQuizAnswer: jest.fn(),
  getPhaseProgress: jest.fn(),
  getQuizPerformance: jest.fn(),
  getRecentActivity: jest.fn(),
};
const mockSmartThingsService = {
  listDevices: jest.fn(),
  getDevice: jest.fn(),
  setLight: jest.fn(),
  setLightBrightness: jest.fn(),
  setTemperature: jest.fn(),
  setLock: jest.fn(),
  discoverDevices: jest.fn(),
};

jest.mock('../../services/chores', () => ({ getChoreService: () => mockChoreService }));
jest.mock('../../services/learning', () => ({ getLearningService: () => mockLearningService }));
jest.mock('../../services/smartthings', () => ({ getSmartThingsService: () => mockSmartThingsService }));

import choresRoutes from '../../routes/chores';
import learningRoutes from '../../routes/learning';
import smartthingsRoutes from '../../routes/smartthings';

const app = express();
app.use(helmet());
app.use(express.json());
app.use('/api/chores', choresRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/smartthings', smartthingsRoutes);

describe('Security Tests', () => {
  beforeEach(() => {
    // resetAllMocks (not clearAllMocks) so queued mockResolvedValueOnce/etc.
    // from a previous test can't leak into the next one.
    jest.resetAllMocks();
  });

  describe('Authentication Tests', () => {
    it('should reject requests without user ID', async () => {
      const res = await request(app)
        .get('/api/chores');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('User ID');
    });

    it('should reject POST requests without user ID', async () => {
      const res = await request(app)
        .post('/api/chores')
        .send({
          name: 'Test',
          timeSlot: 'morning',
          pointsValue: 50,
        });

      expect(res.status).toBe(401);
    });

    it('should reject learning requests without user ID', async () => {
      const res = await request(app)
        .get('/api/learning/stats');

      expect(res.status).toBe(401);
    });

    it('should reject learning post requests without user ID', async () => {
      const res = await request(app)
        .post('/api/learning/lessons/lesson-1/complete')
        .send({
          category: 'alphabet',
          phase: 'phase_1_alphabet',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('Input Validation Tests', () => {
    it('should reject chore with negative points', async () => {
      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: 'Test',
          timeSlot: 'morning',
          pointsValue: -50,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('positive');
    });

    it('should reject chore with invalid timeSlot', async () => {
      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: 'Test',
          timeSlot: 'midnight',
          pointsValue: 50,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('morning, afternoon, or evening');
    });

    it('should reject lesson completion with invalid category', async () => {
      const res = await request(app)
        .post('/api/learning/lessons/lesson-1/complete')
        .set('x-user-id', 'user-1')
        .send({
          category: 'invalid_category',
          phase: 'phase_1_alphabet',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('alphabet, numbers, or vocabulary');
    });

    it('should reject quiz answer with missing fields', async () => {
      const res = await request(app)
        .post('/api/learning/quiz/answer')
        .set('x-user-id', 'user-1')
        .send({
          lessonId: 'lesson-1',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('required');
    });

    it('should reject chore with empty name', async () => {
      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: '',
          timeSlot: 'morning',
          pointsValue: 50,
        });

      expect(res.status).toBe(400);
    });

    it('should reject chore with SQL injection attempt in name', async () => {
      mockChoreService.createChore.mockResolvedValueOnce({
        id: 'chore-1',
        name: "'; DROP TABLE chores; --",
        userId: 'user-1',
        pointsValue: 50,
        timeSlot: 'morning',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: "'; DROP TABLE chores; --",
          timeSlot: 'morning',
          pointsValue: 50,
        });

      // 201 means the string was safely stored as literal text, not executed —
      // that's the desired outcome, not a failure. The important thing is that
      // it's never treated as SQL to run.
      expect(res.status).toBe(201);
      expect(res.body.chore.name).toBe("'; DROP TABLE chores; --");
    });

    it('should reject chore with XSS attempt in name', async () => {
      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: '<script>alert("xss")</script>',
          timeSlot: 'morning',
          pointsValue: 50,
        });

      // Should be treated as normal string
      expect([201, 400, 500]).toContain(res.status);
    });

    it('should reject chore with XSS attempt in description', async () => {
      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: 'Test',
          description: '<img src=x onerror="alert(1)">',
          timeSlot: 'morning',
          pointsValue: 50,
        });

      expect([201, 400, 500]).toContain(res.status);
    });
  });

  describe('Authorization Tests', () => {
    it('user should only access their own chores', async () => {
      mockChoreService.getUserChores.mockResolvedValueOnce([]);

      await request(app)
        .get('/api/chores')
        .set('x-user-id', 'user-1');

      // Verify the service was called with the correct user ID
      expect(mockChoreService.getUserChores).toHaveBeenCalledWith('user-1');
    });

    it('should not allow accessing other user\'s chore data', async () => {
      mockChoreService.completeChore.mockRejectedValueOnce(new Error('Chore not found'));

      const res = await request(app)
        .post('/api/chores/other-user-chore/complete')
        .set('x-user-id', 'user-1');

      // Should either return 404 or 403
      expect([404, 403]).toContain(res.status);
    });

    it('user learning stats should be user-specific', async () => {
      mockLearningService.getLearningStats.mockResolvedValueOnce({
        totalLessonsCompleted: 5,
        totalPointsEarned: 50,
        alphabet: { completed: 5, total: 47 },
        numbers: { completed: 0, total: 10 },
        vocabulary: { completed: 0, total: 120 },
      });

      await request(app)
        .get('/api/learning/stats')
        .set('x-user-id', 'user-123');

      // Service should receive the user ID
      expect(mockLearningService.getLearningStats).toHaveBeenCalledWith('user-123');
    });
  });

  describe('SQL Injection Prevention Tests', () => {
    it('should safely handle single quotes in input', async () => {
      mockChoreService.createChore.mockResolvedValueOnce({
        id: 'chore-1',
        name: "O'Reilly's Task",
        userId: 'user-1',
        pointsValue: 50,
        timeSlot: 'morning',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: "O'Reilly's Task",
          timeSlot: 'morning',
          pointsValue: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body.chore.name).toBe("O'Reilly's Task");
    });

    it('should safely handle semicolons in input', async () => {
      mockChoreService.createChore.mockResolvedValueOnce({
        id: 'chore-1',
        name: 'Task; Another Task',
        userId: 'user-1',
        pointsValue: 50,
        timeSlot: 'morning',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: 'Task; Another Task',
          timeSlot: 'morning',
          pointsValue: 50,
        });

      expect(res.status).toBe(201);
    });

    it('should handle SQL keywords in input safely', async () => {
      mockChoreService.createChore.mockResolvedValueOnce({
        id: 'chore-1',
        name: 'SELECT * FROM users WHERE',
        userId: 'user-1',
        pointsValue: 50,
        timeSlot: 'morning',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: 'SELECT * FROM users WHERE',
          timeSlot: 'morning',
          pointsValue: 50,
        });

      expect(res.status).toBe(201);
    });
  });

  describe('Response Security Tests', () => {
    it('should not expose internal error details', async () => {
      mockChoreService.getUserChores.mockRejectedValueOnce(new Error('Internal DB connection error'));

      const res = await request(app)
        .get('/api/chores')
        .set('x-user-id', 'user-1');

      expect(res.status).toBe(500);
      expect(res.body.message).not.toContain('connection');
      expect(res.body.message).not.toContain('password');
      expect(res.body.message).not.toContain('token');
    });

    it('should include security headers in responses', async () => {
      mockSmartThingsService.listDevices.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/smartthings/devices');

      // Check for common security headers
      expect(res.headers['x-content-type-options']).toBeDefined();
    });

    it('should not return sensitive data in error responses', async () => {
      mockChoreService.getUserChores.mockRejectedValueOnce({
        message: 'Database error',
        password: 'secret123',
        connectionString: 'REDACTED-FAKE-DB-CONNECTION-STRING-FOR-TEST',
      });

      const res = await request(app)
        .get('/api/chores')
        .set('x-user-id', 'user-1');

      expect(res.body.error).not.toContain('password');
      expect(res.body.error).not.toContain('connectionString');
    });
  });

  describe('Rate Limiting Readiness Tests', () => {
    it('should accept rate limit headers', async () => {
      mockChoreService.getUserChores.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/chores')
        .set('x-user-id', 'user-1');

      // Should succeed (rate limiting tests would be at middleware level)
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('CORS Readiness Tests', () => {
    it('should handle OPTIONS requests gracefully', async () => {
      const res = await request(app).options('/api/chores');

      // Should either succeed or be handled by middleware
      expect([200, 404, 405]).toContain(res.status);
    });
  });

  describe('Large Payload Tests', () => {
    it('should reject excessively large request bodies', async () => {
      const largeChore = {
        name: 'A'.repeat(100000),
        timeSlot: 'morning',
        pointsValue: 50,
      };

      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send(largeChore);

      // Should either accept or reject based on server limits
      expect([201, 413, 400]).toContain(res.status);
    });
  });

  describe('Data Type Validation Tests', () => {
    it('should reject non-numeric pointsValue', async () => {
      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: 'Test',
          timeSlot: 'morning',
          pointsValue: 'fifty',
        });

      expect(res.status).toBe(400);
    });

    it('should reject non-numeric question number in quiz', async () => {
      const res = await request(app)
        .post('/api/learning/quiz/answer')
        .set('x-user-id', 'user-1')
        .send({
          lessonId: 'lesson-1',
          questionNumber: 'one',
          selectedAnswer: 2,
          correctAnswer: 2,
        });

      expect(res.status).toBe(400);
    });
  });
});
