-- LIVE-TUNABLE API GOVERNANCE
-- Replaces hardcoded RATE_LIMIT in identify-plant/index.ts and per-event
-- api_usage logging with two pieces:
--   1. api_config        — knobs you edit in the Supabase dashboard
--   2. api_usage_buckets — aggregated counters (one row per user-per-hour)
--
-- After this migration, changing rate limits / pausing the API requires
-- only a row update in api_config — no Edge Function redeploy.

-- ==========================================
-- 1. api_config — live knobs per upstream API
-- ==========================================
CREATE TABLE IF NOT EXISTS api_config (
  api_name TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  rate_limit_per_hour INT NOT NULL DEFAULT 30,
  max_calls_per_day INT,
  maintenance_message TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE api_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read api_config" ON api_config;
CREATE POLICY "Authenticated can read api_config"
ON api_config FOR SELECT
TO authenticated
USING (TRUE);

-- Seed plantnet with values that preserve current production behavior
-- (rate_limit_per_hour=30 matches the hardcoded value being removed from the Edge Function)
INSERT INTO api_config (api_name, enabled, rate_limit_per_hour, max_calls_per_day, maintenance_message, notes)
VALUES (
  'plantnet',
  TRUE,
  30,
  400,
  'Plant identification is paused for maintenance. Please try again later.',
  'PlantNet free tier = 500/day. Daily cap of 400 leaves 20% headroom and acts as a circuit breaker against runaway usage.'
)
ON CONFLICT (api_name) DO NOTHING;

COMMENT ON TABLE api_config IS 'Live-tunable rate limits and kill switches per upstream API. Edit rows to change behavior — no redeploy needed.';
COMMENT ON COLUMN api_config.enabled IS 'Kill switch — set FALSE to pause this API immediately (returns 503 to clients).';
COMMENT ON COLUMN api_config.rate_limit_per_hour IS 'Max requests per hour per user.';
COMMENT ON COLUMN api_config.max_calls_per_day IS 'Global circuit breaker — total requests/day across ALL users. NULL = unlimited.';
COMMENT ON COLUMN api_config.maintenance_message IS 'User-facing message returned when enabled=FALSE.';

-- ==========================================
-- 2. api_usage_buckets — aggregated counters
-- ==========================================
-- One row per (api_name, user_id, hour). UPSERT incrementally instead of
-- inserting an event row per request. ~30x fewer rows than the old api_usage.
CREATE TABLE IF NOT EXISTS api_usage_buckets (
  api_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hour_bucket TIMESTAMPTZ NOT NULL,
  count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (api_name, user_id, hour_bucket)
);

CREATE INDEX IF NOT EXISTS idx_buckets_api_hour
  ON api_usage_buckets(api_name, hour_bucket DESC);

ALTER TABLE api_usage_buckets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own buckets" ON api_usage_buckets;
CREATE POLICY "Users read own buckets"
ON api_usage_buckets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- No client-side INSERT/UPDATE policies — writes go through the
-- SECURITY DEFINER function below, which scopes to auth.uid().

COMMENT ON TABLE api_usage_buckets IS 'Aggregated counter rollups per (api, user, hour). Replaces per-event api_usage logging.';

-- ==========================================
-- 3. Helpers (SECURITY DEFINER — bypass RLS for aggregates and atomic UPSERT)
-- ==========================================

-- Atomically +1 the calling user's bucket for the given hour.
-- Uses auth.uid() so a malicious client cannot increment another user's bucket.
CREATE OR REPLACE FUNCTION increment_api_usage_bucket(
  p_api_name TEXT,
  p_hour_bucket TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO api_usage_buckets (api_name, user_id, hour_bucket, count, updated_at)
  VALUES (p_api_name, auth.uid(), p_hour_bucket, 1, NOW())
  ON CONFLICT (api_name, user_id, hour_bucket)
  DO UPDATE SET
    count = api_usage_buckets.count + 1,
    updated_at = NOW();
$$;

GRANT EXECUTE ON FUNCTION increment_api_usage_bucket(TEXT, TIMESTAMPTZ) TO authenticated;

-- Returns total calls today across ALL users for the given API.
-- Used for the global circuit breaker (max_calls_per_day).
CREATE OR REPLACE FUNCTION get_api_global_daily_count(p_api_name TEXT)
RETURNS INT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(count), 0)::INT
  FROM api_usage_buckets
  WHERE api_name = p_api_name
    AND hour_bucket >= date_trunc('day', NOW() AT TIME ZONE 'UTC');
$$;

GRANT EXECUTE ON FUNCTION get_api_global_daily_count(TEXT) TO authenticated;

-- Bucket pruning — keep last 30 days. Wire to pg_cron when ready.
CREATE OR REPLACE FUNCTION prune_old_api_buckets()
RETURNS INT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH deleted AS (
    DELETE FROM api_usage_buckets
    WHERE hour_bucket < NOW() - INTERVAL '30 days'
    RETURNING 1
  )
  SELECT COUNT(*)::INT FROM deleted;
$$;

COMMENT ON FUNCTION increment_api_usage_bucket IS 'Atomically increments the calling user''s bucket for the given hour. Scoped to auth.uid().';
COMMENT ON FUNCTION get_api_global_daily_count IS 'Total calls today across all users. Used for global circuit breaker.';
COMMENT ON FUNCTION prune_old_api_buckets IS 'Deletes buckets older than 30 days. Returns row count.';







https://graph.facebook.com/v19.0/me?access_token=EAAT2ZAbhdBksBRXkwpVRZCPYcBZAs624AcmoZA0uw3IzIZBrjJMyik9fAR9m7WxkZBZAchvTZARWKlsZBeIs5Ew3HB6hpbzKa2cnEmUt8iEZBIlzY5tcZCmHEZBbOU4PXvZBmzOlvy8JLxBNNqmO0iD6MFbHIQqENhDZAF4zwXLkJL4hhQRttzZB85MNzSJqukmduJ4KpxZBpEYzzJ96mZBiCjMK3iNB0B9qlDZCWMzTRmb1TVyyvCOQlVIZBdkAfEAmmtDjAZA4gHFisi5VMb4zu3ZArhb5JWOrE5ZCT88SZCtlbfY8FmVoUcKzbSoPe3ahUuhSeX4COhdcZCLtKVuNgFuKLwZDZD