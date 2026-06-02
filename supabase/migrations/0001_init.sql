-- Pitwall — initial schema
-- Run in the Supabase SQL editor, or via `supabase db push` with the CLI.
-- ----------------------------------------------------------------------------

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users) --------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  gamertag      text unique not null,
  display_name  text,
  country       text,
  platform      text check (platform in ('Xbox', 'PC', 'Cloud')) default 'PC',
  role          text not null check (role in ('racer', 'steward', 'admin')) default 'racer',
  created_at    timestamptz not null default now()
);

-- Clubs ----------------------------------------------------------------------
create table if not exists public.clubs (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  tag         text not null,
  region      text,
  members     int default 0,
  verified    boolean default false,
  accent      text default '#ff6b2c',
  tagline     text,
  about       text,
  discord     text,
  founded     text,
  owner_id    uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Challenges -----------------------------------------------------------------
create table if not exists public.challenges (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  type_id       text not null check (type_id in
                  ('time_trial', 'drift_score', 'drag_time', 'photo_contest', 'build_battle')),
  title         text not null,
  club_id       uuid not null references public.clubs (id) on delete cascade,
  status        text not null check (status in ('upcoming', 'live', 'reviewing', 'closed')) default 'upcoming',
  season        text,
  featured      boolean default false,
  start_date    timestamptz not null,
  end_date      timestamptz not null,
  region        text,
  restriction   text,
  location      text,
  prize         text,
  description   text,
  rules         text[] default '{}',
  visibility    text not null check (visibility in ('public', 'club')) default 'public',
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists challenges_club_idx on public.challenges (club_id);
create index if not exists challenges_status_idx on public.challenges (status);

-- Submissions (the single source of truth; approved rows = leaderboard) ------
create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.challenges (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  value         numeric,          -- time (seconds) or score; null for galleries
  title         text,             -- photo/build entry title
  share_code    text,             -- build battle share code
  votes         int default 0,    -- gallery vote count
  proof_type    text check (proof_type in ('video', 'screenshot', 'photo')),
  proof_url     text,
  note          text,
  status        text not null check (status in ('pending', 'flagged', 'approved', 'rejected')) default 'pending',
  flag          text,
  reviewed_by   uuid references public.profiles (id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists submissions_challenge_idx on public.submissions (challenge_id);
create index if not exists submissions_status_idx on public.submissions (status);

-- Helper: is the current user a steward/admin? -------------------------------
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('steward', 'admin')
  );
$$;

-- Public leaderboard view (verified results only) ---------------------------
create or replace view public.leaderboard as
  select s.*, c.type_id, c.slug as challenge_slug
  from public.submissions s
  join public.challenges c on c.id = s.challenge_id
  where s.status = 'approved';

-- Row-Level Security ---------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.clubs       enable row level security;
alter table public.challenges  enable row level security;
alter table public.submissions enable row level security;

-- Profiles: world-readable, users manage their own row.
create policy "profiles are public"        on public.profiles for select using (true);
create policy "users insert own profile"   on public.profiles for insert with check (auth.uid() = id);
create policy "users update own profile"   on public.profiles for update using (auth.uid() = id);

-- Clubs: world-readable, staff manage.
create policy "clubs are public"           on public.clubs for select using (true);
create policy "staff manage clubs"         on public.clubs for all using (public.is_staff()) with check (public.is_staff());

-- Challenges: world-readable, staff manage.
create policy "challenges are public"      on public.challenges for select using (true);
create policy "staff manage challenges"    on public.challenges for all using (public.is_staff()) with check (public.is_staff());

-- Submissions:
--   read: approved rows are public; you can always see your own; staff see all.
--   insert: authenticated users submit as themselves.
--   update: only staff (approve / flag / reject).
create policy "read approved or own subs"  on public.submissions for select
  using (status = 'approved' or auth.uid() = user_id or public.is_staff());
create policy "users create own subs"      on public.submissions for insert
  with check (auth.uid() = user_id);
create policy "staff review subs"          on public.submissions for update
  using (public.is_staff()) with check (public.is_staff());

-- Storage: proof bucket -------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do nothing;

create policy "proof files are public"     on storage.objects for select
  using (bucket_id = 'proofs');
create policy "authed users upload proof"  on storage.objects for insert
  with check (bucket_id = 'proofs' and auth.role() = 'authenticated');
