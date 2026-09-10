import request from 'supertest';
import express from 'express';

const mockHomeworkService = {
  getItems: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
  completeItem: jest.fn(),
  uncompleteItem: jest.fn(),
};

jest.mock('../../services/homework', () => ({
  ...jest.requireActual('../../services/homework'),
  getHomeworkService: () => mockHomeworkService,
}));

import homeworkRoutes from '../../routes/homework';

const app = express();
app.use(express.json());
app.use('/api/homework', homeworkRoutes);

const U = (r: request.Test) => r.set('x-user-id', 'user-1');

const ITEM = {
  id: 'hw-1',
  userId: 'user-1',
  title: 'Math p.12',
  subject: 'Math',
  dueDate: '2026-09-12',
  pointsValue: 10,
  completedAt: null,
  isOverdue: false,
  completed: false,
};

describe('Homework routes', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('GET /api/homework', () => {
    it('401s without x-user-id', async () => {
      await request(app).get('/api/homework').expect(401);
    });

    it('lists the board (scope=mine by default)', async () => {
      mockHomeworkService.getItems.mockResolvedValueOnce([ITEM]);
      const res = await U(request(app).get('/api/homework')).expect(200);
      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(1);
      expect(mockHomeworkService.getItems).toHaveBeenCalledWith('user-1', 'mine');
    });

    it('passes scope=family through', async () => {
      mockHomeworkService.getItems.mockResolvedValueOnce([]);
      await U(request(app).get('/api/homework?scope=family')).expect(200);
      expect(mockHomeworkService.getItems).toHaveBeenCalledWith('user-1', 'family');
    });

    it('500s on a service error', async () => {
      mockHomeworkService.getItems.mockRejectedValueOnce(new Error('boom'));
      await U(request(app).get('/api/homework')).expect(500);
    });
  });

  describe('POST /api/homework', () => {
    it('401s without x-user-id', async () => {
      await request(app).post('/api/homework').send({ title: 'x', dueDate: '2026-09-12' }).expect(401);
    });

    it('400s without a title or dueDate', async () => {
      await U(request(app).post('/api/homework')).send({ dueDate: '2026-09-12' }).expect(400);
      await U(request(app).post('/api/homework')).send({ title: 'x' }).expect(400);
      await U(request(app).post('/api/homework')).send({ title: '  ', dueDate: '2026-09-12' }).expect(400);
    });

    it('400s on a non-positive pointsValue', async () => {
      await U(request(app).post('/api/homework'))
        .send({ title: 'x', dueDate: '2026-09-12', pointsValue: 0 })
        .expect(400);
    });

    it('creates and returns 201', async () => {
      mockHomeworkService.createItem.mockResolvedValueOnce(ITEM);
      const res = await U(request(app).post('/api/homework'))
        .send({ title: 'Math p.12', dueDate: '2026-09-12', subject: 'Math' })
        .expect(201);
      expect(res.body.item.id).toBe('hw-1');
      expect(mockHomeworkService.createItem).toHaveBeenCalledWith('user-1', {
        title: 'Math p.12',
        dueDate: '2026-09-12',
        subject: 'Math',
        pointsValue: undefined,
        assigneeId: undefined,
      });
    });

    it('400s when the assignee is not in the family', async () => {
      mockHomeworkService.createItem.mockRejectedValueOnce(new Error('bad-assignee'));
      await U(request(app).post('/api/homework'))
        .send({ title: 'x', dueDate: '2026-09-12', assigneeId: 'stranger' })
        .expect(400);
    });

    it('400s on a bad due date', async () => {
      mockHomeworkService.createItem.mockRejectedValueOnce(new Error('bad-due-date'));
      const res = await U(request(app).post('/api/homework'))
        .send({ title: 'x', dueDate: 'nope' })
        .expect(400);
      expect(res.body.message).toMatch(/YYYY-MM-DD/);
    });
  });

  describe('PATCH /api/homework/:id', () => {
    it('updates whitelisted fields', async () => {
      mockHomeworkService.updateItem.mockResolvedValueOnce({ ...ITEM, title: 'Renamed' });
      const res = await U(request(app).patch('/api/homework/hw-1'))
        .send({ title: 'Renamed', pointsValue: 20 })
        .expect(200);
      expect(res.body.item.title).toBe('Renamed');
      expect(mockHomeworkService.updateItem).toHaveBeenCalledWith('user-1', 'hw-1', {
        title: 'Renamed',
        points_value: 20,
      });
    });

    it('404s when nothing matched', async () => {
      mockHomeworkService.updateItem.mockResolvedValueOnce(null);
      await U(request(app).patch('/api/homework/hw-x')).send({ title: 'y' }).expect(404);
    });

    it('400s on a non-positive pointsValue', async () => {
      await U(request(app).patch('/api/homework/hw-1')).send({ pointsValue: -3 }).expect(400);
    });
  });

  describe('DELETE /api/homework/:id', () => {
    it('deletes', async () => {
      mockHomeworkService.deleteItem.mockResolvedValueOnce(true);
      await U(request(app).delete('/api/homework/hw-1')).expect(200);
      expect(mockHomeworkService.deleteItem).toHaveBeenCalledWith('user-1', 'hw-1');
    });

    it('404s when nothing matched', async () => {
      mockHomeworkService.deleteItem.mockResolvedValueOnce(false);
      await U(request(app).delete('/api/homework/hw-x')).expect(404);
    });
  });

  describe('POST /api/homework/:id/complete', () => {
    it('completes and returns the points', async () => {
      mockHomeworkService.completeItem.mockResolvedValueOnce({ pointsEarned: 10 });
      const res = await U(request(app).post('/api/homework/hw-1/complete')).expect(200);
      expect(res.body.pointsEarned).toBe(10);
    });

    it('404s when the item is not the caller\'s', async () => {
      mockHomeworkService.completeItem.mockRejectedValueOnce(new Error('not-found'));
      await U(request(app).post('/api/homework/hw-x/complete')).expect(404);
    });

    it('409s when already completed', async () => {
      mockHomeworkService.completeItem.mockRejectedValueOnce(new Error('already-completed'));
      await U(request(app).post('/api/homework/hw-1/complete')).expect(409);
    });
  });

  describe('DELETE /api/homework/:id/complete', () => {
    it('undoes a completion', async () => {
      mockHomeworkService.uncompleteItem.mockResolvedValueOnce(true);
      await U(request(app).delete('/api/homework/hw-1/complete')).expect(200);
    });

    it('404s when there was nothing to undo', async () => {
      mockHomeworkService.uncompleteItem.mockResolvedValueOnce(false);
      await U(request(app).delete('/api/homework/hw-1/complete')).expect(404);
    });
  });
});
