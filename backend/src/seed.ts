import { Client } from 'pg';
import dotenv from 'dotenv';

import { getErrorMessage } from './utils/errors';
dotenv.config({ path: '../.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function seed() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('🌱 Seeding database...\n');

    // Trivia questions are seeded from seed-data/trivia-questions-phase1.json by
    // `npm run seed:trivia` (T-09 / migration 018) — not from this script.

    // Seed Feature Flags
    const featureFlags = [
      { name: 'wordle_game', enabled: true },
      { name: 'quickfire_trivia', enabled: true },
      { name: 'word_scramble', enabled: true },
      { name: 'hangman_game', enabled: true },
      { name: 'daily_quests', enabled: true },
      { name: 'homework', enabled: true },
      { name: 'kung_fu', enabled: true },
      { name: 'habits', enabled: true },
      { name: 'reading', enabled: true },
      { name: 'mood_tracker', enabled: true },
      { name: 'gujarati_module', enabled: true },
      { name: 'weekly_goals', enabled: true },
      { name: 'monthly_goals', enabled: true },
      { name: 'category_mastery', enabled: true },
      { name: 'daily_challenge', enabled: true },
      { name: 'streak_recovery', enabled: true },
      { name: 'parent_portal', enabled: true },
      { name: 'google_drive_sync', enabled: true },
      { name: 'hint_token_system', enabled: true },
      { name: 'chore_points', enabled: true },
      { name: 'chore_badges', enabled: true },
      { name: 'privacy_mode', enabled: true }
    ];

    for (const flag of featureFlags) {
      await client.query(
        `INSERT INTO feature_flags (flag_name, is_enabled)
         VALUES ($1, $2)
         ON CONFLICT (flag_name) DO UPDATE SET is_enabled = $2`,
        [flag.name, flag.enabled]
      );
    }
    console.log(`✅ Seeded ${featureFlags.length} feature flags`);

    // Seed System Settings
    const settings = [
      { key: 'app_version', value: '1.0.0', type: 'string' },
      { key: 'hints_per_day', value: '2', type: 'integer' },
      { key: 'hints_earned_per_activity', value: '5', type: 'integer' },
      { key: 'hints_cap', value: '10', type: 'integer' },
      { key: 'points_multiplier', value: '1.0', type: 'float' },
      { key: 'max_active_weekly_goals', value: '3', type: 'integer' },
      { key: 'max_active_monthly_goals', value: '2', type: 'integer' }
    ];

    for (const setting of settings) {
      await client.query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2`,
        [setting.key, setting.value, setting.type]
      );
    }
    console.log(`✅ Seeded ${settings.length} system settings`);

    // Seed Badges
    const badges = [
      // Bronze Tier
      { title: 'First Steps', description: 'Complete your first quest', icon: '👣', category: 'achievement', tier: 'bronze', points: 0 },
      { title: 'Quiz Master', description: 'Answer 5 trivia questions correctly', icon: '🧠', category: 'trivia', tier: 'bronze', points: 50 },
      { title: 'Morning Routine', description: 'Complete morning habits for 3 consecutive days', icon: '🌅', category: 'habits', tier: 'bronze', points: 30 },

      // Silver Tier
      { title: 'Knowledge Seeker', description: 'Answer 20 trivia questions correctly', icon: '📚', category: 'trivia', tier: 'silver', points: 200 },
      { title: 'Habit Hero', description: 'Complete daily habits for 7 consecutive days', icon: '🦸', category: 'habits', tier: 'silver', points: 100 },
      { title: 'Reading Enthusiast', description: 'Complete 3 books', icon: '📖', category: 'reading', tier: 'silver', points: 150 },

      // Gold Tier
      { title: 'Trivia Champion', description: 'Answer 50 trivia questions correctly', icon: '👑', category: 'trivia', tier: 'gold', points: 500 },
      { title: 'Streak Master', description: 'Maintain a 30-day streak', icon: '🔥', category: 'habits', tier: 'gold', points: 300 },
      { title: 'Kung Fu Master', description: 'Complete 50 Kung Fu lessons', icon: '🥋', category: 'activities', tier: 'gold', points: 400 },

      // Platinum Tier
      { title: 'Ultimate Champion', description: 'Answer 100 trivia questions correctly', icon: '💎', category: 'trivia', tier: 'platinum', points: 1000 },
      { title: 'Legendary Achiever', description: 'Earn all gold badges', icon: '⭐', category: 'achievement', tier: 'platinum', points: 800 },

      // Chore Badges (Phase 1 new feature)
      { title: 'Trash Master Bronze', description: 'Empty trash 5 times', icon: '🗑️', category: 'chore_trash', tier: 'bronze', points: 0 },
      { title: 'Trash Master Silver', description: 'Empty trash 15 times', icon: '🗑️', category: 'chore_trash', tier: 'silver', points: 50 },
      { title: 'Trash Master Gold', description: 'Empty trash 30 times', icon: '🗑️', category: 'chore_trash', tier: 'gold', points: 100 },
      { title: 'Laundry Legend Bronze', description: 'Do laundry 5 times', icon: '👔', category: 'chore_laundry', tier: 'bronze', points: 0 },
      { title: 'Laundry Legend Silver', description: 'Do laundry 15 times', icon: '👔', category: 'chore_laundry', tier: 'silver', points: 50 },
      { title: 'Dishes Champion Bronze', description: 'Wash dishes 5 times', icon: '🍽️', category: 'chore_dishes', tier: 'bronze', points: 0 },
      { title: 'Dishes Champion Silver', description: 'Wash dishes 15 times', icon: '🍽️', category: 'chore_dishes', tier: 'silver', points: 50 },
      { title: 'Chore Helper', description: 'Complete any chore 10 times', icon: '🏡', category: 'chore', tier: 'bronze', points: 30 },
      { title: 'Chore Champion', description: 'Complete any chore 50 times', icon: '🏡', category: 'chore', tier: 'silver', points: 75 },
      { title: 'Household Manager', description: 'Complete any chore 100 times', icon: '🏡', category: 'chore', tier: 'gold', points: 150 },
    ];

    for (const badge of badges) {
      await client.query(
        'INSERT INTO badges (title, description, icon_emoji, category, tier, points_required) VALUES ($1, $2, $3, $4, $5, $6)',
        [badge.title, badge.description, badge.icon, badge.category, badge.tier, badge.points]
      );
    }
    console.log(`✅ Seeded ${badges.length} badges (activity + chore)`);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Feature flags: ${featureFlags.length}`);
    console.log(`   System settings: ${settings.length}`);
    console.log(`   Badges: ${badges.length} (activity + chore mastery)`);
    console.log('\nℹ️  Trivia: run `npm run seed:trivia`. Gujarati: `npm run seed:learning`.');
  } catch (error: unknown) {
    console.error('❌ Seeding failed:', getErrorMessage(error));
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
