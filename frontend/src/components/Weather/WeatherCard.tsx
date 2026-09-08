import { CloudSun } from 'lucide-react';
import { DashboardCard } from '../shell/DashboardCard';
import type { WeatherData } from '@hooks/useWeather';

interface CardShellProps {
  id: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  onReorder: (dragId: string, dropId: string) => void;
  onMove: (id: string, delta: number) => void;
}

interface Props extends CardShellProps {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  location: string;
  /** FR-092 — the cities the switcher offers, and which one is showing. */
  cities: ReadonlyArray<{ label: string }>;
  selectedIndex: number;
  onSelectCity: (index: number) => void;
}

/**
 * FR-014 / FR-092 — current conditions + a 5-day forecast for whichever of the
 * family's cities is selected (pill switcher along the top; the first is home).
 * Degrades to an "unavailable" line when the OpenWeather key isn't configured.
 */
export function WeatherCard({
  weather,
  loading,
  error,
  location,
  cities,
  selectedIndex,
  onSelectCity,
  ...shell
}: Props) {
  const c = weather?.current;

  return (
    <DashboardCard
      {...shell}
      title="Weather"
      icon={<CloudSun className="w-5 h-5 text-accent" aria-hidden="true" />}
      count={c ? `${Math.round(c.temp)}°` : undefined}
    >
      {cities.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {cities.map((city, i) => (
            <button
              key={city.label}
              type="button"
              onClick={() => onSelectCity(i)}
              aria-pressed={i === selectedIndex}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                i === selectedIndex
                  ? 'border-accent bg-accent/10 text-accent font-semibold'
                  : 'border-rule text-ink-2 hover:border-accent hover:text-accent'
              }`}
            >
              {city.label.split(',')[0]}
            </button>
          ))}
        </div>
      )}
      {loading ? (
        <div className="py-6 flex justify-center" role="status" aria-label="Loading">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
        </div>
      ) : error || !c ? (
        <p className="text-ink-3 text-sm text-center py-4">
          Weather is unavailable — add an OpenWeather API key.
        </p>
      ) : (
        <div>
          <div className="flex items-center gap-3">
            <span className="text-4xl" aria-hidden="true">{c.icon}</span>
            <div>
              <p className="font-display text-3xl font-bold text-ink leading-none">
                {Math.round(c.temp)}°
              </p>
              <p className="text-sm text-ink-2 capitalize">{c.condition}</p>
            </div>
          </div>
          <p className="text-xs text-ink-3 mt-2">
            Feels like {Math.round(c.feelsLike)}° · {c.humidity}% humidity ·{' '}
            {Math.round(c.windSpeed)} mph wind · {location}
          </p>

          {weather!.forecast.length > 0 && (
            <ul className="mt-3 grid grid-cols-5 gap-1 text-center">
              {weather!.forecast.slice(0, 5).map((f, i) => (
                <li key={`${f.day}-${i}`} className="rounded-lg bg-paper border border-rule py-2">
                  <div className="text-xs font-semibold text-ink-3 uppercase">{f.day}</div>
                  <div className="text-lg" aria-hidden="true">{f.icon}</div>
                  <div className="text-xs text-ink">
                    <span className="font-semibold">{Math.round(f.high)}°</span>{' '}
                    <span className="text-ink-3">{Math.round(f.low)}°</span>
                  </div>
                  {f.precipChance > 0 && (
                    <div className="text-[10px] text-accent">{f.precipChance}%</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </DashboardCard>
  );
}

export default WeatherCard;
