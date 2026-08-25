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
      })
    );
  });

  it('should default environment to development when NODE_ENV is unset', () => {
    process.env.SENTRY_DSN = 'https://example.sentry.io/1';
    delete process.env.NODE_ENV;

    initSentry();

    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ environment: 'development' }));
  });

  it('should re-export the Sentry namespace', () => {
    expect(Sentry).toBeDefined();
  });
});
