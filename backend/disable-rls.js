const { Client } = require('pg');

// Connect directly to disable RLS
const client = new Client({
  host: 'db.kzxnlhwyzcxrnloamkck.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'O)supabase0o',
});

(async () => {
  try {
    console.log('🔗 Connecting to Supabase PostgreSQL...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🔐 Disabling RLS on tables...\n');

    // Disable RLS on all tables
    const tables = ['users', 'badges', 'user_badges', 'points'];

    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
        console.log(`✅ RLS disabled on ${table}`);
      } catch (err) {
        console.log(`⚠️  ${table}: ${err.message}`);
      }
    }

    console.log('\n✅ Done! Tables should now be accessible.');
    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
