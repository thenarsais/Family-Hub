import { Link } from 'react-router-dom';
import { useLearning } from '@hooks/useLearning';

const CATS = [
  { key: 'alphabet' as const, label: 'Alphabet' },
  { key: 'numbers' as const, label: 'Numbers' },
  { key: 'vocabulary' as const, label: 'Vocabulary' },
];

/** Compact Gujarati readout for the Activity Board — links into /learn. */
export default function LearningSummarySection() {
  const { stats, loading } = useLearning();

  if (loading) {
    return <p className="text-sm text-ink-3">Loading…</p>;
  }

  const total = CATS.reduce((n, c) => n + stats[c.key].total, 0);
  const done = CATS.reduce((n, c) => n + stats[c.key].completed, 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-2">
        {done} / {total} lessons · {stats.totalPointsEarned} points
      </p>
      <ul className="space-y-2">
        {CATS.map((c) => {
          const s = stats[c.key];
          const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
          return (
            <li key={c.key} className="text-sm">
              <div className="flex justify-between text-ink-3">
                <span>{c.label}</span>
                <span>
                  {s.completed} / {s.total}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-rule overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <Link to="/learn" className="btn btn-secondary btn-small">
        Continue →
      </Link>
    </div>
  );
}
