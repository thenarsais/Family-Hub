import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useKungFu } from '@/hooks/useKungFu';

const get = apiClient.get as ReturnType<typeof vi.fn>;
const post = apiClient.post as ReturnType<typeof vi.fn>;
const del = apiClient.delete as ReturnType<typeof vi.fn>;
const patch = apiClient.patch as ReturnType<typeof vi.fn>;

const EMPTY = {
  status: 'success',
  profile: { belt: null, beltSince: null, pointsPerClass: 15, pointsPerPractice: 5 },
  todayLogs: [],
  weekCounts: { class: 0, practice: 0 },
};

describe('useKungFu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('skips the fetch without a user', async () => {
    mockUseAuth.mockReturnValue({ user: undefined });
    const { result } = renderHook(() => useKungFu());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(get).not.toHaveBeenCalled();
    expect(result.current.profile).toEqual(EMPTY.profile);
  });

  it('loads today with the x-user-id header', async () => {
    get.mockResolvedValueOnce({ data: EMPTY });
    const { result } = renderHook(() => useKungFu());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(get).toHaveBeenCalledWith(
      '/api/kungfu/today',
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('logClass posts type=class and swaps in the payload', async () => {
    get.mockResolvedValueOnce({ data: EMPTY });
    post.mockResolvedValueOnce({
      data: {
        ...EMPTY,
        todayLogs: [{ id: 'log-1', sessionType: 'class', pointsEarned: 15, loggedAt: 'x' }],
        weekCounts: { class: 1, practice: 0 },
      },
    });

    const { result } = renderHook(() => useKungFu());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.logClass();
    });

    expect(post).toHaveBeenCalledWith(
      '/api/kungfu/log',
      { type: 'class' },
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
    expect(result.current.todayLogs).toHaveLength(1);
    expect(result.current.weekCounts.class).toBe(1);
  });

  it('logPractice posts type=practice', async () => {
    get.mockResolvedValueOnce({ data: EMPTY });
    post.mockResolvedValueOnce({ data: EMPTY });
    const { result } = renderHook(() => useKungFu());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.logPractice();
    });
    expect(post).toHaveBeenCalledWith(
      '/api/kungfu/log',
      { type: 'practice' },
      expect.anything(),
    );
  });

  it('undo deletes by id then refetches', async () => {
    get.mockResolvedValueOnce({ data: EMPTY });
    del.mockResolvedValueOnce({ data: { status: 'success' } });
    get.mockResolvedValueOnce({ data: EMPTY });

    const { result } = renderHook(() => useKungFu());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.undo('log-1');
    });

    expect(del).toHaveBeenCalledWith(
      '/api/kungfu/log/log-1',
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('updateProfile PATCHes then reloads mine + family', async () => {
    get.mockResolvedValueOnce({ data: EMPTY });
    patch.mockResolvedValueOnce({ data: { status: 'success', profile: EMPTY.profile } });
    get.mockResolvedValue({ data: EMPTY });

    const { result } = renderHook(() => useKungFu());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateProfile('kid-1', { belt: 'Yellow Sash' });
    });

    expect(patch).toHaveBeenCalledWith(
      '/api/kungfu/profile/kid-1',
      { belt: 'Yellow Sash' },
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
    expect(get).toHaveBeenCalledWith('/api/kungfu/profile?scope=family', expect.anything());
  });

  it('surfaces a load error', async () => {
    get.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useKungFu());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('offline');
  });

  it('handles an empty payload gracefully', async () => {
    get.mockResolvedValueOnce({ data: undefined });
    const { result } = renderHook(() => useKungFu());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile).toEqual(EMPTY.profile);
    expect(result.current.todayLogs).toEqual([]);
  });
});
