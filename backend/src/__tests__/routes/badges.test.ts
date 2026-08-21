/**
 * Badges Route Tests
 * Tests badge management endpoints
 *
 * This file previously didn't import routes/badges.ts at all — it built a
 * fake Express app with hand-rolled handlers at made-up paths (/badges,
 * /badges/award) using an x-user-id header. The real route is mounted at
 * root (no /api prefix — see server.ts), uses `Authorization: Bearer
 * <token>` via verifyAuth (presence-only check, not validity — see the
 * "fake auth" finding elsewhere), and none of that was ever exercised.
 * Rewritten against the real router and BadgesRepository.
 */

import request from 'supertest';
import express from 'express';

jest.mock('../../database/repositories/BadgesRepository');

import * as BadgesRepository from '../../database/repositories/BadgesRepository';
import badgesRoutes from '../../routes/badges';

const app = express();
app.use(express.json());
app.use('/', badgesRoutes);

describe('Badges Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const mockBadge = {
    id: 'badge-1',
    title: 'Beginner Learner',
    description: 'Completed your first lesson',
    icon_emoji: '📚',
    category: 'learning',
    tier: 'bronze',
    points_required: 10,
    created_at: new Date(),
  };

  describe('GET /', () => {
    it('should return all badges', async () => {
      (BadgesRepository.getAllBadges as jest.Mock).mockResolvedValueOnce([mockBadge]);

      const res = await request(app)
        .get('/')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.badges[0].title).toBe('Beginner Learner');
    });

    it('should require an Authorization header', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Missing authorization header');
    });

    it('should handle repository errors', async () => {
      (BadgesRepository.getAllBadges as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .get('/')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to get badges');
    });
  });

  describe('GET /:id', () => {
    it('should return a single badge', async () => {
      (BadgesRepository.getBadgeById as jest.Mock).mockResolvedValueOnce(mockBadge);

      const res = await request(app)
        .get('/badge-1')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.badge.id).toBe('badge-1');
    });

    it('should return 404 when the badge does not exist', async () => {
      (BadgesRepository.getBadgeById as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/nonexistent')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Badge not found');
    });
  });

  describe('GET /category/:category', () => {
    it('should return badges in a category', async () => {
      (BadgesRepository.getBadgesByCategory as jest.Mock).mockResolvedValueOnce([mockBadge]);

      const res = await request(app)
        .get('/category/learning')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.category).toBe('learning');
      expect(res.body.count).toBe(1);
    });
  });

  describe('GET /users/:userId', () => {
    it('should return badges earned by a user', async () => {
      (BadgesRepository.getUserBadges as jest.Mock).mockResolvedValueOnce([
        { id: 'ub-1', badge_id: 'badge-1', earned_at: new Date() },
      ]);

      const res = await request(app)
        .get('/users/user-1')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.user_id).toBe('user-1');
      expect(res.body.count).toBe(1);
      expect(res.body.meta.total_badges).toBe(1);
    });

    it('should fall back to demo data if the database is unavailable, not error', async () => {
      // This endpoint deliberately swallows DB errors into a mock-data
      // response rather than propagating them — see routes/badges.ts.
      (BadgesRepository.getUserBadges as jest.Mock).mockRejectedValueOnce(new Error('DB down'));

      const res = await request(app)
        .get('/users/user-1')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.demo_mode).toBe(true);
      expect(res.body.count).toBe(3);
    });

    it('should require an Authorization header', async () => {
      const res = await request(app).get('/users/user-1');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /users/:userId/detailed', () => {
    it('should return badges with full details', async () => {
      (BadgesRepository.getUserBadgesWithDetails as jest.Mock).mockResolvedValueOnce([
        {
          id: 'ub-1',
          badge_id: 'badge-1',
          title: 'Beginner Learner',
          description: 'Completed your first lesson',
          icon_emoji: '📚',
          category: 'learning',
          tier: 'bronze',
          earned_at: new Date(),
        },
      ]);

      const res = await request(app)
        .get('/users/user-1/detailed')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.badges[0].badge.title).toBe('Beginner Learner');
      expect(res.body.badges[0].earned_badge_id).toBe('ub-1');
    });
  });

  describe('POST /users/:userId/badges/:badgeId', () => {
    it('should award a badge', async () => {
      (BadgesRepository.userHasBadge as jest.Mock).mockResolvedValueOnce(false);
      (BadgesRepository.awardBadge as jest.Mock).mockResolvedValueOnce({
        id: 'ub-1',
        user_id: 'user-1',
        badge_id: 'badge-1',
        earned_at: new Date(),
      });

      const res = await request(app)
        .post('/users/user-1/badges/badge-1')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(201);
      expect(res.body.badge.badge_id).toBe('badge-1');
    });

    it('should reject awarding a badge the user already has', async () => {
      (BadgesRepository.userHasBadge as jest.Mock).mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/users/user-1/badges/badge-1')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('User already has this badge');
      expect(BadgesRepository.awardBadge).not.toHaveBeenCalled();
    });

    it('should require an Authorization header', async () => {
      const res = await request(app).post('/users/user-1/badges/badge-1');
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /users/:userId/badges/:badgeId', () => {
    it('should revoke a badge', async () => {
      (BadgesRepository.revokeBadge as jest.Mock).mockResolvedValueOnce(undefined);

      const res = await request(app)
        .delete('/users/user-1/badges/badge-1')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Badge revoked successfully');
    });
  });

  describe('GET /users/:userId/range', () => {
    it('should return badges earned in a date range', async () => {
      (BadgesRepository.getBadgesEarnedInRange as jest.Mock).mockResolvedValueOnce([
        { id: 'ub-1', badge_id: 'badge-1', earned_at: new Date() },
      ]);

      const res = await request(app)
        .get('/users/user-1/range?start=2026-01-01&end=2026-01-31')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });

    it('should require start and end query params', async () => {
      const res = await request(app)
        .get('/users/user-1/range')
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('start or end');
    });
  });
});
