import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useMaintenance } from '@/hooks/useMaintenance';

type Fn = ReturnType<typeof vi.fn>;

const item = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'm1',
  name: 'HVAC air filter',
  intervalDays: 90,
  lastDoneAt: '2026-09-01',
  nextDueAt: '2026-11-30',
  daysUntilDue: 79,
  ...over,
});

function mockList(items: unknown[]) {
  (apiClient.get as Fn).mockResolvedValue({ data: { status: 'success', items } });
}

describe('useMaintenance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    mockList([]);
  });

  it('skips fetching and stays empty when there is no authenticated user', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useMaintenance());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('loads items on mount', async () => {
    mockList([item(), item({ id: 'm2', name: 'Gutter cleaning' })]);
    const { result } = renderHook(() => useMaintenance());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(2);
    expect(apiClient.get).toHaveBeenCalledWith('/api/maintenance', {
      headers: { 'x-user-id': 'user-1' },
    });
  });

  it('surfaces a load error', async () => {
    (apiClient.get as Fn).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useMaintenance());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('offline');
  });

  it('addItem posts and inserts the created item, sorted by nextDueAt', async () => {
    mockList([item({ id: 'm1', nextDueAt: '2026-12-01' })]);
    (apiClient.post as Fn).mockResolvedValueOnce({
      data: { item: item({ id: 'm2', name: 'New thing', nextDueAt: '2026-10-01' }) },
    });

    const { result } = renderHook(() => useMaintenance());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addItem({ name: 'New thing', intervalDays: 30 });
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/maintenance',
      { name: 'New thing', intervalDays: 30 },
      { headers: { 'x-user-id': 'user-1' } },
    );
    expect(result.current.items.map((i) => i.id)).toEqual(['m2', 'm1']); // soonest-due first
  });

  it('markDone replaces the item with the server response and re-sorts', async () => {
    mockList([item({ id: 'm1', nextDueAt: '2026-09-15' }), item({ id: 'm2', nextDueAt: '2026-09-20' })]);
    (apiClient.post as Fn).mockResolvedValueOnce({
      data: { item: item({ id: 'm1', nextDueAt: '2026-12-14', lastDoneAt: '2026-09-15' }) },
    });

    const { result } = renderHook(() => useMaintenance());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markDone('m1');
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/maintenance/m1/done',
      {},
      { headers: { 'x-user-id': 'user-1' } },
    );
    // m1 was rescheduled well past m2, so m2 now sorts first
    expect(result.current.items.map((i) => i.id)).toEqual(['m2', 'm1']);
  });

  it('markDone reverts to the snapshot on failure', async () => {
    mockList([item({ id: 'm1' })]);
    (apiClient.post as Fn).mockRejectedValueOnce(new Error('offline'));

    const { result } = renderHook(() => useMaintenance());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markDone('m1');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.error).toBe('offline');
  });

  it('updateItem patches and merges the server response', async () => {
    mockList([item({ id: 'm1' })]);
    (apiClient.patch as Fn).mockResolvedValueOnce({
      data: { item: item({ id: 'm1', name: 'Renamed' }) },
    });

    const { result } = renderHook(() => useMaintenance());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateItem('m1', { name: 'Renamed' });
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/api/maintenance/m1',
      { name: 'Renamed' },
      { headers: { 'x-user-id': 'user-1' } },
    );
    expect(result.current.items[0].name).toBe('Renamed');
  });

  it('removeItem optimistically removes, reverting on failure', async () => {
    mockList([item({ id: 'm1' })]);
    (apiClient.delete as Fn).mockRejectedValueOnce(new Error('offline'));

    const { result } = renderHook(() => useMaintenance());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeItem('m1');
    });

    expect(result.current.items).toHaveLength(1); // reverted
    expect(result.current.error).toBe('offline');
  });

  it('removeItem removes for good on success', async () => {
    mockList([item({ id: 'm1' })]);
    (apiClient.delete as Fn).mockResolvedValueOnce({ data: { status: 'success' } });

    const { result } = renderHook(() => useMaintenance());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeItem('m1');
    });

    expect(result.current.items).toEqual([]);
  });
});
