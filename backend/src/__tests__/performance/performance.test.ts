/**
 * Performance Tests - Track API response times and resource usage
 * These tests help identify performance bottlenecks and regressions
 */

import request from 'supertest';
import express from 'express';
import choresRoutes from '../../routes/chores';
import learningRoutes from '../../routes/learning';
import smartthingsRoutes from '../../routes/smartthings';

const app = express();
app.use(express.json());
app.use('/api/chores', choresRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/smartthings', smartthingsRoutes);

jest.mock('../../services/chores');
jest.mock('../../services/learning');
jest.mock('../../services/smartthings');

describe('Performance Tests', () => {
  const PERFORMANCE_THRESHOLDS = {
    fastEndpoint: 100, // ms - for simple endpoints
    normalEndpoint: 500, // ms - for endpoints with DB queries
    slowEndpoint: 2000, // ms - for complex operations
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Response Time Tests', () => {
    it('GET /chores should respond within 500ms', async () => {
      const mockService = {
        getUserChores: jest.fn().mockResolvedValue([
          { id: 'chore-1', name: 'Test', userId: 'user-1', pointsValue: 50, timeSlot: 'morning', enabled: true },
        ]),
      };

      require('../../services/chores').getChoreService = jest.fn().mockReturnValue(mockService);

      const startTime = Date.now();
      await request(app)
        .get('/api/chores')
        .set('x-user-id', 'user-1');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.normalEndpoint);
    });

    it('POST /chores should respond within 500ms', async () => {
      const mockService = {
        createChore: jest.fn().mockResolvedValue({
          id: 'chore-1',
          name: 'Test',
          userId: 'user-1',
          pointsValue: 50,
          timeSlot: 'morning',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      require('../../services/chores').getChoreService = jest.fn().mockReturnValue(mockService);

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
      const mockService = {
        getLearningStats: jest.fn().mockResolvedValue({
          totalLessonsCompleted: 5,
          totalPointsEarned: 50,
          alphabet: { completed: 5, total: 47 },
          numbers: { completed: 0, total: 10 },
          vocabulary: { completed: 0, total: 120 },
        }),
      };

      require('../../services/learning').getLearningService = jest.fn().mockReturnValue(mockService);

      const startTime = Date.now();
      await request(app)
        .get('/api/learning/stats')
        .set('x-user-id', 'user-1');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.normalEndpoint);
    });

    it('GET /smartthings/devices should respond within 500ms', async () => {
      const mockService = {
        listDevices: jest.fn().mockResolvedValue([
          { deviceId: 'light-1', name: 'Light', type: 'light', status: { switch: 'on' } },
        ]),
      };

      require('../../services/smartthings').getSmartThingsService = jest.fn().mockReturnValue(mockService);

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
      const mockChoresService = {
        getUserChores: jest.fn().mockResolvedValue([]),
      };

      const mockLearningService = {
        getLearningStats: jest.fn().mockResolvedValue({
          totalLessonsCompleted: 0,
          totalPointsEarned: 0,
          alphabet: { completed: 0, total: 47 },
          numbers: { completed: 0, total: 10 },
          vocabulary: { completed: 0, total: 120 },
        }),
      };

      require('../../services/chores').getChoreService = jest.fn().mockReturnValue(mockChoresService);
      require('../../services/learning').getLearningService = jest.fn().mockReturnValue(mockLearningService);

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

      const mockService = {
        getUserChores: jest.fn().mockResolvedValue(largeChoreList),
      };

      require('../../services/chores').getChoreService = jest.fn().mockReturnValue(mockService);

      const res = await request(app)
        .get('/api/chores')
        .set('x-user-id', 'user-1');

      expect(res.body.count).toBe(1000);
      expect(res.status).toBe(200);
    });
  });

  describe('Memory Efficiency Tests', () => {
    it('should not leak memory on repeated requests', async () => {
      const mockService = {
        getUserChores: jest.fn().mockResolvedValue([]),
      };

      require('../../services/chores').getChoreService = jest.fn().mockReturnValue(mockService);

      const initialMemory = process.memoryUsage().heapUsed;

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/chores')
          .set('x-user-id', 'user-1');
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Database Query Performance', () => {
    it('should handle queries with many results efficiently', async () => {
      const mockService = {
        getTransactionHistory: jest.fn().mockResolvedValue(
          Array(100).fill({
            user_id: 'user-1',
            amount: 50,
            source: 'chore',
            description: 'Test',
            created_at: new Date(),
          })
        ),
      };

      require('../../services/chores').getChoreService = jest.fn().mockReturnValue(mockService);

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
      const mockService = {
        getUserChores: jest.fn().mockRejectedValue(new Error('Service error')),
      };

      require('../../services/chores').getChoreService = jest.fn().mockReturnValue(mockService);

      const startTime = Date.now();
      await request(app)
        .get('/api/chores')
        .set('x-user-id', 'user-1');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.normalEndpoint);
    });
  });
});
