import { getSupabase } from './supabase'
import type { Database } from '../types/database';


export type EnergyUsage = Database['public']['Tables']['energy_usage']['Row'];
export type EnergyGoal = Database['public']['Tables']['energy_goals']['Row'];

class EnergyService {
  /**
   * Get energy usage data (time series)
   */
  async getEnergyUsage(
    daysBack: number = 30,
    deviceId?: string,
  ): Promise<any[]> {
    try {
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      let query = getSupabase()
        .from('energy_usage')
        .select('*')
        .gte('timestamp', startDate.toISOString());

      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }

      const { data, error } = await query.order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch energy usage:', error);
      throw error;
    }
  }

  /**
   * Get energy summary (daily/weekly/monthly)
   */
  async getEnergySummary(
    period: 'daily' | 'weekly' | 'monthly',
    monthsBack: number = 12,
  ): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsBack);

      const { data, error } = await getSupabase()
        .from('energy_summary')
        .select('*')
        .eq('period', period)
        .gte('period_start', startDate.toISOString().split('T')[0])
        .order('period_start', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch energy summary:', error);
      throw error;
    }
  }

  /**
   * Get current month's energy usage
   */
  async getCurrentMonthUsage(): Promise<number> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data, error } = await getSupabase()
        .from('energy_usage')
        .select('energy_kwh')
        .gte('timestamp', startOfMonth.toISOString());

      if (error) throw error;

      const total = (data || []).reduce((sum, row) => sum + (row.energy_kwh || 0), 0);
      return total;
    } catch (error) {
      console.error('Failed to get current month usage:', error);
      throw error;
    }
  }

  /**
   * Create energy goal
   */
  async createEnergyGoal(
    createdById: string,
    data: {
      goal_type: 'daily' | 'weekly' | 'monthly';
      target_kwh: number;
      start_date: string;
      end_date: string;
      points_reward?: number;
    },
  ): Promise<any> {
    try {
      const { data: goal, error } = await getSupabase()
        .from('energy_goals')
        .insert({
          created_by_id: createdById,
          goal_type: data.goal_type,
          target_kwh: data.target_kwh,
          start_date: data.start_date,
          end_date: data.end_date,
          points_reward: data.points_reward || 100,
        })
        .select()
        .single();

      if (error) throw error;
      return goal;
    } catch (error) {
      console.error('Failed to create energy goal:', error);
      throw error;
    }
  }

  /**
   * Get energy goals for user
   */
  async getEnergyGoals(userId: string): Promise<any[]> {
    try {
      const { data, error } = await getSupabase()
        .from('energy_goals')
        .select('*')
        .eq('created_by_id', userId)
        .eq('status', 'active')
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch energy goals:', error);
      throw error;
    }
  }

  /**
   * Record energy usage data (from SmartThings)
   */
  async recordEnergyUsage(
    deviceId: string,
    deviceName: string,
    deviceType: string,
    powerWatts: number,
    energyKwh: number,
  ): Promise<any> {
    try {
      const { data, error } = await getSupabase()
        .from('energy_usage')
        .insert({
          device_id: deviceId,
          device_name: deviceName,
          device_type: deviceType,
          power_watts: powerWatts,
          energy_kwh: energyKwh,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to record energy usage:', error);
      throw error;
    }
  }

  /**
   * Get device-level energy usage
   */
  async getDeviceEnergyUsage(deviceId: string, daysBack: number = 30): Promise<any[]> {
    try {
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      const { data, error } = await getSupabase()
        .from('energy_usage')
        .select('*')
        .eq('device_id', deviceId)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch device energy usage:', error);
      throw error;
    }
  }
}

// Singleton pattern
let energyService: EnergyService;

export function getEnergyService(): EnergyService {
  if (!energyService) {
    energyService = new EnergyService();
  }
  return energyService;
}




