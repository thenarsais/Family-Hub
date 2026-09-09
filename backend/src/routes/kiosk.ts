import { Router, Request, Response } from 'express';
import { getKioskService } from '../services/kiosk';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';
import { rateLimit } from '../middleware/rate-limiter';

const router = Router();
router.use(normalizeBody);
const kiosk = getKioskService();

function requireUser(req: Request, res: Response): string | null {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({ status: 'error', message: 'User ID required' });
    return null;
  }
  return userId;
}

const fail = (res: Response, code: number, message: string, error?: unknown) =>
  res.status(code).json({
    status: 'error',
    message,
    ...(error ? { error: getErrorMessage(error) } : {}),
  });

// Cap PIN attempts per wall device (x-user-id), independent of IP.
const pinVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many PIN attempts. Wait a few minutes and try again.',
  keyGenerator: (req) => `pin:${(req.headers['x-user-id'] as string) || req.ip || 'unknown'}`,
});

/**
 * T-14 — shared-display kiosk model (FR-056). Enrolment + device list + PIN
 * management are called with a PARENT's x-user-id; POST /session is called with
 * an enrolled device's x-kiosk-token and no user login.
 */

/** POST /api/kiosk/enroll — register this device for the caller's household (parent only). */
router.post('/enroll', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const { label } = req.body;
  try {
    const device = await kiosk.enrollDevice(userId, typeof label === 'string' ? label : '');
    res.status(201).json({ status: 'success', ...device, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'not-allowed') return fail(res, 403, 'Only a parent can set up a family display');
    console.error('Failed to enrol kiosk device:', error);
    fail(res, 500, 'Failed to enrol device', error);
  }
});

/** GET /api/kiosk/devices — registered displays for the household (parent only). */
router.get('/devices', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const devices = await kiosk.listDevices(userId);
    res.json({ status: 'success', devices, count: devices.length, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'not-allowed') return fail(res, 403, 'Not allowed');
    console.error('Failed to list kiosk devices:', error);
    fail(res, 500, 'Failed to list devices', error);
  }
});

/** DELETE /api/kiosk/devices/:id — revoke a display (parent only). */
router.delete('/devices/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const removed = await kiosk.revokeDevice(userId, req.params.id as string);
    if (!removed) return fail(res, 404, 'Display not found');
    res.json({ status: 'success', message: 'Display revoked', timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'not-allowed') return fail(res, 403, 'Not allowed');
    console.error('Failed to revoke kiosk device:', error);
    fail(res, 500, 'Failed to revoke device', error);
  }
});

/** POST /api/kiosk/session — exchange a device token for the household boot payload. No user login. */
router.post('/session', async (req: Request, res: Response) => {
  const token = req.headers['x-kiosk-token'] as string | undefined;
  if (!token) return fail(res, 401, 'Device token required');
  try {
    const resolved = await kiosk.resolveDevice(token);
    if (!resolved) return fail(res, 401, 'Unrecognised device');
    const bootstrap = await kiosk.getBootstrap(resolved.familyId);
    if (!bootstrap) return fail(res, 404, 'Household not found');
    res.json({ status: 'success', ...bootstrap, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to start kiosk session:', error);
    fail(res, 500, 'Failed to start session', error);
  }
});

/** PUT /api/kiosk/pin — set or replace the household PIN (parent only). */
router.put('/pin', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const { pin } = req.body;
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    return fail(res, 400, 'PIN must be exactly 4 digits');
  }
  try {
    await kiosk.setPin(userId, pin);
    res.json({ status: 'success', message: 'PIN set', timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg === 'not-allowed') return fail(res, 403, 'Only a parent can set the family PIN');
    if (msg === 'bad-pin') return fail(res, 400, 'PIN must be exactly 4 digits');
    console.error('Failed to set kiosk PIN:', error);
    fail(res, 500, 'Failed to set PIN', error);
  }
});

/** DELETE /api/kiosk/pin — remove the household PIN (parent only). */
router.delete('/pin', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    await kiosk.clearPin(userId);
    res.json({ status: 'success', message: 'PIN removed', timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'not-allowed') return fail(res, 403, 'Only a parent can change the family PIN');
    console.error('Failed to clear kiosk PIN:', error);
    fail(res, 500, 'Failed to remove PIN', error);
  }
});

/** POST /api/kiosk/pin/verify — check a PIN attempt (any member; rate-limited). */
router.post('/pin/verify', pinVerifyLimiter, async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const { pin } = req.body;
  if (typeof pin !== 'string') return fail(res, 400, 'pin is required');
  try {
    const ok = await kiosk.verifyPin(userId, pin);
    if (!ok) return fail(res, 401, 'Incorrect PIN');
    res.json({ status: 'success', ok: true, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to verify kiosk PIN:', error);
    fail(res, 500, 'Failed to verify PIN', error);
  }
});

export default router;
