import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../config/sentry';

// Express hands the error middleware whatever was thrown or passed to
// next(err). These are the optional fields this handler reads: body-parser /
// http-errors set status/statusCode/expose on client errors (malformed JSON,
// payload too large, unsupported charset, ...); `body` is present on the JSON
// parse SyntaxError specifically (it holds the raw unparsed string).
interface ErrorLike extends Error {
  status?: number;
  statusCode?: number;
  expose?: boolean;
  body?: unknown;
}

export function errorHandler(
  rawErr: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const err = rawErr as ErrorLike;

  // Client errors — a malformed request body, not a server bug. Respond with
  // the intended 4xx and do NOT report to Sentry (these are caller mistakes;
  // reporting them just adds noise and can page on nothing).
  const isJsonParseError = err instanceof SyntaxError && 'body' in err;
  const isClientError = isJsonParseError || err.expose === true;

  if (isClientError) {
    const status = isJsonParseError ? 400 : err.status ?? err.statusCode ?? 400;
    const message = isJsonParseError ? 'Invalid JSON in request body' : err.message;
    console.warn(`⚠️  ${status} ${req.method} ${req.path}: ${err.message}`);
    res.status(status).json({
      error: message,
      requestId: req.id || 'unknown',
    });
    return;
  }

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
