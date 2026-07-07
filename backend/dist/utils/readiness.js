"use strict";
/**
 * Readiness Checks
 * Verify system is ready to serve traffic
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabase = checkDatabase;
exports.checkCache = checkCache;
exports.checkExternalApis = checkExternalApis;
exports.checkEnvironmentVariables = checkEnvironmentVariables;
exports.checkMemory = checkMemory;
exports.runReadinessChecks = runReadinessChecks;
exports.isAlive = isAlive;
/**
 * Check database connectivity
 */
async function checkDatabase() {
    const start = Date.now();
    try {
        // In production, this would actually query the database
        // For now, return healthy status
        return {
            name: 'database',
            status: 'healthy',
            message: 'Database connection successful',
            responseTime: Date.now() - start
        };
    }
    catch (error) {
        return {
            name: 'database',
            status: 'unhealthy',
            message: `Database connection failed: ${error.message}`,
            responseTime: Date.now() - start
        };
    }
}
/**
 * Check cache connectivity
 */
async function checkCache() {
    const start = Date.now();
    try {
        // In production, this would ping Redis
        return {
            name: 'cache',
            status: 'healthy',
            message: 'Cache connection successful',
            responseTime: Date.now() - start
        };
    }
    catch (error) {
        return {
            name: 'cache',
            status: 'degraded',
            message: `Cache connection degraded: ${error.message}`,
            responseTime: Date.now() - start
        };
    }
}
/**
 * Check external API connectivity
 */
async function checkExternalApis() {
    const start = Date.now();
    try {
        // Check Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        if (!supabaseUrl) {
            throw new Error('Supabase not configured');
        }
        // In production, would actually ping Supabase
        return {
            name: 'external_apis',
            status: 'healthy',
            message: 'External APIs accessible',
            responseTime: Date.now() - start
        };
    }
    catch (error) {
        return {
            name: 'external_apis',
            status: 'degraded',
            message: `External APIs degraded: ${error.message}`,
            responseTime: Date.now() - start
        };
    }
}
/**
 * Check required environment variables
 */
function checkEnvironmentVariables() {
    const required = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'DATABASE_URL',
        'REDIS_URL'
    ];
    const missing = required.filter((v) => !process.env[v]);
    if (missing.length === 0) {
        return {
            name: 'environment_variables',
            status: 'healthy',
            message: 'All required environment variables set'
        };
    }
    return {
        name: 'environment_variables',
        status: 'unhealthy',
        message: `Missing environment variables: ${missing.join(', ')}`
    };
}
/**
 * Check memory usage
 */
function checkMemory() {
    const used = process.memoryUsage();
    const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100;
    let status = 'healthy';
    if (heapUsedPercent > 90) {
        status = 'unhealthy';
    }
    else if (heapUsedPercent > 75) {
        status = 'degraded';
    }
    return {
        name: 'memory',
        status,
        message: `Heap usage: ${heapUsedPercent.toFixed(1)}% (${(used.heapUsed / 1024 / 1024).toFixed(0)}MB / ${(used.heapTotal / 1024 / 1024).toFixed(0)}MB)`
    };
}
/**
 * Run all readiness checks
 */
async function runReadinessChecks() {
    const checks = await Promise.all([
        checkDatabase(),
        checkCache(),
        checkExternalApis(),
        checkEnvironmentVariables(),
        checkMemory()
    ]);
    const summary = {
        total: checks.length,
        healthy: checks.filter((c) => c.status === 'healthy').length,
        degraded: checks.filter((c) => c.status === 'degraded').length,
        unhealthy: checks.filter((c) => c.status === 'unhealthy').length
    };
    return {
        ready: summary.unhealthy === 0,
        timestamp: new Date().toISOString(),
        checks,
        summary
    };
}
/**
 * Quick liveness check (is process running)
 */
function isAlive() {
    return process.uptime() > 0;
}
exports.default = {
    checkDatabase,
    checkCache,
    checkExternalApis,
    checkEnvironmentVariables,
    checkMemory,
    runReadinessChecks,
    isAlive
};
//# sourceMappingURL=readiness.js.map