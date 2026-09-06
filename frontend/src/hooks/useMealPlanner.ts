import { useState, useEffect } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient, type ApiEnvelope } from '../services/api';
import { useAuth } from './useAuth';

type ApiMealEntry = components['schemas']['MealPlanEntry'];

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface Meal {
  /** 'YYYY-MM-DD' — the real calendar date this row is for. */
  date: string;
  /** Weekday label, e.g. 'Monday' — for headers and FR-150 back-compat. */
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
}

interface UseMealPlannerReturn {
  meals: Meal[];
  loading: boolean;
  error: string | null;
  /** Upsert one slot for a date ('YYYY-MM-DD'); a blank value clears it. */
  updateMeal: (date: string, slot: string, text: string) => Promise<void>;
  /** The plan row for a calendar date, matched by local date (FR-150). */
  mealForDate: (date: Date) => Meal | undefined;
  refresh: () => Promise<void>;
}

const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/** Local-time 'YYYY-MM-DD' (not UTC — avoids an off-by-one near midnight). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** An empty Meal for a given ISO date. */
function blankMeal(iso: string): Meal {
  const [y, m, d] = iso.split('-').map(Number);
  const weekday = WEEKDAY_NAMES[new Date(y, m - 1, d).getDay()];
  return { date: iso, day: weekday, breakfast: '', lunch: '', dinner: '', snack: '' };
}

/** The rolling window: today .. today+6, as ISO date strings. */
function rollingWindow(days = 7): string[] {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return toISODate(d);
  });
}

export function useMealPlanner(): UseMealPlannerReturn {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = async () => {
    if (!user?.id) {
      setMeals([]);
      setLoading(false);
      return;
    }
    const window = rollingWindow();
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<ApiEnvelope<ApiMealEntry[]>>('/api/meals', {
        headers: { 'x-user-id': user.id },
        params: { start: window[0], end: window[window.length - 1] },
      });
      const byDate = new Map(window.map((iso) => [iso, blankMeal(iso)]));
      for (const row of res.data?.data ?? []) {
        const meal = byDate.get(row.plan_date);
        if (meal) meal[row.slot as MealSlot] = row.text;
      }
      setMeals(window.map((iso) => byDate.get(iso) as Meal));
    } catch (err: any) {
      console.error('Failed to fetch meal plan:', err);
      setError(err.message || 'Failed to fetch meal plan');
      // still show an empty week so the planner card is usable
      setMeals(window.map(blankMeal));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, [user?.id]);

  const updateMeal = async (date: string, slot: string, text: string) => {
    if (!user?.id) return;
    const key = slot.toLowerCase() as MealSlot;
    if (!MEAL_SLOTS.includes(key)) return;

    const prev = meals;
    setMeals((cur) =>
      cur.map((m) => (m.date === date ? { ...m, [key]: text.trim() } : m)),
    ); // optimistic

    try {
      await apiClient.put(
        `/api/meals/${date}/${key}`,
        { text },
        { headers: { 'x-user-id': user.id } },
      );
    } catch (err: any) {
      console.error('Failed to update meal:', err);
      setMeals(prev); // revert
      setError(err.message || 'Failed to update meal');
    }
  };

  const mealForDate = (date: Date): Meal | undefined => {
    const iso = toISODate(date);
    return meals.find((m) => m.date === iso);
  };

  return { meals, loading, error, updateMeal, mealForDate, refresh: fetchMeals };
}
