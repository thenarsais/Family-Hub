import { useCallback, useEffect, useState } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';

export type RewardSettings = components['schemas']['RewardSettings'];
export type RewardSettingsWithMember = components['schemas']['RewardSettingsWithMember'];
export type RewardLibraryItem = components['schemas']['RewardLibraryItem'];
export type RewardEarned = components['schemas']['RewardEarned'];
export type RewardTier = { name: string; points: number; reached: boolean };

export interface NewLibraryItem {
  title: string;
  description?: string;
  cashAmount?: number;
}

export type LibraryItemUpdate = Partial<{
  title: string;
  description: string | null;
  cashAmount: number | null;
  active: boolean;
}>;

interface TodayPayload {
  status: string;
  weeklyGoal: number;
  weekPoints: number;
  monthPoints: number;
  tiers: RewardTier[];
  justEarned: string[];
}
interface EarnedResponse {
  status: string;
  earned: RewardEarned[];
}
interface LibraryResponse {
  status: string;
  library: RewardLibraryItem[];
}
interface FamilySettingsResponse {
  status: string;
  settings: RewardSettingsWithMember[];
}

interface UseRewardsReturn {
  weeklyGoal: number;
  weekPoints: number;
  monthPoints: number;
  tiers: RewardTier[];
  justEarned: string[];
  earned: RewardEarned[];
  library: RewardLibraryItem[];
  loading: boolean;
  error: string | null;
  familySettings: RewardSettingsWithMember[];
  loadFamilySettings: () => Promise<void>;
  updateSettings: (userId: string, weeklyGoal: number) => Promise<void>;
  familyEarned: RewardEarned[];
  loadFamilyEarned: () => Promise<void>;
  fulfillReward: (rewardId: string, libraryItemId: string, note?: string) => Promise<void>;
  addLibraryItem: (data: NewLibraryItem) => Promise<void>;
  updateLibraryItem: (id: string, updates: LibraryItemUpdate) => Promise<void>;
  refresh: () => Promise<void>;
}

const EMPTY_TODAY = { weeklyGoal: 50, weekPoints: 0, monthPoints: 0, tiers: [], justEarned: [] };

export function useRewards(): UseRewardsReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [today, setToday] = useState<TodayPayload>({ status: 'success', ...EMPTY_TODAY });
  const [earned, setEarned] = useState<RewardEarned[]>([]);
  const [library, setLibrary] = useState<RewardLibraryItem[]>([]);
  const [familySettings, setFamilySettings] = useState<RewardSettingsWithMember[]>([]);
  const [familyEarned, setFamilyEarned] = useState<RewardEarned[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(
    () => ({ headers: { 'x-user-id': userId as string } }),
    [userId],
  );

  const refresh = useCallback(async () => {
    if (!userId) {
      setToday({ status: 'success', ...EMPTY_TODAY });
      setEarned([]);
      setLibrary([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [todayRes, earnedRes, libraryRes] = await Promise.all([
        apiClient.get<TodayPayload>('/api/rewards/today', headers()),
        apiClient.get<EarnedResponse>('/api/rewards/earned?scope=mine', headers()),
        apiClient.get<LibraryResponse>('/api/rewards/library', headers()),
      ]);
      setToday(todayRes.data ?? { status: 'success', ...EMPTY_TODAY });
      setEarned(earnedRes.data?.earned ?? []);
      setLibrary(libraryRes.data?.library ?? []);
    } catch (err) {
      console.error('Failed to fetch rewards:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rewards');
    } finally {
      setLoading(false);
    }
  }, [userId, headers]);

  const loadFamilySettings = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiClient.get<FamilySettingsResponse>(
        '/api/rewards/settings?scope=family',
        headers(),
      );
      setFamilySettings(res.data?.settings ?? []);
    } catch (err) {
      console.error('Failed to fetch family reward settings:', err);
    }
  }, [userId, headers]);

  const loadFamilyEarned = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiClient.get<EarnedResponse>('/api/rewards/earned?scope=family', headers());
      setFamilyEarned(res.data?.earned ?? []);
    } catch (err) {
      console.error('Failed to fetch family earned rewards:', err);
    }
  }, [userId, headers]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateSettings = useCallback(
    async (targetUserId: string, weeklyGoal: number) => {
      if (!userId) throw new Error('Not signed in');
      await apiClient.patch(`/api/rewards/settings/${targetUserId}`, { weeklyGoal }, headers());
      await Promise.all([refresh(), loadFamilySettings()]);
    },
    [userId, headers, refresh, loadFamilySettings],
  );

  const fulfillReward = useCallback(
    async (rewardId: string, libraryItemId: string, note?: string) => {
      if (!userId) throw new Error('Not signed in');
      await apiClient.post(
        `/api/rewards/earned/${rewardId}/fulfill`,
        { libraryItemId, note },
        headers(),
      );
      await Promise.all([refresh(), loadFamilyEarned()]);
    },
    [userId, headers, refresh, loadFamilyEarned],
  );

  const addLibraryItem = useCallback(
    async (data: NewLibraryItem) => {
      if (!userId) throw new Error('Not signed in');
      await apiClient.post('/api/rewards/library', data, headers());
      await refresh();
    },
    [userId, headers, refresh],
  );

  const updateLibraryItem = useCallback(
    async (id: string, updates: LibraryItemUpdate) => {
      if (!userId) throw new Error('Not signed in');
      await apiClient.patch(`/api/rewards/library/${id}`, updates, headers());
      await refresh();
    },
    [userId, headers, refresh],
  );

  return {
    weeklyGoal: today.weeklyGoal,
    weekPoints: today.weekPoints,
    monthPoints: today.monthPoints,
    tiers: today.tiers,
    justEarned: today.justEarned,
    earned,
    library,
    loading,
    error,
    familySettings,
    loadFamilySettings,
    updateSettings,
    familyEarned,
    loadFamilyEarned,
    fulfillReward,
    addLibraryItem,
    updateLibraryItem,
    refresh,
  };
}
