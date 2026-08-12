import { getSupabase } from './supabase'
import type { Database } from '../types/database';


export type ActivityLogEntry = Database['public']['Tables']['activity_log']['Row'];

class ActivityLogService {
  /**
   * Get activity log for user
   */
  async getUserActivity(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await getSupabase()
        .from('activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
      throw error;
    }
  }

  /**
   * Get family activity log
   */
  async getFamilyActivity(familyId: string, limit: number = 100): Promise<any[]> {
    try {
      // Get family members
      const { data: members } = await getSupabase()
        .from('family_members')
        .select('user_id')
        .eq('family_id', familyId)
        .eq('is_active', true);

      if (!members || members.length === 0) {
        return [];
      }

      const userIds = members.map((m) => m.user_id);

      // Get activity for all members
      const { data, error } = await getSupabase()
        .from('activity_log')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch family activity:', error);
      throw error;
    }
  }

  /**
   * Log an activity
   */
  async logActivity(
    userId: string,
    data: {
      activity_type: string;
      action: string;
      points_earned?: number;
      achievement_title?: string;
      related_item_id?: string;
      related_item_type?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<any> {
    try {
      const { data: entry, error } = await getSupabase()
        .from('activity_log')
        .insert({
          user_id: userId,
          activity_type: data.activity_type,
          action: data.action,
          points_earned: data.points_earned || 0,
          achievement_title: data.achievement_title,
          related_item_id: data.related_item_id,
          related_item_type: data.related_item_type,
          metadata: data.metadata,
        })
        .select()
        .single();

      if (error) throw error;
      return entry;
    } catch (error) {
      console.error('Failed to log activity:', error);
      throw error;
    }
  }

  /**
   * Get activity by type
   */
  async getActivityByType(userId: string, activityType: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await getSupabase()
        .from('activity_log')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_type', activityType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch activity by type:', error);
      throw error;
    }
  }

  /**
   * Get activity statistics for user
   */
  async getActivityStats(userId: string, daysBack: number = 7): Promise<Record<string, number>> {
    try {
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      const { data, error } = await getSupabase()
        .from('activity_log')
        .select('activity_type')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Count by type
      const stats: Record<string, number> = {};
      (data || []).forEach((entry) => {
        stats[entry.activity_type] = (stats[entry.activity_type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get activity stats:', error);
      throw error;
    }
  }

  /**
   * Get total points earned by user (from activity log)
   */
  async getTotalPointsFromActivity(userId: string): Promise<number> {
    try {
      const { data, error } = await getSupabase()
        .from('activity_log')
        .select('points_earned')
        .eq('user_id', userId);

      if (error) throw error;

      const total = (data || []).reduce((sum, entry) => sum + (entry.points_earned || 0), 0);
      return total;
    } catch (error) {
      console.error('Failed to get total points:', error);
      throw error;
    }
  }
}

// Singleton pattern
let activityLogService: ActivityLogService;

export function getActivityLogService(): ActivityLogService {
  if (!activityLogService) {
    activityLogService = new ActivityLogService();
  }
  return activityLogService;
}




