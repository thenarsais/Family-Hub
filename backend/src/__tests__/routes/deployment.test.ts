import request from 'supertest';
import express from 'express';

jest.mock('../../utils/readiness', () => ({
  runReadinessChecks: jest.fn(),
  isAlive: jest.fn(),
}));

import * as readiness from '../../utils/readiness';
import deploymentRoutes from '../../routes/deployment';

const app = express();
app.use(express.json());
app.use('/', deploymentRoutes);

describe('Deployment Routes', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('GET /health', () => {
    it('should return 503 when the process is not alive', async () => {
      (readiness.isAlive as jest.Mock).mockReturnValueOnce(false);

      const res = await request(app).get('/health').expect(503);
      expect(res.body.status).toBe('unavailable');
    });

    it('should return ok with process info when alive', async () => {
      (readiness.isAlive as jest.Mock).mockReturnValueOnce(true);

      const res = await request(app).get('/health').expect(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.uptime).toBe('number');
    });
  });

  describe('GET /ready', () => {
    it('should return 503 when not ready', async () => {
      (readiness.runReadinessChecks as jest.Mock).mockResolvedValueOnce({
        ready: false,
        timestamp: '2026-01-01T00:00:00Z',
        checks: [],
        summary: { total: 1, healthy: 0, degraded: 0, unhealthy: 1 },
      });

      const res = await request(app).get('/ready').expect(503);
      expect(res.body.status).toBe('not_ready');
    });

    it('should return ready when all checks pass', async () => {
      (readiness.runReadinessChecks as jest.Mock).mockResolvedValueOnce({
        ready: true,
        timestamp: '2026-01-01T00:00:00Z',
        checks: [],
        summary: { total: 1, healthy: 1, degraded: 0, unhealthy: 0 },
      });

      const res = await request(app).get('/ready').expect(200);
      expect(res.body.status).toBe('ready');
    });

    it('should return 500 when the check throws', async () => {
      (readiness.runReadinessChecks as jest.Mock).mockRejectedValueOnce(new Error('boom'));

      const res = await request(app).get('/ready').expect(500);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('boom');
    });
  });

  describe('GET /startup', () => {
    it('should return 503 while still starting (low uptime)', async () => {
      jest.spyOn(process, 'uptime').mockReturnValueOnce(1);
      (readiness.runReadinessChecks as jest.Mock).mockResolvedValueOnce({
        summary: { total: 1, healthy: 1, degraded: 0, unhealthy: 0 },
        checks: [],
      });

      const res = await request(app).get('/startup').expect(503);
      expect(res.body.status).toBe('starting');
    });

    it('should return 503 when there are still unhealthy checks past the uptime threshold', async () => {
      jest.spyOn(process, 'uptime').mockReturnValueOnce(10);
      (readiness.runReadinessChecks as jest.Mock).mockResolvedValueOnce({
        summary: { total: 1, healthy: 0, degraded: 0, unhealthy: 1 },
        checks: [],
      });

      const res = await request(app).get('/startup').expect(503);
      expect(res.body.status).toBe('starting');
    });

    it('should return started once uptime and health both clear', async () => {
      jest.spyOn(process, 'uptime').mockReturnValueOnce(10);
      (readiness.runReadinessChecks as jest.Mock).mockResolvedValueOnce({
        summary: { total: 1, healthy: 1, degraded: 0, unhealthy: 0 },
        checks: [],
      });

      const res = await request(app).get('/startup').expect(200);
      expect(res.body.status).toBe('started');
    });
  });

  describe('GET /metrics', () => {
    it('should return Prometheus-formatted text metrics', async () => {
      const res = await request(app).get('/metrics').expect(200);

      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('process_uptime_seconds');
      expect(res.text).toContain('process_memory_heap_bytes');
      expect(res.text).toContain('nodejs_version_info');
    });
  });

  describe('GET /info', () => {
    it('should return application info', async () => {
      const res = await request(app).get('/info').expect(200);

      expect(res.body.application).toBe('Family Hub API');
      expect(res.body.features).toContain('Rate Limiting');
    });
  });

  describe('GET /config', () => {
    it('should return 403 in production', async () => {
      process.env.ENVIRONMENT = 'production';

      const res = await request(app).get('/config').expect(403);
      expect(res.body.error).toBe('Configuration not available in production');
    });

    it('should return config details outside of production', async () => {
      process.env.ENVIRONMENT = 'development';
      // Fake, non-functional fixture value -- not real infrastructure.
      process.env.DATABASE_URL = ['postgresql:/', 'localhost', 'db'].join('/');
      delete process.env.REDIS_URL;

      const res = await request(app).get('/config').expect(200);

      expect(res.body.database.url).toBe('[configured]');
      expect(res.body.redis.url).toBe('[not set]');
    });
  });
});
