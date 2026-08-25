import { Request, Response, NextFunction } from 'express';
import { responseFormatter, formatResponse, formatPaginatedResponse } from '../../middleware/response-formatter';

describe('response-formatter middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;
  let sendSpy: jest.Mock;

  beforeEach(() => {
    jsonSpy = jest.fn().mockReturnThis();
    sendSpy = jest.fn().mockReturnThis();
    statusSpy = jest.fn();

    mockRes = {} as Partial<Response>;
    statusSpy.mockImplementation(() => mockRes);
    (mockRes as Response).status = statusSpy as unknown as Response['status'];
    (mockRes as Response).json = jsonSpy as unknown as Response['json'];
    (mockRes as Response).send = sendSpy as unknown as Response['send'];

    mockReq = {};
    mockNext = jest.fn();

    responseFormatter()(mockReq as Request, mockRes as Response, mockNext);
  });

  it('should call next', () => {
    expect(mockNext).toHaveBeenCalled();
  });

  describe('res.success', () => {
    it('should default to status 200', () => {
      (mockRes as Response).success({ id: 1 });

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { id: 1 } })
      );
    });

    it('should use a custom status code and message when given', () => {
      (mockRes as Response).success({ id: 1 }, 'done', 202);

      expect(statusSpy).toHaveBeenCalledWith(202);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { id: 1 }, message: 'done' })
      );
    });
  });

  describe('res.created', () => {
    it('should respond 201 with a default message', () => {
      (mockRes as Response).created({ id: 1 });

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Resource created successfully' })
      );
    });

    it('should allow a custom message', () => {
      (mockRes as Response).created({ id: 1 }, 'Widget created');

      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'Widget created' }));
    });
  });

  describe('res.noContent', () => {
    it('should respond 204 with no body', () => {
      (mockRes as Response).noContent();

      expect(statusSpy).toHaveBeenCalledWith(204);
      expect(sendSpy).toHaveBeenCalledWith();
    });
  });

  describe('res.paginated', () => {
    it('should include count derived from the data length', () => {
      (mockRes as Response).paginated([{ id: 1 }, { id: 2 }]);

      expect(statusSpy).toHaveBeenCalledWith(200);
      const response = jsonSpy.mock.calls[0][0];
      expect(response.meta).toEqual({ count: 2 });
    });

    it('should include page/limit/total only when provided', () => {
      (mockRes as Response).paginated([{ id: 1 }], 'ok', 2, 10, 50);

      const response = jsonSpy.mock.calls[0][0];
      expect(response.meta).toEqual({ count: 1, page: 2, limit: 10, total: 50 });
      expect(response.message).toBe('ok');
    });
  });
});

describe('formatResponse', () => {
  it('should mark 2xx status codes as successful', () => {
    const result = formatResponse({ id: 1 }, 'ok', 201);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 1 });
    expect(result.message).toBe('ok');
  });

  it('should mark non-2xx status codes as unsuccessful', () => {
    const result = formatResponse(null, 'failed', 400);

    expect(result.success).toBe(false);
  });

  it('should default to status 200', () => {
    const result = formatResponse({ id: 1 });

    expect(result.success).toBe(true);
  });
});

describe('formatPaginatedResponse', () => {
  it('should include count derived from data length', () => {
    const result = formatPaginatedResponse([1, 2, 3]);

    expect(result.meta).toEqual({ count: 3 });
    expect(result.success).toBe(true);
  });

  it('should include page/limit/total only when provided', () => {
    const result = formatPaginatedResponse([1], 'ok', 1, 5, 20);

    expect(result.meta).toEqual({ count: 1, page: 1, limit: 5, total: 20 });
  });
});
