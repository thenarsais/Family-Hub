"use strict";
/**
 * User Repository
 * Database queries for users table
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = getUserById;
exports.getUserByEmail = getUserByEmail;
exports.getAllUsers = getAllUsers;
exports.getParents = getParents;
exports.getChildrenByParentId = getChildrenByParentId;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.updateLastLogin = updateLastLogin;
exports.deleteUser = deleteUser;
exports.emailExists = emailExists;
exports.verifyPassword = verifyPassword;
exports.getUserCountByRole = getUserCountByRole;
const db_1 = require("../db");
const cache_1 = require("../cache");
// ================================================
// QUERIES
// ================================================
/**
 * Get user by ID
 */
async function getUserById(userId) {
    return (0, cache_1.getOrSet)(`user:${userId}`, () => (0, db_1.queryOne)('SELECT * FROM users WHERE id = $1', [userId]), 3600 // Cache for 1 hour
    );
}
/**
 * Get user by email
 */
async function getUserByEmail(email) {
    return (0, db_1.queryOne)('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
}
/**
 * Get all users (for admin)
 */
async function getAllUsers() {
    return (0, db_1.queryAll)('SELECT id, email, name, role, account_type, created_at, is_active FROM users ORDER BY created_at DESC');
}
/**
 * Get all parent users
 */
async function getParents() {
    return (0, db_1.queryAll)(`SELECT id, email, name, role, account_type, created_at
     FROM users
     WHERE role = $1
     ORDER BY name ASC`, ['parent']);
}
/**
 * Get all children for a parent
 */
async function getChildrenByParentId(parentId) {
    return (0, cache_1.getOrSet)(`parent:${parentId}:children`, () => (0, db_1.queryAll)(`SELECT u.* FROM users u
         INNER JOIN linked_accounts la ON u.id = la.child_id
         WHERE la.parent_id = $1
         ORDER BY u.name ASC`, [parentId]), 1800 // Cache for 30 minutes
    );
}
/**
 * Create new user
 */
async function createUser(data) {
    const result = await (0, db_1.queryOne)(`INSERT INTO users (email, name, role, account_type, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`, [
        data.email.toLowerCase(),
        data.name,
        data.role,
        data.account_type,
        data.password_hash,
    ]);
    if (!result)
        throw new Error('Failed to create user');
    // Clear cache
    await (0, cache_1.del)(`user:${result.id}`);
    return result;
}
/**
 * Update user
 */
async function updateUser(userId, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;
    if (data.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(data.name);
    }
    if (data.email !== undefined) {
        updates.push(`email = $${paramCount++}`);
        values.push(data.email.toLowerCase());
    }
    if (data.is_active !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(data.is_active);
    }
    if (data.password_hash !== undefined) {
        updates.push(`password_hash = $${paramCount++}`);
        values.push(data.password_hash);
    }
    updates.push(`updated_at = NOW()`);
    values.push(userId);
    const result = await (0, db_1.queryOne)(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
    if (!result)
        throw new Error('User not found');
    // Clear cache
    await (0, cache_1.del)(`user:${userId}`);
    return result;
}
/**
 * Update last login
 */
async function updateLastLogin(userId) {
    await (0, db_1.query)('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);
    // Clear cache
    await (0, cache_1.del)(`user:${userId}`);
}
/**
 * Delete user (soft delete)
 */
async function deleteUser(userId) {
    await (0, db_1.query)('UPDATE users SET is_active = false WHERE id = $1', [userId]);
    // Clear cache
    await (0, cache_1.del)(`user:${userId}`);
}
/**
 * Check if email exists
 */
async function emailExists(email) {
    const result = await (0, db_1.queryOne)('SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists', [email.toLowerCase()]);
    return result?.exists || false;
}
/**
 * Verify password hash
 */
async function verifyPassword(userId, passwordHash) {
    const user = await getUserById(userId);
    return user?.password_hash === passwordHash;
}
/**
 * Get user count by role
 */
async function getUserCountByRole(role) {
    const result = await (0, db_1.queryOne)('SELECT COUNT(*) as count FROM users WHERE role = $1', [role]);
    return result ? parseInt(result.count, 10) : 0;
}
exports.default = {
    getUserById,
    getUserByEmail,
    getAllUsers,
    getParents,
    getChildrenByParentId,
    createUser,
    updateUser,
    updateLastLogin,
    deleteUser,
    emailExists,
    verifyPassword,
    getUserCountByRole,
};
//# sourceMappingURL=UserRepository.js.map