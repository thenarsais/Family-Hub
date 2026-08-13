-- Create user_integrations table for OAuth tokens and third-party integrations
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique combination of user and provider
  CONSTRAINT user_integrations_user_provider_unique UNIQUE (user_id, provider),

  -- Foreign key to users table (if exists)
  CONSTRAINT user_integrations_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS user_integrations_user_id_idx ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS user_integrations_provider_idx ON user_integrations(provider);
CREATE INDEX IF NOT EXISTS user_integrations_active_idx ON user_integrations(is_active);

-- Add RLS policies
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Only users can view/edit their own integrations
CREATE POLICY "Users can view their own integrations"
  ON user_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON user_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON user_integrations FOR DELETE
  USING (auth.uid() = user_id);
