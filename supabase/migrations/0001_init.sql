-- Pitwall - core schema
-- Run first in a fresh Supabase project.
-- ----------------------------------------------------------------------------

create extension if not exists "pgcrypto";

create schema if not exists app_private;

-- Profiles are one-to-one with auth.users. Discord signups are populated by
-- the trigger added in 0002_members_and_cosmetics.sql.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  gamertag     text unique not null,
  display_name text,
  country      text,
  platform     text check (platform in ('Xbox', 'PC', 'Cloud')) default 'PC',
  role         text not null check (role in ('racer', 'steward', 'admin')) default 'racer',
  created_at   timestamptz not null default now()
);

create table if not exists public.clubs (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  tag        text not null,
  region     text,
  members    int not null default 0,
  verified   boolean not null default false,
  accent     text not null default '#ff6b2c',
  tagline    text,
  about      text,
  discord    text,
  founded    text,
  owner_id   uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.challenges (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  type_id         text not null check (
                    type_id in ('time_trial', 'drift_score', 'drag_time', 'photo_contest', 'build_battle')
                  ),
  title           text not null,
  club_id         uuid not null references public.clubs (id) on delete cascade,
  status          text not null check (status in ('upcoming', 'live', 'reviewing', 'closed')) default 'upcoming',
  season          text,
  featured        boolean not null default false,
  start_date      timestamptz not null,
  end_date        timestamptz not null,
  region          text,
  restriction     text,
  location        text,
  prize           text,
  description     text,
  rules           text[] not null default '{}',
  visibility      text not null check (visibility in ('public', 'club')) default 'public',
  prerequisite_id uuid references public.challenges (id) on delete set null,
  is_sub_challenge boolean not null default false,
  parent_id       uuid references public.challenges (id) on delete cascade,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  check (end_date > start_date)
);

create table if not exists public.submissions (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  value        numeric,
  title        text,
  share_code   text,
  votes        int not null default 0,
  proof_type   text check (proof_type in ('video', 'screenshot', 'photo')),
  proof_url    text,
  note         text,
  status       text not null check (status in ('pending', 'flagged', 'approved', 'rejected')) default 'pending',
  flag         text,
  reviewed_by  uuid references public.profiles (id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists challenges_club_idx on public.challenges (club_id);
create index if not exists challenges_status_idx on public.challenges (status);
create index if not exists challenges_prerequisite_idx on public.challenges (prerequisite_id);
create index if not exists challenges_parent_idx on public.challenges (parent_id);
create index if not exists submissions_challenge_idx on public.submissions (challenge_id);
create index if not exists submissions_user_idx on public.submissions (user_id);
create index if not exists submissions_status_idx on public.submissions (status);

create or replace function app_private.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('steward', 'admin')
  );
$$;

create or replace view public.leaderboard
with (security_invoker = true) as
  select s.*, c.type_id, c.slug as challenge_slug
  from public.submissions s
  join public.challenges c on c.id = s.challenge_id
  where s.status = 'approved';

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.challenges enable row level security;
alter table public.submissions enable row level security;
