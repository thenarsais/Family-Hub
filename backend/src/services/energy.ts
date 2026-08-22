import { query, queryOne } from '../database/connection';
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
      const conditions = ['timestamp >= $1'];
      const values: any[] = [startDate.toISOString()];

      if (deviceId) {
        values.push(deviceId);
        conditions.push(`device_id = $${values.length}`);
      }

      const result = await query<EnergyUsage>(
        `SELECT * FROM energy_usage WHERE ${conditions.join(' AND ')} ORDER BY timestamp DESC`,
        values
      );

      return result.rows;
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

      const result = await query<any>(
        `SELECT * FROM energy_summary
         WHERE period = $1 AND period_start >= $2
         ORDER BY period_start DESC`,
        [period, startDate.toISOString().split('T')[0]]
      );

      return result.rows;
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

      const result = await queryOne<{ total: string }>(
        `SELECT COALESCE(SUM(energy_kwh), 0) as total FROM energy_usage WHERE timestamp >= $1`,
        [startOfMonth.toISOString()]
      );

      return result ? parseFloat(result.total) : 0;
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
      const goal = await queryOne<EnergyGoal>(
        `INSERT INTO energy_goals (created_by_id, goal_type, target_kwh, start_date, end_date, points_reward)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [createdById, data.goal_type, data.target_kwh, data.start_date, data.end_date, data.points_reward || 100]
      );

      if (!goal) throw new Error('Failed to create energy goal');
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
      const result = await query<EnergyGoal>(
        `SELECT * FROM energy_goals WHERE created_by_id = $1 AND status = 'active' ORDER BY start_date DESC`,
        [userId]
      );
      return result.rows;
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
      const result = await queryOne<EnergyUsage>(
        `INSERT INTO energy_usage (device_id, device_name, device_type, power_watts, energy_kwh, timestamp)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         RETURNING *`,
        [deviceId, deviceName, deviceType, powerWatts, energyKwh]
      );

      if (!result) throw new Error('Failed to record energy usage');
      return result;
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

      const result = await query<EnergyUsage>(
        `SELECT * FROM energy_usage WHERE device_id = $1 AND timestamp >= $2 ORDER BY timestamp DESC`,
        [deviceId, startDate.toISOString()]
      );

      return result.rows;
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
