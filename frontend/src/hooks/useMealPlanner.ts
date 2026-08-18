import { useState, useEffect } from 'react';

export interface Meal {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  plannedBy: string;
}

interface UseMealPlannerReturn {
  meals: Meal[];
  loading: boolean;
  error: string | null;
  updateMeal: (day: string, mealType: string, meal: string) => Promise<void>;
}

export function useMealPlanner(): UseMealPlannerReturn {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        setLoading(true);

        // Mock meal plan for testing
        const mockMeals: Meal[] = [
          {
            day: 'Monday',
            breakfast: 'Oatmeal with berries',
            lunch: 'Chicken salad',
            dinner: 'Pasta primavera',
            plannedBy: 'Mom'
          },
          {
            day: 'Tuesday',
            breakfast: 'Pancakes',
            lunch: 'Turkey sandwich',
            dinner: 'Tacos',
            plannedBy: 'Dad'
          },
          {
            day: 'Wednesday',
            breakfast: 'Yogurt parfait',
            lunch: 'Sushi rolls',
            dinner: 'Grilled salmon',
            plannedBy: 'Mom'
          },
          {
            day: 'Thursday',
            breakfast: 'Scrambled eggs',
            lunch: 'Pasta with marinara',
            dinner: 'Chicken stir-fry',
            plannedBy: 'Dad'
          },
          {
            day: 'Friday',
            breakfast: 'Smoothie bowl',
            lunch: 'Caesar wrap',
            dinner: 'Pizza night',
            plannedBy: 'Kids'
          },
          {
            day: 'Saturday',
            breakfast: 'French toast',
            lunch: 'BBQ sandwiches',
            dinner: 'Family potluck',
            plannedBy: 'Mom'
          },
          {
            day: 'Sunday',
            breakfast: 'Eggs benedit',
            lunch: 'Leftovers',
            dinner: 'Roast chicken',
            plannedBy: 'Dad'
          }
        ];

        setMeals(mockMeals);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to fetch meal plan:', err);
        setError(err.message || 'Failed to fetch meal plan');
        setLoading(false);
      }
    };

    fetchMeals();
  }, []);

  const updateMeal = async (day: string, mealType: string, meal: string) => {
    setMeals(meals.map(m =>
      m.day === day ? { ...m, [mealType.toLowerCase()]: meal } : m
    ));
  };

  return {
    meals,
    loading,
    error,
    updateMeal
  };
}
