import { useState } from 'react';
import { Check, Undo2 } from 'lucide-react';
import { type ChorePointsSummary, type ChoreWithStatus, type TimeSlot } from '@hooks/useChores';

const SLOTS: { key: TimeSlot; label: string; emoji: string }[] = [
  { key: 'morning', label: 'Morning', emoji: '🌅' },
  { key: 'afternoon', label: 'Afternoon', emoji: '☀️' },
  { key: 'evening', label: 'Evening', emoji: '🌙' },
];

const DAILY_TARGET = 100;

// The monthly bronze/silver/gold tier bar moved to RewardsSection (T-24) — it's a
// family-wide points total, not chore-specific, and that's where hitting a tier
// now means something (a reward).
function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-ink-2 mb-1">
        <span>{label}</span>
        <span className="tabular-nums">
          {value} / {max}
        </span>
      </div>
      <div
        className="relative h-2.5 rounded-full bg-rule/60 overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface Props {
  chores: ChoreWithStatus[];
  pointsSummary: ChorePointsSummary;
  onComplete: (choreId: string) => Promise<void>;
  onUndo: (choreId: string) => Promise<void>;
}

export default function ChoresSection({ chores, pointsSummary, onComplete, onUndo }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    try {
      await fn();
    } catch (err) {
      console.error('Chore action failed:', err);
    } finally {
      setBusyId(null);
    }
  };

  const daily = pointsSummary.dailyPoints ?? 0;

  return (
    <div className="space-y-5">
      <ProgressBar value={daily} max={DAILY_TARGET} label="Today's points" />

      {chores.length === 0 ? (
        <p className="text-sm text-ink-3">No chores for today. Enjoy the break! 🎉</p>
      ) : (
        SLOTS.map(({ key, label, emoji }) => {
          const slotChores = chores.filter((c) => c.timeSlot === key);
          if (slotChores.length === 0) return null;
          return (
            <div key={key}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2">
                {emoji} {label}
              </h3>
              <ul className="space-y-2">
                {slotChores.map((c) => (
                  <li key={c.id}>
                    {c.completedToday ? (
                      <div className="flex items-center gap-3 rounded-xl border border-ok/40 bg-ok/10 px-4 py-3">
                        <Check className="h-5 w-5 shrink-0 text-ok" />
                        <span className="flex-1 font-medium text-ink line-through decoration-ink-3">
                          {c.name}
                        </span>
                        <span className="text-xs text-ink-2 tabular-nums">+{c.pointsValue}</span>
                        <button
                          className="btn btn-secondary btn-small gap-1"
                          onClick={() => run(c.id, () => onUndo(c.id))}
                          disabled={busyId === c.id}
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                          Undo
                        </button>
                      </div>
                    ) : (
                      <button
                        className="flex w-full items-center gap-3 rounded-xl border border-rule bg-raised px-4 py-3 text-left transition hover:border-accent hover:bg-accent/5 disabled:opacity-60"
                        onClick={() => run(c.id, () => onComplete(c.id))}
                        disabled={busyId === c.id}
                      >
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-ink-3" />
                        <span className="flex-1">
                          <span className="block font-medium text-ink">{c.name}</span>
                          {c.description && (
                            <span className="block text-xs text-ink-2">{c.description}</span>
                          )}
                        </span>
                        <span className="text-sm font-semibold text-accent tabular-nums">
                          +{c.pointsValue}
                        </span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
}
