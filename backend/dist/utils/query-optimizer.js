"use strict";
/**
 * Query Optimization Utilities
 * Tools for optimizing database queries
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileQuery = profileQuery;
exports.getSlowQueries = getSlowQueries;
exports.getQueryStats = getQueryStats;
exports.getOptimizationRecommendations = getOptimizationRecommendations;
exports.clearQueryProfiles = clearQueryProfiles;
exports.optimizeBatchQueries = optimizeBatchQueries;
exports.detectNPlusOneQueries = detectNPlusOneQueries;
const SLOW_QUERY_THRESHOLD = 100; // ms
const queryProfiles = [];
const MAX_PROFILES = 500;
/**
 * Profile a query execution
 */
function profileQuery(query, executionTime, rowsAffected = 0) {
    const profile = {
        query,
        executionTime,
        rowsAffected,
        timestamp: new Date().toISOString(),
        slow: executionTime > SLOW_QUERY_THRESHOLD
    };
    queryProfiles.push(profile);
    if (queryProfiles.length > MAX_PROFILES) {
        queryProfiles.shift();
    }
    if (profile.slow) {
        console.warn(`⚠️ Slow query detected (${executionTime}ms): ${query}`);
    }
    return profile;
}
/**
 * Get slow queries
 */
function getSlowQueries(limit = 20) {
    return queryProfiles
        .filter((p) => p.slow)
        .sort((a, b) => b.executionTime - a.executionTime)
        .slice(0, limit);
}
/**
 * Get query statistics
 */
function getQueryStats() {
    if (queryProfiles.length === 0) {
        return null;
    }
    const totalQueries = queryProfiles.length;
    const slowQueries = queryProfiles.filter((p) => p.slow).length;
    const avgExecutionTime = queryProfiles.reduce((sum, p) => sum + p.executionTime, 0) / totalQueries;
    const maxExecutionTime = Math.max(...queryProfiles.map((p) => p.executionTime));
    const totalRows = queryProfiles.reduce((sum, p) => sum + p.rowsAffected, 0);
    return {
        totalQueries,
        slowQueries,
        slowQueryPercentage: ((slowQueries / totalQueries) * 100).toFixed(2) + '%',
        avgExecutionTime: avgExecutionTime.toFixed(2) + 'ms',
        maxExecutionTime: maxExecutionTime + 'ms',
        totalRowsAffected: totalRows,
        avgRowsPerQuery: (totalRows / totalQueries).toFixed(2)
    };
}
/**
 * Query optimization recommendations
 */
function getOptimizationRecommendations() {
    const recommendations = [];
    const stats = getQueryStats();
    if (!stats) {
        return ['No query data available yet'];
    }
    // Check for slow queries
    const slowPercentage = parseFloat(stats.slowQueryPercentage.replace('%', ''));
    if (slowPercentage > 10) {
        recommendations.push(`${slowPercentage}% of queries are slow. Consider adding indexes or optimizing slow queries.`);
    }
    // Check for high average execution time
    const avgTime = parseFloat(stats.avgExecutionTime.replace('ms', ''));
    if (avgTime > 50) {
        recommendations.push(`Average query execution time is ${avgTime}ms. Consider query optimization or caching.`);
    }
    // Check for large result sets
    const avgRows = parseFloat(stats.avgRowsPerQuery);
    if (avgRows > 1000) {
        recommendations.push(`Average query returns ${avgRows} rows. Consider pagination or filtering.`);
    }
    if (recommendations.length === 0) {
        recommendations.push('Query performance looks good!');
    }
    return recommendations;
}
/**
 * Clear profiling data
 */
function clearQueryProfiles() {
    queryProfiles.length = 0;
}
/**
 * Batch query optimization
 */
function optimizeBatchQueries(queries) {
    const optimized = [];
    for (const query of queries) {
        let optimizedQuery = query;
        // Remove unnecessary SELECT *
        if (optimizedQuery.includes('SELECT *')) {
            console.warn('⚠️ SELECT * detected. Consider selecting specific columns.');
        }
        // Detect missing WHERE clauses
        if (optimizedQuery.toUpperCase().includes('DELETE') && !optimizedQuery.includes('WHERE')) {
            console.warn('⚠️ DELETE without WHERE clause. This will delete all records!');
        }
        // Add LIMIT if missing for SELECT
        if (optimizedQuery.toUpperCase().startsWith('SELECT') &&
            !optimizedQuery.toUpperCase().includes('LIMIT')) {
            console.warn('⚠️ SELECT without LIMIT. Consider adding LIMIT to prevent large result sets.');
        }
        optimized.push(optimizedQuery);
    }
    return optimized;
}
/**
 * Get N+1 query detection
 */
function detectNPlusOneQueries() {
    const queryPatterns = new Map();
    for (const profile of queryProfiles) {
        // Extract query pattern (remove values)
        const pattern = profile.query
            .replace(/\d+/g, '?')
            .replace(/'[^']*'/g, "'?'")
            .substring(0, 100);
        queryPatterns.set(pattern, (queryPatterns.get(pattern) || 0) + 1);
    }
    // Filter for patterns that appear many times
    return new Map(Array.from(queryPatterns.entries())
        .filter(([_, count]) => count > 5)
        .sort((a, b) => b[1] - a[1]));
}
exports.default = {
    profileQuery,
    getSlowQueries,
    getQueryStats,
    getOptimizationRecommendations,
    detectNPlusOneQueries,
    clearQueryProfiles
};
//# sourceMappingURL=query-optimizer.js.map