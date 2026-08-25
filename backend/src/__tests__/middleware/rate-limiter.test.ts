import { Request, Response } from 'express';
import { rateLimit, rateLimitPresets } from '../../middleware/rate-limiter';

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    ip: undefined,
    socket: { remoteAddress: undefined },
    connection: { remoteAddress: undefined },
    ...overrides,
  } as unknown as Request;
}

function makeRes() {
  const setSpy = jest.fn();
  const jsonSpy = jest.fn();
  const statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
  const res = { set: setSpy, status: statusSpy } as unknown as Response;
  return { res, setSpy, jsonSpy, statusSpy };
}

let uniqueCounter = 0;
function uniqueKeyGenerator() {
  uniqueCounter += 1;
  return `test-key-${uniqueCounter}`;
}

describe('rateLimit middleware', () => {
  it('should skip rate limiting when skip() returns true', () => {
    const next = jest.fn();
    const { res, statusSpy } = makeRes();
    const limiter = rateLimit({ windowMs: 1000, maxRequests: 1, skip: () => true, keyGenerator: uniqueKeyGenerator });

    limiter(makeReq(), res, next);

    expect(next).toHaveBeenCalled();
    expect(statusSpy).not.toHaveBeenCalled();
  });

  it('should allow the first request in a window and set rate-limit headers', () => {
    const next = jest.fn();
    const { res, setSpy } = makeRes();
    const limiter = rateLimit({ windowMs: 1000, maxRequests: 2, keyGenerator: uniqueKeyGenerator });

    limiter(makeReq(), res, next);
    // first request initializes the window and returns early, before headers are set
    expect(next).toHaveBeenCalledTimes(1);
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('should set X-RateLimit headers on subsequent allowed requests', () => {
    const next = jest.fn();
    const { res, setSpy } = makeRes();
    const key = uniqueKeyGenerator();
    const limiter = rateLimit({ windowMs: 60000, maxRequests: 2, keyGenerator: () => key });

    limiter(makeReq(), res, next); // request 1 (init)
    limiter(makeReq(), res, next); // request 2 (within limit)

    expect(next).toHaveBeenCalledTimes(2);
    expect(setSpy).toHaveBeenCalledWith('X-RateLimit-Limit', '2');
    expect(setSpy).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
  });

  it('should reject with 429 once the limit is exceeded', () => {
    const next = jest.fn();
    const { res, setSpy, jsonSpy, statusSpy } = makeRes();
    const key = uniqueKeyGenerator();
    const limiter = rateLimit({ windowMs: 60000, maxRequests: 1, keyGenerator: () => key });

    limiter(makeReq(), res, next); // request 1 (init, allowed)
    limiter(makeReq(), res, next); // request 2 (exceeds)

    expect(next).toHaveBeenCalledTimes(1);
    expect(statusSpy).toHaveBeenCalledWith(429);
    expect(setSpy).toHaveBeenCalledWith('Retry-After', expect.any(String));
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Too many requests', retryAfter: expect.any(Number) })
    );
  });

  it('should use a custom message when rejecting', () => {
    const next = jest.fn();
    const { res, jsonSpy } = makeRes();
    const key = uniqueKeyGenerator();
    const limiter = rateLimit({ windowMs: 60000, maxRequests: 1, message: 'Slow down!', keyGenerator: () => key });

    limiter(makeReq(), res, next);
    limiter(makeReq(), res, next);

    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'Slow down!' }));
  });

  it('should reset the counter once the window has expired', () => {
    const next = jest.fn();
    const { res } = makeRes();
    const key = uniqueKeyGenerator();
    const limiter = rateLimit({ windowMs: 10, maxRequests: 1, keyGenerator: () => key });

    limiter(makeReq(), res, next); // request 1, window opens

    const realNow = Date.now;
    Date.now = () => realNow() + 1000; // fast-forward well past the window
    limiter(makeReq(), res, next); // should be treated as a fresh window
    Date.now = realNow;

    expect(next).toHaveBeenCalledTimes(2);
  });

  describe('defaultKeyGenerator (via req.ip / socket / connection fallbacks)', () => {
    it('should key by req.ip when present', () => {
      const next = jest.fn();
      const { res, statusSpy } = makeRes();
      const limiter = rateLimit({ windowMs: 60000, maxRequests: 1 });

      limiter(makeReq({ ip: '10.0.0.1' }), res, next);
      limiter(makeReq({ ip: '10.0.0.1' }), res, next);

      expect(statusSpy).toHaveBeenCalledWith(429);
    });

    it('should fall back to socket.remoteAddress when req.ip is absent', () => {
      const next = jest.fn();
      const { res, statusSpy } = makeRes();
      const limiter = rateLimit({ windowMs: 60000, maxRequests: 1 });
      const req = makeReq({ socket: { remoteAddress: '10.0.0.2' } as never });

      limiter(req, res, next);
      limiter(req, res, next);

      expect(statusSpy).toHaveBeenCalledWith(429);
    });

    it('should fall back to "unknown" when nothing identifies the client', () => {
      const next = jest.fn();
      const { res } = makeRes();
      const limiter = rateLimit({ windowMs: 60000, maxRequests: 5 });

      expect(() => limiter(makeReq(), res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });
  });
});

describe('rateLimitPresets', () => {
  it('should define standard/strict/lenient/auth/public presets', () => {
    expect(rateLimitPresets.standard).toEqual({ windowMs: 15 * 60 * 1000, maxRequests: 100 });
    expect(rateLimitPresets.strict).toEqual({ windowMs: 15 * 60 * 1000, maxRequests: 30 });
    expect(rateLimitPresets.lenient).toEqual({ windowMs: 15 * 60 * 1000, maxRequests: 1000 });
    expect(rateLimitPresets.auth).toEqual({ windowMs: 60 * 1000, maxRequests: 5 });
    expect(rateLimitPresets.public).toEqual({ windowMs: 60 * 1000, maxRequests: 10 });
  });
});
