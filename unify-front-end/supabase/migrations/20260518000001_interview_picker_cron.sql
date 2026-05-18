-- Enable extensions if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any prior version of this job (safe re-apply)
SELECT cron.unschedule('pick-interview-candidates-weekly')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'pick-interview-candidates-weekly'
);

-- Sunday 6pm PDT = Monday 01:00 UTC. Drifts to 5pm PST in winter (acceptable).
-- The picker function is deployed with --no-verify-jwt because the only
-- caller is this cron (and rare manual smoke tests via curl during testing).
-- All authorization is done internally by the function using its service-role
-- env var. Avoiding any Authorization header keeps secrets out of source.
SELECT cron.schedule(
  'pick-interview-candidates-weekly',
  '0 1 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://wrbauxutkysljmsqojts.supabase.co/functions/v1/pick-interview-candidates',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
