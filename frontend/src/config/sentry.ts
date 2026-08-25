// @sentry/react is dynamically imported so it's never bundled into the
// main chunk while VITE_SENTRY_DSN is unset (Phase 0: not configured yet).
// A prior static `import * as Sentry from '@sentry/react'` here (and in
// ErrorBoundary.tsx) meant the SDK shipped to every user regardless of
// whether error tracking was ever actually enabled.
let sentryClient: typeof import('@sentry/react') | null = null;

export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (!dsn) {
    console.warn(
      '⚠️  VITE_SENTRY_DSN not configured. Error tracking disabled (Phase 1: set this up).'
    );
    return;
  }

  const Sentry = await import('@sentry/react');
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    tracesSampleRate: 0, // Phase 0: disabled (enable in Phase 1)
    replaysSessionSampleRate: 0,
  });
  sentryClient = Sentry;
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  sentryClient?.captureException(error, context);
}
