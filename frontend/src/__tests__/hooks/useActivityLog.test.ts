import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useActivityLog } from '@/hooks/useActivityLog';

function mockGetPaths(overrides: Record<string, unknown> = {}) {
  (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
    if (path === '/api/activity/feed') return Promise.resolve({ data: { status: 'success', data: overrides.feed ?? [] } });
    if (path === '/api/activity/family-feed') return Promise.resolve({ data: { status: 'success', data: overrides.familyFeed ?? [] } });
    if (path === '/api/activity/stats') return Promise.resolve({ data: { status: 'success', data: overrides.stats ?? {} } });
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
}

describe('useActivityLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('should not fetch when there is no authenticated user', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useActivityLog());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('should load activity, family activity, and stats on mount', async () => {
    mockGetPaths({
      feed: [{ id: 'a1' }],
      familyFeed: [{ id: 'a2' }],
      stats: { chore: 3 },
    });

    const { result } = renderHook(() => useActivityLog());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.activity).toEqual([{ id: 'a1' }]);
    expect(result.current.familyActivity).toEqual([{ id: 'a2' }]);
    expect(result.current.stats).toEqual({ chore: 3 });
  });

  it('should set an error when the activity feed fetch fails', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      if (path === '/api/activity/feed') return Promise.reject(new Error('feed down'));
      return Promise.resolve({ data: { status: 'success', data: [] } });
    });

    const { result } = renderHook(() => useActivityLog());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('feed down');
  });

  it('should silently continue when family activity fails', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      if (path === '/api/activity/family-feed') return Promise.reject(new Error('down'));
      return Promise.resolve({ data: { status: 'success', data: [] } });
    });

    const { result } = renderHook(() => useActivityLog());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.familyActivity).toEqual([]);
  });

  it('should silently continue when stats fails', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      if (path === '/api/activity/stats') return Promise.reject(new Error('down'));
      return Promise.resolve({ data: { status: 'success', data: [] } });
    });

    const { result } = renderHook(() => useActivityLog());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.stats).toEqual({});
  });

  describe('logActivity', () => {
    it('should post the activity and refresh activity + stats', async () => {
      mockGetPaths();
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      const { result } = renderHook(() => useActivityLog());
      await waitFor(() => expect(result.current.loading).toBe(false));
      (apiClient.get as ReturnType<typeof vi.fn>).mockClear();

      await act(async () => {
        await result.current.logActivity('chore', 'completed', 10, 'Nice job');
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/activity/log',
        {
          user_id: 'user-1',
          activity_type: 'chore',
          action: 'completed',
          points_earned: 10,
          achievement_title: 'Nice job',
        },
        { headers: { 'x-user-id': 'user-1' } }
      );
      expect(apiClient.get).toHaveBeenCalledWith('/api/activity/feed', expect.anything());
      expect(apiClient.get).toHaveBeenCalledWith('/api/activity/stats', expect.anything());
    });

    it('should default pointsEarned to 0 when omitted', async () => {
      mockGetPaths();
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      const { result } = renderHook(() => useActivityLog());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.logActivity('chore', 'completed');
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/activity/log',
        expect.objectContaining({ points_earned: 0 }),
        expect.anything()
      );
    });

    it('should throw when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useActivityLog());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.logActivity('chore', 'completed')).rejects.toThrow('User not authenticated');
    });

    it('should rethrow when the post fails', async () => {
      mockGetPaths();
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('post failed'));

      const { result } = renderHook(() => useActivityLog());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.logActivity('chore', 'completed')).rejects.toThrow('post failed');
    });
  });

  describe('refresh helpers', () => {
    it('refreshActivity/refreshFamilyActivity/refreshStats should be exposed and callable', async () => {
      mockGetPaths();
      const { result } = renderHook(() => useActivityLog());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.refreshActivity();
        await result.current.refreshFamilyActivity();
        await result.current.refreshStats();
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/activity/feed', expect.anything());
      expect(apiClient.get).toHaveBeenCalledWith('/api/activity/family-feed', expect.anything());
      expect(apiClient.get).toHaveBeenCalledWith('/api/activity/stats', expect.anything());
    });
  });
});
