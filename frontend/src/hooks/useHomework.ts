import { useCallback, useEffect, useState } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';

export type HomeworkItemWithStatus = components['schemas']['HomeworkItemWithStatus'];

export interface NewHomework {
  title: string;
  dueDate: string;
  subject?: string;
  pointsValue?: number;
  /** Defaults to the caller. Any active family member is allowed. */
  assigneeId?: string;
}

export type HomeworkUpdate = Partial<{
  title: string;
  subject: string | null;
  dueDate: string;
  pointsValue: number;
}>;

interface HomeworkListResponse {
  status: string;
  items: HomeworkItemWithStatus[];
  count: number;
}

interface UseHomeworkReturn {
  /** The signed-in user's open items due in the next 7 days / overdue + done today. */
  items: HomeworkItemWithStatus[];
  /** Every family member's open items + the last 30 days — the parent Manage panel. */
  familyItems: HomeworkItemWithStatus[];
  loading: boolean;
  error: string | null;
  complete: (id: string) => Promise<void>;
  uncomplete: (id: string) => Promise<void>;
  createItem: (data: NewHomework) => Promise<void>;
  updateItem: (id: string, updates: HomeworkUpdate) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  /** Loads / reloads the family-scoped list; call when the Manage panel opens. */
  loadFamilyItems: () => Promise<void>;
}

export function useHomework(): UseHomeworkReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [items, setItems] = useState<HomeworkItemWithStatus[]>([]);
  const [familyItems, setFamilyItems] = useState<HomeworkItemWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(
    () => ({ headers: { 'x-user-id': userId as string } }),
    [userId],
  );

  const fetchBoard = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<HomeworkListResponse>(
        '/api/homework?scope=mine',
        headers(),
      );
      setItems(res.data?.items ?? []);
    } catch (err) {
      console.error('Failed to fetch homework:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch homework');
    } finally {
      setLoading(false);
    }
  }, [userId, headers]);

  const loadFamilyItems = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiClient.get<HomeworkListResponse>(
        '/api/homework?scope=family',
        headers(),
      );
      setFamilyItems(res.data?.items ?? []);
    } catch (err) {
      console.error('Failed to fetch family homework:', err);
    }
  }, [userId, headers]);

  useEffect(() => {
    void fetchBoard();
  }, [fetchBoard]);

  // Optimistically flip one item's completed state, run the call, reconcile.
  const mutateCompletion = useCallback(
    async (id: string, done: boolean, call: () => Promise<unknown>) => {
      if (!userId) throw new Error('User not authenticated');
      const snapshot = items;
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, completed: done, isOverdue: done ? false : it.isOverdue } : it,
        ),
      );
      try {
        await call();
        await fetchBoard();
      } catch (err) {
        setItems(snapshot);
        throw err;
      }
    },
    [userId, items, fetchBoard],
  );

  const complete = useCallback(
    (id: string) =>
      mutateCompletion(id, true, () =>
        apiClient.post(`/api/homework/${id}/complete`, {}, headers()),
      ),
    [mutateCompletion, headers],
  );

  const uncomplete = useCallback(
    (id: string) =>
      mutateCompletion(id, false, () =>
        apiClient.delete(`/api/homework/${id}/complete`, headers()),
      ),
    [mutateCompletion, headers],
  );

  const createItem = useCallback(
    async (data: NewHomework) => {
      if (!userId) throw new Error('User not authenticated');
      await apiClient.post('/api/homework', data, headers());
      await Promise.all([fetchBoard(), loadFamilyItems()]);
    },
    [userId, headers, fetchBoard, loadFamilyItems],
  );

  const updateItem = useCallback(
    async (id: string, updates: HomeworkUpdate) => {
      if (!userId) throw new Error('User not authenticated');
      await apiClient.patch(`/api/homework/${id}`, updates, headers());
      await Promise.all([fetchBoard(), loadFamilyItems()]);
    },
    [userId, headers, fetchBoard, loadFamilyItems],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      await apiClient.delete(`/api/homework/${id}`, headers());
      await Promise.all([fetchBoard(), loadFamilyItems()]);
    },
    [userId, headers, fetchBoard, loadFamilyItems],
  );

  return {
    items,
    familyItems,
    loading,
    error,
    complete,
    uncomplete,
    createItem,
    updateItem,
    deleteItem,
    refresh: fetchBoard,
    loadFamilyItems,
  };
}
