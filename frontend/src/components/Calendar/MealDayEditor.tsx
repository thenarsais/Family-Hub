import { useState, useRef, useEffect, type KeyboardEvent, type DragEvent } from 'react';
import { Star } from 'lucide-react';
import { MEAL_SLOTS, type Meal, type MealSlot } from '../../hooks/useMealPlanner';

export const MEAL_DRAG_TYPE = 'application/x-meal-name';

export const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const SLOT_ICON: Record<MealSlot, string> = {
  breakfast: '🍳',
  lunch: '🥪',
  dinner: '🍽️',
  snack: '🍎',
};

interface Props {
  meal: Meal;
  /** e.g. "Mon 8/17" — used in aria labels. */
  dateLabel: string;
  onSetSlot: (date: string, slot: MealSlot, text: string) => void | Promise<void>;
  /** When given, filled slots show a "save to library" star. */
  onSaveToLibrary?: (name: string, slot: MealSlot) => void | Promise<void>;
}

/**
 * FR-015 / FR-133 — the four editable meal slots for one day. Each slot is
 * tap-to-edit plain text AND a drop target for a dragged library chip. Shared
 * by the dashboard planner card and the calendar day view.
 */
export function MealDayEditor({ meal, dateLabel, onSetSlot, onSaveToLibrary }: Props) {
  return (
    <ul className="space-y-0.5">
      {MEAL_SLOTS.map((slot) => (
        <li key={slot} className="flex items-center gap-2 text-sm">
          <span className="shrink-0 w-4 text-center" aria-hidden="true">
            {SLOT_ICON[slot]}
          </span>
          <span className="shrink-0 w-16 text-ink-3 text-xs">{SLOT_LABEL[slot]}</span>
          <SlotCell
            value={meal[slot]}
            label={`${SLOT_LABEL[slot]} for ${dateLabel}`}
            onSave={(text) => onSetSlot(meal.date, slot, text)}
            onSaveToLibrary={
              onSaveToLibrary && meal[slot]
                ? () => onSaveToLibrary(meal[slot], slot)
                : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}

function SlotCell({
  value,
  label,
  onSave,
  onSaveToLibrary,
}: {
  value: string;
  label: string;
  onSave: (text: string) => void | Promise<void>;
  onSaveToLibrary?: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value.trim()) void onSave(draft);
  };
  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    else if (e.key === 'Escape') cancel();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const name = (e.dataTransfer.getData(MEAL_DRAG_TYPE) || e.dataTransfer.getData('text/plain')).trim();
    if (name) void onSave(name);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        aria-label={label}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className="input py-0.5 text-sm flex-1"
      />
    );
  }

  return (
    <span
      className={`flex-1 flex items-center gap-1 rounded transition-colors ${
        dragOver ? 'ring-2 ring-accent bg-accent-soft' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        aria-label={value ? `Edit ${label}` : `Add ${label}`}
        className={`flex-1 min-w-0 text-left truncate px-1 py-0.5 hover:bg-accent-soft rounded transition-colors ${
          value ? 'text-ink' : 'text-ink-3 italic'
        }`}
      >
        {value || 'Add…'}
      </button>
      {onSaveToLibrary && (
        <button
          type="button"
          onClick={() => void onSaveToLibrary()}
          aria-label={`Save "${value}" to the meal library`}
          title="Save to library"
          className="shrink-0 text-ink-3 hover:text-haldi transition-colors"
        >
          <Star className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

export default MealDayEditor;
