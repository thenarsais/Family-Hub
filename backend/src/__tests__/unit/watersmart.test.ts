import * as connection from '../../database/connection';
import {
  isConfigured,
  getConfig,
  syncWaterUsage,
  getUsageSummary,
  startWaterSync,
  stopWaterSync,
  WaterSmartAuthError,
  WaterSmartFetchError,
} from '../../services/watersmart';

jest.mock('../../database/connection');

const mockQuery = connection.query as jest.Mock;

const ENV_KEYS = ['WATERSMART_HOSTNAME', 'WATERSMART_EMAIL', 'WATERSMART_PASSWORD'] as const;
const originalEnv: Record<string, string | undefined> = {};

function setConfigured() {
  process.env.WATERSMART_HOSTNAME = 'thornton';
  process.env.WATERSMART_EMAIL = 'parent@example.com';
  process.env.WATERSMART_PASSWORD = 'hunter2';
}

function fakeResponse(opts: {
  ok?: boolean;
  status?: number;
  text?: string;
  json?: unknown;
  setCookies?: string[];
}): Response {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    text: async () => opts.text ?? '',
    json: async () => opts.json ?? {},
    headers: { getSetCookie: () => opts.setCookies ?? [] },
  } as unknown as Response;
}

describe('watersmart service', () => {
  beforeAll(() => {
    for (const k of ENV_KEYS) originalEnv[k] = process.env[k];
  });

  afterAll(() => {
    for (const k of ENV_KEYS) {
      if (originalEnv[k] === undefined) delete process.env[k];
      else process.env[k] = originalEnv[k];
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    for (const k of ENV_KEYS) delete process.env[k];
    global.fetch = jest.fn();
    stopWaterSync();
  });

  afterEach(() => {
    stopWaterSync();
  });

  describe('isConfigured / getConfig', () => {
    it('is false when any env var is missing', () => {
      expect(isConfigured()).toBe(false);
      expect(getConfig()).toBeNull();
    });

    it('is true once all three are set', () => {
      setConfigured();
      expect(isConfigured()).toBe(true);
      expect(getConfig()).toEqual({
        hostname: 'thornton',
        email: 'parent@example.com',
        password: 'hunter2',
      });
    });
  });

  describe('getUsageSummary', () => {
    it('short-circuits to an unconfigured summary without touching the database', async () => {
      const summary = await getUsageSummary();
      expect(summary).toEqual({
        configured: false,
        lastSyncedAt: null,
        latestReadingAt: null,
        dailyTotals: [],
        leakDetected: false,
      });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('aggregates daily totals, sync/reading timestamps, and the leak flag', async () => {
      setConfigured();
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            { date: '2026-09-10', gallons: '120.50' },
            { date: '2026-09-11', gallons: '95.00' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ last_synced_at: '2026-09-11T12:00:00Z', latest_reading_at: '2026-09-11T11:00:00Z' }],
        })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });

      const summary = await getUsageSummary();

      expect(summary).toEqual({
        configured: true,
        lastSyncedAt: '2026-09-11T12:00:00Z',
        latestReadingAt: '2026-09-11T11:00:00Z',
        dailyTotals: [
          { date: '2026-09-10', gallons: 120.5 },
          { date: '2026-09-11', gallons: 95 },
        ],
        leakDetected: true,
      });
    });

    it('reports no leak when the count is zero', async () => {
      setConfigured();
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ last_synced_at: null, latest_reading_at: null }] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const summary = await getUsageSummary();
      expect(summary.leakDetected).toBe(false);
      expect(summary.dailyTotals).toEqual([]);
    });
  });

  describe('syncWaterUsage', () => {
    it("throws 'not-configured' when env vars are missing", async () => {
      await expect(syncWaterUsage()).rejects.toThrow('not-configured');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('logs in with a single POST when no loginRefreshToken challenge is issued, then upserts the series', async () => {
      setConfigured();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(fakeResponse({ text: '<html>welcome back</html>', setCookies: ['session=abc123; Path=/'] }))
        .mockResolvedValueOnce(
          fakeResponse({
            json: {
              data: {
                series: [
                  { read_datetime: 1_757_000_000, gallons: 12.5, leak_gallons: null },
                  { read_datetime: 1_757_003_600, gallons: 8, leak_gallons: 0 },
                ],
              },
            },
          }),
        );

      const result = await syncWaterUsage();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      // the login POST
      const [loginUrl, loginInit] = (global.fetch as jest.Mock).mock.calls[0];
      expect(loginUrl).toBe('https://thornton.watersmart.com/index.php/welcome/login?forceEmail=1');
      expect(loginInit.method).toBe('POST');
      // the authenticated GET carries the cookie captured from the login response
      const [chartUrl, chartInit] = (global.fetch as jest.Mock).mock.calls[1];
      expect(chartUrl).toBe('https://thornton.watersmart.com/index.php/rest/v1/Chart/RealTimeChart');
      expect(chartInit.headers.Cookie).toBe('session=abc123');

      expect(result.synced).toBe(2);
      expect(result.latestReadAt).toBe(new Date(1_757_003_600 * 1000).toISOString());
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery.mock.calls[0][1]).toEqual([
        new Date(1_757_000_000 * 1000).toISOString(),
        12.5,
        null,
      ]);
    });

    it('follows the loginRefreshToken challenge with a second POST before fetching data', async () => {
      setConfigured();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(
          fakeResponse({
            text: '<form><input type="hidden" name="loginRefreshToken" value="tok-1"></form>',
          }),
        )
        .mockResolvedValueOnce(fakeResponse({ text: '<html>ok</html>' }))
        .mockResolvedValueOnce(fakeResponse({ json: { data: { series: [] } } }));

      const result = await syncWaterUsage();

      expect(global.fetch).toHaveBeenCalledTimes(3);
      const secondBody = (global.fetch as jest.Mock).mock.calls[1][1].body as URLSearchParams;
      expect(secondBody.get('loginRefreshToken')).toBe('tok-1');
      expect(result.synced).toBe(0);
      expect(result.latestReadAt).toBeNull();
    });

    it('throws WaterSmartAuthError and never calls the chart endpoint when the portal reports a login error', async () => {
      setConfigured();
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        fakeResponse({ text: '<div class="error-message">Invalid email or password</div>' }),
      );

      let caught: unknown;
      try {
        await syncWaterUsage();
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(WaterSmartAuthError);
      expect((caught as Error).message).toBe('Invalid email or password');
      expect(global.fetch).toHaveBeenCalledTimes(1); // no second login POST, no chart GET
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('throws WaterSmartFetchError when the chart request is not ok', async () => {
      setConfigured();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(fakeResponse({ text: '<html>ok</html>' }))
        .mockResolvedValueOnce(fakeResponse({ ok: false, status: 500 }));

      await expect(syncWaterUsage()).rejects.toThrow(WaterSmartFetchError);
    });

    it('skips a record with a non-numeric read_datetime rather than failing the whole sync', async () => {
      setConfigured();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(fakeResponse({ text: '<html>ok</html>' }))
        .mockResolvedValueOnce(
          fakeResponse({
            json: { data: { series: [{ read_datetime: 'not-a-number', gallons: 1, leak_gallons: null }] } },
          }),
        );

      const result = await syncWaterUsage();
      expect(result.synced).toBe(0);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('startWaterSync', () => {
    it('no-ops when unconfigured', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      startWaterSync();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('not configured'));
      logSpy.mockRestore();
    });

    it('is safe to call twice without starting a second timer', () => {
      setConfigured();
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      startWaterSync();
      startWaterSync();
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      setIntervalSpy.mockRestore();
    });
  });
});
