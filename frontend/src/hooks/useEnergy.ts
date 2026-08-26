import { useState, useEffect } from 'react';
import type { components } from '@/types/api-generated';
import { apiClient, type ApiEnvelope } from '../services/api';
import { useAuth } from './useAuth';

type EnergyGoal = components['schemas']['EnergyGoal'];

interface UseEnergyReturn {
  currentMonth: number;
  goals: EnergyGoal[];
  loading: boolean;
  error: string | null;
  createGoal: (
    goalType: string,
    targetKwh: number,
    startDate: string,
    endDate: string,
    pointsReward?: number,
  ) => Promise<EnergyGoal>;
  refresh: () => Promise<void>;
}

export function useEnergy(): UseEnergyReturn {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(0);
  const [goals, setGoals] = useState<EnergyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) return;

      const [usageResponse, goalsResponse] = await Promise.all([
        apiClient.get<ApiEnvelope<{ total_kwh?: number | null }>>('/api/energy/current-month', {
          headers: { 'x-user-id': user.id },
        }),
        apiClient.get<ApiEnvelope<EnergyGoal[]>>('/api/energy/goals', {
          headers: { 'x-user-id': user.id },
        }),
      ]);

      setCurrentMonth(usageResponse.data?.data?.total_kwh || 0);
      setGoals(goalsResponse.data?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch energy data:', err);
      setError(err.message || 'Failed to fetch energy data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const createGoal = async (
    goalType: string,
    targetKwh: number,
    startDate: string,
    endDate: string,
    pointsReward?: number,
  ): Promise<EnergyGoal> => {
    if (!user?.id) throw new Error('User not authenticated');

    const response = await apiClient.post<ApiEnvelope<EnergyGoal>>(
      '/api/energy/goals',
      { goal_type: goalType, target_kwh: targetKwh, start_date: startDate, end_date: endDate, points_reward: pointsReward },
      { headers: { 'x-user-id': user.id } },
    );

    const newGoal = response.data?.data;
    setGoals((prev) => [...prev, newGoal]);
    return newGoal;
  };

  return {
    currentMonth,
    goals,
    loading,
    error,
    createGoal,
    refresh: fetchData,
  };
}
