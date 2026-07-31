const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kzxnlhwyzcxrnloamkck.supabase.co';
const supabaseKey = 'sb_secret_zEHw_OE16F04tOY-ykOC5A_-p7Jha0W';

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log('🔍 Verifying database tables...\n');

    const tables = ['users', 'badges', 'points', 'user_badges'];
    let allGood = true;

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
          allGood = false;
        } else {
          console.log(`✅ ${table}: accessible`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
        allGood = false;
      }
    }

    console.log('\n' + '='.repeat(50));
    if (allGood) {
      console.log('✅ ALL TABLES VERIFIED AND ACCESSIBLE!');
      console.log('   Database is ready for API server!');
    } else {
      console.log('❌ Some tables have issues');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
