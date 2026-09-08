import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const CITIES = [
  { label: 'Thornton, CO' },
  { label: 'Cleveland, OH' },
  { label: 'Vadodara, IN' },
];

const weather: WeatherData = {
  current: { temp: 71, feelsLike: 68, condition: 'clear sky', icon: '☀️', humidity: 40, windSpeed: 9 },
  forecast: [
    { day: 'Tue', high: 72, low: 51, condition: 'sunny', icon: '☀️', precipChance: 0 },
    { day: 'Wed', high: 60, low: 44, condition: 'rain', icon: '🌧️', precipChance: 60 },
  ],
};

function renderCard(props: Partial<React.ComponentProps<typeof WeatherCard>> = {}) {
  const onSelectCity = vi.fn();
  render(
    <WeatherCard
      {...shell}
      weather={weather}
      loading={false}
      error={null}
      location="Thornton, CO"
      cities={CITIES}
      selectedIndex={0}
      onSelectCity={onSelectCity}
      {...props}
    />,
  );
  return { onSelectCity };
}

describe('WeatherCard', () => {
  it('shows current conditions and the forecast strip', () => {
    renderCard({ location: 'Denver' });

    expect(screen.getAllByText('71°').length).toBeGreaterThan(0);
    expect(screen.getByText('clear sky')).toBeInTheDocument();
    expect(screen.getByText(/Feels like 68° · 40% humidity · 9 mph wind · Denver/)).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument(); // precip chance shown only when > 0
  });

  it('shows the unavailable state on error', () => {
    renderCard({ weather: null, error: 'down' });
    expect(screen.getByText(/unavailable — add an OpenWeather API key/i)).toBeInTheDocument();
  });

  it('shows a spinner while loading', () => {
    renderCard({ weather: null, loading: true });
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders a pill per city, marks the selected one, and reports taps (FR-092)', async () => {
    const { onSelectCity } = renderCard({ selectedIndex: 1 });

    const pills = ['Thornton', 'Cleveland', 'Vadodara'].map((n) =>
      screen.getByRole('button', { name: n }),
    );
    expect(pills[1]).toHaveAttribute('aria-pressed', 'true');
    expect(pills[0]).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(pills[2]);
    expect(onSelectCity).toHaveBeenCalledWith(2);
  });

  it('omits the switcher when there is only one city', () => {
    renderCard({ cities: [{ label: 'Thornton, CO' }] });
    expect(screen.queryByRole('button', { name: 'Thornton' })).not.toBeInTheDocument();
  });
});
