import { useState, useEffect } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient, type ApiEnvelope } from '../services/api';
import { useAuth } from './useAuth';

type ActivityLogEntry = components['schemas']['ActivityLogEntry'];

interface UseActivityLogReturn {
  activity: ActivityLogEntry[];
  familyActivity: ActivityLogEntry[];
  stats: Record<string, number>;
  loading: boolean;
  error: string | null;
  logActivity: (
    activityType: string,
    action: string,
    pointsEarned?: number,
    achievementTitle?: string,
  ) => Promise<void>;
  refreshActivity: () => Promise<void>;
  refreshFamilyActivity: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export function useActivityLog(): UseActivityLogReturn {
  const { user } = useAuth();
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [familyActivity, setFamilyActivity] = useState<ActivityLogEntry[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) return;

      const response = await apiClient.get<ApiEnvelope<ActivityLogEntry[]>>('/api/activity/feed', {
        headers: { 'x-user-id': user.id },
      });

      setActivity(response.data?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch activity:', err);
      setError(err.message || 'Failed to fetch activity');
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyActivity = async () => {
    try {
      if (!user?.id) return;

      const response = await apiClient.get<ApiEnvelope<ActivityLogEntry[]>>('/api/activity/family-feed', {
        headers: { 'x-user-id': user.id },
      });

      setFamilyActivity(response.data?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch family activity:', err);
    }
  };

  const fetchStats = async () => {
    try {
      if (!user?.id) return;

      const response = await apiClient.get<ApiEnvelope<Record<string, number>>>('/api/activity/stats', {
        headers: { 'x-user-id': user.id },
      });

      setStats(response.data?.data || {});
    } catch (err: any) {
      console.error('Failed to fetch activity stats:', err);
    }
  };

  useEffect(() => {
    fetchActivity();
    fetchFamilyActivity();
    fetchStats();
  }, [user?.id]);

  const logActivity = async (
    activityType: string,
    action: string,
    pointsEarned?: number,
    achievementTitle?: string,
  ): Promise<void> => {
    try {
      if (!user?.id) throw new Error('User not authenticated');

      await apiClient.post(
        '/api/activity/log',
        {
          user_id: user.id,
          activity_type: activityType,
          action,
          points_earned: pointsEarned || 0,
          achievement_title: achievementTitle,
        },
        { headers: { 'x-user-id': user.id } },
      );

      // Refresh activity logs
      await fetchActivity();
      await fetchStats();
    } catch (err: any) {
      console.error('Failed to log activity:', err);
      throw err;
    }
  };

  return {
    activity,
    familyActivity,
    stats,
    loading,
    error,
    logActivity,
    refreshActivity: fetchActivity,
    refreshFamilyActivity: fetchFamilyActivity,
    refreshStats: fetchStats,
  };
}
