import * as Sentry from '@sentry/node';
import { httpIntegration, onUncaughtExceptionIntegration, onUnhandledRejectionIntegration } from '@sentry/node';

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn(
      '⚠️  SENTRY_DSN not configured. Error tracking disabled (Phase 1: set this up).'
    );
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0, // Phase 0: disabled (enable in Phase 1)
    profilesSampleRate: 0,
    integrations: [
      httpIntegration(),
      onUncaughtExceptionIntegration(),
      onUnhandledRejectionIntegration(),
    ],
  });
}

export { Sentry };
