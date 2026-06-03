-- Admin tools and owner-safe community management.
-- ----------------------------------------------------------------------------
-- Site staff can continue full moderation work. Club owners get scoped tools:
-- remove non-owner members, correct challenge title typos, and delete only
-- challenges that have no submissions.

create or replace function app_private.is_club_owner(target_club_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.clubs
    where id = target_club_id
      and owner_id = auth.uid()
  );
$$;

revoke all on function app_private.is_club_owner(uuid) from public, anon, authenticated;
grant execute on function app_private.is_club_owner(uuid) to authenticated;

grant delete on public.challenges to authenticated;

drop policy if exists "club owners manage challenges" on public.challenges;
drop policy if exists "club owners create challenges" on public.challenges;
drop policy if exists "club owners correct challenge titles" on public.challenges;
drop policy if exists "club owners delete empty challenges" on public.challenges;

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

create or replace function app_private.enforce_owner_challenge_limits()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if app_private.is_staff() then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if not (app_private.is_club_owner(old.club_id) and app_private.is_club_owner(new.club_id)) then
      raise exception 'Only staff or the owning club can update this challenge.';
    end if;

    if nullif(btrim(new.title), '') is null then
      raise exception 'Challenge title is required.';
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
$$;

revoke all on function app_private.enforce_owner_challenge_limits() from public, anon, authenticated;

drop trigger if exists owner_challenge_limits on public.challenges;
create trigger owner_challenge_limits
  before update or delete on public.challenges
  for each row execute function app_private.enforce_owner_challenge_limits();

drop policy if exists "club owners remove club members" on public.club_members;

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
