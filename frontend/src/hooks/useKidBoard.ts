import { useCallback, useEffect, useState } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';

export type RoutineWithStatus = components['schemas']['RoutineWithStatus'];
export type MoodEntry = components['schemas']['MoodEntry'];
export type MoodValue = MoodEntry['mood'];
export type RoutineSlot = 'morning' | 'evening';

export interface NewRoutine {
  slot: RoutineSlot;
  label: string;
  emoji: string;
  sortOrder?: number;
}
export type RoutineUpdate = Partial<{
  slot: RoutineSlot;
  label: string;
  emoji: string;
  sortOrder: number;
  enabled: boolean;
}>;

interface RoutinesResponse {
  status: string;
  routines: RoutineWithStatus[];
}
interface MoodResponse {
  status: string;
  mood: MoodEntry | null;
}

interface UseKidBoardReturn {
  routines: RoutineWithStatus[];
  /** Every routine incl. hidden ones — for the parent Manage panel. */
  manageRoutines: RoutineWithStatus[];
  todayMood: MoodEntry | null;
  loading: boolean;
  error: string | null;
  completeRoutine: (id: string) => Promise<void>;
  undoRoutine: (id: string) => Promise<void>;
  setMood: (mood: MoodValue) => Promise<void>;
  createRoutine: (data: NewRoutine) => Promise<void>;
  updateRoutine: (id: string, updates: RoutineUpdate) => Promise<void>;
  refresh: () => Promise<void>;
  refreshManage: () => Promise<void>;
}

/**
 * T-12 — a parent driving a young child's board. `memberId` is the child; every
 * request carries the signed-in parent's x-user-id, and the backend enforces
 * that they may act for that child.
 */
export function useKidBoard(memberId: string | undefined): UseKidBoardReturn {
  const { user } = useAuth();
  const callerId = user?.id;

  const [routines, setRoutines] = useState<RoutineWithStatus[]>([]);
  const [manageRoutines, setManageRoutines] = useState<RoutineWithStatus[]>([]);
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(
    () => ({ headers: { 'x-user-id': callerId as string } }),
    [callerId],
  );
  const base = `/api/kids/${memberId}`;

  const fetchBoard = useCallback(async () => {
    if (!callerId || !memberId) {
      setRoutines([]);
      setTodayMood(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [list, mood] = await Promise.all([
        apiClient.get<RoutinesResponse>(`${base}/routines`, headers()),
        apiClient.get<MoodResponse>(`${base}/mood`, headers()),
      ]);
      setRoutines(list.data?.routines ?? []);
      setTodayMood(mood.data?.mood ?? null);
    } catch (err) {
      console.error('Failed to fetch the kid board:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [callerId, memberId, base, headers]);

  const fetchManage = useCallback(async () => {
    if (!callerId || !memberId) {
      setManageRoutines([]);
      return;
    }
    try {
      const res = await apiClient.get<RoutinesResponse>(
        `${base}/routines?scope=manage`,
        headers(),
      );
      setManageRoutines(res.data?.routines ?? []);
    } catch (err) {
      console.error('Failed to fetch routines for the Manage panel:', err);
    }
  }, [callerId, memberId, base, headers]);

  useEffect(() => {
    void fetchBoard();
  }, [fetchBoard]);

  const mutateDone = useCallback(
    async (id: string, done: boolean, call: () => Promise<unknown>) => {
      if (!callerId || !memberId) throw new Error('Not ready');
      const snapshot = routines;
      setRoutines((prev) => prev.map((r) => (r.id === id ? { ...r, doneToday: done } : r)));
      try {
        await call();
        await fetchBoard();
      } catch (err) {
        setRoutines(snapshot);
        throw err;
      }
    },
    [callerId, memberId, routines, fetchBoard],
  );

  const completeRoutine = useCallback(
    (id: string) =>
      mutateDone(id, true, () => apiClient.post(`${base}/routines/${id}/complete`, {}, headers())),
    [mutateDone, base, headers],
  );
  const undoRoutine = useCallback(
    (id: string) =>
      mutateDone(id, false, () => apiClient.delete(`${base}/routines/${id}/complete`, headers())),
    [mutateDone, base, headers],
  );

  const setMood = useCallback(
    async (mood: MoodValue) => {
      if (!callerId || !memberId) throw new Error('Not ready');
      const res = await apiClient.post<{ mood: MoodEntry }>(`${base}/mood`, { mood }, headers());
      setTodayMood(res.data?.mood ?? null);
    },
    [callerId, memberId, base, headers],
  );

  const createRoutine = useCallback(
    async (data: NewRoutine) => {
      if (!callerId || !memberId) throw new Error('Not ready');
      await apiClient.post(`${base}/routines`, data, headers());
      await Promise.all([fetchBoard(), fetchManage()]);
    },
    [callerId, memberId, base, headers, fetchBoard, fetchManage],
  );

  const updateRoutine = useCallback(
    async (id: string, updates: RoutineUpdate) => {
      if (!callerId || !memberId) throw new Error('Not ready');
      await apiClient.patch(`${base}/routines/${id}`, updates, headers());
      await Promise.all([fetchBoard(), fetchManage()]);
    },
    [callerId, memberId, base, headers, fetchBoard, fetchManage],
  );

  return {
    routines,
    manageRoutines,
    todayMood,
    loading,
    error,
    completeRoutine,
    undoRoutine,
    setMood,
    createRoutine,
    updateRoutine,
    refresh: fetchBoard,
    refreshManage: fetchManage,
  };
}
