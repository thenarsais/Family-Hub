import { Request, Response } from 'express';
import {
  requestLogger,
  getRecentLogs,
  getLogsByPath,
  getLogsByStatus,
  getErrorLogs,
  getPerformanceStats,
  clearLogs,
} from '../../middleware/request-logger';

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    path: '/api/things',
    userId: undefined,
    ip: '10.0.0.1',
    headers: {},
    socket: { remoteAddress: undefined },
    connection: { remoteAddress: undefined },
    get: jest.fn().mockReturnValue(undefined),
    ...overrides,
  } as unknown as Request;
}

function fireRequest(
  req: Request,
  statusCode: number,
  body: unknown = { ok: true }
): void {
  const setSpy = jest.fn();
  let capturedSend: ((data: unknown) => Response) | undefined;
  const res = {
    statusCode,
    set: setSpy,
  } as unknown as Response;
  res.send = jest.fn(function (this: Response, data: unknown) {
    return data as unknown as Response;
  }) as unknown as Response['send'];

  const next = jest.fn();
  requestLogger()(req, res, next);
  capturedSend = res.send as unknown as (data: unknown) => Response;
  capturedSend.call(res, body);
}

describe('requestLogger middleware', () => {
  beforeEach(() => {
    clearLogs();
  });

  it('should attach an X-Request-ID header and call next', () => {
    const setSpy = jest.fn();
    const res = { statusCode: 200, set: setSpy, send: jest.fn() } as unknown as Response;
    const next = jest.fn();

    requestLogger()(makeReq(), res, next);

    expect(setSpy).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
    expect(next).toHaveBeenCalled();
  });

  it('should record a log entry when res.send is called', () => {
    fireRequest(makeReq({ path: '/api/chores', method: 'POST' }), 201, { id: 1 });

    const [log] = getRecentLogs(1);
    expect(log.path).toBe('/api/chores');
    expect(log.method).toBe('POST');
    expect(log.statusCode).toBe(201);
    expect(log.responseSize).toBeGreaterThan(0);
  });

  it('should include userId when present on the request', () => {
    fireRequest(makeReq({ userId: 'user-1' }), 200);

    const [log] = getRecentLogs(1);
    expect(log.userId).toBe('user-1');
  });

  it('should parse content-length into requestSize', () => {
    const req = makeReq({
      get: jest.fn((header: string) => (header === 'content-length' ? '42' : undefined)) as unknown as Request['get'],
    });

    fireRequest(req, 200);

    const [log] = getRecentLogs(1);
    expect(log.requestSize).toBe(42);
  });

  it('should derive ip from x-forwarded-for when req.ip is absent, taking the first entry', () => {
    const req = makeReq({ ip: undefined, headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } });

    fireRequest(req, 200);

    const [log] = getRecentLogs(1);
    expect(log.ip).toBe('1.2.3.4');
  });
});

describe('log query helpers', () => {
  beforeEach(() => {
    clearLogs();
    fireRequest(makeReq({ path: '/api/chores' }), 200);
    fireRequest(makeReq({ path: '/api/points' }), 404);
    fireRequest(makeReq({ path: '/api/chores' }), 500);
  });

  it('getRecentLogs should return logs most-recent-first, capped at the limit', () => {
    const logs = getRecentLogs(2);
    expect(logs).toHaveLength(2);
    expect(logs[0].statusCode).toBe(500);
  });

  it('getLogsByPath should filter logs containing the given path substring', () => {
    const logs = getLogsByPath('chores');
    expect(logs).toHaveLength(2);
    expect(logs.every((l) => l.path.includes('chores'))).toBe(true);
  });

  it('getLogsByStatus should filter by exact status code', () => {
    const logs = getLogsByStatus(404);
    expect(logs).toHaveLength(1);
    expect(logs[0].statusCode).toBe(404);
  });

  it('getErrorLogs should return only logs with statusCode >= 400', () => {
    const logs = getErrorLogs();
    expect(logs).toHaveLength(2);
    expect(logs.every((l) => l.statusCode >= 400)).toBe(true);
  });
});

describe('getPerformanceStats', () => {
  beforeEach(() => {
    clearLogs();
  });

  it('should return null when there are no logs', () => {
    expect(getPerformanceStats()).toBeNull();
  });

  it('should compute aggregate stats across logged requests', () => {
    fireRequest(makeReq({ path: '/api/a' }), 200);
    fireRequest(makeReq({ path: '/api/b' }), 500);

    const stats = getPerformanceStats();

    expect(stats?.totalRequests).toBe(2);
    expect(stats?.errorRate).toBe(50);
    expect(stats?.slowestRequests).toHaveLength(2);
    expect(typeof stats?.avgResponseTime).toBe('number');
  });
});

describe('clearLogs', () => {
  it('should empty the log store', () => {
    fireRequest(makeReq(), 200);
    expect(getRecentLogs()).not.toHaveLength(0);

    clearLogs();

    expect(getRecentLogs()).toHaveLength(0);
  });
});
