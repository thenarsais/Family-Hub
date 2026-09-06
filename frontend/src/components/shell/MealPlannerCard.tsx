import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { MEAL_SLOTS, type Meal, type MealSlot } from '../../hooks/useMealPlanner';

interface MealPlannerCardProps {
  meals: Meal[];
  onSetSlot: (date: string, slot: MealSlot, text: string) => void | Promise<void>;
}

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const SLOT_ICON: Record<MealSlot, string> = {
  breakfast: '🍳',
  lunch: '🥪',
  dinner: '🍽️',
  snack: '🍎',
};

function dayHeading(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const wd = date.toLocaleDateString(undefined, { weekday: 'short' });
  return `${wd} ${m}/${d}`;
}

/**
 * FR-015 — the dashboard meal-planner card body: the rolling 7-day plan as a
 * day-by-day list, four slots each, every cell tap-to-edit plain text. Shares
 * the same data as the calendar meals line (FR-150).
 */
export function MealPlannerCard({ meals, onSetSlot }: MealPlannerCardProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
      {meals.map((meal) => {
        const [y, m, d] = meal.date.split('-').map(Number);
        const isToday = new Date(y, m - 1, d).getTime() === today.getTime();
        return (
          <div key={meal.date}>
            <p
              className={`text-xs font-semibold mb-1 ${
                isToday ? 'text-accent' : 'text-ink-2'
              }`}
            >
              {dayHeading(meal.date)}
              {isToday && ' · Today'}
            </p>
            <ul className="space-y-0.5">
              {MEAL_SLOTS.map((slot) => (
                <li key={slot} className="flex items-center gap-2 text-sm">
                  <span className="shrink-0 w-4 text-center" aria-hidden="true">
                    {SLOT_ICON[slot]}
                  </span>
                  <span className="shrink-0 w-16 text-ink-3 text-xs">{SLOT_LABEL[slot]}</span>
                  <SlotCell
                    value={meal[slot]}
                    label={`${SLOT_LABEL[slot]} for ${dayHeading(meal.date)}`}
                    onSave={(text) => onSetSlot(meal.date, slot, text)}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function SlotCell({
  value,
  label,
  onSave,
}: {
  value: string;
  label: string;
  onSave: (text: string) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const start = () => {
    setDraft(value);
    setEditing(true);
  };

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
    <button
      type="button"
      onClick={start}
      aria-label={value ? `Edit ${label}` : `Add ${label}`}
      className={`flex-1 text-left truncate rounded px-1 py-0.5 hover:bg-accent-soft transition-colors ${
        value ? 'text-ink' : 'text-ink-3 italic'
      }`}
    >
      {value || 'Add…'}
    </button>
  );
}

export default MealPlannerCard;
