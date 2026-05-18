-- Enable extensions if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Sunday 6pm PDT = Monday 01:00 UTC. Drifts to 5pm PST in winter (acceptable).
SELECT cron.schedule(
  'pick-interview-candidates-weekly',
  '0 1 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/pick-interview-candidates',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
