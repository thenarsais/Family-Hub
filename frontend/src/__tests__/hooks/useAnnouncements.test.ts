import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useAnnouncements } from '@/hooks/useAnnouncements';

describe('useAnnouncements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('should clear announcements and stop loading when there is no authenticated user', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useAnnouncements());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.announcements).toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('should load announcements on mount', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { status: 'success', data: [{ id: 'a1' }] } });

    const { result } = renderHook(() => useAnnouncements());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.announcements).toEqual([{ id: 'a1' }]);
  });

  it('should set an error when the fetch fails', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('down'));

    const { result } = renderHook(() => useAnnouncements());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('down');
  });

  describe('createAnnouncement', () => {
    it('should post and prepend the new announcement', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { status: 'success', data: [{ id: 'existing' }] } });
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { status: 'success', data: { id: 'new1' } } });

      const { result } = renderHook(() => useAnnouncements());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let created;
      await act(async () => {
        created = await result.current.createAnnouncement('family-1', 'Movie night', 'Fun!', { is_pinned: true });
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/announcements',
        { family_id: 'family-1', title: 'Movie night', message: 'Fun!', is_pinned: true },
        { headers: { 'x-user-id': 'user-1' } }
      );
      expect(created).toEqual({ id: 'new1' });
      expect(result.current.announcements[0]).toEqual({ id: 'new1' });
    });

    it('should throw when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useAnnouncements());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.createAnnouncement('f1', 't', 'm')).rejects.toThrow('User not authenticated');
    });

    it('should rethrow when the post fails', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { status: 'success', data: [] } });
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('post failed'));

      const { result } = renderHook(() => useAnnouncements());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.createAnnouncement('f1', 't', 'm')).rejects.toThrow('post failed');
    });
  });

  describe('markAsRead', () => {
    it('should mark the matching announcement as read', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { status: 'success', data: [{ id: 'a1', is_read: false }] } });
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      const { result } = renderHook(() => useAnnouncements());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.markAsRead('a1');
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/announcements/a1/read', {}, { headers: { 'x-user-id': 'user-1' } });
      expect(result.current.announcements[0].is_read).toBe(true);
    });

    it('should throw when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useAnnouncements());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.markAsRead('a1')).rejects.toThrow('User not authenticated');
    });
  });

  describe('deleteAnnouncement', () => {
    it('should delete and remove the announcement from state', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { status: 'success', data: [{ id: 'a1' }] } });
      (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      const { result } = renderHook(() => useAnnouncements());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.deleteAnnouncement('a1');
      });

      expect(apiClient.delete).toHaveBeenCalledWith('/api/announcements/a1', { headers: { 'x-user-id': 'user-1' } });
      expect(result.current.announcements).toEqual([]);
    });

    it('should throw when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useAnnouncements());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.deleteAnnouncement('a1')).rejects.toThrow('User not authenticated');
    });
  });

  describe('refresh', () => {
    it('should re-fetch announcements', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ data: { status: 'success', data: [] } })
        .mockResolvedValueOnce({ data: { status: 'success', data: [{ id: 'a1' }] } });

      const { result } = renderHook(() => useAnnouncements());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.announcements).toEqual([{ id: 'a1' }]);
    });
  });
});
