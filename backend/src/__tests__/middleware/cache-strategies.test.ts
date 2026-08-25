import { Request, Response } from 'express';
import * as cache from '../../database/cache';
import {
  cacheResponse,
  cacheWithETag,
  cachePaginatedList,
  cachePerUser,
  invalidateCache,
  invalidateUserCache,
  invalidatePathCache,
  cachePresets,
} from '../../middleware/cache-strategies';

jest.mock('../../database/cache');

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    path: '/api/things',
    query: {},
    get: jest.fn().mockReturnValue(undefined),
    ...overrides,
  } as unknown as Request;
}

function makeRes() {
  const setSpy = jest.fn();
  const jsonSpy = jest.fn().mockReturnThis();
  const endSpy = jest.fn().mockReturnThis();
  const statusSpy = jest.fn().mockReturnValue({ end: endSpy });
  const res = { set: setSpy, json: jsonSpy, status: statusSpy } as unknown as Response;
  return { res, setSpy, jsonSpy, endSpy, statusSpy };
}

describe('cacheResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cache.get as jest.Mock).mockResolvedValue(null);
    (cache.set as jest.Mock).mockResolvedValue(undefined);
  });

  it('should skip non-GET requests', async () => {
    const next = jest.fn();
    const { res } = makeRes();

    await cacheResponse()(makeReq({ method: 'POST' }), res, next);

    expect(next).toHaveBeenCalled();
    expect(cache.get).not.toHaveBeenCalled();
  });

  it('should skip when the condition returns false', async () => {
    const next = jest.fn();
    const { res } = makeRes();

    await cacheResponse({ condition: () => false })(makeReq(), res, next);

    expect(next).toHaveBeenCalled();
    expect(cache.get).not.toHaveBeenCalled();
  });

  it('should serve a cache hit directly without calling next', async () => {
    (cache.get as jest.Mock).mockResolvedValueOnce({ cached: true });
    const next = jest.fn();
    const { res, setSpy, jsonSpy } = makeRes();

    await cacheResponse()(makeReq(), res, next);

    expect(setSpy).toHaveBeenCalledWith('X-Cache', 'HIT');
    expect(jsonSpy).toHaveBeenCalledWith({ cached: true });
    expect(next).not.toHaveBeenCalled();
  });

  it('should wrap res.json to store a cache miss and set X-Cache MISS', async () => {
    const next = jest.fn();
    const { res, setSpy, jsonSpy } = makeRes();

    await cacheResponse({ ttl: 120 })(makeReq(), res, next);
    (res.json as unknown as (data: unknown) => Response)({ fresh: true });

    expect(cache.set).toHaveBeenCalledWith(expect.any(String), { fresh: true }, 120);
    expect(setSpy).toHaveBeenCalledWith('X-Cache', 'MISS');
    expect(jsonSpy).toHaveBeenCalledWith({ fresh: true });
    expect(next).toHaveBeenCalled();
  });

  it('should use a custom key generator when provided', async () => {
    (cache.get as jest.Mock).mockResolvedValueOnce({ cached: true });
    const next = jest.fn();
    const { res } = makeRes();
    const keyGen = jest.fn().mockReturnValue('custom-key');

    await cacheResponse({ key: keyGen })(makeReq(), res, next);

    expect(keyGen).toHaveBeenCalled();
    expect(cache.get).toHaveBeenCalledWith('custom-key');
  });

  it('should continue past a cache.get failure', async () => {
    (cache.get as jest.Mock).mockRejectedValueOnce(new Error('redis down'));
    const next = jest.fn();
    const { res } = makeRes();

    await cacheResponse()(makeReq(), res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should log but not throw when cache.set fails after a miss', async () => {
    (cache.set as jest.Mock).mockRejectedValueOnce(new Error('redis down'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const next = jest.fn();
    const { res } = makeRes();

    await cacheResponse()(makeReq(), res, next);
    (res.json as unknown as (data: unknown) => Response)({ fresh: true });
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Cache set error:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});

describe('cacheWithETag', () => {
  it('should skip non-GET requests', () => {
    const next = jest.fn();
    const { res } = makeRes();

    cacheWithETag()(makeReq({ method: 'DELETE' }), res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should set an ETag header and call through when no match', () => {
    const next = jest.fn();
    const { res, setSpy, jsonSpy } = makeRes();

    cacheWithETag()(makeReq(), res, next);
    (res.json as unknown as (data: unknown) => Response)({ id: 1 });

    expect(setSpy).toHaveBeenCalledWith('ETag', expect.stringMatching(/^".+"$/));
    expect(jsonSpy).toHaveBeenCalledWith({ id: 1 });
  });

  it('should respond 304 when if-none-match matches the computed ETag', () => {
    const next = jest.fn();
    const { res, jsonSpy, statusSpy, endSpy } = makeRes();
    const crypto = require('crypto');
    const expectedEtag = crypto.createHash('md5').update(JSON.stringify({ id: 1 })).digest('hex');
    const req = makeReq({ get: jest.fn().mockReturnValue(`"${expectedEtag}"`) as unknown as Request['get'] });

    cacheWithETag()(req, res, next);
    (res.json as unknown as (data: unknown) => Response)({ id: 1 });

    expect(statusSpy).toHaveBeenCalledWith(304);
    expect(endSpy).toHaveBeenCalled();
    expect(jsonSpy).not.toHaveBeenCalled();
  });
});

describe('cachePaginatedList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cache.get as jest.Mock).mockResolvedValue(null);
    (cache.set as jest.Mock).mockResolvedValue(undefined);
  });

  it('should skip non-GET requests', async () => {
    const next = jest.fn();
    const { res } = makeRes();

    await cachePaginatedList()(makeReq({ method: 'POST' }), res, next);

    expect(next).toHaveBeenCalled();
    expect(cache.get).not.toHaveBeenCalled();
  });

  it('should key by page/limit and serve a cache hit', async () => {
    (cache.get as jest.Mock).mockResolvedValueOnce({ items: [] });
    const next = jest.fn();
    const { res, setSpy, jsonSpy } = makeRes();

    await cachePaginatedList()(makeReq({ query: { page: '2', limit: '20' } }), res, next);

    expect(cache.get).toHaveBeenCalledWith(expect.stringContaining('page:2:limit:20'));
    expect(setSpy).toHaveBeenCalledWith('X-Cache', 'HIT');
    expect(jsonSpy).toHaveBeenCalledWith({ items: [] });
  });

  it('should default to page 1 / limit 10 when unspecified', async () => {
    const next = jest.fn();
    const { res } = makeRes();

    await cachePaginatedList()(makeReq(), res, next);

    expect(cache.get).toHaveBeenCalledWith(expect.stringContaining('page:1:limit:10'));
  });

  it('should cache a miss with the default 600s TTL', async () => {
    const next = jest.fn();
    const { res } = makeRes();

    await cachePaginatedList()(makeReq(), res, next);
    (res.json as unknown as (data: unknown) => Response)({ items: [1] });

    expect(cache.set).toHaveBeenCalledWith(expect.any(String), { items: [1] }, 600);
  });
});

describe('cachePerUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cache.get as jest.Mock).mockResolvedValue(null);
    (cache.set as jest.Mock).mockResolvedValue(undefined);
  });

  it('should skip non-GET requests', async () => {
    const next = jest.fn();
    const { res } = makeRes();

    await cachePerUser()(makeReq({ method: 'PUT', userId: 'u1' } as never), res, next);

    expect(next).toHaveBeenCalled();
    expect(cache.get).not.toHaveBeenCalled();
  });

  it('should skip when there is no authenticated user', async () => {
    const next = jest.fn();
    const { res } = makeRes();

    await cachePerUser()(makeReq(), res, next);

    expect(next).toHaveBeenCalled();
    expect(cache.get).not.toHaveBeenCalled();
  });

  it('should key by user id and serve a cache hit', async () => {
    (cache.get as jest.Mock).mockResolvedValueOnce({ mine: true });
    const next = jest.fn();
    const { res, setSpy, jsonSpy } = makeRes();

    await cachePerUser()(makeReq({ userId: 'u1' } as never), res, next);

    expect(cache.get).toHaveBeenCalledWith(expect.stringContaining('cache:user:u1:'));
    expect(setSpy).toHaveBeenCalledWith('X-Cache', 'HIT');
    expect(jsonSpy).toHaveBeenCalledWith({ mine: true });
  });

  it('should cache a miss with the default 300s TTL', async () => {
    const next = jest.fn();
    const { res } = makeRes();

    await cachePerUser()(makeReq({ userId: 'u1' } as never), res, next);
    (res.json as unknown as (data: unknown) => Response)({ mine: true });

    expect(cache.set).toHaveBeenCalledWith(expect.any(String), { mine: true }, 300);
  });
});

describe('cache invalidation helpers', () => {
  it('invalidateCache should resolve without throwing', async () => {
    await expect(invalidateCache('cache:*')).resolves.toBeUndefined();
  });

  it('invalidateUserCache should resolve without throwing', async () => {
    await expect(invalidateUserCache('u1')).resolves.toBeUndefined();
  });

  it('invalidatePathCache should resolve without throwing', async () => {
    await expect(invalidatePathCache('/api/things')).resolves.toBeUndefined();
  });
});

describe('cachePresets', () => {
  it('should define short/standard/medium/long/veryLong TTLs', () => {
    expect(cachePresets).toEqual({
      short: { ttl: 60 },
      standard: { ttl: 300 },
      medium: { ttl: 900 },
      long: { ttl: 3600 },
      veryLong: { ttl: 86400 },
    });
  });
});
