import { query, queryOne } from '../database/connection';

export interface Chore {
  id: string;
  userId: string;
  name: string;
  description?: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  pointsValue: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChoreCompletion {
  id: string;
  choreId: string;
  userId: string;
  completedAt: Date;
  pointsEarned: number;
}

export class ChoreService {
  /**
   * Create a new chore
   */
  async createChore(
    userId: string,
    name: string,
    description: string | undefined,
    timeSlot: string,
    pointsValue: number
  ): Promise<Chore> {
    const result = await queryOne<any>(
      `INSERT INTO chores (user_id, name, description, time_slot, points_value, enabled)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, user_id, name, description, time_slot, points_value, enabled, created_at, updated_at`,
      [userId, name, description || null, timeSlot, pointsValue]
    );

    if (!result) throw new Error('Failed to create chore');

    return this.mapChore(result);
  }

  /**
   * Get chores for a user
   */
  async getUserChores(userId: string): Promise<Chore[]> {
    const results = await query<any>(
      `SELECT id, user_id, name, description, time_slot, points_value, enabled, created_at, updated_at
       FROM chores WHERE user_id = $1 AND enabled = true ORDER BY time_slot, name`,
      [userId]
    );

    return results.rows.map(r => this.mapChore(r));
  }

  /**
   * Complete a chore and award points
   */
  async completeChore(userId: string, choreId: string): Promise<ChoreCompletion> {
    // Get chore details
    const chore = await queryOne<any>(
      'SELECT points_value FROM chores WHERE id = $1 AND user_id = $2',
      [choreId, userId]
    );

    if (!chore) throw new Error('Chore not found');

    // Record completion
    const completion = await queryOne<any>(
      `INSERT INTO chore_completions (chore_id, user_id, points_earned)
       VALUES ($1, $2, $3)
       RETURNING id, chore_id, user_id, completed_at, points_earned`,
      [choreId, userId, chore.points_value]
    );

    if (!completion) throw new Error('Failed to record chore completion');

    // Award points
    await this.awardPoints(userId, chore.points_value, 'chore', `Completed: ${choreId}`);

    return {
      id: completion.id,
      choreId: completion.chore_id,
      userId: completion.user_id,
      completedAt: new Date(completion.completed_at),
      pointsEarned: completion.points_earned,
    };
  }

  /**
   * Get chore progress/statistics for user
   */
  async getChoreProgress(userId: string): Promise<{
    totalCompleted: number;
    thisWeek: number;
    thisMonth: number;
    pointsEarned: number;
  }> {
    const results = await queryOne<any>(
      `SELECT
        COUNT(*) as total_completed,
        SUM(CASE WHEN completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as this_week,
        SUM(CASE WHEN completed_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) as this_month,
        SUM(points_earned) as points_earned
       FROM chore_completions WHERE user_id = $1`,
      [userId]
    );

    return {
      totalCompleted: parseInt(results?.total_completed || '0'),
      thisWeek: parseInt(results?.this_week || '0'),
      thisMonth: parseInt(results?.this_month || '0'),
      pointsEarned: parseInt(results?.points_earned || '0'),
    };
  }

  /**
   * Award points to user
   */
  async awardPoints(
    userId: string,
    amount: number,
    source: string,
    description?: string
  ): Promise<void> {
    // Record transaction
    await query(
      `INSERT INTO point_transactions (user_id, amount, source, description)
       VALUES ($1, $2, $3, $4)`,
      [userId, amount, source, description || null]
    );

    // Update user points totals
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    await query(
      `INSERT INTO user_points (user_id, total_points, daily_points, weekly_points, monthly_points)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
       total_points = user_points.total_points + $2,
       daily_points = CASE
         WHEN last_reset_daily = CURRENT_DATE THEN user_points.daily_points + $2
         ELSE $2
       END,
       weekly_points = CASE
         WHEN last_reset_weekly >= CURRENT_DATE - INTERVAL '7 days' THEN user_points.weekly_points + $2
         ELSE $2
       END,
       monthly_points = CASE
         WHEN last_reset_monthly >= CURRENT_DATE - INTERVAL '30 days' THEN user_points.monthly_points + $2
         ELSE $2
       END,
       last_reset_daily = CASE WHEN last_reset_daily != CURRENT_DATE THEN CURRENT_DATE ELSE last_reset_daily END,
       last_reset_weekly = CASE WHEN last_reset_weekly < CURRENT_DATE - INTERVAL '7 days' THEN CURRENT_DATE ELSE last_reset_weekly END,
       last_reset_monthly = CASE WHEN last_reset_monthly < CURRENT_DATE - INTERVAL '30 days' THEN CURRENT_DATE ELSE last_reset_monthly END,
       updated_at = CURRENT_TIMESTAMP`,
      [userId, amount, amount, amount, amount]
    );
  }

  /**
   * Get user's points summary
   */
  async getPointsSummary(userId: string): Promise<{
    totalPoints: number;
    dailyPoints: number;
    weeklyPoints: number;
    monthlyPoints: number;
  }> {
    const result = await queryOne<any>(
      `SELECT total_points, daily_points, weekly_points, monthly_points
       FROM user_points WHERE user_id = $1`,
      [userId]
    );

    if (!result) {
      return { totalPoints: 0, dailyPoints: 0, weeklyPoints: 0, monthlyPoints: 0 };
    }

    return {
      totalPoints: result.total_points || 0,
      dailyPoints: result.daily_points || 0,
      weeklyPoints: result.weekly_points || 0,
      monthlyPoints: result.monthly_points || 0,
    };
  }

  /**
   * Reset daily points (called at 6 AM)
   */
  async resetDailyPoints(userId: string): Promise<void> {
    await query(
      `UPDATE user_points
       SET daily_points = 0, last_reset_daily = CURRENT_DATE
       WHERE user_id = $1`,
      [userId]
    );
  }

  /**
   * Get point transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 50): Promise<any[]> {
    const results = await query<any>(
      `SELECT user_id, amount, source, description, created_at
       FROM point_transactions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );

    return results.rows;
  }

  private mapChore(row: any): Chore {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      timeSlot: row.time_slot,
      pointsValue: row.points_value,
      enabled: row.enabled,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

let choreService: ChoreService | null = null;

export function getChoreService(): ChoreService {
  if (!choreService) {
    choreService = new ChoreService();
  }
  return choreService;
}
