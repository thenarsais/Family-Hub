"use strict";
/**
 * Badges Repository
 * Database queries for badges and user_badges tables
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBadgeById = getBadgeById;
exports.getBadgesByCategory = getBadgesByCategory;
exports.getBadgesByTier = getBadgesByTier;
exports.getAllBadges = getAllBadges;
exports.getBadgeCount = getBadgeCount;
exports.getUserBadges = getUserBadges;
exports.getUserBadgesWithDetails = getUserBadgesWithDetails;
exports.getUserBadgeCountByCategory = getUserBadgeCountByCategory;
exports.userHasBadge = userHasBadge;
exports.awardBadge = awardBadge;
exports.revokeBadge = revokeBadge;
exports.getBadgesEarnedInRange = getBadgesEarnedInRange;
exports.getUsersWithBadge = getUsersWithBadge;
exports.clearUserBadges = clearUserBadges;
const db_1 = require("../db");
const cache_1 = require("../cache");
// ================================================
// BADGE QUERIES
// ================================================
/**
 * Get badge by ID
 */
async function getBadgeById(badgeId) {
    return (0, cache_1.getOrSet)(`badge:${badgeId}`, () => (0, db_1.queryOne)('SELECT * FROM badges WHERE id = $1', [badgeId]), 3600);
}
/**
 * Get all badges by category
 */
async function getBadgesByCategory(category) {
    return (0, cache_1.getOrSet)(`badges:category:${category}`, () => (0, db_1.queryAll)('SELECT * FROM badges WHERE category = $1 ORDER BY points_required ASC', [category]), 3600);
}
/**
 * Get all badges by tier
 */
async function getBadgesByTier(tier) {
    return (0, db_1.queryAll)('SELECT * FROM badges WHERE tier = $1 ORDER BY category ASC', [tier]);
}
/**
 * Get all badges
 */
async function getAllBadges() {
    return (0, cache_1.getOrSet)('badges:all', () => (0, db_1.queryAll)('SELECT * FROM badges ORDER BY category ASC, tier ASC'), 3600);
}
/**
 * Get badge count
 */
async function getBadgeCount() {
    return (0, db_1.queryCount)('SELECT COUNT(*) as count FROM badges');
}
// ================================================
// USER BADGE QUERIES
// ================================================
/**
 * Get badges earned by user
 */
async function getUserBadges(userId) {
    return (0, cache_1.getOrSet)(`user:${userId}:badges`, () => (0, db_1.queryAll)(`SELECT ub.* FROM user_badges ub
         WHERE ub.user_id = $1
         ORDER BY ub.earned_at DESC`, [userId]), 1800);
}
/**
 * Get user badges with details
 */
async function getUserBadgesWithDetails(userId) {
    return (0, cache_1.getOrSet)(`user:${userId}:badges:detailed`, () => (0, db_1.queryAll)(`SELECT ub.*, b.* FROM user_badges ub
         INNER JOIN badges b ON ub.badge_id = b.id
         WHERE ub.user_id = $1
         ORDER BY b.tier DESC, b.points_required DESC`, [userId]), 1800);
}
/**
 * Get earned badge count by category
 */
async function getUserBadgeCountByCategory(userId, category) {
    return (0, db_1.queryCount)(`SELECT COUNT(*) as count FROM user_badges ub
     INNER JOIN badges b ON ub.badge_id = b.id
     WHERE ub.user_id = $1 AND b.category = $2`, [userId, category]);
}
/**
 * Check if user has badge
 */
async function userHasBadge(userId, badgeId) {
    const result = await (0, db_1.queryOne)(`SELECT EXISTS(SELECT 1 FROM user_badges WHERE user_id = $1 AND badge_id = $2) as exists`, [userId, badgeId]);
    return result?.exists || false;
}
/**
 * Award badge to user
 */
async function awardBadge(userId, badgeId) {
    // Check if already earned
    const existing = await userHasBadge(userId, badgeId);
    if (existing) {
        throw new Error('Badge already earned');
    }
    const result = await (0, db_1.queryOne)(`INSERT INTO user_badges (user_id, badge_id)
     VALUES ($1, $2)
     RETURNING *`, [userId, badgeId]);
    if (!result)
        throw new Error('Failed to award badge');
    // Clear cache
    await (0, cache_1.del)(`user:${userId}:badges`, `user:${userId}:badges:detailed`);
    return result;
}
/**
 * Revoke badge from user
 */
async function revokeBadge(userId, badgeId) {
    await (0, db_1.query)('DELETE FROM user_badges WHERE user_id = $1 AND badge_id = $2', [userId, badgeId]);
    // Clear cache
    await (0, cache_1.del)(`user:${userId}:badges`, `user:${userId}:badges:detailed`);
}
/**
 * Get badges earned in date range
 */
async function getBadgesEarnedInRange(userId, startDate, endDate) {
    return (0, db_1.queryAll)(`SELECT ub.* FROM user_badges ub
     WHERE ub.user_id = $1
     AND ub.earned_at >= $2
     AND ub.earned_at <= $3
     ORDER BY ub.earned_at DESC`, [userId, startDate, endDate]);
}
/**
 * Get users who earned a specific badge
 */
async function getUsersWithBadge(badgeId) {
    const results = await (0, db_1.queryAll)(`SELECT DISTINCT user_id FROM user_badges WHERE badge_id = $1`, [badgeId]);
    return results.map(r => r.user_id);
}
/**
 * Clear all badges for user (admin operation)
 */
async function clearUserBadges(userId) {
    await (0, db_1.query)('DELETE FROM user_badges WHERE user_id = $1', [userId]);
    // Clear cache
    await (0, cache_1.del)(`user:${userId}:badges`, `user:${userId}:badges:detailed`);
}
exports.default = {
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
//# sourceMappingURL=BadgesRepository.js.map