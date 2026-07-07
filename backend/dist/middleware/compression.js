"use strict";
/**
 * Response Compression Middleware
 * Compresses responses for faster transfer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressionPresets = void 0;
exports.compression = compression;
exports.getCompressionStats = getCompressionStats;
exports.clearCompressionMetrics = clearCompressionMetrics;
const zlib_1 = require("zlib");
const metrics = [];
/**
 * Compression middleware
 */
function compression(options = {}) {
    const level = options.level || 6;
    const threshold = options.threshold || 1024; // 1KB
    const minRatio = options.minRatio || 0.8;
    const algorithm = options.algorithm || 'auto';
    return (req, res, next) => {
        // Check if client accepts compression
        const acceptEncoding = (req.get('accept-encoding') || '').toLowerCase();
        const shouldCompress = acceptEncoding.includes('gzip') ||
            acceptEncoding.includes('br') ||
            acceptEncoding.includes('deflate');
        if (!shouldCompress) {
            return next();
        }
        // Override res.json to compress response
        const originalJson = res.json.bind(res);
        res.json = function (data) {
            const jsonString = JSON.stringify(data);
            const originalSize = Buffer.byteLength(jsonString);
            // Don't compress small responses
            if (originalSize < threshold) {
                res.set('Content-Length', originalSize.toString());
                return originalJson(data);
            }
            // Determine compression algorithm
            let compressed;
            let usedAlgorithm = 'none';
            try {
                if ((algorithm === 'auto' && acceptEncoding.includes('gzip')) ||
                    algorithm === 'gzip') {
                    compressed = (0, zlib_1.gzipSync)(jsonString, { level });
                    usedAlgorithm = 'gzip';
                }
                else if ((algorithm === 'auto' && acceptEncoding.includes('br')) ||
                    algorithm === 'br') {
                    compressed = (0, zlib_1.brotliCompressSync)(jsonString, { lgwin: 22 });
                    usedAlgorithm = 'br';
                }
                else {
                    return originalJson(data);
                }
                const compressedSize = compressed.length;
                const ratio = compressedSize / originalSize;
                // Only use compression if ratio is good
                if (ratio >= minRatio) {
                    return originalJson(data);
                }
                // Track metrics
                const metric = {
                    originalSize,
                    compressedSize,
                    algorithm: usedAlgorithm,
                    ratio: parseFloat(ratio.toFixed(2)),
                    saved: originalSize - compressedSize
                };
                metrics.push(metric);
                if (metrics.length > 1000) {
                    metrics.shift();
                }
                // Send compressed response
                res.set('Content-Encoding', usedAlgorithm);
                res.set('Content-Length', compressedSize.toString());
                res.set('X-Original-Size', originalSize.toString());
                res.set('X-Compression-Ratio', (ratio * 100).toFixed(1) + '%');
                res.set('X-Compression-Saved', metric.saved.toString());
                return res.send(compressed);
            }
            catch (error) {
                console.error('Compression error:', error);
                return originalJson(data);
            }
        };
        next();
    };
}
/**
 * Get compression statistics
 */
function getCompressionStats() {
    if (metrics.length === 0) {
        return null;
    }
    const totalOriginal = metrics.reduce((sum, m) => sum + m.originalSize, 0);
    const totalCompressed = metrics.reduce((sum, m) => sum + m.compressedSize, 0);
    const totalSaved = totalOriginal - totalCompressed;
    const avgRatio = (totalCompressed / totalOriginal) * 100;
    // Group by algorithm
    const byAlgorithm = new Map();
    for (const metric of metrics) {
        const existing = byAlgorithm.get(metric.algorithm) || { count: 0, saved: 0 };
        byAlgorithm.set(metric.algorithm, {
            count: existing.count + 1,
            saved: existing.saved + metric.saved
        });
    }
    return {
        totalRequests: metrics.length,
        totalOriginalBytes: totalOriginal,
        totalCompressedBytes: totalCompressed,
        totalBytesSaved: totalSaved,
        compressionRatio: avgRatio.toFixed(2) + '%',
        avgSavedPerRequest: (totalSaved / metrics.length).toFixed(0) + ' bytes',
        byAlgorithm: Object.fromEntries(byAlgorithm)
    };
}
/**
 * Clear compression metrics
 */
function clearCompressionMetrics() {
    metrics.length = 0;
}
/**
 * Express compression preset
 */
exports.compressionPresets = {
    // Standard compression
    standard: {
        level: 6,
        threshold: 1024,
        minRatio: 0.8,
        algorithm: 'auto'
    },
    // Aggressive compression (slower)
    aggressive: {
        level: 9,
        threshold: 512,
        minRatio: 0.75,
        algorithm: 'auto'
    },
    // Light compression (faster)
    light: {
        level: 3,
        threshold: 2048,
        minRatio: 0.85,
        algorithm: 'auto'
    },
    // Brotli only (best compression, slower)
    brotli: {
        level: 6,
        threshold: 1024,
        minRatio: 0.8,
        algorithm: 'br'
    },
    // Gzip only (fast, good compression)
    gzip: {
        level: 6,
        threshold: 1024,
        minRatio: 0.8,
        algorithm: 'gzip'
    }
};
exports.default = {
    compression,
    getCompressionStats,
    clearCompressionMetrics,
    compressionPresets: exports.compressionPresets
};
//# sourceMappingURL=compression.js.map