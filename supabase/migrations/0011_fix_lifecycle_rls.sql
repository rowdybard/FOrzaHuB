-- Fix the transition function so it can actually update challenge statuses.
-- The enforce_owner_challenge_limits trigger blocks updates when auth.uid() is NULL
-- (system context). Allow system-level operations to bypass the owner check.

-- Ensure the transition function is owned by postgres (BYPASSRLS).
alter function app_private.transition_challenge_statuses() owner to postgres;

-- Recreate the trigger function to allow system-level operations (auth.uid() IS NULL).
-- This lets the automated lifecycle transition function update statuses without
-- being blocked by the owner check. Only the status field is changed by the
-- transition function — no other fields are touched.
create or replace function app_private.enforce_owner_challenge_limits()
returns trigger
language plpgsql security definer set search_path = public as $pitwall$
begin
  -- Allow system-level operations (automated transitions, cron, etc.)
  if auth.uid() is null then
    return new;
  end if;

  if app_private.is_staff() then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not app_private.is_club_owner(new.club_id) then
      raise exception 'Only staff or the owning club can create this challenge.';
    end if;

    if nullif(btrim(new.title), '') is null then
      raise exception 'Challenge title is required.';
    end if;

    if length(new.title) > 96 then
      raise exception 'Challenge title is too long.';
    end if;

    if new.featured
      or new.season is not null
      or new.prerequisite_id is not null
      or new.is_sub_challenge
      or new.parent_id is not null
    then
      raise exception 'Featured, season, prerequisite, and sub-challenge fields require staff.';
    end if;

    new.created_by := auth.uid();
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if not (app_private.is_club_owner(old.club_id) and app_private.is_club_owner(new.club_id)) then
      raise exception 'Only staff or the owning club can update this challenge.';
    end if;

    if nullif(btrim(new.title), '') is null then
      raise exception 'Challenge title is required.';
    end if;

    if length(new.title) > 96 then
      raise exception 'Challenge title is too long.';
    end if;

    if
      new.slug is not distinct from old.slug and
      new.type_id is not distinct from old.type_id and
      new.club_id is not distinct from old.club_id and
      new.status is not distinct from old.status and
      new.season is not distinct from old.season and
      new.featured is not distinct from old.featured and
      new.start_date is not distinct from old.start_date and
      new.end_date is not distinct from old.end_date and
      new.region is not distinct from old.region and
      new.restriction is not distinct from old.restriction and
      new.location is not distinct from old.location and
      new.prize is not distinct from old.prize and
      new.description is not distinct from old.description and
      new.rules is not distinct from old.rules and
      new.visibility is not distinct from old.visibility and
      new.prerequisite_id is not distinct from old.prerequisite_id and
      new.is_sub_challenge is not distinct from old.is_sub_challenge and
      new.parent_id is not distinct from old.parent_id and
      new.created_by is not distinct from old.created_by and
      new.created_at is not distinct from old.created_at
    then
      return new;
    end if;

    raise exception 'Club owners can only correct challenge title typos. Rules, schedule, restrictions, location, and other details require staff.';
  end if;

  if tg_op = 'DELETE' then
    if not app_private.is_club_owner(old.club_id) then
      raise exception 'Only staff or the owning club can delete this challenge.';
    end if;

    if exists (
      select 1 from public.submissions
      where challenge_id = old.id
        and status in ('pending', 'approved')
    ) then
      raise exception 'Cannot delete a challenge that has approved or pending submissions.';
    end if;

    return old;
  end if;

  return null;
end;
$pitwall$;

alter function app_private.enforce_owner_challenge_limits() owner to postgres;

-- Run the transition to fix any stale challenges.
select app_private.transition_challenge_statuses();
