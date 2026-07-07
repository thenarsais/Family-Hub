"use strict";
/**
 * Supabase Client Service
 * Handles authentication and database connection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSupabase = initSupabase;
exports.getSupabase = getSupabase;
exports.signUp = signUp;
exports.signIn = signIn;
exports.signOut = signOut;
exports.getUser = getUser;
exports.verifyToken = verifyToken;
exports.updateUserEmail = updateUserEmail;
exports.updateUserPassword = updateUserPassword;
exports.deleteUser = deleteUser;
exports.listUsers = listUsers;
exports.queryDatabase = queryDatabase;
exports.insertDatabase = insertDatabase;
exports.updateDatabase = updateDatabase;
exports.deleteDatabase = deleteDatabase;
exports.healthCheck = healthCheck;
const supabase_js_1 = require("@supabase/supabase-js");
// ================================================
// CLIENT INITIALIZATION
// ================================================
let supabaseClient = null;
/**
 * Initialize Supabase client
 */
function initSupabase() {
    if (supabaseClient)
        return supabaseClient;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
    return supabaseClient;
}
/**
 * Get Supabase client (initialized)
 */
function getSupabase() {
    if (!supabaseClient) {
        initSupabase();
    }
    return supabaseClient;
}
// ================================================
// AUTHENTICATION
// ================================================
/**
 * Sign up new user
 */
async function signUp(email, password) {
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
async function signIn(email, password) {
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
async function signOut(accessToken) {
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
async function getUser(userId) {
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
async function verifyToken(accessToken) {
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
async function updateUserEmail(userId, newEmail) {
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
async function updateUserPassword(userId, newPassword) {
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
async function deleteUser(userId) {
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
async function listUsers(limit = 10) {
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
async function queryDatabase(table, query) {
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
    return (data || []);
}
/**
 * Insert into database
 */
async function insertDatabase(table, data) {
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
    return result;
}
/**
 * Update database
 */
async function updateDatabase(table, id, data) {
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
    return result;
}
/**
 * Delete from database
 */
async function deleteDatabase(table, id) {
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
async function healthCheck() {
    try {
        const supabase = getSupabase();
        const { error } = await supabase.auth.getSession();
        return !error;
    }
    catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}
exports.default = {
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
//# sourceMappingURL=supabase.js.map