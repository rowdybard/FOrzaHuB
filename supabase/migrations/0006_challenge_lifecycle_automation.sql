-- 0006_challenge_lifecycle_automation.sql
-- Automates challenge status transitions using pg_cron.
-- Runs every 5 minutes: upcoming→live when start_date passes, live→closed when end_date passes.

-- Enable pg_cron if not already enabled.
create extension if not exists pg_cron with schema extensions;

-- Drop existing function/job if they exist (idempotent).
drop function if exists app_private.transition_challenge_statuses();
select cron.unschedule('challenge-lifecycle-transition') where true;

-- Function that transitions challenge statuses based on dates.
create or replace function app_private.transition_challenge_statuses()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- upcoming → live: start date has passed
  update public.challenges
    set status = 'live'
    where status = 'upcoming'
      and start_date <= now();

  -- live → closed: end date has passed
  update public.challenges
    set status = 'closed'
    where status = 'live'
      and end_date <= now();
end;
$$;

-- Schedule it every 5 minutes.
select cron.schedule(
  'challenge-lifecycle-transition',
  '*/5 * * * *',
  $$select app_private.transition_challenge_statuses();$$
);

-- Run once immediately to fix any stale challenges on deploy.
select app_private.transition_challenge_statuses();
