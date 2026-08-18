-- Fix user_integrations table to support string user IDs instead of UUIDs
-- This allows the demo auth system to work with Google OAuth

-- Drop the foreign key constraint
ALTER TABLE user_integrations DROP CONSTRAINT IF EXISTS user_integrations_user_provider_unique;
ALTER TABLE user_integrations DROP CONSTRAINT IF EXISTS user_integrations_user_id_fk;

-- Change user_id from UUID to TEXT
ALTER TABLE user_integrations ALTER COLUMN user_id TYPE VARCHAR(255);

-- Re-add the unique constraint
ALTER TABLE user_integrations ADD CONSTRAINT user_integrations_user_provider_unique UNIQUE (user_id, provider);

-- Create index for user_id
CREATE INDEX IF NOT EXISTS user_integrations_user_id_idx ON user_integrations(user_id);
