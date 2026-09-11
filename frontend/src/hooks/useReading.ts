import { useCallback, useEffect, useState } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';

export type ReadingGoals = components['schemas']['ReadingGoals'];
export type ReadingGoalsWithMember = components['schemas']['ReadingGoalsWithMember'];
export type ReadingLog = components['schemas']['ReadingLog'];

export type ReadingGoalUpdate = Partial<{
  dailyMinutes: number;
  weeklyMinutes: number;
  pointsValue: number;
}>;

const DEFAULT_GOALS: ReadingGoals = { dailyMinutes: 20, weeklyMinutes: 100, pointsValue: 10 };

interface TodayPayload {
  status: string;
  goals: ReadingGoals;
  log: ReadingLog | null;
  weekMinutes: number;
  streak: number;
}

interface FamilyGoalsResponse {
  status: string;
  goals: ReadingGoalsWithMember[];
}

interface UseReadingReturn {
  goals: ReadingGoals;
  log: ReadingLog | null;
  weekMinutes: number;
  streak: number;
  loading: boolean;
  error: string | null;
  submit: (minutes: number) => Promise<void>;
  undo: () => Promise<void>;
  familyGoals: ReadingGoalsWithMember[];
  loadFamilyGoals: () => Promise<void>;
  updateGoals: (userId: string, updates: ReadingGoalUpdate) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useReading(): UseReadingReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [goals, setGoals] = useState<ReadingGoals>(DEFAULT_GOALS);
  const [log, setLog] = useState<ReadingLog | null>(null);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [familyGoals, setFamilyGoals] = useState<ReadingGoalsWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(
    () => ({ headers: { 'x-user-id': userId as string } }),
    [userId],
  );

  const applyPayload = (payload: TodayPayload | undefined) => {
    setGoals(payload?.goals ?? DEFAULT_GOALS);
    setLog(payload?.log ?? null);
    setWeekMinutes(payload?.weekMinutes ?? 0);
    setStreak(payload?.streak ?? 0);
  };

  const refresh = useCallback(async () => {
    if (!userId) {
      applyPayload(undefined);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<TodayPayload>('/api/reading/today', headers());
      applyPayload(res.data);
    } catch (err) {
      console.error('Failed to fetch reading today:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reading today');
    } finally {
      setLoading(false);
    }
  }, [userId, headers]);

  const loadFamilyGoals = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiClient.get<FamilyGoalsResponse>(
        '/api/reading/goals?scope=family',
        headers(),
      );
      setFamilyGoals(res.data?.goals ?? []);
    } catch (err) {
      console.error('Failed to fetch family reading goals:', err);
    }
  }, [userId, headers]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submit = useCallback(
    async (minutes: number) => {
      if (!userId) throw new Error('Not signed in');
      const res = await apiClient.post<TodayPayload>(
        '/api/reading/today',
        { minutes },
        headers(),
      );
      applyPayload(res.data);
    },
    [userId, headers],
  );

  const undo = useCallback(async () => {
    if (!userId) throw new Error('Not signed in');
    await apiClient.delete('/api/reading/today', headers());
    await refresh();
  }, [userId, headers, refresh]);

  const updateGoals = useCallback(
    async (targetUserId: string, updates: ReadingGoalUpdate) => {
      if (!userId) throw new Error('Not signed in');
      await apiClient.patch(`/api/reading/goals/${targetUserId}`, updates, headers());
      await Promise.all([refresh(), loadFamilyGoals()]);
    },
    [userId, headers, refresh, loadFamilyGoals],
  );

  return {
    goals,
    log,
    weekMinutes,
    streak,
    loading,
    error,
    submit,
    undo,
    familyGoals,
    loadFamilyGoals,
    updateGoals,
    refresh,
  };
}
