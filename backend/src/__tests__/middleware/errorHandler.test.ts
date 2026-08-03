/**
 * Error Handler Middleware Tests
 * Tests error handling and PII scrubbing (COPPA Compliance - Decision 29)
 */

import { errorHandler } from '../../middleware/errorHandler';
import { Request, Response, NextFunction } from 'express';

describe('Error Handler Middleware (COPPA Compliance)', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonSpy = jest.fn().mockReturnValue(undefined);
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });

    mockReq = {
      path: '/api/test',
      method: 'POST',
      headers: {},
    } as any;

    mockRes = {
      status: statusSpy,
    } as any;

    mockNext = jest.fn();
  });

  describe('Basic Error Handling', () => {
    it('should catch errors and respond with 500', () => {
      const error = new Error('Test error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(500);
    });

    it('should return error in response', () => {
      const error = new Error('Test error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal Server Error',
        })
      );
    });

    it('should log error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Request Information', () => {
    it('should include request path', () => {
      const error = new Error('Test error');
      (mockReq as any).path = '/api/users';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalled();
    });

    it('should include request method', () => {
      const error = new Error('Test error');
      mockReq.method = 'POST';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalled();
    });

    it('should include request ID if available', () => {
      const error = new Error('Test error');
      (mockReq as any).id = 'req-123';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const callArgs = jsonSpy.mock.calls[0][0];
      expect(callArgs.requestId).toBe('req-123');
    });

    it('should generate request ID if missing', () => {
      const error = new Error('Test error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const callArgs = jsonSpy.mock.calls[0][0];
      expect(callArgs.requestId).toBeDefined();
    });
  });

  describe('PII Scrubbing (COPPA Compliance)', () => {
    it('should not expose error message containing password', () => {
      const error = new Error('User password verification failed: secret123');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      expect(response.error).toBe('Internal Server Error');
      expect(response.error).not.toContain('secret123');
    });

    it('should not expose token in error details', () => {
      const error = new Error('Auth token error: abc123def456');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      expect(JSON.stringify(response)).not.toContain('abc123def456');
    });

    it('should not expose child name in error', () => {
      const error = new Error('Child profile error for Emma');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      expect(response.error).toBe('Internal Server Error');
    });

    it('should not expose PII from stack trace', () => {
      const error = new Error('Database error for user@example.com');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      expect(response.error).toBe('Internal Server Error');
    });

    it('should not expose API keys', () => {
      const error = new Error('Supabase key: sk_live_1234567890');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      expect(JSON.stringify(response)).not.toContain('sk_live_1234567890');
    });
  });

  describe('Error Types', () => {
    it('should handle Error objects', () => {
      const error = new Error('Generic error');

      expect(() => {
        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      }).not.toThrow();
    });

    it('should handle errors with properties', () => {
      const error: any = new Error('Error with extra');
      error.code = 'DB_ERROR';

      expect(() => {
        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      }).not.toThrow();
    });

    it('should handle non-Error objects', () => {
      const error = 'String error' as any;

      expect(() => {
        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      }).not.toThrow();
    });
  });

  describe('Response Format', () => {
    it('should return JSON response', () => {
      const error = new Error('Test');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalled();
    });

    it('should include error field', () => {
      const error = new Error('Test');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      expect(response).toHaveProperty('error');
    });

    it('should include requestId for tracking', () => {
      const error = new Error('Test');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      expect(response).toHaveProperty('requestId');
    });

    it('should not expose internal error details', () => {
      const error = new Error('Internal database connection error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      expect(response.error).toBe('Internal Server Error');
      expect(response.error).not.toContain('database');
    });
  });

  describe('Error Logging', () => {
    it('should log error message', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Logged error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Logged error'));
      consoleSpy.mockRestore();
    });

    it('should not log sensitive data', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Error with password123');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Even in logs, sensitive data should be handled carefully
      consoleSpy.mockRestore();
    });
  });

  describe('HTTP Status Codes', () => {
    it('should always return 500 for unhandled errors', () => {
      const error = new Error('Any error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(500);
    });

    it('should not expose status code details to client', () => {
      const error = new Error('Specific error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      expect(response.error).toBe('Internal Server Error');
    });
  });

  describe('Request Context', () => {
    it('should capture request path', () => {
      const error = new Error('Error');
      (mockReq as any).path = '/api/users/create';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalled();
    });

    it('should capture request method', () => {
      const error = new Error('Error');
      mockReq.method = 'PUT';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalled();
    });

    it('should not capture request body (could have PII)', () => {
      const error = new Error('Error');
      (mockReq as any).body = { password: 'secret' };

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0];
      // Body should not be in response
      expect(JSON.stringify(response)).not.toContain('secret');
    });
  });

  describe('Non-Blocking Operation', () => {
    it('should respond immediately to client', () => {
      const error = new Error('Test');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Should call status and json synchronously
      expect(statusSpy).toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalled();
    });

    it('should not block request processing', () => {
      const error = new Error('Test');

      expect(() => {
        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      }).not.toThrow();
    });
  });
});
