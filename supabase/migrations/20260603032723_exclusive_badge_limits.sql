-- Keep status/exclusive badges out of self-service profile edits.
-- ----------------------------------------------------------------------------
-- The app lets racers choose cosmetic flair badges, but badges like Founder,
-- Champion, Veteran, and Marshal should only be assigned by staff/admin SQL.

create or replace function app_private.enforce_profile_badge_limits()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  self_service_badges constant text[] := array['tuner', 'media', 'pace', 'clean', 'bbs'];
  exclusive_badges constant text[] := array['verified', 'founder', 'veteran', 'champion', 'marshal'];
  known_badges constant text[] := array[
    'verified',
    'founder',
    'veteran',
    'champion',
    'tuner',
    'media',
    'pace',
    'clean',
    'marshal',
    'bbs'
  ];
begin
  new.badges := coalesce(new.badges, '{}');

  if exists (
    select 1
    from unnest(new.badges) as profile_badge(id)
    where profile_badge.id <> all(known_badges)
  ) then
    raise exception 'Unknown profile badge.';
  end if;

  if app_private.is_staff() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if exists (
      select 1
      from unnest(new.badges) as profile_badge(id)
      where profile_badge.id <> all(self_service_badges)
    ) then
      raise exception 'Exclusive badges must be assigned by staff.';
    end if;
    return new;
  end if;

  if exists (
    select 1
    from unnest(new.badges) as profile_badge(id)
    where profile_badge.id <> all(old.badges)
      and profile_badge.id <> all(self_service_badges)
  ) then
    raise exception 'Exclusive badges must be assigned by staff.';
  end if;

  if exists (
    select 1
    from unnest(old.badges) as profile_badge(id)
    where profile_badge.id = any(exclusive_badges)
      and profile_badge.id <> all(new.badges)
  ) then
    raise exception 'Exclusive badges cannot be removed from this editor.';
  end if;

  return new;
end;
$$;

revoke all on function app_private.enforce_profile_badge_limits() from public, anon, authenticated;

drop trigger if exists profile_badge_limits on public.profiles;
create trigger profile_badge_limits
  before insert or update of badges on public.profiles
  for each row execute function app_private.enforce_profile_badge_limits();
