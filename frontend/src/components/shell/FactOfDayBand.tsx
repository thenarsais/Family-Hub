import { useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
import { FACTS, factOfDay } from '@/data/facts';

/**
 * Fact of the day (FR-154) — a slim band under the announcements band. Same fact
 * for the whole house, chosen by day-of-year. Parents get a shuffle button to
 * move to another one for the day (not persisted — it is a conversation nudge).
 */
export function FactOfDayBand({ canShuffle = false }: { canShuffle?: boolean }) {
  const todays = useMemo(() => factOfDay(), []);
  const [override, setOverride] = useState<string | null>(null);
  const fact = override ?? todays;

  const shuffle = () => {
    let next = fact;
    for (let i = 0; i < 8 && next === fact; i += 1) {
      next = FACTS[Math.floor(Math.random() * FACTS.length)];
    }
    setOverride(next);
  };

  return (
    <div className="flex items-center gap-2 px-4 sm:px-6 py-2 text-sm text-ink-2 bg-accent-soft border-y border-rule">
      <span className="font-semibold text-accent shrink-0">Fact of the day</span>
      <span className="text-ink-3 shrink-0">—</span>
      <span className="min-w-0 truncate">{fact}</span>
      {canShuffle && (
        <button
          type="button"
          onClick={shuffle}
          aria-label="Show a different fact"
          className="ml-auto shrink-0 p-1 rounded hover:bg-raised text-ink-3 hover:text-accent transition-colors"
        >
          <Shuffle className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default FactOfDayBand;
