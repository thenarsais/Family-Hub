/**
 * Points Repository
 * Database queries for activity_points table
 */
export interface ActivityPoints {
    id: string;
    user_id: string;
    activity_type: string;
    points: number;
    reason: string;
    created_at: Date;
}
/**
 * Add points to user
 */
export declare function addPoints(userId: string, points: number, activityType: string, reason: string): Promise<ActivityPoints>;
/**
 * Get total points for user
 */
export declare function getTotalPoints(userId: string): Promise<number>;
/**
 * Get points history for user
 */
export declare function getPointsHistory(userId: string, limit?: number): Promise<ActivityPoints[]>;
/**
 * Get points by activity type for user
 */
export declare function getPointsByActivityType(userId: string, activityType: string): Promise<number>;
/**
 * Get points breakdown by activity type
 */
export declare function getPointsBreakdown(userId: string): Promise<Array<{
    activity_type: string;
    total: number;
    count: number;
}>>;
/**
 * Get points earned in date range
 */
export declare function getPointsInRange(userId: string, startDate: Date, endDate: Date): Promise<number>;
/**
 * Get top users by points
 */
export declare function getTopUsersByPoints(limit?: number): Promise<Array<{
    user_id: string;
    total_points: number;
}>>;
/**
 * Get points earned today
 */
export declare function getPointsToday(userId: string): Promise<number>;
/**
 * Get points earned this week
 */
export declare function getPointsThisWeek(userId: string): Promise<number>;
/**
 * Get points earned this month
 */
export declare function getPointsThisMonth(userId: string): Promise<number>;
/**
 * Subtract points from user (for penalties)
 */
export declare function subtractPoints(userId: string, points: number, reason: string): Promise<void>;
/**
 * Get total points for all users
 */
export declare function getTotalPointsAllUsers(): Promise<number>;
declare const _default: {
    addPoints: typeof addPoints;
    getTotalPoints: typeof getTotalPoints;
    getPointsHistory: typeof getPointsHistory;
    getPointsByActivityType: typeof getPointsByActivityType;
    getPointsBreakdown: typeof getPointsBreakdown;
    getPointsInRange: typeof getPointsInRange;
    getTopUsersByPoints: typeof getTopUsersByPoints;
    getPointsToday: typeof getPointsToday;
    getPointsThisWeek: typeof getPointsThisWeek;
    getPointsThisMonth: typeof getPointsThisMonth;
    subtractPoints: typeof subtractPoints;
    getTotalPointsAllUsers: typeof getTotalPointsAllUsers;
};
export default _default;
//# sourceMappingURL=PointsRepository.d.ts.map