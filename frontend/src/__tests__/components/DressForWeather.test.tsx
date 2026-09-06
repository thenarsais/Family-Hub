import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { DressForWeather, dressFor } from '@/components/Weather/DressForWeather';
import type { WeatherData } from '@/hooks/useWeather';

const shell = {
  id: 'dress',
  expanded: false,
  onToggle: vi.fn(),
  onReorder: vi.fn(),
  onMove: vi.fn(),
};

const mk = (temp: number, condition = 'clear', windSpeed = 5): WeatherData => ({
  current: { temp, feelsLike: temp, condition, icon: '·', humidity: 30, windSpeed },
  forecast: [],
});

describe('dressFor', () => {
  it('picks a garment tier by temperature (°F)', () => {
    expect(dressFor(80, 'clear', 3).items.map((g) => g.label)).toEqual(['T-shirt']);
    expect(dressFor(60, 'clear', 3).items.map((g) => g.label)).toEqual(['Light jacket']);
    expect(dressFor(45, 'clear', 3).items.map((g) => g.label)).toEqual(['Coat']);
    expect(dressFor(30, 'clear', 3).items.map((g) => g.label)).toEqual(['Coat', 'Hat']);
    expect(dressFor(10, 'clear', 3).items.map((g) => g.label)).toEqual(['Coat', 'Hat', 'Gloves']);
  });

  it('adds an umbrella when it is raining', () => {
    expect(dressFor(60, 'light rain', 3).items.map((g) => g.label)).toContain('Umbrella');
  });

  it('adds boots for snow', () => {
    expect(dressFor(20, 'snow', 3).items.map((g) => g.label)).toContain('Boots');
  });

  it('adds a windbreaker when wind >= 20 mph', () => {
    const { items, line } = dressFor(65, 'clear', 22);
    expect(items.map((g) => g.label)).toContain('Windbreaker');
    expect(line).toMatch(/windy/i);
  });
});

describe('DressForWeather card', () => {
  it('renders garments + a sentence for the current weather', () => {
    render(<DressForWeather {...shell} weather={mk(45)} loading={false} error={null} />);
    expect(screen.getByText('Coat')).toBeInTheDocument();
    expect(screen.getByText(/chilly/i)).toBeInTheDocument();
  });

  it('shows the unavailable state on error', () => {
    render(<DressForWeather {...shell} weather={null} loading={false} error="down" />);
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
  });
});
