const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:datasupadata@db.kzxnlhwyzcxrnloamkck.supabase.co:5432/postgres'
});

async function grantPermissions() {
  try {
    const client = await pool.connect();
    
    const sql = 'GRANT SELECT, INSERT, UPDATE ON public.user_integrations TO service_role;';
    
    console.log('Running: ' + sql);
    const result = await client.query(sql);
    
    console.log('✅ Permissions granted successfully!');
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

grantPermissions();
