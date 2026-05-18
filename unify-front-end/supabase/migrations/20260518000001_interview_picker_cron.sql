-- Enable extensions if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any prior version of this job (safe re-apply)
SELECT cron.unschedule('pick-interview-candidates-weekly')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'pick-interview-candidates-weekly'
);

-- Sunday 6pm PDT = Monday 01:00 UTC. Drifts to 5pm PST in winter (acceptable).
-- The Authorization bearer is the project ANON key, which is public (it ships
-- in the React Native app bundle). The picker function has JWT verification
-- enabled, so this validates the request format; all real authorization is
-- done internally by the function using its service-role env var.
SELECT cron.schedule(
  'pick-interview-candidates-weekly',
  '0 1 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://wrbauxutkysljmsqojts.supabase.co/functions/v1/pick-interview-candidates',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYmF1eHV0a3lzbGptc3FvanRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxOTY4MzMsImV4cCI6MjA2Nzc3MjgzM30.rB-q1BN2dPUcg8whhoBgkZJdt1rXTxX6JiDj16dkwdo'
    ),
    body := '{}'::jsonb
  );
  $$
);
