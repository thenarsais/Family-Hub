import * as Sentry from '@sentry/node';
import { httpIntegration, onUncaughtExceptionIntegration, onUnhandledRejectionIntegration } from '@sentry/node';
import { scrubbedError } from '../utils/pii-scrubber';

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  const nodeEnv = process.env.NODE_ENV || 'development';
  const forceLocal = process.env.SENTRY_FORCE_LOCAL === 'true';

  if (!dsn) {
    console.warn('⚠️  SENTRY_DSN not configured. Error tracking disabled.');
    return;
  }

  // Deliberate: dev/test never report to Sentry, so the dashboard only ever
  // shows real errors. Set SENTRY_FORCE_LOCAL=true to smoke-test the wiring.
  if ((nodeEnv === 'development' || nodeEnv === 'test') && !forceLocal) {
    console.info(
      `ℹ️  Sentry disabled in ${nodeEnv} (set SENTRY_FORCE_LOCAL=true to override).`
    );
    return;
  }

  Sentry.init({
    dsn,
    environment: nodeEnv,
    // Errors-only by design. Enable tracesSampleRate/profilesSampleRate when
    // there's a concrete performance question to answer.
    tracesSampleRate: 0,
    profilesSampleRate: 0,
    integrations: [
      httpIntegration(),
      onUncaughtExceptionIntegration(),
      onUnhandledRejectionIntegration(),
    ],
    // COPPA (Decision 29): key-based PII redaction over the event containers
    // most likely to carry it, before anything leaves the process. Sentry's
    // own server-side data scrubber handles free-text patterns (emails, cards)
    // inside message strings.
    beforeSend(event) {
      if (event.request) {
        event.request = scrubbedError(
          event.request as Record<string, unknown>
        ) as typeof event.request;
      }
      if (event.extra) {
        event.extra = scrubbedError(event.extra) as typeof event.extra;
      }
      if (event.contexts) {
        event.contexts = scrubbedError(
          event.contexts as Record<string, unknown>
        ) as typeof event.contexts;
      }
      if (event.user) {
        event.user = scrubbedError(
          event.user as Record<string, unknown>
        ) as typeof event.user;
      }
      return event;
    },
  });
}

export { Sentry };
