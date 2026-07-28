"use strict";
/**
 * Badge Routes
 * Handles badge management and user badge earning
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BadgesRepository = __importStar(require("../database/repositories/BadgesRepository"));
const router = (0, express_1.Router)();
// Middleware to verify auth header
const verifyAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }
    next();
};
// ================================================
// GET ALL BADGES
// ================================================
/**
 * GET /badges
 * Get all available badges
 */
router.get('/', verifyAuth, async (req, res) => {
    try {
        const badges = await BadgesRepository.getAllBadges();
        res.json({
            count: badges.length,
            badges: badges.map((badge) => ({
                id: badge.id,
                title: badge.title,
                description: badge.description,
                icon_emoji: badge.icon_emoji,
                category: badge.category,
                tier: badge.tier,
                points_required: badge.points_required,
                created_at: badge.created_at
            }))
        });
    }
    catch (error) {
        console.error('Get all badges error:', error);
        res.status(500).json({
            error: 'Failed to get badges',
            message: error.message
        });
    }
});
// ================================================
// GET BADGE BY ID
// ================================================
/**
 * GET /badges/:id
 * Get badge details by ID
 */
router.get('/:id', verifyAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const badge = await BadgesRepository.getBadgeById(id);
        if (!badge) {
            return res.status(404).json({ error: 'Badge not found' });
        }
        res.json({
            badge: {
                id: badge.id,
                title: badge.title,
                description: badge.description,
                icon_emoji: badge.icon_emoji,
                category: badge.category,
                tier: badge.tier,
                points_required: badge.points_required,
                created_at: badge.created_at
            }
        });
    }
    catch (error) {
        console.error('Get badge error:', error);
        res.status(500).json({
            error: 'Failed to get badge',
            message: error.message
        });
    }
});
// ================================================
// GET BADGES BY CATEGORY
// ================================================
/**
 * GET /badges/category/:category
 * Get all badges in a category
 */
router.get('/category/:category', verifyAuth, async (req, res) => {
    try {
        const category = req.params.category;
        const badges = await BadgesRepository.getBadgesByCategory(category);
        res.json({
            category,
            count: badges.length,
            badges: badges.map((badge) => ({
                id: badge.id,
                title: badge.title,
                icon_emoji: badge.icon_emoji,
                tier: badge.tier,
                points_required: badge.points_required
            }))
        });
    }
    catch (error) {
        console.error('Get badges by category error:', error);
        res.status(500).json({
            error: 'Failed to get badges by category',
            message: error.message
        });
    }
});
// ================================================
// GET USER BADGES
// ================================================
/**
 * GET /users/:userId/badges
 * Get all badges earned by a user
 */
router.get('/users/:userId', verifyAuth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const badges = await BadgesRepository.getUserBadges(userId);
        res.json({
            user_id: userId,
            count: badges.length,
            badges: badges.map((badge) => ({
                id: badge.id,
                badge_id: badge.badge_id,
                earned_at: badge.earned_at
            }))
        });
    }
    catch (error) {
        console.error('Get user badges error:', error);
        res.status(500).json({
            error: 'Failed to get user badges',
            message: error.message
        });
    }
});
// ================================================
// GET USER BADGES WITH DETAILS
// ================================================
/**
 * GET /users/:userId/badges/detailed
 * Get all badges earned by a user with full badge details
 */
router.get('/users/:userId/detailed', verifyAuth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const badges = await BadgesRepository.getUserBadgesWithDetails(userId);
        res.json({
            user_id: userId,
            count: badges.length,
            badges: badges.map((earned) => ({
                earned_badge_id: earned.id,
                badge: {
                    id: earned.badge_id,
                    title: earned.title,
                    description: earned.description,
                    icon_emoji: earned.icon_emoji,
                    category: earned.category,
                    tier: earned.tier
                },
                earned_at: earned.earned_at
            }))
        });
    }
    catch (error) {
        console.error('Get user badges detailed error:', error);
        res.status(500).json({
            error: 'Failed to get user badge details',
            message: error.message
        });
    }
});
// ================================================
// AWARD BADGE TO USER
// ================================================
/**
 * POST /users/:userId/badges/:badgeId
 * Award a badge to a user
 */
router.post('/users/:userId/badges/:badgeId', verifyAuth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const badgeId = req.params.badgeId;
        // Check if user already has badge
        const hasBadge = await BadgesRepository.userHasBadge(userId, badgeId);
        if (hasBadge) {
            return res.status(400).json({
                error: 'User already has this badge'
            });
        }
        // Award badge
        const userBadge = await BadgesRepository.awardBadge(userId, badgeId);
        res.status(201).json({
            message: 'Badge awarded successfully',
            badge: {
                id: userBadge.id,
                user_id: userBadge.user_id,
                badge_id: userBadge.badge_id,
                earned_at: userBadge.earned_at
            }
        });
    }
    catch (error) {
        console.error('Award badge error:', error);
        res.status(500).json({
            error: 'Failed to award badge',
            message: error.message
        });
    }
});
// ================================================
// REVOKE BADGE FROM USER
// ================================================
/**
 * DELETE /users/:userId/badges/:badgeId
 * Remove a badge from a user
 */
router.delete('/users/:userId/badges/:badgeId', verifyAuth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const badgeId = req.params.badgeId;
        await BadgesRepository.revokeBadge(userId, badgeId);
        res.json({
            message: 'Badge revoked successfully'
        });
    }
    catch (error) {
        console.error('Revoke badge error:', error);
        res.status(500).json({
            error: 'Failed to revoke badge',
            message: error.message
        });
    }
});
// ================================================
// GET BADGES EARNED IN DATE RANGE
// ================================================
/**
 * GET /users/:userId/badges/range?start=ISO&end=ISO
 * Get badges earned by user in date range
 */
router.get('/users/:userId/range', verifyAuth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json({
                error: 'Missing start or end date parameter'
            });
        }
        const badges = await BadgesRepository.getBadgesEarnedInRange(userId, new Date(start), new Date(end));
        res.json({
            user_id: userId,
            date_range: { start, end },
            count: badges.length,
            badges: badges.map((badge) => ({
                id: badge.id,
                badge_id: badge.badge_id,
                earned_at: badge.earned_at
            }))
        });
    }
    catch (error) {
        console.error('Get badges in range error:', error);
        res.status(500).json({
            error: 'Failed to get badges in range',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=badges.js.map