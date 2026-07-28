/**
 * Readiness Checks
 * Verify system is ready to serve traffic
 */
export interface HealthCheck {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
    responseTime?: number;
}
export interface ReadinessStatus {
    ready: boolean;
    timestamp: string;
    checks: HealthCheck[];
    summary: {
        total: number;
        healthy: number;
        degraded: number;
        unhealthy: number;
    };
}
/**
 * Check database connectivity
 */
export declare function checkDatabase(): Promise<HealthCheck>;
/**
 * Check cache connectivity
 */
export declare function checkCache(): Promise<HealthCheck>;
/**
 * Check external API connectivity
 */
export declare function checkExternalApis(): Promise<HealthCheck>;
/**
 * Check required environment variables
 */
export declare function checkEnvironmentVariables(): HealthCheck;
/**
 * Check memory usage
 */
export declare function checkMemory(): HealthCheck;
/**
 * Run all readiness checks
 */
export declare function runReadinessChecks(): Promise<ReadinessStatus>;
/**
 * Quick liveness check (is process running)
 */
export declare function isAlive(): boolean;
declare const _default: {
    checkDatabase: typeof checkDatabase;
    checkCache: typeof checkCache;
    checkExternalApis: typeof checkExternalApis;
    checkEnvironmentVariables: typeof checkEnvironmentVariables;
    checkMemory: typeof checkMemory;
    runReadinessChecks: typeof runReadinessChecks;
    isAlive: typeof isAlive;
};
export default _default;
//# sourceMappingURL=readiness.d.ts.map