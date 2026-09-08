import { useCallback, useEffect, useState } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';

export type HabitWithStatus = components['schemas']['HabitWithStatus'];
export type MoodEntry = components['schemas']['MoodEntry'];
export type MoodDay = components['schemas']['MoodDay'];
export type MoodValue = MoodEntry['mood'];

/** The mood options offered in the check-in, most-positive first. */
export const MOODS: { value: MoodValue; emoji: string; label: string }[] = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'ok', emoji: '😐', label: 'OK' },
  { value: 'low', emoji: '😕', label: 'Low' },
  { value: 'sad', emoji: '😢', label: 'Sad' },
];

export interface NewHabit {
  title: string;
  description?: string;
  weeklyTarget: number;
  pointsValue: number;
  assigneeId?: string;
}

export type HabitUpdate = Partial<{
  title: string;
  description: string | null;
  weeklyTarget: number;
  pointsValue: number;
  enabled: boolean;
}>;

interface HabitsListResponse {
  status: string;
  habits: HabitWithStatus[];
  count: number;
}
interface MoodResponse {
  status: string;
  mood: MoodEntry | null;
}
interface MoodHistoryResponse {
  status: string;
  history: MoodDay[];
  count: number;
}

interface UseHabitsReturn {
  habits: HabitWithStatus[];
  familyHabits: HabitWithStatus[];
  todayMood: MoodEntry | null;
  loading: boolean;
  error: string | null;
  complete: (habitId: string) => Promise<void>;
  undo: (habitId: string) => Promise<void>;
  createHabit: (data: NewHabit) => Promise<void>;
  updateHabit: (habitId: string, updates: HabitUpdate) => Promise<void>;
  setMood: (mood: MoodValue) => Promise<void>;
  refresh: () => Promise<void>;
  loadFamilyHabits: () => Promise<void>;
}

export function useHabits(): UseHabitsReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [habits, setHabits] = useState<HabitWithStatus[]>([]);
  const [familyHabits, setFamilyHabits] = useState<HabitWithStatus[]>([]);
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(
    () => ({ headers: { 'x-user-id': userId as string } }),
    [userId],
  );

  const fetchBoard = useCallback(async () => {
    if (!userId) {
      setHabits([]);
      setTodayMood(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [list, mood] = await Promise.all([
        apiClient.get<HabitsListResponse>('/api/habits?scope=mine', headers()),
        apiClient.get<MoodResponse>('/api/habits/mood/today', headers()),
      ]);
      setHabits(list.data?.habits ?? []);
      setTodayMood(mood.data?.mood ?? null);
    } catch (err) {
      console.error('Failed to fetch habits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch habits');
    } finally {
      setLoading(false);
    }
  }, [userId, headers]);

  const loadFamilyHabits = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiClient.get<HabitsListResponse>('/api/habits?scope=family', headers());
      setFamilyHabits(res.data?.habits ?? []);
    } catch (err) {
      console.error('Failed to fetch family habits:', err);
    }
  }, [userId, headers]);

  useEffect(() => {
    void fetchBoard();
  }, [fetchBoard]);

  const mutateCompletion = useCallback(
    async (habitId: string, done: boolean, call: () => Promise<unknown>) => {
      if (!userId) throw new Error('User not authenticated');
      const snapshot = habits;
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? {
                ...h,
                completedToday: done,
                weekCompletions: Math.max(0, h.weekCompletions + (done ? 1 : -1)),
              }
            : h,
        ),
      );
      try {
        await call();
        await fetchBoard();
      } catch (err) {
        setHabits(snapshot);
        throw err;
      }
    },
    [userId, habits, fetchBoard],
  );

  const complete = useCallback(
    (habitId: string) =>
      mutateCompletion(habitId, true, () =>
        apiClient.post(`/api/habits/${habitId}/complete`, {}, headers()),
      ),
    [mutateCompletion, headers],
  );

  const undo = useCallback(
    (habitId: string) =>
      mutateCompletion(habitId, false, () =>
        apiClient.delete(`/api/habits/${habitId}/complete`, headers()),
      ),
    [mutateCompletion, headers],
  );

  const createHabit = useCallback(
    async (data: NewHabit) => {
      if (!userId) throw new Error('User not authenticated');
      await apiClient.post('/api/habits', data, headers());
      await Promise.all([fetchBoard(), loadFamilyHabits()]);
    },
    [userId, headers, fetchBoard, loadFamilyHabits],
  );

  const updateHabit = useCallback(
    async (habitId: string, updates: HabitUpdate) => {
      if (!userId) throw new Error('User not authenticated');
      await apiClient.patch(`/api/habits/${habitId}`, updates, headers());
      await Promise.all([fetchBoard(), loadFamilyHabits()]);
    },
    [userId, headers, fetchBoard, loadFamilyHabits],
  );

  const setMood = useCallback(
    async (mood: MoodValue) => {
      if (!userId) throw new Error('User not authenticated');
      const found = MOODS.find((m) => m.value === mood);
      const res = await apiClient.post<{ mood: MoodEntry }>(
        '/api/habits/mood',
        { mood, emoji: found?.emoji },
        headers(),
      );
      setTodayMood(res.data?.mood ?? null);
    },
    [userId, headers],
  );

  return {
    habits,
    familyHabits,
    todayMood,
    loading,
    error,
    complete,
    undo,
    createHabit,
    updateHabit,
    setMood,
    refresh: fetchBoard,
    loadFamilyHabits,
  };
}

/** Standalone loader for the parent mood heatmap (FR-149) on the Family page. */
export function useFamilyMoodHistory(days = 35) {
  const { user } = useAuth();
  const userId = user?.id;
  const [history, setHistory] = useState<MoodDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setLoading(false);
      return undefined;
    }
    (async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<MoodHistoryResponse>(
          `/api/habits/mood/history?days=${days}`,
          { headers: { 'x-user-id': userId } },
        );
        if (!cancelled) setHistory(res.data?.history ?? []);
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (!cancelled && status === 403) setForbidden(true);
        else if (!cancelled) console.error('Failed to fetch mood history:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, days]);

  return { history, loading, forbidden };
}
