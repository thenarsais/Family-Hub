import { vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useWeather, WEATHER_CITIES } from '@/hooks/useWeather';

const mockGet = apiClient.get as ReturnType<typeof vi.fn>;

const CURRENT = {
  temperature: 71,
  feelsLike: 68,
  humidity: 40,
  windSpeed: 9,
  description: 'clear sky',
  icon: '☀️',
};
const FORECAST = {
  forecast: [
    { date: '1/6/2026', high: 72, low: 51, description: 'sunny', icon: '☀️', precipChance: 0 },
    { date: '1/7/2026', high: 60, low: 44, description: 'rain', icon: '🌧️', precipChance: 60 },
  ],
};

function wireOk() {
  mockGet.mockImplementation((path: string) =>
    path.includes('/forecast/')
      ? Promise.resolve({ data: FORECAST })
      : Promise.resolve({ data: CURRENT }),
  );
}

describe('useWeather', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps the real current + forecast responses and requests imperial units', async () => {
    wireOk();
    const { result } = renderHook(() => useWeather());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.units).toBe('imperial');
    expect(result.current.location).toBe('Thornton, CO');
    expect(result.current.weather?.current).toEqual({
      temp: 71,
      feelsLike: 68,
      condition: 'clear sky',
      icon: '☀️',
      humidity: 40,
      windSpeed: 9,
    });
    expect(result.current.weather?.forecast).toEqual([
      { day: 'Tue', high: 72, low: 51, condition: 'sunny', icon: '☀️', precipChance: 0 },
      { day: 'Wed', high: 60, low: 44, condition: 'rain', icon: '🌧️', precipChance: 60 },
    ]);

    const cityCall = mockGet.mock.calls.find(([p]) => p.includes('/weather/city/'));
    expect(cityCall?.[0]).toContain('/weather/city/80241');
    expect(cityCall?.[1]).toEqual({ params: { units: 'imperial' } });
    const fcCall = mockGet.mock.calls.find(([p]) => p.includes('/weather/forecast/'));
    expect(fcCall?.[0]).toContain('/weather/forecast/80241');
  });

  it('fetches a non-home city by index and returns its label (FR-092)', async () => {
    wireOk();
    const cleveland = WEATHER_CITIES[1];
    const { result } = renderHook(() => useWeather(1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.location).toBe(cleveland.label);
    const cityCall = mockGet.mock.calls.find(([p]) => p.includes('/weather/city/'));
    expect(cityCall?.[0]).toContain(`/weather/city/${encodeURIComponent(cleveland.query)}`);
  });

  it('surfaces an error and leaves weather null when a request fails', async () => {
    mockGet.mockRejectedValue(new Error('503'));
    const { result } = renderHook(() => useWeather());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.weather).toBeNull();
    expect(result.current.error).toMatch(/unavailable/i);
  });

  it('keeps a raw date string when it will not parse', async () => {
    mockGet.mockImplementation((path: string) =>
      path.includes('/forecast/')
        ? Promise.resolve({ data: { forecast: [{ date: 'not-a-date', high: 1, low: 0, description: 'x', icon: '·', precipChance: 0 }] } })
        : Promise.resolve({ data: CURRENT }),
    );
    const { result } = renderHook(() => useWeather());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.weather?.forecast[0].day).toBe('not-a-date');
  });
});
