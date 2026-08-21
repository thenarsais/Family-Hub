/**
 * Points Route Tests
 * Tests points/rewards management endpoints
 *
 * This file previously didn't import routes/points.ts at all — it built a
 * fake Express app with hand-rolled handlers at made-up paths (/points,
 * /points/add) using an x-user-id header. The real route is mounted at root
 * (no /api prefix — see server.ts), lives under /users/:userId, and uses
 * `Authorization: Bearer <token>` via verifyAuth (which only checks the
 * header is present, not that it's valid — see the "fake auth" finding
 * elsewhere). None of that was ever exercised. Rewritten against the real
 * router and PointsRepository.
 */

import request from 'supertest';
import express from 'express';

jest.mock('../../database/repositories/PointsRepository');

import * as PointsRepository from '../../database/repositories/PointsRepository';
import pointsRoutes from '../../routes/points';

const app = express();
app.use(express.json());
app.use('/', pointsRoutes);

describe('Points Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /users/:userId', () => {
    it('should return total points', async () => {
      (PointsRepository.getTotalPoints as jest.Mock).mockResolvedValueOnce(1250);

      const res = await request(app)
        .get('/users/user-1')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.data.user_id).toBe('user-1');
      expect(res.body.data.total_points).toBe(1250);
    });

    it('should require an Authorization header', async () => {
      const res = await request(app).get('/users/user-1');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Missing authorization header');
    });

    it('should fall back to demo data if the database is unavailable, not error', async () => {
      // This endpoint deliberately swallows DB errors into a mock-data
      // response rather than propagating them — see routes/points.ts.
      (PointsRepository.getTotalPoints as jest.Mock).mockRejectedValueOnce(new Error('DB down'));

      const res = await request(app)
        .get('/users/user-1')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.demo_mode).toBe(true);
      expect(res.body.data.total_points).toBe(250);
    });
  });

  describe('GET /users/:userId/history', () => {
    it('should return points history', async () => {
      (PointsRepository.getPointsHistory as jest.Mock).mockResolvedValueOnce([
        { id: '1', activity_type: 'chore', points: 50, reason: 'Completed chore', created_at: new Date() },
        { id: '2', activity_type: 'learning', points: 75, reason: 'Learning activity', created_at: new Date() },
      ]);

      const res = await request(app)
        .get('/users/user-1/history')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.history).toHaveLength(2);
      expect(res.body.history[0]).toHaveProperty('points');
      expect(res.body.history[0]).toHaveProperty('reason');
    });

    it('should pass a default limit of 50', async () => {
      (PointsRepository.getPointsHistory as jest.Mock).mockResolvedValueOnce([]);

      await request(app)
        .get('/users/user-1/history')
        .set('Authorization', 'Bearer token');

      expect(PointsRepository.getPointsHistory).toHaveBeenCalledWith('user-1', 50);
    });

    it('should respect a custom limit', async () => {
      (PointsRepository.getPointsHistory as jest.Mock).mockResolvedValueOnce([]);

      await request(app)
        .get('/users/user-1/history?limit=10')
        .set('Authorization', 'Bearer token');

      expect(PointsRepository.getPointsHistory).toHaveBeenCalledWith('user-1', 10);
    });

    it('should require an Authorization header', async () => {
      const res = await request(app).get('/users/user-1/history');
      expect(res.status).toBe(401);
    });

    it('should handle repository errors', async () => {
      (PointsRepository.getPointsHistory as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .get('/users/user-1/history')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to get points history');
    });
  });

  describe('GET /users/:userId/breakdown', () => {
    it('should return points breakdown by activity type', async () => {
      (PointsRepository.getPointsBreakdown as jest.Mock).mockResolvedValueOnce({
        chore: 500,
        learning: 300,
      });

      const res = await request(app)
        .get('/users/user-1/breakdown')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.breakdown.chore).toBe(500);
      expect(res.body.breakdown.learning).toBe(300);
    });

    it('should require an Authorization header', async () => {
      const res = await request(app).get('/users/user-1/breakdown');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /users/:userId/range', () => {
    it('should return points in a date range', async () => {
      (PointsRepository.getPointsInRange as jest.Mock).mockResolvedValueOnce(400);

      const res = await request(app)
        .get('/users/user-1/range?start=2026-01-01&end=2026-01-31')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.total_points).toBe(400);
    });

    it('should require start and end query params', async () => {
      const res = await request(app)
        .get('/users/user-1/range')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('start or end');
    });
  });

  describe('GET /users/:userId/today, /week, /month', () => {
    it('should return points earned today', async () => {
      (PointsRepository.getPointsToday as jest.Mock).mockResolvedValueOnce(30);

      const res = await request(app)
        .get('/users/user-1/today')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.period).toBe('today');
      expect(res.body.points).toBe(30);
    });

    it('should return points earned this week', async () => {
      (PointsRepository.getPointsThisWeek as jest.Mock).mockResolvedValueOnce(150);

      const res = await request(app)
        .get('/users/user-1/week')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.period).toBe('this_week');
      expect(res.body.points).toBe(150);
    });

    it('should return points earned this month', async () => {
      (PointsRepository.getPointsThisMonth as jest.Mock).mockResolvedValueOnce(450);

      const res = await request(app)
        .get('/users/user-1/month')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.period).toBe('this_month');
      expect(res.body.points).toBe(450);
    });
  });

  describe('POST /users/:userId', () => {
    it('should award points', async () => {
      (PointsRepository.addPoints as jest.Mock).mockResolvedValueOnce({
        id: 'entry-1',
        user_id: 'user-1',
        points: 50,
        activity_type: 'chore',
        reason: 'Completed chore',
        created_at: new Date(),
      });

      const res = await request(app)
        .post('/users/user-1')
        .set('Authorization', 'Bearer token')
        .send({ points: 50, activity_type: 'chore', reason: 'Completed chore' });

      expect(res.status).toBe(201);
      expect(res.body.entry.points).toBe(50);
      expect(res.body.entry.activity_type).toBe('chore');
    });

    it('should require points and activity_type', async () => {
      const res = await request(app)
        .post('/users/user-1')
        .set('Authorization', 'Bearer token')
        .send({ points: 50 });

      expect(res.status).toBe(400);
      expect(res.body.required).toContain('activity_type');
    });

    it('should reject non-positive points', async () => {
      const res = await request(app)
        .post('/users/user-1')
        .set('Authorization', 'Bearer token')
        .send({ points: 0, activity_type: 'chore' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Points must be a positive number');
    });

    it('should reject an excessive point amount only if the repository rejects it', async () => {
      // The route has no upper bound of its own — it defers entirely to
      // whatever the repository/DB layer decides. Document that, don't
      // assert a cap that doesn't exist in the code.
      (PointsRepository.addPoints as jest.Mock).mockResolvedValueOnce({
        id: 'entry-1',
        user_id: 'user-1',
        points: 999999999,
        activity_type: 'chore',
        reason: 'Hack attempt',
        created_at: new Date(),
      });

      const res = await request(app)
        .post('/users/user-1')
        .set('Authorization', 'Bearer token')
        .send({ points: 999999999, activity_type: 'chore', reason: 'Hack attempt' });

      expect(res.status).toBe(201);
    });

    it('should require an Authorization header', async () => {
      const res = await request(app)
        .post('/users/user-1')
        .send({ points: 50, activity_type: 'chore' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /users/:userId/subtract', () => {
    it('should deduct points', async () => {
      (PointsRepository.subtractPoints as jest.Mock).mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/users/user-1/subtract')
        .set('Authorization', 'Bearer token')
        .send({ points: 20, reason: 'Broke a rule' });

      expect(res.status).toBe(201);
      expect(res.body.deducted_points).toBe(20);
      expect(res.body.reason).toBe('Broke a rule');
    });

    it('should require a points value', async () => {
      const res = await request(app)
        .post('/users/user-1/subtract')
        .set('Authorization', 'Bearer token')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject non-positive points', async () => {
      const res = await request(app)
        .post('/users/user-1/subtract')
        .set('Authorization', 'Bearer token')
        .send({ points: -5 });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /leaderboard', () => {
    it('should return the leaderboard, ranked', async () => {
      (PointsRepository.getTopUsersByPoints as jest.Mock).mockResolvedValueOnce([
        { user_id: 'user-1', total_points: 5000 },
        { user_id: 'user-2', total_points: 4500 },
      ]);

      const res = await request(app)
        .get('/leaderboard')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.leaderboard[0].rank).toBe(1);
      expect(res.body.leaderboard[0].points).toBe(5000);
      expect(res.body.leaderboard[1].rank).toBe(2);
    });

    it('should not expose sensitive user data', async () => {
      (PointsRepository.getTopUsersByPoints as jest.Mock).mockResolvedValueOnce([
        { user_id: 'user-1', total_points: 5000 },
      ]);

      const res = await request(app)
        .get('/leaderboard')
        .set('Authorization', 'Bearer token');

      expect(res.body.leaderboard[0]).not.toHaveProperty('email');
      expect(res.body.leaderboard[0]).not.toHaveProperty('familyId');
    });

    it('should default to a limit of 10', async () => {
      (PointsRepository.getTopUsersByPoints as jest.Mock).mockResolvedValueOnce([]);

      await request(app)
        .get('/leaderboard')
        .set('Authorization', 'Bearer token');

      expect(PointsRepository.getTopUsersByPoints).toHaveBeenCalledWith(10);
    });

    it('should reject a limit outside 1-100', async () => {
      const res = await request(app)
        .get('/leaderboard?limit=200')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(400);
    });

    it('should require an Authorization header', async () => {
      const res = await request(app).get('/leaderboard');
      expect(res.status).toBe(401);
    });
  });
});
