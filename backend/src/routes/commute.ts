import { Router, Request, Response } from 'express';
import { getCommuteService } from '../services/commute';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
const commute = getCommuteService();

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

/**
 * GET /api/commute/today — the dashboard card's read model: every route with
 * a live traffic-derived leave-by time, plus the home address / no-school
 * state. Always 200, even when Google Maps isn't configured yet.
 */
router.get('/today', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const summary = await commute.getSummary(userId);
    res.json({ status: 'success', ...summary, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to fetch commute summary:', error);
    fail(res, 500, 'Failed to fetch commute summary', error);
  }
});

/**
 * GET /api/commute/routes — the manage-panel read model (no live traffic call).
 */
router.get('/routes', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const routes = await commute.getRoutes(userId);
    res.json({ status: 'success', routes, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to list commute routes:', error);
    fail(res, 500, 'Failed to list commute routes', error);
  }
});

/**
 * POST /api/commute/routes — Body: { label, destinationAddress, bufferMinutes?,
 * familyMemberId?, originOverride?, and EITHER arriveByTime (fixed-schedule)
 * OR eventTitlePattern (T-26 event-linked — arrive-by derives from the
 * matching calendar event's own start time each day).
 */
router.post('/routes', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { label, destinationAddress, arriveByTime, bufferMinutes, familyMemberId, eventTitlePattern, originOverride } = req.body;
  if (typeof label !== 'string' || !label.trim()) return fail(res, 400, 'label is required');
  if (typeof destinationAddress !== 'string' || !destinationAddress.trim()) {
    return fail(res, 400, 'destinationAddress is required');
  }
  const hasPattern = typeof eventTitlePattern === 'string' && !!eventTitlePattern.trim();
  if (!hasPattern && (typeof arriveByTime !== 'string' || !/^\d{2}:\d{2}$/.test(arriveByTime))) {
    return fail(res, 400, 'arriveByTime must be "HH:MM" (or provide eventTitlePattern instead)');
  }
  if (hasPattern && arriveByTime !== undefined && !/^\d{2}:\d{2}$/.test(arriveByTime)) {
    return fail(res, 400, 'arriveByTime must be "HH:MM"');
  }
  if (bufferMinutes !== undefined && (typeof bufferMinutes !== 'number' || bufferMinutes < 0)) {
    return fail(res, 400, 'bufferMinutes must be a non-negative number');
  }
  if (originOverride !== undefined && (typeof originOverride !== 'string' || !originOverride.trim())) {
    return fail(res, 400, 'originOverride must be a non-empty string');
  }

  try {
    const route = await commute.addRoute(userId, {
      label: label.trim(),
      destinationAddress: destinationAddress.trim(),
      arriveByTime: hasPattern ? undefined : arriveByTime,
      bufferMinutes,
      familyMemberId: typeof familyMemberId === 'string' && familyMemberId.trim() ? familyMemberId : undefined,
      eventTitlePattern: hasPattern ? eventTitlePattern.trim() : undefined,
      originOverride: typeof originOverride === 'string' ? originOverride.trim() : undefined,
    });
    res.status(201).json({ status: 'success', route, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'no-family') return fail(res, 400, 'Set up a family first');
    console.error('Failed to add commute route:', error);
    fail(res, 500, 'Failed to add commute route', error);
  }
});

/**
 * GET /api/commute/suggestions — T-26: calendar events matching a trip
 * keyword that aren't already a confirmed route or a dismissed pattern.
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const suggestions = await commute.getSuggestions(userId);
    res.json({ status: 'success', suggestions, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to fetch commute suggestions:', error);
    fail(res, 500, 'Failed to fetch commute suggestions', error);
  }
});

/**
 * POST /api/commute/suggestions/dismiss — Body: { titlePattern }. T-26: never
 * re-suggest a pattern the parent declined.
 */
router.post('/suggestions/dismiss', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  const { titlePattern } = req.body;
  if (typeof titlePattern !== 'string' || !titlePattern.trim()) return fail(res, 400, 'titlePattern is required');
  try {
    await commute.dismissSuggestion(userId, titlePattern);
    res.json({ status: 'success', timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'no-family') return fail(res, 400, 'Set up a family first');
    console.error('Failed to dismiss commute suggestion:', error);
    fail(res, 500, 'Failed to dismiss commute suggestion', error);
  }
});

/**
 * PATCH /api/commute/routes/:id
 */
router.patch('/routes/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { label, destinationAddress, arriveByTime, bufferMinutes, familyMemberId, eventTitlePattern, originOverride } = req.body;
  if (arriveByTime !== undefined && arriveByTime !== null && !/^\d{2}:\d{2}$/.test(arriveByTime)) {
    return fail(res, 400, 'arriveByTime must be "HH:MM"');
  }
  if (bufferMinutes !== undefined && (typeof bufferMinutes !== 'number' || bufferMinutes < 0)) {
    return fail(res, 400, 'bufferMinutes must be a non-negative number');
  }
  if (originOverride !== undefined && originOverride !== null && typeof originOverride !== 'string') {
    return fail(res, 400, 'originOverride must be a string');
  }

  const updates: Record<string, unknown> = {};
  if (typeof label === 'string' && label.trim()) updates.label = label.trim();
  if (typeof destinationAddress === 'string' && destinationAddress.trim()) updates.destinationAddress = destinationAddress.trim();
  if (typeof arriveByTime === 'string' || arriveByTime === null) updates.arriveByTime = arriveByTime;
  if (bufferMinutes !== undefined) updates.bufferMinutes = bufferMinutes;
  if (typeof familyMemberId === 'string') updates.familyMemberId = familyMemberId;
  if (typeof eventTitlePattern === 'string' || eventTitlePattern === null) {
    updates.eventTitlePattern = eventTitlePattern === null ? null : eventTitlePattern.trim();
  }
  if (typeof originOverride === 'string' || originOverride === null) {
    updates.originOverride = originOverride === null ? null : originOverride.trim();
  }

  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const route = await commute.updateRoute(userId, id, updates);
    if (!route) return fail(res, 404, 'Commute route not found');
    res.json({ status: 'success', route, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to update commute route:', error);
    fail(res, 500, 'Failed to update commute route', error);
  }
});

/**
 * DELETE /api/commute/routes/:id
 */
router.delete('/routes/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const ok = await commute.deleteRoute(userId, id);
    if (!ok) return fail(res, 404, 'Commute route not found');
    res.json({ status: 'success', timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    console.error('Failed to delete commute route:', error);
    fail(res, 500, 'Failed to delete commute route', error);
  }
});

/**
 * PUT /api/commute/settings — Body: { homeAddress?, noSchoolToday? }
 */
router.put('/settings', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { homeAddress, noSchoolToday } = req.body;
  if (homeAddress !== undefined && (typeof homeAddress !== 'string' || !homeAddress.trim())) {
    return fail(res, 400, 'homeAddress must be a non-empty string');
  }
  if (noSchoolToday !== undefined && typeof noSchoolToday !== 'boolean') {
    return fail(res, 400, 'noSchoolToday must be a boolean');
  }

  try {
    if (typeof homeAddress === 'string') await commute.setHomeAddress(userId, homeAddress.trim());
    if (typeof noSchoolToday === 'boolean') await commute.setNoSchoolToday(userId, noSchoolToday);
    const summary = await commute.getSummary(userId);
    res.json({ status: 'success', ...summary, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    if (getErrorMessage(error) === 'no-family') return fail(res, 400, 'Set up a family first');
    console.error('Failed to update commute settings:', error);
    fail(res, 500, 'Failed to update commute settings', error);
  }
});

export default router;
