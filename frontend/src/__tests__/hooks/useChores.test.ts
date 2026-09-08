import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useChores } from '@/hooks/useChores';

const CHORE = {
  id: 'c1',
  userId: 'user-1',
  name: 'Trash',
  timeSlot: 'morning',
  pointsValue: 10,
  enabled: true,
  completedToday: false,
};
const SUMMARY = { totalPoints: 100, dailyPoints: 30, weeklyPoints: 60, monthlyPoints: 250 };

function mockGet(over: { chores?: unknown[]; family?: unknown[] } = {}) {
  (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
    if (path === '/api/chores?scope=mine')
      return Promise.resolve({ data: { status: 'success', chores: over.chores ?? [CHORE] } });
    if (path === '/api/chores?scope=family')
      return Promise.resolve({ data: { status: 'success', chores: over.family ?? [CHORE] } });
    if (path === '/api/chores/points/summary')
      return Promise.resolve({ data: { status: 'success', data: SUMMARY } });
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
}

describe('useChores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'success' } });
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'success' } });
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'success' } });
  });

  it('skips fetching when unauthenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useChores());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.chores).toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('loads the board + points summary on mount (scope=mine)', async () => {
    mockGet();
    const { result } = renderHook(() => useChores());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.chores).toHaveLength(1);
    expect(result.current.pointsSummary.monthlyPoints).toBe(250);
    expect(apiClient.get).toHaveBeenCalledWith('/api/chores?scope=mine', expect.anything());
  });

  it('complete() POSTs and optimistically flips completedToday', async () => {
    mockGet();
    const { result } = renderHook(() => useChores());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.complete('c1');
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/chores/c1/complete',
      {},
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('undo() DELETEs the completion', async () => {
    mockGet();
    const { result } = renderHook(() => useChores());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.undo('c1');
    });
    expect(apiClient.delete).toHaveBeenCalledWith(
      '/api/chores/c1/complete',
      expect.objectContaining({ headers: { 'x-user-id': 'user-1' } }),
    );
  });

  it('loadFamilyChores() fetches the family scope', async () => {
    mockGet({ family: [CHORE, { ...CHORE, id: 'c2' }] });
    const { result } = renderHook(() => useChores());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadFamilyChores();
    });
    expect(result.current.familyChores).toHaveLength(2);
  });

  it('createChore() POSTs and refreshes both scopes', async () => {
    mockGet();
    const { result } = renderHook(() => useChores());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createChore({ name: 'Dishes', timeSlot: 'evening', pointsValue: 5 });
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/chores',
      { name: 'Dishes', timeSlot: 'evening', pointsValue: 5 },
      expect.anything(),
    );
  });

  it('updateChore() PATCHes the chore', async () => {
    mockGet();
    const { result } = renderHook(() => useChores());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateChore('c1', { enabled: false });
    });
    expect(apiClient.patch).toHaveBeenCalledWith(
      '/api/chores/c1',
      { enabled: false },
      expect.anything(),
    );
  });

  it('surfaces a fetch error', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useChores());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
  });

  it('rolls back the optimistic flip when complete() fails', async () => {
    mockGet();
    (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useChores());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.complete('c1')).rejects.toThrow('offline');
    });
    expect(result.current.chores[0].completedToday).toBe(false);
  });

  it('swallows a loadFamilyChores() error', async () => {
    mockGet();
    const { result } = renderHook(() => useChores());
    await waitFor(() => expect(result.current.loading).toBe(false));

    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('nope'));
    await act(async () => {
      await result.current.loadFamilyChores();
    });
    expect(result.current.familyChores).toEqual([]);
  });

  it('complete() throws when unauthenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useChores());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(result.current.complete('c1')).rejects.toThrow('not authenticated');
  });
});
