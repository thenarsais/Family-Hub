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
}

/**
 * FR-014 — current conditions for the family's city + a 5-day forecast strip.
 * Degrades to an "unavailable" line when the OpenWeather key isn't configured.
 */
export function WeatherCard({ weather, loading, error, location, ...shell }: Props) {
  const c = weather?.current;

  return (
    <DashboardCard
      {...shell}
      title="Weather"
      icon={<CloudSun className="w-5 h-5 text-accent" aria-hidden="true" />}
      count={c ? `${Math.round(c.temp)}°` : undefined}
    >
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
