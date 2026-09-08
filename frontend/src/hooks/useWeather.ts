import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

/** Cities the family follows (FR-092). The first is "home" — it drives the top
 *  bar, the dress-for-weather card, and the default weather card view. `query`
 *  is what OpenWeather gets: a US ZIP for a local reading, else `City,State,US`
 *  or `City,CountryCode`. All shown in °F (T-03 "US household" units decision). */
export const WEATHER_CITIES = [
  { query: '80241', label: 'Thornton, CO' },
  { query: 'Cleveland,OH,US', label: 'Cleveland, OH' },
  { query: 'Vadodara,IN', label: 'Vadodara, IN' },
] as const;

/** Home city — a US ZIP gives a local reading (the ZIP's coordinates). */
export const WEATHER_QUERY = WEATHER_CITIES[0].query;
/** Friendly label for the top bar / weather card. */
export const WEATHER_LOCATION = WEATHER_CITIES[0].label;
/** @deprecated use WEATHER_LOCATION for display / WEATHER_QUERY for lookups. */
export const WEATHER_CITY = WEATHER_LOCATION;
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

/**
 * Weather for one of `WEATHER_CITIES`. Defaults to home (index 0) — that call
 * is what the top bar and the dress-for-weather card use. Pass an index to
 * follow the weather-card's city switcher.
 */
export function useWeather(cityIndex = 0): UseWeatherReturn {
  const city = WEATHER_CITIES[cityIndex] ?? WEATHER_CITIES[0];
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
          apiClient.get<ApiCurrent>(`/api/external/weather/city/${encodeURIComponent(city.query)}`, {
            params: { units: UNITS },
          }),
          apiClient.get<{ forecast: ApiForecastItem[] }>(
            `/api/external/weather/forecast/${encodeURIComponent(city.query)}`,
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
  }, [city.query]);

  return { weather, loading, error, units: UNITS, location: city.label };
}
