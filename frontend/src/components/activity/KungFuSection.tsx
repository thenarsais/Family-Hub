import { useState } from 'react';
import { Undo2 } from 'lucide-react';
import type { KungFuLog, KungFuProfile } from '@hooks/useKungFu';

function beltLabel(profile: KungFuProfile): string {
  if (!profile.belt) return 'No belt set yet';
  if (!profile.beltSince) return profile.belt;
  const since = new Date(`${profile.beltSince}T00:00:00`);
  return `${profile.belt} · since ${since.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })}`;
}

interface Props {
  profile: KungFuProfile;
  todayLogs: KungFuLog[];
  weekCounts: { class: number; practice: number };
  loading: boolean;
  error: string | null;
  onLogClass: () => Promise<void>;
  onLogPractice: () => Promise<void>;
  onUndo: (logId: string) => Promise<void>;
}

export default function KungFuSection({
  profile,
  todayLogs,
  weekCounts,
  loading,
  error,
  onLogClass,
  onLogPractice,
  onUndo,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) return <p className="text-sm text-ink-3">Loading…</p>;
  if (error) return <p className="text-sm text-alert bg-alert/10 rounded p-3">{error}</p>;

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      console.error('Kung Fu action failed:', err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="font-medium text-ink">🥋 {beltLabel(profile)}</p>

      <p className="text-sm text-ink-2">
        This week: 🥋 {weekCounts.class} {weekCounts.class === 1 ? 'class' : 'classes'} · 🏠{' '}
        {weekCounts.practice} {weekCounts.practice === 1 ? 'practice' : 'practices'}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          className="btn btn-primary btn-small"
          onClick={() => run('class', onLogClass)}
          disabled={busy !== null}
        >
          + Log class (+{profile.pointsPerClass})
        </button>
        <button
          className="btn btn-secondary btn-small"
          onClick={() => run('practice', onLogPractice)}
          disabled={busy !== null}
        >
          + Log practice (+{profile.pointsPerPractice})
        </button>
      </div>

      {todayLogs.length > 0 && (
        <ul className="space-y-2">
          {todayLogs.map((log) => (
            <li
              key={log.id}
              className="flex items-center gap-3 rounded-xl border border-ok/40 bg-ok/10 px-4 py-2"
            >
              <span className="flex-1 text-sm text-ink">
                {log.sessionType === 'class' ? '🥋 Class' : '🏠 Practice'}
                <span className="text-ink-2 tabular-nums"> · +{log.pointsEarned}</span>
              </span>
              <button
                className="btn btn-secondary btn-small gap-1"
                onClick={() => run(log.id, () => onUndo(log.id))}
                disabled={busy === log.id}
              >
                <Undo2 className="h-3.5 w-3.5" />
                Undo
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
