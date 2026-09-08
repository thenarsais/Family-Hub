import { useEffect, useState, type FormEvent } from 'react';
import { Pencil } from 'lucide-react';
import {
  type ChoreUpdate,
  type ChoreWithStatus,
  type NewChore,
  type TimeSlot,
} from '@hooks/useChores';
import type { components } from '@/types/api-generated';

type FamilyMember = components['schemas']['FamilyMember'];

const SLOTS: TimeSlot[] = ['morning', 'afternoon', 'evening'];

interface Props {
  familyChores: ChoreWithStatus[];
  members: FamilyMember[];
  selfId: string;
  onLoad: () => void;
  createChore: (data: NewChore) => Promise<void>;
  updateChore: (choreId: string, updates: ChoreUpdate) => Promise<void>;
}

export default function ChoreManagePanel({
  familyChores,
  members,
  selfId,
  onLoad,
  createChore,
  updateChore,
}: Props) {
  useEffect(() => {
    onLoad(); // once, when the panel mounts
  }, []);

  const [name, setName] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('morning');
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
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await createChore({
        name: n,
        timeSlot,
        pointsValue,
        assigneeId: assigneeId === selfId ? undefined : assigneeId,
      });
      setName('');
      setPointsValue(10);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not add the chore');
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = (c: ChoreWithStatus) =>
    updateChore(c.id, { enabled: !c.enabled }).catch((e2) =>
      console.error('Failed to toggle chore:', e2),
    );

  return (
    <div className="mt-4 border-t border-rule pt-4 space-y-4">
      <form onSubmit={add} className="space-y-3">
        <h3 className="text-sm font-semibold text-ink">Add a chore</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="input"
            placeholder="Chore name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            aria-label="Chore name"
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
          <select
            className="input"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
            aria-label="Time of day"
          >
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <input
            className="input"
            type="number"
            min={1}
            value={pointsValue}
            onChange={(e) => setPointsValue(Math.max(1, Number(e.target.value) || 1))}
            aria-label="Points"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-small" disabled={busy || !name.trim()}>
          {busy ? 'Adding…' : 'Add chore'}
        </button>
        {err && <p className="text-sm text-alert bg-alert/10 rounded p-2">{err}</p>}
      </form>

      <div>
        <h3 className="text-sm font-semibold text-ink mb-2">
          All chores <span className="text-ink-3 font-normal">({familyChores.length})</span>
        </h3>
        {familyChores.length === 0 ? (
          <p className="text-sm text-ink-3">No chores yet.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {familyChores.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                <span className={`flex-1 ${c.enabled ? 'text-ink' : 'text-ink-3 line-through'}`}>
                  {c.name}
                  <span className="text-ink-3"> · {nameFor(c.userId)} · {c.timeSlot} · +{c.pointsValue}</span>
                </span>
                <EditChoreButton chore={c} onSave={updateChore} />
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => toggleEnabled(c)}
                >
                  {c.enabled ? 'Disable' : 'Enable'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EditChoreButton({
  chore,
  onSave,
}: {
  chore: ChoreWithStatus;
  onSave: (id: string, updates: ChoreUpdate) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(chore.name);
  const [pointsValue, setPointsValue] = useState(chore.pointsValue);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(chore.timeSlot);

  if (!open) {
    return (
      <button
        aria-label={`Edit ${chore.name}`}
        title="Edit"
        className="p-1.5 text-ink-3 hover:text-accent"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-4 w-4" />
      </button>
    );
  }

  const save = async () => {
    await onSave(chore.id, { name: name.trim() || chore.name, pointsValue, timeSlot }).catch((e) =>
      console.error('Failed to save chore:', e),
    );
    setOpen(false);
  };

  return (
    <span className="flex items-center gap-1">
      <input
        className="input py-1 w-32 text-sm"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Chore name"
      />
      <select
        className="input py-1 w-auto text-sm"
        value={timeSlot}
        onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
        aria-label="Time of day"
      >
        {SLOTS.map((s) => (
          <option key={s} value={s}>
            {s}
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
