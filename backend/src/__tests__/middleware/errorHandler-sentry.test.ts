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

  it('should report a scrubbed error to Sentry when SENTRY_DSN is set', () => {
    process.env.SENTRY_DSN = 'https://example.sentry.io/1';

    errorHandler(new Error('boom'), mockReq as Request, mockRes as Response, mockNext);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom', url: '/api/test', method: 'POST' })
    );
  });
});
