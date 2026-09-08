import { useCallback, useEffect, useState } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';

export type ChoreWithStatus = components['schemas']['ChoreWithStatus'];
export type ChorePointsSummary = components['schemas']['ChorePointsSummary'];
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

/** Monthly-points reward tiers (FR-022) — mirrors CHORE_TIERS on the backend. */
export const CHORE_TIERS = [
  { name: 'Bronze', points: 200 },
  { name: 'Silver', points: 300 },
  { name: 'Gold', points: 400 },
] as const;

export interface NewChore {
  name: string;
  description?: string;
  timeSlot: TimeSlot;
  pointsValue: number;
  /** Defaults to the caller. Any active family member is allowed. */
  assigneeId?: string;
}

export type ChoreUpdate = Partial<{
  name: string;
  description: string | null;
  timeSlot: TimeSlot;
  pointsValue: number;
  enabled: boolean;
}>;

interface ChoresListResponse {
  status: string;
  chores: ChoreWithStatus[];
  count: number;
}
interface ChoreMutationResponse {
  status: string;
  message: string;
  chore: ChoreWithStatus;
}
interface PointsSummaryResponse {
  status: string;
  data: ChorePointsSummary;
}

interface UseChoresReturn {
  /** The signed-in user's enabled chores + today's completion state (the board). */
  chores: ChoreWithStatus[];
  /** Every family member's chores incl. disabled — the parent Manage panel. */
  familyChores: ChoreWithStatus[];
  pointsSummary: ChorePointsSummary;
  loading: boolean;
  error: string | null;
  complete: (choreId: string) => Promise<void>;
  undo: (choreId: string) => Promise<void>;
  createChore: (data: NewChore) => Promise<void>;
  updateChore: (choreId: string, updates: ChoreUpdate) => Promise<void>;
  refresh: () => Promise<void>;
  /** Loads / reloads the family-scoped list; call when the Manage panel opens. */
  loadFamilyChores: () => Promise<void>;
}

const EMPTY_SUMMARY: ChorePointsSummary = {
  totalPoints: 0,
  dailyPoints: 0,
  weeklyPoints: 0,
  monthlyPoints: 0,
};

export function useChores(): UseChoresReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [chores, setChores] = useState<ChoreWithStatus[]>([]);
  const [familyChores, setFamilyChores] = useState<ChoreWithStatus[]>([]);
  const [pointsSummary, setPointsSummary] = useState<ChorePointsSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(
    () => ({ headers: { 'x-user-id': userId as string } }),
    [userId],
  );

  const fetchBoard = useCallback(async () => {
    if (!userId) {
      setChores([]);
      setPointsSummary(EMPTY_SUMMARY);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [list, summary] = await Promise.all([
        apiClient.get<ChoresListResponse>('/api/chores?scope=mine', headers()),
        apiClient.get<PointsSummaryResponse>('/api/chores/points/summary', headers()),
      ]);
      setChores(list.data?.chores ?? []);
      setPointsSummary(summary.data?.data ?? EMPTY_SUMMARY);
    } catch (err) {
      console.error('Failed to fetch chores:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chores');
    } finally {
      setLoading(false);
    }
  }, [userId, headers]);

  const loadFamilyChores = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiClient.get<ChoresListResponse>('/api/chores?scope=family', headers());
      setFamilyChores(res.data?.chores ?? []);
    } catch (err) {
      console.error('Failed to fetch family chores:', err);
    }
  }, [userId, headers]);

  useEffect(() => {
    void fetchBoard();
  }, [fetchBoard]);

  // Optimistically flip one chore's completed state, run the call, reconcile.
  const mutateCompletion = useCallback(
    async (choreId: string, done: boolean, call: () => Promise<unknown>) => {
      if (!userId) throw new Error('User not authenticated');
      const snapshot = chores;
      setChores((prev) =>
        prev.map((c) => (c.id === choreId ? { ...c, completedToday: done } : c)),
      );
      try {
        await call();
        await fetchBoard();
      } catch (err) {
        setChores(snapshot);
        throw err;
      }
    },
    [userId, chores, fetchBoard],
  );

  const complete = useCallback(
    (choreId: string) =>
      mutateCompletion(choreId, true, () =>
        apiClient.post(`/api/chores/${choreId}/complete`, {}, headers()),
      ),
    [mutateCompletion, headers],
  );

  const undo = useCallback(
    (choreId: string) =>
      mutateCompletion(choreId, false, () =>
        apiClient.delete(`/api/chores/${choreId}/complete`, headers()),
      ),
    [mutateCompletion, headers],
  );

  const createChore = useCallback(
    async (data: NewChore) => {
      if (!userId) throw new Error('User not authenticated');
      await apiClient.post<ChoreMutationResponse>('/api/chores', data, headers());
      await Promise.all([fetchBoard(), loadFamilyChores()]);
    },
    [userId, headers, fetchBoard, loadFamilyChores],
  );

  const updateChore = useCallback(
    async (choreId: string, updates: ChoreUpdate) => {
      if (!userId) throw new Error('User not authenticated');
      await apiClient.patch<ChoreMutationResponse>(`/api/chores/${choreId}`, updates, headers());
      await Promise.all([fetchBoard(), loadFamilyChores()]);
    },
    [userId, headers, fetchBoard, loadFamilyChores],
  );

  return {
    chores,
    familyChores,
    pointsSummary,
    loading,
    error,
    complete,
    undo,
    createChore,
    updateChore,
    refresh: fetchBoard,
    loadFamilyChores,
  };
}
