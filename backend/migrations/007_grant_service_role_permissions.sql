-- Grant permissions to service_role for user_integrations table
-- This allows the backend service to manage OAuth tokens

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_integrations TO service_role;
GRANT USAGE, SELECT ON SEQUENCE user_integrations_id_seq TO service_role;
