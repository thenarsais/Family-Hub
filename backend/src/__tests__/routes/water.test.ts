import request from 'supertest';
import express from 'express';

const mockWaterService = {
  getUsageSummary: jest.fn(),
  syncWaterUsage: jest.fn(),
  isConfigured: jest.fn(),
};

class MockWaterSmartAuthError extends Error {}

jest.mock('../../services/watersmart', () => ({
  getUsageSummary: (...args: unknown[]) => mockWaterService.getUsageSummary(...args),
  syncWaterUsage: (...args: unknown[]) => mockWaterService.syncWaterUsage(...args),
  isConfigured: (...args: unknown[]) => mockWaterService.isConfigured(...args),
  WaterSmartAuthError: MockWaterSmartAuthError,
}));

import waterRoutes, { _resetManualSyncThrottleForTests } from '../../routes/water';

const app = express();
app.use(express.json());
app.use('/api/water', waterRoutes);

describe('Water routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    _resetManualSyncThrottleForTests();
  });

  describe('GET /api/water/usage', () => {
    it('returns the unconfigured summary as-is', async () => {
      mockWaterService.getUsageSummary.mockResolvedValueOnce({
        configured: false,
        lastSyncedAt: null,
        latestReadingAt: null,
        dailyTotals: [],
        leakDetected: false,
      });

      const res = await request(app).get('/api/water/usage').expect(200);
      expect(res.body.status).toBe('success');
      expect(res.body.configured).toBe(false);
    });

    it('returns a configured summary with daily totals and a leak flag', async () => {
      mockWaterService.getUsageSummary.mockResolvedValueOnce({
        configured: true,
        lastSyncedAt: '2026-09-11T12:00:00Z',
        latestReadingAt: '2026-09-11T11:00:00Z',
        dailyTotals: [{ date: '2026-09-11', gallons: 95 }],
        leakDetected: true,
      });

      const res = await request(app).get('/api/water/usage').expect(200);
      expect(res.body.dailyTotals).toEqual([{ date: '2026-09-11', gallons: 95 }]);
      expect(res.body.leakDetected).toBe(true);
    });

    it('500s on a service error', async () => {
      mockWaterService.getUsageSummary.mockRejectedValueOnce(new Error('db down'));
      const res = await request(app).get('/api/water/usage').expect(500);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/water/sync', () => {
    it('400s when not configured', async () => {
      mockWaterService.isConfigured.mockReturnValueOnce(false);
      const res = await request(app).post('/api/water/sync').expect(400);
      expect(res.body.message).toContain('not configured');
      expect(mockWaterService.syncWaterUsage).not.toHaveBeenCalled();
    });

    it('syncs and returns the result when configured', async () => {
      mockWaterService.isConfigured.mockReturnValue(true);
      mockWaterService.syncWaterUsage.mockResolvedValueOnce({ synced: 24, latestReadAt: '2026-09-11T11:00:00Z' });

      const res = await request(app).post('/api/water/sync').expect(200);
      expect(res.body.synced).toBe(24);
    });

    it('429s on a second sync within the throttle window', async () => {
      mockWaterService.isConfigured.mockReturnValue(true);
      mockWaterService.syncWaterUsage.mockResolvedValue({ synced: 1, latestReadAt: null });

      await request(app).post('/api/water/sync').expect(200);
      const res = await request(app).post('/api/water/sync').expect(429);
      expect(res.body.message).toMatch(/try again/i);
    });

    it('401s with a credentials-specific message on an auth error', async () => {
      const { WaterSmartAuthError } = jest.requireMock('../../services/watersmart') as {
        WaterSmartAuthError: new (msg: string) => Error;
      };
      mockWaterService.isConfigured.mockReturnValue(true);
      mockWaterService.syncWaterUsage.mockRejectedValueOnce(new WaterSmartAuthError('Invalid email or password'));

      const res = await request(app).post('/api/water/sync').expect(401);
      expect(res.body.message).toMatch(/rejected the login/i);
    });

    it('502s on a non-auth sync failure', async () => {
      mockWaterService.isConfigured.mockReturnValue(true);
      mockWaterService.syncWaterUsage.mockRejectedValueOnce(new Error('network blip'));

      const res = await request(app).post('/api/water/sync').expect(502);
      expect(res.body.message).toMatch(/could not sync/i);
    });
  });
});
