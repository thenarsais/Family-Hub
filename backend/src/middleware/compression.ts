/**
 * Response Compression Middleware
 * Compresses responses for faster transfer
 */

import { Request, Response, NextFunction } from 'express';
import { gzipSync, brotliCompressSync } from 'zlib';

export interface CompressionOptions {
  level?: number; // Compression level (0-9, default 6)
  threshold?: number; // Min response size to compress (bytes, default 1KB)
  minRatio?: number; // Min compression ratio (default 0.8)
  algorithm?: 'gzip' | 'br' | 'deflate' | 'auto';
}

/**
 * Compression metrics
 */
interface CompressionMetrics {
  originalSize: number;
  compressedSize: number;
  algorithm: string;
  ratio: number;
  saved: number;
}

const metrics: CompressionMetrics[] = [];

/**
 * Compression middleware
 */
export function compression(options: CompressionOptions = {}) {
  const level = options.level || 6;
  const threshold = options.threshold || 1024; // 1KB
  const minRatio = options.minRatio || 0.8;
  const algorithm = options.algorithm || 'auto';

  return (req: Request, res: Response, next: NextFunction) => {
    // Check if client accepts compression
    const acceptEncoding = (req.get('accept-encoding') || '').toLowerCase();
    const shouldCompress =
      acceptEncoding.includes('gzip') ||
      acceptEncoding.includes('br') ||
      acceptEncoding.includes('deflate');

    if (!shouldCompress) {
      return next();
    }

    // Override res.json to compress response
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      const jsonString = JSON.stringify(data);
      const originalSize = Buffer.byteLength(jsonString);

      // Don't compress small responses
      if (originalSize < threshold) {
        res.set('Content-Length', originalSize.toString());
        return originalJson(data);
      }

      // Determine compression algorithm
      let compressed: Buffer;
      let usedAlgorithm = 'none';

      try {
        if (
          (algorithm === 'auto' && acceptEncoding.includes('gzip')) ||
          algorithm === 'gzip'
        ) {
          compressed = gzipSync(jsonString, { level });
          usedAlgorithm = 'gzip';
        } else if (
          (algorithm === 'auto' && acceptEncoding.includes('br')) ||
          algorithm === 'br'
        ) {
          compressed = brotliCompressSync(jsonString, { lgwin: 22 } as any);
          usedAlgorithm = 'br';
        } else {
          return originalJson(data);
        }

        const compressedSize = compressed.length;
        const ratio = compressedSize / originalSize;

        // Only use compression if ratio is good
        if (ratio >= minRatio) {
          return originalJson(data);
        }

        // Track metrics
        const metric: CompressionMetrics = {
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
      } catch (error) {
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
export function getCompressionStats() {
  if (metrics.length === 0) {
    return null;
  }

  const totalOriginal = metrics.reduce((sum, m) => sum + m.originalSize, 0);
  const totalCompressed = metrics.reduce((sum, m) => sum + m.compressedSize, 0);
  const totalSaved = totalOriginal - totalCompressed;
  const avgRatio = (totalCompressed / totalOriginal) * 100;

  // Group by algorithm
  const byAlgorithm = new Map<string, { count: number; saved: number }>();
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
export function clearCompressionMetrics() {
  metrics.length = 0;
}

/**
 * Express compression preset
 */
export const compressionPresets = {
  // Standard compression
  standard: {
    level: 6,
    threshold: 1024,
    minRatio: 0.8,
    algorithm: 'auto' as const
  },

  // Aggressive compression (slower)
  aggressive: {
    level: 9,
    threshold: 512,
    minRatio: 0.75,
    algorithm: 'auto' as const
  },

  // Light compression (faster)
  light: {
    level: 3,
    threshold: 2048,
    minRatio: 0.85,
    algorithm: 'auto' as const
  },

  // Brotli only (best compression, slower)
  brotli: {
    level: 6,
    threshold: 1024,
    minRatio: 0.8,
    algorithm: 'br' as const
  },

  // Gzip only (fast, good compression)
  gzip: {
    level: 6,
    threshold: 1024,
    minRatio: 0.8,
    algorithm: 'gzip' as const
  }
};

export default {
  compression,
  getCompressionStats,
  clearCompressionMetrics,
  compressionPresets
};
