/**
 * User Repository
 * Database queries for users table
 */

import { query, queryOne, queryAll, transaction } from '../db';
import { getOrSet, del } from '../cache';

// ================================================
// TYPE DEFINITIONS
// ================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'parent' | 'child';
  account_type: 'primary' | 'coparent' | 'guardian' | 'child';
  password_hash?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
}

// ================================================
// QUERIES
// ================================================

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  return getOrSet(
    `user:${userId}`,
    () =>
      queryOne<User>(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      ),
    3600 // Cache for 1 hour
  );
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
}

/**
 * Get all users (for admin)
 */
export async function getAllUsers(): Promise<User[]> {
  return queryAll<User>(
    'SELECT id, email, name, role, account_type, created_at, is_active FROM users ORDER BY created_at DESC'
  );
}

/**
 * Get all parent users
 */
export async function getParents(): Promise<User[]> {
  return queryAll<User>(
    `SELECT id, email, name, role, account_type, created_at
     FROM users
     WHERE role = $1
     ORDER BY name ASC`,
    ['parent']
  );
}

/**
 * Get all children for a parent
 */
export async function getChildrenByParentId(parentId: string): Promise<User[]> {
  return getOrSet(
    `parent:${parentId}:children`,
    () =>
      queryAll<User>(
        `SELECT u.* FROM users u
         INNER JOIN linked_accounts la ON u.id = la.child_id
         WHERE la.parent_id = $1
         ORDER BY u.name ASC`,
        [parentId]
      ),
    1800 // Cache for 30 minutes
  );
}

/**
 * Create new user
 */
export async function createUser(data: {
  email: string;
  name: string;
  role: 'parent' | 'child';
  account_type: 'primary' | 'coparent' | 'guardian' | 'child';
  password_hash: string;
}): Promise<User> {
  const result = await queryOne<User>(
    `INSERT INTO users (email, name, role, account_type, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.email.toLowerCase(),
      data.name,
      data.role,
      data.account_type,
      data.password_hash,
    ]
  );

  if (!result) throw new Error('Failed to create user');

  // Clear cache
  await del(`user:${result.id}`);

  return result;
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  data: Partial<User>
): Promise<User> {
  const updates: string[] = [];
  const values: any[] = [];
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

  const result = await queryOne<User>(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (!result) throw new Error('User not found');

  // Clear cache
  await del(`user:${userId}`);

  return result;
}

/**
 * Update last login
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [userId]
  );

  // Clear cache
  await del(`user:${userId}`);
}

/**
 * Delete user (soft delete)
 */
export async function deleteUser(userId: string): Promise<void> {
  await query(
    'UPDATE users SET is_active = false WHERE id = $1',
    [userId]
  );

  // Clear cache
  await del(`user:${userId}`);
}

/**
 * Check if email exists
 */
export async function emailExists(email: string): Promise<boolean> {
  const result = await queryOne<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists',
    [email.toLowerCase()]
  );

  return result?.exists || false;
}

/**
 * Verify password hash
 */
export async function verifyPassword(
  userId: string,
  passwordHash: string
): Promise<boolean> {
  const user = await getUserById(userId);
  return user?.password_hash === passwordHash;
}

/**
 * Get user count by role
 */
export async function getUserCountByRole(
  role: 'parent' | 'child'
): Promise<number> {
  const result = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM users WHERE role = $1',
    [role]
  );

  return result ? parseInt(result.count, 10) : 0;
}

export default {
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
