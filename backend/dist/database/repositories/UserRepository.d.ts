/**
 * User Repository
 * Database queries for users table
 */
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
/**
 * Get user by ID
 */
export declare function getUserById(userId: string): Promise<User | null>;
/**
 * Get user by email
 */
export declare function getUserByEmail(email: string): Promise<User | null>;
/**
 * Get all users (for admin)
 */
export declare function getAllUsers(): Promise<User[]>;
/**
 * Get all parent users
 */
export declare function getParents(): Promise<User[]>;
/**
 * Get all children for a parent
 */
export declare function getChildrenByParentId(parentId: string): Promise<User[]>;
/**
 * Create new user
 */
export declare function createUser(data: {
    email: string;
    name: string;
    role: 'parent' | 'child';
    account_type: 'primary' | 'coparent' | 'guardian' | 'child';
    password_hash: string;
}): Promise<User>;
/**
 * Update user
 */
export declare function updateUser(userId: string, data: Partial<User>): Promise<User>;
/**
 * Update last login
 */
export declare function updateLastLogin(userId: string): Promise<void>;
/**
 * Delete user (soft delete)
 */
export declare function deleteUser(userId: string): Promise<void>;
/**
 * Check if email exists
 */
export declare function emailExists(email: string): Promise<boolean>;
/**
 * Verify password hash
 */
export declare function verifyPassword(userId: string, passwordHash: string): Promise<boolean>;
/**
 * Get user count by role
 */
export declare function getUserCountByRole(role: 'parent' | 'child'): Promise<number>;
declare const _default: {
    getUserById: typeof getUserById;
    getUserByEmail: typeof getUserByEmail;
    getAllUsers: typeof getAllUsers;
    getParents: typeof getParents;
    getChildrenByParentId: typeof getChildrenByParentId;
    createUser: typeof createUser;
    updateUser: typeof updateUser;
    updateLastLogin: typeof updateLastLogin;
    deleteUser: typeof deleteUser;
    emailExists: typeof emailExists;
    verifyPassword: typeof verifyPassword;
    getUserCountByRole: typeof getUserCountByRole;
};
export default _default;
//# sourceMappingURL=UserRepository.d.ts.map