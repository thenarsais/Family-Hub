import { useMemo, useState, type FormEvent } from 'react';
import { Check, Plus, Undo2 } from 'lucide-react';
import type { HomeworkItemWithStatus, NewHomework } from '@hooks/useHomework';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/** "Wed 9/12" from a YYYY-MM-DD string, parsed as a local date. */
function dueLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
}

interface Props {
  items: HomeworkItemWithStatus[];
  onComplete: (id: string) => Promise<void>;
  onUncomplete: (id: string) => Promise<void>;
  onAdd: (data: NewHomework) => Promise<void>;
}

export default function HomeworkSection({ items, onComplete, onUncomplete, onAdd }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    try {
      await fn();
    } catch (err) {
      console.error('Homework action failed:', err);
    } finally {
      setBusyId(null);
    }
  };

  const today = todayIso();
  const { overdue, dueToday, upcoming, doneToday } = useMemo(() => {
    const groups = {
      overdue: [] as HomeworkItemWithStatus[],
      dueToday: [] as HomeworkItemWithStatus[],
      upcoming: [] as HomeworkItemWithStatus[],
      doneToday: [] as HomeworkItemWithStatus[],
    };
    for (const it of items) {
      if (it.completed) groups.doneToday.push(it);
      else if (it.isOverdue) groups.overdue.push(it);
      else if (it.dueDate === today) groups.dueToday.push(it);
      else groups.upcoming.push(it);
    }
    return groups;
  }, [items, today]);

  const empty =
    overdue.length + dueToday.length + upcoming.length + doneToday.length === 0;

  const openRow = (it: HomeworkItemWithStatus, opts: { emphatic?: boolean; overdue?: boolean }) => (
    <li key={it.id}>
      <button
        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition disabled:opacity-60 ${
          opts.overdue
            ? 'border-alert/40 bg-alert/10 hover:border-alert'
            : 'border-rule bg-raised hover:border-accent hover:bg-accent/5'
        }`}
        onClick={() => run(it.id, () => onComplete(it.id))}
        disabled={busyId === it.id}
      >
        <span
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
            opts.overdue ? 'border-alert' : 'border-ink-3'
          }`}
        />
        <span className="flex-1">
          <span
            className={`block text-ink ${
              opts.emphatic || opts.overdue ? 'font-semibold' : 'font-medium'
            }`}
          >
            {it.title}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
            {it.subject && (
              <span className="rounded bg-rule/60 px-1.5 py-px">{it.subject}</span>
            )}
            <span>
              {opts.overdue ? 'was due ' : 'due '}
              {dueLabel(it.dueDate)}
            </span>
          </span>
        </span>
        <span className="text-sm font-semibold text-accent tabular-nums">+{it.pointsValue}</span>
      </button>
    </li>
  );

  const submitAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    const dueDate = String(data.get('dueDate') || '');
    if (!title || !dueDate) return;
    try {
      await onAdd({
        title,
        dueDate,
        subject: String(data.get('subject') || '').trim() || undefined,
      });
      form.reset();
      setAdding(false);
    } catch (err) {
      console.error('Failed to add homework:', err);
    }
  };

  return (
    <div className="space-y-5">
      {empty ? (
        <p className="text-sm text-ink-3">No homework due in the next week. 🎉</p>
      ) : (
        <div className="space-y-5">
          {overdue.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-alert">
                Overdue
              </h3>
              <ul className="space-y-2">
                {overdue.map((it) => openRow(it, { overdue: true }))}
              </ul>
            </div>
          )}

          {dueToday.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
                Due today
              </h3>
              <ul className="space-y-2">
                {dueToday.map((it) => openRow(it, { emphatic: true }))}
              </ul>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
                This week
              </h3>
              <ul className="space-y-2">{upcoming.map((it) => openRow(it, {}))}</ul>
            </div>
          )}

          {doneToday.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
                Done today
              </h3>
              <ul className="space-y-2">
                {doneToday.map((it) => (
                  <li key={it.id}>
                    <div className="flex items-center gap-3 rounded-xl border border-ok/40 bg-ok/10 px-4 py-3">
                      <Check className="h-5 w-5 shrink-0 text-ok" />
                      <span className="flex-1 font-medium text-ink line-through decoration-ink-3">
                        {it.title}
                      </span>
                      <span className="text-xs text-ink-2 tabular-nums">
                        +{it.pointsEarned ?? it.pointsValue}
                      </span>
                      <button
                        className="btn btn-secondary btn-small gap-1"
                        onClick={() => run(it.id, () => onUncomplete(it.id))}
                        disabled={busyId === it.id}
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        Undo
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {adding ? (
        <form
          onSubmit={submitAdd}
          className="grid gap-2 rounded-xl border border-rule p-3 sm:grid-cols-2"
        >
          <input
            name="title"
            className="input sm:col-span-2"
            placeholder="What's the homework?"
            maxLength={120}
            aria-label="Homework title"
          />
          <input
            name="subject"
            className="input"
            placeholder="Subject (optional)"
            maxLength={40}
            aria-label="Subject"
          />
          <input
            name="dueDate"
            type="date"
            className="input"
            defaultValue={today}
            aria-label="Due date"
          />
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="btn btn-primary btn-small">
              Add
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setAdding(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button className="btn btn-secondary btn-small gap-1" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add homework
        </button>
      )}
    </div>
  );
}
