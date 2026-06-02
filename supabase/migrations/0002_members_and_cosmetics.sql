-- Pitwall - profiles, club membership, and auth hooks
-- Run after 0001_init.sql.
-- ----------------------------------------------------------------------------

alter table public.profiles
  add column if not exists accent text,
  add column if not exists name_gradient boolean not null default false,
  add column if not exists badges text[] not null default '{}',
  add column if not exists avatar_url text;

create table if not exists public.club_members (
  club_id   uuid not null references public.clubs (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null check (role in ('member', 'steward', 'owner')) default 'member',
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create index if not exists club_members_user_idx on public.club_members (user_id);
create index if not exists club_members_club_idx on public.club_members (club_id);

alter table public.club_members enable row level security;

create or replace function app_private.sync_club_member_count()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  target_club_id uuid := coalesce(new.club_id, old.club_id);
begin
  update public.clubs
     set members = (
       select count(*)
       from public.club_members
       where club_id = target_club_id
     )
   where id = target_club_id;

  return null;
end;
$$;

drop trigger if exists club_members_count on public.club_members;
create trigger club_members_count
  after insert or delete on public.club_members
  for each row execute function app_private.sync_club_member_count();

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  username text := coalesce(
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
    username || '-' || substr(new.id::text, 1, 4),
    username,
    meta->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app_private.handle_new_user();
