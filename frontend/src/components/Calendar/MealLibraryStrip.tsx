import { useState, type DragEvent, type FormEvent, type KeyboardEvent } from 'react';
import { X, GripVertical } from 'lucide-react';
import type { LibraryMeal } from '../../hooks/useMealLibrary';
import { MEAL_DRAG_TYPE, SLOT_ICON } from './MealDayEditor';

interface Props {
  library: LibraryMeal[];
  onAdd: (name: string) => void | Promise<void>;
  onRename: (id: string, name: string) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
  className?: string;
}

/**
 * FR-133 — the family's saved-meals list as draggable chips. Drag a chip onto a
 * day/slot cell in the planner (or calendar day view) to fill it. Add / rename /
 * remove entries inline.
 */
export function MealLibraryStrip({ library, onAdd, onRename, onRemove, className = '' }: Props) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;
    void onAdd(name);
    setDraft('');
  };

  const startEdit = (m: LibraryMeal) => {
    setEditingId(m.id);
    setEditText(m.name);
  };
  const commitEdit = () => {
    if (editingId && editText.trim() && editText.trim() !== library.find((m) => m.id === editingId)?.name) {
      void onRename(editingId, editText.trim());
    }
    setEditingId(null);
  };
  const editKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitEdit();
    else if (e.key === 'Escape') setEditingId(null);
  };

  const onDragStart = (e: DragEvent, m: LibraryMeal) => {
    e.dataTransfer.setData(MEAL_DRAG_TYPE, m.name);
    e.dataTransfer.setData('text/plain', m.name);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className={className}>
      <p className="text-xs font-semibold text-ink-3 mb-1">Saved meals — drag onto a slot</p>
      <div className="flex flex-wrap gap-1.5">
        {library.map((m) =>
          editingId === m.id ? (
            <input
              key={m.id}
              autoFocus
              value={editText}
              aria-label={`Rename ${m.name}`}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={editKey}
              className="input py-0.5 px-1.5 text-xs w-28"
            />
          ) : (
            <span
              key={m.id}
              draggable
              onDragStart={(e) => onDragStart(e, m)}
              className="group inline-flex items-center gap-1 rounded-full border border-rule bg-raised
                         pl-1.5 pr-1 py-0.5 text-xs text-ink cursor-grab active:cursor-grabbing
                         hover:border-accent"
            >
              <GripVertical className="w-3 h-3 text-ink-3 shrink-0" aria-hidden="true" />
              {m.defaultSlot && (
                <span aria-hidden="true" title={m.defaultSlot}>
                  {SLOT_ICON[m.defaultSlot]}
                </span>
              )}
              <button
                type="button"
                onClick={() => startEdit(m)}
                className="truncate max-w-[9rem]"
                title="Rename"
              >
                {m.name}
              </button>
              <button
                type="button"
                onClick={() => void onRemove(m.id)}
                aria-label={`Remove ${m.name} from the library`}
                className="shrink-0 text-ink-3 hover:text-ink opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            </span>
          ),
        )}
        <form onSubmit={submit} className="inline-flex">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="+ add a meal"
            aria-label="Add a meal to the library"
            className="input py-0.5 px-2 text-xs w-32 rounded-full"
          />
        </form>
      </div>
    </div>
  );
}

export default MealLibraryStrip;
