/**
 * Performance Monitoring Routes
 * Real-time performance metrics and diagnostics
 */

import { Router, Request, Response } from 'express';
import {
  getQueryStats,
  getSlowQueries,
  getOptimizationRecommendations,
  detectNPlusOneQueries
} from '../utils/query-optimizer';
import {
  getRecentLogs,
  getErrorLogs,
  getPerformanceStats
} from '../middleware/request-logger';
import { getCompressionStats } from '../middleware/compression';
import { getIndexMonitoringQueries } from '../database/indexes';

const router = Router();

/**
 * GET /performance/health
 * Overall system health check
 */
router.get('/health', (req: Request, res: Response) => {
  const queryStats = getQueryStats();
  const requestStats = getPerformanceStats();
  const compressionStats = getCompressionStats();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: queryStats
      ? {
          totalQueries: queryStats.totalQueries,
          avgExecutionTime: queryStats.avgExecutionTime,
          slowQueryPercentage: queryStats.slowQueryPercentage
        }
      : { status: 'no data' },
    requests: requestStats
      ? {
          totalRequests: requestStats.totalRequests,
          avgResponseTime: requestStats.avgResponseTime + 'ms',
          errorRate: requestStats.errorRate.toFixed(2) + '%'
        }
      : { status: 'no data' },
    compression: compressionStats
      ? {
          compressionRatio: compressionStats.compressionRatio,
          totalBytesSaved: compressionStats.totalBytesSaved
        }
      : { status: 'not enabled' }
  };

  res.json(health);
});

/**
 * GET /performance/queries
 * Query performance statistics
 */
router.get('/queries', (req: Request, res: Response) => {
  const stats = getQueryStats();
  const slowQueries = getSlowQueries(10);
  const recommendations = getOptimizationRecommendations();

  res.json({
    statistics: stats,
    slowQueries,
    recommendations
  });
});

/**
 * GET /performance/queries/slow
 * Get slow queries
 */
router.get('/queries/slow', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const slowQueries = getSlowQueries(limit);

  res.json({
    count: slowQueries.length,
    queries: slowQueries
  });
});

/**
 * GET /performance/queries/n-plus-one
 * Detect N+1 query patterns
 */
router.get('/queries/n-plus-one', (req: Request, res: Response) => {
  const patterns = detectNPlusOneQueries();

  if (patterns.size === 0) {
    return res.json({
      message: 'No N+1 query patterns detected',
      patterns: []
    });
  }

  res.json({
    patternsDetected: patterns.size,
    patterns: Array.from(patterns.entries()).map(([pattern, count]) => ({
      pattern,
      occurrences: count
    }))
  });
});

/**
 * GET /performance/requests
 * Request performance statistics
 */
router.get('/requests', (req: Request, res: Response) => {
  const stats = getPerformanceStats();
  const recent = getRecentLogs(20);
  const errors = getErrorLogs(10);

  res.json({
    statistics: stats,
    recentRequests: recent,
    recentErrors: errors
  });
});

/**
 * GET /performance/compression
 * Response compression statistics
 */
router.get('/compression', (req: Request, res: Response) => {
  const stats = getCompressionStats();

  if (!stats) {
    return res.json({
      message: 'No compression data available yet'
    });
  }

  res.json(stats);
});

/**
 * GET /performance/indexes
 * Database index recommendations
 */
router.get('/indexes', (req: Request, res: Response) => {
  const queries = getIndexMonitoringQueries();

  res.json({
    message:
      'Run these queries in your database to monitor index performance:',
    queries
  });
});

/**
 * GET /performance/summary
 * Complete performance summary
 */
router.get('/summary', (req: Request, res: Response) => {
  const queryStats = getQueryStats();
  const requestStats = getPerformanceStats();
  const compressionStats = getCompressionStats();

  const summary = {
    timestamp: new Date().toISOString(),
    database: {
      queries: queryStats,
      recommendations: getOptimizationRecommendations(),
      nPlusOnePatterns: detectNPlusOneQueries().size
    },
    requests: requestStats,
    compression: compressionStats,
    overallHealth: {
      databaseHealth: queryStats
        ? parseFloat(queryStats.slowQueryPercentage) < 10
          ? 'good'
          : 'needs attention'
        : 'no data',
      requestHealth: requestStats
        ? requestStats.errorRate < 5
          ? 'good'
          : 'needs attention'
        : 'no data'
    }
  };

  res.json(summary);
});

/**
 * POST /performance/index-sql
 * Generate SQL to create recommended indexes
 */
router.post('/index-sql', (req: Request, res: Response) => {
  const { table } = req.body;

  try {
    const { getIndexSQL } = require('../database/indexes');
    const sql = getIndexSQL(table);

    res.json({
      sql,
      message: 'Copy and run this SQL in your database to create recommended indexes'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to generate index SQL',
      message: error.message
    });
  }
});

export default router;
