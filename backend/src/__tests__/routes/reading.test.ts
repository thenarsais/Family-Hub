import request from 'supertest';
import express from 'express';

const mockReadingService = {
  getToday: jest.fn(),
  logToday: jest.fn(),
  undoToday: jest.fn(),
  getGoals: jest.fn(),
  getFamilyGoals: jest.fn(),
  setGoals: jest.fn(),
};

jest.mock('../../services/reading', () => ({
  ...jest.requireActual('../../services/reading'),
  getReadingService: () => mockReadingService,
}));

import readingRoutes from '../../routes/reading';

const app = express();
app.use(express.json());
app.use('/api/reading', readingRoutes);

const U = (r: request.Test) => r.set('x-user-id', 'user-1');

const TODAY = {
  goals: { dailyMinutes: 20, weeklyMinutes: 100, pointsValue: 10 },
  log: null,
  weekMinutes: 0,
  streak: 0,
};

describe('Reading routes', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('GET /api/reading/today', () => {
    it('401s without x-user-id', async () => {
      await request(app).get('/api/reading/today').expect(401);
    });

    it("returns today's payload", async () => {
      mockReadingService.getToday.mockResolvedValueOnce(TODAY);
      const res = await U(request(app).get('/api/reading/today')).expect(200);
      expect(res.body.goals.dailyMinutes).toBe(20);
      expect(mockReadingService.getToday).toHaveBeenCalledWith('user-1');
    });

    it('500s on a service error', async () => {
      mockReadingService.getToday.mockRejectedValueOnce(new Error('boom'));
      await U(request(app).get('/api/reading/today')).expect(500);
    });
  });

  describe('POST /api/reading/today', () => {
    it('401s without x-user-id', async () => {
      await request(app).post('/api/reading/today').send({ minutes: 25 }).expect(401);
    });

    it('400s on a missing/negative minutes', async () => {
      await U(request(app).post('/api/reading/today')).send({}).expect(400);
      await U(request(app).post('/api/reading/today')).send({ minutes: -1 }).expect(400);
    });

    it('logs and returns 201', async () => {
      mockReadingService.logToday.mockResolvedValueOnce({
        ...TODAY,
        log: { minutes: 25, goalMet: true, pointsEarned: 10 },
        streak: 1,
      });
      const res = await U(request(app).post('/api/reading/today')).send({ minutes: 25 }).expect(201);
      expect(res.body.log.goalMet).toBe(true);
      expect(mockReadingService.logToday).toHaveBeenCalledWith('user-1', 25);
    });

    it('409s when already logged', async () => {
      mockReadingService.logToday.mockRejectedValueOnce(new Error('already-logged'));
      await U(request(app).post('/api/reading/today')).send({ minutes: 25 }).expect(409);
    });

    it('500s on an unexpected error', async () => {
      mockReadingService.logToday.mockRejectedValueOnce(new Error('db down'));
      await U(request(app).post('/api/reading/today')).send({ minutes: 25 }).expect(500);
    });
  });

  describe('DELETE /api/reading/today', () => {
    it('undoes a log', async () => {
      mockReadingService.undoToday.mockResolvedValueOnce(true);
      await U(request(app).delete('/api/reading/today')).expect(200);
    });

    it('404s when there was nothing to undo', async () => {
      mockReadingService.undoToday.mockResolvedValueOnce(false);
      await U(request(app).delete('/api/reading/today')).expect(404);
    });
  });

  describe('GET /api/reading/goals', () => {
    it('defaults to scope=mine', async () => {
      mockReadingService.getGoals.mockResolvedValueOnce(TODAY.goals);
      await U(request(app).get('/api/reading/goals')).expect(200);
      expect(mockReadingService.getGoals).toHaveBeenCalledWith('user-1');
      expect(mockReadingService.getFamilyGoals).not.toHaveBeenCalled();
    });

    it('scope=family lists every member', async () => {
      mockReadingService.getFamilyGoals.mockResolvedValueOnce([
        { userId: 'kid-1', name: 'Krish', ...TODAY.goals },
      ]);
      const res = await U(request(app).get('/api/reading/goals?scope=family')).expect(200);
      expect(res.body.goals).toHaveLength(1);
    });
  });

  describe('PATCH /api/reading/goals/:userId', () => {
    it('saves whitelisted goal fields', async () => {
      mockReadingService.setGoals.mockResolvedValueOnce({ ...TODAY.goals, dailyMinutes: 30 });
      const res = await U(request(app).patch('/api/reading/goals/kid-1'))
        .send({ dailyMinutes: 30 })
        .expect(200);
      expect(res.body.goals.dailyMinutes).toBe(30);
      expect(mockReadingService.setGoals).toHaveBeenCalledWith('user-1', 'kid-1', {
        daily_minutes: 30,
      });
    });

    it('400s on a non-positive value', async () => {
      await U(request(app).patch('/api/reading/goals/kid-1')).send({ dailyMinutes: 0 }).expect(400);
    });

    it('400s when the target is not in the family', async () => {
      mockReadingService.setGoals.mockRejectedValueOnce(new Error('bad-assignee'));
      await U(request(app).patch('/api/reading/goals/stranger'))
        .send({ dailyMinutes: 30 })
        .expect(400);
    });
  });
});
