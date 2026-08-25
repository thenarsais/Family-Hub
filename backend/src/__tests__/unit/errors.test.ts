import { getErrorMessage, getErrorCode } from '../../utils/errors';

describe('getErrorMessage', () => {
  it('should return the message of a real Error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('should stringify non-Error values', () => {
    expect(getErrorMessage('a string error')).toBe('a string error');
    expect(getErrorMessage(404)).toBe('404');
    expect(getErrorMessage(null)).toBe('null');
    expect(getErrorMessage(undefined)).toBe('undefined');
  });

  it('should stringify a plain object', () => {
    expect(getErrorMessage({ message: 'not a real Error' })).toBe('[object Object]');
  });
});

describe('getErrorCode', () => {
  it('should return the code when present and a string', () => {
    expect(getErrorCode({ code: '42P07' })).toBe('42P07');
  });

  it('should return undefined when code is missing', () => {
    expect(getErrorCode({ message: 'no code here' })).toBeUndefined();
  });

  it('should return undefined when code is not a string', () => {
    expect(getErrorCode({ code: 500 })).toBeUndefined();
  });

  it('should return undefined for null or non-object values', () => {
    expect(getErrorCode(null)).toBeUndefined();
    expect(getErrorCode('a string')).toBeUndefined();
    expect(getErrorCode(42)).toBeUndefined();
  });
});
