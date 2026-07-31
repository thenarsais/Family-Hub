const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kzxnlhwyzcxrnloamkck.supabase.co';
const supabaseKey = 'sb_secret_zEHw_OE16F04tOY-ykOC5A_-p7Jha0W';

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log('📝 Creating database schema...\n');

    const tables = [
      {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          role VARCHAR(50),
          account_type VARCHAR(50),
          password_hash VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          last_login TIMESTAMP
        );`
      },
      {
        name: 'badges',
        sql: `CREATE TABLE IF NOT EXISTS badges (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255),
          description TEXT,
          icon_emoji VARCHAR(10),
          category VARCHAR(50),
          tier VARCHAR(50),
          points_required INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
        );`
      },
      {
        name: 'user_badges',
        sql: `CREATE TABLE IF NOT EXISTS user_badges (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          badge_id UUID REFERENCES badges(id),
          earned_at TIMESTAMP DEFAULT NOW()
        );`
      },
      {
        name: 'points',
        sql: `CREATE TABLE IF NOT EXISTS points (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          points INTEGER,
          activity_type VARCHAR(100),
          reason TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );`
      }
    ];

    // Note: This approach won't work with RPC since it requires special function
    // Instead, we'll use the schema creation via individual table operations

    console.log('⚠️  Supabase does not support raw SQL execution via client library.');
    console.log('\n📋 To create tables, please:');
    console.log('\n1. Go to: https://supabase.com/');
    console.log('2. Log in and open your project: kzxnlhwyzcxrnloamkck');
    console.log('3. Click "SQL Editor" in the left sidebar');
    console.log('4. Click "New Query"');
    console.log('5. Paste this SQL:\n');

    console.log(`
-- Create users table
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

-- Create badges table
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

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW()
);

-- Create points table
CREATE TABLE IF NOT EXISTS points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  points INTEGER,
  activity_type VARCHAR(100),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_points_user_id ON points(user_id);
    `);

    console.log('\n6. Click "Run" button');
    console.log('7. All tables will be created!');
    console.log('\n✅ Then run: node create-tables-check.js to verify');

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
