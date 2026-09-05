import { UtensilsCrossed } from 'lucide-react';
import type { Meal } from '@hooks/useMealPlanner';

interface Props {
  meal: Meal | undefined;
  /** `full` (Week/Day) shows the label; `compact` (Month) is icon + dinner only. */
  variant?: 'full' | 'compact';
}

/**
 * FR-150: a thin meals line at the bottom of a calendar day cell. Shows the
 * day's dinner; the tooltip carries breakfast / lunch / dinner. Renders
 * nothing when there's no plan for that day.
 */
export function MealsLine({ meal, variant = 'full' }: Props) {
  if (!meal) return null;

  const primary = meal.dinner || meal.lunch || meal.breakfast;
  if (!primary) return null;

  const tooltip = [
    meal.breakfast && `Breakfast: ${meal.breakfast}`,
    meal.lunch && `Lunch: ${meal.lunch}`,
    meal.dinner && `Dinner: ${meal.dinner}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div
      className={`flex items-center gap-1 text-ink-3 truncate ${
        variant === 'compact' ? 'text-[10px]' : 'mt-1 pt-1 border-t border-rule/60 text-xs'
      }`}
      title={tooltip}
    >
      <UtensilsCrossed className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{primary}</span>
    </div>
  );
}

export default MealsLine;
