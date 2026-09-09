import { useState } from 'react';
import { Check } from 'lucide-react';
import type { RoutineWithStatus } from '@hooks/useKidBoard';

interface Props {
  title: string;
  emoji: string;
  routines: RoutineWithStatus[];
  onToggle: (id: string, done: boolean) => Promise<void>;
}

/**
 * One routine block (Morning / Evening) as big icon-first tiles. Tap fills the
 * tile with a gentle pop + check; tap again to un-tick. No counts, no progress.
 */
export default function RoutineChecklist({ title, emoji, routines, onToggle }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const tap = async (r: RoutineWithStatus) => {
    if (busyId) return;
    setBusyId(r.id);
    try {
      await onToggle(r.id, !r.doneToday);
    } catch (err) {
      console.error('Routine toggle failed:', err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section>
      <h2 className="font-display text-2xl font-bold text-ink mb-3">
        <span aria-hidden="true">{emoji}</span> {title}
      </h2>
      {routines.length === 0 ? (
        <p className="text-ink-3">Nothing here yet.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {routines.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => tap(r)}
                disabled={busyId === r.id}
                aria-pressed={r.doneToday}
                className={`w-full aspect-square rounded-2xl border-4 flex flex-col items-center justify-center gap-1 transition disabled:opacity-70 ${
                  r.doneToday
                    ? 'border-ok bg-ok/15 animate-pop'
                    : 'border-rule bg-raised hover:border-accent active:scale-95'
                }`}
              >
                <span className="text-5xl leading-none" aria-hidden="true">
                  {r.emoji}
                </span>
                <span className="text-sm font-semibold text-ink text-center px-1">{r.label}</span>
                {r.doneToday && (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-ok text-paper">
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
