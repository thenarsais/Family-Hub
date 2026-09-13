import { getDrivingTime, isConfigured, _clearCacheForTests, DirectionsConfigError, DirectionsApiError } from '../../services/directions';

function fakeResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as unknown as Response;
}

const OK_BODY = {
  status: 'OK',
  routes: [
    {
      legs: [
        {
          duration: { value: 900 }, // 15 min
          duration_in_traffic: { value: 1200 }, // 20 min
          distance: { value: 16093 }, // 10 mi
        },
      ],
    },
  ],
};

describe('directions service', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    _clearCacheForTests();
    process.env = { ...OLD_ENV, GOOGLE_MAPS_API_KEY: 'test-key' };
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('isConfigured', () => {
    it('reflects whether GOOGLE_MAPS_API_KEY is set', () => {
      expect(isConfigured()).toBe(true);
      delete process.env.GOOGLE_MAPS_API_KEY;
      expect(isConfigured()).toBe(false);
    });
  });

  describe('getDrivingTime', () => {
    it('throws DirectionsConfigError when no key is configured', async () => {
      delete process.env.GOOGLE_MAPS_API_KEY;
      await expect(getDrivingTime('a', 'b')).rejects.toThrow(DirectionsConfigError);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns minutes/miles derived from the Directions response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(fakeResponse(OK_BODY));
      const result = await getDrivingTime('123 Home St', '456 School Ave');
      expect(result).toEqual({ durationMin: 15, durationInTrafficMin: 20, distanceMi: 10 });
    });

    it('caches by origin/destination so a second call skips fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(fakeResponse(OK_BODY));
      await getDrivingTime('123 Home St', '456 School Ave');
      await getDrivingTime('123 Home St', '456 School Ave');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('does not share cache across different origin/destination pairs', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(fakeResponse(OK_BODY))
        .mockResolvedValueOnce(fakeResponse(OK_BODY));
      await getDrivingTime('123 Home St', '456 School Ave');
      await getDrivingTime('123 Home St', 'A different school');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('throws DirectionsApiError on a non-OK HTTP response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(fakeResponse({}, false, 500));
      await expect(getDrivingTime('a', 'b')).rejects.toThrow(DirectionsApiError);
    });

    it('throws DirectionsApiError when the API status is not OK', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(fakeResponse({ status: 'ZERO_RESULTS' }));
      await expect(getDrivingTime('a', 'b')).rejects.toThrow('ZERO_RESULTS');
    });

    it('throws DirectionsApiError when the response is missing leg data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(fakeResponse({ status: 'OK', routes: [] }));
      await expect(getDrivingTime('a', 'b')).rejects.toThrow(DirectionsApiError);
    });
  });
});
