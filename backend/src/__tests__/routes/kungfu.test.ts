import request from 'supertest';
import express from 'express';

const mockKungFuService = {
  getToday: jest.fn(),
  logSession: jest.fn(),
  undoSession: jest.fn(),
  getProfile: jest.fn(),
  getFamilyProfiles: jest.fn(),
  setProfile: jest.fn(),
};

jest.mock('../../services/kungfu', () => ({
  ...jest.requireActual('../../services/kungfu'),
  getKungFuService: () => mockKungFuService,
}));

import kungfuRoutes from '../../routes/kungfu';

const app = express();
app.use(express.json());
app.use('/api/kungfu', kungfuRoutes);

const U = (r: request.Test) => r.set('x-user-id', 'user-1');

const TODAY = {
  profile: { belt: null, beltSince: null, pointsPerClass: 15, pointsPerPractice: 5 },
  todayLogs: [],
  weekCounts: { class: 0, practice: 0 },
};

describe('Kung Fu routes', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('GET /api/kungfu/today', () => {
    it('401s without x-user-id', async () => {
      await request(app).get('/api/kungfu/today').expect(401);
    });

    it("returns today's payload", async () => {
      mockKungFuService.getToday.mockResolvedValueOnce(TODAY);
      const res = await U(request(app).get('/api/kungfu/today')).expect(200);
      expect(res.body.profile.pointsPerClass).toBe(15);
      expect(mockKungFuService.getToday).toHaveBeenCalledWith('user-1');
    });

    it('500s on a service error', async () => {
      mockKungFuService.getToday.mockRejectedValueOnce(new Error('boom'));
      await U(request(app).get('/api/kungfu/today')).expect(500);
    });
  });

  describe('POST /api/kungfu/log', () => {
    it('401s without x-user-id', async () => {
      await request(app).post('/api/kungfu/log').send({ type: 'class' }).expect(401);
    });

    it('400s on an invalid type', async () => {
      await U(request(app).post('/api/kungfu/log')).send({ type: 'sparring' }).expect(400);
      await U(request(app).post('/api/kungfu/log')).send({}).expect(400);
    });

    it('logs a class and returns 201', async () => {
      mockKungFuService.logSession.mockResolvedValueOnce({
        ...TODAY,
        todayLogs: [{ id: 'log-1', sessionType: 'class', pointsEarned: 15, loggedAt: 'x' }],
      });
      const res = await U(request(app).post('/api/kungfu/log')).send({ type: 'class' }).expect(201);
      expect(res.body.todayLogs).toHaveLength(1);
      expect(mockKungFuService.logSession).toHaveBeenCalledWith('user-1', 'class');
    });

    it('500s on an unexpected error', async () => {
      mockKungFuService.logSession.mockRejectedValueOnce(new Error('db down'));
      await U(request(app).post('/api/kungfu/log')).send({ type: 'practice' }).expect(500);
    });
  });

  describe('DELETE /api/kungfu/log/:id', () => {
    it('undoes a log', async () => {
      mockKungFuService.undoSession.mockResolvedValueOnce(true);
      await U(request(app).delete('/api/kungfu/log/log-1')).expect(200);
    });

    it('404s when there is nothing to undo', async () => {
      mockKungFuService.undoSession.mockResolvedValueOnce(false);
      await U(request(app).delete('/api/kungfu/log/log-1')).expect(404);
    });
  });

  describe('GET /api/kungfu/profile', () => {
    it('defaults to scope=mine', async () => {
      mockKungFuService.getProfile.mockResolvedValueOnce(TODAY.profile);
      await U(request(app).get('/api/kungfu/profile')).expect(200);
      expect(mockKungFuService.getProfile).toHaveBeenCalledWith('user-1');
      expect(mockKungFuService.getFamilyProfiles).not.toHaveBeenCalled();
    });

    it('scope=family lists every member', async () => {
      mockKungFuService.getFamilyProfiles.mockResolvedValueOnce([
        { userId: 'kid-1', name: 'Krish', ...TODAY.profile },
      ]);
      const res = await U(request(app).get('/api/kungfu/profile?scope=family')).expect(200);
      expect(res.body.profiles).toHaveLength(1);
    });
  });

  describe('PATCH /api/kungfu/profile/:userId', () => {
    it('saves whitelisted fields', async () => {
      mockKungFuService.setProfile.mockResolvedValueOnce({ ...TODAY.profile, belt: 'Yellow Sash' });
      const res = await U(request(app).patch('/api/kungfu/profile/kid-1'))
        .send({ belt: 'Yellow Sash', beltSince: '2026-06-01' })
        .expect(200);
      expect(res.body.profile.belt).toBe('Yellow Sash');
      expect(mockKungFuService.setProfile).toHaveBeenCalledWith('user-1', 'kid-1', {
        belt: 'Yellow Sash',
        belt_since: '2026-06-01',
      });
    });

    it('400s on a non-positive points value', async () => {
      await U(request(app).patch('/api/kungfu/profile/kid-1'))
        .send({ pointsPerClass: 0 })
        .expect(400);
    });

    it('400s when the target is not in the family', async () => {
      mockKungFuService.setProfile.mockRejectedValueOnce(new Error('bad-assignee'));
      await U(request(app).patch('/api/kungfu/profile/stranger'))
        .send({ belt: 'Black' })
        .expect(400);
    });
  });
});
