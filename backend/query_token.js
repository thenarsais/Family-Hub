require('dotenv').config({ path: '../../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkToken() {
  try {
    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', 'parent-001')
      .eq('provider', 'google_calendar');
    
    if (error) {
      console.error('Query error:', error);
    } else {
      console.log('Token record found:', JSON.stringify(data, null, 2));
      console.log('Record count:', data.length);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}

checkToken();
