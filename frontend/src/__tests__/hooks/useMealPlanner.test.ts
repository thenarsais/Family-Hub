import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), put: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useMealPlanner } from '@/hooks/useMealPlanner';

type Fn = ReturnType<typeof vi.fn>;

// System time fixed to Mon 2026-08-17 → rolling window is 2026-08-17 … 2026-08-23.
const MON = '2026-08-17';

function mockRange(rows: unknown[]) {
  (apiClient.get as Fn).mockResolvedValue({ data: { status: 'success', data: rows } });
}

const entry = (over: Record<string, unknown> = {}) => ({
  id: 'm1',
  family_id: 'fam-1',
  plan_date: MON,
  slot: 'dinner',
  text: 'Tacos',
  updated_by_id: 'user-1',
  created_at: null,
  updated_at: null,
  ...over,
});

describe('useMealPlanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-08-17T09:00:00'));
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    mockRange([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds a 7-day window starting today, even with no data', async () => {
    const { result } = renderHook(() => useMealPlanner());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.meals).toHaveLength(7);
    expect(result.current.meals[0].date).toBe(MON);
    expect(result.current.meals[0].day).toBe('Monday');
    expect(result.current.meals[6].date).toBe('2026-08-23');
    expect(apiClient.get).toHaveBeenCalledWith('/api/meals', {
      headers: { 'x-user-id': 'user-1' },
      params: { start: MON, end: '2026-08-23' },
    });
  });

  it('slots API rows into the matching day', async () => {
    mockRange([
      entry({ slot: 'dinner', text: 'Tacos' }),
      entry({ slot: 'breakfast', text: 'Oatmeal' }),
      entry({ plan_date: '2026-08-18', slot: 'dinner', text: 'Pasta' }),
    ]);

    const { result } = renderHook(() => useMealPlanner());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.meals[0]).toMatchObject({ dinner: 'Tacos', breakfast: 'Oatmeal', lunch: '' });
    expect(result.current.meals[1]).toMatchObject({ dinner: 'Pasta' });
  });

  it('skips fetching and clears when there is no user', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useMealPlanner());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.meals).toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('still renders an empty week when the fetch fails', async () => {
    (apiClient.get as Fn).mockRejectedValue(new Error('down'));

    const { result } = renderHook(() => useMealPlanner());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('down');
    expect(result.current.meals).toHaveLength(7);
  });

  describe('mealForDate', () => {
    it('matches by local calendar date', async () => {
      mockRange([entry({ plan_date: '2026-08-19', slot: 'dinner', text: 'Curry' })]);
      const { result } = renderHook(() => useMealPlanner());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.mealForDate(new Date(2026, 7, 19))?.dinner).toBe('Curry');
      expect(result.current.mealForDate(new Date(2026, 7, 25))).toBeUndefined();
    });
  });

  describe('updateMeal', () => {
    it('optimistically sets a slot and PUTs it', async () => {
      (apiClient.put as Fn).mockResolvedValue({ data: { status: 'success', data: entry() } });
      const { result } = renderHook(() => useMealPlanner());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateMeal(MON, 'dinner', '  Pizza  ');
      });

      expect(apiClient.put).toHaveBeenCalledWith(
        `/api/meals/${MON}/dinner`,
        { text: '  Pizza  ' },
        { headers: { 'x-user-id': 'user-1' } },
      );
      expect(result.current.meals[0].dinner).toBe('Pizza');
    });

    it('lowercases the slot key', async () => {
      (apiClient.put as Fn).mockResolvedValue({ data: { status: 'success', data: entry() } });
      const { result } = renderHook(() => useMealPlanner());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateMeal(MON, 'BREAKFAST', 'Waffles');
      });

      expect(apiClient.put).toHaveBeenCalledWith(
        `/api/meals/${MON}/breakfast`,
        expect.anything(),
        expect.anything(),
      );
      expect(result.current.meals[0].breakfast).toBe('Waffles');
    });

    it('reverts on failure', async () => {
      (apiClient.put as Fn).mockRejectedValue(new Error('nope'));
      const { result } = renderHook(() => useMealPlanner());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateMeal(MON, 'dinner', 'Pizza');
      });

      expect(result.current.meals[0].dinner).toBe('');
    });

    it('ignores an unknown slot', async () => {
      const { result } = renderHook(() => useMealPlanner());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateMeal(MON, 'brunch', 'Eggs');
      });

      expect(apiClient.put).not.toHaveBeenCalled();
    });
  });
});
