import { useCallback, useEffect, useState } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';

export type Quest = components['schemas']['Quest'];

interface TodayPayload {
  status: string;
  quests: Quest[];
  allDone: boolean;
  bonusAwarded: boolean;
}

interface UseQuestsReturn {
  quests: Quest[];
  allDone: boolean;
  bonusAwarded: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useQuests(): UseQuestsReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [quests, setQuests] = useState<Quest[]>([]);
  const [allDone, setAllDone] = useState(false);
  const [bonusAwarded, setBonusAwarded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setQuests([]);
      setAllDone(false);
      setBonusAwarded(false);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<TodayPayload>('/api/quests/today', {
        headers: { 'x-user-id': userId },
      });
      setQuests(res.data?.quests ?? []);
      setAllDone(res.data?.allDone ?? false);
      setBonusAwarded(res.data?.bonusAwarded ?? false);
    } catch (err) {
      console.error('Failed to fetch quests today:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch quests today');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { quests, allDone, bonusAwarded, loading, error, refresh };
}
