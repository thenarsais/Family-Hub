import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useFamily } from '@/hooks/useFamily';

function mockGetPaths(overrides: { family?: unknown; members?: unknown[]; settings?: unknown } = {}) {
  (apiClient.get as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
    if (path === '/api/family') return Promise.resolve({ data: { status: 'success', data: overrides.family ?? null } });
    if (path === '/api/family/members') return Promise.resolve({ data: { status: 'success', data: overrides.members ?? [] } });
    if (path === '/api/family/settings') return Promise.resolve({ data: { status: 'success', data: overrides.settings ?? null } });
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
}

describe('useFamily', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('should not fetch when there is no authenticated user', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useFamily());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('should load family, members, and settings on mount', async () => {
    mockGetPaths({
      family: { id: 'family-1', name: 'Smiths' },
      members: [{ id: 'm1', user_id: 'user-1' }],
      settings: { family_id: 'family-1', theme: 'dark' },
    });

    const { result } = renderHook(() => useFamily());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.family).toEqual({ id: 'family-1', name: 'Smiths' });
    expect(result.current.members).toEqual([{ id: 'm1', user_id: 'user-1' }]);
    expect(result.current.settings).toEqual({ family_id: 'family-1', theme: 'dark' });
  });

  it('should set an error when the fetch fails', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('down'));

    const { result } = renderHook(() => useFamily());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('down');
  });

  describe('inviteMember', () => {
    it('should post and return the invite token', async () => {
      mockGetPaths();
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { status: 'success', data: { invite_token: 'tok-abc' } },
      });

      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let token;
      await act(async () => {
        token = await result.current.inviteMember('a@b.com', 'parent');
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/family/members/invite',
        { email: 'a@b.com', role: 'parent' },
        { headers: { 'x-user-id': 'user-1' } }
      );
      expect(token).toBe('tok-abc');
    });

    it('should default to an empty string when there is no invite_token', async () => {
      mockGetPaths();
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { status: 'success', data: {} } });

      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let token;
      await act(async () => {
        token = await result.current.inviteMember('a@b.com', 'parent');
      });

      expect(token).toBe('');
    });

    it('should throw when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.inviteMember('a@b.com', 'parent')).rejects.toThrow('User not authenticated');
    });
  });

  describe('updateMemberRole', () => {
    it('should patch and update the matching member in local state', async () => {
      mockGetPaths({ members: [{ id: 'm1', user_id: 'u2', role: 'child' }] });
      (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateMemberRole('u2', 'parent');
      });

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/family/members/u2/role',
        { role: 'parent' },
        { headers: { 'x-user-id': 'user-1' } }
      );
      expect(result.current.members[0].role).toBe('parent');
    });

    it('should throw when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.updateMemberRole('u2', 'parent')).rejects.toThrow('User not authenticated');
    });
  });

  describe('removeMember', () => {
    it('should delete and remove the member from local state', async () => {
      mockGetPaths({ members: [{ id: 'm1', user_id: 'u2' }] });
      (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.removeMember('u2');
      });

      expect(apiClient.delete).toHaveBeenCalledWith('/api/family/members/u2', { headers: { 'x-user-id': 'user-1' } });
      expect(result.current.members).toEqual([]);
    });

    it('should throw when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.removeMember('u2')).rejects.toThrow('User not authenticated');
    });
  });

  describe('createFamily', () => {
    it('posts the new family, refetches, and returns it', async () => {
      mockGetPaths(); // initial: no family
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { status: 'success', data: { id: 'family-9', name: 'Narsais' } },
      });

      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));

      // after create, the refetch should see the new family
      mockGetPaths({ family: { id: 'family-9', name: 'Narsais' } });

      let created;
      await act(async () => {
        created = await result.current.createFamily({ name: 'Narsais', description: 'Home' });
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/family',
        { name: 'Narsais', description: 'Home' },
        { headers: { 'x-user-id': 'user-1' } }
      );
      expect(created).toEqual({ id: 'family-9', name: 'Narsais' });
      expect(result.current.family).toEqual({ id: 'family-9', name: 'Narsais' });
    });

    it('throws when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await expect(result.current.createFamily({ name: 'x' })).rejects.toThrow('User not authenticated');
    });
  });

  describe('addChild', () => {
    it('posts the child and refetches', async () => {
      mockGetPaths({ family: { id: 'family-1' } });
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { status: 'success' } });

      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.addChild({
          name: 'Krish',
          email: 'krish@narsais.test',
          password: 'temp1234',
          birth_year: 2016,
        });
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/family/children',
        { name: 'Krish', email: 'krish@narsais.test', password: 'temp1234', birth_year: 2016 },
        { headers: { 'x-user-id': 'user-1' } }
      );
    });

    it('throws when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await expect(
        result.current.addChild({ name: 'x', email: 'x@y.z', password: 'p', birth_year: 2016 })
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('updateMemberColor', () => {
    it('patches the colour and updates local state', async () => {
      mockGetPaths({ members: [{ id: 'm1', user_id: 'u2', role: 'child' }] });
      (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateMemberColor('u2', 'anand');
      });

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/family/members/u2/color',
        { color: 'anand' },
        { headers: { 'x-user-id': 'user-1' } }
      );
      expect((result.current.members[0] as { color?: string }).color).toBe('anand');
    });

    it('throws when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));
      await expect(result.current.updateMemberColor('u2', 'anand')).rejects.toThrow('User not authenticated');
    });
  });

  describe('updateSettings', () => {
    it('should patch and store the returned settings', async () => {
      mockGetPaths();
      (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { status: 'success', data: { family_id: 'family-1', theme: 'dark' } },
      });

      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateSettings({ theme: 'dark' });
      });

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/family/settings',
        { theme: 'dark' },
        { headers: { 'x-user-id': 'user-1' } }
      );
      expect(result.current.settings).toEqual({ family_id: 'family-1', theme: 'dark' });
    });

    it('should throw when there is no authenticated user', async () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(result.current.updateSettings({ theme: 'dark' })).rejects.toThrow('User not authenticated');
    });
  });

  describe('refresh', () => {
    it('should re-fetch family data', async () => {
      mockGetPaths({ family: { id: 'family-1', name: 'Old' } });
      const { result } = renderHook(() => useFamily());
      await waitFor(() => expect(result.current.loading).toBe(false));

      mockGetPaths({ family: { id: 'family-1', name: 'New' } });
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.family).toEqual({ id: 'family-1', name: 'New' });
    });
  });
});
