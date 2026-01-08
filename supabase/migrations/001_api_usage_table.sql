-- Create API usage tracking table for rate limiting
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_name TEXT NOT NULL CHECK (api_name IN ('plantnet', 'weather', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for fast rate limit queries
CREATE INDEX IF NOT EXISTS idx_api_usage_user_api_time
ON api_usage(user_id, api_name, created_at DESC);

-- Enable Row-Level Security
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own API usage
CREATE POLICY "Users can view own API usage"
ON api_usage FOR SELECT
USING (auth.uid() = user_id);

-- Policy: System can insert usage records (for Edge Functions)
CREATE POLICY "System can insert API usage"
ON api_usage FOR INSERT
WITH CHECK (true);  -- Edge Functions run with service role

-- Add comment for documentation
COMMENT ON TABLE api_usage IS 'Tracks API usage for rate limiting. Each API call is logged here.';
COMMENT ON COLUMN api_usage.api_name IS 'Name of the API (plantnet, weather, etc.)';
COMMENT ON COLUMN api_usage.metadata IS 'Additional metadata about the API call (optional)';
