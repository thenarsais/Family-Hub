import request from 'supertest';
import express from 'express';

const mockRewardService = {
  checkAndRecord: jest.fn(),
  getEarned: jest.fn(),
  fulfillReward: jest.fn(),
  getLibrary: jest.fn(),
  addLibraryItem: jest.fn(),
  updateLibraryItem: jest.fn(),
  getSettings: jest.fn(),
  getFamilySettings: jest.fn(),
  setSettings: jest.fn(),
};

jest.mock('../../services/rewards', () => ({
  ...jest.requireActual('../../services/rewards'),
  getRewardService: () => mockRewardService,
}));

import rewardsRoutes from '../../routes/rewards';

const app = express();
app.use(express.json());
app.use('/api/rewards', rewardsRoutes);

const U = (r: request.Test) => r.set('x-user-id', 'user-1');

const TODAY = {
  weeklyGoal: 50,
  weekPoints: 0,
  monthPoints: 0,
  tiers: [
    { name: 'bronze', points: 200, reached: false },
    { name: 'silver', points: 300, reached: false },
    { name: 'gold', points: 400, reached: false },
  ],
  justEarned: [],
};

describe('Rewards routes', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('GET /api/rewards/today', () => {
    it('401s without x-user-id', async () => {
      await request(app).get('/api/rewards/today').expect(401);
    });

    it("returns today's progress", async () => {
      mockRewardService.checkAndRecord.mockResolvedValueOnce(TODAY);
      const res = await U(request(app).get('/api/rewards/today')).expect(200);
      expect(res.body.weeklyGoal).toBe(50);
    });

    it('500s on a service error', async () => {
      mockRewardService.checkAndRecord.mockRejectedValueOnce(new Error('boom'));
      await U(request(app).get('/api/rewards/today')).expect(500);
    });
  });

  describe('GET /api/rewards/earned', () => {
    it('defaults to scope=mine', async () => {
      mockRewardService.getEarned.mockResolvedValueOnce([]);
      await U(request(app).get('/api/rewards/earned')).expect(200);
      expect(mockRewardService.getEarned).toHaveBeenCalledWith('user-1', 'mine');
    });

    it('passes scope=family through', async () => {
      mockRewardService.getEarned.mockResolvedValueOnce([]);
      await U(request(app).get('/api/rewards/earned?scope=family')).expect(200);
      expect(mockRewardService.getEarned).toHaveBeenCalledWith('user-1', 'family');
    });
  });

  describe('POST /api/rewards/earned/:id/fulfill', () => {
    it('400s without libraryItemId', async () => {
      await U(request(app).post('/api/rewards/earned/r1/fulfill')).send({}).expect(400);
    });

    it('fulfills and returns the reward', async () => {
      mockRewardService.fulfillReward.mockResolvedValueOnce({ id: 'r1', fulfilledAt: 'x' });
      const res = await U(request(app).post('/api/rewards/earned/r1/fulfill'))
        .send({ libraryItemId: 'lib-1', note: 'note' })
        .expect(200);
      expect(res.body.reward.id).toBe('r1');
      expect(mockRewardService.fulfillReward).toHaveBeenCalledWith('user-1', 'r1', 'lib-1', 'note');
    });

    it('409s when already fulfilled', async () => {
      mockRewardService.fulfillReward.mockRejectedValueOnce(new Error('already-fulfilled'));
      await U(request(app).post('/api/rewards/earned/r1/fulfill'))
        .send({ libraryItemId: 'lib-1' })
        .expect(409);
    });

    it('404s when the reward is missing', async () => {
      mockRewardService.fulfillReward.mockRejectedValueOnce(new Error('not-found'));
      await U(request(app).post('/api/rewards/earned/r1/fulfill'))
        .send({ libraryItemId: 'lib-1' })
        .expect(404);
    });
  });

  describe('GET /api/rewards/library', () => {
    it('lists the library', async () => {
      mockRewardService.getLibrary.mockResolvedValueOnce([{ id: 'r1', title: 'x' }]);
      const res = await U(request(app).get('/api/rewards/library')).expect(200);
      expect(res.body.library).toHaveLength(1);
    });
  });

  describe('POST /api/rewards/library', () => {
    it('400s without a title', async () => {
      await U(request(app).post('/api/rewards/library')).send({}).expect(400);
    });

    it('400s on a non-positive cashAmount', async () => {
      await U(request(app).post('/api/rewards/library'))
        .send({ title: 'x', cashAmount: -1 })
        .expect(400);
    });

    it('creates and returns 201', async () => {
      mockRewardService.addLibraryItem.mockResolvedValueOnce({ id: 'r1', title: 'x', active: true });
      await U(request(app).post('/api/rewards/library')).send({ title: 'x' }).expect(201);
    });
  });

  describe('PATCH /api/rewards/library/:id', () => {
    it('saves whitelisted fields', async () => {
      mockRewardService.updateLibraryItem.mockResolvedValueOnce({ id: 'r1', active: false });
      const res = await U(request(app).patch('/api/rewards/library/r1'))
        .send({ active: false })
        .expect(200);
      expect(res.body.item.active).toBe(false);
    });

    it('404s when nothing matched', async () => {
      mockRewardService.updateLibraryItem.mockResolvedValueOnce(null);
      await U(request(app).patch('/api/rewards/library/r1')).send({ active: false }).expect(404);
    });
  });

  describe('GET /api/rewards/settings', () => {
    it('defaults to scope=mine', async () => {
      mockRewardService.getSettings.mockResolvedValueOnce({ weeklyGoal: 50 });
      await U(request(app).get('/api/rewards/settings')).expect(200);
      expect(mockRewardService.getSettings).toHaveBeenCalledWith('user-1');
      expect(mockRewardService.getFamilySettings).not.toHaveBeenCalled();
    });

    it('scope=family lists every member', async () => {
      mockRewardService.getFamilySettings.mockResolvedValueOnce([{ userId: 'kid-1', weeklyGoal: 50 }]);
      const res = await U(request(app).get('/api/rewards/settings?scope=family')).expect(200);
      expect(res.body.settings).toHaveLength(1);
    });
  });

  describe('PATCH /api/rewards/settings/:userId', () => {
    it('400s on a non-positive weeklyGoal', async () => {
      await U(request(app).patch('/api/rewards/settings/kid-1')).send({ weeklyGoal: 0 }).expect(400);
    });

    it('saves the goal', async () => {
      mockRewardService.setSettings.mockResolvedValueOnce({ weeklyGoal: 75 });
      const res = await U(request(app).patch('/api/rewards/settings/kid-1'))
        .send({ weeklyGoal: 75 })
        .expect(200);
      expect(res.body.settings.weeklyGoal).toBe(75);
    });

    it('400s when the target is not in the family', async () => {
      mockRewardService.setSettings.mockRejectedValueOnce(new Error('bad-assignee'));
      await U(request(app).patch('/api/rewards/settings/stranger'))
        .send({ weeklyGoal: 75 })
        .expect(400);
    });
  });
});
