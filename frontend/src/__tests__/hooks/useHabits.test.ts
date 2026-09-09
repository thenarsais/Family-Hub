import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useHabits, useFamilyMoodHistory } from '@/hooks/useHabits';

const HABIT = {
  id: 'h1',
  userId: 'user-1',
  title: 'Meditate',
  weeklyTarget: 5,
  pointsValue: 10,
  enabled: true,
  weekCompletions: 2,
  completedToday: false,
  weekStreak: 1,
};

function mockGet(over: { habits?: unknown[]; family?: unknown[]; mood?: unknown } = {}) {
  (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
    if (path === '/api/habits?scope=mine')
      return Promise.resolve({ data: { status: 'success', habits: over.habits ?? [HABIT] } });
    if (path === '/api/habits?scope=family')
      return Promise.resolve({ data: { status: 'success', habits: over.family ?? [HABIT] } });
    if (path === '/api/habits/mood/today')
      return Promise.resolve({ data: { status: 'success', mood: over.mood ?? null } });
    if (path.startsWith('/api/habits/mood/history'))
      return Promise.resolve({ data: { status: 'success', history: [] } });
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
}

describe('useHabits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'success' } });
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'success' } });
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'success' } });
  });

  it('skips fetching when unauthenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useHabits());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.habits).toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('loads the board + today mood on mount', async () => {
    mockGet({ mood: { id: 'm1', mood: 'good' } });
    const { result } = renderHook(() => useHabits());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.habits).toHaveLength(1);
    expect(result.current.todayMood?.mood).toBe('good');
  });

  it('complete() posts and optimistically bumps the week count', async () => {
    mockGet();
    const { result } = renderHook(() => useHabits());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.complete('h1');
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/habits/h1/complete',
      {},
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('rolls back the optimistic bump when complete() fails', async () => {
    mockGet();
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useHabits());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.complete('h1')).rejects.toThrow('offline');
    });
    expect(result.current.habits[0].weekCompletions).toBe(2);
    expect(result.current.habits[0].completedToday).toBe(false);
  });

  it('undo() deletes the completion', async () => {
    mockGet({ habits: [{ ...HABIT, completedToday: true, weekCompletions: 3 }] });
    const { result } = renderHook(() => useHabits());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.undo('h1');
    });
    expect(apiClient.delete).toHaveBeenCalledWith('/api/habits/h1/complete', expect.anything());
  });

  it('setMood() posts the value + emoji and stores the result', async () => {
    mockGet();
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { mood: { id: 'm2', mood: 'great' } },
    });
    const { result } = renderHook(() => useHabits());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.setMood('great');
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/habits/mood',
      { mood: 'great', emoji: '😄' },
      expect.anything(),
    );
    expect(result.current.todayMood?.mood).toBe('great');
  });

  it('loadFamilyHabits() fetches the family scope', async () => {
    mockGet({ family: [HABIT, { ...HABIT, id: 'h2' }] });
    const { result } = renderHook(() => useHabits());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.loadFamilyHabits();
    });
    expect(result.current.familyHabits).toHaveLength(2);
  });

  it('surfaces a fetch error', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useHabits());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
  });

  it('createHabit() posts then refreshes both scopes', async () => {
    mockGet();
    const { result } = renderHook(() => useHabits());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.createHabit({ title: 'Read', weeklyTarget: 4, pointsValue: 5 });
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/habits',
      { title: 'Read', weeklyTarget: 4, pointsValue: 5 },
      expect.anything(),
    );
  });

  it('updateHabit() patches the habit', async () => {
    mockGet();
    const { result } = renderHook(() => useHabits());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.updateHabit('h1', { enabled: false });
    });
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/api/habits/h1',
      { enabled: false },
      expect.anything(),
    );
  });

  it('mutations throw when unauthenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useHabits());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(result.current.complete('h1')).rejects.toThrow('not authenticated');
    await expect(result.current.createHabit({ title: 'x', weeklyTarget: 1, pointsValue: 1 })).rejects.toThrow();
    await expect(result.current.updateHabit('h1', {})).rejects.toThrow();
    await expect(result.current.setMood('ok')).rejects.toThrow();
  });
});

describe('useFamilyMoodHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'parent-1' } });
  });

  it('loads history for a parent', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { status: 'success', history: [{ userId: 'k', day: '2026-09-08', mood: 'good' }] },
    });
    const { result } = renderHook(() => useFamilyMoodHistory(35));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.history).toHaveLength(1);
    expect(result.current.forbidden).toBe(false);
  });

  it('sets forbidden on a 403', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce({ response: { status: 403 } });
    const { result } = renderHook(() => useFamilyMoodHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.forbidden).toBe(true);
    expect(result.current.history).toEqual([]);
  });

  it('logs and gives up on a non-403 error', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useFamilyMoodHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.forbidden).toBe(false);
    expect(result.current.history).toEqual([]);
  });

  it('does nothing when unauthenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useFamilyMoodHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
