import request from 'supertest';
import express from 'express';
import choresRoutes from '../../routes/chores';
import * as choreService from '../../services/chores';

const app = express();
app.use(express.json());
app.use('/api/chores', choresRoutes);

jest.mock('../../services/chores');

describe('Chores Routes', () => {
  const mockChore = {
    id: 'chore-1',
    userId: 'user-1',
    name: 'Clean bedroom',
    description: 'Tidy up and vacuum',
    timeSlot: 'morning' as const,
    pointsValue: 50,
    enabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockChores = [
    mockChore,
    {
      id: 'chore-2',
      userId: 'user-1',
      name: 'Do dishes',
      description: 'Wash and dry dishes',
      timeSlot: 'evening' as const,
      pointsValue: 30,
      enabled: true,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/chores', () => {
    it('should list all chores for user', async () => {
      (choreService.getChoreService as jest.Mock).mockReturnValue({
        getUserChores: jest.fn().mockResolvedValue(mockChores),
      });

      const res = await request(app)
        .get('/api/chores')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(2);
      expect(res.body.chores).toHaveLength(2);
      expect(res.body.chores[0].name).toBe('Clean bedroom');
    });

    it('should return empty array when no chores', async () => {
      (choreService.getChoreService as jest.Mock).mockReturnValue({
        getUserChores: jest.fn().mockResolvedValue([]),
      });

      const res = await request(app)
        .get('/api/chores')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.count).toBe(0);
      expect(res.body.chores).toEqual([]);
    });

    it('should require user ID', async () => {
      const res = await request(app)
        .get('/api/chores')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User ID required');
    });

    it('should handle service errors', async () => {
      (choreService.getChoreService as jest.Mock).mockReturnValue({
        getUserChores: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const res = await request(app)
        .get('/api/chores')
        .set('x-user-id', 'user-1')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to list chores');
    });
  });

  describe('POST /api/chores', () => {
    it('should create a new chore', async () => {
      (choreService.getChoreService as jest.Mock).mockReturnValue({
        createChore: jest.fn().mockResolvedValue(mockChore),
      });

      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: 'Clean bedroom',
          description: 'Tidy up and vacuum',
          timeSlot: 'morning',
          pointsValue: 50,
        })
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.chore.name).toBe('Clean bedroom');
      expect(res.body.chore.pointsValue).toBe(50);
    });

    it('should require user ID', async () => {
      const res = await request(app)
        .post('/api/chores')
        .send({
          name: 'Clean bedroom',
          timeSlot: 'morning',
          pointsValue: 50,
        })
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User ID required');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: 'Clean bedroom',
        })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('required');
    });

    it('should validate timeSlot enum', async () => {
      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: 'Clean bedroom',
          timeSlot: 'invalid',
          pointsValue: 50,
        })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('morning, afternoon, or evening');
    });

    it('should validate pointsValue is positive', async () => {
      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: 'Clean bedroom',
          timeSlot: 'morning',
          pointsValue: 0,
        })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('positive number');
    });

    it('should allow optional description', async () => {
      (choreService.getChoreService as jest.Mock).mockReturnValue({
        createChore: jest.fn().mockResolvedValue(mockChore),
      });

      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: 'Clean bedroom',
          timeSlot: 'morning',
          pointsValue: 50,
        })
        .expect(201);

      expect(res.body.status).toBe('success');
    });

    it('should handle service errors', async () => {
      (choreService.getChoreService as jest.Mock).mockReturnValue({
        createChore: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({
          name: 'Clean bedroom',
          timeSlot: 'morning',
          pointsValue: 50,
        })
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to create chore');
    });
  });

  describe('POST /api/chores/:choreId/complete', () => {
    it('should complete a chore and award points', async () => {
      const mockCompletion = {
        id: 'completion-1',
        choreId: 'chore-1',
        userId: 'user-1',
        completedAt: new Date(),
        pointsEarned: 50,
      };

      const mockProgress = {
        totalCompleted: 1,
        thisWeek: 1,
        thisMonth: 1,
        pointsEarned: 50,
      };

      (choreService.getChoreService as jest.Mock).mockReturnValue({
        completeChore: jest.fn().mockResolvedValue(mockCompletion),
        getChoreProgress: jest.fn().mockResolvedValue(mockProgress),
      });

      const res = await request(app)
        .post('/api/chores/chore-1/complete')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.completion.pointsEarned).toBe(50);
      expect(res.body.progress.totalCompleted).toBe(1);
    });

    it('should require user ID', async () => {
      const res = await request(app)
        .post('/api/chores/chore-1/complete')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User ID required');
    });

    it('should return 404 when chore not found', async () => {
      (choreService.getChoreService as jest.Mock).mockReturnValue({
        completeChore: jest.fn().mockRejectedValue(new Error('Chore not found')),
      });

      const res = await request(app)
        .post('/api/chores/invalid-id/complete')
        .set('x-user-id', 'user-1')
        .expect(404);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Chore not found');
    });

    it('should handle service errors', async () => {
      (choreService.getChoreService as jest.Mock).mockReturnValue({
        completeChore: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const res = await request(app)
        .post('/api/chores/chore-1/complete')
        .set('x-user-id', 'user-1')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to complete chore');
    });
  });

  describe('GET /api/chores/progress/summary', () => {
    it('should get chore progress and points summary', async () => {
      const mockProgress = {
        totalCompleted: 10,
        thisWeek: 5,
        thisMonth: 8,
        pointsEarned: 450,
      };

      const mockPointsSummary = {
        totalPoints: 1000,
        dailyPoints: 100,
        weeklyPoints: 500,
        monthlyPoints: 800,
      };

      (choreService.getChoreService as jest.Mock).mockReturnValue({
        getChoreProgress: jest.fn().mockResolvedValue(mockProgress),
        getPointsSummary: jest.fn().mockResolvedValue(mockPointsSummary),
      });

      const res = await request(app)
        .get('/api/chores/progress/summary')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.progress.totalCompleted).toBe(10);
      expect(res.body.progress.totalPoints).toBe(1000);
      expect(res.body.progress.dailyPoints).toBe(100);
    });

    it('should require user ID', async () => {
      const res = await request(app)
        .get('/api/chores/progress/summary')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User ID required');
    });

    it('should handle service errors', async () => {
      (choreService.getChoreService as jest.Mock).mockReturnValue({
        getChoreProgress: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const res = await request(app)
        .get('/api/chores/progress/summary')
        .set('x-user-id', 'user-1')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to get chore progress');
    });
  });

  describe('GET /api/chores/points/summary', () => {
    it('should get user points summary', async () => {
      const mockPointsSummary = {
        totalPoints: 1000,
        dailyPoints: 100,
        weeklyPoints: 500,
        monthlyPoints: 800,
      };

      (choreService.getChoreService as jest.Mock).mockReturnValue({
        getPointsSummary: jest.fn().mockResolvedValue(mockPointsSummary),
      });

      const res = await request(app)
        .get('/api/chores/points/summary')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.totalPoints).toBe(1000);
      expect(res.body.data.dailyPoints).toBe(100);
      expect(res.body.data.weeklyPoints).toBe(500);
      expect(res.body.data.monthlyPoints).toBe(800);
    });

    it('should require user ID', async () => {
      const res = await request(app)
        .get('/api/chores/points/summary')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User ID required');
    });

    it('should handle service errors', async () => {
      (choreService.getChoreService as jest.Mock).mockReturnValue({
        getPointsSummary: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const res = await request(app)
        .get('/api/chores/points/summary')
        .set('x-user-id', 'user-1')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to get points summary');
    });
  });

  describe('GET /api/chores/points/history', () => {
    it('should get transaction history', async () => {
      const mockHistory = [
        { user_id: 'user-1', amount: 50, source: 'chore', description: 'Completed: chore-1', created_at: new Date() },
        { user_id: 'user-1', amount: 30, source: 'chore', description: 'Completed: chore-2', created_at: new Date() },
      ];

      (choreService.getChoreService as jest.Mock).mockReturnValue({
        getTransactionHistory: jest.fn().mockResolvedValue(mockHistory),
      });

      const res = await request(app)
        .get('/api/chores/points/history')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(2);
      expect(res.body.history).toHaveLength(2);
    });

    it('should limit results', async () => {
      const mockHistory = Array(50).fill({
        user_id: 'user-1',
        amount: 50,
        source: 'chore',
        description: 'Completed: chore-1',
        created_at: new Date(),
      });

      (choreService.getChoreService as jest.Mock).mockReturnValue({
        getTransactionHistory: jest.fn().mockResolvedValue(mockHistory),
      });

      const res = await request(app)
        .get('/api/chores/points/history?limit=50')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.count).toBe(50);
    });

    it('should enforce max limit of 100', async () => {
      (choreService.getChoreService as jest.Mock).mockReturnValue({
        getTransactionHistory: jest.fn().mockResolvedValue([]),
      });

      const mockService = (choreService.getChoreService as jest.Mock).mockReturnValue({
        getTransactionHistory: jest.fn().mockImplementation((userId, limit) => {
          expect(limit).toBeLessThanOrEqual(100);
          return Promise.resolve([]);
        }),
      });

      const res = await request(app)
        .get('/api/chores/points/history?limit=200')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.status).toBe('success');
    });

    it('should require user ID', async () => {
      const res = await request(app)
        .get('/api/chores/points/history')
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User ID required');
    });

    it('should return empty history when no transactions', async () => {
      (choreService.getChoreService as jest.Mock).mockReturnValue({
        getTransactionHistory: jest.fn().mockResolvedValue([]),
      });

      const res = await request(app)
        .get('/api/chores/points/history')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.count).toBe(0);
      expect(res.body.history).toEqual([]);
    });

    it('should handle service errors', async () => {
      (choreService.getChoreService as jest.Mock).mockReturnValue({
        getTransactionHistory: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const res = await request(app)
        .get('/api/chores/points/history')
        .set('x-user-id', 'user-1')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to get transaction history');
    });
  });
});
