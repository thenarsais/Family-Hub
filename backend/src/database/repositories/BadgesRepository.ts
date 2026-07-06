/**
 * Badges Repository
 * Database queries for badges and user_badges tables
 */

import { query, queryOne, queryAll, queryCount, transaction } from '../db';
import { getOrSet, del, delPattern } from '../cache';

// ================================================
// TYPE DEFINITIONS
// ================================================

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon_emoji: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points_required: number;
  created_at: Date;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: Date;
}

// ================================================
// BADGE QUERIES
// ================================================

/**
 * Get badge by ID
 */
export async function getBadgeById(badgeId: string): Promise<Badge | null> {
  return getOrSet(
    `badge:${badgeId}`,
    () =>
      queryOne<Badge>(
        'SELECT * FROM badges WHERE id = $1',
        [badgeId]
      ),
    3600
  );
}

/**
 * Get all badges by category
 */
export async function getBadgesByCategory(category: string): Promise<Badge[]> {
  return getOrSet(
    `badges:category:${category}`,
    () =>
      queryAll<Badge>(
        'SELECT * FROM badges WHERE category = $1 ORDER BY points_required ASC',
        [category]
      ),
    3600
  );
}

/**
 * Get all badges by tier
 */
export async function getBadgesByTier(
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
): Promise<Badge[]> {
  return queryAll<Badge>(
    'SELECT * FROM badges WHERE tier = $1 ORDER BY category ASC',
    [tier]
  );
}

/**
 * Get all badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  return getOrSet(
    'badges:all',
    () =>
      queryAll<Badge>(
        'SELECT * FROM badges ORDER BY category ASC, tier ASC'
      ),
    3600
  );
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return queryCount('SELECT COUNT(*) as count FROM badges');
}

// ================================================
// USER BADGE QUERIES
// ================================================

/**
 * Get badges earned by user
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  return getOrSet(
    `user:${userId}:badges`,
    () =>
      queryAll<UserBadge>(
        `SELECT ub.* FROM user_badges ub
         WHERE ub.user_id = $1
         ORDER BY ub.earned_at DESC`,
        [userId]
      ),
    1800
  );
}

/**
 * Get user badges with details
 */
export async function getUserBadgesWithDetails(
  userId: string
): Promise<(UserBadge & Badge)[]> {
  return getOrSet(
    `user:${userId}:badges:detailed`,
    () =>
      queryAll<UserBadge & Badge>(
        `SELECT ub.*, b.* FROM user_badges ub
         INNER JOIN badges b ON ub.badge_id = b.id
         WHERE ub.user_id = $1
         ORDER BY b.tier DESC, b.points_required DESC`,
        [userId]
      ),
    1800
  );
}

/**
 * Get earned badge count by category
 */
export async function getUserBadgeCountByCategory(
  userId: string,
  category: string
): Promise<number> {
  return queryCount(
    `SELECT COUNT(*) as count FROM user_badges ub
     INNER JOIN badges b ON ub.badge_id = b.id
     WHERE ub.user_id = $1 AND b.category = $2`,
    [userId, category]
  );
}

/**
 * Check if user has badge
 */
export async function userHasBadge(
  userId: string,
  badgeId: string
): Promise<boolean> {
  const result = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM user_badges WHERE user_id = $1 AND badge_id = $2) as exists`,
    [userId, badgeId]
  );

  return result?.exists || false;
}

/**
 * Award badge to user
 */
export async function awardBadge(
  userId: string,
  badgeId: string
): Promise<UserBadge> {
  // Check if already earned
  const existing = await userHasBadge(userId, badgeId);
  if (existing) {
    throw new Error('Badge already earned');
  }

  const result = await queryOne<UserBadge>(
    `INSERT INTO user_badges (user_id, badge_id)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, badgeId]
  );

  if (!result) throw new Error('Failed to award badge');

  // Clear cache
  await del(`user:${userId}:badges`, `user:${userId}:badges:detailed`);

  return result;
}

/**
 * Revoke badge from user
 */
export async function revokeBadge(
  userId: string,
  badgeId: string
): Promise<void> {
  await query(
    'DELETE FROM user_badges WHERE user_id = $1 AND badge_id = $2',
    [userId, badgeId]
  );

  // Clear cache
  await del(`user:${userId}:badges`, `user:${userId}:badges:detailed`);
}

/**
 * Get badges earned in date range
 */
export async function getBadgesEarnedInRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<UserBadge[]> {
  return queryAll<UserBadge>(
    `SELECT ub.* FROM user_badges ub
     WHERE ub.user_id = $1
     AND ub.earned_at >= $2
     AND ub.earned_at <= $3
     ORDER BY ub.earned_at DESC`,
    [userId, startDate, endDate]
  );
}

/**
 * Get users who earned a specific badge
 */
export async function getUsersWithBadge(badgeId: string): Promise<string[]> {
  const results = await queryAll<{ user_id: string }>(
    `SELECT DISTINCT user_id FROM user_badges WHERE badge_id = $1`,
    [badgeId]
  );

  return results.map(r => r.user_id);
}

/**
 * Clear all badges for user (admin operation)
 */
export async function clearUserBadges(userId: string): Promise<void> {
  await query(
    'DELETE FROM user_badges WHERE user_id = $1',
    [userId]
  );

  // Clear cache
  await del(`user:${userId}:badges`, `user:${userId}:badges:detailed`);
}

export default {
  getBadgeById,
  getBadgesByCategory,
  getBadgesByTier,
  getAllBadges,
  getBadgeCount,
  getUserBadges,
  getUserBadgesWithDetails,
  getUserBadgeCountByCategory,
  userHasBadge,
  awardBadge,
  revokeBadge,
  getBadgesEarnedInRange,
  getUsersWithBadge,
  clearUserBadges,
};
