import request from 'supertest';
import express from 'express';

const mockCommuteService = {
  getSummary: jest.fn(),
  getRoutes: jest.fn(),
  addRoute: jest.fn(),
  updateRoute: jest.fn(),
  deleteRoute: jest.fn(),
  setHomeAddress: jest.fn(),
  setNoSchoolToday: jest.fn(),
};

jest.mock('../../services/commute', () => ({
  ...jest.requireActual('../../services/commute'),
  getCommuteService: () => mockCommuteService,
}));

import commuteRoutes from '../../routes/commute';

const app = express();
app.use(express.json());
app.use('/api/commute', commuteRoutes);

const U = (r: request.Test) => r.set('x-user-id', 'user-1');

const ROUTE = {
  id: 'route-1',
  label: "Krish's school",
  destinationAddress: '456 School Ave',
  arriveByTime: '08:00',
  bufferMinutes: 10,
};

const SUMMARY = { configured: true, homeAddress: '123 Home St', noSchoolToday: false, routes: [ROUTE] };

describe('Commute routes', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('GET /api/commute/today', () => {
    it('401s without x-user-id', async () => {
      await request(app).get('/api/commute/today').expect(401);
    });

    it('returns the live summary', async () => {
      mockCommuteService.getSummary.mockResolvedValueOnce(SUMMARY);
      const res = await U(request(app).get('/api/commute/today')).expect(200);
      expect(res.body.routes).toEqual([ROUTE]);
      expect(res.body.homeAddress).toBe('123 Home St');
    });

    it('500s on a service error', async () => {
      mockCommuteService.getSummary.mockRejectedValueOnce(new Error('boom'));
      await U(request(app).get('/api/commute/today')).expect(500);
    });
  });

  describe('GET /api/commute/routes', () => {
    it('401s without x-user-id', async () => {
      await request(app).get('/api/commute/routes').expect(401);
    });

    it('lists routes', async () => {
      mockCommuteService.getRoutes.mockResolvedValueOnce([ROUTE]);
      const res = await U(request(app).get('/api/commute/routes')).expect(200);
      expect(res.body.routes).toEqual([ROUTE]);
    });
  });

  describe('POST /api/commute/routes', () => {
    it('401s without x-user-id', async () => {
      await request(app).post('/api/commute/routes').expect(401);
    });

    it('400s without a label', async () => {
      const res = await U(request(app).post('/api/commute/routes'))
        .send({ destinationAddress: 'x', arriveByTime: '08:00' })
        .expect(400);
      expect(res.body.message).toMatch(/label/i);
    });

    it('400s without a destinationAddress', async () => {
      const res = await U(request(app).post('/api/commute/routes'))
        .send({ label: 'x', arriveByTime: '08:00' })
        .expect(400);
      expect(res.body.message).toMatch(/destinationAddress/i);
    });

    it('400s on a malformed arriveByTime', async () => {
      const res = await U(request(app).post('/api/commute/routes'))
        .send({ label: 'x', destinationAddress: 'y', arriveByTime: '8am' })
        .expect(400);
      expect(res.body.message).toMatch(/arriveByTime/i);
    });

    it('400s on a negative bufferMinutes', async () => {
      const res = await U(request(app).post('/api/commute/routes'))
        .send({ label: 'x', destinationAddress: 'y', arriveByTime: '08:00', bufferMinutes: -1 })
        .expect(400);
      expect(res.body.message).toMatch(/bufferMinutes/i);
    });

    it('creates a route', async () => {
      mockCommuteService.addRoute.mockResolvedValueOnce(ROUTE);
      const res = await U(request(app).post('/api/commute/routes'))
        .send({ label: "Krish's school", destinationAddress: '456 School Ave', arriveByTime: '08:00' })
        .expect(201);
      expect(res.body.route).toEqual(ROUTE);
    });

    it("400s with a 'set up a family first' message when the caller has no family", async () => {
      mockCommuteService.addRoute.mockRejectedValueOnce(new Error('no-family'));
      const res = await U(request(app).post('/api/commute/routes'))
        .send({ label: 'x', destinationAddress: 'y', arriveByTime: '08:00' })
        .expect(400);
      expect(res.body.message).toMatch(/family/i);
    });
  });

  describe('PATCH /api/commute/routes/:id', () => {
    it('404s for an unknown/cross-family route', async () => {
      mockCommuteService.updateRoute.mockResolvedValueOnce(null);
      await U(request(app).patch('/api/commute/routes/ghost')).send({ label: 'x' }).expect(404);
    });

    it('updates a route', async () => {
      mockCommuteService.updateRoute.mockResolvedValueOnce({ ...ROUTE, label: 'New label' });
      const res = await U(request(app).patch('/api/commute/routes/route-1'))
        .send({ label: 'New label' })
        .expect(200);
      expect(res.body.route.label).toBe('New label');
    });

    it('400s on a malformed arriveByTime', async () => {
      const res = await U(request(app).patch('/api/commute/routes/route-1'))
        .send({ arriveByTime: 'nope' })
        .expect(400);
      expect(res.body.message).toMatch(/arriveByTime/i);
    });
  });

  describe('DELETE /api/commute/routes/:id', () => {
    it('404s for an unknown/cross-family route', async () => {
      mockCommuteService.deleteRoute.mockResolvedValueOnce(false);
      await U(request(app).delete('/api/commute/routes/ghost')).expect(404);
    });

    it('deletes a route', async () => {
      mockCommuteService.deleteRoute.mockResolvedValueOnce(true);
      await U(request(app).delete('/api/commute/routes/route-1')).expect(200);
    });
  });

  describe('PUT /api/commute/settings', () => {
    it('401s without x-user-id', async () => {
      await request(app).put('/api/commute/settings').expect(401);
    });

    it('400s on an empty homeAddress', async () => {
      const res = await U(request(app).put('/api/commute/settings')).send({ homeAddress: '  ' }).expect(400);
      expect(res.body.message).toMatch(/homeAddress/i);
    });

    it('400s on a non-boolean noSchoolToday', async () => {
      const res = await U(request(app).put('/api/commute/settings')).send({ noSchoolToday: 'yes' }).expect(400);
      expect(res.body.message).toMatch(/noSchoolToday/i);
    });

    it('updates the home address and returns the fresh summary', async () => {
      mockCommuteService.getSummary.mockResolvedValueOnce(SUMMARY);
      const res = await U(request(app).put('/api/commute/settings')).send({ homeAddress: '123 Home St' }).expect(200);
      expect(mockCommuteService.setHomeAddress).toHaveBeenCalledWith('user-1', '123 Home St');
      expect(res.body.homeAddress).toBe('123 Home St');
    });

    it('toggles noSchoolToday', async () => {
      mockCommuteService.getSummary.mockResolvedValueOnce({ ...SUMMARY, noSchoolToday: true });
      const res = await U(request(app).put('/api/commute/settings')).send({ noSchoolToday: true }).expect(200);
      expect(mockCommuteService.setNoSchoolToday).toHaveBeenCalledWith('user-1', true);
      expect(res.body.noSchoolToday).toBe(true);
    });
  });
});
