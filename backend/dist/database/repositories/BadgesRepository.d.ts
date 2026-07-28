/**
 * Badges Repository
 * Database queries for badges and user_badges tables
 */
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
/**
 * Get badge by ID
 */
export declare function getBadgeById(badgeId: string): Promise<Badge | null>;
/**
 * Get all badges by category
 */
export declare function getBadgesByCategory(category: string): Promise<Badge[]>;
/**
 * Get all badges by tier
 */
export declare function getBadgesByTier(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): Promise<Badge[]>;
/**
 * Get all badges
 */
export declare function getAllBadges(): Promise<Badge[]>;
/**
 * Get badge count
 */
export declare function getBadgeCount(): Promise<number>;
/**
 * Get badges earned by user
 */
export declare function getUserBadges(userId: string): Promise<UserBadge[]>;
/**
 * Get user badges with details
 */
export declare function getUserBadgesWithDetails(userId: string): Promise<(UserBadge & Badge)[]>;
/**
 * Get earned badge count by category
 */
export declare function getUserBadgeCountByCategory(userId: string, category: string): Promise<number>;
/**
 * Check if user has badge
 */
export declare function userHasBadge(userId: string, badgeId: string): Promise<boolean>;
/**
 * Award badge to user
 */
export declare function awardBadge(userId: string, badgeId: string): Promise<UserBadge>;
/**
 * Revoke badge from user
 */
export declare function revokeBadge(userId: string, badgeId: string): Promise<void>;
/**
 * Get badges earned in date range
 */
export declare function getBadgesEarnedInRange(userId: string, startDate: Date, endDate: Date): Promise<UserBadge[]>;
/**
 * Get users who earned a specific badge
 */
export declare function getUsersWithBadge(badgeId: string): Promise<string[]>;
/**
 * Clear all badges for user (admin operation)
 */
export declare function clearUserBadges(userId: string): Promise<void>;
declare const _default: {
    getBadgeById: typeof getBadgeById;
    getBadgesByCategory: typeof getBadgesByCategory;
    getBadgesByTier: typeof getBadgesByTier;
    getAllBadges: typeof getAllBadges;
    getBadgeCount: typeof getBadgeCount;
    getUserBadges: typeof getUserBadges;
    getUserBadgesWithDetails: typeof getUserBadgesWithDetails;
    getUserBadgeCountByCategory: typeof getUserBadgeCountByCategory;
    userHasBadge: typeof userHasBadge;
    awardBadge: typeof awardBadge;
    revokeBadge: typeof revokeBadge;
    getBadgesEarnedInRange: typeof getBadgesEarnedInRange;
    getUsersWithBadge: typeof getUsersWithBadge;
    clearUserBadges: typeof clearUserBadges;
};
export default _default;
//# sourceMappingURL=BadgesRepository.d.ts.map