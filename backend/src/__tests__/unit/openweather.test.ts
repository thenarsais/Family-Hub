import {
  getCurrentWeatherByCity,
  getCurrentWeatherByCoords,
  getForecast,
  isWeatherSuitable,
} from '../../services/openweather';
import * as cache from '../../database/cache';

jest.mock('../../database/cache');

const mockCurrentResponse = {
  name: 'Seattle',
  main: { temp: 18.4, feels_like: 17.9, humidity: 60 },
  wind: { speed: 3.14 },
  weather: [{ description: 'clear sky', main: 'Clear' }],
  sys: { sunrise: 1735732800, sunset: 1735776000 },
};

describe('OpenWeatherService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cache.get as jest.Mock).mockResolvedValue(null);
    (cache.set as jest.Mock).mockResolvedValue(undefined);
    global.fetch = jest.fn();
  });

  describe('getCurrentWeatherByCity', () => {
    it('should return null for an empty city', async () => {
      const result = await getCurrentWeatherByCity('');
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return the cached value when present', async () => {
      const cached = { location: 'Seattle', temperature: 18 };
      (cache.get as jest.Mock).mockResolvedValueOnce(cached);

      const result = await getCurrentWeatherByCity('Seattle');

      expect(result).toEqual(cached);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch, transform, and cache weather for 10 minutes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockCurrentResponse });

      const result = await getCurrentWeatherByCity('Seattle');

      expect(result).toMatchObject({
        location: 'Seattle',
        temperature: 18,
        feelsLike: 18,
        humidity: 60,
        windSpeed: 3.1,
        description: 'clear sky',
        icon: '☀️',
      });
      expect(cache.set).toHaveBeenCalledWith('weather:current:seattle', result, 600);
    });

    it('should fall back to the requested city name when the response has none', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockCurrentResponse, name: undefined }),
      });

      const result = await getCurrentWeatherByCity('Nowhere');

      expect(result?.location).toBe('Nowhere');
    });

    it('should return null when the response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, statusText: 'Not Found' });

      const result = await getCurrentWeatherByCity('Nowhere');

      expect(result).toBeNull();
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('should return null when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

      const result = await getCurrentWeatherByCity('Seattle');

      expect(result).toBeNull();
    });
  });

  describe('getCurrentWeatherByCoords', () => {
    it('should return the cached value when present', async () => {
      const cached = { location: '47.6, -122.3', temperature: 18 };
      (cache.get as jest.Mock).mockResolvedValueOnce(cached);

      const result = await getCurrentWeatherByCoords(47.6, -122.3);

      expect(result).toEqual(cached);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch and label location by coordinates when the response has no name', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockCurrentResponse, name: undefined }),
      });

      const result = await getCurrentWeatherByCoords(47.6, -122.3);

      expect(result?.location).toBe('47.6, -122.3');
      expect(cache.set).toHaveBeenCalledWith('weather:current:47.6:-122.3', result, 600);
    });

    it('should return null when the response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

      const result = await getCurrentWeatherByCoords(0, 0);

      expect(result).toBeNull();
    });

    it('should return null when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

      const result = await getCurrentWeatherByCoords(0, 0);

      expect(result).toBeNull();
    });
  });

  describe('getForecast', () => {
    it('should return null for an empty city', async () => {
      const result = await getForecast('');
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return the cached value when present', async () => {
      const cached = [{ date: '1/1/2026', high: 5, low: 1, description: 'clear', icon: '☀️', precipChance: 0 }];
      (cache.get as jest.Mock).mockResolvedValueOnce(cached);

      const result = await getForecast('Seattle');

      expect(result).toEqual(cached);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should collapse to one forecast entry per day, capped at 5', async () => {
      const list: Array<{
        dt: number;
        main: { temp_max: number; temp_min: number };
        weather: Array<{ description: string; main: string }>;
        pop: number;
      }> = [];
      for (let day = 0; day < 7; day++) {
        for (let slot = 0; slot < 8; slot++) {
          list.push({
            dt: Math.floor(new Date(2026, 0, day + 1, slot * 3).getTime() / 1000),
            main: { temp_max: 10 + day, temp_min: 2 + day },
            weather: [{ description: 'clear sky', main: 'Clear' }],
            pop: 0.42,
          });
        }
      }
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ list }) });

      const result = await getForecast('Seattle');

      expect(result).toHaveLength(5);
      expect(result?.[0]).toMatchObject({ high: 10, low: 2, precipChance: 42, icon: '☀️' });
      expect(cache.set).toHaveBeenCalledWith('weather:forecast:seattle', result, 3600);
    });

    it('should default precipChance to 0 when pop is absent', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          list: [
            {
              dt: Math.floor(Date.now() / 1000),
              main: { temp_max: 10, temp_min: 2 },
              weather: [{ description: 'clear sky', main: 'Clear' }],
            },
          ],
        }),
      });

      const result = await getForecast('Seattle');

      expect(result?.[0].precipChance).toBe(0);
    });

    it('should return null when the response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

      const result = await getForecast('Nowhere');

      expect(result).toBeNull();
    });

    it('should return null when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

      const result = await getForecast('Seattle');

      expect(result).toBeNull();
    });
  });

  describe('isWeatherSuitable', () => {
    const baseWeather = {
      location: 'Seattle',
      temperature: 20,
      feelsLike: 20,
      humidity: 50,
      windSpeed: 5,
      description: 'clear sky',
      icon: '☀️',
      timestamp: new Date().toISOString(),
    };

    it('should flag outdoor-sports as unsuitable when too hot', () => {
      const result = isWeatherSuitable({ ...baseWeather, temperature: 40 }, 'outdoor-sports');
      expect(result).toEqual({ suitable: false, reason: 'Temperature too extreme' });
    });

    it('should flag outdoor-sports as unsuitable when too windy', () => {
      const result = isWeatherSuitable({ ...baseWeather, windSpeed: 25 }, 'outdoor-sports');
      expect(result).toEqual({ suitable: false, reason: 'Wind too strong' });
    });

    it('should flag outdoor-sports as unsuitable when rainy', () => {
      const result = isWeatherSuitable({ ...baseWeather, description: 'light rain' }, 'outdoor-sports');
      expect(result).toEqual({ suitable: false, reason: 'Rainy conditions' });
    });

    it('should accept good outdoor-sports conditions', () => {
      const result = isWeatherSuitable(baseWeather, 'outdoor-sports');
      expect(result).toEqual({ suitable: true, reason: 'Great conditions!' });
    });

    it('should flag hiking as unsuitable during a thunderstorm', () => {
      const result = isWeatherSuitable({ ...baseWeather, description: 'thunderstorm' }, 'hiking');
      expect(result).toEqual({ suitable: false, reason: 'Thunderstorm risk' });
    });

    it('should accept good hiking conditions', () => {
      const result = isWeatherSuitable(baseWeather, 'hiking');
      expect(result).toEqual({ suitable: true, reason: 'Good hiking weather' });
    });

    it('should flag walking as dangerous during a thunderstorm', () => {
      const result = isWeatherSuitable({ ...baseWeather, description: 'thunderstorm' }, 'walking');
      expect(result).toEqual({ suitable: false, reason: 'Dangerous conditions' });
    });

    it('should accept good walking conditions', () => {
      const result = isWeatherSuitable(baseWeather, 'walking');
      expect(result).toEqual({ suitable: true, reason: 'Suitable for walking' });
    });

    it('should have no restrictions for an unknown activity type', () => {
      const result = isWeatherSuitable(baseWeather, 'unicycling');
      expect(result).toEqual({ suitable: true, reason: 'No restrictions for this activity' });
    });
  });
});
