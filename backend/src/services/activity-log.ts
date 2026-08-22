import { query } from '../database/connection';
import type { Database } from '../types/database';

export type ActivityLogEntry = Database['public']['Tables']['activity_log']['Row'];

class ActivityLogService {
  /**
   * Get activity log for user
   */
  async getUserActivity(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const result = await query<ActivityLogEntry>(
        `SELECT * FROM activity_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
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
      const membersResult = await query<{ user_id: string }>(
        `SELECT user_id FROM family_members WHERE family_id = $1 AND is_active = true`,
        [familyId]
      );

      if (membersResult.rows.length === 0) {
        return [];
      }

      const userIds = membersResult.rows.map((m) => m.user_id);

      const result = await query<ActivityLogEntry>(
        `SELECT * FROM activity_log WHERE user_id = ANY($1) ORDER BY created_at DESC LIMIT $2`,
        [userIds, limit]
      );

      return result.rows;
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
      const result = await query<ActivityLogEntry>(
        `INSERT INTO activity_log
           (user_id, activity_type, action, points_earned, achievement_title, related_item_id, related_item_type, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          userId,
          data.activity_type,
          data.action,
          data.points_earned || 0,
          data.achievement_title || null,
          data.related_item_id || null,
          data.related_item_type || null,
          data.metadata ? JSON.stringify(data.metadata) : null,
        ]
      );

      const entry = result.rows[0];
      if (!entry) throw new Error('Failed to log activity');
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
      const result = await query<ActivityLogEntry>(
        `SELECT * FROM activity_log WHERE user_id = $1 AND activity_type = $2 ORDER BY created_at DESC LIMIT $3`,
        [userId, activityType, limit]
      );
      return result.rows;
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

      const result = await query<{ activity_type: string }>(
        `SELECT activity_type FROM activity_log WHERE user_id = $1 AND created_at >= $2`,
        [userId, startDate.toISOString()]
      );

      const stats: Record<string, number> = {};
      result.rows.forEach((entry) => {
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
      const result = await query<{ total: string }>(
        `SELECT COALESCE(SUM(points_earned), 0) as total FROM activity_log WHERE user_id = $1`,
        [userId]
      );
      return result.rows[0] ? parseInt(result.rows[0].total, 10) : 0;
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
