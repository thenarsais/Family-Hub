/**
 * Database Indexing Strategies
 * Index definitions and optimization recommendations
 */
export interface IndexDefinition {
    name: string;
    table: string;
    columns: string[];
    unique?: boolean;
    partial?: string;
    description: string;
}
/**
 * Recommended indexes for optimal performance
 */
export declare const recommendedIndexes: IndexDefinition[];
/**
 * SQL to create all recommended indexes
 */
export declare function generateCreateIndexSQL(): string[];
/**
 * Get index creation statements
 */
export declare function getIndexSQL(tableName?: string): string;
/**
 * Index optimization recommendations
 */
export declare const indexOptimizations: {
    selectOptimization: string;
    joinOptimization: string;
    timeRangeOptimization: string;
    aggregationOptimization: string;
};
/**
 * Database statistics for monitoring
 */
export interface IndexStats {
    indexName: string;
    table: string;
    sizeBytes: number;
    usageCount: number;
    lastUsed?: string;
    recommendedAction?: string;
}
/**
 * Get monitoring queries for indexes
 */
export declare function getIndexMonitoringQueries(): Record<string, string>;
declare const _default: {
    recommendedIndexes: IndexDefinition[];
    generateCreateIndexSQL: typeof generateCreateIndexSQL;
    getIndexSQL: typeof getIndexSQL;
    indexOptimizations: {
        selectOptimization: string;
        joinOptimization: string;
        timeRangeOptimization: string;
        aggregationOptimization: string;
    };
    getIndexMonitoringQueries: typeof getIndexMonitoringQueries;
};
export default _default;
//# sourceMappingURL=indexes.d.ts.map