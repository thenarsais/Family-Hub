import { useEffect, useState } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient, type ApiEnvelope } from '../services/api';
import { useAuth } from './useAuth';

export type MaintenanceItem = components['schemas']['MaintenanceItem'];

export interface NewMaintenanceItem {
  name: string;
  intervalDays: number;
  lastDoneAt?: string;
}

interface UseMaintenanceReturn {
  items: MaintenanceItem[];
  loading: boolean;
  error: string | null;
  addItem: (input: NewMaintenanceItem) => Promise<void>;
  markDone: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<NewMaintenanceItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * T-15 — a family-wide, user-definable list of recurring home-maintenance
 * items. No role gate, no points: any signed-in member can manage it, same
 * as the shopping list.
 */
export function useMaintenance(): UseMaintenanceReturn {
  const { user } = useAuth();
  const [items, setItems] = useState<MaintenanceItem[]>([]);
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
      const res = await apiClient.get<ApiEnvelope<unknown> & { items?: MaintenanceItem[] }>(
        '/api/maintenance',
        { headers: { 'x-user-id': user.id } },
      );
      setItems(res.data?.items ?? []);
    } catch (err) {
      console.error('Failed to load maintenance items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load maintenance items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, [user?.id]);

  const addItem = async (input: NewMaintenanceItem) => {
    if (!headers) return;
    try {
      const res = await apiClient.post<{ item?: MaintenanceItem }>('/api/maintenance', input, { headers });
      const created = res.data?.item;
      if (created) setItems((prev) => [...prev, created].sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt)));
    } catch (err) {
      console.error('Failed to add maintenance item:', err);
      setError(err instanceof Error ? err.message : 'Failed to add maintenance item');
      throw err;
    }
  };

  const markDone = async (id: string) => {
    if (!headers) return;
    const snapshot = items;
    try {
      const res = await apiClient.post<{ item?: MaintenanceItem }>(`/api/maintenance/${id}/done`, {}, { headers });
      const updated = res.data?.item;
      if (updated) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? updated : i)).sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt)),
        );
      }
    } catch (err) {
      console.error('Failed to mark maintenance item done:', err);
      setItems(snapshot);
      setError(err instanceof Error ? err.message : 'Failed to mark maintenance item done');
    }
  };

  const updateItem = async (id: string, updates: Partial<NewMaintenanceItem>) => {
    if (!headers) return;
    try {
      const res = await apiClient.patch<{ item?: MaintenanceItem }>(`/api/maintenance/${id}`, updates, { headers });
      const updated = res.data?.item;
      if (updated) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? updated : i)).sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt)),
        );
      }
    } catch (err) {
      console.error('Failed to update maintenance item:', err);
      setError(err instanceof Error ? err.message : 'Failed to update maintenance item');
      throw err;
    }
  };

  const removeItem = async (id: string) => {
    if (!headers) return;
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id)); // optimistic
    try {
      await apiClient.delete(`/api/maintenance/${id}`, { headers });
    } catch (err) {
      console.error('Failed to remove maintenance item:', err);
      setItems(snapshot); // revert
      setError(err instanceof Error ? err.message : 'Failed to remove maintenance item');
    }
  };

  return { items, loading, error, addItem, markDone, updateItem, removeItem, refresh: fetchItems };
}
