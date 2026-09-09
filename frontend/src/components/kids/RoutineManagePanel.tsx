import { useState, type FormEvent } from 'react';
import { Pencil } from 'lucide-react';
import type { NewRoutine, RoutineSlot, RoutineUpdate, RoutineWithStatus } from '@hooks/useKidBoard';

const SLOTS: RoutineSlot[] = ['morning', 'evening'];

interface Props {
  routines: RoutineWithStatus[];
  onCreate: (data: NewRoutine) => Promise<void>;
  onUpdate: (id: string, updates: RoutineUpdate) => Promise<void>;
}

/** Parent-only: add / edit / hide routine items. Label + emoji + slot; no points. */
export default function RoutineManagePanel({ routines, onCreate, onUpdate }: Props) {
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('');
  const [slot, setSlot] = useState<RoutineSlot>('morning');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !emoji.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await onCreate({ slot, label: label.trim(), emoji: emoji.trim(), sortOrder: routines.length });
      setLabel('');
      setEmoji('');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not add it');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 border-t border-rule pt-4 space-y-4">
      <form onSubmit={add} className="space-y-3">
        <h3 className="text-sm font-semibold text-ink">Add a routine step</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            className="input"
            placeholder="Brush teeth"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={80}
            aria-label="Step name"
          />
          <input
            className="input"
            placeholder="🪥"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={8}
            aria-label="Emoji"
          />
          <select
            className="input"
            value={slot}
            onChange={(e) => setSlot(e.target.value as RoutineSlot)}
            aria-label="Time of day"
          >
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-small" disabled={busy || !label.trim() || !emoji.trim()}>
          {busy ? 'Adding…' : 'Add step'}
        </button>
        {err && <p className="text-sm text-alert bg-alert/10 rounded p-2">{err}</p>}
      </form>

      <div>
        <h3 className="text-sm font-semibold text-ink mb-2">
          All steps <span className="text-ink-3 font-normal">({routines.length})</span>
        </h3>
        {routines.length === 0 ? (
          <p className="text-sm text-ink-3">No steps yet.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {routines.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
                <span className={`flex-1 ${r.enabled ? 'text-ink' : 'text-ink-3 line-through'}`}>
                  {r.emoji} {r.label} <span className="text-ink-3">· {r.slot}</span>
                </span>
                <EditRoutineButton routine={r} onSave={onUpdate} />
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() =>
                    onUpdate(r.id, { enabled: !r.enabled }).catch((e) =>
                      console.error('Failed to toggle routine:', e),
                    )
                  }
                >
                  {r.enabled ? 'Hide' : 'Show'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EditRoutineButton({
  routine,
  onSave,
}: {
  routine: RoutineWithStatus;
  onSave: (id: string, updates: RoutineUpdate) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(routine.label);
  const [emoji, setEmoji] = useState(routine.emoji);
  const [slot, setSlot] = useState<RoutineSlot>(routine.slot as RoutineSlot);

  if (!open) {
    return (
      <button
        aria-label={`Edit ${routine.label}`}
        title="Edit"
        className="p-1.5 text-ink-3 hover:text-accent"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-4 w-4" />
      </button>
    );
  }

  const save = async () => {
    await onSave(routine.id, {
      label: label.trim() || routine.label,
      emoji: emoji.trim() || routine.emoji,
      slot,
    }).catch((e) => console.error('Failed to save routine:', e));
    setOpen(false);
  };

  return (
    <span className="flex items-center gap-1">
      <input
        className="input py-1 w-28 text-sm"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        aria-label="Step name"
      />
      <input
        className="input py-1 w-14 text-sm"
        value={emoji}
        onChange={(e) => setEmoji(e.target.value)}
        aria-label="Emoji"
      />
      <select
        className="input py-1 w-auto text-sm"
        value={slot}
        onChange={(e) => setSlot(e.target.value as RoutineSlot)}
        aria-label="Time of day"
      >
        {SLOTS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button className="btn btn-primary btn-small" onClick={save}>
        Save
      </button>
      <button className="btn btn-secondary btn-small" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </span>
  );
}
