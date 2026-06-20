-- Alpha v0.1 security hardening.
-- ----------------------------------------------------------------------------
-- Defense in depth for the public client:
-- - replace the old broad club-owner challenge policy if it exists;
-- - scope owner challenge inserts to normal event fields;
-- - force ordinary submissions into pending review;
-- - block direct submissions to closed/non-visible challenges.

begin;

grant delete on public.challenges to authenticated;

drop policy if exists "club owners manage challenges" on public.challenges;
drop policy if exists "club owners create challenges" on public.challenges;
drop policy if exists "club owners correct challenge titles" on public.challenges;
drop policy if exists "club owners delete empty challenges" on public.challenges;
drop policy if exists "club owners remove club members" on public.club_members;

create policy "club owners create challenges"
  on public.challenges for insert to authenticated
  with check (app_private.is_club_owner(club_id));

create policy "club owners correct challenge titles"
  on public.challenges for update to authenticated
  using (app_private.is_club_owner(club_id))
  with check (app_private.is_club_owner(club_id));

create policy "club owners delete empty challenges"
  on public.challenges for delete to authenticated
  using (app_private.is_club_owner(club_id));

create policy "club owners remove club members"
  on public.club_members for delete to authenticated
  using (
    app_private.is_club_owner(club_id)
    and user_id <> auth.uid()
    and role <> 'owner'
    and not exists (
      select 1
      from public.profiles
      where id = club_members.user_id
        and role in ('admin', 'steward')
    )
  );

create or replace function app_private.enforce_owner_challenge_limits()
returns trigger
language plpgsql security definer set search_path = public as $pitwall$
begin
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

    if coalesce(length(new.description), 0) > 2000
      or coalesce(length(new.rules::text), 0) > 4000
      or coalesce(length(new.restriction), 0) > 180
      or coalesce(length(new.location), 0) > 180
      or coalesce(length(new.region), 0) > 120
      or coalesce(length(new.prize), 0) > 180
    then
      raise exception 'Challenge details are too long.';
    end if;

    if new.status not in ('live', 'upcoming') then
      raise exception 'Club owners can only create live or upcoming challenges.';
    end if;

    if new.visibility not in ('public', 'club') then
      raise exception 'Invalid challenge visibility.';
    end if;

    if new.end_date <= new.start_date then
      raise exception 'Challenge close date must be after the open date.';
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
      select 1
      from public.submissions
      where challenge_id = old.id
    ) then
      raise exception 'Challenges with submissions cannot be deleted by club owners.';
    end if;

    return old;
  end if;

  return new;
end;
$pitwall$;

revoke all on function app_private.enforce_owner_challenge_limits() from public, anon, authenticated;

drop trigger if exists owner_challenge_limits on public.challenges;
create trigger owner_challenge_limits
  before insert or update or delete on public.challenges
  for each row execute function app_private.enforce_owner_challenge_limits();

create or replace function app_private.enforce_submission_limits()
returns trigger
language plpgsql security definer set search_path = public as $pitwall$
declare
  target_challenge public.challenges%rowtype;
begin
  if tg_op = 'INSERT' then
    if app_private.is_staff() then
      return new;
    end if;

    if new.user_id is distinct from auth.uid() then
      raise exception 'Submissions must be created by the signed-in user.';
    end if;

    select *
      into target_challenge
      from public.challenges
      where id = new.challenge_id;

    if not found then
      raise exception 'Challenge not found.';
    end if;

    if target_challenge.status <> 'live' then
      raise exception 'This challenge is not accepting submissions.';
    end if;

    if target_challenge.start_date > now() or target_challenge.end_date <= now() then
      raise exception 'This challenge is not accepting submissions.';
    end if;

    if target_challenge.visibility = 'club' and not exists (
      select 1
      from public.club_members cm
      where cm.club_id = target_challenge.club_id
        and cm.user_id = auth.uid()
    ) then
      raise exception 'This challenge is only open to club members.';
    end if;

    if coalesce(length(new.title), 0) > 120
      or coalesce(length(new.share_code), 0) > 80
      or coalesce(length(new.proof_url), 0) > 700
      or coalesce(length(new.note), 0) > 1000
      or coalesce(length(new.flag), 0) > 500
    then
      raise exception 'Submission details are too long.';
    end if;

    if new.proof_type not in ('video', 'photo', 'screenshot') then
      raise exception 'Invalid proof type.';
    end if;

    new.status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.flag := null;
    new.votes := 0;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if not app_private.is_staff() then
      raise exception 'Only staff can update submissions after they are created.';
    end if;
    return new;
  end if;

  return new;
end;
$pitwall$;

revoke all on function app_private.enforce_submission_limits() from public, anon, authenticated;

drop trigger if exists submission_limits on public.submissions;
create trigger submission_limits
  before insert or update on public.submissions
  for each row execute function app_private.enforce_submission_limits();

commit;
