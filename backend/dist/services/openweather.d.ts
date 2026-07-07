/**
 * OpenWeather API Service
 * Provides current weather, forecasts, and location data
 */
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
export declare function getCurrentWeatherByCity(city: string): Promise<WeatherData | null>;
/**
 * Get current weather by coordinates
 */
export declare function getCurrentWeatherByCoords(lat: number, lon: number): Promise<WeatherData | null>;
/**
 * Get 5-day forecast
 */
export declare function getForecast(city: string): Promise<ForecastItem[] | null>;
/**
 * Check if weather is suitable for activity
 */
export declare function isWeatherSuitable(weather: WeatherData, activityType: string): {
    suitable: boolean;
    reason: string;
};
declare const _default: {
    getCurrentWeatherByCity: typeof getCurrentWeatherByCity;
    getCurrentWeatherByCoords: typeof getCurrentWeatherByCoords;
    getForecast: typeof getForecast;
    isWeatherSuitable: typeof isWeatherSuitable;
};
export default _default;
//# sourceMappingURL=openweather.d.ts.map