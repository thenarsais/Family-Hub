const { Client } = require('pg');

// Supabase PostgreSQL connection
// Format: postgresql://postgres:[password]@[host]:5432/postgres
const client = new Client({
  host: 'db.kzxnlhwyzcxrnloamkck.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'O)supabase0o', // From the exposed credentials
});

(async () => {
  try {
    console.log('🔗 Connecting to Supabase PostgreSQL...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📝 Creating database schema...\n');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50),
        account_type VARCHAR(50),
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
      );
    `);
    console.log('✅ users table created');

    // Create badges table
    await client.query(`
      CREATE TABLE IF NOT EXISTS badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255),
        description TEXT,
        icon_emoji VARCHAR(10),
        category VARCHAR(50),
        tier VARCHAR(50),
        points_required INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ badges table created');

    // Create user_badges table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        badge_id UUID REFERENCES badges(id),
        earned_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ user_badges table created');

    // Create points table
    await client.query(`
      CREATE TABLE IF NOT EXISTS points (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        points INTEGER,
        activity_type VARCHAR(100),
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ points table created');

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_points_user_id ON points(user_id);`);
    console.log('✅ indexes created');

    console.log('\n' + '='.repeat(50));
    console.log('✅ Database schema created successfully!');
    console.log('='.repeat(50));

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
