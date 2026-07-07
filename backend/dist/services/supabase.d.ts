/**
 * Supabase Client Service
 * Handles authentication and database connection
 */
import { SupabaseClient, Session, User } from '@supabase/supabase-js';
/**
 * Initialize Supabase client
 */
export declare function initSupabase(): SupabaseClient;
/**
 * Get Supabase client (initialized)
 */
export declare function getSupabase(): SupabaseClient;
/**
 * Sign up new user
 */
export declare function signUp(email: string, password: string): Promise<User | null>;
/**
 * Sign in user
 */
export declare function signIn(email: string, password: string): Promise<{
    user: User;
    session: Session;
} | null>;
/**
 * Sign out user
 */
export declare function signOut(accessToken: string): Promise<void>;
/**
 * Get user by ID
 */
export declare function getUser(userId: string): Promise<User | null>;
/**
 * Verify token and get user
 */
export declare function verifyToken(accessToken: string): Promise<User | null>;
/**
 * Update user email
 */
export declare function updateUserEmail(userId: string, newEmail: string): Promise<User | null>;
/**
 * Update user password
 */
export declare function updateUserPassword(userId: string, newPassword: string): Promise<void>;
/**
 * Delete user
 */
export declare function deleteUser(userId: string): Promise<void>;
/**
 * List all users (admin)
 */
export declare function listUsers(limit?: number): Promise<User[]>;
/**
 * Query database via Supabase
 */
export declare function queryDatabase<T>(table: string, query?: (q: any) => any): Promise<T[]>;
/**
 * Insert into database
 */
export declare function insertDatabase<T>(table: string, data: any): Promise<T>;
/**
 * Update database
 */
export declare function updateDatabase<T>(table: string, id: string, data: any): Promise<T>;
/**
 * Delete from database
 */
export declare function deleteDatabase(table: string, id: string): Promise<void>;
/**
 * Health check
 */
export declare function healthCheck(): Promise<boolean>;
declare const _default: {
    initSupabase: typeof initSupabase;
    getSupabase: typeof getSupabase;
    signUp: typeof signUp;
    signIn: typeof signIn;
    signOut: typeof signOut;
    getUser: typeof getUser;
    verifyToken: typeof verifyToken;
    updateUserEmail: typeof updateUserEmail;
    updateUserPassword: typeof updateUserPassword;
    deleteUser: typeof deleteUser;
    listUsers: typeof listUsers;
    queryDatabase: typeof queryDatabase;
    insertDatabase: typeof insertDatabase;
    updateDatabase: typeof updateDatabase;
    deleteDatabase: typeof deleteDatabase;
    healthCheck: typeof healthCheck;
};
export default _default;
//# sourceMappingURL=supabase.d.ts.map