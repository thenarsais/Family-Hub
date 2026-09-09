import request from 'supertest';
import express from 'express';

// routes/habits.ts calls getHabitService() once at module load time and holds
// the result in a module-scoped constant — so mock the module to always return
// the same shared object and configure its methods per test.
const mockHabitService = {
  getHabits: jest.fn(),
  createHabit: jest.fn(),
  updateHabit: jest.fn(),
  completeHabit: jest.fn(),
  undoHabitCompletion: jest.fn(),
  getTodayMood: jest.fn(),
  setMood: jest.fn(),
  getFamilyMoodHistory: jest.fn(),
};

jest.mock('../../services/habits', () => ({
  ...jest.requireActual('../../services/habits'),
  getHabitService: () => mockHabitService,
}));

import habitsRoutes from '../../routes/habits';

const app = express();
app.use(express.json());
app.use('/api/habits', habitsRoutes);

const HABIT = {
  id: 'habit-1',
  userId: 'user-1',
  title: 'Meditate',
  weeklyTarget: 5,
  pointsValue: 10,
  enabled: true,
  weekCompletions: 2,
  completedToday: false,
  weekStreak: 1,
};

describe('Habits Routes', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('GET /api/habits', () => {
    it('401s without x-user-id', async () => {
      const res = await request(app).get('/api/habits');
      expect(res.status).toBe(401);
    });

    it('lists the caller board (scope defaults to mine)', async () => {
      mockHabitService.getHabits.mockResolvedValueOnce([HABIT]);
      const res = await request(app).get('/api/habits').set('x-user-id', 'user-1');
      expect(res.status).toBe(200);
      expect(res.body.habits).toHaveLength(1);
      expect(mockHabitService.getHabits).toHaveBeenCalledWith('user-1', 'mine');
    });

    it('passes scope=family through', async () => {
      mockHabitService.getHabits.mockResolvedValueOnce([]);
      await request(app).get('/api/habits?scope=family').set('x-user-id', 'user-1');
      expect(mockHabitService.getHabits).toHaveBeenCalledWith('user-1', 'family');
    });
  });

  describe('POST /api/habits', () => {
    it('requires a title', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('x-user-id', 'user-1')
        .send({ weeklyTarget: 5, pointsValue: 10 });
      expect(res.status).toBe(400);
    });

    it('rejects a weeklyTarget outside 1..7', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('x-user-id', 'user-1')
        .send({ title: 'x', weeklyTarget: 9, pointsValue: 10 });
      expect(res.status).toBe(400);
    });

    it('creates a habit and passes assigneeId through', async () => {
      mockHabitService.createHabit.mockResolvedValueOnce(HABIT);
      const res = await request(app)
        .post('/api/habits')
        .set('x-user-id', 'user-1')
        .send({ title: 'Meditate', weeklyTarget: 5, pointsValue: 10, assigneeId: 'kid-1' });
      expect(res.status).toBe(201);
      expect(mockHabitService.createHabit).toHaveBeenCalledWith(
        'user-1',
        'Meditate',
        undefined,
        5,
        10,
        'kid-1',
      );
    });

    it('400s a bad assignee', async () => {
      mockHabitService.createHabit.mockRejectedValueOnce(new Error('bad-assignee'));
      const res = await request(app)
        .post('/api/habits')
        .set('x-user-id', 'user-1')
        .send({ title: 'x', weeklyTarget: 5, pointsValue: 10, assigneeId: 'stranger' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/family/i);
    });
  });

  describe('PATCH /api/habits/:id', () => {
    it('updates a habit', async () => {
      mockHabitService.updateHabit.mockResolvedValueOnce({ ...HABIT, weeklyTarget: 3 });
      const res = await request(app)
        .patch('/api/habits/habit-1')
        .set('x-user-id', 'user-1')
        .send({ weeklyTarget: 3 });
      expect(res.status).toBe(200);
      expect(mockHabitService.updateHabit).toHaveBeenCalledWith('user-1', 'habit-1', {
        weekly_target: 3,
      });
    });

    it('404s when the habit is not in the family', async () => {
      mockHabitService.updateHabit.mockResolvedValueOnce(null);
      const res = await request(app)
        .patch('/api/habits/nope')
        .set('x-user-id', 'user-1')
        .send({ title: 'x' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/habits/:habitId/complete', () => {
    it('completes and returns the points earned', async () => {
      mockHabitService.completeHabit.mockResolvedValueOnce({ pointsEarned: 12 });
      const res = await request(app)
        .post('/api/habits/habit-1/complete')
        .set('x-user-id', 'user-1');
      expect(res.status).toBe(200);
      expect(res.body.pointsEarned).toBe(12);
    });

    it('409s when already completed today', async () => {
      mockHabitService.completeHabit.mockRejectedValueOnce(new Error('already-completed-today'));
      const res = await request(app)
        .post('/api/habits/habit-1/complete')
        .set('x-user-id', 'user-1');
      expect(res.status).toBe(409);
    });

    it('404s an unknown habit', async () => {
      mockHabitService.completeHabit.mockRejectedValueOnce(new Error('Habit not found'));
      const res = await request(app)
        .post('/api/habits/x/complete')
        .set('x-user-id', 'user-1');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/habits/:habitId/complete', () => {
    it('undoes a completion', async () => {
      mockHabitService.undoHabitCompletion.mockResolvedValueOnce(true);
      const res = await request(app)
        .delete('/api/habits/habit-1/complete')
        .set('x-user-id', 'user-1');
      expect(res.status).toBe(200);
    });

    it('404s when there is nothing to undo', async () => {
      mockHabitService.undoHabitCompletion.mockResolvedValueOnce(false);
      const res = await request(app)
        .delete('/api/habits/habit-1/complete')
        .set('x-user-id', 'user-1');
      expect(res.status).toBe(404);
    });
  });

  describe('500 paths', () => {
    it('GET / surfaces a service failure as 500', async () => {
      mockHabitService.getHabits.mockRejectedValueOnce(new Error('db down'));
      const res = await request(app).get('/api/habits').set('x-user-id', 'user-1');
      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
    });

    it('POST / surfaces a non-assignee failure as 500', async () => {
      mockHabitService.createHabit.mockRejectedValueOnce(new Error('boom'));
      const res = await request(app)
        .post('/api/habits')
        .set('x-user-id', 'user-1')
        .send({ title: 'x', weeklyTarget: 5, pointsValue: 10 });
      expect(res.status).toBe(500);
    });

    it('PATCH validates weeklyTarget before touching the service', async () => {
      const res = await request(app)
        .patch('/api/habits/habit-1')
        .set('x-user-id', 'user-1')
        .send({ weeklyTarget: 0 });
      expect(res.status).toBe(400);
      expect(mockHabitService.updateHabit).not.toHaveBeenCalled();
    });

    it('DELETE surfaces a service failure as 500', async () => {
      mockHabitService.undoHabitCompletion.mockRejectedValueOnce(new Error('nope'));
      const res = await request(app)
        .delete('/api/habits/habit-1/complete')
        .set('x-user-id', 'user-1');
      expect(res.status).toBe(500);
    });

    it('POST /mood surfaces a service failure as 500', async () => {
      mockHabitService.setMood.mockRejectedValueOnce(new Error('nope'));
      const res = await request(app)
        .post('/api/habits/mood')
        .set('x-user-id', 'user-1')
        .send({ mood: 'ok' });
      expect(res.status).toBe(500);
    });

    it('GET /mood/history surfaces a non-role failure as 500', async () => {
      mockHabitService.getFamilyMoodHistory.mockRejectedValueOnce(new Error('nope'));
      const res = await request(app).get('/api/habits/mood/history').set('x-user-id', 'parent-1');
      expect(res.status).toBe(500);
    });

    it('GET /mood/today surfaces a service failure as 500', async () => {
      mockHabitService.getTodayMood.mockRejectedValueOnce(new Error('nope'));
      const res = await request(app).get('/api/habits/mood/today').set('x-user-id', 'user-1');
      expect(res.status).toBe(500);
    });

    it('completes: an unexpected error is a 500', async () => {
      mockHabitService.completeHabit.mockRejectedValueOnce(new Error('weird'));
      const res = await request(app)
        .post('/api/habits/habit-1/complete')
        .set('x-user-id', 'user-1');
      expect(res.status).toBe(500);
    });
  });

  describe('mood', () => {
    it('GET /mood/today returns the entry', async () => {
      mockHabitService.getTodayMood.mockResolvedValueOnce({ id: 'm1', mood: 'good' });
      const res = await request(app).get('/api/habits/mood/today').set('x-user-id', 'user-1');
      expect(res.status).toBe(200);
      expect(res.body.mood.mood).toBe('good');
    });

    it('POST /mood rejects an invalid value', async () => {
      const res = await request(app)
        .post('/api/habits/mood')
        .set('x-user-id', 'user-1')
        .send({ mood: 'ecstatic' });
      expect(res.status).toBe(400);
    });

    it('POST /mood records a valid value', async () => {
      mockHabitService.setMood.mockResolvedValueOnce({ id: 'm2', mood: 'great' });
      const res = await request(app)
        .post('/api/habits/mood')
        .set('x-user-id', 'user-1')
        .send({ mood: 'great' });
      expect(res.status).toBe(200);
      expect(mockHabitService.setMood).toHaveBeenCalledWith('user-1', 'great', undefined, undefined);
    });

    it('GET /mood/history 403s a non-parent', async () => {
      mockHabitService.getFamilyMoodHistory.mockRejectedValueOnce(new Error('not-parent'));
      const res = await request(app).get('/api/habits/mood/history').set('x-user-id', 'kid-1');
      expect(res.status).toBe(403);
    });

    it('GET /mood/history returns rows for a parent', async () => {
      mockHabitService.getFamilyMoodHistory.mockResolvedValueOnce([
        { userId: 'kid-1', assigneeName: 'Krish', day: '2026-09-08', mood: 'good', emoji: '🙂' },
      ]);
      const res = await request(app)
        .get('/api/habits/mood/history?days=30')
        .set('x-user-id', 'parent-1');
      expect(res.status).toBe(200);
      expect(res.body.history).toHaveLength(1);
      expect(mockHabitService.getFamilyMoodHistory).toHaveBeenCalledWith('parent-1', 30);
    });
  });
});
