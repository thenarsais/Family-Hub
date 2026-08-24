import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../config/sentry';
import { sanitizeForSentry } from '../utils/pii-scrubber';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('❌ Error:', err.message);

  // Scrub sensitive data before sending to Sentry (COPPA Compliance - Decision 29)
  const cleanedError = {
    message: err.message,
    stack: err.stack,
    url: req.path,
    method: req.method,
    // COPPA: Exclude user data, tokens, PII
  };

  // Send to Sentry (non-blocking) with PII scrubbing
  if (process.env.SENTRY_DSN) {
    const sanitized = sanitizeForSentry(cleanedError);
    Sentry.captureException(sanitized);
  }

  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.id || 'unknown',
  });
}
