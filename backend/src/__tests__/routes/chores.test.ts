import request from 'supertest';
import express from 'express';

// routes/chores.ts calls getChoreService() once at module load time and holds
// the result in a module-scoped constant. Reassigning getChoreService per-test
// (as this file used to do via `(choreService.getChoreService as jest.Mock)
// .mockReturnValue(...)`) has no effect on that already-captured value — every
// request would silently call methods on whatever the auto-mock returned at
// import time. Instead, mock the module to always return the same shared
// object, and configure that object's methods per test.
const mockChoreService = {
  getChores: jest.fn(),
  createChore: jest.fn(),
  updateChore: jest.fn(),
  completeChore: jest.fn(),
  undoCompletion: jest.fn(),
  getChoreProgress: jest.fn(),
  getPointsSummary: jest.fn(),
  getTransactionHistory: jest.fn(),
};

jest.mock('../../services/chores', () => ({ getChoreService: () => mockChoreService }));

import choresRoutes from '../../routes/chores';

const app = express();
app.use(express.json());
app.use('/api/chores', choresRoutes);

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
    // resetAllMocks (not clearAllMocks) so queued mockResolvedValueOnce/etc.
    // from a previous test can't leak into the next one.
    jest.resetAllMocks();
  });

  describe('GET /api/chores', () => {
    it('should list all chores for user', async () => {
      mockChoreService.getChores.mockResolvedValueOnce(mockChores);

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
      mockChoreService.getChores.mockResolvedValueOnce([]);

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
      mockChoreService.getChores.mockRejectedValueOnce(new Error('Database error'));

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
      mockChoreService.createChore.mockResolvedValueOnce(mockChore);

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

    it('should require a name', async () => {
      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'user-1')
        .send({ timeSlot: 'morning', pointsValue: 10 })
        .expect(400);

      expect(res.body.message).toContain('name is required');
    });

    it('passes assigneeId through and 400s a bad assignee', async () => {
      mockChoreService.createChore.mockResolvedValueOnce({ ...mockChore, userId: 'kid-1' });
      await request(app)
        .post('/api/chores')
        .set('x-user-id', 'parent-1')
        .send({ name: 'Trash', timeSlot: 'morning', pointsValue: 10, assigneeId: 'kid-1' })
        .expect(201);
      expect(mockChoreService.createChore).toHaveBeenCalledWith(
        'parent-1',
        'Trash',
        undefined,
        'morning',
        10,
        'kid-1',
      );

      mockChoreService.createChore.mockRejectedValueOnce(new Error('bad-assignee'));
      const res = await request(app)
        .post('/api/chores')
        .set('x-user-id', 'parent-1')
        .send({ name: 'Trash', timeSlot: 'morning', pointsValue: 10, assigneeId: 'stranger' })
        .expect(400);
      expect(res.body.message).toContain('not a member of your family');
    });

    it('should return 4xx (not 500) for a bodyless request', async () => {
      // The handler destructures `req.body` before the userId guard; without
      // normalizeBody a bodyless POST would throw and 500. See middleware/normalize-body.ts.
      await request(app).post('/api/chores').expect(401);
      await request(app).post('/api/chores').set('x-user-id', 'user-1').expect(400);
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
      mockChoreService.createChore.mockResolvedValueOnce(mockChore);

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
      mockChoreService.createChore.mockRejectedValueOnce(new Error('Database error'));

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

  describe('GET /api/chores?scope=family', () => {
    it('passes the family scope through', async () => {
      mockChoreService.getChores.mockResolvedValueOnce(mockChores);
      await request(app)
        .get('/api/chores?scope=family')
        .set('x-user-id', 'parent-1')
        .expect(200);
      expect(mockChoreService.getChores).toHaveBeenCalledWith('parent-1', 'family');
    });

    it('defaults to the "mine" scope', async () => {
      mockChoreService.getChores.mockResolvedValueOnce([]);
      await request(app).get('/api/chores').set('x-user-id', 'kid-1').expect(200);
      expect(mockChoreService.getChores).toHaveBeenCalledWith('kid-1', 'mine');
    });
  });

  describe('PATCH /api/chores/:id', () => {
    it('updates whitelisted fields', async () => {
      mockChoreService.updateChore.mockResolvedValueOnce({ ...mockChore, pointsValue: 25 });
      const res = await request(app)
        .patch('/api/chores/chore-1')
        .set('x-user-id', 'parent-1')
        .send({ pointsValue: 25, enabled: false })
        .expect(200);
      expect(res.body.chore.pointsValue).toBe(25);
      expect(mockChoreService.updateChore).toHaveBeenCalledWith('parent-1', 'chore-1', {
        points_value: 25,
        enabled: false,
      });
    });

    it('404s when the chore is not in the caller family', async () => {
      mockChoreService.updateChore.mockResolvedValueOnce(null);
      await request(app)
        .patch('/api/chores/chore-1')
        .set('x-user-id', 'outsider')
        .send({ name: 'x' })
        .expect(404);
    });

    it('validates timeSlot / pointsValue on update', async () => {
      await request(app)
        .patch('/api/chores/chore-1')
        .set('x-user-id', 'parent-1')
        .send({ timeSlot: 'nope' })
        .expect(400);
      await request(app)
        .patch('/api/chores/chore-1')
        .set('x-user-id', 'parent-1')
        .send({ pointsValue: -3 })
        .expect(400);
    });

    it('requires a user id', async () => {
      await request(app).patch('/api/chores/chore-1').send({ name: 'x' }).expect(401);
    });
  });

  describe('DELETE /api/chores/:choreId/complete', () => {
    it('undoes today\'s completion', async () => {
      mockChoreService.undoCompletion.mockResolvedValueOnce(true);
      mockChoreService.getChoreProgress.mockResolvedValueOnce({
        totalCompleted: 0,
        thisWeek: 0,
        thisMonth: 0,
        pointsEarned: 0,
      });
      const res = await request(app)
        .delete('/api/chores/chore-1/complete')
        .set('x-user-id', 'kid-1')
        .expect(200);
      expect(res.body.message).toBe('Chore completion undone');
      expect(mockChoreService.undoCompletion).toHaveBeenCalledWith('kid-1', 'chore-1');
    });

    it('404s when there is nothing to undo today', async () => {
      mockChoreService.undoCompletion.mockResolvedValueOnce(false);
      await request(app)
        .delete('/api/chores/chore-1/complete')
        .set('x-user-id', 'kid-1')
        .expect(404);
    });

    it('requires a user id', async () => {
      await request(app).delete('/api/chores/chore-1/complete').expect(401);
    });
  });

  describe('POST /api/chores/:choreId/complete', () => {
    it('409s when already completed today', async () => {
      mockChoreService.completeChore.mockRejectedValueOnce(new Error('already-completed-today'));
      const res = await request(app)
        .post('/api/chores/chore-1/complete')
        .set('x-user-id', 'kid-1')
        .expect(409);
      expect(res.body.message).toBe('Chore already completed today');
    });

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

      mockChoreService.completeChore.mockResolvedValueOnce(mockCompletion);
      mockChoreService.getChoreProgress.mockResolvedValueOnce(mockProgress);

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
      mockChoreService.completeChore.mockRejectedValueOnce(new Error('Chore not found'));

      const res = await request(app)
        .post('/api/chores/invalid-id/complete')
        .set('x-user-id', 'user-1')
        .expect(404);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Chore not found');
    });

    it('should handle service errors', async () => {
      mockChoreService.completeChore.mockRejectedValueOnce(new Error('Database error'));

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

      mockChoreService.getChoreProgress.mockResolvedValueOnce(mockProgress);
      mockChoreService.getPointsSummary.mockResolvedValueOnce(mockPointsSummary);

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
      mockChoreService.getChoreProgress.mockRejectedValueOnce(new Error('Database error'));

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

      mockChoreService.getPointsSummary.mockResolvedValueOnce(mockPointsSummary);

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
      mockChoreService.getPointsSummary.mockRejectedValueOnce(new Error('Database error'));

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

      mockChoreService.getTransactionHistory.mockResolvedValueOnce(mockHistory);

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

      mockChoreService.getTransactionHistory.mockResolvedValueOnce(mockHistory);

      const res = await request(app)
        .get('/api/chores/points/history?limit=50')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.count).toBe(50);
    });

    it('should enforce max limit of 100', async () => {
      mockChoreService.getTransactionHistory.mockImplementationOnce((userId: string, limit: number) => {
        expect(limit).toBeLessThanOrEqual(100);
        return Promise.resolve([]);
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
      mockChoreService.getTransactionHistory.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/chores/points/history')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.count).toBe(0);
      expect(res.body.history).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockChoreService.getTransactionHistory.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .get('/api/chores/points/history')
        .set('x-user-id', 'user-1')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to get transaction history');
    });
  });
});
