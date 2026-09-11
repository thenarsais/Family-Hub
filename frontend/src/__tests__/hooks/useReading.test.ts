import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useReading } from '@/hooks/useReading';

const get = apiClient.get as ReturnType<typeof vi.fn>;
const post = apiClient.post as ReturnType<typeof vi.fn>;
const del = apiClient.delete as ReturnType<typeof vi.fn>;
const patch = apiClient.patch as ReturnType<typeof vi.fn>;

const UNLOGGED = {
  status: 'success',
  goals: { dailyMinutes: 20, weeklyMinutes: 100, pointsValue: 10 },
  log: null,
  weekMinutes: 0,
  streak: 0,
};

describe('useReading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('skips the fetch without a user', async () => {
    mockUseAuth.mockReturnValue({ user: undefined });
    const { result } = renderHook(() => useReading());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(get).not.toHaveBeenCalled();
    expect(result.current.goals).toEqual(UNLOGGED.goals);
  });

  it('loads today with the x-user-id header', async () => {
    get.mockResolvedValueOnce({ data: UNLOGGED });
    const { result } = renderHook(() => useReading());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.log).toBeNull();
    expect(get).toHaveBeenCalledWith(
      '/api/reading/today',
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('submit posts minutes and swaps in the returned log/streak', async () => {
    get.mockResolvedValueOnce({ data: UNLOGGED });
    post.mockResolvedValueOnce({
      data: {
        ...UNLOGGED,
        log: { minutes: 25, goalMet: true, pointsEarned: 10 },
        weekMinutes: 25,
        streak: 1,
      },
    });

    const { result } = renderHook(() => useReading());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submit(25);
    });

    expect(post).toHaveBeenCalledWith(
      '/api/reading/today',
      { minutes: 25 },
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
    expect(result.current.log).toEqual({ minutes: 25, goalMet: true, pointsEarned: 10 });
    expect(result.current.streak).toBe(1);
  });

  it('undo deletes then refetches', async () => {
    get.mockResolvedValueOnce({ data: UNLOGGED });
    del.mockResolvedValueOnce({ data: { status: 'success' } });
    get.mockResolvedValueOnce({ data: UNLOGGED });

    const { result } = renderHook(() => useReading());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.undo();
    });

    expect(del).toHaveBeenCalledWith(
      '/api/reading/today',
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('updateGoals PATCHes then reloads mine + family', async () => {
    get.mockResolvedValueOnce({ data: UNLOGGED });
    patch.mockResolvedValueOnce({ data: { status: 'success', goals: UNLOGGED.goals } });
    get.mockResolvedValue({ data: UNLOGGED });

    const { result } = renderHook(() => useReading());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateGoals('kid-1', { dailyMinutes: 30 });
    });

    expect(patch).toHaveBeenCalledWith(
      '/api/reading/goals/kid-1',
      { dailyMinutes: 30 },
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
    expect(get).toHaveBeenCalledWith('/api/reading/goals?scope=family', expect.anything());
  });

  it('surfaces a load error', async () => {
    get.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useReading());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('offline');
  });

  it('handles an empty payload gracefully', async () => {
    get.mockResolvedValueOnce({ data: undefined });
    const { result } = renderHook(() => useReading());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.goals).toEqual(UNLOGGED.goals);
    expect(result.current.log).toBeNull();
  });
});
