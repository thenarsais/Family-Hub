import { useEffect, useState, type FormEvent } from 'react';
import { Pencil } from 'lucide-react';
import type { HabitUpdate, HabitWithStatus, NewHabit } from '@hooks/useHabits';
import type { components } from '@/types/api-generated';

type FamilyMember = components['schemas']['FamilyMember'];

const TARGETS = [1, 2, 3, 4, 5, 6, 7];

interface Props {
  familyHabits: HabitWithStatus[];
  members: FamilyMember[];
  selfId: string;
  onLoad: () => void;
  createHabit: (data: NewHabit) => Promise<void>;
  updateHabit: (habitId: string, updates: HabitUpdate) => Promise<void>;
}

export default function HabitManagePanel({
  familyHabits,
  members,
  selfId,
  onLoad,
  createHabit,
  updateHabit,
}: Props) {
  useEffect(() => {
    onLoad(); // once, when the panel mounts
  }, []);

  const [title, setTitle] = useState('');
  const [weeklyTarget, setWeeklyTarget] = useState(7);
  const [pointsValue, setPointsValue] = useState(10);
  const [assigneeId, setAssigneeId] = useState(selfId);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const nameFor = (userId: string) => {
    const m = members.find((x) => x.user_id === userId);
    return m?.name || m?.email || 'Unknown';
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await createHabit({
        title: t,
        weeklyTarget,
        pointsValue,
        assigneeId: assigneeId === selfId ? undefined : assigneeId,
      });
      setTitle('');
      setPointsValue(10);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not add the habit');
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = (h: HabitWithStatus) =>
    updateHabit(h.id, { enabled: !h.enabled }).catch((e2) =>
      console.error('Failed to toggle habit:', e2),
    );

  return (
    <div className="mt-4 border-t border-rule pt-4 space-y-4">
      <form onSubmit={add} className="space-y-3">
        <h3 className="text-sm font-semibold text-ink">Add a habit</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="input"
            placeholder="Habit name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            aria-label="Habit name"
          />
          <select
            className="input"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            aria-label="Assign to"
          >
            <option value={selfId}>For me</option>
            {members
              .filter((m) => m.user_id !== selfId)
              .map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  For {m.name || m.email}
                </option>
              ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <span className="whitespace-nowrap">Days / week</span>
            <select
              className="input py-1"
              value={weeklyTarget}
              onChange={(e) => setWeeklyTarget(Number(e.target.value))}
              aria-label="Days per week"
            >
              {TARGETS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <input
            className="input"
            type="number"
            min={1}
            value={pointsValue}
            onChange={(e) => setPointsValue(Math.max(1, Number(e.target.value) || 1))}
            aria-label="Points"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-small" disabled={busy || !title.trim()}>
          {busy ? 'Adding…' : 'Add habit'}
        </button>
        {err && <p className="text-sm text-alert bg-alert/10 rounded p-2">{err}</p>}
      </form>

      <div>
        <h3 className="text-sm font-semibold text-ink mb-2">
          All habits <span className="text-ink-3 font-normal">({familyHabits.length})</span>
        </h3>
        {familyHabits.length === 0 ? (
          <p className="text-sm text-ink-3">No habits yet.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {familyHabits.map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-2 text-sm">
                <span className={`flex-1 ${h.enabled ? 'text-ink' : 'text-ink-3 line-through'}`}>
                  {h.title}
                  <span className="text-ink-3">
                    {' '}
                    · {nameFor(h.userId)} · {h.weeklyTarget}×/wk · +{h.pointsValue}
                  </span>
                </span>
                <EditHabitButton habit={h} onSave={updateHabit} />
                <button className="btn btn-secondary btn-small" onClick={() => toggleEnabled(h)}>
                  {h.enabled ? 'Disable' : 'Enable'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EditHabitButton({
  habit,
  onSave,
}: {
  habit: HabitWithStatus;
  onSave: (id: string, updates: HabitUpdate) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(habit.title);
  const [pointsValue, setPointsValue] = useState(habit.pointsValue);
  const [weeklyTarget, setWeeklyTarget] = useState(habit.weeklyTarget);

  if (!open) {
    return (
      <button
        aria-label={`Edit ${habit.title}`}
        title="Edit"
        className="p-1.5 text-ink-3 hover:text-accent"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-4 w-4" />
      </button>
    );
  }

  const save = async () => {
    await onSave(habit.id, {
      title: title.trim() || habit.title,
      pointsValue,
      weeklyTarget,
    }).catch((e) => console.error('Failed to save habit:', e));
    setOpen(false);
  };

  return (
    <span className="flex items-center gap-1">
      <input
        className="input py-1 w-32 text-sm"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Habit name"
      />
      <select
        className="input py-1 w-auto text-sm"
        value={weeklyTarget}
        onChange={(e) => setWeeklyTarget(Number(e.target.value))}
        aria-label="Days per week"
      >
        {TARGETS.map((n) => (
          <option key={n} value={n}>
            {n}×
          </option>
        ))}
      </select>
      <input
        className="input py-1 w-16 text-sm"
        type="number"
        min={1}
        value={pointsValue}
        onChange={(e) => setPointsValue(Math.max(1, Number(e.target.value) || 1))}
        aria-label="Points"
      />
      <button className="btn btn-primary btn-small" onClick={save}>
        Save
      </button>
      <button className="btn btn-secondary btn-small" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </span>
  );
}
