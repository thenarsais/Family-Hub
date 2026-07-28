/**
 * Query Optimization Utilities
 * Tools for optimizing database queries
 */
export interface QueryProfile {
    query: string;
    executionTime: number;
    rowsAffected: number;
    timestamp: string;
    slow: boolean;
}
/**
 * Profile a query execution
 */
export declare function profileQuery(query: string, executionTime: number, rowsAffected?: number): QueryProfile;
/**
 * Get slow queries
 */
export declare function getSlowQueries(limit?: number): QueryProfile[];
/**
 * Get query statistics
 */
export declare function getQueryStats(): {
    totalQueries: number;
    slowQueries: number;
    slowQueryPercentage: string;
    avgExecutionTime: string;
    maxExecutionTime: string;
    totalRowsAffected: number;
    avgRowsPerQuery: string;
} | null;
/**
 * Query optimization recommendations
 */
export declare function getOptimizationRecommendations(): string[];
/**
 * Clear profiling data
 */
export declare function clearQueryProfiles(): void;
/**
 * Batch query optimization
 */
export declare function optimizeBatchQueries(queries: string[]): string[];
/**
 * Get N+1 query detection
 */
export declare function detectNPlusOneQueries(): Map<string, number>;
declare const _default: {
    profileQuery: typeof profileQuery;
    getSlowQueries: typeof getSlowQueries;
    getQueryStats: typeof getQueryStats;
    getOptimizationRecommendations: typeof getOptimizationRecommendations;
    detectNPlusOneQueries: typeof detectNPlusOneQueries;
    clearQueryProfiles: typeof clearQueryProfiles;
};
export default _default;
//# sourceMappingURL=query-optimizer.d.ts.map