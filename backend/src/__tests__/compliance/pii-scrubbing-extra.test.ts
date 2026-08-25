import { scrubbedError, sanitizeForSentry } from '../../utils/pii-scrubber';

describe('scrubbedError — edge cases', () => {
  it('should replace a circular reference with [Circular] instead of looping forever', () => {
    const obj: Record<string, unknown> = { name: 'Alice' };
    obj.self = obj;

    const result = scrubbedError(obj);

    expect(result.self).toBe('[Circular]');
  });

  it('should stop recursing past a depth of 20 and return the value as-is', () => {
    let deep: Record<string, unknown> = { value: 'bottom' };
    for (let i = 0; i < 25; i++) {
      deep = { nested: deep };
    }

    expect(() => scrubbedError(deep)).not.toThrow();
  });

  it('should pass through primitive values unchanged', () => {
    expect(scrubbedError({ count: 5, active: true, label: 'ok' } as never)).toEqual({
      count: 5,
      active: true,
      label: 'ok',
    });
  });

  it('should recurse into non-sensitive nested objects', () => {
    const result = scrubbedError({ address: { city: 'Seattle', street: '123 Main St' } });

    expect(result.address).toEqual({ city: 'Seattle', street: '[REDACTED]' });
  });
});

describe('sanitizeForSentry', () => {
  it('should reduce a real Error to message/stack/name only', () => {
    const err = new Error('boom');

    const result = sanitizeForSentry(err) as { message: string; stack?: string; name: string };

    expect(result.message).toBe('boom');
    expect(result.name).toBe('Error');
    expect(result.stack).toEqual(expect.any(String));
    expect(Object.keys(result).sort()).toEqual(['message', 'name', 'stack']);
  });

  it('should scrub PII from a plain error-like object', () => {
    const result = sanitizeForSentry({ email: 'kid@example.com', context: 'signup' }) as Record<string, unknown>;

    expect(result.email).toBe('[REDACTED]');
    expect(result.context).toBe('signup');
  });

  it('should pass through primitive error values unchanged', () => {
    expect(sanitizeForSentry('a string error')).toBe('a string error');
    expect(sanitizeForSentry(404)).toBe(404);
    expect(sanitizeForSentry(null)).toBeNull();
  });
});
