import { useCallback, useEffect, useState } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient } from '../services/api';
import { useAuth } from './useAuth';

export type KungFuProfile = components['schemas']['KungFuProfile'];
export type KungFuProfileWithMember = components['schemas']['KungFuProfileWithMember'];
export type KungFuLog = components['schemas']['KungFuLog'];

export type KungFuProfileUpdate = Partial<{
  belt: string | null;
  beltSince: string | null;
  pointsPerClass: number;
  pointsPerPractice: number;
}>;

const DEFAULT_PROFILE: KungFuProfile = {
  belt: null,
  beltSince: null,
  pointsPerClass: 15,
  pointsPerPractice: 5,
};
const DEFAULT_COUNTS = { class: 0, practice: 0 };

interface TodayPayload {
  status: string;
  profile: KungFuProfile;
  todayLogs: KungFuLog[];
  weekCounts: { class: number; practice: number };
}

interface FamilyProfilesResponse {
  status: string;
  profiles: KungFuProfileWithMember[];
}

interface UseKungFuReturn {
  profile: KungFuProfile;
  todayLogs: KungFuLog[];
  weekCounts: { class: number; practice: number };
  loading: boolean;
  error: string | null;
  logClass: () => Promise<void>;
  logPractice: () => Promise<void>;
  undo: (logId: string) => Promise<void>;
  familyProfiles: KungFuProfileWithMember[];
  loadFamilyProfiles: () => Promise<void>;
  updateProfile: (userId: string, updates: KungFuProfileUpdate) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useKungFu(): UseKungFuReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [profile, setProfile] = useState<KungFuProfile>(DEFAULT_PROFILE);
  const [todayLogs, setTodayLogs] = useState<KungFuLog[]>([]);
  const [weekCounts, setWeekCounts] = useState(DEFAULT_COUNTS);
  const [familyProfiles, setFamilyProfiles] = useState<KungFuProfileWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(
    () => ({ headers: { 'x-user-id': userId as string } }),
    [userId],
  );

  const applyPayload = (payload: TodayPayload | undefined) => {
    setProfile(payload?.profile ?? DEFAULT_PROFILE);
    setTodayLogs(payload?.todayLogs ?? []);
    setWeekCounts(payload?.weekCounts ?? DEFAULT_COUNTS);
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
      const res = await apiClient.get<TodayPayload>('/api/kungfu/today', headers());
      applyPayload(res.data);
    } catch (err) {
      console.error('Failed to fetch kung fu today:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch kung fu today');
    } finally {
      setLoading(false);
    }
  }, [userId, headers]);

  const loadFamilyProfiles = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiClient.get<FamilyProfilesResponse>(
        '/api/kungfu/profile?scope=family',
        headers(),
      );
      setFamilyProfiles(res.data?.profiles ?? []);
    } catch (err) {
      console.error('Failed to fetch family kung fu profiles:', err);
    }
  }, [userId, headers]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logType = useCallback(
    async (type: 'class' | 'practice') => {
      if (!userId) throw new Error('Not signed in');
      const res = await apiClient.post<TodayPayload>('/api/kungfu/log', { type }, headers());
      applyPayload(res.data);
    },
    [userId, headers],
  );
  const logClass = useCallback(() => logType('class'), [logType]);
  const logPractice = useCallback(() => logType('practice'), [logType]);

  const undo = useCallback(
    async (logId: string) => {
      if (!userId) throw new Error('Not signed in');
      await apiClient.delete(`/api/kungfu/log/${logId}`, headers());
      await refresh();
    },
    [userId, headers, refresh],
  );

  const updateProfile = useCallback(
    async (targetUserId: string, updates: KungFuProfileUpdate) => {
      if (!userId) throw new Error('Not signed in');
      await apiClient.patch(`/api/kungfu/profile/${targetUserId}`, updates, headers());
      await Promise.all([refresh(), loadFamilyProfiles()]);
    },
    [userId, headers, refresh, loadFamilyProfiles],
  );

  return {
    profile,
    todayLogs,
    weekCounts,
    loading,
    error,
    logClass,
    logPractice,
    undo,
    familyProfiles,
    loadFamilyProfiles,
    updateProfile,
    refresh,
  };
}
