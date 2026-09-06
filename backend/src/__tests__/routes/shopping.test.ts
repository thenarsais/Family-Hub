import request from 'supertest';
import express from 'express';

const mockShoppingService = {
  getItemsForUser: jest.fn(),
  addItem: jest.fn(),
  setChecked: jest.fn(),
  removeItem: jest.fn(),
  clearChecked: jest.fn(),
};

jest.mock('../../services/shopping', () => ({ getShoppingService: () => mockShoppingService }));

import shoppingRoutes from '../../routes/shopping';

const app = express();
app.use(express.json());
app.use('/api/shopping', shoppingRoutes);

const ITEM = {
  id: 'i1',
  family_id: 'fam-1',
  name: 'Milk',
  checked: false,
  added_by_id: 'user-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('Shopping Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/shopping', () => {
    it('requires a user id', async () => {
      const res = await request(app).get('/api/shopping').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('lists the family items', async () => {
      mockShoppingService.getItemsForUser.mockResolvedValueOnce([ITEM]);

      const res = await request(app).get('/api/shopping').set('x-user-id', 'user-1').expect(200);

      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toBe('Milk');
      expect(mockShoppingService.getItemsForUser).toHaveBeenCalledWith('user-1');
    });

    it('returns 500 on service failure', async () => {
      mockShoppingService.getItemsForUser.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/shopping').set('x-user-id', 'user-1').expect(500);
      expect(res.body.message).toBe('Failed to fetch shopping list');
    });
  });

  describe('POST /api/shopping', () => {
    it('requires a user id', async () => {
      await request(app).post('/api/shopping').send({ name: 'Eggs' }).expect(401);
    });

    it('requires a non-empty name', async () => {
      const res = await request(app)
        .post('/api/shopping')
        .set('x-user-id', 'user-1')
        .send({ name: '   ' })
        .expect(400);
      expect(res.body.message).toBe('Item name required');
    });

    it('adds an item (trimmed) and returns 201', async () => {
      mockShoppingService.addItem.mockResolvedValueOnce({ ...ITEM, name: 'Eggs' });

      const res = await request(app)
        .post('/api/shopping')
        .set('x-user-id', 'user-1')
        .send({ name: '  Eggs  ' })
        .expect(201);

      expect(res.body.data.name).toBe('Eggs');
      expect(mockShoppingService.addItem).toHaveBeenCalledWith('user-1', 'Eggs');
    });

    it('returns 404 when the user has no family', async () => {
      mockShoppingService.addItem.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/shopping')
        .set('x-user-id', 'user-1')
        .send({ name: 'Eggs' })
        .expect(404);
      expect(res.body.message).toBe('No family for this user');
    });
  });

  describe('PATCH /api/shopping/:id', () => {
    it('requires checked to be a boolean', async () => {
      const res = await request(app)
        .patch('/api/shopping/i1')
        .set('x-user-id', 'user-1')
        .send({})
        .expect(400);
      expect(res.body.message).toBe('checked (boolean) required');
    });

    it('sets the checked flag', async () => {
      mockShoppingService.setChecked.mockResolvedValueOnce({ ...ITEM, checked: true });

      const res = await request(app)
        .patch('/api/shopping/i1')
        .set('x-user-id', 'user-1')
        .send({ checked: true })
        .expect(200);

      expect(res.body.data.checked).toBe(true);
      expect(mockShoppingService.setChecked).toHaveBeenCalledWith('user-1', 'i1', true);
    });

    it('returns 404 when nothing matched', async () => {
      mockShoppingService.setChecked.mockResolvedValueOnce(null);

      await request(app)
        .patch('/api/shopping/nope')
        .set('x-user-id', 'user-1')
        .send({ checked: false })
        .expect(404);
    });
  });

  describe('DELETE /api/shopping/checked', () => {
    it('clears checked items and reports the count', async () => {
      mockShoppingService.clearChecked.mockResolvedValueOnce(3);

      const res = await request(app)
        .delete('/api/shopping/checked')
        .set('x-user-id', 'user-1')
        .expect(200);

      expect(res.body.data.removed).toBe(3);
      expect(mockShoppingService.clearChecked).toHaveBeenCalledWith('user-1');
      // literal route must win over :id
      expect(mockShoppingService.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/shopping/:id', () => {
    it('removes an item', async () => {
      mockShoppingService.removeItem.mockResolvedValueOnce(true);

      await request(app).delete('/api/shopping/i1').set('x-user-id', 'user-1').expect(200);
      expect(mockShoppingService.removeItem).toHaveBeenCalledWith('user-1', 'i1');
    });

    it('returns 404 when nothing matched', async () => {
      mockShoppingService.removeItem.mockResolvedValueOnce(false);

      await request(app).delete('/api/shopping/nope').set('x-user-id', 'user-1').expect(404);
    });
  });
});
