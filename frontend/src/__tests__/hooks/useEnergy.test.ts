import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useEnergy } from '@/hooks/useEnergy';

function mockGetPaths(overrides: { total_kwh?: number; goals?: unknown[] } = {}) {
  (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
    if (path === '/energy/current-month') return Promise.resolve({ data: { total_kwh: overrides.total_kwh ?? 0 } });
    if (path === '/energy/goals') return Promise.resolve({ data: overrides.goals ?? [] });
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
}

describe('useEnergy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('should not fetch when there is no authenticated user', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useEnergy());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('should load current-month usage and goals on mount', async () => {
    mockGetPaths({ total_kwh: 42.5, goals: [{ id: 'g1' }] });

    const { result } = renderHook(() => useEnergy());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentMonth).toBe(42.5);
    expect(result.current.goals).toEqual([{ id: 'g1' }]);
  });

  it('should default currentMonth to 0 when the response has no total_kwh', async () => {
    mockGetPaths({});

    const { result } = renderHook(() => useEnergy());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentMonth).toBe(0);
  });

  it('should set an error when the fetch fails', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('down'));

    const { result } = renderHook(() => useEnergy());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('down');
  });

  describe('createGoal', () => {
    it('should post and append the new goal', async () => {
      mockGetPaths();
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 'g1', goal_type: 'monthly' } });

      const { result } = renderHook(() => useEnergy());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let created;
      await act(async () => {
        created = await result.current.createGoal('monthly', 500, '2026-01-01', '2026-01-31', 100);
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/energy/goals',
        { goal_type: 'monthly', target_kwh: 500, start_date: '2026-01-01', end_date: '2026-01-31', points_reward: 100 },
        { headers: { 'x-user-id': 'user-1' } }
      );
      expect(created).toEqual({ id: 'g1', goal_type: 'monthly' });
      expect(result.current.goals).toContainEqual({ id: 'g1', goal_type: 'monthly' });
    });

    it('should throw when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useEnergy());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.createGoal('monthly', 500, '2026-01-01', '2026-01-31')).rejects.toThrow(
        'User not authenticated'
      );
    });
  });

  describe('refresh', () => {
    it('should re-fetch usage and goals', async () => {
      mockGetPaths({ total_kwh: 10 });

      const { result } = renderHook(() => useEnergy());
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockGetPaths({ total_kwh: 20 });
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.currentMonth).toBe(20);
    });
  });
});
