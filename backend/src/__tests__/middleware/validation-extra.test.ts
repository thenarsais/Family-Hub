import { Request, Response, NextFunction } from 'express';
import { validate, validateRequest } from '../../middleware/validation';

describe('validateRequest — remaining types and rules', () => {
  it('should validate a boolean field', async () => {
    const result = await validateRequest(
      { active: true },
      { active: { field: 'active', type: 'boolean', required: true } }
    );
    expect(result.valid).toBe(true);
  });

  it('should reject a non-boolean value for a boolean field', async () => {
    const result = await validateRequest(
      { active: 'yes' },
      { active: { field: 'active', type: 'boolean', required: true } }
    );
    expect(result.valid).toBe(false);
  });

  it('should validate a UUID field', async () => {
    const result = await validateRequest(
      { id: '123e4567-e89b-12d3-a456-426614174000' },
      { id: { field: 'id', type: 'uuid', required: true } }
    );
    expect(result.valid).toBe(true);
  });

  it('should reject a malformed UUID', async () => {
    const result = await validateRequest(
      { id: 'not-a-uuid' },
      { id: { field: 'id', type: 'uuid', required: true } }
    );
    expect(result.valid).toBe(false);
  });

  it('should validate an ISO date field', async () => {
    const result = await validateRequest(
      { eventDate: '2026-01-01' },
      { eventDate: { field: 'eventDate', type: 'date', required: true } }
    );
    expect(result.valid).toBe(true);
  });

  it('should reject an unparseable date', async () => {
    const result = await validateRequest(
      { eventDate: 'not-a-date' },
      { eventDate: { field: 'eventDate', type: 'date', required: true } }
    );
    expect(result.valid).toBe(false);
  });

  it('should validate an array field within min/max bounds', async () => {
    const result = await validateRequest(
      { tags: ['a', 'b'] },
      { tags: { field: 'tags', type: 'array', required: true, min: 1, max: 3 } }
    );
    expect(result.valid).toBe(true);
  });

  it('should reject a non-array value for an array field', async () => {
    const result = await validateRequest(
      { tags: 'not-an-array' },
      { tags: { field: 'tags', type: 'array', required: true } }
    );
    expect(result.valid).toBe(false);
  });

  it('should reject an array shorter than min', async () => {
    const result = await validateRequest(
      { tags: [] },
      { tags: { field: 'tags', type: 'array', required: true, min: 1 } }
    );
    expect(result.valid).toBe(false);
  });

  it('should reject an array longer than max', async () => {
    const result = await validateRequest(
      { tags: ['a', 'b', 'c'] },
      { tags: { field: 'tags', type: 'array', required: true, max: 2 } }
    );
    expect(result.valid).toBe(false);
  });

  it('should reject a string that fails a pattern check', async () => {
    const result = await validateRequest(
      { code: 'abc' },
      { code: { field: 'code', type: 'string', required: true, pattern: /^\d+$/ } }
    );
    expect(result.valid).toBe(false);
  });

  it('should accept a string that matches a pattern', async () => {
    const result = await validateRequest(
      { code: '12345' },
      { code: { field: 'code', type: 'string', required: true, pattern: /^\d+$/ } }
    );
    expect(result.valid).toBe(true);
  });

  it('should run an async custom validator', async () => {
    const custom = jest.fn().mockResolvedValue(true);
    const result = await validateRequest(
      { username: 'alice' },
      { username: { field: 'username', type: 'string', required: true, custom } }
    );
    expect(custom).toHaveBeenCalledWith('alice');
    expect(result.valid).toBe(true);
  });

  it('should fail when a custom validator returns false', async () => {
    const custom = jest.fn().mockResolvedValue(false);
    const result = await validateRequest(
      { username: 'taken' },
      { username: { field: 'username', type: 'string', required: true, custom } }
    );
    expect(result.valid).toBe(false);
  });

  it('should use a custom error message when provided', async () => {
    const result = await validateRequest(
      { age: 200 },
      { age: { field: 'age', type: 'number', required: true, max: 120, message: 'Age must be realistic' } }
    );
    expect(result.errors?.age).toBe('Age must be realistic');
  });

  it('should strip javascript: protocol strings', async () => {
    const result = await validateRequest(
      { link: 'javascript:alert(1)' },
      { link: { field: 'link', type: 'string', required: true } }
    );
    expect(result.data?.link).not.toContain('javascript:');
  });

  it('should strip inline event handler attributes', async () => {
    const result = await validateRequest(
      { html: 'onerror=alert(1)' },
      { html: { field: 'html', type: 'string', required: true } }
    );
    expect(result.data?.html).not.toContain('onerror=');
  });

  it('should validate multiple fields and only report the failing ones', async () => {
    const result = await validateRequest(
      { name: 'Alice', age: -5 },
      {
        name: { field: 'name', type: 'string', required: true },
        age: { field: 'age', type: 'number', required: true, min: 0 },
      }
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual({ age: expect.any(String) });
  });
});

describe('validate() Express middleware', () => {
  function makeReqRes(body: Record<string, unknown>) {
    const req = { body } as Request;
    const jsonSpy = jest.fn();
    const statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    const res = { status: statusSpy } as unknown as Response;
    const next = jest.fn() as NextFunction;
    return { req, res, next, jsonSpy, statusSpy };
  }

  it('should call next and replace req.body with sanitized values on success', async () => {
    const { req, res, next } = makeReqRes({ name: '  Alice  ' });
    const middleware = validate({ name: { field: 'name', type: 'string', required: true } });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'Alice' });
  });

  it('should respond 400 with field errors on failure, without calling next', async () => {
    const { req, res, next, jsonSpy, statusSpy } = makeReqRes({});
    const middleware = validate({ name: { field: 'name', type: 'string', required: true } });

    await middleware(req, res, next);

    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({
      error: 'Validation failed',
      errors: { name: expect.any(String) },
    });
    expect(next).not.toHaveBeenCalled();
  });
});
