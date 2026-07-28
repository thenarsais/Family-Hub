"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../.env.local' });
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
}
async function seed() {
    const client = new pg_1.Client({ connectionString });
    try {
        await client.connect();
        console.log('🌱 Seeding database...\n');
        // Seed Trivia Questions
        const triviaQuestions = [
            // Easy - Science
            { question: 'What is the chemical symbol for gold?', category: 'science', difficulty: 'easy', correct: 'Au', incorrect: ['Gd', 'Ag', 'Pt'] },
            { question: 'How many planets are in our solar system?', category: 'science', difficulty: 'easy', correct: '8', incorrect: ['7', '9', '10'] },
            { question: 'What is the smallest planet in our solar system?', category: 'science', difficulty: 'easy', correct: 'Mercury', incorrect: ['Venus', 'Mars', 'Pluto'] },
            { question: 'What gas do plants absorb from the air?', category: 'science', difficulty: 'easy', correct: 'Carbon Dioxide', incorrect: ['Oxygen', 'Nitrogen', 'Hydrogen'] },
            { question: 'What is the fastest land animal?', category: 'science', difficulty: 'easy', correct: 'Cheetah', incorrect: ['Lion', 'Horse', 'Gazelle'] },
            // Easy - History
            { question: 'In which year did the Titanic sink?', category: 'history', difficulty: 'easy', correct: '1912', incorrect: ['1910', '1915', '1920'] },
            { question: 'Who was the first President of the United States?', category: 'history', difficulty: 'easy', correct: 'George Washington', incorrect: ['Thomas Jefferson', 'John Adams', 'Benjamin Franklin'] },
            { question: 'In which country is the Great Wall located?', category: 'history', difficulty: 'easy', correct: 'China', incorrect: ['Japan', 'India', 'Vietnam'] },
            // Medium - Science
            { question: 'What is the most abundant element in the universe?', category: 'science', difficulty: 'medium', correct: 'Hydrogen', incorrect: ['Helium', 'Oxygen', 'Carbon'] },
            { question: 'What is the process by which plants make food from sunlight?', category: 'science', difficulty: 'medium', correct: 'Photosynthesis', incorrect: ['Respiration', 'Fermentation', 'Digestion'] },
            // Medium - Geography
            { question: 'Which river is the longest in the world?', category: 'geography', difficulty: 'medium', correct: 'Nile River', incorrect: ['Amazon River', 'Yangtze River', 'Mississippi River'] },
            { question: 'What is the capital of Australia?', category: 'geography', difficulty: 'medium', correct: 'Canberra', incorrect: ['Sydney', 'Melbourne', 'Brisbane'] },
            // Hard - Science
            { question: 'What is the SI unit of electric current?', category: 'science', difficulty: 'hard', correct: 'Ampere', incorrect: ['Volt', 'Ohm', 'Watt'] },
            { question: 'What is the process called when a liquid turns into a gas?', category: 'science', difficulty: 'hard', correct: 'Evaporation', incorrect: ['Condensation', 'Sublimation', 'Deposition'] },
        ];
        for (const q of triviaQuestions) {
            await client.query('INSERT INTO trivia_questions (question, category, difficulty, correct_answer, incorrect_answers, points_value) VALUES ($1, $2, $3, $4, $5, $6)', [
                q.question,
                q.category,
                q.difficulty,
                q.correct,
                q.incorrect,
                q.difficulty === 'easy' ? 10 : q.difficulty === 'medium' ? 20 : 30
            ]);
        }
        console.log(`✅ Seeded ${triviaQuestions.length} trivia questions`);
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
            await client.query(`INSERT INTO feature_flags (flag_name, is_enabled)
         VALUES ($1, $2)
         ON CONFLICT (flag_name) DO UPDATE SET is_enabled = $2`, [flag.name, flag.enabled]);
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
            await client.query(`INSERT INTO system_settings (setting_key, setting_value, setting_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2`, [setting.key, setting.value, setting.type]);
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
            await client.query('INSERT INTO badges (title, description, icon_emoji, category, tier, points_required) VALUES ($1, $2, $3, $4, $5, $6)', [badge.title, badge.description, badge.icon, badge.category, badge.tier, badge.points]);
        }
        console.log(`✅ Seeded ${badges.length} badges (activity + chore)`);
        console.log('\n✨ Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   Trivia questions: ${triviaQuestions.length}`);
        console.log(`   Feature flags: ${featureFlags.length}`);
        console.log(`   System settings: ${settings.length}`);
        console.log(`   Badges: ${badges.length} (activity + chore mastery)`);
        console.log('\n⚠️  Note: This is Phase 1 seed data.');
        console.log('   Full seed data (1000+ trivia, 130+ quests) will be imported in Phase 1B.');
    }
    catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
    finally {
        await client.end();
    }
}
seed();
//# sourceMappingURL=seed.js.map