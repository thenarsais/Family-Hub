import { vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@/services/api', () => ({ apiClient: { get: vi.fn() } }));

import { apiClient } from '@/services/api';
import { useQuests } from '@/hooks/useQuests';

const get = apiClient.get as ReturnType<typeof vi.fn>;

const TODAY = {
  status: 'success',
  quests: [
    { key: 'chore', label: 'Complete a chore', done: false },
    { key: 'reading', label: 'Log your reading', done: true },
    { key: 'mood', label: 'Check in your mood', done: false },
  ],
  allDone: false,
  bonusAwarded: false,
};

describe('useQuests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('skips the fetch without a user', async () => {
    mockUseAuth.mockReturnValue({ user: undefined });
    const { result } = renderHook(() => useQuests());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(get).not.toHaveBeenCalled();
    expect(result.current.quests).toEqual([]);
  });

  it('loads today with the x-user-id header', async () => {
    get.mockResolvedValueOnce({ data: TODAY });
    const { result } = renderHook(() => useQuests());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.quests).toHaveLength(3);
    expect(result.current.quests[1].done).toBe(true);
    expect(get).toHaveBeenCalledWith(
      '/api/quests/today',
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('surfaces allDone + bonusAwarded', async () => {
    get.mockResolvedValueOnce({ data: { ...TODAY, allDone: true, bonusAwarded: true } });
    const { result } = renderHook(() => useQuests());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.allDone).toBe(true);
    expect(result.current.bonusAwarded).toBe(true);
  });

  it('surfaces a load error', async () => {
    get.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useQuests());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('offline');
  });

  it('handles an empty payload gracefully', async () => {
    get.mockResolvedValueOnce({ data: undefined });
    const { result } = renderHook(() => useQuests());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.quests).toEqual([]);
    expect(result.current.allDone).toBe(false);
  });
});
