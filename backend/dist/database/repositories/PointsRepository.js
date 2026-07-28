"use strict";
/**
 * Points Repository
 * Database queries for activity_points table
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPoints = addPoints;
exports.getTotalPoints = getTotalPoints;
exports.getPointsHistory = getPointsHistory;
exports.getPointsByActivityType = getPointsByActivityType;
exports.getPointsBreakdown = getPointsBreakdown;
exports.getPointsInRange = getPointsInRange;
exports.getTopUsersByPoints = getTopUsersByPoints;
exports.getPointsToday = getPointsToday;
exports.getPointsThisWeek = getPointsThisWeek;
exports.getPointsThisMonth = getPointsThisMonth;
exports.subtractPoints = subtractPoints;
exports.getTotalPointsAllUsers = getTotalPointsAllUsers;
const db_1 = require("../db");
const cache_1 = require("../cache");
// ================================================
// QUERIES
// ================================================
/**
 * Add points to user
 */
async function addPoints(userId, points, activityType, reason) {
    const result = await (0, db_1.queryOne)(`INSERT INTO activity_points (user_id, activity_type, points, reason)
     VALUES ($1, $2, $3, $4)
     RETURNING *`, [userId, activityType, points, reason]);
    if (!result)
        throw new Error('Failed to add points');
    // Clear cache
    await (0, cache_1.del)(`user:${userId}:points:total`, `user:${userId}:points:history`, `user:${userId}:points:${activityType}`);
    return result;
}
/**
 * Get total points for user
 */
async function getTotalPoints(userId) {
    return (0, cache_1.getOrSet)(`user:${userId}:points:total`, async () => {
        const result = await (0, db_1.queryOne)('SELECT COALESCE(SUM(points), 0) as total FROM activity_points WHERE user_id = $1', [userId]);
        return result ? parseInt(result.total, 10) : 0;
    }, 1800 // Cache for 30 minutes
    );
}
/**
 * Get points history for user
 */
async function getPointsHistory(userId, limit = 100) {
    return (0, cache_1.getOrSet)(`user:${userId}:points:history`, () => (0, db_1.queryAll)(`SELECT * FROM activity_points
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`, [userId, limit]), 1800);
}
/**
 * Get points by activity type for user
 */
async function getPointsByActivityType(userId, activityType) {
    return (0, cache_1.getOrSet)(`user:${userId}:points:${activityType}`, async () => {
        const result = await (0, db_1.queryOne)(`SELECT COALESCE(SUM(points), 0) as total
         FROM activity_points
         WHERE user_id = $1 AND activity_type = $2`, [userId, activityType]);
        return result ? parseInt(result.total, 10) : 0;
    }, 1800);
}
/**
 * Get points breakdown by activity type
 */
async function getPointsBreakdown(userId) {
    return (0, db_1.queryAll)(`SELECT activity_type,
            COALESCE(SUM(points), 0) as total,
            COUNT(*) as count
     FROM activity_points
     WHERE user_id = $1
     GROUP BY activity_type
     ORDER BY total DESC`, [userId]).then(rows => rows.map(r => ({
        activity_type: r.activity_type,
        total: parseInt(r.total, 10),
        count: parseInt(r.count, 10),
    })));
}
/**
 * Get points earned in date range
 */
async function getPointsInRange(userId, startDate, endDate) {
    const result = await (0, db_1.queryOne)(`SELECT COALESCE(SUM(points), 0) as total
     FROM activity_points
     WHERE user_id = $1
     AND created_at >= $2
     AND created_at <= $3`, [userId, startDate, endDate]);
    return result ? parseInt(result.total, 10) : 0;
}
/**
 * Get top users by points
 */
async function getTopUsersByPoints(limit = 10) {
    return (0, db_1.queryAll)(`SELECT user_id,
            COALESCE(SUM(points), 0) as total_points
     FROM activity_points
     GROUP BY user_id
     ORDER BY total_points DESC
     LIMIT $1`, [limit]).then(rows => rows.map(r => ({
        user_id: r.user_id,
        total_points: parseInt(r.total_points, 10),
    })));
}
/**
 * Get points earned today
 */
async function getPointsToday(userId) {
    const result = await (0, db_1.queryOne)(`SELECT COALESCE(SUM(points), 0) as total
     FROM activity_points
     WHERE user_id = $1
     AND DATE(created_at) = CURRENT_DATE`, [userId]);
    return result ? parseInt(result.total, 10) : 0;
}
/**
 * Get points earned this week
 */
async function getPointsThisWeek(userId) {
    const result = await (0, db_1.queryOne)(`SELECT COALESCE(SUM(points), 0) as total
     FROM activity_points
     WHERE user_id = $1
     AND created_at >= NOW() - INTERVAL '7 days'`, [userId]);
    return result ? parseInt(result.total, 10) : 0;
}
/**
 * Get points earned this month
 */
async function getPointsThisMonth(userId) {
    const result = await (0, db_1.queryOne)(`SELECT COALESCE(SUM(points), 0) as total
     FROM activity_points
     WHERE user_id = $1
     AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`, [userId]);
    return result ? parseInt(result.total, 10) : 0;
}
/**
 * Subtract points from user (for penalties)
 */
async function subtractPoints(userId, points, reason) {
    // Add negative points entry
    await addPoints(userId, -points, 'penalty', reason);
}
/**
 * Get total points for all users
 */
async function getTotalPointsAllUsers() {
    const result = await (0, db_1.queryOne)('SELECT COALESCE(SUM(points), 0) as total FROM activity_points');
    return result ? parseInt(result.total, 10) : 0;
}
exports.default = {
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
//# sourceMappingURL=PointsRepository.js.map