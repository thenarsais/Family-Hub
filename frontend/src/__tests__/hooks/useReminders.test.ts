import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useReminders } from '@/hooks/useReminders';

type Rows = unknown[];
const env = (data: Rows) => ({ data: { status: 'success', data } });

function mockGetPaths(o: { reminders?: Rows; upcoming?: Rows; due?: Rows } = {}) {
  (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
    if (path === '/api/reminders') return Promise.resolve(env(o.reminders ?? []));
    if (path === '/api/reminders/upcoming') return Promise.resolve(env(o.upcoming ?? []));
    if (path === '/api/reminders/due') return Promise.resolve(env(o.due ?? []));
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
}

describe('useReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('clears state and skips fetching when there is no authenticated user', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reminders).toEqual([]);
    expect(result.current.dueReminders).toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('loads all / upcoming / due on mount', async () => {
    mockGetPaths({
      reminders: [{ id: 'r1', is_dismissed: false }],
      upcoming: [{ id: 'r2' }],
      due: [{ id: 'r3' }],
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reminders).toEqual([{ id: 'r1', is_dismissed: false }]);
    expect(result.current.upcomingReminders).toEqual([{ id: 'r2' }]);
    expect(result.current.dueReminders).toEqual([{ id: 'r3' }]);
  });

  it('derives dismissedReminders from the full list', async () => {
    mockGetPaths({ reminders: [{ id: 'r1', is_dismissed: true }, { id: 'r2', is_dismissed: false }] });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.dismissedReminders).toEqual([{ id: 'r1', is_dismissed: true }]);
  });

  it('tolerates a response envelope with no data field', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { status: 'success' } });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reminders).toEqual([]);
    expect(result.current.upcomingReminders).toEqual([]);
    expect(result.current.dueReminders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('keeps the last good lists when a poll request errors', async () => {
    vi.useFakeTimers();
    try {
      mockGetPaths({ due: [{ id: 'r1' }] });
      const { result } = renderHook(() => useReminders());
      await vi.waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.dueReminders).toEqual([{ id: 'r1' }]);

      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('flaky'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });

      expect(result.current.dueReminders).toEqual([{ id: 'r1' }]);
      expect(result.current.error).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('sets an error when a load request fails', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      if (path === '/api/reminders') return Promise.reject(new Error('down'));
      return Promise.resolve(env([]));
    });

    const { result } = renderHook(() => useReminders());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('down');
  });

  it('uses a generic error message for a non-Error load rejection', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue('boom');

    const { result } = renderHook(() => useReminders());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Failed to fetch reminders');
  });

  describe('createReminder', () => {
    it('posts the payload and reconciles from the server', async () => {
      mockGetPaths();
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { status: 'success', data: { id: 'r1', title: 'Take out trash' } },
      });

      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      // after create, the list re-fetch returns the new row
      mockGetPaths({ reminders: [{ id: 'r1', title: 'Take out trash', is_dismissed: false }] });

      let created;
      await act(async () => {
        created = await result.current.createReminder({
          title: 'Take out trash',
          scheduled_time: '2026-01-01T08:00:00Z',
        });
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/reminders',
        { title: 'Take out trash', scheduled_time: '2026-01-01T08:00:00Z' },
        { headers: { 'x-user-id': 'user-1' } },
      );
      expect(created).toEqual({ id: 'r1', title: 'Take out trash' });
      expect(result.current.reminders).toContainEqual({
        id: 'r1',
        title: 'Take out trash',
        is_dismissed: false,
      });
    });

    it('throws when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        result.current.createReminder({ title: 'x', scheduled_time: '2026-01-01T00:00:00Z' }),
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('dismissReminder', () => {
    it('optimistically hides the reminder, leaves the others, and calls the endpoint', async () => {
      mockGetPaths({
        reminders: [{ id: 'r1', is_dismissed: false }, { id: 'r2', is_dismissed: false }],
        upcoming: [{ id: 'r1' }, { id: 'r2' }],
        due: [{ id: 'r1' }, { id: 'r2' }],
      });
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      // the reconciling re-fetch: r1 now dismissed, gone from due/upcoming
      mockGetPaths({
        reminders: [{ id: 'r1', is_dismissed: true }, { id: 'r2', is_dismissed: false }],
        upcoming: [{ id: 'r2' }],
        due: [{ id: 'r2' }],
      });

      await act(async () => {
        await result.current.dismissReminder('r1');
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/reminders/r1/dismiss',
        {},
        { headers: { 'x-user-id': 'user-1' } },
      );
      expect(result.current.dueReminders).toEqual([{ id: 'r2' }]);
      expect(result.current.reminders).toEqual([
        { id: 'r1', is_dismissed: true },
        { id: 'r2', is_dismissed: false },
      ]);
    });

    it('reverts the optimistic change when the call fails', async () => {
      mockGetPaths({ reminders: [{ id: 'r1', is_dismissed: false }], due: [{ id: 'r1' }] });
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('boom'));

      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(result.current.dismissReminder('r1')).rejects.toThrow('boom');
      });

      expect(result.current.dueReminders).toEqual([{ id: 'r1' }]);
      expect(result.current.reminders[0].is_dismissed).toBe(false);
    });
  });

  describe('updateReminder', () => {
    it('patches the reminder and reconciles', async () => {
      mockGetPaths({ reminders: [{ id: 'r1', title: 'old' }] });
      (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { status: 'success', data: { id: 'r1', title: 'new' } },
      });

      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockGetPaths({ reminders: [{ id: 'r1', title: 'new' }] });

      let updated;
      await act(async () => {
        updated = await result.current.updateReminder('r1', { title: 'new' });
      });

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/reminders/r1',
        { title: 'new' },
        { headers: { 'x-user-id': 'user-1' } },
      );
      expect(updated).toEqual({ id: 'r1', title: 'new' });
      expect(result.current.reminders[0].title).toBe('new');
    });

    it('throws when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.updateReminder('r1', { title: 'x' })).rejects.toThrow(
        'User not authenticated',
      );
    });
  });

  describe('restoreReminder', () => {
    it('un-dismisses and calls the restore endpoint', async () => {
      mockGetPaths({ reminders: [{ id: 'r1', is_dismissed: true }, { id: 'r2', is_dismissed: true }] });
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockGetPaths({ reminders: [{ id: 'r1', is_dismissed: false }, { id: 'r2', is_dismissed: true }] });

      await act(async () => {
        await result.current.restoreReminder('r1');
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/reminders/r1/restore',
        {},
        { headers: { 'x-user-id': 'user-1' } },
      );
      expect(result.current.reminders.find((r) => r.id === 'r1')?.is_dismissed).toBe(false);
      expect(result.current.reminders.find((r) => r.id === 'r2')?.is_dismissed).toBe(true);
    });

    it('reverts the optimistic un-dismiss when the call fails', async () => {
      mockGetPaths({ reminders: [{ id: 'r1', is_dismissed: true }] });
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('nope'));

      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(result.current.restoreReminder('r1')).rejects.toThrow('nope');
      });

      expect(result.current.reminders[0].is_dismissed).toBe(true);
    });

    it('throws when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.restoreReminder('r1')).rejects.toThrow('User not authenticated');
    });
  });

  describe('polling', () => {
    it('refreshes upcoming + due on the interval', async () => {
      vi.useFakeTimers();
      try {
        mockGetPaths();
        const { result } = renderHook(() => useReminders());
        await vi.waitFor(() => expect(result.current.loading).toBe(false));

        (apiClient.get as ReturnType<typeof vi.fn>).mockClear();
        mockGetPaths({ due: [{ id: 'r9' }] });

        await act(async () => {
          await vi.advanceTimersByTimeAsync(60_000);
        });

        expect(apiClient.get).toHaveBeenCalledWith('/api/reminders/due', expect.anything());
        expect(apiClient.get).toHaveBeenCalledWith('/api/reminders/upcoming', expect.anything());
        expect(apiClient.get).not.toHaveBeenCalledWith('/api/reminders', expect.anything());
        expect(result.current.dueReminders).toEqual([{ id: 'r9' }]);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('deleteReminder', () => {
    it('removes the reminder from every list, keeping the others', async () => {
      mockGetPaths({
        reminders: [{ id: 'r1' }, { id: 'r2' }],
        upcoming: [{ id: 'r1' }, { id: 'r2' }],
        due: [{ id: 'r1' }, { id: 'r2' }],
      });
      (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteReminder('r1');
      });

      expect(apiClient.delete).toHaveBeenCalledWith('/api/reminders/r1', {
        headers: { 'x-user-id': 'user-1' },
      });
      expect(result.current.reminders).toEqual([{ id: 'r2' }]);
      expect(result.current.dueReminders).toEqual([{ id: 'r2' }]);
    });

    it('reverts when the delete fails', async () => {
      mockGetPaths({ reminders: [{ id: 'r1' }] });
      (apiClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('nope'));

      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(result.current.deleteReminder('r1')).rejects.toThrow('nope');
      });

      expect(result.current.reminders).toEqual([{ id: 'r1' }]);
    });

    it('throws when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useReminders());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.deleteReminder('r1')).rejects.toThrow('User not authenticated');
    });
  });

  it('exposes a callable refresh()', async () => {
    mockGetPaths();
    const { result } = renderHook(() => useReminders());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    expect(apiClient.get).toHaveBeenCalledWith('/api/reminders', expect.anything());
    expect(apiClient.get).toHaveBeenCalledWith('/api/reminders/due', expect.anything());
  });
});
