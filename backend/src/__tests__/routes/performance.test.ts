import request from 'supertest';
import express from 'express';

jest.mock('../../utils/query-optimizer', () => ({
  getQueryStats: jest.fn(),
  getSlowQueries: jest.fn(),
  getOptimizationRecommendations: jest.fn(),
  detectNPlusOneQueries: jest.fn(),
}));
jest.mock('../../middleware/request-logger', () => ({
  getRecentLogs: jest.fn(),
  getErrorLogs: jest.fn(),
  getPerformanceStats: jest.fn(),
}));
jest.mock('../../middleware/compression', () => ({
  getCompressionStats: jest.fn(),
}));
jest.mock('../../database/indexes', () => ({
  getIndexMonitoringQueries: jest.fn(),
  getIndexSQL: jest.fn(),
}));

import * as queryOptimizer from '../../utils/query-optimizer';
import * as requestLogger from '../../middleware/request-logger';
import * as compression from '../../middleware/compression';
import * as indexes from '../../database/indexes';
import performanceRoutes from '../../routes/performance';

const app = express();
app.use(express.json());
app.use('/api/performance', performanceRoutes);

describe('Performance Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /health', () => {
    it('should report "no data" / "not enabled" when nothing has been recorded yet', async () => {
      (queryOptimizer.getQueryStats as jest.Mock).mockReturnValueOnce(null);
      (requestLogger.getPerformanceStats as jest.Mock).mockReturnValueOnce(null);
      (compression.getCompressionStats as jest.Mock).mockReturnValueOnce(null);

      const res = await request(app).get('/api/performance/health').expect(200);

      expect(res.body.database).toEqual({ status: 'no data' });
      expect(res.body.requests).toEqual({ status: 'no data' });
      expect(res.body.compression).toEqual({ status: 'not enabled' });
    });

    it('should summarize real stats when available', async () => {
      (queryOptimizer.getQueryStats as jest.Mock).mockReturnValueOnce({
        totalQueries: 10,
        avgExecutionTime: 5,
        slowQueryPercentage: '2.00',
      });
      (requestLogger.getPerformanceStats as jest.Mock).mockReturnValueOnce({
        totalRequests: 20,
        avgResponseTime: 100,
        errorRate: 5.5,
      });
      (compression.getCompressionStats as jest.Mock).mockReturnValueOnce({
        compressionRatio: '50.00%',
        totalBytesSaved: 1000,
      });

      const res = await request(app).get('/api/performance/health').expect(200);

      expect(res.body.database).toEqual({ totalQueries: 10, avgExecutionTime: 5, slowQueryPercentage: '2.00' });
      expect(res.body.requests).toEqual({ totalRequests: 20, avgResponseTime: '100ms', errorRate: '5.50%' });
      expect(res.body.compression).toEqual({ compressionRatio: '50.00%', totalBytesSaved: 1000 });
    });
  });

  describe('GET /queries', () => {
    it('should return stats, slow queries, and recommendations', async () => {
      (queryOptimizer.getQueryStats as jest.Mock).mockReturnValueOnce({ totalQueries: 1 });
      (queryOptimizer.getSlowQueries as jest.Mock).mockReturnValueOnce([{ query: 'SELECT 1' }]);
      (queryOptimizer.getOptimizationRecommendations as jest.Mock).mockReturnValueOnce(['add index']);

      const res = await request(app).get('/api/performance/queries').expect(200);

      expect(queryOptimizer.getSlowQueries).toHaveBeenCalledWith(10);
      expect(res.body.recommendations).toEqual(['add index']);
    });
  });

  describe('GET /queries/slow', () => {
    it('should default the limit to 20', async () => {
      (queryOptimizer.getSlowQueries as jest.Mock).mockReturnValueOnce([]);

      await request(app).get('/api/performance/queries/slow').expect(200);

      expect(queryOptimizer.getSlowQueries).toHaveBeenCalledWith(20);
    });

    it('should respect a custom limit', async () => {
      (queryOptimizer.getSlowQueries as jest.Mock).mockReturnValueOnce([{ query: 'x' }]);

      const res = await request(app).get('/api/performance/queries/slow?limit=5').expect(200);

      expect(queryOptimizer.getSlowQueries).toHaveBeenCalledWith(5);
      expect(res.body.count).toBe(1);
    });
  });

  describe('GET /queries/n-plus-one', () => {
    it('should report no patterns when the map is empty', async () => {
      (queryOptimizer.detectNPlusOneQueries as jest.Mock).mockReturnValueOnce(new Map());

      const res = await request(app).get('/api/performance/queries/n-plus-one').expect(200);

      expect(res.body.message).toBe('No N+1 query patterns detected');
      expect(res.body.patterns).toEqual([]);
    });

    it('should report detected patterns', async () => {
      const patterns = new Map([['SELECT * FROM chores WHERE id = ?', 12]]);
      (queryOptimizer.detectNPlusOneQueries as jest.Mock).mockReturnValueOnce(patterns);

      const res = await request(app).get('/api/performance/queries/n-plus-one').expect(200);

      expect(res.body.patternsDetected).toBe(1);
      expect(res.body.patterns).toEqual([{ pattern: 'SELECT * FROM chores WHERE id = ?', occurrences: 12 }]);
    });
  });

  describe('GET /requests', () => {
    it('should return request statistics and recent logs', async () => {
      (requestLogger.getPerformanceStats as jest.Mock).mockReturnValueOnce({ totalRequests: 5 });
      (requestLogger.getRecentLogs as jest.Mock).mockReturnValueOnce([{ id: 'r1' }]);
      (requestLogger.getErrorLogs as jest.Mock).mockReturnValueOnce([]);

      const res = await request(app).get('/api/performance/requests').expect(200);

      expect(requestLogger.getRecentLogs).toHaveBeenCalledWith(20);
      expect(requestLogger.getErrorLogs).toHaveBeenCalledWith(10);
      expect(res.body.recentRequests).toEqual([{ id: 'r1' }]);
    });
  });

  describe('GET /compression', () => {
    it('should report no data when compression stats are null', async () => {
      (compression.getCompressionStats as jest.Mock).mockReturnValueOnce(null);

      const res = await request(app).get('/api/performance/compression').expect(200);

      expect(res.body.message).toBe('No compression data available yet');
    });

    it('should return compression stats', async () => {
      (compression.getCompressionStats as jest.Mock).mockReturnValueOnce({ totalRequests: 3 });

      const res = await request(app).get('/api/performance/compression').expect(200);

      expect(res.body.totalRequests).toBe(3);
    });
  });

  describe('GET /indexes', () => {
    it('should return the monitoring queries', async () => {
      (indexes.getIndexMonitoringQueries as jest.Mock).mockReturnValueOnce(['SELECT * FROM pg_indexes']);

      const res = await request(app).get('/api/performance/indexes').expect(200);

      expect(res.body.queries).toEqual(['SELECT * FROM pg_indexes']);
    });
  });

  describe('GET /summary', () => {
    it('should report "good" health when metrics are within thresholds', async () => {
      (queryOptimizer.getQueryStats as jest.Mock).mockReturnValueOnce({ slowQueryPercentage: '2.00' });
      (queryOptimizer.getOptimizationRecommendations as jest.Mock).mockReturnValueOnce([]);
      (queryOptimizer.detectNPlusOneQueries as jest.Mock).mockReturnValueOnce(new Map());
      (requestLogger.getPerformanceStats as jest.Mock).mockReturnValueOnce({ errorRate: 1 });
      (compression.getCompressionStats as jest.Mock).mockReturnValueOnce(null);

      const res = await request(app).get('/api/performance/summary').expect(200);

      expect(res.body.overallHealth).toEqual({ databaseHealth: 'good', requestHealth: 'good' });
    });

    it('should report "needs attention" when thresholds are exceeded', async () => {
      (queryOptimizer.getQueryStats as jest.Mock).mockReturnValueOnce({ slowQueryPercentage: '25.00' });
      (queryOptimizer.getOptimizationRecommendations as jest.Mock).mockReturnValueOnce([]);
      (queryOptimizer.detectNPlusOneQueries as jest.Mock).mockReturnValueOnce(new Map());
      (requestLogger.getPerformanceStats as jest.Mock).mockReturnValueOnce({ errorRate: 12 });
      (compression.getCompressionStats as jest.Mock).mockReturnValueOnce(null);

      const res = await request(app).get('/api/performance/summary').expect(200);

      expect(res.body.overallHealth).toEqual({ databaseHealth: 'needs attention', requestHealth: 'needs attention' });
    });

    it('should report "no data" when nothing has been recorded', async () => {
      (queryOptimizer.getQueryStats as jest.Mock).mockReturnValueOnce(null);
      (queryOptimizer.getOptimizationRecommendations as jest.Mock).mockReturnValueOnce([]);
      (queryOptimizer.detectNPlusOneQueries as jest.Mock).mockReturnValueOnce(new Map());
      (requestLogger.getPerformanceStats as jest.Mock).mockReturnValueOnce(null);
      (compression.getCompressionStats as jest.Mock).mockReturnValueOnce(null);

      const res = await request(app).get('/api/performance/summary').expect(200);

      expect(res.body.overallHealth).toEqual({ databaseHealth: 'no data', requestHealth: 'no data' });
    });
  });

  describe('POST /index-sql', () => {
    it('should return generated SQL for a table', async () => {
      (indexes.getIndexSQL as jest.Mock).mockReturnValueOnce('CREATE INDEX ...');

      const res = await request(app).post('/api/performance/index-sql').send({ table: 'chores' }).expect(200);

      expect(indexes.getIndexSQL).toHaveBeenCalledWith('chores');
      expect(res.body.sql).toBe('CREATE INDEX ...');
    });

    it('should return 500 when SQL generation throws', async () => {
      (indexes.getIndexSQL as jest.Mock).mockImplementationOnce(() => {
        throw new Error('unknown table');
      });

      const res = await request(app).post('/api/performance/index-sql').send({ table: 'bogus' }).expect(500);

      expect(res.body.error).toBe('Failed to generate index SQL');
    });
  });
});
