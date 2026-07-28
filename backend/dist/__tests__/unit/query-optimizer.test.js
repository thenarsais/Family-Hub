"use strict";
/**
 * Unit Tests: Query Optimizer
 */
Object.defineProperty(exports, "__esModule", { value: true });
const query_optimizer_1 = require("../../utils/query-optimizer");
describe('Query Optimizer', () => {
    beforeEach(() => {
        (0, query_optimizer_1.clearQueryProfiles)();
    });
    describe('Query profiling', () => {
        it('should profile query execution', () => {
            const profile = (0, query_optimizer_1.profileQuery)('SELECT * FROM users', 50, 100);
            expect(profile).toHaveProperty('query');
            expect(profile).toHaveProperty('executionTime', 50);
            expect(profile).toHaveProperty('rowsAffected', 100);
            expect(profile).toHaveProperty('slow', false);
        });
        it('should mark slow queries', () => {
            const profile = (0, query_optimizer_1.profileQuery)('SELECT * FROM large_table', 150, 1000);
            expect(profile.slow).toBe(true);
            expect(profile.executionTime).toBeGreaterThan(100);
        });
    });
    describe('Slow query detection', () => {
        it('should identify slow queries', () => {
            (0, query_optimizer_1.profileQuery)('SELECT * FROM users', 50, 100);
            (0, query_optimizer_1.profileQuery)('SELECT * FROM orders', 150, 500); // Slow
            (0, query_optimizer_1.profileQuery)('SELECT * FROM products', 120, 300); // Slow
            const slowQueries = (0, query_optimizer_1.getSlowQueries)();
            expect(slowQueries.length).toBe(2);
            expect(slowQueries[0].executionTime).toBeGreaterThan(100);
        });
        it('should return empty array if no slow queries', () => {
            (0, query_optimizer_1.profileQuery)('SELECT * FROM users', 50, 100);
            (0, query_optimizer_1.profileQuery)('SELECT * FROM products', 75, 200);
            const slowQueries = (0, query_optimizer_1.getSlowQueries)();
            expect(slowQueries.length).toBe(0);
        });
    });
    describe('Query statistics', () => {
        it('should calculate query statistics', () => {
            (0, query_optimizer_1.profileQuery)('SELECT * FROM users', 50, 100);
            (0, query_optimizer_1.profileQuery)('SELECT * FROM orders', 150, 500);
            (0, query_optimizer_1.profileQuery)('SELECT * FROM products', 75, 200);
            const stats = (0, query_optimizer_1.getQueryStats)();
            expect(stats).not.toBeNull();
            expect(stats?.totalQueries).toBe(3);
            expect(stats?.slowQueries).toBe(1);
            expect(stats?.totalRowsAffected).toBe(800);
        });
        it('should return null if no queries profiled', () => {
            const stats = (0, query_optimizer_1.getQueryStats)();
            expect(stats).toBeNull();
        });
        it('should calculate slow query percentage', () => {
            (0, query_optimizer_1.profileQuery)('SELECT * FROM users', 50, 100);
            (0, query_optimizer_1.profileQuery)('SELECT * FROM orders', 150, 500); // Slow
            const stats = (0, query_optimizer_1.getQueryStats)();
            expect(stats?.slowQueryPercentage).toContain('50');
        });
    });
    describe('N+1 Query detection', () => {
        it('should detect repeated query patterns', () => {
            // Simulate N+1 query pattern
            for (let i = 0; i < 10; i++) {
                (0, query_optimizer_1.profileQuery)('SELECT * FROM users WHERE id = $1', 30, 1);
            }
            const patterns = (0, query_optimizer_1.detectNPlusOneQueries)();
            expect(patterns.size).toBeGreaterThan(0);
            // The pattern should appear multiple times
            for (const [pattern, count] of patterns) {
                if (pattern.includes('users')) {
                    expect(count).toBeGreaterThanOrEqual(5);
                }
            }
        });
        it('should return empty map if no patterns detected', () => {
            (0, query_optimizer_1.profileQuery)('SELECT * FROM users', 50, 100);
            (0, query_optimizer_1.profileQuery)('SELECT * FROM orders', 60, 50);
            (0, query_optimizer_1.profileQuery)('SELECT * FROM products', 70, 75);
            const patterns = (0, query_optimizer_1.detectNPlusOneQueries)();
            expect(patterns.size).toBe(0);
        });
    });
    describe('Query recommendations', () => {
        it('should recommend optimization for high slow query percentage', () => {
            // Create mostly slow queries
            for (let i = 0; i < 9; i++) {
                (0, query_optimizer_1.profileQuery)('SELECT * FROM large_table', 150, 1000);
            }
            (0, query_optimizer_1.profileQuery)('SELECT * FROM small_table', 50, 10);
            const recommendations = (0, query_optimizer_1.getSlowQueries)();
            expect(recommendations.length).toBeGreaterThan(5);
        });
    });
    describe('Query clearing', () => {
        it('should clear all profiled queries', () => {
            (0, query_optimizer_1.profileQuery)('SELECT * FROM users', 50, 100);
            (0, query_optimizer_1.profileQuery)('SELECT * FROM orders', 150, 500);
            (0, query_optimizer_1.clearQueryProfiles)();
            const stats = (0, query_optimizer_1.getQueryStats)();
            expect(stats).toBeNull();
        });
    });
});
//# sourceMappingURL=query-optimizer.test.js.map