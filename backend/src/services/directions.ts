/**
 * Google Directions client (T-16 / FR-083). Driving directions with live
 * traffic — Directions API has no `arrival_time` for driving mode (only
 * transit), so "leave by" is computed by the caller: arriveBy − duration −
 * buffer, using `departure_time=now` to get a traffic-aware duration.
 *
 * Cached ~3min per origin/destination pair — a wall-display card refreshing
 * every minute has no reason to re-call Google that often, and it keeps
 * usage well inside the free tier.
 */

export interface DrivingTime {
  durationMin: number;
  durationInTrafficMin: number;
  distanceMi: number;
}

export class DirectionsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DirectionsConfigError';
  }
}

export class DirectionsApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DirectionsApiError';
  }
}

const CACHE_TTL_MS = 3 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const cache = new Map<string, { result: DrivingTime; expiresAt: number }>();

export function isConfigured(): boolean {
  return !!process.env.GOOGLE_MAPS_API_KEY;
}

/** Test-only: clears the module-scoped cache so each test starts clean. */
export function _clearCacheForTests(): void {
  cache.clear();
}

export async function getDrivingTime(origin: string, destination: string): Promise<DrivingTime> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new DirectionsConfigError('GOOGLE_MAPS_API_KEY is not configured');

  const cacheKey = `${origin}|${destination}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
  url.searchParams.set('origin', origin);
  url.searchParams.set('destination', destination);
  url.searchParams.set('mode', 'driving');
  url.searchParams.set('departure_time', 'now');
  url.searchParams.set('traffic_model', 'best_guess');
  url.searchParams.set('key', apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url.toString(), { signal: controller.signal });
  } catch (err: unknown) {
    throw new DirectionsApiError(`Directions request failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) throw new DirectionsApiError(`Directions API HTTP ${res.status}`);

  const data = (await res.json()) as {
    status: string;
    error_message?: string;
    routes?: { legs?: { duration?: { value: number }; duration_in_traffic?: { value: number }; distance?: { value: number } }[] }[];
  };
  if (data.status !== 'OK') {
    throw new DirectionsApiError(`Directions API status ${data.status}${data.error_message ? `: ${data.error_message}` : ''}`);
  }

  const leg = data.routes?.[0]?.legs?.[0];
  const durationSec = leg?.duration?.value;
  const durationInTrafficSec = leg?.duration_in_traffic?.value ?? durationSec;
  const distanceMeters = leg?.distance?.value;
  if (durationSec == null || durationInTrafficSec == null || distanceMeters == null) {
    throw new DirectionsApiError('Directions API response missing duration/distance');
  }

  const result: DrivingTime = {
    durationMin: Math.round(durationSec / 60),
    durationInTrafficMin: Math.round(durationInTrafficSec / 60),
    distanceMi: Math.round((distanceMeters / 1609.34) * 10) / 10,
  };
  cache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}
