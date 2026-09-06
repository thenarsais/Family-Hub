import request from 'supertest';
import express from 'express';

const mockMealService = {
  getRange: jest.fn(),
  setSlot: jest.fn(),
  clearSlot: jest.fn(),
};

jest.mock('../../services/meals', () => {
  const actual = jest.requireActual('../../services/meals');
  return { ...actual, getMealPlanService: () => mockMealService };
});

import mealsRoutes from '../../routes/meals';

const app = express();
app.use(express.json());
app.use('/api/meals', mealsRoutes);

const ROW = {
  id: 'm1',
  family_id: 'fam-1',
  plan_date: '2026-08-17',
  slot: 'dinner',
  text: 'Tacos',
  updated_by_id: 'user-1',
  created_at: null,
  updated_at: null,
};

describe('Meals Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/meals', () => {
    it('requires a user id', async () => {
      const res = await request(app).get('/api/meals').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('defaults to a rolling 7-day window and returns the rows', async () => {
      mockMealService.getRange.mockResolvedValueOnce([ROW]);

      const res = await request(app).get('/api/meals').set('x-user-id', 'user-1').expect(200);

      expect(res.body.count).toBe(1);
      expect(res.body.range.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(res.body.range.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(mockMealService.getRange).toHaveBeenCalledWith(
        'user-1',
        res.body.range.start,
        res.body.range.end,
      );
    });

    it('passes explicit start/end through', async () => {
      mockMealService.getRange.mockResolvedValueOnce([]);

      await request(app)
        .get('/api/meals?start=2026-08-01&end=2026-08-07')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(mockMealService.getRange).toHaveBeenCalledWith('user-1', '2026-08-01', '2026-08-07');
    });

    it('rejects a malformed date', async () => {
      const res = await request(app)
        .get('/api/meals?start=nope&end=2026-08-07')
        .set('x-user-id', 'user-1')
        .expect(400);
      expect(res.body.message).toMatch(/YYYY-MM-DD/);
    });

    it('returns 500 on service failure', async () => {
      mockMealService.getRange.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/meals').set('x-user-id', 'user-1').expect(500);
      expect(res.body.message).toBe('Failed to fetch meal plan');
    });
  });

  describe('PUT /api/meals/:date/:slot', () => {
    it('sets a slot and echoes the row', async () => {
      mockMealService.setSlot.mockResolvedValueOnce(ROW);

      const res = await request(app)
        .put('/api/meals/2026-08-17/dinner')
        .set('x-user-id', 'user-1')
        .send({ text: 'Tacos' })
        .expect(200);

      expect(res.body.data.text).toBe('Tacos');
      expect(mockMealService.setSlot).toHaveBeenCalledWith('user-1', '2026-08-17', 'dinner', 'Tacos');
    });

    it('returns data:null when the slot was cleared', async () => {
      mockMealService.setSlot.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/meals/2026-08-17/dinner')
        .set('x-user-id', 'user-1')
        .send({ text: '   ' })
        .expect(200);

      expect(res.body.data).toBeNull();
    });

    it('rejects an unknown slot', async () => {
      const res = await request(app)
        .put('/api/meals/2026-08-17/brunch')
        .set('x-user-id', 'user-1')
        .send({ text: 'x' })
        .expect(400);
      expect(res.body.message).toMatch(/breakfast, lunch, dinner, snack/);
    });

    it('rejects a bad date', async () => {
      await request(app)
        .put('/api/meals/2026-8-1/dinner')
        .set('x-user-id', 'user-1')
        .send({ text: 'x' })
        .expect(400);
    });

    it('requires a text string in the body', async () => {
      const res = await request(app)
        .put('/api/meals/2026-08-17/dinner')
        .set('x-user-id', 'user-1')
        .send({})
        .expect(400);
      expect(res.body.message).toMatch(/text/);
    });
  });

  describe('DELETE /api/meals/:date/:slot', () => {
    it('clears a slot', async () => {
      mockMealService.clearSlot.mockResolvedValueOnce(true);

      await request(app)
        .delete('/api/meals/2026-08-17/lunch')
        .set('x-user-id', 'user-1')
        .expect(200);
      expect(mockMealService.clearSlot).toHaveBeenCalledWith('user-1', '2026-08-17', 'lunch');
    });

    it('is 200 even when nothing was there (idempotent)', async () => {
      mockMealService.clearSlot.mockResolvedValueOnce(false);

      await request(app)
        .delete('/api/meals/2026-08-17/snack')
        .set('x-user-id', 'user-1')
        .expect(200);
    });

    it('rejects a bad slot', async () => {
      await request(app)
        .delete('/api/meals/2026-08-17/tea')
        .set('x-user-id', 'user-1')
        .expect(400);
    });
  });
});
