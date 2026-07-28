"use strict";
/**
 * User Routes
 * Handles user profile management, parent-child relationships
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
const UserRepository = __importStar(require("../database/repositories/UserRepository"));
const router = (0, express_1.Router)();
// Middleware to verify auth header (simple example)
const verifyAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }
    next();
};
// ================================================
// GET CURRENT USER PROFILE
// ================================================
/**
 * GET /users/me
 * Get current user's profile
 */
router.get('/me', verifyAuth, async (req, res) => {
    try {
        // In a real app, extract user ID from token
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'Missing userId parameter' });
        }
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                account_type: user.account_type,
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Failed to get user',
            message: error.message
        });
    }
});
// ================================================
// GET USER BY ID
// ================================================
/**
 * GET /users/:id
 * Get user by ID
 */
router.get('/:id', verifyAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const user = await UserRepository.getUserById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                created_at: user.created_at
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Failed to get user',
            message: error.message
        });
    }
});
// ================================================
// UPDATE USER PROFILE
// ================================================
/**
 * PUT /users/:id
 * Update user profile
 */
router.put('/:id', verifyAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const { name, email } = req.body;
        if (!name && !email) {
            return res.status(400).json({
                error: 'No fields to update'
            });
        }
        const updates = {};
        if (name)
            updates.name = name;
        if (email)
            updates.email = email;
        const user = await UserRepository.updateUser(id, updates);
        res.json({
            message: 'User updated successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            error: 'Failed to update user',
            message: error.message
        });
    }
});
// ================================================
// GET PARENT'S CHILDREN
// ================================================
/**
 * GET /users/:parentId/children
 * Get all children of a parent
 */
router.get('/:parentId/children', verifyAuth, async (req, res) => {
    try {
        const parentId = req.params.parentId;
        const children = await UserRepository.getChildrenByParentId(parentId);
        res.json({
            parent_id: parentId,
            children: children.map((child) => ({
                id: child.id,
                name: child.name,
                email: child.email,
                role: child.role,
                created_at: child.created_at
            }))
        });
    }
    catch (error) {
        console.error('Get children error:', error);
        res.status(500).json({
            error: 'Failed to get children',
            message: error.message
        });
    }
});
// ================================================
// GET ALL PARENTS (ADMIN)
// ================================================
/**
 * GET /users/role/parents
 * Get all parent users (admin only)
 */
router.get('/role/parents', verifyAuth, async (req, res) => {
    try {
        const parents = await UserRepository.getParents();
        res.json({
            count: parents.length,
            parents: parents.map((parent) => ({
                id: parent.id,
                name: parent.name,
                email: parent.email,
                account_type: parent.account_type,
                created_at: parent.created_at
            }))
        });
    }
    catch (error) {
        console.error('Get parents error:', error);
        res.status(500).json({
            error: 'Failed to get parents',
            message: error.message
        });
    }
});
// ================================================
// GET ALL USERS (ADMIN)
// ================================================
/**
 * GET /users
 * Get all users (admin only)
 */
router.get('/', verifyAuth, async (req, res) => {
    try {
        const users = await UserRepository.getAllUsers();
        res.json({
            count: users.length,
            users: users.map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            }))
        });
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            error: 'Failed to get users',
            message: error.message
        });
    }
});
// ================================================
// DELETE USER
// ================================================
/**
 * DELETE /users/:id
 * Delete a user (soft delete)
 */
router.delete('/:id', verifyAuth, async (req, res) => {
    try {
        const id = req.params.id;
        await UserRepository.deleteUser(id);
        res.json({
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            error: 'Failed to delete user',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map