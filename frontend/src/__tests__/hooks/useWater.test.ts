import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useWater } from '@/hooks/useWater';

const get = apiClient.get as ReturnType<typeof vi.fn>;
const post = apiClient.post as ReturnType<typeof vi.fn>;

const CONFIGURED_SUMMARY = {
  status: 'success',
  configured: true,
  lastSyncedAt: '2026-09-11T12:00:00Z',
  latestReadingAt: '2026-09-11T11:00:00Z',
  dailyTotals: [{ date: '2026-09-11', gallons: 95 }],
  leakDetected: false,
};

describe('useWater', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches on mount with no auth header (family-wide, unauthenticated endpoint)', async () => {
    get.mockResolvedValueOnce({ data: CONFIGURED_SUMMARY });
    const { result } = renderHook(() => useWater());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(get).toHaveBeenCalledWith('/api/water/usage');
    expect(result.current.summary.configured).toBe(true);
    expect(result.current.summary.dailyTotals).toEqual([{ date: '2026-09-11', gallons: 95 }]);
  });

  it('defaults to the unconfigured shape when fields are missing from the response', async () => {
    get.mockResolvedValueOnce({ data: {} });
    const { result } = renderHook(() => useWater());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.summary).toEqual({
      configured: false,
      lastSyncedAt: null,
      latestReadingAt: null,
      dailyTotals: [],
      leakDetected: false,
    });
  });

  it('surfaces a load error', async () => {
    get.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useWater());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('offline');
  });

  it('syncNow posts to /api/water/sync and refreshes the summary', async () => {
    get.mockResolvedValueOnce({ data: { ...CONFIGURED_SUMMARY, dailyTotals: [] } });
    post.mockResolvedValueOnce({ data: { status: 'success', synced: 5, latestReadAt: '2026-09-11T11:00:00Z' } });
    get.mockResolvedValueOnce({ data: CONFIGURED_SUMMARY }); // the post-sync refresh

    const { result } = renderHook(() => useWater());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.syncNow();
    });

    expect(post).toHaveBeenCalledWith('/api/water/sync', {});
    expect(get).toHaveBeenCalledTimes(2);
    expect(result.current.syncing).toBe(false);
    expect(result.current.summary.dailyTotals).toEqual([{ date: '2026-09-11', gallons: 95 }]);
  });

  it('surfaces a sync error without touching the loaded summary', async () => {
    get.mockResolvedValueOnce({ data: CONFIGURED_SUMMARY });
    post.mockRejectedValueOnce(new Error('WaterSmart rejected the login'));

    const { result } = renderHook(() => useWater());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.syncNow();
    });

    expect(result.current.syncError).toBe('WaterSmart rejected the login');
    expect(result.current.summary.configured).toBe(true);
  });
});
