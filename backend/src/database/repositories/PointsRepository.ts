/**
 * Points Repository
 * Database queries for activity_points table
 */

import { query, queryOne, queryAll, queryCount } from '../db';
import { getOrSet, del } from '../cache';

// ================================================
// TYPE DEFINITIONS
// ================================================

export interface ActivityPoints {
  id: string;
  user_id: string;
  activity_type: string;
  points: number;
  reason: string;
  created_at: Date;
}

// ================================================
// QUERIES
// ================================================

/**
 * Add points to user
 */
export async function addPoints(
  userId: string,
  points: number,
  activityType: string,
  reason: string
): Promise<ActivityPoints> {
  const result = await queryOne<ActivityPoints>(
    `INSERT INTO activity_points (user_id, activity_type, points, reason)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, activityType, points, reason]
  );

  if (!result) throw new Error('Failed to add points');

  // Clear cache
  await del(
    `user:${userId}:points:total`,
    `user:${userId}:points:history`,
    `user:${userId}:points:${activityType}`
  );

  return result;
}

/**
 * Get total points for user
 */
export async function getTotalPoints(userId: string): Promise<number> {
  return getOrSet(
    `user:${userId}:points:total`,
    async () => {
      const result = await queryOne<{ total: string }>(
        'SELECT COALESCE(SUM(points), 0) as total FROM activity_points WHERE user_id = $1',
        [userId]
      );
      return result ? parseInt(result.total, 10) : 0;
    },
    1800 // Cache for 30 minutes
  );
}

/**
 * Get points history for user
 */
export async function getPointsHistory(
  userId: string,
  limit: number = 100
): Promise<ActivityPoints[]> {
  return getOrSet(
    `user:${userId}:points:history`,
    () =>
      queryAll<ActivityPoints>(
        `SELECT * FROM activity_points
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      ),
    1800
  );
}

/**
 * Get points by activity type for user
 */
export async function getPointsByActivityType(
  userId: string,
  activityType: string
): Promise<number> {
  return getOrSet(
    `user:${userId}:points:${activityType}`,
    async () => {
      const result = await queryOne<{ total: string }>(
        `SELECT COALESCE(SUM(points), 0) as total
         FROM activity_points
         WHERE user_id = $1 AND activity_type = $2`,
        [userId, activityType]
      );
      return result ? parseInt(result.total, 10) : 0;
    },
    1800
  );
}

/**
 * Get points breakdown by activity type
 */
export async function getPointsBreakdown(userId: string): Promise<
  Array<{
    activity_type: string;
    total: number;
    count: number;
  }>
> {
  return queryAll<{
    activity_type: string;
    total: string;
    count: string;
  }>(
    `SELECT activity_type,
            COALESCE(SUM(points), 0) as total,
            COUNT(*) as count
     FROM activity_points
     WHERE user_id = $1
     GROUP BY activity_type
     ORDER BY total DESC`,
    [userId]
  ).then(rows =>
    rows.map(r => ({
      activity_type: r.activity_type,
      total: parseInt(r.total, 10),
      count: parseInt(r.count, 10),
    }))
  );
}

/**
 * Get points earned in date range
 */
export async function getPointsInRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(points), 0) as total
     FROM activity_points
     WHERE user_id = $1
     AND created_at >= $2
     AND created_at <= $3`,
    [userId, startDate, endDate]
  );

  return result ? parseInt(result.total, 10) : 0;
}

/**
 * Get top users by points
 */
export async function getTopUsersByPoints(
  limit: number = 10
): Promise<
  Array<{
    user_id: string;
    total_points: number;
  }>
> {
  return queryAll<{
    user_id: string;
    total_points: string;
  }>(
    `SELECT user_id,
            COALESCE(SUM(points), 0) as total_points
     FROM activity_points
     GROUP BY user_id
     ORDER BY total_points DESC
     LIMIT $1`,
    [limit]
  ).then(rows =>
    rows.map(r => ({
      user_id: r.user_id,
      total_points: parseInt(r.total_points, 10),
    }))
  );
}

/**
 * Get points earned today
 */
export async function getPointsToday(userId: string): Promise<number> {
  const result = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(points), 0) as total
     FROM activity_points
     WHERE user_id = $1
     AND DATE(created_at) = CURRENT_DATE`,
    [userId]
  );

  return result ? parseInt(result.total, 10) : 0;
}

/**
 * Get points earned this week
 */
export async function getPointsThisWeek(userId: string): Promise<number> {
  const result = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(points), 0) as total
     FROM activity_points
     WHERE user_id = $1
     AND created_at >= NOW() - INTERVAL '7 days'`,
    [userId]
  );

  return result ? parseInt(result.total, 10) : 0;
}

/**
 * Get points earned this month
 */
export async function getPointsThisMonth(userId: string): Promise<number> {
  const result = await queryOne<{ total: string }>(
    `SELECT COALESCE(SUM(points), 0) as total
     FROM activity_points
     WHERE user_id = $1
     AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`,
    [userId]
  );

  return result ? parseInt(result.total, 10) : 0;
}

/**
 * Subtract points from user (for penalties)
 */
export async function subtractPoints(
  userId: string,
  points: number,
  reason: string
): Promise<void> {
  // Add negative points entry
  await addPoints(userId, -points, 'penalty', reason);
}

/**
 * Get total points for all users
 */
export async function getTotalPointsAllUsers(): Promise<number> {
  const result = await queryOne<{ total: string }>(
    'SELECT COALESCE(SUM(points), 0) as total FROM activity_points'
  );

  return result ? parseInt(result.total, 10) : 0;
}

export default {
  addPoints,
  getTotalPoints,
  getPointsHistory,
  getPointsByActivityType,
  getPointsBreakdown,
  getPointsInRange,
  getTopUsersByPoints,
  getPointsToday,
  getPointsThisWeek,
  getPointsThisMonth,
  subtractPoints,
  getTotalPointsAllUsers,
};
