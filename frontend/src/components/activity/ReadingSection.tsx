import { useState, type FormEvent } from 'react';
import { BookOpen, Undo2 } from 'lucide-react';
import type { ReadingGoals, ReadingLog } from '@hooks/useReading';

function Bar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div
      className="h-2.5 rounded-full bg-rule/60 overflow-hidden"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label="This week's reading minutes"
    >
      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

interface Props {
  goals: ReadingGoals;
  log: ReadingLog | null;
  weekMinutes: number;
  streak: number;
  loading: boolean;
  error: string | null;
  onSubmit: (minutes: number) => Promise<void>;
  onUndo: () => Promise<void>;
}

export default function ReadingSection({
  goals,
  log,
  weekMinutes,
  streak,
  loading,
  error,
  onSubmit,
  onUndo,
}: Props) {
  const [minutes, setMinutes] = useState(goals.dailyMinutes ?? 20);
  const [busy, setBusy] = useState(false);

  if (loading) return <p className="text-sm text-ink-3">Loading…</p>;
  if (error) return <p className="text-sm text-alert bg-alert/10 rounded p-3">{error}</p>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await onSubmit(minutes);
    } catch (err) {
      console.error('Failed to log reading:', err);
    } finally {
      setBusy(false);
    }
  };

  const runUndo = async () => {
    setBusy(true);
    try {
      await onUndo();
    } catch (err) {
      console.error('Failed to undo reading log:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {log ? (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
            log.goalMet ? 'border-ok/40 bg-ok/10' : 'border-rule bg-raised'
          }`}
        >
          <BookOpen className={`h-5 w-5 shrink-0 ${log.goalMet ? 'text-ok' : 'text-ink-3'}`} />
          <span className="flex-1">
            <span className="block font-medium text-ink">{log.minutes} min logged today</span>
            <span className="block text-xs text-ink-2">
              {log.goalMet
                ? `🎉 Goal met! +${log.pointsEarned} points`
                : `Under today's ${goals.dailyMinutes}-min goal — no points, still counts for next time`}
            </span>
          </span>
          <button
            className="btn btn-secondary btn-small gap-1"
            onClick={runUndo}
            disabled={busy}
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex items-center gap-3 rounded-xl border border-rule bg-raised px-4 py-3">
          <BookOpen className="h-5 w-5 shrink-0 text-ink-3" />
          <label className="flex-1 font-medium text-ink" htmlFor="reading-minutes">
            Did you read today?
          </label>
          <input
            id="reading-minutes"
            className="input w-20 py-1 text-sm"
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(Math.max(0, Number(e.target.value) || 0))}
            aria-label="Minutes read today"
          />
          <span className="text-xs text-ink-2">min</span>
          <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
            Log reading
          </button>
        </form>
      )}

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-ink-2">
          <span>This week</span>
          <span className="tabular-nums">
            {weekMinutes} / {goals.weeklyMinutes} min
          </span>
        </div>
        <Bar value={weekMinutes} max={goals.weeklyMinutes} />
      </div>

      {streak > 0 && <p className="text-sm text-ink-2">🔥 {streak}-day streak</p>}
    </div>
  );
}
