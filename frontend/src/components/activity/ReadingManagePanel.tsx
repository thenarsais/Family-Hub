import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import type { ReadingGoalsWithMember, ReadingGoalUpdate } from '@hooks/useReading';

interface Props {
  familyGoals: ReadingGoalsWithMember[];
  onLoad: () => void;
  updateGoals: (userId: string, updates: ReadingGoalUpdate) => Promise<void>;
}

export default function ReadingManagePanel({ familyGoals, onLoad, updateGoals }: Props) {
  useEffect(() => {
    onLoad(); // once, when the panel mounts
  }, []);

  return (
    <div className="mt-4 border-t border-rule pt-4 space-y-2">
      <h3 className="text-sm font-semibold text-ink">Reading goals</h3>
      {familyGoals.length === 0 ? (
        <p className="text-sm text-ink-3">No family members yet.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {familyGoals.map((m) => (
            <EditGoalsRow key={m.userId} member={m} onSave={updateGoals} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EditGoalsRow({
  member,
  onSave,
}: {
  member: ReadingGoalsWithMember;
  onSave: (userId: string, updates: ReadingGoalUpdate) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [dailyMinutes, setDailyMinutes] = useState(member.dailyMinutes);
  const [weeklyMinutes, setWeeklyMinutes] = useState(member.weeklyMinutes);
  const [pointsValue, setPointsValue] = useState(member.pointsValue);

  if (!open) {
    return (
      <li className="flex items-center gap-3 py-2 text-sm">
        <span className="flex-1 text-ink">
          {member.name ?? 'Unknown'}
          <span className="text-ink-3">
            {' · '}
            {member.dailyMinutes} min/day · {member.weeklyMinutes} min/week · +
            {member.pointsValue} pts
          </span>
        </span>
        <button
          aria-label={`Edit ${member.name ?? 'member'}'s reading goals`}
          title="Edit"
          className="p-1.5 text-ink-3 hover:text-accent"
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </button>
      </li>
    );
  }

  const save = async () => {
    await onSave(member.userId, { dailyMinutes, weeklyMinutes, pointsValue }).catch((e) =>
      console.error('Failed to save reading goals:', e),
    );
    setOpen(false);
  };

  return (
    <li className="flex flex-wrap items-center gap-2 py-2 text-sm">
      <span className="flex-1 text-ink">{member.name ?? 'Unknown'}</span>
      <input
        className="input py-1 w-20 text-sm"
        type="number"
        min={1}
        value={dailyMinutes}
        onChange={(e) => setDailyMinutes(Math.max(1, Number(e.target.value) || 1))}
        aria-label={`${member.name ?? 'member'} daily minutes goal`}
      />
      <span className="text-ink-3">min/day</span>
      <input
        className="input py-1 w-20 text-sm"
        type="number"
        min={1}
        value={weeklyMinutes}
        onChange={(e) => setWeeklyMinutes(Math.max(1, Number(e.target.value) || 1))}
        aria-label={`${member.name ?? 'member'} weekly minutes goal`}
      />
      <span className="text-ink-3">min/week</span>
      <input
        className="input py-1 w-16 text-sm"
        type="number"
        min={1}
        value={pointsValue}
        onChange={(e) => setPointsValue(Math.max(1, Number(e.target.value) || 1))}
        aria-label={`${member.name ?? 'member'} points value`}
      />
      <span className="text-ink-3">pts</span>
      <button className="btn btn-primary btn-small" onClick={save}>
        Save
      </button>
      <button className="btn btn-secondary btn-small" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </li>
  );
}
