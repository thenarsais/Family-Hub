import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

/** The one city shown for v1. Wiring this to a family-settings field is a
 *  fast-follow (needs a `weather_location` column); FR-092 adds more cities. */
export const WEATHER_CITY = 'Denver';
const UNITS = 'imperial' as const; // °F + mph — a US household (T-03 decision)

export interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
    precipChance: number;
  }>;
}

interface UseWeatherReturn {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  units: 'imperial' | 'metric';
  location: string;
}

// Backend shapes (components['schemas']['WeatherData' | 'ForecastItem']) — the
// weather routes return the object directly, not the {status,data} envelope.
interface ApiCurrent {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}
interface ApiForecastItem {
  date: string;
  high: number;
  low: number;
  description: string;
  icon: string;
  precipChance: number;
}

/** OpenWeather's forecast `date` is a `toLocaleDateString()` string — turn it
 *  into a short weekday, falling back to the raw value if it won't parse. */
function weekdayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export function useWeather(): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [currentRes, forecastRes] = await Promise.all([
          apiClient.get<ApiCurrent>(`/api/external/weather/city/${encodeURIComponent(WEATHER_CITY)}`, {
            params: { units: UNITS },
          }),
          apiClient.get<{ forecast: ApiForecastItem[] }>(
            `/api/external/weather/forecast/${encodeURIComponent(WEATHER_CITY)}`,
            { params: { units: UNITS } },
          ),
        ]);
        if (cancelled) return;

        const c = currentRes.data;
        const fc = forecastRes.data?.forecast ?? [];

        setWeather({
          current: {
            temp: c.temperature,
            feelsLike: c.feelsLike,
            condition: c.description,
            icon: c.icon,
            humidity: c.humidity,
            windSpeed: c.windSpeed,
          },
          forecast: fc.map((f) => ({
            day: weekdayLabel(f.date),
            high: f.high,
            low: f.low,
            condition: f.description,
            icon: f.icon,
            precipChance: f.precipChance,
          })),
        });
      } catch (err: unknown) {
        if (cancelled) return;
        console.warn('Failed to fetch weather:', err);
        setError('Weather is unavailable right now.');
        setWeather(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { weather, loading, error, units: UNITS, location: WEATHER_CITY };
}
