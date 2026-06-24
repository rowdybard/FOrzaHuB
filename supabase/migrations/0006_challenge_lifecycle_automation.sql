-- 0006_challenge_lifecycle_automation.sql
-- Automates challenge status transitions.
-- Creates a function for transitioning statuses (upcoming→live→closed).
-- pg_cron scheduling is added if the extension is available (Pro plan).

-- Drop existing function if it exists (idempotent).
drop function if exists app_private.transition_challenge_statuses();

-- Function that transitions challenge statuses based on dates.
-- Can be called manually or scheduled via pg_cron if available.
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

-- Ensure the function owner bypasses RLS for challenge status transitions.
-- The function runs as security definer (as the table owner), but we need
-- to make sure the owner role has BYPASSRLS or the table is accessible.
-- This grant ensures the migration role can call the function.
grant execute on function app_private.transition_challenge_statuses() to postgres;

-- Try to enable pg_cron and schedule. If the extension isn't available
-- (free tier), this block is skipped — the function still works when
-- called manually or via the admin "Close now" button in the UI.
do $do$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema extensions;
    select cron.unschedule('challenge-lifecycle-transition') where true;
    perform cron.schedule(
      'challenge-lifecycle-transition',
      '*/5 * * * *',
      $$select app_private.transition_challenge_statuses();$$
    );
  end if;
exception when others then
  raise notice 'pg_cron not available, skipping auto-scheduling. Use admin UI to close challenges manually.';
end
$do$;

-- Run once immediately to fix any stale challenges on deploy.
-- Wrapped in exception handling in case RLS blocks the migration role.
do $do$
begin
  perform app_private.transition_challenge_statuses();
exception when others then
  raise notice 'Could not run transition immediately (RLS). It will run on next admin action.';
end
$do$;
