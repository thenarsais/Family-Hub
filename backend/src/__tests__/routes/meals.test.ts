import request from 'supertest';
import express from 'express';

const mockMealService = {
  getRange: jest.fn(),
  setSlot: jest.fn(),
  clearSlot: jest.fn(),
  getLibrary: jest.fn(),
  addLibraryItem: jest.fn(),
  updateLibraryItem: jest.fn(),
  removeLibraryItem: jest.fn(),
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

  describe('meal library (FR-133)', () => {
    const LIB = { id: 'l1', family_id: 'fam-1', name: 'Taco night', default_slot: 'dinner' };

    it('GET /library lists items', async () => {
      mockMealService.getLibrary.mockResolvedValueOnce([LIB]);
      const res = await request(app).get('/api/meals/library').set('x-user-id', 'u1').expect(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toBe('Taco night');
    });

    it('GET /library requires a user id', async () => {
      await request(app).get('/api/meals/library').expect(401);
    });

    it('POST /library adds a trimmed name + slot', async () => {
      mockMealService.addLibraryItem.mockResolvedValueOnce(LIB);
      const res = await request(app)
        .post('/api/meals/library')
        .set('x-user-id', 'u1')
        .send({ name: '  Taco night  ', defaultSlot: 'dinner' })
        .expect(201);
      expect(res.body.data.name).toBe('Taco night');
      expect(mockMealService.addLibraryItem).toHaveBeenCalledWith('u1', 'Taco night', 'dinner');
    });

    it('POST /library rejects a blank name', async () => {
      const res = await request(app)
        .post('/api/meals/library')
        .set('x-user-id', 'u1')
        .send({ name: '   ' })
        .expect(400);
      expect(res.body.message).toBe('name required');
    });

    it('POST /library rejects a bad defaultSlot', async () => {
      await request(app)
        .post('/api/meals/library')
        .set('x-user-id', 'u1')
        .send({ name: 'X', defaultSlot: 'brunch' })
        .expect(400);
    });

    it('POST /library allows no slot (defaults to null)', async () => {
      mockMealService.addLibraryItem.mockResolvedValueOnce({ ...LIB, default_slot: null });
      await request(app)
        .post('/api/meals/library')
        .set('x-user-id', 'u1')
        .send({ name: 'Leftovers' })
        .expect(201);
      expect(mockMealService.addLibraryItem).toHaveBeenCalledWith('u1', 'Leftovers', null);
    });

    it('POST /library 404s when the user has no family', async () => {
      mockMealService.addLibraryItem.mockResolvedValueOnce(null);
      await request(app)
        .post('/api/meals/library')
        .set('x-user-id', 'u1')
        .send({ name: 'X' })
        .expect(404);
    });

    it('PATCH /library/:id renames', async () => {
      mockMealService.updateLibraryItem.mockResolvedValueOnce({ ...LIB, name: 'Taco Tuesday' });
      const res = await request(app)
        .patch('/api/meals/library/l1')
        .set('x-user-id', 'u1')
        .send({ name: 'Taco Tuesday' })
        .expect(200);
      expect(res.body.data.name).toBe('Taco Tuesday');
      expect(mockMealService.updateLibraryItem).toHaveBeenCalledWith('u1', 'l1', { name: 'Taco Tuesday' });
    });

    it('PATCH /library/:id can clear the slot (defaultSlot: null)', async () => {
      mockMealService.updateLibraryItem.mockResolvedValueOnce({ ...LIB, default_slot: null });
      await request(app)
        .patch('/api/meals/library/l1')
        .set('x-user-id', 'u1')
        .send({ defaultSlot: null })
        .expect(200);
      expect(mockMealService.updateLibraryItem).toHaveBeenCalledWith('u1', 'l1', { defaultSlot: null });
    });

    it('PATCH /library/:id 400s with nothing to update', async () => {
      await request(app)
        .patch('/api/meals/library/l1')
        .set('x-user-id', 'u1')
        .send({})
        .expect(400);
    });

    it('PATCH /library/:id 404s when nothing matched', async () => {
      mockMealService.updateLibraryItem.mockResolvedValueOnce(null);
      await request(app)
        .patch('/api/meals/library/nope')
        .set('x-user-id', 'u1')
        .send({ name: 'X' })
        .expect(404);
    });

    it('DELETE /library/:id removes', async () => {
      mockMealService.removeLibraryItem.mockResolvedValueOnce(true);
      await request(app).delete('/api/meals/library/l1').set('x-user-id', 'u1').expect(200);
      expect(mockMealService.removeLibraryItem).toHaveBeenCalledWith('u1', 'l1');
    });

    it('DELETE /library/:id 404s when nothing matched', async () => {
      mockMealService.removeLibraryItem.mockResolvedValueOnce(false);
      await request(app).delete('/api/meals/library/nope').set('x-user-id', 'u1').expect(404);
    });

    it('does not shadow the date/slot routes', async () => {
      mockMealService.setSlot.mockResolvedValueOnce(ROW);
      await request(app)
        .put('/api/meals/2026-08-17/dinner')
        .set('x-user-id', 'u1')
        .send({ text: 'Tacos' })
        .expect(200);
      expect(mockMealService.setSlot).toHaveBeenCalled();
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
