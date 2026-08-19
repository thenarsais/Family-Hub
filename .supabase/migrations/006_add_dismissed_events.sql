-- Create dismissed_events table to track which events user has dismissed
CREATE TABLE IF NOT EXISTS dismissed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  calendar_id VARCHAR(255),
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique combination of user and event
  CONSTRAINT dismissed_events_user_event_unique UNIQUE (user_id, event_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS dismissed_events_user_id_idx ON dismissed_events(user_id);
CREATE INDEX IF NOT EXISTS dismissed_events_calendar_id_idx ON dismissed_events(calendar_id);

-- Add RLS policies
ALTER TABLE dismissed_events ENABLE ROW LEVEL SECURITY;

-- Allow service_role to manage all dismissed events
CREATE POLICY "Service role can manage dismissed events"
  ON dismissed_events FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions to service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON dismissed_events TO service_role;
