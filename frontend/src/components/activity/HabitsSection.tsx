import { useState } from 'react';
import { Check, Flame, Undo2 } from 'lucide-react';
import type { HabitWithStatus } from '@hooks/useHabits';

interface Props {
  habits: HabitWithStatus[];
  onComplete: (habitId: string) => Promise<void>;
  onUndo: (habitId: string) => Promise<void>;
}

export default function HabitsSection({ habits, onComplete, onUndo }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    try {
      await fn();
    } catch (err) {
      console.error('Habit action failed:', err);
    } finally {
      setBusyId(null);
    }
  };

  if (habits.length === 0) {
    return <p className="text-sm text-ink-3">No habits yet. A parent can add some in Manage.</p>;
  }

  return (
    <ul className="space-y-2">
      {habits.map((h) => {
        const met = h.weekCompletions >= h.weeklyTarget;
        const pct = Math.min(100, Math.round((h.weekCompletions / h.weeklyTarget) * 100));
        return (
          <li
            key={h.id}
            className={`rounded-xl border px-4 py-3 ${
              h.completedToday ? 'border-ok/40 bg-ok/10' : 'border-rule bg-raised'
            }`}
          >
            <div className="flex items-center gap-3">
              {h.completedToday ? (
                <button
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ok text-paper disabled:opacity-60"
                  onClick={() => run(h.id, () => onUndo(h.id))}
                  disabled={busyId === h.id}
                  aria-label={`Undo ${h.title}`}
                >
                  <Check className="h-4 w-4" />
                </button>
              ) : (
                <button
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-ink-3 transition hover:border-accent disabled:opacity-60"
                  onClick={() => run(h.id, () => onComplete(h.id))}
                  disabled={busyId === h.id}
                  aria-label={`Mark ${h.title} done`}
                />
              )}

              <span className="flex-1 min-w-0">
                <span className={`block font-medium ${h.completedToday ? 'text-ink' : 'text-ink'}`}>
                  {h.title}
                </span>
                {h.description && <span className="block text-xs text-ink-2">{h.description}</span>}
              </span>

              {h.weekStreak > 0 && (
                <span
                  className="flex items-center gap-0.5 text-xs text-haldi"
                  title={`${h.weekStreak}-week streak`}
                >
                  <Flame className="h-3.5 w-3.5" />
                  {h.weekStreak}
                </span>
              )}
              <span className="text-xs text-ink-2 tabular-nums">
                {h.weekCompletions}/{h.weeklyTarget}
              </span>
              {h.completedToday && (
                <button
                  className="btn btn-secondary btn-small gap-1"
                  onClick={() => run(h.id, () => onUndo(h.id))}
                  disabled={busyId === h.id}
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Undo
                </button>
              )}
            </div>

            <div
              className="mt-2 h-1.5 rounded-full bg-rule/60 overflow-hidden"
              role="progressbar"
              aria-valuenow={h.weekCompletions}
              aria-valuemin={0}
              aria-valuemax={h.weeklyTarget}
              aria-label={`${h.title} this week`}
            >
              <div
                className={`h-full rounded-full transition-all ${met ? 'bg-ok' : 'bg-accent'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
