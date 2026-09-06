import { useState, useEffect } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient, type ApiEnvelope } from '../services/api';
import { useAuth } from './useAuth';

type ApiShoppingItem = components['schemas']['ShoppingItem'];

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  addedById: string | null;
  createdAt: string | null;
}

/** A handful of common items for the widget's quick-add row. */
export const QUICK_ADD_ITEMS = ['Milk', 'Eggs', 'Bread', 'Bananas', 'Coffee', 'Butter'];

interface UseShoppingListReturn {
  items: ShoppingItem[];
  loading: boolean;
  error: string | null;
  addItem: (name: string) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearChecked: () => Promise<void>;
  refresh: () => Promise<void>;
}

function fromApi(row: ApiShoppingItem): ShoppingItem {
  return {
    id: row.id,
    name: row.name,
    checked: row.checked,
    addedById: row.added_by_id ?? null,
    createdAt: row.created_at ?? null,
  };
}

/** Pending first, then by insertion order — mirrors the server's ORDER BY. */
function sortItems(list: ShoppingItem[]): ShoppingItem[] {
  return [...list].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
  });
}

export function useShoppingList(): UseShoppingListReturn {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = user?.id ? { 'x-user-id': user.id } : undefined;

  const fetchItems = async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<ApiEnvelope<ApiShoppingItem[]>>('/api/shopping', {
        headers: { 'x-user-id': user.id },
      });
      setItems((res.data?.data ?? []).map(fromApi));
    } catch (err: any) {
      console.error('Failed to fetch shopping list:', err);
      setError(err.message || 'Failed to fetch shopping list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user?.id]);

  const addItem = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || !headers) return;
    try {
      const res = await apiClient.post<ApiEnvelope<ApiShoppingItem>>(
        '/api/shopping',
        { name: trimmed },
        { headers },
      );
      const created = res.data?.data;
      if (created) setItems((prev) => sortItems([...prev, fromApi(created)]));
    } catch (err: any) {
      console.error('Failed to add shopping item:', err);
      setError(err.message || 'Failed to add shopping item');
    }
  };

  const toggleItem = async (id: string) => {
    if (!headers) return;
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const next = !target.checked;

    // Optimistic
    setItems((prev) => sortItems(prev.map((i) => (i.id === id ? { ...i, checked: next } : i))));

    try {
      await apiClient.patch(`/api/shopping/${id}`, { checked: next }, { headers });
    } catch (err: any) {
      console.error('Failed to toggle shopping item:', err);
      // Revert
      setItems((prev) =>
        sortItems(prev.map((i) => (i.id === id ? { ...i, checked: target.checked } : i))),
      );
      setError(err.message || 'Failed to toggle shopping item');
    }
  };

  const removeItem = async (id: string) => {
    if (!headers) return;
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id)); // optimistic
    try {
      await apiClient.delete(`/api/shopping/${id}`, { headers });
    } catch (err: any) {
      console.error('Failed to remove shopping item:', err);
      setItems(snapshot); // revert
      setError(err.message || 'Failed to remove shopping item');
    }
  };

  const clearChecked = async () => {
    if (!headers) return;
    const snapshot = items;
    setItems((prev) => prev.filter((i) => !i.checked)); // optimistic
    try {
      await apiClient.delete('/api/shopping/checked', { headers });
    } catch (err: any) {
      console.error('Failed to clear checked items:', err);
      setItems(snapshot); // revert
      setError(err.message || 'Failed to clear checked items');
    }
  };

  return {
    items,
    loading,
    error,
    addItem,
    toggleItem,
    removeItem,
    clearChecked,
    refresh: fetchItems,
  };
}
