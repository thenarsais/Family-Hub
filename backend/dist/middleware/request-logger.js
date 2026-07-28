"use strict";
/**
 * Request Logging Middleware
 * Tracks API usage, performance, and errors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
exports.getRecentLogs = getRecentLogs;
exports.getLogsByPath = getLogsByPath;
exports.getLogsByStatus = getLogsByStatus;
exports.getErrorLogs = getErrorLogs;
exports.getPerformanceStats = getPerformanceStats;
exports.clearLogs = clearLogs;
// In-memory log storage (in production, use a proper logging service)
const logs = [];
const MAX_LOGS = 1000; // Keep last 1000 logs
/**
 * Generate unique request ID
 */
function generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Get client IP address
 */
function getClientIp(req) {
    return (req.ip ||
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        req.connection.remoteAddress ||
        'unknown').split(',')[0];
}
/**
 * Request logger middleware
 */
function requestLogger() {
    return (req, res, next) => {
        const requestId = generateRequestId();
        const startTime = Date.now();
        // Attach request ID to response
        res.set('X-Request-ID', requestId);
        // Override res.send to capture response
        const originalSend = res.send;
        res.send = function (data) {
            const responseTime = Date.now() - startTime;
            const ip = getClientIp(req);
            const log = {
                id: requestId,
                timestamp: new Date().toISOString(),
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                responseTime,
                userId: req.userId,
                userAgent: req.get('user-agent'),
                ip,
                requestSize: req.get('content-length') ? parseInt(req.get('content-length')) : undefined,
                responseSize: Buffer.byteLength(typeof data === 'string' ? data : JSON.stringify(data))
            };
            // Log to console in development
            if (process.env.ENVIRONMENT === 'development') {
                const color = res.statusCode >= 500
                    ? '\x1b[31m' // red
                    : res.statusCode >= 400
                        ? '\x1b[33m' // yellow
                        : '\x1b[32m'; // green
                const reset = '\x1b[0m';
                console.log(`${color}${log.method} ${log.path} ${log.statusCode} ${log.responseTime}ms${reset}`);
            }
            // Store log
            addLog(log);
            return originalSend.call(this, data);
        };
        next();
    };
}
/**
 * Add log to storage (with max limit)
 */
function addLog(log) {
    logs.push(log);
    if (logs.length > MAX_LOGS) {
        logs.shift();
    }
}
/**
 * Get recent logs
 */
function getRecentLogs(limit = 50) {
    return logs.slice(-limit).reverse();
}
/**
 * Get logs by path
 */
function getLogsByPath(path, limit = 50) {
    return logs
        .filter((log) => log.path.includes(path))
        .slice(-limit)
        .reverse();
}
/**
 * Get logs by status code
 */
function getLogsByStatus(statusCode, limit = 50) {
    return logs
        .filter((log) => log.statusCode === statusCode)
        .slice(-limit)
        .reverse();
}
/**
 * Get error logs
 */
function getErrorLogs(limit = 50) {
    return logs
        .filter((log) => log.statusCode >= 400)
        .slice(-limit)
        .reverse();
}
/**
 * Get performance stats
 */
function getPerformanceStats() {
    if (logs.length === 0) {
        return null;
    }
    const responseTimes = logs.map((log) => log.responseTime);
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    return {
        totalRequests: logs.length,
        avgResponseTime: Math.round(avg),
        medianResponseTime: median,
        p95ResponseTime: p95,
        p99ResponseTime: p99,
        slowestRequests: logs
            .sort((a, b) => b.responseTime - a.responseTime)
            .slice(0, 5)
            .map((log) => ({
            path: log.path,
            method: log.method,
            responseTime: log.responseTime,
            statusCode: log.statusCode
        })),
        errorRate: (logs.filter((log) => log.statusCode >= 400).length / logs.length) * 100
    };
}
/**
 * Clear logs
 */
function clearLogs() {
    logs.length = 0;
}
exports.default = {
    requestLogger,
    getRecentLogs,
    getLogsByPath,
    getLogsByStatus,
    getErrorLogs,
    getPerformanceStats,
    clearLogs
};
//# sourceMappingURL=request-logger.js.map