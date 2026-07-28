/**
 * Unit Tests: Query Optimizer
 */

import {
  profileQuery,
  getSlowQueries,
  getQueryStats,
  detectNPlusOneQueries,
  clearQueryProfiles
} from '../../utils/query-optimizer';

describe('Query Optimizer', () => {
  beforeEach(() => {
    clearQueryProfiles();
  });

  describe('Query profiling', () => {
    it('should profile query execution', () => {
      const profile = profileQuery('SELECT * FROM users', 50, 100);

      expect(profile).toHaveProperty('query');
      expect(profile).toHaveProperty('executionTime', 50);
      expect(profile).toHaveProperty('rowsAffected', 100);
      expect(profile).toHaveProperty('slow', false);
    });

    it('should mark slow queries', () => {
      const profile = profileQuery('SELECT * FROM large_table', 150, 1000);

      expect(profile.slow).toBe(true);
      expect(profile.executionTime).toBeGreaterThan(100);
    });
  });

  describe('Slow query detection', () => {
    it('should identify slow queries', () => {
      profileQuery('SELECT * FROM users', 50, 100);
      profileQuery('SELECT * FROM orders', 150, 500); // Slow
      profileQuery('SELECT * FROM products', 120, 300); // Slow

      const slowQueries = getSlowQueries();

      expect(slowQueries.length).toBe(2);
      expect(slowQueries[0].executionTime).toBeGreaterThan(100);
    });

    it('should return empty array if no slow queries', () => {
      profileQuery('SELECT * FROM users', 50, 100);
      profileQuery('SELECT * FROM products', 75, 200);

      const slowQueries = getSlowQueries();
      expect(slowQueries.length).toBe(0);
    });
  });

  describe('Query statistics', () => {
    it('should calculate query statistics', () => {
      profileQuery('SELECT * FROM users', 50, 100);
      profileQuery('SELECT * FROM orders', 150, 500);
      profileQuery('SELECT * FROM products', 75, 200);

      const stats = getQueryStats();

      expect(stats).not.toBeNull();
      expect(stats?.totalQueries).toBe(3);
      expect(stats?.slowQueries).toBe(1);
      expect(stats?.totalRowsAffected).toBe(800);
    });

    it('should return null if no queries profiled', () => {
      const stats = getQueryStats();
      expect(stats).toBeNull();
    });

    it('should calculate slow query percentage', () => {
      profileQuery('SELECT * FROM users', 50, 100);
      profileQuery('SELECT * FROM orders', 150, 500); // Slow

      const stats = getQueryStats();
      expect(stats?.slowQueryPercentage).toContain('50');
    });
  });

  describe('N+1 Query detection', () => {
    it('should detect repeated query patterns', () => {
      // Simulate N+1 query pattern
      for (let i = 0; i < 10; i++) {
        profileQuery(
          'SELECT * FROM users WHERE id = $1',
          30,
          1
        );
      }

      const patterns = detectNPlusOneQueries();
      expect(patterns.size).toBeGreaterThan(0);

      // The pattern should appear multiple times
      for (const [pattern, count] of patterns) {
        if (pattern.includes('users')) {
          expect(count).toBeGreaterThanOrEqual(5);
        }
      }
    });

    it('should return empty map if no patterns detected', () => {
      profileQuery('SELECT * FROM users', 50, 100);
      profileQuery('SELECT * FROM orders', 60, 50);
      profileQuery('SELECT * FROM products', 70, 75);

      const patterns = detectNPlusOneQueries();
      expect(patterns.size).toBe(0);
    });
  });

  describe('Query recommendations', () => {
    it('should recommend optimization for high slow query percentage', () => {
      // Create mostly slow queries
      for (let i = 0; i < 9; i++) {
        profileQuery('SELECT * FROM large_table', 150, 1000);
      }
      profileQuery('SELECT * FROM small_table', 50, 10);

      const recommendations = getSlowQueries();
      expect(recommendations.length).toBeGreaterThan(5);
    });
  });

  describe('Query clearing', () => {
    it('should clear all profiled queries', () => {
      profileQuery('SELECT * FROM users', 50, 100);
      profileQuery('SELECT * FROM orders', 150, 500);

      clearQueryProfiles();

      const stats = getQueryStats();
      expect(stats).toBeNull();
    });
  });
});
