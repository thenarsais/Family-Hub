import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useMealLibrary } from '@/hooks/useMealLibrary';

type Fn = ReturnType<typeof vi.fn>;

const row = (over: Record<string, unknown> = {}) => ({
  id: 'l1',
  family_id: 'fam-1',
  name: 'Taco night',
  default_slot: 'dinner',
  created_by_id: 'u1',
  created_at: null,
  updated_at: null,
  ...over,
});

function mockList(items: unknown[]) {
  (apiClient.get as Fn).mockResolvedValue({ data: { status: 'success', data: items } });
}

describe('useMealLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'u1' } });
    mockList([]);
  });

  it('fetches the library on mount, sorted by name', async () => {
    mockList([row({ id: 'b', name: 'Zucchini' }), row({ id: 'a', name: 'Apples' })]);

    const { result } = renderHook(() => useMealLibrary());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.library.map((m) => m.name)).toEqual(['Apples', 'Zucchini']);
    expect(apiClient.get).toHaveBeenCalledWith('/api/meals/library', {
      headers: { 'x-user-id': 'u1' },
    });
  });

  it('skips fetch with no user', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useMealLibrary());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.library).toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  describe('addToLibrary', () => {
    it('POSTs name + slot and appends sorted', async () => {
      (apiClient.post as Fn).mockResolvedValue({
        data: { status: 'success', data: row({ id: 'n', name: 'Bagels', default_slot: 'breakfast' }) },
      });
      const { result } = renderHook(() => useMealLibrary());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.addToLibrary('  Bagels  ', 'breakfast');
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/meals/library',
        { name: 'Bagels', defaultSlot: 'breakfast' },
        { headers: { 'x-user-id': 'u1' } },
      );
      expect(result.current.library.map((m) => m.name)).toContain('Bagels');
    });

    it('ignores a duplicate name (case-insensitive)', async () => {
      mockList([row({ name: 'Tacos' })]);
      const { result } = renderHook(() => useMealLibrary());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.addToLibrary('tacos');
      });

      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('renameLibraryItem', () => {
    it('PATCHes and optimistically renames', async () => {
      mockList([row({ id: 'x', name: 'Old' })]);
      (apiClient.patch as Fn).mockResolvedValue({ data: { status: 'success' } });
      const { result } = renderHook(() => useMealLibrary());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.renameLibraryItem('x', '  New  ');
      });

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/meals/library/x',
        { name: 'New' },
        { headers: { 'x-user-id': 'u1' } },
      );
      expect(result.current.library[0].name).toBe('New');
    });

    it('reverts on failure', async () => {
      mockList([row({ id: 'x', name: 'Old' })]);
      (apiClient.patch as Fn).mockRejectedValue(new Error('nope'));
      const { result } = renderHook(() => useMealLibrary());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.renameLibraryItem('x', 'New');
      });

      expect(result.current.library[0].name).toBe('Old');
    });
  });

  describe('setLibraryItemSlot', () => {
    it('PATCHes defaultSlot (including null to clear)', async () => {
      mockList([row({ id: 'x', default_slot: 'dinner' })]);
      (apiClient.patch as Fn).mockResolvedValue({ data: { status: 'success' } });
      const { result } = renderHook(() => useMealLibrary());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.setLibraryItemSlot('x', null);
      });

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/meals/library/x',
        { defaultSlot: null },
        { headers: { 'x-user-id': 'u1' } },
      );
      expect(result.current.library[0].defaultSlot).toBeNull();
    });
  });

  describe('removeFromLibrary', () => {
    it('optimistically drops the item and DELETEs it', async () => {
      mockList([row({ id: 'x' }), row({ id: 'y', name: 'Keep' })]);
      (apiClient.delete as Fn).mockResolvedValue({ data: { status: 'success' } });
      const { result } = renderHook(() => useMealLibrary());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.removeFromLibrary('x');
      });

      expect(apiClient.delete).toHaveBeenCalledWith('/api/meals/library/x', {
        headers: { 'x-user-id': 'u1' },
      });
      expect(result.current.library.map((m) => m.id)).toEqual(['y']);
    });

    it('restores on failure', async () => {
      mockList([row({ id: 'x' })]);
      (apiClient.delete as Fn).mockRejectedValue(new Error('boom'));
      const { result } = renderHook(() => useMealLibrary());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.removeFromLibrary('x');
      });

      expect(result.current.library).toHaveLength(1);
    });
  });
});
