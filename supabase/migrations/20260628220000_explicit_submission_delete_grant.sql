-- L6: Explicit DELETE grant on public.submissions for authenticated users.
-- ----------------------------------------------------------------------------
-- withdrawSubmission() in the client calls supabase .delete() on the
-- submissions table. This works today via Supabase's default Postgres grants,
-- but no migration ever issued an explicit `grant delete`. Add it now so the
-- capability doesn't silently disappear if defaults change.

grant delete on public.submissions to authenticated;
