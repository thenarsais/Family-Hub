import type { Meal, MealSlot } from '../../hooks/useMealPlanner';
import { useMealLibrary } from '../../hooks/useMealLibrary';
import { MealDayEditor } from '../Calendar/MealDayEditor';
import { MealLibraryStrip } from '../Calendar/MealLibraryStrip';

interface MealPlannerCardProps {
  meals: Meal[];
  onSetSlot: (date: string, slot: MealSlot, text: string) => void | Promise<void>;
}

function dayHeading(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const wd = date.toLocaleDateString(undefined, { weekday: 'short' });
  return `${wd} ${m}/${d}`;
}

/**
 * FR-015 / FR-133 — the dashboard meal-planner card body: a draggable saved-meals
 * strip on top, then the rolling 7-day plan as a day-by-day list. Every slot is
 * tap-to-edit and a drop target for a library chip; filled slots can be saved
 * back to the library. Same data as the calendar meals line (FR-150).
 */
export function MealPlannerCard({ meals, onSetSlot }: MealPlannerCardProps) {
  const { library, addToLibrary, renameLibraryItem, removeFromLibrary } = useMealLibrary();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-3">
      <MealLibraryStrip
        library={library}
        onAdd={addToLibrary}
        onRename={renameLibraryItem}
        onRemove={removeFromLibrary}
        className="pb-2 border-b border-rule"
      />

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {meals.map((meal) => {
          const [y, m, d] = meal.date.split('-').map(Number);
          const isToday = new Date(y, m - 1, d).getTime() === today.getTime();
          const label = dayHeading(meal.date);
          return (
            <div key={meal.date}>
              <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-accent' : 'text-ink-2'}`}>
                {label}
                {isToday && ' · Today'}
              </p>
              <MealDayEditor
                meal={meal}
                dateLabel={label}
                onSetSlot={onSetSlot}
                onSaveToLibrary={(name, slot) => addToLibrary(name, slot)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MealPlannerCard;
