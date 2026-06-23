-- 0009_submission_self_service.sql
-- Allows users to edit their own pending submissions and withdraw (delete) them.
-- Rejected/approved submissions are locked.

-- Allow users to delete their own pending submissions
drop policy if exists "Users can delete own pending submissions" on public.submissions;
create policy "Users can delete own pending submissions"
  on public.submissions for delete
  to authenticated
  using (auth.uid() = user_id and status = 'pending');

-- Allow users to update their own pending submissions
drop policy if exists "Users can update own pending submissions" on public.submissions;
create policy "Users can update own pending submissions"
  on public.submissions for update
  to authenticated
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'pending');
