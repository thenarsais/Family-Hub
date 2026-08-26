const mockInit = jest.fn();
jest.mock('@sentry/node', () => ({
  init: mockInit,
  httpIntegration: jest.fn(() => 'http-integration'),
  onUncaughtExceptionIntegration: jest.fn(() => 'uncaught-integration'),
  onUnhandledRejectionIntegration: jest.fn(() => 'unhandled-integration'),
}));

import { initSentry, Sentry } from '../../config/sentry';

describe('initSentry', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('should warn and skip initialization when SENTRY_DSN is unset', () => {
    delete process.env.SENTRY_DSN;
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    initSentry();

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('SENTRY_DSN not configured'));
    expect(mockInit).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('should skip initialization in development without SENTRY_FORCE_LOCAL', () => {
    process.env.SENTRY_DSN = 'https://example.sentry.io/1';
    process.env.NODE_ENV = 'development';
    delete process.env.SENTRY_FORCE_LOCAL;
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

    initSentry();

    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Sentry disabled in development'));
    expect(mockInit).not.toHaveBeenCalled();
    consoleInfoSpy.mockRestore();
  });

  it('should skip initialization in test without SENTRY_FORCE_LOCAL', () => {
    process.env.SENTRY_DSN = 'https://example.sentry.io/1';
    process.env.NODE_ENV = 'test';
    delete process.env.SENTRY_FORCE_LOCAL;
    jest.spyOn(console, 'info').mockImplementation();

    initSentry();

    expect(mockInit).not.toHaveBeenCalled();
  });

  it('should initialize in development when SENTRY_FORCE_LOCAL=true', () => {
    process.env.SENTRY_DSN = 'https://example.sentry.io/1';
    process.env.NODE_ENV = 'development';
    process.env.SENTRY_FORCE_LOCAL = 'true';

    initSentry();

    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ environment: 'development' }));
  });

  it('should initialize Sentry with the configured DSN and disabled sampling', () => {
    process.env.SENTRY_DSN = 'https://example.sentry.io/1';
    process.env.NODE_ENV = 'production';

    initSentry();

    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://example.sentry.io/1',
        environment: 'production',
        tracesSampleRate: 0,
        profilesSampleRate: 0,
        integrations: ['http-integration', 'uncaught-integration', 'unhandled-integration'],
        beforeSend: expect.any(Function),
      })
    );
  });

  it('should default environment to development when NODE_ENV is unset', () => {
    process.env.SENTRY_DSN = 'https://example.sentry.io/1';
    delete process.env.NODE_ENV;
    process.env.SENTRY_FORCE_LOCAL = 'true';

    initSentry();

    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ environment: 'development' }));
  });

  it('beforeSend should redact PII from request, extra, contexts, and user containers', () => {
    process.env.SENTRY_DSN = 'https://example.sentry.io/1';
    process.env.NODE_ENV = 'production';

    initSentry();

    const beforeSend = mockInit.mock.calls[0][0].beforeSend as (event: unknown) => unknown;
    const cleaned = beforeSend({
      request: { data: { password: 'hunter2' }, url: '/auth/signup' },
      extra: { child_name: 'Kiddo', method: 'POST' },
      contexts: { session: { auth_token: 'abc123' } },
      user: { email: 'parent@example.com', id: 'u_1' },
    }) as {
      request: { data: { password: string }; url: string };
      extra: { child_name: string; method: string };
      contexts: { session: { auth_token: string } };
      user: { email: string; id: string };
    };

    expect(cleaned.request.data.password).toBe('[REDACTED]');
    expect(cleaned.request.url).toBe('/auth/signup');
    expect(cleaned.extra.child_name).toBe('[REDACTED]');
    expect(cleaned.extra.method).toBe('POST');
    expect(cleaned.contexts.session.auth_token).toBe('[REDACTED]');
    expect(cleaned.user.email).toBe('[REDACTED]');
    expect(cleaned.user.id).toBe('u_1');
  });

  it('should re-export the Sentry namespace', () => {
    expect(Sentry).toBeDefined();
  });
});
