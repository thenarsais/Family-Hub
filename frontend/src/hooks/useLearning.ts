import { useCallback, useEffect, useState } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';

export type Lesson = components['schemas']['LessonWithProgress'];
export type LearningStats = components['schemas']['LearningStats'];

export interface QuizAnswerPayload {
  lessonId: string;
  questionNumber: number;
  selectedAnswer: number;
  correctAnswer: number;
}

/** lessons grouped phase → subcategory → ordered lessons, for the browse UI. */
export type LessonsByPhase = Record<string, Record<string, Lesson[]>>;

interface LessonsResponse {
  status: string;
  lessons: Lesson[];
}
interface StatsResponse {
  status: string;
  stats: LearningStats;
}

const EMPTY_STATS: LearningStats = {
  totalLessonsCompleted: 0,
  totalPointsEarned: 0,
  alphabet: { completed: 0, total: 0 },
  numbers: { completed: 0, total: 0 },
  vocabulary: { completed: 0, total: 0 },
};

interface UseLearningReturn {
  lessons: Lesson[];
  byPhase: LessonsByPhase;
  stats: LearningStats;
  loading: boolean;
  error: string | null;
  completeLesson: (lessonId: string) => Promise<void>;
  /** T-25 — records a trace-mode session; +15 pts only the first time, ever. */
  traceLesson: (lessonId: string) => Promise<{ alreadyTraced: boolean }>;
  recordQuizAnswer: (payload: QuizAnswerPayload) => Promise<boolean>;
  refresh: () => Promise<void>;
}

function groupByPhase(lessons: Lesson[]): LessonsByPhase {
  const out: LessonsByPhase = {};
  for (const l of lessons) {
    (out[l.phase] ??= {})[l.subcategory] ??= [];
    out[l.phase][l.subcategory].push(l);
  }
  return out;
}

/**
 * T-11 — the Gujarati module for the signed-in user (or, on a shared display,
 * the active kiosk profile — `useAuth().user` already resolves to it).
 */
export function useLearning(): UseLearningReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stats, setStats] = useState<LearningStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(
    () => ({ headers: { 'x-user-id': userId as string } }),
    [userId],
  );

  /**
   * `silent` skips the loading flip. Only the very first load should show the
   * page-level spinner (LearnPage unmounts its whole subview while loading is
   * true) -- a post-action refetch (complete/trace/quiz) must NOT do that, or
   * it wipes out whatever local UI state the current view was showing (T-25
   * caught this: it discarded TraceCanvas's just-earned success message
   * before the user ever saw it).
   */
  const refresh = useCallback(
    async (silent = false) => {
      if (!userId) {
        setLessons([]);
        setStats(EMPTY_STATS);
        setLoading(false);
        return;
      }
      try {
        if (!silent) setLoading(true);
        setError(null);
        const [list, s] = await Promise.all([
          apiClient.get<LessonsResponse>('/api/learning/lessons', headers()),
          apiClient.get<StatsResponse>('/api/learning/stats', headers()),
        ]);
        setLessons(list.data?.lessons ?? []);
        setStats(s.data?.stats ?? EMPTY_STATS);
      } catch (err) {
        console.error('Failed to load the learning module:', err);
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [userId, headers],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const completeLesson = useCallback(
    async (lessonId: string) => {
      if (!userId) throw new Error('Not signed in');
      const snapshot = lessons;
      setLessons((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, completed: true } : l)),
      );
      try {
        await apiClient.post(`/api/learning/lessons/${lessonId}/complete`, {}, headers());
        await refresh(true);
      } catch (err) {
        setLessons(snapshot);
        throw err;
      }
    },
    [userId, lessons, headers, refresh],
  );

  const traceLesson = useCallback(
    async (lessonId: string): Promise<{ alreadyTraced: boolean }> => {
      if (!userId) throw new Error('Not signed in');
      const snapshot = lessons;
      setLessons((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, traced: true } : l)),
      );
      try {
        const res = await apiClient.post<{ alreadyTraced?: boolean }>(
          `/api/learning/lessons/${lessonId}/trace-complete`,
          {},
          headers(),
        );
        await refresh(true);
        return { alreadyTraced: !!res.data?.alreadyTraced };
      } catch (err) {
        setLessons(snapshot);
        throw err;
      }
    },
    [userId, lessons, headers, refresh],
  );

  const recordQuizAnswer = useCallback(
    async (payload: QuizAnswerPayload): Promise<boolean> => {
      if (!userId) throw new Error('Not signed in');
      const res = await apiClient.post<{ result?: { isCorrect: boolean } }>(
        '/api/learning/quiz/answer',
        payload,
        headers(),
      );
      return !!res.data?.result?.isCorrect;
    },
    [userId, headers],
  );

  return {
    lessons,
    byPhase: groupByPhase(lessons),
    stats,
    loading,
    error,
    completeLesson,
    traceLesson,
    recordQuizAnswer,
    refresh,
  };
}
