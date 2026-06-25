-- 0021_fix_set_primary_club_security.sql
-- Fix: set_primary_club accepted a caller-provided p_user_id, allowing
-- a direct API caller to set another user's primary club. Derive the
-- user id from auth.uid() inside the function instead.

create or replace function public.set_primary_club(p_club_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  -- Clear all existing primary flags for this user
  update public.club_members
    set is_primary = false
    where user_id = v_user_id;

  -- Set the new primary club
  update public.club_members
    set is_primary = true
    where club_id = p_club_id
      and user_id = v_user_id;

  -- If the user isn't a member of this club, raise an error
  if not found then
    raise exception 'User % is not a member of club %', v_user_id, p_club_id;
  end if;
end;
$$;

-- Drop old unsafe two-arg functions and lock down grants
-- Wrapped in DO blocks to handle cases where they were already dropped
do $$ begin
  revoke all on function public.set_primary_club(uuid, uuid) from public, anon, authenticated;
exception when undefined_function then null; end $$;
drop function if exists public.set_primary_club(uuid, uuid);

do $$ begin
  revoke all on function app_private.set_primary_club(uuid, uuid) from public, anon, authenticated;
exception when undefined_function then null; end $$;
drop function if exists app_private.set_primary_club(uuid, uuid);

revoke all on function public.set_primary_club(uuid) from public, anon;
grant execute on function public.set_primary_club(uuid) to authenticated;
