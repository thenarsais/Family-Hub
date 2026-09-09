import request from 'supertest';
import express from 'express';

const mockRoutineService = {
  getRoutines: jest.fn(),
  createRoutine: jest.fn(),
  updateRoutine: jest.fn(),
  completeRoutine: jest.fn(),
  undoRoutine: jest.fn(),
  isParentActingFor: jest.fn(),
};
const mockHabitService = {
  getTodayMood: jest.fn(),
  setMood: jest.fn(),
};

jest.mock('../../services/routines', () => ({
  ...jest.requireActual('../../services/routines'),
  getRoutineService: () => mockRoutineService,
}));
jest.mock('../../services/habits', () => ({
  ...jest.requireActual('../../services/habits'),
  getHabitService: () => mockHabitService,
}));

import kidsRoutes from '../../routes/kids';

const app = express();
app.use(express.json());
app.use('/api/kids', kidsRoutes);

const U = (r: request.Test) => r.set('x-user-id', 'parent-1');
const KID = 'kid-1';

describe('Kids board routes', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('GET /api/kids/:memberId/routines', () => {
    it('401s without x-user-id', async () => {
      await request(app).get(`/api/kids/${KID}/routines`).expect(401);
    });

    it('lists the routines (board scope by default)', async () => {
      mockRoutineService.getRoutines.mockResolvedValueOnce([{ id: 'r1', doneToday: false }]);
      const res = await U(request(app).get(`/api/kids/${KID}/routines`)).expect(200);
      expect(res.body.routines).toHaveLength(1);
      expect(mockRoutineService.getRoutines).toHaveBeenCalledWith('parent-1', KID, 'board');
    });

    it('passes scope=manage through', async () => {
      mockRoutineService.getRoutines.mockResolvedValueOnce([]);
      await U(request(app).get(`/api/kids/${KID}/routines?scope=manage`)).expect(200);
      expect(mockRoutineService.getRoutines).toHaveBeenCalledWith('parent-1', KID, 'manage');
    });

    it('403s when the caller may not act for the child', async () => {
      mockRoutineService.getRoutines.mockRejectedValueOnce(new Error('not-allowed'));
      await U(request(app).get(`/api/kids/${KID}/routines`)).expect(403);
    });
  });

  describe('POST /api/kids/:memberId/routines', () => {
    it('rejects a bad slot / blank label / missing emoji', async () => {
      await U(request(app).post(`/api/kids/${KID}/routines`)).send({ slot: 'noon', label: 'x', emoji: '🪥' }).expect(400);
      await U(request(app).post(`/api/kids/${KID}/routines`)).send({ slot: 'morning', label: '  ', emoji: '🪥' }).expect(400);
      await U(request(app).post(`/api/kids/${KID}/routines`)).send({ slot: 'morning', label: 'x' }).expect(400);
      expect(mockRoutineService.createRoutine).not.toHaveBeenCalled();
    });

    it('creates a routine', async () => {
      mockRoutineService.createRoutine.mockResolvedValueOnce({ id: 'r1' });
      const res = await U(request(app).post(`/api/kids/${KID}/routines`))
        .send({ slot: 'morning', label: 'Brush teeth', emoji: '🪥' })
        .expect(201);
      expect(res.body.routine.id).toBe('r1');
      expect(mockRoutineService.createRoutine).toHaveBeenCalledWith('parent-1', KID, {
        slot: 'morning',
        label: 'Brush teeth',
        emoji: '🪥',
        sortOrder: undefined,
      });
    });

    it('403s a non-parent', async () => {
      mockRoutineService.createRoutine.mockRejectedValueOnce(new Error('not-allowed'));
      await U(request(app).post(`/api/kids/${KID}/routines`))
        .send({ slot: 'morning', label: 'x', emoji: '🪥' })
        .expect(403);
    });
  });

  describe('PATCH /api/kids/:memberId/routines/:id', () => {
    it('updates and maps sortOrder → sort_order', async () => {
      mockRoutineService.updateRoutine.mockResolvedValueOnce({ id: 'r1', enabled: false });
      await U(request(app).patch(`/api/kids/${KID}/routines/r1`))
        .send({ enabled: false, sortOrder: 3 })
        .expect(200);
      expect(mockRoutineService.updateRoutine).toHaveBeenCalledWith('parent-1', 'r1', {
        enabled: false,
        sort_order: 3,
      });
    });

    it('404s when nothing matched', async () => {
      mockRoutineService.updateRoutine.mockResolvedValueOnce(null);
      await U(request(app).patch(`/api/kids/${KID}/routines/nope`)).send({ label: 'x' }).expect(404);
    });
  });

  describe('complete / undo', () => {
    it('POST complete → 200', async () => {
      mockRoutineService.completeRoutine.mockResolvedValueOnce(undefined);
      await U(request(app).post(`/api/kids/${KID}/routines/r1/complete`)).expect(200);
      expect(mockRoutineService.completeRoutine).toHaveBeenCalledWith('parent-1', 'r1', KID);
    });

    it('POST complete → 404 on not-found, 403 on not-allowed', async () => {
      mockRoutineService.completeRoutine.mockRejectedValueOnce(new Error('not-found'));
      await U(request(app).post(`/api/kids/${KID}/routines/r1/complete`)).expect(404);
      mockRoutineService.completeRoutine.mockRejectedValueOnce(new Error('not-allowed'));
      await U(request(app).post(`/api/kids/${KID}/routines/r1/complete`)).expect(403);
    });

    it('DELETE complete → 404 when nothing to undo', async () => {
      mockRoutineService.undoRoutine.mockResolvedValueOnce(false);
      await U(request(app).delete(`/api/kids/${KID}/routines/r1/complete`)).expect(404);
    });

    it('DELETE complete → 200 when undone', async () => {
      mockRoutineService.undoRoutine.mockResolvedValueOnce(true);
      await U(request(app).delete(`/api/kids/${KID}/routines/r1/complete`)).expect(200);
    });
  });

  describe('500 paths', () => {
    it('GET routines → 500 on an unexpected service failure', async () => {
      mockRoutineService.getRoutines.mockRejectedValueOnce(new Error('db down'));
      await U(request(app).get(`/api/kids/${KID}/routines`)).expect(500);
    });
    it('POST routines → 500 on an unexpected failure', async () => {
      mockRoutineService.createRoutine.mockRejectedValueOnce(new Error('boom'));
      await U(request(app).post(`/api/kids/${KID}/routines`))
        .send({ slot: 'morning', label: 'x', emoji: '🪥' })
        .expect(500);
    });
    it('PATCH routines → 500 on an unexpected failure', async () => {
      mockRoutineService.updateRoutine.mockRejectedValueOnce(new Error('boom'));
      await U(request(app).patch(`/api/kids/${KID}/routines/r1`)).send({ label: 'x' }).expect(500);
    });
    it('PATCH validates a bad slot before the service', async () => {
      await U(request(app).patch(`/api/kids/${KID}/routines/r1`)).send({ slot: 'noon' }).expect(400);
      expect(mockRoutineService.updateRoutine).not.toHaveBeenCalled();
    });
    it('POST complete → 500 on an unexpected failure', async () => {
      mockRoutineService.completeRoutine.mockRejectedValueOnce(new Error('boom'));
      await U(request(app).post(`/api/kids/${KID}/routines/r1/complete`)).expect(500);
    });
    it('DELETE complete → 500 on an unexpected failure', async () => {
      mockRoutineService.undoRoutine.mockRejectedValueOnce(new Error('boom'));
      await U(request(app).delete(`/api/kids/${KID}/routines/r1/complete`)).expect(500);
    });
    it('GET mood → 500 on an unexpected failure', async () => {
      mockRoutineService.isParentActingFor.mockResolvedValueOnce(true);
      mockHabitService.getTodayMood.mockRejectedValueOnce(new Error('boom'));
      await U(request(app).get(`/api/kids/${KID}/mood`)).expect(500);
    });
    it('POST mood → 500 on an unexpected failure', async () => {
      mockRoutineService.isParentActingFor.mockResolvedValueOnce(true);
      mockHabitService.setMood.mockRejectedValueOnce(new Error('boom'));
      await U(request(app).post(`/api/kids/${KID}/mood`)).send({ mood: 'ok' }).expect(500);
    });
    it('all routes 401 without x-user-id', async () => {
      await request(app).post(`/api/kids/${KID}/routines`).send({}).expect(401);
      await request(app).patch(`/api/kids/${KID}/routines/r1`).send({}).expect(401);
      await request(app).post(`/api/kids/${KID}/routines/r1/complete`).expect(401);
      await request(app).delete(`/api/kids/${KID}/routines/r1/complete`).expect(401);
      await request(app).get(`/api/kids/${KID}/mood`).expect(401);
      await request(app).post(`/api/kids/${KID}/mood`).send({}).expect(401);
    });
  });

  describe('mood', () => {
    it('GET returns the child mood after a parent check', async () => {
      mockRoutineService.isParentActingFor.mockResolvedValueOnce(true);
      mockHabitService.getTodayMood.mockResolvedValueOnce({ id: 'm1', mood: 'good' });
      const res = await U(request(app).get(`/api/kids/${KID}/mood`)).expect(200);
      expect(res.body.mood.mood).toBe('good');
      expect(mockHabitService.getTodayMood).toHaveBeenCalledWith(KID);
    });

    it('GET 403s when the caller may not act for the child', async () => {
      mockRoutineService.isParentActingFor.mockResolvedValueOnce(false);
      await U(request(app).get(`/api/kids/${KID}/mood`)).expect(403);
      expect(mockHabitService.getTodayMood).not.toHaveBeenCalled();
    });

    it('POST rejects an invalid mood', async () => {
      await U(request(app).post(`/api/kids/${KID}/mood`)).send({ mood: 'ecstatic' }).expect(400);
    });

    it('POST records a valid mood with its emoji, after a parent check', async () => {
      mockRoutineService.isParentActingFor.mockResolvedValueOnce(true);
      mockHabitService.setMood.mockResolvedValueOnce({ id: 'm2', mood: 'great' });
      await U(request(app).post(`/api/kids/${KID}/mood`)).send({ mood: 'great' }).expect(200);
      expect(mockHabitService.setMood).toHaveBeenCalledWith(KID, 'great', '😄');
    });

    it('POST 403s when the caller may not act for the child', async () => {
      mockRoutineService.isParentActingFor.mockResolvedValueOnce(false);
      await U(request(app).post(`/api/kids/${KID}/mood`)).send({ mood: 'good' }).expect(403);
      expect(mockHabitService.setMood).not.toHaveBeenCalled();
    });
  });
});
