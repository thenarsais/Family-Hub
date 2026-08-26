import { Request, Response, NextFunction } from 'express';

/**
 * express.json() only populates req.body for requests whose Content-Type it
 * recognizes as JSON. A bodyless request — or one whose JSON body is literally
 * `null` — leaves req.body null/undefined, so `const { x } = req.body` in a
 * route handler throws a TypeError and the route 500s instead of returning its
 * intended 4xx (e.g. "userId required" / "field missing").
 *
 * Applied both app-wide (server.ts) and per-router, so a router carries this
 * guarantee wherever it's mounted — including the minimal test apps that mount
 * a single router.
 */
export function normalizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body == null) {
    req.body = {};
  }
  next();
}
