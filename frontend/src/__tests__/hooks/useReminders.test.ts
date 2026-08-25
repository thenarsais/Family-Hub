import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useReminders } from '@/hooks/useReminders';

function mockGetPaths(overrides: { reminders?: unknown[]; upcoming?: unknown[] } = {}) {
  (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
    if (path === '/api/reminders') return Promise.resolve({ data: { status: 'success', data: overrides.reminders ?? [] } });
    if (path === '/api/reminders/upcoming') return Promise.resolve({ data: { status: 'success', data: overrides.upcoming ?? [] } });
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
}

describe('useReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('should clear reminders and skip fetching when there is no authenticated user', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reminders).toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('should load reminders and upcoming reminders on mount', async () => {
    mockGetPaths({ reminders: [{ id: 'r1' }], upcoming: [{ id: 'r2' }] });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reminders).toEqual([{ id: 'r1' }]);
    expect(result.current.upcomingReminders).toEqual([{ id: 'r2' }]);
  });

  it('should set an error when the reminders fetch fails', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      if (path === '/api/reminders') return Promise.reject(new Error('down'));
      return Promise.resolve({ data: { status: 'success', data: [] } });
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('down');
  });

  it('should silently continue when the upcoming fetch fails', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      if (path === '/api/reminders/upcoming') return Promise.reject(new Error('down'));
      return Promise.resolve({ data: { status: 'success', data: [] } });
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.upcomingReminders).toEqual([]);
  });

  describe('createReminder', () => {
    it('should post and append the new reminder', async () => {
      mockGetPaths();
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { status: 'success', data: { id: 'r1', title: 'Take out trash' } },
      });

      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let created;
      await act(async () => {
        created = await result.current.createReminder({ title: 'Take out trash' });
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/reminders',
        { title: 'Take out trash' },
        { headers: { 'x-user-id': 'user-1' } }
      );
      expect(created).toEqual({ id: 'r1', title: 'Take out trash' });
      expect(result.current.reminders).toContainEqual({ id: 'r1', title: 'Take out trash' });
    });

    it('should throw when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.createReminder({ title: 'x' })).rejects.toThrow('User not authenticated');
    });
  });

  describe('dismissReminder', () => {
    it('should mark the matching reminder dismissed', async () => {
      mockGetPaths({ reminders: [{ id: 'r1', is_dismissed: false }] });
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.dismissReminder('r1');
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/reminders/r1/dismiss', {}, { headers: { 'x-user-id': 'user-1' } });
      expect(result.current.reminders[0].is_dismissed).toBe(true);
    });

    it('should throw when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.dismissReminder('r1')).rejects.toThrow('User not authenticated');
    });
  });

  describe('deleteReminder', () => {
    it('should delete and remove the reminder from state', async () => {
      mockGetPaths({ reminders: [{ id: 'r1' }] });
      (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteReminder('r1');
      });

      expect(apiClient.delete).toHaveBeenCalledWith('/api/reminders/r1', { headers: { 'x-user-id': 'user-1' } });
      expect(result.current.reminders).toEqual([]);
    });

    it('should throw when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.deleteReminder('r1')).rejects.toThrow('User not authenticated');
    });
  });

  describe('refresh helpers', () => {
    it('refreshReminders/refreshUpcoming should be callable', async () => {
      mockGetPaths();
      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.refreshReminders();
        await result.current.refreshUpcoming();
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/reminders', expect.anything());
      expect(apiClient.get).toHaveBeenCalledWith('/api/reminders/upcoming', expect.anything());
    });
  });
});
