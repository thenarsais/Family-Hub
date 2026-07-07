"use strict";
/**
 * Performance Monitoring Routes
 * Real-time performance metrics and diagnostics
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const query_optimizer_1 = require("../utils/query-optimizer");
const request_logger_1 = require("../middleware/request-logger");
const compression_1 = require("../middleware/compression");
const indexes_1 = require("../database/indexes");
const router = (0, express_1.Router)();
/**
 * GET /performance/health
 * Overall system health check
 */
router.get('/health', (req, res) => {
    const queryStats = (0, query_optimizer_1.getQueryStats)();
    const requestStats = (0, request_logger_1.getPerformanceStats)();
    const compressionStats = (0, compression_1.getCompressionStats)();
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
router.get('/queries', (req, res) => {
    const stats = (0, query_optimizer_1.getQueryStats)();
    const slowQueries = (0, query_optimizer_1.getSlowQueries)(10);
    const recommendations = (0, query_optimizer_1.getOptimizationRecommendations)();
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
router.get('/queries/slow', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const slowQueries = (0, query_optimizer_1.getSlowQueries)(limit);
    res.json({
        count: slowQueries.length,
        queries: slowQueries
    });
});
/**
 * GET /performance/queries/n-plus-one
 * Detect N+1 query patterns
 */
router.get('/queries/n-plus-one', (req, res) => {
    const patterns = (0, query_optimizer_1.detectNPlusOneQueries)();
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
router.get('/requests', (req, res) => {
    const stats = (0, request_logger_1.getPerformanceStats)();
    const recent = (0, request_logger_1.getRecentLogs)(20);
    const errors = (0, request_logger_1.getErrorLogs)(10);
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
router.get('/compression', (req, res) => {
    const stats = (0, compression_1.getCompressionStats)();
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
router.get('/indexes', (req, res) => {
    const queries = (0, indexes_1.getIndexMonitoringQueries)();
    res.json({
        message: 'Run these queries in your database to monitor index performance:',
        queries
    });
});
/**
 * GET /performance/summary
 * Complete performance summary
 */
router.get('/summary', (req, res) => {
    const queryStats = (0, query_optimizer_1.getQueryStats)();
    const requestStats = (0, request_logger_1.getPerformanceStats)();
    const compressionStats = (0, compression_1.getCompressionStats)();
    const summary = {
        timestamp: new Date().toISOString(),
        database: {
            queries: queryStats,
            recommendations: (0, query_optimizer_1.getOptimizationRecommendations)(),
            nPlusOnePatterns: (0, query_optimizer_1.detectNPlusOneQueries)().size
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
router.post('/index-sql', (req, res) => {
    const { table } = req.body;
    try {
        const { getIndexSQL } = require('../database/indexes');
        const sql = getIndexSQL(table);
        res.json({
            sql,
            message: 'Copy and run this SQL in your database to create recommended indexes'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to generate index SQL',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=performance.js.map