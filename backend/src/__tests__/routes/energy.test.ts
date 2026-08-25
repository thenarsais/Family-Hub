import request from 'supertest';
import express from 'express';

const mockEnergyService = {
  getEnergyUsage: jest.fn(),
  getEnergySummary: jest.fn(),
  getCurrentMonthUsage: jest.fn(),
  createEnergyGoal: jest.fn(),
  getEnergyGoals: jest.fn(),
};

jest.mock('../../services/energy', () => ({ getEnergyService: () => mockEnergyService }));

import energyRoutes from '../../routes/energy';

const app = express();
app.use(express.json());
app.use('/api/energy', energyRoutes);

describe('Energy Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/energy/usage', () => {
    it('should default to 30 days back with no deviceId', async () => {
      mockEnergyService.getEnergyUsage.mockResolvedValueOnce([{ id: 'u1' }]);

      const res = await request(app).get('/api/energy/usage').expect(200);

      expect(mockEnergyService.getEnergyUsage).toHaveBeenCalledWith(30, undefined);
      expect(res.body.count).toBe(1);
    });

    it('should pass through custom daysBack and deviceId', async () => {
      mockEnergyService.getEnergyUsage.mockResolvedValueOnce([]);

      await request(app).get('/api/energy/usage?daysBack=7&deviceId=device-1').expect(200);

      expect(mockEnergyService.getEnergyUsage).toHaveBeenCalledWith(7, 'device-1');
    });

    it('should return 500 on service failure', async () => {
      mockEnergyService.getEnergyUsage.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/energy/usage').expect(500);
      expect(res.body.message).toBe('Failed to fetch energy usage');
    });
  });

  describe('GET /api/energy/summary', () => {
    it('should default to daily period and 12 months back', async () => {
      mockEnergyService.getEnergySummary.mockResolvedValueOnce([{ id: 's1' }]);

      const res = await request(app).get('/api/energy/summary').expect(200);

      expect(mockEnergyService.getEnergySummary).toHaveBeenCalledWith('daily', 12);
      expect(res.body.count).toBe(1);
    });

    it('should pass through custom period and monthsBack', async () => {
      mockEnergyService.getEnergySummary.mockResolvedValueOnce([]);

      await request(app).get('/api/energy/summary?period=monthly&monthsBack=3').expect(200);

      expect(mockEnergyService.getEnergySummary).toHaveBeenCalledWith('monthly', 3);
    });

    it('should return 500 on service failure', async () => {
      mockEnergyService.getEnergySummary.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/energy/summary').expect(500);
      expect(res.body.message).toBe('Failed to fetch energy summary');
    });
  });

  describe('GET /api/energy/current-month', () => {
    it('should return the current month total', async () => {
      mockEnergyService.getCurrentMonthUsage.mockResolvedValueOnce(42.5);

      const res = await request(app).get('/api/energy/current-month').expect(200);

      expect(res.body.data).toEqual({ period: 'current_month', total_kwh: 42.5 });
    });

    it('should return 500 on service failure', async () => {
      mockEnergyService.getCurrentMonthUsage.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/energy/current-month').expect(500);
      expect(res.body.message).toBe('Failed to get current month usage');
    });
  });

  describe('POST /api/energy/goals', () => {
    it('should require a user id', async () => {
      const res = await request(app)
        .post('/api/energy/goals')
        .send({ goal_type: 'monthly', target_kwh: 500, start_date: '2026-01-01', end_date: '2026-01-31' })
        .expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should require goal_type, target_kwh, start_date, and end_date', async () => {
      const res = await request(app)
        .post('/api/energy/goals')
        .set('x-user-id', 'user-1')
        .send({})
        .expect(400);
      expect(res.body.message).toBe('Missing required fields');
    });

    it('should create an energy goal', async () => {
      const goal = { id: 'g1' };
      mockEnergyService.createEnergyGoal.mockResolvedValueOnce(goal);

      const res = await request(app)
        .post('/api/energy/goals')
        .set('x-user-id', 'user-1')
        .send({ goal_type: 'monthly', target_kwh: 500, start_date: '2026-01-01', end_date: '2026-01-31' })
        .expect(201);

      expect(mockEnergyService.createEnergyGoal).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ goal_type: 'monthly', target_kwh: 500 })
      );
      expect(res.body.data).toEqual(goal);
    });

    it('should return 500 on service failure', async () => {
      mockEnergyService.createEnergyGoal.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app)
        .post('/api/energy/goals')
        .set('x-user-id', 'user-1')
        .send({ goal_type: 'monthly', target_kwh: 500, start_date: '2026-01-01', end_date: '2026-01-31' })
        .expect(500);
      expect(res.body.message).toBe('Failed to create goal');
    });
  });

  describe('GET /api/energy/goals', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/energy/goals').expect(401);
      expect(res.body.message).toBe('User ID required');
    });

    it('should list goals for the user', async () => {
      mockEnergyService.getEnergyGoals.mockResolvedValueOnce([{ id: 'g1' }]);

      const res = await request(app).get('/api/energy/goals').set('x-user-id', 'user-1').expect(200);

      expect(res.body.count).toBe(1);
    });

    it('should return 500 on service failure', async () => {
      mockEnergyService.getEnergyGoals.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/energy/goals').set('x-user-id', 'user-1').expect(500);
      expect(res.body.message).toBe('Failed to fetch goals');
    });
  });
});
