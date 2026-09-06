import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { WeatherCard } from '@/components/Weather/WeatherCard';
import type { WeatherData } from '@/hooks/useWeather';

const shell = {
  id: 'weather',
  expanded: false,
  onToggle: vi.fn(),
  onReorder: vi.fn(),
  onMove: vi.fn(),
};

const weather: WeatherData = {
  current: { temp: 71, feelsLike: 68, condition: 'clear sky', icon: '☀️', humidity: 40, windSpeed: 9 },
  forecast: [
    { day: 'Tue', high: 72, low: 51, condition: 'sunny', icon: '☀️', precipChance: 0 },
    { day: 'Wed', high: 60, low: 44, condition: 'rain', icon: '🌧️', precipChance: 60 },
  ],
};

describe('WeatherCard', () => {
  it('shows current conditions and the forecast strip', () => {
    render(<WeatherCard {...shell} weather={weather} loading={false} error={null} location="Denver" />);

    expect(screen.getAllByText('71°').length).toBeGreaterThan(0);
    expect(screen.getByText('clear sky')).toBeInTheDocument();
    expect(screen.getByText(/Feels like 68° · 40% humidity · 9 mph wind · Denver/)).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument(); // precip chance shown only when > 0
  });

  it('shows the unavailable state on error', () => {
    render(<WeatherCard {...shell} weather={null} loading={false} error="down" location="Denver" />);
    expect(screen.getByText(/unavailable — add an OpenWeather API key/i)).toBeInTheDocument();
  });

  it('shows a spinner while loading', () => {
    render(<WeatherCard {...shell} weather={null} loading error={null} location="Denver" />);
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });
});
