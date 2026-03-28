-- ============================================================
-- DSE Market Data Scraper — Cron Setup
-- ============================================================
-- Run this in your MAIN Supabase SQL Editor (fnwmvopralrpvryncxdc)
-- The Edge Function is deployed on YOUR project, it writes to the DSE Supabase
-- ============================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA cron TO postgres;

-- 2. Schedule scraper every 5 minutes
--    DSE market hours: Sun-Thu 10:00-14:30 BST (UTC+6) = UTC 04:00-08:30
SELECT cron.schedule(
  'scrape-dse-prices',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fnwmvopralrpvryncxdc.supabase.co/functions/v1/scrape-dse',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZud212b3ByYWxycHZyeW5jeGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTU1NjMsImV4cCI6MjA4ODczMTU2M30.-un-PaiVxEYY1ce_pVSYPJalhrG8xFB6-Z5l8pQClC4',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 3. Verify
SELECT * FROM cron.job;

-- ============================================================
-- BEFORE deploying, set DSE credentials as secrets:
--
--   supabase secrets set DSE_SUPABASE_URL=https://bbyrxqkoqeroymqlykcj.supabase.co
--   supabase secrets set DSE_SUPABASE_KEY=<your DSE service_role key>
--
-- Deploy:
--   supabase functions deploy scrape-dse
--
-- Management:
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--   SELECT cron.unschedule('scrape-dse-prices');
-- ============================================================
