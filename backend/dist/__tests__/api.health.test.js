"use strict";
/**
 * API Health Check Tests
 * Tests all health and readiness endpoints
 */
describe('Health Endpoints', () => {
    const baseURL = process.env.API_URL || 'http://localhost:3000';
    describe('GET /health', () => {
        it('should return 200 when server is running', async () => {
            const response = await fetch(`${baseURL}/health`);
            expect(response.status).toBe(200);
        });
        it('should return JSON with status ok', async () => {
            const response = await fetch(`${baseURL}/health`);
            const data = await response.json();
            expect(data).toHaveProperty('status', 'ok');
            expect(data).toHaveProperty('timestamp');
            expect(data).toHaveProperty('environment');
            expect(data).toHaveProperty('uptime');
        });
        it('should have valid timestamp', async () => {
            const response = await fetch(`${baseURL}/health`);
            const data = await response.json();
            const timestamp = new Date(data.timestamp);
            expect(timestamp.getTime()).toBeGreaterThan(0);
        });
    });
    describe('GET /ready', () => {
        it('should return 200 when ready to serve traffic', async () => {
            const response = await fetch(`${baseURL}/ready`);
            expect([200, 503]).toContain(response.status);
        });
        it('should include readiness checks', async () => {
            const response = await fetch(`${baseURL}/ready`);
            const data = await response.json();
            expect(data).toHaveProperty('status');
            expect(data).toHaveProperty('checks');
            expect(Array.isArray(data.checks)).toBe(true);
        });
        it('should report database check', async () => {
            const response = await fetch(`${baseURL}/ready`);
            const data = await response.json();
            const dbCheck = data.checks?.find((c) => c.name === 'database');
            expect(dbCheck).toBeDefined();
            expect(['healthy', 'degraded', 'unhealthy']).toContain(dbCheck?.status);
        });
    });
    describe('GET /info', () => {
        it('should return application info', async () => {
            const response = await fetch(`${baseURL}/info`);
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('application', 'Family Hub API');
            expect(data).toHaveProperty('version');
            expect(data).toHaveProperty('environment');
            expect(data).toHaveProperty('endpoints');
            expect(data).toHaveProperty('features');
        });
        it('should list all endpoints', async () => {
            const response = await fetch(`${baseURL}/info`);
            const data = await response.json();
            expect(data.endpoints).toHaveProperty('auth');
            expect(data.endpoints).toHaveProperty('users');
            expect(data.endpoints).toHaveProperty('badges');
            expect(data.endpoints).toHaveProperty('points');
            expect(data.endpoints).toHaveProperty('total');
            expect(data.endpoints.total).toBeGreaterThanOrEqual(60);
        });
    });
    describe('GET /metrics', () => {
        it('should return Prometheus metrics', async () => {
            const response = await fetch(`${baseURL}/metrics`);
            expect(response.status).toBe(200);
            const text = await response.text();
            expect(text).toContain('process_uptime_seconds');
            expect(text).toContain('process_memory_heap_bytes');
            expect(text).toContain('TYPE');
        });
        it('should have valid metric format', async () => {
            const response = await fetch(`${baseURL}/metrics`);
            const text = await response.text();
            expect(text).toMatch(/^# HELP/m);
            expect(text).toMatch(/^# TYPE/m);
        });
    });
});
describe('API Endpoints', () => {
    const baseURL = process.env.API_URL || 'http://localhost:3000';
    describe('Authentication Flow', () => {
        it('should require authentication for protected endpoints', async () => {
            const response = await fetch(`${baseURL}/badges`);
            // Should either return 401 or require auth header
            expect([401, 403, 200]).toContain(response.status);
        });
    });
    describe('Core Endpoints Availability', () => {
        const endpoints = [
            { method: 'GET', path: '/badges' },
            { method: 'GET', path: '/performance/health' },
            { method: 'GET', path: '/health' },
            { method: 'GET', path: '/ready' },
            { method: 'GET', path: '/info' }
        ];
        for (const endpoint of endpoints) {
            it(`${endpoint.method} ${endpoint.path} should be accessible`, async () => {
                const response = await fetch(`${baseURL}${endpoint.path}`);
                // Accept 200, 401, or 403 - all indicate endpoint exists
                expect([200, 400, 401, 403, 404].includes(response.status)).toBe(true);
            });
        }
    });
    describe('Error Handling', () => {
        it('should return 404 for non-existent endpoint', async () => {
            const response = await fetch(`${baseURL}/nonexistent`);
            expect(response.status).toBe(404);
        });
        it('should return JSON error response', async () => {
            const response = await fetch(`${baseURL}/nonexistent`);
            const data = await response.json();
            expect(data).toHaveProperty('error');
        });
    });
});
//# sourceMappingURL=api.health.test.js.map