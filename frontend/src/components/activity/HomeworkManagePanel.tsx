import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type {
  HomeworkItemWithStatus,
  HomeworkUpdate,
  NewHomework,
} from '@hooks/useHomework';
import type { components } from '@/types/api-generated';

type FamilyMember = components['schemas']['FamilyMember'];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

interface Props {
  familyItems: HomeworkItemWithStatus[];
  members: FamilyMember[];
  selfId: string;
  onLoad: () => void;
  createItem: (data: NewHomework) => Promise<void>;
  updateItem: (id: string, updates: HomeworkUpdate) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export default function HomeworkManagePanel({
  familyItems,
  members,
  selfId,
  onLoad,
  createItem,
  updateItem,
  deleteItem,
}: Props) {
  useEffect(() => {
    onLoad(); // once, when the panel mounts
  }, []);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [assigneeId, setAssigneeId] = useState(selfId);
  const [dueDate, setDueDate] = useState(todayIso());
  const [pointsValue, setPointsValue] = useState(10);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const nameFor = (userId: string) => {
    const m = members.find((x) => x.user_id === userId);
    return m?.name || m?.email || 'Unknown';
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t || !dueDate || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await createItem({
        title: t,
        subject: subject.trim() || undefined,
        dueDate,
        pointsValue,
        assigneeId: assigneeId === selfId ? undefined : assigneeId,
      });
      setTitle('');
      setSubject('');
      setPointsValue(10);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not add the homework');
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setConfirmId(null);
    deleteItem(id).catch((e2) => console.error('Failed to delete homework:', e2));
  };

  return (
    <div className="mt-4 border-t border-rule pt-4 space-y-4">
      <form onSubmit={add} className="space-y-3">
        <h3 className="text-sm font-semibold text-ink">Add homework</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="input sm:col-span-2"
            placeholder="What's the homework?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            aria-label="Homework title"
          />
          <input
            className="input"
            placeholder="Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={40}
            aria-label="Subject"
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
          <input
            className="input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date"
          />
          <input
            className="input"
            type="number"
            min={1}
            value={pointsValue}
            onChange={(e) => setPointsValue(Math.max(1, Number(e.target.value) || 1))}
            aria-label="Points"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-small"
          disabled={busy || !title.trim() || !dueDate}
        >
          {busy ? 'Adding…' : 'Add homework'}
        </button>
        {err && <p className="text-sm text-alert bg-alert/10 rounded p-2">{err}</p>}
      </form>

      <div>
        <h3 className="text-sm font-semibold text-ink mb-2">
          All homework <span className="text-ink-3 font-normal">({familyItems.length})</span>
        </h3>
        {familyItems.length === 0 ? (
          <p className="text-sm text-ink-3">No homework yet.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {familyItems.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-2 text-sm">
                <span className={`flex-1 ${it.completed ? 'text-ink-3 line-through' : 'text-ink'}`}>
                  {it.title}
                  <span className="text-ink-3">
                    {' · '}
                    {nameFor(it.userId)}
                    {it.subject ? ` · ${it.subject}` : ''} · due {it.dueDate.slice(5)} · +
                    {it.pointsValue}
                  </span>
                </span>
                <EditHomeworkButton item={it} onSave={updateItem} />
                <button
                  className={`btn btn-small ${confirmId === it.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => remove(it.id)}
                  aria-label={confirmId === it.id ? `Confirm delete ${it.title}` : `Delete ${it.title}`}
                >
                  {confirmId === it.id ? (
                    'Sure?'
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EditHomeworkButton({
  item,
  onSave,
}: {
  item: HomeworkItemWithStatus;
  onSave: (id: string, updates: HomeworkUpdate) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [subject, setSubject] = useState(item.subject ?? '');
  const [dueDate, setDueDate] = useState(item.dueDate.slice(0, 10));
  const [pointsValue, setPointsValue] = useState(item.pointsValue);

  if (!open) {
    return (
      <button
        aria-label={`Edit ${item.title}`}
        title="Edit"
        className="p-1.5 text-ink-3 hover:text-accent"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-4 w-4" />
      </button>
    );
  }

  const save = async () => {
    await onSave(item.id, {
      title: title.trim() || item.title,
      subject: subject.trim() || null,
      dueDate,
      pointsValue,
    }).catch((e) => console.error('Failed to save homework:', e));
    setOpen(false);
  };

  return (
    <span className="flex flex-wrap items-center gap-1">
      <input
        className="input py-1 w-32 text-sm"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Homework title"
      />
      <input
        className="input py-1 w-24 text-sm"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        aria-label="Subject"
      />
      <input
        className="input py-1 w-36 text-sm"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        aria-label="Due date"
      />
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
