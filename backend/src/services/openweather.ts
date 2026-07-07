/**
 * OpenWeather API Service
 * Provides current weather, forecasts, and location data
 */

import * as cache from '../database/cache';

const OW_API_KEY = process.env.OPENWEATHER_API_KEY || 'demo';
const OW_BASE_URL = 'https://api.openweathermap.org/data/2.5';

interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  timestamp: string;
  sunrise?: string;
  sunset?: string;
}

interface ForecastItem {
  date: string;
  high: number;
  low: number;
  description: string;
  icon: string;
  precipChance: number;
}

/**
 * Get current weather by city name
 */
export async function getCurrentWeatherByCity(city: string): Promise<WeatherData | null> {
  if (!city || city.length === 0) {
    return null;
  }

  const cacheKey = `weather:current:${city.toLowerCase()}`;

  // Cache for 10 minutes (weather changes frequently)
  const cached = await cache.get<WeatherData>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `${OW_BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${OW_API_KEY}`
    );

    if (!response.ok) {
      console.warn(`Weather API error for city "${city}": ${response.statusText}`);
      return null;
    }

    const data: any = await response.json();

    const weatherData: WeatherData = {
      location: data.name || city,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 10) / 10,
      description: data.weather[0].description,
      icon: getWeatherEmoji(data.weather[0].main),
      timestamp: new Date().toISOString(),
      sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
      sunset: new Date(data.sys.sunset * 1000).toISOString()
    };

    await cache.set(cacheKey, weatherData, 600); // Cache 10 minutes

    return weatherData;
  } catch (error) {
    console.error(`Failed to fetch weather for city "${city}":`, error);
    return null;
  }
}

/**
 * Get current weather by coordinates
 */
export async function getCurrentWeatherByCoords(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  const cacheKey = `weather:current:${lat}:${lon}`;

  const cached = await cache.get<WeatherData>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `${OW_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OW_API_KEY}`
    );

    if (!response.ok) {
      return null;
    }

    const data: any = await response.json();

    const weatherData: WeatherData = {
      location: data.name || `${lat}, ${lon}`,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 10) / 10,
      description: data.weather[0].description,
      icon: getWeatherEmoji(data.weather[0].main),
      timestamp: new Date().toISOString(),
      sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
      sunset: new Date(data.sys.sunset * 1000).toISOString()
    };

    await cache.set(cacheKey, weatherData, 600);

    return weatherData;
  } catch (error) {
    console.error('Failed to fetch weather by coordinates:', error);
    return null;
  }
}

/**
 * Get 5-day forecast
 */
export async function getForecast(city: string): Promise<ForecastItem[] | null> {
  if (!city || city.length === 0) {
    return null;
  }

  const cacheKey = `weather:forecast:${city.toLowerCase()}`;

  const cached = await cache.get<ForecastItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `${OW_BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${OW_API_KEY}`
    );

    if (!response.ok) {
      return null;
    }

    const data: any = await response.json();
    const forecast: ForecastItem[] = [];
    const processedDates = new Set<string>();

    // Group by day and extract one forecast per day
    for (const item of data.list) {
      const date = new Date(item.dt * 1000).toLocaleDateString();

      if (!processedDates.has(date)) {
        processedDates.add(date);

        forecast.push({
          date,
          high: Math.round(item.main.temp_max),
          low: Math.round(item.main.temp_min),
          description: item.weather[0].description,
          icon: getWeatherEmoji(item.weather[0].main),
          precipChance: item.pop ? Math.round(item.pop * 100) : 0
        });

        if (forecast.length >= 5) break; // Only need 5 days
      }
    }

    await cache.set(cacheKey, forecast, 3600); // Cache 1 hour

    return forecast;
  } catch (error) {
    console.error(`Failed to fetch forecast for city "${city}":`, error);
    return null;
  }
}

/**
 * Convert weather condition to emoji
 */
function getWeatherEmoji(condition: string): string {
  const emojis: Record<string, string> = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Smoke: '💨',
    Haze: '🌫️',
    Dust: '🌪️',
    Fog: '🌫️',
    Sand: '🏜️',
    Ash: '🌋',
    Squall: '💨',
    Tornado: '🌪️'
  };

  return emojis[condition] || '🌤️';
}

/**
 * Check if weather is suitable for activity
 */
export function isWeatherSuitable(
  weather: WeatherData,
  activityType: string
): { suitable: boolean; reason: string } {
  const temp = weather.temperature;
  const windSpeed = weather.windSpeed;
  const description = weather.description.toLowerCase();

  switch (activityType) {
    case 'outdoor-sports':
      if (temp < 0 || temp > 35) return { suitable: false, reason: 'Temperature too extreme' };
      if (windSpeed > 20) return { suitable: false, reason: 'Wind too strong' };
      if (description.includes('rain') || description.includes('storm'))
        return { suitable: false, reason: 'Rainy conditions' };
      return { suitable: true, reason: 'Great conditions!' };

    case 'hiking':
      if (temp < -5 || temp > 30) return { suitable: false, reason: 'Temperature not ideal' };
      if (windSpeed > 25) return { suitable: false, reason: 'Wind too strong' };
      if (description.includes('thunderstorm'))
        return { suitable: false, reason: 'Thunderstorm risk' };
      return { suitable: true, reason: 'Good hiking weather' };

    case 'walking':
      if (temp < -10 || temp > 40) return { suitable: false, reason: 'Temperature extreme' };
      if (description.includes('thunderstorm'))
        return { suitable: false, reason: 'Dangerous conditions' };
      return { suitable: true, reason: 'Suitable for walking' };

    default:
      return { suitable: true, reason: 'No restrictions for this activity' };
  }
}

export default {
  getCurrentWeatherByCity,
  getCurrentWeatherByCoords,
  getForecast,
  isWeatherSuitable
};
