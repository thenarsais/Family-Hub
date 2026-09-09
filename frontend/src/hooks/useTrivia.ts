import { useCallback, useEffect, useState } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';

export type TriviaQuestion = components['schemas']['TriviaQuestion'];
export type TriviaAttempt = components['schemas']['TriviaAttempt'];
type TriviaToday = components['schemas']['TriviaToday'];

interface TodayResponse extends TriviaToday {
  status: string;
}

const EMPTY: TriviaToday = {
  question: null,
  attempt: null,
  streak: 0,
  stats: { answered: 0, correct: 0 },
};

interface UseTriviaReturn {
  question: TriviaQuestion | null;
  attempt: TriviaAttempt | null;
  streak: number;
  stats: { answered: number; correct: number };
  loading: boolean;
  error: string | null;
  submit: (answer: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * T-09 — the daily trivia question for the signed-in user (or the active kiosk
 * profile). One shared question per family-local day; the streak counts
 * consecutive days answered, right or wrong.
 */
export function useTrivia(): UseTriviaReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [today, setToday] = useState<TriviaToday>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(
    () => ({ headers: { 'x-user-id': userId as string } }),
    [userId],
  );

  const refresh = useCallback(async () => {
    if (!userId) {
      setToday(EMPTY);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<TodayResponse>('/api/trivia/today', headers());
      setToday(res.data ?? EMPTY);
    } catch (err) {
      console.error('Failed to load trivia:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [userId, headers]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submit = useCallback(
    async (answer: string) => {
      if (!userId) throw new Error('Not signed in');
      const res = await apiClient.post<TodayResponse>('/api/trivia/today', { answer }, headers());
      setToday(res.data ?? EMPTY);
    },
    [userId, headers],
  );

  return {
    question: today.question ?? null,
    attempt: today.attempt ?? null,
    streak: today.streak,
    stats: today.stats,
    loading,
    error,
    submit,
    refresh,
  };
}
