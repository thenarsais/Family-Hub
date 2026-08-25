import { Request, Response } from 'express';
import { handleBatchOperations, batchOperations, BatchBuilder } from '../../middleware/batch-operations';

function makeReq(operations: unknown, overrides: Partial<Request> = {}): Request {
  return {
    body: { operations },
    path: '/batch',
    method: 'POST',
    ...overrides,
  } as unknown as Request;
}

describe('handleBatchOperations', () => {
  it('should throw when operations is missing or empty', async () => {
    await expect(handleBatchOperations(makeReq(undefined))).rejects.toThrow('No operations provided');
    await expect(handleBatchOperations(makeReq([]))).rejects.toThrow('No operations provided');
  });

  it('should throw when there are more than 25 operations', async () => {
    const operations = Array.from({ length: 26 }, (_, i) => ({ id: `${i}`, method: 'GET', path: '/x' }));

    await expect(handleBatchOperations(makeReq(operations))).rejects.toThrow(
      'Too many operations. Maximum 25 per batch'
    );
  });

  it('should return a 400 result for an operation missing required fields', async () => {
    const results = await handleBatchOperations(makeReq([{ id: 'op1' }]));

    expect(results).toEqual([
      { id: 'op1', statusCode: 400, error: 'Missing required fields: id, method, path' },
    ]);
  });

  it('should fall back to "unknown" id when even the id is missing', async () => {
    const results = await handleBatchOperations(makeReq([{ method: 'GET' }]));

    expect(results[0]).toEqual({ id: 'unknown', statusCode: 400, error: 'Missing required fields: id, method, path' });
  });

  it('should return a 405 result for an invalid HTTP method', async () => {
    const results = await handleBatchOperations(
      makeReq([{ id: 'op1', method: 'TRACE', path: '/x' }])
    );

    expect(results).toEqual([{ id: 'op1', statusCode: 405, error: 'Invalid HTTP method' }]);
  });

  it('should execute valid operations and return mock 200 responses in order', async () => {
    const results = await handleBatchOperations(
      makeReq([
        { id: 'op1', method: 'GET', path: '/a' },
        { id: 'op2', method: 'POST', path: '/b' },
      ])
    );

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ id: 'op1', statusCode: 200 });
    expect(results[0].data).toMatchObject({ message: 'Mock response for GET /a' });
    expect(results[1]).toMatchObject({ id: 'op2', statusCode: 200 });
    expect(results[1].data).toMatchObject({ message: 'Mock response for POST /b' });
  });

  it('should mix successes and failures across a batch, preserving order', async () => {
    const results = await handleBatchOperations(
      makeReq([
        { id: 'op1', method: 'GET', path: '/a' },
        { id: 'op2' },
        { id: 'op3', method: 'WOOF', path: '/c' },
      ])
    );

    expect(results.map((r) => r.statusCode)).toEqual([200, 400, 405]);
  });
});

describe('batchOperations middleware', () => {
  it('should pass through non-batch requests', async () => {
    const next = jest.fn();
    const res = {} as Response;

    await batchOperations()(makeReq([], { path: '/api/chores' }), res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should pass through GET requests to /batch', async () => {
    const next = jest.fn();
    const res = {} as Response;

    await batchOperations()(makeReq([], { method: 'GET' }), res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should respond 207 with results for a valid batch POST', async () => {
    const next = jest.fn();
    const jsonSpy = jest.fn();
    const statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    const res = { status: statusSpy } as unknown as Response;

    await batchOperations()(makeReq([{ id: 'op1', method: 'GET', path: '/a' }]), res, next);

    expect(statusSpy).toHaveBeenCalledWith(207);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Batch operations completed', operations: 1 })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should respond 400 when the batch itself is invalid', async () => {
    const next = jest.fn();
    const jsonSpy = jest.fn();
    const statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    const res = { status: statusSpy } as unknown as Response;

    await batchOperations()(makeReq([]), res, next);

    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({ error: 'No operations provided' });
  });
});

describe('BatchBuilder', () => {
  it('should accumulate operations via the typed helper methods', () => {
    const builder = new BatchBuilder()
      .get('op1', '/a')
      .post('op2', '/b', { x: 1 })
      .put('op3', '/c', { y: 2 })
      .patch('op4', '/d', { z: 3 })
      .delete('op5', '/e');

    expect(builder.count()).toBe(5);
    expect(builder.build()).toEqual({
      operations: [
        { id: 'op1', method: 'GET', path: '/a', body: undefined },
        { id: 'op2', method: 'POST', path: '/b', body: { x: 1 } },
        { id: 'op3', method: 'PUT', path: '/c', body: { y: 2 } },
        { id: 'op4', method: 'PATCH', path: '/d', body: { z: 3 } },
        { id: 'op5', method: 'DELETE', path: '/e', body: undefined },
      ],
    });
  });

  it('should clear accumulated operations', () => {
    const builder = new BatchBuilder().get('op1', '/a');

    builder.clear();

    expect(builder.count()).toBe(0);
    expect(builder.build()).toEqual({ operations: [] });
  });
});
