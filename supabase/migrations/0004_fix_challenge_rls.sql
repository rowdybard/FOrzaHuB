-- Fix: Allow club owners to create challenges for their clubs
-- ----------------------------------------------------------------------------

-- Helper function to check if user is club owner
create or replace function app_private.is_club_owner(club_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.clubs
    where id = club_id
      and owner_id = auth.uid()
  );
$$;

revoke all on function app_private.is_club_owner(uuid) from public;
grant execute on function app_private.is_club_owner(uuid) to anon, authenticated;

-- Add policy for club owners to manage challenges
drop policy if exists "club owners manage challenges" on public.challenges;

create policy "club owners manage challenges"
  on public.challenges for all
  using (app_private.is_club_owner(club_id))
  with check (app_private.is_club_owner(club_id));
