// @sentry/react is dynamically imported so it's never bundled into the
// main chunk unless error reporting is actually enabled for this environment.
// A prior static `import * as Sentry from '@sentry/react'` here (and in
// ErrorBoundary.tsx) meant the SDK shipped to every user regardless of
// whether error tracking was ever enabled.
let sentryClient: typeof import('@sentry/react') | null = null;

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '';
}

export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  const forceLocal = import.meta.env.VITE_SENTRY_FORCE_LOCAL === 'true';

  if (!dsn) {
    console.warn('⚠️  VITE_SENTRY_DSN not configured. Error tracking disabled.');
    return;
  }

  // Deliberate: local dev never reports to Sentry, so the dashboard only ever
  // shows real user errors. Set VITE_SENTRY_FORCE_LOCAL=true to smoke-test the
  // integration from localhost.
  if (isLocalhost() && !forceLocal) {
    console.info(
      'ℹ️  Sentry disabled on localhost (set VITE_SENTRY_FORCE_LOCAL=true to override).'
    );
    return;
  }

  const Sentry = await import('@sentry/react');
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    // Errors-only by design. Enable tracesSampleRate (performance) or add
    // replayIntegration (session replay) when there's a concrete need — both
    // are one-line changes here.
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
  });
  sentryClient = Sentry;
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  sentryClient?.captureException(error, context);
}
