-- ============================================================================
-- Remove legacy matchmaking cron now that community-matching-schedule exists
-- ============================================================================

do $$
declare
  _job_id bigint;
begin
  for _job_id in
    select jobid from cron.job where jobname = 'community-matching-cron'
  loop
    perform cron.unschedule(_job_id);
  end loop;
end;
$$;
