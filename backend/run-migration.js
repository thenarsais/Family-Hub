#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('🔗 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('📝 Running migration: 007_add_user_integrations.sql');
    
    // Try to execute raw SQL (this might not work with Supabase JS client directly)
    // Instead, we'll use SQL queries to create the table
    
    // Check if table exists
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'user_integrations');

    if (checkError) {
      throw new Error(`Failed to check table existence: ${checkError.message}`);
    }

    if (tables && tables.length > 0) {
      console.log('✅ user_integrations table already exists!');
      return;
    }

    // If we get here, table doesn't exist yet
    // Unfortunately, Supabase JS client doesn't have direct SQL execution
    // We need to tell the user to run this manually
    console.log('⚠️  Cannot create table using Supabase JS client directly.');
    console.log('\n📋 Please run this SQL in your Supabase dashboard (SQL Editor):');
    console.log('---');
    const migrationPath = path.resolve(__dirname, '../.supabase/migrations/007_add_user_integrations.sql');
    console.log(fs.readFileSync(migrationPath, 'utf8'));
    console.log('---');
    console.log('\n✨ After running the SQL, restart the backend and refresh the page.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runMigration();
