import { useState } from 'react';
import type { RewardEarned, RewardTier } from '@hooks/useRewards';

function ProgressBar({
  value,
  max,
  label,
  ticks = [],
}: {
  value: number;
  max: number;
  label: string;
  ticks?: number[];
}) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
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
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute top-0 h-full w-px bg-ink-3/50"
            style={{ left: `${(t / max) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function currentTierName(tiers: RewardTier[]): string {
  let name = '—';
  for (const t of tiers) if (t.reached) name = t.name;
  return name;
}

function periodLabel(milestoneType: string, periodKey: string): string {
  if (milestoneType === 'weekly') {
    const [y, m, d] = periodKey.split('-').map(Number);
    const date = new Date(y, (m ?? 1) - 1, d ?? 1);
    return `week of ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }
  const [y, m] = periodKey.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

const MILESTONE_LABEL: Record<string, string> = {
  weekly: 'Weekly goal',
  bronze: '🥉 Bronze',
  silver: '🥈 Silver',
  gold: '🥇 Gold',
};

interface Props {
  weeklyGoal: number;
  weekPoints: number;
  monthPoints: number;
  tiers: RewardTier[];
  justEarned: string[];
  earned: RewardEarned[];
  loading: boolean;
  error: string | null;
}

export default function RewardsSection({
  weeklyGoal,
  weekPoints,
  monthPoints,
  tiers,
  justEarned,
  earned,
  loading,
  error,
}: Props) {
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  if (loading) return <p className="text-sm text-ink-3">Loading…</p>;
  if (error) return <p className="text-sm text-alert bg-alert/10 rounded p-3">{error}</p>;

  const justEarnedKey = justEarned.length > 0 ? justEarned.join(',') : null;
  const showBanner = justEarnedKey !== null && justEarnedKey !== dismissedKey;
  const monthlyTarget = tiers.length > 0 ? tiers[tiers.length - 1].points : 400;
  const pending = earned.filter((r) => !r.fulfilledAt);

  return (
    <div className="space-y-5">
      {showBanner && (
        <div className="flex items-center gap-3 rounded-xl border border-ok/40 bg-ok/10 px-4 py-3">
          <span className="flex-1 font-medium text-ink">
            🎉 New reward earned — ask a parent!
          </span>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => setDismissedKey(justEarnedKey)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ProgressBar value={weekPoints} max={weeklyGoal} label="This week" />
        <ProgressBar
          value={monthPoints}
          max={monthlyTarget}
          label={`This month · ${currentTierName(tiers)}`}
          ticks={tiers.map((t) => t.points)}
        />
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
            Your pending rewards ({pending.length})
          </h3>
          <ul className="space-y-2">
            {pending.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-rule bg-raised px-4 py-3"
              >
                <span className="flex-1 text-ink">
                  {MILESTONE_LABEL[r.milestoneType] ?? r.milestoneType}
                  <span className="text-ink-2"> · {periodLabel(r.milestoneType, r.periodKey)}</span>
                </span>
                <span className="text-xs text-ink-3">ask a parent to redeem this!</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
