/**
 * Response Compression Middleware
 * Compresses responses for faster transfer
 */
import { Request, Response, NextFunction } from 'express';
export interface CompressionOptions {
    level?: number;
    threshold?: number;
    minRatio?: number;
    algorithm?: 'gzip' | 'br' | 'deflate' | 'auto';
}
/**
 * Compression middleware
 */
export declare function compression(options?: CompressionOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get compression statistics
 */
export declare function getCompressionStats(): {
    totalRequests: number;
    totalOriginalBytes: number;
    totalCompressedBytes: number;
    totalBytesSaved: number;
    compressionRatio: string;
    avgSavedPerRequest: string;
    byAlgorithm: {
        [k: string]: {
            count: number;
            saved: number;
        };
    };
} | null;
/**
 * Clear compression metrics
 */
export declare function clearCompressionMetrics(): void;
/**
 * Express compression preset
 */
export declare const compressionPresets: {
    standard: {
        level: number;
        threshold: number;
        minRatio: number;
        algorithm: "auto";
    };
    aggressive: {
        level: number;
        threshold: number;
        minRatio: number;
        algorithm: "auto";
    };
    light: {
        level: number;
        threshold: number;
        minRatio: number;
        algorithm: "auto";
    };
    brotli: {
        level: number;
        threshold: number;
        minRatio: number;
        algorithm: "br";
    };
    gzip: {
        level: number;
        threshold: number;
        minRatio: number;
        algorithm: "gzip";
    };
};
declare const _default: {
    compression: typeof compression;
    getCompressionStats: typeof getCompressionStats;
    clearCompressionMetrics: typeof clearCompressionMetrics;
    compressionPresets: {
        standard: {
            level: number;
            threshold: number;
            minRatio: number;
            algorithm: "auto";
        };
        aggressive: {
            level: number;
            threshold: number;
            minRatio: number;
            algorithm: "auto";
        };
        light: {
            level: number;
            threshold: number;
            minRatio: number;
            algorithm: "auto";
        };
        brotli: {
            level: number;
            threshold: number;
            minRatio: number;
            algorithm: "br";
        };
        gzip: {
            level: number;
            threshold: number;
            minRatio: number;
            algorithm: "gzip";
        };
    };
};
export default _default;
//# sourceMappingURL=compression.d.ts.map