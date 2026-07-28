/**
 * Badge Routes
 * Handles badge management and user badge earning
 */

import express, { Router, Request, Response } from 'express';
import * as BadgesRepository from '../database/repositories/BadgesRepository';

const router = Router();

// Middleware to verify auth header
const verifyAuth = (req: Request, res: Response, next: Function) => {
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
router.get('/', verifyAuth, async (req: Request, res: Response) => {
  try {
    const badges = await BadgesRepository.getAllBadges();

    res.json({
      count: badges.length,
      badges: badges.map((badge: any) => ({
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
  } catch (error: any) {
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
router.get('/:id', verifyAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
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
  } catch (error: any) {
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
router.get('/category/:category', verifyAuth, async (req: Request, res: Response) => {
  try {
    const category = req.params.category as string;
    const badges = await BadgesRepository.getBadgesByCategory(category);

    res.json({
      category,
      count: badges.length,
      badges: badges.map((badge: any) => ({
        id: badge.id,
        title: badge.title,
        icon_emoji: badge.icon_emoji,
        tier: badge.tier,
        points_required: badge.points_required
      }))
    });
  } catch (error: any) {
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
router.get('/users/:userId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const badges = await BadgesRepository.getUserBadges(userId);

    res.json({
      user_id: userId,
      count: badges.length,
      badges: badges.map((badge: any) => ({
        id: badge.id,
        badge_id: badge.badge_id,
        earned_at: badge.earned_at
      }))
    });
  } catch (error: any) {
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
router.get('/users/:userId/detailed', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const badges = await BadgesRepository.getUserBadgesWithDetails(userId);

    res.json({
      user_id: userId,
      count: badges.length,
      badges: badges.map((earned: any) => ({
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
  } catch (error: any) {
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
router.post('/users/:userId/badges/:badgeId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const badgeId = req.params.badgeId as string;

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
  } catch (error: any) {
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
router.delete('/users/:userId/badges/:badgeId', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const badgeId = req.params.badgeId as string;

    await BadgesRepository.revokeBadge(userId, badgeId);

    res.json({
      message: 'Badge revoked successfully'
    });
  } catch (error: any) {
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
router.get('/users/:userId/range', verifyAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        error: 'Missing start or end date parameter'
      });
    }

    const badges = await BadgesRepository.getBadgesEarnedInRange(
      userId,
      new Date(start as string),
      new Date(end as string)
    );

    res.json({
      user_id: userId,
      date_range: { start, end },
      count: badges.length,
      badges: badges.map((badge: any) => ({
        id: badge.id,
        badge_id: badge.badge_id,
        earned_at: badge.earned_at
      }))
    });
  } catch (error: any) {
    console.error('Get badges in range error:', error);
    res.status(500).json({
      error: 'Failed to get badges in range',
      message: error.message
    });
  }
});

export default router;
