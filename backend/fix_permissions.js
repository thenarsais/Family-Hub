require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixPermissions() {
  try {
    // Try to grant permissions via Supabase API
    const sql = 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_integrations TO service_role;';
    
    console.log('Attempting to grant permissions...');
    
    // Supabase doesn't expose raw SQL execution, but we can try via admin API
    const { error, data } = await supabase
      .from('user_integrations')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('Current error:', error.message);
      console.log('Hint:', error.hint || 'No hint available');
    } else {
      console.log('✅ Permissions might be working!');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

fixPermissions();
