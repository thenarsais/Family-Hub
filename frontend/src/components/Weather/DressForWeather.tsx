import { Shirt } from 'lucide-react';
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
}

interface Garment {
  emoji: string;
  label: string;
}

// °F tiers, warmest → coldest. Thresholds are the LOW bound of each tier.
const TIERS: { min: number; base: Garment[]; line: string }[] = [
  { min: 70, base: [{ emoji: '👕', label: 'T-shirt' }], line: "It's warm — a t-shirt is plenty." },
  { min: 55, base: [{ emoji: '🧥', label: 'Light jacket' }], line: 'Cool out — take a light jacket.' },
  { min: 40, base: [{ emoji: '🧥', label: 'Coat' }], line: "It's chilly — wear a coat." },
  { min: 25, base: [{ emoji: '🧥', label: 'Coat' }, { emoji: '🧢', label: 'Hat' }], line: 'Cold — coat and a hat.' },
  { min: -Infinity, base: [{ emoji: '🧥', label: 'Coat' }, { emoji: '🧢', label: 'Hat' }, { emoji: '🧤', label: 'Gloves' }], line: 'Freezing — coat, hat and gloves!' },
];

/**
 * FR-132 — "dress for the weather" kid card. Pure function so the tiers are
 * unit-testable; add-ons layer on rain/snow/wind.
 */
export function dressFor(
  tempF: number,
  condition: string,
  windMph: number,
): { items: Garment[]; line: string } {
  const tier = TIERS.find((t) => tempF >= t.min) ?? TIERS[TIERS.length - 1];
  const items = [...tier.base];
  let line = tier.line;

  const cond = (condition || '').toLowerCase();
  if (/snow|sleet/.test(cond)) {
    items.push({ emoji: '👢', label: 'Boots' });
    line += ' Snow boots too.';
  }
  if (/rain|drizzle|thunderstorm|shower/.test(cond)) {
    items.push({ emoji: '☔', label: 'Umbrella' });
    line += " Don't forget an umbrella.";
  }
  if (windMph >= 20) {
    items.push({ emoji: '💨', label: 'Windbreaker' });
    line += " It's windy — add a windbreaker.";
  }
  return { items, line };
}

export function DressForWeather({ weather, loading, error, ...shell }: Props) {
  const c = weather?.current;

  return (
    <DashboardCard
      {...shell}
      title="Dress for the weather"
      icon={<Shirt className="w-5 h-5 text-leaf" aria-hidden="true" />}
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
        (() => {
          const { items, line } = dressFor(c.temp, c.condition, c.windSpeed);
          return (
            <div>
              <ul className="flex flex-wrap gap-3">
                {items.map((g, i) => (
                  <li key={`${g.label}-${i}`} className="flex flex-col items-center w-16">
                    <span className="text-3xl" aria-hidden="true">{g.emoji}</span>
                    <span className="text-xs text-ink-2 text-center mt-1">{g.label}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-ink-2 mt-3">{line}</p>
            </div>
          );
        })()
      )}
    </DashboardCard>
  );
}

export default DressForWeather;
