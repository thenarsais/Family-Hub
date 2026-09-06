import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: mockUseAuth }));

vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';
import { useShoppingList } from '@/hooks/useShoppingList';

type Fn = ReturnType<typeof vi.fn>;

const row = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'i1',
  family_id: 'fam-1',
  name: 'Milk',
  checked: false,
  added_by_id: 'user-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
});

function mockList(items: unknown[]) {
  (apiClient.get as Fn).mockResolvedValue({ data: { status: 'success', data: items } });
}

describe('useShoppingList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    mockList([]);
  });

  it('skips fetching and stays empty when there is no authenticated user', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('loads the family list on mount, mapped to the client shape', async () => {
    mockList([row({ id: 'a', name: 'Eggs' }), row({ id: 'b', name: 'Bread', checked: true })]);

    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiClient.get).toHaveBeenCalledWith('/api/shopping', {
      headers: { 'x-user-id': 'user-1' },
    });
    expect(result.current.items).toEqual([
      { id: 'a', name: 'Eggs', checked: false, addedById: 'user-1', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'b', name: 'Bread', checked: true, addedById: 'user-1', createdAt: '2026-01-01T00:00:00Z' },
    ]);
  });

  it('sets an error when the fetch fails', async () => {
    (apiClient.get as Fn).mockRejectedValue(new Error('down'));

    const { result } = renderHook(() => useShoppingList());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('down');
  });

  describe('addItem', () => {
    it('POSTs the trimmed name and appends the created row', async () => {
      (apiClient.post as Fn).mockResolvedValue({
        data: { status: 'success', data: row({ id: 'new', name: 'Apples' }) },
      });

      const { result } = renderHook(() => useShoppingList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.addItem('  Apples  ');
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/shopping',
        { name: 'Apples' },
        { headers: { 'x-user-id': 'user-1' } },
      );
      expect(result.current.items.map((i) => i.name)).toContain('Apples');
    });

    it('ignores a blank name', async () => {
      const { result } = renderHook(() => useShoppingList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.addItem('   ');
      });

      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('toggleItem', () => {
    it('optimistically flips checked and PATCHes the new value', async () => {
      mockList([row({ id: 'x', name: 'Rice', checked: false })]);
      (apiClient.patch as Fn).mockResolvedValue({ data: { status: 'success', data: row() } });

      const { result } = renderHook(() => useShoppingList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggleItem('x');
      });

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/shopping/x',
        { checked: true },
        { headers: { 'x-user-id': 'user-1' } },
      );
      expect(result.current.items.find((i) => i.id === 'x')?.checked).toBe(true);
    });

    it('reverts the optimistic flip when the PATCH fails', async () => {
      mockList([row({ id: 'x', name: 'Rice', checked: false })]);
      (apiClient.patch as Fn).mockRejectedValue(new Error('nope'));

      const { result } = renderHook(() => useShoppingList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggleItem('x');
      });

      expect(result.current.items.find((i) => i.id === 'x')?.checked).toBe(false);
    });
  });

  describe('removeItem', () => {
    it('optimistically drops the item and DELETEs it', async () => {
      mockList([row({ id: 'x', name: 'Rice' }), row({ id: 'y', name: 'Salt' })]);
      (apiClient.delete as Fn).mockResolvedValue({ data: { status: 'success' } });

      const { result } = renderHook(() => useShoppingList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.removeItem('x');
      });

      expect(apiClient.delete).toHaveBeenCalledWith('/api/shopping/x', {
        headers: { 'x-user-id': 'user-1' },
      });
      expect(result.current.items.find((i) => i.id === 'x')).toBeUndefined();
      expect(result.current.items).toHaveLength(1);
    });

    it('restores the item when the DELETE fails', async () => {
      mockList([row({ id: 'x', name: 'Rice' })]);
      (apiClient.delete as Fn).mockRejectedValue(new Error('boom'));

      const { result } = renderHook(() => useShoppingList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.removeItem('x');
      });

      expect(result.current.items.find((i) => i.id === 'x')).toBeDefined();
    });
  });

  describe('clearChecked', () => {
    it('drops checked items and calls DELETE /api/shopping/checked', async () => {
      mockList([
        row({ id: 'a', name: 'Milk', checked: true }),
        row({ id: 'b', name: 'Bread', checked: false }),
      ]);
      (apiClient.delete as Fn).mockResolvedValue({ data: { status: 'success', data: { removed: 1 } } });

      const { result } = renderHook(() => useShoppingList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.clearChecked();
      });

      expect(apiClient.delete).toHaveBeenCalledWith('/api/shopping/checked', {
        headers: { 'x-user-id': 'user-1' },
      });
      expect(result.current.items.map((i) => i.id)).toEqual(['b']);
    });
  });
});
