-- 0025_cleanup_alpha_e2e_test.sql
-- Remove stale test data: the "Alpha e2e Test" challenge is public and live
-- but its end_date has passed. Delete its submissions first (FK cascade),
-- then delete the challenge row itself.

begin;
  -- Delete submissions for any challenge whose title contains 'e2e' or 'Alpha e2e Test'
  delete from public.submissions
  where challenge_id in (
    select id from public.challenges
    where title ilike '%alpha e2e%' or title ilike '%e2e test%'
  );

  -- Delete the stale test challenge(s)
  delete from public.challenges
  where title ilike '%alpha e2e%' or title ilike '%e2e test%';

  -- Run lifecycle transition to fix any other stale statuses
  select app_private.transition_challenge_statuses();
commit;
