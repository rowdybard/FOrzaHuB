-- 0007_one_submission_per_user.sql
-- Prevents users from having more than one active submission per challenge.
-- Rejected/withdrawn submissions don't block re-submission.

create unique index if not exists submissions_one_per_user
  on public.submissions (challenge_id, user_id)
  where status in ('pending', 'approved');

comment on index submissions_one_per_user is
  'Ensures a user can only have one pending or approved submission per challenge. Rejected submissions do not block re-submission.';
