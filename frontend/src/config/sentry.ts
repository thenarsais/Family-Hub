import * as Sentry from '@sentry/react';

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn(
      '⚠️  VITE_SENTRY_DSN not configured. Error tracking disabled (Phase 1: set this up).'
    );
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    tracesSampleRate: 0, // Phase 0: disabled (enable in Phase 1)
    replaysSessionSampleRate: 0,
    integrations: [
      new Sentry.Replay({
        maskAllText: true, // Mask sensitive content
        blockAllMedia: true,
      }),
    ],
  });
}

export { Sentry };
