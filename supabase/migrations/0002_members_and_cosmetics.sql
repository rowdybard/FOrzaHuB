-- Pitwall — club membership + profile name cosmetics + auto-profile on signup
-- Run after 0001_init.sql. Safe to run more than once.
-- ----------------------------------------------------------------------------

-- Profile cosmetics (Option A "Nameplate") ----------------------------------
-- accent       : curated hex color for the racer's name + avatar ring
-- name_gradient: render the name as a subtle 2-stop gradient instead of solid
-- badges       : selectable cosmetic badge ids (role/earned badges are derived)
alter table public.profiles
  add column if not exists accent        text,
  add column if not exists name_gradient boolean not null default false,
  add column if not exists badges        text[]  not null default '{}',
  add column if not exists avatar_url     text;

-- Club membership join table -------------------------------------------------
create table if not exists public.club_members (
  club_id    uuid not null references public.clubs (id)     on delete cascade,
  user_id    uuid not null references public.profiles (id)  on delete cascade,
  role       text not null check (role in ('member', 'steward', 'owner')) default 'member',
  joined_at  timestamptz not null default now(),
  primary key (club_id, user_id)
);
create index if not exists club_members_user_idx on public.club_members (user_id);
create index if not exists club_members_club_idx on public.club_members (club_id);

alter table public.club_members enable row level security;

-- Public read; users join/leave their own row; staff manage everyone.
drop policy if exists "club members are public"   on public.club_members;
drop policy if exists "users join clubs"           on public.club_members;
drop policy if exists "users leave clubs"          on public.club_members;
drop policy if exists "staff manage memberships"   on public.club_members;

create policy "club members are public" on public.club_members
  for select using (true);
create policy "users join clubs" on public.club_members
  for insert with check (auth.uid() = user_id);
create policy "users leave clubs" on public.club_members
  for delete using (auth.uid() = user_id);
create policy "staff manage memberships" on public.club_members
  for all using (public.is_staff()) with check (public.is_staff());

-- Keep clubs.members in sync with the roster --------------------------------
create or replace function public.sync_club_member_count()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  target uuid := coalesce(new.club_id, old.club_id);
begin
  update public.clubs
    set members = (select count(*) from public.club_members where club_id = target)
    where id = target;
  return null;
end;
$$;

drop trigger if exists club_members_count on public.club_members;
create trigger club_members_count
  after insert or delete on public.club_members
  for each row execute function public.sync_club_member_count();

-- Auto-create a profile row on first login (Discord OAuth) -------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  uname text := coalesce(
    meta->'custom_claims'->>'global_name',
    meta->>'full_name',
    meta->>'name',
    meta->>'user_name',
    split_part(new.email, '@', 1),
    'racer'
  );
begin
  insert into public.profiles (id, gamertag, display_name, avatar_url)
  values (
    new.id,
    -- gamertag must be unique; suffix with a short uid slice to avoid clashes
    uname || '-' || substr(new.id::text, 1, 4),
    uname,
    meta->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
