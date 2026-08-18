import { useState, useEffect } from 'react';

export interface WeatherData {
  current: {
    temp: number;
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
  }>;
}

interface UseWeatherReturn {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
}

export function useWeather(): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);

        // Mock weather data for testing
        const mockWeather: WeatherData = {
          current: {
            temp: 72,
            condition: 'Partly Cloudy',
            icon: '🌤️',
            humidity: 65,
            windSpeed: 12
          },
          forecast: [
            {
              day: 'Tomorrow',
              high: 75,
              low: 62,
              condition: 'Sunny',
              icon: '☀️'
            },
            {
              day: 'Wednesday',
              high: 73,
              low: 61,
              condition: 'Cloudy',
              icon: '☁️'
            },
            {
              day: 'Thursday',
              high: 68,
              low: 58,
              condition: 'Rainy',
              icon: '🌧️'
            },
            {
              day: 'Friday',
              high: 70,
              low: 60,
              condition: 'Partly Cloudy',
              icon: '🌤️'
            },
            {
              day: 'Saturday',
              high: 76,
              low: 64,
              condition: 'Sunny',
              icon: '☀️'
            }
          ]
        };

        setWeather(mockWeather);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to fetch weather:', err);
        setError(err.message || 'Failed to fetch weather');
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return {
    weather,
    loading,
    error,
  };
}
