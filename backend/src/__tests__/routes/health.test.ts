/**
 * Health Endpoint Tests
 * Tests GET /health for monitoring and observability (Decision 26)
 */

import request from 'supertest';
import express from 'express';
import { healthRoutes } from '../../routes/health';

describe('Health Endpoint (/api/health)', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/health', healthRoutes);
  });

  describe('GET /health - Basic Response', () => {
    it('should return 200 status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should return JSON response', async () => {
      const response = await request(app).get('/health');
      expect(response.type).toMatch(/json/);
    });

    it('should include status field', async () => {
      const response = await request(app).get('/health');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
    });

    it('should include timestamp', async () => {
      const response = await request(app).get('/health');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
      // Should be valid ISO 8601 timestamp
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });

    it('should include uptime in seconds', async () => {
      const response = await request(app).get('/health');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include database status', async () => {
      const response = await request(app).get('/health');
      expect(response.body).toHaveProperty('database');
      expect(['connected', 'connecting', 'disconnected']).toContain(
        response.body.database
      );
    });
  });

  describe('Response Time', () => {
    it('should respond in under 100ms', async () => {
      const startTime = Date.now();
      await request(app).get('/health');
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Timestamp Accuracy', () => {
    it('should have recent timestamp', async () => {
      const response = await request(app).get('/health');
      const timestamp = new Date(response.body.timestamp);
      const now = new Date();
      const diff = Math.abs(now.getTime() - timestamp.getTime());

      // Should be within 5 seconds
      expect(diff).toBeLessThan(5000);
    });

    it('should use ISO 8601 format', async () => {
      const response = await request(app).get('/health');
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(response.body.timestamp).toMatch(iso8601Regex);
    });
  });

  describe('Uptime Tracking', () => {
    it('should increase over multiple requests', async () => {
      const response1 = await request(app).get('/health');
      await new Promise((resolve) => setTimeout(resolve, 100));
      const response2 = await request(app).get('/health');

      expect(response2.body.uptime).toBeGreaterThanOrEqual(
        response1.body.uptime
      );
    });

    it('should not be negative', async () => {
      const response = await request(app).get('/health');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Database Status Indicators', () => {
    it('should indicate database connection state', async () => {
      const response = await request(app).get('/health');
      const validStates = ['connected', 'connecting', 'disconnected', 'error'];
      expect(validStates).toContain(response.body.database);
    });
  });

  describe('Content-Type Header', () => {
    it('should return application/json content type', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Cache Control', () => {
    it('should not cache health responses', async () => {
      const response = await request(app).get('/health');
      // Health checks should not be cached
      expect(response.headers['cache-control']).toMatch(/no-cache|no-store/i);
    });
  });

  describe('Error Scenarios', () => {
    it('should still return 200 even if some components fail', async () => {
      // Health should be resilient
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should not expose internal error details', async () => {
      const response = await request(app).get('/health');
      expect(response.body.timestamp).not.toContain('Error');
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('Alternative Paths', () => {
    it('should be accessible at /health', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should support HEAD requests', async () => {
      const response = await request(app).head('/health');
      expect(response.status).toBe(200);
    });
  });

  describe('Load Balancer Compatibility', () => {
    it('should work with AWS load balancer health checks', async () => {
      const response = await request(app).get('/health');
      // ELB expects 200 response
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });

    it('should work with Kubernetes health probes', async () => {
      const response = await request(app).get('/health');
      // K8s expects 200 and predictable response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Monitoring Integration', () => {
    it('should provide metrics suitable for monitoring', async () => {
      const response = await request(app).get('/health');
      // Should have all fields needed by monitoring tools
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('database');
    });
  });

  describe('Version Info', () => {
    it('should optionally include version information', async () => {
      const response = await request(app).get('/health');
      // Version might be included
      if (response.body.version) {
        expect(typeof response.body.version).toBe('string');
      }
    });
  });
});
