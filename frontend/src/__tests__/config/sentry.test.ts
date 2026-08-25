import { vi } from 'vitest';

const { mockInit } = vi.hoisted(() => ({ mockInit: vi.fn() }));
vi.mock('@sentry/react', () => ({
  init: mockInit,
}));

import { initSentry, Sentry } from '@/config/sentry';

describe('initSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should warn and skip initialization when VITE_SENTRY_DSN is unset', () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    initSentry();

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('VITE_SENTRY_DSN not configured'));
    expect(mockInit).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('should initialize Sentry with the configured DSN and disabled sampling', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://example.sentry.io/1');

    initSentry();

    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://example.sentry.io/1',
        tracesSampleRate: 0,
        replaysSessionSampleRate: 0,
      })
    );
  });

  it('should re-export the Sentry namespace', () => {
    expect(Sentry).toBeDefined();
  });
});
