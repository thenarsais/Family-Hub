import { vi } from 'vitest';

const { mockInit, mockCaptureException } = vi.hoisted(() => ({
  mockInit: vi.fn(),
  mockCaptureException: vi.fn(),
}));
vi.mock('@sentry/react', () => ({
  init: mockInit,
  captureException: mockCaptureException,
}));

import { initSentry, captureException } from '@/config/sentry';

describe('initSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should no-op captureException before Sentry has ever been initialized', () => {
    expect(() => captureException(new Error('boom'))).not.toThrow();
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('should warn and skip initialization when VITE_SENTRY_DSN is unset', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await initSentry();

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('VITE_SENTRY_DSN not configured'));
    expect(mockInit).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('should skip initialization on localhost without VITE_SENTRY_FORCE_LOCAL', async () => {
    // jsdom serves the suite from http://localhost:5173 (see vitest.config.ts)
    vi.stubEnv('VITE_SENTRY_DSN', 'https://example.sentry.io/1');
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    await initSentry();

    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('localhost'));
    expect(mockInit).not.toHaveBeenCalled();
    consoleInfoSpy.mockRestore();
  });

  it('should initialize Sentry with the configured DSN and disabled sampling', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://example.sentry.io/1');
    vi.stubEnv('VITE_SENTRY_FORCE_LOCAL', 'true');

    await initSentry();

    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://example.sentry.io/1',
        tracesSampleRate: 0,
        replaysSessionSampleRate: 0,
      })
    );

    captureException(new Error('boom'));
    expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), undefined);
  });
});
