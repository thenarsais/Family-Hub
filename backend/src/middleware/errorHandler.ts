import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../config/sentry';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('❌ Error:', err.message);

  // Report the real Error so Sentry parses its stack trace and groups it
  // correctly (passing a plain {message,stack} object instead produces an
  // ungrouped "Non-Error exception captured" with no usable stack). PII is
  // stripped centrally in config/sentry.ts's beforeSend hook — COPPA
  // (Decision 29); req.path/req.method are not PII.
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      extra: {
        path: req.path,
        method: req.method,
        requestId: req.id ?? 'unknown',
      },
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.id || 'unknown',
  });
}
