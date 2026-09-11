import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useRewards } from '@/hooks/useRewards';

const get = apiClient.get as ReturnType<typeof vi.fn>;
const post = apiClient.post as ReturnType<typeof vi.fn>;
const patch = apiClient.patch as ReturnType<typeof vi.fn>;

const TODAY = {
  status: 'success',
  weeklyGoal: 50,
  weekPoints: 20,
  monthPoints: 220,
  tiers: [
    { name: 'bronze', points: 200, reached: true },
    { name: 'silver', points: 300, reached: false },
    { name: 'gold', points: 400, reached: false },
  ],
  justEarned: [],
};

function primeInitialLoad() {
  get.mockResolvedValueOnce({ data: TODAY }); // /today
  get.mockResolvedValueOnce({ data: { status: 'success', earned: [] } }); // /earned?scope=mine
  get.mockResolvedValueOnce({ data: { status: 'success', library: [] } }); // /library
}

describe('useRewards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('skips the fetch without a user', async () => {
    mockUseAuth.mockReturnValue({ user: undefined });
    const { result } = renderHook(() => useRewards());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(get).not.toHaveBeenCalled();
  });

  it('loads today + earned + library on mount', async () => {
    primeInitialLoad();
    const { result } = renderHook(() => useRewards());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.weeklyGoal).toBe(50);
    expect(result.current.tiers[0].reached).toBe(true);
    expect(get).toHaveBeenCalledWith(
      '/api/rewards/today',
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('fulfillReward posts then refetches', async () => {
    primeInitialLoad();
    post.mockResolvedValueOnce({ data: { status: 'success', reward: { id: 'r1' } } });
    primeInitialLoad(); // refresh() re-fetches all three
    get.mockResolvedValueOnce({ data: { status: 'success', earned: [] } }); // loadFamilyEarned

    const { result } = renderHook(() => useRewards());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.fulfillReward('r1', 'lib-1', 'note');
    });

    expect(post).toHaveBeenCalledWith(
      '/api/rewards/earned/r1/fulfill',
      { libraryItemId: 'lib-1', note: 'note' },
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('addLibraryItem posts then refreshes', async () => {
    primeInitialLoad();
    post.mockResolvedValueOnce({ data: { status: 'success', item: { id: 'r1' } } });
    primeInitialLoad();

    const { result } = renderHook(() => useRewards());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addLibraryItem({ title: 'New reward', cashAmount: 5 });
    });

    expect(post).toHaveBeenCalledWith(
      '/api/rewards/library',
      { title: 'New reward', cashAmount: 5 },
      expect.anything(),
    );
  });

  it('updateSettings PATCHes then reloads mine + family', async () => {
    primeInitialLoad();
    patch.mockResolvedValueOnce({ data: { status: 'success', settings: { weeklyGoal: 75 } } });
    primeInitialLoad();
    get.mockResolvedValueOnce({ data: { status: 'success', settings: [] } }); // loadFamilySettings

    const { result } = renderHook(() => useRewards());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateSettings('kid-1', 75);
    });

    expect(patch).toHaveBeenCalledWith(
      '/api/rewards/settings/kid-1',
      { weeklyGoal: 75 },
      expect.anything(),
    );
  });

  it('updateLibraryItem PATCHes then refreshes', async () => {
    primeInitialLoad();
    patch.mockResolvedValueOnce({ data: { status: 'success', item: { id: 'lib-1' } } });
    primeInitialLoad();

    const { result } = renderHook(() => useRewards());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateLibraryItem('lib-1', { active: false });
    });

    expect(patch).toHaveBeenCalledWith(
      '/api/rewards/library/lib-1',
      { active: false },
      expect.anything(),
    );
  });

  it('loadFamilyEarned populates familyEarned', async () => {
    primeInitialLoad();
    get.mockResolvedValueOnce({
      data: { status: 'success', earned: [{ id: 'r1', userId: 'kid-1' }] },
    });

    const { result } = renderHook(() => useRewards());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadFamilyEarned();
    });

    expect(result.current.familyEarned).toHaveLength(1);
  });

  it('surfaces a load error', async () => {
    get.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useRewards());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('offline');
  });
});
