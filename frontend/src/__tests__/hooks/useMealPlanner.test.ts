import { renderHook, waitFor, act } from '@testing-library/react';
import { useMealPlanner } from '@/hooks/useMealPlanner';

describe('useMealPlanner', () => {
  it('should load a 7-day mock meal plan', async () => {
    const { result } = renderHook(() => useMealPlanner());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.meals).toHaveLength(7);
    expect(result.current.meals.map((m) => m.day)).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);
    expect(result.current.error).toBeNull();
  });

  describe('updateMeal', () => {
    it('should update the given meal type for the matching day', async () => {
      const { result } = renderHook(() => useMealPlanner());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateMeal('Monday', 'dinner', 'Homemade pizza');
      });

      const monday = result.current.meals.find((m) => m.day === 'Monday');
      expect(monday?.dinner).toBe('Homemade pizza');
    });

    it('should lowercase the meal type key', async () => {
      const { result } = renderHook(() => useMealPlanner());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateMeal('Tuesday', 'BREAKFAST', 'Waffles');
      });

      const tuesday = result.current.meals.find((m) => m.day === 'Tuesday');
      expect(tuesday?.breakfast).toBe('Waffles');
    });

    it('should leave other days unchanged', async () => {
      const { result } = renderHook(() => useMealPlanner());
      await waitFor(() => expect(result.current.loading).toBe(false));
      const originalTuesday = result.current.meals.find((m) => m.day === 'Tuesday');

      await act(async () => {
        await result.current.updateMeal('Monday', 'dinner', 'Homemade pizza');
      });

      expect(result.current.meals.find((m) => m.day === 'Tuesday')).toEqual(originalTuesday);
    });
  });
});
