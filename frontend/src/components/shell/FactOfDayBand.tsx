import { useMemo, useState, type KeyboardEvent } from 'react';
import { Shuffle, ChevronDown } from 'lucide-react';
import { FACTS, factOfDay, type Fact } from '@/data/facts';

type DayFact = Fact & { index: number };

/**
 * Fact of the day (FR-154 / FR-156) — a slim band under the announcements band.
 * Same fact for the whole house, chosen by day-of-year. Tap the fact to expand
 * a "learn more" blurb (loaded on demand from `factDetails`); parents also get
 * a shuffle button (not persisted — it is a conversation nudge).
 */
export function FactOfDayBand({ canShuffle = false }: { canShuffle?: boolean }) {
  const todays = useMemo<DayFact>(() => factOfDay(), []);
  const [override, setOverride] = useState<DayFact | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [more, setMore] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fact = override ?? todays;

  const shuffle = () => {
    let i = fact.index;
    for (let n = 0; n < 8 && i === fact.index; n += 1) {
      i = Math.floor(Math.random() * FACTS.length);
    }
    setOverride({ ...FACTS[i], index: i });
    setExpanded(false);
    setMore(null);
  };

  const toggle = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (more === null && !loadingMore) {
      setLoadingMore(true);
      try {
        const m = await import('@/data/factDetails');
        setMore(m.FACT_MORE[fact.index] ?? '');
      } catch {
        setMore('');
      } finally {
        setLoadingMore(false);
      }
    }
    setExpanded(true);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && expanded) setExpanded(false);
  };

  return (
    <div
      className="px-4 sm:px-6 py-2 text-sm text-ink-2 bg-accent-soft border-y border-rule"
      onKeyDown={onKeyDown}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-accent shrink-0">Fact of the day</span>
        <span className="text-ink-3 shrink-0">—</span>

        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-controls="fact-more"
          className="min-w-0 flex items-center gap-1 text-left hover:text-accent transition-colors"
        >
          <span className={expanded ? 'min-w-0' : 'min-w-0 truncate'}>{fact.text}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 text-ink-3 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

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

      {expanded && (
        <p id="fact-more" className="mt-1.5 text-ink-2 leading-relaxed max-w-prose">
          {loadingMore ? '…' : more || 'No more details for this one.'}
          {!loadingMore && more && fact.sourceLabel && (
            <span className="text-ink-3"> — {fact.sourceLabel}</span>
          )}
        </p>
      )}
    </div>
  );
}

export default FactOfDayBand;
