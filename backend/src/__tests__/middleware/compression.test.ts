import { Request, Response } from 'express';
import * as zlib from 'zlib';

jest.mock('zlib', () => {
  const actual = jest.requireActual('zlib');
  return { ...actual, gzipSync: jest.fn(actual.gzipSync) };
});

import {
  compression,
  getCompressionStats,
  clearCompressionMetrics,
  compressionPresets,
} from '../../middleware/compression';

function makeReq(acceptEncoding: string): Request {
  return {
    get: jest.fn().mockReturnValue(acceptEncoding),
  } as unknown as Request;
}

function makeRes() {
  const setSpy = jest.fn();
  const sendSpy = jest.fn().mockReturnThis();
  const jsonSpy = jest.fn().mockReturnThis();
  const res = { set: setSpy, send: sendSpy, json: jsonSpy } as unknown as Response;
  return { res, setSpy, sendSpy, jsonSpy };
}

// Highly repetitive payload so real gzip/brotli compress it well below any
// reasonable minRatio, without needing to mock the compression internals.
const compressiblePayload = { items: Array(300).fill('repeat-me-repeat-me-repeat-me') };

describe('compression middleware', () => {
  beforeEach(() => {
    clearCompressionMetrics();
  });

  it('should skip entirely when the client sends no compression-capable accept-encoding', () => {
    const next = jest.fn();
    const { res, jsonSpy } = makeRes();

    compression()(makeReq(''), res, next);

    expect(next).toHaveBeenCalled();
    // res.json was never wrapped, so it's still the original spy
    expect(res.json).toBe(jsonSpy);
  });

  it('should pass small responses through uncompressed', () => {
    const next = jest.fn();
    const { res, setSpy, jsonSpy } = makeRes();

    compression({ threshold: 1024 })(makeReq('gzip'), res, next);
    (res.json as unknown as (data: unknown) => Response)({ tiny: true });

    expect(jsonSpy).toHaveBeenCalledWith({ tiny: true });
    expect(setSpy).toHaveBeenCalledWith('Content-Length', expect.any(String));
  });

  it('should gzip-compress a large, compressible response and record metrics', () => {
    const next = jest.fn();
    const { res, setSpy, sendSpy, jsonSpy } = makeRes();

    compression({ threshold: 100, minRatio: 0.8, algorithm: 'gzip' })(makeReq('gzip'), res, next);
    (res.json as unknown as (data: unknown) => Response)(compressiblePayload);

    expect(sendSpy).toHaveBeenCalledWith(expect.any(Buffer));
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalledWith('Content-Encoding', 'gzip');
    expect(setSpy).toHaveBeenCalledWith('X-Original-Size', expect.any(String));

    const stats = getCompressionStats();
    expect(stats?.totalRequests).toBe(1);
    expect(stats?.byAlgorithm.gzip.count).toBe(1);
  });

  it('should brotli-compress when algorithm is br', () => {
    const next = jest.fn();
    const { res, setSpy, sendSpy } = makeRes();

    compression({ threshold: 100, minRatio: 0.8, algorithm: 'br' })(makeReq('br'), res, next);
    (res.json as unknown as (data: unknown) => Response)(compressiblePayload);

    expect(sendSpy).toHaveBeenCalledWith(expect.any(Buffer));
    expect(setSpy).toHaveBeenCalledWith('Content-Encoding', 'br');
  });

  it('should auto-select gzip over brotli when both are accepted', () => {
    const next = jest.fn();
    const { res, setSpy, sendSpy } = makeRes();

    compression({ threshold: 100, minRatio: 0.8, algorithm: 'auto' })(makeReq('gzip, br'), res, next);
    (res.json as unknown as (data: unknown) => Response)(compressiblePayload);

    expect(sendSpy).toHaveBeenCalledWith(expect.any(Buffer));
    expect(setSpy).toHaveBeenCalledWith('Content-Encoding', 'gzip');
  });

  it('should auto-select brotli when only br is accepted', () => {
    const next = jest.fn();
    const { res, setSpy, sendSpy } = makeRes();

    compression({ threshold: 100, minRatio: 0.8, algorithm: 'auto' })(makeReq('br'), res, next);
    (res.json as unknown as (data: unknown) => Response)(compressiblePayload);

    expect(sendSpy).toHaveBeenCalledWith(expect.any(Buffer));
    expect(setSpy).toHaveBeenCalledWith('Content-Encoding', 'br');
  });

  it('should fall through to the original json when only deflate is accepted (unsupported by this code path)', () => {
    const next = jest.fn();
    const { res, jsonSpy } = makeRes();

    compression({ threshold: 100, algorithm: 'auto' })(makeReq('deflate'), res, next);
    (res.json as unknown as (data: unknown) => Response)(compressiblePayload);

    expect(jsonSpy).toHaveBeenCalledWith(compressiblePayload);
  });

  it('should fall back to uncompressed when the compression ratio is not good enough', () => {
    const next = jest.fn();
    const { res, jsonSpy } = makeRes();

    // A non-zero-but-tiny minRatio (0 itself would fall through to the 0.8
    // default via the `options.minRatio || 0.8` check) that virtually any
    // real compression will exceed, forcing the fallback branch.
    compression({ threshold: 100, minRatio: 0.001, algorithm: 'gzip' })(makeReq('gzip'), res, next);
    (res.json as unknown as (data: unknown) => Response)(compressiblePayload);

    expect(jsonSpy).toHaveBeenCalledWith(compressiblePayload);
  });

  it('should fall back to the original json when compression throws', () => {
    const next = jest.fn();
    const { res, jsonSpy } = makeRes();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (zlib.gzipSync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('zlib exploded');
    });

    compression({ threshold: 100, algorithm: 'gzip' })(makeReq('gzip'), res, next);
    (res.json as unknown as (data: unknown) => Response)(compressiblePayload);

    expect(jsonSpy).toHaveBeenCalledWith(compressiblePayload);
    consoleErrorSpy.mockRestore();
  });
});

describe('getCompressionStats / clearCompressionMetrics', () => {
  beforeEach(() => {
    clearCompressionMetrics();
  });

  it('should return null when no metrics have been recorded', () => {
    expect(getCompressionStats()).toBeNull();
  });

  it('should aggregate metrics across multiple compressed responses', () => {
    const next = jest.fn();
    for (let i = 0; i < 2; i++) {
      const { res } = makeRes();
      compression({ threshold: 100, minRatio: 0.8, algorithm: 'gzip' })(makeReq('gzip'), res, next);
      (res.json as unknown as (data: unknown) => Response)(compressiblePayload);
    }

    const stats = getCompressionStats();

    expect(stats?.totalRequests).toBe(2);
    expect(stats?.totalBytesSaved).toBeGreaterThan(0);
    expect(stats?.byAlgorithm.gzip.count).toBe(2);
  });

  it('clearCompressionMetrics should empty recorded metrics', () => {
    const next = jest.fn();
    const { res } = makeRes();
    compression({ threshold: 100, minRatio: 0.8, algorithm: 'gzip' })(makeReq('gzip'), res, next);
    (res.json as unknown as (data: unknown) => Response)(compressiblePayload);
    expect(getCompressionStats()).not.toBeNull();

    clearCompressionMetrics();

    expect(getCompressionStats()).toBeNull();
  });
});

describe('compressionPresets', () => {
  it('should define standard/aggressive/light/brotli/gzip presets', () => {
    expect(compressionPresets.standard.algorithm).toBe('auto');
    expect(compressionPresets.aggressive.level).toBe(9);
    expect(compressionPresets.light.level).toBe(3);
    expect(compressionPresets.brotli.algorithm).toBe('br');
    expect(compressionPresets.gzip.algorithm).toBe('gzip');
  });
});
