-- Pitwall - API access, RLS policies, and storage
-- Run after 0001_init.sql and 0002_members_and_cosmetics.sql.
-- ----------------------------------------------------------------------------

-- Private helper access ------------------------------------------------------
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;

revoke all on function app_private.is_staff() from public;
grant execute on function app_private.is_staff() to anon, authenticated;

revoke all on function app_private.sync_club_member_count() from public, anon, authenticated;
revoke all on function app_private.handle_new_user() from public, anon, authenticated;

-- Data API grants ------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on
  public.profiles,
  public.clubs,
  public.challenges,
  public.submissions,
  public.club_members,
  public.leaderboard
to anon, authenticated;

grant insert on public.submissions to authenticated;
grant insert, delete on public.club_members to authenticated;
grant update (role) on public.club_members to authenticated;
grant insert, update on public.clubs, public.challenges to authenticated;
grant update (status, flag, reviewed_by, reviewed_at) on public.submissions to authenticated;

-- Users may update only safe profile columns. Role and gamertag stay SQL-only.
grant insert (
  id,
  gamertag,
  display_name,
  country,
  platform,
  accent,
  name_gradient,
  badges,
  avatar_url
) on public.profiles to authenticated;

revoke update on public.profiles from anon, authenticated;
grant update (
  display_name,
  country,
  platform,
  accent,
  name_gradient,
  badges,
  avatar_url
) on public.profiles to authenticated;

-- Profile policies -----------------------------------------------------------
drop policy if exists "profiles are public" on public.profiles;
drop policy if exists "users insert own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
drop policy if exists "users update own safe profile columns" on public.profiles;

create policy "profiles are public"
  on public.profiles for select
  using (true);

create policy "users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users update own safe profile columns"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Club policies --------------------------------------------------------------
drop policy if exists "clubs are public" on public.clubs;
drop policy if exists "staff manage clubs" on public.clubs;

create policy "clubs are public"
  on public.clubs for select
  using (true);

create policy "staff manage clubs"
  on public.clubs for all
  using (app_private.is_staff())
  with check (app_private.is_staff());

-- Challenge policies ---------------------------------------------------------
drop policy if exists "challenges are public" on public.challenges;
drop policy if exists "staff manage challenges" on public.challenges;

create policy "challenges are public"
  on public.challenges for select
  using (
    visibility = 'public'
    or app_private.is_staff()
    or exists (
      select 1
      from public.club_members cm
      where cm.club_id = challenges.club_id
        and cm.user_id = auth.uid()
    )
  );

create policy "staff manage challenges"
  on public.challenges for all
  using (app_private.is_staff())
  with check (app_private.is_staff());

-- Submission policies --------------------------------------------------------
drop policy if exists "read approved or own subs" on public.submissions;
drop policy if exists "users create own subs" on public.submissions;
drop policy if exists "staff review subs" on public.submissions;

create policy "read approved or own subs"
  on public.submissions for select
  using (status = 'approved' or auth.uid() = user_id or app_private.is_staff());

create policy "users create own subs"
  on public.submissions for insert
  with check (auth.uid() = user_id);

create policy "staff review subs"
  on public.submissions for update
  using (app_private.is_staff())
  with check (app_private.is_staff());

-- Club membership policies ---------------------------------------------------
drop policy if exists "club members are public" on public.club_members;
drop policy if exists "users join clubs" on public.club_members;
drop policy if exists "users leave clubs" on public.club_members;
drop policy if exists "staff manage memberships" on public.club_members;

create policy "club members are public"
  on public.club_members for select
  using (true);

create policy "users join clubs"
  on public.club_members for insert
  with check (auth.uid() = user_id);

create policy "users leave clubs"
  on public.club_members for delete
  using (auth.uid() = user_id);

create policy "staff manage memberships"
  on public.club_members for all
  using (app_private.is_staff())
  with check (app_private.is_staff());

-- Proof storage --------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "proof files are public" on storage.objects;
drop policy if exists "authed users upload proof" on storage.objects;
drop policy if exists "authed users upload own proof" on storage.objects;

create policy "proof files are public"
  on storage.objects for select
  using (bucket_id = 'proofs');

create policy "authed users upload own proof"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
