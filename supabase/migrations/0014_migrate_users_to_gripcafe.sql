-- 0014_migrate_users_to_gripcafe.sql
-- Add Rowdybard and PurpleCone as members of the GripCafe club (the event host).
-- Users are looked up by display_name since their IDs are auth-generated UUIDs.

do $migrate$
declare
  v_club_id uuid;
  v_rowdy_id uuid;
  v_cone_id uuid;
begin
  -- Find the GripCafe club
  select id into v_club_id from public.clubs where slug = 'gripcafe' limit 1;
  if v_club_id is null then return; end if;

  -- Find Rowdybard (owner)
  select id into v_rowdy_id from public.profiles
    where display_name ilike 'Rowdybard%' or gamertag ilike 'Rowdybard%'
    limit 1;

  -- Find PurpleCone (member)
  select id into v_cone_id from public.profiles
    where display_name ilike 'PurpleCone%' or gamertag ilike 'PurpleCone%'
    limit 1;

  -- Add Rowdybard as owner
  if v_rowdy_id is not null then
    update public.club_members set is_primary = false where user_id = v_rowdy_id;
    insert into public.club_members (club_id, user_id, role, is_primary)
    values (v_club_id, v_rowdy_id, 'owner', true)
    on conflict (club_id, user_id) do update
      set role = 'owner', is_primary = true;
  end if;

  -- Add PurpleCone as member
  if v_cone_id is not null then
    update public.club_members set is_primary = false where user_id = v_cone_id;
    insert into public.club_members (club_id, user_id, role, is_primary)
    values (v_club_id, v_cone_id, 'member', true)
    on conflict (club_id, user_id) do update
      set role = 'member', is_primary = true;
  end if;

  -- Sync member count
  update public.clubs
    set members = (select count(*) from public.club_members where club_id = v_club_id)
    where id = v_club_id;
end
$migrate$;
