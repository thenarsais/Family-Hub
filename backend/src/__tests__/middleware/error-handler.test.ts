import { Request, Response, NextFunction } from 'express';
import {
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
  errorHandler,
  asyncHandler,
} from '../../middleware/error-handler';

describe('error classes', () => {
  it('ApiError should carry status code, code, and details', () => {
    const err = new ApiError(418, 'teapot', 'TEAPOT', { extra: true });

    expect(err.statusCode).toBe(418);
    expect(err.message).toBe('teapot');
    expect(err.code).toBe('TEAPOT');
    expect(err.details).toEqual({ extra: true });
    expect(err).toBeInstanceOf(Error);
  });

  it('ValidationError should default to 400/VALIDATION_ERROR', () => {
    const err = new ValidationError('bad input', { field: 'email' });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual({ field: 'email' });
  });

  it('NotFoundError should default message and 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Resource not found');
    expect(err.code).toBe('NOT_FOUND');
  });

  it('NotFoundError should use a custom resource name', () => {
    const err = new NotFoundError('User');
    expect(err.message).toBe('User not found');
  });

  it('UnauthorizedError should default to 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('ForbiddenError should default to 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('ConflictError should default to 409', () => {
    const err = new ConflictError('duplicate');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('InternalServerError should default to 500', () => {
    const err = new InternalServerError();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_SERVER_ERROR');
  });
});

describe('errorHandler middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;
  const handler = errorHandler();
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jsonSpy = jest.fn().mockReturnThis();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    mockReq = { path: '/api/things', method: 'POST' };
    mockRes = { status: statusSpy as unknown as Response['status'] };
    mockNext = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should format an ApiError using its own status code and code', () => {
    const err = new ValidationError('bad field', { field: 'x' });

    handler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({
      error: expect.objectContaining({
        code: 'VALIDATION_ERROR',
        message: 'bad field',
        statusCode: 400,
        details: { field: 'x' },
        path: '/api/things',
        method: 'POST',
      }),
    });
  });

  it('should default the code to ERROR when an ApiError has none', () => {
    const err = new ApiError(422, 'oops');

    handler(err, mockReq as Request, mockRes as Response, mockNext);

    const response = jsonSpy.mock.calls[0][0];
    expect(response.error.code).toBe('ERROR');
  });

  it('should format a JSON body-parse SyntaxError as 400 INVALID_JSON', () => {
    const err = new SyntaxError('Unexpected token') as SyntaxError & { body: string };
    err.body = '{bad json';

    handler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({
      error: expect.objectContaining({ code: 'INVALID_JSON', statusCode: 400 }),
    });
  });

  it('should format express-validator-style errors with an array() method', () => {
    const err = { array: () => [{ msg: 'email is required' }] };

    handler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(400);
    const response = jsonSpy.mock.calls[0][0];
    expect(response.error.code).toBe('VALIDATION_ERROR');
    expect(response.error.details).toEqual({ errors: [{ msg: 'email is required' }] });
  });

  it('should default generic errors to 500 INTERNAL_SERVER_ERROR', () => {
    const err = new Error('boom');

    handler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(500);
    const response = jsonSpy.mock.calls[0][0];
    expect(response.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(response.error.message).toBe('boom');
  });

  it('should use a provided statusCode/code on a plain error-like object', () => {
    const err = { statusCode: 502, code: 'BAD_GATEWAY', message: 'upstream down' };

    handler(err, mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(502);
    const response = jsonSpy.mock.calls[0][0];
    expect(response.error.code).toBe('BAD_GATEWAY');
  });

  it('should not include stack details outside of development', () => {
    const originalEnv = process.env.ENVIRONMENT;
    process.env.ENVIRONMENT = 'production';
    const err = new Error('boom');

    handler(err, mockReq as Request, mockRes as Response, mockNext);

    const response = jsonSpy.mock.calls[0][0];
    expect(response.error.details).toBeUndefined();
    process.env.ENVIRONMENT = originalEnv;
  });

  it('should include stack details in development', () => {
    const originalEnv = process.env.ENVIRONMENT;
    process.env.ENVIRONMENT = 'development';
    const err = new Error('boom');

    handler(err, mockReq as Request, mockRes as Response, mockNext);

    const response = jsonSpy.mock.calls[0][0];
    expect(response.error.details).toEqual(expect.objectContaining({ stack: expect.any(String) }));
    process.env.ENVIRONMENT = originalEnv;
  });
});

describe('asyncHandler', () => {
  it('should call the wrapped function with req/res/next', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(fn);
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn();

    await wrapped(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should forward a rejected promise to next', async () => {
    const error = new Error('async failure');
    const fn = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(fn);
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn();

    await wrapped(req, res, next);
    // Promise.resolve().catch(next) resolves on a microtask; flush it
    await Promise.resolve();

    expect(next).toHaveBeenCalledWith(error);
  });
});
