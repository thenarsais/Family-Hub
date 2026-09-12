import request from 'supertest';
import express from 'express';

const mockMaintenanceService = {
  getItems: jest.fn(),
  createItem: jest.fn(),
  markDone: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
};

jest.mock('../../services/maintenance', () => ({
  ...jest.requireActual('../../services/maintenance'),
  getMaintenanceService: () => mockMaintenanceService,
}));

import maintenanceRoutes from '../../routes/maintenance';

const app = express();
app.use(express.json());
app.use('/api/maintenance', maintenanceRoutes);

const U = (r: request.Test) => r.set('x-user-id', 'user-1');

const ITEM = {
  id: 'item-1',
  name: 'HVAC air filter',
  intervalDays: 90,
  lastDoneAt: '2026-09-01',
  nextDueAt: '2026-11-30',
  daysUntilDue: 79,
};

describe('Maintenance routes', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('GET /api/maintenance', () => {
    it('401s without x-user-id', async () => {
      await request(app).get('/api/maintenance').expect(401);
    });

    it('lists the items', async () => {
      mockMaintenanceService.getItems.mockResolvedValueOnce([ITEM]);
      const res = await U(request(app).get('/api/maintenance')).expect(200);
      expect(res.body.items).toEqual([ITEM]);
      expect(res.body.count).toBe(1);
    });

    it('500s on a service error', async () => {
      mockMaintenanceService.getItems.mockRejectedValueOnce(new Error('db down'));
      await U(request(app).get('/api/maintenance')).expect(500);
    });
  });

  describe('POST /api/maintenance', () => {
    it('401s without x-user-id', async () => {
      await request(app).post('/api/maintenance').send({ name: 'x', intervalDays: 30 }).expect(401);
    });

    it('400s without a name', async () => {
      const res = await U(request(app).post('/api/maintenance')).send({ intervalDays: 30 }).expect(400);
      expect(res.body.message).toMatch(/name/i);
    });

    it('400s on a non-positive intervalDays', async () => {
      const res = await U(request(app).post('/api/maintenance'))
        .send({ name: 'x', intervalDays: 0 })
        .expect(400);
      expect(res.body.message).toMatch(/intervalDays/i);
    });

    it('creates an item, trimming the name and rounding the interval', async () => {
      mockMaintenanceService.createItem.mockResolvedValueOnce(ITEM);
      const res = await U(request(app).post('/api/maintenance'))
        .send({ name: '  HVAC air filter  ', intervalDays: 90.4 })
        .expect(201);
      expect(res.body.item).toEqual(ITEM);
      expect(mockMaintenanceService.createItem).toHaveBeenCalledWith('user-1', {
        name: 'HVAC air filter',
        intervalDays: 90,
        lastDoneAt: undefined,
      });
    });

    it('400s when the caller has no family', async () => {
      mockMaintenanceService.createItem.mockRejectedValueOnce(new Error('no-family'));
      const res = await U(request(app).post('/api/maintenance'))
        .send({ name: 'x', intervalDays: 30 })
        .expect(400);
      expect(res.body.message).toMatch(/family/i);
    });
  });

  describe('POST /api/maintenance/:id/done', () => {
    it('401s without x-user-id', async () => {
      await request(app).post('/api/maintenance/item-1/done').expect(401);
    });

    it('marks the item done', async () => {
      mockMaintenanceService.markDone.mockResolvedValueOnce({ ...ITEM, lastDoneAt: '2026-09-12' });
      const res = await U(request(app).post('/api/maintenance/item-1/done')).expect(200);
      expect(res.body.item.lastDoneAt).toBe('2026-09-12');
      expect(mockMaintenanceService.markDone).toHaveBeenCalledWith('user-1', 'item-1');
    });

    it('404s for an item outside the family (or nonexistent)', async () => {
      mockMaintenanceService.markDone.mockResolvedValueOnce(null);
      await U(request(app).post('/api/maintenance/ghost/done')).expect(404);
    });
  });

  describe('PATCH /api/maintenance/:id', () => {
    it('400s on a non-positive intervalDays', async () => {
      const res = await U(request(app).patch('/api/maintenance/item-1'))
        .send({ intervalDays: -5 })
        .expect(400);
      expect(res.body.message).toMatch(/intervalDays/i);
    });

    it('only forwards whitelisted, present fields', async () => {
      mockMaintenanceService.updateItem.mockResolvedValueOnce({ ...ITEM, name: 'New name' });
      await U(request(app).patch('/api/maintenance/item-1')).send({ name: '  New name  ' }).expect(200);
      expect(mockMaintenanceService.updateItem).toHaveBeenCalledWith('user-1', 'item-1', { name: 'New name' });
    });

    it('404s for an item outside the family', async () => {
      mockMaintenanceService.updateItem.mockResolvedValueOnce(null);
      await U(request(app).patch('/api/maintenance/item-1')).send({ name: 'x' }).expect(404);
    });
  });

  describe('DELETE /api/maintenance/:id', () => {
    it('deletes the item', async () => {
      mockMaintenanceService.deleteItem.mockResolvedValueOnce(true);
      await U(request(app).delete('/api/maintenance/item-1')).expect(200);
    });

    it('404s for an item outside the family', async () => {
      mockMaintenanceService.deleteItem.mockResolvedValueOnce(false);
      await U(request(app).delete('/api/maintenance/item-1')).expect(404);
    });
  });
});
