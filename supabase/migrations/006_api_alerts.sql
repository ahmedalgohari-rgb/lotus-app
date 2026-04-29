-- API USAGE ALERTS (optional, but recommended)
-- Run check_api_thresholds() periodically to detect when global daily usage
-- approaches the cap. Alerts get inserted into api_alerts; you can poll the
-- table from the dashboard, or wire pg_net.http_post to push to Slack/email.
--
-- Wiring pg_cron (one-time, in Supabase SQL editor):
--   create extension if not exists pg_cron with schema extensions;
--   select cron.schedule('check_api_thresholds', '*/15 * * * *',
--     $$ select check_api_thresholds() $$);
--   select cron.schedule('prune_api_buckets', '0 4 * * *',
--     $$ select prune_old_api_buckets() $$);

CREATE TABLE IF NOT EXISTS api_alerts (
  id BIGSERIAL PRIMARY KEY,
  api_name TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  threshold_pct INT,
  current_count INT,
  daily_cap INT,
  message TEXT,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_alerts_unacked
  ON api_alerts(api_name, created_at DESC)
  WHERE acknowledged = FALSE;

ALTER TABLE api_alerts ENABLE ROW LEVEL SECURITY;
-- No client policies — service role / SECURITY DEFINER functions only.

-- Inserts one alert per api per UTC day when global usage crosses 80% of cap.
-- Idempotent within a day (guarded by NOT EXISTS) so cron firing every 15 min
-- won't spam duplicates.
CREATE OR REPLACE FUNCTION check_api_thresholds()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cfg RECORD;
  current_count INT;
  threshold_count INT;
BEGIN
  FOR cfg IN
    SELECT api_name, max_calls_per_day
    FROM api_config
    WHERE max_calls_per_day IS NOT NULL
  LOOP
    SELECT COALESCE(SUM(count), 0) INTO current_count
    FROM api_usage_buckets
    WHERE api_name = cfg.api_name
      AND hour_bucket >= date_trunc('day', NOW() AT TIME ZONE 'UTC');

    threshold_count := (cfg.max_calls_per_day * 0.8)::INT;

    IF current_count >= threshold_count THEN
      INSERT INTO api_alerts (api_name, alert_type, threshold_pct, current_count, daily_cap, message)
      SELECT
        cfg.api_name,
        'global_threshold',
        80,
        current_count,
        cfg.max_calls_per_day,
        format(
          '%s usage at %s/%s (%s%%) — approaching daily cap',
          cfg.api_name,
          current_count,
          cfg.max_calls_per_day,
          ROUND((current_count::NUMERIC / cfg.max_calls_per_day) * 100)
        )
      WHERE NOT EXISTS (
        SELECT 1 FROM api_alerts
        WHERE api_name = cfg.api_name
          AND alert_type = 'global_threshold'
          AND created_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC')
      );
    END IF;
  END LOOP;
END;
$$;

COMMENT ON TABLE api_alerts IS 'Threshold breach notifications. Poll for unacknowledged rows from dashboard, or push to Slack via pg_net.';
COMMENT ON FUNCTION check_api_thresholds IS 'Checks all api_config rows against today''s usage. Inserts an alert when usage >= 80% of daily cap. Idempotent per day.';
