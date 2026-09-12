import { Router, Request, Response } from 'express';
import { getUsageSummary, syncWaterUsage, isConfigured, WaterSmartAuthError } from '../services/watersmart';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request

// Family-wide utility data, same as /api/energy -- no per-user auth gate.

/**
 * GET /api/water/usage
 * The dashboard card's read model: daily totals for the last ~8 days, the
 * most recent reading/sync timestamps, and a leak flag. Always 200s, even
 * when WaterSmart isn't configured yet (`configured: false`).
 */
router.get('/usage', async (req: Request, res: Response) => {
  try {
    const summary = await getUsageSummary();
    res.json({ status: 'success', ...summary, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to fetch water usage:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch water usage',
      error: getErrorMessage(error),
    });
  }
});

// Guards against hammering WaterSmart's login endpoint from repeated manual
// clicks -- module-scoped is fine, this process only ever runs one instance.
let lastManualSyncAt = 0;
const MIN_MANUAL_SYNC_INTERVAL_MS = 2 * 60 * 1000;

/** Test-only: clears the throttle so each test starts from a clean state. */
export function _resetManualSyncThrottleForTests(): void {
  lastManualSyncAt = 0;
}

/**
 * POST /api/water/sync
 * Manually trigger a sync right now, instead of waiting for the next
 * scheduled poll -- mainly for verifying a newly-configured account works.
 */
router.post('/sync', async (req: Request, res: Response) => {
  if (!isConfigured()) {
    return res.status(400).json({
      status: 'error',
      message: 'WaterSmart is not configured (set WATERSMART_HOSTNAME/EMAIL/PASSWORD)',
    });
  }

  const elapsed = Date.now() - lastManualSyncAt;
  if (elapsed < MIN_MANUAL_SYNC_INTERVAL_MS) {
    return res.status(429).json({
      status: 'error',
      message: `Try again in ${Math.ceil((MIN_MANUAL_SYNC_INTERVAL_MS - elapsed) / 1000)}s`,
    });
  }

  try {
    lastManualSyncAt = Date.now();
    const result = await syncWaterUsage();
    res.json({ status: 'success', ...result, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Manual WaterSmart sync failed:', error);
    // A bad password/account surfaces as an auth error from the service --
    // worth a distinct message so it's obviously a credentials problem.
    const isAuthError = error instanceof WaterSmartAuthError;
    res.status(isAuthError ? 401 : 502).json({
      status: 'error',
      message: isAuthError ? 'WaterSmart rejected the login -- check the configured email/password' : 'Could not sync with WaterSmart',
      error: getErrorMessage(error),
    });
  }
});

export default router;
