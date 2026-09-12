/**
 * WaterSmart client — City of Thornton's water utility portal (FR-139).
 *
 * No official API. This follows the same login flow the wbyoung/watersmart
 * Home Assistant integration reverse-engineered: a cookie-session login (a
 * two-step POST when the portal challenges with a `loginRefreshToken`),
 * then a plain authenticated GET returns clean JSON. Source consulted:
 * https://github.com/wbyoung/watersmart/blob/main/custom_components/watersmart/client.py
 *
 * Credentials are env vars (WATERSMART_HOSTNAME/EMAIL/PASSWORD) -- this is a
 * single-family app, not multi-tenant, so there's no per-user credential
 * store here, matching SMARTTHINGS_TOKEN / OPENWEATHER_API_KEY.
 */

import { query } from '../database/connection';

interface WaterSmartConfig {
  hostname: string;
  email: string;
  password: string;
}

export interface WaterUsageRow {
  read_datetime: string;
  gallons: string | null;
  leak_gallons: string | null;
}

export interface DailyTotal {
  date: string;
  gallons: number;
}

export interface WaterUsageSummary {
  configured: boolean;
  lastSyncedAt: string | null;
  latestReadingAt: string | null;
  dailyTotals: DailyTotal[];
  leakDetected: boolean;
}

export class WaterSmartAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WaterSmartAuthError';
  }
}

export class WaterSmartFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WaterSmartFetchError';
  }
}

// WaterSmart (or a WAF in front of it) has been observed silently holding a
// connection open instead of returning an error when it doesn't like a
// request's pace -- every fetch to it needs its own timeout so a stalled
// request fails fast instead of hanging the poll (and the caller's HTTP
// request, for a manual sync) indefinitely.
const REQUEST_TIMEOUT_MS = 15_000;

// WaterSmart's WAF serves different content (or rejects outright) to an
// obviously non-browser client -- send browser-shaped headers throughout.
const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

export function getConfig(): WaterSmartConfig | null {
  const hostname = process.env.WATERSMART_HOSTNAME;
  const email = process.env.WATERSMART_EMAIL;
  const password = process.env.WATERSMART_PASSWORD;
  if (!hostname || !email || !password) return null;
  return { hostname, email, password };
}

export function isConfigured(): boolean {
  return getConfig() !== null;
}

/** A minimal same-origin cookie jar -- just enough for a 2-3 request login flow. */
class CookieJar {
  private cookies = new Map<string, string>();

  absorb(res: Response): void {
    const getSetCookie = (res.headers as { getSetCookie?: () => string[] }).getSetCookie;
    const raw = typeof getSetCookie === 'function' ? getSetCookie.call(res.headers) : [];
    for (const entry of raw) {
      const pair = entry.split(';', 1)[0];
      const eq = pair.indexOf('=');
      if (eq > 0) this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }

  header(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

/** Best-effort scrape of `<input name="loginRefreshToken" value="...">`. */
function extractLoginRefreshToken(html: string): string | null {
  const tag = html.match(/<input\b[^>]*name=["']loginRefreshToken["'][^>]*>/i)?.[0];
  if (!tag) return null;
  return tag.match(/value=["']([^"']*)["']/i)?.[1] ?? null;
}

/** Best-effort scrape of `.error-message` blocks the portal renders on a failed login. */
function extractErrorMessages(html: string): string[] {
  const matches = html.matchAll(
    /<[^>]+class=["'][^"']*\berror-message\b[^"']*["'][^>]*>([\s\S]*?)<\/[a-zA-Z]+>/gi,
  );
  const out: string[] = [];
  for (const m of matches) {
    const text = m[1].replace(/<[^>]*>/g, '').trim();
    if (text) out.push(text);
  }
  return out;
}

/**
 * A successful login gets a 302 (WaterSmart redirects to the site root) --
 * and critically, the Set-Cookie on THAT redirect response carries a second,
 * per-session cookie the REST API actually checks (beyond the plain
 * PHPSESSID every request gets). `fetch`'s default automatic-redirect-follow
 * silently drops Set-Cookie headers from intermediate hops, so the login
 * looked "successful" (no scraped error) while the real auth cookie was
 * discarded -- every subsequent API call then came back 403. `redirect:
 * 'manual'` is required throughout this function so those cookies are seen.
 */
async function login(config: WaterSmartConfig): Promise<CookieJar> {
  const jar = new CookieJar();
  const base = `https://${config.hostname}.watersmart.com`;
  const url = `${base}/index.php/welcome/login?forceEmail=1`;
  const headers = { ...BROWSER_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' };

  const post = async (body: URLSearchParams) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, Cookie: jar.header() },
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    jar.absorb(res);
    return res;
  };

  const isRedirect = (res: Response) => res.status >= 300 && res.status < 400;

  let res = await post(new URLSearchParams({ token: '', email: config.email, password: config.password }));
  if (isRedirect(res)) return jar;

  let html = await res.text();
  const refreshToken = extractLoginRefreshToken(html);
  if (refreshToken) {
    res = await post(
      new URLSearchParams({
        token: '',
        loginRefreshToken: refreshToken,
        email: config.email,
        password: config.password,
      }),
    );
    if (isRedirect(res)) return jar;
    html = await res.text();
  }

  const errors = extractErrorMessages(html);
  if (errors.length > 0) throw new WaterSmartAuthError(errors.join('; '));

  // Neither a redirect nor a scraped error -- the portal's response shape
  // changed in some way this client doesn't recognize. Fail loudly rather
  // than silently proceeding with a cookie jar that may not actually work.
  throw new WaterSmartAuthError('Unrecognized login response (no redirect, no error message)');
}

interface RawUsageRecord {
  read_datetime: number;
  gallons: number | null;
  leak_gallons: number | null;
}

async function fetchHourlyData(config: WaterSmartConfig, jar: CookieJar): Promise<RawUsageRecord[]> {
  const res = await fetch(
    `https://${config.hostname}.watersmart.com/index.php/rest/v1/Chart/RealTimeChart`,
    { headers: { ...BROWSER_HEADERS, Cookie: jar.header() }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
  );
  if (!res.ok) {
    throw new WaterSmartFetchError(`RealTimeChart request failed: HTTP ${res.status}`);
  }
  const body = (await res.json()) as { data?: { series?: RawUsageRecord[] } };
  return body.data?.series ?? [];
}

/**
 * Log in, fetch the current hourly series, and upsert it into `water_usage`.
 * Throws 'not-configured' if the env vars aren't set (callers should treat
 * that as "feature not connected", not an error to alarm over).
 */
export async function syncWaterUsage(): Promise<{ synced: number; latestReadAt: string | null }> {
  const config = getConfig();
  if (!config) throw new Error('not-configured');

  const jar = await login(config);
  const series = await fetchHourlyData(config, jar);

  let synced = 0;
  let latest: number | null = null;

  for (const rec of series) {
    if (typeof rec.read_datetime !== 'number') continue;
    const readAtIso = new Date(rec.read_datetime * 1000).toISOString();
    await query(
      `INSERT INTO water_usage (read_datetime, gallons, leak_gallons, synced_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (read_datetime) DO UPDATE SET
         gallons = EXCLUDED.gallons,
         leak_gallons = EXCLUDED.leak_gallons,
         synced_at = now()`,
      [readAtIso, rec.gallons, rec.leak_gallons],
    );
    synced += 1;
    if (latest === null || rec.read_datetime > latest) latest = rec.read_datetime;
  }

  return { synced, latestReadAt: latest === null ? null : new Date(latest * 1000).toISOString() };
}

/** The dashboard card's read model -- always safe to call, even unconfigured. */
export async function getUsageSummary(): Promise<WaterUsageSummary> {
  if (!isConfigured()) {
    return { configured: false, lastSyncedAt: null, latestReadingAt: null, dailyTotals: [], leakDetected: false };
  }

  // Anchored to the LATEST reading actually on file, not wall-clock now().
  // WaterSmart's own docs say usage data lags "a day or more" -- true for a
  // healthy account -- but a meter that's stopped reporting (or an account
  // whose AMI data has a real gap) can lag by months. Anchoring to now()
  // would show a permanently-empty card in that case; anchoring to the
  // latest available reading always shows the last 8 days of whatever data
  // actually exists.
  const { rows: dailyRows } = await query<{ date: string; gallons: string | null }>(
    `WITH bounds AS (SELECT MAX(read_datetime) AS latest FROM water_usage)
     SELECT to_char(read_datetime, 'YYYY-MM-DD') AS date, SUM(gallons) AS gallons
     FROM water_usage, bounds
     WHERE read_datetime >= bounds.latest - INTERVAL '8 days'
     GROUP BY date
     ORDER BY date ASC`,
  );

  const { rows: metaRows } = await query<{ last_synced_at: string | null; latest_reading_at: string | null }>(
    `SELECT MAX(synced_at) AS last_synced_at, MAX(read_datetime) AS latest_reading_at FROM water_usage`,
  );

  const { rows: leakRows } = await query<{ count: string }>(
    `WITH bounds AS (SELECT MAX(read_datetime) AS latest FROM water_usage)
     SELECT COUNT(*) AS count FROM water_usage, bounds
     WHERE leak_gallons IS NOT NULL AND leak_gallons > 0 AND read_datetime >= bounds.latest - INTERVAL '2 days'`,
  );

  return {
    configured: true,
    lastSyncedAt: metaRows[0]?.last_synced_at ?? null,
    latestReadingAt: metaRows[0]?.latest_reading_at ?? null,
    dailyTotals: dailyRows.map((r) => ({ date: r.date, gallons: Number(r.gallons ?? 0) })),
    leakDetected: Number(leakRows[0]?.count ?? '0') > 0,
  };
}

let syncInterval: ReturnType<typeof setInterval> | null = null;
let initialSyncTimeout: ReturnType<typeof setTimeout> | null = null;
const SYNC_INTERVAL_MS = 4 * 60 * 60 * 1000; // every 4 hours
const INITIAL_SYNC_DELAY_MS = 15_000; // let the server finish booting first

/**
 * Starts the background poll. No-ops (logging once) when unconfigured, so
 * it's always safe to call at server startup regardless of environment.
 */
export function startWaterSync(): void {
  if (!isConfigured()) {
    console.log('ℹ️  WaterSmart not configured (WATERSMART_HOSTNAME/EMAIL/PASSWORD) -- water usage sync disabled');
    return;
  }
  if (syncInterval || initialSyncTimeout) return; // already started

  const run = () => {
    syncWaterUsage()
      .then(({ synced, latestReadAt }) => {
        console.log(`💧 WaterSmart sync: ${synced} reading(s), latest ${latestReadAt ?? 'n/a'}`);
      })
      .catch((err) => {
        console.error('WaterSmart sync failed:', err instanceof Error ? err.message : err);
      });
  };

  initialSyncTimeout = setTimeout(run, INITIAL_SYNC_DELAY_MS);
  syncInterval = setInterval(run, SYNC_INTERVAL_MS);
}

/** Test-only: lets a spec reset the singleton timers between runs. */
export function stopWaterSync(): void {
  if (syncInterval) clearInterval(syncInterval);
  if (initialSyncTimeout) clearTimeout(initialSyncTimeout);
  syncInterval = null;
  initialSyncTimeout = null;
}
