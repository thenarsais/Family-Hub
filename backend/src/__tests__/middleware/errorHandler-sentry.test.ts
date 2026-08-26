jest.mock('../../config/sentry', () => ({ Sentry: { captureException: jest.fn() } }));

import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../middleware/errorHandler';
import { Sentry } from '../../config/sentry';

describe('errorHandler — Sentry reporting', () => {
  const ORIGINAL_DSN = process.env.SENTRY_DSN;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    mockReq = { path: '/api/test', method: 'POST', headers: {} };
    mockRes = { status: statusSpy as unknown as Response['status'] };
    mockNext = jest.fn();
  });

  afterAll(() => {
    process.env.SENTRY_DSN = ORIGINAL_DSN;
  });

  it('should not report to Sentry when SENTRY_DSN is unset', () => {
    delete process.env.SENTRY_DSN;

    errorHandler(new Error('boom'), mockReq as Request, mockRes as Response, mockNext);

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('should report the real Error plus request context when SENTRY_DSN is set', () => {
    process.env.SENTRY_DSN = 'https://example.sentry.io/1';

    errorHandler(new Error('boom'), mockReq as Request, mockRes as Response, mockNext);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({ path: '/api/test', method: 'POST' }),
      })
    );
    const [errArg] = (Sentry.captureException as jest.Mock).mock.calls[0];
    expect(errArg).toBeInstanceOf(Error);
    expect(errArg.message).toBe('boom');
  });

  it('should respond 400 and NOT report a malformed-JSON body error', () => {
    process.env.SENTRY_DSN = 'https://example.sentry.io/1';
    const parseErr = Object.assign(new SyntaxError('Unexpected token i in JSON at position 0'), {
      body: 'invalid json{',
      status: 400,
      statusCode: 400,
      expose: true,
    });

    errorHandler(parseErr, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid JSON in request body' })
    );
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('should honor a client status and NOT report an http-errors client error (expose:true)', () => {
    process.env.SENTRY_DSN = 'https://example.sentry.io/1';
    const tooLarge = Object.assign(new Error('request entity too large'), {
      status: 413,
      statusCode: 413,
      expose: true,
    });

    errorHandler(tooLarge, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(413);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('should still report a server error that happens to carry a 5xx status', () => {
    process.env.SENTRY_DSN = 'https://example.sentry.io/1';
    const serverErr = Object.assign(new Error('upstream exploded'), { status: 502 });

    errorHandler(serverErr, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
