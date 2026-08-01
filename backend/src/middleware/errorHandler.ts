import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../config/sentry';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('❌ Error:', err.message);

  // Scrub sensitive data before sending to Sentry
  const cleanedError = {
    message: err.message,
    stack: err.stack,
    url: req.path,
    method: req.method,
    // COPPA: Exclude user data, tokens, PII
  };

  // Send to Sentry (non-blocking)
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(cleanedError);
  }

  res.status(500).json({
    error: 'Internal Server Error',
    requestId: (req as any).id || 'unknown',
  });
}
