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

  it('should initialize Sentry with the configured DSN and disabled sampling', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://example.sentry.io/1');

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
