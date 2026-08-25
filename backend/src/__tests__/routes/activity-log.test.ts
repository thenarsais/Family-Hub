import request from 'supertest';
import express from 'express';

const mockActivityLogService = {
  getUserActivity: jest.fn(),
  getFamilyActivity: jest.fn(),
  logActivity: jest.fn(),
  getActivityStats: jest.fn(),
};

jest.mock('../../services/activity-log', () => ({ getActivityLogService: () => mockActivityLogService }));

const mockSingle = jest.fn();
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: mockSingle,
};
jest.mock('../../services/supabase', () => ({ getSupabase: () => mockSupabase }));

import activityLogRoutes from '../../routes/activity-log';

const app = express();
app.use(express.json());
app.use('/api/activity', activityLogRoutes);

describe('Activity Log Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
  });

  describe('GET /api/activity/feed', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/activity/feed').expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('User ID required');
    });

    it('should return the activity feed with a default limit of 50', async () => {
      mockActivityLogService.getUserActivity.mockResolvedValueOnce([{ id: 'a1' }]);

      const res = await request(app).get('/api/activity/feed').set('x-user-id', 'user-1').expect(200);

      expect(mockActivityLogService.getUserActivity).toHaveBeenCalledWith('user-1', 50);
      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(1);
    });

    it('should respect a custom limit query param', async () => {
      mockActivityLogService.getUserActivity.mockResolvedValueOnce([]);

      await request(app).get('/api/activity/feed?limit=5').set('x-user-id', 'user-1').expect(200);

      expect(mockActivityLogService.getUserActivity).toHaveBeenCalledWith('user-1', 5);
    });

    it('should return 500 when the service throws', async () => {
      mockActivityLogService.getUserActivity.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/activity/feed').set('x-user-id', 'user-1').expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to fetch activity feed');
    });
  });

  describe('GET /api/activity/family-feed', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/activity/family-feed').expect(401);

      expect(res.body.message).toBe('User ID required');
    });

    it('should return 404 when the user has no family', async () => {
      mockSingle.mockResolvedValueOnce({ data: null });

      const res = await request(app).get('/api/activity/family-feed').set('x-user-id', 'user-1').expect(404);

      expect(res.body.message).toBe('User not in a family');
    });

    it('should return the family activity feed with a default limit of 100', async () => {
      mockSingle.mockResolvedValueOnce({ data: { family_id: 'family-1' } });
      mockActivityLogService.getFamilyActivity.mockResolvedValueOnce([{ id: 'a1' }, { id: 'a2' }]);

      const res = await request(app).get('/api/activity/family-feed').set('x-user-id', 'user-1').expect(200);

      expect(mockActivityLogService.getFamilyActivity).toHaveBeenCalledWith('family-1', 100);
      expect(res.body.count).toBe(2);
    });

    it('should return 500 when the lookup throws', async () => {
      mockSingle.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/activity/family-feed').set('x-user-id', 'user-1').expect(500);

      expect(res.body.message).toBe('Failed to fetch family activity');
    });
  });

  describe('POST /api/activity/log', () => {
    it('should require user_id, activity_type, and action', async () => {
      const res = await request(app).post('/api/activity/log').send({}).expect(400);

      expect(res.body.message).toBe('Missing required fields: user_id, activity_type, action');
    });

    it('should log a valid activity entry and return 201', async () => {
      const entry = { id: 'a1' };
      mockActivityLogService.logActivity.mockResolvedValueOnce(entry);

      const res = await request(app)
        .post('/api/activity/log')
        .send({ user_id: 'user-1', activity_type: 'chore', action: 'completed', points_earned: 10 })
        .expect(201);

      expect(mockActivityLogService.logActivity).toHaveBeenCalledWith('user-1', expect.objectContaining({
        activity_type: 'chore',
        action: 'completed',
        points_earned: 10,
      }));
      expect(res.body.data).toEqual(entry);
    });

    it('should return 500 when logging throws', async () => {
      mockActivityLogService.logActivity.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app)
        .post('/api/activity/log')
        .send({ user_id: 'user-1', activity_type: 'chore', action: 'completed' })
        .expect(500);

      expect(res.body.message).toBe('Failed to log activity');
    });
  });

  describe('GET /api/activity/stats', () => {
    it('should require a user id', async () => {
      const res = await request(app).get('/api/activity/stats').expect(401);

      expect(res.body.message).toBe('User ID required');
    });

    it('should return stats with a default 7-day lookback', async () => {
      mockActivityLogService.getActivityStats.mockResolvedValueOnce({ chore: 3 });

      const res = await request(app).get('/api/activity/stats').set('x-user-id', 'user-1').expect(200);

      expect(mockActivityLogService.getActivityStats).toHaveBeenCalledWith('user-1', 7);
      expect(res.body.data).toEqual({ chore: 3 });
    });

    it('should respect a custom daysBack query param', async () => {
      mockActivityLogService.getActivityStats.mockResolvedValueOnce({});

      await request(app).get('/api/activity/stats?daysBack=30').set('x-user-id', 'user-1').expect(200);

      expect(mockActivityLogService.getActivityStats).toHaveBeenCalledWith('user-1', 30);
    });

    it('should return 500 when the service throws', async () => {
      mockActivityLogService.getActivityStats.mockRejectedValueOnce(new Error('db down'));

      const res = await request(app).get('/api/activity/stats').set('x-user-id', 'user-1').expect(500);

      expect(res.body.message).toBe('Failed to fetch stats');
    });
  });
});
