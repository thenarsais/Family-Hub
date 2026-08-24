import { query, queryOne } from '../database/connection';
import * as PointsRepository from '../database/repositories/PointsRepository';
import type { ActivityPoints } from '../database/repositories/PointsRepository';

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

interface ChoreRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  time_slot: 'morning' | 'afternoon' | 'evening';
  points_value: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface ChoreCompletionRow {
  id: string;
  chore_id: string;
  user_id: string;
  completed_at: string;
  points_earned: number;
}

interface ChoreProgressRow {
  total_completed: string | null;
  this_week: string | null;
  this_month: string | null;
  points_earned: string | null;
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
    const result = await queryOne<ChoreRow>(
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
    const results = await query<ChoreRow>(
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
    const chore = await queryOne<Pick<ChoreRow, 'points_value'>>(
      'SELECT points_value FROM chores WHERE id = $1 AND user_id = $2',
      [choreId, userId]
    );

    if (!chore) throw new Error('Chore not found');

    // Record completion
    const completion = await queryOne<ChoreCompletionRow>(
      `INSERT INTO chore_completions (chore_id, user_id, points_earned)
       VALUES ($1, $2, $3)
       RETURNING id, chore_id, user_id, completed_at, points_earned`,
      [choreId, userId, chore.points_value]
    );

    if (!completion) throw new Error('Failed to record chore completion');

    // Award points via the one real points ledger (activity_points), not a
    // separate chores-only ledger -- see 002_chores_and_learning_schema.sql.
    await PointsRepository.addPoints(userId, chore.points_value, 'chore', `Completed: ${choreId}`);

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
    const results = await queryOne<ChoreProgressRow>(
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
   * Get user's points summary (delegates to the one real points ledger,
   * activity_points, via PointsRepository -- see
   * 002_chores_and_learning_schema.sql for why this used to be a separate,
   * disconnected ledger that never showed up anywhere real)
   */
  async getPointsSummary(userId: string): Promise<{
    totalPoints: number;
    dailyPoints: number;
    weeklyPoints: number;
    monthlyPoints: number;
  }> {
    const [totalPoints, dailyPoints, weeklyPoints, monthlyPoints] = await Promise.all([
      PointsRepository.getTotalPoints(userId),
      PointsRepository.getPointsToday(userId),
      PointsRepository.getPointsThisWeek(userId),
      PointsRepository.getPointsThisMonth(userId),
    ]);

    return { totalPoints, dailyPoints, weeklyPoints, monthlyPoints };
  }

  /**
   * Get point transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 50): Promise<ActivityPoints[]> {
    return PointsRepository.getPointsHistory(userId, limit);
  }

  private mapChore(row: ChoreRow): Chore {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description ?? undefined,
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
