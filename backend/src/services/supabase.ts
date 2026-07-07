/**
 * Supabase Client Service
 * Handles authentication and database connection
 */

import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

// ================================================
// CLIENT INITIALIZATION
// ================================================

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client
 */
export function initSupabase(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized');

  return supabaseClient;
}

/**
 * Get Supabase client (initialized)
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    initSupabase();
  }
  return supabaseClient!;
}

// ================================================
// AUTHENTICATION
// ================================================

/**
 * Sign up new user
 */
export async function signUp(email: string, password: string): Promise<User | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email for testing
  });

  if (error) {
    console.error('Sign up error:', error);
    throw error;
  }

  return data.user;
}

/**
 * Sign in user
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User; session: Session } | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error);
    throw error;
  }

  return data;
}

/**
 * Sign out user
 */
export async function signOut(accessToken: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    console.error('Get user error:', error);
    return null;
  }

  return data.user;
}

/**
 * Verify token and get user
 */
export async function verifyToken(accessToken: string): Promise<User | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    console.error('Token verification error:', error);
    return null;
  }

  return data.user;
}

/**
 * Update user email
 */
export async function updateUserEmail(
  userId: string,
  newEmail: string
): Promise<User | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    email: newEmail,
  });

  if (error) {
    console.error('Update email error:', error);
    throw error;
  }

  return data.user;
}

/**
 * Update user password
 */
export async function updateUserPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    console.error('Update password error:', error);
    throw error;
  }
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error('Delete user error:', error);
    throw error;
  }
}

/**
 * List all users (admin)
 */
export async function listUsers(limit: number = 10): Promise<User[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.admin.listUsers({
    perPage: limit,
  });

  if (error) {
    console.error('List users error:', error);
    return [];
  }

  return data.users;
}

// ================================================
// DATABASE OPERATIONS
// ================================================

/**
 * Query database via Supabase
 */
export async function queryDatabase<T>(
  table: string,
  query?: (q: any) => any
): Promise<T[]> {
  const supabase = getSupabase();

  let q = supabase.from(table).select();

  if (query) {
    q = query(q);
  }

  const { data, error } = await q;

  if (error) {
    console.error(`Query ${table} error:`, error);
    throw error;
  }

  return (data || []) as T[];
}

/**
 * Insert into database
 */
export async function insertDatabase<T>(
  table: string,
  data: any
): Promise<T> {
  const supabase = getSupabase();

  const { data: result, error } = await supabase
    .from(table)
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error(`Insert ${table} error:`, error);
    throw error;
  }

  return result as T;
}

/**
 * Update database
 */
export async function updateDatabase<T>(
  table: string,
  id: string,
  data: any
): Promise<T> {
  const supabase = getSupabase();

  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Update ${table} error:`, error);
    throw error;
  }

  return result as T;
}

/**
 * Delete from database
 */
export async function deleteDatabase(table: string, id: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.from(table).delete().eq('id', id);

  if (error) {
    console.error(`Delete ${table} error:`, error);
    throw error;
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.auth.getSession();
    return !error;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

export default {
  initSupabase,
  getSupabase,
  signUp,
  signIn,
  signOut,
  getUser,
  verifyToken,
  updateUserEmail,
  updateUserPassword,
  deleteUser,
  listUsers,
  queryDatabase,
  insertDatabase,
  updateDatabase,
  deleteDatabase,
  healthCheck,
};
