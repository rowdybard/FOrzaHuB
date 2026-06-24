-- 0018_fix_set_primary_club_rpc.sql
-- The set_primary_club function was created in app_private but PostgREST
-- exposes functions in the public schema. Create a public wrapper.

create or replace function public.set_primary_club(p_club_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Clear all existing primary flags for this user
  update public.club_members
    set is_primary = false
    where user_id = p_user_id;

  -- Set the new primary club
  update public.club_members
    set is_primary = true
    where club_id = p_club_id
      and user_id = p_user_id;

  -- If the user isn't a member of this club, raise an error
  if not found then
    raise exception 'User % is not a member of club %', p_user_id, p_club_id;
  end if;
end;
$$;

grant execute on function public.set_primary_club(uuid, uuid) to authenticated;
