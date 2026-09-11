import { CheckCircle2, Circle } from 'lucide-react';
import type { Quest } from '@hooks/useQuests';

interface Props {
  quests: Quest[];
  allDone: boolean;
  bonusAwarded: boolean;
  loading: boolean;
  error: string | null;
}

export default function QuestsSection({ quests, allDone, bonusAwarded, loading, error }: Props) {
  if (loading) return <p className="text-sm text-ink-3">Loading…</p>;
  if (error) return <p className="text-sm text-alert bg-alert/10 rounded p-3">{error}</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-2">
        Do these anywhere on the board today — they check themselves off.
      </p>

      <ul className="space-y-2">
        {quests.map((q) => (
          <li
            key={q.key}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
              q.done ? 'border-ok/40 bg-ok/10' : 'border-rule bg-raised'
            }`}
          >
            {q.done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-ok" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-ink-3" />
            )}
            <span className={`flex-1 ${q.done ? 'text-ink line-through decoration-ink-3' : 'text-ink'}`}>
              {q.label}
            </span>
          </li>
        ))}
      </ul>

      {allDone && bonusAwarded && (
        <p className="rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 font-medium text-ink">
          🎉 All 3 quests done! +50 bonus
        </p>
      )}
    </div>
  );
}
