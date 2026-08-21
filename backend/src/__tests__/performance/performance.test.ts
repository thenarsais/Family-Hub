/**
 * Performance Tests - Track API response times and resource usage
 * These tests help identify performance bottlenecks and regressions
 */

import request from 'supertest';
import express from 'express';

// The routes below call getXService() once at module load time and hold the
// result in a module-scoped constant. Reassigning getXService per-test (as
// this file used to do via `require('../../services/chores').getChoreService
// = jest.fn()...`) has no effect on that already-captured value — every
// service call would silently hit the auto-mock's default `undefined` return
// and 500. Instead, mock each module to always return the same shared
// object, and configure that object's methods per test.
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
app.use(express.json());
app.use('/api/chores', choresRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/smartthings', smartthingsRoutes);

describe('Performance Tests', () => {
  const PERFORMANCE_THRESHOLDS = {
    fastEndpoint: 100, // ms - for simple endpoints
    normalEndpoint: 500, // ms - for endpoints with DB queries
    slowEndpoint: 2000, // ms - for complex operations
  };

  beforeEach(() => {
    // resetAllMocks (not clearAllMocks) so queued mockResolvedValueOnce/etc.
    // from a previous test can't leak into the next one.
    jest.resetAllMocks();
  });

  describe('Response Time Tests', () => {
    it('GET /chores should respond within 500ms', async () => {
      mockChoreService.getUserChores.mockResolvedValueOnce([
        { id: 'chore-1', name: 'Test', userId: 'user-1', pointsValue: 50, timeSlot: 'morning', enabled: true },
      ]);

      const startTime = Date.now();
      await request(app)
        .get('/api/chores')
        .set('x-user-id', 'user-1');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.normalEndpoint);
    });

    it('POST /chores should respond within 500ms', async () => {
      mockChoreService.createChore.mockResolvedValueOnce({
        id: 'chore-1',
        name: 'Test',
        userId: 'user-1',
        pointsValue: 50,
        timeSlot: 'morning',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const startTime = Date.now();
      await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: 'Test',
          timeSlot: 'morning',
          pointsValue: 50,
        });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.normalEndpoint);
    });

    it('GET /learning/stats should respond within 500ms', async () => {
      mockLearningService.getLearningStats.mockResolvedValueOnce({
        totalLessonsCompleted: 5,
        totalPointsEarned: 50,
        alphabet: { completed: 5, total: 47 },
        numbers: { completed: 0, total: 10 },
        vocabulary: { completed: 0, total: 120 },
      });

      const startTime = Date.now();
      await request(app)
        .get('/api/learning/stats')
        .set('x-user-id', 'user-1');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.normalEndpoint);
    });

    it('GET /smartthings/devices should respond within 500ms', async () => {
      mockSmartThingsService.listDevices.mockResolvedValueOnce([
        { deviceId: 'light-1', name: 'Light', type: 'light', status: { switch: 'on' } },
      ]);

      const startTime = Date.now();
      await request(app)
        .get('/api/smartthings/devices')
        .expect(200);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.normalEndpoint);
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      mockChoreService.getUserChores.mockResolvedValue([]);

      const requests = [];

      // Send 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/chores')
            .set('x-user-id', `user-${i}`)
        );
      }

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect([200, 401]).toContain(response.status);
      });
    });
  });

  describe('Large Response Tests', () => {
    it('should handle large chore lists', async () => {
      const largeChoreList = Array(1000).fill(null).map((_, i) => ({
        id: `chore-${i}`,
        userId: 'user-1',
        name: `Chore ${i}`,
        pointsValue: 50,
        timeSlot: 'morning' as const,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockChoreService.getUserChores.mockResolvedValueOnce(largeChoreList);

      const res = await request(app)
        .get('/api/chores')
        .set('x-user-id', 'user-1');

      expect(res.body.count).toBe(1000);
      expect(res.status).toBe(200);
    });
  });

  describe('Memory Efficiency Tests', () => {
    it('should not leak memory on repeated requests', async () => {
      mockChoreService.getUserChores.mockResolvedValue([]);

      // Warm up first — JIT compilation and first-request allocations
      // (module init, route table, etc.) are one-time costs that would
      // otherwise be misread as a per-request leak.
      for (let i = 0; i < 10; i++) {
        await request(app).get('/api/chores').set('x-user-id', 'user-1');
      }

      if (global.gc) global.gc();
      const initialMemory = process.memoryUsage().heapUsed;

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/chores')
          .set('x-user-id', 'user-1');
      }

      if (global.gc) global.gc();
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Database Query Performance', () => {
    it('should handle queries with many results efficiently', async () => {
      mockChoreService.getTransactionHistory.mockResolvedValueOnce(
        Array(100).fill({
          user_id: 'user-1',
          amount: 50,
          source: 'chore',
          description: 'Test',
          created_at: new Date(),
        })
      );

      const startTime = Date.now();
      await request(app)
        .get('/api/chores/points/history?limit=100')
        .set('x-user-id', 'user-1');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.normalEndpoint);
    });
  });

  describe('Error Recovery Performance', () => {
    it('should handle errors gracefully without significant overhead', async () => {
      mockChoreService.getUserChores.mockRejectedValueOnce(new Error('Service error'));

      const startTime = Date.now();
      await request(app)
        .get('/api/chores')
        .set('x-user-id', 'user-1');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.normalEndpoint);
    });
  });
});
