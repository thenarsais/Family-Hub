/**
 * API Service Tests — method delegation
 *
 * services/api.ts is mostly a thin wrapper: each method builds a path/params
 * and forwards to axios, returning response.data. api.test.ts already covers
 * the two pieces of real logic (interceptors); this file exercises every
 * remaining wrapper method to verify it calls the right endpoint with the
 * right arguments and unwraps the response correctly.
 */

import { vi } from 'vitest';

const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

describe('API Service — method delegation', () => {
  let apiClient: typeof import('@/services/api').apiClient;

  beforeAll(async () => {
    ({ apiClient } = await import('@/services/api'));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Auth', () => {
    it('signup posts to /auth/signup', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { user: {} } });
      await apiClient.signup('a@b.com', 'pw', 'Alice');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/signup', {
        email: 'a@b.com',
        password: 'pw',
        name: 'Alice',
      });
    });

    it('logout posts to /auth/logout', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({});
      await apiClient.logout();
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('getCurrentUser gets /auth/me and unwraps data', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
      const result = await apiClient.getCurrentUser();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual({ user: { id: 'u1' } });
    });
  });

  describe('Users', () => {
    it('getUsers with default pagination', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
      await apiClient.getUsers();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users', { params: { limit: 20, offset: 0 } });
    });

    it('getUserById', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { id: 'u1' } });
      await apiClient.getUserById('u1');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/u1');
    });

    it('updateUser', async () => {
      mockAxiosInstance.put.mockResolvedValueOnce({ data: { id: 'u1' } });
      await apiClient.updateUser('u1', { name: 'New' });
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/users/u1', { name: 'New' });
    });
  });

  describe('Badges', () => {
    it('getBadgeById', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { id: 'b1' } });
      await apiClient.getBadgeById('b1');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/badges/b1');
    });

    it('getBadgesByCategory', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
      await apiClient.getBadgesByCategory('chores');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/badges/category/chores');
    });

    it('getUserBadges', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
      await apiClient.getUserBadges('u1');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/badges/users/u1');
    });

    it('getUserBadgesDetailed', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
      await apiClient.getUserBadgesDetailed('u1');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/badges/users/u1/detailed');
    });

    it('awardBadge', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });
      await apiClient.awardBadge('u1', 'b1', 'great job');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/badges/users/u1/badges/b1', {
        reason: 'great job',
      });
    });
  });

  describe('Points', () => {
    it('getUserPoints', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: {} });
      await apiClient.getUserPoints('u1');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/points/users/u1');
    });

    it('getPointsHistory with default pagination', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
      await apiClient.getPointsHistory('u1');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/points/users/u1/history', {
        params: { limit: 20, offset: 0 },
      });
    });

    it('getPointsBreakdown', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
      await apiClient.getPointsBreakdown('u1');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/points/users/u1/breakdown');
    });

    it('getPointsToday', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: {} });
      await apiClient.getPointsToday('u1');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/points/users/u1/today');
    });

    it('getPointsWeek', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: {} });
      await apiClient.getPointsWeek('u1');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/points/users/u1/week');
    });

    it('getPointsMonth', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: {} });
      await apiClient.getPointsMonth('u1');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/points/users/u1/month');
    });

    it('awardPoints', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });
      await apiClient.awardPoints('u1', 25, 'chore', 'cleaned room');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/points/users/u1', {
        points: 25,
        activity_type: 'chore',
        description: 'cleaned room',
      });
    });

    it('getLeaderboard with defaults', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
      await apiClient.getLeaderboard();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/points/leaderboard', {
        params: { limit: 10, period: 'week' },
      });
    });
  });

  describe('External APIs', () => {
    it('getWordDefinition', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: {} });
      await apiClient.getWordDefinition('cat');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/external/dictionary/word/cat');
    });

    it('getWordOfDay', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: {} });
      await apiClient.getWordOfDay();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/external/dictionary/word-of-day');
    });

    it('searchWords with default limit', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
      await apiClient.searchWords('cat');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/external/dictionary/search', {
        params: { prefix: 'cat', limit: 5 },
      });
    });

    it('getWeatherByCity with default units', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: {} });
      await apiClient.getWeatherByCity('Seattle');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/external/weather/city/Seattle', {
        params: { units: 'metric' },
      });
    });

    it('getWeatherByCoords', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: {} });
      await apiClient.getWeatherByCoords(47.6, -122.3);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/external/weather/coords', {
        params: { lat: 47.6, lon: -122.3, units: 'metric' },
      });
    });

    it('getWeatherForecast', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
      await apiClient.getWeatherForecast('Seattle');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/external/weather/forecast/Seattle');
    });

    it('checkWeatherSuitability', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });
      await apiClient.checkWeatherSuitability('Seattle', 'hiking');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/external/weather/activity-suitability', {
        city: 'Seattle',
        activityType: 'hiking',
      });
    });
  });

  describe('Health / Performance', () => {
    it('getHealth', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { status: 'ok' } });
      await apiClient.getHealth();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
    });

    it('getReadiness', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { status: 'ready' } });
      await apiClient.getReadiness();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/ready');
    });

    it('getInfo', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: {} });
      await apiClient.getInfo();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/info');
    });

    it('getPerformanceHealth', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: {} });
      await apiClient.getPerformanceHealth();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/performance/health');
    });

    it('getPerformanceSummary', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: {} });
      await apiClient.getPerformanceSummary();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/performance/summary');
    });
  });

  describe('SmartThings', () => {
    it('getSmartThingsDevices', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
      await apiClient.getSmartThingsDevices();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/smartthings/devices');
    });

    it('getSmartThingsDevice', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: {} });
      await apiClient.getSmartThingsDevice('d1');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/smartthings/devices/d1');
    });

    it('controlSmartThingsDevice', async () => {
      mockAxiosInstance.put.mockResolvedValueOnce({ data: {} });
      await apiClient.controlSmartThingsDevice('d1', 'on', [1]);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/api/smartthings/devices/d1', {
        command: 'on',
        arguments: [1],
      });
    });

    it('getSmartThingsStatus', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: {} });
      await apiClient.getSmartThingsStatus();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/smartthings/status');
    });
  });

  describe('Batch operations', () => {
    it('batchOperations wraps the operations array', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { results: [] } });
      const ops = [{ id: 'op1', method: 'GET', path: '/x' }];
      await apiClient.batchOperations(ops);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/batch', { operations: ops });
    });
  });

  describe('Generic HTTP methods', () => {
    it('get delegates to the client and returns the raw response', async () => {
      const response = { data: { ok: true } };
      mockAxiosInstance.get.mockResolvedValueOnce(response);
      const result = await apiClient.get('/custom');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/custom', undefined);
      expect(result).toBe(response);
    });

    it('post delegates with data and config', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });
      await apiClient.post('/custom', { a: 1 }, { headers: { 'X-Test': '1' } });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/custom', { a: 1 }, { headers: { 'X-Test': '1' } });
    });

    it('patch delegates with data and config', async () => {
      mockAxiosInstance.patch.mockResolvedValueOnce({ data: {} });
      await apiClient.patch('/custom', { a: 1 });
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/custom', { a: 1 }, undefined);
    });

    it('delete delegates with config', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({ data: {} });
      await apiClient.delete('/custom');
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/custom', undefined);
    });

    it('put delegates with data and config', async () => {
      mockAxiosInstance.put.mockResolvedValueOnce({ data: {} });
      await apiClient.put('/custom', { a: 1 });
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/custom', { a: 1 }, undefined);
    });
  });
});
