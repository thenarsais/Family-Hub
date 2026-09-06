import { useState, useEffect } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient, type ApiEnvelope } from '../services/api';
import { useAuth } from './useAuth';
import type { MealSlot } from './useMealPlanner';

type ApiLibraryItem = components['schemas']['MealLibraryItem'];

export interface LibraryMeal {
  id: string;
  name: string;
  defaultSlot: MealSlot | null;
}

interface UseMealLibraryReturn {
  library: LibraryMeal[];
  loading: boolean;
  error: string | null;
  /** Add (or refresh) a saved meal. */
  addToLibrary: (name: string, defaultSlot?: MealSlot | null) => Promise<void>;
  renameLibraryItem: (id: string, name: string) => Promise<void>;
  setLibraryItemSlot: (id: string, slot: MealSlot | null) => Promise<void>;
  removeFromLibrary: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

function fromApi(row: ApiLibraryItem): LibraryMeal {
  return {
    id: row.id,
    name: row.name,
    defaultSlot: (row.default_slot ?? null) as MealSlot | null,
  };
}

const byName = (a: LibraryMeal, b: LibraryMeal) => a.name.localeCompare(b.name);

/** FR-133 — the family's saved-meals list. */
export function useMealLibrary(): UseMealLibraryReturn {
  const { user } = useAuth();
  const [library, setLibrary] = useState<LibraryMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = user?.id ? { 'x-user-id': user.id } : undefined;

  const fetchLibrary = async () => {
    if (!user?.id) {
      setLibrary([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<ApiEnvelope<ApiLibraryItem[]>>('/api/meals/library', {
        headers: { 'x-user-id': user.id },
      });
      setLibrary((res.data?.data ?? []).map(fromApi).sort(byName));
    } catch (err: any) {
      console.error('Failed to fetch meal library:', err);
      setError(err.message || 'Failed to fetch meal library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, [user?.id]);

  const addToLibrary = async (name: string, defaultSlot: MealSlot | null = null) => {
    const trimmed = name.trim();
    if (!trimmed || !headers) return;
    if (library.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) return;
    try {
      const res = await apiClient.post<ApiEnvelope<ApiLibraryItem>>(
        '/api/meals/library',
        { name: trimmed, defaultSlot },
        { headers },
      );
      const created = res.data?.data;
      if (created) setLibrary((prev) => [...prev, fromApi(created)].sort(byName));
    } catch (err: any) {
      console.error('Failed to add to meal library:', err);
      setError(err.message || 'Failed to add to meal library');
    }
  };

  const patch = async (id: string, body: Record<string, unknown>, optimistic: (m: LibraryMeal) => LibraryMeal) => {
    if (!headers) return;
    const snapshot = library;
    setLibrary((prev) => prev.map((m) => (m.id === id ? optimistic(m) : m)).sort(byName));
    try {
      await apiClient.patch(`/api/meals/library/${id}`, body, { headers });
    } catch (err: any) {
      console.error('Failed to update meal library item:', err);
      setLibrary(snapshot);
      setError(err.message || 'Failed to update meal library item');
    }
  };

  const renameLibraryItem = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return Promise.resolve();
    return patch(id, { name: trimmed }, (m) => ({ ...m, name: trimmed }));
  };

  const setLibraryItemSlot = (id: string, slot: MealSlot | null) =>
    patch(id, { defaultSlot: slot }, (m) => ({ ...m, defaultSlot: slot }));

  const removeFromLibrary = async (id: string) => {
    if (!headers) return;
    const snapshot = library;
    setLibrary((prev) => prev.filter((m) => m.id !== id));
    try {
      await apiClient.delete(`/api/meals/library/${id}`, { headers });
    } catch (err: any) {
      console.error('Failed to remove from meal library:', err);
      setLibrary(snapshot);
      setError(err.message || 'Failed to remove from meal library');
    }
  };

  return {
    library,
    loading,
    error,
    addToLibrary,
    renameLibraryItem,
    setLibraryItemSlot,
    removeFromLibrary,
    refresh: fetchLibrary,
  };
}
