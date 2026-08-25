import { renderHook, waitFor } from '@testing-library/react';
import { useWeather } from '@/hooks/useWeather';

describe('useWeather', () => {
  it('should load mock current weather and a 5-day forecast', async () => {
    const { result } = renderHook(() => useWeather());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.weather?.current).toMatchObject({
      temp: 72,
      condition: 'Partly Cloudy',
    });
    expect(result.current.weather?.forecast).toHaveLength(5);
    expect(result.current.weather?.forecast.map((f) => f.day)).toEqual([
      'Tomorrow',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
  });
});
