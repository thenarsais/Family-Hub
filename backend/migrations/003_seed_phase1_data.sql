-- Phase 1: Seed Data
-- Run this migration to populate the database with Phase 1 launch data

-- ============================================
-- FEATURE FLAGS
-- ============================================
INSERT INTO feature_flags (flag_name, is_enabled, description) VALUES
  ('wordle_game', true, 'Wordle game module'),
  ('quickfire_trivia', true, 'Quick-Fire Trivia game module'),
  ('word_scramble', true, 'Word Scramble game module'),
  ('hangman_game', true, 'Hangman game module'),
  ('daily_quests', true, 'Daily Quests module'),
  ('homework', true, 'Homework tracking module'),
  ('kung_fu', true, 'Kung Fu learning module'),
  ('habits', true, 'Habits tracking module'),
  ('reading', true, 'Reading tracking module'),
  ('mood_tracker', true, 'Mood tracking module'),
  ('gujarati_module', true, 'Gujarati learning module'),
  ('weekly_goals', true, 'Weekly goals module'),
  ('monthly_goals', true, 'Monthly goals module'),
  ('category_mastery', true, 'Category mastery tracking'),
  ('daily_challenge', true, 'Daily challenge mode'),
  ('streak_recovery', true, 'Streak recovery system'),
  ('parent_portal', true, 'Parent portal access'),
  ('google_drive_sync', true, 'Google Drive backup sync'),
  ('hint_token_system', true, 'Hint token system'),
  ('chore_points', true, 'Award points for chore completion'),
  ('chore_badges', true, 'Earn badges for chore mastery'),
  ('privacy_mode', true, 'Privacy/screensaver mode')
ON CONFLICT (flag_name) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

-- ============================================
-- SYSTEM SETTINGS
-- ============================================
INSERT INTO system_settings (setting_key, setting_value, setting_type) VALUES
  ('app_version', '1.0.0', 'string'),
  ('hints_per_day', '2', 'integer'),
  ('hints_earned_per_activity', '5', 'integer'),
  ('hints_cap', '10', 'integer'),
  ('points_multiplier', '1.0', 'float'),
  ('max_active_weekly_goals', '3', 'integer'),
  ('max_active_monthly_goals', '2', 'integer')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- ============================================
-- SAMPLE TRIVIA QUESTIONS (16 questions for testing)
-- ============================================
INSERT INTO trivia_questions (question, category, difficulty, correct_answer, incorrect_answers, points_value) VALUES
  ('What is the chemical symbol for gold?', 'science', 'easy', 'Au', ARRAY['Gd', 'Ag', 'Pt'], 10),
  ('How many planets are in our solar system?', 'science', 'easy', '8', ARRAY['7', '9', '10'], 10),
  ('What is the smallest planet in our solar system?', 'science', 'easy', 'Mercury', ARRAY['Venus', 'Mars', 'Pluto'], 10),
  ('What gas do plants absorb from the air?', 'science', 'easy', 'Carbon Dioxide', ARRAY['Oxygen', 'Nitrogen', 'Hydrogen'], 10),
  ('What is the fastest land animal?', 'science', 'easy', 'Cheetah', ARRAY['Lion', 'Horse', 'Gazelle'], 10),
  ('In which year did the Titanic sink?', 'history', 'easy', '1912', ARRAY['1910', '1915', '1920'], 10),
  ('Who was the first President of the United States?', 'history', 'easy', 'George Washington', ARRAY['Thomas Jefferson', 'John Adams', 'Benjamin Franklin'], 10),
  ('In which country is the Great Wall located?', 'history', 'easy', 'China', ARRAY['Japan', 'India', 'Vietnam'], 10),
  ('What is the most abundant element in the universe?', 'science', 'medium', 'Hydrogen', ARRAY['Helium', 'Oxygen', 'Carbon'], 20),
  ('What is the process by which plants make food from sunlight?', 'science', 'medium', 'Photosynthesis', ARRAY['Respiration', 'Fermentation', 'Digestion'], 20),
  ('Which river is the longest in the world?', 'geography', 'medium', 'Nile River', ARRAY['Amazon River', 'Yangtze River', 'Mississippi River'], 20),
  ('What is the capital of Australia?', 'geography', 'medium', 'Canberra', ARRAY['Sydney', 'Melbourne', 'Brisbane'], 20),
  ('What is the SI unit of electric current?', 'science', 'hard', 'Ampere', ARRAY['Volt', 'Ohm', 'Watt'], 30),
  ('What is the process called when a liquid turns into a gas?', 'science', 'hard', 'Evaporation', ARRAY['Condensation', 'Sublimation', 'Deposition'], 30),
  ('In which year did World War II end?', 'history', 'hard', '1945', ARRAY['1944', '1946', '1947'], 30),
  ('What is the largest planet in our solar system?', 'science', 'hard', 'Jupiter', ARRAY['Saturn', 'Neptune', 'Uranus'], 30)
ON CONFLICT DO NOTHING;

-- ============================================
-- BADGES (Activity + Chore Mastery)
-- ============================================
INSERT INTO badges (title, description, icon_emoji, category, tier, points_required) VALUES
  -- Activity Badges - Bronze
  ('First Steps', 'Complete your first quest', '👣', 'achievement', 'bronze', 0),
  ('Quiz Master', 'Answer 5 trivia questions correctly', '🧠', 'trivia', 'bronze', 50),
  ('Morning Routine', 'Complete morning habits for 3 consecutive days', '🌅', 'habits', 'bronze', 30),

  -- Activity Badges - Silver
  ('Knowledge Seeker', 'Answer 20 trivia questions correctly', '📚', 'trivia', 'silver', 200),
  ('Habit Hero', 'Complete daily habits for 7 consecutive days', '🦸', 'habits', 'silver', 100),
  ('Reading Enthusiast', 'Complete 3 books', '📖', 'reading', 'silver', 150),

  -- Activity Badges - Gold
  ('Trivia Champion', 'Answer 50 trivia questions correctly', '👑', 'trivia', 'gold', 500),
  ('Streak Master', 'Maintain a 30-day streak', '🔥', 'habits', 'gold', 300),
  ('Kung Fu Master', 'Complete 50 Kung Fu lessons', '🥋', 'activities', 'gold', 400),

  -- Activity Badges - Platinum
  ('Ultimate Champion', 'Answer 100 trivia questions correctly', '💎', 'trivia', 'platinum', 1000),
  ('Legendary Achiever', 'Earn all gold badges', '⭐', 'achievement', 'platinum', 800),

  -- Chore Badges - Trash
  ('Trash Master Bronze', 'Empty trash 5 times', '🗑️', 'chore_trash', 'bronze', 0),
  ('Trash Master Silver', 'Empty trash 15 times', '🗑️', 'chore_trash', 'silver', 50),
  ('Trash Master Gold', 'Empty trash 30 times', '🗑️', 'chore_trash', 'gold', 100),
  ('Trash Master Platinum', 'Empty trash 50 times', '🗑️', 'chore_trash', 'platinum', 200),

  -- Chore Badges - Laundry
  ('Laundry Legend Bronze', 'Do laundry 5 times', '👔', 'chore_laundry', 'bronze', 0),
  ('Laundry Legend Silver', 'Do laundry 15 times', '👔', 'chore_laundry', 'silver', 50),
  ('Laundry Legend Gold', 'Do laundry 30 times', '👔', 'chore_laundry', 'gold', 100),

  -- Chore Badges - Dishes
  ('Dishes Champion Bronze', 'Wash dishes 5 times', '🍽️', 'chore_dishes', 'bronze', 0),
  ('Dishes Champion Silver', 'Wash dishes 15 times', '🍽️', 'chore_dishes', 'silver', 50),
  ('Dishes Champion Gold', 'Wash dishes 30 times', '🍽️', 'chore_dishes', 'gold', 100),

  -- Chore Badges - General
  ('Chore Helper', 'Complete any chore 10 times', '🏡', 'chore', 'bronze', 30),
  ('Chore Champion', 'Complete any chore 50 times', '🏡', 'chore', 'silver', 75),
  ('Household Manager', 'Complete any chore 100 times', '🏡', 'chore', 'gold', 150),
  ('Household Legend', 'Complete any chore 200 times', '🏡', 'chore', 'platinum', 300)
ON CONFLICT DO NOTHING;

-- ============================================
-- CONTENT ITEMS (Quest templates sample)
-- ============================================
INSERT INTO content_items (content_type, title, description, category) VALUES
  ('quest_template', 'Trivia Master', 'Answer 10 trivia questions correctly', 'trivia'),
  ('quest_template', 'Word Warrior', 'Complete 5 Word Scramble games', 'word_scramble'),
  ('quest_template', 'Wordle Wonder', 'Win 3 Wordle games', 'wordle'),
  ('quest_template', 'Hangman Hero', 'Win 5 Hangman games', 'hangman'),
  ('quest_template', 'Reading Ranger', 'Read 50 pages', 'reading'),
  ('quest_template', 'Habit Builder', 'Complete a habit 7 times', 'habits'),
  ('quest_template', 'Chore Champion', 'Complete 5 chores', 'chores'),
  ('quest_template', 'Homework Helper', 'Complete 3 homework assignments', 'homework'),
  ('quest_template', 'Kung Fu Student', 'Complete 5 Kung Fu lessons', 'kung_fu'),
  ('quest_template', 'Mood Master', 'Log your mood for 7 consecutive days', 'mood')
ON CONFLICT DO NOTHING;

-- ============================================
-- SUMMARY: Seed data loaded
-- ============================================
-- Feature flags: 22
-- System settings: 7
-- Trivia questions: 16 (sample; full 1000+ in Phase 1B)
-- Badges: 27 (activity + chore)
-- Quest templates: 10 (sample; full 130+ in Phase 1B)
