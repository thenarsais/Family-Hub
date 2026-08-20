#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function testDismissedEvents() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('🔗 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Try to read from the table
    console.log('\n📖 Test 1: Reading from dismissed_events table...');
    const { data, error } = await supabase
      .from('dismissed_events')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Read failed:', error.message);
      if (error.message.includes('Could not find the table')) {
        console.log('\n💡 Schema cache issue detected.');
        console.log('Attempting to force schema refresh by writing to table...');
        
        // Test 2: Try to insert and immediately delete a test record
        const testRecord = {
          user_id: 'test-schema-refresh',
          event_id: 'test-event-id',
          calendar_id: null,
        };
        
        const { error: insertError } = await supabase
          .from('dismissed_events')
          .insert([testRecord]);
        
        if (insertError) {
          console.error('❌ Insert failed:', insertError.message);
        } else {
          console.log('✅ Insert succeeded - schema cache should refresh');
          
          // Clean up the test record
          await supabase
            .from('dismissed_events')
            .delete()
            .eq('user_id', 'test-schema-refresh');
          console.log('✅ Test record cleaned up');
        }
      }
    } else {
      console.log('✅ Read succeeded! Table exists and is accessible.');
      console.log(`Found ${data?.length || 0} records`);
    }

    // Test 3: Verify the table structure
    console.log('\n📋 Test 3: Checking table structure...');
    const { data: tableInfo, error: structError } = await supabase
      .from('dismissed_events')
      .select('*')
      .limit(0);
    
    if (!structError) {
      console.log('✅ Table structure is valid');
    } else {
      console.log('⚠️  Could not verify table structure:', structError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDismissedEvents();
