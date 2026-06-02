-- V1 / beta club limits:
-- - A user may create/own only one club.
-- - A user may join multiple clubs, capped at five memberships.
-- - A user may mark only one club as primary.
-- - Club creation automatically adds the creator as owner and primary member.

alter table public.club_members
  add column if not exists is_primary boolean not null default false;

revoke insert, update on public.clubs from authenticated;
grant insert (
  slug,
  name,
  tag,
  region,
  accent,
  tagline,
  about,
  discord,
  owner_id
) on public.clubs to authenticated;

revoke update on public.club_members from authenticated;
grant update (is_primary) on public.club_members to authenticated;

create unique index if not exists clubs_one_owned_per_user_idx
  on public.clubs (owner_id)
  where owner_id is not null;

create unique index if not exists club_members_one_primary_per_user_idx
  on public.club_members (user_id)
  where is_primary;

create or replace function app_private.enforce_club_membership_limits()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (
    select count(*)
    from public.club_members existing
    where existing.user_id = new.user_id
  ) >= 5 then
    raise exception 'You can join up to five clubs during beta.';
  end if;

  return new;
end;
$$;

revoke all on function app_private.enforce_club_membership_limits() from public, anon, authenticated;

drop trigger if exists club_members_beta_limit on public.club_members;
create trigger club_members_beta_limit
  before insert on public.club_members
  for each row execute function app_private.enforce_club_membership_limits();

create or replace function app_private.add_club_owner_membership()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is not null then
    update public.club_members
       set is_primary = false
     where user_id = new.owner_id;

    insert into public.club_members (club_id, user_id, role, is_primary)
    values (new.id, new.owner_id, 'owner', true)
    on conflict (club_id, user_id) do update
      set role = 'owner',
          is_primary = true;
  end if;

  return new;
end;
$$;

revoke all on function app_private.add_club_owner_membership() from public, anon, authenticated;

drop trigger if exists clubs_owner_membership on public.clubs;
create trigger clubs_owner_membership
  after insert on public.clubs
  for each row execute function app_private.add_club_owner_membership();

drop policy if exists "users create owned club" on public.clubs;

create policy "users create owned club"
  on public.clubs for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "users join clubs" on public.club_members;
drop policy if exists "users join one club" on public.club_members;
drop policy if exists "users leave clubs" on public.club_members;
drop policy if exists "users leave own member row" on public.club_members;
drop policy if exists "users set primary club" on public.club_members;

create policy "users join up to five clubs"
  on public.club_members for insert to authenticated
  with check (
    auth.uid() = user_id
    and role = 'member'
  );

create policy "users leave joined clubs"
  on public.club_members for delete to authenticated
  using (
    auth.uid() = user_id
    and role = 'member'
  );

create policy "users set primary club"
  on public.club_members for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
