import request from 'supertest';
import express from 'express';

const mockQuestService = {
  getToday: jest.fn(),
};

jest.mock('../../services/quests', () => ({
  ...jest.requireActual('../../services/quests'),
  getQuestService: () => mockQuestService,
}));

import questsRoutes from '../../routes/quests';

const app = express();
app.use(express.json());
app.use('/api/quests', questsRoutes);

const U = (r: request.Test) => r.set('x-user-id', 'user-1');

const TODAY = {
  quests: [
    { key: 'chore', label: 'Complete a chore', done: false },
    { key: 'reading', label: 'Log your reading', done: false },
    { key: 'mood', label: 'Check in your mood', done: false },
  ],
  allDone: false,
  bonusAwarded: false,
};

describe('Quests routes', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('GET /api/quests/today', () => {
    it('401s without x-user-id', async () => {
      await request(app).get('/api/quests/today').expect(401);
    });

    it("returns today's payload", async () => {
      mockQuestService.getToday.mockResolvedValueOnce(TODAY);
      const res = await U(request(app).get('/api/quests/today')).expect(200);
      expect(res.body.quests).toHaveLength(3);
      expect(res.body.allDone).toBe(false);
      expect(mockQuestService.getToday).toHaveBeenCalledWith('user-1');
    });

    it('500s on a service error', async () => {
      mockQuestService.getToday.mockRejectedValueOnce(new Error('boom'));
      await U(request(app).get('/api/quests/today')).expect(500);
    });
  });
});
