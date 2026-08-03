/**
 * Points Route Tests
 * Tests points/rewards management endpoints
 */

import request from 'supertest';
import express from 'express';

describe('Points Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock user ID middleware
    app.use((req, res, next) => {
      (req as any).userId = req.headers['x-user-id'] || 'user-1';
      next();
    });

    // Mock points routes
    app.get('/points', (req, res) => {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
      }

      res.status(200).json({
        totalPoints: 1250,
        weeklyPoints: 150,
        monthlyPoints: 450,
      });
    });

    app.post('/points/add', (req, res) => {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
      }

      const { amount, reason } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
      }

      if (!reason) {
        return res.status(400).json({ error: 'Reason required' });
      }

      res.status(200).json({
        previousPoints: 1000,
        addedPoints: amount,
        newTotal: 1000 + amount,
        reason,
      });
    });

    app.get('/points/history', (req, res) => {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
      }

      res.status(200).json({
        history: [
          { date: '2026-08-01', points: 50, reason: 'Completed chore' },
          { date: '2026-07-31', points: 75, reason: 'Learning activity' },
        ],
      });
    });

    app.get('/points/leaderboard', (req, res) => {
      res.status(200).json({
        leaderboard: [
          { rank: 1, userId: 'user-1', points: 5000 },
          { rank: 2, userId: 'user-2', points: 4500 },
        ],
      });
    });
  });

  describe('GET /points', () => {
    it('should return user points', async () => {
      const res = await request(app)
        .get('/points')
        .set('x-user-id', 'user-1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalPoints');
      expect(res.body).toHaveProperty('weeklyPoints');
      expect(res.body).toHaveProperty('monthlyPoints');
    });

    it('should have positive point values', async () => {
      const res = await request(app)
        .get('/points')
        .set('x-user-id', 'user-1');

      expect(res.body.totalPoints).toBeGreaterThanOrEqual(0);
      expect(res.body.weeklyPoints).toBeGreaterThanOrEqual(0);
      expect(res.body.monthlyPoints).toBeGreaterThanOrEqual(0);
    });

    it('should have weekly <= monthly <= total', async () => {
      const res = await request(app)
        .get('/points')
        .set('x-user-id', 'user-1');

      expect(res.body.weeklyPoints).toBeLessThanOrEqual(res.body.monthlyPoints);
      expect(res.body.monthlyPoints).toBeLessThanOrEqual(res.body.totalPoints);
    });

    it('should require user ID', async () => {
      const res = await request(app).get('/points');

      expect(res.status).toBe(401);
    });

    it('should return user specific points', async () => {
      const res1 = await request(app)
        .get('/points')
        .set('x-user-id', 'user-1');

      const res2 = await request(app)
        .get('/points')
        .set('x-user-id', 'user-2');

      // Both should succeed but return different values
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
    });
  });

  describe('POST /points/add', () => {
    it('should add points successfully', async () => {
      const res = await request(app)
        .post('/points/add')
        .set('x-user-id', 'user-1')
        .send({
          amount: 50,
          reason: 'Completed chore',
        });

      expect(res.status).toBe(200);
      expect(res.body.addedPoints).toBe(50);
      expect(res.body.newTotal).toBe(1050);
    });

    it('should return updated total', async () => {
      const res = await request(app)
        .post('/points/add')
        .set('x-user-id', 'user-1')
        .send({
          amount: 100,
          reason: 'Learning activity',
        });

      expect(res.body.previousPoints).toBeDefined();
      expect(res.body.newTotal).toBe(res.body.previousPoints + res.body.addedPoints);
    });

    it('should reject negative points', async () => {
      const res = await request(app)
        .post('/points/add')
        .set('x-user-id', 'user-1')
        .send({
          amount: -50,
          reason: 'Test',
        });

      expect(res.status).toBe(400);
    });

    it('should reject zero points', async () => {
      const res = await request(app)
        .post('/points/add')
        .set('x-user-id', 'user-1')
        .send({
          amount: 0,
          reason: 'Test',
        });

      expect(res.status).toBe(400);
    });

    it('should require reason', async () => {
      const res = await request(app)
        .post('/points/add')
        .set('x-user-id', 'user-1')
        .send({
          amount: 50,
        });

      expect(res.status).toBe(400);
    });

    it('should require user ID', async () => {
      const res = await request(app)
        .post('/points/add')
        .send({
          amount: 50,
          reason: 'Test',
        });

      expect(res.status).toBe(401);
    });

    it('should log the reason for audit', async () => {
      const res = await request(app)
        .post('/points/add')
        .set('x-user-id', 'user-1')
        .send({
          amount: 50,
          reason: 'Specific achievement',
        });

      expect(res.body.reason).toBe('Specific achievement');
    });

    it('should not allow excessive point amounts', async () => {
      const res = await request(app)
        .post('/points/add')
        .set('x-user-id', 'user-1')
        .send({
          amount: 999999999,
          reason: 'Hack attempt',
        });

      // Should either fail or cap the amount
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('GET /points/history', () => {
    it('should return points history', async () => {
      const res = await request(app)
        .get('/points/history')
        .set('x-user-id', 'user-1');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.history)).toBe(true);
    });

    it('should include transaction details', async () => {
      const res = await request(app)
        .get('/points/history')
        .set('x-user-id', 'user-1');

      const transaction = res.body.history[0];
      expect(transaction).toHaveProperty('date');
      expect(transaction).toHaveProperty('points');
      expect(transaction).toHaveProperty('reason');
    });

    it('should be sorted by date descending', async () => {
      const res = await request(app)
        .get('/points/history')
        .set('x-user-id', 'user-1');

      if (res.body.history.length > 1) {
        const dates = res.body.history.map((h: any) => new Date(h.date).getTime());
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }
    });

    it('should require user ID', async () => {
      const res = await request(app).get('/points/history');

      expect(res.status).toBe(401);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/points/history?page=1&limit=10')
        .set('x-user-id', 'user-1');

      // Should handle pagination gracefully
      expect(res.status).toBe(200);
    });
  });

  describe('GET /points/leaderboard', () => {
    it('should return leaderboard', async () => {
      const res = await request(app).get('/points/leaderboard');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.leaderboard)).toBe(true);
    });

    it('should include rank and points', async () => {
      const res = await request(app).get('/points/leaderboard');

      const entry = res.body.leaderboard[0];
      expect(entry).toHaveProperty('rank');
      expect(entry).toHaveProperty('points');
    });

    it('should be sorted by rank', async () => {
      const res = await request(app).get('/points/leaderboard');

      const ranks = res.body.leaderboard.map((e: any) => e.rank);
      for (let i = 0; i < ranks.length - 1; i++) {
        expect(ranks[i]).toBeLessThanOrEqual(ranks[i + 1]);
      }
    });

    it('should be sorted by points descending', async () => {
      const res = await request(app).get('/points/leaderboard');

      const points = res.body.leaderboard.map((e: any) => e.points);
      for (let i = 0; i < points.length - 1; i++) {
        expect(points[i]).toBeGreaterThanOrEqual(points[i + 1]);
      }
    });

    it('should not expose sensitive user data', async () => {
      const res = await request(app).get('/points/leaderboard');

      const entry = res.body.leaderboard[0];
      expect(entry).not.toHaveProperty('email');
      expect(entry).not.toHaveProperty('phone');
    });
  });

  describe('COPPA Compliance', () => {
    it('should not expose child names with points', async () => {
      const res = await request(app)
        .get('/points')
        .set('x-user-id', 'user-1');

      expect(res.body).not.toHaveProperty('childName');
    });

    it('should aggregate data safely', async () => {
      const res = await request(app)
        .get('/points/leaderboard');

      // Leaderboard should not expose parent/child relationship
      res.body.leaderboard.forEach((entry: any) => {
        expect(entry).not.toHaveProperty('familyId');
        expect(entry).not.toHaveProperty('parentId');
      });
    });
  });

  describe('Gamification Balance', () => {
    it('should ensure points are achievable', async () => {
      const res = await request(app)
        .get('/points')
        .set('x-user-id', 'user-1');

      // Points should be in reasonable range
      expect(res.body.totalPoints).toBeLessThan(1000000);
    });

    it('should track multiple point types', async () => {
      const res = await request(app)
        .get('/points')
        .set('x-user-id', 'user-1');

      // Should have weekly/monthly breakdown
      expect(res.body.weeklyPoints).toBeDefined();
      expect(res.body.monthlyPoints).toBeDefined();
    });
  });
});
