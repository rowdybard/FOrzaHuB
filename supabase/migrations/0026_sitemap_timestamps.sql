-- Add updated_at columns for dynamic sitemap lastmod values
-- Tracks when challenges and clubs were last modified.

-- Add updated_at to challenges
alter table public.challenges
  add column if not exists updated_at timestamptz not null default now();

-- Add updated_at to clubs
alter table public.clubs
  add column if not exists updated_at timestamptz not null default now();

-- Backfill existing rows
update public.challenges set updated_at = created_at where updated_at = now() and created_at < now();
update public.clubs set updated_at = created_at where updated_at = now() and created_at < now();

-- Index for sitemap queries (ordered by updated_at desc)
create index if not exists challenges_updated_at_idx on public.challenges (updated_at desc);
create index if not exists clubs_updated_at_idx on public.clubs (updated_at desc);

-- Auto-update updated_at on row changes
create or replace function app_private.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists challenges_set_updated_at on public.challenges;
create trigger challenges_set_updated_at
  before update on public.challenges
  for each row
  execute function app_private.set_updated_at();

drop trigger if exists clubs_set_updated_at on public.clubs;
create trigger clubs_set_updated_at
  before update on public.clubs
  for each row
  execute function app_private.set_updated_at();

-- Also update challenge updated_at when a submission is approved
-- (so sitemap reflects new leaderboard data)
create or replace function app_private.touch_challenge_updated_at()
returns trigger
language plpgsql as $$
begin
  if NEW.status = 'approved' and (OLD.status is null or OLD.status <> 'approved') then
    update public.challenges set updated_at = now() where id = NEW.challenge_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists submissions_touch_challenge on public.submissions;
create trigger submissions_touch_challenge
  after update of status on public.submissions
  for each row
  execute function app_private.touch_challenge_updated_at();
