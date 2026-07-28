/**
 * Environment Configuration
 * Centralized configuration for all environments
 */
export interface EnvironmentConfig {
    environment: 'development' | 'staging' | 'production';
    nodeEnv: string;
    port: number;
    apiUrl: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    database: {
        url: string;
        poolSize: number;
        connectionTimeout: number;
        idleTimeout: number;
    };
    redis: {
        url: string;
        ttl: number;
    };
    supabase: {
        url: string;
        serviceRoleKey: string;
    };
    cors: {
        origins: string[];
        credentials: boolean;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    compression: {
        enabled: boolean;
        level: number;
        threshold: number;
    };
    security: {
        jwtSecret: string;
        bcryptRounds: number;
        allowedOrigins: string[];
    };
}
declare const config: EnvironmentConfig;
export default config;
//# sourceMappingURL=environment.d.ts.map